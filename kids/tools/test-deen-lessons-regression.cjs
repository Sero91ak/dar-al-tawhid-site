#!/usr/bin/env node
"use strict";
/* Prevent another accidental removal of the public Dīn category renderer.
 * No network calls, audio synthesis, user-profile writes or test UI.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const data=JSON.parse(fs.readFileSync(path.join(root,"kids/data/deen-lessons.json"),"utf8"));
const code=fs.readFileSync(path.join(root,"kids/deen-lessons.js"),"utf8");
assert.equal(data.items.length,6,"Dīn must keep all six original categories");
const expected=["was-ist-tawhid","was-ist-iman","asma-wa-sifat","was-ist-ibadah","adab-und-akhlaq","al-akhirah"];
assert.deepEqual(data.items.map(x=>x.id),expected,"Dīn categories or order unexpectedly changed");
assert.ok(data.items.every(x=>x.masterStoryText?.length>500&&x.sourceRefs?.length>=3),"Each Dīn category must retain original lesson text and evidence");
assert.ok(!code.includes("installSwipeBack("),"Navigation remains button-only");
const hooked=code.replace(/\}\)\(\);\s*$/,'window.__check={fill:a=>{items=a},renderCards,sourceHtml,textFor};})();');
assert.notEqual(hooked,code,"Unable to instrument Dīn runtime");
const grid={innerHTML:"",querySelectorAll(){return[]}};
const window={};
vm.runInNewContext(hooked,{
 window,document:{readyState:"loading",addEventListener(){},querySelector:s=>s==="#dlGrid"?grid:null},
 Audio:class{addEventListener(){} pause(){} load(){}},
 localStorage:{getItem(){return null}},setTimeout(){}
},{timeout:1500});
window.__check.fill(data.items);
window.__check.renderCards();
const escape=s=>String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
assert.equal((grid.innerHTML.match(/data-dl-id=/g)||[]).length,6,"Missing Dīn category cards");
for(const item of data.items){
 assert.ok(grid.innerHTML.includes(escape(item.categoryTitle)),"Missing category: "+item.id);
 assert.equal(window.__check.textFor(item),item.masterStoryText,"Lesson text mismatch: "+item.id);
 assert.ok(window.__check.sourceHtml(item).includes(item.sourceRefs[0]),"Missing source: "+item.id);
}
console.log("Dīn regression passed: six categories, full texts, sources and button-only navigation");
