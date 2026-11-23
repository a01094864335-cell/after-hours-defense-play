"""Ten isolated UI journeys under the GitHub Pages subpath, using an official build.

Run from the repository root. Milestone/defeat states are explicit QA fixtures;
this does not simulate ten naturally completed games or change player storage.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import hashlib
from pathlib import Path
import sys
from threading import Thread
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tests'))
from browser_helpers import chromium_options, enter_preparation, board_point
from playwright.sync_api import sync_playwright

args_parser = argparse.ArgumentParser()
args_parser.add_argument('--game-root', required=True, type=Path)
args_parser.add_argument('--out', required=True, type=Path)
args = args_parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
prefix = '/after-hours-defense-play/'

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def translate_path(self, path):
        route = urlsplit(path).path
        if not route.startswith(prefix):
            return str(args.game_root / '__outside_public_subpath__')
        return super().translate_path('/' + route[len(prefix):])

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(args.game_root)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}{prefix}'
manifest = json.loads((args.game_root / 'release-manifest.json').read_text())
report = {'base': base, 'sourceRevision': manifest['sourceRevision'],
          'buildManifestSha256': hashlib.sha256((args.game_root / 'release-manifest.json').read_bytes()).hexdigest(),
          'scope': 'Native UI with isolated storage; tutorial completion/400 coins and milestone/defeat are controlled fixtures, not natural full-game wins.', 'rounds': []}
sizes = [(320, 568), (390, 844), (430, 932), (1440, 1000), (390, 640)]
def save():
    (args.out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**chromium_options())
        try:
            for round_index in range(10):
                width, height = sizes[round_index % len(sizes)]
                lang = 'en' if round_index % 2 else 'ko'
                context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True,
                                              reduced_motion='reduce' if round_index % 2 else 'no-preference')
                p = context.new_page()
                entry = {'round': round_index + 1, 'language': lang, 'viewport': [width, height],
                         'checks': [], 'pageErrors': [], 'httpErrors': [], 'cancelledRequests': []}
                report['rounds'].append(entry)
                p.on('pageerror', lambda error, row=entry: row['pageErrors'].append(str(error)))
                p.on('response', lambda response, row=entry: row['httpErrors'].append({'url': response.url, 'status': response.status}) if response.status >= 400 and not response.url.endswith('/favicon.ico') else None)
                p.on('requestfailed', lambda request, row=entry: row['cancelledRequests'].append({'url': request.url, 'error': request.failure}))
                try:
                    p.goto(base, wait_until='networkidle');p.wait_for_function('GameSession.canWrite()')
                    p.evaluate("saveChange(d=>{d.tutorialComplete=true;d.coins=400});restartTo('lobby');renderMeta()")
                    p.locator('#asset-lobby-host .a-settings').click();p.locator('#language-' + lang).click()
                    p.locator('#shared-menu-confirm').click()
                    assert p.locator('html').get_attribute('lang') == lang
                    entry['checks'].append('native language selection')

                    p.locator('#asset-lobby-host [data-proxy="#shop-open"]').click()
                    p.locator('#asset-shop-host [data-tab="items"]').click()
                    before = p.evaluate('({coins:meta.coins,item:meta.items.grade})')
                    p.locator('#asset-shop-host [data-item="grade"]').click()
                    assert p.evaluate('meta.items.grade') == before['item'] + 1
                    assert p.evaluate('meta.coins') == before['coins'] - p.evaluate('itemCatalog.grade.price')
                    p.locator('#asset-shop-host .close').click()
                    entry['checks'].append('native item purchase and exact wallet debit')

                    p.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
                    p.locator('#asset-roster-host [data-group="merc"]').click()
                    assert p.locator('#asset-roster-host .r-card').count() == 7
                    p.locator('#asset-roster-host .r-close').click()
                    p.locator('#asset-lobby-host [data-proxy="#training-entry"]').click()
                    before = p.evaluate('({coins:meta.coins,level:meta.training.staff,cost:trainingCost(meta.training.staff)})')
                    p.locator('#asset-training-host #upgrade').click()
                    assert p.evaluate('meta.training.staff') == before['level'] + 1
                    assert p.evaluate('meta.coins') == before['coins'] - before['cost']
                    p.locator('#asset-training-host .back').click();p.wait_for_function('!trainingHistoryPending')
                    entry['checks'].append('support archive and exact training purchase')

                    enter_preparation(p, touch=True)
                    for _ in range(5):p.locator('#summon').tap()
                    p.wait_for_function('playing&&wave===1')
                    assert p.evaluate('board.filter(Boolean).length') == 5
                    p.locator('#pause').tap();assert p.evaluate('paused')
                    p.locator('#pause-continue').tap();assert not p.evaluate('paused')
                    index = p.evaluate('board.findIndex(Boolean)')
                    pos = board_point(p, p.evaluate('i=>cells[i]', index));p.touchscreen.tap(pos['x'], pos['y'])
                    p.locator('#board-trash').tap()
                    assert p.evaluate('board.filter(Boolean).length') == 4
                    # Discard itself must not credit SP; combat income may continue.
                    assert p.evaluate('board[' + str(index) + ']') is None
                    saved = p.evaluate('({wave,coins:meta.coins})')
                    p.reload(wait_until='networkidle');p.wait_for_function('GameSession.canWrite()')
                    p.locator('#asset-lobby-host [data-proxy="#resume-run"]').tap()
                    assert p.evaluate('board.filter(Boolean).length') == 4
                    assert p.evaluate('wave') == saved['wave']
                    assert p.evaluate('meta.coins') == saved['coins']
                    p.locator('#guide-next').tap()
                    entry['checks'].append('five native summons, pause, discard and reload/resume')

                    p.evaluate("wave=10;queue=[];enemies=[];paused=true;bonusPending=true;rewardBundle=makeRewardOffers();renderPerkChoices();document.querySelector('#perk').showModal();sync()")
                    p.wait_for_function('!document.querySelector("#roulette-claim").disabled')
                    assert p.locator('#perk-options [data-winner=true]').count() == 1
                    if round_index in (0, 5):p.screenshot(path=str(args.out / f'{lang}-{width}-roulette.png'))
                    p.locator('#roulette-claim').tap()
                    assert p.evaluate('wave') == 11 and not p.evaluate('bonusPending')
                    assert not p.evaluate('RewardRoulette.take()')
                    entry['checks'].append('saved roulette winner, native claim, duplicate rejection')

                    p.evaluate('life=0;update(1/60);sync()')
                    p.locator('#result').wait_for(state='visible')
                    coins = p.evaluate('meta.coins')
                    assert '무사히' not in p.locator('#result-title-badge').inner_text()
                    p.locator('#result-home').tap();p.reload(wait_until='networkidle')
                    p.wait_for_function('GameSession.canWrite()')
                    assert p.evaluate('meta.coins') == coins
                    entry['checks'].append('defeat, settlement, native return and reload without double payment')
                    assert not entry['pageErrors'], entry['pageErrors']
                    assert not entry['httpErrors'], entry['httpErrors']
                    assert all(x['error'] == 'net::ERR_ABORTED' for x in entry['cancelledRequests']), entry['cancelledRequests']
                    entry['status'] = 'passed'
                except Exception as error:
                    entry['status'] = 'failed';entry['error'] = repr(error)
                    p.screenshot(path=str(args.out / f'round-{round_index+1}-FAILED.png'))
                finally:
                    context.close();save()
                print(json.dumps({'round': entry['round'], 'status': entry['status'], 'checks': len(entry['checks']), 'error': entry.get('error')}, ensure_ascii=False), flush=True)
        finally:
            browser.close()
finally:
    server.shutdown();server.server_close()
report['passed'] = sum(r['status'] == 'passed' for r in report['rounds']);save()
raise SystemExit(0 if report['passed'] == 10 else 1)
