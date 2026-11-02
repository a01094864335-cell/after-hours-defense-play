# 마왕이 퇴근한 뒤

[게임 플레이](https://a01094864335-cell.github.io/after-hours-defense-play/)

이 저장소가 현재 게임의 **소스·자산·검증·배포 기준**입니다. 이전 소스 저장소의 내보내기 결과로 덮어쓰지 마세요.

수정 → `node --test tests/*.test.cjs` → `node scripts/build-pages.cjs /tmp/game-pages` → main 반영 순서로 작업합니다. GitHub Actions의 runtime 작업이 성공해야 Pages에 배포됩니다. 원본 이야기 PNG는 보관하되 배포 파일에서는 제외합니다.

- [개선 사항과 정책](docs/development-20261026.md)
- [현재 17종·지원 7종 밸런스 검증](docs/balance-validation-20261026.md)
- 실제 배포 기준 커밋과 파일 해시는 배포된 `release-manifest.json`에서 확인합니다.
- 기록은 브라우저별 저장이며 메뉴의 **저장 백업 · 기기 옮기기**에서 이전할 수 있습니다. GM 테스트 기록은 백업·실제 기록과 분리됩니다.

## B UI 애셋 적용

공개 게임의 기존 UX를 유지하며 B 에나멜 부품을 연결했습니다. [배포 경로·적용 범위](docs/enamel-b-live-integration.md), [텍스트 규격](designs/enamel-b/README.md), [공개 애셋 갤러리](https://a01094864335-cell.github.io/after-hours-defense-play/assets/ui-b/gallery.html)를 확인하세요.
