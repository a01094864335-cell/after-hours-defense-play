'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/character-motion/manifest.json'))),characters={};
for(const file of fs.readdirSync(path.join(root,'designs/outline-uniformity/masks')).filter(f=>f.endsWith('.json')).sort()){
 const d=JSON.parse(fs.readFileSync(path.join(root,'designs/outline-uniformity/masks',file)));if(d.status!=='reviewed')continue;
 if(!manifest.characters[d.key]||d.sourceSha256!==manifest.characters[d.key].sha256||d.frames.length!==6||d.frames.some((f,i)=>f.pose!==i||f.untraced||!/^M\s/.test(f.path)))throw Error('Invalid reviewed mask '+file);
 characters[d.key]={sourceSha256:d.sourceSha256,frames:d.frames.map(({path,padding,outlinePath})=>({path,...(padding?{padding}:{}),...(outlinePath?{outlinePath}:{})}))};
}
const data={version:1,characters};data.sha256=crypto.createHash('sha256').update(JSON.stringify(data.characters)).digest('hex');
fs.writeFileSync(path.join(root,'assets/character-motion/outlines.js'),'// Reviewed presentation masks; original artwork stays untouched.\nconst StaffOutlineMasks = '+JSON.stringify(data)+';\n');console.log({characters:Object.keys(characters),poses:Object.keys(characters).length*6});
