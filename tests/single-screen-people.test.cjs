'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('single-screen-people.js','utf8'),css=fs.readFileSync('single-screen-people.css','utf8');
test('people presentation retains native controls and training state authority',()=>{
 assert(!/localStorage|\.onclick\s*=|showModal\(|pushState\(|trainGroup\(|cloneNode|innerHTML\s*=/.test(js));
 assert(js.includes("detail.querySelectorAll('.staff-action, #detail-action-status')"));
 assert(js.includes('actions.append('));assert(js.includes("document.getElementById('training-dialog')"));
 assert(js.includes('link[href*="single-screen-people.css"]'));
});
test('dossier classifies existing nested growth and story disclosures',()=>{
 for(const selector of ['.live-biography','.live-training-details','.hire-record','.dossier-foot'])assert(js.includes(selector),selector);
 assert(js.includes('disclosure.open=true'));assert(js.includes('body.replaceChildren(main,growth,story)'));
 assert(css.includes('.ss-dossier :is(.live-biography,.live-training-details)>summary'));
});
test('people tabs support accessible keyboard navigation and hidden panels',()=>{
 for(const token of ['tablist','tabpanel','aria-controls','aria-selected','aria-labelledby','ArrowRight','ArrowLeft','Home','End'])assert(js.includes(token),token);
 assert(js.includes('button.tabIndex=i===index?0:-1'));assert(js.includes('panels[i].hidden=i!==index'));
 assert(js.includes('window.GameLanguage?.subscribe(translate)'));
 assert(css.includes('min-height:44px!important'));
});
test('training keeps summary separate from effects and supports large fonts',()=>{
 assert(js.includes('if(!scroll||!paper||!effectsTitle||!effectsList||!stage)return'));
 assert(js.includes('effects.append(effectsTitle,effectsList)'));assert(js.includes('paper.prepend(stage)'));
 assert(css.includes('.ss-training [hidden]{display:none!important}'));
 assert(js.includes('new ResizeObserver(fitSurfaces)'));assert(js.includes('fontSize) > 28'));
 assert(css.includes('ss-people-reflow{overflow:auto!important}'));
});
test('new training illustration only fills spare room and cannot become a control',()=>{
 assert(js.includes("yard.setAttribute('aria-hidden','true')"));
 assert(css.includes("assets/single-screen/training-yard.webp"));
 assert(css.includes('flex:1 1 0!important;min-height:0!important;max-height:240px!important'));
 assert(css.includes('pointer-events:none!important'));assert(css.includes('max-height:85px!important'));
 assert(css.includes('.ss-training.ss-people-reflow .ss-training-yard{display:none!important}'));
});
