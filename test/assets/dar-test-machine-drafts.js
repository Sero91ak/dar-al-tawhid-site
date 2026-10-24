/* DAR TEST only: show machine-reviewed adult drafts in the selected language.
 * The German original stays stored and is restored for locale de.
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
const HOSTS="article.post-reader[data-post-id],[data-nav='post'][data-value],[data-dv3-nav='post'][data-dv3-value],[data-dhp-value],article.feed-card[data-post-id]";
function hosts(){
 const doc=global.document;
 if(typeof doc?.querySelectorAll==="function")return Array.from(doc.querySelectorAll(HOSTS));
 const one=doc?.querySelector?.("article.post-reader[data-post-id]");
 return one?[one]:[];
}
function plain(value){
 return String(value||"").replace(/\*\*/g,"").replace(/\s+\n/g,"\n").trim();
}
function splitDraft(body){
 const text=plain(body);
 const mark=text.indexOf("🌙");
 if(mark<0)return {statement:text,conclusion:""};
 return {statement:text.slice(0,mark).trim(),conclusion:text.slice(mark).trim()};
}
function excerptOf(statement){
 const lines=String(statement||"").split(/\n+/).map(line=>line.trim()).filter(Boolean);
 const quote=lines.find(line=>/[„“"«»]/.test(line)&&!line.startsWith("🖋️"));
 return quote||lines.find(line=>!line.startsWith("🖋️")&&!line.startsWith("📖"))||lines[0]||"";
}
function listed(root,selector){
 if(typeof root?.querySelectorAll==="function")return Array.from(root.querySelectorAll(selector));
 const one=root?.querySelector?.(selector)||null;
 return one?[one]:[];
}
function titleNodes(root){
 const nodes=listed(root,".post-reader-title h2, header h2, .home-v380-post-title, .dv3-post-body b, .post-row__body h3, .home-v380-popular-text h4, .recommended-title, .related-compact-card h4, .dhp-post-capsule h3, .post-title");
 if(nodes.length)return nodes;
 const legacy=root?.querySelector?.(".post-reader-title h2, header h2");
 return legacy?[legacy]:[];
}
function statementNodes(root){
 const exact=listed(root,".post-aussage-text");
 if(exact.length)return exact;
 const quotes=listed(root,".sf-quote-text");
 if(quotes.length)return quotes;
 const loose=root?.querySelector?.(".statement");
 if(loose&&!(loose.children&&loose.children.length))return [loose];
 const legacy=root?.querySelector?.(".post-aussage-text, .statement");
 return legacy&&!(legacy.children&&legacy.children.length)?[legacy]:[];
}
function showDraft(element,value,code){
 if(!element||!value)return;
 if(!element.getAttribute("data-dar-source"))element.setAttribute("data-dar-source",element.textContent||"");
 if(element.textContent!==value)element.textContent=value;
 element.setAttribute("lang",code);
 element.setAttribute("dir",RTL.has(code)?"rtl":"ltr");
 element.setAttribute("data-dar-no-translate","machine-draft-field");
}
function restoreField(element){
 if(!element?.getAttribute?.("data-dar-source"))return;
 const source=element.getAttribute("data-dar-source");
 if(element.textContent!==source)element.textContent=source;
 element.removeAttribute?.("lang");
 element.removeAttribute?.("dir");
 element.removeAttribute?.("data-dar-no-translate");
}
function showAria(element,germanTitle,translatedTitle){
 const aria=element.getAttribute?.("aria-label");
 if(!aria||!germanTitle||!translatedTitle)return;
 if(!element.getAttribute("data-dar-source-aria"))element.setAttribute("data-dar-source-aria",aria);
 const source=element.getAttribute("data-dar-source-aria");
 if(!source.startsWith(germanTitle))return;
 const next=translatedTitle+source.slice(germanTitle.length);
 if(element.getAttribute("aria-label")!==next)element.setAttribute("aria-label",next);
}
function restoreAria(element){
 const source=element.getAttribute?.("data-dar-source-aria");
 if(source!=null&&element.getAttribute("aria-label")!==source)element.setAttribute("aria-label",source);
}
function applyVisible(host,code,translation){
 const parts=splitDraft(translation.body);
 const title=plain(translation.title);
 const germanTitle=titleNodes(host)[0]?.getAttribute?.("data-dar-source")||titleNodes(host)[0]?.textContent||"";
 titleNodes(host).forEach(node=>showDraft(node,title,code));
 statementNodes(host).forEach(node=>showDraft(node,parts.statement,code));
 listed(host,".home-v380-post-excerpt, .post-row__sub").forEach(node=>showDraft(node,excerptOf(parts.statement),code));
 listed(host,".post-fazit-body").forEach(node=>{if(parts.conclusion)showDraft(node,parts.conclusion,code)});
 showAria(host,germanTitle,title);
 host.setAttribute("data-dar-draft-locale",code);
}
function restoreVisible(host){
 titleNodes(host).forEach(restoreField);
 statementNodes(host).forEach(restoreField);
 listed(host,".home-v380-post-excerpt, .post-row__sub").forEach(restoreField);
 listed(host,".post-fazit-body").forEach(restoreField);
 restoreAria(host);
 host.setAttribute("data-dar-draft-locale","de");
}
function hostId(node){
 const raw=node.getAttribute("data-post-id")||node.getAttribute("data-value")||node.getAttribute("data-dv3-value")||node.getAttribute("data-dhp-value")||"";
 if(!raw)return "";
 return raw.startsWith("post:")?raw:"post:"+raw;
}
let surface=null;
const phraseState=new WeakMap();
function phraseMap(code){
 const map=new Map();
 if(!surface||code==="de")return map;
 for(const record of Object.values(surface.records||{})){
  if(record.status!=="draft"||record.humanApproval!==false)continue;
  const source=record.german||{};
  const translated=record.translations?.[code]||{};
  for(const key of Object.keys(source)){
   const from=source[key],to=translated[key];
   if(typeof from==="string"&&typeof to==="string"&&from.trim()&&to.trim()&&!map.has(from))map.set(from,to);
  }
 }
 return map;
}
function applyPhrases(){
 const doc=global.document;
 const root=doc?.body;
 if(!root||typeof doc.createTreeWalker!=="function")return;
 const code=locale();
 const map=phraseMap(code);
 const walker=doc.createTreeWalker(root,4);
 let node;
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  const skipped=parent.closest?.("script,style,.dua-arabic,.quran-arabic,[lang='ar'],[data-dar-no-translate]");
  if(skipped&&skipped!==global.document?.documentElement)continue;
  const current=String(node.nodeValue||"");
  const match=current.match(/^(\s*)(.*?)(\s*)$/s);
  if(!match)continue;
  let state=phraseState.get(node);
  if(state&&current!==state.rendered&&current!==state.source){phraseState.delete(node);state=null}
  if(!state){
   if(!map.has(match[2]))continue;
   state={source:current,rendered:current};
   phraseState.set(node,state);
  }
  const parts=state.source.match(/^(\s*)(.*?)(\s*)$/s);
  const next=code==="de"||!map.has(parts[2])?state.source:parts[1]+map.get(parts[2])+parts[3];
  if(node.nodeValue!==next)node.nodeValue=next;
  state.rendered=next;
 }
}
function bootSurface(data){
 if(data?.schemaVersion!==1||data.scope!=="dar-test-surface-drafts-only"||data.humanApproval!==false||data.status!=="draft")return;
 surface=data;
 render();
}
function render(){
 const doc=global.document;
 if(!doc||(!pack&&!surface))return;
 if(!pack){applyPhrases();return}
 const code=locale();
 for(const host of hosts()){
  const reader=host.className==="post-reader"||String(host.className||"").split(/\s+/).includes("post-reader");
  const existing=reader?host.querySelector(":scope > .dar-machine-draft"):null;
  const id=hostId(host);
  const record=pack.records?.[id];
  const translation=record?.translations?.[code];
  const ready=code!=="de"&&pack.locales?.includes(code)&&translation&&record.status==="draft"&&record.humanApproval===false;
  const signature=ready?code+"\n"+translation.title+"\n"+translation.body:code;
  if(host.getAttribute("data-dar-draft-sig")===signature)continue;
  if(!ready){
   existing?.remove();
   restoreVisible(host);
   host.setAttribute("data-dar-draft-sig",signature);
   continue;
  }
  applyVisible(host,code,translation);
  if(reader){
   ensureStyle();
   const panel=panelFor(host);
   panel.setAttribute("lang",code);
   panel.setAttribute("dir",RTL.has(code)?"rtl":"ltr");
   const note=doc.createElement("p");
   note.className="dar-machine-draft-note";
   note.textContent=pack.notices?.[code]||pack.notices?.en||"";
   const title=doc.createElement("h3");
   title.textContent=translation.title||"";
   const body=doc.createElement("p");
   body.textContent=translation.body||"";
   const source=doc.createElement("p");
   source.textContent=String(record.immutable?.source||"");
   panel.replaceChildren(note,title,body,source);
  }
  host.setAttribute("data-dar-draft-sig",signature);
 }
 applyPhrases();
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
global.DarTestMachineDrafts={boot,bootSurface,render,get locale(){return locale()}};
const url="/test/i18n/adult-content-machine-drafts.json?v=20261023-batch1";
if(typeof global.fetch==="function"){
 global.fetch(url,{credentials:"same-origin",cache:"no-store"}).then(response=>{
  if(!response.ok)throw Error("draft pack unavailable");
  return response.json();
 }).then(boot).catch(error=>{
  if(global.console?.warn)global.console.warn("DĀR TEST machine drafts stayed hidden.",error);
 });
 global.fetch("/test/i18n/adult-surface-drafts.json?v=20261024-surface-hadith-88",{credentials:"same-origin",cache:"no-store"}).then(response=>{
  if(!response.ok)return null;
  return response.json();
 }).then(data=>{if(data)bootSurface(data)}).catch(()=>{});
}
})(window);
