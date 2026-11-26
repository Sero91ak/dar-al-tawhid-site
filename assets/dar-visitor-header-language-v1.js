/* DĀR AL TAWḤĪD visitor header language control.
 * Same globe capsule as DAR Test, immediately before the profile button
 * on the adult app rail and before appearance on the public desktop bar.
 * Kids and /test keep their own headers. Choosing a language uses the
 * existing nine-locale picker (darAdultPreferredLocaleV1, ?lang=, RTL).
 * Qurʾān meaning follows dar-adult-locale-changed when no explicit
 * meaning pick is stored (quran-meaning-i18n, PR 1899). */
(function(w,d){
"use strict";
if(!w||!d||w.DAR_VISITOR_HEADER_LANGUAGE_V1)return;
var path=String(w.location&&w.location.pathname||"");
if(/\/kids(?:\/|$)/.test(path)||/^\/test(?:\/|$)/.test(path))return;
var ICON="/assets/header-icons/language-classic-v7.png?v=20261126-header-language-v1";
var KEY="darAdultPreferredLocaleV1";
var ITEMS=[
 {code:"de",name:"Deutsch",dir:"ltr"},
 {code:"ar",name:"العربية",dir:"rtl"},
 {code:"en",name:"English",dir:"ltr"},
 {code:"tr",name:"Türkçe",dir:"ltr"},
 {code:"ku",name:"Kurmancî",dir:"ltr"},
 {code:"ckb",name:"سۆرانی",dir:"rtl"},
 {code:"bs",name:"Bosanski",dir:"ltr"},
 {code:"fr",name:"Français",dir:"ltr"},
 {code:"es",name:"Español",dir:"ltr"}
];
var TEXT={
 de:{language:"Sprache",choose:"Sprache wählen"},
 ar:{language:"اللغة",choose:"اختر اللغة"},
 en:{language:"Language",choose:"Choose language"},
 tr:{language:"Dil",choose:"Dil seçin"},
 ku:{language:"Ziman",choose:"Ziman hilbijêre"},
 ckb:{language:"زمان",choose:"زمان هەڵبژێرە"},
 bs:{language:"Jezik",choose:"Odaberite jezik"},
 fr:{language:"Langue",choose:"Choisir la langue"},
 es:{language:"Idioma",choose:"Elegir idioma"}
};
var placing=false;
function item(code){
 for(var i=0;i<ITEMS.length;i++)if(ITEMS[i].code===code)return ITEMS[i];
 return ITEMS[0];
}
function read(){
 var code="";
 try{
  var params=new URLSearchParams(w.location.search||"");
  code=String(params.get("lang")||params.get("locale")||"").toLowerCase();
 }catch(_){}
 if(!item(code)||(code&&!TEXT[code]))code="";
 if(!code){
  try{code=String(w.localStorage.getItem(KEY)||"").toLowerCase()}catch(_){code=""}
 }
 return TEXT[code]?code:"de";
}
function register(){
 var api=w.DARAdultComponentI18nV1;
 if(!api||typeof api.register!=="function")return;
 try{api.register("header-language",TEXT)}catch(_){}
}
function label(code){
 var pack=TEXT[code]||TEXT.de;
 var name=item(code).name;
 return pack.language+": "+name+". "+pack.choose;
}
function sync(button){
 if(!button)return;
 var code=read();
 var text=label(code);
 button.setAttribute("lang",code);
 button.setAttribute("aria-label",text);
 button.title=text;
 button.setAttribute("data-current-locale",code);
 var open=!!d.getElementById("darAdultLanguagePicker");
 button.setAttribute("aria-expanded",open?"true":"false");
 var root=d.documentElement;
 if(root){
  root.lang=code;
  root.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
 }
}
function icon(){
 var image=d.createElement("img");
 image.className="dvp-language-icon";
 image.src=ICON;
 image.alt="";
 image.width=36;
 image.height=36;
 image.decoding="async";
 image.draggable=false;
 image.setAttribute("aria-hidden","true");
 return image;
}
function ensure(){
 var button=d.getElementById("darVisitorLanguageButtonV1");
 if(button)return button;
 button=d.createElement("button");
 button.type="button";
 button.id="darVisitorLanguageButtonV1";
 button.className="dtbh-action dtbh-action-language";
 button.setAttribute("data-dar-header-language","v1");
 button.setAttribute("data-dar-no-translate","picker");
 button.setAttribute("aria-haspopup","dialog");
 button.setAttribute("aria-controls","darAdultLanguagePicker");
 button.appendChild(icon());
 button.addEventListener("click",function(e){
  e.preventDefault();
  e.stopPropagation();
  open(button);
 });
 return button;
}
function open(button,remaining){
 var picker=w.DARAdultLanguagePickerV1;
 if(picker&&typeof picker.open==="function"){
  picker.open("quick",button);
  button.setAttribute("aria-expanded","true");
  return;
 }
 if(remaining===undefined)remaining=12;
 if(!d.querySelector('script[src*="adult-language-picker-v1.js"]')){
  var script=d.createElement("script");
  script.src="/assets/i18n/adult-language-picker-v1.js?v=20261125-nine1";
  script.async=true;
  (d.head||d.documentElement).appendChild(script);
 }
 if(remaining>0)w.setTimeout(function(){open(button,remaining-1)},160);
}
function placeApp(){
 var row=d.querySelector("#darAdultBrandHeaderV2 .dtbh-row");
 if(!row)return false;
 var button=ensure();
 var profile=row.querySelector("#darVisitorProfileButtonV1");
 var theme=row.querySelector(".dtbh-toggle");
 var anchor=profile||theme;
 if(anchor){
  if(button.parentNode!==row||button.nextElementSibling!==anchor)row.insertBefore(button,anchor);
 }else if(button.parentNode!==row)row.appendChild(button);
 if(!row.__darLangWatch&&w.MutationObserver){
  row.__darLangWatch=new w.MutationObserver(tick);
  row.__darLangWatch.observe(row,{childList:true});
 }
 return true;
}
function retireLegacy(){
 var legacy=d.getElementById("darV8LangToggle");
 var menu=d.getElementById("darV8LangMenu");
 if(legacy)legacy.remove();
 if(menu)menu.remove();
}
function placeDesktop(){
 var mount=d.querySelector(".dar-v8-top-actions");
 if(!mount||d.querySelector("#darAdultBrandHeaderV2 .dtbh-row"))return false;
 var button=ensure();
 button.classList.add("dar-v8-top-icon");
 var theme=d.getElementById("darV8ThemeToggle");
 if(theme&&theme.parentNode===mount){
  if(button.parentNode!==mount||button.nextElementSibling!==theme)mount.insertBefore(button,theme);
 }else if(button.parentNode!==mount)mount.insertBefore(button,mount.firstChild);
 retireLegacy();
 return true;
}
function tick(){
 if(placing)return;
 placing=true;
 try{
  placeApp();
  placeDesktop();
  sync(d.getElementById("darVisitorLanguageButtonV1"));
  register();
 }finally{placing=false}
}
function boot(){
 tick();
 var tries=0;
 var timer=w.setInterval(function(){
  tries++;
  tick();
  if(tries>40)w.clearInterval(timer);
 },200);
 w.addEventListener("dar-adult-locale-changed",tick);
 w.addEventListener("dar-adult-ui-languages-ready",tick);
 d.addEventListener("dar:view-rendered",tick);
 w.addEventListener("storage",function(e){if(!e||e.key===KEY||e.key===null)tick()});
 d.addEventListener("keydown",function(e){if(e.key==="Escape")tick()},true);
 d.addEventListener("click",function(){w.setTimeout(tick,0)},true);
}
w.DAR_VISITOR_HEADER_LANGUAGE_V1={
 read:read,
 label:label,
 locales:ITEMS.map(function(x){return x.code}),
 refresh:tick,
 open:function(){var button=d.getElementById("darVisitorLanguageButtonV1");if(button)open(button)}
};
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})(window,document);
