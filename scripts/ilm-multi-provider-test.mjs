#!/usr/bin/env node
import assert from "node:assert/strict";
import worker from "../cloudflare/test-app-worker.js";
import { researchIlmWithOpenAI } from "../cloudflare/ilm-openai-research.js";

const oldFetch=globalThis.fetch;
const html="<html><head><title>Originalwerk: Kitāb aṭ-Ṭalāq</title></head><body>"+
  "Die Ehefrau von Thabit ibn Qays fragte nach einer Trennung; der Prophet ﷺ fragte nach der Rückgabe ihres Gartens. ".repeat(15)+"</body></html>";
const req = new Request("https://dar-al-tawhid.de/test/api/ilm/research",{
  method:"POST",headers:{"Content-Type":"application/json","Origin":"https://dar-al-tawhid.de"},
  body:JSON.stringify({question:"Was sagen die Überlieferungen über die Scheidung durch Khul?",mode:"detailed"})
});
const unlimited={limit:async()=>({success:true})};
const env={
 GEMINI_API_KEY:"test-gemini",OPENAI_API_KEY:"test-openai",
 ILM_GEMINI_GLOBAL_LIMIT:unlimited,ILM_GEMINI_USER_LIMIT:unlimited,
 ILM_OPENAI_GLOBAL_LIMIT:unlimited,ILM_OPENAI_USER_LIMIT:unlimited
};
let providers=[], pageRequests=0;
try {
  globalThis.fetch=async (url,opts={})=>{
    const target=String(url);
    if(target.includes("generativelanguage.googleapis.com")){
      providers.push("gemini-quota");
      return Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429});
    }
    if(target==="https://api.openai.com/v1/responses"){
      const body=JSON.parse(opts.body);
      assert.equal(body.store,false);
      if(body.tools?.length){
        providers.push("openai-search");
        assert.ok(body.tools[0].filters.allowed_domains.includes("islamweb.net"));
        return Response.json({output:[
          {type:"web_search_call",action:{sources:[{type:"url",url:"https://www.islamweb.net/ar/library/content/0/5280/"}]}},
          {type:"message",content:[{type:"output_text",text:"Quellen gefunden",
            annotations:[{type:"url_citation",url:"https://www.islamweb.net/ar/library/content/0/5280/",title:"Originalwerk"}]}]}
        ]});
      }
      providers.push("openai-synthesize");
      assert.equal(body.tools,undefined);
      return Response.json({output:[{type:"message",content:[
        {type:"output_text",text:"Der Bericht behandelt eine Trennung auf Bitte der Ehefrau und die Rückgabe der Brautgabe. [1]"}
      ]}]});
    }
    if(target==="https://www.islamweb.net/ar/library/content/0/5280/"){
      pageRequests++;
      return new Response(html,{status:200,headers:{"Content-Type":"text/html"}});
    }
    throw new Error("unexpected outbound endpoint: "+target);
  };
  const response=await worker.fetch(req,env);
  const data=await response.json();
  assert.equal(response.status,200,JSON.stringify(data));
  assert.equal(data.ok,true);
  assert.equal(data.provider,"openai");
  assert.equal(data.sources.length,1);
  assert.equal(data.sources[0].verification_status,"verified");
  assert.match(data.answer,/\[1\]/);
  assert.deepEqual(providers,["gemini-quota","openai-search","openai-synthesize"]);
  assert.equal(pageRequests,1);
  
  globalThis.fetch=async (url,opts={})=>{
    const target=String(url);
    if(target.includes("api.openai.com")){
      return Response.json({output:[{type:"message",content:[{
        type:"output_text",text:"Unsourced claim",
        annotations:[{type:"url_citation",url:"https://islamweb.net.evil.invalid/fake",title:"fake"}]
      }]}]});
    }
    throw Error("blocked fetch attempted to "+target);
  };
  const noSource=await researchIlmWithOpenAI(req,env,"Was ist der Beleg?", "short");
  assert.equal(noSource.ok,false);
  assert.equal(noSource.reason,"openai_no_allowed_citations");
  assert.equal((await researchIlmWithOpenAI(req,{...env,OPENAI_API_KEY:null},"Eine offene Frage","short")).reason,"openai_not_configured");
  console.log("PASS: Gemini 429 -> OpenAI Search -> allowlisted primary page -> cited German answer; phishing and missing secret rejected");
} finally {globalThis.fetch=oldFetch;}
