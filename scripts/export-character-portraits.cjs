'use strict';
// Mechanical export of approved generated atlas cells; no character drawing here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),file=path.join(root,'assets/character-portraits/manifest.json'),manifest=JSON.parse(fs.readFileSync(file));
for(const r of manifest.characters){
 const [x,y,w,h]=r.cell,source=path.resolve(root,r.master),target=path.resolve(root,r.path);
 if(!source.startsWith(root+path.sep)||!target.startsWith(root+path.sep))throw Error('Asset outside repository');
 execFileSync('magick',[source,'-crop',`${w}x${h}+${x}+${y}`,'+repage','-trim','+repage','-resize','448x448','-background','none','-gravity','center','-extent','512x512','-quality','92',target]);
 r.sha256=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log(`Exported ${manifest.characters.length} identity portraits`);
