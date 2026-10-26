'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'/tmp/after-hours-pages');
if(out===root||out.startsWith(root+path.sep))throw Error('Build outside the source checkout');
const old=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'))),files=new Set(Object.keys(old.files).filter(f=>!/^assets\/castle-stories\/.*\.png$/.test(f)));
for(const f of ['index.html','player-profile.js','development.js','development.css','save-transfer.js','save-transfer-ui.js','story-loading.js'])files.add(f);
for(const dir of fs.readdirSync(path.join(root,'assets/castle-stories'))){const p=path.join(root,'assets/castle-stories',dir);if(!fs.statSync(p).isDirectory())continue;for(const name of fs.readdirSync(p))if(name.endsWith('.webp'))files.add('assets/castle-stories/'+dir+'/'+name);}
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
