/* Offline, zero-cost functional smoke tests for the protected Kids Majlis pilot.
   Run: node scripts/verify-kids-majlis.mjs */
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const apiSource=readFileSync(new URL("../cloudflare/kids-majlis-api.js",import.meta.url),"utf8");
const frontSource=readFileSync(new URL("../kids/majlis-kids.js",import.meta.url),"utf8");
const quranSearchSource=readFileSync(new URL("../kids/majlis-quran-search.js",import.meta.url),"utf8");
const fullQuranData=JSON.parse(readFileSync(new URL("../data/quran-search-index.json",import.meta.url),"utf8"));
const searchWindow={};
const quranFetchCalls=[];
const fullQuranSearch=new Function("window","fetch",quranSearchSource+"\nreturn window.DarKidsQuranSearch;")(
 searchWindow,async function(url){
   quranFetchCalls.push(url);
   assert.equal(url,"/data/quran-search-index.json");
   return new Response(JSON.stringify(fullQuranData),{status:200,headers:{"Content-Type":"application/json"}});
 });

const knowledgeSource=readFileSync(new URL("../cloudflare/kids-majlis-knowledge.js",import.meta.url),"utf8");
const knowledgeIndex=JSON.parse(readFileSync(new URL("../kids/data/majlis-knowledge-v1.json",import.meta.url),"utf8"));
assert.equal(knowledgeIndex.duas.length,120);
assert.equal(knowledgeIndex.quiz.length,900);
assert.equal(knowledgeIndex.quran.ayahCounts.length,114);
assert.equal(knowledgeIndex.quran.ayahCounts.reduce((x,y)=>x+y,0),6236);
const knowledgeBody=knowledgeSource.replace(/^import .*?;\s*$/gm,"")
 .replace(/^export \{[^}]+\};?\s*$/gm,"")
 .replace("export const majlisKnowledgeTest","const majlisKnowledgeTest");
const knowledge=new Function("INDEX",knowledgeBody+"\nreturn {findKnowledge,findKnowledgeById,mediaForCanonicalId,quranMedia,allahAlam,profilePrefix,majlisKnowledgeTest};")(knowledgeIndex);
const verifiedContent=JSON.parse(readFileSync(new URL("../kids/data/verified-content.json",import.meta.url),"utf8"));
const shells=["index","start","shell"].map(name=>readFileSync(new URL("../kids/"+name+".html",import.meta.url),"utf8"));
const noImports=apiSource.replace(/^import .*?;\s*$/gm,"")
  .replace("export async function handleKidsMajlisApi","async function handleKidsMajlisApi")
  .replace("export const kidsMajlisTesting","const kidsMajlisTesting");
let calls=0;
const synth=async (env,text)=>{calls++;return {ok:true,bytes:new Uint8Array([73,68,51]),contentType:"audio/mpeg"}};
const api=new Function("synthesizeDarVoice","isVoiceConfigured","KIDS_VERIFIED_CONTENT","findKnowledge","findKnowledgeById","mediaForCanonicalId","allahAlam","profilePrefix",
  noImports+"\nreturn {handleKidsMajlisApi,kidsMajlisTesting};")(synth,()=>true,verifiedContent,
  knowledge.findKnowledge,knowledge.findKnowledgeById,knowledge.mediaForCanonicalId,knowledge.allahAlam,knowledge.profilePrefix);
new Function(frontSource);
assert.equal(fullQuranSearch.isQuestion("Wo steht im Qurʾān etwas über Geduld?"),true);
assert.equal(fullQuranSearch.isQuestion("Wie mache ich Wuḍūʾ?"),false);
assert.equal(quranFetchCalls.length,0,"Qurʾān should not be downloaded on app boot");
assert.equal(fullQuranData.length,6236);
const fullIndex=fullQuranSearch.__test.validate(fullQuranData);
assert.ok(fullIndex&&fullIndex.byRef.size===6236,"all 6236 unique references must match Quran metadata");
assert.equal(fullIndex.byRef.get("114:6").globalAyah,6236);
assert.equal(fullIndex.byRef.get("2:255").globalAyah,262);
assert.equal(fullQuranSearch.__test.validate(fullQuranData.slice(0,-1)),null,"incomplete index must fail closed");
assert.equal(fullQuranSearch.__test.validate([fullQuranData[0],...fullQuranData.slice(0,-1)]),null,"duplicate index must fail closed");
const qr=await fullQuranSearch.search("Qurʾān 2:255");
assert.equal(qr.status,"found");
assert.equal(qr.exact,true);
assert.equal(qr.results[0].reference,"Qurʾān 2:255");
assert.equal(qr.results[0].recitationUrl,"/quran-audio/ar.alafasy/262.mp3?v=1063");
assert.ok(qr.results[0].arabic.length>70&&qr.results[0].german.length>80);
const lastAyah=await fullQuranSearch.search("Sure 114 Vers 6");
assert.equal(lastAyah.status,"found");assert.equal(lastAyah.results[0].reference,"Qurʾān 114:6");
const arabicText=await fullQuranSearch.search("Quran قُلْ هُوَ ٱللَّهُ أَحَدٌ");
assert.equal(arabicText.status,"found");
assert.equal(arabicText.results[0].reference,"Qurʾān 112:1","Arabic exact phrase should identify Sūrah al-Ikhlāṣ");
const translitText=await fullQuranSearch.search("Quran Qul huwal laahu ahad");
assert.equal(translitText.status,"found");
assert.equal(translitText.results[0].reference,"Qurʾān 112:1","existing Latin transcription should resolve to identical ayah");
const germanText=await fullQuranSearch.search("Quran Sag: Er ist Allah, ein Einer");
assert.equal(germanText.status,"found");
assert.equal(germanText.results[0].reference,"Qurʾān 112:1","German original translation phrase should identify same ayah");
const namedSurah=await fullQuranSearch.search("Surah Al-Ikhlas");
assert.equal(namedSurah.status,"found");
assert.equal(namedSurah.total,4);
assert.deepEqual(namedSurah.results.map(v=>v.ayah),[1,2,3,4]);
assert.ok(namedSurah.results.every(v=>v.surah===112));
const namedVerse=await fullQuranSearch.search("Surah Al-Ikhlas Vers 4");
assert.equal(namedVerse.status,"found");
assert.equal(namedVerse.results[0].reference,"Qurʾān 112:4");
const byNumber=await fullQuranSearch.search("Surah 2");
assert.equal(byNumber.status,"found");
assert.equal(byNumber.total,286);
assert.equal(byNumber.results.length,5);
assert.equal((await fullQuranSearch.search("Surah 2 Vers 999")).status,"not_found");
const invalidAyah=await fullQuranSearch.search("Qurʾān 2:999");
assert.equal(invalidAyah.status,"not_found");
const unknownWord=await fullQuranSearch.search("Quran fiktivwortxyzzzz");
assert.equal(unknownWord.status,"not_found");
const german=await fullQuranSearch.search("Wo steht im Qurʾān etwas über Geduld?");
assert.equal(german.status,"found");assert.ok(german.results.length>0);
assert.ok(german.results.every(v=>v.reference.startsWith("Qurʾān ")&&v.arabic&&v.german));
const broad=await fullQuranSearch.search("Quran Allah");
assert.equal(broad.status,"too_broad");
assert.equal(quranFetchCalls.length,1,"one lazy Quran corpus fetch reused for every subsequent query");

assert.equal(shells.every(s=>(s.match(/kids\/majlis-kids\.js\?v=1/g)||[]).length===1),true);
assert.equal(shells.every(s=>(s.match(/kids\/majlis-quran-search\.js\?v=1/g)||[]).length===1),true);
assert.equal(shells.every(s=>s.indexOf("majlis-quran-search.js")<s.indexOf("majlis-kids.js")),true);

assert.equal(api.kidsMajlisTesting.choose("Wer ist Allah?","6–8").id,"allah");
assert.equal(api.kidsMajlisTesting.choose("Wer ist Allah?","4–5").text.split(/[.!?]/).length<api.kidsMajlisTesting.choose("Wer ist Allah?","9–10").text.split(/[.!?]/).length,true);
assert.equal(api.kidsMajlisTesting.choose("Was ist Takfir?","9–10").id,"restricted");
assert.equal(api.kidsMajlisTesting.choose("Mein Passwort ist 123","6–8").id,"privacy");
assert.equal(api.kidsMajlisTesting.choose("jemand schlägt mich","6–8").id,"help");
assert.equal(api.kidsMajlisTesting.choose("Wer wohnt im Mond?","6–8").id,"unknown");
assert.equal(api.kidsMajlisTesting.choose("Rabbi zidni ilma", "6–8").id,"kb:dua:dua-knowledge");
assert.equal(api.kidsMajlisTesting.choose("Welches Dua schützt vor Einflüsterungen?", "4–5").id,"kb:dua:dua-protection");
assert.equal(api.kidsMajlisTesting.choose("Welches Dua schützt vor Einflüsterungen?", "9–10").id,"kb:dua:dua-protection");
assert.equal(api.kidsMajlisTesting.choose("Schäme mich zu fragen", "9–10").id,"library:aishah-ansar-learning");
assert.equal(api.kidsMajlisTesting.choose("Schäme mich zu fragen", "6–8").id,"age_restricted");
assert.equal(api.kidsMajlisTesting.choose("Mein Passwort ist xyz; Rabbi zidni", "9–10").id,"privacy");
assert.equal(api.kidsMajlisTesting.choose("Ich wohne hier und jemand schlägt mich", "6–8").id,"help");
assert.ok(knowledgeIndex.duas.every(x=>x.audio.arabic&&x.audio.german&&x.audio.slow));
const sleeping=knowledge.findKnowledge("Ich möchte ein Dua vor dem Schlafen", "6–8", "girl");
assert.equal(sleeping.id,"kb:dua:dua-sleep");
assert.ok(sleeping.text.includes("Schwester"));
assert.ok(sleeping.media?.audio?.arabic?.includes("/kids-dua-arabic-audio/"));
assert.ok(sleeping.media.segments.length>0);
const brother=knowledge.findKnowledgeById(sleeping.id, "6–8", "boy");
assert.ok(brother.text.includes("Bruder"));
assert.equal(brother.source,sleeping.source);
const quran=knowledge.findKnowledge("Kann ich Qurʾān 2:255 hören?", "9–10", "girl");
assert.equal(quran.id,"verse:2:255");
assert.ok(quran.media?.recitationUrl?.includes("/262.mp3"));
assert.equal(knowledge.findKnowledge("Qurʾān 2:999", "9–10", "girl"),null);
const tawhidAyah=knowledge.findKnowledge("Wo steht im Qurʾān, dass Allah einer ist?", "6–8", "boy");
assert.equal(tawhidAyah?.id,"verse:112:1");
const researchAyah=knowledge.findKnowledge("In welcher Sure steht Rabbi zidni?", "6–8", "girl");
assert.equal(researchAyah?.id,"verse:20:114");
assert.ok(researchAyah?.media?.excerpt?.arabic);
assert.ok(researchAyah?.media?.excerpt?.meaning);
assert.match(researchAyah.media.recitationUrl,/^\/quran-audio\/ar\.alafasy\//);
assert.equal(knowledge.findKnowledgeById(tawhidAyah.id,"6–8","boy").text,tawhidAyah.text);
assert.ok(knowledge.majlisKnowledgeTest.findQuiz("Ein anderes unbekanntes Thema", "6–8", "boy")===null);

assert.equal(knowledge.findKnowledge("Warum gibt es Sterne auf dem Mars?", "6–8", "boy"),null);
assert.ok(knowledge.allahAlam("girl").text.includes("Allāhu aʿlam"));
assert.equal(knowledge.findKnowledge("Wie kann ich dieses Recht beurteilen?", "4–5", "girl"),null);


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
assert.match(payload.answer,/Bruder/);
const duaAnswer=await check(reqAuth("answer","POST",{question:"Ich möchte ein Dua vor dem Schlafen",age:"6–8",gender:"girl"}),env,200);
const duaPayload=await duaAnswer.json();
assert.match(duaPayload.answer,/Schwester/);
assert.equal(duaPayload.media?.kind,"dua");
assert.ok(duaPayload.media?.audio?.arabic);
const verseAnswer=await check(reqAuth("answer","POST",{question:"Bitte Qurʾān 2:255 hören",age:"9–10",gender:"boy"}),env,200);
const versePayload=await verseAnswer.json();
assert.equal(versePayload.media?.kind,"quran");
assert.ok(versePayload.media?.recitationUrl?.includes("/262.mp3"));
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
