(function(){
"use strict";
if(window.__DAR_RAMADAN_SERIES_TEST_V2)return;
window.__DAR_RAMADAN_SERIES_TEST_V2=true;

var SERIES_URL="/test/content/ramadan/staging.json";
var PREVIEW_URL="/test/ramadan/?day=1";
var seriesCache=null;

function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function isVerifiedDay(day){
  var types=new Set((day&&day.evidence||[]).filter(function(x){return x&&x.verificationStatus==="verified"}).map(function(x){return x.type}));
  return ["quran","sunnah","salaf","dua"].every(function(t){return types.has(t)});
}
function allVerified(){
  return !!(seriesCache&&Array.isArray(seriesCache.days)&&seriesCache.days.length===30&&seriesCache.days.every(isVerifiedDay));
}
function installStyle(){
  if(document.getElementById("dar-ramadan-series-test-style-v2"))return;
  var style=document.createElement("style");
  style.id="dar-ramadan-series-test-style-v2";
  style.textContent=[
    ".ramadan-series-test-home{border-top:1px solid color-mix(in srgb,var(--gold,#d4b36c) 24%,transparent)!important;border-bottom:1px solid color-mix(in srgb,var(--gold,#d4b36c) 24%,transparent)!important;border-left:0!important;border-right:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}",
    ".ramadan-series-hub{margin:0 0 28px;padding:4px 0 24px;border-bottom:1px solid color-mix(in srgb,var(--gold,#d4b36c) 24%,transparent)}",
    ".ramadan-series-hub__top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:10px 0 18px;border-bottom:1px solid color-mix(in srgb,var(--gold,#d4b36c) 15%,transparent)}",
    ".ramadan-series-hub__kicker{display:block;font-size:11px;color:var(--gold2,var(--gold,#d4b36c));margin-bottom:7px}",
    ".ramadan-series-hub h2{font-family:var(--font-display,Georgia,serif);font-size:clamp(25px,5vw,36px);font-weight:500;line-height:1.1;margin:0 0 7px}",
    ".ramadan-series-hub p{margin:0;color:var(--muted2,var(--muted,#aaa));font-size:13px;line-height:1.6}",
    ".ramadan-series-hub__status{font-size:11px;color:#aac8aa;white-space:nowrap;padding-top:3px}",
    ".ramadan-series-hub__actions{display:flex;gap:18px;flex-wrap:wrap;padding:15px 0;border-bottom:1px solid color-mix(in srgb,var(--gold,#d4b36c) 15%,transparent)}",
    ".ramadan-series-hub__actions a{color:var(--gold2,var(--gold,#d4b36c));font-size:13px;font-weight:760;text-decoration:none}",
    ".ramadan-series-hub__days{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));column-gap:12px;row-gap:3px;padding-top:12px}",
    ".ramadan-series-hub__day{display:block;text-align:center;text-decoration:none;color:var(--muted2,var(--muted,#aaa));font-size:11px;font-weight:720;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--gold,#d4b36c) 12%,transparent)}",
    ".ramadan-series-hub__day:first-child{color:var(--gold2,var(--gold,#d4b36c));border-bottom-color:var(--gold,#d4b36c)}",
    "@media(max-width:720px){.ramadan-series-hub__days{grid-template-columns:repeat(6,minmax(0,1fr))}.ramadan-series-hub__top{display:block}.ramadan-series-hub__status{margin-top:10px}}",
    "@media(max-width:420px){.ramadan-series-hub__days{grid-template-columns:repeat(5,minmax(0,1fr))}}"
  ].join("\n");
  (document.head||document.documentElement).appendChild(style);
}

function homeRow(){
  return '<button type="button" class="home-v380-open-row ramadan-series-test-home" data-nav="ramadan" aria-label="Ramaḍān 30-Tage-Serie öffnen">'
    +'<div class="home-v380-open-row__body">'
    +'<span class="home-v380-kicker">Ramaḍān · 30 Tage</span>'
    +'<h3 class="home-v380-open-row__title">Tawḥīd, Īmān, Herz und Familie</h3>'
    +'<p class="home-v380-open-row__excerpt">Qurʾān · authentische Sunnah · Athar · Duʿāʾ · tägliche Handlung</p>'
    +'</div><span class="home-v380-open-row__action" aria-hidden="true">Öffnen →</span></button>';
}
function days(total){
  var out="";
  for(var i=1;i<=total;i++)out+='<a class="ramadan-series-hub__day" href="/test/ramadan/?day='+i+'">'+String(i).padStart(2,"0")+'</a>';
  return out;
}
function hub(){
  var s=seriesCache,total=s&&s.plannedDays||30,verified=allVerified();
  return '<section class="ramadan-series-hub">'
    +'<div class="ramadan-series-hub__top"><div><span class="ramadan-series-hub__kicker">DĀR AL TAWḤĪD · Test-App</span>'
    +'<h2>30 Tage Ramaḍān</h2><p>Die vollständige Serie ist vorbereitet. In der Test-App bleiben Tageswechsel und Freigabe bewusst manuell simulierbar.</p></div>'
    +'<div class="ramadan-series-hub__status">'+(verified?'✓ 30/30 inhaltlich geprüft':'Quellenprüfung läuft')+'</div></div>'
    +'<div class="ramadan-series-hub__actions"><a href="'+PREVIEW_URL+'">Serie lesen →</a><a href="/test/ramadan/?day=30">Tag 30 prüfen →</a></div>'
    +'<div class="ramadan-series-hub__days">'+days(total)+'</div></section>';
}
async function loadSeries(){
  try{
    var r=await fetch(SERIES_URL,{cache:"no-store"});
    if(!r.ok)return;
    var j=await r.json();
    if(j&&Array.isArray(j.days)&&j.days.length===30){seriesCache=j;try{if(typeof window.rerender==="function")window.rerender()}catch(e){}}
  }catch(e){}
}
function install(){
  installStyle();
  if(typeof window.renderHomeRamadanRow==="function"&&!window.__darRamadanOriginalHomeRowV2){
    window.__darRamadanOriginalHomeRowV2=window.renderHomeRamadanRow;
    window.renderHomeRamadanRow=function(){
      var original="";try{original=window.__darRamadanOriginalHomeRowV2()||""}catch(e){}
      return homeRow()+original;
    };
  }
  if(typeof window.renderRamadan==="function"&&!window.__darRamadanOriginalRouteV2){
    window.__darRamadanOriginalRouteV2=window.renderRamadan;
    window.renderRamadan=function(){
      var original="";try{original=window.__darRamadanOriginalRouteV2()||""}catch(e){}
      return hub()+original;
    };
  }
  try{if(typeof window.rerender==="function")window.rerender()}catch(e){}
  loadSeries();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(install,0)},{once:true});
else setTimeout(install,0);
})();