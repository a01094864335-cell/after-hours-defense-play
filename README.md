# 마왕이 퇴근한 뒤

[게임 플레이](https://a01094864335-cell.github.io/after-hours-defense-play/)

모바일 디펜스 게임의 실행 파일입니다.

통합 소스 리비전: `beb694881862bea2c7bdf9901d980ca3306a3433`

## 출시 안정성 보완

`release-safety-1`: 단일 탭 저장 잠금, 미지급 정산 복구, 수료 보너스 합계,
세로 화면 안내 및 작은 화면의 전투 공간을 보완했습니다.

게임은 HTTPS 또는 localhost에서 실행하세요. 안전한 단일 탭 저장에 Web Locks API를
사용하며, 지원하지 않는 브라우저에는 업데이트 안내를 표시합니다. 다른 게임 탭을
닫은 뒤 차단된 탭에서 **다시 연결**하면 최신 저장을 읽습니다.

미지급 결과 기록이 저장되면 재접속 시 지급을 재시도합니다. 저장 공간 문제로 모든
쓰기가 실패하면 최신 결과까지 보존할 수는 없지만 마지막 정상 전투 저장은 유지합니다.

회귀 검사(Python Playwright와 Chromium 필요):

```sh
python3 -m unittest discover -s tests -v
```

실제 기기의 Safari/Chrome 조작성과 장시간 플레이는 별도로 확인해야 합니다.
