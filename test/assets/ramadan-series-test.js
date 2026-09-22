(function(){
"use strict";
if(window.__DAR_RAMADAN_SERIES_TEST_V4)return;
window.__DAR_RAMADAN_SERIES_TEST_V4=true;

var SERIES_URL="/test/content/ramadan/staging.json";
var PREVIEW_URL="/test/ramadan/?day=1";
var seriesCache=null;
var tickerTimer=null;

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
  if(document.getElementById("dar-ramadan-series-test-style-v4"))return;
  var style=document.createElement("style");
  style.id="dar-ramadan-series-test-style-v4";
  style.textContent=[
    ".home-v380-open-row.ramadan-series-test-home{position:relative!important;overflow:hidden!important;border:0!important;border-radius:999px!important;background:linear-gradient(105deg,#54232a 0%,#6d3037 50%,#4b2026 100%)!important;box-shadow:inset 0 0 0 1px rgba(214,171,111,.55),inset 0 1px 0 rgba(255,255,255,.06),0 12px 30px rgba(40,12,16,.24)!important;padding:17px 22px!important;margin-top:12px!important}",
    ".home-v380-open-row.ramadan-series-test-home:before,.home-v380-open-row.ramadan-series-test-home:after{display:none!important;content:none!important}",
    ".ramadan-series-test-home .home-v380-kicker{color:#e7c58e!important;letter-spacing:.13em!important;font-size:9.5px!important;font-weight:900!important}",
    ".ramadan-series-test-home .home-v380-open-row__title{color:#fff3df!important;font-family:var(--font-display,Georgia,serif)!important;font-size:clamp(21px,5vw,29px)!important;font-weight:500!important;line-height:1.08!important;margin:4px 0 4px!important}",
    ".ramadan-series-test-home .home-v380-open-row__excerpt{color:#e8d4bd!important;font-size:12px!important;line-height:1.38!important;margin:0!important}",
    ".ramadan-series-test-home .home-v380-open-row__action{color:#f2cf97!important;font-size:12px!important;font-weight:850!important;white-space:nowrap!important}",

    ".ramadan-v4{--ram-bg:#160c0d;--ram-bg2:#211012;--ram-bg3:#2a1418;--ram-text:#f6ead9;--ram-muted:#cdb9a2;--ram-gold:#d0a05f;--ram-gold2:#e4bd82;--ram-line:rgba(208,160,95,.30);--ram-line-soft:rgba(208,160,95,.14);position:relative;padding:0 0 28px;color:var(--ram-text);overflow:hidden}",
    ".ramadan-v4__hero{position:relative;overflow:hidden;padding:25px 0 24px;border-top:1px solid var(--ram-line);border-bottom:1px solid var(--ram-line);background:radial-gradient(circle at 86% 10%,rgba(208,160,95,.16),transparent 31%),linear-gradient(180deg,rgba(104,38,45,.24),rgba(33,16,18,.05))}",
    ".ramadan-v4__hero-copy{position:relative;z-index:2;max-width:72%}",
    ".ramadan-v4__art{position:absolute;right:-12px;bottom:-9px;width:min(46%,300px);height:auto;opacity:.30;pointer-events:none;filter:drop-shadow(0 8px 16px rgba(0,0,0,.16))}",
    ".ramadan-v4__kicker{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--ram-gold);font-weight:900}",
    ".ramadan-v4__title{font-family:var(--font-display,Georgia,serif);font-size:clamp(33px,7vw,48px);font-weight:500;line-height:1.03;margin:7px 0 4px;color:var(--ram-text)}",
    ".ramadan-v4__count{font-family:var(--font-display,Georgia,serif);font-size:clamp(25px,5.6vw,37px);font-weight:500;color:var(--ram-gold2);margin:9px 0 5px}",
    ".ramadan-v4__note{font-size:12.5px;line-height:1.55;color:var(--ram-muted);max-width:580px}",

    ".ramadan-v4__calendar-priority{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;padding:17px 0;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v4__calendar-label{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--ram-gold);font-weight:900}",
    ".ramadan-v4__calendar-title{font-family:var(--font-display,Georgia,serif);font-size:20px;line-height:1.15;margin:4px 0 3px;color:var(--ram-text)}",
    ".ramadan-v4__calendar-meta{font-size:11.5px;line-height:1.45;color:var(--ram-muted)}",
    ".ramadan-v4__calendar-open{appearance:none;border:0;background:transparent;color:var(--ram-gold2);font-size:12px;font-weight:850;padding:8px 0;cursor:pointer;white-space:nowrap}",

    ".ramadan-v4__ticker{display:flex;align-items:center;gap:10px;min-height:38px;padding:9px 0;border-bottom:1px solid var(--ram-line-soft);overflow:hidden}",
    ".ramadan-v4__ticker-live{display:inline-flex;align-items:center;gap:5px;color:#f1d09b;font-size:9px;letter-spacing:.11em;font-weight:900;white-space:nowrap}",
    ".ramadan-v4__ticker-dot{width:6px;height:6px;border-radius:50%;background:#d7a45d;box-shadow:0 0 0 4px rgba(215,164,93,.10),0 0 12px rgba(215,164,93,.35)}",
    ".ramadan-v4__ticker-text{font-size:11.5px;color:var(--ram-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",

    ".ramadan-v4__times{display:grid!important;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr)!important;gap:17px!important;align-items:stretch!important;padding:20px 0!important;border-bottom:1px solid var(--ram-line)!important}",
    ".ramadan-v4__divider{background:var(--ram-line);width:1px}",
    ".ramadan-v4__time{min-width:0}",
    ".ramadan-v4__time-label{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ram-gold);font-weight:900}",
    ".ramadan-v4__time-value{font-family:var(--font-display,Georgia,serif);font-size:clamp(26px,7vw,34px);line-height:1;margin:8px 0 5px;color:var(--ram-text)}",
    ".ramadan-v4__time-meta{font-size:11.5px;color:var(--ram-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",

    ".ramadan-v4__actions{display:grid;grid-template-columns:1fr 1fr;column-gap:20px;padding:9px 0 15px;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v4__action{appearance:none;border:0;border-bottom:1px solid var(--ram-line-soft);background:transparent;color:var(--ram-text);padding:12px 0;text-align:left;font-size:12.5px;font-weight:780;cursor:pointer}",
    ".ramadan-v4__action span{float:right;color:var(--ram-gold)}",

    ".ramadan-v4__section{padding:24px 0 1px}",
    ".ramadan-v4__section-head{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding-bottom:10px;border-bottom:1px solid var(--ram-line)}",
    ".ramadan-v4__section-head h3{font-family:var(--font-display,Georgia,serif);font-size:clamp(23px,5vw,31px);font-weight:500;margin:0;color:var(--ram-text)}",
    ".ramadan-v4__section-head span{font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--ram-gold);white-space:nowrap}",
    ".ramadan-v4__timeline{position:relative;margin-left:7px;padding-left:25px}",
    ".ramadan-v4__timeline:before{content:'';position:absolute;left:3px;top:19px;bottom:18px;width:1px;background:var(--ram-line)}",
    ".ramadan-v4__event{position:relative;padding:18px 0;border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v4__event:before{content:'';position:absolute;left:-25px;top:25px;width:7px;height:7px;border-radius:50%;background:var(--ram-gold);box-shadow:0 0 0 4px var(--ram-bg)}",
    ".ramadan-v4__date{font-size:9.5px;letter-spacing:.075em;text-transform:uppercase;color:var(--ram-gold);font-weight:900}",
    ".ramadan-v4__event h4{font-family:var(--font-display,Georgia,serif);font-size:21px;font-weight:500;margin:5px 0 5px;color:var(--ram-text)}",
    ".ramadan-v4__event p{margin:0;font-size:12px;line-height:1.5;color:var(--ram-muted)}",

    ".ramadan-v4__series{padding:25px 0 0;border-top:1px solid var(--ram-line);margin-top:25px}",
    ".ramadan-v4__series-title{font-family:var(--font-display,Georgia,serif);font-size:clamp(24px,5vw,29px);font-weight:500;margin:4px 0 7px;color:var(--ram-text)}",
    ".ramadan-v4__series-copy{font-size:12px;line-height:1.55;color:var(--ram-muted);margin:0 0 13px}",
    ".ramadan-v4__series-status{font-size:10.5px;color:#b7d2b1;margin:0 0 13px}",
    ".ramadan-v4__series-links{display:flex;gap:22px;flex-wrap:wrap;padding:11px 0;border-top:1px solid var(--ram-line-soft);border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v4__series-links a{color:var(--ram-gold2);text-decoration:none;font-size:12.5px;font-weight:820}",
    ".ramadan-v4__days{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));column-gap:10px;row-gap:2px;padding-top:12px}",
    ".ramadan-v4__day{display:block;text-align:center;text-decoration:none;color:var(--ram-muted);font-size:10.5px;font-weight:760;padding:8px 0;border-bottom:1px solid var(--ram-line-soft)}",
    ".ramadan-v4__day:first-child{color:#f0ce99;border-bottom-color:var(--ram-gold)}",

    "@media(max-width:720px){.ramadan-v4__days{grid-template-columns:repeat(6,minmax(0,1fr))}.ramadan-v4__hero-copy{max-width:78%}.ramadan-v4__art{width:45%;opacity:.23}}",
    "@media(max-width:480px){.ramadan-v4__hero-copy{max-width:82%}.ramadan-v4__art{right:-34px;width:58%;opacity:.18}.ramadan-v4__calendar-priority{grid-template-columns:1fr auto}.ramadan-v4__times{grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr)!important;gap:12px!important}.ramadan-v4__actions{grid-template-columns:1fr 1fr;gap:12px}.ramadan-v4__days{grid-template-columns:repeat(5,minmax(0,1fr))}.ramadan-v4__time-value{font-size:27px}.ramadan-v4__action{font-size:11.5px}}"
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

function getSeasonContext(){
  var ctx=call("seasonalIslamicContext",[],null);
  if(ctx)return ctx;
  var next=call("nextHijriEvent",[9,1],null);
  return {phase:"countdown",title:"Ramaḍān & ʿĪd",subtitle:"Islamische Saison",daysLeft:next&&next.diff||null,targetDate:next&&next.gDate||null};
}
function formatDate(date){
  var v=call("formatGregDate",[date],null);
  if(v)return v;
  if(!date)return "";
  try{return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(date))}catch(e){return ""}
}
function seasonEvents(){
  var events=call("calendarEventsForYear",[],[])||[];
  return events.filter(function(ev){return ev&&(ev.m===9||ev.m===10||(ev.m===12&&ev.d>=8))}).slice(0,4);
}
function nextSeasonEvent(){
  var list=seasonEvents();
  for(var i=0;i<list.length;i++)if(typeof list[i].diff==="number"&&list[i].diff>=0)return list[i];
  return list[0]||null;
}
function mosqueArt(){
  return '<svg class="ramadan-v4__art" viewBox="0 0 360 210" aria-hidden="true" focusable="false">'
    +'<g fill="none" stroke="rgba(236,193,126,.78)" stroke-width="2">'
    +'<path d="M255 29a33 33 0 1 0 29 48 27 27 0 1 1-29-48Z" fill="rgba(236,193,126,.18)" stroke="none"/>'
    +'<path d="M40 181h290M82 181v-49h22v49M258 181v-88h14v88M275 181v-107h10v107"/>'
    +'<path d="M120 181v-44c0-23 19-42 42-42s42 19 42 42v44M130 111c9-14 20-22 32-22s23 8 32 22"/>'
    +'<path d="M148 89c4-12 10-18 14-18s10 6 14 18M160 71v-16M156 55h8"/>'
    +'<path d="M210 181v-29c0-14 11-25 25-25s25 11 25 25v29M221 132c4-8 9-12 14-12s10 4 14 12"/>'
    +'<path d="M87 132c3-8 8-12 12-12s9 4 12 12"/>'
    +'<path d="M258 93h14M275 74h10M252 113h26"/>'
    +'</g><g fill="rgba(236,193,126,.16)"><circle cx="52" cy="49" r="2"/><circle cx="104" cy="34" r="1.5"/><circle cx="316" cy="43" r="1.8"/><circle cx="326" cy="87" r="1.2"/><circle cx="226" cy="49" r="1.1"/></g></svg>';
}
function buildCalendarPriority(){
  var ev=nextSeasonEvent();
  if(!ev)return "";
  var month=call("hijriMonthName",[ev.m],"");
  return '<section class="ramadan-v4__calendar-priority"><div><div class="ramadan-v4__calendar-label">Kalender · nächster Termin</div><div class="ramadan-v4__calendar-title">'+esc(ev.name||"Ramaḍān")+'</div><div class="ramadan-v4__calendar-meta">'+esc(formatDate(ev.gDate))+' · '+esc(ev.d)+'. '+esc(month)+'</div></div><button type="button" class="ramadan-v4__calendar-open" data-nav="calendar">Kalender öffnen →</button></section>';
}
function buildTimes(){
  var t=call("getSuhurIftarTimes",[],null);
  if(!t){
    return '<section class="ramadan-v4__times"><div class="ramadan-v4__time"><div class="ramadan-v4__time-label">Suḥūr · Fajr</div><div class="ramadan-v4__time-value">—</div><div class="ramadan-v4__time-meta">Standort setzen</div></div><div class="ramadan-v4__divider"></div><div class="ramadan-v4__time"><div class="ramadan-v4__time-label">Iftār · Maghrib</div><div class="ramadan-v4__time-value">—</div><div class="ramadan-v4__time-meta">Fastenbrechen</div></div></section>';
  }
  var city=esc(t.city||"");
  var suhur=call("formatPrayerHour",[t.suhur.time],String(t.suhur.time||"—"));
  var iftar=call("formatPrayerHour",[t.iftar.time],String(t.iftar.time||"—"));
  return '<section class="ramadan-v4__times"><div class="ramadan-v4__time"><div class="ramadan-v4__time-label">Suḥūr · Fajr</div><div class="ramadan-v4__time-value">'+esc(suhur)+'</div><div class="ramadan-v4__time-meta">'+city+'</div></div><div class="ramadan-v4__divider"></div><div class="ramadan-v4__time"><div class="ramadan-v4__time-label">Iftār · Maghrib</div><div class="ramadan-v4__time-value">'+esc(iftar)+'</div><div class="ramadan-v4__time-meta">Fastenbrechen</div></div></section>';
}
function buildEvents(){
  var events=seasonEvents();
  if(!events.length)return "";
  return '<section class="ramadan-v4__section"><div class="ramadan-v4__section-head"><h3>Termine in dieser Saison</h3><span>Kalender</span></div><div class="ramadan-v4__timeline">'
    +events.map(function(ev){
      var month=call("hijriMonthName",[ev.m],"");
      var diff=typeof ev.diff==="number"&&ev.diff>=0?"Noch ca. "+ev.diff+" Tage. ":"";
      return '<article class="ramadan-v4__event"><div class="ramadan-v4__date">'+esc(formatDate(ev.gDate))+' · '+esc(ev.d)+'. '+esc(month)+'</div><h4>'+esc(ev.name||"")+'</h4><p>'+esc(diff+(ev.note||""))+'</p></article>';
    }).join("")+'</div></section>';
}
function buildDays(total){
  var out="";
  for(var i=1;i<=total;i++)out+='<a class="ramadan-v4__day" href="/test/ramadan/?day='+i+'">'+String(i).padStart(2,"0")+'</a>';
  return out;
}
function buildSeries(){
  var total=seriesCache&&seriesCache.plannedDays||30;
  return '<section class="ramadan-v4__series"><div class="ramadan-v4__kicker">30 Tage mit Qurʾān & Sunnah</div><h3 class="ramadan-v4__series-title">Tawḥīd, Īmān, Herz und Familie</h3><p class="ramadan-v4__series-copy">Jeder Tag enthält Qurʾān, authentische Sunnah, Athar, Duʿāʾ und eine konkrete islamische Handlung.</p><div class="ramadan-v4__series-status">'+(allVerified()?'✓ 30/30 Tage inhaltlich geprüft':'Quellenprüfung wird geladen')+'</div><div class="ramadan-v4__series-links"><a href="'+PREVIEW_URL+'">Tag 1 lesen →</a><a href="/test/ramadan/?day=30">Tag 30 prüfen →</a></div><div class="ramadan-v4__days">'+buildDays(total)+'</div></section>';
}
function tickerSeed(){
  var ev=nextSeasonEvent();
  if(ev)return "Nächster Termin: "+(ev.name||"Ramaḍān")+" · "+formatDate(ev.gDate);
  return allVerified()?"30-Tage-Serie vollständig geprüft":"Ramaḍān-Vorbereitung";
}
function parseClock(value){
  var m=String(value||"").match(/(\d{1,2}):(\d{2})/);
  if(!m)return null;
  return {h:Number(m[1]),m:Number(m[2])};
}
function clockCountdown(label,value,extraDay){
  var p=parseClock(value);if(!p)return null;
  var now=new Date(),target=new Date(now);
  target.setHours(p.h,p.m,0,0);
  if(extraDay||target<=now)target.setDate(target.getDate()+1);
  var sec=Math.max(0,Math.floor((target-now)/1000));
  var hh=String(Math.floor(sec/3600)).padStart(2,"0");
  var mm=String(Math.floor((sec%3600)/60)).padStart(2,"0");
  var ss=String(sec%60).padStart(2,"0");
  return label+" in "+hh+":"+mm+":"+ss;
}
function updateTicker(){
  var node=document.getElementById("ramadanLiveTickerText");
  if(!node)return;
  var t=call("getSuhurIftarTimes",[],null);
  if(!t){node.textContent=tickerSeed();return}
  var fajr=call("formatPrayerHour",[t.suhur.time],String(t.suhur.time||""));
  var maghrib=call("formatPrayerHour",[t.iftar.time],String(t.iftar.time||""));
  var f=parseClock(fajr),m=parseClock(maghrib),now=new Date(),mins=now.getHours()*60+now.getMinutes();
  var fmins=f?f.h*60+f.m:null,mmins=m?m.h*60+m.m:null;
  var text=null;
  if(fmins!=null&&mins<fmins)text=clockCountdown("Suḥūr/Fajr",fajr,false);
  else if(mmins!=null&&mins<mmins)text=clockCountdown("Iftār/Maghrib",maghrib,false);
  else text=clockCountdown("Suḥūr/Fajr morgen",fajr,true);
  node.textContent=text||tickerSeed();
}
function ensureTicker(){
  if(tickerTimer)return;
  tickerTimer=setInterval(updateTicker,1000);
  updateTicker();
}
function overview(){
  var ctx=getSeasonContext();
  var headline=ctx.phase==="countdown"&&ctx.daysLeft?("Noch "+ctx.daysLeft+" Tage"):ctx.phase==="ramadan"?("Tag "+ctx.day):String(ctx.title||"Ramaḍān & ʿĪd");
  var startNote="";
  if(ctx.phase==="countdown"&&ctx.targetDate)startNote="Geschätzter Beginn: "+formatDate(ctx.targetDate)+". Lokale Mondsichtung kann abweichen.";
  else startNote=ctx.subtitle||"";
  var header=call("setHeader",["Ramaḍān & ʿĪd","Kalender, Gebetszeiten und 30-Tage-Serie.","Saison"],"");
  setTimeout(updateTicker,40);
  return header+'<div class="ramadan-v4"><section class="ramadan-v4__hero"><div class="ramadan-v4__hero-copy"><div class="ramadan-v4__kicker">Ramaḍān & ʿĪd</div><h2 class="ramadan-v4__title">Ramaḍān & ʿĪd</h2><div class="ramadan-v4__count">'+esc(headline)+'</div><div class="ramadan-v4__note">'+esc(startNote)+'</div></div>'+mosqueArt()+'</section>'
    +buildCalendarPriority()
    +'<div class="ramadan-v4__ticker"><span class="ramadan-v4__ticker-live"><span class="ramadan-v4__ticker-dot"></span>LIVE</span><span id="ramadanLiveTickerText" class="ramadan-v4__ticker-text">'+esc(tickerSeed())+'</span></div>'
    +buildTimes()
    +'<div class="ramadan-v4__actions"><button class="ramadan-v4__action" type="button" data-nav="calendar">Kalender <span>→</span></button><button class="ramadan-v4__action" type="button" data-nav="prayer">Gebetszeiten & Standort <span>→</span></button></div>'
    +buildEvents()+buildSeries()+'</div>';
}
async function loadSeries(){
  try{
    var r=await fetch(SERIES_URL,{cache:"no-store"});if(!r.ok)return;
    var j=await r.json();
    if(j&&Array.isArray(j.days)&&j.days.length===30){seriesCache=j;try{if(typeof window.rerender==="function")window.rerender()}catch(e){}}
  }catch(e){}
}
function install(){
  installStyle();
  if(typeof window.renderHomeRamadanRow==="function"&&!window.__darRamadanOriginalHomeRowV4){
    window.__darRamadanOriginalHomeRowV4=window.renderHomeRamadanRow;
    window.renderHomeRamadanRow=function(){return homeRow()};
  }
  if(typeof window.renderRamadan==="function"&&!window.__darRamadanOriginalRouteV4){
    window.__darRamadanOriginalRouteV4=window.renderRamadan;
    window.renderRamadan=function(){return overview()};
  }
  ensureTicker();
  try{if(typeof window.rerender==="function")window.rerender()}catch(e){}
  loadSeries();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(install,0)},{once:true});
else setTimeout(install,0);
})();