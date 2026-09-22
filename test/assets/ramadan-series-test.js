(function(){
"use strict";

if(window.__DAR_RAMADAN_SERIES_TEST_V1)return;
window.__DAR_RAMADAN_SERIES_TEST_V1=true;

var SERIES_URL="/content/ramadan/staging.json";
var PREVIEW_URL="/test/ramadan/?day=1";
var seriesCache=null;

function escHtml(value){
  return String(value==null?"":value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function installStyle(){
  if(document.getElementById("dar-ramadan-series-test-style"))return;
  var style=document.createElement("style");
  style.id="dar-ramadan-series-test-style";
  style.textContent=[
    ".ramadan-series-test-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--gold,#d7b46a) 34%,transparent);background:linear-gradient(145deg,color-mix(in srgb,var(--card,#101820) 90%,#0a1a26 10%),color-mix(in srgb,var(--bg,#050706) 78%,#102637 22%));border-radius:24px;padding:18px;margin:0 0 18px;box-shadow:0 18px 45px rgba(0,0,0,.18)}",
    ".ramadan-series-test-card:before{content:'';position:absolute;inset:-40% auto auto -10%;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,rgba(218,184,108,.15),transparent 68%);pointer-events:none}",
    ".ramadan-series-test-kicker{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2,var(--gold,#d7b46a))}",
    ".ramadan-series-test-badge{display:inline-flex;align-items:center;border:1px solid color-mix(in srgb,var(--gold,#d7b46a) 28%,transparent);border-radius:999px;padding:4px 8px;font-size:9px;letter-spacing:.1em}",
    ".ramadan-series-test-title{margin:8px 0 5px;font-family:var(--font-display,Georgia,serif);font-size:clamp(24px,6vw,34px);line-height:1.08}",
    ".ramadan-series-test-copy{margin:0;color:var(--muted2,var(--muted,#a8ada8));font-size:13px;line-height:1.55}",
    ".ramadan-series-test-progress{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid color-mix(in srgb,var(--gold,#d7b46a) 16%,transparent)}",
    ".ramadan-series-test-progress strong{font-size:13px}",
    ".ramadan-series-test-progress span{font-size:12px;color:var(--gold2,var(--gold,#d7b46a));font-weight:800}",
    ".ramadan-series-test-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}",
    ".ramadan-series-test-btn{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:14px;border:1px solid color-mix(in srgb,var(--gold,#d7b46a) 28%,transparent);background:color-mix(in srgb,var(--card,#101820) 78%,transparent);color:var(--text,#f4efdf);font-weight:780;text-decoration:none;text-align:center;padding:10px 12px}",
    ".ramadan-series-test-btn.is-primary{background:linear-gradient(180deg,#ddc080,#b98e45);color:#14120d;border-color:rgba(238,213,157,.55)}",
    ".ramadan-series-test-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;margin-top:15px}",
    ".ramadan-series-test-day{display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-radius:10px;border:1px solid color-mix(in srgb,var(--gold,#d7b46a) 16%,transparent);background:color-mix(in srgb,var(--card,#101820) 82%,transparent);color:var(--muted2,var(--muted,#a8ada8));text-decoration:none;font-size:11px;font-weight:800}",
    ".ramadan-series-test-day:first-child{border-color:var(--gold,#d7b46a);color:var(--text,#f4efdf);background:color-mix(in srgb,var(--gold,#d7b46a) 12%,var(--card,#101820))}",
    ".ramadan-series-test-note{margin-top:12px;font-size:11px;line-height:1.5;color:var(--muted2,var(--muted,#a8ada8))}",
    ".home-v380-open-row.ramadan-series-test-home{border-color:color-mix(in srgb,var(--gold,#d7b46a) 28%,transparent)!important;background:linear-gradient(135deg,color-mix(in srgb,var(--card,#101820) 90%,#132b3c 10%),color-mix(in srgb,var(--bg,#050706) 86%,#102332 14%))!important}",
    "@media(max-width:720px){.ramadan-series-test-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}",
    "@media(max-width:420px){.ramadan-series-test-actions{grid-template-columns:1fr}.ramadan-series-test-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}"
  ].join("\n");
  (document.head||document.documentElement).appendChild(style);
}

function testHomeRow(){
  return '<button type="button" class="home-v380-open-row ramadan-series-test-home" data-nav="ramadan" aria-label="Ramaḍān 30-Tage-Test öffnen">'
    +'<div class="home-v380-open-row__body">'
    +'<span class="home-v380-kicker">🌙 30-Tage-Test</span>'
    +'<h3 class="home-v380-open-row__title">Ramaḍān-Serie vorbereiten</h3>'
    +'<p class="home-v380-open-row__excerpt">Tag 1–30 · Fortschritt · Abschluss · später iOS, Widget & Apple TV aus einer Quelle</p>'
    +'</div>'
    +'<span class="home-v380-open-row__action" aria-hidden="true">Testen →</span>'
    +'</button>';
}

function dayGrid(total){
  var out="";
  for(var i=1;i<=total;i++){
    out+='<a class="ramadan-series-test-day" href="/test/ramadan/?day='+i+'" aria-label="Testtag '+i+' öffnen">'+String(i).padStart(2,"0")+'</a>';
  }
  return out;
}

function seriesHub(){
  var s=seriesCache;
  var total=(s&&Number(s.plannedDays))||30;
  var status=(s&&s.publicationState)||"draft";
  var current=(s&&s.testMode&&Number(s.testMode.overrideDay))||1;
  return '<section class="ramadan-series-test-card" aria-labelledby="ramadanSeriesTestTitle">'
    +'<div class="ramadan-series-test-kicker"><span>🌙 DĀR AL TAWḤĪD</span><span class="ramadan-series-test-badge">TEST-APP</span></div>'
    +'<h2 class="ramadan-series-test-title" id="ramadanSeriesTestTitle">30 Tage Ramaḍān</h2>'
    +'<p class="ramadan-series-test-copy">Neue Serien-Engine im geschützten Testmodus. Noch keine ungeprüften religiösen Inhalte. Wir prüfen zuerst Navigation, Tageswechsel, Fortschritt und Abschluss.</p>'
    +'<div class="ramadan-series-test-progress"><strong>Aktueller Simulator</strong><span>Tag '+current+' / '+total+' · '+escHtml(status)+'</span></div>'
    +'<div class="ramadan-series-test-actions">'
    +'<a class="ramadan-series-test-btn is-primary" href="'+PREVIEW_URL+'">30-Tage-Test öffnen</a>'
    +'<a class="ramadan-series-test-btn" href="/test/ramadan/?day=30">Abschluss testen</a>'
    +'</div>'
    +'<div class="ramadan-series-test-grid">'+dayGrid(total)+'</div>'
    +'<p class="ramadan-series-test-note">Diese Teststeuerung wird später nicht für normale Nutzer sichtbar sein. Produktion schaltet die Tage automatisch nach Datum frei.</p>'
    +'</section>';
}

async function loadSeries(){
  try{
    var response=await fetch(SERIES_URL,{cache:"no-store"});
    if(!response.ok)return;
    var json=await response.json();
    if(json&&Array.isArray(json.days)&&json.days.length===30){
      seriesCache=json;
      try{if(typeof window.rerender==="function")window.rerender()}catch(e){}
    }
  }catch(e){}
}

function installOverrides(){
  installStyle();

  if(typeof window.renderHomeRamadanRow==="function"&&!window.__darRamadanOriginalHomeRow){
    window.__darRamadanOriginalHomeRow=window.renderHomeRamadanRow;
    window.renderHomeRamadanRow=function(){
      var original="";
      try{original=window.__darRamadanOriginalHomeRow()||""}catch(e){}
      return testHomeRow()+original;
    };
  }

  if(typeof window.renderRamadan==="function"&&!window.__darRamadanOriginalRoute){
    window.__darRamadanOriginalRoute=window.renderRamadan;
    window.renderRamadan=function(){
      var original="";
      try{original=window.__darRamadanOriginalRoute()||""}catch(e){}
      return seriesHub()+original;
    };
  }

  try{if(typeof window.rerender==="function")window.rerender()}catch(e){}
  loadSeries();
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){setTimeout(installOverrides,0)},{once:true});
}else{
  setTimeout(installOverrides,0);
}
})();