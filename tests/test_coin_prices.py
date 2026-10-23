"""Purchase balances and existing ownership after the coin price update."""
import unittest
import test_usability as ui
class CoinPriceTests(unittest.TestCase):
    setUpClass=classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass=classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open=ui.UsabilityTests.open
    def test_updated_purchases_charge_once_and_persist(self):
        a=self.open(390,844)
        a.evaluate("saveChange(d=>d.coins=1000);buyItem('grade');buyItem('kind');buyItem('king');buyMerc('ward');buyMerc('accountant');buyMerc('rescue');buyStaffPack()")
        expected={'coins':180,'items':{'grade':1,'kind':1,'king':1},'owned':['ward','accountant','rescue']}
        self.assertEqual(a.evaluate('({coins:meta.coins,items:meta.items,owned:meta.owned})'),expected)
        a.reload(wait_until='networkidle');a.wait_for_function('GameSession.canWrite()')
        self.assertEqual(a.evaluate('({coins:meta.coins,items:meta.items,owned:meta.owned})'),expected)
        a.evaluate("buyMerc('ward');buyMerc('ward')");self.assertEqual(a.evaluate('meta.coins'),180)
    def test_insufficient_pack_balance_and_displayed_price_agree(self):
        a=self.open(320,568);a.evaluate('saveChange(d=>d.coins=119);renderMeta()');a.locator('#shop-open').click()
        self.assertEqual(a.locator('#staff-pack-price').inner_text(),'120 코인');self.assertTrue(a.locator('#buy-staff-pack').is_disabled())
        a.evaluate('buyStaffPack()');self.assertEqual(a.evaluate('meta.coins'),119)
