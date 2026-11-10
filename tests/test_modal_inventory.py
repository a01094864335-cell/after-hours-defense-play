"""Inventory-driven real UI captures. Fail only AFTER every scenario was attempted.

MODAL_QA_DIR selects the artifact directory; MODAL_QA_REPORT_ONLY=1 makes a
historical baseline non-gating. No screenshots are synthesized or blank dialogs
opened: each fixture invokes the game's renderer/entry point with real state.
"""
import json
from html import escape
import os
from pathlib import Path
import unittest

import test_usability as ui
from browser_helpers import game_root

SIZES = [(320, 568), (390, 684), (390, 844), (430, 932)]
BASE = "meta.tutorialComplete=true;restartTo('lobby');ended=false;tutorialMode=false;renderMeta();"
BATTLE = "setScreen('battle');paused=true;sync();"
PERK = BATTLE + "wave=20;playing=true;bonusPending=true;life=2;renderPerkChoices();sync();document.querySelector('#perk').showModal();"

# name, rendered surface, actual entry point. Separate states share an inventory ID.
CASES = [
    # The legacy #lobby is intentionally CSS-hidden. The host has no own box:
    # the visible fixed-position presentation lives inside its open shadow root.
    ('lobby', '#asset-lobby-host #asset-lobby', 'renderMeta()'),
    ('settings', '#menu', "openSheet('menu')"),
    ('info', '#info', "openSheet('info')"),
    ('leave', '#leave', BATTLE + 'askLeave()'),
    ('pause', '#ref-pause', BATTLE + 'playing=true;wave=1;paused=true;sync()'),
    ('roster', '#roster', "document.querySelector('#roster-open').click()"),
    ('roster-detail', '#roster', "document.querySelector('#roster-open').click();showStaffRecord(meta.staff[0])"),
    ('shop-pack', '#shop', "document.querySelector('#shop-open').click()"),
    ('shop-items', '#shop', "document.querySelector('#shop-open').click()"),
    ('shop-poor', '#shop', "meta.coins=0;renderMeta();document.querySelector('#shop-open').click()"),
    ('shop-affordable', '#shop', "document.querySelector('#shop-open').click()"),
    ('shop-earned', '#shop', "saveChange(d=>d.coins=PACK_PRICE);renderMeta();document.querySelector('#shop-open').click()"),
    ('training-staff', '#training-dialog', "document.querySelector('#training-entry').click()"),
    ('training-merc', '#training-dialog', "document.querySelector('#training-entry').click();document.querySelector('#training-tab-merc').click()"),
    ('equipment', '#equipment', BATTLE + "playing=true;wave=1;sp=9999;sync();openSheet('equipment')"),
    ('equipment-poor', '#equipment', BATTLE + "playing=true;wave=1;sp=0;sync();openSheet('equipment')"),
    ('equipment-max', '#equipment', BATTLE + "playing=true;wave=1;sp=9999;levels.fill(5);sync();openSheet('equipment')"),
    ('story-archive', '#story-archive', "meta.stories=[CastleStories[0].id];openStoryArchive()"),
    ('story-empty', '#story-archive', "meta.stories=[];openStoryArchive()"),
    ('story-owned', '#story-archive', "meta.stories=CastleStories.map(s=>s.id);openStoryArchive()"),
    ('cinematic', '#promo', "document.querySelector('#enter-battle').click()"),
    ('guide', '#guide', BATTLE + "showGuide('근무 이어하기','저장된 시점에서 다시 시작합니다. 접속하지 않은 시간은 진행하지 않아요.')"),
    ('guide-long', '#guide', BATTLE + "showGuide('당직 안내 · 전투 규칙',document.querySelector('#info').textContent.trim())"),
    ('perk-reward', '#perk', PERK),
    ('perk-wave5', '#perk', PERK + 'wave=5;life=3;renderPerkChoices();sync()'),
    ('perk-wave15-expanded', '#perk', PERK + "wave=15;renderPerkChoices();sync();document.querySelectorAll('#perk details').forEach(e=>e.open=true)"),
    ('perk-full-life', '#perk', PERK + 'life=3;renderPerkChoices()'),
    ('perk-equipment-targets', '#perk', PERK + "showPerkTargets('equipment')"),
    ('perk-staff-targets', '#perk', PERK + "showPerkTargets('staff')"),
    ('deck', '#deck', 'openDeck()'),
    ('deck-swap', '#deck', 'openDeck();swapDeckStaff(meta.staff.find(id=>!meta.deck.includes(id)))'),
    ('daily', '#daily-events-dialog', "document.querySelector('#daily-events-open').click()"),
    ('journey', '#journey-dialog', "document.querySelector('#journey-summary').click()"),
    ('journey-populated', '#journey-dialog', "meta.profile.records=Array.from({length:20},(_,i)=>{wave=20+i;const record=runRecord();return {...record,id:'modal-qa-'+i,coins:250+i,seconds:600+i}});meta.profile.best=38;meta.profile.presets[0]={staff:meta.deck.slice(),support:meta.equipped};readProfile(meta.profile);document.querySelector('#journey-summary').click()"),
    ('backup', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click()"),
    ('backup-invalid', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click();document.querySelector('#save-text').value='{invalid';document.querySelector('#save-preview').click()"),
    ('backup-preview', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click();document.querySelector('#save-text').value=JSON.stringify(SaveTransfer.exportData());document.querySelector('#save-preview').click()"),
    ('recruitment', '#recruit-dialog', 'revealRecruit(RECRUIT_STAFF[0],true)'),
    ('hiring', '#hiring-story', "HiringStories.open(staffRecords.find(r=>HiringStories.canView(r.id)).id)"),
    ('starter', '#starter-choice', "document.querySelector('#starter-choice-open').click()"),
    ('staff-trial', '#staff-trial', "document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click()"),
    ('staff-trial-practice', '#staff-trial', "document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click();document.querySelector('#trial-play').click()"),
    ('notice', '.notice-dialog', BATTLE + "document.querySelector('.battle-notice').click()"),
    ('notice-long', '.notice-dialog', BATTLE + "say([...document.querySelectorAll('#info .ref-guide-step,#info .grade-guide')].map(e=>e.textContent.trim()).join(' · '));document.querySelector('.battle-notice').click()"),
    ('tutorial', '#tutorial-gobi', "meta.tutorialComplete=false;restartTo('battle');document.querySelector('#promo-skip').click()"),
    ('result', '#result', 'wave=10;tutorialMode=true;tutorialWon=true;ended=true;settleRun();sync()'),
    ('session-notice', '#session-notice', None),
    ('rotation-notice', '#rotation-notice', None),
    ('king-entrance', '#game', BATTLE + "kingEvent={state:'entrance',timer:0,elapsed:.8};sync()"),
    ('king-question', '#game', BATTLE + "kingEvent={state:'question',timer:0,elapsed:1};sync()"),
    ('gallery-viewer', '#viewer', None),
]

# Approved render_concepts.py SCREENS order. Keep names stable for review links;
# these map design intent to live game surfaces, not to recreated concept images.
APPROVED26 = [
    ('01-settings', '설정 · 당직 클립보드', 'settings'),
    ('02-help', '안내 · 그림 사용설명서', 'info'),
    ('03-leave', '종료 · 경고 쪽지', 'leave'),
    ('04-guide', '이어하기 · 전달 메모', 'guide'),
    ('05-perk', '보너스 · 보상 티켓', 'perk-wave5'),
    ('06-equipment', '장비 · 정비 작업대', 'equipment'),
    ('07-deck', '편성 · 열린 인사철', 'deck'),
    ('08-daily', '변주 · 고정 게시판', 'daily'),
    ('09-journey', '기록 · 근무 장부', 'journey'),
    ('10-backup', '백업 · 보관 서류함', 'backup'),
    ('11-storyarchive', '이야기 · 책 표지 서가', 'story-archive'),
    ('12-notice', '알림 · 전투 메모', 'notice'),
    ('13-roster', '도감 · 직원 인사카드', 'roster-detail'),
    ('14-shop', '상점 · 우편 모집 창구', 'shop-pack'),
    ('15-training', '훈련 · 성장 훈련장', 'training-staff'),
    ('16-recruit', '채용 · 도착한 입사봉투', 'recruitment'),
    ('17-starter', '첫 동료 · 추천 카드', 'starter'),
    ('18-trial', '체험 · 실습 무대', 'staff-trial'),
    ('19-prologue', '프롤로그 · 전체 화면 만화', 'cinematic'),
    ('20-hiring', '채용 이야기 · 개인 만화', 'hiring'),
    ('21-pause', '일시정지 · 휴식 표지', 'pause'),
    ('22-results', '결과 · 당직 성적표', 'result'),
    ('23-tutorial-speech', '튜토리얼 · 말풍선 안내', 'tutorial'),
    ('24-session-warning', '세션 · 상태 확인 쪽지', 'session-notice'),
    ('25-orientation', '화면 회전 · 세로 모드 안내', 'rotation-notice'),
    ('26-gallery-viewer', '갤러리 · 장면 액자', 'gallery-viewer'),
]
CONCEPT_NOTES = {
    '04-guide': 'Uses the real guide renderer and resume copy, not an actual saved-run restore. A saved timestamp/party shown in the concept is not fabricated.',
    '05-perk': 'Uses wave5 full-life state and actual computed rewards. Later-wave tactics/targets remain captured as variants.',
    '09-journey': 'Primary capture is fresh real history. journey-populated is explicitly synthetic QA stress data, not a claim about user records.',
    '13-roster': 'Primary is the actual owned starter dossier; identity and abilities differ from the concept example. Overview remains a variant.',
    '14-shop': 'Actual PACK_PRICE, probabilities, wallet and pity govern the UI; concept example price and balances are not substituted.',
    '16-recruit': 'Primary fixture is the real duplicate-recruit result, not a new hire or a charged purchase.',
    '22-results': 'Controlled tutorial-complete run is settled through the real game renderer; this is not a previously played user run.',
    '25-orientation': 'Real orientation media query requires landscape. Captures use swapped dimensions, not the portrait concept orientation.',
}


def write_approved_review(out, report):
    """Write an honest audit index even when some scenarios fail mid-run."""
    scenarios = {name: selector for name, selector, _ in CASES}
    concepts = []
    for concept_id, title, primary in APPROVED26:
        selector = scenarios[primary]
        captures = [c for c in report['cases'] if c['selector'] == selector]
        primary_captures = [c for c in captures if c['name'] == primary]
        missing = []
        for width, height in SIZES:
            if not any(c['engine'] == 'chromium' and c['viewport'] == [width, height]
                       and c.get('geometry') and any(not p.endswith('-FAILED.png') for p in c['screenshots'])
                       for c in primary_captures):
                missing.append([width, height])
        concepts.append({
            'conceptId': concept_id, 'title': title, 'primaryScenario': primary,
            'actualSelector': selector,
            'variants': [name for name, sel, _ in CASES if sel == selector and name != primary],
            'missingPrimaryChromiumViewports': missing,
            'coverageStatus': 'missing-captures' if missing else 'captured',
            'visualFidelityStatus': 'unreviewed-requires-human-pixel-comparison',
            'knownScenarioDeviation': CONCEPT_NOTES.get(concept_id, 'Live game content and controlled QA state replace illustrative concept values; visual fidelity has not been certified.'),
            'captures': [{key: c[key] for key in ('name', 'engine', 'viewport', 'screenshots', 'errors', 'actualViewport', 'imageFailures', 'touchClassifications', 'scrollRegions', 'actionCheck') if key in c} for c in captures],
        })
    audit = {'schemaVersion': 1, 'designInventory': 'approved26-render_concepts.py-SCREENS',
             'conceptCount': len(APPROVED26), 'requestedViewports': SIZES,
             'comparisonPolicy': 'Coverage and geometry are machine-checked. No pixel comparison or visual approval is implied. PNGs are browser captures of real game renderers, never concept replacements.',
             'fixturePolicy': 'Isolated browser storage with controlled test state; prices, labels and actions come from game code. Stress fixtures are not user history.',
             'concepts': concepts}
    (out/'approved26-report.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
    html = ['<!doctype html><meta charset="utf-8"><title>Approved26 capture review</title>',
            '<style>body{font:16px system-ui;background:#eee;color:#172641;margin:24px}section{border-top:2px solid #234;margin-top:32px}figure{display:inline-block;vertical-align:top;margin:10px;width:260px}img{max-width:260px;height:auto}pre{white-space:pre-wrap}a{color:#234}</style>',
            '<h1>Approved26 live game captures</h1><p>Visual fidelity is UNREVIEWED. Compare these actual browser PNGs with the approved concepts. Fixture or geometry failures remain visible below. No concept artwork is substituted.</p>',
            '<p><a href="report.json">Full geometry report</a> · <a href="approved26-report.json">Concept coverage and deviations</a></p>']
    for concept in concepts:
        html.append('<section id="'+concept['conceptId']+'"><h2>'+escape(concept['conceptId']+' · '+concept['title'])+'</h2>')
        html.append('<p>'+escape(concept['knownScenarioDeviation'])+'</p><p>Coverage: '+concept['coverageStatus']+'</p>')
        for c in concept['captures']:
            html.append('<details'+(' open' if c['name'] == concept['primaryScenario'] else '')+'><summary>'+escape(c['engine']+' '+str(c['viewport'])+' '+c['name'])+'</summary>')
            for p in c['screenshots']:
                html.append('<figure><a href="'+escape(p, quote=True)+'"><img loading="lazy" src="'+escape(p, quote=True)+'"></a><figcaption>'+escape(p)+'</figcaption></figure>')
            if c['errors']:
                html.append('<pre>'+escape('\n'.join(c['errors']))+'</pre>')
            html.append('</details>')
        html.append('</section>')
    (out/'approved26-review.html').write_text('\n'.join(html), encoding='utf-8')

# Recurses into the actual shadow-root UIs, not their hidden legacy controls.
GEOMETRY = r"""root => {
 const all=[];function walk(n){for(const e of n.children||[]){all.push(e);walk(e);if(e.shadowRoot)walk(e.shadowRoot)}}walk(root);
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
 const parent=e=>e.parentElement||e.getRootNode().host;
 const hiddenReason=e=>{
   for(let a=e;a;a=parent(a)){
     const s=getComputedStyle(a);
     if(a.hidden||s.display==='none'||s.visibility==='hidden')return 'hidden-style';
     if(a.tagName==='DETAILS'&&!a.open&&a!==e){
       const summary=a.querySelector(':scope > summary');
       if(!summary||!summary.contains(e))return 'closed-details';
     }
     if(a.clientWidth<=2&&a.clientHeight<=2&&s.overflow==='hidden'&&(s.clipPath!=='none'||s.clip!=='auto'))return 'screen-reader-only';
   }
   return e.getClientRects().length ? null : 'no-layout-box';
 };
 const visible=e=>!hiddenReason(e);
 const label=e=>e.id||e.getAttribute('aria-label')||e.textContent.trim().slice(0,70)||e.tagName;
 const controls=all.filter(e=>e.matches('button,input,select,textarea,summary,[role="button"]')&&visible(e)).map(e=>{
   const r=rect(e);let clip={x:0,y:0,right:innerWidth,bottom:innerHeight},scrollable=false;
   for(let a=parent(e);a;a=parent(a)){const s=getComputedStyle(a),b=a.getBoundingClientRect();
     if(/auto|scroll/.test(s.overflowY)&&a.scrollHeight>a.clientHeight+1)scrollable=true;
     if(/hidden|auto|scroll|clip/.test(s.overflowX)){clip.x=Math.max(clip.x,b.left);clip.right=Math.min(clip.right,b.right)}
     if(/hidden|auto|scroll|clip/.test(s.overflowY)){clip.y=Math.max(clip.y,b.top);clip.bottom=Math.min(clip.bottom,b.bottom)}}
   const intersection=Math.max(0,Math.min(r.x+r.w,clip.right)-Math.max(r.x,clip.x))*Math.max(0,Math.min(r.y+r.h,clip.bottom)-Math.max(r.y,clip.y));
   return {label:label(e),...r,disabled:!!e.disabled,scrollable,visibleArea:intersection,
     undersized:r.w<43.5||r.h<43.5,clipped:intersection+1<r.w*r.h,
     clippingClass:intersection+1>=r.w*r.h?'none':scrollable?'scroll-boundary-review':'non-scroll-clipping'};
 });
 const overflow=all.filter(e=>visible(e)&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&!/auto|scroll/.test(getComputedStyle(e).overflowX)).map(e=>({label:label(e),client:e.clientWidth,scroll:e.scrollWidth}));
 const excluded=all.filter(e=>e.matches('button,input,select,textarea,summary,[role="button"],#r-note')&&['closed-details','screen-reader-only'].includes(hiddenReason(e))).map(e=>({label:label(e),reason:hiddenReason(e)}));
 return {bounds:rect(root),text:root.innerText?.trim().slice(0,200),controls,overflow,excluded,
   documentOverflow:document.documentElement.scrollWidth>innerWidth+2};
}"""


class ModalInventoryTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)

    def test_capture_inventory(self):
        out = Path(os.getenv('MODAL_QA_DIR', '/tmp/modal-qa'))
        out.mkdir(parents=True, exist_ok=True)
        report = {'root': game_root(), 'sizes': SIZES, 'cases': [], 'discovered': [],
                  'method': 'Real game renderers; isolated storage per case; viewport screenshots plus scrolled captures. Visible enabled hit targets below44px gate. Closed details/SR-only content are explicitly excluded; scroll-boundary clipping remains review information, not proof of reachability.'}
        write_approved_review(out, report)
        failures = []
        inventory = set()
        covered = set()
        browsers = [('chromium', self.browser, SIZES, CASES)]
        if os.getenv('MODAL_QA_WEBKIT') == '1':
            try:
                webkit = self.pw.webkit.launch()
                self.addCleanup(webkit.close)
                browsers.append(('webkit', webkit, SIZES[1:3], [c for c in CASES if c[0] in ('settings', 'leave', 'notice', 'pause', 'perk-reward', 'perk-full-life', 'perk-equipment-targets')]))
            except Exception as exc:
                failures.append('WebKit launch: '+str(exc))
        for engine, browser, sizes, cases in browsers:
            for width, height in sizes:
                for name, selector, script in cases:
                    entry = {'engine': engine, 'name': name, 'selector': selector, 'viewport': [width, height], 'screenshots': [], 'errors': []}
                    entry['approvedConceptIds'] = [cid for cid, _, primary in APPROVED26
                                                   if next(sel for n, sel, _ in CASES if n == primary) == selector]
                    report['cases'].append(entry)
                    context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, has_touch=True)
                    page = context.new_page()
                    page.set_default_timeout(8000)
                    page.on('pageerror', lambda error, item=entry: item['errors'].append(str(error)))
                    stem = f'{engine}-{width}x{height}-{name}'
                    try:
                        page.goto(f'http://127.0.0.1:{self.server.server_port}/', wait_until='networkidle')
                        page.wait_for_function('GameSession.canWrite()')
                        inventory.update(page.locator('dialog,[role="dialog"]').evaluate_all("xs=>xs.map(e=>e.id?'#'+e.id:'.'+e.classList[0])"))
                        if name == 'shop-affordable':
                            # Seed the real persisted wallet before boot, like a returning
                            # player. Changing only meta after initialization leaves the
                            # canonical hidden purchase button's render cache stale.
                            self.assertTrue(page.evaluate("saveChange(d=>{d.coins=PACK_PRICE;d.tutorialComplete=true})"))
                            page.reload(wait_until='networkidle')
                            page.wait_for_function('GameSession.canWrite()')
                        page.evaluate(BASE)
                        if name == 'gallery-viewer':
                            page.goto(f'http://127.0.0.1:{self.server.server_port}/story-gallery.html', wait_until='networkidle')
                            page.locator('main img').first.click()
                        elif name == 'session-notice':
                            # A second tab really contends for the same navigator lock.
                            page = context.new_page()
                            page.set_default_timeout(8000)
                            page.goto(f'http://127.0.0.1:{self.server.server_port}/', wait_until='networkidle')
                        elif name == 'rotation-notice':
                            # Portrait notices cannot naturally appear. Exercise the real
                            # media query in landscape and explicitly record actual size.
                            page.set_viewport_size({'width': height, 'height': width})
                            entry['actualViewport'] = [height, width]
                            page.evaluate('GameOrientation.refresh()')
                        else:
                            page.evaluate(script)
                        if name == 'shop-items':
                            page.locator('#asset-shop-host .tabs [data-tab="items"]').click()
                        surface = page.locator(selector)
                        surface.wait_for(state='visible')
                        if name == 'notice-long':
                            self.assertGreater(len(surface.inner_text()), 150)
                            self.assertIn('직원 소환', surface.inner_text())
                        if name == 'perk-full-life':
                            self.assertTrue(page.locator('#perk-life').is_disabled())
                        if name in ('shop-poor', 'shop-affordable', 'shop-earned'):
                            self.assertEqual(page.locator('#asset-shop-host .purchase').is_disabled(), name == 'shop-poor')
                        if name == 'equipment':
                            self.assertGreater(page.locator('#cards button:visible:enabled').count(), 0)
                        if name in ('equipment-poor', 'equipment-max'):
                            self.assertEqual(page.locator('#cards button:visible:enabled').count(), 0)
                        if name == 'deck-swap':
                            self.assertEqual(page.locator('#deck-options .swap-target').count(), 1)
                        if name == 'journey-populated':
                            self.assertEqual(page.locator('#run-history-list li').count(), 20)
                        inventory.update(page.locator('dialog,[role="dialog"]').evaluate_all("xs=>xs.map(e=>e.id?'#'+e.id:'.'+e.classList[0])"))
                        surface.evaluate("""async root=>{await document.fonts.ready;const images=[];function walk(n){for(const e of n.querySelectorAll('*')){if(e.tagName==='IMG'&&e.getBoundingClientRect().width){e.loading='eager';images.push(e)}if(e.shadowRoot)walk(e.shadowRoot)}}walk(root);await Promise.all(images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,5000)})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}""")
                        entry['geometry'] = surface.evaluate(GEOMETRY)
                        if name == 'starter':
                            entry['starterCardContainment'] = page.locator('#starter-options .concept-starter-select').evaluate_all("""xs=>xs.map(e=>{
                                const r=e.getBoundingClientRect(),p=e.closest('article').getBoundingClientRect();
                                return {label:e.getAttribute('aria-label'),button:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},card:{left:p.left,top:p.top,right:p.right,bottom:p.bottom},
                                    inside:r.left>=p.left-1&&r.top>=p.top-1&&r.right<=p.right+1&&r.bottom<=p.bottom+1};
                            })""")
                            if not entry['starterCardContainment']:
                                entry['errors'].append('Starter selection controls missing')
                            for card in entry['starterCardContainment']:
                                if not card['inside']:
                                    entry['errors'].append('Starter selection control extends beyond its card: '+str(card['label']))
                        if name in ('shop-pack', 'shop-poor', 'shop-affordable', 'shop-earned') and width in (390, 430):
                            # Read the real button directly: price and label are live,
                            # and disabled low-balance state must remain inspectable.
                            purchase = page.locator('#asset-shop-host .purchase')
                            entry['initialPurchaseVisibility'] = purchase.evaluate("""e=>{
                                const r=e.getBoundingClientRect();let inside=r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
                                for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();
                                    if(/hidden|auto|scroll|clip/.test(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))inside=false;
                                    if(/hidden|auto|scroll|clip/.test(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))inside=false;}
                                return {x:r.x,y:r.y,width:r.width,height:r.height,disabled:e.disabled,fullyVisible:inside};
                            }""")
                            if not entry['initialPurchaseVisibility']['fullyVisible']:
                                entry['errors'].append('Pack purchase is not fully reachable in initial viewport')
                        if name == 'shop-items':
                            entry['packPurchaseHiddenOnItems'] = page.locator('#asset-shop-host .purchase').is_hidden()
                            if not entry['packPurchaseHiddenOnItems']:
                                entry['errors'].append('Pack purchase should be hidden on the items tab')
                        entry['livePresentation'] = surface.evaluate("""root=>{
                            const s=getComputedStyle(root),texts=[];
                            function read(n){if(n.innerText)texts.push(n.innerText.trim());for(const e of n.querySelectorAll('*'))if(e.shadowRoot)read(e.shadowRoot)}read(root);
                            return {tag:root.tagName,classes:root.className,text:texts.join('\\n').slice(0,12000),
                                background:s.backgroundColor,backgroundImage:s.backgroundImage,font:s.fontFamily,
                                stylesheetURLs:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.href)};
                        }""")
                        entry['imageFailures'] = page.locator(selector+' img').evaluate_all('xs=>xs.filter(i=>i.getBoundingClientRect().width&&(!i.complete||!i.naturalWidth)).map(i=>i.currentSrc||i.src)')
                        path = out / (stem+'.png')
                        page.screenshot(path=str(path), animations='disabled')
                        entry['screenshots'].append(path.name)
                        covered.add(selector)
                        if name in ('shop-pack', 'shop-poor', 'shop-affordable', 'shop-earned') and width in (390, 430):
                            if not entry['initialPurchaseVisibility']['disabled']:
                                page.locator('#asset-shop-host .purchase').tap(trial=True)
                                entry['initialPurchaseVisibility']['touchActionability'] = 'passed-without-purchase'
                        # Scroll every real scroll region, including shadow-root bodies.
                        # Include the surface itself: #result is the actual scroll
                        # container, so a descendant-only walk missed every footer.
                        entry['scrollRegions'] = surface.evaluate("""root=>{const regions=[];function walk(e){if(e.nodeType===1&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2){const before=e.scrollTop;e.scrollTop=e.scrollHeight;regions.push({id:e.id||e.className,before,after:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight})}for(const child of e.children||[])walk(child);if(e.shadowRoot)walk(e.shadowRoot)}walk(root);return regions}""")
                        if entry['scrollRegions'] or name == 'result':
                            page.wait_for_timeout(150)
                            path = out / (stem+'-bottom.png')
                            page.screenshot(path=str(path), animations='disabled')
                            entry['screenshots'].append(path.name)
                            entry['bottomGeometry'] = surface.evaluate(GEOMETRY)
                        g = entry['geometry']; b = g['bounds']; actual = entry.get('actualViewport', [width, height])
                        if b['x'] < -2 or b['y'] < -2 or b['x']+b['w'] > actual[0]+2 or b['y']+b['h'] > actual[1]+2:
                            entry['errors'].append('Surface extends outside viewport')
                        if g['documentOverflow']:
                            entry['errors'].append('Document horizontal overflow')
                        # Tiny controls are findings, not blanket failures: sliders,
                        # scrollable cards and disabled options need manual context.
                        # Keep all raw geometry. A scroll boundary is informational,
                        # not a claim that every control is reachable; non-scroll clips
                        # remain explicit findings. Closed details and SR-only content
                        # are separately recorded as exclusions, never failed hit targets.
                        snapshots = [g] + ([entry['bottomGeometry']] if 'bottomGeometry' in entry else [])
                        entry['touchFindings'] = [c for c in g['controls'] if not c['disabled'] and c['visibleArea'] and (c['undersized'] or c['clipped'])]
                        entry['touchClassifications'] = {
                            'undersized': [c for c in g['controls'] if not c['disabled'] and c['visibleArea'] and c['undersized']],
                            'scrollBoundaryReview': [c for c in g['controls'] if not c['disabled'] and c['visibleArea'] and c['clippingClass']=='scroll-boundary-review'],
                            'nonScrollClipping': [c for c in g['controls'] if not c['disabled'] and c['visibleArea'] and c['clippingClass']=='non-scroll-clipping'],
                            'excluded': g['excluded'],
                        }
                        for snapshot in snapshots:
                            for c in snapshot['controls']:
                                if not c['disabled'] and c['visibleArea'] and c['undersized']:
                                    entry['errors'].append('Visible enabled target below 44px: '+c['label'])
                        if name == 'roster' and g['overflow']:
                            entry['errors'].append('Visible roster content has horizontal overflow: '+str(g['overflow']))
                        for c in g['controls']:
                            primary = (c['label'].endswith('-close') or '닫기' in c['label'] or
                                       c['label'] in ('shared-menu-confirm', 'info-close', 'leave-confirm', 'leave-cancel', 'guide-next', 'pause-continue', 'pause-guide', 'pause-home'))
                            if primary and not c['disabled'] and c['visibleArea'] and c['undersized']:
                                entry['errors'].append('Primary/close touch target below 44px: '+c['label'])
                        if selector != '#game' and not g['text'] and not g['controls']:
                            entry['errors'].append('Empty fixture')
                        if name == 'pause':
                            for c in g['controls']:
                                if c['label'].startswith('pause-') and (c['clipped'] or not c['visibleArea']):
                                    entry['errors'].append('Pause action is clipped or unreachable: '+c['label'])
                            page.locator('#pause-continue').click()
                            self.assertFalse(page.evaluate('paused'))
                            self.assertTrue(page.locator('#ref-pause').is_hidden())
                        if name == 'result':
                            # Prove reachability with real user input, not just a
                            # bounding box on an offscreen or covered control.
                            for action in ('result-home', 'result-again', 'result-training'):
                                control = page.locator('#'+action)
                                control.scroll_into_view_if_needed()
                                control.tap(trial=True)
                            page.locator('#result-home').tap()
                            page.wait_for_function("appScreen==='lobby' && document.querySelector('#result').hidden")
                            lobby = page.locator('#asset-lobby-host #asset-lobby')
                            lobby.wait_for(state='visible')
                            self.assertTrue(lobby.is_visible())
                            # Check a real enabled destination control as well as
                            # state; do not confuse the zero-box host with its UI.
                            page.locator('#asset-lobby-host .a-start').tap(trial=True)
                            entry['actionCheck'] = {'action': 'result-home', 'input': 'touch', 'outcome': 'lobby-visible-result-hidden', 'otherActions': 'Playwright touch actionability checks passed'}
                            path = out / (stem+'-returned-lobby.png')
                            page.screenshot(path=str(path), animations='disabled')
                            entry['screenshots'].append(path.name)
                    except Exception as exc:
                        entry['errors'].append(str(exc))
                        try:
                            path = out / (stem+'-FAILED.png')
                            page.screenshot(path=str(path))
                            entry['screenshots'].append(path.name)
                        except Exception:
                            pass
                    finally:
                        context.close()
                        if entry['errors']:
                            failures.append(stem+': '+'; '.join(entry['errors']))
                        report['discovered'] = sorted(inventory)
                        report['covered'] = sorted(covered)
                        report['uncovered'] = sorted(inventory-covered)
                        report['failures'] = failures
                        (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
                        write_approved_review(out, report)
        if inventory-covered:
            failures.append('Uncovered dialog inventory: '+', '.join(sorted(inventory-covered)))
        report['failures'] = failures
        report['complete'] = not failures
        (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        write_approved_review(out, report)
        if os.getenv('MODAL_QA_REPORT_ONLY') != '1':
            self.assertEqual(failures, [], '\n'.join(failures))
