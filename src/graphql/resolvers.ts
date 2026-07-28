import { generateFactBomb } from '../lib/ai';
import { fetchGithubStats } from '../lib/github';
import { normalizeGithubId } from '../lib/github-id';
import type { AnalysisResult } from '../types/analysis';

interface CombatPowerArgs {
  readonly githubId: string;
  readonly forceRefresh?: boolean;
}

export const resolvers = {
  Query: {
    getCombatPower: async (_parent: unknown, { githubId, forceRefresh }: CombatPowerArgs): Promise<AnalysisResult> => {
      void forceRefresh;
      const normalizedGithubId = normalizeGithubId(githubId);
      if (normalizedGithubId === null) {
        throw new Error('GitHub username must be 1 to 39 letters, numbers, or single hyphen-separated segments.');
      }
      const githubData = await fetchGithubStats(normalizedGithubId);
      return generateFactBomb(githubData);
    },
  },
};
