'use client';
import { useState } from 'react';

export default function LandingForm({ onSubmit }: { onSubmit: (id: string) => void }) {
    const [githubId, setGithubId] = useState('');

    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 tracking-tighter">
                당신의 개발 전투력은 몇 만입니까?
            </h1>
            <p className="text-gray-400 mb-8">AI가 깃허브 코드를 씹고 뜯고 분석해 드립니다.</p>

            <div className="flex w-full max-w-md space-x-2">
                <input
                    type="text"
                    placeholder="GitHub 아이디를 입력하세요"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-while focus: outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    value={githubId}
                    onChange={(e) => setGithubId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit(githubId)}
                />
                <button
                    onClick={() => onSubmit(githubId)}
                    className="bg-green-500 hover:bg-green-400 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors"
        >
          측정 시작
        </button>
      </div>
    </div>
  );
}