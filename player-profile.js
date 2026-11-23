'use strict';
// Optional, versioned additions. Old wallets keep every coin, hero and item.
// Local balance observations, bounded independently from wallet and run rewards.
function freshPlayObservations(incomplete=false){return {version:1,ruleset:'fun-20261123-v1',incomplete,outcome:null,items:{grade:0,kind:0,king:0},breaches:[],cooperation:{hits:0,bonusDamage:0},choices:[],waves:[],lastMerge:null,postMergeBreaches:0}}
function readPlayObservations(value){
 if(value===undefined)return freshPlayObservations(true);
 const s=JSON.parse(JSON.stringify(value)),number=v=>Number.isFinite(v)&&v>=0&&v<=1e12,integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max,build=v=>v===null||['chain','economy','guard'].includes(v);
 if(!s||![null,'defeat','clockout','tutorial','ended'].includes(s.outcome)||!s.items||!['grade','kind','king'].every(k=>integer(s.items[k],1000000))||!Array.isArray(s.breaches)||s.breaches.length>12||s.version!==1||s.ruleset!=='fun-20261123-v1'||typeof s.incomplete!=='boolean'||!s.cooperation||!integer(s.cooperation.hits,1000000000)||!number(s.cooperation.bonusDamage)||!integer(s.postMergeBreaches,1000000)||!Array.isArray(s.choices)||s.choices.length>30||!Array.isArray(s.waves)||s.waves.length>20)throw Error('invalid play observations');
 for(const b of s.breaches)if(!b||typeof b.name!=='string'||b.name.length>100||!integer(b.wave,100000)||!['hp','max','seconds','sp'].every(k=>number(b[k]))||!integer(b.units,15)||!integer(b.pairs,105)||typeof b.boss!=='boolean'||typeof b.afterMerge!=='boolean'||!build(b.strategy))throw Error('invalid breach observations');
 for(const c of s.choices)if(!c||!integer(c.wave,100000)||!['sp','life','merge','equipment','staff','keep','build','power','boss','slow'].includes(c.id)||!['choice','roulette'].includes(c.mode)||!build(c.strategy)||!number(c.seconds))throw Error('invalid reward observations');
 for(const w of s.waves)if(!w||!integer(w.wave,100000)||!number(w.seconds)||!number(w.sp)||!integer(w.units,15)||!integer(w.highest,7)||!integer(w.gear,25)||!integer(w.pairs,105)||!build(w.strategy))throw Error('invalid wave observations');
 if(s.lastMerge!==null){const m=s.lastMerge;if(!m||!integer(m.wave,100000)||!number(m.clock)||typeof m.success!=='boolean'||!integer(m.sourceType,16)||!integer(m.targetType,16)||!integer(m.sourcePip,7)||m.sourcePip<1||!integer(m.targetPip,7)||m.targetPip<1)throw Error('invalid merge observations')}
 return s;
}
function freshProfile(){return {version:1,pity:0,compactFX:true,presets:[null,null,null],records:[],best:0,starterClaim:null};}
function readProfile(value){
 if(value===undefined)return freshProfile();
 const p=JSON.parse(JSON.stringify(value));
 const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 if(!p||p.version!==1||!integer(p.pity,9)||typeof p.compactFX!=='boolean'||!integer(p.best,100000)||!Array.isArray(p.presets)||p.presets.length!==3||!Array.isArray(p.records)||p.records.length>20)throw Error('invalid player profile');
 const staff=[...BASE_STAFF,...RECRUIT_STAFF];
 for(const deck of p.presets)if(deck!==null&&(!deck||!Array.isArray(deck.staff)||deck.staff.length!==5||new Set(deck.staff).size!==5||deck.staff.some(id=>!staff.includes(id))||(deck.support!==null&&!MERC_IDS.includes(deck.support))))throw Error('invalid deck preset');
 for(const r of p.records)if(!r||typeof r.id!=='string'||!integer(r.wave,100000)||!integer(r.cleared,100000)||!integer(r.coins,1000000000)||!Number.isFinite(r.seconds)||r.seconds<0||typeof r.rule!=='string'||!Array.isArray(r.deck)||r.deck.some(id=>!staff.includes(id))||!validTraining(r.training)||!r.king||!integer(r.king.kills,10000000)||!integer(r.king.appearances,100000)||!integer(r.king.bosses,1000000))throw Error('invalid run record');
 for(const r of p.records){if(r.observations!==undefined)r.observations=readPlayObservations(r.observations);r.bosses??=[];if(!Array.isArray(r.bosses)||r.bosses.length>30||r.bosses.some(b=>!b||typeof b.name!=='string'||b.name.length>100||!integer(b.wave,100000)||!Number.isFinite(b.seconds)||b.seconds<0||typeof b.king!=='boolean'))throw Error('invalid boss records');}
 if(p.starterClaim!==undefined&&p.starterClaim!==null&&!staff.includes(p.starterClaim)&&p.starterClaim!=='complete')throw Error('invalid starter claim');
 p.starterClaim??=null;
 return p;
}
function freshInsights(){return {version:1,observations:freshPlayObservations(),seconds:0,summons:0,merges:0,failed:0,skills:0,items:{grade:0,kind:0,king:0},king:{appearances:0,kills:0,bosses:0},support:{damage:0,sp:0,prevented:0,cleanses:0,stops:0,boost:0},help:Array.from({length:17},()=>0),breaches:[],bosses:[]};}
function readInsights(value){
 if(value===undefined){const s=freshInsights();s.observations.incomplete=true;return s;}
 const s=JSON.parse(JSON.stringify(value)),number=v=>Number.isFinite(v)&&v>=0&&v<=1e12;
 if(!s||s.version!==1||!['seconds','summons','merges','failed','skills'].every(k=>number(s[k]))||!s.items||!['grade','kind','king'].every(k=>number(s.items[k]))||!s.king||!['appearances','kills','bosses'].every(k=>number(s.king[k]))||!s.support||!['damage','sp','prevented','cleanses','stops'].every(k=>number(s.support[k]))||!Array.isArray(s.help)||s.help.length!==17||s.help.some(n=>!number(n))||!Array.isArray(s.breaches)||s.breaches.length>12)throw Error('invalid battle insights');
 for(const b of s.breaches)if(!b||typeof b.name!=='string'||b.name.length>100||!['hp','max','wave','damage'].every(k=>number(b[k])))throw Error('invalid breach record');
 s.observations=readPlayObservations(s.observations);s.observations.items={...s.items};s.support.boost??=0;s.bosses??=[];
 if(!number(s.support.boost)||!Array.isArray(s.bosses)||s.bosses.length>30||s.bosses.some(b=>!b||typeof b.name!=='string'||b.name.length>100||!number(b.wave)||!number(b.seconds)||typeof b.king!=='boolean'))throw Error('invalid support or boss insights');
 return s;
}
let runInsights=freshInsights();
