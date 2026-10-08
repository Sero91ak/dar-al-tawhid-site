/* DĀR AL TAWḤĪD KIDS — Mein Gebet preview v1.
   Isolated trial module. To remove: delete this script reference from
   kids/index.html, kids/start.html and kids/shell.html, then delete this file.
   No changes to existing navigation, audio, service worker or user data. */
(function(){
  "use strict";
  if(window.DAR_KIDS_MEIN_GEBET_ENABLED===false)return;
  function mount(){
    var grid=document.querySelector("#view-today .big-choice-grid");
    var shell=document.querySelector("main.shell");
    if(!grid||!shell||document.getElementById("kidsMeinGebetEntry"))return;

    var style=document.createElement("style");
    style.id="kids-mein-gebet-preview-style";
    style.textContent=[
      '#view-today #kidsMeinGebetEntry.choice.prayer{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:linear-gradient(135deg,#163f43,#153447)!important;}',
      '#view-today #kidsMeinGebetEntry.choice.prayer::before{background-image:linear-gradient(100deg,rgba(7,23,30,.88),rgba(8,31,36,.47) 63%,rgba(8,29,31,.15)),radial-gradient(circle at 80% 47%,rgba(226,189,114,.20) 0 9%,transparent 30%),linear-gradient(145deg,#174e4b,#10283c)!important;}',
      '#view-today #kidsMeinGebetEntry .icon{display:grid!important;place-items:center!important;width:58px!important;height:58px!important;border-radius:18px!important;border:1px solid rgba(241,209,147,.25)!important;background:rgba(236,199,134,.11)!important;color:#ffe3ab!important;font-size:31px!important;}',
      '#view-mein-gebet{padding:5px 0 calc(165px + env(safe-area-inset-bottom,0px));color:#fff8eb;}',
      '#view-mein-gebet .mg-back{display:inline-flex;align-items:center;min-height:44px;padding:10px 17px;border:1px solid rgba(238,214,165,.24);border-radius:999px;background:rgba(255,255,255,.075);color:#ffe6b6;cursor:pointer;font-weight:750;margin-bottom:20px;}',
      '#view-mein-gebet .mg-header{position:relative;overflow:hidden;border:1px solid rgba(226,189,114,.23);border-radius:29px;padding:31px 22px 27px;background:radial-gradient(circle at 83% 15%,rgba(219,184,123,.20),transparent 43%),linear-gradient(145deg,#103b44,#102838 72%);box-shadow:0 16px 34px rgba(0,0,0,.14);}',
      '#view-mein-gebet .mg-eyebrow{color:#efcd8d;text-transform:uppercase;letter-spacing:.16em;font-size:10px;font-weight:850;margin:0 0 12px;}',
      '#view-mein-gebet .mg-header h2{font-family:"Fredoka",system-ui,sans-serif;font-size:clamp(34px,9vw,52px);line-height:1.05;letter-spacing:-.025em;margin:0 0 10px;}',
      '#view-mein-gebet .mg-header p:last-child{margin:0;color:rgba(255,255,255,.8);line-height:1.58;max-width:40ch;}',
      '#view-mein-gebet .mg-list{display:grid;grid-template-columns:1fr;gap:12px;margin:20px 0;}',
      '#view-mein-gebet .mg-card{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:start;gap:12px;padding:19px;border-radius:23px;background:rgba(255,255,255,.065);border:1px solid rgba(226,189,114,.16);}',
      '#view-mein-gebet .mg-index{display:grid;place-items:center;width:40px;height:40px;background:rgba(226,189,114,.12);border-radius:14px;color:#ffe3a2;font-weight:900;font-size:13px;}',
      '#view-mein-gebet .mg-card h3{font-family:"Fredoka",system-ui,sans-serif;margin:0 0 6px;font-size:clamp(19px,5vw,24px);line-height:1.2;}',
      '#view-mein-gebet .mg-card p{margin:0;color:rgba(255,255,255,.68);line-height:1.5;font-size:13px;}',
      '#view-mein-gebet .mg-disclaimer{font-size:12px;color:rgba(255,255,255,.62);line-height:1.55;margin:20px 2px;}',
      '@media(min-width:700px){#view-mein-gebet .mg-list{grid-template-columns:repeat(2,minmax(0,1fr));}}',
      '@media(prefers-reduced-motion:reduce){#view-today #kidsMeinGebetEntry.choice.prayer::before{animation:none!important;}}'
    ].join("\n");
    document.head.appendChild(style);

    var entry=document.createElement("button");
    entry.type="button";
    entry.id="kidsMeinGebetEntry";
    entry.className="choice prayer";
    entry.setAttribute("aria-label","Mein Gebet – Lernbereich öffnen");
    entry.innerHTML='<span class="icon" aria-hidden="true">✦</span><strong>Mein Gebet</strong><small>verstehen · anschauen · lernen</small>';
    grid.appendChild(entry);

    var view=document.createElement("section");
    view.id="view-mein-gebet";
    view.className="view";
    view.setAttribute("aria-labelledby","meinGebetHeading");
    view.innerHTML=
      '<button type="button" class="mg-back" id="kidsMeinGebetBack">← Zurück</button>'+
      '<header class="mg-header"><p class="mg-eyebrow">DĀR AL TAWḤĪD KIDS · Vorschau</p>'+
      '<h2 id="meinGebetHeading">Mein Gebet</h2>'+
      '<p>Wir entdecken gemeinsam, was das Gebet bedeutet, warum wir beten und wie wir es richtig lernen.</p></header>'+
      '<div class="mg-list" aria-label="Geplante Lernbereiche">'+
      '<article class="mg-card"><span class="mg-index">01</span><div><h3>Was ist das Gebet?</h3><p>Einfach erklärt, mit geprüften Quellen und deiner vertrauten Sprecherstimme.</p></div></article>'+
      '<article class="mg-card"><span class="mg-index">02</span><div><h3>Warum beten wir?</h3><p>Die Bedeutung der Ṣalāh kindgerecht verstehen.</p></div></article>'+
      '<article class="mg-card"><span class="mg-index">03</span><div><h3>Wie geht das Gebet?</h3><p>Schritt für Schritt, mit kontrollierten Bewegungen und arabischen Texten.</p></div></article>'+
      '<article class="mg-card"><span class="mg-index">04</span><div><h3>Mein 3D-Gebet</h3><p>Später: Figuren drehen, Bewegungen betrachten und Rezitation üben.</p></div></article>'+
      '</div>'+
      '<p class="mg-disclaimer">Dies ist ausschließlich die Gestaltungs-Vorschau. Gebetsanimationen, Aussagen und Audios werden erst nach fachlicher Prüfung freigeschaltet.</p>';
    shell.appendChild(view);
    function navigate(name){
      if(typeof window.showTab==="function")window.showTab(name);
      else {
        document.querySelectorAll("main.shell > .view").forEach(function(v){v.classList.toggle("active",v.id==="view-"+name)});
        document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.toggle("active",b.dataset.target===name)});
      }
    }
    entry.addEventListener("click",function(){navigate("mein-gebet")});
    document.getElementById("kidsMeinGebetBack").addEventListener("click",function(){navigate("today")});
    document.addEventListener("keydown",function(event){
      if(event.key==="Escape"&&view.classList.contains("active"))navigate("today");
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
  else mount();
})();