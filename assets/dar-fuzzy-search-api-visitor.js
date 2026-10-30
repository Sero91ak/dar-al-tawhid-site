/* DĀR Test Home v4.8 — multilingual & typo-tolerant search suggestions. */
(function(){"use strict";
if(!(/^(\/|\/index\.html|\/pwa(?:\/|$))$/.test(location.pathname)))return;
if(window.__DarTestSearchV48)return;window.__DarTestSearchV48=true;
const F=window.DarTestFuzzyCore;if(!F)return;
let catalog=[],loading=null,panel=null,active=null,timer=0,queued=false;
const sections=[
 ["Tawḥīd und ʿAqīdah","Themen","topics","tauhid tawhid tevhid aqida akida allahs einheit"],
 ["Īmān und Glaube","Themen","topics","iman imaan iman glauben glaube"],
 ["Qurʾān und Tafsīr","Qurʾān","quran","koran quran vers sure sura tafsir"],
 ["Ḥadīṯ und Sunnah","Ḥadīṯ","hadith","hadith hadis sunna überlieferungen"],
 ["Bücher und Quellen","Werke","books","bibliothek bücher buch werke originalquellen"],
 ["Ṣaḥābah, Salaf und Gelehrte","Gelehrte","scholars","gelehrter imam sahaba salaf"],
 ["Duʿāʾ und Dhikr","Bittgebete","duas","dua bittgebet gedenken zikr"],
 ["Frauen und Fiqh","Frauenbereich","frauen","frauen fiqh ehe niqab hijab"],
 ["Propheten","Propheten","propheten","prophet gesandte"],
 ["Gebetszeiten","Gebetszeiten","prayer","fajr zuhr dhuhr asr maghrib isha ischa"],
 ["Qiblah","Gebet","qibla","qibla kibla kaaba kompass mekka"],
 ["Dīn-Quiz","Quiz","quiz","quiz fragen wissen"],
 ["Beiträge","Veröffentlichungen","recent","beitrag artikel veröffentlichungen"],
 ["Shirk","Themen","topics","schirk beigesellung"],
 ["Kufr","Themen","topics","unglaube kafir kuffar"],
 ["Ṭāghūt","Themen","topics","tagut taghoot falsche gottheit"]
];
function add(name,group,route,aliases,hash){
 if(name&&route&&catalog.length<1250)catalog.push(F.make(name,group,route,aliases||"",hash||""));
}
function load(){
 if(loading)return loading;
 for(const x of sections)add(x[0],x[1],x[2],x[3]);
 const urls=["/test/data/dar-smart-post-titles-v1.json","/data/canonical-books-index.json",
 "/data/scholar-index-meta.json","/data/frauen-bereiche-index.json","/data/quran-search-keywords.json"];
 loading=Promise.allSettled(urls.map(url=>fetch(url,{cache:"force-cache"}).then(r=>r.ok?r.json():null)))
 .then(out=>{
  const a=out.map(x=>x.status==="fulfilled"?x.value:null);
  for(const p of a[0]?.entries||[])add(p.label,"Beiträge","recent",p.slug);
  for(const b of a[1]?.books||[]){
   if(b.verification==="unverified")continue;
   add(b.title,"Werke","books",[b.author,b.category,...(b.aliases||[])].join(" "));
  }
  for(const scholar of Object.values(a[2]?.scholars||{})){
   if(scholar.displayName)add(scholar.displayName,"Gelehrte","scholars",
    [scholar.kuniyah,scholar.eraLabel,...(scholar.aliases||[])].join(" "));
  }
  for(const region of a[3]?.bereiche||[]){
   if(region.status==="aktiv")add(region.titel,"Frauenbereich","frauen",region.untertitel,region.route);
  }
  for(const word of a[4]||[])if(word.label)add(word.label,"Qurʾān-Stichwort","quran",(word.terms||[]).join(" "));
  return catalog;
 }).catch(()=>catalog);
 return loading;
}
function find(q){return catalog.map(item=>({item,score:F.score(q,item)})).filter(x=>x.score>0)
 .sort((a,b)=>b.score-a.score||a.item.label.localeCompare(b.item.label,"de")).slice(0,9).map(x=>x.item)}
window.DarTestSmartSearchV48={find,load};
})();
