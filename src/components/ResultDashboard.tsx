'use client';

// GraphQL 스키마와 동일한 타입
interface Stats {
  githubId: string;
  level: string;
  commitCount: number;
  repoCount: number;
  mainLanguages: string[];
  aiFactBomb: string;
}

export default function ResultDashboard({ stats, onRetry }: { stats: Stats, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-gray-800 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">@{stats.githubId}</h2>
            <p className="text-xl text-green-400 mt-2">{stats.level}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">총 전투력(Commits)</p>
            <p className="text-5xl font-black text-white">{stats.commitCount}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">보유 레포지토리: {stats.repoCount}개</p>
          <div className="flex gap-2">
            {stats.mainLanguages.map((lang) => (
              <span key={lang} className="bg-gray-700 px-3 py-1 rounded-full text-sm font-semibold text-gray-300">
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">🚨 AI 아키텍트의 팩폭 평가</p>
          <p className="text-lg text-white italic leading-relaxed">"{stats.aiFactBomb}"</p>
        </div>

        <div className="flex space-x-4">
          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
            X (트위터)에 박제하기
          </button>
          <button 
            onClick={onRetry}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            🔄 최신 데이터 강제 갱신
          </button>
        </div>
      </div>
    </div>
  );
}