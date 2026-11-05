/* DĀR AL TAWḤĪD · Q51 canonical post nine-language display.
   The already-published German post keeps its ID, Q51 reference and links.
   The active app language (not the OS language) selects every post field.
   Does not create/re-send any device notification. */
(function(w,d){
"use strict";
if(w.__darQ51PostLanguageV1)return;w.__darQ51PostLanguageV1=true;
var ID="qatadah-tawhid-schoepfer-anbetung-20261105-q51";
var URI="/assets/q51-locales.json?v=20261105-q51-nine-complete-v1";
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var manifest=null,loaded=false,scheduled=false,forceRender=false;
var originals=new WeakMap(),applied=new WeakMap();
var fallbackNotices={
ar:"الترجمة قيد المراجعة اللغوية والعلمية",en:"Translation pending editorial review",
tr:"Çeviri, dil ve ilmî inceleme aşamasındadır",
ku:"Werger di nirxandina edîtorî de ye",ckb:"وەرگێڕانەکە لە پشکنینی دەستکاریکردندا دەبێت",
bs:"Prijevod čeka stručnu provjeru",fr:"Traduction en attente de relecture",es:"Traducción pendiente de revisión",de:""};
function norm(code){code=String(code||"").toLowerCase().replace(/_/g,"-");return CODES.indexOf(code)>=0?code:"de"}
function selected(){
  try{return norm(w.localStorage.getItem("darAdultPreferredLocaleV1"))}catch(_){return"de"}
}
function isPostRoute(){
  try{
    if(typeof currentRoute!=="undefined"&&currentRoute?.view==="post"&&String(currentRoute.value)===ID)return true;
    if(w.currentRoute?.view==="post"&&String(w.currentRoute.value)===ID)return true;
  }catch(_){}
  return w.location.hash.indexOf(ID)>=0||new URL(w.location.href).searchParams.get("post")===ID;
}
function collection(){try{return typeof posts!=="undefined"&&Array.isArray(posts)?posts:null}catch(_){return null}}
var FIELDS=["title","statement","quote","scholar","speaker","source","category","topic","summary","fazit","conclusion"];
function applyPost(){
  if(!manifest||manifest.contentId!=="post:"+ID)return false;
  var list=collection();if(!list)return false;
  var p=list.find(function(x){return x&&String(x.id)===ID});if(!p)return false;
  var code=selected(),loc=manifest.locales[code];
  if(!loc||!loc.post||loc.post.id!==ID||loc.post.contentId!=="post:"+ID||loc.post.qSourceId!=="qsource:51")return false;
  if(applied.get(p)===code)return false;
  var raw=originals.get(p);
  if(!raw){raw={};FIELDS.forEach(function(k){raw[k]={present:Object.prototype.hasOwnProperty.call(p,k),value:p[k]}});originals.set(p,raw)}
  FIELDS.forEach(function(k){if(raw[k].present)p[k]=raw[k].value;else delete p[k]});
  if(code!=="de"){
    var x=loc.post;
    // The owner-authorized translated statement, source and Fazit are selected
    // as a unit from ONE canonical content ID. Never change original Arabic or links.
    p.title=x.title;p.statement=x.statement;p.quote=x.statement;
    p.scholar=x.speaker;p.speaker=x.speaker;
    p.source=x.source;p.category=x.category;p.topic=x.topic;
    p.summary=x.summary;p.fazit=x.conclusion;p.conclusion=x.conclusion;
  }
  applied.set(p,code);
  return true;
}
function label(el,value){
  if(el&&el.textContent!==value){el.textContent=value;return true}
  return false;
}
function postLabels(){
  if(!manifest||!isPostRoute())return;
  var article=d.querySelector("article.post-reader");if(!article)return;
  var code=selected(),l=manifest.locales[code];
  if(!l||!l.post)return;
  var ui=l.post.ui||{};
  article.setAttribute("lang",code);
  article.setAttribute("dir",code==="ar"||code==="ckb"?"rtl":"ltr");
  label(article.querySelector(".post-reader-title .kicker"),ui.post||"Beitrag");
  label(article.querySelector(".post-aussage-kicker"),ui.statement||"Aussage");
  label(article.querySelector(".post-reader-cite b"),ui.source||"Quelle");
  label(article.querySelector(".post-key-message h3"),ui.conclusion||"Fazit");
  label(article.querySelector(".post-reader-speaker__label"),ui.reportedFrom||"Überliefert von");
  // These men were early scholars, not Companions. Remove the older generic
  // companion honorific from this post only; keep names and attributions intact.
  var mistaken=article.querySelector(".post-reader-speaker .honorific");
  if(mistaken)mistaken.remove();
  var notice=article.querySelector(".dar-q51-language-note");
  if(code!=="de"&&!l.approved){
    if(!notice){
      notice=d.createElement("p");notice.className="dar-q51-language-note";
      notice.setAttribute("role","note");
      var header=article.querySelector(".post-reader-title");
      if(header)header.appendChild(notice);
    }
    label(notice,fallbackNotices[code]||fallbackNotices.en);
  }else if(notice)notice.remove();
}
function rerender(){
  if(!isPostRoute())return;
  if(typeof render!=="function"||!d.getElementById("appView"))return;
  var y=w.scrollY||0;
  try{
    if(w.DARScrollManager?.withScrollPreserved){
      w.DARScrollManager.withScrollPreserved(function(){render()});
    }else{
      render();
      requestAnimationFrame(function(){w.scrollTo({top:y,behavior:"instant"})});
    }
  }catch(error){console.warn("DAR Q51 locale render",error)}
}
function sync(){
  scheduled=false;
  if(!manifest)return;
  var changed=applyPost();
  if(changed){rerender();w.requestAnimationFrame(postLabels)}
  else postLabels();
}
function schedule(){
  if(scheduled)return;scheduled=true;
  w.requestAnimationFrame(sync);
}
function changed(){
  schedule();
  w.setTimeout(schedule,90);
}
function readManifest(){
  return fetch(URI,{cache:"no-store",credentials:"same-origin"}).then(function(res){
    if(!res.ok)throw Error("Q51 post locales HTTP "+res.status);
    return res.json();
  }).then(function(doc){
    if(doc.contentId!=="post:"+ID||doc.qSourceId!=="qsource:51"||!doc.locales)throw Error("Q51 ID mismatch");
    for(var i=0;i<CODES.length;i++){
      var lc=doc.locales[CODES[i]];
      if(!lc||!lc.post||lc.post.id!==ID||lc.post.contentId!=="post:"+ID)throw Error("Incomplete Q51 post translation "+CODES[i]);
    }
    manifest=doc;loaded=true;changed();
  }).catch(function(error){
    loaded=false;console.warn("DAR Q51 post locale fallback: original German",error);
  });
}
var css=d.createElement("style");css.id="darQ51PostLocaleStyleV1";
css.textContent='.post-reader[lang="ar"],.post-reader[lang="ckb"]{text-align:right;direction:rtl}'+
 '.post-reader[lang="ar"] .post-aussage-text,.post-reader[lang="ckb"] .post-aussage-text{line-height:1.9}'+
 '.post-reader .dar-q51-language-note{margin:7px 0 0;opacity:.66;font:500 11px/1.4 system-ui,sans-serif}';
(d.head||d.documentElement).appendChild(css);
function observe(){
  var root=d.getElementById("appView")||d.body;
  if(!root)return;
  var observer=new MutationObserver(function(){schedule()});
  observer.observe(root,{childList:true,subtree:true});
}
d.addEventListener("change",function(e){if(e.target?.matches?.('select,input,[data-language],[data-locale]'))changed()},true);
d.addEventListener("click",function(e){
 if(e.target?.closest?.('[data-language],[data-locale],[data-lang],[data-ui-language]'))changed()
},true);
["storage","popstate","hashchange","pageshow","dar-adult-locale-changed","dar:locale-changed","dar:q51:locale-ready"].forEach(function(ev){w.addEventListener(ev,changed)});
w.DARQ51PostLocale={getLocale:selected,getReady:function(){return loaded},resync:changed,postId:ID};
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
readManifest();
})(window,document);