'use client';
import { useState, useEffect } from 'react';

// const FUNNY_MESSAGES = [
//   "AI가 당신의 스파게티 코드를 맛보는 중입니다...",
//   "StackOverflow 복붙 이력을 털고 있습니다...",
//   "Redis 캐시를 뒤지며 당신의 흔적을 찾는 중...",
//   "호랑이 CTO가 코드를 보고 한숨을 쉬고 있습니다..."
// ];

export default function LoadingScreen() {
  // 초기 대기열을 42명 정도로 설정하고 점점 줄어들게 시뮬레이션
  const [queueCount, setQueueCount] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCount((prev) => {
        if (prev <= 1) return 1; // 1명 남았을 때는 백엔드 응답 대기
        return prev - Math.floor(Math.random() * 3) - 1;
      });
    }, 600); // 0.6초마다 대기열 감소
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center font-mono">
      <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-8"></div>
      
      <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg max-w-md w-full shadow-[0_0_15px_rgba(34,197,94,0.2)]">
        <h2 className="text-xl font-bold text-green-400 mb-4 animate-pulse">
          ⚔️ AI가 스탯을 부여하는 중...
        </h2>
        
        <div className="bg-black border border-gray-700 p-4 rounded text-left">
          <p className="text-gray-400 text-sm mb-2">▶ 접속 대기열 현황 (Redis Queue)</p>
          <div className="flex justify-between items-end">
            <span className="text-white">내 앞의 대기자:</span>
            <span className="text-3xl font-black text-yellow-400">{queueCount}명</span>
          </div>
          <p className="text-gray-500 text-xs mt-2 text-right">
            예상 대기 시간: {Math.ceil(queueCount * 0.4)}초
          </p>
        </div>
      </div>
    </div>
  );
}