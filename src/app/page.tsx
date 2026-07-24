'use client';

import { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useLazyQuery } from '@apollo/client/react';

import LandingForm from '../components/LandingForm';
import LoadingScreen from '../components/LoadingScreen';
import ResultDashboard from '../components/ResultDashboard';

const GET_COMBAT_POWER = gql`
  query GetCombatPower($githubId: String!, $forceRefresh: Boolean) {
    getCombatPower(githubId: $githubId, forceRefresh: $forceRefresh) {
      githubId
      commitCount
      mainLanguages
      jobClass
      hp
      attack
      defense
      evasion
      items {
        slot
        name
        rarity
      }
      aiFactBomb
    }
  }
`;

interface CombatPowerData {
  getCombatPower: {
    githubId: string;
    commitCount: number;
    mainLanguages: string[];
    jobClass: string;
    hp: number;
    attack: number;
    defense: number;
    evasion: number;
    items: { slot: string; name: string; rarity: string }[];
    aiFactBomb: string;
  };
}

interface CombatPowerVars {
  githubId: string;
  forceRefresh?: boolean;
}

export default function Home() {
  const [step, setStep] = useState<'IDLE' | 'LOADING' | 'RESULT'>('IDLE');
  const [currentId, setCurrentId] = useState('');
  
  // 상태 관리를 훅에서 직접 하도록 상태를 추가합니다.
  const [statsData, setStatsData] = useState<CombatPowerData['getCombatPower'] | null>(null);

  // onCompleted와 onError 옵션을 과감히 삭제하고, 네트워크 옵션만 남깁니다.
  const [fetchStats] = useLazyQuery<CombatPowerData, CombatPowerVars>(
    GET_COMBAT_POWER, 
    { fetchPolicy: 'network-only' }
  );

  const handleStart = async (githubId: string) => {
    if (!githubId.trim()) return;
    setCurrentId(githubId);
    setStep('LOADING');

    try {
      // Promise 비동기 방식으로 쿼리를 실행하고 결과를 바로 받아옵니다.
      const { data, error } = await fetchStats({ variables: { githubId, forceRefresh: false } });
      
      if (error) throw error;
      if (data?.getCombatPower) {
        setStatsData(data.getCombatPower);
        setStep('RESULT');
      }
    } catch (err) {
      console.error(err);
      alert('데이터를 분석하는 중 오류가 발생했습니다. (Redis 서버 확인)');
      setStep('IDLE');
    }
  };

  const handleRefresh = async () => {
    setStep('LOADING');
    try {
      // 강제 새로고침(Redis 무효화) 요청
      const { data, error } = await fetchStats({ variables: { githubId: currentId, forceRefresh: true } });
      
      if (error) throw error;
      if (data?.getCombatPower) {
        setStatsData(data.getCombatPower);
        setStep('RESULT');
      }
    } catch (err) {
      console.error(err);
      alert('데이터를 분석하는 중 오류가 발생했습니다. (Redis 서버 확인)');
      setStep('IDLE');
    }
  };

  return (
    <main className="container mx-auto px-4 font-sans selection:bg-green-500 selection:text-black">
      {step === 'IDLE' && <LandingForm onSubmit={handleStart} />}
      {step === 'LOADING' && <LoadingScreen />}
      {step === 'RESULT' && statsData && (
        <ResultDashboard stats={statsData} onRetry={handleRefresh} />
      )}
    </main>
  );
}