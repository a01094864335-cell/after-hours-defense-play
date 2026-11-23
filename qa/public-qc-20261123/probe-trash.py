import sys,json
sys.path.insert(0,'tests')
from test_duty_patch import DutyPatchTests
from browser_helpers import board_point
DutyPatchTests.setUpClass(); t=DutyPatchTests(); records=[]
try:
 for i in range(80):
  p=t.open(390,844);t.battle(p)
  p.evaluate("window.events=[];for(const k of ['pointerdown','pointermove','pointerup','lostpointercapture','pointercancel'])document.addEventListener(k,e=>events.push({k,id:e.pointerId,primary:e.isPrimary,button:e.button,x:e.clientX,y:e.clientY,target:e.target.id,drag:drag&&{from:drag.from,pointerId:drag.pointerId,moved:drag.moved}}),true)")
  pos=board_point(p,p.evaluate('cells[0]'));r0=p.locator('#game').bounding_box();p.mouse.move(pos['x'],pos['y']);p.mouse.down();p.mouse.move(pos['x']+15,pos['y']+15,steps=3)
  r=p.locator('#board-trash').bounding_box()
  if r is None:
   data=p.evaluate('({events,drag,selected,board,ended,paused,appScreen})');data.update(i=i,pos=pos,rectBefore=r0,rectAfter=p.locator('#game').bounding_box());records.append(data);print(json.dumps(data),flush=True)
  else:
   p.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2,steps=8);p.mouse.up()
   if p.evaluate('!!board[0]'):print('UNREMOVED',i,flush=True)
  p.context.close()
 print('failures',len(records),flush=True)
finally:DutyPatchTests.tearDownClass()
