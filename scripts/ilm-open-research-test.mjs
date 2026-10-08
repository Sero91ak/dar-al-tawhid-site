#!/usr/bin/env node
import assert from "node:assert/strict";
import { isApprovedIlmSource, researchIlmWithGemini } from "../cloudflare/ilm-gemini-open-research.js";

assert.equal(isApprovedIlmSource("https://www.islamweb.net/ar/library/content/0/704/"),true);
assert.equal(isApprovedIlmSource("https://dorar.net/h/123"),true);
assert.equal(isApprovedIlmSource("https://evil-islamweb.net/test"),false);
assert.equal(isApprovedIlmSource("https://islamweb.net.evil.test/test"),false);
assert.equal(isApprovedIlmSource("http://islamweb.net/test"),false);
assert.equal(isApprovedIlmSource("https://127.0.0.1/test"),false);

const env = {
 GEMINI_API_KEY:"test-placeholder-only",
 ILM_GEMINI_GLOBAL_LIMIT:{limit:async()=>({success:true})},
 ILM_GEMINI_USER_LIMIT:{limit:async()=>({success:true})}
};
const req = new Request("https://dar-al-tawhid.de/test/api/ilm/research",{method:"POST"});
const original = globalThis.fetch;
const mockPage = "<html><title>Gebet – Rukūʿ</title><main>" +
  "Der Gesandte Allahs ﷺ hob seine Hände beim Rukūʿ, und wenn er sich wieder aufrichtete. ".repeat(9) +
  "</main></html>";
let searchCalls = 0, composerCalls = 0, primaryCalls=0;
try {
 globalThis.fetch = async (url, options={}) => {
   const dest = String(url);
   if(dest.includes("generativelanguage.googleapis.com")) {
     const payload=JSON.parse(options.body);
     if(payload.tools?.some(x=>x.google_search)) {
       searchCalls++;
       return Response.json({candidates:[{
         content:{parts:[{text:"Es gibt einschlägige Primärbelege."}]},
         groundingMetadata:{
           webSearchQueries:["site:islamweb.net Rukūʿ Händeheben"],
           groundingChunks:[{web:{uri:"https://www.islamweb.net/ar/library/content/0/704/",title:"Ṣaḥīḥ al-Buḫārī"}}],
           groundingSupports:[{segment:{text:"Es gibt einschlägige Primärbelege."},groundingChunkIndices:[0]}]
         }
       }]});
     }
     composerCalls++;
     return Response.json({candidates:[{content:{parts:[{text:"In der vorgelegten Überlieferung werden die Hände vor und nach dem Rukūʿ gehoben. [1]"}]}}]});
   }
   if(dest==="https://www.islamweb.net/ar/library/content/0/704/") {
     primaryCalls++;
     return new Response(mockPage,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}});
   }
   throw new Error("Unexpected outbound URL: "+dest);
 };
 const answer=await researchIlmWithGemini(req,env,"Hände nach dem Rukūʿ heben?", "short");
 assert.equal(answer.ok,true,JSON.stringify(answer));
 assert.equal(answer.sources.length,1);
 assert.equal(answer.sources[0].verification_status,"verified");
 assert.match(answer.answer,/Rukūʿ/);
 assert.deepEqual([searchCalls,primaryCalls,composerCalls],[1,1,1]);

 searchCalls=0;composerCalls=0;primaryCalls=0;
 globalThis.fetch = async(url,options={}) => {
   if(String(url).includes("generativelanguage.googleapis.com")) return Response.json({candidates:[{
     groundingMetadata:{webSearchQueries:["test"],groundingChunks:[{web:{uri:"https://islamweb.net.evil.test/hoax"}}],
       groundingSupports:[{segment:{text:"x"},groundingChunkIndices:[0]}]}
   }]});
   throw new Error("Must never fetch unapproved site");
 };
 const spoof=await researchIlmWithGemini(req,env,"Welcher Beleg gilt für das Rukūʿ?","short");
 assert.equal(spoof.ok,false);
 assert.equal(spoof.reason,"no_approved_source_text");

 globalThis.fetch=async()=>Response.json({candidates:[{content:{parts:[{text:"Model-only speculation"}]}}]});
 const ungrounded=await researchIlmWithGemini(req,env,"Was sagen die frühen Imāme zur Frage?","short");
 assert.equal(ungrounded.ok,false);
 assert.equal(ungrounded.reason,"ungrounded_search");
 globalThis.fetch=async()=>Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429});
 const quota=await researchIlmWithGemini(req,env,"Welche authentischen Quellen gibt es?","short");
 assert.equal(quota.ok,false);
 assert.equal(quota.limited,true);
 assert.equal(quota.reason,"gemini_quota_exhausted");
 console.log("PASS: Gemini research: primary page, guarded citations, domain rejection, and provider-429 abstention");
} finally { globalThis.fetch=original; }
