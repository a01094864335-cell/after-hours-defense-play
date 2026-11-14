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
    def reward(self,a,w):
        a.evaluate("w=>{wave=w;bonusPending=true;paused=true;renderPerkChoices();document.querySelector('#perk').showModal()}",w)
    def test_rewards_increase_and_sp_keeps_up_with_summon_cost(self):
        a=self.normal()
        tiers=a.evaluate('()=>[5,10,15,20,30].map(w=>{wave=w;return perkReward()})')
        self.assertEqual([r['merges'] for r in tiers],[1,1,2,1,1])
        self.assertEqual([r['pip'] for r in tiers[2:]],[3,3,5])
        self.assertEqual([r['summons'] for r in tiers],[2,3,4,5,5])
        a.evaluate('cost=500;sp=0');self.reward(a,20);amount=a.evaluate('perkReward().sp');a.locator('#perk-sp').click()
        self.assertEqual(a.evaluate('sp'),amount);self.assertFalse(a.evaluate('bonusPending'))
        self.assertFalse(a.evaluate("choosePerk('sp')"));self.assertEqual(a.evaluate('sp'),amount)
        self.assertEqual(amount,2600)
        a.evaluate('for(let i=0;i<5;i++)summon()');self.assertEqual(a.evaluate('[sp,cost]'),[0,550])
    def test_guarantees_are_counted_and_survive_reload(self):
        a=self.normal();a.evaluate('guaranteedMerge=1');self.reward(a,5);a.locator('#perk-merge').click()
        self.assertEqual(a.evaluate('guaranteedMerge'),2)
        a.evaluate('board[0]={type:0,pip:1};board[1]={type:0,pip:1};paused=false;merge(0,1);saveActiveRun()')
        self.assertEqual(a.evaluate('guaranteedMerge'),1)
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()')
        self.assertEqual(a.evaluate('guaranteedMerge'),1)
        a.evaluate("document.querySelector('#guide').close();paused=false;board[2]={type:0,pip:1};board[3]={type:0,pip:1};merge(2,3)")
        self.assertEqual(a.evaluate('guaranteedMerge'),0)
    def test_late_rewards_bind_staff_and_equipment_without_spend(self):
        a=self.normal();self.reward(a,10)
        target=a.evaluate("rewardBundle.offers.find(o=>o.id==='equipment').type")
        a.locator('#perk-equipment').click();self.assertFalse(a.evaluate('bonusPending'))
        self.assertEqual(a.evaluate(f'levels[{target}]'),2);self.assertEqual(a.evaluate('sp'),150)
        self.reward(a,25);a.locator('#perk-staff').click()
        self.assertTrue(a.evaluate('board.some(u=>u&&u.pip===4&&runDeck.includes(u.type))'))
    def test_unavailable_rewards_and_invalid_targets_do_not_consume_choice(self):
        a=self.normal();a.evaluate('life=1');self.reward(a,10);a.locator('#perk-life').click();self.assertEqual(a.evaluate('life'),2)
        self.reward(a,5);self.assertFalse(a.evaluate("choosePerk('equipment',runDeck[0])"));self.assertFalse(a.evaluate("choosePerk('unknown')"))
        a.locator('#perk-sp').click();self.reward(a,25);self.assertFalse(a.evaluate("choosePerk('staff',999)"))
        a.locator('#perk-sp').click();a.evaluate('board=Array.from({length:15},()=>({type:0,pip:7}));levels.fill(5);guaranteedMerge=3;life=3');self.reward(a,30)
        self.assertEqual(a.locator('#perk-options > button:visible:enabled').count(),3)
        self.assertFalse(a.locator('#perk-staff').is_visible());self.assertFalse(a.locator('#perk-equipment').is_visible());self.assertTrue(a.evaluate('bonusPending'))
    def test_late_reward_choices_fit_short_phone(self):
        a=self.open(320,568);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset();playing=true;wave=20;sync()');self.reward(a,20)
        self.inside(a,'#perk');self.assertEqual(a.locator('#perk-options > button:visible').count(),3)
        for card in a.locator('#perk-options > button:visible').all():
            card.scroll_into_view_if_needed();self.assertTrue(card.is_enabled())
        self.assertTrue(a.locator('#perk-targets').is_hidden())
    def fail_merge(self,a):
        a.evaluate('''()=>{paused=false;guaranteedMerge=0;board[0]={type:0,pip:1};board[1]={type:0,pip:1};const original=Math.random;try{Math.random=()=>0;merge(0,1)}finally{Math.random=original}}''')
    def test_failure_discounts_only_next_successful_summon_and_preserves_base_growth(self):
        a=self.normal();a.evaluate('cost=100;sp=50');self.fail_merge(a)
        self.assertTrue(a.evaluate('summonDiscount'));self.assertEqual(a.evaluate('summonPrice()'),50)
        self.assertIn('반값',a.locator('#summon').inner_text());self.assertFalse(a.locator('#summon').is_disabled())
        a.evaluate('summon()');self.assertEqual(a.evaluate('[sp,cost,summonDiscount]'),[0,110,False])
        self.assertEqual(a.evaluate('summonPrice()'),110)
    def test_unaffordable_full_board_or_invalid_merge_keep_discount_and_failures_do_not_stack(self):
        a=self.normal();a.evaluate('cost=100;sp=49');self.fail_merge(a);self.fail_merge(a)
        a.evaluate('summon()');self.assertEqual(a.evaluate('[sp,cost,summonDiscount]'),[49,100,True])
        self.assertEqual(a.evaluate('summonPrice()'),50)
        a.evaluate('sp=500;board=Array.from({length:15},()=>({type:0,pip:1}));summon();merge(0,0)')
        self.assertEqual(a.evaluate('[sp,cost,summonDiscount]'),[500,100,True])
    def test_discount_reloads_and_legacy_snapshot_defaults_to_no_discount(self):
        a=self.normal();self.fail_merge(a);a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()')
        self.assertTrue(a.evaluate('summonDiscount'))
        a.evaluate('const legacy=runSnapshot();delete legacy.summonDiscount;legacy.guaranteedMerge=true;applySnapshot(legacy)')
        self.assertFalse(a.evaluate('summonDiscount'));self.assertEqual(a.evaluate('guaranteedMerge'),1)
        a.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close());ended=false;runReward=null;reset()")
        self.assertFalse(a.evaluate('summonDiscount'))
    def test_speed_cycles_to_three_preserves_pause_and_reloads(self):
        a=self.open(390,844);a.evaluate('saveChange(d=>{d.tutorialComplete=true});reset()');start_battle(a)
        for expected in [2,3,1,2,3]:
            a.locator('#speed').click();self.assertEqual(a.evaluate('speed'),expected);self.assertFalse(a.evaluate('paused'))
            self.assertEqual(a.locator('#speed').get_attribute('aria-label'),'전투 속도 '+str(expected)+'배 · 변경')
        a.evaluate("paused=true;speed=2;sync();document.querySelector('#speed').click()");self.assertTrue(a.evaluate('paused'));a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()');a.evaluate('resumeRun()');self.assertEqual(a.evaluate('speed'),3)
        self.assertTrue(a.evaluate('paused'))
        dt=a.evaluate("()=>{let observed;GamePerformance.resetSimulation();GamePerformance.advance(1/60,speed,d=>{observed=d});return observed}")
        self.assertAlmostEqual(dt,.05)
