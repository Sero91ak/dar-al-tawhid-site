/* DAR_TOPICS_LIBRARY_V1360 — preserve original data and native routing */
(function(){
"use strict";
if(window.__DAR_TOPICS_LIBRARY_V1360)return;
window.__DAR_TOPICS_LIBRARY_V1360=true;
if(typeof renderTopics!=="function")return;
const original=renderTopics;
const definitions=[
{id:"glauben",title:"Glaube & Grundlagen",words:["aqid","tawhid","sunnah","iman","shirk","tagut","akhira","jannah","jahannam","mak an","allah"],desc:"Grundlagen des Glaubens"},
{id:"quellen",title:"Qurʾān, Sunnah & Überlieferung",words:["quran","tafsir","hadith","athar","sahaba","sahabiyyat","sahabiyy","salaf","wissen","ilm","adhkar","dhikr"],desc:"Texte, Überlieferer und Wissen"},
{id:"recht",title:"Fiqh, Urteile & Methodik",words:["fiqh","hukm","muhakam","takfir","manhaj","usul","ijma","widerlegung","qiyas","recht"],desc:"Rechtsfragen und Prinzipien"},
{id:"leben",title:"Charakter, Herz & Leben",words:["adab","akhlaq","tarbiy","tazkiy","tawakkul","zuhd","familie","liebe","dunya","geduld","erzieh"],desc:"Adab und tägliche Lebensführung"},
{id:"weitere",title:"Weitere Wissensgebiete",words:[],desc:"Weitere Themen mit Quellen"}
];
function key(v){return String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("de").replace(/[ʿʾʽʻ‘’']/g,"").replace(/[^a-z0-9]/g,"");}
function groupFor(v){
 const k=key(v);
 for(const d of definitions.slice(0,-1)){
   if(d.words.some(w=>k.includes(key(w))))return d.id;
 }
 return "weitere";
}
function escHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function label(n,one,many){return n+" "+(n===1?one:many);}
function enhance(html){
 const template=document.createElement("template");
 template.innerHTML=html;
 const hub=template.content.querySelector(".topics-hub");
 if(!hub || hub.querySelector(".dar-tl-groups"))return html;
 const labelNode=hub.querySelector(".topics-hub__label");
 const originalGroups=Array.from(hub.querySelectorAll(".category-cluster"));
 if(!labelNode || !originalGroups.length)return html;
 const originalCards=originalGroups.flatMap(el=>Array.from(el.querySelectorAll(".topics-theme-card")));
 if(!originalCards.length)return html;
 const groups=new Map(definitions.map(d=>[d.id,[]]));
 let count=0;
 for(const card of originalCards){
   const name=card.getAttribute("data-value") || card.querySelector(".topics-theme-card__body h3")?.textContent || "";
   const id=groupFor(name);
   groups.get(id).push(card.outerHTML);
   count++;
 }
 let articles=0;
 try{
   const counts=originalCards.map(card=>Number((card.querySelector(".topics-theme-card__count")?.textContent||"").match(/\d+/)?.[0]||0));
   articles=counts.reduce((a,b)=>a+b,0);
 }catch(e){}
 const intro=document.createElement("section");
 intro.className="dar-tl-intro";
 intro.setAttribute("aria-label","Wissensbibliothek");
 intro.innerHTML='<div><p class="dar-tl-intro__eyebrow">DĀR AL TAWḤĪD · THEMENBIBLIOTHEK</p><h3>Wissen nach Themen entdecken</h3><p class="dar-tl-intro__desc">Geordnetes Wissen mit Aussagen, Quellen und Nachweisen.</p></div><div class="dar-tl-seal" aria-hidden="true">۞</div>';
 labelNode.parentNode.insertBefore(intro,labelNode);
 const filter=document.createElement("nav");
 filter.className="dar-tl-filterbar";
 filter.setAttribute("aria-label","Wissensgebiete wählen");
 const available=definitions.filter(d=>groups.get(d.id).length);
 filter.innerHTML='<button type="button" class="dar-tl-chip" data-dar-topic-filter="all" aria-pressed="true">Alle Themen <small>'+count+'</small></button>'+
 available.map(d=>'<button type="button" class="dar-tl-chip" data-dar-topic-filter="'+d.id+'" aria-pressed="false">'+escHtml(d.title)+' <small>'+groups.get(d.id).length+'</small></button>').join("");
 const stack=document.createElement("div");
 stack.className="dar-tl-groups";
 stack.setAttribute("aria-label","Themenbereiche");
 available.forEach((d,index)=>{
   const items=groups.get(d.id);
   const details=document.createElement("details");
   details.className="dar-tl-accordion";
   details.setAttribute("data-dar-tl-group",d.id);
   if(index===0 || count<=8)details.open=true;
   details.innerHTML='<summary><span class="dar-tl-groupno" aria-hidden="true">'+String(index+1).padStart(2,"0")+'</span><span class="dar-tl-groupname">'+escHtml(d.title)+'</span><span class="dar-tl-groupcount">'+label(items.length,"Thema","Themen")+'</span><span class="dar-tl-arrow" aria-hidden="true">›</span></summary><div class="dar-tl-grid">'+items.join("")+'</div>';
   stack.appendChild(details);
 });
 originalGroups.forEach(el=>el.remove());
 labelNode.insertAdjacentElement("afterend",filter);
 filter.insertAdjacentElement("afterend",stack);
 labelNode.querySelector("span").textContent=label(count,"Bereich","Bereiche")+" · "+label(articles,"Beitrag","Beiträge");
 return template.innerHTML;
}
renderTopics=function(){try{return enhance(original.apply(this,arguments));}catch(e){console.warn("Topics layout fallback",e);return original.apply(this,arguments);}};
document.addEventListener("click",function(e){
 const button=e.target?.closest?.(".dar-tl-filterbar [data-dar-topic-filter]");
 if(!button)return;
 const hub=button.closest(".topics-hub");
 if(!hub)return;
 const value=button.getAttribute("data-dar-topic-filter")||"all";
 hub.querySelectorAll(".dar-tl-filterbar [data-dar-topic-filter]").forEach(b=>b.setAttribute("aria-pressed",b===button?"true":"false"));
 hub.querySelectorAll(".dar-tl-accordion").forEach(item=>{
   const selected=value==="all"||item.getAttribute("data-dar-tl-group")===value;
   item.hidden=!selected;
   if(value!=="all"&&selected)item.open=true;
 });
});
})();

