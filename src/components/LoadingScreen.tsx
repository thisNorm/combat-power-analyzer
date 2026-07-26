'use client';

const ANALYSIS_STEPS = [
  '공개 GitHub 활동 장부를 펼치고 있습니다.',
  '커밋과 주력 언어의 흔적을 장비 슬롯에 옮기는 중입니다.',
  '근거가 있는 팩폭만 결과 주문서에 적고 있습니다.',
];

export default function LoadingScreen() {
  return (
    <section className="analysis-screen" aria-labelledby="analysis-title">
      <div className="analysis-shell pixel-panel" role="status" aria-live="polite">
        <div className="loading-sigil" aria-hidden="true" />
        <p className="pixel-kicker">Analysis in progress</p>
        <h2 className="analysis-title" id="analysis-title">
          전투 기록을 감정하는 중
        </h2>
        <p className="analysis-description">
          공개 정보를 읽어 전투력과 직업을 정리하고 있습니다.
        </p>
        <ol className="analysis-steps" aria-label="분석 단계">
          {ANALYSIS_STEPS.map((step) => (
            <li className="analysis-step" key={step}>
              {step}
            </li>
          ))}
        </ol>
        <p className="analysis-note">결과가 준비되면 다음 화면으로 자동 이동합니다.</p>
      </div>
    </section>
  );
}
