'use client';

import { useCallback, useEffect, useState } from 'react';
import { gql } from '@apollo/client/core';
import { useLazyQuery } from '@apollo/client/react';

import LandingForm from '../components/LandingForm';
import LoadingScreen from '../components/LoadingScreen';
import ResultDashboard from '../components/ResultDashboard';
import { ShareModal } from '../components/ShareModal';
import { normalizeGithubId } from '../lib/github-id';
import type { AnalysisResult } from '../types/analysis';

const GET_COMBAT_POWER = gql`
  query GetCombatPower($githubId: String!, $forceRefresh: Boolean) {
    getCombatPower(githubId: $githubId, forceRefresh: $forceRefresh) {
      githubId
      commitCount
      fingerprint
      collectionState
      repoCount { key value evidence { sourceKey sourceUrl status detail } }
      followers { key value evidence { sourceKey sourceUrl status detail } }
      publicMetrics { key value evidence { sourceKey sourceUrl status detail } }
      mainLanguages
      languageUsage { language repositoryCount ratio evidence { sourceKey sourceUrl status detail } }
      estimatedCommitCount { value formula evidence { sourceKey sourceUrl status detail } }
      evidence { sourceKey sourceUrl status detail }
      level
      jobClass
      hp
      attack
      defense
      evasion
      items {
        slot
        name
        rarity
        effect
        sourceKey
        evidenceStatus
        evidence { sourceKey sourceUrl status detail }
      }
      equipment { slot name rarity effect sourceKey evidenceStatus evidence { sourceKey sourceUrl status detail } }
      narrative { text evidenceStatus evidence { sourceKey sourceUrl status detail } }
      aiFactBomb
    }
  }
`;

interface CombatPowerData {
  getCombatPower: AnalysisResult;
}

interface CombatPowerVars {
  githubId: string;
  forceRefresh?: boolean;
}

function normalizeGithubInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed.replace(/^@/, '');
  if (/^(?:https?:\/\/)?(?:www\.)?github\.com\//i.test(candidate)) {
    try {
      const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? '';
    } catch {
      return null;
    }
  }

  return normalizeGithubId(candidate);
}

export default function Home() {
  const [step, setStep] = useState<'IDLE' | 'LOADING' | 'RESULT'>('IDLE');
  const [statsData, setStatsData] = useState<AnalysisResult | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fetchStats] = useLazyQuery<CombatPowerData, CombatPowerVars>(
    GET_COMBAT_POWER, 
    { fetchPolicy: 'network-only' }
  );

  const handleStart = useCallback(async (githubId: string, updateShareUrl = true) => {
    const normalizedGithubId = normalizeGithubInput(githubId);
    if (!normalizedGithubId) {
      setErrorMessage('GitHub 사용자명 또는 github.com 프로필 주소를 확인해 주세요.');
      return;
    }
    setErrorMessage(null);
    setStep('LOADING');
    if (updateShareUrl) {
      window.history.replaceState(null, '', `/?github=${encodeURIComponent(normalizedGithubId)}`);
    }

    try {
      const { data, error } = await fetchStats({ variables: { githubId: normalizedGithubId, forceRefresh: false } });
      
      if (error) throw error;
      if (data?.getCombatPower) {
        setStatsData(data.getCombatPower);
        setStep('RESULT');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('공개 GitHub 데이터를 분석하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      setStep('IDLE');
    }
  }, [fetchStats]);

  useEffect(() => {
    const githubId = new URLSearchParams(window.location.search).get('github')?.trim();
    if (githubId) {
      const animationFrame = window.requestAnimationFrame(() => {
        void handleStart(githubId, false);
      });
      return () => window.cancelAnimationFrame(animationFrame);
    }
    return undefined;
  }, [handleStart]);

  const handleNewAnalysis = () => {
    setShareOpen(false);
    setStatsData(null);
    setErrorMessage(null);
    window.history.replaceState(null, '', '/');
    setStep('IDLE');
  };

  return (
    <main className="app-main">
      {step === 'IDLE' && (
        <>
          {errorMessage ? <p className="analysis-error pixel-panel" role="alert">{errorMessage}</p> : null}
          <LandingForm onSubmit={handleStart} />
        </>
      )}
      {step === 'LOADING' && <LoadingScreen />}
      {step === 'RESULT' && statsData && (
        <>
          <ResultDashboard
            stats={statsData}
            onNewAnalysis={handleNewAnalysis}
            onShare={() => setShareOpen(true)}
          />
          <ShareModal
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            result={statsData}
          />
        </>
      )}
    </main>
  );
}
