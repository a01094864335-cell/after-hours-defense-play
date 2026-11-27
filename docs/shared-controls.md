# 공통 버튼 컴포넌트

`shared-controls.js`와 `shared-controls.css`가 공통 버튼의 유일한 시각 규칙을 소유한다. 기존 `shared-chrome`은 모달/화면/동적 콘텐츠를 감지해 이 모듈에 위임한다. 네이티브 button 노드·이벤트·form type·disabled·hidden·포커스·게임 상태를 보존한다.

## 새 화면에서 사용

```html
<button type="button" data-control-kind="close" aria-label="닫기">닫기</button>
<button type="button" data-control-kind="back" aria-label="이전 화면">뒤로</button>
<button type="button" data-control-kind="primary">확인</button>
<button type="button" data-control-kind="secondary">취소</button>
<button type="button" data-control-kind="danger">기록 교체</button>
```

기존 요소는 `GameControls.apply(button, 'primary')`로 적용한다. 명시한 `data-control-kind`가 자동 분류보다 우선한다. 새 ShadowRoot는 `GameControls.mount(root)`로 동일한 버전의 CSS를 연결하고 `GameControls.enhance(root)`를 호출한다. 기존 네 화면은 자동 연결된다.

- 닫기/뒤로: 같은 44px 원형 터치 영역, 22px 장식 아이콘, 기존 접근성 이름 유지.
- 스토리의 닫기/건너뛰기 X도 같은 아이콘 버튼을 사용하며, 원래 건너뛰기 동작과 접근성 이름을 유지.
- 기본/보조/위험: 금색/크림색/적색, 공통 테두리·패딩·글꼴·포커스·비활성·눌림 상태.
- “확인”, “편성 완료” 등 의미 있는 본문 액션은 임의로 X 아이콘으로 바꾸지 않는다.
- 카드, 탭, 스킬, 하단 메뉴는 고유 의미와 배치를 유지한다. 공통 버튼은 위치나 닫기/구매 로직을 소유하지 않는다.
- 기본 토큰: `--control-ink`, `--control-surface`, `--control-accent`, `--control-focus`, `--control-size`, `--control-radius`.
- 기존 스킨과 공존하는 동안 높은 specificity를 사용하는 부분은 이 CSS로 제한한다. 새 화면에서 동일 버튼 스타일을 복제하지 않는다.
