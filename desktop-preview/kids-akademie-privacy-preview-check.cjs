#!/usr/bin/env node
"use strict";
/* Desktop-preview lane only; does not record sound or generate files. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync(path.join(__dirname,"kids-akademie-unterricht.html"),"utf8");
const blocked=['id="openWrite"','id="openVoice"','id="answer"','id="mic"',
 'id="voicePlayback"',"getUserMedia","MediaRecorder","beginVoiceRecording","finishRecording",
 "SpeechRecognition","webkitSpeechRecognition"];
for(const word of blocked)assert.ok(!html.includes(word),"Child privacy regression: "+word);
for(const word of ['id="choices"','id="check"','id="choiceAudioHelp"',
 'function academySelectableQuestion(','function showQuestion()',
 'function speak(index,custom)','function playRecitation(','const VERSION="academy-v4"',
 'KIDS_LESSON_CAPSULE_RESTORE_V1446']){
 assert.ok(html.includes(word),"Missing current academy contract: "+word);
}
assert.ok(html.includes('name="robots" content="noindex,nofollow"'),"QA preview must not be indexed");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim());
assert.ok(inline.length,"Inline application script missing");
for(const [index,code]of inline.entries())new vm.Script(code,{filename:"academy-preview-inline-"+index+".js"});
console.log("PASS: Academy desktop QA preview: only answer buttons, no microphone, scripts compile, audio playback preserved.");
