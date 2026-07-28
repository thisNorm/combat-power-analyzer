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

function stubPublicGithubResponses(followers = 7, publicRepositories = 3): void {
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
      JSON.stringify({ public_repos: publicRepositories, followers, following: 5, public_gists: 2 }),
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

  it('Given collected or sealed equipment, When an analysis result is assembled, Then every item exposes a deterministic effect and representative source key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    stubPublicGithubResponses();
    const { generateFactBomb } = await import('./ai');
    const { fetchGithubStats } = await import('./github');
    const stats = await fetchGithubStats('octocat');

    const result = await generateFactBomb(stats);

    for (const item of result.equipment) {
      expect(item).toMatchObject({
        effect: expect.stringMatching(/\S/),
        sourceKey: item.evidence[0]?.sourceKey,
      });
    }
  });

  it('Given complete public evidence, When a narrative is assembled, Then the fact bomb uses observed repository and language values', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    stubPublicGithubResponses();
    const { generateFactBomb } = await import('./ai');
    const { fetchGithubStats } = await import('./github');

    const result = await generateFactBomb(await fetchGithubStats('octocat'));

    expect(result.aiFactBomb).toContain('공개 저장소 3개');
    expect(result.aiFactBomb).toContain('TypeScript 신호 2개');
    expect(result.narrative.evidenceStatus).toBe('observed');
  });

  it('Given more than one repository response page, When languages are summarized, Then partial language evidence is sealed instead of treated as complete', async () => {
    stubPublicGithubResponses(7, 101);
    const { fetchGithubStats } = await import('./github');

    const stats = await fetchGithubStats('octocat');
    const repositoryEvidence = stats.evidence.find(({ sourceKey }) => sourceKey === 'github.repositories');

    expect(stats.languageUsage).toEqual([]);
    expect(repositoryEvidence).toMatchObject({
      status: 'unavailable',
      detail: expect.stringContaining('100-item response boundary'),
    });
  });

  it('Given only a volatile follower increment, When the same profile is reanalyzed, Then its RPG identity remains stable', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const { generateFactBomb } = await import('./ai');
    const { fetchGithubStats } = await import('./github');

    stubPublicGithubResponses(8);
    const firstStats = await fetchGithubStats('octocat');
    const first = await generateFactBomb(firstStats);
    stubPublicGithubResponses(9);
    const secondStats = await fetchGithubStats('octocat');
    const second = await generateFactBomb(secondStats);

    expect(firstStats.fingerprint).not.toBe(secondStats.fingerprint);
    expect(second).toMatchObject({
      jobClass: first.jobClass,
      aiFactBomb: first.aiFactBomb,
      equipment: first.equipment.map(({ name }) => ({ name })),
    });
  });
});
