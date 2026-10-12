/* KIDS_GIRLS_HOME_FIRSTPAINT_V1348 zero-dependency regression test */
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const paths=["kids/index.html","kids/start.html","kids/shell.html"];
const shells=paths.map(p=>fs.readFileSync(p,"utf8"));
assert(shells.every(s=>s===shells[0]),"three Kids HTML entry points differ");
const h=shells[0];
const head=h.slice(0,h.indexOf("</head>"));
const profile=(head.match(/<script id="kids-profile-first-paint-v1348">([\s\S]*?)<\/script>/)||[])[1];
const app=(h.match(/<script id="kids-profile-apply-first-paint-v1348">([\s\S]*?)<\/script>/)||[])[1];
assert(profile&&app,"early profile initializer missing");
assert(head.indexOf('kids-profile-first-paint-v1348')<head.indexOf("<style>"),"read gender before app CSS");
const art="/kids/assets/kids-salah-v1272/hero-home.png?v=1274";
assert(head.includes(art),"first-paint must use same approved image");
assert(fs.existsSync("kids/assets/kids-salah-v1272/hero-home.png"),"approved image missing");
assert(head.includes("html body .app #view-today > .hero::before"),"legacy pre-wrap image not disabled");
assert(!head.includes("hero-clean-reference.jpg"),"old image must not be inside early paint");
assert(h.includes('/kids/girls-home-photo-palette-v1348.css?v=1349'),"new girl stylesheet missing");
assert(h.includes('/kids/girls-profile-theme-v1332.js?v=1348'),"theme-color cache bust missing");
const css=fs.readFileSync("kids/girls-home-photo-palette-v1348.css","utf8");
for(const selector of [".choice.story::before",".choice.quran::before",".choice.dua::before",
  ".academy-pilot-entry",".kids-salah-home-world",".choice::after"])
  assert(css.includes(selector),"girl palette misses "+selector);
for(const asset of ["world-stories.png","world-quran.png","world-dua.png"])
  assert(fs.existsSync("kids/assets/kids-home-v1176/"+asset),"existing photo missing: "+asset);
assert(!css.includes("world-quiz.png"),"must not reference nonexistent quiz image");
assert(css.includes('.app[data-gender="girl"]'),"girl-only guard missing");
const palette=fs.readFileSync("kids/girls-profile-theme-v1332.js","utf8");
assert(palette.includes('var neutral="#0c2636"'),"meta-color reset must not capture initial rose tint");
for(const c of ["girl","boy"]){
  for(const mode of ["registered","guest"]){
    const id="42",records=mode==="registered"?[
      {id:"other",gender:c==="girl"?"boy":"girl",age:"9–10"},
      {id,gender:c,age:"6–8"}
    ]:[];
    const stored={
      "kids.activeProfile":mode==="registered"?id:null,
      "kids.profiles.v1":JSON.stringify(records),
      "kids.guest.v1":mode==="guest"?"1":null,
      "kids.guest.gender.v1":c,
      "kids.age":"9–10"
    };
    const meta={value:"#0c2636",setAttribute(k,v){assert.equal(k,"content");this.value=v}};
    const html={dataset:{}};
    const document={documentElement:html,querySelector(q){return q==='meta[name="theme-color"]'?meta:null}};
    const ctx={document,localStorage:{getItem(k){return stored[k]??null}}};
    vm.runInNewContext(profile,ctx);
    assert.equal(html.dataset.kidsBootGender,c,mode+" "+c+" boot gender");
    assert.equal(meta.value,c==="girl"?"#241b35":"#0c2636");
    const node={dataset:{},setAttribute(k,v){this.dataset[k.replace("data-","")]=v}};
    document.currentScript={parentElement:node};
    vm.runInNewContext(app,ctx);
    assert.equal(node.dataset.gender,c,mode+" "+c+" app gender");
  }
}
for(const state of [
  {"kids.activeProfile":"42","kids.profiles.v1":"not-json"},
  {"kids.activeProfile":null,"kids.profiles.v1":"[]"}
]){
 const doc={documentElement:{dataset:{}},querySelector(){return null}};
 assert.doesNotThrow(()=>vm.runInNewContext(profile,{document:doc,localStorage:{getItem:k=>state[k]??null}}));
 assert.equal(doc.documentElement.dataset.kidsBootGender,"neutral");
}
console.log("KIDS_GIRLS_HOME_FIRSTPAINT_V1348_OK: 3 shells, existing images, registered/guest girl+boy, broken/empty storage");
