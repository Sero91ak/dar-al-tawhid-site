/* DĀR AL TAWḤĪD · Adult visitor latest publications, last 2–5 Berlin calendar days.
   No notification, no Kids, no duplicate post imports, no layout replacements. */
(function(w,d){"use strict";
if(w.__darRecentPublicationsV1)return;w.__darRecentPublicationsV1=true;
if(!/^\/(?:index\.html)?$/.test(location.pathname)&&!/^\/pwa(?:\/(?:index\.html)?)?$/.test(location.pathname))return;
var KEY="darAdultPreferredLocaleV1", DATA="/data/recent-posts.json", state={posts:[],days:5,expanded:false,loading:false,lastFetch:0,modalShown:false,modalOpen:false,lastFocus:null,scrollLock:null,inertItems:[],lastModalSignature:"",titleLocales:{},manifestLoaded:{}};
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
var registry=w.DARAdultComponentI18nV1||null;
if(registry)registry.register("recent-posts",labels);
function locale(){if(registry)return registry.locale();try{var v=String(localStorage.getItem(KEY)||"de").trim().toLowerCase();return labels[v]?v:"de"}catch(_){return"de"}}
function t(i){return registry?registry.t("recent-posts",String(i),locale()):(labels[locale()][i]||labels.de[i]||"")}
function normalizedLanguage(code){return labels[code]?code:"de"}
function dayKey(date){var pts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date),m={};pts.forEach(function(p){m[p.type]=p.value});return m.year+"-"+m.month+"-"+m.day}
function dayNumber(date){return Date.parse(dayKey(date)+"T00:00:00Z")/86400000}
function recent(posts,days,now){var today=dayNumber(now||new Date());return (posts||[]).filter(function(p){var dt=new Date(p.date||"");if(!p.id||!p.title||!Number.isFinite(dt.getTime()))return false;var age=Math.round(today-dayNumber(dt));return age>=0&&age<days}).sort(function(a,b){return Date.parse(b.date)-Date.parse(a.date)||String(a.id).localeCompare(String(b.id))})}
function isHome(){var qs=new URLSearchParams(location.search);if(d.body&&d.body.classList.contains("is-home-route"))return true;if(d.getElementById("pageRoot"))return (qs.get("page")||"start").toLowerCase()==="start";return false}
function host(){if(!isHome())return null;var native=d.getElementById("darHomeHtmlParityV1");if(native)return {root:native,anchor:native.querySelector(".dhp-isnad")||native.querySelector(".dhp-quickbar")||native.querySelector("#dhpLibrary")||null};var basic=d.getElementById("dv3Latest");if(basic)return {root:basic.parentElement||basic,anchor:basic};var desktop=d.getElementById("pageRoot");if(desktop)return {root:desktop,anchor:desktop.querySelector(".dar-v8-recent")||desktop.querySelector(".dar-v8-discover")||desktop.querySelector(".site-footer")||null};return d.getElementById("appView")?{root:d.getElementById("appView"),anchor:null}:null}
function e(tag,cls,txt){var x=d.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x}
function dateLabel(p){var dt=new Date(p.date),today=dayNumber(new Date()),age=Math.round(today-dayNumber(dt));if(age===0)return t(12);if(age===1)return t(13);return new Intl.DateTimeFormat(locale()==="ckb"?"ckb-IQ":locale()==="ku"?"ku-TR":locale(),{day:"2-digit",month:"short",timeZone:"Europe/Berlin"}).format(dt)}
function openLink(p){if(d.getElementById("pageRoot"))return "/?page=beitrag&id="+encodeURIComponent(p.id);return "/?post="+encodeURIComponent(p.id)+"#post/"+encodeURIComponent(p.id)}

function displayTitle(p){var trans=state.titleLocales[p.id]||{},l=locale();
 if(l!=="de"&&typeof trans[l]==="string"&&trans[l].trim())return trans[l].toLocaleUpperCase(l==="tr"?"tr":l);
 return p.title}
function untranslated(p){return locale()!=="de"&&!(state.titleLocales[p.id]||{})[locale()]}
function fetchTitleManifests(posts){
 posts.filter(function(p){return p.localeManifest&&/^\/assets\/[A-Za-z0-9-]+-locales\.json$/.test(p.localeManifest)}).slice(0,24).forEach(function(p){
 var key=p.localeManifest;if(state.manifestLoaded[key])return;state.manifestLoaded[key]=true;
 fetch(key,{cache:"force-cache",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("locale manifest");return r.json()}).then(function(data){
 if(data.contentId!=="post:"+p.id||!data.locales)return;
 var titles={};["de","ar","en","tr","ku","ckb","bs","fr","es"].forEach(function(code){
 if(data.locales[code]&&typeof data.locales[code].title==="string")titles[code]=data.locales[code].title});
 state.titleLocales[p.id]=titles;render();refreshOpenNotice();
 }).catch(function(){delete state.manifestLoaded[key]});
 });
}

function addPost(parent,p,compact){var a=e("a","dar-recent-post");a.href=openLink(p);a.dataset.postId=p.id;var meta=e("span","dar-recent-meta",dateLabel(p)+" · "+(p.category||t(14)));a.appendChild(meta);a.appendChild(e("strong","dar-recent-title",displayTitle(p)));if(!compact&&p.speaker)a.appendChild(e("span","dar-recent-speaker",p.speaker));if(untranslated(p))a.appendChild(e("small","dar-recent-untranslated",t(11)));a.appendChild(e("span","dar-recent-open",t(7)+" ›"));a.addEventListener("click",function(ev){if(d.getElementById("pageRoot"))return;if(typeof w.navigate==="function"){ev.preventDefault();w.navigate("post",p.id)}});parent.appendChild(a)}
function section(parent,kicker,title){var h=e("div","dar-recent-header");h.appendChild(e("span","dar-recent-kicker",kicker));h.appendChild(e("h2","dar-recent-heading",title));parent.appendChild(h)}
function render(){var mount=d.getElementById("darRecentPublicationsV1"),h=host();if(!h){if(mount)mount.hidden=true;return}if(!mount){mount=e("section","dar-recent-publications");mount.id="darRecentPublicationsV1";mount.setAttribute("aria-label",t(1));if(h.anchor&&h.anchor.parentNode)h.anchor.parentNode.insertBefore(mount,h.anchor);else h.root.appendChild(mount)}else if(!mount.isConnected||!h.root.contains(mount)){if(h.anchor&&h.anchor.parentNode)h.anchor.parentNode.insertBefore(mount,h.anchor);else h.root.appendChild(mount)}
 mount.hidden=false;mount.setAttribute("aria-label",t(1));mount.replaceChildren();
 // Supersede the old limited four-post teaser only after the full dataset loads.
 var oldList=d.getElementById("dhpPosts");var oldBlock=oldList&&oldList.closest(".dhp-section");
 if(oldBlock&&oldBlock.classList.contains("dar-recent-legacy-hidden")!==(state.posts.length>0))oldBlock.classList.toggle("dar-recent-legacy-hidden",state.posts.length>0);
 section(mount,t(0),t(1));
 var items=recent(state.posts,state.days),last=recent(state.posts,5)[0],headline=e("div","dar-recent-highlight");
 if(last){addPost(headline,last,true)}else headline.appendChild(e("p","dar-recent-empty",t(6)));
 mount.appendChild(headline);
 var btn=e("button","dar-recent-toggle",state.expanded?t(9):t(8));btn.type="button";btn.setAttribute("aria-expanded",String(state.expanded));btn.addEventListener("click",function(){state.expanded=!state.expanded;render()});mount.appendChild(btn);
 if(!state.expanded)return;
 var panel=e("div","dar-recent-panel");
 var heading=e("h3","dar-recent-panel-title",t(2));panel.appendChild(heading);
 var tabs=e("div","dar-recent-days");tabs.setAttribute("role","group");tabs.setAttribute("aria-label",t(2));
 [2,3,4,5].forEach(function(n,i){var dayLabels={de:"4 Tage",ar:"4 أيام",en:"4 days",tr:"4 gün",ku:"4 roj",ckb:"٤ ڕۆژ",bs:"4 dana",fr:"4 jours",es:"4 días"};var b=e("button","dar-recent-day"+(state.days===n?" is-selected":""),n===4?dayLabels[locale()]:t(n===5?5:i+3));b.type="button";b.setAttribute("aria-pressed",String(state.days===n));b.addEventListener("click",function(){state.days=n;render()});tabs.appendChild(b)});panel.appendChild(tabs);
 if(!items.length){panel.appendChild(e("p","dar-recent-empty",t(6)))}else{
 var groups=new Map();items.forEach(function(p){var k=dayKey(new Date(p.date));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)});
 groups.forEach(function(posts,key){var title=e("h4","dar-recent-day-title",dateLabel(posts[0])+" · "+posts.length+" "+t(14));panel.appendChild(title);var rows=e("div","dar-recent-list");posts.forEach(function(p){addPost(rows,p,false)});panel.appendChild(rows)});
 }
 mount.appendChild(panel);
}
function refresh(){if(state.loading||Date.now()-state.lastFetch<90000)return;state.loading=true;state.lastFetch=Date.now();fetch(DATA+"?t="+Math.floor(Date.now()/60000),{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("index "+r.status);return r.json()}).then(function(j){if(j.schemaVersion!==1||!Array.isArray(j.posts))throw Error("invalid recent index");state.posts=j.posts;render();fetchTitleManifests(j.posts);scheduleNotice()}).catch(function(){state.lastFetch=0;render()}).finally(function(){state.loading=false})}

/* On-device/in-app announcement, independent of OneSignal permission.
   Once per launch session; "skip" silences exactly this published batch until
   a newer article arrives. No popup for empty/failed publication indexes. */
var NOTICE_SESSION="darRecentNoticeOpenedSessionV1",NOTICE_SKIPPED="darRecentNoticeSkippedPostV1";
function latestSignature(posts){var hits=recent(posts,5);return hits.length?hits[0].id+"|"+hits[0].date:""}
function canAnnounce(){if(!isHome()||state.modalShown||state.modalOpen||d.hidden||!recent(state.posts,5).length)return false;
 var sig=latestSignature(state.posts);
 try{if(w.sessionStorage.getItem(NOTICE_SESSION)===sig||w.localStorage.getItem(NOTICE_SKIPPED)===sig)return false}catch(_){}
 var otherModal=Array.from(d.querySelectorAll('[role="dialog"]:not(#darRecentNoticeV1),[aria-modal="true"]:not(#darRecentNoticeV1),.dar-onboarding-overlay:not([hidden]),.modal.show,.modal.open')).some(function(el){var st=w.getComputedStyle(el);return st.display!=="none"&&st.visibility!=="hidden"&&el.getClientRects().length>0});if(otherModal)return false;
 return true}
function dismissNotice(skip){var layer=d.getElementById("darRecentNoticeV1");if(!layer)return;
 var sig=latestSignature(state.posts);try{w.sessionStorage.setItem(NOTICE_SESSION,sig);if(skip)w.localStorage.setItem(NOTICE_SKIPPED,sig)}catch(_){}
 layer.remove();unlockNoticeBackground();state.modalOpen=false;state.modalShown=true;d.removeEventListener("keydown",noticeKeydown,true);d.removeEventListener("focusin",noticeFocus,true);
 if(state.lastFocus&&state.lastFocus.isConnected&&typeof state.lastFocus.focus==="function")state.lastFocus.focus({preventScroll:true});
 state.lastFocus=null}

function themeValue(el,key,fallback){try{var v=w.getComputedStyle(el).getPropertyValue(key).trim();return v||fallback}catch(_){return fallback}}
function applyNoticeTheme(layer){
 if(!layer)return;
 var home=d.getElementById("darHomeHtmlParityV1"),root=d.documentElement,reference=home||root;
 var desktop=!!d.getElementById("pageRoot");
 var ink=themeValue(reference,home?"--dhp-ink":desktop?"--ink":"--text","#f3f0e7");
 var paper=themeValue(reference,home?"--dhp-paper":desktop?"--paper":"--card","#153029");
 var gold=themeValue(reference,home?"--dhp-gold":"--gold2","#af9a68");
 var line=themeValue(reference,home?"--dhp-line":"--line","#9e8c66");
 var accent=themeValue(reference,home?"--dhp-accent":"--green","#245543");
 layer.style.setProperty("--notice-ink",ink);
 layer.style.setProperty("--notice-paper",paper);
 layer.style.setProperty("--notice-gold",gold);
 layer.style.setProperty("--notice-line",line);
 layer.style.setProperty("--notice-accent",accent);
 layer.dataset.darAppearance=(root.getAttribute("data-theme-variant")||root.getAttribute("data-theme")||d.body.getAttribute("data-theme")||"system");
}
function lockNoticeBackground(layer){
 var y=w.scrollY||d.documentElement.scrollTop||0,b=d.body,old={position:b.style.position,top:b.style.top,left:b.style.left,right:b.style.right,width:b.style.width,overflow:b.style.overflow};
 state.scrollLock={y:y,style:old};state.inertItems=[];
 Array.from(b.children).forEach(function(child){if(child===layer||child.tagName==="SCRIPT"||child.tagName==="STYLE")return;
 state.inertItems.push({node:child,inert:child.inert});child.inert=true});
 b.style.position="fixed";b.style.top="-"+y+"px";b.style.left="0";b.style.right="0";b.style.width="100%";b.style.overflow="hidden";
 d.documentElement.classList.add("dar-notice-is-open");
}
function unlockNoticeBackground(){
 state.inertItems.forEach(function(item){if(item.node&&item.node.isConnected)item.node.inert=item.inert});state.inertItems=[];
 var lock=state.scrollLock;state.scrollLock=null;if(lock){
 var b=d.body;Object.keys(lock.style).forEach(function(k){b.style[k]=lock.style[k]});w.scrollTo(0,lock.y)}
 d.documentElement.classList.remove("dar-notice-is-open");
}
function noticeFocus(ev){var layer=d.getElementById("darRecentNoticeV1");if(layer&&!layer.contains(ev.target)){
 var close=layer.querySelector(".dar-recent-notice-x");if(close)close.focus({preventScroll:true})}}
function openPostById(id){
 if(!id)return;
 if(d.getElementById("pageRoot")){w.location.assign("/?page=beitrag&id="+encodeURIComponent(id));return}
 try{if(typeof w.navigate==="function"){w.navigate("post",id);return}}catch(e){}
 // Official app post route, also used by the existing premium feed.
 w.location.hash="#post/"+encodeURIComponent(id);
}
function noticeClick(ev){
 var layer=d.getElementById("darRecentNoticeV1");if(!layer||!layer.contains(ev.target))return;
 var post=ev.target.closest&&ev.target.closest("[data-dar-post-id]"),
 action=ev.target.closest&&ev.target.closest("[data-dar-notice-action]");
 if(!post&&!action&&ev.target!==layer)return;
 ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
 if(post){var id=post.dataset.darPostId;dismissNotice(false);openPostById(id);return}
 var name=action&&action.dataset.darNoticeAction;
 if(name==="all"){dismissNotice(false);state.expanded=true;state.days=5;render();var sec=d.getElementById("darRecentPublicationsV1");if(sec)sec.scrollIntoView({block:"start",behavior:"smooth"});return}
 if(name==="skip"){dismissNotice(true);return}
 dismissNotice(false);
}

function noticeKeydown(ev){var layer=d.getElementById("darRecentNoticeV1");if(!layer)return;
 if(ev.key==="Escape"){ev.preventDefault();dismissNotice(false);return}
 if(ev.key==="Tab"){var nodes=Array.from(layer.querySelectorAll("button,a[href]")).filter(function(x){return !x.disabled});
 if(!nodes.length)return;var first=nodes[0],last=nodes[nodes.length-1];
 if(ev.shiftKey&&d.activeElement===first){ev.preventDefault();last.focus()}
 else if(!ev.shiftKey&&d.activeElement===last){ev.preventDefault();first.focus()}
 }}
function noticeLink(p){var a=e("a","dar-recent-notice-article");a.href=openLink(p);a.dataset.darPostId=p.id;a.appendChild(e("span","dar-recent-notice-date",dateLabel(p)));
 a.appendChild(e("strong","",displayTitle(p)));if(untranslated(p))a.appendChild(e("small","dar-recent-untranslated",t(11)));a.appendChild(e("span","dar-recent-notice-arrow",t(7)+" ›"));
 return a}

function refreshOpenNotice(){
 var layer=d.getElementById("darRecentNoticeV1");if(!layer)return;
 var fields={".dar-recent-notice-kicker":t(0),".dar-recent-notice-header h2":t(1),".dar-recent-notice-subtitle":t(2),".dar-recent-notice-all":t(8)};
 Object.keys(fields).forEach(function(s){var el=layer.querySelector(s);if(el)el.textContent=fields[s]});
 var close=layer.querySelector(".dar-recent-notice-x");if(close)close.setAttribute("aria-label",t(9));
 var skip=layer.querySelector(".dar-recent-notice-skip");if(skip)skip.textContent=skipText();
 var card=layer.querySelector(".dar-recent-notice-card");if(card)card.dir=["ar","ckb"].includes(locale())?"rtl":"ltr";
 layer.querySelectorAll("[data-dar-post-id]").forEach(function(el){
 var p=state.posts.find(function(x){return x.id===el.dataset.darPostId});if(!p)return;
 var title=el.querySelector("strong"),meta=el.querySelector(".dar-recent-notice-date"),arrow=el.querySelector(".dar-recent-notice-arrow");
 if(title)title.textContent=displayTitle(p);if(meta)meta.textContent=dateLabel(p);if(arrow)arrow.textContent=t(7)+" ›";
 var note=el.querySelector(".dar-recent-untranslated");if(untranslated(p)){if(!note){note=e("small","dar-recent-untranslated");el.insertBefore(note,arrow)}note.textContent=t(11)}else if(note)note.remove()
 });
 applyNoticeTheme(layer);
}
function skipText(){return ({"de":"Für diese Beiträge überspringen","en":"Skip these posts","tr":"Bu yazıları atla","ar":"تخطي هذه المقالات","ku":"Van nivîsan derbas bike","ckb":"ئەم بابەتانە تێپەڕێنە","bs":"Preskoči ove članke","fr":"Ignorer ces articles","es":"Omitir estos artículos"})[locale()]||"Überspringen"}
function syncLocale(){render();refreshOpenNotice()}

function openNewPostsNotice(){if(!canAnnounce())return;
 var hits=recent(state.posts,5);if(!hits.length)return;
 var sig=latestSignature(state.posts);try{w.sessionStorage.setItem(NOTICE_SESSION,sig)}catch(_){}
 state.modalOpen=true;state.lastFocus=d.activeElement;
 var layer=e("div","dar-recent-notice-overlay");layer.id="darRecentNoticeV1";
 layer.setAttribute("role","presentation");
 var card=e("section","dar-recent-notice-card");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.setAttribute("aria-labelledby","darRecentNoticeHeadingV1");
 card.setAttribute("aria-describedby","darRecentNoticeDescV1");card.setAttribute("dir",["ar","ckb"].includes(locale())?"rtl":"ltr");
 var header=e("div","dar-recent-notice-header");
 var intro=e("div","dar-recent-notice-intro");intro.appendChild(e("span","dar-recent-notice-kicker",t(0)));var h=e("h2","",t(1));h.id="darRecentNoticeHeadingV1";intro.appendChild(h);header.appendChild(intro);
 var close=e("button","dar-recent-notice-x","×");close.type="button";close.dataset.darNoticeAction="close";close.setAttribute("aria-label",t(9));header.appendChild(close);card.appendChild(header);
 var desc=e("p","dar-recent-notice-subtitle",t(2));desc.id="darRecentNoticeDescV1";card.appendChild(desc);
 var list=e("div","dar-recent-notice-list");hits.slice(0,4).forEach(function(p){list.appendChild(noticeLink(p))});card.appendChild(list);
 var actions=e("div","dar-recent-notice-actions");
 var all=e("button","dar-recent-notice-all",t(8));all.type="button";all.dataset.darNoticeAction="all";actions.appendChild(all);
 var skip=e("button","dar-recent-notice-skip",skipText());skip.type="button";skip.dataset.darNoticeAction="skip";actions.appendChild(skip);
 card.appendChild(actions);layer.appendChild(card);
 layer.addEventListener("click",noticeClick,true);
 d.body.appendChild(layer);lockNoticeBackground(layer);applyNoticeTheme(layer);d.addEventListener("keydown",noticeKeydown,true);d.addEventListener("focusin",noticeFocus,true);close.focus({preventScroll:true});
}

var noticeScheduled=false;function scheduleNotice(){if(noticeScheduled||state.modalShown||state.modalOpen||!state.posts.length||!isHome())return;noticeScheduled=true;w.setTimeout(function(){noticeScheduled=false;openNewPostsNotice()},1100)}
var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;if(isHome()){render();refresh();scheduleNotice()}else{var x=d.getElementById("darRecentPublicationsV1");if(x)x.hidden=true}})}
function start(){queue();var obs=new MutationObserver(function(m){if(m.some(function(x){return x.target.id==="darRecentPublicationsV1"||x.target.closest&&x.target.closest("#darRecentPublicationsV1")}))return;queue()});obs.observe(d.body,{attributes:true,attributeFilter:["class"],childList:true,subtree:true});w.addEventListener("hashchange",queue);w.addEventListener("popstate",queue);w.addEventListener("dar-adult-locale-changed",syncLocale);w.addEventListener("storage",function(ev){if(ev.key===KEY)syncLocale()});w.addEventListener("pageshow",queue);d.addEventListener("dar:view-rendered",queue);d.addEventListener("visibilitychange",function(){if(!d.hidden){state.lastFetch=0;queue()}})}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
