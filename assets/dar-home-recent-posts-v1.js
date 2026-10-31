/* DĀR AL TAWḤĪD · Adult visitor latest publications, last 2–5 Berlin calendar days.
   No notification, no Kids, no duplicate post imports, no layout replacements. */
(function(w,d){"use strict";
if(w.__darRecentPublicationsV1)return;w.__darRecentPublicationsV1=true;
if(!/^\/(?:index\.html)?$/.test(location.pathname)&&!/^\/pwa(?:\/(?:index\.html)?)?$/.test(location.pathname))return;
var KEY="darAdultPreferredLocaleV1", DATA="/data/recent-posts.json", state={posts:[],days:5,expanded:false,loading:false,lastFetch:0};
var labels={
 de:["NEUE BEITRÄGE","Aktuelle Veröffentlichungen","Alle Beiträge der letzten Tage","2 Tage","3 Tage","5 Tage","Keine neuen Beiträge im gewählten Zeitraum.","Beitrag lesen","Beiträge ansehen","Schließen","Quelle öffnen","Original: Deutsch","Heute","Gestern","Beiträge"],
 ar:["المقالات الجديدة","أحدث المنشورات","جميع منشورات الأيام الماضية","يومان","3 أيام","5 أيام","لا توجد منشورات جديدة في هذه المدة.","اقرأ المقال","عرض المقالات","إغلاق","افتح المصدر","الأصل بالألمانية","اليوم","أمس","مقالات"],
 en:["NEW POSTS","Latest publications","All posts from recent days","2 days","3 days","5 days","No new posts in this period.","Read post","View posts","Close","Open source","Original: German","Today","Yesterday","posts"],
 tr:["YENİ YAZILAR","En son yayınlananlar","Son günlerdeki tüm yazılar","2 gün","3 gün","5 gün","Bu dönemde yeni yazı yok.","Yazıyı oku","Yazıları göster","Kapat","Kaynağı aç","Aslı: Almanca","Bugün","Dün","yazı"],
 ku:["NIVÎSÊN NÛ","Weşanên herî nû","Hemû nivîsên rojên dawî","2 roj","3 roj","5 roj","Di vê demê de nivîsa nû tune.","Nivîsê bixwîne","Nivîsan bibîne","Bigire","Çavkaniyê veke","Esl: Almanî","Îro","Duh","nivîs"],
 ckb:["بابەتە نوێیەکان","نوێترین بڵاوکراوەکان","هەموو بابەتەکانی ڕۆژانی ڕابردوو","٢ ڕۆژ","٣ ڕۆژ","٥ ڕۆژ","بابەتی نوێ نییە.","بابەت بخوێنەوە","بابەتەکان ببینە","داخستن","سەرچاوە بکەرەوە","دەقی ڕەسەن: ئەڵمانی","ئەمڕۆ","دوێنێ","بابەت"],
 bs:["NOVI ČLANCI","Najnovije objave","Sve objave posljednjih dana","2 dana","3 dana","5 dana","Nema novih objava u ovom periodu.","Pročitaj članak","Prikaži članke","Zatvori","Otvori izvor","Izvornik: njemački","Danas","Jučer","objava"],
 fr:["NOUVEAUX ARTICLES","Dernières publications","Tous les articles des derniers jours","2 jours","3 jours","5 jours","Aucune nouvelle publication sur cette période.","Lire l’article","Voir les articles","Fermer","Ouvrir la source","Original : allemand","Aujourd’hui","Hier","articles"],
 es:["ARTÍCULOS NUEVOS","Publicaciones recientes","Todos los artículos de los últimos días","2 días","3 días","5 días","No hay publicaciones nuevas en este período.","Leer artículo","Ver artículos","Cerrar","Abrir fuente","Original: alemán","Hoy","Ayer","artículos"]
};
function locale(){try{var v=String(localStorage.getItem(KEY)||"de").trim().toLowerCase();return labels[v]?v:"de"}catch(_){return"de"}}
function t(i){return labels[locale()][i]}
function dayKey(date){var pts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date),m={};pts.forEach(function(p){m[p.type]=p.value});return m.year+"-"+m.month+"-"+m.day}
function dayNumber(date){return Date.parse(dayKey(date)+"T00:00:00Z")/86400000}
function recent(posts,days,now){var today=dayNumber(now||new Date());return (posts||[]).filter(function(p){var dt=new Date(p.date||"");if(!p.id||!p.title||!Number.isFinite(dt.getTime()))return false;var age=Math.round(today-dayNumber(dt));return age>=0&&age<days}).sort(function(a,b){return Date.parse(b.date)-Date.parse(a.date)||String(a.id).localeCompare(String(b.id))})}
function isHome(){var qs=new URLSearchParams(location.search);if(d.body&&d.body.classList.contains("is-home-route"))return true;if(d.getElementById("pageRoot"))return (qs.get("page")||"start").toLowerCase()==="start";return false}
function host(){if(!isHome())return null;var native=d.getElementById("darHomeHtmlParityV1");if(native)return {root:native,anchor:native.querySelector("#dhpLibrary")||native.querySelector("#dhpPopular")||null};var basic=d.getElementById("dv3Latest");if(basic)return {root:basic.parentElement||basic,anchor:basic};var desktop=d.getElementById("pageRoot");if(desktop)return {root:desktop,anchor:desktop.querySelector(".site-footer")||null};return d.getElementById("appView")?{root:d.getElementById("appView"),anchor:null}:null}
function e(tag,cls,txt){var x=d.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x}
function dateLabel(p){var dt=new Date(p.date),today=dayNumber(new Date()),age=Math.round(today-dayNumber(dt));if(age===0)return t(12);if(age===1)return t(13);return new Intl.DateTimeFormat(locale()==="ckb"?"ckb-IQ":locale()==="ku"?"ku-TR":locale(),{day:"2-digit",month:"short",timeZone:"Europe/Berlin"}).format(dt)}
function openLink(p){if(d.getElementById("pageRoot"))return "/?page=beitrag&id="+encodeURIComponent(p.id);return "/?post="+encodeURIComponent(p.id)+"#post/"+encodeURIComponent(p.id)}
function addPost(parent,p,compact){var a=e("a","dar-recent-post");a.href=openLink(p);a.dataset.postId=p.id;var meta=e("span","dar-recent-meta",dateLabel(p)+" · "+(p.category||t(15)));a.appendChild(meta);a.appendChild(e("strong","dar-recent-title",p.title));if(!compact&&p.speaker)a.appendChild(e("span","dar-recent-speaker",p.speaker));a.appendChild(e("span","dar-recent-open",t(8)+" ›"));a.addEventListener("click",function(ev){if(d.getElementById("pageRoot"))return;if(typeof w.navigate==="function"){ev.preventDefault();w.navigate("post",p.id)}});parent.appendChild(a)}
function section(parent,kicker,title){var h=e("div","dar-recent-header");h.appendChild(e("span","dar-recent-kicker",kicker));h.appendChild(e("h2","dar-recent-heading",title));parent.appendChild(h)}
function render(){var mount=d.getElementById("darRecentPublicationsV1"),h=host();if(!h){if(mount)mount.hidden=true;return}if(!mount){mount=e("section","dar-recent-publications");mount.id="darRecentPublicationsV1";mount.setAttribute("aria-label",t(1));if(h.anchor&&h.anchor.parentNode)h.anchor.parentNode.insertBefore(mount,h.anchor);else h.root.appendChild(mount)}else if(!mount.isConnected||!h.root.contains(mount)){if(h.anchor&&h.anchor.parentNode)h.anchor.parentNode.insertBefore(mount,h.anchor);else h.root.appendChild(mount)}
 mount.hidden=false;mount.setAttribute("aria-label",t(1));mount.replaceChildren();
 // Supersede the old limited four-post teaser only after the full dataset loads.
 var oldList=d.getElementById("dhpPosts");var oldBlock=oldList&&oldList.closest(".dhp-section");
 if(oldBlock)oldBlock.classList.toggle("dar-recent-legacy-hidden",state.posts.length>0);
 section(mount,t(0),t(1));
 var items=recent(state.posts,state.days),last=recent(state.posts,5)[0],headline=e("div","dar-recent-highlight");
 if(last){addPost(headline,last,true)}else headline.appendChild(e("p","dar-recent-empty",t(6)));
 mount.appendChild(headline);
 var btn=e("button","dar-recent-toggle",state.expanded?t(10):t(9));btn.type="button";btn.setAttribute("aria-expanded",String(state.expanded));btn.addEventListener("click",function(){state.expanded=!state.expanded;render()});mount.appendChild(btn);
 if(!state.expanded)return;
 var panel=e("div","dar-recent-panel");
 var heading=e("h3","dar-recent-panel-title",t(2));panel.appendChild(heading);
 var tabs=e("div","dar-recent-days");tabs.setAttribute("role","group");tabs.setAttribute("aria-label",t(2));
 [2,3,5].forEach(function(n,i){var b=e("button","dar-recent-day"+(state.days===n?" is-selected":""),t(i+3));b.type="button";b.setAttribute("aria-pressed",String(state.days===n));b.addEventListener("click",function(){state.days=n;render()});tabs.appendChild(b)});panel.appendChild(tabs);
 if(!items.length){panel.appendChild(e("p","dar-recent-empty",t(6)))}else{
 var groups=new Map();items.forEach(function(p){var k=dayKey(new Date(p.date));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)});
 groups.forEach(function(posts,key){var title=e("h4","dar-recent-day-title",dateLabel(posts[0])+" · "+posts.length+" "+t(15));panel.appendChild(title);var rows=e("div","dar-recent-list");posts.forEach(function(p){addPost(rows,p,false)});panel.appendChild(rows)});
 }
 mount.appendChild(panel);
}
function refresh(){if(state.loading||Date.now()-state.lastFetch<90000)return;state.loading=true;state.lastFetch=Date.now();fetch(DATA+"?t="+Math.floor(Date.now()/60000),{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("index "+r.status);return r.json()}).then(function(j){if(j.schemaVersion!==1||!Array.isArray(j.posts))throw Error("invalid recent index");state.posts=j.posts;render()}).catch(function(){state.lastFetch=0;render()}).finally(function(){state.loading=false})}
var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;if(isHome()){render();refresh()}else{var x=d.getElementById("darRecentPublicationsV1");if(x)x.hidden=true}})}
function start(){queue();var obs=new MutationObserver(function(m){if(m.some(function(x){return x.target.id==="darRecentPublicationsV1"||x.target.closest&&x.target.closest("#darRecentPublicationsV1")}))return;queue()});obs.observe(d.body,{attributes:true,attributeFilter:["class"],childList:true,subtree:true});w.addEventListener("hashchange",queue);w.addEventListener("popstate",queue);w.addEventListener("pageshow",queue);d.addEventListener("dar:view-rendered",queue);d.addEventListener("visibilitychange",function(){if(!d.hidden){state.lastFetch=0;queue()}})}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
