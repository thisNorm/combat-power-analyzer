# Code Hunter Design System

## 1. Atmosphere & Identity

친근한 웹게임의 결과창과 밈 테스트의 공유 욕구가 만나는 “야간 길드 감정소”다. 진지한 판타지 포스터 대신 GitHub 공개 데이터를 장비와 상태 이상으로 번역하며, 시그니처는 검은 전장 위에서 금색 수치와 보라색 직업명이 번쩍이는 픽셀 감정 프레임이다. 사용자가 가장 먼저 읽어야 하는 것은 직업명과 대표 팩폭이고, 근거는 바로 다음 행동으로 확인할 수 있어야 한다.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---:|---|
| Canvas | `--surface-canvas` | `#07090d` | 페이지와 공유 카드 배경 |
| Panel | `--surface-panel` | `#10131a` | 결과 패널 |
| Elevated | `--surface-elevated` | `#171b24` | 모달, 팝오버 |
| Inset | `--surface-inset` | `#090b10` | 아이템 아이콘, 스탯 내부 |
| Text primary | `--text-primary` | `#f7f3e8` | 제목과 본문 |
| Text secondary | `--text-secondary` | `#aaa69d` | 설명과 근거 |
| Text muted | `--text-muted` | `#77736d` | 비활성, 봉인 슬롯 |
| Border | `--border-default` | `#343944` | 패널 경계 |
| Border strong | `--border-strong` | `#6d5830` | 희귀 장비와 강조 패널 |
| Gold | `--accent-gold` | `#f6b91a` | 레벨, 전투력, 주요 CTA |
| Gold hover | `--accent-gold-hover` | `#ffd35a` | CTA hover |
| Violet | `--accent-violet` | `#bd72ff` | 직업명, 팩폭 |
| Violet deep | `--accent-violet-deep` | `#57247f` | 발광 테두리 |
| Cyan | `--accent-cyan` | `#51d7cf` | 정보와 포커스 |
| Lime | `--accent-lime` | `#b7ec58` | 성공과 강점 |
| Orange | `--accent-orange` | `#ff8f3d` | legendary |
| Error | `--status-error` | `#ff6464` | 실패 |
| Overlay | `--surface-overlay` | `rgba(0, 0, 0, 0.78)` | 모달 배경 |

규칙:

- 금색은 숫자와 주 행동, 보라는 직업명과 팩폭, 청록은 상호작용 포커스에 사용한다.
- 희귀도는 색과 함께 텍스트 라벨을 항상 표시한다.
- 새 색이 필요하면 먼저 이 표에 의미를 정의한다.

## 3. Typography

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Display | `clamp(2rem, 4vw, 3.5rem)` | 800 | 1.08 | `-0.02em` | 직업명 |
| H1 | `clamp(1.75rem, 3vw, 2.5rem)` | 800 | 1.15 | `0.02em` | 사용자명 |
| H2 | `1.5rem` | 700 | 1.3 | `0` | 영역 제목 |
| H3 | `1.125rem` | 700 | 1.35 | `0` | 장비명 |
| Body large | `1.125rem` | 500 | 1.65 | `0` | 대표 팩폭 |
| Body | `1rem` | 400 | 1.6 | `0` | 기본 텍스트 |
| Body small | `0.875rem` | 400 | 1.5 | `0` | 근거, 설명 |
| Caption | `0.75rem` | 600 | 1.4 | `0.04em` | 슬롯, 희귀도 |

- Display/Mono: `"Courier New", "Nanum Gothic Coding", monospace`
- Body: `Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
- 본문은 14px 미만으로 내리지 않는다. 긴 사용자명은 줄바꿈보다 `overflow-wrap: anywhere`를 우선한다.

## 4. Spacing & Layout

기본 단위는 4px이다.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | 아이콘과 라벨 |
| `--space-2` | `8px` | 조밀한 내부 간격 |
| `--space-3` | `12px` | 카드 요소 간격 |
| `--space-4` | `16px` | 모바일 패딩 |
| `--space-5` | `20px` | 버튼과 카드 |
| `--space-6` | `24px` | 패널 패딩 |
| `--space-8` | `32px` | 그룹 간격 |
| `--space-10` | `40px` | 섹션 간격 |
| `--space-12` | `48px` | 큰 분리 |
| `--space-16` | `64px` | 페이지 상하 |

- 최대 콘텐츠 폭은 1440px, 모바일 외곽 여백은 16px이다.
- 데스크톱 결과는 본문과 최대 360px 공유 티저의 `sidebar` 구조다. 모바일은 단일 문서 스크롤이다.
- 장비는 모바일 2열, 태블릿 이상 3열이다. 트랙은 `minmax(min(14rem, 100%), 1fr)`로 overflow를 막는다.
- StoryShareCard 렌더 표면은 정확히 1080×1920이며 상단 180px, 하단 280px 안전 영역을 비운다.
- 모달 내부만 필요할 때 스크롤하고 배경 문서는 잠근다.

## 5. Components

### App Header

- **Structure**: `header > brand + actions`
- **States**: 기본, hover, focus, active
- **Accessibility**: 브랜드는 텍스트 포함, 버튼은 명확한 라벨과 44px 이상 터치 영역
- **Layout**: `cluster`; 작은 화면에서 액션이 자연스럽게 감싼다.

### Result Identity

- **Structure**: 레벨, 사용자명, 직업명, 부제, 희귀도
- **States**: 분석 완료 진입, reduced-motion 정적 표시, 데이터 부족
- **Accessibility**: 논리적인 heading 순서, 색 없이 희귀도 텍스트 제공
- **Motion**: 직업명 opacity/transform 400ms, reduced-motion에서 제거

### Character Stage

- **Structure**: 캐릭터 이미지 또는 이니셜 fallback, 대표 장비 배지
- **States**: loading, loaded, image error
- **Accessibility**: 사용자명이 포함된 대체 텍스트, 장식 광원은 접근성 트리에서 제외
- **Layout**: `frame`과 `overlay-stack`

### Equipment Card

- **Structure**: 슬롯, 아이콘/문자 심볼, 이름, 효과, 희귀도, 근거 열기
- **Variants**: common, rare, epic, legendary, sealed
- **States**: default, hover, focus, active, sealed
- **Accessibility**: 실제 `button`, `aria-haspopup="dialog"`, 희귀도 텍스트 표시
- **Motion**: 장착 시 transform/opacity 300ms, reduced-motion 제거

### Stat Strip

- **Structure**: 전투력과 여섯 스탯의 `dl`
- **States**: default, 설명 팝오버 focus/hover
- **Accessibility**: `dt/dd`, 버튼형 설명, 계산 근거를 텍스트로 제공
- **Layout**: overflow-safe intrinsic grid

### Fact Bomb Panel

- **Structure**: 대표 문장, 근거 목록 2~4개, 강점 한 문장, 데이터 제한 알림
- **States**: complete, limited data
- **Accessibility**: 장식 아이콘에 의존하지 않고 목록과 제목 사용
- **Motion**: 대표 문장만 150ms 미세 흔들림, reduced-motion 제거

### Share Modal / Sheet

- **Structure**: backdrop, dialog, 제목/닫기, 축소 StoryShareCard, 네 공유 동작, live status
- **Variants**: 768px 이상 중앙 모달, 미만 하단 바텀시트
- **States**: default, generating, success, unsupported, failure
- **Accessibility**: focus trap, 열기 버튼으로 포커스 복귀, Escape 닫기, `aria-modal`, 상태 `role="status"`
- **Motion**: opacity/transform 200ms, reduced-motion 제거
- **Layout**: 모달 본문이 유일한 내부 스크롤 소유자

### Toast

- **Structure**: 짧은 상태 텍스트
- **States**: success, error
- **Accessibility**: 성공은 `role="status"`, 오류는 `role="alert"`

### StoryShareCard

- **Structure**: 안전 영역, 레벨/사용자명, 직업명, 캐릭터, 대표 장비 2개, 팩폭, 근거 1개, 희귀도, 서비스명/CTA
- **States**: capture-ready, external image fallback
- **Accessibility**: 페이지 미리보기에서는 대체 텍스트 제공, 캡처 원본은 중복 탐색되지 않게 처리
- **Layout**: 고정 1080×1920 frame; 미리보기는 비율을 유지한 scale

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | 120ms | `ease-out` | 버튼 press, hover |
| Standard | 220ms | `ease-in-out` | 모달/시트 |
| Emphasis | 420ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 직업명과 장비 등장 |

- `transform`, `opacity`, 제한적인 `filter`만 애니메이션한다.
- 모든 상호작용은 hover, active, focus-visible을 가진다.
- `prefers-reduced-motion: reduce`에서는 장식 애니메이션과 반복 발광을 제거한다.

## 7. Depth & Surface

전략은 **mixed**다. 얇고 각진 픽셀 프레임이 구조를 만들고, 희귀 등급에만 제한적인 색 발광을 사용한다.

| Level | Value | Usage |
|---|---|---|
| Panel | `inset 0 1px rgba(255,255,255,.04)` | 기본 패널 |
| Focus | `0 0 0 3px color-mix(in srgb, var(--accent-cyan) 34%, transparent)` | 키보드 포커스 |
| Rare glow | `0 0 20px color-mix(in srgb, var(--accent-violet) 22%, transparent)` | epic/rare |
| Modal | `0 24px 80px rgba(0,0,0,.55)` | 공유 모달 |

모서리는 기본 8px, 주요 CTA와 모달은 12px 이내로 유지한다. 둥근 카드가 중첩되는 SaaS 형태를 피한다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA, 본문 4.5:1 및 큰 글자 3:1 대비를 목표로 한다.
- 모든 기능은 키보드로 도달·실행할 수 있어야 한다.
- 360px 폭과 200% 확대에서 기본 문서 가로 스크롤이 없어야 한다.
- 최소 터치 영역은 44×44px이다.
- 포커스는 시각적으로 명확하고 모달 밖으로 빠져나가지 않는다.
- 상태와 희귀도는 색만으로 전달하지 않는다.
- 데이터 제한과 오류는 서비스 톤을 유지하되 사실을 숨기지 않는다.

### Inclusive Personas

- 키보드 사용자: 장비 근거와 공유 동작을 포인터 없이 완료한다.
- 저시력/확대 사용자: 200% 확대에서도 직업명, 장비, 공유 동작을 순서대로 읽는다.
- 모션 민감 사용자: reduced-motion에서 흔들림과 반복 발광 없이 동일한 정보를 얻는다.
- 모바일 한손 사용자: 360px에서 공유 바텀시트의 주요 버튼을 엄지 영역에서 누른다.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| 캐릭터는 GitHub 공개 아바타와 CSS 장비 프레임을 사용 | Result/Story card | 이번 범위에서 새 이미지 생성 API 연동을 금지함 | 향후 캐릭터 이미지 API가 제공되면 `iconUrl`/character URL 계약에 연결 |
| 공유 URL은 결과 스냅샷을 저장하지 않고 `github` 쿼리로 재분석 | Share utilities | 기존 DB/영속 저장소가 없고 히스토리·보관함은 범위 밖 | 서버 결과 저장 정책이 제품 결정으로 확정될 때 별도 설계 |
