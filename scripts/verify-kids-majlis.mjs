/* Offline, zero-cost functional smoke tests for the protected Kids Majlis pilot.
   Run: node scripts/verify-kids-majlis.mjs */
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const apiSource=readFileSync(new URL("../cloudflare/kids-majlis-api.js",import.meta.url),"utf8");
const frontSource=readFileSync(new URL("../kids/majlis-kids.js",import.meta.url),"utf8");
const verifiedContent=JSON.parse(readFileSync(new URL("../kids/data/verified-content.json",import.meta.url),"utf8"));
const shells=["index","start","shell"].map(name=>readFileSync(new URL("../kids/"+name+".html",import.meta.url),"utf8"));
const noImports=apiSource.replace(/^import .*?;\s*$/gm,"")
  .replace("export async function handleKidsMajlisApi","async function handleKidsMajlisApi")
  .replace("export const kidsMajlisTesting","const kidsMajlisTesting");
let calls=0;
const synth=async (env,text)=>{calls++;return {ok:true,bytes:new Uint8Array([73,68,51]),contentType:"audio/mpeg"}};
const api=new Function("synthesizeDarVoice","isVoiceConfigured","KIDS_VERIFIED_CONTENT",noImports+"\nreturn {handleKidsMajlisApi,kidsMajlisTesting};")(synth,()=>true,verifiedContent);
new Function(frontSource);
assert.equal(shells.every(s=>(s.match(/kids\/majlis-kids\.js\?v=1/g)||[]).length===1),true);
assert.equal(api.kidsMajlisTesting.choose("Wer ist Allah?","6–8").id,"allah");
assert.equal(api.kidsMajlisTesting.choose("Wer ist Allah?","4–5").text.split(/[.!?]/).length<api.kidsMajlisTesting.choose("Wer ist Allah?","9–10").text.split(/[.!?]/).length,true);
assert.equal(api.kidsMajlisTesting.choose("Was ist Takfir?","9–10").id,"restricted");
assert.equal(api.kidsMajlisTesting.choose("Mein Passwort ist 123","6–8").id,"privacy");
assert.equal(api.kidsMajlisTesting.choose("jemand schlägt mich","6–8").id,"help");
assert.equal(api.kidsMajlisTesting.choose("Wer wohnt im Mond?","6–8").id,"unknown");
assert.equal(api.kidsMajlisTesting.choose("Rabbi zidni ilma", "6–8").id,"library:dua-032-rabbi-zidni-ilma");
assert.equal(api.kidsMajlisTesting.choose("Welches Dua schützt vor Einflüsterungen?", "4–5").id,"age_restricted");
assert.equal(api.kidsMajlisTesting.choose("Welches Dua schützt vor Einflüsterungen?", "9–10").id,"library:dua-079-rabbi-audhu-bika-min-hamazati-sh-shayatin");
assert.equal(api.kidsMajlisTesting.choose("Schäme mich zu fragen", "9–10").id,"library:aishah-ansar-learning");
assert.equal(api.kidsMajlisTesting.choose("Schäme mich zu fragen", "6–8").id,"age_restricted");
assert.equal(api.kidsMajlisTesting.choose("Mein Passwort ist xyz; Rabbi zidni", "9–10").id,"privacy");
assert.equal(api.kidsMajlisTesting.choose("Ich wohne hier und jemand schlägt mich", "6–8").id,"help");

const limiter={limit:async()=>({success:true})};
const parentCode="KIDS-PILOT-PARENT-ACCESS-VERY-STRONG-2026";
const env={
  KIDS_MAJLIS_PARENT_AUTH_ENABLED:"true",
  KIDS_MAJLIS_PARENT_PASSCODE:parentCode,
  KIDS_MAJLIS_SIGNING_KEY:"long-secret-key-for-kids-majlis-hmac-unit-tests-2026",
  KIDS_MAJLIS_LIMITER:limiter,
  KIDS_MAJLIS_VOICE_LIMITER:limiter
};
const endpoint="/kids/api/majlis/";
const make=(path,method="GET",data=undefined,headers={})=>{
  const h=new Headers({
    "Origin":"https://dar-al-tawhid.de",
    "X-DAR-Majlis-Original-Host":"dar-al-tawhid.de",
    "Sec-Fetch-Site":"same-origin",...headers
  });
  if(data!==undefined)h.set("Content-Type","application/json");
  return new Request("https://dar-admin-publisher.example"+endpoint+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data)});
};
let tests=0;
async function check(req,state,status){
  const res=await api.handleKidsMajlisApi(req,state);
  assert.equal(res.status,status,"status "+new URL(req.url).pathname+" body="+await res.clone().text()+" origin="+req.headers.get("origin")+" host="+req.headers.get("x-dar-majlis-original-host")+" fetchSite="+req.headers.get("sec-fetch-site"));
  tests++;return res;
}
await check(make("session"),{},503); // nothing opens without secrets and rate limits
const wrong=await check(make("session","POST",{code:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}),env,403);
assert.equal((await wrong.json()).error,"invalid_parent_code");
const ready=await check(make("session","POST",{code:parentCode}),env,200);
const cookie=ready.headers.get("Set-Cookie");
assert.ok(cookie?.includes("HttpOnly")&&cookie.includes("SameSite=Strict"));
const bearer=cookie.split(";")[0];
const reqAuth=(path,method="GET",data=undefined)=>make(path,method,data,{"Cookie":bearer});
const answer=await check(reqAuth("answer","POST",{question:"Wer ist Allah?",age:"4–5"}),env,200);
const payload=await answer.json();
assert.ok(payload.answerId&&payload.source&&payload.verified);
const unknown=await check(reqAuth("answer","POST",{question:"Wie groß ist Saturn?",age:"6–8"}),env,200);
assert.equal((await unknown.json()).verified,false);
const tooMuch=await check(reqAuth("answer","POST",{question:"A".repeat(351)}),env,400);
assert.equal((await tooMuch.json()).error,"invalid_question");
await check(make("answer","POST",{question:"Wer ist Allah?"}),env,401);
const notEnabled=await check(reqAuth("speak","POST",{answerId:payload.answerId}),env,503);
assert.equal((await notEnabled.json()).error,"owner_voice_not_enabled");
assert.equal(calls,0,"No billable synthesis on disabled branch");
env.KIDS_MAJLIS_TTS_ENABLED="true";
env.ELEVENLABS_VOICE_ID="configured-master-voice-test";
env.ELEVENLABS_MODEL_ID="eleven_v4";
env.ELEVENLABS_PRONUNCIATION_DICTIONARY_ID="configured-dictionary-test";
const notSigned=await check(reqAuth("speak","POST",{answerId:"forged.value"}),env,403);
assert.equal((await notSigned.json()).error,"invalid_answer_reference");
assert.equal(calls,0);
const voice=await check(reqAuth("speak","POST",{answerId:payload.answerId}),env,200);
assert.match(voice.headers.get("content-type"),/audio\/mpeg/);
assert.equal(calls,1);
const left=await check(reqAuth("session","DELETE"),env,200);
assert.match(left.headers.get("Set-Cookie"),/Max-Age=0/);
const cross=new Request("https://dar-admin-publisher.example"+endpoint+"session",{
 method:"GET",headers:{"Origin":"https://evil.example","Sec-Fetch-Site":"cross-site","X-DAR-Majlis-Original-Host":"dar-al-tawhid.de"}
});
await check(cross,env,403);
console.log("KIDS MAJLIS: PASS; backend smoke tests="+tests+", script parse=pass, three Kids shells=pass, no external calls.");
