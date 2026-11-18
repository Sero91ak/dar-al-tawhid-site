/* DĀR AL TAWḤĪD · FRAUEN NEUFOKUS 48H · v1
 * Real visitor home V3 uses a hidden legacy focusFeedMount. Render a single
 * scoped card inside #dv3Home only after 16 canonical reports are genuinely
 * live and the DĀR Admin 48-hour feed slot has been activated.
 * NO push notification and NO modification of frozen home/frauen renderers.
 */
(function(w,d){
"use strict";
if(w.__DAR_FRAUEN_NEUFOKUS_V1)return;
w.__DAR_FRAUEN_NEUFOKUS_V1=true;
var ID="neufokus-frauenwissen-16-20261118",HOURS48=48*60*60*1000;
var KEY="darAdultPreferredLocaleV1";
var I18N={
de:{eyebrow:"NEUFOKUS · 48 STUNDEN",title:"16 neue Frauenbeiträge",body:"Ṣaḥābiyyāt, Mütter der Gläubigen und Frauenfiqh – vollständig lesen, Quellen prüfen und Wissen vertiefen.",cta:"Jetzt Beiträge lesen",meta:"16 Beiträge · 9 Sprachen · Lernbereich"},
ar:{eyebrow:"تركيز جديد · ٤٨ ساعة",title:"١٦ موضوعًا جديدًا عن النساء",body:"الصحابيات وأمهات المؤمنين وفقه النساء: اقرأ الروايات وراجع المصادر وتعلّم.",cta:"قراءة الموضوعات الآن",meta:"١٦ موضوعًا · ٩ لغات · قسم التعلّم"},
en:{eyebrow:"NEW FOCUS · 48 HOURS",title:"16 new articles on women",body:"Female Companions, Mothers of the Believers and women's fiqh. Read the reports, verify the sources and learn.",cta:"Explore the articles",meta:"16 articles · 9 languages · learning"},
tr:{eyebrow:"YENİ ODAK · 48 SAAT",title:"Kadınlara dair 16 yeni içerik",body:"Sahâbî hanımlar, Müminlerin Anneleri ve kadın fıkhı. Rivayetleri okuyun, kaynakları inceleyin ve öğrenin.",cta:"İçerikleri oku",meta:"16 içerik · 9 dil · öğrenme"},
ku:{eyebrow:"BALDARÎYA NÛ · 48 SAET",title:"16 nivîsên nû li ser jinan",body:"Jinên sahabe, dayikên bawermendan û fiqha jinan. Rivayetan bixwîne, çavkaniyan kontrol bike û fêr bibe.",cta:"Nivîsan bixwîne",meta:"16 nivîs · 9 ziman · fêrbûn"},
ckb:{eyebrow:"سەرنجی نوێ · ٤٨ کاتژمێر",title:"١٦ بابەتی نوێ دەربارەی ژنان",body:"ژنە هاوەڵان، دایکانی باوەڕداران و فیقهی ژنان. ڕیوایەتەکان بخوێنەرەوە و سەرچاوەکان بپشکنە.",cta:"خوێندنەوەی بابەتەکان",meta:"١٦ بابەت · ٩ زمان · فێربوون"},
bs:{eyebrow:"NOVI FOKUS · 48 SATI",title:"16 novih objava o ženama",body:"Ashabijke, majke vjernika i fikh za žene. Pročitaj predaje, provjeri izvore i produbi znanje.",cta:"Čitaj nove objave",meta:"16 objava · 9 jezika · učenje"},
fr:{eyebrow:"NOUVEAU FOCUS · 48 HEURES",title:"16 nouveaux articles sur les femmes",body:"Les Compagnes, les Mères des croyants et le droit musulman concernant les femmes. Lire, vérifier les sources et apprendre.",cta:"Lire les articles",meta:"16 articles · 9 langues · apprentissage"},
es:{eyebrow:"NUEVO FOCO · 48 HORAS",title:"16 artículos nuevos sobre las mujeres",body:"Las Compañeras, las Madres de los Creyentes y el fiqh de la mujer. Lee los relatos, consulta las fuentes y aprende.",cta:"Leer los artículos",meta:"16 artículos · 9 idiomas · aprendizaje"}
};
var enabled=false,until=0,started=0,pending=null,lastFetch=0,scheduled=false;
function locale(){
 var s="de";try{s=w.localStorage.getItem(KEY)||"de"}catch(_){}
 s=String(s).trim().toLowerCase().replace(/_/g,"-");
 if(s==="ku-sorani")s="ckb";
 if(!I18N[s])s=s.split("-")[0];
 return I18N[s]?s:"de";
}
function render(){
 var root=d.getElementById("dv3Home"),old=d.getElementById("darFrauenNeufokus48h");
 var now=Date.now();
 if(!root||!enabled||now<started||now>=until){
   if(old)old.remove();return;
 }
 var t=I18N[locale()],rtl=locale()==="ar"||locale()==="ckb";
 var button=old;
 if(!button){
  button=d.createElement("button");button.id="darFrauenNeufokus48h";
  button.className="dar-frauen-neufokus";
  button.type="button";
  var anchor=root.querySelector(".dv3-tawhid");
  if(anchor&&anchor.insertAdjacentElement)anchor.insertAdjacentElement("afterend",button);
  else root.appendChild(button);
  button.addEventListener("click",function(){
   if(!enabled||Date.now()>=until)return;
   try{if(typeof w.navigate==="function"){w.navigate("frauen");return}}catch(_){}
   w.location.hash="#frauen";
  });
 }
 button.lang=locale();button.dir=rtl?"rtl":"ltr";
 button.replaceChildren();
 [["span","focus-eyebrow",t.eyebrow],["strong","focus-title",t.title],["span","focus-body",t.body],["span","focus-meta",t.meta],["span","focus-action",t.cta+"  ›"]].forEach(function(a){
  var el=d.createElement(a[0]);el.className=a[1];el.textContent=a[2];button.appendChild(el);
 });
 button.setAttribute("aria-label",t.title+" – "+t.cta);
}
function validWindow(feed){
 var item=(feed&&Array.isArray(feed.items)?feed.items:[]).find(function(x){return x&&x.id===ID});
 if(!item||item.status!=="live"||item.visibility!=="48h"||item.targetUrl!=="frauen"||item.targetId!=="frauen")return null;
 var s=Date.parse(item.startsAt||""),e=Date.parse(item.expiresAt||"");
 if(!Number.isFinite(s)||!Number.isFinite(e)||Math.abs(e-s-HOURS48)>1000)return null;
 if(Date.now()<s||Date.now()>=e)return null;
 return{start:s,end:e};
}
async function json(path){
 var response=await w.fetch(path+(path.indexOf("?")<0?"?":"&")+"cache="+Date.now(),{cache:"no-store",credentials:"same-origin"});
 if(!response.ok)throw Error("Neufokus HTTP "+response.status);return response.json();
}
async function verifyPublished(){
 var manifest=await json("/assets/frauen/frauen-neufokus-v1.json");
 if(manifest.expectedCount!==16||manifest.items?.length!==16||manifest.focusId!==ID)return false;
 var groups={};for(var i=0;i<manifest.items.length;i++){
   var row=manifest.items[i];if(!row||!row.id||!row.sourceFile)return false;
   (groups[row.sourceFile]||(groups[row.sourceFile]=[])).push(row);
 }
 var paths=Object.keys(groups);
 if(paths.length!==3||paths.some(function(x){return !/^data\/frauen-[a-z0-9-]+\.json$/.test(x)}))return false;
 var all=await Promise.all(paths.map(function(x){return json("/"+x)}));
 for(var k=0;k<paths.length;k++){
   var entries=all[k]&&all[k].eintraege||[];
   for(var j=0;j<groups[paths[k]].length;j++){
     var r=groups[paths[k]][j],list=entries.filter(function(e){return e.kennung===r.id});
     if(list.length!==1||list[0].quellenstatus!=="geprueft"||list[0].freigabeDurchSerhat!==true||
       list[0].quellePrimaerId!==r.sourceId||list[0].direktnachweisUrl!==r.sourceUrl)return false;
   }
 }
 return true;
}
async function refresh(force){
 if(pending)return pending;
 var now=Date.now();
 if(!force&&now-lastFetch<60000){render();return}
 lastFetch=now;
 pending=(async function(){
  try{
   var isTest=/^\/test(?:\/|$)/.test(w.location.pathname);
   var feed=await json(isTest?"/content/staging/focus-feed/feed-index.json":"/content/focus-feed/feed-index.json");
   var window=validWindow(feed);
   if(!window){enabled=false;started=0;until=0;return}
   var ready=await verifyPublished();
   enabled=ready;started=ready?window.start:0;until=ready?window.end:0;
  }catch(_){enabled=false;started=0;until=0}
 })().finally(function(){pending=null;render()});
 return pending;
}
function schedule(force){
 if(scheduled)return;
 scheduled=true;
 (w.requestAnimationFrame||function(fn){Promise.resolve().then(fn)})(function(){scheduled=false;render();refresh(Boolean(force))});
}
function observe(){
 var root=d.getElementById("appView");
 if(root&&!root.__darFrauenFocusObserved&&typeof w.MutationObserver==="function"){
  root.__darFrauenFocusObserved=true;
  new w.MutationObserver(function(changes){
   if(changes.some(function(c){return c.type==="childList"}))schedule(false);
  }).observe(root,{childList:true});
 }
}
function init(){
 if(d.getElementById("darFrauenNeufokus48hStyle")===null){
  var sheet=d.createElement("link");sheet.id="darFrauenNeufokus48hStyle";sheet.rel="stylesheet";
  sheet.href="/assets/frauen/frauen-neufokus-v1.css?v=20261118-1";d.head.appendChild(sheet);
 }
 observe();schedule(true);
 d.addEventListener("dar:view-rendered",function(){observe();schedule(false)});
 w.addEventListener("hashchange",function(){schedule(false)});
 w.addEventListener("pageshow",function(){schedule(true)});
 w.addEventListener("dar-adult-locale-changed",function(){render()});
 w.addEventListener("dar-adult-ui-languages-ready",function(){render()});
 d.addEventListener("visibilitychange",function(){if(!d.hidden)schedule(true)});
 w.setInterval(function(){render();refresh(false)},60000);
}
w.DARFrauenNeufokusV1=Object.freeze({validWindow:validWindow,locale:locale,refresh:function(){return refresh(true)}});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
