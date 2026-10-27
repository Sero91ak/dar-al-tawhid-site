#!/usr/bin/env node
"use strict";
/* No-cost end-to-end request-payload tests for real Voice Studio adapter.
 * VM substitutes fetch: it cannot contact ElevenLabs or charge credits.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const path="cloudflare/video-studio/voice.js";
let code=fs.readFileSync(path,"utf8")
  .replace(/^import .*?;\s*$/gm,"")
  .replace(/^export /gm,"");
const calls=[];
const sandbox={
  console,Uint8Array,ArrayBuffer,URL,
  DAR_ISLAMIC_EXPANDED_LEXICON:[],
  fetch:async(_endpoint,options)=>{
    calls.push(JSON.parse(options.body));
    return {ok:true,arrayBuffer:async()=>new Uint8Array([73,68,51,1,2,3]).buffer};
  },
};
vm.runInNewContext(code+"\nthis.__testSynth = synthesizeDarVoice;\n",sandbox,{filename:path});
const synth=sandbox.__testSynth;
const env={
  ELEVENLABS_API_KEY:"UNIT_TEST_DO_NOT_USE_REAL_KEY",
  ELEVENLABS_MODEL_ID:"eleven_v4",
  ELEVENLABS_VOICE_ID:"DkU7j9uO4ZEtLD2iRZSH",
  ELEVENLABS_PRONUNCIATION_DICTIONARY_ID:"LEGACY_ARABIC_PLS_DO_NOT_USE_FOR_GERMAN",
  ELEVENLABS_PRONUNCIATION_DICTIONARY_VERSION_ID:"OLD_COLLIDING_VERSION"
};
async function test(){
  let result=await synth(env,"Nur das Gebet.",{profile:"kids_lesson"});
  assert.equal(result.ok,true);
  assert.equal(result.pronunciationDictionaryId,null);
  assert.equal(result.languageScope,"de");
  assert.equal(calls[0].text,"Nur das Gebet.");
  assert.equal(calls[0].model_id,"eleven_v4");
  assert.equal(Object.hasOwn(calls[0],"pronunciation_dictionary_locators"),false);
  assert.equal(calls[0].language_code,"de","German 'Nur' must be explicitly language-locked");

  result=await synth(env,"Antwort zwei: Nur für Erwachsene.",{profile:"quiz"});
  assert.equal(result.ok,true);
  assert.equal(calls[1].text,"Antwort zwei: Nur für Erwachsene.");
  assert.equal(calls[1].language_code,"de");
  assert.equal(Object.hasOwn(calls[1],"pronunciation_dictionary_locators"),false);

  result=await synth(env,"نُور",{profile:"dua_arabic"});
  assert.equal(result.ok,true);
  assert.equal(result.languageScope,"ar");
  assert.equal(calls[2].language_code,"ar");
  assert.equal(calls[2].apply_text_normalization,"off");
  assert.equal(Object.hasOwn(calls[2],"pronunciation_dictionary_locators"),false);

  result=await synth(env,"نُور",{profile:"gentle"});
  assert.equal(result.ok,true);
  assert.equal(result.languageScope,"ar");
  assert.equal(calls[3].language_code,"ar");

  const expectedCallCount=calls.length;
  for(const [script,profile] of [
    ["Nur das Gebet. نُور","quiz"],
    ["Der Prophet ﷺ sagte etwas.","kids_story"],
    ["Alhamdulillah","dua_arabic"]
  ]){
    result=await synth(env,script,{profile});
    assert.equal(result.ok,false);
    assert.match(result.reason,/Sprachtrennung/);
    assert.equal(calls.length,expectedCallCount,"Mixed language was billed");
  }
  console.log("PASS: DE nur stays German, native Arabic remains ar/Fuṣḥā, mixed script blocked, zero live API calls");
}
test().catch(error=>{console.error(error);process.exitCode=1;});
