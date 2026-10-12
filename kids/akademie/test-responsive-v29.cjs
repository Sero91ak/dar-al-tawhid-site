"use strict";
/* KIDS_ACADEMY_RESPONSIVE_V29_GUARD: zero dependencies, no child state writes. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const academy=read("kids/akademie/index.html");
const css=read("kids/akademie/responsive-integrity-v29.css");
const home=read("kids/ipad-home-audio-grid-v1347.css");
const files=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert(files.every(s=>s===files[0]),"Three KIDS entry shells must stay identical");
assert(academy.includes('/kids/akademie/responsive-integrity-v29.css?v=29'),
  "Academy late cascade must load integrity stylesheet");
assert(files[0].includes('/kids/ipad-home-audio-grid-v1347.css?v=1347'),
  "KIDS shell must load tablet home grid");
assert(academy.indexOf('responsive-integrity-v29.css?v=29')>academy.indexOf("</style>"),
  "Responsive repair must override all earlier inline CSS");
for(const [name,text] of [["academy",css],["home",home]]){
  let depth=0;
  for(const ch of text.replace(/\/\*[\s\S]*?\*\//g,"")){
    if(ch==="{")depth++;
    if(ch==="}"){depth--;assert(depth>=0,name+" has stray CSS brace");}
  }
  assert(depth===0,name+" has unbalanced CSS blocks");
}
for(const marker of [
  "KIDS_ACADEMY_RESPONSIVE_INTEGRITY_V29",
  "(min-width:768px) and (min-height:650px)",
  "(max-width:767px), (max-height:649px)",
  "grid-template-rows:max-content max-content max-content!important",
  "grid-row:1!important",
  "grid-row:2!important",
  "grid-row:3!important",
  "overflow-y:auto!important",
  'body[data-profile="girl"]',
  "max-height:none!important",
  "today-text",
  "journey",
  "subjects",
  "category-grid",
  "stageSurface"
])assert(css.includes(marker),"Missing academy regression marker: "+marker);
for(const marker of [
  "KIDS_IPAD_HOME_AUDIO_GRID_V1347",
  "repeat(4,minmax(0,1fr))",
  "repeat(2,minmax(0,1fr))",
  "max-height:none!important",
  "overflow-wrap:break-word!important",
])assert(home.includes(marker),"Missing home grid guard: "+marker);
for(const marker of ['id="academyHome"','class="today-class"','class="journey"','class="subjects"','id="lessonMain"']){
  assert(academy.includes(marker),"Protected academy element missing: "+marker);
}
console.log("KIDS_RESPONSIVE_V29_STATIC_GUARD_OK: academy + iPad home, 3 matching shells, boys/girls and device breakpoints");
