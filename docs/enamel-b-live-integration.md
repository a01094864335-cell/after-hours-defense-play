# B 애셋의 공개 게임 적용

2026-11-02. 실제 소스·배포 기준은 **after-hours-defense-play/main**이다. after-hours-defense와 after-hours-defense-global에서 내보낸 결과로 이 저장소를 덮어쓰지 않는다.

이전 PR은 after-hours-defense 저장소에만 적용되어 공개 게임에 반영되지 않았다. 이 변경은 공개 게임의 기존 3개 GNB(직원 도감·당직실·상점), 이야기·기록·훈련소 바로가기, 동료·편성·오늘의 변주·당직 준비를 유지하며 외형만 교체한다.

- 로드: index.html에서 기존 스타일 다음 enamel-ui.css를 로드한다.
- 주요 액션: button-primary. 바로가기: button-shortcut. 메뉴·배속·정지: button-icon. GNB: tab-nav. 구매: button-purchase-stacked.
- 프레임: 코인/HUD는 hud-currency, 준비 도크는 panel-sheet, 상점·도감 카드는 panel-card, 동료 이름은 panel-support.
- 기본·눌림·비활성·선택 상태는 각각 독립 PNG를 사용한다. 캐릭터 본체와 편성 버튼의 기존 구성은 유지한다.
- 9-slice: 2배 PNG에서 24px를 잘라 표시 두께 12 CSS px로 사용한다. 기존 요소의 좌표·크기·여백·문구를 변경하지 않는다. 작은 코인 표식은 10px, 동료 표식은 8px 표시 테두리로 맞춘다.
- 텍스트 안전 좌표·최대 줄 수는 designs/enamel-b/manifest.json 및 README.md를 따른다. 1줄 전용 버튼은 두 줄 이상 불가. 긴 구매·영구 고용은 최대 2줄 전용 부품을 사용한다.
- 중요한 스타일을 CSS layer에 두어 기존 여러 스킨의 !important 규칙과의 충돌을 해소한다. 게임 스크립트·세이브 포맷·규칙은 변경하지 않는다.

## 배포 확인

node --test tests/*.test.cjs, node scripts/build-pages.cjs /tmp/game-pages를 실행한다. 빌드에 enamel-ui.css와 assets/ui-b의 모든 PNG/SVG 및 갤러리가 포함되는지 확인한다. PR 병합 후 GitHub Actions의 runtime과 deploy가 모두 성공해야 공개 반영 완료로 본다. 배포된 release-manifest.json에서 sourceRevision과 enamel-ui.css 해시를 확인한다.

공개 게임: https://a01094864335-cell.github.io/after-hours-defense-play/
갤러리: https://a01094864335-cell.github.io/after-hours-defense-play/assets/ui-b/gallery.html
