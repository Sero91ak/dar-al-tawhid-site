/* DĀR AL TAWḤĪD · Adult visitor latest publications, last 2–5 Berlin calendar days.
   No notification, no Kids, no duplicate post imports, no layout replacements. */
(function(w,d){"use strict";
if(w.__darRecentPublicationsV1)return;w.__darRecentPublicationsV1=true;
if(!/^\/(?:index\.html)?$/.test(location.pathname)&&!/^\/pwa(?:\/(?:index\.html)?)?$/.test(location.pathname))return;
var KEY="darAdultPreferredLocaleV1", DATA="/data/recent-posts.json", state={posts:[],days:5,expanded:false,loading:false,lastFetch:0,modalShown:false,modalOpen:false,lastFocus:null,scrollLock:null,inertItems:[],lastModalSignature:"",titleLocales:{},manifestLoaded:{},inlineOpen:false,returnToInline:false,homeScrollY:0,renderedInlineLocale:""};
var labels={
 de:["NEUE BEITRÄGE","Aktuelle Veröffentlichungen","Alle Beiträge der letzten Tage","2 Tage","3 Tage","5 Tage","Keine neuen Beiträge im gewählten Zeitraum.","Beitrag lesen","Beiträge ansehen","Schließen","Quelle öffnen","Original: Deutsch","Heute","Gestern","Beiträge","4 Tage","Für diese Beiträge überspringen","Neuigkeiten öffnen","Beitrag"],
 ar:["المقالات الجديدة","أحدث المنشورات","جميع منشورات الأيام الماضية","يومان","3 أيام","5 أيام","لا توجد منشورات جديدة في هذه المدة.","اقرأ المقال","عرض المقالات","إغلاق","افتح المصدر","الأصل بالألمانية","اليوم","أمس","مقالات","4 أيام","تخطي هذه المقالات","عرض أحدث المقالات","مقال"],
 en:["NEW POSTS","Latest publications","All posts from recent days","2 days","3 days","5 days","No new posts in this period.","Read post","View posts","Close","Open source","Original: German","Today","Yesterday","posts","4 days","Skip these posts","Open latest posts","post"],
 tr:["YENİ YAZILAR","En son yayınlananlar","Son günlerdeki tüm yazılar","2 gün","3 gün","5 gün","Bu dönemde yeni yazı yok.","Yazıyı oku","Yazıları göster","Kapat","Kaynağı aç","Aslı: Almanca","Bugün","Dün","yazı","4 gün","Bu yazıları atla","Yeni yazıları aç","yazı"],
 ku:["NIVÎSÊN NÛ","Weşanên herî nû","Hemû nivîsên rojên dawî","2 roj","3 roj","5 roj","Di vê demê de nivîsa nû tune.","Nivîsê bixwîne","Nivîsan bibîne","Bigire","Çavkaniyê veke","Esl: Almanî","Îro","Duh","nivîs","4 roj","Van nivîsan derbas bike","Nivîsên nû veke","nivîs"],
 ckb:["بابەتە نوێیەکان","نوێترین بڵاوکراوەکان","هەموو بابەتەکانی ڕۆژانی ڕابردوو","٢ ڕۆژ","٣ ڕۆژ","٥ ڕۆژ","بابەتی نوێ نییە.","بابەت بخوێنەوە","بابەتەکان ببینە","داخستن","سەرچاوە بکەرەوە","دەقی ڕەسەن: ئەڵمانی","ئەمڕۆ","دوێنێ","بابەت","٤ ڕۆژ","ئەم بابەتانە تێپەڕێنە","بابەتە نوێیەکان بکەرەوە","بابەت"],
 bs:["NOVI ČLANCI","Najnovije objave","Sve objave posljednjih dana","2 dana","3 dana","5 dana","Nema novih objava u ovom periodu.","Pročitaj članak","Prikaži članke","Zatvori","Otvori izvor","Izvornik: njemački","Danas","Jučer","objava","4 dana","Preskoči ove članke","Otvori nove članke","objava"],
 fr:["NOUVEAUX ARTICLES","Dernières publications","Tous les articles des derniers jours","2 jours","3 jours","5 jours","Aucune nouvelle publication sur cette période.","Lire l’article","Voir les articles","Fermer","Ouvrir la source","Original : allemand","Aujourd’hui","Hier","articles","4 jours","Ignorer ces articles","Ouvrir les nouveaux articles","article"],
 es:["ARTÍCULOS NUEVOS","Publicaciones recientes","Todos los artículos de los últimos días","2 días","3 días","5 días","No hay publicaciones nuevas en este período.","Leer artículo","Ver artículos","Cerrar","Abrir fuente","Original: alemán","Hoy","Ayer","artículos","4 días","Omitir estos artículos","Abrir artículos recientes","artículo"]
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
function host(){if(!isHome())return null;var native=d.getElementById("darHomeHtmlParityV1");if(native){var q=native.querySelector(".dhp-quran-section");return {root:native,anchor:q||native.querySelector("#dhpLibrary"),after:!!q}}var basic=d.getElementById("dv3Latest");if(basic)return {root:basic.parentElement||basic,anchor:basic,after:true};var desktop=d.getElementById("pageRoot");if(desktop)return {root:desktop,anchor:desktop.querySelector(".dar-v8-discover")||desktop.querySelector(".site-footer")||null};return d.getElementById("appView")?{root:d.getElementById("appView"),anchor:null}:null}
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
 state.titleLocales[p.id]=titles;render();refreshOpenNotice();paintInlineList();
 }).catch(function(){delete state.manifestLoaded[key]});
 });
}

function addPost(parent,p,compact){var a=e("a","dar-recent-post");a.href=openLink(p);a.dataset.postId=p.id;var meta=e("span","dar-recent-meta",dateLabel(p)+" · "+(p.category||t(14)));a.appendChild(meta);a.appendChild(e("strong","dar-recent-title",displayTitle(p)));if(!compact&&p.speaker)a.appendChild(e("span","dar-recent-speaker",p.speaker));if(untranslated(p))a.appendChild(e("small","dar-recent-untranslated",t(11)));a.appendChild(e("span","dar-recent-open",t(7)+" ›"));a.addEventListener("click",function(ev){if(d.getElementById("pageRoot"))return;if(typeof w.navigate==="function"){ev.preventDefault();w.navigate("post",p.id)}});parent.appendChild(a)}
function section(parent,kicker,title){var h=e("div","dar-recent-header");h.appendChild(e("span","dar-recent-kicker",kicker));h.appendChild(e("h2","dar-recent-heading",title));parent.appendChild(h)}
/* The recent-posts list is an INTERNAL app view. Never navigate to an
   extra HTML page, never show day selectors or a loading state. */
function internalHost(){
 return d.getElementById("darHomeHtmlParityV1")||d.getElementById("pageRoot")||d.getElementById("appView");
}
function recentInlinePosts(){return recent(state.posts,5)}
function inlineEntry(p){
 var a=e("a","dar-recent-inline-entry");a.href=openLink(p);
 var body=e("span","dar-recent-inline-entry-text");
 body.appendChild(e("strong","dar-recent-inline-entry-title",displayTitle(p)));
 if(untranslated(p))body.appendChild(e("small","dar-recent-inline-original",t(11)));
 a.appendChild(body);
 var arrow=e("span","dar-recent-inline-entry-arrow","›");arrow.setAttribute("aria-hidden","true");a.appendChild(arrow);
 a.addEventListener("click",function(ev){
  ev.preventDefault();
  closeInlineList(true);
  openPostById(p.id);
 });
 return a;
}
function paintInlineList(){
 if(!state.inlineOpen)return;
 var root=d.getElementById("darRecentInlineListV2");
 if(!root)return;
 root.lang=locale();root.dir=["ar","ckb"].includes(locale())?"rtl":"ltr";state.renderedInlineLocale=locale();
 var host=internalHost();if(host){var cs=w.getComputedStyle(host);[["--inline-bg","--dhp-bg"],["--inline-paper","--dhp-paper"],["--inline-ink","--dhp-ink"],["--inline-gold","--dhp-gold"],["--inline-line","--dhp-line"]].forEach(function(k){var v=cs.getPropertyValue(k[1]).trim();if(v)root.style.setProperty(k[0],v)})}
 root.replaceChildren();
 var top=e("header","dar-recent-inline-top");
 var back=e("button","dar-recent-inline-back","‹");back.type="button";
 back.setAttribute("aria-label",t(9));back.addEventListener("click",function(){closeInlineList(false)});
 top.appendChild(back);
 top.appendChild(e("h1","dar-recent-inline-heading",t(1)));
 root.appendChild(top);
 var list=e("div","dar-recent-inline-entries");
 var posts=recentInlinePosts();
 if(!posts.length)list.appendChild(e("p","dar-recent-inline-empty",t(6)));
 else posts.forEach(function(p){list.appendChild(inlineEntry(p))});
 root.appendChild(list);
}
function openInlineList(returning){
 var host=internalHost();
 if(!host)return;
 if(!returning)state.homeScrollY=w.scrollY||0;
 state.inlineOpen=true;state.returnToInline=false;
 var root=d.getElementById("darRecentInlineListV2");
 if(!root){root=e("section","dar-recent-inline-view");root.id="darRecentInlineListV2";
  root.setAttribute("aria-label",t(1));host.insertAdjacentElement("afterend",root)}
 root.hidden=false;
 d.body.classList.add("dar-recent-inline-open");
 paintInlineList();
 w.scrollTo({top:Math.max(0,host.getBoundingClientRect().top+(w.scrollY||0)),behavior:"instant"});
 var back=root.querySelector(".dar-recent-inline-back");if(back)back.focus({preventScroll:true});
}
function closeInlineList(toPost){
 if(!state.inlineOpen)return;
 state.inlineOpen=false;
 state.returnToInline=!!toPost;
 d.body.classList.remove("dar-recent-inline-open");
 var root=d.getElementById("darRecentInlineListV2");
 if(root){root.hidden=true;root.replaceChildren()}
 if(!toPost)w.scrollTo({top:state.homeScrollY||0,behavior:"instant"});
}
function openArchive(){openInlineList(false)}
function syncInlineAfterRoute(){
 // Native post-reader back navigation must restore the existing in-memory list;
 // no new network request, new HTML document, spinner or date-filter screen.
 if(state.returnToInline&&isHome()&&!state.inlineOpen){
  state.returnToInline=false;openInlineList(true);
 }else if(state.inlineOpen&&!isHome()){closeInlineList(false)}
}

/* Rebuild-safe invariant: these are DOM siblings in one uninterrupted
   section on all visitor shells. Other widgets are pushed below Qurʾān.
   We intentionally do NOT reorder top-level prayer clock, fixed header or tabs. */
function enforceCanonicalHomeOrder(native,mount){
 if(!native)return false;
 var content=native.querySelector(".dhp-content")||native;
 var names=[".dhp-welcome",".dhp-isnad",".dhp-quickbar",".dhp-search-box",".dhp-quran-section"];
 var chain=names.map(function(x){return content.querySelector(x)});
 if(chain.some(function(x){return !x||x.parentElement!==content}))return false;
 var source=content.querySelector(".dhp-home-source-v55");
 // The prayer times have their original FRONT-STAGE slot directly below the
 // source strapline and ABOVE Salām. The previous forced source→Salām move
 // accidentally pushed this live prayer clock behind recent posts.
 var prayer=content.querySelector(".dat-smart-prayer")||content.querySelector("#dhpPrayerNativeMount");
 var preWelcome=source&&source.parentElement===content?source:null;
 if(prayer&&prayer.parentElement===content){
  if(preWelcome&&prayer.previousElementSibling!==preWelcome)preWelcome.insertAdjacentElement("afterend",prayer);
  preWelcome=prayer;
 }
 // Friday information belongs after the original prayer clock, not behind the
 // news strip. Preserve that existing clock→Friday adjacency when present.
 var friday=content.querySelector("#dhpFridayMirror");
 if(friday&&preWelcome===prayer&&friday.parentElement===content&&!friday.hidden){
  if(friday.previousElementSibling!==prayer)prayer.insertAdjacentElement("afterend",friday);
  preWelcome=friday;
 }
 if(preWelcome&&preWelcome.nextElementSibling!==chain[0])preWelcome.insertAdjacentElement("afterend",chain[0]);
 for(var i=1;i<chain.length;i++){if(chain[i-1].nextElementSibling!==chain[i])chain[i-1].insertAdjacentElement("afterend",chain[i])}
 if(mount&&mount.parentElement===content&&chain[4].nextElementSibling!==mount)chain[4].insertAdjacentElement("afterend",mount);
 return true;
}
function placeCompact(h,mount){
 if(!mount.isConnected){if(h.anchor&&h.anchor.parentNode){if(h.after)h.anchor.insertAdjacentElement("afterend",mount);else h.anchor.parentNode.insertBefore(mount,h.anchor)}else h.root.appendChild(mount);return}
 if(!h.root.contains(mount)){if(h.anchor&&h.anchor.parentNode){if(h.after)h.anchor.insertAdjacentElement("afterend",mount);else h.anchor.parentNode.insertBefore(mount,h.anchor)}else h.root.appendChild(mount);return}
 if(h.after&&h.anchor&&mount.previousElementSibling!==h.anchor)h.anchor.insertAdjacentElement("afterend",mount);
}
function render(){
 var mount=d.getElementById("darRecentPublicationsV1"),h=host();
 if(!h){if(mount)mount.hidden=true;return}
 if(!mount){mount=e("section","dar-recent-publications");mount.id="darRecentPublicationsV1"}
 placeCompact(h,mount);
 if(h.root&&h.root.id==="darHomeHtmlParityV1")enforceCanonicalHomeOrder(h.root,mount);
 mount.hidden=false;
 var oldList=d.getElementById("dhpPosts"),oldBlock=oldList&&oldList.closest(".dhp-section");
 if(oldBlock&&oldBlock.classList.contains("dar-recent-legacy-hidden")!==(state.posts.length>0))oldBlock.classList.toggle("dar-recent-legacy-hidden",state.posts.length>0);
 var recentHits=recent(state.posts,5);
 var hits=recentHits.length?recentHits:publishedPosts(state.posts).slice().sort(function(a,b){return Date.parse(b.date)-Date.parse(a.date)}).slice(0,1);
 var signature=locale()+"|"+hits.map(function(p){return p.id+"@"+p.date+"@"+displayTitle(p)+"@"+String(p.excerpt||"")}).join(";");
 if(mount.dataset.darRecentPremiumSig===signature&&mount.querySelector(".dar-recent-premium-track"))return;
 mount.className="dar-recent-publications dar-recent-premium";
 mount.lang=locale();mount.dir=["ar","ckb"].includes(locale())?"rtl":"ltr";
 mount.setAttribute("aria-label",t(1));mount.replaceChildren();
 var heading=e("header","dar-recent-premium-heading");
 heading.appendChild(e("span","dar-recent-premium-kicker",t(0)));
 heading.appendChild(e("h2","dar-recent-premium-section-title",t(1)));
 mount.appendChild(heading);
 mount.appendChild(e("div","dar-recent-premium-line"));
 if(!recentHits.length&&hits.length)mount.appendChild(e("p","dar-recent-premium-older",t(6)));
 var viewport=e("div","dar-recent-premium-viewport");
 var track=e("div","dar-recent-premium-track");
 track.setAttribute("aria-label",t(1));track.tabIndex=0;
 hits.forEach(function(p,i){
  var slide=e("article","dar-recent-premium-slide");
  slide.setAttribute("aria-label",(i+1)+" / "+hits.length);
  slide.appendChild(e("span","dar-recent-premium-meta",dateLabel(p)+" · "+(p.category||t(14))));
  slide.appendChild(e("h3","dar-recent-premium-title",displayTitle(p)));
  var excerpt=String(p.excerpt||"").replace(/\s+/g," ").trim();
  if(excerpt)slide.appendChild(e("p","dar-recent-premium-excerpt",excerpt.slice(0,310)));
  if(p.speaker)slide.appendChild(e("span","dar-recent-premium-source",p.speaker));
  if(untranslated(p))slide.appendChild(e("small","dar-recent-premium-original",t(11)));
  var actions=e("div","dar-recent-premium-actions");
  var link=e("a","dar-recent-premium-read",t(7)+" ›");link.href=openLink(p);
  link.addEventListener("click",function(ev){if(d.getElementById("pageRoot"))return;ev.preventDefault();openPostById(p.id)});
  actions.appendChild(link);
  if(p.sourceUrl&&/^\/q\/\d+\/?$/.test(p.sourceUrl)){var src=e("a","dar-recent-premium-source-link",t(10));src.href=p.sourceUrl;actions.appendChild(src)}
  slide.appendChild(actions);track.appendChild(slide);
 });
 if(!hits.length){var empty=e("p","dar-recent-premium-empty",t(6));track.appendChild(empty)}
 viewport.appendChild(track);mount.appendChild(viewport);
 if(hits.length>1){
  var navigation=e("nav","dar-recent-premium-nav");
  navigation.setAttribute("aria-label",t(1));
  var previous=e("button","dar-recent-premium-previous","‹");previous.type="button";previous.setAttribute("aria-label",t(1)+" – 1");
  var counter=e("span","dar-recent-premium-counter","01 / "+String(hits.length).padStart(2,"0"));counter.setAttribute("aria-live","polite");
  var next=e("button","dar-recent-premium-next","›");next.type="button";next.setAttribute("aria-label",t(1)+" – "+hits.length);
  navigation.appendChild(previous);navigation.appendChild(counter);navigation.appendChild(next);mount.appendChild(navigation);
  var index=0,rtl=mount.dir==="rtl",scrollQueued=false;
  function update(){counter.textContent=String(index+1).padStart(2,"0")+" / "+String(hits.length).padStart(2,"0");previous.disabled=index===0;next.disabled=index===hits.length-1}
  function go(n){index=Math.max(0,Math.min(hits.length-1,n));track.scrollTo({left:(rtl?-1:1)*index*track.clientWidth,behavior:w.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});update()}
  previous.addEventListener("click",function(){go(index-1)});
  next.addEventListener("click",function(){go(index+1)});
  track.addEventListener("scroll",function(){if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(function(){scrollQueued=false;index=Math.max(0,Math.min(hits.length-1,Math.round(Math.abs(track.scrollLeft)/(track.clientWidth||1))));update()})},{passive:true});
  track.addEventListener("keydown",function(ev){if(ev.key==="ArrowRight"){ev.preventDefault();go(index+(rtl?-1:1))}else if(ev.key==="ArrowLeft"){ev.preventDefault();go(index+(rtl?1:-1))}});
  update();
 }
 if(hits.length){
  var divider=e("div","dar-recent-premium-line");mount.appendChild(divider);
  var toggle=e("button","dar-recent-premium-toggle",t(8));toggle.type="button";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","darRecentPremiumFlatList");mount.appendChild(toggle);
  var flat=e("div","dar-recent-premium-list");flat.id="darRecentPremiumFlatList";flat.hidden=true;
  hits.forEach(function(p,i){var a=e("a","dar-recent-premium-list-row");a.href=openLink(p);a.appendChild(e("span","dar-recent-premium-list-index",String(i+1).padStart(2,"0")));a.appendChild(e("strong","dar-recent-premium-list-name",displayTitle(p)));a.appendChild(e("span","dar-recent-premium-list-arrow","›"));a.addEventListener("click",function(ev){if(d.getElementById("pageRoot"))return;ev.preventDefault();openPostById(p.id)});flat.appendChild(a)});
  toggle.addEventListener("click",function(){flat.hidden=!flat.hidden;toggle.setAttribute("aria-expanded",String(!flat.hidden));toggle.textContent=flat.hidden?t(8):t(9)});
  mount.appendChild(flat);
 }
 mount.dataset.darRecentPremiumSig=signature;
}

function refresh(){if(state.loading||Date.now()-state.lastFetch<90000)return;state.loading=true;state.lastFetch=Date.now();fetch(DATA+"?t="+Math.floor(Date.now()/60000),{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("index "+r.status);return r.json()}).then(function(j){if(j.schemaVersion!==1||!Array.isArray(j.posts))throw Error("invalid recent index");state.posts=j.posts;initializeSeen(j.posts);if(unreadPosts().length)state.modalShown=false;render();fetchTitleManifests(j.posts);scheduleNotice()}).catch(function(){state.lastFetch=0;render()}).finally(function(){state.loading=false})}

/* Persistent per-installation publication acknowledgement. This is NOT a
   session flag: clicking, closing, reading or skipping a batch stores every
   currently published post ID. Reopening the app must not re-advertise it.
   Bootstrap from the currently published index for users migrating from the
   old session-only system, so historic Q49 is not shown again after upgrade. */
var NOTICE_SESSION="darRecentNoticeOpenedSessionV1",NOTICE_SKIPPED="darRecentNoticeSkippedPostV1";
var NOTICE_READ="darAdultLatestPostsSeenIdsV2";
var seenPostIds=null;
function publishedPosts(posts){return (posts||[]).filter(function(p){var d=new Date(p.date||"");return !!p.id&&Number.isFinite(d.getTime())&&dayNumber(d)<=dayNumber(new Date())})}
function parseSeen(){try{var v=JSON.parse(w.localStorage.getItem(NOTICE_READ)||"null");if(v&&v.version===2&&Array.isArray(v.ids))return new Set(v.ids.filter(function(id){return typeof id==="string"}))}catch(_){}return null}
function writeSeen(set){try{w.localStorage.setItem(NOTICE_READ,JSON.stringify({version:2,ids:Array.from(set),updatedAt:new Date().toISOString()}))}catch(_){}}
function initializeSeen(posts){
 if(seenPostIds)return;
 seenPostIds=parseSeen();
 if(seenPostIds)return;
 // One-time migration: existing articles are the baseline, not a fresh alert.
 seenPostIds=new Set(publishedPosts(posts).map(function(p){return String(p.id)}));
 writeSeen(seenPostIds);
}
function unreadPosts(){if(!seenPostIds)return[];return recent(state.posts,5).filter(function(p){return !seenPostIds.has(String(p.id))})}
function acknowledgeCurrentPosts(){
 initializeSeen(state.posts);
 publishedPosts(state.posts).forEach(function(p){seenPostIds.add(String(p.id))});
 writeSeen(seenPostIds);
}
function latestSignature(posts){var hits=recent(posts,5);return hits.length?hits[0].id+"|"+hits[0].date:""}
function canAnnounce(force){if(!isHome()||(!force&&state.modalShown)||state.modalOpen||d.hidden||!recent(state.posts,5).length)return false;
 initializeSeen(state.posts);
 if(!force&&!unreadPosts().length)return false;
 var otherModal=Array.from(d.querySelectorAll('[role="dialog"]:not(#darRecentNoticeV1),[aria-modal="true"]:not(#darRecentNoticeV1),.dar-onboarding-overlay:not([hidden]),.modal.show,.modal.open')).some(function(el){var st=w.getComputedStyle(el);return st.display!=="none"&&st.visibility!=="hidden"&&el.getClientRects().length>0});if(otherModal)return false;
 return true}
function dismissNotice(skip){var layer=d.getElementById("darRecentNoticeV1");if(!layer)return;
 var sig=latestSignature(state.posts);acknowledgeCurrentPosts();
 try{w.sessionStorage.setItem(NOTICE_SESSION,sig);if(skip)w.localStorage.setItem(NOTICE_SKIPPED,sig)}catch(_){}
 try{if(layer.open&&typeof layer.close==="function")layer.close()}catch(_){}layer.remove();unlockNoticeBackground();state.modalOpen=false;state.modalShown=true;d.removeEventListener("keydown",noticeKeydown,true);d.removeEventListener("focusin",noticeFocus,true);
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
/* WKWebView: lock both scrollingElement and nested document scroll, with native
   non-passive touch guard. Capturing existing styles including !important is
   essential because some official app themes use body overflow !important. */
function lockNoticeBackground(layer){
 var b=d.body,root=d.documentElement,y=w.scrollY||d.scrollingElement&&d.scrollingElement.scrollTop||0;
 var props=["position","top","left","right","width","overflow","overscroll-behavior"];
 function take(el){var data={};props.forEach(function(k){data[k]=[el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]});return data}
 state.scrollLock={y:y,body:take(b),html:take(root)};
 state.inertItems=[];
 Array.from(b.children).forEach(function(child){
  if(child===layer||child.tagName==="SCRIPT"||child.tagName==="STYLE")return;
  state.inertItems.push({node:child,inert:child.inert});child.inert=true;
 });
 root.style.setProperty("overflow","hidden","important");
 root.style.setProperty("overscroll-behavior","none","important");
 b.style.setProperty("position","fixed","important");
 b.style.setProperty("top","-"+y+"px","important");
 b.style.setProperty("left","0","important");
 b.style.setProperty("right","0","important");
 b.style.setProperty("width","100%","important");
 b.style.setProperty("overflow","hidden","important");
 b.style.setProperty("overscroll-behavior","none","important");
 d.documentElement.classList.add("dar-notice-is-open");
 d.addEventListener("touchstart",noticeTouchStart,{capture:true,passive:true});
 d.addEventListener("touchmove",noticeTouchGuard,{capture:true,passive:false});
 d.addEventListener("wheel",noticeWheelGuard,{capture:true,passive:false});
}
var noticeTouchY=null;
function noticeTouchStart(ev){if(ev.touches&&ev.touches.length===1)noticeTouchY=ev.touches[0].clientY;else noticeTouchY=null}
function cardCanScroll(ev,dy){
 var target=ev.target&&ev.target.nodeType===1?ev.target:ev.target&&ev.target.parentElement;
 var card=target&&target.closest&&target.closest("#darRecentNoticeV1 .dar-recent-notice-card");
 if(!card||card.scrollHeight<=card.clientHeight+1)return false;
 if(dy>0)return card.scrollTop>0.5;
 if(dy<0)return card.scrollTop<card.scrollHeight-card.clientHeight-0.5;
 return true;
}
function noticeTouchGuard(ev){
 if(!d.getElementById("darRecentNoticeV1")||!ev.cancelable)return;
 var next=ev.touches&&ev.touches[0]?ev.touches[0].clientY:null;
 var dy=next!=null&&noticeTouchY!=null?next-noticeTouchY:0;noticeTouchY=next;
 if(!cardCanScroll(ev,dy))ev.preventDefault();
}
function noticeWheelGuard(ev){
 if(!d.getElementById("darRecentNoticeV1")||!ev.cancelable)return;
 if(!cardCanScroll(ev,-ev.deltaY))ev.preventDefault();
}
function unlockNoticeBackground(){
 d.removeEventListener("touchstart",noticeTouchStart,true);
 d.removeEventListener("touchmove",noticeTouchGuard,true);
 d.removeEventListener("wheel",noticeWheelGuard,true);
 noticeTouchY=null;
 state.inertItems.forEach(function(item){if(item.node&&item.node.isConnected)item.node.inert=item.inert});state.inertItems=[];
 var lock=state.scrollLock;state.scrollLock=null;
 if(lock){
  var props=["position","top","left","right","width","overflow","overscroll-behavior"];
  function restore(el,data){props.forEach(function(k){var old=data[k];if(!old||!old[0])el.style.removeProperty(k);else el.style.setProperty(k,old[0],old[1])})}
  restore(d.body,lock.body);restore(d.documentElement,lock.html);
  w.scrollTo(0,lock.y);
 }
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

/* Direct native click + iOS pointer-up fallback. The first event wins; a second
   synthetic click after pointer-up cannot fire the action again. */
function bindNoticeAction(el,fn){
 var activated=0,started=null;
 function invoke(ev){
  var now=Date.now();if(now-activated<650){ev.preventDefault();return}
  activated=now;ev.preventDefault();ev.stopPropagation();
  try{fn()}catch(error){console.error("DAR new-post action",error)}
 }
 el.addEventListener("pointerdown",function(ev){started={x:ev.clientX,y:ev.clientY}},{passive:true});
 el.addEventListener("pointerup",function(ev){
  if(!started)return;
  var dist=Math.hypot(ev.clientX-started.x,ev.clientY-started.y);started=null;
  if(dist>11)return;invoke(ev)
 });
 el.addEventListener("click",invoke);
 el.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();invoke(ev)}});
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
function noticeLink(p){var a=e("a","dar-recent-notice-article");a.href=openLink(p);a.dataset.darPostId=p.id;a.setAttribute("aria-label",displayTitle(p)+" – "+t(7));bindNoticeAction(a,function(){dismissNotice(false);openPostById(p.id)});a.appendChild(e("span","dar-recent-notice-date",dateLabel(p)));
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
function skipText(){return t(16)}
function syncLocale(){render();refreshOpenNotice();paintInlineList()}

function openNewPostsNotice(force){if(state.inlineOpen||!canAnnounce(force===true))return;
 var hits=recent(state.posts,5);if(!hits.length)return;
 // Acknowledgement occurs as soon as the alert is displayed, so even an app
 // termination or WebView recreation does not present the same batch again.
 acknowledgeCurrentPosts();
 var sig=latestSignature(state.posts);try{w.sessionStorage.setItem(NOTICE_SESSION,sig)}catch(_){}
 state.modalOpen=true;state.lastFocus=d.activeElement;
 var layer=e("dialog","dar-recent-notice-overlay");layer.id="darRecentNoticeV1";
 layer.setAttribute("role","dialog");layer.setAttribute("aria-modal","true");layer.setAttribute("aria-labelledby","darRecentNoticeHeadingV1");layer.setAttribute("aria-describedby","darRecentNoticeDescV1");
 var card=e("section","dar-recent-notice-card");card.setAttribute("dir",["ar","ckb"].includes(locale())?"rtl":"ltr");
 var header=e("div","dar-recent-notice-header");
 var intro=e("div","dar-recent-notice-intro");intro.appendChild(e("span","dar-recent-notice-kicker",t(0)));var h=e("h2","",t(1));h.id="darRecentNoticeHeadingV1";intro.appendChild(h);header.appendChild(intro);
 var close=e("button","dar-recent-notice-x","×");close.type="button";close.dataset.darNoticeAction="close";close.setAttribute("aria-label",t(9));header.appendChild(close);card.appendChild(header);bindNoticeAction(close,function(){dismissNotice(false)});
 var desc=e("p","dar-recent-notice-subtitle",t(2));desc.id="darRecentNoticeDescV1";card.appendChild(desc);
 var count=e("div","dar-recent-notice-count",hits.length+" · "+t(14));card.appendChild(count);
 var list=e("div","dar-recent-notice-list");hits.slice(0,4).forEach(function(p){list.appendChild(noticeLink(p))});card.appendChild(list);
 var actions=e("div","dar-recent-notice-actions");
 var all=e("button","dar-recent-notice-all",t(8));all.type="button";all.dataset.darNoticeAction="all";actions.appendChild(all);bindNoticeAction(all,function(){dismissNotice(false);openArchive()});
 var skip=e("button","dar-recent-notice-skip",skipText());skip.type="button";skip.dataset.darNoticeAction="skip";actions.appendChild(skip);bindNoticeAction(skip,function(){dismissNotice(true)});
 card.appendChild(actions);layer.appendChild(card);
 d.body.appendChild(layer);
 // Native HTMLDialogElement is promoted into the browser top layer. Unlike a div
 // overlay it cannot sit behind another app compositing/scroll/touch surface.
 try{if(typeof layer.showModal==="function")layer.showModal();else layer.setAttribute("open","")}catch(_){layer.setAttribute("open","")}
 lockNoticeBackground(layer);applyNoticeTheme(layer);
 layer.addEventListener("cancel",function(ev){ev.preventDefault();dismissNotice(false)});
 d.addEventListener("keydown",noticeKeydown,true);d.addEventListener("focusin",noticeFocus,true);close.focus({preventScroll:true});
}

var noticeScheduled=false;function scheduleNotice(){if(noticeScheduled||state.modalShown||state.modalOpen||!state.posts.length||!isHome())return;noticeScheduled=true;w.setTimeout(function(){noticeScheduled=false;openNewPostsNotice()},1100)}
var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;if(isHome()){render();refresh();syncInlineAfterRoute();if(state.inlineOpen&&state.renderedInlineLocale!==locale())paintInlineList();if(!state.inlineOpen)scheduleNotice()}else{var x=d.getElementById("darRecentPublicationsV1");if(x)x.hidden=true;if(state.inlineOpen)closeInlineList(false)}})}
function start(){queue();if(new URLSearchParams(location.search).get("recent")==="1"){var check=0;var opening=setInterval(function(){if(state.posts.length||++check>16){clearInterval(opening);openInlineList(false);var u=new URL(location.href);u.searchParams.delete("recent");history.replaceState(history.state,"",u.pathname+u.search+u.hash)}},100)}d.addEventListener("click",function(ev){if(ev.target.closest&&ev.target.closest("[data-dal-locale],[data-v3-locale],[data-dv3-locale]"))setTimeout(function(){if(state.inlineOpen&&state.renderedInlineLocale!==locale())paintInlineList()},0)},true);d.addEventListener("change",function(){setTimeout(function(){if(state.inlineOpen&&state.renderedInlineLocale!==locale())paintInlineList()},0)},true);/* HOME_RECENT_OBSERVER_NO_GLOBAL_SCROLL_FEEDBACK_V1_20261101
   Previously we observed *every* class and descendant change of body.
   Sticky headers, active tabs and live widgets update during scroll;
   each change queued a full Home re-order and card reconstruction.
   Only root view replacements require a fallback observer. Hash, popstate,
   dar:view-rendered, pageshow and locale events already cover routing. */
 var view=d.getElementById("appView")||d.getElementById("pageRoot");
 if(view){
  var obs=new MutationObserver(function(m){
   if(m.some(function(x){return x.type==="childList"&&
     (x.addedNodes.length||x.removedNodes.length)}))queue();
  });
  obs.observe(view,{childList:true,subtree:false});
 }
 w.addEventListener("hashchange",queue);w.addEventListener("popstate",queue);w.addEventListener("dar-adult-locale-changed",syncLocale);w.addEventListener("storage",function(ev){if(ev.key===KEY)syncLocale()});w.addEventListener("pageshow",queue);d.addEventListener("dar:view-rendered",queue);d.addEventListener("visibilitychange",function(){if(!d.hidden){state.lastFetch=0;queue()}})}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
