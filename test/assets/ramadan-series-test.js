(function(){
"use strict";
if(window.__DAR_RAMADAN_SERIES_TEST_V3)return;
window.__DAR_RAMADAN_SERIES_TEST_V3=true;

var SERIES_URL="/test/content/ramadan/staging.json";
var PREVIEW_URL="/test/ramadan/?day=1";
var seriesCache=null;

function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function call(name,args,fall){
  try{
    var fn=window[name];
    if(typeof fn==="function")return fn.apply(window,args||[]);
  }catch(e){}
  return fall;
}
function isVerifiedDay(day){
  var types=new Set((day&&day.evidence||[]).filter(function(x){return x&&x.verificationStatus==="verified"}).map(function(x){return x.type}));
  return ["quran","sunnah","salaf","dua"].every(function(t){return types.has(t)});
}
function allVerified(){
  return !!(seriesCache&&Array.isArray(seriesCache.days)&&seriesCache.days.length===30&&seriesCache.days.every(isVerifiedDay));
}
function installStyle(){
  if(document.getElementById("dar-ramadan-series-test-style-v3"))return;
  var style=document.createElement("style");
  style.id="dar-ramadan-series-test-style-v3";
  style.textContent=[
    ".home-v380-open-row.ramadan-series-test-home{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,#c59a62 48%,transparent)!important;border-radius:999px!important;background:linear-gradient(90deg,#4b1f26 0%,#6b2932 48%,#4a2025 100%)!important;box-shadow:0 10px 28px rgba(38,11,14,.24),inset 0 1px 0 rgba(255,255,255,.05)!important;padding:16px 20px!important}",
    ".home-v380-open-row.ramadan-series-test-home:before{content:'';position:absolute;left:22px;right:22px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(225,191,137,.7),transparent)}",
    ".ramadan-series-test-home .home-v380-kicker{color:#e2bf8b!important;letter-spacing:.11em!important;font-size:10px!important;font-weight:850!important}",
    ".ramadan-series-test-home .home-v380-open-row__title{color:#fff4e2!important;font-family:var(--font-display,Georgia,serif)!important;font-size:clamp(22px,5.2vw,30px)!important;font-weight:500!important;line-height:1.08!important;margin-top:4px!important}",
    ".ramadan-series-test-home .home-v380-open-row__excerpt{color:#e4d2bc!important;font-size:12.5px!important;line-height:1.45!important;margin-top:5px!important}",
    ".ramadan-series-test-home .home-v380-open-row__action{color:#f0cf9a!important;font-weight:800!important}",
    ".ramadan-v3{--ram-bg:#160d0e;--ram-bg2:#211012;--ram-text:#f5e9d8;--ram-muted:#c8b6a2;--ram-gold:#c99a5e;--ram-line:rgba(201,154,94,.28);--ram-line-soft:rgba(201,154,94,.14);padding:4px 0 24px;color:var(--ram-text)}",
    ".ramadan-v3__hero{padding:24px 0 22px;border-top:1px solid var(--ram-line);border-bottom:1px solid var(--ram-line);background:linear-gradient(180deg,rgba(92,34,41,.22),rgba(42,18,20,.06))}",
    ".ramadan-v3__kicker{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ram-gold);font-weight:850}",
    ".ramadan-v3__title{font-family:var(--font-display,Georgia,serif);font-size:clamp(32px,7vw,46px);font-weight:500;line-height:1.02;margin:7px 0 4px;color:var(--ram-text)}",
    ".ramadan-v3__count{font-family:var(--font-display,Georgia,serif);font-size:clamp(25px,5.5vw,36px);font-weight:500;color:#e5bf88;margin:8px 0 4px}",
    ".ramadan-v3__note{font-size:12.5px;line-height:1.55;color:var(--ram-muted);max-width:680px}",
    ".ramadan-v3__times{display:grid;grid-template-columns:1fr 1px 1fr;gap:18px;align-items:stretch;padding:20px 0;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v3__divider{background:var(--ram-line)}",
    ".ramadan-v3__time-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ram-gold);font-weight:800}",
    ".ramadan-v3__time-value{font-family:var(--font-display,Georgia,serif);font-size:28px;margin:3px 0 2px;color:var(--ram-text)}",
    ".ramadan-v3__time-meta{font-size:12px;color:var(--ram-muted)}",
    ".ramadan-v3__actions{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:16px 0;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v3__action{appearance:none;border:0;border-bottom:1px solid var(--ram-line-soft);background:transparent;color:var(--ram-text);padding:11px 0;text-align:left;font-weight:760;cursor:pointer}",
    ".ramadan-v3__action span{float:right;color:var(--ram-gold)}",
    ".ramadan-v3__section{padding:24px 0 2px}",
    ".ramadan-v3__section-head{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding-bottom:10px;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v3__section-head h3{font-family:var(--font-display,Georgia,serif);font-size:clamp(23px,5vw,31px);font-weight:500;margin:0;color:var(--ram-text)}",
    ".ramadan-v3__section-head span{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ram-gold)}",
    ".ramadan-v3__timeline{position:relative;margin-left:8px;padding-left:24px}",
    ".ramadan-v3__timeline:before{content:'';position:absolute;left:3px;top:18px;bottom:18px;width:1px;background:var(--ram-line)}",
    ".ramadan-v3__event{position:relative;padding:18px 0;border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v3__event:before{content:'';position:absolute;left:-25px;top:25px;width:7px;height:7px;border-radius:50%;background:var(--ram-gold);box-shadow:0 0 0 4px var(--ram-bg)}",
    ".ramadan-v3__date{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ram-gold);font-weight:820}",
    ".ramadan-v3__event h4{font-family:var(--font-display,Georgia,serif);font-size:22px;font-weight:500;margin:5px 0 5px;color:var(--ram-text)}",
    ".ramadan-v3__event p{margin:0;font-size:12.5px;line-height:1.5;color:var(--ram-muted)}",
    ".ramadan-v3__series{padding:24px 0 0;border-top:1px solid var(--ram-line);margin-top:24px}",
    ".ramadan-v3__series-title{font-family:var(--font-display,Georgia,serif);font-size:26px;font-weight:500;margin:0 0 6px;color:var(--ram-text)}",
    ".ramadan-v3__series-copy{font-size:12.5px;line-height:1.55;color:var(--ram-muted);margin:0 0 15px}",
    ".ramadan-v3__series-status{font-size:11px;color:#b8d1b3;margin-bottom:15px}",
    ".ramadan-v3__series-links{display:flex;gap:22px;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--ram-line-soft);border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v3__series-links a{color:#e5bf88;text-decoration:none;font-size:13px;font-weight:780}",
    ".ramadan-v3__days{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));column-gap:10px;row-gap:2px;padding-top:12px}",
    ".ramadan-v3__day{display:block;text-align:center;text-decoration:none;color:var(--ram-muted);font-size:11px;font-weight:720;padding:8px 0;border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v3__day:first-child{color:#f0ce99;border-bottom-color:var(--ram-gold)}",
    "@media(max-width:720px){.ramadan-v3__days{grid-template-columns:repeat(6,minmax(0,1fr))}}",
    "@media(max-width:480px){.ramadan-v3__times{grid-template-columns:1fr;gap:0}.ramadan-v3__divider{width:100%;height:1px;margin:13px 0}.ramadan-v3__actions{grid-template-columns:1fr}.ramadan-v3__days{grid-template-columns:repeat(5,minmax(0,1fr))}}"
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
function buildDays(total){
  var out="";
  for(var i=1;i<=total;i++)out+='<a class="ramadan-v3__day" href="/test/ramadan/?day='+i+'">'+String(i).padStart(2,"0")+'</a>';
  return out;
}
function getSeasonContext(){
  var ctx=call("seasonalIslamicContext",[],null);
  if(ctx)return ctx;
  var next=call("nextHijriEvent",[9,1],null);
  return {phase:"countdown",title:"Ramaḍān & ʿĪd",subtitle:"Islamische Saison",daysLeft:next&&next.diff||null,targetDate:next&&next.gDate||null};
}
function formatDate(date){
  var v=call("formatGregDate",[date],null);
  if(v)return v;
  if(!date)return"";
  try{return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(date))}catch(e){return""}
}
function buildTimes(){
  var t=call("getSuhurIftarTimes",[],null);
  if(!t)return '<div class="ramadan-v3__times"><div><div class="ramadan-v3__time-label">Suḥūr · Fajr</div><div class="ramadan-v3__time-value">—</div><div class="ramadan-v3__time-meta">Standort in Gebetszeiten setzen</div></div><div class="ramadan-v3__divider"></div><div><div class="ramadan-v3__time-label">Iftār · Maghrib</div><div class="ramadan-v3__time-value">—</div><div class="ramadan-v3__time-meta">Fastenbrechen</div></div></div>';
  var city=esc(t.city||"");
  var suhur=call("formatPrayerHour",[t.suhur.time],String(t.suhur.time||"—"));
  var iftar=call("formatPrayerHour",[t.iftar.time],String(t.iftar.time||"—"));
  return '<div class="ramadan-v3__times"><div><div class="ramadan-v3__time-label">Suḥūr · Fajr</div><div class="ramadan-v3__time-value">'+esc(suhur)+'</div><div class="ramadan-v3__time-meta">'+city+'</div></div><div class="ramadan-v3__divider"></div><div><div class="ramadan-v3__time-label">Iftār · Maghrib</div><div class="ramadan-v3__time-value">'+esc(iftar)+'</div><div class="ramadan-v3__time-meta">Fastenbrechen</div></div></div>';
}
function buildEvents(){
  var events=call("calendarEventsForYear",[],[])||[];
  events=events.filter(function(ev){return ev&&(ev.m===9||ev.m===10||(ev.m===12&&ev.d>=8))}).slice(0,4);
  if(!events.length)return "";
  return '<section class="ramadan-v3__section"><div class="ramadan-v3__section-head"><h3>Termine in dieser Saison</h3><span>geordnet</span></div><div class="ramadan-v3__timeline">'
    +events.map(function(ev){
      var month=call("hijriMonthName",[ev.m],"");
      var diff=typeof ev.diff==="number"&&ev.diff>=0?"Noch ca. "+ev.diff+" Tage. ":"";
      return '<article class="ramadan-v3__event"><div class="ramadan-v3__date">'+esc(formatDate(ev.gDate))+' · '+esc(ev.d)+'. '+esc(month)+'</div><h4>'+esc(ev.name||"")+'</h4><p>'+esc(diff+(ev.note||""))+'</p></article>';
    }).join("")+'</div></section>';
}
function buildSeries(){
  var total=seriesCache&&seriesCache.plannedDays||30;
  return '<section class="ramadan-v3__series"><div class="ramadan-v3__kicker">30 Tage mit Qurʾān & Sunnah</div><h3 class="ramadan-v3__series-title">Tawḥīd, Īmān, Herz und Familie</h3><p class="ramadan-v3__series-copy">Die komplette Tagesreihe ist für den Test vorbereitet. Jeder Tag enthält Qurʾān, authentische Sunnah, Athar, Duʿāʾ und eine konkrete islamische Handlung.</p><div class="ramadan-v3__series-status">'+(allVerified()?'✓ 30/30 Tage inhaltlich geprüft':'Quellenprüfung wird geladen')+'</div><div class="ramadan-v3__series-links"><a href="'+PREVIEW_URL+'">Tag 1 lesen →</a><a href="/test/ramadan/?day=30">Tag 30 prüfen →</a></div><div class="ramadan-v3__days">'+buildDays(total)+'</div></section>';
}
function overview(){
  var ctx=getSeasonContext();
  var headline=ctx.phase==="countdown"&&ctx.daysLeft?("Noch "+ctx.daysLeft+" Tage"):ctx.phase==="ramadan"?("Tag "+ctx.day):esc(ctx.title||"Ramaḍān & ʿĪd");
  var startNote="";
  if(ctx.phase==="countdown"&&ctx.targetDate)startNote="Geschätzter Beginn: "+formatDate(ctx.targetDate)+". Lokale Mondsichtung kann abweichen.";
  else startNote=ctx.subtitle||"";
  var header=call("setHeader",["Ramaḍān & ʿĪd","Suḥūr, Iftār, wichtige Termine und die 30-Tage-Serie.","Saison"],"");
  return header+'<div class="ramadan-v3"><section class="ramadan-v3__hero"><div class="ramadan-v3__kicker">Ramaḍān & ʿĪd</div><h2 class="ramadan-v3__title">Ramaḍān & ʿĪd</h2><div class="ramadan-v3__count">'+esc(headline)+'</div><div class="ramadan-v3__note">'+esc(startNote)+'</div></section>'
    +buildTimes()
    +'<div class="ramadan-v3__actions"><button class="ramadan-v3__action" type="button" data-nav="prayer">Gebetszeiten & Standort <span>→</span></button><button class="ramadan-v3__action" type="button" data-nav="calendar">Kalender <span>→</span></button></div>'
    +buildEvents()+buildSeries()+'</div>';
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
  if(typeof window.renderHomeRamadanRow==="function"&&!window.__darRamadanOriginalHomeRowV3){
    window.__darRamadanOriginalHomeRowV3=window.renderHomeRamadanRow;
    window.renderHomeRamadanRow=function(){return homeRow()};
  }
  if(typeof window.renderRamadan==="function"&&!window.__darRamadanOriginalRouteV3){
    window.__darRamadanOriginalRouteV3=window.renderRamadan;
    window.renderRamadan=function(){return overview()};
  }
  try{if(typeof window.rerender==="function")window.rerender()}catch(e){}
  loadSeries();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(install,0)},{once:true});
else setTimeout(install,0);
})();