#!/usr/bin/env node
"use strict";
/*
 * Real scheduler function under an isolated mocked Web Audio clock.
 * Zero synthesis, zero real audio, no browser dependency.
 */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync("kids/dua-smart-learn.js","utf8");
const start=source.indexOf("  function playCleanSequence(");
const end=source.indexOf("  var layoutFrame=",start);
assert(start>=0&&end>start,"Cannot isolate production word scheduler");
const fnText=source.slice(start,end).replace("    }).catch(function(){\n      if(!stillCurrent())return;", "    }).catch(function(error){\n      if(error)console.error(error.stack||String(error));\n      if(!stillCurrent())return;")+"\nplayCleanSequence;";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function player(decodeDelayMs){
  const counts={active:0,maxActive:0,calls:0,scheduled:[],messages:[]};
  const context={
    currentTime:0,
    resume:()=>Promise.resolve(),
    createBufferSource(){
      return {
        buffer:null,
        connect(){},
        start(when,offset,duration){counts.scheduled.push({when,offset,duration})},
        stop(){},
        onended:null
      };
    },
    createGain(){
      return {connect(){},gain:{
        setValueAtTime(){},linearRampToValueAtTime(){}
      }};
    },
    destination:{}
  };
  const sandbox={
    playToken:0,currentDua:{id:"test"},currentIndex:0,CLEAN_GAP:0.19,
    cleanPlayback:null,playing:false,mode:"",
    cleanContextReady:()=>context,
    stopAudio(){sandbox.playToken++;sandbox.cleanPlayback=null},
    cleanStop(){sandbox.cleanPlayback=null},
    paintControls(){},
    setStatus(message){counts.messages.push(message)},
    cleanDecode(url){
      counts.calls++;counts.active++;
      counts.maxActive=Math.max(counts.maxActive,counts.active);
      return new Promise(resolve=>setTimeout(()=>{
        counts.active--;
        resolve({buffer:{id:url},start:0.15,end:0.91});
      },decodeDelayMs));
    },
    requestAnimationFrame(){return 1},
    cancelAnimationFrame(){},
    saveProgress(){},paintSelection(){},queueFocusedWord(){},
    Promise,Array,Math,Number,console
  };
  const run=vm.runInNewContext(fnText,sandbox,{timeout:2000});
  return {run,sandbox,counts};
}
async function check(){
  const words=Array.from({length:37},(_,i)=>"/audio/w"+i+".m4a");
  const segments=words.map((_,i)=>({index:i}));
  const full=player(1);
  assert.equal(full.run(words,segments,"follow","Vorlesen"),true);
  for(let i=0;i<100&&full.counts.scheduled.length!==37;i++)await sleep(4);
  assert.equal(full.counts.calls,37,"All 37 words should be decoded");
  assert.equal(full.counts.scheduled.length,37,"All words should have an audio start");
  assert(full.counts.maxActive<=5,"Too many simultaneous decoded/fetched words");
  assert(full.counts.scheduled.every((x,i,a)=>i===0||x.when>a[i-1].when),
      "Word order must stay chronological");
  assert(full.counts.scheduled.every(x=>x.duration>=.5),"Expected complete word spans");

  // Cancelling midway must not start the next batch of URLs.
  const cancelled=player(12);
  assert.equal(cancelled.run(words,segments,"follow","Vorlesen"),true);
  await sleep(4);
  cancelled.sandbox.stopAudio();
  await sleep(35);
  assert(cancelled.counts.calls<=5,
      "Cancelled player continued downloading words after mode change");
  assert.equal(cancelled.counts.scheduled.length,0,
      "Cancelled player scheduled old audio after mode change");
  console.log("KIDS DUA STREAM PASS: 37/37 words, at most 5 parallel, ordered, cancellation blocks late audio");
}
check().catch(error=>{console.error(error);process.exitCode=1});
