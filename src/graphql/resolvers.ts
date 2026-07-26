import { generateFactBomb } from '../lib/ai';
import { fetchGithubStats } from '../lib/github';
import type { AnalysisResult } from '../types/analysis';

interface CombatPowerArgs {
  readonly githubId: string;
  readonly forceRefresh?: boolean;
}

export const resolvers = {
  Query: {
    getCombatPower: async (_parent: unknown, { githubId, forceRefresh }: CombatPowerArgs): Promise<AnalysisResult> => {
      void forceRefresh;
      const githubData = await fetchGithubStats(githubId);
      return generateFactBomb(githubData);
    },
  },
};
