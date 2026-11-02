/* DĀR AL TAWḤĪD · one canonical daily resolver for adult visitor/web/PWA.
   Religious content is fetched verbatim from published source records. */
(function(w,d){"use strict";
if(w.DARCanonicalDailyV1)return;
var BASE="/content/updates/daily.json",DUAS="/content/duas/duas.json",SITE="https://dar-al-tawhid.de";
var DICT={"de":{"label":"DUʿĀʾ DES TAGES","read":"Heutige Duʿāʾ lesen","missing":"Tagesinhalt derzeit nicht verfügbar","original":"Original: Deutsch"},"ar":{"label":"دُعَاءُ الْيَوْمِ","read":"اقرأ دعاء اليوم","missing":"محتوى اليوم غير متاح حاليًا","original":"الأصل بالألمانية"},"en":{"label":"DUʿĀʾ OF THE DAY","read":"Read today's duʿāʾ","missing":"Today's content is currently unavailable","original":"Original: German"},"tr":{"label":"GÜNÜN DUASI","read":"Günün duasını oku","missing":"Günlük içerik şu anda kullanılamıyor","original":"Aslı: Almanca"},"ku":{"label":"DUʿAYA ÎRO","read":"Duʿaya îro bixwîne","missing":"Naveroka îro niha ne berdest e","original":"Orîjînal: Almanî"},"ckb":{"label":"دوعای ئەمڕۆ","read":"دوعای ئەمڕۆ بخوێنەوە","missing":"ناوەڕۆکی ئەمڕۆ ئێستا بەردەست نییە","original":"دەقی ڕەسەن: ئەڵمانی"},"bs":{"label":"DOVA DANA","read":"Pročitaj dovu dana","missing":"Današnji sadržaj trenutno nije dostupan","original":"Izvornik: njemački"},"fr":{"label":"DUʿĀʾ DU JOUR","read":"Lire l'invocation du jour","missing":"Le contenu du jour est indisponible","original":"Original : allemand"},"es":{"label":"DUʿĀʾ DEL DÍA","read":"Leer la súplica de hoy","missing":"El contenido de hoy no está disponible","original":"Original: alemán"}},I18N=w.DARAdultComponentI18nV1;
if(I18N)I18N.register("canonical-daily",DICT);
function locale(){try{var k=I18N?.locale?.()||w.localStorage.getItem("darAdultPreferredLocaleV1");return DICT[k]?k:"de"}catch(_){return "de"}}
function t(k){return I18N?.t("canonical-daily",k,locale())||DICT[locale()][k]}

var state={date:"",daily:null,dua:null,valid:false,loading:null,lastCheck:0,reason:"not-loaded"};
function berlinDate(at){var parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(at||new Date()),v={};parts.forEach(function(z){v[z.type]=z.value});return v.year+"-"+v.month+"-"+v.day}
function text(x){return String(x==null?"":x).trim()}
function safeId(x){return /^dua-[0-9]{3}-[a-z0-9-]+$/.test(text(x))}
function sourceValid(row){return !!row&&safeId(row.id)&&text(row.title)&&text(row.ar)&&text(row.de)&&text(row.src)}
function validDaily(j,key){return j&&j.date===key&&j.timezone==="Europe/Berlin"&&j.dua&&safeId(j.dua.id)}
function validVerse(v){if(!v)return true;var surah=Number(v.surah),ayah=Number(v.ayah);return Number.isInteger(surah)&&surah>=1&&surah<=114&&Number.isInteger(ayah)&&ayah>=1&&ayah<=286&&v.reference===surah+":"+ayah&&(!v.tadabburReference||v.tadabburReference===v.reference)}
function fetchJson(path){return w.fetch(path+(path.includes("?")?"&":"?")+"daily="+encodeURIComponent(berlinDate()),{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json()})}
function fail(reason,key){state.date=key;state.valid=false;state.reason=reason;state.daily=null;state.dua=null;render();return null}
function update(force){var key=berlinDate();if(state.loading)return state.loading;if(!force&&key===state.date&&Date.now()-state.lastCheck<120000)return Promise.resolve(state.valid?snapshot():null);
state.lastCheck=Date.now();state.loading=Promise.all([fetchJson(BASE),fetchJson(DUAS)]).then(function(rows){
var j=rows[0],catalog=rows[1];
if(!validDaily(j,key))return fail("daily-date-mismatch",key);
if(!validVerse(j.verse))return fail("verse-reference-mismatch",key);
if(!Array.isArray(catalog))return fail("dua-catalog-invalid",key);
var dua=catalog.find(function(item){return item&&item.id===j.dua.id});
if(!sourceValid(dua))return fail("dua-source-missing",key);
state.date=key;state.daily=j;state.dua=dua;state.valid=true;state.reason="verified";render();
d.dispatchEvent(new CustomEvent("dar:canonical-daily-ready",{detail:{date:key,duaId:dua.id,verseReference:j.verse?.reference||null}}));
return snapshot();
}).catch(function(){return fail("fetch-error",key)}).finally(function(){state.loading=null});
return state.loading}
function snapshot(){return state.valid?{date:state.date,dua:{id:state.dua.id,title:state.dua.title,ar:state.dua.ar,tr:state.dua.tr,de:state.dua.de,src:state.dua.src,cat:state.dua.cat},verse:state.daily.verse||null}:null}
function nodes(){return Array.from(d.querySelectorAll(".dv3-today-card,[data-nav='dua'].home-v380-open-row,#darV8Daily a[href*='page=dua']"))}
function setAria(el,s){el.setAttribute("aria-label",s)}
function render(){nodes().forEach(function(el){
if(!state.valid){el.removeAttribute("data-dar-daily-id");if(el.matches(".dv3-today-card,.home-v380-open-row")){el.setAttribute("aria-disabled","true");setAria(el,t("missing"));var title=el.querySelector("strong,h3");if(title)title.textContent=t("missing");var copy=el.querySelector("span,p");if(copy)copy.textContent="";}return}
el.setAttribute("data-dar-daily-id",state.dua.id);el.removeAttribute("aria-disabled");
if(el.matches(".dv3-today-card")){
var strong=el.querySelector("strong"),small=el.querySelector("small"),copy=el.querySelector("span"),act=el.querySelector("b");
if(strong)strong.textContent=state.dua.title;if(small)small.textContent=t("label")+" · "+state.date;if(copy)copy.textContent=state.dua.de;if(act)act.textContent=t("read")+" ›";
}
if(el.matches(".home-v380-open-row")){
el.dataset.value=state.dua.id;
var h=el.querySelector("h3"),p=el.querySelector("p");if(h)h.textContent=state.dua.title;if(p)p.textContent=state.dua.de;
}
setAria(el,t("label")+": "+state.dua.title);
})}
function navigateDua(duaId){var id=encodeURIComponent(duaId);try{if(typeof w.navigate==="function"){w.navigate("dua",duaId);return}}catch(_){}
if(d.getElementById("pageRoot")||/^\?page=/.test(w.location.search||"")){w.location.assign("/?page=dua&id="+id);return}
w.location.hash="#dua/"+id}
function isDailyTarget(el){if(!el||!el.closest)return null;var button=el.closest(".dv3-today-card,[data-nav='dua'].home-v380-open-row,#darV8Daily a[href*='page=dua']");return button&&button.isConnected?button:null}
function click(e){var button=isDailyTarget(e.target);if(!button)return;
// The global day card always resolves its own canonical ID. Never open
// the generic Duʿāʾ list or a previous hard-coded daily item.
e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
update(false).then(function(result){if(result?.dua?.id)navigateDua(result.dua.id)});
}
function onDayChange(){if(state.date!==berlinDate())update(true);else render()}
function init(){d.addEventListener("click",click,true);d.addEventListener("dar:view-rendered",render);d.addEventListener("dar-adult-locale-changed",render);
d.addEventListener("visibilitychange",function(){if(!d.hidden)update(true)});
w.addEventListener("pageshow",function(){update(true)});
w.setInterval(function(){if(!d.hidden)onDayChange()},60000);
if(w.MutationObserver){var root=d.getElementById("appView")||d.body;if(root){var timer=null;new MutationObserver(function(){if(timer)return;timer=w.requestAnimationFrame(function(){timer=null;render()})}).observe(root,{childList:true,subtree:false})}}
update(true)}
w.DARCanonicalDailyV1=Object.freeze({refresh:function(){return update(true)},snapshot:snapshot,date:berlinDate});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);