// import redis from '../lib/redis'; // 🚨 임시로 Redis 연결을 주석 처리합니다.
import { fetchGithubStats } from '../lib/github';
import { generateFactBomb } from '../lib/ai';

export const resolvers = {
  Query: {
    getCombatPower: async (_: any, { githubId }: { githubId: string }) => {
      console.log(`🐌 [No Redis Mode] ${githubId}의 데이터를 바로 분석합니다...`);

      // 1. 외부 API 통신 (더미 데이터)
      const githubData = await fetchGithubStats(githubId);
      const aiFactBomb = await generateFactBomb(githubData);

      // 2. 캐싱 없이 곧바로 프론트엔드로 결과 반환
      return {
        githubId,
        level: "Lv.42 고립된 마이크로서비스의 망령",
        commitCount: githubData.commitCount,
        repoCount: githubData.repoCount,
        mainLanguages: githubData.mainLanguages,
        aiFactBomb,
      };
    },
  },
};