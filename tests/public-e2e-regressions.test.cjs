'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),boot=require('./runtime-boot.cjs');
test('summon accessible price matches wave price, daily surcharge and free-summon precedence',()=>{
 const b=boot();b.run("meta.tutorialComplete=true;reset();playing=true;wave=8;dailyEnabled=true;dailyRule=DAILY_RULES.findIndex(r=>r.id==='austerity');cost=70;var attrs={};document.querySelector('#summon').getAttribute=k=>attrs[k];document.querySelector('#summon').setAttribute=(k,v)=>attrs[k]=v;sync()");
 assert.equal(b.run("attrs['aria-label']"),'직원 소환 66 SP · 누르고 있으면 연속 소환');
 b.run('summonDiscount=true;sync()');assert.equal(b.run("attrs['aria-label']"),'직원 소환 66 SP · 누르고 있으면 연속 소환');
 b.run("activeMerc='chikchik';expansionState.freeSummon=1;sync()");assert.match(b.run("attrs['aria-label']"),/무료 소환 0 SP/);
 const before=b.run('sp');b.run('summon()');assert.equal(b.run('sp'),before);assert.equal(b.run('summonDiscount'),true);assert.equal(b.run('summonPrice()'),66);
});
test('SP reward describes offer-time basis and keeps fixed amount across cost changes and reload',()=>{
 const b=boot();b.run("meta.tutorialComplete=true;reset();playing=true;wave=5;paused=true;bonusPending=true;dailyEnabled=false;cost=60;renderPerkChoices();var offer=rewardBundle.offers.find(o=>o.id==='sp');var original=offer.amount;cost=70;renderPerkChoices();var copy=rewardCopy(offer);var snapshot=runSnapshot();applySnapshot(snapshot);renderPerkChoices()");
 assert.equal(b.run('original'),120);assert.match(b.run('copy[2]'),/보상 생성 시.*2회 기준/);assert.equal(b.run("rewardBundle.offers.find(o=>o.id==='sp').amount"),120);
 b.run("document.documentElement={lang:'en'}");assert.match(b.run('rewardCopy(offer)[2]'),/when offered/);
 b.run("rewardBundle.winner=rewardBundle.offers.findIndex(o=>o.id==='sp');choosePerk('sp')");const sp=b.run('sp');b.run("choosePerk('sp')");assert.equal(b.run('sp'),sp);
});
