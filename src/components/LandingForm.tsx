'use client';

import { FormEvent, useState } from 'react';

export default function LandingForm({ onSubmit }: { onSubmit: (id: string) => void }) {
  const [githubId, setGithubId] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(githubId);
  };

  return (
    <section className="landing-screen" aria-labelledby="landing-title">
      <div className="landing-shell pixel-panel">
        <p className="pixel-kicker">Code Hunter</p>
        <h1 className="landing-title" id="landing-title">
          당신의 개발 전투력은 몇 만입니까?
        </h1>
        <p className="landing-description">
          GitHub 공개 활동을 장비와 스탯으로 바꿔, 당신의 개발 직업을 찾아드립니다.
        </p>

        <form className="landing-form" onSubmit={handleSubmit}>
          <label className="landing-label" htmlFor="github-id">
            GitHub 사용자명 또는 프로필 주소
          </label>
          <div className="landing-controls">
            <input
              className="pixel-input"
              id="github-id"
              type="text"
              inputMode="url"
              autoComplete="username"
              placeholder="예: octocat 또는 github.com/octocat"
              aria-describedby="github-id-help"
              value={githubId}
              onChange={(event) => setGithubId(event.target.value)}
            />
            <button className="pixel-button" type="submit">
              전투력 측정하기
            </button>
          </div>
          <p className="landing-help" id="github-id-help">
            공개로 확인할 수 있는 GitHub 활동만 분석합니다.
          </p>
          <p className="landing-help">
            설정된 경우 공개 GitHub 지표의 근거 문장이 Google Gemini로 검증될 수 있습니다. 사용자명 자체는 전송하지 않습니다.
          </p>
        </form>
      </div>
    </section>
  );
}
