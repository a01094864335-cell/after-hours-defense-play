'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('approved concept modules are after old shared chrome in the runtime',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const name of ['concept-base.css','concept-tools.css','concept-tools.js','concept-people.css','concept-people.js','concept-stories.css','concept-stories.js']){assert(html.indexOf(name)>html.indexOf('shared-chrome.js'));assert(fs.readFileSync('scripts/build-pages.cjs','utf8').includes(name));}
});
test('concept tools retain native controls and proxy close through their original handlers',()=>{
 const js=fs.readFileSync('concept-tools.js','utf8');
 assert(js.includes('panel.querySelector(target)?.click()'));assert(!/localStorage|saveChange|innerHTML\s*=/.test(js));assert(js.includes('MutationObserver'));
 for(const id of ['menu','info','leave','guide','perk','equipment','deck','daily-events-dialog','journey-dialog','save-transfer-dialog','story-archive'])assert(js.includes("'"+id+"'"));
});
test('concept artwork references exist and decorative SVG does not bake text',()=>{
 for(const file of ['concept-base.css','concept-tools.css'])for(const [,url] of fs.readFileSync(file,'utf8').matchAll(/url\(['"]?([^)'" ]+)/g))assert(fs.existsSync(url.split(/[?#]/)[0]),url);
 assert(!/<text[\s>]/.test(fs.readFileSync('assets/concept-tools/paper-grain.svg','utf8')));
 const css=fs.readFileSync('concept-tools.css','utf8');assert(css.includes('#perk.concept-modal.concept-modal{background:transparent'));assert(css.includes('#save-transfer-status[data-phase=preview]'));assert(css.includes('#leave-confirm{background:linear-gradient(#f1806f'));
});
