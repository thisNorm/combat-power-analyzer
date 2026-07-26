import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { ResponseSchema } from '@google/generative-ai';
import { z } from 'zod';

import { EQUIPMENT_SLOTS } from '../types/analysis';
import type { AnalysisResult, Equipment, GithubStats, Narrative } from '../types/analysis';

const NarrativeResponseSchema = z.object({ factBomb: z.string().min(1).max(280) });
const NARRATIVE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    factBomb: { type: SchemaType.STRING },
  },
  required: ['factBomb'],
};

function hashIndex(fingerprint: string, length: number): number {
  return Number.parseInt(fingerprint.slice(0, 8), 16) % length;
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
  const namePrefix = `${stats.githubId}-${stats.fingerprint.slice(0, 6)}`;
  const primaryLanguage = stats.languageUsage[0];
  const observedEquipment: Partial<Record<(typeof EQUIPMENT_SLOTS)[number], Equipment>> = {};

  if (primaryLanguage !== undefined) {
    observedEquipment.weapon = {
      slot: 'weapon',
      name: `${namePrefix} ${primaryLanguage.language} blade`,
      rarity,
      evidenceStatus: 'observed',
      evidence: [primaryLanguage.evidence],
    };
  }
  if (numericValue(stats.repoCount.value) > 0) {
    observedEquipment.helm = {
      slot: 'helm',
      name: `${namePrefix} repository helm`,
      rarity,
      evidenceStatus: 'observed',
      evidence: [stats.repoCount.evidence],
    };
  }
  if (numericValue(stats.followers.value) > 0) {
    observedEquipment.relic = {
      slot: 'relic',
      name: `${namePrefix} follower relic`,
      rarity,
      evidenceStatus: 'observed',
      evidence: [stats.followers.evidence],
    };
  }

  return EQUIPMENT_SLOTS.map((slot) => observedEquipment[slot] ?? {
    slot,
    name: `${namePrefix} sealed ${slot}`,
    rarity: 'Sealed',
    evidenceStatus: 'sealed',
    evidence: [],
  });
}

function localNarrative(stats: GithubStats): Narrative {
  const templates = [
    'Public evidence is assembled; unexplained territory remains sealed.',
    'This profile speaks through public signals, not invented streaks.',
    'Every displayed trait is traceable to a public source or marked unavailable.',
  ] as const;
  const hasMetrics = stats.collectionState === 'complete';
  const text = hasMetrics
    ? `${stats.githubId}: ${templates[hashIndex(stats.fingerprint, templates.length)]}`
    : `${stats.githubId}: public GitHub evidence is insufficient, so no unsupported claim was generated.`;
  return {
    text,
    evidenceStatus: hasMetrics ? 'observed' : 'insufficient',
    evidence: stats.evidence,
  };
}

async function translateNarrative(stats: GithubStats, fallback: Narrative): Promise<Narrative> {
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
      'Translate this evidence-bound local narrative into concise Korean. Do not introduce numbers, facts, equipment, stats, or model names.',
      fallback.text,
    ].join('\n'));
    const raw: unknown = JSON.parse(await response.response.text());
    const parsed = NarrativeResponseSchema.safeParse(raw);
    return parsed.success ? { ...fallback, text: parsed.data.factBomb } : fallback;
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
  const narrative = await translateNarrative(stats, fallbackNarrative);
  const classes = ['Sourcebound Scout', 'Repository Warden', 'Evidence Cartographer'] as const;

  return {
    ...stats,
    commitCount: stats.estimatedCommitCount.value ?? 0,
    mainLanguages: stats.languageUsage.map((usage) => usage.language),
    level,
    jobClass: classes[hashIndex(stats.fingerprint, classes.length)] ?? classes[0],
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
