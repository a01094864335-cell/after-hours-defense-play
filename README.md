# 마왕이 퇴근한 뒤

[게임 플레이](https://a01094864335-cell.github.io/after-hours-defense-play/)

이 저장소가 현재 게임의 **소스·자산·검증·배포 기준**입니다. 이전 소스 저장소의 내보내기 결과로 덮어쓰지 마세요.

수정 → `node --test tests/*.test.cjs` → `node scripts/build-pages.cjs /tmp/game-pages` → main 반영 순서로 작업합니다. GitHub Actions의 runtime 작업에서 로직 테스트·빌드·배포 산출물의 Chromium smoke 검사가 모두 성공해야 Pages에 배포됩니다. 원본 이야기 PNG는 보관하되 배포 파일에서는 제외합니다.

- [개선 사항과 정책](docs/development-20261026.md)
- [현재 17종·지원 7종 밸런스 검증](docs/balance-validation-20261026.md)
- 실제 배포 기준 커밋과 파일 해시는 배포된 `release-manifest.json`에서 확인합니다.
- 기록은 브라우저별 저장이며 메뉴의 **저장 백업 · 기기 옮기기**에서 이전할 수 있습니다. GM 테스트 기록은 백업·실제 기록과 분리됩니다.
- `?gm=1&coins=1000000`은 전체 직원·지원 영웅·이야기를 해금하고 연수를 완료한 임시 테스트로 시작합니다. 일반 저장·수집 기록과 해금 보상은 변경하지 않습니다.

## B UI 애셋 적용

공개 게임의 기존 UX를 유지하며 B 에나멜 부품을 연결했습니다. [배포 경로·적용 범위](docs/enamel-b-live-integration.md), [텍스트 규격](designs/enamel-b/README.md), [공개 애셋 갤러리](https://a01094864335-cell.github.io/after-hours-defense-play/assets/ui-b/gallery.html)를 확인하세요.

## 모바일 시각 검수 1차

[전체 화면 수정 전후 비교](qa/visual-pass/index.html)와 [발견·수정 내역](qa/visual-pass/README.md)을 기록했습니다. 320·390·430px에서 프레임 안전 여백, 제목·탭, 코인·SP, 채용 결과, 좁은 화면의 상품·도움말을 보정했습니다.

## 실제 플레이 기반 디자인 정리

[플레이 화면 비교](qa/play-design/index.html)와 [디자인 수정 내역](qa/play-design/README.md)을 기록했습니다. 패널 위계·선택 탭·로비 명단·상점·도감·전투 알림·결과 가독성을 정리했으며 게임 규칙과 기능은 유지합니다.

## 브라우저 회귀 검사

```sh
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
python3 -m unittest discover -s tests -v
```

`/usr/bin/chromium`이 있으면 기본으로 사용합니다. 다른 실행 파일은 `UI_CHROMIUM_PATH`로 지정하고, Playwright 설치 브라우저를 사용하려면 `UI_CHROMIUM_PATH=''`로 실행하세요.

CI와 동일한 배포 산출물 smoke 검사:

```sh
node scripts/build-pages.cjs /tmp/game-pages
UI_GAME_ROOT=/tmp/game-pages python3 -m unittest discover -s tests -p 'test_browser_smoke.py' -v
```

신규 시작·5회 소환·일시정지·6웨이브 스킬 선택, 이어하기, 다중 탭 저장 보호, 정산 중복 방지·저장 실패 복구, 화면 회전을 확인합니다. 전체 브라우저 검사에는 화면 배치·구매·보스·성능 회귀 검사도 포함됩니다.
