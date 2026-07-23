import Redis from 'ioredis';

// Redis 클라이언트 생성. 배포 시에는 .env의 REDIS_URL을 사용합니다.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('🔥 Redis 연결 성공! LRU 캐시 방어막 가동 준비 완료');
});

redis.on('error', (err) => {
  console.error('🚨 Redis 연결 에러 (Redis 서버가 켜져 있는지 확인하세요):', err);
});

export default redis;