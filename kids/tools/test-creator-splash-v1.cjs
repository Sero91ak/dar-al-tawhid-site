#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const worker=read("kids/creator-test/worker.js");
const css=read("kids/splash-boot-v1.css");
const js=read("kids/splash-boot-v1.js");
const img=fs.readFileSync(path.join(ROOT,"kids/assets/kids-splash-20261017-v1.jpg"));
assert.ok(img.length>100000&&img[0]===0xff&&img[1]===0xd8,"full-size edited splash JPEG is present");
new vm.Script(js,{filename:"splash-boot-v1.js"});
new vm.Script(worker.replace("export default {","const worker = {")+"\nworker;",{filename:"kids-creator-worker.js"});
assert.match(worker,/asset\.clone\(\)\.text\(\)/,"mock response stream must remain readable");
assert.match(worker,/TextDecoderStream/,"production streams markup without buffering all 534KB");
assert.match(worker,/kids-test-first-frame-css/,"early inline boot prevents white browser canvas");
assert.match(worker,/background:#07152f!important/,"first paint stays dark before external assets");
assert.match(worker,/setTimeout\(function\(\)\{if\(!window\.__KIDS_CREATOR_SPLASH_2__/,"missing JS must not trap the page");
assert.match(worker,/apple-touch-startup-image/,"PWA startup image hint is present");
assert.match(worker,/media="print"/,"external splash styling must not block first paint");
assert.match(worker,/\bkids-splash-20261017-v1\.jpg\b/);
assert.match(worker,/kids-test-boot/);
assert.match(worker,/ktb-track/);
assert.match(css,/kids-splash-20261017-v1\.jpg/);
assert.match(css,/background-size:cover/);
assert.match(js,/target=100/);
assert.match(js,/document\.readyState/);
assert.match(js,/maxWaitMs=9000/);
assert.match(js,/document\.documentElement\.classList\.remove\("kids-test-booting"\)/);
assert.doesNotMatch(worker,/78%|intro-v74\.mp4/);
assert.doesNotMatch(css,/hero-home\.png/);
assert.doesNotMatch(js,/intro-v74\.mp4/);
const nativeView=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsNativeIntro.swift");
const nativeWeb=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift");
const creatorInfo=read("ios/DarAlTawhidKids/DarAlTawhidKids/Info-Creator.plist");
const visitorInfo=read("ios/DarAlTawhidKids/DarAlTawhidKids/Info.plist");
const pbx=read("ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj/project.pbxproj");
const imageSet=JSON.parse(read("ios/DarAlTawhidKids/DarAlTawhidKids/Assets.xcassets/KidsTestLaunchPoster.imageset/Contents.json"));
assert.match(css,/ktb-storybook-open/,"continuous feathered motion installed");
assert.match(css,/ktb-reveal-gold/,"synchronized gold seam is part of actual transition");
assert.match(css,/rgba\(0,0,0,\.10\) 50\.76%/,"mask feather stays narrow to avoid doubled lettering");
assert.match(css,/clip-path:inset\(0 0 100% 0\)/,"no opacity-only fallback ghosting");
assert.match(css,/-webkit-mask-image:linear-gradient/,"Safari iOS feathered mask");
assert.match(css,/mask-position:0 100%/,"soft reveal goes all the way to transparent");
assert.match(css,/ktb-storybook-fallback/,"direct reduced-motion fallback");
assert.doesNotMatch(css,/ktb-shard|ktb-gentle-fall|kids-test-boot-bridge/,"no crude shards or blue intermediary");
assert.match(css,/prefers-reduced-motion/,"accessible reduced-motion handling");
assert.match(css,/transform:none/,"web and native full-bleed artwork aligned");
assert.match(js,/revealNativePoster/,"native reveals after illustrated first paint");
assert.match(js,/darKidsCreatorSplashReady/);
assert.match(js,/ktb-storybook/,"continuous single-layer reveal active");
assert.match(js,/ktb-soft-fallback/,"safe fallback active");
assert.doesNotMatch(js,/makeShards|posterNatural|ktb-shatter|kids-test-boot-bridge/,"no tile generator or blue intermediary");
assert.match(js,/minDisplayMs=1500/,"no forced 3.5s waiting");
assert.match(nativeView,/Image\("KidsTestLaunchPoster"\)/);
// New isolated native test startup: real WebKit loading bar (0–95%), 100% only
// after didFinish, a retry on network failure, and no visitor-build changes.
assert.match(nativeView,/nativeLoadProgress = 0/,"native loading starts at 0%");
assert.match(nativeView,/min\(95, max\(nativeLoadProgress, Int\(value \* 100\)\)\)/,"intermediate progress is monotonic and capped");
assert.match(nativeView,/Notification\.Name\("DarKidsCreatorLoadProgress"\)/,"SwiftUI listens to WebKit progress");
assert.match(nativeView,/Notification\.Name\("DarKidsCreatorPageLoaded"\)/,"SwiftUI listens for completed navigation");
assert.match(nativeView,/nativeLoadProgress = 100/,"100% is displayed before dismiss");
assert.match(nativeView,/Notification\.Name\("DarKidsCreatorLoadFailed"\)/,"failed initial navigation keeps retry visible");
assert.match(nativeView,/Notification\.Name\("DarKidsCreatorRetryInitialLoad"\)/,"failed startup can retry");
assert.match(nativeWeb,/webView\.observe\(\\\.estimatedProgress/,"observe real WebKit loading, not a fake clock");
assert.match(nativeWeb,/min\(0\.95, max\(0\.0, page\.estimatedProgress\)\)/,"estimated progress is capped before finish");
assert.match(nativeWeb,/Notification\.Name\("DarKidsCreatorPageLoaded"\)/,"native page-loaded confirmation is wired");
assert.match(nativeWeb,/Notification\.Name\("DarKidsCreatorLoadFailed"\)/,"network failures reported to the overlay");
assert.match(nativeWeb,/Notification\.Name\("DarKidsCreatorRetryInitialLoad"\)/,"initial load retry is observed");
assert.match(nativeView,/#else\s+var body: some View \{\s+KidsWebAppView\(\)/,"visitor root continues directly into existing web view");

assert.match(nativeWeb,/configuration\.userContentController\.add\(context\.coordinator, name: "darKidsCreatorSplashReady"\)/);
const launchStoryboard=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsCreatorLaunchScreen.storyboard");
assert.match(launchStoryboard,/image="KidsTestLaunchPoster"/,"native first frame uses bundled KIDS artwork");
assert.match(launchStoryboard,/contentMode="scaleAspectFill"/,"edge-to-edge native launch");
assert.match(creatorInfo,/<key>UILaunchStoryboardName<\/key>\s*<string>KidsCreatorLaunchScreen<\/string>/,"creator must start with native poster, not a white window");
assert.doesNotMatch(creatorInfo,/<key>UILaunchScreen<\/key>/,"no competing launch configuration");
assert.ok(pbx.includes("KidsCreatorLaunchScreen.storyboard in Resources"),"native storyboard compiled");
assert.doesNotMatch(visitorInfo,/KidsTestLaunchPoster/,"visitor iOS launch remains unchanged");
assert.equal(pbx.split("INFOPLIST_FILE = DarAlTawhidKids/Info-Creator.plist;").length-1,2,"only two creator build configs use new plist");
assert.equal(pbx.split("INFOPLIST_FILE = DarAlTawhidKids/Info.plist;").length-1,2,"visitor configs unchanged");
assert.equal(imageSet.images[0].filename,"kids-test-launch.jpg");
assert.ok(fs.statSync(path.join(ROOT,"ios/DarAlTawhidKids/DarAlTawhidKids/Assets.xcassets/KidsTestLaunchPoster.imageset/kids-test-launch.jpg")).size>100000);

const dispatch=new vm.Script(worker.replace("export default {","const worker = {")+"\nworker;");
const handler=dispatch.runInNewContext({URL,Headers,Response});
const html="<!doctype html><html><head></head><body><main id=\"view-today\">STARTSEITE</main></body></html>";
const env={ASSETS:{fetch:async()=>new Response(html,{status:200,headers:{"Content-Type":"text/html"}})}};
async function get(url){return handler.fetch(new Request("https://kids-preview.example"+url),env)}
(async()=>{
  const page=await get("/kids/start.html");
  const text=await page.text();
  assert.match(text,/kids-test-boot/);
  assert.match(text,/kids-splash-20261017-v1\.jpg/);
  assert.match(text,/kids\/splash-boot-v1\.js/);
  assert.match(text,/STARTSEITE/,"existing home DOM must remain intact");
  assert.equal(page.status,200);
  assert.doesNotMatch(await (await get("/kids/akademie/index.html")).text(),/kids-test-boot/,"non-start modules unaffected");
  assert.equal((await get("/test")).status,404,"adult/public hosts not routed");
  const streamHandler=dispatch.runInNewContext({
    URL,Headers,Response,TextDecoderStream,TextEncoderStream,TransformStream
  });
  const encoder=new TextEncoder();
  const stream=new ReadableStream({
    start(controller){
      controller.enqueue(encoder.encode('<!doctype html><html><head><meta charset="utf-8">'));
      setTimeout(()=>{
        controller.enqueue(encoder.encode('<title>KIDS</title></head><body><main id="view-today">STREAMED HOME</main></body></html>'));
        controller.close();
      },45);
    }
  });
  const streamingEnv={ASSETS:{fetch:async()=>new Response(stream,{status:200,headers:{"Content-Type":"text/html","Content-Length":"999","Content-Encoding":"gzip"}})}};
  const streaming=await streamHandler.fetch(new Request("https://kids-preview.example/kids/start.html"),streamingEnv);
  assert.equal(streaming.status,200);
  assert.equal(streaming.headers.get("Content-Length"),null,"rewritten HTML has no stale length");
  assert.equal(streaming.headers.get("Content-Encoding"),null,"rewritten HTML is not gzip encoded");
  const reader=streaming.body.getReader();
  const first=await reader.read();
  const firstText=new TextDecoder().decode(first.value);
  assert.match(firstText,/kids-test-first-frame/,"stream must deliver dark CSS before full 534KB HTML");
  let complete=firstText;
  for(;;){const chunk=await reader.read();if(chunk.done)break;complete+=new TextDecoder().decode(chunk.value)}
  assert.match(complete,/<body><div id="kids-test-boot"/);
  assert.match(complete,/STREAMED HOME/);
  assert.equal((complete.match(/id="kids-test-boot"/g)||[]).length,1,"exactly one splash overlay");
  assert.match(complete,/apple-touch-startup-image/);
  console.log("KIDS CREATOR SPLASH PASS: exact edited art, staged meter, HTML injection, visitor isolation.");
})().catch(e=>{console.error(e);process.exitCode=1});
