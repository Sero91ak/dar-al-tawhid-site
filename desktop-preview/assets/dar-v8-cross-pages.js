/* DĀR AL TAWḤĪD · V8 unified adult public-browser route shell.
   Works with existing SPA routes; never touches visitor iOS/Android/Kids navigation.
   The 3D art assets are existing verified repository images. */
(function(w,d){"use strict";
const base="/assets/dar-3d-icons/";
const pages={
start:{label:"Start",icon:"home",group:"start"},
quran:{label:"Qurʾān",icon:"quran",group:"quran"},
beitraege:{label:"Beiträge",icon:"posts",group:"beitraege"},
beitrag:{label:"Beitrag",icon:"posts",group:"beitraege"},
quelle:{label:"Quellen",icon:"library",group:"wissen"},
dua:{label:"Duʿāʾ",icon:"dua",group:"dua"},
wissen:{label:"Wissen",icon:"ilm",group:"wissen"},
suche:{label:"Wissenschat",icon:"spark",group:"wissen"},
bibliothek:{label:"Bibliothek",icon:"library",group:"mehr"},
werk:{label:"Werk",icon:"library",group:"mehr"},
hadith:{label:"Ḥadīṯ & Āṯār",icon:"hadith",group:"wissen"},
gebetszeiten:{label:"Gebetszeiten",icon:"prayer",group:"mehr"},
frauen:{label:"Frauen",icon:"frauen",group:"mehr"},
frauenbereich:{label:"Frauen",icon:"frauen",group:"frauen"},
mehr:{label:"Mehr",icon:"more",group:"mehr"},
quiz:{label:"Quiz",icon:"quiz",group:"mehr"},
thema:{label:"Themen",icon:"topics",group:"wissen"},
zakat:{label:"Zakāt",icon:"zakat",group:"mehr"},
propheten:{label:"Propheten",icon:"prophets",group:"mehr"},
quellen:{label:"Quellen",icon:"library",group:"wissen"},
downloads:{label:"Downloads",icon:"saved",group:"mehr"},
einstellungen:{label:"Einstellungen",icon:"settings",group:"mehr"}
};
const sidebar=["start","quran","beitraege","hadith","dua","wissen","bibliothek","frauen","gebetszeiten","mehr"];
const dock=["start","quran","beitraege","dua","wissen","mehr"];
const icon=(name,cls="")=>{const img=d.createElement("img");img.src=base+name+".png";img.className="v8-real-3d "+cls;img.alt="";img.loading="lazy";img.decoding="async";img.onerror=function(){this.hidden=true};return img};
const link=(page,classname)=>{const o=pages[page],a=d.createElement("a");a.href="/?page="+encodeURIComponent(page);a.dataset.page=page;a.className=classname+" desktop-link";a.appendChild(icon(o.icon));const text=d.createElement("span");text.textContent=o.label;a.appendChild(text);return a};
function buildNavigation(){
 const side=d.querySelector(".dar-v8-side-links");if(side&&!side.dataset.v8Ready){side.replaceChildren();sidebar.forEach(k=>side.appendChild(link(k,"dar-v8-side-link")));side.dataset.v8Ready="true"}
 if(!d.getElementById("darV8MobileDock")){
  const nav=d.createElement("nav");nav.id="darV8MobileDock";nav.className="dar-v8-mobile-dock";nav.setAttribute("aria-label","Mobile V8 Hauptnavigation");
  dock.forEach(k=>nav.appendChild(link(k,"dar-v8-mobile-tab")));d.body.appendChild(nav);
 }
}
function current(){const k=(new URLSearchParams(location.search).get("page")||"start").toLowerCase();return pages[k]?k:"start"}
function syncNav(key){
 const item=pages[key]||pages.start;d.body.dataset.darV8Route=key;
 for(const a of d.querySelectorAll(".dar-v8-side-link,.dar-v8-mobile-tab")){
  const active=a.dataset.page===(a.classList.contains("dar-v8-side-link")?key:item.group);
  a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
 }
 const crumb=d.getElementById("darV8BreadLabel");if(crumb)crumb.textContent=item.label;
 const audio=d.querySelector(".v8-real-player");
 if(audio)audio.classList.toggle("v8-audio-context",key!=="start"&&key!=="quran");
}
function decorateHero(key){
 const h=d.querySelector("#pageRoot .page-intro");if(!h||h.dataset.v8Decorated)return;
 const conf=pages[key]||pages.wissen;h.dataset.v8Decorated="true";h.classList.add("v8-global-page-hero","is-visible");
 const aside=h.querySelector(".intro-aside");if(aside){
  aside.replaceChildren();aside.classList.add("v8-hero-visual");
  aside.appendChild(icon(conf.icon,"v8-hero-3d"));
  const cap=d.createElement("span");cap.textContent="DĀR AL TAWḤĪD · "+conf.label;aside.appendChild(cap)
 }
 let actions=d.createElement("div");actions.className="v8-global-page-actions";
 const search=d.createElement("a");search.href="/?page=suche";search.className="desktop-link v8-global-action";search.textContent="✦ Wissenschat öffnen";
 actions.appendChild(search);
 if(key!=="gebetszeiten"){const related=d.createElement("a");related.href="/?page=gebetszeiten";related.className="desktop-link v8-global-action secondary";related.textContent="◷ Gebetszeiten";actions.appendChild(related)}
 const body=h.querySelector("div");if(body)body.appendChild(actions);
}
function showAnswer(question){
 const output=d.getElementById("v8ChatReply");if(!output)return;
 output.replaceChildren();const mine=d.createElement("div");mine.className="v8-chat-user";mine.textContent=question;output.appendChild(mine);
 const links=[...d.querySelectorAll("#searchResults a.list-row")];const answer=d.createElement("div");answer.className="v8-chat-answer";
 const title=d.createElement("strong");title.textContent=links.length?"Fundstellen aus unserem Bestand":"Keine passende Fundstelle verfügbar";answer.appendChild(title);
 const p=d.createElement("p");p.textContent=links.length?"Ich habe "+links.length+" passende Fundstellen in den aktuell indexierten Inhalten gefunden. Öffne die Quellen unten, um die Originalbelege und den vollständigen Kontext zu lesen.":"In den derzeit indexierten Inhalten unserer Website ist keine passende Fundstelle vorhanden. Ich ergänze keine unbelegten Aussagen.";answer.appendChild(p);
 links.slice(0,5).forEach(source=>{const a=source.cloneNode(true);a.classList.add("desktop-link");answer.appendChild(a)});
 output.appendChild(answer);
}
function setChat(){
 const input=d.getElementById("siteSearch"),mount=d.getElementById("v8ChatReply");if(!input||!mount||mount.dataset.v8Ready)return;
 mount.dataset.v8Ready="true";
 const btn=d.getElementById("v8ChatSend");
 const send=()=>{const q=input.value.trim();if(!q)return;input.dispatchEvent(new Event("input",{bubbles:true}));requestAnimationFrame(()=>showAnswer(q))};
 if(btn)btn.addEventListener("click",send);
 input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send()}});
 const initial=input.value.trim();if(initial)setTimeout(()=>showAnswer(initial),140);
}
let hadithCache=null;
function simplified(s){return String(s||"").toLocaleLowerCase("und").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[ʿʾ']/g,"").replace(/\s+/g," ")}
function hadithPage(){
 const box=d.getElementById("v8HadithResults"),search=d.getElementById("v8HadithSearch"),count=d.getElementById("v8HadithCount");
 if(!box||!search||box.dataset.v8Ready)return;box.dataset.v8Ready="true";
 let rows=[],shown=0;
 const render=(reset=true)=>{
  if(reset){shown=0;box.replaceChildren()}
  const q=simplified(search.value).trim();
  const matched=!q?rows:rows.filter(x=>simplified([x.german,x.bookTitle,x.chapterTitle,x.hadithNumber,(x.tags||[]).join(" ")].join(" ")).includes(q));
  if(count)count.textContent=matched.length+" indexierte Einträge";
  matched.slice(shown,shown+18).forEach(x=>{
    const article=d.createElement("article");article.className="v8-hadith-result";
    const header=d.createElement("div");header.className="v8-hadith-source";header.textContent=[x.bookTitle,x.chapterTitle,"Nr. "+x.hadithNumber].filter(Boolean).join(" · ");
    const quote=d.createElement("p");quote.textContent=x.german||"Keine geprüfte deutsche Fassung im Suchindex.";
    const foot=d.createElement("small");foot.textContent=[x.id,x.grade?"Einstufung: "+x.grade:""].filter(Boolean).join(" · ");
    article.append(header,quote,foot);box.appendChild(article)
  });
  shown+=18;const more=d.getElementById("v8HadithMore");if(more)more.hidden=shown>=matched.length;
  if(!matched.length){const p=d.createElement("p");p.className="v8-hadith-empty";p.textContent="Zu diesem Begriff wurde im aktuellen Ḥadīṯ-Suchindex keine passende Überlieferung gefunden.";box.appendChild(p)}
 };
 search.addEventListener("input",()=>render(true));d.getElementById("v8HadithMore")?.addEventListener("click",()=>render(false));
 box.textContent="Ḥadīṯe und Āṯār werden aus der vorhandenen Suchbibliothek geladen …";
 fetch("/test/data/hadith/search-index.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(data=>{
  if(!box.isConnected)return;rows=Array.isArray(data)?data.filter(x=>x.germanStatus==="verified"&&x.id&&x.german):[];hadithCache=rows;render()
 }).catch(()=>{if(box.isConnected)box.textContent="Die Ḥadīṯ-Suchliste ist momentan nicht erreichbar. Die übrigen Bereiche bleiben verfügbar."});
}
function decorateMore(){
 for(const a of d.querySelectorAll("#pageRoot .more-row")){
  if(a.dataset.v8IconReady)return;
  const route=new URL(a.href,location.href).searchParams.get("page")||"more";
  const art=pages[route]?.icon||"more";a.insertBefore(icon(art,"v8-more-3d"),a.firstChild);a.dataset.v8IconReady="true";
 }
}
function onRendered(key=current()){
 syncNav(key);if(key!=="start")decorateHero(key);
 if(key==="mehr")decorateMore();
 if(key==="suche")setChat();
 if(key==="hadith")hadithPage();
 const dockEl=d.getElementById("darV8MobileDock");if(dockEl)dockEl.setAttribute("aria-label","Hauptnavigation · "+(pages[key]?.label||"Start"));
}
function keyboardAndNavigation(){
 // Never suppress user pinch zoom: a true 16px font-size is enforced in
 // dar-v8-all-sections.css; hide floating dock only while entering text.
 const isEditor=el=>!!el&&!!el.matches&&el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),textarea,select,[contenteditable="true"]');
 d.addEventListener("focusin",e=>{if(isEditor(e.target))d.body.classList.add("v8-keyboard-active")});
 d.addEventListener("focusout",e=>{if(isEditor(e.target)){
   w.setTimeout(()=>{if(!isEditor(d.activeElement))d.body.classList.remove("v8-keyboard-active")},60);
 }});
 d.addEventListener("pointerdown",e=>{if(e.target?.closest?.(".dar-v8-mobile-tab,.dar-v8-side-link"))d.body.classList.remove("v8-keyboard-active")},{passive:true});
}
function boot(){
 buildNavigation();keyboardAndNavigation();onRendered();
 const topAudio=d.getElementById("darV8TopAudio");if(topAudio)topAudio.addEventListener("click",()=>d.body.classList.toggle("v8-show-player"),true);
 const root=d.getElementById("pageRoot");
 if(root){const watch=new MutationObserver(()=>{const key=current();onRendered(key)});watch.observe(root,{childList:true,subtree:false})}
 w.addEventListener("popstate",()=>onRendered());
}
w.DARV8CrossPages={onRendered,current,buildNavigation};
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
