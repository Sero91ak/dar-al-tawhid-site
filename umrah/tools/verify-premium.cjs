'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const main=read('index.html');
const offline=read('offline.html');
const js=read('enhancements.js');
const css=read('enhancements.css');
const source=read('quellen.html');
const sw=read('sw.js');
for(const [name,content] of [['index.html',main],['offline.html',offline]]){
 assert.match(content, /href="\.\/enhancements\.css\?v=umrah-premium-1"/, name+' missing CSS');
 assert.match(content, /src="\.\/enhancements\.js\?v=umrah-premium-1"/, name+' missing JS');
 assert.match(content, /id="page-journal"/, name+' lost journal');
 assert.match(content, /id="page-orte"/, name+' lost locations');
 assert.match(content, /id="print-root"/, name+' lost print root');
 assert.ok(content.length>1_500_000,name+' unexpectedly shrunk');
}
assert.match(js, /function refLink\(/);
assert.match(js, /function initReport\(/);
assert.match(js, /function initJournal\(/);
assert.match(js, /function initMaps\(/);
assert.match(js, /'google'/);
assert.match(js, /'apple'/);
assert.match(js, /'osm'/);
assert.match(js, /'internal'/);
assert.match(js, /dar-photo-sort/);
assert.match(js, /pr-photo-spread/);
assert.match(css, /@media print/);
assert.match(css, /pr-photo-spread/);
for(const id of ['quran-2-127','quran-2-158','quran-2-196','quran-2-201','hadith-bukhari-1549','hadith-bukhari-1727','hadith-bukhari-3364','hadith-muslim-1218a','service-nusuk','service-haramayn']){
 assert.ok(source.includes('id="'+id+'"'),'Missing local source '+id);
}
assert.match(sw, /dar-umrah-v9-premium-1/);
for(const file of ['enhancements.js','enhancements.css','quellen.html'])assert.ok(sw.includes(file),'Missing SW asset '+file);
assert.match(sw, /req.mode!=='navigate'/);
console.log('PASS: Umrah Premium additive integration, self-hosted references, print and offline contract');
