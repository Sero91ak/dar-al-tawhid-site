/* DAR TEST only: show machine-reviewed adult drafts beside the German original.
 * Drafts are never treated as approved. No provider calls. */
(function(global){"use strict";
if(global.__DarTestMachineDrafts)return;
const path=String(global.location?.pathname||"");
if(!/^\/test(?:\/|$)/.test(path)||/^\/test\/kids(?:\/|$)/.test(path))return;
global.__DarTestMachineDrafts=true;
const KEY="darAdultPreferredLocaleV1";
const RTL=new Set(["ar","ckb"]);
let pack=null;
function locale(){
 try{return String(global.localStorage?.getItem(KEY)||"de")}catch(_){return "de"}
}
function ensureStyle(){
 const doc=global.document;
 if(!doc?.getElementById||doc.getElementById("dar-machine-draft-style"))return;
 const style=doc.createElement("style");
 style.id="dar-machine-draft-style";
 style.textContent=".dar-machine-draft{box-sizing:border-box;max-width:100%;margin:12px 0;padding:12px 14px;border:1px solid rgba(184,148,74,.45);border-radius:16px;background:rgba(23,33,27,.92);color:#f4f1e6;overflow-wrap:anywhere;word-break:break-word}"+
  ".dar-machine-draft[dir=rtl]{text-align:right}.dar-machine-draft p{margin:0 0 8px;white-space:pre-wrap}"+
  ".dar-machine-draft h3{margin:8px 0;font-size:1.05rem}.dar-machine-draft .dar-machine-draft-note{font-size:.92rem;line-height:1.45}";
 doc.head.appendChild(style);
}
function panelFor(article){
 let panel=article.querySelector(":scope > .dar-machine-draft");
 if(panel)return panel;
 panel=global.document.createElement("aside");
 panel.className="dar-machine-draft";
 panel.setAttribute("data-dar-no-translate","machine-draft");
 panel.setAttribute("role","note");
 const header=article.querySelector(".post-reader-title");
 if(header?.nextSibling)article.insertBefore(panel,header.nextSibling);
 else article.appendChild(panel);
 return panel;
}
function render(){
 const doc=global.document;
 const article=doc?.querySelector?.("article.post-reader[data-post-id]");
 if(!article||!pack)return;
 const code=locale();
 const existing=article.querySelector(":scope > .dar-machine-draft");
 if(code==="de"||!pack.locales?.includes(code)){existing?.remove();return}
 ensureStyle();
 const id="post:"+article.getAttribute("data-post-id");
 const record=pack.records?.[id];
 const panel=panelFor(article);
 panel.setAttribute("lang",code);
 panel.setAttribute("dir",RTL.has(code)?"rtl":"ltr");
 const note=doc.createElement("p");
 note.className="dar-machine-draft-note";
 if(!record){
  note.textContent=pack.missing?.[code]||pack.missing?.en||"";
  panel.replaceChildren(note);
  return;
 }
 note.textContent=pack.notices?.[code]||pack.notices?.en||"";
 if(!record.translations?.[code]||record.status!=="draft"||record.humanApproval!==false){
  note.textContent=pack.stale?.[code]||note.textContent;
  panel.replaceChildren(note);
  return;
 }
 const title=doc.createElement("h3");
 title.textContent=record.translations[code].title||"";
 const body=doc.createElement("p");
 body.textContent=record.translations[code].body||"";
 const source=doc.createElement("p");
 source.textContent=String(record.immutable?.source||"");
 panel.replaceChildren(note,title,body,source);
}
function boot(data){
 if(data?.schemaVersion!==1||data.scope!=="dar-test-machine-drafts-only"||data.humanApproval!==false||data.status!=="draft")return;
 pack=data;
 render();
 global.addEventListener("dar-adult-locale-changed",render);
 global.addEventListener("dar:view-rendered",render);
 if(global.MutationObserver&&global.document?.body){
  new global.MutationObserver(()=>render()).observe(global.document.body,{childList:true,subtree:true});
 }
}
global.DarTestMachineDrafts={boot,render,get locale(){return locale()}};
const url="/test/i18n/adult-content-machine-drafts.json?v=20261023-batch1";
if(typeof global.fetch==="function"){
 global.fetch(url,{credentials:"same-origin",cache:"no-store"}).then(response=>{
  if(!response.ok)throw Error("draft pack unavailable");
  return response.json();
 }).then(boot).catch(error=>{
  if(global.console?.warn)global.console.warn("DĀR TEST machine drafts stayed hidden.",error);
 });
}
})(window);
