'use client';

import { useEffect, useRef } from 'react';

import type { Equipment, EvidenceStatus, SourceEvidence } from '../types/analysis';
import styles from './ResultDashboard.module.css';

export type EvidenceItem = Pick<Equipment, 'name' | 'effect' | 'sourceKey' | 'evidenceStatus' | 'evidence'>;

interface EquipmentEvidenceDialogProps {
  readonly item: EvidenceItem | null;
  readonly onClose: () => void;
}

function statusLabel(status: EvidenceStatus): string {
  if (status === 'observed') return '공개 근거 확인됨';
  if (status === 'unavailable') return '공개 데이터 미확인';
  if (status === 'insufficient') return '공개 데이터 부족';
  return '봉인됨 — 공개 데이터 부족';
}

export default function EquipmentEvidenceDialog({ item, onClose }: EquipmentEvidenceDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;
  const sources: readonly SourceEvidence[] = item.evidence.length > 0 ? item.evidence : [{ sourceKey: item.sourceKey, sourceUrl: '', status: item.evidenceStatus, detail: '추가 공개 근거가 제공되지 않았습니다.' }];

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-dialog-title"
        aria-describedby="equipment-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogHeader}>
          <div>
            <p className="pixel-kicker">EQUIPMENT EVIDENCE</p>
            <h2 id="equipment-dialog-title">{item.name}</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>닫기</button>
        </div>
        <p id="equipment-dialog-description" className={styles.dialogEffect}>{item.effect}</p>
        <dl className={styles.dialogFacts}>
          <div><dt>대표 sourceKey</dt><dd>{item.sourceKey}</dd></div>
          <div><dt>감정 상태</dt><dd>{statusLabel(item.evidenceStatus)}</dd></div>
        </dl>
        <h3>근거 상세</h3>
        <ul className={styles.sourceList}>
          {sources.map((source, index) => (
            <li key={`${source.sourceKey}-${index}`}>
              <strong>{source.sourceKey}</strong>
              <span>{source.detail}</span>
              <span className={styles.sourceStatus}>{statusLabel(source.status)}</span>
              {source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer">원본 공개 출처 열기</a> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
