/* Isolated Mein Gebet HTML preview gate. No network, browser, secrets or deploy. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.resolve(__dirname,"..");
const pages=["vorschau.html","demo-junge.html","demo-maedchen.html","vorschau-v78-interaktiv.html","vorschau-v79-3d-labor.html","vorschau-v80-salam-fix.html","vorschau-v81-betendenperspektive.html","vorschau-v82-original-check.html","vorschau-v83-originalidentitaet.html"];
const read=n=>fs.readFileSync(path.join(base,n),"utf8");

for(const file of pages){
 test(file+" is complete UTF-8 HTML with no app install or authentication form",()=>{
  const html=read(file);
  assert.match(html,/^<!doctype html>/i);
  assert.match(html,/<html lang="de">/);
  assert.match(html,/<meta name="viewport"/);
  assert.match(html,/<\/body>\s*<\/html>\s*$/);
  assert.doesNotMatch(html,/<form\b|type="password"|serviceWorker\.register|rel="manifest"/i);
 });
 test(file+" has syntactically valid inline JS",()=>{
  const scripts=[...read(file).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new vm.Script(scripts[0][1],{filename:file}));
 });
}
test("Dashboard links to both real on-disk HTML demos",()=>{
 const html=read("vorschau.html");
 for(const file of ["demo-junge.html","demo-maedchen.html"]){
  assert.ok(html.includes('href="'+file+'"'),file+" missing href");
  assert.ok(fs.statSync(path.join(base,file)).size>20000,file+" unexpectedly tiny");
 }
});
test("Dashboard original boy and girl assets are present on the draft branch",()=>{
 const html=read("vorschau.html");
 for(const asset of ["figur-junge-original.png","figur-maedchen-original.png","hero-boy.jpg","hero-girl.jpg"]){
  assert.ok(html.includes("assets/"+asset),asset+" not displayed");
  assert.ok(fs.statSync(path.join(base,"assets",asset)).size>10000,asset+" not real");
 }
});
test("Dashboard status is honest and linked to the isolated draft PR/QA workflow",()=>{
 const html=read("vorschau.html");
 assert.match(html, /3D noch nicht verfügbar/);
 assert.match(html, /Noch gesperrt/);
 assert.match(html, /Noch offen/);
 assert.match(html, /Nicht freigegeben/);
 assert.match(html, /pull\/825/);
 assert.match(html, /kids-mein-gebet-draft-qa\.yml/);
 assert.match(html, /\/pulls\/825/);
 assert.match(html, /head\.sha/);
 assert.doesNotMatch(html, /https:\/\/dar-al-tawhid\.de\//);
});
test("Both demo HTML files support different profile genders and the four categories",()=>{
 for(const [file,gender] of [["demo-junge.html","boy"],["demo-maedchen.html","girl"]]){
  const html=read(file);
  assert.ok(html.includes('data-gender="'+gender+'"'));
  for(const heading of ["Was ist das Gebet?","Warum beten wir?","Wie bete ich?","Mein 3D-Gebet"]){
   assert.ok(html.includes(heading),heading+" missing in "+file);
  }
  assert.match(html,/Original/i);
 }
});
test("The standalone preview pages remain independent from live Kids shell",()=>{
 const html=read("vorschau.html");
 assert.ok(!html.includes("<iframe"));
 assert.ok(!html.includes('src="/kids/'));
 assert.ok(!html.includes("localStorage.setItem"));
 assert.ok(html.includes('href="demo-junge.html"'));
 assert.ok(html.includes('href="demo-maedchen.html"'));
 assert.ok(html.includes('href="vorschau-v78-interaktiv.html"'));
 assert.ok(fs.statSync(path.join(base,"vorschau-v78-interaktiv.html")).size>20000);
 assert.ok(html.includes('href="vorschau-v79-3d-labor.html"'));
 assert.ok(fs.statSync(path.join(base,"vorschau-v79-3d-labor.html")).size>30000);
});

test("V7.8 offline creator preview has independently usable lesson navigation",()=>{
 const html=read("vorschau-v78-interaktiv.html");
 for(const id of ["home","module","station","cards","lessonlist","stationLock","markBtn","chooseBoy","chooseGirl","counter","reset"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing control "+id);
 }
 for(const text of ["Was ist das Gebet?","Warum beten wir?","Wie bete ich?","Mein 3D-Gebet"]){
  assert.ok(html.includes(text),"Missing learning category "+text);
 }
 assert.match(html, /\bopenModule\(/);
 assert.match(html, /\bopenStation\(/);
 assert.match(html, /\bsetProfile\(/);
 assert.match(html, /\bupdateProgress\(/);
});
test("V7.8 test progress is isolated and no locked 3D step counts as viewed",()=>{
 const html=read("vorschau-v78-interaktiv.html");
 assert.match(html, /sessionStorage\.setItem\(storageKey/);
 assert.match(html, /dar\.kids\.mein-gebet\.v78\.TEST_ONLY/);
 assert.match(html, /\['boy','girl'\]/);
 assert.match(html, /get\('markBtn'\)\.hidden=!!m\.locked/);
 assert.match(html, /if\(m\.locked\)return/);
 assert.match(html, /if\(!seen\[profile\]\.includes\(key\)\)/);
 assert.match(html, /3D-Stationen zählen nicht dazu/);
 assert.doesNotMatch(html, /localStorage|indexedDB|serviceWorker|navigator\.sendBeacon|fetch\(|XMLHttpRequest|<iframe|<img|<form|type="password"|<script src=/i);
 assert.doesNotMatch(html, /https:\/\/dar-al-tawhid\.de\//);
 assert.match(html, /NICHT LIVE/);
 assert.match(html, /Keine echte Kinderanmeldung/);
});

test("V7.9 3D-lab is self-contained and never touches live Kids app",()=>{
 const html=read("vorschau-v79-3d-labor.html");
 assert.match(html, /webgl/);
 assert.match(html, /Canvas projected 3D/);
 assert.match(html, /requestAnimationFrame\(frameDraw\)/);
 assert.match(html, /pointermove/);
 assert.match(html, /function blendPose\(/);
 assert.match(html, /const frames=\[/);
 assert.match(html, /const poseNames=\[/);
 assert.match(html, /modelType:'procedural-placeholder-3d'/);
 assert.match(html, /productionApproved:false/);
 assert.match(html, /PROTOTYP · NICHT FREIGEGEBEN/);
 assert.match(html, /Original-GLB V7\.7/);
 assert.match(html, /Gebetsstellungen erkunden/);
 for(const id of ["stage","scene","play","prev","next","resetCam","speed","girl","boy","poses","stagefail"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing 3D control "+id);
 }
 assert.doesNotMatch(html, /<script[^>]+src|<iframe|<form|type="password"|rel="manifest"|serviceWorker|indexedDB|localStorage|sessionStorage|XMLHttpRequest|\bfetch\(|sendBeacon/i);
 assert.doesNotMatch(html, /https:\/\/dar-al-tawhid\.de\//);
});

test("V8.0 salam movement is two real head-only yaw phases, right then left",()=>{
 const html=read("vorschau-v80-salam-fix.html");
 assert.match(html,/function sampleTaslim\(seconds\)/);
 assert.match(html,/function taslimPhase\(seconds\)/);
 assert.match(html,/taslimActive&&!taslimPaused/);
 assert.match(html,/torsoFixedDuringTaslim:selected===8/);
 assert.match(html,/PROTOTYP · NICHT FREIGEGEBEN/);
 assert.match(html,/modelType:'procedural-placeholder-3d'/);
 assert.match(html,/productionApproved:false/);
 assert.doesNotMatch(html, /<script[^>]+src|<iframe|serviceWorker|localStorage|sessionStorage|\bfetch\(|XMLHttpRequest|https:\/\/dar-al-tawhid\.de\//i);
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0][1];
 const start=script.indexOf("const TASLIM_END");
 const end=script.indexOf("function renderPerson",start);
 assert.ok(start>0&&end>start);
 const excerpt=script.slice(start,end);
 const values=vm.runInNewContext('const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));'+
  'const mix=(a,b,t)=>a+(b-a)*t;'+excerpt+
  '[sampleTaslim(0),sampleTaslim(.8),sampleTaslim(1.63),sampleTaslim(2.45),sampleTaslim(3)];');
 assert.equal(values[0],0);
 assert.ok(values[1]<-1&&values[1]>-1.15,"first head turn MUST point to the figure's own anatomical right (-X)");
 assert.ok(Math.abs(values[2])<1e-6,"passes through centered view");
 assert.ok(values[3]>1,"second head turn MUST point to the figure's own anatomical left (+X)");
 assert.ok(values[4]>1,"left head turn must remain visible on completion");
 const poses=script.slice(script.indexOf("const frames=["),script.indexOf("const keys=",script.indexOf("const frames=[")));
 const array=vm.runInNewContext('function frame(o={}){const d={pelvis:[0,1.43,0],chest:[0,2.26,0],head:[0,2.94,.015],shoulderY:2.4,shoulderZ:0,elbowY:2.03,elbowZ:.29,handY:2.16,handZ:.40,kneeY:.61,kneeZ:.10,ankleY:.16,ankleZ:0,headTurn:0,...o};const S=sgn=>sgn*.43,H=sgn=>sgn*.135;return{pelvis:d.pelvis,chest:d.chest,head:d.head,shoulderL:[S(-1),d.shoulderY,d.shoulderZ],shoulderR:[S(1),d.shoulderY,d.shoulderZ],elbowL:[S(-1)*1.15,d.elbowY,d.elbowZ],elbowR:[S(1)*1.15,d.elbowY,d.elbowZ],handL:[H(-1),d.handY,d.handZ],handR:[H(1),d.handY,d.handZ+.03],kneeL:[-.21,d.kneeY,d.kneeZ],kneeR:[.21,d.kneeY,d.kneeZ],ankleL:[-.22,d.ankleY,d.ankleZ],ankleR:[.22,d.ankleY,d.ankleZ],headTurn:d.headTurn}};'+poses+'frames');
 assert.equal(array.length,9);
 assert.deepEqual(JSON.parse(JSON.stringify(array[8])),JSON.parse(JSON.stringify(array[7])),"taslim torso must exactly equal Tashahhud torso");
});

test("V8.1 Qibla perspective opens behind praying figure and preserves anatomically correct order",()=>{
 const html=read("vorschau-v81-betendenperspektive.html");
 assert.match(html,/yaw=Math\.PI,pitch=\.19/);
 assert.match(html,/id="viewPoint"/);
 assert.match(html,/cameraYaw:yaw,viewerFromBehind:Math\.cos\(yaw\)<0/);
 assert.match(html,/eigene RECHTE|DEINER RECHTEN/);
 assert.match(html,/eigenen linken|DEINER LINKEN/i);
 assert.match(html,/taslimKeys=\[\[0,0\],\[\.62,-1\.07\]/);
 assert.match(html,/productionApproved:false/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|serviceWorker|\bfetch\(|XMLHttpRequest/i);
});

test("V8.2 original recovery accepts ONLY frozen V7.7 SHA256 GLB and PNG",()=>{
 const html=read("vorschau-v82-original-check.html");
 for(const id of ["drop","files","img","imagePreview","modelState","imageState","rigState","clipsState","reset","report","status"])
   assert.ok(html.includes('id="'+id+'"'),"Missing original intake control "+id);
 assert.match(html,/353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa/);
 assert.match(html,/062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9/);
 assert.match(html,/function sha256pure\(/);
 assert.match(html,/function parseGlb\(/);
 assert.match(html,/function readZip\(/);
 assert.match(html,/function unzipEntry\(/);
 assert.match(html,/DecompressionStream\('deflate-raw'\)/);
 assert.match(html,/let list=\[\.\.\.files\];clear\(\)/);
 assert.match(html,/productionApproved:false/);
 assert.match(html,/originalIdentityApproved:false/);
 assert.match(html,/Kein Live-Push|kein Live-Push/);
 assert.doesNotMatch(html, /\bfetch\(|XMLHttpRequest|sendBeacon|serviceWorker|localStorage|sessionStorage|<script[^>]+src|<iframe|<form|rel="manifest"/i);
});

test("V8.3 original identity comparator is viewable and never auto-approves a GLB",()=>{
 const html=read("vorschau-v83-originalidentitaet.html");
 for(const id of ["boy","girl","original","candidate","referenceFallback","sourceFile","renderFile","specs","angles","downloadReport"])
  assert.ok(html.includes('id="'+id+'"'),"missing identity-preview element "+id);
 for(const name of ["figur-junge-original.png","figur-maedchen-original.png"])
  assert.ok(html.includes(name),name+" original image missing");
 assert.match(html,/original3DIdenticalApproved:false/);
 assert.match(html,/poseReviewApproved:false/);
 assert.match(html,/productionApproved:false/);
 assert.match(html,/0 \/ 2/);
 assert.match(html,/0 \/ 5/);
 assert.match(html,/Nur internes Entwicklungslabor/);
 assert.match(html,/const noLeft=angle==='left'/);
 assert.match(html,/originalLeftProfileLocated:false/);
 assert.match(html,/mirrorIsNotIndependentView:true/);
 assert.match(html,/viewCompletenessApproved:false/);
 assert.match(html,/\$\('original'\)\.hidden=noLeft\|\|!sourceOk/);
 assert.doesNotMatch(html, /<script[^>]+src|<iframe|serviceWorker|indexedDB|localStorage|sessionStorage|\bfetch\(|XMLHttpRequest|sendBeacon/i);
});
