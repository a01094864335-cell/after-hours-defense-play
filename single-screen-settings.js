'use strict';
/* Presentation only: move original controls, never clone their listeners or state. */
(() => {
  if (typeof document.createElement !== 'function') return;
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
  function pages(dialog, definitions) {
    const body = dialog?.querySelector(':scope > .panel-scroll-body');
    if (!body || body.querySelector('.single-screen-tabs')) return null;
    dialog.classList.add('single-screen-settings');
    const tabs = make('div', 'single-screen-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', dialog.id === 'menu' ? '설정 분류' : '안내 주제');
    const panels = definitions.map(([key, label]) => {
      const button = make('button', '', label), panel = make('section', 'single-screen-page');
      button.type = 'button'; button.id = `${dialog.id}-tab-${key}`; panel.id = `${dialog.id}-page-${key}`;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id); panel.tabIndex = 0;
      tabs.append(button); body.append(panel); return {button, panel};
    });
    function select(index, focus = false) {
      panels.forEach(({button, panel}, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; panel.hidden = i !== index; });
      body.scrollTop = 0;
      if (focus) panels[index].button.focus();
    }
    panels.forEach(({button}, i) => {
      button.addEventListener('click', () => select(i));
      button.addEventListener('keydown', event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? panels.length - 1 : event.key === 'ArrowRight' ? (i + 1) % panels.length : event.key === 'ArrowLeft' ? (i + panels.length - 1) % panels.length : -1;
        if (next < 0) return; event.preventDefault(); select(next, true);
      });
    });
    body.prepend(tabs); select(0);
    if (typeof GameLanguage !== 'undefined') {
      const english = {basic:'Basic', manage:'Manage', basics:'Basics', merge:'Merge', support:'Battle', boss:'Bosses'};
      const translateTabs = () => panels.forEach(({button}, i) => { button.dataset.noTranslate = 'true'; button.textContent = GameLanguage.current === 'en' ? english[definitions[i][0]] : definitions[i][1]; });
      GameLanguage.subscribe(translateTabs); translateTabs();
    }
    // Reopening starts with the primary page, without interfering with native close/resume.
    new MutationObserver(() => { if (dialog.open) select(0); }).observe(dialog, {attributes:true, attributeFilter:['open']});
    return panels.map(({panel}) => panel);
  }
  const menu = document.getElementById('menu');
  const settings = pages(menu, [['basic','기본 설정'], ['manage','저장 · 관리']]);
  if (settings) {
    const [basic, manage] = settings;
    for (const selector of ['#language-settings','.sfx-settings','.bgm-settings']) {
      const node = menu.querySelector(selector); if (node) basic.append(node);
    }
    for (const field of basic.querySelectorAll('.sfx-settings,.bgm-settings')) {
      const output = field.querySelector('output'), legend = field.querySelector('legend');
      if (output && legend) legend.append(output);
    }
    const display = make('div','single-screen-display');
    for (const id of ['power-save-toggle','compact-fx-toggle']) { const node = document.getElementById(id); if (node) display.append(node); }
    basic.append(display);
    for (const id of ['shared-menu-tools','shared-menu-records','shared-menu-reset']) { const node = document.getElementById(id); if (node) manage.append(node); }
    const body = menu.querySelector(':scope > .panel-scroll-body');
    // Include the full existing reset warning and any future management control.
    for (const node of [...body.children]) if (!node.matches('.single-screen-tabs,.single-screen-page,#shared-menu-display')) manage.append(node);
    menu.querySelector('#shared-menu-display')?.remove();
    const resetGroup = menu.querySelector('#shared-menu-reset');
    if (resetGroup) {
      const warning = [...manage.querySelectorAll('p')].find(p => p.textContent.includes('미정산'));
      if (warning) { warning.id = 'single-screen-reset-warning'; resetGroup.prepend(warning); menu.querySelector('#reset')?.setAttribute('aria-describedby', warning.id); }
    }
  }
  const info = document.getElementById('info');
  const help = pages(info, [['basics','기본'],['merge','합성'],['support','전투'],['boss','군단장']]);
  if (help) {
    const [basic, merge, support, boss] = help;
    const cards = [...info.querySelectorAll('.ref-guide-step')];
    cards.forEach((card, index) => (index === 1 ? merge : basic).append(card));
    const content = info.querySelector('.help-content');
    const rules = content && [...content.querySelectorAll(':scope > p')].find(p => p.id !== 'skill-info' && p.id !== 'board-keyboard-help');
    if (rules) {
      // Consolidate repeated summoning/skill instructions; retain every merge rule.
      rules.textContent = '합성 실패 확률은 2등급 5%부터 7등급 30%까지 증가해요. 실패하면 이동한 직원만 사라져요. 합성권은 선택 후 두 직원을 고르면 사용돼요.';
      rules.classList.add('single-screen-merge-warning'); merge.append(rules);
    }
    for (const [selector, target] of [['.grade-guide',merge],['#skill-info',support],['.boss-guide',boss]]) { const node = info.querySelector(selector); if (node) target.append(node); }
    const bossDetails = boss.querySelector('details'); if (bossDetails) bossDetails.open = true;
    // reference-ui replaces the original keyboard paragraph; restore its describedby target.
    let keyboard = info.querySelector('#board-keyboard-help');
    if (!keyboard) { keyboard = make('p', '', '키보드: 보드에 Tab으로 이동한 뒤 방향키로 칸 이동, Enter·Space로 선택·합성, Escape로 선택 취소, S로 선택 직원 스킬을 사용해요.'); keyboard.id = 'board-keyboard-help'; }
    const keys = make('details','single-screen-keyboard'); keys.append(make('summary','','키보드 조작'), keyboard); basic.append(keys);
    if (content) { if (content.children.length) support.append(...content.children); content.remove(); }
    const body = info.querySelector(':scope > .panel-scroll-body');
    // concept-tools must not pull the lesson cards back out of their topic panels.
    body.dataset.conceptOrdered = 'true';
    for (const node of [...body.children]) if (!node.matches('.single-screen-tabs,.single-screen-page')) support.append(node);
  }
})();
