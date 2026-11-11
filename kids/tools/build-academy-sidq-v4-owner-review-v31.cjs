#!/usr/bin/env node
"use strict";
/* Offline human QA package for ALL exact first-lesson owner V4 recordings.
   No speech generation, no uploads to public Kids player and no owner approval. */
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const target=path.resolve(process.argv[2]||"/tmp/kids-sidq-v4-owner-review-v31");
cp.execFileSync(process.execPath,[path.join(ROOT,"kids/tools/test-academy-sidq-v4-full-stage-v31.cjs"),"--check"],{cwd:ROOT,stdio:"inherit"});
const report=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-sidq-v4-coverage-v31.json"),"utf8"));
assert.equal(report.totals.staged,80);
fs.mkdirSync(path.join(target,"audio"),{recursive:true});
const escape=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const copy=[];
for(let i=0;i<report.entries.length;i++){
 const e=report.entries[i];
 const name=String(i+1).padStart(3,"0")+(e.languageSensitive?"-FUSHA":"-DE")+".m4a";
 const src=path.join(ROOT,e.asset.slice(1));
 fs.copyFileSync(src,path.join(target,"audio",name));
 copy.push({index:i+1,filename:"audio/"+name,text:e.text,
  durationSeconds:e.durationSeconds,source:e.source,sha256:e.sha256,
  ageContexts:e.ageContexts,requiresHumanListening:true,approvedForPlayback:false,
  focus:e.languageSensitive?"Fuṣḥā / Sprachübergänge":"Deutsche Artikulation und Stimmqualität"});
}
fs.writeFileSync(path.join(target,"manifest.json"),JSON.stringify({
 schemaVersion:1,title:"TAWḤĪD KIDS – Ṣidq V4 80-owner-review",
 lesson:"Ṣidq – Wahrhaftigkeit",createdFrom:"GitHub KIDS staging v31",
 publicRelease:false,autoApprove:false,humanFushaReviewRequired:true,
 completedTechnicalClips:80,items:copy},null,2)+"\n");
const cards=copy.map(e=>{
 const age=[...new Set(e.ageContexts.map(c=>c.age))].join(" · ");
 return '<article class="clip"><div class="meta"><span class="index">'+String(e.index).padStart(3,"0")+'</span>'+
 '<span>'+escape(age)+'</span><span>'+escape(e.focus)+'</span><span>'+e.durationSeconds.toFixed(2)+' s</span></div>'+
 '<p>'+escape(e.text)+'</p><audio controls preload="none" src="'+escape(e.filename)+'"></audio></article>';
}).join("\n");
const html='<!doctype html><html lang="de" dir="ltr"><head><meta charset="utf-8">'+
'<meta name="viewport" content="width=device-width,initial-scale=1">'+
'<title>TAWḤĪD KIDS · Ṣidq · 80 V4 Hörproben</title>'+
'<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#091e20;color:#f2f1e9;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'+
'main{max-width:900px;margin:auto;padding:22px 18px 70px}header{padding:26px 0 24px;border-bottom:1px solid #9f96733d}'+
'h1{font-family:Georgia,serif;font-size:clamp(26px,5vw,40px);line-height:1.12;margin:14px 0;color:#e7d4a2}'+
'p.subtitle{color:#d6dacd;margin:0 0 10px}.notice{color:#e5c99e;font-size:.92rem;margin-top:16px}.clip{border-bottom:1px solid #c3b18a35;padding:18px 0 24px}'+
'.clip p{margin:12px 0 14px;font-size:1rem}.meta{display:flex;gap:8px 16px;flex-wrap:wrap;font-size:.78rem;color:#b8c3b7}'+
'.index{font-weight:700;color:#e8ca86}audio{width:100%;height:48px;display:block}small{color:#afbeb4}'+
'</style></head><body><main><header><small>DĀR AL TAWḤĪD · KINDER-LERNAKADEMIE · PRIVATE HÖRPRÜFUNG</small>'+
'<h1>Ṣidq – Wahrhaftigkeit</h1><p class="subtitle">80 Originalaufnahmen mit Serhat Abu Malik – Master · ElevenLabs V4</p>'+
'<p class="notice">Nur zur Hör- und Fuṣḥā-Prüfung. Technisch erzeugt, aber nicht für die Kinder-App freigegeben. Bei arabischen Begriffen ausdrücklich die Artikulation und die Übergänge prüfen.</p></header>'+
cards+'</main></body></html>';
fs.writeFileSync(path.join(target,"HÖRPRÜFUNG.html"),html);
console.log("PASS: 80/80 exact clips copied to review-only folder: "+target);
