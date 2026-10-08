#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import worker from "../cloudflare/test-app-worker.js";

const root=path.resolve(new URL("..",import.meta.url).pathname);
const source=fs.readFileSync(path.resolve(root,"cloudflare/test-app-worker.js"),"utf8");
assert.doesNotMatch(source,/OPENAI_API_KEY|researchIlmWithOpenAI|composeIlmWithOpenAI|ilm-openai-research\.js/);
const readFunction=(a,b)=>{
  const start=source.indexOf(a),stop=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&stop>start);
  return source.slice(start,stop);
};
for(const section of [
  readFunction("async function ilmOpenResearch(", "// ILM_SCIENCE_COMPOSE_"),
  readFunction("async function ilmScienceCompose(", "export default")
]){
  assert.doesNotMatch(section,/env\.AI\.run|api\.openai\.com|researchIlmWithOpenAI\s*\(|composeIlmWithOpenAI\s*\(/i,
    "Majlis code must not invoke a paid second provider");
}

const saved=globalThis.fetch;
let onlyGeminiRequests=0;
const env={
 GEMINI_API_KEY:"gemini-test-only",
 ILM_GEMINI_GLOBAL_LIMIT:{limit:async()=>({success:true})},
 ILM_GEMINI_USER_LIMIT:{limit:async()=>({success:true})},
 OPENAI_API_KEY:"must-never-be-read",
 AI:{run:async()=>{throw Error("Workers AI MUST NOT be used for Majlis");}}
};
const post=(route,payload)=>new Request("https://dar-al-tawhid.de"+route,{
 method:"POST",headers:{"Content-Type":"application/json","Origin":"https://dar-al-tawhid.de"},
 body:JSON.stringify(payload)
});
try {
  globalThis.fetch=async(url)=>{
    assert.match(String(url),/^https:\/\/generativelanguage\.googleapis\.com\//);
    onlyGeminiRequests++;
    return Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429});
  };
  const response=await worker.fetch(post("/test/api/ilm/research",{
    question:"Welche Überlieferung behandelt die Pest in Schām?",mode:"detailed"
  }),env);
  const data=await response.json();
  assert.equal(response.status,429);
  assert.equal(data.error,"gemini_quota_exhausted");
  assert.equal(data.provider,"gemini");
  assert.equal(data.internalSourcesAvailable,true);
  const reply=await worker.fetch(post("/test/api/ilm/compose",{
    question:"Hände heben beim Rukūʿ im Gebet?",
    evidence:[{work:"Ṣaḥīḥ al-Buḫārī",reference:"Kitāb aṣ-Ṣalāh",
      authenticity:"ṣaḥīḥ",verification_status:"verified",
      statement:"Der Gesandte Allahs hob beim Rukūʿ die Hände und beim Aufrichten aus dem Rukūʿ."}]
  }),env);
  const proof=await reply.json();
  assert.equal(reply.status,429);
  assert.equal(proof.error,"gemini_quota_exhausted");
  assert.equal(proof.provider,"gemini");
  assert.equal(onlyGeminiRequests,2);
  console.log("PASS: Gemini-only Majlis; quota 429 never triggers OpenAI/Workers AI; internal evidence retained");
}finally {globalThis.fetch=saved;}
