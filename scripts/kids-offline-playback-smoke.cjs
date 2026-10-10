#!/usr/bin/env node
"use strict";
/* Deterministic no-network browser-worker smoke test: cached Safari 206 audio,
 * installed academy navigation and an offline PWA start request.
 * Runs without downloading user assets and without ElevenLabs credit usage.
 */
const assert=require("node:assert/strict");
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../kids/sw.js"),"utf8");
const origin="https://dar-al-tawhid.de";
const cacheMap=new Map(),handlers=new Map();
const absolute=v=>new URL(typeof v==="string"?v:v.url,origin).href;
const store={
  async match(key){const val=cacheMap.get(absolute(key));return val?val.clone():undefined},
  async put(key,response){cacheMap.set(absolute(key),response.clone())},
  async keys(){return [...cacheMap.keys()].map(u=>new Request(u))},
  async add(key){throw Error("offline")},
};
const sandbox={
  self:{location:{origin},addEventListener:(name,fn)=>handlers.set(name,fn),
    clients:{claim:async()=>{}},skipWaiting:async()=>{}},
  caches:{match:key=>store.match(key),open:async()=>store,keys:async()=>["dar-al-tawhid-kids-v1313"]},
  fetch:async()=>{throw TypeError("Network unavailable")},
  URL,Request,Response,Headers,Promise,Map,Set,Number,Math,JSON,String,
  navigator:{},
};
vm.runInNewContext(source,sandbox,{filename:"kids/sw.js"});
const onFetch=handlers.get("fetch");
assert.equal(typeof onFetch,"function","Worker fetch handler is installed");
async function request(p,opts={}){
  let out;
  const request=new Request(origin+p,opts);
  onFetch({request,respondWith:p=>{out=p},waitUntil:()=>{}});
  assert.ok(out,"Kids route must be handled");
  return out;
}
(async()=>{
  const mp3="/kids/assets/prophet-story-audio/adam/story.mp3";
  await store.put(new Request(origin+mp3),new Response(new Uint8Array([0,1,2,3,4,5,6,7,8,9]),{headers:{"Content-Type":"audio/mpeg"}}));
  const partial=await request(mp3,{headers:{Range:"bytes=3-6"}});
  assert.equal(partial.status,206,"iOS offline seek must answer 206");
  assert.equal(partial.headers.get("Content-Range"),"bytes 3-6/10");
  assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())],[3,4,5,6]);
  const suffix=await request(mp3,{headers:{Range:"bytes=-3"}});
  assert.equal(suffix.status,206);
  assert.deepEqual([...new Uint8Array(await suffix.arrayBuffer())],[7,8,9]);
  const invalid=await request(mp3,{headers:{Range:"bytes=20-25"}});
  assert.equal(invalid.status,416);
  await store.put(new Request(origin+"/kids/start"),new Response("<html>kids offline</html>",{headers:{"Content-Type":"text/html"}}));
  const start=await request("/kids/start?kv=any-offline-build");
  assert.equal(start.status,200);
  assert.match(await start.text(),/kids offline/,"offline launch should fall back to cached Kids shell");
  await store.put(new Request(origin+"/kids/akademie/index.html"),new Response("<html>academy offline</html>"));
  const academy=await request("/kids/akademie/index.html");
  assert.match(await academy.text(),/academy offline/,"academy offline must not redirect to the home page");
  console.log("KIDS_OFFLINE_PLAYBACK_SMOKE OK: iOS Range 206, 416, PWA launch and academy offline navigation");
})().catch(error=>{console.error(error);process.exitCode=1});
