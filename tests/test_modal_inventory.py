"""Inventory-driven real UI captures. Fail only AFTER every scenario was attempted.

MODAL_QA_DIR selects the artifact directory; MODAL_QA_REPORT_ONLY=1 makes a
historical baseline non-gating. No screenshots are synthesized or blank dialogs
opened: each fixture invokes the game's renderer/entry point with real state.
"""
import json
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
    ('settings', '#menu', "openSheet('menu')"),
    ('info', '#info', "openSheet('info')"),
    ('leave', '#leave', BATTLE + 'askLeave()'),
    ('roster', '#roster', "document.querySelector('#roster-open').click()"),
    ('roster-detail', '#roster', "document.querySelector('#roster-open').click();showStaffRecord(meta.staff[0])"),
    ('shop-pack', '#shop', "document.querySelector('#shop-open').click()"),
    ('shop-items', '#shop', "document.querySelector('#shop-open').click()"),
    ('training-staff', '#training-dialog', "document.querySelector('#training-entry').click()"),
    ('training-merc', '#training-dialog', "document.querySelector('#training-entry').click();document.querySelector('#training-tab-merc').click()"),
    ('equipment', '#equipment', BATTLE + "sp=9999;sync();openSheet('equipment')"),
    ('story-archive', '#story-archive', "meta.stories=[CastleStories[0].id];openStoryArchive()"),
    ('cinematic', '#promo', "document.querySelector('#enter-battle').click()"),
    ('guide', '#guide', BATTLE + "showGuide('근무 이어하기','저장된 시점에서 다시 시작합니다. 접속하지 않은 시간은 진행하지 않아요.')"),
    ('perk-reward', '#perk', PERK),
    ('perk-wave5', '#perk', PERK + 'wave=5;life=3;renderPerkChoices();sync()'),
    ('perk-wave15-expanded', '#perk', PERK + "wave=15;renderPerkChoices();sync();document.querySelectorAll('#perk details').forEach(e=>e.open=true)"),
    ('perk-full-life', '#perk', PERK + 'life=3;renderPerkChoices()'),
    ('perk-equipment-targets', '#perk', PERK + "showPerkTargets('equipment')"),
    ('perk-staff-targets', '#perk', PERK + "showPerkTargets('staff')"),
    ('deck', '#deck', 'openDeck()'),
    ('daily', '#daily-events-dialog', "document.querySelector('#daily-events-open').click()"),
    ('journey', '#journey-dialog', "document.querySelector('#journey-summary').click()"),
    ('backup', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click()"),
    ('backup-invalid', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click();document.querySelector('#save-text').value='{invalid';document.querySelector('#save-preview').click()"),
    ('backup-preview', '#save-transfer-dialog', "document.querySelector('#save-transfer-open').click();document.querySelector('#save-text').value=JSON.stringify(SaveTransfer.exportData());document.querySelector('#save-preview').click()"),
    ('recruitment', '#recruit-dialog', 'revealRecruit(RECRUIT_STAFF[0],true)'),
    ('hiring', '#hiring-story', "HiringStories.open(staffRecords.find(r=>HiringStories.canView(r.id)).id)"),
    ('starter', '#starter-choice', "document.querySelector('#starter-choice-open').click()"),
    ('staff-trial', '#staff-trial', "document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click()"),
    ('staff-trial-practice', '#staff-trial', "document.querySelector('#starter-choice-open').click();document.querySelector('#starter-options button').click();document.querySelector('#trial-play').click()"),
    ('notice', '.notice-dialog', BATTLE + "document.querySelector('.battle-notice').click()"),
    ('tutorial', '#tutorial-gobi', "meta.tutorialComplete=false;restartTo('battle');document.querySelector('#promo-skip').click()"),
    ('result', '#result', 'wave=10;tutorialMode=true;tutorialWon=true;ended=true;settleRun();sync()'),
    ('session-notice', '#session-notice', None),
    ('rotation-notice', '#rotation-notice', None),
    ('king-entrance', '#game', BATTLE + "kingEvent={state:'entrance',timer:0,elapsed:.8};sync()"),
    ('king-question', '#game', BATTLE + "kingEvent={state:'question',timer:0,elapsed:1};sync()"),
    ('gallery-viewer', '#viewer', None),
]

# Recurses into the actual shadow-root UIs, not their hidden legacy controls.
GEOMETRY = r"""root => {
 const all=[];function walk(n){for(const e of n.children||[]){all.push(e);walk(e);if(e.shadowRoot)walk(e.shadowRoot)}}walk(root);
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
 const parent=e=>e.parentElement||e.getRootNode().host;
 const visible=e=>{for(let a=e;a;a=parent(a)){const s=getComputedStyle(a);if(a.hidden||s.display==='none'||s.visibility==='hidden')return false}return e.getClientRects().length>0};
 const label=e=>e.id||e.getAttribute('aria-label')||e.textContent.trim().slice(0,70)||e.tagName;
 const controls=all.filter(e=>e.matches('button,input,select,textarea,summary,[role="button"]')&&visible(e)).map(e=>{
   const r=rect(e);let clip={x:0,y:0,right:innerWidth,bottom:innerHeight},scrollable=false;
   for(let a=parent(e);a;a=parent(a)){const s=getComputedStyle(a),b=a.getBoundingClientRect();
     if(/auto|scroll/.test(s.overflowY)&&a.scrollHeight>a.clientHeight+1)scrollable=true;
     if(/hidden|auto|scroll|clip/.test(s.overflowX)){clip.x=Math.max(clip.x,b.left);clip.right=Math.min(clip.right,b.right)}
     if(/hidden|auto|scroll|clip/.test(s.overflowY)){clip.y=Math.max(clip.y,b.top);clip.bottom=Math.min(clip.bottom,b.bottom)}}
   const intersection=Math.max(0,Math.min(r.x+r.w,clip.right)-Math.max(r.x,clip.x))*Math.max(0,Math.min(r.y+r.h,clip.bottom)-Math.max(r.y,clip.y));
   return {label:label(e),...r,disabled:!!e.disabled,scrollable,visibleArea:intersection,
     undersized:r.w<43.5||r.h<43.5,clipped:intersection+1<r.w*r.h};
 });
 const overflow=all.filter(e=>visible(e)&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&!/auto|scroll/.test(getComputedStyle(e).overflowX)).map(e=>({label:label(e),client:e.clientWidth,scroll:e.scrollWidth}));
 return {bounds:rect(root),text:root.innerText?.trim().slice(0,200),controls,overflow,
   documentOverflow:document.documentElement.scrollWidth>innerWidth+2};
}"""


class ModalInventoryTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)

    def test_capture_inventory(self):
        out = Path(os.getenv('MODAL_QA_DIR', '/tmp/modal-qa'))
        out.mkdir(parents=True, exist_ok=True)
        report = {'root': game_root(), 'sizes': SIZES, 'cases': [], 'discovered': [],
                  'method': 'Real game renderers; isolated storage per case; viewport screenshots plus scrolled captures. Touch warnings exclude disabled/offscreen controls from hard failures.'}
        failures = []
        inventory = set()
        covered = set()
        browsers = [('chromium', self.browser, SIZES, CASES)]
        if os.getenv('MODAL_QA_WEBKIT') == '1':
            try:
                webkit = self.pw.webkit.launch()
                self.addCleanup(webkit.close)
                browsers.append(('webkit', webkit, SIZES[1:3], [c for c in CASES if c[0] in ('settings', 'leave', 'notice', 'perk-reward', 'perk-full-life', 'perk-equipment-targets')]))
            except Exception as exc:
                failures.append('WebKit launch: '+str(exc))
        for engine, browser, sizes, cases in browsers:
            for width, height in sizes:
                for name, selector, script in cases:
                    entry = {'engine': engine, 'name': name, 'selector': selector, 'viewport': [width, height], 'screenshots': [], 'errors': []}
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
                        if name == 'perk-full-life':
                            self.assertTrue(page.locator('#perk-life').is_disabled())
                        inventory.update(page.locator('dialog,[role="dialog"]').evaluate_all("xs=>xs.map(e=>e.id?'#'+e.id:'.'+e.classList[0])"))
                        surface.evaluate("""async root=>{await document.fonts.ready;const images=[];function walk(n){for(const e of n.querySelectorAll('*')){if(e.tagName==='IMG'&&e.getBoundingClientRect().width){e.loading='eager';images.push(e)}if(e.shadowRoot)walk(e.shadowRoot)}}walk(root);await Promise.all(images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,5000)})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}""")
                        entry['geometry'] = surface.evaluate(GEOMETRY)
                        entry['imageFailures'] = page.locator(selector+' img').evaluate_all('xs=>xs.filter(i=>i.getBoundingClientRect().width&&(!i.complete||!i.naturalWidth)).map(i=>i.currentSrc||i.src)')
                        path = out / (stem+'.png')
                        page.screenshot(path=str(path), animations='disabled')
                        entry['screenshots'].append(path.name)
                        covered.add(selector)
                        # Scroll every real scroll region, including shadow-root bodies.
                        scrolled = surface.evaluate("""root=>{let count=0;function walk(n){for(const e of n.children||[]){if(/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2){e.scrollTop=e.scrollHeight;count++}walk(e);if(e.shadowRoot)walk(e.shadowRoot)}}walk(root);return count}""")
                        if scrolled:
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
                        entry['touchFindings'] = [c for c in g['controls'] if not c['disabled'] and c['visibleArea'] and (c['undersized'] or c['clipped'])]
                        for c in g['controls']:
                            primary = (c['label'].endswith('-close') or '닫기' in c['label'] or
                                       c['label'] in ('shared-menu-confirm', 'info-close', 'leave-confirm', 'leave-cancel', 'guide-next'))
                            if primary and not c['disabled'] and c['visibleArea'] and c['undersized']:
                                entry['errors'].append('Primary/close touch target below 44px: '+c['label'])
                        if selector != '#game' and not g['text'] and not g['controls']:
                            entry['errors'].append('Empty fixture')
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
        if inventory-covered:
            failures.append('Uncovered dialog inventory: '+', '.join(sorted(inventory-covered)))
        report['failures'] = failures
        report['complete'] = not failures
        (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        if os.getenv('MODAL_QA_REPORT_ONLY') != '1':
            self.assertEqual(failures, [], '\n'.join(failures))
