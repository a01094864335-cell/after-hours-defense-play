# 작업 인계 — 2026-11-09

## 다음 작업자가 먼저 읽을 것

1. [최신 미감 피드백과 화면별 개선 요구사항](ui-rush-direction-2026-11-09.md): 사용자가 원하는 ‘게임스럽고 정신없는 와다다 대소동’ 방향. **31개 화면·상태별 개선안은 미구현**이다.
2. [이미 적용한 디자인·레이아웃 20건](ui-review-fixes-2026-11-09.md): 겹침·정렬·가독성·조작 노출의 수정. 전체 미감이 승인됐다는 뜻은 아니다.
3. [실제 구현 전후 캡처](../qa/ui-review-fixes/index.html), [검증 요약](../qa/ui-review-fixes/validation-summary.json): 현재 기준 확인용.
4. [오늘 보관한 자료의 파일별 목록·체크섬](work-artifacts-2026-11-09.json): 시안, 원본 캡처, 중간 측정, 최종 검증을 빠짐없이 인계하기 위한 목록.

## 현재 코드·배포 상태

- 저장소: <https://github.com/a01094864335-cell/after-hours-defense-play>
- 실제 게임: <https://a01094864335-cell.github.io/after-hours-defense-play/>
- Open Scene 전체 구현: [PR #20](https://github.com/a01094864335-cell/after-hours-defense-play/pull/20), 기준 메인 `a9dace4928b3894b1ebd4168d9b38830a0923470`.
- 20건 수정: [PR #21](https://github.com/a01094864335-cell/after-hours-defense-play/pull/21), 병합·배포 메인 `bff164f93be11fac92650030e11da8b43ff95743`. 작업 브랜치 원본 커밋은 `9f35e8cf1eb68fdb672754f4b7c1327e9b563e90`이며 squash 병합이라 SHA가 다르다. 내용은 같다.
- [배포 검사 결과](https://github.com/a01094864335-cell/after-hours-defense-play/actions/runs/42586881570): 성공.
- 이번 인계 변경은 문서·시안·검증 자료 보관이다. 새로운 미감·연출을 게임에 적용하는 변경은 포함하지 않는다.
- 이후 다른 기기에서 시작할 때 최신 `main`을 먼저 가져온다. 예전 로컬 빌드나 정적 시안을 현재 실제 게임으로 오인하지 않는다. 최신 배포 버전은 배포된 `release-manifest.json`의 `sourceRevision`으로 판단한다.

## 사용자 취향과 결정 사항

- C 컨셉을 선호했고, 버튼·컨테이너의 두꺼운 테두리는 싫다고 했다. Open Scene은 이 취향을 반영한 구현 방향이다.
- 캐릭터가 ‘와다다 대소동’처럼 모두 등장하고, 게임답게 정신없고 역동적인 화면을 원한다.
- 현재 결과는 여백·정렬·파스텔 톤·균일한 둥근 버튼이 강해 지나치게 얌전하다는 피드백이다. 일러스트 한 장의 복잡함만으로는 부족하다.
- 필요한 변화는 캐릭터와 UI의 상호 관계, 서로 다른 크기의 시선 유도, 세계관 소품과 조작의 연결, 짧은 상황극과 반응이다.
- 실제 게임의 가능한 기능과 규칙은 유지한다. 임의의 신규 모드·보상·재화·이벤트·슬롯을 시안에 추가하지 않는다.
- 영어판을 고려해 문구는 DOM/CSS로 유지한다. 현재의 영문 시안·검증 문구는 출시된 번역 기능이 아니다.
- 다음 순서는 로비 한 화면의 미감부터 확인한 다음 주요 6화면, 나머지 화면으로 확장하는 제안이다. 아직 새로운 시안의 승인은 받지 않았다.

## 자료 위치와 해석

| 위치 | 내용 | 읽는 법 |
| --- | --- | --- |
| `assets/open-scene/` | 게임에 연결된 무문자 SD 장면·실내 배경·아이콘·칸 자산 | 현재 구현 자산. 다음 파츠 제작의 재사용 기준. |
| `assets/motion/`, `assets/pixel/`, 지원·확장 직원 관련 자산 | 실제 캐릭터 초상·모션·전투 이미지 | 직원 정체성과 전투 스타일을 유지할 기준. |
| `previews/lobby-five-directions/` | 메인 5개 방향의 비교 이미지 | 탐색 이력. 다섯 안 전부가 승인된 것은 아니다. |
| `previews/six-screen-concepts-v2/` | 앞선 6화면 컨셉 이미지와 메타데이터 | 탐색 이력. 실제 기능의 기준이 아니다. |
| `previews/comic-c-six-screens/` | C 컨셉 6화면 HTML/CSS/JS, 아트 시트, 한·영 렌더 | 정적 시안이며 실제 게임 로직과 구별한다. |
| `previews/comic-c-open-layout/` | 테두리를 줄인 C / Open Scene 6화면, 한·영 렌더 | 구현 방향의 이력. 현재 사용자의 최종 미감 승인을 받은 결과는 아니다. |
| `qa/open-scene/` | 첫 Open Scene 적용 캡처와 작은 화면·확대 검증 | 이전 상태의 증빙. 현재 20건 수정 이전 자료가 포함된다. |
| `qa/shop-rush/` | 앞선 상점 대소동 방향 캡처 | 탐색 자료. 실제 기능을 판단할 때 소스를 우선한다. |
| `qa/design-audit-a9dace4/` | 기존 16개 디자인 발견점, 화면 캡처·ZIP·목록 | **수정 전** `a9dace4` 검토 증빙. |
| `qa/layout-audit-a9dace4/` | 추가 레이아웃 문제, 스크롤·그리드·픽셀 측정, 검사 스크립트 | **수정 전** 심층 검토. 당시 서버 경로나 실험 스크립트는 재실행 전에 확인한다. |
| `qa/ui-review-fixed/` | 수정 과정 전체 캡처·측정 원본 | 중간 실패와 최종 성공을 모두 보관했다. 폴더별 의미는 아래 참고. |
| `qa/ui-review-fixes/` | 최종 정리한 전후 비교, 20건 원본 증빙, 검증 요약 | 현재 수정 결과의 대표 자료. 처음에는 여기서 확인한다. |
| `scripts/ui-review/` | 최종 재사용 가능한 회귀 검사 도구 | 임시 `/tmp` 파일에 의존하지 않는 실행 진입점. |
| `docs/ui-review-backlog-2026-11-09.json` | 20건 원인·수정·완료 기준·증빙 경로 | `fixed`는 검토 결함의 수정 완료이며 미감 승인 상태가 아니다. |

### `qa/ui-review-fixed/` 안의 중간·최종 결과 구분

- `390/`, `320/`, `full/`, `targeted/`, `targeted-final/`, `final-*`, `final2-*`: 수정 중의 캡처·측정이다. 일부는 긴 실행 중 수정 시점이 바뀐 자료라 최종 합격 수치로 사용하지 않는다.
- `canvas/`, `canvas-final/`: 인접 직원과 대기시간의 겹침을 찾아내던 중간 결과다. 결함이 있는 캡처도 의도적으로 보존했다.
- `canvas-verified/`: 확장 직원까지 크기 제한을 적용한 뒤 408개 직원·포즈·화면 조합을 검증한 결과. 마왕의 의도적인 전체 화면 연출 겹침은 일반 직원 상태 표시 충돌과 구분한다.
- `verified-320x568/`, `verified-390x640/`, `verified-390x844/`, `verified-430x932/`: 정상·130%·긴 영문 대표 상태의 최종 전체 레이아웃 검증. 실제 잘린 표지 원본 이미지의 바운딩 박스 등 의도된 상태는 분류 검토했다.
- `recruit-check/`, `recruit-final/`: 채용 결과 높이를 조정한 별도 검사. 후자인 `recruit-final/`이 마지막 결과다.
- `extra-final/`: 보너스별 아이콘, 채용 이야기·백업 등 마지막 마감 검사와 캡처.
- `screens-320x568/`, `screens-390x640/`, `screens-390x844/`, `screens-430x932/`: 최종 일반 플레이 흐름 20화면 캡처. 빠른 시각 검토용.
- `acceptance.json`: 실제 주요 버튼 노출·상점 가로 스크롤·가격 대비·훈련 첫 행·지원 탭 확인.
- `packaged/acceptance.json`: GitHub에 올린 커밋의 배포용 빌드로 같은 합격 기준을 재검증한 결과.

## 마지막 기능·화면 검증과 한계

- Node 테스트 76개, 배포용 빌드의 브라우저 smoke 11개 통과. GitHub의 PR 검사와 main 배포 검사도 성공했다.
- 4개 크기: 320×568, 390×640, 390×844, 430×932.
- 2,436개 상태 실행, 7,209회 기하 측정, 3,152개 그리드 그룹 확인.
- 17종 직원 × 6포즈 × 4크기 = 408개 조합에서 상태 텍스트와 직원 픽셀 충돌 0건. 상태·좌표의 합격 범위를 새로운 과장 연출에서도 유지한다.
- 가격 명암비 6.39:1. 상점 구매·강화 버튼과 훈련 첫 행은 작은 화면에서도 노출된다.
- 이 환경에서는 실제 `github.io` 접속이 프록시의 CONNECT 403으로 차단되었다. **배포 성공은 GitHub Actions로 확인했고**, 화면은 같은 소스의 로컬 실행·배포용 빌드로 검증했다. 실제 기기·Safari의 직접 플레이 검증을 완료했다고 주장하지 않는다.
- 영문 검증은 긴 문구를 주입한 CSS 검사이며 번역 정확성 검증이 아니다.
- 기존 이미지 자르기와 마왕 등장 연출의 의도된 겹침을 결함으로 집계하지 않았다. 픽셀 알파와 화면의 실제 가림을 함께 보고 판정한다.

## 다른 환경에서 시작하는 방법

```sh
git clone https://github.com/a01094864335-cell/after-hours-defense-play.git
cd after-hours-defense-play
git switch main
git pull --ff-only origin main
python3 -m http.server 8004 --bind 127.0.0.1
```

- 실제 소스 화면: `http://127.0.0.1:8004/`
- 임시 전체 해금 데이터: `http://127.0.0.1:8004/?gm=1&coins=400`. GM 데이터는 실제 저장과 분리된다. 현재 구현을 확인할 때 사용한다.
- 전후 갤러리: `http://127.0.0.1:8004/qa/ui-review-fixes/`
- Open Scene 정적 시안: `http://127.0.0.1:8004/previews/comic-c-open-layout/`
- 최초 디자인 검토: `http://127.0.0.1:8004/qa/design-audit-a9dace4/`
- 심층 배치 검토: `http://127.0.0.1:8004/qa/layout-audit-a9dace4/`

Node와 Python이 필요하다. 브라우저 기능 검사의 설치·실행은 저장소 [README](../README.md)의 지침을 따른다. JS 시각 검증에는 Node의 `playwright` 모듈과 Chromium 실행 파일이 필요하며 [회귀 도구 README](../scripts/ui-review/README.md)에서 환경변수를 확인한다.

```sh
node --test tests/*.test.cjs
node scripts/build-pages.cjs /tmp/after-hours-pages
UI_GAME_ROOT=/tmp/after-hours-pages python3 -m unittest discover -s tests -p 'test_browser_smoke.py' -v
```

배포 빌드는 저장소 밖에 만든다. `scripts/build-pages.cjs`는 런타임 파일 목록과 해시를 생성한다. 이번에 보관한 대량 시안·원본 QA 자료를 게임 초기 로딩에 넣지 않는다. 다른 환경의 절대 경로나 임시 서버 프로세스는 인계 대상이 아니며, 저장소의 소스·자산·도구를 기준으로 다시 실행한다.

## 다음 작업의 권장 시작점

먼저 R01 로비를 ‘고비와 동료들이 UI를 점령한 야간 출근 사건’으로 재구성한다. 정지 시안의 보기 좋은 구도와 실제 UI의 읽기·터치 영역을 함께 확인한다. 그 다음 R12 상점과 R15 전투를 다르게 풀어 같은 만화적 에너지가 이어지는지 검토한다. 31개 요구사항 전부에 같은 장식과 흔들림을 복사하지 않는다.

오늘 보관된 시안은 비교·재사용용이다. 최신 사용자의 요구는 상세 개선 문서가 우선하며, 이전 시안을 그대로 복원하는 것으로 완료 처리하지 않는다.
