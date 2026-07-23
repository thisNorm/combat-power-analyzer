'use client';

import { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import LandingForm from '../components/LandingForm';
import LoadingScreen from '../components/LoadingScreen';
import ResultDashboard from '../components/ResultDashboard';

// 우리가 백엔드에 정의했던 스키마 모양 그대로 요청합니다
const GET_COMBAT_POWER = gql`
  query GetCombatPower($githubId: String!, $forceRefresh: Boolean) {
    getCombatPower(githubId: $githubId, forceRefresh: $forceRefresh) {
      githubId
      level
      commitCount
      repoCount
      mainLanguages
      aiFactBomb
    }
  }
`;

export default function Home() {
  const [step, setStep] = useState<'IDLE' | 'LOADING' | 'RESULT'>('IDLE');
  const [currentId, setCurrentId] = useState('');

  // Apollo Client를 이용해 데이터를 늦게(버튼 눌렀을 때) 가져오는 훅입니다.
  const [fetchStats, { data, error }] = useLazyQuery(GET_COMBAT_POWER, {
    onCompleted: () => setStep('RESULT'),
    onError: (err) => {
      console.error(err);
      alert('데이터를 분석하는 중 오류가 발생했습니다. (Redis 서버 켜져 있는지 확인)');
      setStep('IDLE');
    },
    // 캐시 문제 방지를 위해 네트워크를 우선시합니다
    fetchPolicy: 'network-only',
  });

  const handleStart = (githubId: string) => {
    if (!githubId.trim()) return;
    setCurrentId(githubId);
    setStep('LOADING');
    // 처음엔 캐시를 활용하기 위해 forceRefresh: false
    fetchStats({ variables: { githubId, forceRefresh: false } });
  };

  const handleRefresh = () => {
    setStep('LOADING');
    // 강제 갱신 버튼을 누르면 Redis LRU 캐시를 날리고 forceRefresh: true 로 찌릅니다.
    fetchStats({ variables: { githubId: currentId, forceRefresh: true } }); 
  };

  return (
    <main className="container mx-auto px-4 font-sans selection:bg-green-500 selection:text-black">
      {step === 'IDLE' && <LandingForm onSubmit={handleStart} />}
      {step === 'LOADING' && <LoadingScreen />}
      {step === 'RESULT' && data && (
        <ResultDashboard stats={data.getCombatPower} onRetry={handleRefresh} />
      )}
    </main>
  );
}