'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('single-screen-settings.js','utf8'),css=fs.readFileSync('single-screen-settings.css','utf8');
test('settings pages preserve original controls and leave gameplay state alone',()=>{
 for(const id of ['language-settings','power-save-toggle','compact-fx-toggle','shared-menu-tools','shared-menu-records','shared-menu-reset'])assert(js.includes(id),id);
 assert(!/localStorage|\.onclick\s*=|\.close\(|\.showModal\(|cloneNode|innerHTML\s*=/.test(js));
 assert(js.includes("resetGroup.prepend(warning)"));assert(js.includes("'aria-describedby', warning.id"));
});
test('topic navigation has keyboard and hidden panel semantics',()=>{
 for(const value of ['tablist','tabpanel','aria-controls','aria-selected','aria-labelledby','ArrowRight','ArrowLeft','Home','End'])assert(js.includes(value),value);
 assert(js.includes('button.tabIndex = i === index ? 0 : -1'));assert(js.includes('panel.hidden = i !== index'));
 assert(css.includes('.single-screen-page[hidden]'));assert(css.includes('overflow:auto!important'));
});
test('help retains risk facts, restores keyboard target and avoids decoration observer reparenting',()=>{
 for(const fact of ['2등급 5%','7등급 30%','이동한 직원만','합성권','board-keyboard-help','.grade-guide','.boss-guide','#skill-info'])assert(js.includes(fact),fact);
 assert(js.includes("body.dataset.conceptOrdered = 'true'"));
 assert(css.includes('min-height:44px!important'));assert(css.includes('font-size:14px!important'));
});
