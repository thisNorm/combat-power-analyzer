import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const geminiSdk = vi.hoisted(() => ({
  getGenerativeModel: vi.fn(),
}));

vi.mock('@google/generative-ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/generative-ai')>();
  return {
    ...actual,
    GoogleGenerativeAI: class {
      getGenerativeModel = geminiSdk.getGenerativeModel;
    },
  };
});

function stubPublicGithubResponses(): void {
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/repos?')) {
      return new Response(
        JSON.stringify([
          { language: 'TypeScript' },
          { language: 'TypeScript' },
          { language: 'JavaScript' },
        ]),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({ public_repos: 3, followers: 7, following: 5, public_gists: 2 }),
      { status: 200 },
    );
  }));
}

describe('analysis result contract', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    geminiSdk.getGenerativeModel.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('Given public repositories, When GitHub data is collected, Then language tuples are serialized as usage records', async () => {
    stubPublicGithubResponses();
    const { fetchGithubStats } = await import('./github');

    const stats = await fetchGithubStats('octocat');

    expect(stats).toMatchObject({
      languageUsage: [
        { language: 'TypeScript', repositoryCount: 2, ratio: 66.67 },
        { language: 'JavaScript', repositoryCount: 1, ratio: 33.33 },
      ],
    });
  });

  it('Given no Gemini key, When a narrative is requested, Then the SDK is not called', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    stubPublicGithubResponses();
    const { generateFactBomb } = await import('./ai');
    const { fetchGithubStats } = await import('./github');
    const stats = await fetchGithubStats('octocat');

    await generateFactBomb(stats);

    expect(geminiSdk.getGenerativeModel).not.toHaveBeenCalled();
  });

  it('Given insufficient source evidence, When equipment is assembled, Then every sealed slot and narrative names its evidence state', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));
    const { generateFactBomb } = await import('./ai');
    const { fetchGithubStats } = await import('./github');
    const stats = await fetchGithubStats('octocat');

    const result = await generateFactBomb(stats);

    expect(result).toMatchObject({
      equipment: expect.arrayContaining([
        expect.objectContaining({ slot: 'weapon', evidenceStatus: 'sealed' }),
      ]),
      narrative: expect.objectContaining({ evidenceStatus: 'insufficient' }),
    });
    expect(result.equipment).toHaveLength(6);
  });
});
