'use client';

import { forwardRef } from 'react';

import type { AnalysisResult, Equipment, SourceEvidence } from '../types/analysis';

import styles from './StoryShareCard.module.css';

export interface StoryShareCardProps {
  readonly result: AnalysisResult;
  readonly ariaHidden?: boolean;
}

function firstEvidence(result: AnalysisResult): SourceEvidence | undefined {
  return result.narrative.evidence[0] ?? result.evidence[0] ?? result.equipment[0]?.evidence[0];
}

function observedItems(result: AnalysisResult): readonly Equipment[] {
  const equipment = result.equipment.length > 0 ? result.equipment : result.items;
  return equipment.filter((item) => item.evidenceStatus === 'observed').slice(0, 2);
}

function initials(githubId: string): string {
  return githubId.trim().slice(0, 2).toUpperCase() || 'CH';
}

export const StoryShareCard = forwardRef<HTMLDivElement, StoryShareCardProps>(function StoryShareCard(
  { result, ariaHidden = false },
  ref,
) {
  const items = observedItems(result);
  const evidence = firstEvidence(result);
  const rarity = items[0]?.rarity ?? 'Observed';

  return (
    <article
      ref={ref}
      className={styles.card}
      aria-hidden={ariaHidden || undefined}
      aria-label={`${result.githubId}의 Code Hunter 공유 카드`}
    >
      <div className={styles.topSafeArea} />
      <header className={styles.identity}>
        <p className={styles.level}>LEVEL {result.level}</p>
        <p className={styles.handle}>@{result.githubId}</p>
        <h2 className={styles.jobClass}>{result.jobClass}</h2>
      </header>

      <section className={styles.characterStage} aria-label={`${result.githubId} 캐릭터`}>
        <div className={styles.avatar} aria-hidden="true">{initials(result.githubId)}</div>
        <p className={styles.characterName}>{result.githubId}</p>
        <p className={styles.grade}>관측 등급 · {rarity}</p>
      </section>

      <section className={styles.loadout} aria-label="관측 장비">
        <p className={styles.sectionLabel}>OBSERVED LOADOUT</p>
        {items.length > 0 ? items.map((item) => (
          <div className={styles.item} key={`${item.slot}-${item.name}`}>
            <span className={styles.slot}>{item.slot}</span>
            <strong>{item.name}</strong>
            <span>{item.rarity}</span>
          </div>
        )) : <p className={styles.emptyItem}>공개 데이터에서 관측된 장비가 없습니다.</p>}
      </section>

      <section className={styles.factPanel} aria-label="대표 팩폭">
        <p className={styles.sectionLabel}>FACT BOMB</p>
        <p className={styles.fact}>{result.aiFactBomb || result.narrative.text}</p>
        {evidence && <p className={styles.evidence}>근거 · {evidence.detail}</p>}
      </section>

      <footer className={styles.footer}>
        <p className={styles.brand}>CODE HUNTER</p>
        <p className={styles.shortUrl}>code-hunter.kr</p>
        <p className={styles.cta}>내 개발 전투력도 확인하기</p>
      </footer>
      <div className={styles.bottomSafeArea} />
    </article>
  );
});

StoryShareCard.displayName = 'StoryShareCard';
