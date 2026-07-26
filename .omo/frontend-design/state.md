# Frontend Design State

## Current Objective

기존 GitHub 분석 결과를 근거 기반 픽셀 RPG 결과 화면과 인스타그램 스토리 중심 공유 흐름으로 완성한다.

## Locked Decisions

- 사용자 제공 데모의 검정·금색·보라색 픽셀 RPG 무드를 따른다.
- 직업명과 대표 팩폭을 시각적 1순위, 캐릭터를 중심 초점으로 둔다.
- 데스크톱 결과에는 공유 티저만 두고 실제 공유 동작은 단일 모달에서 제공한다.
- 768px 미만 공유 UI는 바텀시트다.
- 기존 GraphQL `getCombatPower`를 확장하며 병렬 REST 분석 API, DB, 로그인, 히스토리, 저장 목록을 만들지 않는다.
- 공유 링크는 공개 GitHub ID만 담은 `/?github=` 재분석 URL이다.
- 실제로 수집하지 않은 코드 사용량, 커밋 시간대, 연속 기여일 숫자를 만들지 않는다.

## Source Inputs

- `/var/folders/t1/hy0jyrqx78s2mnsk_w65rzn00000gn/T/codex-clipboard-3c00a29e-525c-4591-b360-a124ace13955.png`
- `/Users/gyubeom/Desktop/Desktop Projects/combat-power-analyzer/DESIGN.md`
- `/Users/gyubeom/.codex/visualizations/2026/07/26/019f9dfe-c217-7862-b568-b20a3956bb1f/before-result-flow-red.png`

## Design Brief

대상은 GitHub 활동을 가볍게 즐기고 SNS로 공유하려는 개발자다. 칭찬 40%, 팩폭 40%, 황당함 20%의 친근한 톤을 사용한다. 고급 판타지 포스터, 과도한 glass UI, 작은 정보가 빽빽한 대시보드, 가짜 기술 수치는 피한다.

## Inclusive Personas

- 키보드 전용 사용자: 장비 근거와 공유 동작 완료.
- 저시력/200% 확대 사용자: 정보 손실과 가로 스크롤 없이 완료.
- 모션 민감 사용자: reduced-motion에서도 정보 동일.
- 360px 모바일 한손 사용자: 바텀시트 주요 동작 완료.

## Adaptive Preferences

- `prefers-reduced-motion` 지원.
- 명시적인 focus-visible 스타일.
- CJK 최소 14px 본문.
- 상태/희귀도는 색상과 텍스트를 함께 사용.

## Verification Matrix

- 360/768/1440px 화면 스크린샷과 overflow 검사.
- 장비 근거 dialog, 공유 modal/sheet의 키보드와 Escape/focus trap.
- 1080×1920 PNG 크기 확인.
- Web Share 파일 지원/미지원과 clipboard/save fallback.
- lint, TypeScript, 테스트, production build.
- objective visual QA 뒤 accessibility/heuristic/persona 검토, 최종 review-work.

## Design Debt Register

- 캐릭터는 이미지 생성 API 없이 GitHub 아바타/placeholder 사용: 사용자 요구에 따른 범위 제한.
- 공유 URL은 저장 스냅샷이 아닌 재분석 링크: 영속 정책과 저장소가 없는 현재 구조의 최소 구현.

## Evidence Index

- 구현 전 RED: `/Users/gyubeom/.codex/visualizations/2026/07/26/019f9dfe-c217-7862-b568-b20a3956bb1f/before-result-flow-red.png`
- 구현 후 증거: QA 단계에서 추가.
