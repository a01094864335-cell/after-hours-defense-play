'use strict';
// Optional, versioned additions. Old wallets keep every coin, hero and item.
function freshProfile(){return {version:1,pity:0,compactFX:true,presets:[null,null,null],records:[],best:0};}
function readProfile(value){
 if(value===undefined)return freshProfile();
 const p=JSON.parse(JSON.stringify(value));
 const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 if(!p||p.version!==1||!integer(p.pity,9)||typeof p.compactFX!=='boolean'||!integer(p.best,100000)||!Array.isArray(p.presets)||p.presets.length!==3||!Array.isArray(p.records)||p.records.length>20)throw Error('invalid player profile');
 const staff=[...BASE_STAFF,...RECRUIT_STAFF];
 for(const deck of p.presets)if(deck!==null&&(!deck||!Array.isArray(deck.staff)||deck.staff.length!==5||new Set(deck.staff).size!==5||deck.staff.some(id=>!staff.includes(id))||(deck.support!==null&&!MERC_IDS.includes(deck.support))))throw Error('invalid deck preset');
 for(const r of p.records)if(!r||typeof r.id!=='string'||!integer(r.wave,100000)||!integer(r.cleared,100000)||!integer(r.coins,1000000000)||!Number.isFinite(r.seconds)||r.seconds<0||typeof r.rule!=='string'||!Array.isArray(r.deck)||r.deck.some(id=>!staff.includes(id))||!validTraining(r.training)||!r.king||!integer(r.king.kills,10000000)||!integer(r.king.appearances,100000)||!integer(r.king.bosses,1000000))throw Error('invalid run record');
 for(const r of p.records){r.bosses??=[];if(!Array.isArray(r.bosses)||r.bosses.length>30||r.bosses.some(b=>!b||typeof b.name!=='string'||b.name.length>100||!integer(b.wave,100000)||!Number.isFinite(b.seconds)||b.seconds<0||typeof b.king!=='boolean'))throw Error('invalid boss records');}
 return p;
}
function freshInsights(){return {version:1,seconds:0,summons:0,merges:0,failed:0,skills:0,items:{grade:0,kind:0,king:0},king:{appearances:0,kills:0,bosses:0},support:{damage:0,sp:0,prevented:0,cleanses:0,stops:0,boost:0},help:Array.from({length:17},()=>0),breaches:[],bosses:[]};}
function readInsights(value){
 if(value===undefined)return freshInsights();
 const s=JSON.parse(JSON.stringify(value)),number=v=>Number.isFinite(v)&&v>=0&&v<=1e12;
 if(!s||s.version!==1||!['seconds','summons','merges','failed','skills'].every(k=>number(s[k]))||!s.items||!['grade','kind','king'].every(k=>number(s.items[k]))||!s.king||!['appearances','kills','bosses'].every(k=>number(s.king[k]))||!s.support||!['damage','sp','prevented','cleanses','stops'].every(k=>number(s.support[k]))||!Array.isArray(s.help)||s.help.length!==17||s.help.some(n=>!number(n))||!Array.isArray(s.breaches)||s.breaches.length>12)throw Error('invalid battle insights');
 for(const b of s.breaches)if(!b||typeof b.name!=='string'||b.name.length>100||!['hp','max','wave','damage'].every(k=>number(b[k])))throw Error('invalid breach record');
 s.support.boost??=0;s.bosses??=[];
 if(!number(s.support.boost)||!Array.isArray(s.bosses)||s.bosses.length>30||s.bosses.some(b=>!b||typeof b.name!=='string'||b.name.length>100||!number(b.wave)||!number(b.seconds)||typeof b.king!=='boolean'))throw Error('invalid support or boss insights');
 return s;
}
let runInsights=freshInsights();
