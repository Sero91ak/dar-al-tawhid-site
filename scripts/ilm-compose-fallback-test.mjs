#!/usr/bin/env node
import assert from "node:assert/strict";
import worker from "../cloudflare/test-app-worker.js";
const saved=globalThis.fetch;
try{
 const hits=[];
 globalThis.fetch=async (url,options={})=>{
  const x=String(url);
  if(x.includes("generativelanguage.googleapis.com")){
    hits.push("gemini_429");
    return Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429});
  }
  if(x==="https://api.openai.com/v1/responses"){
    hits.push("openai_compose");
    const body=JSON.parse(options.body);
    assert.equal(body.store,false);
    assert.equal(body.tools,undefined);
    assert.match(body.input,/al-Baqarah/);
    return Response.json({output:[{type:"message",content:[{
      type:"output_text",text:"Die hier übergebene Āyah enthält die grundlegende Bestimmung zur Trennung. [1]"
    }]}]});
  }
  throw Error("Unexpected request: "+x);
 };
 const yes={limit:async()=>({success:true})};
 const env={GEMINI_API_KEY:"test",OPENAI_API_KEY:"test",
   ILM_GEMINI_GLOBAL_LIMIT:yes,ILM_GEMINI_USER_LIMIT:yes,
   ILM_OPENAI_GLOBAL_LIMIT:yes,ILM_OPENAI_USER_LIMIT:yes};
 const req=new Request("https://dar-al-tawhid.de/test/api/ilm/compose",{
   method:"POST",headers:{"Origin":"https://dar-al-tawhid.de","Content-Type":"application/json"},
   body:JSON.stringify({question:"Was sagt al-Baqarah über die Trennung?",
     evidence:[{speaker:"Qurʾān",work:"al-Baqarah",reference:"2:229",
       authenticity:"Qurʾān",verification_status:"verified",
       statement:"Im Vers 2:229 wird die Trennung bei Sorge um die Grenzen Allahs angesprochen."}]})
 });
 const r=await worker.fetch(req,env);const d=await r.json();
 assert.equal(r.status,200,JSON.stringify(d));
 assert.equal(d.provider,"openai");
 assert.equal(d.usedSourceCount,1);
 assert.match(d.answer,/\[1\]/);
 assert.deepEqual(hits,["gemini_429","openai_compose"]);
 console.log("PASS: internal primary source -> Gemini quota failure -> OpenAI referenced answer");
}finally{globalThis.fetch=saved;}
