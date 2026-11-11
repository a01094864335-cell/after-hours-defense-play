'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const js=fs.readFileSync('single-screen-shop.js','utf8'),css=fs.readFileSync('single-screen-shop.css','utf8');
test('shop preserves native purchase, wallet and status nodes',()=>{assert.match(js,/dock\.append\(purchase, balance, status\)/);assert.match(js,/statusTarget = pack.hidden/);assert.doesNotMatch(js,/cloneNode|buyStaffPack\(|saveChange\(|localStorage/)});
test('shop guarantee summary follows canonical state',()=>{assert.match(js,/missingSupports\(\)\.length === 0/);assert.match(js,/profile\(\)\.pity >= SUPPORT_PITY - 1/);assert.match(js,/balance\.hidden = packComplete\(\)/);assert.match(js,/Unowned support 100%/)});
test('full recruitment rules retain focus and dismissal contract',()=>{assert.match(js,/rules\.showModal\(\)/);assert.match(js,/summary\.focus\(\)/);assert.match(js,/shop\.addEventListener\('close'/);assert.match(css,/\.recruit-rules-body[^}]*overflow:auto/)});
test('shop primary actions and enlarged-copy scroll fallback remain available',()=>{assert.match(css,/\.scroll[^}]*overflow:auto/);assert.match(css,/\.purchase[^}]*min-height:54px/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/large-copy \.hero-stage/)});
