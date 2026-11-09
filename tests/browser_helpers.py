"""Shared real controls for the five-summon start and first-run coach."""
import os
from pathlib import Path


def chromium_options():
    executable = os.environ.get('UI_CHROMIUM_PATH')
    if executable is None and Path('/usr/bin/chromium').exists():
        executable = '/usr/bin/chromium'
    return dict(args=['--no-sandbox'], **({'executable_path': executable} if executable else {}))


def game_root():
    return os.environ.get('UI_GAME_ROOT', str(Path(__file__).resolve().parents[1]))


def dismiss_coach(page, touch=False):
    action = 'tap' if touch else 'click'
    while page.evaluate('TutorialCoach.speaking()'):
        getattr(page.locator('#coach-next'), action)()


def enter_preparation(page, touch=False):
    action = 'tap' if touch else 'click'
    getattr(page.locator('#asset-lobby-host [data-proxy="#enter-battle"]'), action)()
    getattr(page.locator('#promo-skip'), action)()
    dismiss_coach(page, touch)


def start_battle(page, touch=False):
    enter_preparation(page, touch)
    for _ in range(5):
        getattr(page.locator('#summon'), 'tap' if touch else 'click')()
    page.wait_for_function('playing && wave === 1')
    dismiss_coach(page, touch)


def board_point(page, cell):
    return page.evaluate("""p=>{
        if(window.BattlePresentation?.enabled)return BattlePresentation.screenPoint(p);
        const r=document.querySelector('#game').getBoundingClientRect();
        return {x:r.x+p.x*r.width/600,y:r.y+p.y*r.height/600};
    }""", cell)
