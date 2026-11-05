#!/usr/bin/env node
"use strict";
/* Choice-only successor: no child keyboard, voice recording or microphone. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("kids/akademie/index.html"),portal=read("kids/kids-academy-portal-v1421.js");
for(const text of ['id="kids-academy-writing-keyboard-v1438"','id="answer"','id="openWrite"','id="openVoice"','id="mic"','id="voicePlayback"','getUserMedia','MediaRecorder','beginVoiceRecording','data-academy-typing="true"']){
 assert.ok(!page.includes(text),"Removed writing or recording code remains: "+text);
}
assert.ok(page.includes('function mode(){')&&page.includes('dataset.answerMode="choices"'),"Choice-only mode must be enforced");
assert.ok(page.includes('function scrollAcademyViewTop(){'),"Existing screen scrolling missing");
assert.ok(page.includes('id="lessonNavigation"')&&page.includes('id="stageSurface"'),"Existing lesson layout missing");
new vm.Script(portal,{filename:"kids-academy-portal-v1421.js"});
assert.ok(portal.includes('edgeScroll=1426'),"Existing portal docking missing");
console.log("PASS Kids Academy: no text input or microphone; original focus layout remains.");
