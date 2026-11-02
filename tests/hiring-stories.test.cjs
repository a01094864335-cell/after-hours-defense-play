const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),boot=require('./runtime-boot.cjs');
test('19 hiring episodes map to real staff and 76 packaged WebP panels',()=>{
 const b=boot('');assert.equal(b.run('window.HIRING_STORIES.length'),19);
 assert.equal(b.run('window.HIRING_STORIES.every(e=>staffRecords.some(r=>r.id===e.id)&&e.panels.length===4)'),true);
 for(const file of b.run('window.HIRING_STORIES.flatMap(e=>e.panels.map(p=>p.file))'))assert(fs.existsSync('assets/hiring-stories/'+file),file);
 assert.equal(b.run("HiringStories.canView('bat-nurse')"),false);
 assert.equal(b.run("HiringStories.canView('ghost-courier')"),true);
});
test('pack plays new hire once; duplicate does not replay or change existing points behavior',()=>{
 const b=boot('');b.run(`meta.tutorialComplete=true;meta.coins=1000;Math.random=()=>.5;var shown=[];HiringStories.open=id=>shown.push(id);buyStaffPack();buyStaffPack();`);
 assert.equal(b.run('shown.length'),1);assert.equal(b.run('meta.recruitPoints'),1);
});
test('staff and support targeted recruitment show stories after successful save only',()=>{
 const b=boot('');b.run(`meta.tutorialComplete=true;meta.recruitPoints=30;showStaffRecord=()=>{};var shown=[];HiringStories.open=id=>shown.push(id);recruitByPoints('bat-nurse');recruitSupport('ward');recruitByPoints('bat-nurse');recruitSupport('ward');`);
 assert.equal(b.run('JSON.stringify(shown)'),JSON.stringify(['bat-nurse','merc-ward']));
 b.run(`localStorage.setItem=()=>{throw Error('quota')};recruitSupport('rescue');`);assert.equal(b.run('shown.length'),2);
});
test('support pack also triggers its own story and preserves first-purchase price',()=>{
 const b=boot('');b.run(`meta.tutorialComplete=true;meta.coins=1000;Math.random=()=>0;var shown=[];HiringStories.open=id=>shown.push(id);buyStaffPack();`);
 assert.equal(b.run('shown[0]'),'merc-ward');assert.equal(b.run('meta.coins'),b.run('1000-PACK_PRICE'));
});
test('comic navigation stays within four panels and returns to underlying dialog',()=>{
 const b=boot('');b.run(`
 var parts={},listeners={},closed=0;
 document.body={append(){}};
 document.createElement=()=>({open:false,setAttribute(){},querySelector(key){return parts[key]||(parts[key]={textContent:'',focus(){},addEventListener(n,fn){this[n]=fn}})},addEventListener(n,fn){listeners[n]=fn},showModal(){this.open=true},close(){this.open=false;closed++;listeners.close()}});
 if(HiringStories.open('bat-nurse'))throw Error('locked story leaked');
 if(!HiringStories.open('ghost-courier')||parts['.hire-page'].textContent!=='1 / 4')throw Error('open');
 for(let i=0;i<3;i++)parts['[data-hire-next]'].onclick();
 if(parts['.hire-page'].textContent!=='4 / 4')throw Error('last page');
 listeners.keydown({key:'ArrowRight',preventDefault(){}});
 if(parts['.hire-page'].textContent!=='4 / 4')throw Error('past end');
 parts['[data-hire-next]'].onclick();if(closed!==1)throw Error('finish');
 HiringStories.open('ghost-courier');if(parts['.hire-page'].textContent!=='1 / 4')throw Error('replay');
 `);
});

test('hiring story styles and scripts are linked and included in the Pages build',()=>{
 const html=fs.readFileSync('index.html','utf8'),build=fs.readFileSync('scripts/build-pages.cjs','utf8');
 for(const file of ['hiring-stories.css','hiring-stories.js','assets/hiring-stories/game-data.js']){assert(html.includes('"'+file+'"'));assert(build.includes(file));}
 assert(html.indexOf('src="hiring-stories.js"')>html.indexOf('src="development.js"'));
});
