import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const html2canvas = vi.hoisted(() => vi.fn());

vi.mock('html2canvas', () => ({ default: html2canvas }));

import {
  buildStoryFilename,
  canShareFiles,
  captureStoryCard,
  copyShareUrl,
  createPublicShareUrl,
} from './share';

describe('story sharing helpers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    html2canvas.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Given untrusted identity strings, When building an image filename, Then it is a safe deterministic PNG name', () => {
    expect(buildStoryFilename('  Octo Cat/../ ', 'Code Hunter!')).toBe('code-hunter-octo-cat-code-hunter.png');
  });

  it('Given a capture-ready card, When capturing it, Then html2canvas receives the exact story dimensions and returns a PNG File', async () => {
    const blob = new Blob(['story'], { type: 'image/png' });
    html2canvas.mockResolvedValue({
      toBlob: (callback: BlobCallback) => callback(blob),
    });
    const card = { querySelectorAll: () => [] } as unknown as HTMLElement;

    const file = await captureStoryCard(card, 'code-hunter-octocat-code-hunter.png');

    expect(html2canvas).toHaveBeenCalledWith(card, {
      backgroundColor: '#07090d',
      width: 1080,
      height: 1920,
      scale: 1,
      useCORS: true,
    });
    expect(file).toMatchObject({ name: 'code-hunter-octocat-code-hunter.png', type: 'image/png' });
  });

  it('Given a browser that can share the exact file payload, When checking capability, Then file sharing is supported', () => {
    const file = new File(['story'], 'story.png', { type: 'image/png' });
    const canShare = vi.fn(() => true);
    vi.stubGlobal('navigator', { share: vi.fn(), canShare });

    expect(canShareFiles(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
  });

  it('Given a browser without exact file support, When checking capability, Then file sharing is unsupported', () => {
    const file = new File(['story'], 'story.png', { type: 'image/png' });
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: vi.fn(() => false) });

    expect(canShareFiles(file)).toBe(false);
  });

  it('Given a clipboard that accepts a public URL, When copying, Then the URL is written', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const url = createPublicShareUrl('octocat', 'https://code-hunter.test/results?old=true');

    await expect(copyShareUrl(url)).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('https://code-hunter.test/?github=octocat');
  });

  it('Given a clipboard write failure, When copying, Then it explicitly rejects instead of pretending success', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });

    await expect(copyShareUrl('https://code-hunter.test/?github=octocat')).rejects.toThrow('denied');
  });

  it('Given simultaneous requests for the same modal card, When generating, Then capture runs only once', async () => {
    let resolveCanvas: ((canvas: { toBlob: (callback: BlobCallback) => void }) => void) | undefined;
    html2canvas.mockImplementation(() => new Promise((resolve) => { resolveCanvas = resolve; }));
    const card = { querySelectorAll: () => [] } as unknown as HTMLElement;

    const first = captureStoryCard(card, 'code-hunter-octocat-code-hunter.png');
    const second = captureStoryCard(card, 'code-hunter-octocat-code-hunter.png');
    await vi.waitFor(() => expect(html2canvas).toHaveBeenCalledTimes(1));
    resolveCanvas?.({ toBlob: (callback) => callback(new Blob(['story'], { type: 'image/png' })) });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(html2canvas).toHaveBeenCalledTimes(1);
  });
});
