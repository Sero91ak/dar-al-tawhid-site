#!/usr/bin/env node
// 10-percent stages from actual canonical counts. Structural, not theological, audit.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(readFileSync(resolve(root,name),'utf8'));
const fail = (message) => { throw Error('TADABBUR MILESTONE FAILED: '+message); };
const check = (ok,msg) => { if (!ok) fail(msg); };
const catalog=read('catalog.json'), index=read('entries-index.json');
const report=read('missing-references.report.json'), coverage=read('coverage.json');
const n=coverage.totalVerses, verified=catalog.entriesCount;
check(n===6236,'Unexpected Qurʾān verse total');
check(index.totalVerifiedEntries===verified,'Index total differs');
check(report.catalogEntriesCount===verified&&report.indexTotalVerifiedEntries===verified,'Gap counts differ');
check(report.loadedEntries===verified&&report.uniqueVerifiedReferences===verified,'Registered total differs');
check(report.missingCount===n-verified&&report.missing.length===report.missingCount,'Gap count differs');
check(report.duplicateCount===0&&report.invalidCount===0&&report.countMismatchCount===0,'Audit contains errors');
check(catalog.entriesPaths.length===index.files.length,'File listing differs');
for (const file of index.files) {
 if (/^entries-gap-06-[0-9]+[.]json$/.test(file.path)) {
   check(Number.isInteger(file.count)&&file.count>0&&file.count<=25,'Invalid batch size: '+file.path);
 }
}
const threshold = pct => Math.ceil(n*pct/100);
const stages=[80,90,100];
const next=stages.find(pct => verified<threshold(pct))??100;
console.log('TADABBUR MILESTONE CHECK OK');
console.log('registered='+verified+'/'+n);
console.log('percent='+(100*verified/n).toFixed(2));
console.log('open='+report.missingCount);
console.log('nextStage='+next+'%');
console.log('nextStageThreshold='+threshold(next));
console.log('newEntriesToStage='+Math.max(0,threshold(next)-verified));
for(const pct of stages) console.log('stage'+pct+'='+threshold(pct)+' '+(verified>=threshold(pct)?'REACHED':'OPEN'));
console.log('CAUTION: technical counts cannot independently authenticate every historical isnād.');
