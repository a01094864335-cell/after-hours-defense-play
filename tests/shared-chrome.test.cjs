"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('shared comic artwork is local, text-free and included in the Pages build',()=>{
 const css=fs.readFileSync('shared-chrome.css','utf8');
 for(const [,file] of css.matchAll(/url\(['"]?(assets\/shared-chrome\/[^)'" ]+)/g))assert(fs.existsSync(file),file);
 for(const name of fs.readdirSync('assets/shared-chrome').filter(n=>n.endsWith('.svg'))){
  const svg=fs.readFileSync('assets/shared-chrome/'+name,'utf8');
  assert(svg.includes('viewBox='),name);assert(!/<text[\s>]/.test(svg),name+' contains baked text');
 }
 assert(fs.readFileSync('scripts/build-pages.cjs','utf8').includes("readdirSync(path.join(root,'assets/shared-chrome'))"));
});
test('shared presentation preserves words on acknowledgement and forwards settings confirmation',()=>{
 const js=fs.readFileSync('shared-chrome.js','utf8');
 assert(js.includes("menu.querySelector('#menu-close')?.click()"));
 assert(!js.includes("'#info-close'"));
 assert(js.includes("button.replaceChildren(image, text)"));
 assert(!/localStorage|saveChange|meta\./.test(js));
});
