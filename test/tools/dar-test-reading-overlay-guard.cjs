#!/usr/bin/env node
/* DAR TEST reading overlay structural regression. No network, no production side effects. */
"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"test/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"test/assets/dar-test-reading-overlay-v1.css"),"utf8");
const tag="DAR_TEST_READING_OVERLAY_V1";
const pos=html.indexOf(tag);
assert(pos>0,"Reading host must exist in test HTML");
assert.equal(html.split(tag).length-1,1,"Exactly one reading controller");
const open=html.lastIndexOf("<script",pos);
const start=html.indexOf(">",open)+1;
const end=html.indexOf("</script>",pos);
assert(start>0&&end>pos&&open>=0,"Reading host must be within a classic script");
new vm.Script(html.slice(start,end),{filename:"test/index.html:app-script"});
for(const token of [
  "darTestReadingRoute(currentRoute)",
  "darTestReadingMount(html)",
  "darTestReadingClose()",
  "darTestReadingReturn()",
  'role="dialog"',
  "aria-modal",
  "dar-test-reading-overlay-v1.css",
  'currentRoute.view==="post"',
  'currentRoute.view==="bibliothek-reader"'
])assert(html.includes(token),"Missing reader integration "+token);
assert(css.includes("100dvh"),"Mobile reader must use dynamic viewport height");
assert(css.includes("prefers-reduced-motion"),"Reduced motion support required");
assert(css.includes("overscroll-behavior"),"Scroll containment required");
assert(html.includes('if(route.view==="frauen")'));
assert(html.includes('if(route.view==="hadith")'));
assert(!html.slice(pos,pos+500).includes('route.view==="quran-surah"'),"Quran reader must not be dialog-enabled");
console.log("DAR TEST premium reading overlay structural/syntax regression OK");
