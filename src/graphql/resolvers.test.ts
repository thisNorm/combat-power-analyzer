import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchGithubStats = vi.hoisted(() => vi.fn());
const generateFactBomb = vi.hoisted(() => vi.fn());

vi.mock('../lib/github', () => ({ fetchGithubStats }));
vi.mock('../lib/ai', () => ({ generateFactBomb }));

function analysisResult(githubId: string): Record<string, unknown> {
  return { githubId };
}

describe('combat power resolver analysis reuse', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    fetchGithubStats.mockReset();
    generateFactBomb.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces concurrent analyses, including a force refresh, into one provider request', async () => {
    let resolveStats: ((value: Record<string, unknown>) => void) | undefined;
    const pendingStats = new Promise<Record<string, unknown>>((resolve) => {
      resolveStats = resolve;
    });
    fetchGithubStats.mockReturnValue(pendingStats);
    generateFactBomb.mockImplementation(async (stats: { githubId: string }) => analysisResult(stats.githubId));

    const { resolvers } = await import('./resolvers');
    const regular = resolvers.Query.getCombatPower(null, { githubId: 'octocat' });
    const refreshed = resolvers.Query.getCombatPower(null, { githubId: 'OCTOCAT', forceRefresh: true });

    expect(fetchGithubStats).toHaveBeenCalledTimes(1);
    resolveStats?.({ githubId: 'octocat' });

    await expect(Promise.all([regular, refreshed])).resolves.toEqual([
      { githubId: 'octocat' },
      { githubId: 'octocat' },
    ]);
    expect(generateFactBomb).toHaveBeenCalledTimes(1);
  });

  it('serves successful results from a five-minute cache while force refresh bypasses it', async () => {
    vi.useFakeTimers();
    fetchGithubStats.mockImplementation(async (githubId: string) => ({ githubId }));
    generateFactBomb.mockImplementation(async (stats: { githubId: string }) => analysisResult(stats.githubId));
    const { resolvers } = await import('./resolvers');

    await resolvers.Query.getCombatPower(null, { githubId: 'octocat' });
    await resolvers.Query.getCombatPower(null, { githubId: ' octocat ' });
    expect(fetchGithubStats).toHaveBeenCalledTimes(1);

    await resolvers.Query.getCombatPower(null, { githubId: 'octocat', forceRefresh: true });
    expect(fetchGithubStats).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    await resolvers.Query.getCombatPower(null, { githubId: 'octocat' });
    expect(fetchGithubStats).toHaveBeenCalledTimes(3);
  });

  it('evicts the least recently used entry when the bounded cache reaches capacity', async () => {
    fetchGithubStats.mockImplementation(async (githubId: string) => ({ githubId }));
    generateFactBomb.mockImplementation(async (stats: { githubId: string }) => analysisResult(stats.githubId));
    const { resolvers } = await import('./resolvers');

    for (let index = 0; index < 33; index += 1) {
      await resolvers.Query.getCombatPower(null, { githubId: `user-${index}` });
    }
    await resolvers.Query.getCombatPower(null, { githubId: 'user-0' });

    expect(fetchGithubStats).toHaveBeenCalledTimes(34);
  });
});
