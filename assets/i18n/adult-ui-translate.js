/* DĀR AL TAWḤĪD · Shared adult German/Turkish user interface.
 * Reuses one static, pre-generated catalog; NO calls to any AI API.
 * Covers website, PWA, mobile browser and iOS WKWebView, never Kids.
 * Does not translate any original text, hadith, Qur'an or source quotation.
 */
(function(global){"use strict";
if(/^\/test(?:\/|$)/.test(global.location.pathname)||global.DARAdultUI18n)return;
const KEY="darAdultPreferredLocaleV1",URI="/assets/i18n/adult-ui-de-tr.json";
/* Turkish remains staged in DAR TEST; the visitor/PWA release list is German only. */
const RELEASED_UI_LOCALES=new Set(["de"]);
const catalog=new Map(),originalTexts=new WeakMap(),originalAttributes=new WeakMap();
const deny="script,style,noscript,textarea,pre,code,[contenteditable],[data-dar-no-translate],"+
 "[lang='ar'],[dir='rtl'],[data-canonical-content],[class*='quran-arabic'],"+
 "[class*='ayah-ar'],[class*='arabic-text'],[class*='post-body'],"+
 "[class*='post-content'],[class*='hadith-text'],[class*='source-quote'],"+
 "[class*='qsource-statement'],[class*='hadith-narration'],[class*='dua-arabic']";
const attrs=["placeholder","aria-label","title"];
let state="pending",queued=false;
function locale(){try{const requested=global.localStorage.getItem(KEY)||"de";return RELEASED_UI_LOCALES.has(requested)?requested:"de"}catch(_){return"de"}}
function excluded(el){return !!(el&&typeof el.closest==="function"&&el.closest(deny))}
function translate(value){
 if(typeof value!=="string")return null;
 const v=catalog.get(value);if(v!==undefined)return v;
 const counts=value.match(/^(\d+)\s+(Funktionen|Ergebnisse|Veröffentlichungen|Beiträge|Seiten|Themenbereiche|Aussagen|gemerkt)$/);
 const words={Funktionen:"işlev",Ergebnisse:"sonuç",Veröffentlichungen:"yayın",Beiträge:"yazı",
  Seiten:"sayfa",Themenbereiche:"konu alanı",Aussagen:"söz",gemerkt:"kaydedildi"};
 if(counts)return counts[1]+" "+words[counts[2]];
 const ayat=value.match(/^(\d+)\s+Āyāt\s*·\s*(Mekkanisch|Medinensisch)$/);
 if(ayat)return ayat[1]+" âyet · "+(ayat[2]==="Mekkanisch"?"Mekkî":"Medenî");
 const surat=value.match(/^(\d+)\s+Sūren\s*·\s*(\d+)\s+Āyāt$/);
 if(surat)return surat[1]+" sûre · "+surat[2]+" âyet";
 const percent=value.match(/^(\d+(?:[.,]\d+)?)%\s+Trefferquote$/);
 if(percent)return percent[1]+"% başarı oranı";
 const picked=value.match(/^(\d+)\/(\d+)\s+gewählt$/);
 if(picked)return picked[1]+"/"+picked[2]+" seçildi";
 const group=value.match(/^(.{2,90}),\s*(\d+)\s+Veröffentlichungen$/);
 if(group)return group[1]+", "+group[2]+" yayın";
 const pages=value.match(/^(.{2,90})\s*·\s*(\d+)\s+Seiten$/);
 if(pages)return (catalog.get(pages[1])||pages[1])+" · "+pages[2]+" sayfa";
 const range=value.match(/^Sūrenbereich wechseln, aktuell (\d+)[–-](\d+)$/);
 if(range)return "Sûre aralığını değiştir, şu an "+range[1]+"–"+range[2];
 const open=value.match(/^(.{2,160}) öffnen$/);
 if(open&&!/[<>\u0600-\u06ff]/.test(open[1]))return open[1]+" aç";
 return null;
}
function textNode(node,code){
 const el=node.parentElement;if(!el||excluded(el))return;
 const actual=String(node.nodeValue||"");
 let p=originalTexts.get(node);
 if(p&&p.source!==actual&&p.last!==actual){originalTexts.delete(node);p=null}
 if(!p){
  const x=actual.match(/^(\s*)(.*?)(\s*)$/s);
  if(!x||translate(x[2])===null)return;
  p={source:actual,last:actual};originalTexts.set(node,p);
 }
 const x=p.source.match(/^(\s*)(.*?)(\s*)$/s);
 const desired=code==="tr"?x[1]+translate(x[2])+x[3]:p.source;
 if(node.nodeValue!==desired)node.nodeValue=desired;
 p.last=desired;
}
function attributes(el,code){
 if(excluded(el)||!el.getAttribute)return;
 let p=originalAttributes.get(el);
 if(!p){p={};originalAttributes.set(el,p)}
 for(const a of attrs){
  const current=el.getAttribute(a);if(current==null)continue;
  if(p[a]&&p[a].source!==current&&p[a].last!==current)delete p[a];
  if(!p[a]){if(translate(current)===null)continue;p[a]={source:current,last:current}}
  const next=code==="tr"?translate(p[a].source):p[a].source;
  if(current!==next)el.setAttribute(a,next);
  p[a].last=next;
 }
}
function apply(root=global.document.body){
 if(!root)return 0;
 const lang=locale();
 if(lang==="tr"&&!catalog.size)return 0;
 const filter=global.NodeFilter;
 if(!filter)return 0;
 const walk=global.document.createTreeWalker(root,filter.SHOW_ELEMENT|filter.SHOW_TEXT);
 let node,count=0;
 while((node=walk.nextNode())){
  if(node.nodeType===1){attributes(node,lang);continue}
  if(node.nodeType===3){textNode(node,lang);count++}
 }
 if(global.document.documentElement)global.document.documentElement.lang=lang;
 syncButtons();return count;
}
function syncButtons(){
 const selected=locale();
 global.document.querySelectorAll("[data-dar-adult-locale]").forEach(el=>
  el.setAttribute("aria-pressed",String(el.getAttribute("data-dar-adult-locale")===selected)));
}
function schedule(){
 if(queued)return;queued=true;
 const fn=()=>{queued=false;apply();mountSettingsChooser()};
 if(typeof global.requestAnimationFrame==="function")global.requestAnimationFrame(fn);
 else Promise.resolve().then(fn);
}
function setLocale(code){
 if(!RELEASED_UI_LOCALES.has(code))return false;
 try{global.localStorage.setItem(KEY,code)}catch(_){}
 global.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));
 schedule();return true;
}
async function load(){
 if(!RELEASED_UI_LOCALES.has("tr")){state="unreleased";return 0;}
 if(state==="loaded")return catalog.size;
 state="loading";
 try{
  const r=await global.fetch(URI,{cache:"no-store",credentials:"same-origin"});
  if(!r.ok)throw Error("Missing shared UI catalog");
  const data=await r.json();
  if(data.schemaVersion!==1||data.locale!=="tr"||data.sourceLocale!=="de"||
     data.scope!=="adult-interface-only"||!data.entries||
     typeof data.entries!=="object"||Array.isArray(data.entries))throw Error("Invalid UI data");
  for(const [de,tr] of Object.entries(data.entries)){
   if(de.length<2||de.length>180||typeof tr!=="string"||tr.length>220||
      /[\u0600-\u06ff<>]/.test(de+tr))continue;
   catalog.set(de,tr);
  }
  state="loaded";schedule();return catalog.size;
 }catch(_){state="unavailable";return 0}
}
function mountSettingsChooser(){
 if(!global.document?.querySelector)return;
 const home=global.document.querySelector("#appView .dsh-shell.dsh-home,#appView .settings-one-page");
 if(!home||home.querySelector("#darAdultLanguageControl"))return;
 const root=global.document.createElement("section");
 root.id="darAdultLanguageControl";
 root.className="dal-entry dal-entry-settings";
 root.setAttribute("data-dar-language-entry","settings");
 root.setAttribute("data-dar-no-translate","picker");
 root.setAttribute("aria-label","Sprache wählen");
 const after=home.querySelector(".dsh-welcome");
 if(after)after.insertAdjacentElement("afterend",root);
 else home.insertBefore(root,home.firstChild);
 syncButtons();
}
function boot(){
 if(!global.DARAdultLanguagePickerV1&&!global.__DAR_LANGUAGE_PICKER_LOADING){
  global.__DAR_LANGUAGE_PICKER_LOADING=true;
  const script=global.document.createElement("script");
  script.src="/assets/i18n/adult-language-picker-v1.js?v=20261022-01";
  script.async=true;
  script.onerror=()=>{global.__DAR_LANGUAGE_PICKER_LOADING=false};
  global.document.head?.appendChild(script);
 }
 load();mountSettingsChooser();
 if(global.MutationObserver&&global.document.body)new MutationObserver(()=>schedule())
  .observe(global.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
 schedule();
}
global.addEventListener("dar-adult-locale-changed",schedule);
global.addEventListener("storage",e=>{if(e.key===KEY)schedule()});
global.document.addEventListener("dar:view-rendered",schedule);
global.document.addEventListener("click",e=>{
 const b=e.target?.closest?.("[data-dar-adult-locale]");
 if(b){e.preventDefault();e.stopPropagation();setLocale(b.getAttribute("data-dar-adult-locale"))}
},true);
global.DARAdultUI18n={load,apply,setLocale,locale,translate,
 get catalogStatus(){return state},get translatedKeys(){return catalog.size},
 scope:"adult-visitor-website-pwa-wkwebview"};
if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})(window);
