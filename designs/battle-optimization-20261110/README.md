# 아이템 원본 보존

이 디렉터리의 3개 WebP는 최적화 전 1254×1254 아이템 원본이다. 런타임 파일은 `scripts/optimize-battle-ui-assets.py`로 256px·WebP quality 90으로 내보낸다. 재인코딩을 반복할 때 축소본을 다시 원본으로 사용하지 않는다.

글꼴 원본 TTF와 전신 원본 PNG는 기존 소스 위치에 보존했다. 변경 방식·수치·검수는 `docs/battle-optimization-20261110.md` 참조.
