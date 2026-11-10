'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'/tmp/after-hours-pages');
if(out===root||out.startsWith(root+path.sep))throw Error('Build outside the source checkout');
const old=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'))),files=new Set(Object.keys(old.files).filter(f=>!/^assets\/castle-stories\/.*\.png$/.test(f)));
for(const f of ['dialog-layout.js','dialog-layout.css','index.html','game-audio.js','game-sfx.js','assets/audio/lobby-night.wav','assets/audio/night-shift.wav','assets/audio/commander.wav','intro-cinematic.css','player-profile.js','development.js','development.css','save-transfer.js','save-transfer-ui.js','story-loading.js'])files.add(f);
files.add('enamel-ui.css');
files.add('visual-pass.css');
files.add('roomy-buttons.css');
files.add('play-design.css');
files.add('detail-ui.css');
files.add('ui.css');
files.add('gameworld.css');
files.add('open-scene.css');
files.add('open-scene.js');
files.add('character-portraits.js');
for(const name of fs.readdirSync(path.join(root,'assets/character-motion')))if(/\.(webp|json|js)$/.test(name))files.add('assets/character-motion/'+name);
for(const name of fs.readdirSync(path.join(root,'assets/character-portraits')))if(/\.(webp|json)$/.test(name))files.add('assets/character-portraits/'+name);
for(const name of fs.readdirSync(path.join(root,'assets/open-scene')))if(/\.(svg|webp|json|html)$/.test(name))files.add('assets/open-scene/'+name);
for(const name of fs.readdirSync(path.join(root,'assets/open-scene/icons')))if(name.endsWith('.svg'))files.add('assets/open-scene/icons/'+name);
files.add('gameworld-ui.js');
files.add('battle-art.js');
files.add('battle-comic.css');
files.add('battle-comic.js');
for(const name of fs.readdirSync(path.join(root,'assets/battle-comic')))if(/\.(webp|svg|json|html)$/.test(name))files.add('assets/battle-comic/'+name);
for(const name of fs.readdirSync(path.join(root,'assets/night-watch')))if(/\.(svg|webp)$/.test(name))files.add('assets/night-watch/'+name);
files.add('tutorial-coach.js');
files.add('tactical-duty.js');
files.add('battle-presentation.js');
files.add('assets/pixel/demon-king.webp');
files.add('assets/tutorial/demon-king-night-mentor.webp');
files.add('assets/comic/01-first-shift-sd.webp');
for(const f of ['hiring-stories.js','hiring-stories.css','assets/hiring-stories/game-data.js'])files.add(f);
for(const dir of fs.readdirSync(path.join(root,'assets/hiring-stories'))){const p=path.join(root,'assets/hiring-stories',dir);if(!fs.statSync(p).isDirectory())continue;for(const name of fs.readdirSync(p))if(name.endsWith('.webp'))files.add('assets/hiring-stories/'+dir+'/'+name);}

// Publish the isolated design reference without replacing the live game.
for(const name of fs.readdirSync(path.join(root,'previews/ui-directions-20261102')))if(/\.(html|css|js|png)$/.test(name))files.add('previews/ui-directions-20261102/'+name);
for(const name of fs.readdirSync(path.join(root,'previews/lobby-direction')))if(/\.(html|css|png)$/.test(name))files.add('previews/lobby-direction/'+name);
files.add('assets/ui-approved/lobby-background.webp');
files.add('assets/ui-approved/shop-rush.webp');
files.add('assets/ui-approved/shop-stage.webp');
for(const f of ['approved-ui.css','approved-ui.js','assets/ui-approved/lobby-scene.webp'])files.add(f);
files.add('assets/ui-b/gallery.html');
files.add('assets/ui-b/manifest.json');
for(const name of fs.readdirSync(path.join(root,'assets/ui-b')))if(name.endsWith('.png')||name.endsWith('.svg'))files.add('assets/ui-b/'+name);
for(const dir of fs.readdirSync(path.join(root,'assets/castle-stories'))){const p=path.join(root,'assets/castle-stories',dir);if(!fs.statSync(p).isDirectory())continue;for(const name of fs.readdirSync(p))if(name.endsWith('.webp'))files.add('assets/castle-stories/'+dir+'/'+name);}
// Ship only the two approved screen runtimes; keep source galleries and QA out.
for(const [dir,name] of [['asset-lobby-20261109','lobby'],['asset-roster-20261109','roster']]){
 const base='previews/'+dir;
 for(const ext of ['css','js'])files.add(base+'/'+name+'.'+ext);
 for(const file of fs.readdirSync(path.join(root,base,'assets')))if(/\.(webp|ttf|txt)$/.test(file))files.add(base+'/assets/'+file);
}
const shopPath='previews/asset-shop-20261109';
for(const file of ['shop.css','shop.js'])files.add(shopPath+'/'+file);
for(const file of fs.readdirSync(path.join(root,shopPath,'assets')))if(/\.webp$/.test(file))files.add(shopPath+'/assets/'+file);
const trainingPath='previews/asset-training-20261109';
for(const file of ['training.css','training.js'])files.add(trainingPath+'/'+file);
for(const file of fs.readdirSync(path.join(root,trainingPath,'assets')))if(/\.webp$/.test(file))files.add(trainingPath+'/assets/'+file);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
fs.mkdirSync(out,{recursive:true});let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/((?:src|href)="([^"?]+\.(?:js|css)))(?:\?[^\"]*)?(\")/g,(_,prefix,file,quote)=>prefix+'?v='+hash(fs.readFileSync(path.join(root,file))).slice(0,12)+quote);
const manifest={sourceRevision:revision,entry:'index.html',files:{}};
for(const f of [...files].sort()){
 if(f.includes('..')||path.isAbsolute(f))throw Error('Unsafe release path');
 const source=path.join(root,f);if(!fs.existsSync(source))throw Error('Missing runtime file '+f);
 const target=path.join(out,f);fs.mkdirSync(path.dirname(target),{recursive:true});const data=f==='index.html'?Buffer.from(html):fs.readFileSync(source);fs.writeFileSync(target,data);manifest.files[f]=hash(data);
}
for(const url of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^\"]*)?"/g))if(!url[1].startsWith('#')&&!url[1].includes('://')&&!files.has(url[1]))throw Error('Unpackaged entry resource '+url[1]);
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(JSON.stringify({revision,files:files.size,storyPanels:[...files].filter(f=>/^assets\/castle-stories\/.*\.webp$/.test(f)).length}));

