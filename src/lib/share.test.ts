import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const html2canvas = vi.hoisted(() => vi.fn());

vi.mock('html2canvas', () => ({ default: html2canvas }));

import {
  buildStoryFilename,
  canShareFiles,
  captureStoryCard,
  copyShareUrl,
  createPublicShareUrl,
  shareWithSystem,
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
      backgroundColor: null,
      width: 1080,
      height: 1920,
      scale: 1,
      useCORS: true,
    });
    expect(file).toMatchObject({ name: 'code-hunter-octocat-code-hunter.png', type: 'image/png' });
  });

  it('Given a card inside a scaled preview, When capturing it, Then ancestor transforms are suspended and restored', async () => {
    const scaledParent = {
      parentElement: null,
      style: { transform: '' },
    } as unknown as HTMLElement;
    const card = {
      parentElement: scaledParent,
      querySelectorAll: () => [],
    } as unknown as HTMLElement;
    vi.stubGlobal('getComputedStyle', vi.fn((element: HTMLElement) => ({
      transform: element === scaledParent ? 'matrix(0.267, 0, 0, 0.267, 0, 0)' : 'none',
    })));
    html2canvas.mockImplementation(async () => {
      expect(scaledParent.style.transform).toBe('none');
      return { toBlob: (callback: BlobCallback) => callback(new Blob(['story'], { type: 'image/png' })) };
    });

    await captureStoryCard(card, 'story.png');

    expect(scaledParent.style.transform).toBe('');
  });

  it('Given a card inside an entering modal, When capturing immediately, Then it waits for ancestor animation settlement', async () => {
    let settleAnimation: (() => void) | undefined;
    const finished = new Promise<void>((resolve) => { settleAnimation = resolve; });
    const getAnimations = vi.fn(() => [{ finished }]);
    const animatedParent = {
      getAnimations,
      parentElement: null,
      style: { transform: '' },
    } as unknown as HTMLElement;
    const card = {
      parentElement: animatedParent,
      querySelectorAll: () => [],
    } as unknown as HTMLElement;
    vi.stubGlobal('getComputedStyle', vi.fn(() => ({ transform: 'none' })));
    html2canvas.mockResolvedValue({
      toBlob: (callback: BlobCallback) => callback(new Blob(['story'], { type: 'image/png' })),
    });

    const capture = captureStoryCard(card, 'story.png');
    await vi.waitFor(() => expect(getAnimations).toHaveBeenCalledOnce());
    expect(html2canvas).not.toHaveBeenCalled();
    settleAnimation?.();
    await capture;

    expect(html2canvas).toHaveBeenCalledOnce();
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

  it('Given file-capable Web Share, When sharing, Then the PNG and public URL are sent together', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const file = new File(['story'], 'story.png', { type: 'image/png' });
    vi.stubGlobal('navigator', { share, canShare: vi.fn(() => true) });

    await expect(shareWithSystem({
      file,
      githubId: 'octocat',
      jobClass: 'Repository Warden',
      factBomb: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    })).resolves.toBe('file');
    expect(share).toHaveBeenCalledWith({
      title: 'Code Hunter | Repository Warden',
      text: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
      files: [file],
    });
  });

  it('Given Web Share without file support, When sharing, Then it falls back to text and URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const file = new File(['story'], 'story.png', { type: 'image/png' });
    vi.stubGlobal('navigator', { share, canShare: vi.fn(() => false) });

    await expect(shareWithSystem({
      file,
      githubId: 'octocat',
      jobClass: 'Repository Warden',
      factBomb: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    })).resolves.toBe('text');
    expect(share).toHaveBeenCalledWith({
      title: 'Code Hunter | Repository Warden',
      text: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    });
  });

  it('Given a prepared image is unavailable, When sharing, Then it immediately uses text and URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: vi.fn() });

    await expect(shareWithSystem({
      githubId: 'octocat',
      jobClass: 'Repository Warden',
      factBomb: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    })).resolves.toBe('text');
    expect(share).toHaveBeenCalledWith({
      title: 'Code Hunter | Repository Warden',
      text: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    });
  });

  it('Given no Web Share API, When sharing, Then it reports unsupported for caller fallback', async () => {
    const file = new File(['story'], 'story.png', { type: 'image/png' });
    vi.stubGlobal('navigator', {});

    await expect(shareWithSystem({
      file,
      githubId: 'octocat',
      jobClass: 'Repository Warden',
      factBomb: 'Evidence only.',
      url: 'https://code-hunter.test/?github=octocat',
    })).resolves.toBe('unsupported');
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
