import html2canvas from 'html2canvas';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export type ShareMethod = 'file' | 'text' | 'unsupported';

export interface SystemSharePayload {
  readonly file?: File;
  readonly githubId: string;
  readonly jobClass: string;
  readonly factBomb: string;
  readonly url: string;
}

const activeCaptures = new WeakMap<HTMLElement, Promise<File>>();

function filenamePart(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'unknown';
}

export function buildStoryFilename(githubId: string, jobClass: string): string {
  return `code-hunter-${filenamePart(githubId)}-${filenamePart(jobClass)}.png`;
}

export function createPublicShareUrl(githubId: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.href);
  const url = new URL(base);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  url.searchParams.set('github', githubId.trim());
  return url.toString();
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(images.map(async (image) => {
    if (image.complete) return;
    if ('decode' in image) {
      try {
        await image.decode();
        return;
      } catch {}
    }

    await new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
  }));
}

async function waitForAncestorAnimations(element: HTMLElement): Promise<void> {
  const animations: Animation[] = [];
  let ancestor = element.parentElement;
  while (ancestor) {
    if (typeof ancestor.getAnimations === 'function') {
      animations.push(...ancestor.getAnimations());
    }
    ancestor = ancestor.parentElement;
  }
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
}

export async function waitForCaptureReadiness(element: HTMLElement): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }
  await waitForAncestorAnimations(element);
  await waitForImages(element);
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('공유 이미지를 만들지 못했습니다.'));
    }, 'image/png');
  });
}

function suspendAncestorTransforms(element: HTMLElement): () => void {
  if (typeof getComputedStyle === 'undefined') return () => {};

  const transformedAncestors: Array<{ element: HTMLElement; inlineTransform: string }> = [];
  let ancestor = element.parentElement;
  while (ancestor) {
    if (getComputedStyle(ancestor).transform !== 'none') {
      transformedAncestors.push({ element: ancestor, inlineTransform: ancestor.style.transform });
      ancestor.style.transform = 'none';
    }
    ancestor = ancestor.parentElement;
  }

  return () => {
    transformedAncestors.forEach(({ element: transformedElement, inlineTransform }) => {
      transformedElement.style.transform = inlineTransform;
    });
  };
}

export function captureStoryCard(element: HTMLElement, filename: string): Promise<File> {
  const currentCapture = activeCaptures.get(element);
  if (currentCapture) return currentCapture;

  const capture = (async () => {
    await waitForCaptureReadiness(element);
    const restoreTransforms = suspendAncestorTransforms(element);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        scale: 1,
        useCORS: true,
      });
      const blob = await toPngBlob(canvas);
      return new File([blob], filename, { type: 'image/png' });
    } finally {
      restoreTransforms();
    }
  })();

  activeCaptures.set(element, capture);
  void capture.then(
    () => activeCaptures.delete(element),
    () => activeCaptures.delete(element),
  );
  return capture;
}

export function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }

  return navigator.canShare({ files: [file] });
}

export async function shareWithSystem(payload: SystemSharePayload): Promise<ShareMethod> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return 'unsupported';

  const title = `Code Hunter | ${payload.jobClass}`;
  if (payload.file && canShareFiles(payload.file)) {
    await navigator.share({ title, text: payload.factBomb, url: payload.url, files: [payload.file] });
    return 'file';
  }

  await navigator.share({ title, text: payload.factBomb, url: payload.url });
  return 'text';
}

export async function copyShareUrl(url: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('이 브라우저에서는 링크 복사를 지원하지 않습니다.');
  }
  await navigator.clipboard.writeText(url);
}

export function saveStoryImage(file: File): void {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
