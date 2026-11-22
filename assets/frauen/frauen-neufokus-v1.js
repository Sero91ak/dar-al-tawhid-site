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
var enabled=false,until=0,started=0,pending=null,lastFetch=0,scheduled=false,expiryTimer=null;
var readyIndex=null,indexOverlay=null,indexOpener=null;
function scheduleExactExpiry(){
 if(expiryTimer!==null){w.clearTimeout(expiryTimer);expiryTimer=null}
 if(!enabled||!until)return;
 var delay=until-Date.now();
 if(delay<=0){enabled=false;render();return}
 expiryTimer=w.setTimeout(function(){
  expiryTimer=null;
  if(!enabled)return;
  // Timers can fire slightly early; never prematurely hide or extend the window.
  if(Date.now()<until){scheduleExactExpiry();return}
  enabled=false;render();
 },Math.min(Math.ceil(delay),2147483647));
}
function locale(){
 var s="de";try{s=w.localStorage.getItem(KEY)||"de"}catch(_){}
 s=String(s).trim().toLowerCase().replace(/_/g,"-");
 if(s==="ku-sorani")s="ckb";
 if(!I18N[s])s=s.split("-")[0];
 return I18N[s]?s:"de";
}
// The time-limited homepage announcement is editorial/global, not a
// personalized woman-only recommendation. Profile-specific women suggestions
// elsewhere in the app remain unchanged.
// Keep the 16-entry release inside the existing visitor app. This list is
// never populated from unrelated profile recommendations or old Frauen posts.
function closeIndex(restoreFocus){
 if(!indexOverlay)return;
 indexOverlay.remove();indexOverlay=null;
 if(restoreFocus!==false&&indexOpener&&typeof indexOpener.focus==="function")
   try{indexOpener.focus({preventScroll:true})}catch(_){}
 indexOpener=null;
}
function showIndex(opener){
 if(!enabled||Date.now()<started||Date.now()>=until||!readyIndex||!d.body)return;
 if(indexOverlay){var existing=indexOverlay.querySelector(".dar-frauen-index-close");if(existing?.focus)existing.focus();return}
 var code=locale(),t=I18N[code],rtl=code==="ar"||code==="ckb";
 var overlay=d.createElement("div");overlay.id="darFrauenNeufokusIndex";
 overlay.className="dar-frauen-index-backdrop";
 var dialog=d.createElement("section");dialog.className="dar-frauen-index-dialog";
 dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
 dialog.setAttribute("aria-labelledby","darFrauenNeufokusIndexTitle");
 dialog.lang=code;dialog.dir=rtl?"rtl":"ltr";
 var head=d.createElement("header");head.className="dar-frauen-index-head";
 var eyebrow=d.createElement("span");eyebrow.className="dar-frauen-index-eyebrow";eyebrow.textContent=t.eyebrow;
 var title=d.createElement("h2");title.id="darFrauenNeufokusIndexTitle";title.textContent=t.title;
 var subtitle=d.createElement("p");subtitle.className="dar-frauen-index-subtitle";subtitle.textContent=t.body;
 var info=d.createElement("span");info.className="dar-frauen-index-meta";info.textContent=t.meta;
 var close=d.createElement("button");close.type="button";close.className="dar-frauen-index-close";
 close.textContent="×";close.setAttribute("aria-label",({de:"Schließen",ar:"إغلاق",en:"Close",tr:"Kapat",ku:"Bigire",ckb:"داخستن",bs:"Zatvori",fr:"Fermer",es:"Cerrar"})[code]);
 close.addEventListener("click",function(){closeIndex(true)});
 head.appendChild(eyebrow);head.appendChild(title);head.appendChild(subtitle);head.appendChild(info);head.appendChild(close);
 var list=d.createElement("ol");list.className="dar-frauen-index-list";
 readyIndex.manifest.items.forEach(function(row,i){
  var entry=readyIndex.catalog.entries[row.id],pack=entry&&entry.locales&&entry.locales[code];
  if(!pack)return;
  var li=d.createElement("li");li.className="dar-frauen-index-item";
  var link=d.createElement("a");link.className="dar-frauen-index-link";
  // Q-style standalone reader is canonical for contributions without Q IDs,
  // identical on native iOS/Android, DAR TEST, PWA and public website.
  // Do not mint Q numbers, clone articles or link to an unlocalized shell.
  var origin=/^\/test(?:\/|$)/.test(w.location.pathname)?"test":
    /^\/pwa(?:\/|$)/.test(w.location.pathname)?"pwa":"";
  var target="/wissen/beitrag/?id="+encodeURIComponent(row.id)+"&lang="+encodeURIComponent(code)+
    (origin?"&from="+origin:"");
  link.href=target;
  var number=d.createElement("span");number.className="dar-frauen-index-number";number.textContent=String(i+1).padStart(2,"0");
  var body=d.createElement("span");body.className="dar-frauen-index-item-body";
  var area=d.createElement("span");area.className="dar-frauen-index-area";area.textContent=pack.labels?.area||row.area;
  var caption=d.createElement("strong");caption.className="dar-frauen-index-title";caption.textContent=pack.title;
  var preview=d.createElement("span");preview.className="dar-frauen-index-preview";preview.textContent=pack.preview;
  var arrow=d.createElement("span");arrow.className="dar-frauen-index-arrow";arrow.textContent=rtl?"‹":"›";arrow.setAttribute("aria-hidden","true");
  body.appendChild(area);body.appendChild(caption);body.appendChild(preview);
  link.appendChild(number);link.appendChild(body);link.appendChild(arrow);
  link.addEventListener("click",function(){
   closeIndex(false); // Normal same-origin navigation to the article reader.
  });
  li.appendChild(link);list.appendChild(li);
 });
 if(list.children.length!==16)return;
 dialog.appendChild(head);dialog.appendChild(list);overlay.appendChild(dialog);
 overlay.addEventListener("click",function(event){if(event.target===overlay)closeIndex(true)});
 dialog.addEventListener("keydown",function(event){
  if(event.key==="Escape"){event.preventDefault();closeIndex(true);return}
  if(event.key!=="Tab")return;
  var controls=Array.from(dialog.querySelectorAll("button:not([disabled]),a[href]"));
  if(!controls.length)return;
  var first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&d.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&d.activeElement===last){event.preventDefault();first.focus()}
 });
 indexOverlay=overlay;indexOpener=opener;d.body.appendChild(overlay);
 if(typeof close.focus==="function")close.focus({preventScroll:true});
}
function isNativeHome(){
 var hash=String(w.location.hash||"").replace(/^#\/?/,"").split(/[/?]/)[0].toLowerCase();
 return hash==="home"||hash==="start"||(!hash&&!!d.body?.classList.contains("is-home-route"));
}
function visibleHost(node){
 if(!node||node.isConnected===false)return false;
 // Tiny DOM test fixtures and old engines may not implement layout APIs.
 if(typeof node.getBoundingClientRect!=="function"||typeof w.getComputedStyle!=="function")return true;
 try{
  var rect=node.getBoundingClientRect(),css=w.getComputedStyle(node);
  return rect.width>0&&rect.height>0&&css.display!=="none"&&css.visibility!=="hidden";
 }catch(_){return false}
}
function homeMount(){
 // Four real home surfaces: active parity frontstage, legacy V3, V380,
 // and public V8. The live parity frontstage is OUTSIDE #appView.
 // It must be preferred to the hidden V3/V380 legacy nodes.
 var parity=d.getElementById("darHomeHtmlParityV1");
 if(isNativeHome()&&parity&&visibleHost(parity)){
  var parityContent=parity.querySelector(".dhp-content");
  return{root:visibleHost(parityContent)?parityContent:parity,desktop:false,fallback:false,parity:true};
 }
 var nativeHome=d.getElementById("dv3Home");
 if(nativeHome&&isNativeHome()&&visibleHost(nativeHome))
  return{root:nativeHome,desktop:false,fallback:false};
 var website=d.getElementById("pageRoot");
 var page="start";
 try{page=new URLSearchParams(w.location.search).get("page")||"start"}catch(_){}
 if(website&&page.toLowerCase()==="start"&&website.children.length)
  return{root:website,desktop:true,fallback:false};
 if(isNativeHome()){
  var app=d.getElementById("appView");
  if(app){
   var candidates=app.querySelectorAll(".home-v380-shell,.dv3-home,.home-v3");
   for(var i=0;i<candidates.length;i++){
    if(visibleHost(candidates[i]))return{root:candidates[i],desktop:false,fallback:true};
   }
   if(visibleHost(app))return{root:app,desktop:false,fallback:true};
  }
 }
 return null;
}
function render(){
 var home=homeMount(),root=home&&home.root,old=d.getElementById("darFrauenNeufokus48h");
 var now=Date.now();
 if(!root||!enabled||now<started||now>=until){
   closeIndex(false);if(old)old.remove();return;
 }
 var t=I18N[locale()],rtl=locale()==="ar"||locale()==="ckb";
 var button=old;
 if(!button){
  button=d.createElement("button");button.id="darFrauenNeufokus48h";
  button.className="dar-frauen-neufokus"+(home.desktop?" dar-frauen-neufokus-desktop":" dar-frauen-neufokus-native");
  button.type="button";
  button.setAttribute("aria-haspopup","dialog");
  button.setAttribute("aria-controls","darFrauenNeufokusIndex");
  // Visible near the top on ALL native shells, not below long home sections.
  var anchor=home.desktop
   ?root.querySelector(".page-intro,.dar-v8-quick,.home-foundations")
   :home.parity
   ?root.querySelector(".dhp-search-box,.dhp-welcome,.dhp-quran-section")
   :root.querySelector(".dv3-hometitle,.dv3-search-box,.home-v380-hero,.home-title,.home-search,.dv3-tawhid");
  if(anchor&&anchor.insertAdjacentElement)anchor.insertAdjacentElement("afterend",button);
  else root.insertBefore(button,root.firstChild);
  button.addEventListener("click",function(){
   if(!enabled||Date.now()>=until)return;
   showIndex(button);
  });
 }
 // A legacy #dv3Home can be present but display:none. If a card was
 // previously mounted there, move the SAME node into the visible V380 root.
 if(button.parentElement!==root){
  var anchor=home.desktop
   ?root.querySelector(".page-intro,.dar-v8-quick,.home-foundations")
   :home.parity
   ?root.querySelector(".dhp-search-box,.dhp-welcome,.dhp-quran-section")
   :root.querySelector(".dv3-hometitle,.dv3-search-box,.home-v380-hero,.home-title,.home-search,.dv3-tawhid");
  if(anchor&&anchor.parentElement===root&&anchor.insertAdjacentElement)
   anchor.insertAdjacentElement("afterend",button);
  else root.insertBefore(button,root.firstChild);
 }
 button.lang=locale();button.dir=rtl?"rtl":"ltr";
 button.replaceChildren();
 var head=d.createElement("span");head.className="focus-head";
 var emblem=d.createElement("span");emblem.className="focus-emblem";emblem.setAttribute("aria-hidden","true");
 var icon=d.createElement("img");icon.src="/assets/dar-3d-icons/posts.png?v=1095";icon.alt="";icon.loading="eager";
 emblem.appendChild(icon);
 var kicker=d.createElement("span");kicker.className="focus-eyebrow";kicker.textContent=t.eyebrow;
 var live=d.createElement("span");live.className="focus-live";live.textContent="LIVE";live.setAttribute("aria-hidden","true");
 head.appendChild(emblem);head.appendChild(kicker);head.appendChild(live);
 var center=d.createElement("span");center.className="focus-center";
 var textGroup=d.createElement("span");textGroup.className="focus-copy";
 var title=d.createElement("strong");title.className="focus-title";title.textContent=t.title;
 var body=d.createElement("span");body.className="focus-body";body.textContent=t.body;
 textGroup.appendChild(title);textGroup.appendChild(body);
 var count=d.createElement("span");count.className="focus-count";count.setAttribute("aria-hidden","true");
 var number=d.createElement("strong");number.textContent="16";
 var small=d.createElement("small");small.textContent="NEU";
 count.appendChild(number);count.appendChild(small);
 center.appendChild(textGroup);center.appendChild(count);
 var footer=d.createElement("span");footer.className="focus-footer";
 var meta=d.createElement("span");meta.className="focus-meta";meta.textContent=t.meta;
 var action=d.createElement("span");action.className="focus-action";action.textContent=t.cta+"  ›";
 footer.appendChild(meta);footer.appendChild(action);
 button.appendChild(head);button.appendChild(center);button.appendChild(footer);
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
// Limit both the network request and response-body decoding. A stalled fetch
// must not keep the shared pending promise permanently locked.
async function fetchReady(path,format){
 var controller=typeof w.AbortController==="function"?new w.AbortController():null;
 var timer=null;
 var deadline=new Promise(function(_,reject){
  timer=w.setTimeout(function(){
   if(controller)controller.abort();
   reject(Error("Neufokus request timeout"));
  },10000);
 });
 try{
  var request=(async function(){
   var options={cache:"no-store",credentials:"same-origin"};
   if(controller)options.signal=controller.signal;
   var response=await w.fetch(path,options);
   if(!response.ok)throw Error("Neufokus HTTP "+response.status);
   return format==="text"?response.text():response.json();
  })();
  return await Promise.race([request,deadline]);
 }finally{
  if(timer!==null)w.clearTimeout(timer);
 }
}
function json(path){
 return fetchReady(path+(path.indexOf("?")<0?"?":"&")+"cache="+Date.now(),"json");
}
async function verifyPublished(){
 readyIndex=null;
 var manifest=await json("/assets/frauen/frauen-neufokus-v1.json");
 if(manifest.expectedCount!==16||manifest.items?.length!==16||manifest.focusId!==ID)return false;
 if(new Set(manifest.items.map(function(x){return x&&x.id})).size!==16)return false;
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
 // Public readiness requires all nine real language texts to be deployed, not
 // just the German originals. If the app still serves an old catalog, the
 // 48h card stays hidden even if the Admin feed was prematurely activated.
 var localeCatalog=await json("/assets/frauen/frauen-entry-locales-v1.json");
 var codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
 if(!Array.isArray(localeCatalog.entryIds)||!localeCatalog.entries)return false;
 for(var n=0;n<manifest.items.length;n++){
   var item=manifest.items[n],p=localeCatalog.entries[item.id];
   if(!localeCatalog.entryIds.includes(item.id)||!p||p.id!==item.id||
      p.area!==item.area||p.sourceUrl!==item.sourceUrl)return false;
   for(var z=0;z<codes.length;z++){
     var code=codes[z],pack=p.locales&&p.locales[code];
     if(!pack||!["title","statement","preview","lesson","sharh","source"].every(function(k){
       return typeof pack[k]==="string"&&pack[k].trim().length>=5;
     })||pack.dir!==((code==="ar"||code==="ckb")?"rtl":"ltr"))return false;
   }
 }
 // The actual interactive learning destination must exist in the deployed
 // environment. Do not promote a 16-card focus that opens a missing lesson.
 var lessonHtml=await fetchReady("/lernen/frauen-wissen/?neufokus=1","text");
 if(lessonHtml.indexOf('id="quiz"')<0||
    lessonHtml.indexOf("frauen-learning-v1.js")<0)return false;
 // Reuse approved content and all translations inside the existing app reader.
 var readerRegistry=await json("/assets/beitrag/reader-catalogs-v1.json");
 if(!readerRegistry.catalogs?.frauen||readerRegistry.catalogs.frauen.localeCatalogUrl!=="/assets/frauen/frauen-entry-locales-v1.json")return false;
 readyIndex={manifest:manifest,catalog:localeCatalog,registry:readerRegistry,sources:Object.fromEntries(paths.map(function(path,i){return ["/"+path,all[i]]}))};
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
   if(!window){enabled=false;started=0;until=0;readyIndex=null;return}
   var ready=await verifyPublished();
   enabled=ready;started=ready?window.start:0;until=ready?window.end:0;
  }catch(_){enabled=false;started=0;until=0;readyIndex=null}
 })().finally(function(){pending=null;scheduleExactExpiry();render()});
 return pending;
}
function schedule(force){
 if(scheduled)return;
 scheduled=true;
 (w.requestAnimationFrame||function(fn){Promise.resolve().then(fn)})(function(){scheduled=false;render();refresh(Boolean(force))});
}
function observe(){
 ["appView","pageRoot","darHomeHtmlParityV1"].forEach(function(id){
  var root=d.getElementById(id);
  if(root&&!root.__darFrauenFocusObserved&&typeof w.MutationObserver==="function"){
   root.__darFrauenFocusObserved=true;
   new w.MutationObserver(function(changes){
    if(changes.some(function(c){
     if(c.type!=="childList")return false;
     var t=c.target;
     if(t&&typeof t.closest==="function"&&t.closest("#darFrauenNeufokus48h,#darFrauenNeufokusIndex"))return false;
     return true;
    }))schedule(false);
   }).observe(root,{childList:true,subtree:true});
  }
 });
}
function init(){
 if(d.getElementById("darFrauenNeufokus48hStyle")===null){
  var sheet=d.createElement("link");sheet.id="darFrauenNeufokus48hStyle";sheet.rel="stylesheet";
  sheet.href="/assets/frauen/frauen-neufokus-v1.css?v=20261122-android-native-v4";d.head.appendChild(sheet);
 }
 observe();schedule(true);
 d.addEventListener("dar:view-rendered",function(){observe();schedule(false)});
 d.addEventListener("dar:visitor-profile-changed",function(){render()});
 w.addEventListener("hashchange",function(){closeIndex(false);schedule(false)});
 w.addEventListener("popstate",function(){closeIndex(false);schedule(true)});
 w.addEventListener("pageshow",function(){schedule(true)});
 w.addEventListener("dar-adult-locale-changed",function(){render()});
 w.addEventListener("dar-adult-ui-languages-ready",function(){render()});
 d.addEventListener("visibilitychange",function(){if(!d.hidden)schedule(true)});
 w.setInterval(function(){render();refresh(false)},60000);
}
w.DARFrauenNeufokusV1=Object.freeze({validWindow:validWindow,locale:locale,refresh:function(){return refresh(true)},closeIndex:closeIndex,openIndex:function(){showIndex(d.getElementById("darFrauenNeufokus48h"))},getReaderData:function(id){return readyIndex&&readyIndex.manifest.items.some(function(item){return item.id===id})?readyIndex:null},diagnostics:function(){var h=homeMount(),card=d.getElementById("darFrauenNeufokus48h");return{home:h?.desktop?"website":h?.parity?"native-frontstage":h?.fallback?"native-fallback":h?"native":"none",host:h?.root?.id||h?.root?.className||"",enabled:enabled,indexReady:!!readyIndex,started:started,expires:until,cardPresent:!!card,visible:visibleHost(card)}}});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
