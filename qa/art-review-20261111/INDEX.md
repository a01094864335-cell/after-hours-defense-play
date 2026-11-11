# 전체 이미지 디자인 점검 증거

- [전체 점검 문서](../../docs/art-design-audit-20261111.md)
- [수정 전후 / 전체 스토리 / 초상화 갤러리](../../assets/art-review/review.html)
- `image-inventory.json`: 조사 시작 시점의 원본 이미지 893개. 이후 생성한 리뷰용 파생 썸네일은 제외.
- `svg-decode.json`: SVG 229개 실제 Chromium 디코딩 결과.
- `contacts/`, `contact-index.json`: 44그룹 75개 원본 이미지 컨택트 시트. PKG는 패키지 포함이며 현재 노출 여부와 다름.
- `story-contacts/`, `story-contact-index.json`: 59편 236장면과 기준 초상화를 대조하는 시트.
- `edited-images.json`: 변경 27개 파일, 이전/이후 SHA256, 마스터, 크기, 출력 품질/용량.
- `originals/`: 변경 27개 파일의 수정 전 원본.
- `before/`, `after/`: 스토리 배치 전후 실제 실행 캡처.
- `runtime/`: 320×568, 390×844에서 236장면씩 재생한 472개 실제 캡처. `report.json`에 그림 영역, 대사창 위치, 디코딩 결과.
- `ui-after/`: 주요 화면 두 크기 × 한글/영문 카피 시안 56개 조합과 스크롤 하단 캡처. 영문은 출시 현지화 완료가 아님.

공개 URL은 이 환경 프록시에서 403이므로 이 캡처는 공개 서버에서 직접 촬영한 결과가 아니다. 최신 소스와 정식 빌드의 로컬 실행을 사용했다. 배포는 GitHub Actions의 별도 결과를 확인한다.

재실행 순서: 정식 빌드를 `/tmp/art-audit-baseline`에 만들고 로컬 서버 8044를 실행 → `inventory.py` → `render-svg.cjs` → `inventory.py` → `story-contacts.py` → `capture-stories.cjs`. `story-data.json`은 해당 조사 시점의 에피소드 원본 데이터를 담는다. `export-edits.py`는 로컬 생성 PNG가 없을 때 저장된 `masters/*.webp`를 사용한다.
