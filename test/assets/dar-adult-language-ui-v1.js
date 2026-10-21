/* DĀR TEST adult language preference UI. No automatic, unverified content translation.
 * Uses the V8 i18n preference key. Never touches push, Kids, or locale source data. */
(function(win,doc){
 "use strict";
 if(win.DARAdultLanguageControlsV1)return;
 const KEY="darAdultPreferredLocaleV1";
 const supported=["de","tr"];
 const labels={de:"Deutsch",tr:"Türkçe"};
 let current="";
 let observed=null;
 function read(){
  try{const v=win.localStorage.getItem(KEY);return supported.includes(v)?v:"de"}catch(_){return"de"}
 }
 function apply(code){
  if(!supported.includes(code))return;
  current=code;
  doc.documentElement.dataset.darAdultLocalePreference=code;
  doc.querySelectorAll("[data-dar-adult-language-choice]").forEach(function(el){
   const active=el.dataset.darAdultLanguageChoice===code;
   el.setAttribute("aria-pressed",String(active));
  });
  doc.querySelectorAll("[data-dar-adult-language-note]").forEach(function(node){
   node.textContent=code==="tr"?
    "Türkçe içerikler inceleme ve onaydan sonra gösterilir. O zamana kadar doğrulanmış Almanca kaynak metin geçerlidir.":
    "Türkische Fachübersetzungen werden nach Prüfung freigegeben. Bis dahin bleibt der geprüfte deutsche Originaltext maßgeblich.";
  });
  doc.querySelectorAll("[data-dar-adult-language-title]").forEach(function(node){
   node.textContent=code==="tr"?"Uygulama dili / Sprache":"App-Sprache / Uygulama dili";
  });
 }
 function choose(code){
  if(!supported.includes(code))return;
  try{win.localStorage.setItem(KEY,code)}catch(_){}
  apply(code);
  win.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code,origin:"user"}}));
 }
 function build(scope){
  const section=doc.createElement("section");
  section.className="dat-locale-choice dat-locale-"+scope;
  section.setAttribute("role","group");
  section.setAttribute("aria-label","App-Sprache Deutsch oder Türkisch wählen");
  const caption=doc.createElement("strong");
  caption.className="dat-locale-title";
  caption.dataset.darAdultLanguageTitle="";
  section.appendChild(caption);
  const actions=doc.createElement("div");
  actions.className="dat-locale-buttons";
  supported.forEach(function(code){
   const b=doc.createElement("button");
   b.type="button";b.dataset.darAdultLanguageChoice=code;
   b.textContent=labels[code];b.setAttribute("aria-pressed","false");
   b.addEventListener("click",function(){choose(code)});
   actions.appendChild(b);
  });
  section.appendChild(actions);
  const note=doc.createElement("p");
  note.className="dat-locale-note";note.dataset.darAdultLanguageNote="";
  section.appendChild(note);
  return section;
 }
 function mount(){
  const app=doc.getElementById("appView");
  if(!app)return;
  const home=app.querySelector(".home-v380-shell");
  if(home&&!home.querySelector(".dat-locale-home"))home.prepend(build("home"));
  const more=app.querySelector(".dar-more-v15");
  if(more&&!more.querySelector(".dat-locale-more")){
   const section=build("more");
   const actions=more.querySelector(".dm-actions");
   if(actions)actions.insertAdjacentElement("afterend",section);else more.prepend(section);
  }
  const settings=app.querySelector(".dsh-home");
  if(settings&&!settings.querySelector(".dat-locale-settings")){
   const section=build("settings");
   const welcome=settings.querySelector(".dsh-welcome");
   if(welcome)welcome.insertAdjacentElement("afterend",section);else settings.prepend(section);
  }
  apply(read());
 }
 function boot(){
  if(!doc.getElementById("datAdultLocaleCssV1")){
   const css=doc.createElement("link");css.rel="stylesheet";css.id="datAdultLocaleCssV1";
   css.href="/test/assets/dar-adult-language-ui-v1.css?v=1";doc.head.appendChild(css);
  }
  const view=doc.getElementById("appView");
  if(view&&view!==observed){
   observed=view;
   new MutationObserver(mount).observe(view,{childList:true,subtree:false});
  }
  mount();
 }
 win.addEventListener("storage",function(event){if(event.key===KEY)apply(read())});
 doc.addEventListener("DOMContentLoaded",boot);
 if(doc.readyState!=="loading")boot();
 win.DARAdultLanguageControlsV1={select:choose,locale:read,mount:mount};
})(window,document);
