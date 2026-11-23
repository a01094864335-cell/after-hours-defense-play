"""Progression rewards, recovery discounts, and speed controls."""
import unittest
from browser_helpers import enter_preparation, start_battle
import test_usability as ui

class BalanceTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    inside=ui.UsabilityTests.inside
    def normal(self):
        # Base-economy assertions must not inherit the calendar's daily modifier.
        a=self.open(390,844);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset();dailyEnabled=false;playing=true;wave=5;sync()');return a
    def reward(self,a,w,winner=None):
        a.evaluate("w=>{rewardBundle=null;wave=w;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal()}",w)
        if winner and a.evaluate("rewardBundle.mode==='choice'"):
            a.locator('#perk-'+winner).click()
        elif winner:
            a.evaluate("id=>{rewardBundle.winner=rewardBundle.offers.findIndex(o=>o.id===id);RewardRoulette.render()}",winner)
        a.wait_for_function("!document.querySelector('#roulette-claim').disabled")
    def test_rewards_increase_and_sp_keeps_up_with_summon_cost(self):
        a=self.normal()
        tiers=a.evaluate('()=>[5,10,15,20,30].map(w=>{wave=w;return perkReward()})')
        self.assertEqual([r['merges'] for r in tiers],[1,1,2,1,1])
        self.assertEqual([r['pip'] for r in tiers[2:]],[3,3,5])
        self.assertEqual([r['summons'] for r in tiers],[2,3,4,5,5])
        a.evaluate('cost=500;sp=0');self.reward(a,20,'sp');amount=a.evaluate('perkReward().sp');a.locator('#roulette-claim').click()
        self.assertEqual(a.evaluate('sp'),amount);self.assertFalse(a.evaluate('bonusPending'))
        self.assertFalse(a.evaluate("choosePerk('sp')"));self.assertEqual(a.evaluate('sp'),amount)
        self.assertEqual(amount,700)
        a.evaluate('for(let i=0;i<5;i++)summon()');self.assertEqual(a.evaluate('[sp,cost]'),[0,550])
    def test_guarantees_are_counted_and_survive_reload(self):
        a=self.normal();a.evaluate('guaranteedMerge=1');self.reward(a,5,'merge');a.locator('#roulette-claim').click()
        self.assertEqual(a.evaluate('guaranteedMerge'),2)
        a.evaluate('board[0]={type:0,pip:1};board[1]={type:0,pip:1};paused=false;merge(0,1);saveActiveRun()')
        self.assertEqual(a.evaluate('guaranteedMerge'),1)
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()')
        self.assertEqual(a.evaluate('guaranteedMerge'),1)
        a.evaluate("document.querySelector('#guide').close();paused=false;board[2]={type:0,pip:1};board[3]={type:0,pip:1};merge(2,3)")
        self.assertEqual(a.evaluate('guaranteedMerge'),0)
    def test_late_rewards_bind_staff_and_equipment_without_spend(self):
        a=self.normal();a.evaluate('board[0]={type:0,pip:1}');self.reward(a,10,'equipment')
        target=a.evaluate("rewardBundle.offers.find(o=>o.id==='equipment').type")
        a.locator('#roulette-claim').click();self.assertFalse(a.evaluate('bonusPending'))
        self.assertEqual(a.evaluate(f'levels[{target}]'),2);self.assertEqual(a.evaluate('sp'),150)
        self.reward(a,25,'staff');a.locator('#roulette-claim').click()
        self.assertTrue(a.evaluate('board.some(u=>u&&u.pip===4&&runDeck.includes(u.type))'))
    def test_unavailable_rewards_and_invalid_targets_do_not_consume_choice(self):
        a=self.normal();a.evaluate('life=1');self.reward(a,10,'life');a.locator('#roulette-claim').click();self.assertEqual(a.evaluate('life'),2)
        self.reward(a,5,'sp');self.assertFalse(a.evaluate("choosePerk('equipment',runDeck[0])"));self.assertFalse(a.evaluate("choosePerk('unknown')"))
        a.locator('#roulette-claim').click();self.reward(a,25,'sp');self.assertFalse(a.evaluate("choosePerk('staff',999)"))
        a.locator('#roulette-claim').click();a.evaluate('board=Array.from({length:15},()=>({type:0,pip:7}));levels.fill(5);guaranteedMerge=3;life=3');self.reward(a,30)
        self.assertEqual(a.locator('#perk-options > button:visible:disabled').count(),3)
        self.assertFalse(a.locator('#perk-staff').is_visible());self.assertFalse(a.locator('#perk-equipment').is_visible());self.assertTrue(a.evaluate('bonusPending'))
    def test_late_reward_choices_fit_short_phone(self):
        a=self.open(320,568);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset();playing=true;wave=20;sync()');self.reward(a,20)
        self.inside(a,'#perk');self.assertEqual(a.locator('#perk-options > button:visible').count(),3)
        for card in a.locator('#perk-options > button:visible').all():
            card.scroll_into_view_if_needed();self.assertTrue(card.is_disabled())
        self.assertTrue(a.locator('#perk-targets').is_hidden())
    def fail_merge(self,a):
        a.evaluate('''()=>{paused=false;guaranteedMerge=0;board[0]={type:0,pip:1};board[1]={type:0,pip:1};const original=Math.random;try{Math.random=()=>0;merge(0,1)}finally{Math.random=original}}''')
    def test_merge_refund_is_immediate_and_price_stays_stable(self):
        a=self.normal();a.evaluate('cost=100;sp=50');self.fail_merge(a)
        self.assertFalse(a.evaluate('summonDiscount'));self.assertEqual(a.evaluate('summonPrice()'),40)
        self.assertEqual(a.evaluate('sp'),60)
        self.assertNotIn('반값',a.locator('#summon').inner_text())
        a.evaluate('summon()');self.assertEqual(a.evaluate('[sp,cost,summonDiscount]'),[20,110,False])
        self.assertEqual(a.evaluate('summonPrice()'),40)
    def test_invalid_merge_and_blocked_summon_never_grant_refund(self):
        a=self.normal();a.evaluate('cost=100;sp=1;board=Array(15).fill(null);summon();merge(0,0)')
        self.assertEqual(a.evaluate('[sp,cost]'),[1,100])
        a.evaluate('sp=500;board=Array.from({length:15},()=>({type:0,pip:1}));summon();merge(0,0)')
        self.assertEqual(a.evaluate('[sp,cost]'),[500,100])
    def test_legacy_coupon_converts_once_and_current_refund_survives_reload(self):
        a=self.normal();a.evaluate('dailyEnabled=false;const legacy=runSnapshot();delete legacy.economyVersion;legacy.summonDiscount=true;legacy.cost=100;legacy.sp=50;applySnapshot(legacy)')
        self.assertEqual(a.evaluate('sp'),100);self.assertFalse(a.evaluate('summonDiscount'))
        a.evaluate('const migrated=runSnapshot();applySnapshot(migrated)')
        self.assertEqual(a.evaluate('sp'),100)
        a.evaluate('paused=false');self.fail_merge(a)
        before=a.evaluate('sp');a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()')
        self.assertEqual(a.evaluate('sp'),before)
    def test_speed_cycles_to_three_preserves_pause_and_reloads(self):
        a=self.open(390,844);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset()');start_battle(a)
        for expected in [2,3,1,2,3]:
            a.locator('#speed').click();self.assertEqual(a.evaluate('speed'),expected);self.assertFalse(a.evaluate('paused'))
            self.assertEqual(a.locator('#speed').get_attribute('aria-label'),'전투 속도 '+str(expected)+'배 · 변경')
        a.evaluate("paused=true;speed=2;sync();document.querySelector('#speed').click()");self.assertTrue(a.evaluate('paused'));a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()');self.assertEqual(a.evaluate('speed'),3)
        self.assertTrue(a.evaluate('paused'))
        dt=a.evaluate("()=>{let observed;GamePerformance.resetSimulation();GamePerformance.advance(1/60,speed,d=>{observed=d});return observed}")
        self.assertAlmostEqual(dt,.05)
