import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { ResponseSchema } from '@google/generative-ai';
import { z } from 'zod';

import { EQUIPMENT_SLOTS } from '../types/analysis';
import type { AnalysisResult, Equipment, GithubStats, Narrative, SourceEvidence } from '../types/analysis';

const NarrativeResponseSchema = z.object({ factBomb: z.string().min(1).max(280) });
const NARRATIVE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    factBomb: { type: SchemaType.STRING },
  },
  required: ['factBomb'],
};

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function personaSeed(stats: GithubStats): string {
  return JSON.stringify({
    githubId: stats.githubId.toLowerCase(),
    collectionState: stats.collectionState,
    repositoryCount: stats.repoCount.value,
    languages: stats.languageUsage.map((usage) => usage.language),
  });
}

function hashIndex(seed: string, length: number): number {
  return Number.parseInt(stableHash(seed), 16) % length;
}

function rarityForLevel(level: number): string {
  if (level >= 70) return 'Legendary';
  if (level >= 40) return 'Epic';
  if (level >= 15) return 'Rare';
  return 'Normal';
}

function numericValue(value: number | null): number {
  return value ?? 0;
}

function localEquipment(stats: GithubStats, level: number): readonly Equipment[] {
  const rarity = rarityForLevel(level);
  const seed = personaSeed(stats);
  const namePrefix = `${stats.githubId}-${stableHash(seed).slice(0, 6)}`;
  const primaryLanguage = stats.languageUsage[0];
  const sealedEvidence: SourceEvidence = stats.evidence[0] ?? stats.repoCount.evidence;
  const observedEquipment: Partial<Record<(typeof EQUIPMENT_SLOTS)[number], Equipment>> = {};

  if (primaryLanguage !== undefined) {
    observedEquipment.weapon = {
      slot: 'weapon',
      name: `${namePrefix} ${primaryLanguage.language} blade`,
      rarity,
      effect: `Channels ${primaryLanguage.language} repository evidence.`,
      sourceKey: primaryLanguage.evidence.sourceKey,
      evidenceStatus: 'observed',
      evidence: [primaryLanguage.evidence],
    };
  }
  if (numericValue(stats.repoCount.value) > 0) {
    observedEquipment.helm = {
      slot: 'helm',
      name: `${namePrefix} repository helm`,
      rarity,
      effect: 'Guards public repository evidence.',
      sourceKey: stats.repoCount.evidence.sourceKey,
      evidenceStatus: 'observed',
      evidence: [stats.repoCount.evidence],
    };
  }
  if (numericValue(stats.followers.value) > 0) {
    observedEquipment.relic = {
      slot: 'relic',
      name: `${namePrefix} follower relic`,
      rarity,
      effect: 'Resonates with public follower evidence.',
      sourceKey: stats.followers.evidence.sourceKey,
      evidenceStatus: 'observed',
      evidence: [stats.followers.evidence],
    };
  }

  return EQUIPMENT_SLOTS.map((slot) => observedEquipment[slot] ?? {
    slot,
    name: `${namePrefix} sealed ${slot}`,
    rarity: 'Sealed',
    effect: 'Sealed pending public evidence.',
    sourceKey: sealedEvidence.sourceKey,
    evidenceStatus: 'sealed',
    evidence: [sealedEvidence],
  });
}

function localNarrative(stats: GithubStats): Narrative {
  const hasMetrics = stats.collectionState === 'complete';
  const repositoryCount = numericValue(stats.repoCount.value);
  const followerCount = numericValue(stats.followers.value);
  const primaryLanguage = stats.languageUsage[0];
  let text: string;

  if (!hasMetrics) {
    text = `${stats.githubId}님은 공개 데이터가 부족해 오늘의 팩폭까지 봉인되었습니다.`;
  } else if (primaryLanguage !== undefined) {
    text = `${stats.githubId}님은 공개 저장소 ${repositoryCount}개를 펼쳐 놓고 ${primaryLanguage.language} 신호 ${primaryLanguage.repositoryCount}개로 주력 무기까지 들켰습니다.`;
  } else if (repositoryCount > 0) {
    text = `${stats.githubId}님은 공개 저장소 ${repositoryCount}개를 벌여 놓고도 주력 언어는 끝까지 봉인한 수상한 탐험가입니다.`;
  } else if (followerCount > 0) {
    text = `${stats.githubId}님은 공개 팔로워 ${followerCount}명이 지켜보는데 저장소 무기고는 아직 비어 있습니다.`;
  } else {
    text = `${stats.githubId}님은 공개 저장소와 팔로워가 모두 0이라 오늘의 최강 스킬이 완벽한 은신입니다.`;
  }

  return {
    text,
    evidenceStatus: hasMetrics ? 'observed' : 'insufficient',
    evidence: stats.evidence,
  };
}

async function verifyNarrativeWithGemini(fallback: Narrative): Promise<Narrative> {
  if (fallback.evidenceStatus !== 'observed') return fallback;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey === undefined || apiKey.length === 0) return fallback;

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: NARRATIVE_SCHEMA,
      },
    });
    const response = await model.generateContent([
      'Return the exact evidence-bound Korean narrative below unchanged as the factBomb JSON field. Do not add, remove, translate, or rewrite any character.',
      fallback.text,
    ].join('\n'));
    const raw: unknown = JSON.parse(await response.response.text());
    const parsed = NarrativeResponseSchema.safeParse(raw);
    return parsed.success && parsed.data.factBomb === fallback.text
      ? { ...fallback, text: parsed.data.factBomb }
      : fallback;
  } catch {
    return fallback;
  }
}

export async function generateFactBomb(stats: GithubStats): Promise<AnalysisResult> {
  const repoCount = numericValue(stats.repoCount.value);
  const followers = numericValue(stats.followers.value);
  const level = Math.min(99, 1 + Math.floor(repoCount / 2) + Math.floor(followers / 10) + stats.languageUsage.length);
  const equipment = localEquipment(stats, level);
  const fallbackNarrative = localNarrative(stats);
  const narrative = await verifyNarrativeWithGemini(fallbackNarrative);
  const classes = ['Sourcebound Scout', 'Repository Warden', 'Evidence Cartographer'] as const;
  const seed = personaSeed(stats);

  return {
    ...stats,
    commitCount: stats.estimatedCommitCount.value ?? 0,
    mainLanguages: stats.languageUsage.map((usage) => usage.language),
    level,
    jobClass: classes[hashIndex(seed, classes.length)] ?? classes[0],
    hp: 100 + level * 50,
    attack: 10 + level * 7,
    defense: 8 + level * 5,
    evasion: 3 + Math.floor(level / 2),
    items: equipment,
    equipment,
    narrative,
    aiFactBomb: narrative.text,
  };
}
