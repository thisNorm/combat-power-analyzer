import { generateFactBomb } from '../lib/ai';
import { fetchGithubStats } from '../lib/github';
import { normalizeGithubId } from '../lib/github-id';
import type { AnalysisResult } from '../types/analysis';

interface CombatPowerArgs {
  readonly githubId: string;
  readonly forceRefresh?: boolean;
}

const ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000;
const ANALYSIS_CACHE_MAX_ENTRIES = 32;

interface CachedAnalysis {
  readonly result: AnalysisResult;
  readonly expiresAt: number;
}

const analysisCache = new Map<string, CachedAnalysis>();
const inFlightAnalyses = new Map<string, Promise<AnalysisResult>>();

function pruneExpiredAnalyses(now: number): void {
  for (const [key, entry] of analysisCache) {
    if (entry.expiresAt <= now) analysisCache.delete(key);
  }
}

function readCachedAnalysis(key: string, now: number): AnalysisResult | undefined {
  const entry = analysisCache.get(key);
  if (entry === undefined) return undefined;
  if (entry.expiresAt <= now) {
    analysisCache.delete(key);
    return undefined;
  }

  // Refresh insertion order so the bounded map behaves as a small LRU cache.
  analysisCache.delete(key);
  analysisCache.set(key, entry);
  return entry.result;
}

function writeCachedAnalysis(key: string, result: AnalysisResult, now: number): void {
  pruneExpiredAnalyses(now);
  analysisCache.delete(key);
  analysisCache.set(key, { result, expiresAt: now + ANALYSIS_CACHE_TTL_MS });

  while (analysisCache.size > ANALYSIS_CACHE_MAX_ENTRIES) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey === undefined) break;
    analysisCache.delete(oldestKey);
  }
}

function analyzeGithubId(normalizedGithubId: string, cacheKey: string): Promise<AnalysisResult> {
  const existing = inFlightAnalyses.get(cacheKey);
  if (existing !== undefined) return existing;

  const analysis = (async () => {
    try {
      const githubData = await fetchGithubStats(normalizedGithubId);
      const result = await generateFactBomb(githubData);
      writeCachedAnalysis(cacheKey, result, Date.now());
      return result;
    } finally {
      inFlightAnalyses.delete(cacheKey);
    }
  })();

  inFlightAnalyses.set(cacheKey, analysis);
  return analysis;
}

export const resolvers = {
  Query: {
    getCombatPower: async (_parent: unknown, { githubId, forceRefresh }: CombatPowerArgs): Promise<AnalysisResult> => {
      const normalizedGithubId = normalizeGithubId(githubId);
      if (normalizedGithubId === null) {
        throw new Error('GitHub username must be 1 to 39 letters, numbers, or single hyphen-separated segments.');
      }

      // GitHub IDs are case-insensitive, so equivalent spellings share work.
      const cacheKey = normalizedGithubId.toLowerCase();
      const inFlight = inFlightAnalyses.get(cacheKey);
      if (inFlight !== undefined) return inFlight;

      if (!forceRefresh) {
        const cached = readCachedAnalysis(cacheKey, Date.now());
        if (cached !== undefined) return cached;
      }

      return analyzeGithubId(normalizedGithubId, cacheKey);
    },
  },
  DeveloperStats: {
    // `repoCount` was historically a scalar in the public GraphQL API. Keep
    // that contract stable while exposing the evidence-bearing metric through
    // the new `repoMetric` field.
    repoCount: (stats: AnalysisResult): number => {
      const value = stats.repoCount.value;
      return typeof value === 'number' && Number.isInteger(value) ? value : 0;
    },
    repoMetric: (stats: AnalysisResult) => stats.repoCount,
  },
};
