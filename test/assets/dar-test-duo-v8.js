/* DAR TEST · V8 adaptive controls. No native changes, no live route and no data migration. */
(function(w,d){
"use strict";
var path=String(w.location.pathname||"");
if(path!=="/test"&&path.indexOf("/test/")!==0)return;
if(w.__DAR_TEST_DUO_V8)return;
w.__DAR_TEST_DUO_V8=true;
var KEY="darTestDuoV8Enabled";
var NAV_KEY="darDuoNavChoiceV8";
var root=d.documentElement;
var params=new URLSearchParams(w.location.search);
var choice=params.get("duov8");
if(choice==="off"||choice==="on"){try{w.localStorage.setItem(KEY,choice==="on"?"1":"0")}catch(_){}}
function enabled(){try{return w.localStorage.getItem(KEY)!=="0"}catch(_){return choice!=="off"}}
if(!enabled())return;
root.classList.add("dar-test-duo-v8");
var symbols={
 language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3.5-3 14.5 0 18M12 3c3 3.5 3 14.5 0 18"/>',
 account:'<circle cx="12" cy="8" r="3.2"/><path d="M5 20c.2-4 3-6 7-6s6.8 2 7 6"/>',
 palette:'<path d="M12 3a9 9 0 0 0 0 18h1c1.5 0 2.2-1.7 1.2-2.8-.7-.9 0-2.2 1.2-2.2h2A5 5 0 0 0 22 11c0-4-4-8-10-8Z"/><path d="M7 10h.01M11 7h.01M16 8h.01"/>'
};
var LANGUAGES=[["de","Deutsch"],["ar","العربية"],["en","English"],["tr","Türkçe"],["ku","Kurmancî"],["ckb","سۆرانی"],["bs","Bosanski"],["fr","Français"],["es","Español"]];
var NAV=[["auto","Automatisch"],["left","Links"],["bottom","Unten"],["right","Rechts"]];
var SETTINGS=[["notifications","Benachrichtigungen"],["location","Standort"],["appearance","Farben & Erscheinungsbild"],["font","Schrift & Lesbarkeit"],["icon","App-Icon"]];
var framePending=false,started=false;
function metrics(){
var el=d.documentElement,v=w.visualViewport;
var width=Math.round(el.clientWidth||w.innerWidth||(v&&v.width)||0);
var height=Math.round(el.clientHeight||w.innerHeight||(v&&v.height)||0);
var input=d.activeElement;
var keyboard=!!(v&&height-(v.height||height)>140&&input&&/INPUT|TEXTAREA|SELECT/.test(input.tagName||""));
return {width:width,height:height,keyboard:keyboard};
}
function syncMode(){
var m=metrics(),isOpen=m.width>=760&&m.height>=560&&!m.keyboard;
root.setAttribute("data-dar-duo-viewport",isOpen?"open":m.width>=600?"medium":"compact");
try{if(w.DarAdaptiveNavPlacement&&typeof w.DarAdaptiveNavPlacement.apply==="function")w.DarAdaptiveNavPlacement.apply()}catch(_){}
}
function openLanguage(){
if(w.DARAdultLanguagePickerV1&&typeof w.DARAdultLanguagePickerV1.open==="function"){
w.DARAdultLanguagePickerV1.open("settings",d.activeElement);
return;
}
var node=d.querySelector("[data-dal-open]");
if(node)node.click();
}
function btn(symbol,label,extra){
var el=d.createElement("button");
el.type="button";el.className="dar-duo-tool"+(extra==="reset"?" dar-duo-tool--reset":"");
el.setAttribute("aria-label",label);el.title=label;
if(symbol)el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+symbols[symbol]+"</svg>";
else el.textContent=label;
return el;
}
function quickTools(){
var bar=d.querySelector(".app-bar");
if(!bar||d.getElementById("darDuoV8QuickTools"))return;
var box=d.createElement("div");box.id="darDuoV8QuickTools";
box.setAttribute("role","group");box.setAttribute("aria-label","DĀR TEST V8 Schnellzugriff");
var lang=btn("language","Sprache wählen");lang.addEventListener("click",openLanguage);
var account=btn("account","Konto");account.setAttribute("data-nav","account");
var theme=btn("palette","Farben & Erscheinungsbild");theme.setAttribute("data-nav","settings");theme.setAttribute("data-value","appearance");
var reset=btn(null,"Zurück","reset");
reset.setAttribute("aria-label","V8-Entwurf zurücksetzen und bisherige Testansicht zeigen");
reset.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();
try{w.localStorage.setItem(KEY,"0")}catch(_){}
w.location.reload();});
box.append(lang,account,theme,reset);
bar.appendChild(box);
}
function navPreference(){
try{return w.localStorage.getItem(NAV_KEY)||"auto"}catch(_){return "auto"}
}
function navOptions(){
var section=d.createElement("div");
section.id="darDuoV8NavSettings";section.className="dsh-group";
var heading=d.createElement("div");heading.className="dsh-group-head";
var cap=d.createElement("span");cap.textContent="Fold- & Duo-Navigation";
heading.append(cap);
var list=d.createElement("div");list.className="dar-duo-nav-options";
NAV.forEach(function(o){
var b=d.createElement("button");b.type="button";b.textContent=o[1];
b.setAttribute("data-dar-duo-nav",o[0]);b.setAttribute("aria-pressed",String(navPreference()===o[0]));
b.addEventListener("click",function(){
try{if(o[0]==="auto")w.localStorage.removeItem(NAV_KEY);else w.localStorage.setItem(NAV_KEY,o[0])}catch(_){}
list.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});
try{if(w.DarAdaptiveNavPlacement)w.DarAdaptiveNavPlacement.apply()}catch(_){}
});
list.appendChild(b);
});
section.append(heading,list);
return section;
}
function languagesBox(){
var wrap=d.createElement("section");wrap.id="darDuoV8LanguageSettings";
var h=d.createElement("h3");h.textContent="Sprache & Übersetzungen";
var p=d.createElement("p");p.textContent="Neun Sprachfassungen im Katalog. Auswahl nur dort, wo tatsächlich Übersetzungen bereitstehen.";
var entry=d.createElement("div");entry.setAttribute("data-dar-language-entry","settings");
entry.className="dal-entry dal-entry-settings";
var tags=d.createElement("div");tags.className="dar-duo-languages";
LANGUAGES.forEach(function(item){
var span=d.createElement("span");span.lang=item[0];span.dir="auto";
var available=false;
try{available=!!(w.DARAdultLanguagePickerV1&&w.DARAdultLanguagePickerV1.available(item[0]))}catch(_){}
span.textContent=item[1]+(available?" ✓":" · geplant");
tags.append(span);
});
wrap.append(h,p,entry,tags);
return wrap;
}
function addSettings(){
var view=d.getElementById("appView");if(!view)return;
var home=view.querySelector(".dsh-shell.dsh-home");
if(home){
if(!d.getElementById("darDuoV8LanguageSettings")){
var box=languagesBox();var groups=home.querySelector(".dsh-group");
home.insertBefore(box,groups||null);
if(w.DARAdultLanguagePickerV1)w.DARAdultLanguagePickerV1.refresh();
}
if(!d.getElementById("darDuoV8NavSettings")){
var section=navOptions();
var note=home.querySelector(":scope > .dsh-note");
home.insertBefore(section,note||null);
}
}
var detail=view.querySelector(".dsh-shell.dsh-detail");
if(detail&&!detail.querySelector(".dar-duo-settings-rail")){
var current=detail.getAttribute("data-settings-page")||"";
var rail=d.createElement("aside");rail.className="dar-duo-settings-rail";
rail.setAttribute("aria-label","Einstellungen schnell wechseln");
var title=d.createElement("strong");title.textContent="Einstellungen";rail.appendChild(title);
SETTINGS.forEach(function(p){
var b=d.createElement("button");b.type="button";b.textContent=p[1];
b.setAttribute("data-nav","settings");b.setAttribute("data-value",p[0]);
if(current===p[0])b.setAttribute("aria-current","page");
rail.appendChild(b);
});
var b=d.createElement("button");b.type="button";b.textContent="Alle Einstellungen";
b.setAttribute("data-nav","settings");rail.appendChild(b);
var back=detail.querySelector(":scope > .dsh-back");
if(back)back.insertAdjacentElement("afterend",rail);else detail.prepend(rail);
}
}
function paint(){framePending=false;if(!root.classList.contains("dar-test-duo-v8"))return;
syncMode();quickTools();addSettings();}
function schedule(){if(framePending)return;framePending=true;(w.requestAnimationFrame||function(fn){w.setTimeout(fn,20)})(paint);}
function boot(){
if(started)return;started=true;
schedule();
var app=d.getElementById("appView");
if(app&&w.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
w.addEventListener("resize",schedule,{passive:true});
if(w.visualViewport)w.visualViewport.addEventListener("resize",schedule,{passive:true});
w.addEventListener("dar:view-rendered",schedule);
w.addEventListener("hashchange",schedule);
w.addEventListener("dar-adult-ui-languages-ready",schedule);
}
w.DarTestDuoV8=Object.freeze({
disable:function(){try{w.localStorage.setItem(KEY,"0")}catch(_){}w.location.reload();},
enable:function(){try{w.localStorage.setItem(KEY,"1")}catch(_){}w.location.reload();},
status:function(){return {active:enabled(),viewport:root.getAttribute("data-dar-duo-viewport"),navigation:navPreference()};}
});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
