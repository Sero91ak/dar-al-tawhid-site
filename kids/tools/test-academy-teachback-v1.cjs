/* Automated structural/interaction contract; not a theological or human hearing approval. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const base=path.join(__dirname,"..");
const code=fs.readFileSync(path.join(base,"akademie/teachback-v1.js"),"utf8");
const css=fs.readFileSync(path.join(base,"akademie/teachback-v1.css"),"utf8");
const html=fs.readFileSync(path.join(base,"akademie/index.html"),"utf8");
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.hidden=false;this.className="";this.textContent="";this.href="";}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 setAttribute(k,v){this.attributes[k]=v;}
 getAttribute(k){return this.attributes[k];}
 addEventListener(k,fn){this.events[k]=fn;}
 click(){this.events.click?.();}
}
const context={window:{},document:{createElement:tag=>new Element(tag)}};
vm.runInNewContext(code,context,{timeout:2000,filename:"teachback-v1.js"});
const api=context.window.DARKidsAcademyTeachBack;
assert.ok(api);
assert.equal(api.curatedIds.length,12);
for(const id of api.curatedIds){
 for(const age of ["4-5","6-8","9-10"]){
  const p=api.plan({lessonId:id,lesson:{topic:"Probenthema",quran:{label:"Sūrah 2:153",excerpt:true},hadith:{source:"Ṣaḥīḥ al-Buḫārī 1469"}},age});
  assert.ok(p.scenario.length>30,id+" "+age);
  assert.ok(p.question.length>15);
  assert.equal(p.level,age);
  assert.equal(p.automaticGrading,false);
  assert.equal(p.audioApproved,false);
  assert.equal(p.excerpt,true);
 }
}
const fallback=api.plan({lessonId:"neue-lektion-2027",lesson:{topic:"Neue Lektion"},age:"9-10"});
assert.match(fallback.scenario,/Neue Lektion/);
let callback=0;
const root=new Element("section");
api.mount(root,{lessonId:"sidq",age:"6-8",onEvidence:()=>{callback++;}});
const find=(element,cls)=>[element,...element.children.flatMap(child=>find(child,cls))].filter(e=>e.className?.split(" ").includes(cls));
const buttons=find(root,"academy-teach-tab");
assert.equal(buttons.length,3);
assert.equal(buttons[0].getAttribute("aria-pressed"),"true");
buttons[1].click();
assert.equal(buttons[1].getAttribute("aria-pressed"),"true");
assert.ok(find(root,"academy-teach-evidence")[0].children.length>=2);
find(root,"academy-teach-action")[0].click();
assert.equal(callback,1);
buttons[2].click();
const parent=find(root,"academy-teach-parent")[0];
assert.equal(parent.hidden,false);
const parentToggle=find(root,"academy-teach-action")[1];
parentToggle.click();
assert.equal(find(root,"academy-teach-parent-panel")[0].hidden,false);
assert.equal(find(root,"academy-teach-link")[0].href,"/kids/");
assert.ok(html.includes('id="academyTeachBackInteractive"'));
assert.ok(html.includes('teachback-v1.js?v=20261031-01'));
assert.ok(html.includes('teachback-v1.css?v=20261031-01'));
assert.ok(html.includes('...all(\'[data-lesson-step="4"] .recap-reflection\')'));
assert.ok(css.includes("var(--gold)")&&css.includes("min-height:49px"));
assert.ok(!/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|\bspeechSynthesis\b|\bWebSocket\b|\bnavigator\.share\b/.test(code));
assert.ok(!code.includes("elevenlabs")&&!code.includes("new Audio("));
console.log("PASS: 12 curated topics × 3 age variants; fallback, 3-step interaction, parent reveal, source callback, 5 recap focus pages; no tracking/audio");
