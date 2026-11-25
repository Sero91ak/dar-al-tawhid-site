/* DĀR AL TAWḤĪD · one adult locale runtime for the visitor site and Android PWA.
 * Nine languages. UI strings and approved content packs. No paid translation API.
 * German remains the fallback where a pack has no entry. Kids is out of scope.
 * Arabic originals, isnād blocks, source links and data-dar-no-translate="testament" stay untouched.
 */
(function(global){"use strict";
if(global.DARAdultUI18n)return;
var path=String(global.location&&global.location.pathname||"");
if(/\/kids(?:\/|$)/.test(path))return;
var TEST=/^\/test(?:\/|$)/.test(path);
var KEY="darAdultPreferredLocaleV1";
var LOCALES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var RTL={"ar":1,"ckb":1};
var NOTICE={
 de:"",
 ar:"لا توجد ترجمة لهذا الجزء. يُعرض النص الألماني الأصلي.",
 en:"No translation is available for this part. The original German text is shown.",
 tr:"Bu bölümün çevirisi yok. Almanca özgün metin gösteriliyor.",
 ku:"Ji bo vê beşê werger tune ye. Metna resen a almanî tê nîşandan.",
 ckb:"بۆ ئەم بەشە وەرگێڕان نییە. دەقی ڕەسەنی ئەڵمانی پیشان دەدرێت.",
 bs:"Za ovaj dio nema prijevoda. Prikazan je izvorni njemački tekst.",
 fr:"Aucune traduction pour cette partie. Le texte allemand original est affiché.",
 es:"No hay traducción de esta parte. Se muestra el texto original en alemán."
};
var catalog=new Map();
var content=null;
var hadithPack=null;
var quotes=[];
var fallbackCount=0;
var busy=false;
var queued=false;
var originalTexts=new WeakMap();
var originalAttributes=new WeakMap();
var deny="script,style,noscript,textarea,pre,code,[contenteditable],[data-dar-no-translate],"+
 "[class*='quran-arabic'],[class*='ayah-ar'],[class*='arabic-text'],[class*='qsource-arabic'],"+
 "[class*='q49-ar'],[class*='qsource-links'],a[href],"+
 "[data-canonical-content]";
var attrs=["placeholder","aria-label","title"];
function norm(s){return String(s||"").replace(/\s+/g," ").trim();}
function locale(){
 var q="";
 try{var p=new URLSearchParams(global.location.search);q=String(p.get("lang")||p.get("locale")||"").toLowerCase();}catch(_){}
 if(LOCALES.indexOf(q)>=0){try{global.localStorage.setItem(KEY,q)}catch(_){}return q}
 try{var s=String(global.localStorage.getItem(KEY)||"");if(LOCALES.indexOf(s)>=0)return s}catch(_){}
 return "de";
}
function excluded(el){
 if(!el||typeof el.closest!=="function")return false;
 if(el.closest("[data-dar-no-translate]"))return true;
 var hit=el.closest(deny);
 if(!hit)return false;
 if(hit===global.document.documentElement)return false;
 return true;
}
function mostlyArabic(value){
 var ar=(String(value).match(/[\u0600-\u06ff]/g)||[]).length;
 var lat=(String(value).match(/[A-Za-zÄÖÜäöüß]/g)||[]).length;
 return ar>lat&&ar>8;
}
function translate(value){
 if(typeof value!=="string"||locale()==="de")return null;
 var v=catalog.get(value);
 return v===undefined?null:v;
}
function textNode(node){
 var el=node.parentElement;if(!el||excluded(el))return;
 var actual=String(node.nodeValue||"");
 if(mostlyArabic(actual))return;
 var p=originalTexts.get(node);
 if(p&&p.source!==actual&&p.last!==actual){originalTexts.delete(node);p=null}
 if(!p){
  var x=actual.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if(!x||translate(x[2])===null)return;
  p={source:actual,last:actual};originalTexts.set(node,p);
 }
 var m=p.source.match(/^(\s*)([\s\S]*?)(\s*)$/);
 var next=locale()==="de"?p.source:m[1]+translate(m[2])+m[3];
 if(node.nodeValue!==next)node.nodeValue=next;
 p.last=next;
}
function attributes(el){
 if(excluded(el)||!el.getAttribute)return;
 var p=originalAttributes.get(el);
 if(!p){p={};originalAttributes.set(el,p)}
 for(var i=0;i<attrs.length;i++){
  var a=attrs[i],current=el.getAttribute(a);
  if(current==null||mostlyArabic(current))continue;
  if(p[a]&&p[a].source!==current&&p[a].last!==current)delete p[a];
  if(!p[a]){if(translate(current)===null)continue;p[a]={source:current,last:current}}
  var next=locale()==="de"?p[a].source:translate(p[a].source);
  if(current!==next)el.setAttribute(a,next);
  p[a].last=next;
 }
}
function applyQuotes(root){
 if(!quotes.length||locale()==="de"||!root)return;
 var filter=global.NodeFilter;if(!filter)return;
 var walk=global.document.createTreeWalker(root,filter.SHOW_TEXT);
 var node;
 while((node=walk.nextNode())){
  var el=node.parentElement;if(!el||excluded(el))continue;
  var raw=String(node.nodeValue||"");
  if(mostlyArabic(raw))continue;
  var flat=norm(raw);
  for(var i=0;i<quotes.length;i++){
   var pair=quotes[i];
   if(flat===pair.de){if(node.nodeValue!==pair.to)node.nodeValue=pair.to;break}
   if(flat.indexOf(pair.de)>=0&&pair.de.length>40){
    node.nodeValue=raw.replace(pair.de,pair.to);
    break;
   }
  }
 }
}
function applyUi(root){
 root=root||global.document.body;
 if(!root||TEST)return 0;
 var filter=global.NodeFilter;if(!filter)return 0;
 if(locale()!=="de"&&!catalog.size)return 0;
 var walk=global.document.createTreeWalker(root,filter.SHOW_ELEMENT|filter.SHOW_TEXT);
 var node,count=0;
 while((node=walk.nextNode())){
  if(node.nodeType===1){attributes(node);continue}
  if(node.nodeType===3){textNode(node);count++}
 }
 applyQuotes(root);
 return count;
}
function setRoot(){
 var code=locale();
 var doc=global.document.documentElement;
 if(!doc)return;
 doc.lang=code;
 doc.dir=RTL[code]?"rtl":"ltr";
}
function note(){
 if(TEST||!global.document.body)return;
 var id="darLocaleFallbackNote";
 var el=global.document.getElementById(id);
 var code=locale();
 if(code==="de"||!fallbackCount){if(el)el.hidden=true;return}
 if(!el){
  el=global.document.createElement("p");
  el.id=id;
  el.setAttribute("data-dar-no-translate","fallback");
  el.style.cssText="margin:8px 16px;padding:8px 12px;border-radius:12px;font:13px/1.45 system-ui,sans-serif;background:color-mix(in srgb,currentColor 8%,transparent)";
  var host=global.document.getElementById("appView")||global.document.body;
  host.insertBefore(el,host.firstChild);
 }
 el.hidden=false;
 el.textContent=NOTICE[code]||NOTICE.en;
}
function field(bag,id){return bag&&id&&bag[id]?bag[id]:null}
function applyPosts(){
 if(typeof global.posts==="undefined"||!Array.isArray(global.posts))return;
 var code=locale();
 var bag=content&&content.posts;
 for(var i=0;i<global.posts.length;i++){
  var post=global.posts[i];
  if(!post||!post.id)continue;
  if(!post.__darDe)post.__darDe={title:post.title,statement:post.statement};
  var hit=code==="de"?null:field(bag,post.id);
  var title=hit&&hit.title?hit.title:post.__darDe.title;
  var statement=hit&&hit.body?hit.body:post.__darDe.statement;
  post.localeReview=hit?"machine-translation-owner-approved":(code==="de"?"original":"fallback-de");
  if(post.title!==title)post.title=title;
  if(post.statement!==statement)post.statement=statement;
 }
}
function applyDuas(){
 if(typeof global.DUAS==="undefined"||!Array.isArray(global.DUAS))return;
 var code=locale();
 var bag=content&&content.duas;
 var byMean=content&&content.duaByMeaning;
 for(var i=0;i<global.DUAS.length;i++){
  var d=global.DUAS[i];
  if(!d)continue;
  if(!d.__darDe)d.__darDe={title:d.title,occasion:d.occasion,de:d.de};
  var hit=null;
  if(code!=="de"){
   hit=field(bag,d.id);
   if(!hit&&byMean)hit=byMean[norm(d.__darDe.de)]||byMean[norm(d.__darDe.title)];
  }
  d.title=hit&&hit.title?hit.title:d.__darDe.title;
  d.occasion=hit&&hit.occasion?hit.occasion:d.__darDe.occasion;
  d.de=hit&&hit.meaning?hit.meaning:d.__darDe.de;
 }
}
function applyQuizCache(list){
 if(!Array.isArray(list))return;
 var code=locale();
 var bag=content&&content.quiz;
 for(var i=0;i<list.length;i++){
  var q=list[i];
  if(!q)continue;
  if(!q.__darDe)q.__darDe={question:q.question,explanation:q.explanation,answers:(q.answers||[]).slice()};
  var hit=code==="de"?null:field(bag,q.id);
  if(hit&&Array.isArray(hit.answers)&&hit.answers.length===q.__darDe.answers.length){
   q.question=hit.question||q.__darDe.question;
   q.explanation=hit.explanation||q.__darDe.explanation;
   q.answers=hit.answers.slice();
  }else{
   q.question=q.__darDe.question;
   q.explanation=q.__darDe.explanation;
   q.answers=q.__darDe.answers.slice();
  }
 }
}
function applyHadithList(list){
 if(!Array.isArray(list)||!hadithPack)return;
 var code=locale();
 for(var i=0;i<list.length;i++){
  var h=list[i];
  if(!h||!h.id)continue;
  if(!h.__darDe)h.__darDe={german:h.german,narrator:h.narrator,speakerLabel:h.speakerLabel,sharhText:h.sharhText};
  var hit=code==="de"?null:hadithPack[h.id];
  if(hit&&hit.text){
   h.german=hit.text;
   if("germanHtml" in h)h.germanHtml=hit.text;
   if(hit.narrator)h.narrator=hit.narrator;
   if(hit.speaker)h.speakerLabel=hit.speaker;
   if(hit.sharh)h.sharhText=hit.sharh;
   h.localeReview="machine-translation-owner-approved";
  }else{
   h.german=h.__darDe.german;
   if("germanHtml" in h)h.germanHtml=h.__darDe.german;
   h.narrator=h.__darDe.narrator;
   h.speakerLabel=h.__darDe.speakerLabel;
   h.sharhText=h.__darDe.sharhText;
  }
 }
}
function applyContent(rerender){
 if(busy)return;
 busy=true;
 try{
  applyPosts();
  fallbackCount=0;
  try{
   var hash=String(global.location.hash||"");
   var match=hash.match(/post\/([^/?#]+)/i);
   if(match&&Array.isArray(global.posts)){
    var openId=decodeURIComponent(match[1]);
    var open=global.posts.find(function(p){return p&&String(p.id)===openId});
    if(open&&open.localeReview==="fallback-de")fallbackCount=1;
   }
  }catch(_){}
  applyDuas();
  if(typeof global.quizQuestionsCache!=="undefined")applyQuizCache(global.quizQuestionsCache);
  if(global.__darQuizState&&Array.isArray(global.__darQuizState.questions))applyQuizCache(global.__darQuizState.questions);
  if(typeof global.hadithSearchIndex!=="undefined")applyHadithList(global.hadithSearchIndex);
  if(global.hadithCollections&&typeof global.hadithCollections.forEach==="function"){
   global.hadithCollections.forEach(function(col){
    if(Array.isArray(col))applyHadithList(col);
    else if(col&&Array.isArray(col.items))applyHadithList(col.items);
    else if(col&&Array.isArray(col.hadiths))applyHadithList(col.hadiths);
   });
  }
  setRoot();
  note();
  if(rerender&&typeof global.render==="function"){
   try{global.render()}catch(_){}
  }
 }finally{busy=false}
}
function schedule(){
 if(queued)return;queued=true;
 var fn=function(){queued=false;if(!TEST){applyUi();mountSettingsChooser()}setRoot();note()};
 if(typeof global.requestAnimationFrame==="function")global.requestAnimationFrame(fn);
 else Promise.resolve().then(fn);
}
function hook(){
 if(typeof global.applyPostsList==="function"&&!global.applyPostsList.__darLocale){
  var origPosts=global.applyPostsList;
  var wrapped=function(){var r=origPosts.apply(this,arguments);applyContent(false);schedule();return r};
  wrapped.__darLocale=true;global.applyPostsList=wrapped;
 }
 if(typeof global.normalizeLoadedDuas==="function"&&!global.normalizeLoadedDuas.__darLocale){
  var origDua=global.normalizeLoadedDuas;
  var wrapDua=function(){var r=origDua.apply(this,arguments);applyDuas();return r};
  wrapDua.__darLocale=true;global.normalizeLoadedDuas=wrapDua;
 }
 if(typeof global.mapAppleTvHadith==="function"&&!global.mapAppleTvHadith.__darLocale){
  var origMap=global.mapAppleTvHadith;
  var wrapMap=function(rec){
   var mapped=origMap.apply(this,arguments);
   if(mapped&&hadithPack&&locale()!=="de"){
    var hit=hadithPack[mapped.id]||hadithPack[rec&&rec.id];
    if(hit&&hit.text){
     mapped.german=hit.text;
     if("germanHtml" in mapped)mapped.germanHtml=hit.text;
     if(hit.narrator)mapped.narrator=hit.narrator;
     if(hit.speaker)mapped.speakerLabel=hit.speaker;
     if(hit.sharh)mapped.sharhText=hit.sharh;
     mapped.localeReview="machine-translation-owner-approved";
    }
   }
   return mapped;
  };
  wrapMap.__darLocale=true;global.mapAppleTvHadith=wrapMap;
 }
}
function setLocale(code){
 if(LOCALES.indexOf(code)<0)return false;
 try{global.localStorage.setItem(KEY,code)}catch(_){}
 global.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));
 loadPacks().then(function(){applyContent(true);schedule()});
 return true;
}
function loadJson(url){
 return global.fetch(url,{cache:"no-store",credentials:"same-origin"}).then(function(r){
  if(!r.ok)throw Error(url);
  return r.json();
 });
}
var packToken=0;
function loadPacks(){
 var code=locale();
 var token=++packToken;
 if(code==="de"){catalog=new Map();content={posts:{},duas:{},quiz:{},learning:{}};hadithPack={};quotes=[];return Promise.resolve()}
 var uiP=loadJson("/assets/i18n/catalog/"+code+".json").then(function(data){
  if(token!==packToken)return;
  catalog=new Map();
  var entries=data&&data.entries||{};
  Object.keys(entries).forEach(function(de){
   var to=entries[de];
   if(typeof de==="string"&&typeof to==="string"&&de.length>=2&&de.length<=240&&to.length<=500)catalog.set(de,to);
  });
 }).catch(function(){catalog=new Map()});
 var contentP=loadJson("/assets/i18n/content/"+code+".json").then(function(data){
  if(token!==packToken)return;
  content=data||{};
  quotes=[];
  var q=data&&data.qQuotes||{};
  Object.keys(q).forEach(function(de){if(q[de])quotes.push({de:norm(de),to:q[de]})});
  quotes.sort(function(a,b){return b.de.length-a.de.length});
 }).catch(function(){content={posts:{},duas:{},quiz:{}}});
 var hadithP=loadJson("/assets/i18n/content/hadith-"+code+".json").then(function(data){
  if(token!==packToken)return;
  hadithPack=data&&data.items||{};
 }).catch(function(){hadithPack={}});
 return Promise.all([uiP,contentP,hadithP]);
}
function mountSettingsChooser(){
 if(TEST||!global.document.querySelector)return;
 var home=global.document.querySelector("#appView .dsh-shell.dsh-home,#appView .settings-one-page");
 if(!home||home.querySelector("#darAdultLanguageControl"))return;
 var root=global.document.createElement("section");
 root.id="darAdultLanguageControl";
 root.className="dal-entry dal-entry-settings";
 root.setAttribute("data-dar-language-entry","settings");
 root.setAttribute("data-dar-no-translate","picker");
 var after=home.querySelector(".dsh-welcome");
 if(after)after.insertAdjacentElement("afterend",root);
 else home.insertBefore(root,home.firstChild);
}
function boot(){
 if(!global.DARAdultLanguagePickerV1&&!global.__DAR_LANGUAGE_PICKER_LOADING&&global.document.head){
  global.__DAR_LANGUAGE_PICKER_LOADING=true;
  var script=global.document.createElement("script");
  script.src="/assets/i18n/adult-language-picker-v1.js?v=20261125-nine1";
  script.async=true;
  script.onerror=function(){global.__DAR_LANGUAGE_PICKER_LOADING=false};
  global.document.head.appendChild(script);
 }
 hook();
 loadPacks().then(function(){applyContent(true);schedule()});
 if(!TEST&&global.MutationObserver&&global.document.body){
  new MutationObserver(function(){schedule()}).observe(global.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
 }
 var tries=0;
 var timer=setInterval(function(){hook();if(++tries>20)clearInterval(timer)},500);
 schedule();
}
global.addEventListener("dar-adult-locale-changed",function(){loadPacks().then(function(){applyContent(true);schedule()})});
global.addEventListener("storage",function(e){if(e.key===KEY)loadPacks().then(function(){applyContent(true);schedule()})});
global.document.addEventListener("dar:view-rendered",function(){applyContent(false);schedule()});
global.document.addEventListener("click",function(e){
 var b=e.target&&e.target.closest&&e.target.closest("[data-dar-adult-locale]");
 if(b){e.preventDefault();setLocale(b.getAttribute("data-dar-adult-locale"))}
},true);
global.DARAdultUI18n={
 load:loadPacks,apply:function(){applyContent(false);return applyUi()},setLocale:setLocale,locale:locale,
 translate:translate,locales:LOCALES.slice(),
 get catalogStatus(){return catalog.size?"loaded":"empty"},
 get translatedKeys(){return catalog.size},
 scope:"adult-visitor-website-pwa-wkwebview",
 review:"machine-translation-owner-approved"
};
if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})(window);
