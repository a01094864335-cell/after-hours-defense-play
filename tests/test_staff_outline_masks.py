"""Real Chromium staff outline coverage, not an artwork quality approval.

Draw all 102 poses through production Motion.draw at board and cutin sizes.
The isolated gallery is not a live gameplay screenshot. Set
OUTLINE_REQUIRE_FULL=1 to require all 13 masked characters in final CI.
"""
import json
import os
from pathlib import Path
import unittest
import test_usability as ui


class StaffOutlineBrowserTests(unittest.TestCase):
    setUpClass = classmethod(ui.UsabilityTests.setUpClass.__func__)
    tearDownClass = classmethod(ui.UsabilityTests.tearDownClass.__func__)

    def open_fixture(self):
        context = self.browser.new_context(viewport={'width': 1440, 'height': 820}, device_scale_factor=1)
        self.addCleanup(context.close)
        page = context.new_page()
        self.errors = []
        page.on('pageerror', lambda error: self.errors.append(str(error)))
        page.goto(f'http://127.0.0.1:{self.server.server_port}/?gm=1&coins=400', wait_until='networkidle')
        page.wait_for_function("typeof Motion !== 'undefined' && typeof StaffOutlineMasks !== 'undefined'")
        page.evaluate("""async()=>{
          for(const [key,data] of Object.entries(Motion.sheets)){
            if(data.group!=='staff')continue;
            const image=Motion.preload(key);
            if(!image.complete)await new Promise((resolve,reject)=>{
              image.addEventListener('load',resolve,{once:true});
              image.addEventListener('error',()=>reject(new Error('Staff atlas failed: '+key)),{once:true});
            });
            if(!image.naturalWidth)throw new Error('Empty staff atlas: '+key);
          }
        }""")
        self.out = Path(os.environ.get('OUTLINE_QA_DIR', '/tmp/outline-qa'))
        self.out.mkdir(parents=True, exist_ok=True)
        return page

    def test_all_102_poses_render_at_board_and_cutin_sizes(self):
        page = self.open_fixture()
        coverage = page.evaluate("""()=>{
          const staff=Object.keys(Motion.sheets).filter(k=>Motion.sheets[k].group==='staff');
          return {staff,masked:Object.keys(StaffOutlineMasks.characters),
            maskRevision:StaffOutlineMasks.sha256,
            matching:Object.entries(StaffOutlineMasks.characters).every(([k,m])=>m.frames.length===6&&m.sourceSha256===Motion.sheets[k].sha256),
            path2D:typeof Path2D==='function'};
        }""")
        self.assertEqual(len(coverage['staff']), 17)
        self.assertTrue(coverage['matching'])
        self.assertTrue(coverage['path2D'])
        self.assertGreater(len(coverage['masked']), 0)
        if os.environ.get('OUTLINE_REQUIRE_FULL') == '1':
            self.assertEqual(len(coverage['masked']), 13)
        report = {'sourceCommit': os.environ.get('GITHUB_SHA', 'local-uncommitted'),
                  'fixture': 'Production Motion.draw in Chromium; isolated pose gallery, not gameplay screenshot',
                  'coverage': coverage, 'renders': [], 'screenshots': []}
        for key in coverage['staff']:
            result = page.evaluate("""key=>{
              document.querySelector('#outline-browser-gallery')?.remove();
              const gallery=document.createElement('canvas');gallery.id='outline-browser-gallery';
              gallery.width=1440;gallery.height=760;
              Object.assign(gallery.style,{position:'fixed',left:'0',top:'0',zIndex:'2147483647',width:'1440px',height:'760px'});
              document.body.appendChild(gallery);
              const g=gallery.getContext('2d');g.fillStyle='#456d91';g.fillRect(0,0,1440,760);g.fillStyle='white';g.font='16px sans-serif';
              const data=Motion.sheets[key],bp=window.BattlePresentation,a=bp.axes(390,390),row=(a.y[1][3]-a.y[1][2])/3;
              const cell=(bp.project({x:490,y:0},390,390).x-bp.project({x:110,y:0},390,390).x)/5;
              const boardSize=bp.staffSize(data,row,cell),out=[];
              const hasMask=StaffOutlineMasks.characters[key]?.sourceSha256===data.sha256;
              const missing=['electric-technician','mimic-storekeeper','spider-tailor','chalkak-photographer'].includes(key);
              const boardOptions=hasMask||missing?{outline:1.25}:{};
              for(let pose=0;pose<6;pose++){
                const x=pose%3*480,y=Math.floor(pose/3)*380;
                g.fillText(key+' · pose '+pose+' · candidate',x+12,y+24);
                Motion.draw(g,key,x+240,y+260,200,pose);
                g.fillText('390px board geometry',x+12,y+300);
                Motion.draw(g,key,x+240,y+365,boardSize,pose,boardOptions);
                for(const [mode,size,options] of [['board',boardSize,boardOptions],['cutin',200,{}]]){
                  const c=document.createElement('canvas');c.width=c.height=512;
                  const ctx=c.getContext('2d');const drawn=Motion.draw(ctx,key,256,480,size,pose,options);
                  const pixels=ctx.getImageData(0,0,512,512).data;
                  let opaque=0,left=512,right=-1,top=512,bottom=-1;
                  for(let i=3;i<pixels.length;i+=4)if(pixels[i]>127){const index=(i-3)/4,px=index%512,py=Math.floor(index/512);opaque++;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py)}
                  out.push({key,pose,mode,size,drawn,opaque,bounds:{left,right,top,bottom}});
                }
              }
              return out;
            }""", key)
            report['renders'].extend(result)
            for row in result:
                self.assertTrue(row['drawn'], row)
                self.assertGreater(row['opaque'], 30, row)
                self.assertGreaterEqual(row['bounds']['left'], 2, row)
                self.assertLessEqual(row['bounds']['right'], 509, row)
                self.assertGreaterEqual(row['bounds']['top'], 2, row)
                self.assertLessEqual(row['bounds']['bottom'], 509, row)
            screenshot = f'{key}-six-poses.png'
            page.locator('#outline-browser-gallery').screenshot(path=str(self.out / screenshot))
            report['screenshots'].append(screenshot)
        report['pageErrors'] = self.errors
        (self.out / 'pose-render-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        self.assertEqual(len(report['renders']), 204)
        self.assertEqual(self.errors, [])

    def test_fifteen_character_board_reuses_warm_display_masks(self):
        page = self.open_fixture()
        result = page.evaluate("""()=>{
          const keys=Object.keys(Motion.sheets).filter(k=>Motion.sheets[k].group==='staff').slice(0,15);
          const target=document.createElement('canvas');target.width=target.height=256;const ctx=target.getContext('2d');
          const bp=window.BattlePresentation,a=bp.axes(390,390),row=(a.y[1][3]-a.y[1][2])/3;
          const cell=(bp.project({x:490,y:0},390,390).x-bp.project({x:110,y:0},390,390).x)/5;
          const original=document.createElement;let created=0;
          document.createElement=function(tag,...args){if(String(tag).toLowerCase()==='canvas')created++;return original.call(this,tag,...args)};
          function batch(){for(const key of keys){ctx.clearRect(0,0,256,256);Motion.draw(ctx,key,128,220,bp.staffSize(Motion.sheets[key],row,cell),3,{outline:1.25})}}
          try{const start=performance.now();batch();const coldMs=performance.now()-start,coldCreated=created;
            const warmStart=performance.now();for(let i=0;i<10;i++)batch();
            return {characters:keys.length,coldCreated,warmCreated:created-coldCreated,coldMs,warmTenBatchesMs:performance.now()-warmStart};
          }finally{document.createElement=original}
        }""")
        (self.out / 'cache-report.json').write_text(json.dumps(result, indent=2))
        self.assertEqual(result['characters'], 15)
        self.assertGreater(result['coldCreated'], 0)
        self.assertEqual(result['warmCreated'], 0, result)
        self.assertEqual(self.errors, [])


if __name__ == '__main__':
    unittest.main()
