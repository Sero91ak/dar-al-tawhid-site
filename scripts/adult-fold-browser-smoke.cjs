#!/usr/bin/env node
"use strict";
/* Real CSS-computed layout smoke in an installed headless Chrome/Chromium.
 * No network, production site, account or player data. Hardware QA is separate.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const { pathToFileURL } = require("node:url");

const base = path.resolve(__dirname,"..");
const names = ["google-chrome","google-chrome-stable","chromium","chromium-browser"];
function chromeBinary() {
  for (const name of names) {
    const check = cp.spawnSync("which",[name],{encoding:"utf8",timeout:1500});
    if (check.status===0 && check.stdout.trim()) return check.stdout.trim();
  }
  return null;
}
const browser = chromeBinary();
if (!browser) {
  console.log("SKIP: Headless Chrome not installed; browser geometry remains unverified");
  process.exit(0);
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"dar-fold-css-"));
const target=path.join(tmp,"fold.html");
const href=p=>pathToFileURL(path.join(base,p)).href;
const fixture=`<!DOCTYPE html><html data-layout="medium" data-layout-surface="single"
data-fold-capacity="single" data-fold-dual="0" data-theme="dark"
data-dar-visitor-frontstage="1" class="is-fold-dual">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${href("assets/fold-split.css")}">
<link rel="stylesheet" href="${href("assets/adult-fold-global-v1.css")}">
<link rel="stylesheet" href="${href("assets/dar-visitor-frontstage-v1.css")}">
<link rel="stylesheet" href="${href("assets/bottom-nav-global-v1075.css")}">
<style>
html,body{margin:0;padding:0;width:100%}
body>.app{width:100%;max-width:100%;margin:0;padding:0}
#appView{width:100%;max-width:100%;margin:0;padding:0}
.dar-fold__rail,.dar-fold__pane{box-sizing:border-box}
.view.page-enter-forward{animation:pageEnterForward .36s both}
@keyframes pageEnterForward{from{opacity:.9;transform:translate3d(9%,0,0)}to{opacity:1;transform:translate3d(0,0,0)}
html[data-dar-visitor-frontstage="1"].stage-inset body.has-bottom-nav > .app{
 width:calc(100% - 64px)!important;max-width:calc(100% - 64px)!important;
 margin-left:32px!important;margin-right:32px!important;
}
</style></head><body class="has-bottom-nav"><div class="app"><main id="appView"><div
class="dar-fold" data-fold-family="quran" data-fold-mode="dual"
data-fold-force="dual" data-fold-single-show="rail"><aside class="dar-fold__rail">Sūrenliste</aside><section
class="dar-fold__pane">Qurʾān-Leser</section></div></main></div><nav id="bottomNav" class="bottom-nav"><button class="bottom-nav-btn" data-bottom-nav="home">Start</button><button class="bottom-nav-btn" data-bottom-nav="quiz">Quiz</button><button class="bottom-nav-btn" data-bottom-nav="recent">Beiträge</button><button class="bottom-nav-btn" data-bottom-nav="quran">Qurʾān</button><button class="bottom-nav-btn" data-bottom-nav="more">Mehr</button></nav><pre id="foldSmoke"></pre>
<script>
try {
const root=document.documentElement;
const shell=document.querySelector(".dar-fold");
const rail=shell.querySelector(".dar-fold__rail");
const pane=shell.querySelector(".dar-fold__pane");
function phase(state,force,front,inset) {
 root.classList.toggle("stage-inset",!!inset);
 root.setAttribute("data-fold-capacity",state);
 root.setAttribute("data-fold-dual",state==="dual"?"1":"0");
 root.setAttribute("data-layout",state==="dual"?"expanded":"medium");
 root.setAttribute("data-layout-surface",state==="dual"?"workspace":"single");
 root.setAttribute("data-dar-visitor-frontstage",front?"1":"0");
 shell.setAttribute("data-fold-force",force);
 root.style.setProperty("--fold-rail-current","451px");
 root.style.setProperty("--fold-gap-current","81px");
 const style=getComputedStyle(shell);
 const ra=getComputedStyle(rail),pa=getComputedStyle(pane);
 const rr=rail.getBoundingClientRect(),pr=pane.getBoundingClientRect();
 return {
  display:style.display,template:style.gridTemplateColumns,gap:parseFloat(style.columnGap),
  railDisplay:ra.display,paneDisplay:pa.display,
  railWidth:rr.width,paneWidth:pr.width,railLeft:rr.left,railRight:rr.right,paneLeft:pr.left,
  shellWidth:shell.getBoundingClientRect().width
 };
}
const view=document.getElementById("appView");
view.className="view page-enter-forward";
document.body.classList.remove("is-topics-route");
const otherTransition=getComputedStyle(view).animationName;
document.body.classList.add("is-topics-route");
const postsTransition={animation:getComputedStyle(view).animationName,transform:getComputedStyle(view).transform};
document.body.classList.remove("is-topics-route");
view.className="view";
const compact=phase("single","dual",true); // stale forceDual MUST NOT win
const dual=phase("dual","auto",true);      // frontstage MUST NOT collapse dual
const inset=phase("dual","auto",true,true);
const forced=phase("dual","single",true);
const ordinary=phase("dual","auto",false);
rail.innerHTML="<p>Sūrah Liste</p>".repeat(100);
pane.innerHTML="<p>Āyah im Leser</p>".repeat(100);
rail.scrollTop=170;
const railScroll={extent:rail.scrollHeight-rail.clientHeight,top:rail.scrollTop,paneTop:pane.scrollTop,css:getComputedStyle(rail).overflowY};
pane.scrollTop=230;
const paneScroll={extent:pane.scrollHeight-pane.clientHeight,top:pane.scrollTop,railTop:rail.scrollTop,css:getComputedStyle(pane).overflowY};
const navEl=document.getElementById("bottomNav");
const nav=Array.from(navEl.querySelectorAll(".bottom-nav-btn")).map(btn=>{
 const r=btn.getBoundingClientRect();
 const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
 return {label:btn.textContent,width:r.width,height:r.height,x:r.left,y:r.top,
  hittable:!!(top&&(top===btn||btn.contains(top))),viewportWidth:window.innerWidth,viewportHeight:window.innerHeight};
});
const navBox=navEl.getBoundingClientRect();
const navBounds={x:navBox.x,right:navBox.right,top:navBox.top,bottom:navBox.bottom};
document.getElementById("foldSmoke").textContent=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({compact,dual,inset,forced,ordinary,otherTransition,postsTransition,railScroll,paneScroll,nav,navBounds}))));
} catch(e) {
 document.getElementById("foldSmoke").textContent=btoa(JSON.stringify({error:String(e)}));
}
</script></body></html>`;
try {
  fs.writeFileSync(target,fixture,"utf8");
  const run=cp.spawnSync(browser,[
    "--headless","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--allow-file-access-from-files","--window-size=1024,800",
    "--virtual-time-budget=1200","--dump-dom",pathToFileURL(target).href
  ],{encoding:"utf8",timeout:25000,maxBuffer:10*1024*1024});
  assert.equal(run.status,0,"Chromium execution failed: "+String(run.stderr||"").slice(-500));
  const match=(run.stdout||"").match(/<pre id="foldSmoke">([A-Za-z0-9+/=]+)<\/pre>/);
  assert.ok(match,"Browser did not return CSS geometry");
  const result=JSON.parse(Buffer.from(match[1],"base64").toString("utf8"));
  assert.equal(result.error,undefined,"Browser DOM exception: "+result.error);
  assert.equal(result.otherTransition,"pageEnterForward","Other routes must retain their page animation");
  assert.equal(result.postsTransition.animation,"none","Beiträge transition must be disabled");
  assert.equal(result.postsTransition.transform,"none","Beiträge view must not translate over the dark shell");
  assert.ok(result.railScroll.extent>100&&result.railScroll.top>100,"Master must independently scroll with real CSS");
  assert.equal(result.railScroll.paneTop,0,"Master scroll must not scroll reader");
  assert.ok(result.paneScroll.extent>100&&result.paneScroll.top>100,"Reader must independently scroll with real CSS");
  assert.equal(result.paneScroll.railTop,result.railScroll.top,"Reader scroll must preserve master");
  assert.equal(result.nav.length,5,"Five original bottom nav fields required");
  for(const tab of result.nav){
    assert.ok(tab.hittable,"Tab "+tab.label+" must receive center hit test");
    assert.ok(tab.width>=44&&tab.height>=44,"Tab "+tab.label+" minimum 44px hit target");
  }
  assert.ok(result.navBounds.x>=-2&&result.navBounds.right<=1026,"Bottom nav within viewport");
  assert.ok(result.navBounds.top>=0&&result.navBounds.bottom<=802,"Bottom nav safe within viewport");
  assert.equal(result.compact.display,"block","Compact must be a single pane even with stale forceDual");
  assert.equal(result.compact.paneDisplay,"none","Inactive reader hidden in compact");
  assert.notEqual(result.compact.railDisplay,"none","Active Surah list visible in compact");
  assert.equal(result.forced.display,"block","Explicit forced single must stay one-pane on a wide screen");
  assert.equal(result.forced.paneDisplay,"none","Forced single hides inactive pane");
  for(const [label,g] of [["dual",result.dual],["ordinary",result.ordinary],["inset",result.inset]]) {
    assert.equal(g.display,"grid",label+" must resolve to two actual columns");
    assert.ok(g.railWidth>=300,label+" rail readable: "+g.railWidth);
    assert.ok(g.paneWidth>=420,label+" reader readable: "+g.paneWidth);
    assert.ok(g.railRight<=492,label+" master must clear hinge start 500 with 8px buffer");
    assert.ok(g.paneLeft>=532,label+" reading pane must clear hinge end 524 with 8px buffer");
    assert.ok(g.paneLeft+g.paneWidth<=1026,label+" must not overflow viewport");
    assert.ok(g.gap>=81,label+" must preserve measured hinge + inset clearance");
  }
  console.log("OK: real Chromium CSS layout, visitor frontstage and 24px Duo hinge");
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
