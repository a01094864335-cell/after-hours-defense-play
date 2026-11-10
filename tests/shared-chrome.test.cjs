"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('shared comic artwork is local, text-free and included in the Pages build',()=>{
 const css=fs.readFileSync('shared-chrome.css','utf8');
 for(const [,file] of css.matchAll(/url\(['"]?(assets\/shared-chrome\/[^)'" ]+)/g))assert(fs.existsSync(file.split(/[?#]/)[0]),file);
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

test('plain modal headers are normalized before close enhancement; recruitment retains its actual heading',()=>{
 const js=fs.readFileSync('shared-chrome.js','utf8');
 assert(js.indexOf("header.classList.add('shared-modal-header')")<js.indexOf('const closeSelector'));
 assert(js.includes("title.classList.add('shared-recruit-title')"));
 const css=fs.readFileSync('shared-chrome.css','utf8');
 assert(css.includes('.shared-modal-header) h2'));
});

test('the text-free plaque stretches to long DOM headings without letter scaling',()=>{
 const svg=fs.readFileSync('assets/shared-chrome/plaque.svg','utf8');
 assert(svg.includes('preserveAspectRatio="none"'));
 assert(!/<text[\s>]/.test(svg));
 assert(fs.readFileSync('shared-chrome.js','utf8').includes('shared-chrome.css?v=paper-comic-4'));
});

test('modal frames use a square scalable source and perk cards have explicit active and disabled surfaces',()=>{
 const css=fs.readFileSync('shared-chrome.css','utf8'),svg=fs.readFileSync('assets/shared-chrome/modal-paper.svg','utf8');
 assert(svg.includes('viewBox="0 0 120 120"'));
 assert(css.includes("modal-paper.svg?v=2') 24 fill / 16px"));
 assert(!css.includes("paper.webp') 90 fill"));
 assert(css.includes('#perk.shared-paper-modal :is(#perk-options,#perk-targets,#tactical-bonuses) button:disabled'));
});

test('modal details group original controls and distinguish selection from destructive actions',()=>{
 const js=fs.readFileSync('shared-chrome.js','utf8'),css=fs.readFileSync('shared-chrome.css','utf8');
 assert(js.includes("section.append(node)"));
 assert(js.includes("'shared-backup-export', '1. 현재 기록 보관'"));
 assert(css.includes('.deck-choice.swap-target>small'));
 assert(css.includes('#save-transfer-status[data-phase=preview]'));
 assert(css.includes('#starter-options article>div>button:last-child'));
});

test('shop opening refreshes canonical purchase availability after wallet changes',()=>{
 const js=fs.readFileSync('previews/asset-shop-20261109/shop.js','utf8');
 assert(js.includes("if(dialog.open){window.renderRecruitShop();refresh();select('pack');}"));
 assert(js.includes("q('#buy-staff-pack').disabled,q('#buy-staff-pack').textContent"));
});

test('local touch audit keeps real roster and result controls at least 44px',()=>{
 const css=fs.readFileSync('shared-chrome.css','utf8'),qa=fs.readFileSync('tests/test_modal_inventory.py','utf8');
 assert(css.includes('grid-template-columns:repeat(5,minmax(44px,1fr))!important'));
 assert(css.includes('html body #result summary{box-sizing:border-box!important;min-height:44px!important'));
 assert(qa.includes("return 'closed-details'"));
 assert(qa.includes("return 'screen-reader-only'"));
 assert(qa.includes("scroll-boundary-review"));
});
