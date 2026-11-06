const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),boot=require('./runtime-boot.cjs');
const stories=require('../castle-stories.js');
test('40 unique stories, every daily story has four existing runtime illustrations',()=>{
 assert.equal(stories.length,40);assert.equal(new Set(stories.map(s=>s.id)).size,40);
 assert.equal(stories.filter(s=>s.original).length,1);
 for(const s of stories.filter(s=>!s.original)){assert.equal(s.panels.length,4);s.panels.forEach((p,i)=>{assert.equal(p.length,5);assert(p[2].length>0);assert(fs.existsSync('assets/castle-stories/'+s.id+'/'+String(i+1).padStart(2,'0')+'.webp'))})}
});
test('first shift remains first; all 39 daily stories can be selected',()=>{
 const b=boot();assert.equal(b.run('nextCastleStory().id'),'first-shift');
 b.run("meta.stories=['first-shift'];var selectedStories=[];for(let i=0;i<39;i++){Math.random=()=> (i+.5)/39;selectedStories.push(nextCastleStory().id)}");
 assert.equal(b.run('new Set(selectedStories).size'),39);assert.equal(b.run("selectedStories.includes('same-place-tomorrow')"),true);
});
test('new discovery pays once, replay preserves coins, and all four panels render',()=>{
 const b=boot();b.run(`meta.stories=['first-shift'];meta.coins=20;currentCastleStory=CastleStories.find(s=>s.id==='fridge-label');discoverCastleStory();if(meta.coins!==25)throw Error('first reward');discoverCastleStory();if(meta.coins!==25)throw Error('duplicate reward');replayCastleStory('fridge-label');for(promoIndex=0;promoIndex<4;promoIndex++)renderCastleStory();if(meta.coins!==25)throw Error('replay reward');renderStoryArchive();renderStoryLobby();`);
 assert.match(b.nodes['#story-progress'].textContent,/2 \/ 40/);assert.equal(b.nodes['#lobby-story-count'].textContent,'2 / 40');
});
test('existing collection survives and failed discovery never grants coins or ownership',()=>{
 const b=boot();b.run(`var saved=freshMeta();saved.stories=['first-shift','midnight-soup'];saved.coins=123;meta=validateMeta(saved);if(meta.stories.length!==2||meta.coins!==123)throw Error('old save changed');currentCastleStory=CastleStories.find(s=>s.id==='shield-bandage');localStorage.setItem=()=>{throw Error('quota')};discoverCastleStory();if(meta.coins!==123||meta.stories.includes('shield-bandage'))throw Error('failed save awarded');`);
});
test('every new episode renders four panels with the expected artwork and dialogue',()=>{
 const b=boot();
 b.run(`for(const story of CastleStories.slice(20)){currentCastleStory=story;for(promoIndex=0;promoIndex<4;promoIndex++){renderCastleStory();const face=document.querySelector('#promo-face');if(face.src!==castleIllustration(story,promoIndex))throw Error(story.id+' artwork');if(document.querySelector('#promo-speaker').textContent!==story.panels[promoIndex][1])throw Error(story.id+' speaker')}}`);
});
