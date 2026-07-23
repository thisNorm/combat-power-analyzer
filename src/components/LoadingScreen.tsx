'use client';
import { useState, useEffect } from 'react';

const FUNNY_MESSAGES = [
  "AI가 당신의 스파게티 코드를 맛보는 중입니다...",
  "StackOverflow 복붙 이력을 털고 있습니다...",
  "Redis 캐시를 뒤지며 당신의 흔적을 찾는 중...",
  "호랑이 CTO가 코드를 보고 한숨을 쉬고 있습니다..."
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-8"></div>
      <h2 className="text-2xl font-semibold text-green-400 animate-pulse">
        {FUNNY_MESSAGES[msgIndex]}
      </h2>
      <p className="mt-4 text-gray-500">API 연동 중... 잠시만 기다려주세요.</p>
    </div>
  );
}