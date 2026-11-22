/* DĀR AL TAWḤĪD · Public website canonical women's article detail.
 * Browser website uses ?page=frauen&cat=...&id=... instead of native #frauen/... .
 * Read-only: preserve original source identity and publish state.
 */
(function(w,d){
"use strict";
if(w.__DAR_FRAUEN_DESKTOP_ENTRY_V1)return;
w.__DAR_FRAUEN_DESKTOP_ENTRY_V1=true;
var LAUNCH="/assets/frauen/frauen-neufokus-v1.json",LOCALES="/assets/frauen/frauen-entry-locales-v1.json";
var state=null,pending=null,scheduled=false;
function route(){
 if(!d.getElementById("pageRoot"))return null;
 try{
  var q=new URLSearchParams(w.location.search);
  if(q.get("page")!=="frauen"||!q.get("id"))return null;
  return{id:q.get("id"),area:q.get("cat")||""};
 }catch(_){return null}
}
function locale(){
 var code="de";
 try{code=w.localStorage.getItem("darAdultPreferredLocaleV1")||d.documentElement.lang||"de"}catch(_){}
 code=String(code).trim().toLowerCase().replace(/_/g,"-");
 if(code==="ku-sorani")code="ckb";
 if(code==="kr")code="ku";
 return ["de","ar","en","tr","ku","ckb","bs","fr","es"].includes(code)?code:"de";
}
async function get(path){
 var response=await w.fetch(path+(path.includes("?")?"&":"?")+"release=frauen16-20261122",{cache:"no-store",credentials:"same-origin"});
 if(!response.ok)throw Error("Reader HTTP "+response.status);
 return response.json();
}
function load(){
 if(state)return Promise.resolve(state);
 if(pending)return pending;
 pending=Promise.all([get(LAUNCH),get(LOCALES)]).then(function(a){
  var manifest=a[0],catalog=a[1];
  if(manifest.items?.length!==16||manifest.expectedCount!==16||!catalog.entries)throw Error("Invalid release");
  state={manifest:manifest,catalog:catalog};return state;
 }).finally(function(){pending=null});
 return pending;
}
function el(tag,cls,text){
 var node=d.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 return node;
}
function labeledSection(parent,label,value){
 if(!value)return;
 var section=el("section","dar-frauen-desktop-section");
 section.appendChild(el("h3","",label));
 section.appendChild(el("p","",value));
 parent.appendChild(section);
}
function detailLabels(code){
 var all={
 de:["Frauenwissen","Aussage","Erklärung","Lehre","Quellenbeleg öffnen","Zum Lernbereich","Zur Frauenübersicht"],
 en:["Women’s knowledge","Report","Explanation","Lesson","Open source","Learning section","Back to women’s topics"],
 ar:["علم النساء","الرواية","الشرح","الفائدة","عرض المصدر","قسم التعلّم","العودة إلى قسم النساء"],
 tr:["Kadınlar hakkında ilim","Rivayet","Açıklama","Ders","Kaynağı aç","Öğrenme alanı","Kadınlar bölümüne dön"],
 ku:["Zanîna jinan","Rivayet","Şîrove","Ders","Çavkaniyê veke","Beşa fêrbûnê","Vegere beşa jinan"],
 ckb:["زانیاری ژنان","ڕیوایەت","ڕوونکردنەوە","فێربوون","سەرچاوە بکەرەوە","بەشی فێربوون","گەڕانەوە بۆ ژنان"],
 bs:["Znanje o ženama","Predaja","Objašnjenje","Pouka","Otvori izvor","Odjel za učenje","Nazad na odjel za žene"],
 fr:["Savoir sur les femmes","Récit","Explication","Enseignement","Ouvrir la source","Espace d’apprentissage","Retour à la rubrique femmes"],
 es:["Conocimiento sobre las mujeres","Relato","Explicación","Enseñanza","Abrir la fuente","Área de aprendizaje","Volver a la sección de mujeres"]
 };
 return all[code]||all.de;
}
function show(out,row,entry,pack,code){
 var labels=detailLabels(code),rtl=code==="ar"||code==="ckb";
 var article=el("article","dar-frauen-desktop-entry");
 article.dataset.darFrauenReleaseArticle=row.id;article.lang=code;article.dir=rtl?"rtl":"ltr";
 article.appendChild(el("div","dar-frauen-desktop-eyebrow",labels[0]+" · "+(pack.labels?.area||row.area)));
 article.appendChild(el("h2","dar-frauen-desktop-title",pack.title));
 labeledSection(article,labels[1],pack.statement);
 labeledSection(article,labels[2],pack.sharh);
 labeledSection(article,labels[3],pack.lesson);
 var source=el("section","dar-frauen-desktop-source");
 source.appendChild(el("p","",pack.source));
 var sourceLink=el("a","",labels[4]);
 sourceLink.href=row.sourceUrl;sourceLink.target="_blank";sourceLink.rel="noopener noreferrer";
 source.appendChild(sourceLink);article.appendChild(source);
 var actions=el("div","dar-frauen-desktop-actions");
 var lesson=el("a","dar-frauen-desktop-action",labels[5]);
 lesson.href="/lernen/frauen-wissen/?id="+encodeURIComponent(row.id)+"&lang="+encodeURIComponent(code);
 var back=el("a","dar-frauen-desktop-back",labels[6]);
 back.href="/?page=frauen&cat="+encodeURIComponent(row.area);
 actions.appendChild(lesson);actions.appendChild(back);article.appendChild(actions);
 out.replaceChildren(article);
 out.setAttribute("aria-busy","false");
}
function render(){
 var next=route(),out=d.getElementById("womenReal");
 if(!next||!out)return;
 var code=locale(),ready=out.firstElementChild;
 if(ready&&ready.dataset?.darFrauenReleaseArticle===next.id&&ready.lang===code)return;
 if(out.dataset.darFrauenEntryLoading===next.id+"|"+code)return;
 out.dataset.darFrauenEntryLoading=next.id+"|"+code;
 load().then(async function(v){
  var row=v.manifest.items.find(x=>x.id===next.id&&x.area===next.area);
  var entry=row&&v.catalog.entries[row.id],pack=entry?.locales?.[code];
  if(!row||!entry||!pack||entry.sourceUrl!==row.sourceUrl||entry.area!==row.area)throw Error("Article not found");
  var doc=await get("/"+row.sourceFile);
  var matches=(doc.eintraege||[]).filter(x=>x.kennung===row.id);
  if(matches.length!==1||matches[0].quellenstatus!=="geprueft"||matches[0].freigabeDurchSerhat!==true)throw Error("Source not approved");
  var live=route(),mounted=d.getElementById("womenReal");
  if(!live||live.id!==row.id||live.area!==row.area||mounted!==out)return;
  show(out,row,entry,pack,code);
 }).catch(function(){
  if(route()?.id===next.id&&d.getElementById("womenReal")===out)
   out.replaceChildren(el("p","dar-frauen-desktop-error","Der Beitrag kann momentan nicht geladen werden."));
 }).finally(function(){delete out.dataset.darFrauenEntryLoading});
}
function schedule(){
 if(scheduled)return;scheduled=true;
 (w.requestAnimationFrame||function(fn){Promise.resolve().then(fn)})(function(){scheduled=false;render()});
}
function start(){
 var root=d.getElementById("pageRoot");
 if(root&&typeof w.MutationObserver==="function"){
  new w.MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 }
 w.addEventListener("popstate",schedule);
 w.addEventListener("pageshow",schedule);
 w.addEventListener("dar-adult-locale-changed",schedule);
 schedule();
}
w.DARFrauenDesktopEntryV1=Object.freeze({render:render});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
