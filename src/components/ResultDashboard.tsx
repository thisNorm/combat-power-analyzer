'use client';
import { useRef } from 'react';
import html2canvas from 'html2canvas'; // 캡처 라이브러리 추가

interface Item { slot: string; name: string; rarity: string; }
interface Stats {
  githubId: string; commitCount: number; mainLanguages: string[];
  jobClass: string; hp: number; attack: number; defense: number;
  evasion: number; items: Item[]; aiFactBomb: string;
}

export default function ResultDashboard({ stats, onRetry }: { stats: Stats, onRetry: () => void }) {
  // 1. 캡처할 영역을 지정하기 위한 useRef 훅 추가
  const captureRef = useRef<HTMLDivElement>(null);

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  // 2. 바이럴 공유 및 저장 로직
  const handleShare = async () => {
    if (!captureRef.current) return;
    
    try {
      // HTML을 Canvas 이미지로 변환
      const canvas = await html2canvas(captureRef.current, { backgroundColor: '#1a1a1a' });
      const imageUrl = canvas.toDataURL('image/png');

      // 모바일 웹 공유 API (인스타, 트위터, 카톡 등 네이티브 앱 공유 창 띄우기)
      if (navigator.share) {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], 'combat-power.png', { type: 'image/png' });
        await navigator.share({
          title: '내 개발 전투력',
          text: `[${stats.jobClass}] 내 깃허브 스탯과 AI 팩폭을 확인해보세요!`,
          files: [file],
        });
      } else {
        // PC 화면이거나 공유 API를 지원하지 않으면 짤방처럼 즉시 다운로드 (저장)
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${stats.githubId}_전투력.png`;
        link.click();
        alert('이미지가 갤러리에 저장되었습니다! SNS에 직접 공유해보세요.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      alert('이미지 캡처에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-screen font-serif">
      {/* 3. 캡처할 최상위 div 영역에 ref={captureRef} 달아주기 */}
      <div ref={captureRef} className="bg-[#1a1a1a] border-[6px] border-[#3a3a3a] outline outline-2 outline-black shadow-2xl p-6 max-w-5xl w-full flex flex-col md:flex-row gap-6 rounded-sm relative">
        
        {/* ... (이하 중간 UI 코드는 기존의 RPG UI 부분과 완벽하게 동일합니다!) ... */}
        {/* 기존에 복붙하셨던 좌측/우측 패널 코드를 그대로 유지합니다. */}

        {/* -------------------- [여기서부터 생략된 기존 코드 유지] -------------------- */}
        
        {/* 🛡️ 좌측 패널 */}
        <div className="flex-1 bg-[#2a2a2a] border-4 border-[#111] p-4 relative flex flex-col justify-between">
          <div className="absolute top-2 left-2 bg-green-900 border border-black px-2 text-xs text-green-400">PLAYER</div>
          <div className="flex justify-center my-8">
            <img src={`https://github.com/${stats.githubId}.png`} alt="캐릭터" className="w-48 h-48 border-4 border-gray-700 bg-black object-cover" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {stats.items.map((item, idx) => (
              <div key={idx} className="bg-[#111] border-2 border-gray-600 p-2 text-center h-24 flex flex-col justify-center">
                <span className="text-gray-500 text-[10px] uppercase block mb-1">{item.slot}</span>
                <span className={`font-bold text-sm leading-tight ${getRarityColor(item.rarity)}`}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ⚔️ 우측 패널 */}
        <div className="flex-[1.2] flex flex-col">
          <div className="bg-[#5a1a1a] border-2 border-black text-center py-2 mb-4">
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#facc15]">{stats.githubId}</h2>
          </div>
          <div className="bg-[#111] border-2 border-[#333] p-4 mb-4 flex-1">
            <div className="border-b-2 border-gray-700 pb-2 mb-4 text-center">
              <span className="text-yellow-500 font-bold text-lg block">{stats.jobClass}</span>
              <div className="text-gray-400 text-sm mt-1">전투력 (Commits)</div>
              <div className="text-4xl font-black text-white">{stats.commitCount}</div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-sm font-semibold">
              <div className="flex justify-between px-2"><span className="text-gray-400">일반공격</span><span className="text-yellow-400">{stats.attack}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">생명력</span><span className="text-white">{stats.hp}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">스킬공격</span><span className="text-yellow-400">{Math.floor(stats.attack * 1.5)}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">방어력</span><span className="text-white">{stats.defense}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">극대화</span><span className="text-yellow-400">{Math.floor(stats.attack * 0.3)}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">회피</span><span className="text-white">{stats.evasion}</span></div>
            </div>
          </div>
          <div className="bg-[#0a0f1a] border-2 border-blue-900 p-4 relative mb-4 flex-1">
            <div className="text-blue-400 text-xs mb-2 font-bold">[시스템 메시지]</div>
            <p className="text-blue-100 text-sm leading-relaxed">{stats.aiFactBomb}</p>
          </div>
          {/* -------------------- [여기까지 생략된 기존 코드 유지] -------------------- */}

          {/* 4. 버튼 이벤트 연결 (캡처 버튼 추가) */}
          <div className="flex gap-2">
            {/* 사진첩 이미지 저장 및 공유 버튼 */}
            <button 
              onClick={handleShare}
              className="flex-1 bg-green-700 hover:bg-green-600 border-2 border-black text-white font-bold py-3 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              📷 짤 저장 및 공유
            </button>
            <button 
              onClick={onRetry}
              className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] border-2 border-black text-white font-bold py-3 uppercase tracking-widest transition-colors"
            >
              🔄 재조회
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}