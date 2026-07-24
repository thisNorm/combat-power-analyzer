'use client';

interface Item {
  slot: string;
  name: string;
  rarity: string;
}

interface Stats {
  githubId: string;
  commitCount: number;
  mainLanguages: string[];
  jobClass: string;
  hp: number;
  attack: number;
  defense: number;
  evasion: number;
  items: Item[];
  aiFactBomb: string;
}

export default function ResultDashboard({ stats, onRetry }: { stats: Stats, onRetry: () => void }) {
  
  // 희귀도에 따른 텍스트 색상
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-screen font-serif">
      {/* 📜 메인 RPG 프레임 (스크린샷처럼 두꺼운 테두리와 질감 표현) */}
      <div className="bg-[#1a1a1a] border-[6px] border-[#3a3a3a] outline outline-2 outline-black shadow-2xl p-6 max-w-5xl w-full flex flex-col md:flex-row gap-6 rounded-sm relative">
        
        {/* ❌ 닫기 버튼 모티프 */}
        <div className="absolute top-2 right-2 w-8 h-8 bg-red-900 border-2 border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700">
          <span className="text-black font-black text-xl leading-none">&times;</span>
        </div>

        {/* 🛡️ 좌측 패널: 캐릭터 이미지 & 장착 아이템 (스크린샷 왼쪽 영역) */}
        <div className="flex-1 bg-[#2a2a2a] border-4 border-[#111] p-4 relative flex flex-col justify-between">
          
          <div className="absolute top-2 left-2 bg-green-900 border border-black px-2 text-xs text-green-400">
            PLAYER
          </div>

          <div className="flex justify-center my-8">
            <img 
              src={`https://github.com/${stats.githubId}.png`} 
              alt="캐릭터" 
              className="w-48 h-48 border-4 border-gray-700 bg-black object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* 하단 장비 슬롯 */}
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {stats.items.map((item, idx) => (
              <div key={idx} className="bg-[#111] border-2 border-gray-600 p-2 text-center h-24 flex flex-col justify-center">
                <span className="text-gray-500 text-[10px] uppercase block mb-1">{item.slot}</span>
                <span className={`font-bold text-sm leading-tight ${getRarityColor(item.rarity)}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ⚔️ 우측 패널: 상세 스탯 정보 (스크린샷 오른쪽 영역) */}
        <div className="flex-[1.2] flex flex-col">
          
          {/* 타이틀 및 레벨바 */}
          <div className="bg-[#5a1a1a] border-2 border-black text-center py-2 mb-4">
            <h2 className="text-2xl text-[##e8d8b0] font-black uppercase tracking-widest text-[#facc15]">
              {stats.githubId}
            </h2>
          </div>

          <div className="bg-[#111] border-2 border-[#333] p-4 mb-4 flex-1">
            <div className="border-b-2 border-gray-700 pb-2 mb-4 text-center">
              <span className="text-yellow-500 font-bold text-lg block">{stats.jobClass}</span>
              <div className="text-gray-400 text-sm mt-1">전투력 (Commits)</div>
              <div className="text-4xl font-black text-white">{stats.commitCount}</div>
            </div>

            {/* 스크린샷과 동일한 2열 스탯 배치 */}
            <div className="grid grid-cols-2 gap-y-3 text-sm font-semibold">
              <div className="flex justify-between px-2"><span className="text-gray-400">일반공격</span><span className="text-yellow-400">{stats.attack}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">생명력</span><span className="text-white">{stats.hp}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">스킬공격</span><span className="text-yellow-400">{Math.floor(stats.attack * 1.5)}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">방어력</span><span className="text-white">{stats.defense}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">극대화</span><span className="text-yellow-400">{Math.floor(stats.attack * 0.3)}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-400">회피</span><span className="text-white">{stats.evasion}</span></div>
            </div>
          </div>

          {/* AI 시스템 메시지 (팩폭) */}
          <div className="bg-[#0a0f1a] border-2 border-blue-900 p-4 relative mb-4 flex-1">
            <div className="text-blue-400 text-xs mb-2 font-bold">[시스템 메시지]</div>
            <p className="text-blue-100 text-sm leading-relaxed">
              {stats.aiFactBomb}
            </p>
          </div>

          <button 
            onClick={onRetry}
            className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] border-2 border-black text-white font-bold py-3 uppercase tracking-widest transition-colors"
          >
            데이터 재조회
          </button>
        </div>

      </div>
    </div>
  );
}