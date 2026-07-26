'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { AnalysisResult } from '../types/analysis';
import {
  buildStoryFilename,
  canShareFiles,
  captureStoryCard,
  copyShareUrl,
  createPublicShareUrl,
  saveStoryImage,
  shareWithSystem,
} from '../lib/share';
import { StoryShareCard } from './StoryShareCard';

import styles from './ShareModal.module.css';

type ShareState = 'default' | 'generating' | 'success' | 'unsupported' | 'failure';

export interface ShareModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly result: AnalysisResult;
}

function Icon({ name }: { readonly name: 'close' | 'story' | 'apps' | 'copy' | 'save' }) {
  const paths = {
    close: <path d="M6 6l12 12M18 6 6 18" />,
    story: <path d="M12 3 5 9v11h14V9l-7-6Zm-3 12 6-6m-4 7 4-4" />,
    apps: <path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" />,
    copy: <path d="M9 8h10v11H9V8Zm-4 7H4V4h11v1" />,
    save: <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function ShareModal({ open, onClose, result }: ShareModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const fileRef = useRef<File | null>(null);
  const generationRef = useRef<Promise<File> | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [state, setState] = useState<ShareState>('default');
  const [message, setMessage] = useState('스토리 이미지를 만들어 원하는 곳에 공유하세요.');
  const publicUrl = createPublicShareUrl(result.githubId);
  const isGenerating = state === 'generating';

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const generateImage = useCallback(async (): Promise<File> => {
    if (fileRef.current) return fileRef.current;
    if (generationRef.current) return generationRef.current;
    if (!cardRef.current) throw new Error('공유 카드를 준비하지 못했습니다.');

    setState('generating');
    setMessage('스토리 이미지를 준비하고 있습니다.');
    const generation = captureStoryCard(cardRef.current, buildStoryFilename(result.githubId, result.jobClass));
    generationRef.current = generation;
    try {
      const file = await generation;
      fileRef.current = file;
      setState('success');
      setMessage('스토리 이미지가 준비되었습니다.');
      return file;
    } catch (error) {
      setState('failure');
      setMessage(error instanceof Error ? error.message : '스토리 이미지를 만들지 못했습니다.');
      throw error;
    } finally {
      generationRef.current = null;
    }
  }, [result.githubId, result.jobClass]);

  const handleInstagram = async () => {
    try {
      const file = await generateImage();
      if (!canShareFiles(file)) {
        saveStoryImage(file);
        setState('unsupported');
        setMessage('이 브라우저는 Instagram으로 파일을 바로 공유할 수 없습니다. 이미지를 저장한 뒤 Instagram 스토리에 올려주세요.');
        return;
      }
      await shareWithSystem({ file, githubId: result.githubId, jobClass: result.jobClass, factBomb: result.aiFactBomb, url: publicUrl });
      setState('success');
      setMessage('공유 시트에서 Instagram을 선택해 스토리로 올려주세요.');
    } catch (error) {
      setState('failure');
      setMessage(error instanceof Error ? error.message : 'Instagram 공유를 완료하지 못했습니다.');
    }
  };

  const handleOtherApps = async () => {
    try {
      const file = await generateImage();
      const method = await shareWithSystem({ file, githubId: result.githubId, jobClass: result.jobClass, factBomb: result.aiFactBomb, url: publicUrl });
      if (method === 'unsupported') {
        setState('unsupported');
        setMessage('이 브라우저에서는 앱 공유를 지원하지 않습니다. 링크를 복사하거나 이미지를 저장해 주세요.');
        return;
      }
      setState('success');
      setMessage(method === 'file' ? '이미지와 링크를 공유할 앱을 선택해 주세요.' : '링크를 공유할 앱을 선택해 주세요.');
    } catch (error) {
      setState('failure');
      setMessage(error instanceof Error ? error.message : '앱 공유를 완료하지 못했습니다.');
    }
  };

  const handleCopy = async () => {
    try {
      await copyShareUrl(publicUrl);
      setState('success');
      setMessage('공개 GitHub 재분석 링크를 복사했습니다.');
    } catch (error) {
      setState('failure');
      setMessage(error instanceof Error ? error.message : '링크를 복사하지 못했습니다.');
    }
  };

  const handleSave = async () => {
    try {
      saveStoryImage(await generateImage());
      setState('success');
      setMessage('스토리 이미지를 저장했습니다.');
    } catch (error) {
      setState('failure');
      setMessage(error instanceof Error ? error.message : '이미지를 저장하지 못했습니다.');
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className={styles.header}>
          <div>
            <p className="pixel-kicker">Story share</p>
            <h2 id={titleId}>내 전투력 공유</h2>
          </div>
          <button ref={closeButtonRef} className={styles.closeButton} type="button" onClick={onClose} aria-label="공유 창 닫기"><Icon name="close" /></button>
        </header>

        <div className={styles.body}>
          <p id={descriptionId} className={styles.description}>스토리용 9:16 카드를 만들고, 링크 또는 이미지로 공유할 수 있습니다.</p>
          <div className={styles.preview} aria-label="스토리 카드 미리보기">
            <div className={styles.previewScale}><StoryShareCard ref={cardRef} result={result} ariaHidden /></div>
          </div>

          <div className={styles.actions} aria-label="공유 동작">
            <button type="button" className="pixel-button" onClick={() => void handleInstagram()} disabled={isGenerating}><Icon name="story" />Instagram Story</button>
            <button type="button" className={styles.secondaryAction} onClick={() => void handleOtherApps()} disabled={isGenerating}><Icon name="apps" />다른 앱</button>
            <button type="button" className={styles.secondaryAction} onClick={() => void handleCopy()} disabled={isGenerating}><Icon name="copy" />링크 복사</button>
            <button type="button" className={styles.secondaryAction} onClick={() => void handleSave()} disabled={isGenerating}><Icon name="save" />이미지 저장</button>
          </div>
          <p className={styles.status} data-state={state} role={state === 'failure' ? 'alert' : 'status'} aria-live="polite">{message}</p>
        </div>
      </div>
    </div>
  );
}
