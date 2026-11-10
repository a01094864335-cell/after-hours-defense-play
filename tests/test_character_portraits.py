"""Characters keep the same visual identity when moving between real game screens."""
import unittest
import test_usability as ui


class CharacterPortraitTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)
    open = ui.UsabilityTests.open

    def seed(self, page):
        page.evaluate('''()=>{meta.tutorialComplete=true;meta.staff=kinds.map(k=>k.file);
          meta.owned=Object.keys(mercCatalog);restartTo('lobby');renderMeta()}''')

    def test_every_staff_keeps_identity_between_party_roster_and_training(self):
        page = self.open(390, 844)
        self.seed(page)
        for offset in range(0, 17, 5):
            page.evaluate('''offset=>{const all=kinds.map(k=>k.file);meta.deck=Array.from({length:5},(_,i)=>all[(offset+i)%all.length]);renderMeta()}''', offset)
            expected = page.locator('#asset-lobby-host .a-member img').evaluate_all('(xs)=>xs.map(x=>x.src)')
            self.assertEqual(len(expected), 5)
            self.assertTrue(all('/character-portraits/' in path for path in expected))
            page.locator('#asset-lobby-host [data-proxy="#roster-open"]').click()
            actual = page.locator('#asset-roster-host #r-team img').evaluate_all('(xs)=>xs.map(x=>x.src)')
            self.assertEqual(actual, expected)
            page.locator('#asset-roster-host .r-close').click()
        page.locator('#asset-lobby-host [data-proxy="#training-entry"]').click()
        self.assertEqual(page.locator('#asset-training-host #effects summary img').count(), 17)
        faces = page.locator('#asset-training-host #effects summary img').evaluate_all('(xs)=>xs.map(x=>({id:x.dataset.characterId,src:x.getAttribute("src")}))')
        expected = page.evaluate('kinds.map(k=>staffRecords.find(r=>r.id===k.file).image)')
        self.assertEqual([x['src'] for x in faces], expected)
        page.locator('#asset-training-host .close').click()
        page.evaluate("document.querySelector('#roster-open').click();showStaffRecord('gobi')")
        self.assertTrue(page.locator('#roster-detail .dossier-hero img').get_attribute('src').endswith('/gobi.webp'))
        self.assertEqual(page.locator('#roster-detail .dossier-hero canvas').count(), 0)

    def test_all_support_choices_use_the_same_face_in_lobby_and_training(self):
        page = self.open(320, 568)
        self.seed(page)
        for key in page.evaluate('Object.keys(mercCatalog)'):
            page.evaluate('key=>{meta.equipped=key;renderMeta()}', key)
            path = page.locator('#asset-lobby-host #a-support-art img').get_attribute('src')
            self.assertTrue(path.endswith('/merc-' + key + '.webp'))
        page.locator('#asset-lobby-host [data-proxy="#training-entry"]').click()
        page.locator('#asset-training-host [data-group="merc"]').click()
        self.assertEqual(page.locator('#asset-training-host #effects summary img').count(), 7)
        actual = page.locator('#asset-training-host #effects summary img').evaluate_all('(xs)=>xs.map(x=>x.getAttribute("src"))')
        expected = page.evaluate('Object.keys(mercCatalog).map(id=>staffRecords.find(r=>r.id==="merc-"+id).image)')
        self.assertEqual(actual, expected)
        page.locator('#asset-training-host .close').click()
        page.evaluate("revealRecruit('merc-ward',false);HiringStories.close()")
        self.assertEqual(page.locator('#recruit-dialog .recruit-reveal img').get_attribute('src'), expected[0])

    def test_battle_draws_canonical_heads_without_changing_cell_coordinates(self):
        page = self.open(390, 844)
        self.seed(page)
        result = page.evaluate('''async()=>{
          const before=JSON.stringify(cells),unit={type:3,pip:5,cool:1,attack:0,arrival:0,income:5,skillCD:12};
          await Promise.all(CharacterPortraits.ids.map(id=>{const img=CharacterPortraits.image(id);return img.decode()}));
          reset();tutorialMode=false;setScreen('battle');board[7]=unit;selected=7;playing=true;paused=false;sync();
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const drawn=[],original=CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage=function(img,...args){if(this.canvas.id==='battle-paint'&&img.src)drawn.push(img.src);return original.call(this,img,...args)};
          try{draw()}finally{CanvasRenderingContext2D.prototype.drawImage=original}
          return {sameCells:JSON.stringify(cells)===before,head:drawn.some(x=>x.endsWith('/character-portraits/gobi.webp')),selected:document.querySelector('#battle-selected-portrait').getAttribute('src'),staffCount:board.filter(Boolean).length};
        }''')
        self.assertTrue(result['sameCells'])
        self.assertTrue(result['head'])
        self.assertTrue(result['selected'].endswith('/character-portraits/gobi.webp'))
        self.assertEqual(result['staffCount'], 1)
