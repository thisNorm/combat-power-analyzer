'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { AnalysisResult } from '../types/analysis';
import EquipmentEvidenceDialog, { type EvidenceItem } from './EquipmentEvidenceDialog';
import styles from './ResultDashboard.module.css';

type Evidence = {
  readonly sourceKey: string;
  readonly sourceUrl: string;
  readonly status: string;
  readonly detail: string;
};

type Metric = {
  readonly key: string;
  readonly value: number | null;
  readonly evidence: Evidence;
};

type Equipment = EvidenceItem & {
  readonly slot: string;
  readonly rarity: string;
};

type DashboardStats = Pick<AnalysisResult,
  'githubId' | 'commitCount' | 'level' | 'jobClass' | 'hp' | 'attack' | 'defense' | 'evasion' | 'mainLanguages' | 'aiFactBomb'
> & {
  readonly collectionState: string;
  readonly repoCount: Metric;
  readonly followers: Metric;
  readonly publicMetrics: readonly Metric[];
  readonly languageUsage: readonly { language: string; repositoryCount: number; ratio: number; evidence: Evidence }[];
  readonly estimatedCommitCount: { value: number | null; formula: string; evidence: Evidence };
  readonly evidence: readonly Evidence[];
  readonly items: readonly Equipment[];
  readonly equipment: readonly Equipment[];
  readonly narrative: { text: string; evidenceStatus: string; evidence: readonly Evidence[] };
};

interface ResultDashboardProps {
  readonly stats: DashboardStats;
  readonly onNewAnalysis: () => void;
  readonly onShare?: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  weapon: '무기',
  helm: '투구',
  armor: '갑옷',
  gloves: '장갑',
  boots: '장화',
  relic: '유물',
};

const SLOT_ORDER = ['weapon', 'helm', 'armor', 'gloves', 'boots', 'relic'];

function valueOf(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function rarityLabel(rarity: string): string {
  if (rarity.toLowerCase() === 'legendary') return '전설';
  if (rarity.toLowerCase() === 'epic') return '영웅';
  if (rarity.toLowerCase() === 'rare') return '희귀';
  if (rarity.toLowerCase() === 'sealed') return '봉인';
  return '일반';
}

function equipmentFor(stats: DashboardStats): Equipment[] {
  const listed = stats.equipment.length > 0 ? stats.equipment : stats.items;
  const bySlot = new Map(listed.map((item) => [item.slot, item]));
  const fallbackEvidence = stats.evidence[0] ?? stats.repoCount.evidence;

  return SLOT_ORDER.map((slot) => bySlot.get(slot) ?? {
    slot,
    name: `${SLOT_LABELS[slot]} 봉인`,
    rarity: 'Sealed',
    effect: '공개 데이터가 부족하여 효과를 판정하지 않았습니다.',
    sourceKey: fallbackEvidence.sourceKey,
    evidenceStatus: 'sealed',
    evidence: [fallbackEvidence],
  });
}

function observedEvidence(stats: DashboardStats): Evidence[] {
  const evidence = [
    stats.repoCount.evidence,
    stats.followers.evidence,
    ...stats.languageUsage.map((usage) => usage.evidence),
    ...stats.publicMetrics.map((metric) => metric.evidence),
    ...stats.narrative.evidence,
    ...stats.evidence,
  ];
  const seen = new Set<string>();
  return evidence.filter((entry) => {
    const key = `${entry.sourceKey}:${entry.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

function strengthLine(stats: DashboardStats): string {
  if (stats.collectionState !== 'complete') {
    return '현재 공개 지표가 부족해 강점은 아직 봉인했습니다.';
  }

  const repositories = valueOf(stats.repoCount.value);
  const followers = valueOf(stats.followers.value);
  const languageCount = stats.languageUsage.length;
  if (repositories > 0 && languageCount > 0) {
    return `공개 저장소 ${compactNumber(repositories)}개와 ${languageCount}개 언어 신호가 확인되어, 꾸준히 흔적을 남기는 탐험가입니다.`;
  }
  if (followers > 0) return `공개 팔로워 ${compactNumber(followers)}명이 확인되어, 당신의 공개 작업이 이미 닿고 있습니다.`;
  return '공개 프로필을 기반으로 확인 가능한 지표만 차분히 기록했습니다.';
}

export default function ResultDashboard({ stats, onNewAnalysis, onShare }: ResultDashboardProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const equipment = useMemo(() => equipmentFor(stats), [stats]);
  const evidenceLines = useMemo(() => observedEvidence(stats), [stats]);
  const initials = stats.githubId.slice(0, 2).toUpperCase() || 'GH';
  const combatPower = stats.hp + stats.attack + stats.defense + stats.evasion;
  const skillAttack = Math.floor(stats.attack * 1.5);
  const critical = Math.floor(stats.attack * 0.3);
  const weapon = equipment.find((item) => item.slot === 'weapon');
  const armor = equipment.find((item) => item.slot === 'armor');
  const subtitle = stats.narrative.text || stats.aiFactBomb;

  const statRows = [
    { name: '생명력', value: stats.hp, basis: `레벨 ${stats.level}에서 산출된 HP입니다.` },
    { name: '일반 공격', value: stats.attack, basis: `레벨 ${stats.level}에서 산출된 공격력입니다.` },
    { name: '방어력', value: stats.defense, basis: `레벨 ${stats.level}에서 산출된 방어력입니다.` },
    { name: '스킬 공격', value: skillAttack, basis: `일반 공격 ${compactNumber(stats.attack)} × 1.5를 내림했습니다.` },
    { name: '회피', value: stats.evasion, basis: `레벨 ${stats.level}에서 산출된 회피입니다.` },
    { name: '극대화', value: critical, basis: `일반 공격 ${compactNumber(stats.attack)} × 0.3을 내림했습니다.` },
  ];

  return (
    <section className={styles.dashboard} aria-labelledby="result-title">
      <header className={styles.header}>
        <div className={styles.brand}>CODE HUNTER · PUBLIC EVIDENCE</div>
        <div className={styles.headerActions}>
          {onShare ? <button type="button" className={styles.shareButton} onClick={onShare}>공유하기</button> : null}
          <button type="button" className="pixel-button" onClick={onNewAnalysis}>새로 분석하기</button>
        </div>
      </header>

      <div className={styles.identity}>
        <p className={styles.level}>LV. {stats.level}</p>
        <h1 id="result-title" className={styles.githubId}>@{stats.githubId}</h1>
        <p className={styles.jobClass}>{stats.jobClass}</p>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.rarityMessage}><strong>{rarityLabel(weapon?.rarity ?? 'Sealed')} 장비 감정</strong> · 비교 표본이 없어 전체 개발자 비율은 산정하지 않음</p>
      </div>

      <div className={styles.overview}>
        <section className={`${styles.stage} pixel-panel`} aria-labelledby="character-stage-title">
          <h2 id="character-stage-title" className="screen-reader-text">캐릭터 무대</h2>
          <div className={styles.stageGlow} aria-hidden="true" />
          {weapon ? <span className={`${styles.stageBadge} ${styles.weaponBadge}`}>{SLOT_LABELS.weapon}<b>{rarityLabel(weapon.rarity)}</b></span> : null}
          <div className={styles.avatarFrame}>
            {avatarFailed ? (
              <span className={styles.initials} aria-label={`${stats.githubId}의 이니셜`}>{initials}</span>
            ) : (
              <Image
                className={styles.avatar}
                src={`https://github.com/${encodeURIComponent(stats.githubId)}.png?size=256`}
                alt={`${stats.githubId} GitHub 아바타`}
                width={160}
                height={160}
                unoptimized
                onError={() => setAvatarFailed(true)}
              />
            )}
          </div>
          {armor ? <span className={`${styles.stageBadge} ${styles.armorBadge}`}>{SLOT_LABELS.armor}<b>{rarityLabel(armor.rarity)}</b></span> : null}
          <p className={styles.stageCaption}>공개 GitHub 신호로 장비를 감정한 주인공</p>
        </section>

        <section className={`${styles.power} pixel-panel`} aria-labelledby="power-title">
          <p className="pixel-kicker">DETERMINISTIC SCORE</p>
          <h2 id="power-title">전투력 <strong>{compactNumber(combatPower)}</strong></h2>
          <p>HP + 공격 + 방어 + 회피의 합계입니다. 관측되지 않은 지표는 더하지 않았습니다.</p>
          <dl className={styles.statGrid}>
            {statRows.map((stat) => (
              <div className={styles.stat} key={stat.name}>
                <dt>{stat.name}</dt>
                <dd>{compactNumber(stat.value)}</dd>
                <button type="button" className={styles.infoButton} aria-label={`${stat.name} 계산 근거`}>
                  <span aria-hidden="true">i</span>
                  <span className={styles.tooltip} role="tooltip">{stat.basis}</span>
                </button>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className={styles.equipmentSection} aria-labelledby="equipment-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="pixel-kicker">EQUIPMENT ARCHIVE</p>
            <h2 id="equipment-title">근거 장비 6칸</h2>
          </div>
          <p>카드를 열어 출처와 감정 상태를 확인하세요.</p>
        </div>
        <div className={styles.equipmentGrid}>
          {equipment.map((item) => {
            const sealed = item.evidenceStatus !== 'observed';
            return (
              <button
                type="button"
                className={`${styles.equipmentCard} ${sealed ? styles.sealed : styles[item.rarity.toLowerCase()] ?? ''}`}
                key={item.slot}
                onClick={() => setSelectedEquipment(item)}
                aria-haspopup="dialog"
                aria-label={`${SLOT_LABELS[item.slot] ?? item.slot}: ${item.name} 근거 열기`}
              >
                <span className={styles.slotLabel}>{SLOT_LABELS[item.slot] ?? item.slot}</span>
                <span className={styles.itemName}>{sealed ? '봉인 슬롯' : item.name}</span>
                <span className={styles.itemEffect}>{sealed ? '공개 데이터 부족' : item.effect}</span>
                <span className={styles.rarity}>{sealed ? '봉인 · 공개 데이터 부족' : rarityLabel(item.rarity)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${styles.factBomb} pixel-panel`} aria-labelledby="fact-bomb-title">
        <p className="pixel-kicker">EVIDENCE-BOUND FACT BOMB</p>
        <h2 id="fact-bomb-title">대표 팩폭</h2>
        <p className={styles.factSentence}>{subtitle}</p>
        <h3>확인한 공개 근거</h3>
        <ul className={styles.evidenceList}>
          {evidenceLines.length > 0 ? evidenceLines.map((entry) => (
            <li key={`${entry.sourceKey}-${entry.detail}`}><strong>{entry.sourceKey}</strong><span>{entry.detail}</span></li>
          )) : <li>공개 근거를 받지 못해 확인 가능한 항목이 없습니다.</li>}
        </ul>
        <p className={styles.strength}>{strengthLine(stats)}</p>
        <p className={styles.limitedNotice}>데이터 제한: 비공개 활동, 개인 저장소, 총 커밋 수는 공개 API에서 확인되지 않으면 표시하지 않습니다.</p>
      </section>

      <EquipmentEvidenceDialog item={selectedEquipment} onClose={() => setSelectedEquipment(null)} />
    </section>
  );
}
