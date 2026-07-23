import redis from '../lib/redis';
import { fetchGithubStats } from '../lib/github';
import { generateFactBomb } from '../lib/ai';

export const resolvers = {
    Query: {
        getCombatPower: async (_: any, { githubId, forceRefresh }: { githubId: string; forceRefresh: boolean }) => {
            const CACHE_KEY = `dev_stats:${githubId}`;

            // 1. Redis 캐시 조회 및 방어 (강제 새로고침이 아닐 때만)
            if (!forceRefresh) {
                const cachedData = await redis.get(CACHE_KEY);
                if (cachedData) {
                    console.log(`⚡️ [Cache HIT] ${githubId}의 데이터를 Redis에서 즉시 반환합니다.`);
                    return JSON.parse(cachedData);
                }
            }

            console.log(`🐌 [Cache MISS] ${githubId}의 데이터를 새롭게 분석합니다...`);

            // 2. 외부 API 병렬 호출 (N+1 방어 및 로직 분리)
            const githubData = await fetchGithubStats(githubId);
            const aiFactBomb = await generateFactBomb(githubData);

            // 3. 최종 결과 조립
            const result = {
                githubId,
                level: "Lv.42 고립된 마이크로서비스의 망령",
                repoCount: githubData.repoCount,
                mainLanguages: githubData.mainLanguages,
                aiFactBomb,
            };

            // 4. Redis 결과 캐싱 (TTL 1시간 설정 - LRU 정책에 의해 메모리 초과 시 알아서 삭제됨)
            await redis.set(CACHE_KEY, JSON.stringify(result), 'EX', 3600);

            return result;
        },
    },
};