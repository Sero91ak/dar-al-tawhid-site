/* DĀR AL TAWḤĪD KIDS · Mein Gebet, isolated V2 home-only preview.
   No fifth main capsule and no permanent bottom tab.
   All profile data remain owned by the existing Kids profile controller.
   Full rollback: remove this script from the 3 identical Kids shells and delete this file. */
(function(){
"use strict";
if(window.DAR_KIDS_MEIN_GEBET_ENABLED===false)return;
var assets={boy:"/kids/assets/profile-avatars/boy-kufi-v1235.svg",girl:"/kids/assets/profile-avatars/girl-hijab-pink-v1235.svg"};
var lessons=[
{id:"what",n:"01",title:"Was ist das Gebet?",desc:"Ṣalāh und die fünf täglichen Gebete kennenlernen.",parts:["Was bedeutet Ṣalāh?","Die fünf Pflichtgebete","Was ist eine Rakʿah?"]},
{id:"why",n:"02",title:"Warum beten wir?",desc:"Die Bedeutung des Gebets kindgerecht entdecken.",parts:["Anbetung Allahs","Dankbarkeit und Gedenken","Mit Freude lernen"]},
{id:"how",n:"03",title:"Wie bete ich?",desc:"Vorbereitung und Gebetsablauf Schritt für Schritt lernen.",parts:["Vorbereitung auf das Gebet","Die Gebetsstellungen","Zwei Rakʿāt üben"]},
{id:"viewer",n:"04",title:"Mein 3D-Gebet",desc:"Später die eigene Figur bewegen und drehen.",parts:["Die Figur um 360° betrachten","Gebetsstellungen einzeln ansehen","Hören, lesen und wiederholen"]}
];
function make(tag,cl,t){var x=document.createElement(tag);if(cl)x.className=cl;if(t!==undefined)x.textContent=t;return x}
function getGender(){
  var app=document.querySelector(".app"),g=app&&app.getAttribute("data-gender");
  if(g==="boy"||g==="girl")return g;
  try{
    var active=localStorage.getItem("kids.activeProfile"),profiles=JSON.parse(localStorage.getItem("kids.profiles.v1")||"[]");
    var p=Array.isArray(profiles)&&profiles.find(function(x){return String(x.id)===String(active)});
    if(p&&(p.gender==="boy"||p.gender==="girl"))return p.gender;
  }catch(_){}
  return null; /* Never render an arbitrary wrong-gender profile */
}
function init(){
  var home=document.getElementById("view-today"),grid=home&&home.querySelector(".big-choice-grid"),shell=document.querySelector("main.shell");
  if(!home||!grid||!shell||document.getElementById("kidsMeinGebetEntry"))return;
  var style=make("style");style.id="kids-mein-gebet-preview-style";style.textContent="\n#view-today #kidsMeinGebetEntry.kmg-home-link{display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:78px!important;margin:14px 0 0!important;padding:12px 16px!important;border-radius:22px!important;border:1px solid rgba(227,197,129,.23)!important;background:linear-gradient(115deg,rgba(20,69,68,.76),rgba(18,47,63,.80))!important;box-shadow:0 9px 25px rgba(0,0,0,.11),0 0 14px rgba(226,189,114,.06)!important;color:#fff8eb!important;text-align:left!important;cursor:pointer!important}\n#kidsMeinGebetEntry:active{transform:scale(.992)}\n#kidsMeinGebetEntry:focus-visible,#view-mein-gebet button:focus-visible{outline:2px solid #ffdc94;outline-offset:3px}\n#kidsMeinGebetEntry .kmg-mini{height:55px;width:55px;flex:0 0 55px;object-fit:contain;background:rgba(255,255,255,.065);border-radius:16px;padding:2px}\n#kidsMeinGebetEntry .kmg-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}\n#kidsMeinGebetEntry .kmg-copy small{font-size:11px;color:rgba(255,255,255,.70);line-height:1.3}\n#kidsMeinGebetEntry .kmg-copy strong{font:750 20px/1.1 \"Fredoka\",system-ui,sans-serif}\n#kidsMeinGebetEntry .kmg-arrow{font-size:25px;color:#f5d8a6}\n#view-mein-gebet{padding:4px 0 calc(160px + env(safe-area-inset-bottom,0px));color:#fff8eb}\n#view-mein-gebet [hidden]{display:none!important}\n#view-mein-gebet .kmg-back{display:inline-flex;align-items:center;min-height:44px;padding:11px 16px;margin:0 0 16px;border:1px solid rgba(238,214,165,.25);border-radius:999px;background:rgba(255,255,255,.07);color:#ffe6b6;cursor:pointer;font-weight:750}\n#view-mein-gebet .kmg-hero{display:flex;align-items:center;gap:16px;padding:25px 20px;border:1px solid rgba(226,189,114,.20);border-radius:28px;background:radial-gradient(circle at 90% 8%,rgba(213,183,124,.14),transparent 45%),linear-gradient(145deg,#103b44,#102838 72%);overflow:hidden}\n#view-mein-gebet .kmg-hero-copy{flex:1;min-width:0}\n#view-mein-gebet .kmg-kicker{color:#f0d09c;font-size:10px;font-weight:850;letter-spacing:.1em;margin:0 0 10px}\n#view-mein-gebet h2{font:750 clamp(29px,7.7vw,44px)/1.07 \"Fredoka\",system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 10px}\n#view-mein-gebet p{line-height:1.5}\n#view-mein-gebet .kmg-hero p:last-child{margin:0;color:rgba(255,255,255,.76);font-size:13px}\n#view-mein-gebet .kmg-figure{width:96px;height:149px;max-width:29%;flex:0 0 auto;object-fit:contain}\n#view-mein-gebet .kmg-caption{margin:12px 2px 17px;color:rgba(255,255,255,.67);font-size:12px}\n#view-mein-gebet .kmg-list{display:grid;grid-template-columns:1fr;gap:12px}\n#view-mein-gebet .kmg-lesson{display:grid;grid-template-columns:40px minmax(0,1fr) 16px;align-items:center;gap:13px;padding:18px 15px;min-height:90px;border:1px solid rgba(226,189,114,.17);border-radius:23px;background:rgba(255,255,255,.065);text-align:left;color:#fff8eb;cursor:pointer}\n#view-mein-gebet .kmg-num{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:rgba(226,189,114,.12);color:#ffe3a2;font-size:12px;font-weight:900}\n#view-mein-gebet .kmg-lesson strong{display:block;font:740 clamp(18px,4.7vw,22px)/1.15 \"Fredoka\",system-ui,sans-serif;margin-bottom:5px}\n#view-mein-gebet .kmg-lesson small{font-size:12px;line-height:1.4;color:rgba(255,255,255,.68)}\n#view-mein-gebet .kmg-chevron{font-size:25px;color:#f5d596}\n#view-mein-gebet .kmg-detail-stage{display:flex;align-items:center;gap:18px;padding:20px;border:1px solid rgba(226,189,114,.18);background:rgba(255,255,255,.055);border-radius:23px;margin:20px 0}\n#view-mein-gebet .kmg-detail-stage img{width:84px;height:125px;object-fit:contain}\n#view-mein-gebet .kmg-detail-stage span{flex:1;font-size:13px;line-height:1.5;color:rgba(255,255,255,.8)}\n#view-mein-gebet .kmg-topic{display:flex;gap:13px;align-items:center;min-height:56px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.045);margin-bottom:9px;font-size:14px}\n#view-mein-gebet .kmg-topic b{color:#f3d5a2}\n#view-mein-gebet .kmg-note{margin:17px 2px;font-size:12px;color:rgba(255,255,255,.64)}\n@media(min-width:700px){#view-mein-gebet .kmg-list{grid-template-columns:repeat(2,minmax(0,1fr))}#view-mein-gebet .kmg-figure{height:190px;width:125px}}\n@media(max-width:360px){#view-mein-gebet .kmg-hero{gap:10px;padding:20px 15px}#view-mein-gebet .kmg-figure{max-width:24%}#view-today #kidsMeinGebetEntry.kmg-home-link{padding:10px 12px!important}}\n@media(prefers-reduced-motion:reduce){#kidsMeinGebetEntry{transition:none!important}}";document.head.appendChild(style);

  /* A single compact Home link, placed OUTSIDE the original capsule grid. */
  var entry=make("button","kmg-home-link");entry.id="kidsMeinGebetEntry";entry.type="button";entry.setAttribute("aria-label","Mein Gebet – Testansicht öffnen");
  var entryPic=make("img","kmg-mini");entryPic.alt="";entryPic.decoding="async";entryPic.loading="lazy";
  var copy=make("span","kmg-copy");
  copy.appendChild(make("small",null,"NEU · TESTANSICHT"));
  copy.appendChild(make("strong",null,"Mein Gebet"));
  copy.appendChild(make("small",null,"Lernbereich ansehen"));
  entry.appendChild(entryPic);entry.appendChild(copy);entry.appendChild(make("span","kmg-arrow","›"));
  grid.insertAdjacentElement("afterend",entry);

  var view=make("section","view");view.id="view-mein-gebet";view.setAttribute("aria-label","Mein Gebet – Vorschau");
  var overview=make("div");overview.id="kmgOverview";
  var backHome=make("button","kmg-back","← Zur Startseite");backHome.type="button";overview.appendChild(backHome);
  var hero=make("header","kmg-hero"),heroCopy=make("div","kmg-hero-copy");
  heroCopy.appendChild(make("p","kmg-kicker","DĀR AL TAWḤĪD KIDS · VORSCHAU"));
  heroCopy.appendChild(make("h2",null,"Mein Gebet"));
  heroCopy.appendChild(make("p",null,"Entdecke, warum wir beten und wie du das Gebet Schritt für Schritt lernst."));
  var pic=make("img","kmg-figure");pic.alt="Aktive Kinderprofil-Figur";pic.decoding="async";
  hero.appendChild(heroCopy);hero.appendChild(pic);overview.appendChild(hero);
  var caption=make("p","kmg-caption");overview.appendChild(caption);
  var list=make("div","kmg-list");
  lessons.forEach(function(l){
    var b=make("button","kmg-lesson");b.type="button";b.dataset.kmgLesson=l.id;
    b.appendChild(make("span","kmg-num",l.n));
    var c=make("span");c.appendChild(make("strong",null,l.title));c.appendChild(make("small",null,l.desc));b.appendChild(c);
    b.appendChild(make("span","kmg-chevron","›"));list.appendChild(b);
  });
  overview.appendChild(list);
  overview.appendChild(make("p","kmg-note","Dies ist eine Designvorschau. Gebetsanimationen und Audios folgen erst nach Fachprüfung."));
  view.appendChild(overview);

  var detail=make("div");detail.id="kmgDetail";detail.hidden=true;
  var backOverview=make("button","kmg-back","← Zu Mein Gebet");backOverview.type="button";detail.appendChild(backOverview);
  detail.appendChild(make("p","kmg-kicker","LERNBEREICH · DESIGNVORSCHAU"));
  var title=make("h2"),desc=make("p");detail.appendChild(title);detail.appendChild(desc);
  var stage=make("div","kmg-detail-stage"),detailPic=make("img");
  detailPic.alt="Aktive Kinderprofil-Figur";detailPic.decoding="async";stage.appendChild(detailPic);
  stage.appendChild(make("span",null,"Hier werden die geprüften Lektionen und später die 3D-Bewegungen angezeigt."));
  detail.appendChild(stage);
  var topics=make("div");detail.appendChild(topics);
  detail.appendChild(make("p","kmg-note","Dies ist nur die Bedienoberfläche. Die realen Audios und Gebetsbewegungen sind noch nicht enthalten."));
  view.appendChild(detail);shell.appendChild(view);

  function refreshProfile(){
    var g=getGender();[entryPic,pic,detailPic].forEach(function(img){img.hidden=!g;if(g)img.src=assets[g]});
    caption.textContent=g==="girl"?"Mädchenprofil aktiv: automatisch Mädchenfigur.":
      g==="boy"?"Jungenprofil aktiv: automatisch Jungenfigur.":
      "Bitte zuerst in der Kids-App ein Jungen- oder Mädchenprofil auswählen.";
  }
  function navigate(name){
    if(typeof window.showTab==="function")window.showTab(name);
    else{
      var from=document.querySelector("main.shell > .view.active");if(from)from.classList.remove("active");
      var to=document.getElementById("view-"+name);if(to)to.classList.add("active");
    }
  }
  function showOverview(){detail.hidden=true;overview.hidden=false}
  entry.addEventListener("click",function(){showOverview();refreshProfile();navigate("mein-gebet")});
  backHome.addEventListener("click",function(){navigate("today")});
  backOverview.addEventListener("click",showOverview);
  list.addEventListener("click",function(e){
    var btn=e.target.closest&&e.target.closest("[data-kmg-lesson]");
    if(!btn)return;
    var l=lessons.find(function(x){return x.id===btn.dataset.kmgLesson});if(!l)return;
    title.textContent=l.title;desc.textContent=l.desc;topics.replaceChildren();
    l.parts.forEach(function(part,i){var el=make("div","kmg-topic");el.appendChild(make("b",null,String(i+1).padStart(2,"0")));el.appendChild(make("span",null,part));topics.appendChild(el)});
    overview.hidden=true;detail.hidden=false;refreshProfile();
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&view.classList.contains("active")){if(!detail.hidden)showOverview();else navigate("today")}});
  var app=document.querySelector(".app");
  if(app&&window.MutationObserver){new MutationObserver(function(entries){if(entries.some(function(x){return x.attributeName==="data-gender"}))refreshProfile()}).observe(app,{attributes:true,attributeFilter:["data-gender"]})}
  refreshProfile();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();