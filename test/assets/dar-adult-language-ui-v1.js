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
 function localizeShell(code){
  // Only established navigation labels, never alter routes, icons, links or source texts.
  const map={home:["Start","Ana Sayfa"],ilm:["ʿIlm","ʿİlm"],recent:["Beiträge","Paylaşımlar"],quran:["Qurʾān","Kurʾân"],more:["Mehr","Diğer"]};
  doc.querySelectorAll("#bottomNav [data-bottom-nav]").forEach(function(button){
   const name=button.dataset.bottomNav;
   const words=map[name];if(!words)return;
   const label=button.querySelector(":scope > span:last-child");
   if(label&&!label.classList.contains("nav-icon"))label.textContent=words[code==="tr"?1:0];
   if(name==="more")button.setAttribute("aria-label",code==="tr"?"Diğer seçenekler. Hızlı erişim için basılı tutun.":"Mehr öffnen. Gedrückt halten für Schnellzugriff.");
   else if(name==="home")button.setAttribute("aria-label",code==="tr"?"Ana Sayfa":"Startseite");
   else if(name==="recent")button.setAttribute("aria-label",code==="tr"?"Paylaşımlar":"Beiträge");
  });
  const categoryLabels={wissen:["Wissen","Bilgi"],alltag:["Alltag","Günlük hayat"],werkzeuge:["Werkzeuge","Araçlar"],persoenlich:["Persönlich","Kişisel"],app:["App","Uygulama"]};
  doc.querySelectorAll("#appView .dar-more-v15 [data-dm-category]").forEach(function(button){
   const item=categoryLabels[button.dataset.dmCategory];
   const label=button.querySelector("span:last-child");
   if(item&&label)label.textContent=item[code==="tr"?1:0];
  });
  const setUi=(selector,german,turkish)=>{
   const el=doc.querySelector(selector);if(el)el.textContent=code==="tr"?turkish:german;
  };
  setUi("#dv3Home .dv3-hometitle h2","Startseite","Ana Sayfa");
  setUi("#dv3Home .dv3-hometitle small","WILLKOMMEN IM DĀR","DĀR'A HOŞ GELDİNİZ");
  setUi("#dv3LatestTitle","Neueste Beiträge","Son Paylaşımlar");
  setUi("#dv3QuickTitle","Schnellzugriff","Hızlı Erişim");
  setUi('#dv3Home .dv3-section-title [data-dv3-nav="recent"]',"Alle lesen →","Tümünü oku →");
  setUi('#dv3Home .dv3-section-title [data-dv3-nav="more"]',"Alle Bereiche →","Tüm Bölümler →");
  setUi('#dv3Home .dv3-language > span',"Sprache / Dil","Dil / Sprache");
  setUi('#dv3Home .dv3-bottom-row [data-dv3-nav="settings"]',"Einstellungen →","Ayarlar →");
  const homeSearch=doc.querySelector("#dv3Home #homeSearchInput");
  if(homeSearch)homeSearch.placeholder=code==="tr"?"Bilgi, paylaşımlar, kitaplar ve âlimler ara …":"Suche Wissen, Beiträge, Bücher, Gelehrte …";
  const settingLabels={
   notifications:["Benachrichtigungen","Bildirimler"],
   location:["Standort","Konum"],
   appearance:["Erscheinungsbild","Görünüm"],
   font:["Schrift & Lesbarkeit","Yazı ve Okunabilirlik"],
   icon:["App-Icon","Uygulama Simgesi"]
  };
  doc.querySelectorAll('#appView .dsh-home .dsh-row[data-nav="settings"]').forEach(function(btn){
    const value=btn.getAttribute("data-value"),word=settingLabels[value];
    if(!word)return;
    const label=btn.querySelector(".dsh-row-title");
    if(label)label.textContent=word[code==="tr"?1:0];
  });
  const heading=doc.querySelector("#appView .dsh-home .dsh-welcome h2");
  if(heading)heading.textContent=code==="tr"?"Uygulama deneyimin":"Dein App-Erlebnis";
 }
 function apply(code){
  if(!supported.includes(code))return;
  current=code;
  doc.documentElement.dataset.darAdultLocalePreference=code;
  localizeShell(code);
  doc.querySelectorAll("[data-dar-adult-language-choice]").forEach(function(el){
   const active=el.dataset.darAdultLanguageChoice===code;
   el.setAttribute("aria-pressed",String(active));
  });
  doc.querySelectorAll("#dv3Home [data-dv3-locale]").forEach(function(btn){btn.setAttribute("aria-pressed",String(btn.dataset.dv3Locale===code))});
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
  // Existing DAR Home V3 already owns the DE/TR picker: never add a duplicate.
  if(home&&!home.querySelector("#dv3Home [data-dv3-locale]")&&!home.querySelector(".dat-locale-home"))home.prepend(build("home"));
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
 win.addEventListener("dar-adult-locale-changed",function(){apply(read())});
 win.addEventListener("storage",function(event){if(event.key===KEY)apply(read())});
 doc.addEventListener("DOMContentLoaded",boot);
 if(doc.readyState!=="loading")boot();
 win.DARAdultLanguageControlsV1={select:choose,locale:read,mount:mount};
})(window,document);
