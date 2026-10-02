(()=>{"use strict";
const A={
 hero:"/kids/assets/story-wow/v22-muhammad-hero.jpg?v=22",
 route:"/kids/assets/story-wow/v22-muhammad-route.jpg?v=22",
 hira:"/kids/assets/story-wow/v22-muhammad-hira.jpg?v=22",
 madinah:"/kids/assets/story-wow/v22-muhammad-madinah.jpg?v=22"
};
let scheduled=false;
const q=(s,r=document)=>r.querySelector(s);
function patchHome(){
 const view=q("#view-stories.ps-stories-home"); if(!view)return;
 const special=q("#psMuhammadHomeEntry",view);
 if(special&&!special.dataset.r22){
   special.dataset.r22="1";
   special.innerHTML='<span class="ps-mh-home-art" aria-hidden="true"></span><span class="ps-mh-home-shade" aria-hidden="true"></span><span class="ps-mh-home-copy"><span class="ps-mh-home-kicker">★&nbsp;&nbsp;BESONDERER BEREICH</span><strong>Prophet<br>Muḥammad</strong><span class="ps-mh-home-ar" dir="rtl">محمد ﷺ</span><span class="ps-mh-home-sub">Sein Leben. Seine Werte. Seine Botschaft.</span><span class="ps-mh-home-cta">Geschichten entdecken <b aria-hidden="true">→</b></span></span>';
 }
 const entry=q("#psProphetEntry",view);
 if(entry&&!entry.dataset.r22){
   entry.dataset.r22="1";
   entry.innerHTML='<span class="ps-entry-shade" aria-hidden="true"></span><span class="ps-entry-copy"><span class="ps-entry-kicker">EIGENER BEREICH · QURʾĀN GEPRÜFT</span><strong>Prophetengeschichten</strong><span class="ps-entry-sub">25 Geschichten · lesen &amp; hören</span><span class="ps-entry-cta">Jetzt entdecken <b aria-hidden="true">→</b></span></span>';
 }
 const feature=q(".story-feature[data-story]",view);
 if(feature&&!feature.dataset.r22key){
   feature.dataset.r22key="1";feature.tabIndex=0;feature.setAttribute("role","button");
   feature.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();feature.click()}});
 }
 const title=q(".story-more-title",view);
 if(title&&!q("#r22StoryAll",title)){
   title.innerHTML='<span class="r22-section-label"><span class="r22-book" aria-hidden="true"></span><strong>Weitere Geschichten</strong><i aria-hidden="true"></i></span><button id="r22StoryAll" class="r22-all" type="button" aria-expanded="false">Alle anzeigen <b aria-hidden="true">→</b></button>';
   q("#r22StoryAll",title).addEventListener("click",e=>{
     const list=view.querySelector(".story-list:not(#authenticStoryList)"); if(!list)return;
     const on=list.classList.toggle("r22-expanded");e.currentTarget.setAttribute("aria-expanded",String(on));
     e.currentTarget.innerHTML=on?'Weniger <b aria-hidden="true">↑</b>':'Alle anzeigen <b aria-hidden="true">→</b>';
     if(on)list.scrollIntoView({behavior:"smooth",block:"nearest"});
   });
 }
}
function patchMuhammad(){
 const special=q("#psMuhammadSpecial");if(!special)return;
 const hero=q(".ps-mh-hero-art",special);if(hero&&hero.getAttribute("src")!==A.hero)hero.setAttribute("src",A.hero);
 const ids={birth:A.hero,wahy:A.hira,hijrah:A.route,tawhid:A.hero,madinah:A.madinah,rahmah:A.madinah,return:A.hero,khatam:A.madinah};
 for(const [id,url] of Object.entries(ids)){
   const art=q('[data-mh-episode="'+id+'"] .ps-mh-episode-art',special);
   if(art)art.style.setProperty("background-image",'url("'+url+'")',"important");
 }
}
function patch(){scheduled=false;patchHome();patchMuhammad()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
})();