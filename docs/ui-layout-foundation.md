# UI 배치 기반 재구성

2026-11-02. 기존 시안의 자주색·연보라·호박색 방향을 유지하되, 겹치는 CSS 보정을 추가하는 방식을 중단했다.

## 구조 변경

`index.html`에서 아래 9개 화면 스타일 연결을 제거했다.

- `game-ui.bundle.css`, `development.css`, `dialog-layout.css`
- `enamel-ui.css`, `visual-pass.css`, `roomy-buttons.css`, `play-design.css`
- `approved-ui.css`, `detail-ui.css`

화면 배치와 공통 컴포넌트는 `ui.css` 하나가 담당한다. 기존 파일은 과거 갤러리/기록 호환을 위해 남아 있지만 현재 화면의 cascade에 참여하지 않는다. 별도로 연결하는 `skill-cutin.css`는 전투 연출, `gm-mode.css`는 테스트 패널 전용이다. 화면 CSS의 `!important`는 `[hidden]`과 모션 감소 접근성 설정에만 사용한다. 출시 패키지 테스트는 옛 화면 스타일의 재연결과 새 화면 애셋 누락을 검출한다.

`dialog-layout.js`는 기존 노드/이벤트를 보존하면서 모달을 `header → context/tabs → scroll body → actions` 순으로 구성한다. 절대 위치나 DOM 순서와 다른 CSS `order`로 제목·본문·버튼을 끼워 맞추지 않는다. 모달은 뷰포트 한도 안에 있고 본문만 줄어들고 스크롤한다. 직원 상세는 이름이 길어지면 identity 블록 자체가 늘어나며, 하단 액션 영역과 분리된다.

로비 dock은 flex로 줄어드는 떠 있는 패널 대신 viewport grid의 독립 행이다. 직원 명단과 이어하기를 옛 footer로 되돌리던 DOM 소유권 충돌도 정리했다. 동적 기록 요약이 갱신되어도 바로가기의 시각 레이블이 사라지지 않는다.

## 화면별 배치 계약

| 컴포넌트 | 배치 / 텍스트 규칙 |
| --- | --- |
| 상품 카드 | `art / copy` 첫 행, 구매 버튼은 전체 폭 둘째 행. 문구가 늘어나면 행 높이가 증가한다. 가격·수량은 버튼 내부 flex 배치다. |
| 직원 카드 | 초상 / 이름·직무·역할 / 상태 badge의 named grid. 이름과 badge가 같은 영역을 차지하지 않는다. |
| 직원 identity | 초상 열과 이름·부서·특성 열. 내용의 높이를 고정하지 않는다. |
| 훈련 효과 | 레벨 34px / 설명 유동 / 상태 28px. 긴 설명은 가운데 열에서 줄바꿈한다. |
| 헤더 | 유동 제목 + 독립된 44×44px 닫기 버튼. 직원 상세에서 뒤로가기도 44px 독립 열이다. |
| 탭 | 동일 폭 열, 내용은 필요 시 줄바꿈. 고정 높이로 자르지 않는다. |
| 모달 액션 | 본문과 별도 영역, 상단 여백 12px. 긴 버튼 문구는 버튼 높이가 늘어난다. |
| 공통 버튼 | 기본 세로 11px / 가로 14px padding, 최소 높이 44px. 일부 HUD는 별도 컴팩트 규격이다. |
| 카드 | 기본 padding 14–16px, 카드 간 10–12px. 장식용 프레임 이미지가 텍스트 공간을 정의하지 않는다. |
| 편성 초상 이름 | 34px 안팎의 짧은 표시 이름. **두 줄 불가**. 긴 번역은 짧은 표시 이름 필요. |
| 아이콘 전용 버튼 | **텍스트 삽입·두 줄 불가**. 접근성 이름으로 동작을 설명한다. |
| 전투·이야기 | 그림 영역과 조작·대사 영역은 별도 행이다. 배경 그림에 조작 레이블을 덧그리지 않는다. |

로비 배경에서 고비를 분리하고 기존 투명 캐릭터 애셋을 별도 레이어로 재사용했다. 화면이 짧아도 로고가 얼굴을 가리지 않는다. 컨트롤 밀도는 viewport 높이 대신 실제 scene container 높이에 반응한다. 상점 banner에도 UI 글자가 포함된 옛 합성 SVG 대신 깨끗한 scene 이미지를 쓴다. 장비 버튼의 중복 이름을 제거하고 inline 방향 아이콘을 실제 텍스트 크기에 맞췄다. 저장·게임 규칙·가격·보상은 변경하지 않았다.

## 확인한 범위와 증빙

### 자동 측정

- 기존 런타임 테스트 30개.
- `320×568`, `390×844`, `430×932`에서 기본 32개 상태씩 96개. 스크롤 끝 34개를 포함해 총 130개 layout snapshot 측정.
- 기본 가로 넘침/뷰포트 이탈 검사 외에 `scripts/ui-layout-audit.cjs`가 버튼의 세로 넘침, 실제 텍스트 Range와 이미지 box의 겹침, 이름·직무·badge 영역 교차, 제목·닫기 버튼 교차, 모달의 header/body/actions 경계를 측정한다.
- 긴 한국어·영문 문구를 넣고 글자를 각각 130%, 150%로 키워 상점·직원 목록·직원 상세·훈련소를 세 크기에서 확인했다. 24개 조건의 상단/하단 총 48개 snapshot에서 해당 검사 항목 오류 없음.
- 로비는 320×568, 360×640, 375×667, 390×568, 390×640, 390×844, 430×568, 430×932에서 이어하기 유무 16개 조합을 추가 검사했다. 지원 영웅과 이어하기가 함께 있을 때 발견한 컨트롤 충돌을 수정하고, 로고·캐릭터·바로가기·지원 버튼 교차도 측정했다.
- 고의로 높이 10px 버튼에 긴 22px 글자를 넣은 probe를 검사기가 실제로 검출했다. `qa/layout-foundation/detector-self-check.json`.
- 실제 클릭으로 구매 코인 차감, 훈련 레벨 증가, 직원 상세/뒤로가기/미채용 이동, 채용 결과를 세 크기에서 확인했다.
- 실제 전투에서는 5회 소환 → 보드 직원 선택 → 속도 변경 → 장비 → 일시정지/계속 → 보너스 선택 → 12웨이브 종료 및 27코인 결과까지 진행했다. 이 실행의 JS 오류 없음. 결과 값은 테스트 브라우저 한 판의 관측값이다.

### 눈으로 확인

기본 상태의 연락 시트와 대표 원본 캡처, 짧은 화면, 긴 문구/확대 글자, 실제 전투 캡처를 검토했다. 옛 banner에 포함된 글자, 중복 장비 레이블, 과도한 inline 화살표 크기, 닫기 버튼의 어색한 줄바꿈을 찾아 수정했다.

캡처는 `qa/layout-foundation/after`, `stress`, `play`에 있다. `review-comparison.png`에는 이전 직원 상세와 새 배치, 새 상점 화면을 함께 둔다.

### 검증의 한계

모바일 크기를 에뮬레이션한 Chromium에서 검사했다. 실제 iPhone Safari, Android 기기별 글꼴, 모든 언어·접근성 조합을 검증한 것은 아니다. 확대 검사는 CSS 글자 크기 모사이며 OS 텍스트 확대와 동일하다는 뜻은 아니다. 좌표 검사는 영역 충돌·넘침을 잡지만 그림의 미적 균형이나 모든 글자의 실제 획 대비를 보장하지 않는다. 승인 이미지와의 픽셀 일치를 주장하지 않는다.

## 재현

로컬 HTTP 서버를 실행한 뒤:

```sh
node --test tests/*.test.cjs
node scripts/check-play-design.cjs
UI_QA_DIR=qa/layout-foundation UI_LAYOUT_AUDIT=1 node scripts/capture-visual-pass.cjs
UI_QA_DIR=qa/layout-foundation node scripts/check-detail-ui.cjs
UI_QA_DIR=qa/layout-foundation node scripts/check-lobby-layout.cjs
UI_QA_DIR=qa/layout-foundation node scripts/check-layout-stress.cjs
UI_QA_DIR=qa/layout-foundation UI_TEXT_SCALE=1.5 node scripts/check-layout-stress.cjs
UI_QA_DIR=qa/layout-foundation/play node scripts/play-design-review.cjs
node scripts/build-pages.cjs /tmp/game-pages
```

브라우저 실행 경로는 `UI_CHROMIUM_PATH`, 서버 주소는 `UI_BASE_URL`로 바꿀 수 있다.
