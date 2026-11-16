'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('summon accessible price matches daily surcharge, coupon and free-summon precedence',()=>{
 const b=boot();b.run("meta.tutorialComplete=true;reset();playing=true;wave=8;dailyEnabled=true;dailyRule=DAILY_RULES.findIndex(r=>r.id==='austerity');cost=70;var attrs={};document.querySelector('#summon').getAttribute=k=>attrs[k];document.querySelector('#summon').setAttribute=(k,v)=>attrs[k]=v;sync()");
 assert.equal(b.run("attrs['aria-label']"),'직원 소환 77 SP');
 b.run('summonDiscount=true;sync()');assert.equal(b.run("attrs['aria-label']"),'다음 직원 소환 50% 할인 · 기본 77 SP에서 39 SP');
 b.run("activeMerc='chikchik';expansionState.freeSummon=1;sync()");assert.match(b.run("attrs['aria-label']"),/무료 소환 · 0 SP.*유료 소환 50% 할인 유지/);
 const before=b.run('sp');b.run('summon()');assert.equal(b.run('sp'),before);assert.equal(b.run('summonDiscount'),true);assert.equal(b.run('summonPrice()'),44);
});
test('SP reward describes offer-time basis and keeps fixed amount across cost changes and reload',()=>{
 const b=boot();b.run("meta.tutorialComplete=true;reset();playing=true;wave=5;paused=true;bonusPending=true;dailyEnabled=false;cost=60;renderPerkChoices();var offer=rewardBundle.offers.find(o=>o.id==='sp');var original=offer.amount;cost=70;renderPerkChoices();var copy=rewardCopy(offer);var snapshot=runSnapshot();applySnapshot(snapshot);renderPerkChoices()");
 assert.equal(b.run('original'),130);assert.match(b.run('copy[2]'),/보상 생성 시.*2회 기준/);assert.equal(b.run("rewardBundle.offers.find(o=>o.id==='sp').amount"),130);
 b.run("document.documentElement={lang:'en'}");assert.match(b.run('rewardCopy(offer)[2]'),/when offered/);
 b.run("choosePerk('sp')");const sp=b.run('sp');b.run("choosePerk('sp')");assert.equal(b.run('sp'),sp);
});
