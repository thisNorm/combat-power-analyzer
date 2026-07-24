import { fetchGithubStats } from '../lib/github';
import { generateFactBomb } from '../lib/ai';
// import redis from '../lib/redis'; // (현재는 Redis 우회 상태 가정)

export const resolvers = {
  Query: {
    getCombatPower: async (_: any, { githubId }: { githubId: string }) => {
      // 1. 깃허브 더미 데이터 가져오기 (추후 실제 API로 교체)
      const githubData = await fetchGithubStats(githubId);
      
      // 2. 깃허브 데이터를 Gemini API에 넘겨 RPG 스탯 부여받기
      const aiRpgData = await generateFactBomb(githubData);

      // 3. 데이터 조립하여 프론트엔드로 반환
      return {
        githubId,
        commitCount: githubData.commitCount,
        repoCount: githubData.repoCount,
        mainLanguages: githubData.mainLanguages,
        
        jobClass: aiRpgData.class,
        hp: aiRpgData.hp,
        attack: aiRpgData.attack,
        defense: aiRpgData.defense,
        evasion: aiRpgData.evasion,
        items: aiRpgData.items,
        aiFactBomb: aiRpgData.factBomb,
      };
    },
  },
};