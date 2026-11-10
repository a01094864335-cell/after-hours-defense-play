# 원본 시안 구성용 애셋

`wordless-plate-master.png`는 승인된 948×1659 시안의 위치와 그림을 보존하면서 문자·캐릭터·동적 표시만 제거한 원본이다. `item-icons-master.png`는 3개의 투명 아이콘 원본이다. 게임 UI는 실제 DOM과 Canvas로 겹치며 이 PNG 자체를 게임 스크린샷처럼 표시하는 기능은 아니다.

재수출: `python scripts/export-exact-battle-assets.py` (Pillow, ImageMagick). 배경/버튼에 글자를 추가하지 않는다. 배치 좌표·타일 경계·입력 변환과 검증은 `docs/battle-exact-composition-20261110.md`에 기록했다.
