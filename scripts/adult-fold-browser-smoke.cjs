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
<style>
html,body{margin:0;padding:0;width:100%}
body>.app{width:100%;max-width:100%;margin:0;padding:0}
#appView{width:100%;max-width:100%;margin:0;padding:0}
.dar-fold__rail,.dar-fold__pane{box-sizing:border-box}
</style></head><body class="has-bottom-nav"><div class="app"><main id="appView"><div
class="dar-fold" data-fold-family="quran" data-fold-mode="dual"
data-fold-force="dual" data-fold-single-show="rail"><aside class="dar-fold__rail">Sūrenliste</aside><section
class="dar-fold__pane">Qurʾān-Leser</section></div></main></div><pre id="foldSmoke"></pre>
<script>
try {
const root=document.documentElement;
const shell=document.querySelector(".dar-fold");
const rail=shell.querySelector(".dar-fold__rail");
const pane=shell.querySelector(".dar-fold__pane");
function phase(state,force,front) {
 root.setAttribute("data-fold-capacity",state);
 root.setAttribute("data-fold-dual",state==="dual"?"1":"0");
 root.setAttribute("data-layout",state==="dual"?"expanded":"medium");
 root.setAttribute("data-layout-surface",state==="dual"?"workspace":"single");
 root.setAttribute("data-dar-visitor-frontstage",front?"1":"0");
 shell.setAttribute("data-fold-force",force);
 root.style.setProperty("--fold-rail-current","471px");
 root.style.setProperty("--fold-gap-current","61px");
 const style=getComputedStyle(shell);
 const ra=getComputedStyle(rail),pa=getComputedStyle(pane);
 const rr=rail.getBoundingClientRect(),pr=pane.getBoundingClientRect();
 return {
  display:style.display,template:style.gridTemplateColumns,gap:parseFloat(style.columnGap),
  railDisplay:ra.display,paneDisplay:pa.display,
  railWidth:rr.width,paneWidth:pr.width,railLeft:rr.left,paneLeft:pr.left,
  shellWidth:shell.getBoundingClientRect().width
 };
}
const compact=phase("single","dual",true); // stale forceDual MUST NOT win
const dual=phase("dual","auto",true);      // frontstage MUST NOT collapse dual
const ordinary=phase("dual","auto",false);
document.getElementById("foldSmoke").textContent=btoa(JSON.stringify({compact,dual,ordinary}));
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
  assert.equal(result.compact.display,"block","Compact must be a single pane even with stale forceDual");
  assert.equal(result.compact.paneDisplay,"none","Inactive reader hidden in compact");
  assert.notEqual(result.compact.railDisplay,"none","Active Surah list visible in compact");
  for(const [label,g] of [["dual",result.dual],["ordinary",result.ordinary]]) {
    assert.equal(g.display,"grid",label+" must resolve to two actual columns");
    assert.ok(g.railWidth>=300,label+" rail readable: "+g.railWidth);
    assert.ok(g.paneWidth>=420,label+" reader readable: "+g.paneWidth);
    assert.ok(g.paneLeft>=524,label+" reading pane must clear hardware hinge [500,524]");
    assert.ok(g.paneLeft+g.paneWidth<=1026,label+" must not overflow viewport");
    assert.ok(g.gap>=60,label+" must preserve measured hinge clearance");
  }
  console.log("OK: real Chromium CSS layout, visitor frontstage and 24px Duo hinge");
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
