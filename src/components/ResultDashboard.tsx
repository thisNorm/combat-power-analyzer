'use client';

interface Stats {
  githubId: string;
  level: string;
  commitCount: number;
  repoCount: number;
  mainLanguages: string[];
  aiFactBomb: string;
}

export default function ResultDashboard({ stats, onRetry }: { stats: Stats, onRetry: () => void }) {
  
  // 💡 규범님의 이력서를 바탕으로 한 전용 장착 아이템 (이스터에그)
  const equippedItems = [
    { type: '무기', name: 'On-Device AI 경량화 검', rarity: 'text-orange-400', desc: '모델을 91.4% 경량화함' },
    { type: '방패', name: 'Redis 비동기 큐 방패', rarity: 'text-purple-400', desc: 'DB Write 부하 및 장애 방어' },
    { type: '갑옷', name: '마이크로서비스 아키텍처 갑옷', rarity: 'text-blue-400', desc: '모듈 고립 테스트로 결합도 방어' },
    { type: '장신구', name: 'FastAPI 기반 게이트웨이 목걸이', rarity: 'text-yellow-400', desc: '실시간 이벤트 파이프라인 가속' }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-screen">
      {/* RPG 상태창 메인 프레임 */}
      <div className="bg-gray-900 border-4 border-gray-600 shadow-[0_0_30px_rgba(34,197,94,0.2)] rounded-lg p-6 max-w-4xl w-full font-mono">
        
        {/* 1. 상단: 이름, 레벨, 전투력 (타이틀 바) */}
        <div className="flex justify-between items-end border-b-2 border-gray-700 pb-4 mb-6">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-widest">
              {stats.githubId} <span className="text-2xl text-gray-400 font-normal">의 상태창</span>
            </h2>
            <p className="text-2xl text-green-400 mt-1 font-bold">{stats.level}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">총 전투력 (Commits)</p>
            <p className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              {stats.commitCount}
            </p>
          </div>
        </div>

        {/* 2. 중단: 캐릭터 이미지 & 아이템 칸 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* 왼쪽: 캐릭터 스탠딩 이미지 (깃허브 프로필 연동) */}
          <div className="col-span-1 flex flex-col items-center justify-center bg-gray-800 border-2 border-gray-700 rounded-lg p-4 h-72 relative">
            <div className="absolute top-2 left-2 bg-black px-2 py-1 text-xs text-green-500 border border-green-500 rounded">
              PLAYER
            </div>
            {/* 깃허브 프로필 이미지를 픽셀아트 느낌으로 렌더링 */}
            <img 
              src={`https://github.com/${stats.githubId}.png`} 
              alt="캐릭터" 
              className="w-40 h-40 rounded-full border-4 border-gray-600 shadow-lg object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {stats.mainLanguages.map((lang) => (
                <span key={lang} className="bg-gray-700 px-2 py-1 rounded text-xs font-bold text-gray-300">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* 오른쪽: 장착 아이템 인벤토리 */}
          <div className="col-span-2 bg-gray-800 border-2 border-gray-700 rounded-lg p-4">
            <h3 className="text-lg text-gray-400 mb-4 border-b border-gray-700 pb-2">장착 아이템 (Equipment)</h3>
            <div className="grid grid-cols-1 gap-3">
              {equippedItems.map((item, idx) => (
                <div key={idx} className="flex items-center bg-gray-900 border border-gray-600 p-3 rounded hover:border-gray-400 transition-colors">
                  <div className="w-12 h-12 flex-shrink-0 bg-black border border-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                    {item.type}
                  </div>
                  <div className="ml-4">
                    <p className={`font-bold text-lg ${item.rarity}`}>{item.name}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 하단: AI 팩폭 (시스템 메시지 창) */}
        <div className="bg-black border-2 border-blue-900 rounded-lg p-4 relative mb-6">
          <div className="absolute -top-3 left-4 bg-blue-900 text-white text-xs px-2 py-1 rounded">
            System Message
          </div>
          <p className="text-lg text-blue-200 mt-2 leading-relaxed">
            {stats.aiFactBomb}
          </p>
        </div>

        {/* 4. 컨트롤 버튼 */}
        <div className="flex space-x-4">
          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
            월드맵으로 공유 (X)
          </button>
          <button 
            onClick={onRetry}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all"
          >
            재접속 (Refresh)
          </button>
        </div>

      </div>
    </div>
  );
}