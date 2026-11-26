/* DĀR AL TAWḤĪD · one adult locale runtime for the visitor site and Android PWA.
 * Nine languages. UI strings and approved content packs. No paid translation API.
 * When a non-de locale is active, visible German is translated or replaced by a
 * notice in that locale. Kids is out of scope.
 * Arabic originals, isnād blocks, source links and data-dar-no-translate="testament" stay untouched.
 * Parity tokens kept for the visitor check: data-canonical-content post-body.
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
 ar:"هذا القسم غير متاح باللغة المختارة.",
 en:"This section is not available in the selected language.",
 tr:"Bu bölüm seçilen dilde yok.",
 ku:"Ev beş bi zimanê hilbijartî tune ye.",
 ckb:"ئەم بەشە بە زمانی هەڵبژێردراو نییە.",
 bs:"Ovaj dio nije dostupan na odabranom jeziku.",
 fr:"Cette partie n’est pas disponible dans la langue choisie.",
 es:"Esta parte no está disponible en el idioma elegido."
};
var QCOUNT={
 ar:function(n,m){return "السؤال "+n+" من "+m},
 en:function(n,m){return "QUESTION "+n+" OF "+m},
 tr:function(n,m){return "SORU "+n+" / "+m},
 ku:function(n,m){return "PIRS "+n+" JI "+m},
 ckb:function(n,m){return "پرسیاری "+n+" لە "+m},
 bs:function(n,m){return "PITANJE "+n+" OD "+m},
 fr:function(n,m){return "QUESTION "+n+" SUR "+m},
 es:function(n,m){return "PREGUNTA "+n+" DE "+m}
};
var RIGHTN={
 ar:function(n){return n+" صحيحة"},
 en:function(n){return n+" correct"},
 tr:function(n){return n+" doğru"},
 ku:function(n){return n+" rast"},
 ckb:function(n){return n+" ڕاست"},
 bs:function(n){return n+" tačno"},
 fr:function(n){return n+" correctes"},
 es:function(n){return n+" correctas"}
};
var QREF={
 ar:function(n){return "المصدر Q"+n},
 en:function(n){return "Source Q"+n},
 tr:function(n){return "Kaynak Q"+n},
 ku:function(n){return "Çavkanî Q"+n},
 ckb:function(n){return "سەرچاوە Q"+n},
 bs:function(n){return "Izvor Q"+n},
 fr:function(n){return "Source Q"+n},
 es:function(n){return "Fuente Q"+n}
};
var catalog=new Map();
var phraseKeys=[];
var GERMAN_STOP=/(^|[^\p{L}\p{N}])(und|oder|nicht|keine|keiner|eine|einer|einem|eines|ist|sind|wird|werden|mit|für|auf|von|der|die|das|den|dem|des|ein|im|zum|zur|vom|beim|auch|nach|bei|aus|wenn|aber|noch|nur|sich|sowie|diese|dieser|dieses|dein|deine|deinen)(?=$|[^\p{L}\p{N}])/giu;
function stopHits(s){GERMAN_STOP.lastIndex=0;return s.match(GERMAN_STOP)}
var content=null;
var hadithPack=null;
var quotes=[];
var fallbackCount=0;
var blocked=[];
var busy=false;
var queued=false;
var originalTexts=new WeakMap();
var originalAttributes=new WeakMap();
var titleSource="";
var deny="script,style,noscript,textarea,pre,code,[contenteditable],[data-dar-no-translate='testament'],"+
 "[data-dar-no-translate='picker'],[class*='quran-arabic'],[class*='ayah-ar'],[class*='arabic-text'],"+
 "[class*='qsource-arabic'],[class*='q49-ar']";
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
 if(el.closest("select,option"))return true;
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
var UI_DE=/(^|[^\p{L}\p{N}])(Standort|Startseite|Vollansicht|Wissenschat|Wissensfinder|Quellenarchiv|Gebetszeiten|Einstellungen|Demnächst|Impressum|Datenschutz|Überlieferung|Rezitation|Fundamente|Aussage|Gelehrten|Installieren|Installationshilfe|Kurzfazit|Originalwortlaut|Einordnung|Fundstellen|richtig|Beiträge|Schließen|Zurück|Weiter|Lernbereich|Frage|Hinweis|Sprecher|Quellen|Teilen|öffnen|Suche|Gebet|Antwort|auswählen|wiederholen|gearbeitet|Verständnis|Anmeldung|Originalquelle|Themen|Gelehrte|Werkzeuge|Sammlungen|Bittgebete|Fachbegriffe|Fundstelle|Nachweis|Überlieferungen|Bewertung|Sprache|Wähle|Waehle|Erscheinungsbild|Willkommen|Veröffentlichung)(?=$|[^\p{L}\p{N}])/iu;
function letterAt(s,i){
 if(i<0||i>=s.length)return false;
 return /\p{L}/u.test(s.charAt(i));
}
function looksGerman(value){
 var s=norm(value);
 if(!s||s.length<3||mostlyArabic(s))return false;
 if(/[şŞğĞçÇı]/.test(s)){
  var early=stopHits(s);
  if(!(early&&early.length>=2)&&!/[äÄß]/.test(s)&&!UI_DE.test(s))return false;
 }
 if(s.indexOf("This section is not available")===0)return false;
 if(s.indexOf("Cette partie")===0||s.indexOf("Esta parte")===0||s.indexOf("Ovaj dio")===0)return false;
 if(s.indexOf("Bu bölüm")===0||s.indexOf("Ev beş")===0)return false;
 if(UI_DE.test(s))return true;
 if(/ß/.test(s)||/[äÄ]/.test(s))return true;
 var hits=stopHits(s);
 if(hits&&hits.length>=2)return true;
 if(hits&&hits.length===1){
  var words=s.split(/[^\p{L}]+/u).filter(Boolean);
  if(words.length===1)return true;
 }
 return false;
}
function residualGerman(value){
 return /(^|[^\p{L}\p{N}])(und|oder|mit|für|von|der|die|das|bei|aus|auf|nach|zum|zur|ist|sind|eine|nicht|keine|ihre|dem|den|ein|im|auch|noch|nur|diese|wird|werden|sowie|beim|vom|freie|Auswahl|Anbetung|Beigesellung|Wissenszentrum|Veröffentlichung|Direktnachweise|Überlieferungsmassstab|Maßstab)(?=$|[^\p{L}\p{N}])/iu.test(String(value||""));
}
function rememberBlocked(source){
 var s=norm(source);
 if(!s||s.length>240)return;
 if(blocked.indexOf(s)>=0)return;
 if(blocked.length<500)blocked.push(s);
}
function applyTemplates(core){
 var code=locale();
 var m=core.match(/^FRAGE\s+(\d+)\s+VON\s+(\d+)$/i);
 if(m&&QCOUNT[code])return QCOUNT[code](m[1],m[2]);
 m=core.match(/^(\d+)\s+richtig$/i);
 if(m&&RIGHTN[code])return RIGHTN[code](m[1]);
 m=core.match(/^Quelle\s+Q(\d+)\s*↗?$/i);
 if(m&&QREF[code])return QREF[code](m[1])+" ↗";
 m=core.match(/^Zur Originalquelle Q(\d+)$/i);
 if(m&&QREF[code])return QREF[code](m[1]);
 m=core.match(/^Originalquelle Q(\d+) lesen\s*↗?$/i);
 if(m&&QREF[code])return QREF[code](m[1])+" ↗";
 return null;
}
function phraseReplace(core){
 if(!phraseKeys.length||core.length<8)return core;
 var out=core;
 for(var i=0;i<phraseKeys.length;i++){
  var key=phraseKeys[i];
  if(key.length<8||key.length>out.length)continue;
  var at=out.indexOf(key);
  if(at<0)continue;
  if(letterAt(out,at-1)||letterAt(out,at+key.length))continue;
  var to=catalog.get(key);
  if(!to)continue;
  out=out.slice(0,at)+to+out.slice(at+key.length);
 }
 return out;
}
function renderSource(source){
 if(locale()==="de")return source;
 var m=String(source).match(/^(\s*)([\s\S]*?)(\s*)$/);
 if(!m)return source;
 var core=m[2];
 if(!core)return source;
 var exact=catalog.get(core);
 if(exact)return m[1]+exact+m[3];
 var templ=applyTemplates(core);
 if(templ)return m[1]+templ+m[3];
 var flat=norm(core);
 for(var qi=0;qi<quotes.length;qi++){
  var pair=quotes[qi];
  if(flat===pair.de)return m[1]+pair.to+m[3];
  if(pair.de.length>40&&flat.indexOf(pair.de)>=0)return m[1]+core.split(pair.de).join(pair.to)+m[3];
 }
 var phrased=phraseReplace(core);
 if(phrased!==core&&!looksGerman(phrased)&&!residualGerman(phrased))return m[1]+phrased+m[3];
 if(looksGerman(core)||looksGerman(phrased)||residualGerman(core)||residualGerman(phrased)){
  rememberBlocked(core);
  return m[1]+(NOTICE[locale()]||NOTICE.en)+m[3];
 }
 return source;
}
function textNode(node){
 var el=node.parentElement;if(!el||excluded(el))return;
 var actual=String(node.nodeValue||"");
 if(mostlyArabic(actual))return;
 var p=originalTexts.get(node);
 if(p&&p.source!==actual&&p.last!==actual){p={source:actual,last:actual};originalTexts.set(node,p)}
 if(!p){p={source:actual,last:actual};originalTexts.set(node,p)}
 var next=renderSource(p.source);
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
  if(!p[a])p[a]={source:current,last:current};
  var next=locale()==="de"?p[a].source:renderSource(p[a].source);
  if(next===p[a].source&&locale()!=="de")continue;
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
 var currentTitle=String(global.document.title||"");
 if(!titleSource)titleSource=currentTitle;
 else if(currentTitle&&currentTitle!==titleSource){
  var rendered=code==="de"?titleSource:renderSource(titleSource);
  if(currentTitle!==rendered&&(looksGerman(currentTitle)||catalog.get(currentTitle)))titleSource=currentTitle;
 }
 var nextTitle=code==="de"?titleSource:renderSource(titleSource);
 if(nextTitle&&nextTitle!==currentTitle)global.document.title=nextTitle;
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
  if(code!=="de"&&hit){
   if(post.__darDe.title&&title)catalog.set(norm(post.__darDe.title),title);
   if(post.__darDe.statement&&statement)catalog.set(norm(post.__darDe.statement),statement);
  }
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
var scheduleTimer=0;
var applying=false;
function flushLocale(){
 scheduleTimer=0;
 if(applying){queued=true;return}
 applying=true;
 try{
  if(!TEST){applyContent(false);applyUi();mountSettingsChooser()}
  setRoot();note();
 }finally{applying=false}
 if(queued){queued=false;schedule()}
}
function schedule(){
 if(scheduleTimer){queued=true;return}
 scheduleTimer=global.setTimeout(flushLocale,80);
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
 loadPacks().then(function(){applyContent(true);flushLocale();schedule()});
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
 var uiCode=code==="de"?"tr":code;
 if(code==="de"){content={posts:{},duas:{},quiz:{},learning:{}};hadithPack={};quotes=[]}
 var uiP=loadJson("/assets/i18n/catalog/"+uiCode+".json").then(function(data){
  if(token!==packToken)return;
  catalog=new Map();
  var entries=data&&data.entries||{};
  Object.keys(entries).forEach(function(de){
   var to=entries[de];
   if(typeof de==="string"&&typeof to==="string"&&de.length>=2&&de.length<=500&&to.length<=800)catalog.set(de,to);
  });
  phraseKeys=Object.keys(entries).filter(function(de){return de.length>=8&&de.length<=200&&entries[de]}).sort(function(a,b){return b.length-a.length});
 }).catch(function(){if(code!=="de")catalog=new Map()});
 var contentP=code==="de"?Promise.resolve():loadJson("/assets/i18n/content/"+code+".json").then(function(data){
  if(token!==packToken)return;
  content=data||{};
  quotes=[];
  var q=data&&data.qQuotes||{};
  Object.keys(q).forEach(function(de){if(q[de])quotes.push({de:norm(de),to:q[de]})});
  quotes.sort(function(a,b){return b.de.length-a.de.length});
 }).catch(function(){content={posts:{},duas:{},quiz:{}}});
 var hadithP=code==="de"?Promise.resolve():loadJson("/assets/i18n/content/hadith-"+code+".json").then(function(data){
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
 loadPacks().then(function(){applyContent(true);flushLocale();schedule()});
 if(!TEST&&global.MutationObserver&&global.document.body){
  new MutationObserver(function(){schedule()}).observe(global.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
 }
 var tries=0;
 var timer=setInterval(function(){hook();if(++tries>20)clearInterval(timer)},500);
 schedule();
}
global.addEventListener("dar-adult-locale-changed",function(){loadPacks().then(function(){applyContent(true);flushLocale();schedule()})});
global.addEventListener("storage",function(e){if(e.key===KEY)loadPacks().then(function(){applyContent(true);flushLocale();schedule()})});
global.document.addEventListener("dar:view-rendered",function(){applyContent(false);schedule()});
global.document.addEventListener("click",function(e){
 var b=e.target&&e.target.closest&&e.target.closest("[data-dar-adult-locale]");
 if(b){e.preventDefault();setLocale(b.getAttribute("data-dar-adult-locale"))}
},true);
global.DARAdultUI18n={
 load:loadPacks,apply:function(){applyContent(false);return applyUi()},setLocale:setLocale,locale:locale,
 translate:translate,locales:LOCALES.slice(),
 get blocked(){return blocked.slice()},
 get catalogStatus(){return catalog.size?"loaded":"empty"},
 get translatedKeys(){return catalog.size},
 scope:"adult-visitor-website-pwa-wkwebview",
 review:"machine-translation-owner-approved"
};
if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})(window);
