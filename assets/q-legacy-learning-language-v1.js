/* DĀR AL TAWḤĪD · Q6/Q46/Q47/Q48 legacy lesson language continuity.
 * Does not falsify translations of religious quiz text or change answer indices.
 * Q49 and Q50 keep their own complete nine-locale lesson runtimes. */
(function(window,document){
"use strict";
if(window.__DARLegacyQLearningLocaleV1)return;
var TARGET={
 "/lernen/ikhlas/":6,
 "/lernen/wissen-adab/":46,
 "/lernen/tawhid-iman-akhlaq/":47,
 "/lernen/selbstpruefung/":48
};
var path=location.pathname.replace(/index\.html$/,"");if(!path.endsWith("/"))path+="/";
var number=TARGET[path];if(!number)return;
window.__DARLegacyQLearningLocaleV1=true;
var KEY="darAdultPreferredLocaleV1",codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var dict={
de:{lang:"Sprache",note:"Für die Fragen und Erklärungen dieses älteren Lernbereichs liegt noch keine vollständig geprüfte Übersetzung vor. Der Lerninhalt bleibt deutsch, bis ein redaktionell freigegebenes Sprachpaket verfügbar ist."},
ar:{lang:"اللغة",note:"لا تتوفر بعد ترجمة كاملة ومراجعة لأسئلة هذا القسم التعليمي وشروحه. يبقى المحتوى التعليمي بالألمانية حتى تتوفر نسخة معتمدة."},
en:{lang:"Language",note:"The questions and explanations in this older lesson do not yet have a fully reviewed translation. The learning content remains in German until an approved version is available."},
tr:{lang:"Dil",note:"Bu eski öğrenme bölümünün soruları ve açıklamaları için henüz tam ve incelenmiş bir çeviri yok. Onaylı sürüm hazır olana kadar ders içeriği Almanca kalır."},
ku:{lang:"Ziman",note:"Pirs û şîroveyên vê beşa hînbûnê hîn wergera temam û pejirandî nînin. Naveroka dersê heta pejirandina wergerê bi almanî dimîne."},
ckb:{lang:"زمان",note:"پرسیار و ڕوونکردنەوەکانی ئەم بەشی فێربوونە هێشتا وەرگێڕانێکی تەواو و پشکنراویان نییە. ناوەڕۆکەکە تا ئامادەبوونی وەشانی پەسەندکراو بە ئەڵمانی دەمێنێتەوە."},
bs:{lang:"Jezik",note:"Pitanja i objašnjenja ovog starijeg modula još nemaju potpun, stručno provjeren prijevod. Nastavni sadržaj ostaje na njemačkom do odobrene jezičke verzije."},
fr:{lang:"Langue",note:"Les questions et explications de cet ancien module n'ont pas encore de traduction complète et vérifiée. Le contenu reste en allemand jusqu'à la validation d'une autre version."},
es:{lang:"Idioma",note:"Las preguntas y explicaciones de este módulo todavía no cuentan con una traducción completa y revisada. El contenido permanece en alemán hasta que haya una versión aprobada."}
};
function norm(c){c=String(c||"").toLowerCase().replace(/_/g,"-");return codes.includes(c)?c:""}
var manual="";
function current(){
 if(manual)return manual;
 try{var u=new URL(location.href),x=norm(u.searchParams.get("lang")||u.searchParams.get("locale"));if(x)return x}catch(_){}
 try{return norm(localStorage.getItem(KEY))||"de"}catch(_){return"de"}
}
var bar=null,select=null,note=null;
function render(){
 if(!select)return;
 var c=current();
 select.value=c;
 document.documentElement.lang=c;
 document.documentElement.dir=(c==="ar"||c==="ckb"?"rtl":"ltr");
 bar.querySelector("label").textContent="🌐 "+dict[c].lang;
 select.setAttribute("aria-label",dict[c].lang);
 note.hidden=c==="de";
 note.textContent=c==="de"?"":dict[c].note;
 // Link to an existing Q reference receives only a locale query parameter.
 document.querySelectorAll('a[href^="/q/"]').forEach(function(a){
  try{var u=new URL(a.getAttribute("href"),location.origin);u.searchParams.set("lang",c);a.href=u.pathname+u.search+u.hash}catch(_){}
 });
}
function init(){
 var main=document.querySelector("main");
 if(!main||document.getElementById("darQExistingLearningLanguageV1"))return;
 bar=document.createElement("div");
 bar.id="darQExistingLearningLanguageV1";
 bar.className="dar-q-learning-lang";
 var label=document.createElement("label");label.htmlFor="darQLearningLanguage";
 select=document.createElement("select");select.id="darQLearningLanguage";
 var names={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
 codes.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=names[c];select.appendChild(o)});
 note=document.createElement("p");note.className="dar-q-learning-locale-status";note.setAttribute("role","status");
 bar.append(label,select,note);
 var head=main.querySelector("header");main.insertBefore(bar,head?head.nextSibling:main.firstChild);
 select.addEventListener("change",function(){
  manual=norm(select.value);if(!manual)return;
  try{localStorage.setItem(KEY,manual)}catch(_){}
  try{var u=new URL(location.href);u.searchParams.set("lang",manual);history.replaceState(history.state,"",u.pathname+u.search+u.hash)}catch(_){}
  render();
  window.dispatchEvent(new CustomEvent("dar:q-legacy-learning:locale-ready",{detail:{qSourceId:"qsource:"+number,locale:manual}}));
 });
 render();
}
var style=document.createElement("style");style.id="darQLegacyLearningLanguageStyleV1";
style.textContent=".dar-q-learning-lang{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 12px;margin:8px 0 13px;border:1px solid rgba(171,143,88,.55);border-radius:12px;background:var(--rq-page,transparent);color:inherit;box-sizing:border-box}.dar-q-learning-lang label{font:700 12px/1.3 system-ui,sans-serif}.dar-q-learning-lang select{min-height:42px;min-width:145px;max-width:100%;border:1px solid #af965f;border-radius:10px;font:600 13px/1.4 system-ui,sans-serif;background:var(--rq-page,#f8f5ef);color:var(--rq-ink,#28342d);padding:7px}.dar-q-learning-lang select:focus-visible{outline:2px solid #b49b6b;outline-offset:3px}.dar-q-learning-locale-status{flex-basis:100%;margin:0;font:500 11px/1.55 system-ui,sans-serif;opacity:.8}.dar-q-learning-locale-status[hidden]{display:none}html[dir=rtl] .dar-q-learning-lang{direction:rtl;text-align:right}";
(document.head||document.documentElement).appendChild(style);
window.addEventListener("dar-adult-locale-changed",function(e){if(e.detail&&norm(e.detail.locale)){manual=norm(e.detail.locale);render()}});
window.addEventListener("storage",function(e){if(e.key===KEY&&!manual)render()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
