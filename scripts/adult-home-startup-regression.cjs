#!/usr/bin/env node
"use strict";
/* Home startup regression: duplicate initial render remounts the entire #appView
 * and can cause a noticeable scroll jump during the first iOS gesture. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const code = 'if(!(readRoute().view==="home"&&document.querySelector("#appView .home-v380-shell")))render();';
assert.match(html, /HOME_STARTUP_SINGLE_RENDER_20261101/, "Guard is present");
assert.ok(html.includes(code), "Window load avoids already-rendered home");
assert.match(html, /DOMContentLoaded"[\s\S]*?hydrateOfflineContent\(\)[\s\S]*?initTheme\(\);\s*render\(\)/, "First home paint stays at DOMContentLoaded");
assert.ok(html.includes('if(["more","books","quellen-book","quellen-scholar"].includes(v)&&typeof render==="function")render()'), "Canonical source initialization doesn't remount Home");
assert.ok(!html.includes('["more","home","books","quellen-book","quellen-scholar"].includes(v)'), "Obsolete Home remount removed");
for (const [view, mounted, shouldRender] of [
 ["home",true,false], ["home",false,true], ["topics",true,true], ["quran",true,true]
]) {
 let calls = 0;
 vm.runInNewContext(code, {
  readRoute:()=>({view}),
  document:{querySelector:()=>mounted?{}:null},
  render:()=>{calls++;}
 });
 assert.equal(calls, Number(shouldRender), view+" mounted="+mounted+" must preserve correct paint");
}
assert.match(html, /setTimeout\(\(\)=>\{Promise\.resolve\(\)\.then\(\(\)=>refreshContent\(\{forceRender:false\}\)\)/, "Content hydration is still active");
console.log("OK: adult home paints once on launch; other routes and content hydration remain intact");
