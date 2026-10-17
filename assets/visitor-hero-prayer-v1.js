/* DAR adult visitor — theme heroes, complete topics library and prayer motifs, 2026-10-16.
   Presentation only; never touches prayer selection, times, push, sources or routes.
   Original category nodes are moved, not cloned, so original data-nav stays intact. */
(function(){
 "use strict";
 if(/^\/(?:test|kids|admin)(?:\/|$)/i.test(location.pathname))return;
 if(window.__DAR_VISITOR_HERO_PRAYER_LIBRARY_V1__)return;
 window.__DAR_VISITOR_HERO_PRAYER_LIBRARY_V1__=true;
 var defs=[
  {id:"belief",title:"Glaube & Grundlagen",words:["aqid","tawhid","iman","shirk","tagut","akhira","jannah","jahannam","allah","glauben","glaube","paradies","hölle"]},
  {id:"sources",title:"Qurʾān, Sunnah & Überlieferung",words:["quran","tafsir","hadith","athar","sahaba","sahabiyy","salaf","wissen","ilm","isnad","hadis","sunnah","überlieferung","koran"]},
  {id:"fiqh",title:"Fiqh, Urteile & Methodik",words:["fiqh","hukm","muhakam","takfir","manhaj","usul","ijma","widerlegung","qiyas","recht","gericht","sharia","schari"]},
  {id:"life",title:"Charakter, Herz & Leben",words:["adab","akhlaq","ahl aq","tarbiy","tazkiy","tawakkul","zuhd","familie","liebe","dunya","geduld","erzieh","herz","leben","ikhlas","reue"]},
  {id:"other",title:"Weitere Wissensgebiete",words:[]}
 ];
 function key(s){return String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[ʿʾʽʻ‘’']/g,"").replace(/[^a-z0-9]/g,"");}
 function groupFor(name){
  var k=key(name);
  for(var i=0;i<defs.length-1;i++){
   for(var j=0;j<defs[i].words.length;j++)if(k.includes(key(defs[i].words[j])))return defs[i].id;
  }
  return "other";
 }
 function label(n,singular,plural){return String(n)+" "+(n===1?singular:plural);}
 function span(cls,content){
  var e=document.createElement("span");e.className=cls;e.textContent=content;return e;
 }
 function enhanceTopics(){
  if(!document.body.classList.contains("is-topics-route"))return;
  var hub=document.querySelector("#appView .topics-hub");
  if(!hub||hub.querySelector(".dar-visitor-topic-groups"))return;
  var labelNode=hub.querySelector(".topics-hub__label");
  var original=Array.from(hub.querySelectorAll(":scope > .category-cluster"));
  if(!labelNode||!original.length)return;
  var cards=original.flatMap(function(c){return Array.from(c.querySelectorAll(".topics-theme-card[data-nav='topic']"));});
  if(!cards.length)return;
  var groups=defs.map(function(d){return{id:d.id,title:d.title,items:[],posts:0};});
  var index=new Map(groups.map(function(g){return[g.id,g];}));
  var grandTotal=0;
  cards.forEach(function(card){
    var title=card.getAttribute("data-value")||(card.querySelector(".topics-theme-card__body h3")||{}).textContent||"";
    var g=index.get(groupFor(title))||index.get("other");
    var countText=(card.querySelector(".topics-theme-card__count")||{}).textContent||"";
    var match=String(countText).match(/\d+/);
    var number=match?Number(match[0]):0;
    g.items.push(card);g.posts+=number;grandTotal+=number;
  });
  var stack=document.createElement("div");stack.className="dar-visitor-topic-groups";stack.setAttribute("aria-label","Alle Wissensbereiche");
  var visible=groups.filter(function(g){return g.items.length>0;});
  visible.forEach(function(g,i){
    var item=document.createElement("details");
    item.className="dv-topic-section";item.setAttribute("name","dar-visitor-topic-group");
    var head=document.createElement("summary");
    head.append(
      span("dv-number",String(i+1).padStart(2,"0")),
      span("dv-title",g.title),
      span("dv-count",label(g.items.length,"Thema","Themen")),
      span("dv-arrow","›")
    );
    var rows=document.createElement("div");rows.className="dv-items";
    g.items.forEach(function(card){rows.appendChild(card);});
    item.append(head,rows);stack.appendChild(item);
  });
  original[0].parentNode.insertBefore(stack,original[0]);
  original.forEach(function(node){node.remove();});
  var titleCount=label(visible.length,"Bereich","Bereiche")+" · "+label(cards.length,"Thema","Themen");
  var meta=labelNode.querySelector("span");
  if(meta)meta.textContent=titleCount;
  stack.setAttribute("data-post-count",String(grandTotal));
 }
 var BASE="/assets/prayer-motifs/";
 var REFERENCE={fajr:"fajr",sunrise:"fajr",dhuhr:"dhuhr",asr:"asr",maghrib:"maghrib",isha:"isha"};
 function prayerKey(card){
  var data=card.getAttribute("data-notification-prayer");
  if(data)return REFERENCE[data]||null;
  var title=card.querySelector("b,.prayer-time-name,.prayer-name");
  if(!title)return null;
  var t=String(title.textContent||"").toLowerCase();
  if(t.includes("sonnenaufgang")||t.includes("fajr"))return "fajr";
  if(t.includes("dhuhr"))return "dhuhr";
  if(t.includes("maghrib"))return "maghrib";
  if(t.includes("aṣr")||t.includes("asr")||t.includes("ʿaṣr"))return "asr";
  if(t.includes("isha")||t.includes("ishā")||t.includes("ʿish"))return "isha";
  return null;
 }
 function decorate(card){
  var k=prayerKey(card);if(!k)return;
  var photo=card.querySelector(":scope > img.dv-prayer-picture");
  if(!photo){
   photo=document.createElement("img");
   photo.className="dv-prayer-picture";photo.alt="";
   photo.setAttribute("data-prayer-art",k);
   photo.setAttribute("aria-hidden","true");
   photo.setAttribute("loading","lazy");
   photo.setAttribute("decoding","async");
   photo.draggable=false;
   photo.addEventListener("error",function(){card.classList.add("dv-prayer-fallback");},{once:true});
   card.insertBefore(photo,card.firstChild);
  }
  var uri=BASE+k+".webp?v=20261016-visitor-v1";
  if(photo.getAttribute("src")!==uri)photo.setAttribute("src",uri);
  card.classList.add("dv-prayer-art");
 }
 function enhancePrayers(){
  document.querySelectorAll("#appView .notification-prayer-grid > .notification-prayer").forEach(decorate);
  document.querySelectorAll("#appView .prayer-page-noble .prayer-time-grid--top > .prayer-time-card").forEach(decorate);
 }
 var pending=false,watching=null,observer=null;
 function run(){
  pending=false;
  try{enhanceTopics();enhancePrayers();}catch(e){console.warn("Visitor visual enhancement fallback",e);}
 }
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(run);
 }
 function observe(){
  var host=document.getElementById("appView");
  if(!host||host===watching)return;
  if(observer)observer.disconnect();
  watching=host;
  observer=new MutationObserver(function(records){
   for(var i=0;i<records.length;i++){
    var rec=records[i];
    for(var j=0;j<rec.addedNodes.length;j++){
     var node=rec.addedNodes[j];
     if(node.nodeType!==1)continue;
     if(node.matches(".topics-hub,.category-cluster,.notification-prayer,.prayer-time-card,.prayer-page-noble") ||
        node.querySelector(".topics-hub,.category-cluster,.notification-prayer,.prayer-time-card,.prayer-page-noble")){
      schedule();return;
     }
    }
   }
  });
  observer.observe(host,{childList:true,subtree:true});
 }
 function start(){observe();schedule();}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
 window.addEventListener("hashchange",function(){observe();schedule();},{passive:true});
 window.addEventListener("pageshow",function(){observe();schedule();},{passive:true});
 window.addEventListener("dar:view-rendered",function(){observe();schedule();},{passive:true});
})();
