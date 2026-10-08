#!/usr/bin/env node
import assert from "node:assert/strict";
import { composeIlmWithGroqFree } from "../cloudflare/ilm-groq-free-bridge.js";
import worker from "../cloudflare/test-app-worker.js";

const original=globalThis.fetch;
const question="Welche Haltung wird beim Rukūʿ beschrieben?";
const evidence={speaker:"ʿAbdullāh ibn ʿUmar",work:"Ṣaḥīḥ al-Buḫārī",reference:"Nr. 735",
  verification_status:"verified",authenticity:"ṣaḥīḥ",
  statement:"Beim Rukūʿ hob der Prophet seine Hände und nach dem Aufrichten ebenfalls."};
const sources=[{number:1,work:evidence.work,reference:evidence.reference,
  verification_status:"verified",authenticity:evidence.authenticity,excerpt:evidence.statement}];
const request=new Request("https://dar-al-tawhid.de/test/api/ilm/compose",{
  method:"POST",headers:{"Content-Type":"application/json","Origin":"https://dar-al-tawhid.de"},
  body:JSON.stringify({question,evidence:[evidence]})
});
let calls=[];
const env={
  GEMINI_API_KEY:"gemini-mock",
  ILM_GEMINI_GLOBAL_LIMIT:{limit:async()=>({success:true})},
  ILM_GEMINI_USER_LIMIT:{limit:async()=>({success:true})},
  GROQ_API_KEY:"groq-mock",
  ILM_GROQ_GLOBAL_LIMIT:{limit:async()=>({success:true})},
  ILM_GROQ_USER_LIMIT:{limit:async()=>({success:true})},
  AI:{run:async()=>{throw new Error("Workers AI must not run")}}
};
try {
  globalThis.fetch=async (url,opts={})=>{
    calls.push({url:String(url),body:String(opts.body||"")});
    if(String(url).includes("generativelanguage.googleapis.com"))
      return Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429});
    assert.equal(String(url),"https://api.groq.com/openai/v1/chat/completions");
    const payload=JSON.parse(opts.body);
    assert.equal(payload.model,"qwen/qwen3.8-27b");
    assert.equal(payload.messages.length,2);
    assert.ok(payload.messages[1].content.includes(evidence.statement));
    assert.ok(!payload.tools, "No Groq autonomous search/tools");
    return Response.json({choices:[{message:{content:"Im übermittelten Bericht werden beide Handhebungen beschrieben. [1]"}}]});
  };
  // A key by itself is insufficient. Free Tier must be confirmed explicitly.
  const inactive=await composeIlmWithGroqFree(request,env,question,sources,"short");
  assert.equal(inactive.ok,false);
  assert.equal(inactive.reason,"groq_free_tier_not_confirmed");
  assert.equal(calls.length,0);

  // Even an authorized Free Plan cannot answer without verified source text.
  env.GROQ_FREE_TIER_CONFIRMED="true";
  const unsourced=await composeIlmWithGroqFree(request,env,question,[{...sources[0],verification_status:"unverified"}],"short");
  assert.equal(unsourced.ok,false);
  assert.equal(unsourced.reason,"groq_no_verified_sources");
  assert.equal(calls.length,0);

  // A genuine Gemini quota failure may be rescued using Groq Free Plan.
  const response=await worker.fetch(request,env),result=await response.json();
  assert.equal(response.status,200,JSON.stringify(result));
  assert.equal(result.provider,"groq");
  assert.match(result.answer,/\[1\]/);
  assert.deepEqual(calls.map(x=>new URL(x.url).hostname),[
    "generativelanguage.googleapis.com","api.groq.com"
  ]);

  // Unverified or fabricated citation indices must never reach the visitor.
  globalThis.fetch=async ()=>Response.json({choices:[{message:{content:"Diese unbelegte Aussage darf trotz ausreichender Länge nicht als Quellenbeleg erscheinen. [4]"}}]});
  const invalid=await composeIlmWithGroqFree(request,env,question,sources,"short");
  assert.equal(invalid.ok,false);
  assert.equal(invalid.reason,"groq_invalid_citations");

  // Cloudflare limit fail-closed: not a single upstream request.
  const blockedEnv={...env,ILM_GROQ_GLOBAL_LIMIT:{limit:async()=>({success:false})}};
  globalThis.fetch=async ()=>{throw Error("Must not invoke model after quota hit")};
  const limited=await composeIlmWithGroqFree(request,blockedEnv,question,sources,"short");
  assert.equal(limited.limited,true);
  console.log("PASS: Groq Free Plan gated, source-only citation check, Gemini 429 fallback and 0-call quota guard");
}finally{globalThis.fetch=original;}
