"use strict";
/**
 * DĀR TEST: the active Home publications must use the established posts
 * collection directly, not hidden V3 HTML elements or a second API.
 * Tests visible content and live updates without any V3 DOM.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.resolve(__dirname, "../assets/dar-home-html-parity-v1.js"), "utf8");
new vm.Script(source);
const start = source.indexOf("function recent(){");
const end = source.indexOf("\nfunction quran(){", start);
assert(start >= 0 && end > start, "Active recent() implementation missing");
const code = source.slice(start, end);
assert(!code.includes("document.querySelectorAll"), "Latest posts still depend on legacy HTML");
assert(code.includes('typeof posts!=="undefined"'), "Canonical posts model missing");
assert(code.includes(".slice(0,2)"), "Historical number of visible cards changed");

function el(tag) {
 return {
  tagName: tag, className: "", textContent: "", dataset: {}, children: [],
  append(...nodes) { this.children.push(...nodes); },
  appendChild(node) { this.children.push(node); return node; },
  replaceChildren(...nodes) { this.children = [...nodes]; }
 };
}
const target = el("div"), todayName = el("span"), todayArticle = el("button");
// The independent daily resolver owns this tile; recent() must never mutate it.
todayName.textContent = "Kanonische Tagesempfehlung";
todayArticle.dataset.dhpValue = "daily-canonical-post";
const box = {
 querySelector(selector) {
  return { "#dhpPosts": target, "#dhpTodayName": todayName, "#dhpTodayArticle": todayArticle }[selector] || null;
 }
};
const document = {
 getElementById(id) { assert.equal(id, "darHomeHtmlParityV1"); return box; },
 createElement: el
};
const posts = [
 { id: "q-101", title: "Die Seele zur Rechenschaft ziehen", scholar: "al-Ḥasan al-Baṣrī", category: "Tazkiyah" },
 { id: "q-102", title: "Tawḥīd, Īmān und Akhlāq – ein Dīn", scholar: "Ibn ʿAbbās", category: "ʿAqīdah / Tawḥīd" },
 { id: "q-103", title: "Nicht sichtbar", scholar: "Test", category: "Test" }
];
const context = vm.createContext({
 ID: "darHomeHtmlParityV1", document, posts, lastItems: "", console
});
vm.runInContext(code + "\nrecent();", context);
assert.equal(target.children.length, 2, "Unexpected number of publication capsules");
assert.equal(target.children[0].className, "dhp-panel dhp-feature dhp-post-capsule");
assert.equal(target.children[1].className, "dhp-article dhp-post-capsule");
assert.equal(target.children[0].children[1].textContent, posts[0].title);
assert.equal(target.children[1].children[0].children[0].textContent, posts[1].title);
assert.equal(target.children[0].children[2].textContent, "al-Ḥasan al-Baṣrī · Tazkiyah");
assert.equal(target.children[1].children[0].children[1].textContent, "Ibn ʿAbbās · ʿAqīdah / Tawḥīd");
assert.equal(todayName.textContent, "Kanonische Tagesempfehlung");
assert.equal(todayArticle.dataset.dhpValue, "daily-canonical-post");
const first = target.children[0];
vm.runInContext("recent();", context);
assert.strictEqual(target.children[0], first, "Unchanged data should not re-render");
context.posts = [{id:"q-104",title:"Neuer geprüfter Beitrag",scholar:"",category:""}];
vm.runInContext("recent();", context);
assert.equal(target.children.length, 1, "Refresh did not replace old publications");
assert.equal(target.children[0].children[1].textContent, "Neuer geprüfter Beitrag");
assert.equal(target.children[0].children[2].textContent, "Qurʾān · Sunnah · Aṯār");
assert.equal(todayArticle.dataset.dhpValue, "daily-canonical-post");
console.log("PASS — latest publications read canonical posts directly; geometry, text and update semantics preserved.");

/* Profile-independent global daily regression: the canonical recommendation
   must survive Neutral/Frau/Mann switches without a personalized overwrite. */
async function checkGlobalDailyAcrossProfiles(){
 const dailySource=fs.readFileSync(path.resolve(__dirname,"../../assets/dar-canonical-daily-v1.js"),"utf8");
 new vm.Script(dailySource,{filename:"dar-canonical-daily-v1.js"});
 for(const profilePath of [
  "../../assets/dar-visitor-smart-profile-v1.js",
  "../assets/dar-smart-profile-v1.js"
 ]){
  const profileSource=fs.readFileSync(path.resolve(__dirname,profilePath),"utf8");
  const homeBlock=profileSource.slice(profileSource.indexOf("function updateHome(p){"),profileSource.indexOf("function syncHeaderAvatar(p)"));
  assert.ok(homeBlock.includes("syncLatest(p,root)"),"Personalized home must keep publications");
  assert.ok(!homeBlock.includes("todayFeature(p,"),"Personalized ranking must not overwrite global daily");
  assert.ok(!homeBlock.includes("todayName.textContent"),"Home must not write canonical daily title");
 }
 const dateParts={};
 new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"})
  .formatToParts(new Date()).forEach(part=>dateParts[part.type]=part.value);
 const date=[dateParts.year,dateParts.month,dateParts.day].join("-");
 const recommendation={id:"published-global-daily-post",title:"Kanonische Tagesempfehlung"};
 const daily={date,timezone:"Europe/Berlin",dua:{id:"dua-035-rabbana-innana-amanna"},recommendation};
 const duas=[{id:"dua-035-rabbana-innana-amanna",title:"Duʿāʾ",ar:"دعاء",de:"Bittgebet",src:"Qurʾān 3:16"}];
 const heading={textContent:"Platzhalter"};
 const attrs={};
 const article={
  id:"dhpTodayArticle",dataset:{dhpRoute:"recent"},
  querySelector:selector=>selector.includes("#dhpTodayName")?heading:null,
  setAttribute:(key,value)=>{attrs[key]=value},
  removeAttribute:key=>{delete attrs[key];if(key==="data-dhp-value")delete article.dataset.dhpValue}
 };
 const listeners={};
 const dailyDocument={
  readyState:"complete",hidden:false,body:{},
  querySelectorAll:selector=>selector.includes("#dhpTodayArticle")?[article]:[],
  addEventListener:(name,fn)=>{listeners[name]=fn},
  dispatchEvent:()=>{},
  getElementById:()=>null
 };
 const fakeWindow={
  fetch:async url=>({ok:true,json:async()=>url.includes("daily.json")?daily:duas}),
  localStorage:{getItem:()=> "de"},location:{hash:"",search:""},
  addEventListener:()=>{},setInterval:()=>0,requestAnimationFrame:fn=>fn()
 };
 vm.runInNewContext(dailySource,{window:fakeWindow,document:dailyDocument,CustomEvent:class CustomEvent{}});
 const result=await fakeWindow.DARCanonicalDailyV1.refresh();
 assert.equal(result.recommendation.id,recommendation.id);
 for(const gender of ["neutral","woman","man"]){
  heading.textContent="Persönlich: "+gender;article.dataset.dhpValue="wrong-profile-post";
  listeners["dar:visitor-profile-changed"]({detail:{gender}});
  assert.equal(heading.textContent,recommendation.title);
  assert.equal(article.dataset.dhpValue,recommendation.id);
  assert.equal(article.dataset.dhpRoute,"post");
 }
 daily.date="1999-01-01";
 await fakeWindow.DARCanonicalDailyV1.refresh();
 assert.equal(attrs["aria-disabled"],"true","Expired recommendation cannot be navigated");
 assert.equal(article.dataset.dhpValue,undefined,"Expired recommendation ID removed");
 console.log("PASS — canonical daily identical for Neutral/Frau/Mann, safe rollover, personal suggestions remain separate.");
}
checkGlobalDailyAcrossProfiles().catch(error=>{console.error(error);process.exitCode=1});
