/* DĀR AL TAWḤĪD · one adult language selector for visitor web/PWA/WKWebView and DAR TEST.
 * Editorial/source text never passes through this control. No paid requests.
 */
(function(w,d){"use strict";
if(w.DARAdultLanguagePickerV1||!d)return;
var KEY="darAdultPreferredLocaleV1";
var ITEMS=[
 {code:"de",name:"Deutsch",dir:"ltr"},
 {code:"tr",name:"Türkçe",dir:"ltr"},
 {code:"en",name:"English",dir:"ltr"},
 {code:"ar",name:"العربية الفصحى",dir:"rtl"},
 {code:"ku",name:"Kurmancî",dir:"ltr"},
 {code:"ckb",name:"سۆرانی",dir:"rtl"},
 {code:"bs",name:"Bosanski",dir:"ltr"},
 {code:"fr",name:"Français",dir:"ltr"},
 {code:"es",name:"Español",dir:"ltr"}
];
var TEST=/^\/test(?:\/|$)/.test(w.location.pathname)&&!/^\/test\/kids(?:\/|$)/.test(w.location.pathname);
var modal=null,origin=null,oldOverflow="",scheduled=false;
var text={
 de:{language:"Sprache",choose:"Sprache wählen",subtitle:"Sprache der Bedienoberfläche",soon:"Demnächst verfügbar",back:"Zurück",close:"Schließen",ready:"Verfügbar",active:"Ausgewählt",note:"Noch nicht freigegebene Sprachfassungen lassen sich nicht aktivieren."},
 tr:{language:"Dil",choose:"Dil seçin",subtitle:"Uygulama arayüzü dili",soon:"Yakında",back:"Geri",close:"Kapat",ready:"Kullanılabilir",active:"Seçili",note:"Henüz hazır olmayan diller seçilemez."},
 en:{language:"Language",choose:"Choose language",subtitle:"App interface language",soon:"Coming soon",back:"Back",close:"Close",ready:"Available",active:"Selected",note:"Languages not yet released cannot be selected."},
 ar:{language:"اللغة",choose:"اختر اللغة",subtitle:"لغة واجهة التطبيق",soon:"متاحة قريبًا",back:"رجوع",close:"إغلاق",ready:"متاحة",active:"المحددة",note:"لا يمكن اختيار اللغات التي لم تُنشر بعد."},
 ku:{language:"Ziman",choose:"Ziman hilbijêre",subtitle:"Zimanê navrûya sepanê",soon:"Di demeke nêz de",back:"Vegere",close:"Bigire",ready:"Berdest",active:"Hilbijartî",note:"Zimanên ku hîn nehatine weşandin nayên hilbijartin."},
 ckb:{language:"زمان",choose:"زمان هەڵبژێرە",subtitle:"زمانی ڕووکارەکەی ئەپ",soon:"بەم زووانە",back:"گەڕانەوە",close:"داخستن",ready:"بەردەستە",active:"هەڵبژێردراوە",note:"زمانەکانی هێشتا بڵاونەکراونەتەوە ناتوانرێن هەڵبژێردرێن."},
 bs:{language:"Jezik",choose:"Odaberite jezik",subtitle:"Jezik aplikacije",soon:"Uskoro dostupno",back:"Nazad",close:"Zatvori",ready:"Dostupno",active:"Odabrano",note:"Jezici koji još nisu dostupni ne mogu se odabrati."},
 fr:{language:"Langue",choose:"Choisir la langue",subtitle:"Langue de l’interface",soon:"Bientôt disponible",back:"Retour",close:"Fermer",ready:"Disponible",active:"Sélectionnée",note:"Les langues non publiées ne peuvent pas être sélectionnées."},
 es:{language:"Idioma",choose:"Elegir idioma",subtitle:"Idioma de la interfaz",soon:"Próximamente",back:"Volver",close:"Cerrar",ready:"Disponible",active:"Seleccionado",note:"Los idiomas aún no disponibles no se pueden seleccionar."}
};
function t(){return text[read()]||text.de}
function item(code){return ITEMS.find(function(x){return x.code===code})}
function available(code){
 if(code==="de")return true;
 if(TEST){
  var runtime=w.DarTestTurkishUI;
  if(!runtime||!Array.isArray(runtime.supportedLocales)||runtime.supportedLocales.indexOf(code)<0)return false;
  if(code==="tr")return runtime.translatedKeys>0;
  return w.__DarTestSevenLocalesReady===true&&typeof runtime.translatedFor==="function"&&runtime.translatedFor(code)>0;
 }
 // Visitor releases are independent of the internal language test catalog.
 // Turkish and all other unapproved locales remain test-only.
 return false;
}
function read(){
 var code="de";try{code=w.localStorage.getItem(KEY)||"de"}catch(_){}
 return item(code)&&available(code)?code:"de";
}
function escape(s){return String(s).replace(/[&<>"']/g,function(v){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[v]})}
function row(mode){
 var lang=read(),label=item(lang).name;
 return '<button type="button" class="dal-row dal-row-'+mode+'" data-dal-open="'+mode+'" data-dar-no-translate aria-haspopup="dialog" aria-label="'+escape(t().language)+': '+escape(label)+'. '+escape(t().choose)+'">'+
 '<span class="dal-globe" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c-3.6 3.5-3.6 14.5 0 18M12 3c3.6 3.5 3.6 14.5 0 18"/></svg></span>'+
 '<span class="dal-label"><strong>'+escape(t().language)+'</strong>'+(mode==="settings"?'<small>'+escape(t().subtitle)+'</small>':'')+'</span>'+
 '<span class="dal-current" dir="auto">'+escape(label)+'</span></button>';
}
function enhance(){
 d.querySelectorAll('[data-dar-language-entry]').forEach(function(host){
  var mode=host.getAttribute("data-dar-language-entry")==="settings"?"settings":"quick";
  var value=read(),last=host.getAttribute("data-dal-current");
  if(last===value&&host.querySelector("[data-dal-open]"))return;
  host.setAttribute("data-dal-current",value);
  host.setAttribute("data-dar-no-translate","picker");
  host.classList.add("dal-entry","dal-entry-"+mode);
  host.innerHTML=row(mode);
 });
 // Older pages may still render the previous two-column controls.
 d.querySelectorAll(".dar-adult-locale-controls:not([data-dar-language-entry]),.dar-more-v15 .dm-locale:not([data-dar-language-entry]),#darSettingsLocaleChoice:not([data-dar-language-entry])").forEach(function(host){
  var mode=host.id==="darSettingsLocaleChoice"||!!host.closest(".dsh-home,.settings-one-page")?"settings":"quick";
  host.setAttribute("data-dar-language-entry",mode);
  host.removeAttribute("role");
  host.removeAttribute("aria-label");
  host.innerHTML="";
  host.className="dal-entry dal-entry-"+mode;
 });
}
function renderList(){
 var v=read(),copy=t(),head=(modal&&modal.dataset.dalMode==="settings")?"settings":"quick";
 return '<div class="dal-pane" data-dar-no-translate="picker" lang="'+escape(v)+'">'+
 '<div class="dal-top"><button type="button" class="dal-back" data-dal-close>'+escape(head==="settings"?copy.back:copy.close)+'</button>'+
 '<span class="dal-identity">DĀR AL TAWḤĪD</span></div>'+
 '<header class="dal-heading"><span>'+escape(copy.language)+'</span><h2 id="dalTitle">'+escape(copy.choose)+'</h2><p>'+escape(copy.subtitle)+'</p></header>'+
 '<div class="dal-list" role="group" aria-label="'+escape(copy.choose)+'">'+(TEST?ITEMS:ITEMS.filter(function(l){return available(l.code)})).map(function(l){
   var ok=available(l.code),sel=v===l.code;
   return '<button type="button" class="dal-option'+(sel?' is-selected':'')+'" data-dal-locale="'+l.code+'"'+(ok?'':' disabled aria-disabled="true"')+' aria-pressed="'+sel+'" lang="'+l.code+'" dir="ltr">'+
    '<span class="dal-mark" aria-hidden="true">'+(sel?'✓':'')+'</span><span class="dal-name" dir="'+l.dir+'">'+escape(l.name)+'</span>'+
    '<span class="dal-state'+(ok?' is-ready':'')+'">'+escape(ok?(sel?copy.active:copy.ready):copy.soon)+'</span></button>';
  }).join("")+'</div><p class="dal-foot">'+escape(copy.note)+'</p></div>';
}
function refreshModal(){if(!modal)return;var active=d.activeElement,selected=active&&active.getAttribute("data-dal-locale");modal.innerHTML=renderList();if(selected){var row=modal.querySelector('[data-dal-locale="'+selected+'"]:not([disabled])');if(row)row.focus()}}
function close(){
 if(!modal)return;
 modal.remove();modal=null;d.body.classList.remove("dal-modal-open");d.body.style.overflow=oldOverflow;
 var focus=origin;origin=null;if(focus&&d.contains(focus))focus.focus();
}
function open(mode,trigger){
 if(modal)close();
 origin=trigger||d.activeElement;oldOverflow=d.body.style.overflow;
 d.body.style.overflow="hidden";d.body.classList.add("dal-modal-open");
 modal=d.createElement("section");modal.id="darAdultLanguagePicker";modal.className="dal-modal dal-mode-"+(mode==="settings"?"settings":"quick");
 modal.dataset.dalMode=mode==="settings"?"settings":"quick";
 modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-labelledby","dalTitle");
 modal.innerHTML=renderList();d.body.appendChild(modal);
 var back=modal.querySelector("[data-dal-close]");if(back)back.focus();
}
function choose(code){
 if(!available(code))return;
 var updated=false;
 if(TEST){try{w.localStorage.setItem(KEY,code);updated=true}catch(_){}}
 else if(w.DARAdultUI18n&&typeof w.DARAdultUI18n.setLocale==="function"){
  updated=w.DARAdultUI18n.setLocale(code)===true;
 }else{try{w.localStorage.setItem(KEY,code);updated=true}catch(_){}}
 if(!updated)return;
 if(TEST)w.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));
 close();schedule();
}
function schedule(){if(scheduled)return;scheduled=true;(w.requestAnimationFrame||function(fn){Promise.resolve().then(fn)})(function(){scheduled=false;enhance();})}
function installStyle(){
 if(d.getElementById("dar-adult-language-picker-style"))return;
 var css=d.createElement("style");css.id="dar-adult-language-picker-style";
 css.textContent="\n.dal-entry{width:100%;display:block;margin:12px 0!important;min-width:0;max-width:100%}\n.dal-entry-settings{margin:14px 0 22px!important}\n.dal-entry .dal-row{appearance:none;display:flex;align-items:center;gap:13px;min-height:69px;width:100%;text-align:start;padding:13px 16px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:20px;background:color-mix(in srgb,var(--dsh-panel,#fff) 86%,transparent);color:var(--dsh-ink,inherit);box-shadow:0 7px 22px rgba(15,37,29,.055);cursor:pointer;font:inherit}\n.dal-entry-settings .dal-row{min-height:76px;border-radius:22px;background:var(--dsh-panel,#fff)}\n.dal-row .dal-globe{width:41px;height:41px;flex:none;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--dsh-ink,#284e3c) 7%,transparent);color:var(--dsh-ink,inherit)}\n.dal-globe svg{width:22px;height:22px}\n.dal-row .dal-label{display:grid;gap:3px;min-width:0;flex:1}\n.dal-row .dal-label strong{font-size:15px;line-height:1.3;font-weight:700}\n.dal-row .dal-label small{font-size:12px;line-height:1.35;opacity:.72;font-weight:450}\n.dal-current{font-size:14px;font-weight:700;white-space:nowrap;max-width:43%;overflow:hidden;text-overflow:ellipsis;padding:7px 1px;border:0;background:transparent;color:inherit}\n.dal-row:active{transform:scale(.995)}.dal-row:hover{border-color:color-mix(in srgb,#b99a5d 63%,transparent)}\n.dal-row:focus-visible,.dal-modal button:focus-visible{outline:2px solid #bd9b5a;outline-offset:3px}\n.dal-modal{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;align-items:flex-end;padding:0;background:rgba(5,20,16,.54);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#1c2d23}\n.dal-pane{box-sizing:border-box;display:flex;flex-direction:column;width:min(100%,620px);max-height:min(90dvh,920px);overflow-y:auto;overscroll-behavior:contain;padding:calc(20px + env(safe-area-inset-top,0px)*.1) 22px calc(24px + env(safe-area-inset-bottom,0px));background:var(--dsh-panel,#f7f8f4);color:var(--dsh-ink,#1c2d23);border:1px solid rgba(166,152,115,.32);border-radius:26px 26px 0 0;box-shadow:0 -12px 45px rgba(5,19,15,.18)}\n.dal-mode-settings{background:var(--dsh-panel,#f6f8f4);align-items:stretch}\n.dal-mode-settings .dal-pane{width:min(100%,780px);height:100dvh;max-height:none;margin:0 auto;border-radius:0;box-shadow:none;padding-top:calc(22px + env(safe-area-inset-top,0px));background:var(--dsh-panel,#f6f8f4)}\n.dal-top{display:flex;align-items:center;justify-content:space-between;gap:15px;min-height:38px}\n.dal-back{appearance:none;border:1px solid color-mix(in srgb,currentColor 17%,transparent);border-radius:999px;min-height:44px;padding:0 17px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;font:650 13px system-ui,-apple-system,sans-serif;cursor:pointer}\n.dal-identity{font:700 10px system-ui,-apple-system,sans-serif;letter-spacing:.16em;opacity:.67}\n.dal-heading{padding:23px 2px 17px}\n.dal-heading>span{color:#9a8150;font:700 11px system-ui,-apple-system,sans-serif;letter-spacing:.18em;text-transform:uppercase}\n.dal-heading h2{font:500 clamp(28px,5.6vw,38px)/1.14 Georgia,serif;letter-spacing:-.015em;margin:7px 0 9px;color:inherit}\n.dal-heading p{margin:0;font-size:13px;line-height:1.5;opacity:.73}\n.dal-list{display:grid;gap:9px}\n.dal-option{appearance:none;width:100%;display:flex;gap:11px;align-items:center;min-height:59px;padding:10px 13px;border:1px solid color-mix(in srgb,currentColor 13%,transparent);border-radius:17px;background:color-mix(in srgb,var(--dsh-panel,#fff) 93%,#fff);color:inherit;text-align:start;cursor:pointer;font:inherit;box-sizing:border-box}\n.dal-option .dal-mark{width:27px;height:27px;flex:none;display:grid;place-items:center;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:50%;font-size:16px}\n.dal-name{font-size:15px;font-weight:660;flex:1;min-width:0}\n.dal-state{font-size:11px;line-height:1.25;text-align:end;white-space:normal;max-width:39%;opacity:.63}\n.dal-option:not(:disabled):not(.is-selected){box-shadow:inset 2px 0 0 rgba(185,154,93,.5)}\n.dal-option:not(:disabled) .dal-state{color:var(--accent-gold,#b99a5d);opacity:1;font-weight:650}\n.dal-option.is-selected{border-color:#ba9a57;background:color-mix(in srgb,#b99a5d 13%,var(--dsh-panel,#fff));box-shadow:0 0 0 1px rgba(185,154,93,.18),0 4px 21px rgba(185,154,93,.14)}\n.dal-option.is-selected .dal-mark{background:#b99a5d;color:#1c2d23;border-color:#b99a5d}\n.dal-option:not(:disabled):hover{border-color:#b99a5d}\n.dal-option:disabled{cursor:not-allowed;opacity:.56;box-shadow:none;filter:saturate(.65)}\n.dal-option:disabled .dal-state{font-style:italic;opacity:1}\n.dal-foot{margin:19px 2px 3px;font-size:11px;line-height:1.6;opacity:.7}\n@media(min-width:720px){.dal-mode-quick{align-items:center}.dal-mode-quick .dal-pane{border-radius:25px;max-height:86dvh}}\n@media(max-width:350px){.dal-current{max-width:38%;padding:9px}.dal-pane{padding-inline:14px}.dal-option{padding-inline:10px}.dal-name{font-size:13px}}\n@media(prefers-reduced-motion:no-preference){.dal-row,.dal-option{transition:border-color .2s ease,background .2s ease,transform .15s ease}}\nhtml[data-theme=\"dark\"] .dal-pane,html[data-theme=\"royal\"] .dal-pane,html[data-theme=\"dar-al-layl\"] .dal-pane,html[data-theme=\"bordeaux\"] .dal-pane{background:var(--dsh-panel,#182821);color:var(--dsh-ink,#eee7d8)}\n";
 d.head.appendChild(css);
}

/* Three compact header shortcuts. Same code path for test, visitor and Android PWA.
   Existing palette action is reused when present; no new login or theme implementation. */
function mountHeaderShortcuts(){
 var header=d.querySelector(".top-shell.theme-hero-shell .header"),row=header&&header.querySelector(".header-row--brand-only");
 if(!row||d.getElementById("darAdultHeaderShortcuts"))return;
 var bar=d.createElement("div");bar.id="darAdultHeaderShortcuts";bar.className="dar-head-shortcuts";
 bar.setAttribute("role","group");bar.setAttribute("aria-label","Schnellzugriffe");
 bar.innerHTML='<button type="button" class="dar-head-action" data-dal-open="quick" data-dar-no-translate aria-label="Sprache wählen" title="Sprache wählen"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-4.5 5-4.5 13 0 18M12 3c4.5 5 4.5 13 0 18"/></svg></button>'+
 '<button type="button" class="dar-head-action" data-dar-header-account data-dar-no-translate aria-label="Konto und Anmeldung" title="Konto und Anmeldung"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3.2-6.5 7-6.5s7 2.5 7 6.5"/></svg></button>';
 var palette=header.querySelector('button[aria-label*="Erscheinungsbild"],button[data-dar-header-appearance],button[data-header-appearance]');
 if(palette&&!palette.closest("#darAdultHeaderShortcuts")){palette.classList.add("dar-head-action");bar.appendChild(palette)}
 else {
  var btn=d.createElement("button");btn.type="button";btn.className="dar-head-action";btn.setAttribute("data-dar-header-appearance","");
  btn.setAttribute("data-dar-no-translate","");btn.setAttribute("aria-label","Erscheinungsbild wählen");btn.title="Erscheinungsbild wählen";
  btn.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a9 9 0 0 0 0 18h1.5a2.6 2.6 0 0 0 1.6-4.6 1.7 1.7 0 0 1 1.2-2.8H18a4 4 0 0 0 4-4A9.5 9.5 0 0 0 12 3Z"/><circle cx="7.6" cy="11" r="1"/><circle cx="11" cy="7.2" r="1"/><circle cx="16" cy="8.7" r="1"/></svg>';
  bar.appendChild(btn);
 }
 row.appendChild(bar);
}
function installHeaderShortcutsStyle(){
 if(d.getElementById("darAdultHeaderShortcutsStyle"))return;
 var style=d.createElement("style");style.id="darAdultHeaderShortcutsStyle";
 style.textContent=[
  ".top-shell.theme-hero-shell .header-row--brand-only{position:relative!important;min-width:0!important}",
  ".top-shell.theme-hero-shell .header-row--brand-only>.brand{box-sizing:border-box;max-width:100%;padding-right:clamp(134px,17vw,190px)!important}",
  ".dar-head-shortcuts{position:absolute;top:50%;right:max(0px,env(safe-area-inset-right,0px));transform:translateY(-50%);display:flex;align-items:center;justify-content:flex-end;gap:clamp(4px,.8vw,9px);z-index:8;direction:ltr}",
  ".dar-head-shortcuts .dar-head-action{box-sizing:border-box;display:grid!important;place-items:center!important;flex:none;appearance:none;width:clamp(39px,4.1vw,51px);height:clamp(39px,4.1vw,51px);min-width:39px;min-height:39px;padding:8px;border-radius:14px;border:1px solid var(--line2,rgba(192,163,106,.36));background:var(--panel,rgba(21,37,29,.8));color:var(--gold2,#e4d4ab);box-shadow:0 1px 7px rgba(0,0,0,.07);cursor:pointer}",
  ".dar-head-shortcuts .dar-head-action svg{width:100%;height:100%;max-width:26px;max-height:26px;pointer-events:none}",
  ".dar-head-shortcuts .dar-head-action:focus-visible{outline:2px solid var(--gold2,#bd9b5a);outline-offset:2px}",
  "@media(max-width:600px){.top-shell.theme-hero-shell .header-row--brand-only>.brand{padding-right:130px!important}.dar-head-shortcuts{gap:4px;right:0}.dar-head-shortcuts .dar-head-action{width:39px;height:39px;min-width:39px;min-height:39px;border-radius:12px}.top-shell.theme-hero-shell .brand-main{gap:6px!important}.top-shell.theme-hero-shell .brand-main .logo{width:clamp(31px,9vw,46px)!important;height:clamp(31px,9vw,46px)!important;flex:0 0 clamp(31px,9vw,46px)!important}.top-shell.theme-hero-shell .brand-main .brand-title{font-size:clamp(15px,3.7vw,25px)!important;letter-spacing:0!important;white-space:nowrap!important;min-width:0!important}}",
  "@media(max-width:370px){.top-shell.theme-hero-shell .header-row--brand-only>.brand{padding-right:123px!important}.dar-head-shortcuts .dar-head-action{width:37px;height:37px;min-width:37px;min-height:37px}.top-shell.theme-hero-shell .brand-main .brand-title{font-size:14.5px!important}}"
 ].join("\n");(d.head||d.documentElement).appendChild(style);
}
d.addEventListener("click",function(e){
 var btn=e.target.closest&&e.target.closest("[data-dar-header-account],[data-dar-header-appearance]");
 if(!btn)return;e.preventDefault();e.stopPropagation();
 if(btn.hasAttribute("data-dar-header-account")){
  if(typeof w.navigate==="function")w.navigate("account");
  else w.location.hash="#account";
 }else{
  if(typeof w.navigate==="function")w.navigate("settings","appearance");
  else w.location.hash="#settings/appearance";
 }
},true);

function boot(){
 installStyle();installHeaderShortcutsStyle();mountHeaderShortcuts();schedule();
 var app=d.getElementById("appView");
 if(app&&w.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
}
d.addEventListener("click",function(e){
 var openButton=e.target.closest&&e.target.closest("[data-dal-open]");
 if(openButton){e.preventDefault();e.stopPropagation();open(openButton.dataset.dalOpen,openButton);return}
 var closeButton=e.target.closest&&e.target.closest("[data-dal-close]");
 if(closeButton){e.preventDefault();close();return}
 var selection=e.target.closest&&e.target.closest("[data-dal-locale]");
 if(selection&&modal&&modal.contains(selection)){e.preventDefault();choose(selection.getAttribute("data-dal-locale"))}
},true);
d.addEventListener("keydown",function(e){
 if(!modal)return;
 if(e.key==="Escape"){e.preventDefault();close();return}
 if(e.key==="Tab"){
  var targets=[].slice.call(modal.querySelectorAll('button:not([disabled])'));
  if(!targets.length)return;
  if(e.shiftKey&&d.activeElement===targets[0]){e.preventDefault();targets[targets.length-1].focus()}
  else if(!e.shiftKey&&d.activeElement===targets[targets.length-1]){e.preventDefault();targets[0].focus()}
 }
},true);
w.addEventListener("dar-adult-locale-changed",function(){schedule();refreshModal()});
w.addEventListener("dar-adult-ui-languages-ready",function(){schedule();refreshModal()});
w.addEventListener("storage",function(e){if(e.key===KEY){schedule();refreshModal()}});
d.addEventListener("dar:view-rendered",function(){schedule();mountHeaderShortcuts()});
w.DARAdultLanguagePickerV1=Object.freeze({open:open,close:close,read:read,available:available,locales:ITEMS.map(function(x){return x.code}),refresh:schedule});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
