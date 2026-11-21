/* DĀR TEST · Smart Profile V1 · 2026-10-30
 * Only /test/ adult. No push, SW, live/visitor, or account authentication changes.
 * Per-account settings/notes are DEVICE-LOCAL in this first stage; no false sync claims.
 */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.DAR_TEST_SMART_PROFILE_V1)return;
var K="darTestSmartProfileV1:", body=document.body, scheduled=false, lastOwner="";
var THEMES=["keep","light","salbei","soft","eisgold","royal","bordeaux","dark","dar-al-layl"];
function availableThemes(){
 var names=THEMES.slice();
 try{document.querySelectorAll("[data-dtbh-theme],[data-theme-select]").forEach(function(item){var v=item.getAttribute("data-dtbh-theme")||item.getAttribute("data-theme-select");if(v&&/^[a-z0-9-]{2,48}$/.test(v)&&!names.includes(v))names.push(v)})}catch(_){}
 return names
}
var TOPICS=[["tawhid","Tawḥīd"],["men","Männerwissen"],["quran","Qurʾān"],["sunnah","Sunnah & Ḥadīṯ"],["fiqh","Fiqh"],["women","Frauenwissen"],["family","Ehe & Familie"],["adab","Adab & Akhlāq"],["dua","Duʿāʾ"],["history","Geschichte"]];
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function account(){try{return typeof accountSession==="function"?accountSession():null}catch(_){return null}}
function owner(){var s=account();return s&&String(s.id||s.username||"").trim()?"account-"+String(s.id||s.username).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,96):"guest"}
function key(){return K+owner()}
function fresh(){return {gender:"neutral",palette:"keep",chosen:false,interests:[],notes:[],saved:[],opened:[],updated:Date.now()}}
function read(){var p=fresh();try{var item=JSON.parse(localStorage.getItem(key())||"null");if(item&&typeof item==="object"){p.gender=["neutral","woman","man"].includes(item.gender)?item.gender:"neutral";p.palette=availableThemes().includes(item.palette)?item.palette:"keep";p.chosen=item.chosen===true;p.interests=Array.isArray(item.interests)?item.interests.filter(x=>TOPICS.some(y=>y[0]===x)).slice(0,9):[];p.notes=Array.isArray(item.notes)?item.notes.filter(x=>x&&typeof x.text==="string").slice(0,40).map(x=>({text:x.text.slice(0,1600),date:String(x.date||"").slice(0,30)})):[];p.saved=Array.isArray(item.saved)?item.saved.filter(x=>typeof x==="string").slice(0,100):[];p.opened=Array.isArray(item.opened)?item.opened.filter(x=>typeof x==="string").slice(0,30):[]}}catch(_){}
return p}
function write(p){p.updated=Date.now();try{localStorage.setItem(key(),JSON.stringify(p))}catch(e){console.warn("DĀR TEST: Profil kann nicht gespeichert werden",e)}refresh()}
function saveGender(gender){if(!["woman","man","neutral"].includes(gender))return;var p=read(),previous=p.gender;p.gender=gender;p.chosen=true;if(gender==="man"){p.interests=p.interests.filter(x=>x!=="women");if(previous!=="man"&&!p.interests.includes("tawhid"))p.interests.unshift("tawhid")}if(gender==="woman"&&!p.interests.includes("women"))p.interests.unshift("women");if(!p.interests.length)p.interests=gender==="woman"?["women","quran","family"]:["tawhid","quran","sunnah"];p.interests=p.interests.slice(0,9);write(p)}
function chooseTheme(value){if(value==="keep")return false;
 var actual=document.querySelector('.dtbh-choice[data-dtbh-theme="'+value+'"]')||document.querySelector('.theme-switch-btn[data-theme-select="'+value+'"]');
 if(actual){actual.click();return true}
 try{if(typeof applyTheme==="function"){applyTheme(value);return true}}catch(_){}
 try{if(typeof window.applyTheme==="function"){window.applyTheme(value);return true}}catch(_){}
 return false
}
function themePick(v){if(!availableThemes().includes(v))return;var p=read();p.palette=v;write(p);if(v!=="keep")chooseTheme(v)}
function image(g){return g==="woman"?"/test/assets/smart-profile/approved-woman-v1.webp":g==="man"?"/test/assets/smart-profile/approved-man-v1.webp":"/test/assets/smart-profile/approved-neutral-hooded-20261031.webp"}
function display(g){return g==="woman"?"Mein Frauenbereich":g==="man"?"Mein Männerbereich":"Mein DĀR"}
function label(g){return g==="woman"?"Frau":g==="man"?"Mann":"Neutral"}
function hashText(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function today(){return new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"})}
function canonicalWords(s){return String(s==null?"":s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/ʿ|ʾ|[‘’]/g,"").replace(/[‐‑‒–—]/g,"-")}
function classification(x){
 var title=canonicalWords([x.title,x.category,x.topic,x.section,x.tags,x.keywords].filter(Boolean).join(" "));
 var detail=canonicalWords([x.description,x.excerpt].filter(Boolean).join(" "));
 var s=title+" "+detail,a=[];
 var female=/(?:frau|frauen|schwester|schwestern|muslima|niqab|hijab|khimar|menstru|haidh|ha[id]d|ehefrau|mutter|mutterrechte|tochter|schwanger|stillzeit|wochenbett|weiblich|bint |umm )/i.test(title);
 var male=/(?:manner|mann|bruder|bruderpflicht|ehemann|vater|vaterpflicht|sohn|bartpflicht|mannlich|mannerfiqh)/i.test(title);
 var audience=canonicalWords(x.audience||x.targetAudience||x.gender||x.for||"");
 // Explicit author-controlled metadata is authoritative. Text signals otherwise
 // remain conservative: gender-exclusive subjects must never be promoted to the other dashboard.
 if(/women|female|frau/.test(audience)){female=true;male=false}
 if(/men|male|manner/.test(audience)){male=true;female=false}
 var gender=female&&!male?"woman":male&&!female?"man":female&&male?"both":"general";
 if(female)a.push("women");
 if(male)a.push("men");
 if(/tawhid|aqida|aqid|schirk|shirk|glaubens/.test(s))a.push("tawhid");
 if(/qur|koran|sura|aya|vers/.test(s))a.push("quran");
 if(/sunn|hadith|hadit|prophet|salaf|bukhari|muslim/.test(s))a.push("sunnah");
 if(/fiqh|gebet|wudu|fasten|zakat|pflicht|reinheit/.test(s))a.push("fiqh");
 if(/famil|ehe|kind|eltern|erzieh|mutter|vater/.test(s))a.push("family");
 if(/adab|akhlaq|charakter|geduld|benehmen|herz|aufrichtig/.test(s))a.push("adab");
 if(/dua|bittgebet|dhikr|d[h]ikr/.test(s))a.push("dua");
 if(/geschichte|sahab|imam|gelehrte|biograf/.test(s))a.push("history");
 return {tags:a,gender:gender}
}
function inventory(){
 var raw=[];try{if(typeof posts!=="undefined"&&Array.isArray(posts))raw=posts;else if(Array.isArray(window.posts))raw=window.posts}catch(_){}
 var used=new Set();
 return raw.filter(x=>x&&x.id&&x.title).map(function(x,i){
  var id=String(x.id),meta=classification(x);
  return {id:id,title:String(x.title),sub:[x.scholar,x.category].filter(Boolean).join(" · "),tags:meta.tags,gender:meta.gender,order:i}
 }).filter(x=>{if(used.has(x.id))return false;used.add(x.id);return true})
}
function eligible(p,items){return items.filter(x=>p.gender==="man"?!x.tags.includes("women"):p.gender==="woman"?x.gender!=="man":true)}
function catalogPulse(items){
 // Watch the same canonical published collection used by the app, without
 // background requests, paid APIs or generated religious claims.
 var key=K+"known-publications:"+owner(),now=Date.now(),stored;
 try{stored=JSON.parse(localStorage.getItem(key)||"null")}catch(_){}
 var ids=items.map(x=>x.id),newIds=new Set(),latest=stored&&stored.newest&&typeof stored.newest==="object"?stored.newest:{};
 if(!stored||!Array.isArray(stored.ids)){
  try{localStorage.setItem(key,JSON.stringify({ids:ids.slice(0,1500),newest:{}}))}catch(_){}
  return newIds
 }
 var previous=new Set(stored.ids);
 var changed=false;
 ids.forEach(function(id){if(!previous.has(id)){latest[id]=now;newIds.add(id);changed=true}});
 Object.keys(latest).forEach(function(id){if(now-Number(latest[id])>14*86400000||!ids.includes(id)){delete latest[id];changed=true}else newIds.add(id)});
 if(changed||stored.ids.length!==ids.length){
  try{localStorage.setItem(key,JSON.stringify({ids:ids.slice(0,1500),newest:latest}))}catch(_){}
 }
 return newIds
}
function ranking(p){
 var date=today(),topics=new Set(p.interests),source=inventory(),newItems=catalogPulse(source);
 return eligible(p,source).map(function(item){
  var score=hashText(date+"|"+owner()+"|"+p.gender+"|"+item.id)%490;
  for(var tag of item.tags){if(topics.has(tag))score+=410}
  if(p.gender==="woman"&&item.gender==="woman")score+=1100;
  if(p.gender==="man"&&item.gender==="man")score+=1100;
  if(item.gender==="both"&&p.gender!=="neutral")score+=100;
  if(newItems.has(item.id))score+=1750;
  if(p.saved.includes(item.id))score-=450;
  // Rotate daily; never invent titles or religious references.
  return {item:item,score:score}
 }).sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id))
}
function picks(p){
 var ranked=ranking(p),selected=[],tags=new Set();
 var primary=p.gender==="woman"?"woman":p.gender==="man"?"man":"";
 if(primary){var focus=ranked.find(x=>x.item.gender===primary);if(focus){selected.push(focus.item);focus.item.tags.forEach(t=>tags.add(t))}}
 for(var entry of ranked){
  if(selected.length===3)break;
  if(selected.some(x=>x.id===entry.item.id))continue;
  var group=entry.item.tags.find(t=>t!=="women"&&t!=="men")||"general";
  if(tags.has(group)&&ranked.length>6)continue;
  tags.add(group);selected.push(entry.item)
 }
 for(var fallback of ranked){if(selected.length===3)break;if(!selected.some(x=>x.id===fallback.item.id))selected.push(fallback.item)}
 return selected
}
function todayFeature(p,excluded){
 return ranking(p).map(x=>x.item).find(x=>!excluded.includes(x.id))||ranking(p).map(x=>x.item)[0]||null
}
function homeFocus(p){var primary=p.gender==="woman"?"woman":p.gender==="man"?"man":null;
 if(!primary)return null;return ranking(p).map(x=>x.item).find(x=>x.gender===primary)||null}
function iconSpan(g){return '<img class="dsp-avatar" src="'+image(g)+'" alt="" loading="lazy" decoding="async">'}
function choice(g,active){return '<button type="button" class="dsp-gender'+(active===g?" is-active":"")+'" data-dsp-gender="'+g+'" aria-pressed="'+String(active===g)+'">'+iconSpan(g)+'<span><strong>'+label(g)+'</strong><small>'+(g==="woman"?"Frauenwissen zuerst":g==="man"?"Allgemeines Wissen zuerst":"Alles gleichberechtigt")+'</small></span></button>'}
function themeOptions(p){
 var labels={keep:"Wie bisher",salbei:"Salbei · Elfenbein",royal:"Royal Nachtblau",soft:"Sanft Elegant",eisgold:"Eisgold",bordeaux:"Bordeaux",dark:"Dunkel",light:"Hell","dar-al-layl":"Dār al-Layl"};
 return availableThemes().map(function(value){
  var actual=document.querySelector('[data-dtbh-theme="'+value+'"],[data-theme-select="'+value+'"]');
  var label=actual&&String(actual.getAttribute("aria-label")||actual.textContent||"").trim()||labels[value]||value.replace(/-/g," ");
  return '<button type="button" class="dsp-chip'+(p.palette===value?" is-active":"")+'" data-dsp-theme="'+esc(value)+'" aria-pressed="'+(p.palette===value)+'">'+esc(label.slice(0,46))+'</button>'
 }).join("")
}
function interestOptions(p){return TOPICS.filter(a=>!(p.gender==="man"&&a[0]==="women")&&!(p.gender==="woman"&&a[0]==="men")).map(a=>'<button type="button" class="dsp-chip'+(p.interests.includes(a[0])?" is-active":"")+'" data-dsp-interest="'+a[0]+'" aria-pressed="'+p.interests.includes(a[0])+'">'+a[1]+'</button>').join("")}
function card(p){
 var rs=picks(p),intro=p.gender==="woman"?"Für deinen Frauen-Wissensbereich":p.gender==="man"?"Für deinen Männer-Wissensweg":"Deine tägliche Wissensauswahl";
 var top='<section class="dsp-home" aria-label="Dein persönlicher Wissensweg"><div class="dsp-section-head"><div><h2>Dein Wissensweg heute</h2><small class="dsp-dashboard-context">'+esc(intro)+'</small></div><time>'+new Date().toLocaleDateString("de-DE",{timeZone:"Europe/Berlin",day:"2-digit",month:"long"})+'</time></div>';
 if(rs.length){top+='<div class="dsp-recommend-list">'+rs.map(function(x,i){
  var category=x.gender==="woman"?"Frauenwissen":x.gender==="man"?"Männerwissen":x.tags.includes("quran")?"Qurʾān":x.tags.includes("fiqh")?"Fiqh":x.tags.includes("tawhid")?"Tawḥīd":"Wissen";
  return '<div class="dsp-recommend-row"><button type="button" class="dsp-recommend-open" data-dsp-post="'+esc(x.id)+'"><span class="dsp-number">0'+(i+1)+'</span><span class="dsp-recommend-copy"><span class="dsp-mini-topic">'+esc(category)+'</span><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub||"Qurʾān · Sunnah · Āthār")+'</small></span><span class="dsp-recommend-arrow" aria-hidden="true">›</span></button><button type="button" class="dsp-save'+(p.saved.includes(x.id)?" is-active":"")+'" data-dsp-save="'+esc(x.id)+'" aria-label="'+(p.saved.includes(x.id)?"Aus Merkliste entfernen":"Beitrag merken")+'" aria-pressed="'+p.saved.includes(x.id)+'">'+(p.saved.includes(x.id)?"★":"☆")+'</button></div>'
 }).join("")+'</div>'}
 else top+='<p class="dsp-empty">Aus den veröffentlichten Beiträgen sind für diese Auswahl derzeit keine passenden Empfehlungen verfügbar. Die vollständige Bibliothek bleibt über „Beiträge“ erreichbar.</p>';
 top+='<p class="dsp-footnote">Täglich neu zusammengestellt · ausschließlich vorhandene, veröffentlichte Quellen.</p></section>';
 return top
}
var expanded={interests:false,saved:false,settings:false};
function expandPanel(key,title,sub,content){
 return '<div class="dsp-expand"><button type="button" class="dsp-expand-toggle" data-dsp-toggle="'+key+'" aria-expanded="'+Boolean(expanded[key])+'" aria-controls="dspExpand-'+key+'"><span><strong>'+title+'</strong><small>'+sub+'</small></span><span class="dsp-chevron" aria-hidden="true"></span></button><div id="dspExpand-'+key+'" class="dsp-expand-body"'+(expanded[key]?'':' hidden')+'>'+content+'</div></div>'
}
function accountPanel(p){var g=p.gender,profile=label(g);
 return '<section id="darTestSmartAccount" class="dsp-account" data-dsp-gender="'+g+'" aria-label="Mein persönlicher DĀR-Bereich">'+
 '<header class="dsp-account-heading"><div class="dsp-account-heading-copy"><span class="dsp-eyebrow">MEIN DĀR · PERSÖNLICH</span><h2>'+display(g)+'</h2><p>Persönliche Sammlungen und dein Wissensweg.</p></div><div class="dsp-account-figure" aria-hidden="true">'+iconSpan(g)+'</div></header>'+
 '<div class="dsp-account-shortcuts"><button type="button" class="dsp-shortcut" data-dsp-open-notes><span class="dsp-shortcut-icon" aria-hidden="true">✎</span><strong>Notizen</strong><small>'+p.notes.length+' gespeichert</small></button><button type="button" class="dsp-shortcut" data-dsp-open-saved><span class="dsp-shortcut-icon" aria-hidden="true">☆</span><strong>Merkliste</strong><small>'+p.saved.length+' Beiträge</small></button></div>'+
 '<div class="dsp-profile-line"><span><strong>Profil: '+profile+'</strong><small>Empfehlungen individuell für dich</small></span><button type="button" data-dsp-switch-profile>Profil wechseln</button></div>'+
 '<div class="dsp-setting dsp-setting--theme"><h3>Erscheinungsbild</h3><div class="dsp-chip-set dsp-theme-rail" aria-label="Farbschema auswählen">'+themeOptions(p)+'</div></div>'+
 expandPanel("interests","Meine Interessen",p.interests.length+" Themen gewählt",'<p class="dsp-explain">Mehrfachauswahl · Alle Wissensgebiete bleiben zugänglich.</p><div class="dsp-chip-set">'+interestOptions(p)+'</div>')+
 expandPanel("saved","Merkliste",p.saved.length+" Beiträge gespeichert",'<div class="dsp-saved-list">'+(p.saved.length?p.saved.map(function(id){var item=inventory().find(x=>x.id===id);return '<div class="dsp-saved-line"><button type="button" data-dsp-post="'+esc(id)+'">'+esc(item?item.title:"Gespeicherter Beitrag")+'</button><button type="button" data-dsp-save="'+esc(id)+'" aria-label="Aus Merkliste entfernen">×</button></div>'}).join(""):'<p class="dsp-empty">Du hast noch keine Beiträge gemerkt. Nutze ☆ auf der Startseite.</p>')+'</div>')+
 expandPanel("settings","Weitere Einstellungen","Personalisierung verwalten",'<button type="button" class="dsp-subtle" data-dsp-reset>Interessen und Profilauswahl zurücksetzen</button>')+
 '</section>'
}
function toggleSection(name,forceOpen){if(!Object.prototype.hasOwnProperty.call(expanded,name))return;expanded[name]=typeof forceOpen==="boolean"?forceOpen:!expanded[name];
 var panel=document.getElementById("dspExpand-"+name),trigger=document.querySelector('[data-dsp-toggle="'+name+'"]');
 if(panel)panel.hidden=!expanded[name];
 if(trigger)trigger.setAttribute("aria-expanded",String(expanded[name]));
}
function noteRows(p){return p.notes.length?p.notes.slice().reverse().map((n,i)=>'<article class="dsp-note"><p>'+esc(n.text).replace(/\n/g,"<br>")+'</p><small>'+esc(n.date)+'</small><button type="button" data-dsp-remove-note="'+(p.notes.length-i-1)+'" aria-label="Notiz löschen">Löschen</button></article>').join(""):'<p class="dsp-empty">Noch keine Notizen gespeichert.</p>'}
function notesMarkup(){var p=read();return '<div class="dsp-notes-dialog" role="dialog" aria-modal="true" aria-labelledby="dspNotesTitle"><div class="dsp-notes-top"><div><span class="dsp-eyebrow">MEIN DĀR · PRIVAT</span><h2 id="dspNotesTitle">Meine Notizen</h2></div><button type="button" class="dsp-notes-close" data-dsp-close-notes aria-label="Notizen schließen">×</button></div><label class="dsp-field-label" for="dspNoteText">Neuer Eintrag</label><textarea id="dspNoteText" class="dsp-note-input" maxlength="1600" rows="4" placeholder="Gedanken, Lernnotizen oder Quellenhinweise …"></textarea><div class="dsp-note-actions"><button type="button" class="dsp-primary" data-dsp-add-note>Notiz speichern</button><span class="dsp-note-status" role="status">'+p.notes.length+' Einträge auf diesem Gerät</span></div><p class="dsp-local-hint">Lokal gespeichert, nicht verschlüsselt und nicht mit deinem Konto synchronisiert. Keine vertraulichen Informationen eingeben.</p><div class="dsp-notes-list">'+noteRows(p)+'</div></div>'}
function openNotes(){var o=document.getElementById("dspNotesOverlay");if(!o){o=document.createElement("div");o.id="dspNotesOverlay";o.className="dsp-notes-overlay";document.body.appendChild(o)}o.innerHTML=notesMarkup();o.hidden=false;document.body.classList.add("dsp-notes-open");var close=o.querySelector("[data-dsp-close-notes]");if(close)close.focus()}
function closeNotes(){var o=document.getElementById("dspNotesOverlay");if(o){o.hidden=true;o.innerHTML=""}document.body.classList.remove("dsp-notes-open");var b=document.querySelector("[data-dsp-open-notes]");if(b)b.focus()}
function publishedFor(p){
 var source=eligible(p,inventory()),focus=p.gender==="woman"?"woman":p.gender==="man"?"man":null;
 var list=source.slice(0,5);
 if(focus){var priority=list.find(x=>x.gender===focus)||source.find(x=>x.gender===focus);if(priority)list=[priority].concat(list.filter(x=>x.id!==priority.id))}
 return list.slice(0,2)
}
function syncLatest(p,root){
 var target=root.querySelector("#dhpPosts"),list=publishedFor(p);
 if(!target||!list.length){if(target){target.replaceChildren();target.dataset.dspRecentSig="empty"}return}
 var sig=p.gender+"|"+list.map(x=>x.id+"|"+x.title).join(";");
 var old=target.querySelector("[data-dhp-value]");
 if(target.dataset.dspRecentSig!==sig||!old||old.dataset.dhpValue!==list[0].id||target.children.length!==list.length){
  target.replaceChildren();
  list.forEach(function(post,i){
   var btn=document.createElement("button");btn.type="button";
   btn.className=i?"dhp-article dhp-post-capsule":"dhp-panel dhp-feature dhp-post-capsule";
   btn.dataset.dhpRoute="post";btn.dataset.dhpValue=post.id;
   if(!i){var lab=document.createElement("span");lab.className="dhp-kicker";lab.textContent=post.gender==="woman"?"FRAUENWISSEN":post.gender==="man"?"MÄNNERWISSEN":"AUS DER BIBLIOTHEK";btn.append(lab)}
   var title=document.createElement("h3");title.textContent=post.title;
   var sub=document.createElement("p");sub.textContent=post.sub||"Qurʾān · Sunnah · Āthār";
   if(i){var div=document.createElement("div");div.append(title,sub);btn.append(div)}else btn.append(title,sub);
   target.append(btn)
  });
  target.dataset.dspRecentSig=sig
 }
 var title=root.querySelector("#dhpPostsTitle");
 if(title)title.textContent=p.gender==="woman"?"Frauenwissen & weitere Beiträge":p.gender==="man"?"Wissen für Männer & weitere Beiträge":"Neueste Veröffentlichungen"
}
function syncLibrary(p,root){
 var container=root.querySelector("#dhpLibrary .dhp-library");if(!container)return;
 var women=container.querySelector('[data-dhp-route="frauen"]'),aqida=container.querySelector('[data-dhp-route="topics"]');
 if(women){women.hidden=p.gender==="man";if(p.gender==="woman"){
  var wTitle=women.querySelector("b"),wSub=women.querySelector("small");
  if(wTitle)wTitle.textContent="Frauenwissen";
  if(wSub)wSub.textContent="Fiqh · Familie · Quellen";
  if(container.firstElementChild!==women&&!(container.firstElementChild&&container.firstElementChild.id==="dspAudienceLibraryTile"&&container.children[1]===women))container.prepend(women)
 }}
 if(aqida&&p.gender==="man"&&container.firstElementChild!==aqida&&!(container.firstElementChild&&container.firstElementChild.id==="dspAudienceLibraryTile"&&container.children[1]===aqida))container.prepend(aqida);
 var focus=homeFocus(p),tile=container.querySelector("#dspAudienceLibraryTile");
 if(!focus){if(tile)tile.remove();return}
 if(!tile){tile=document.createElement("button");tile.type="button";tile.className="dhp-library-tile dsp-audience-tile";tile.id="dspAudienceLibraryTile";tile.setAttribute("aria-label","Passenden Beitrag öffnen");var icon=document.createElement("img");icon.className="dsp-library-avatar";icon.alt="";tile.append(icon,document.createElement("b"),document.createElement("small"))}
 var category=p.gender==="woman"?"Frauenwissen für dich":"Männerwissen für dich";
 tile.dataset.dspPost=focus.id;tile.querySelector("img").src=image(p.gender);
 tile.querySelector("b").textContent=category;tile.querySelector("small").textContent=focus.title;
 if(container.firstElementChild!==tile)container.prepend(tile)
}
function updateHome(p){
 var root=document.getElementById("darHomeHtmlParityV1");if(!root)return;
 var widget=root.querySelector(".dsp-mount");
 if(!widget){widget=document.createElement("div");widget.className="dsp-mount";var welcome=root.querySelector(".dhp-welcome");if(!welcome)return;welcome.insertAdjacentElement("afterend",widget)}
 var listed=inventory(),digest=listed.slice(0,100).map(x=>x.id+"|"+x.title+"|"+x.gender).join(";");
 var sig=owner()+"|"+today()+"|"+JSON.stringify([p.gender,p.chosen,p.interests,p.saved])+"|"+listed.length+"|"+hashText(digest);
 if(widget.dataset.dspSig!==sig){widget.innerHTML=card(p);widget.dataset.dspSig=sig}
 root.dataset.smartGender=p.gender;
 root.setAttribute("aria-label","DĀR AL TAWḤĪD · "+(p.gender==="woman"?"Frauen-Wissensbereich":p.gender==="man"?"Männer-Wissensbereich":"Alle Wissensbereiche"));
 var intro=root.querySelector(".dhp-intro");
 if(intro){
  var content=p.gender==="woman"?"Dein persönlicher Zugang zu <strong>Frauenwissen</strong>, Qurʾān, Sunnah, Fiqh und überprüften Aussagen der frühen Gelehrten.":p.gender==="man"?"Dein persönlicher Wissensweg durch <strong>Tawḥīd</strong>, Qurʾān, Sunnah, Fiqh und die Aussagen der frühen Gelehrten.":"Entdecke <strong>Qurʾān</strong>, <strong>Sunnah</strong>, <strong>Āthār der frühen Imāme</strong> und geprüfte islamische Wissensgebiete.";
  if(intro.dataset.dspCopy!==p.gender){intro.innerHTML=content;intro.dataset.dspCopy=p.gender}
 }
 var todayTitle=root.querySelector("#dhpTodayTitle");
 if(todayTitle)todayTitle.textContent=p.gender==="woman"?"Heute für dich als Frau":p.gender==="man"?"Heute für dich als Mann":"Heute für dich";
 var selected=picks(p),rec=todayFeature(p,selected.map(x=>x.id));
 var todayName=root.querySelector("#dhpTodayName"),todayRow=root.querySelector("#dhpTodayArticle");
 if(todayName&&todayRow&&rec){todayName.textContent=rec.title;todayRow.dataset.dhpRoute="post";todayRow.dataset.dhpValue=rec.id}
 syncLatest(p,root);
 syncLibrary(p,root)
}
function syncHeaderAvatar(p){document.querySelectorAll("#darTestBrandHeaderV1 .dtbh-action-account .dtbh-icon-3d").forEach(function(icon){var src=image(p.gender);if(icon.getAttribute("src")!==src)icon.src=src;icon.classList.add("dsp-figure-icon");var btn=icon.closest("button");if(btn){btn.setAttribute("aria-label","Profil wählen: "+label(p.gender));btn.setAttribute("title","Profil: "+label(p.gender))}})}
function updateAccount(p){if(!document.body.classList.contains("is-account-route"))return;
 var panel=document.querySelector("#appView .account-panel");if(!panel)return;var el=panel.querySelector("#darTestSmartAccount");
 if(!el){el=document.createElement("div");el.className="dsp-account-mount";panel.insertBefore(el,panel.firstChild)}
 var sig=owner()+"|"+JSON.stringify([p.gender,p.palette,p.interests,p.notes,p.saved]);if(el.dataset.dspSig!==sig){el.innerHTML=accountPanel(p);el.dataset.dspSig=sig}
}
function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;try{var o=owner(),p=read();if(o!==lastOwner){lastOwner=o;if(p.palette!=="keep")chooseTheme(p.palette)}
 updateHome(p);updateAccount(p);syncHeaderAvatar(p)}catch(e){console.warn("DĀR TEST Smart Profile",e)}})}
function nav(view,value){try{if(typeof navigate==="function"){navigate(view,value||"");return}}catch(_){}location.hash="#"+view}
document.addEventListener("click",function(e){
 if(e.target&&e.target.id==="dspNotesOverlay"){closeNotes();return}
 var nativePost=e.target.closest('#darHomeHtmlParityV1 [data-dhp-route="post"]');
 if(nativePost&&nativePost.dataset.dhpValue){var opened=read(),pid=nativePost.dataset.dhpValue;opened.opened=[pid].concat(opened.opened.filter(x=>x!==pid)).slice(0,30);write(opened);return}
 var nativeTheme=e.target.closest("[data-dtbh-theme],[data-theme-select]");
 if(nativeTheme){var chosen=nativeTheme.getAttribute("data-dtbh-theme")||nativeTheme.getAttribute("data-theme-select");if(availableThemes().includes(chosen)){var current=read();if(current.palette!==chosen){current.palette=chosen;write(current)}}return}
 var b=e.target.closest("[data-dsp-gender],[data-dsp-theme],[data-dsp-interest],[data-dsp-open-account],[data-dsp-open-more],[data-dsp-open-women],[data-dsp-post],[data-dsp-save],[data-dsp-add-note],[data-dsp-remove-note],[data-dsp-reset],[data-dsp-open-notes],[data-dsp-close-notes],[data-dsp-open-saved],[data-dsp-toggle],[data-dsp-switch-profile]");
 if(!b)return;
 e.preventDefault();e.stopPropagation();
 if(b.hasAttribute("data-dsp-gender")){saveGender(b.getAttribute("data-dsp-gender"));return}
 if(b.hasAttribute("data-dsp-theme")){themePick(b.getAttribute("data-dsp-theme"));return}
 if(b.hasAttribute("data-dsp-interest")){var p=read(),tag=b.getAttribute("data-dsp-interest");if(tag==="women"&&p.gender==="man")return;if(tag==="men"&&p.gender==="woman")return;p.interests=p.interests.includes(tag)?p.interests.filter(x=>x!==tag):p.interests.concat([tag]);write(p);return}
 if(b.hasAttribute("data-dsp-open-account")){nav("account");return}
 if(b.hasAttribute("data-dsp-open-notes")){openNotes();return}
 if(b.hasAttribute("data-dsp-close-notes")){closeNotes();return}
 if(b.hasAttribute("data-dsp-open-saved")){toggleSection("saved",true);return}
 if(b.hasAttribute("data-dsp-toggle")){toggleSection(b.getAttribute("data-dsp-toggle"));return}
 if(b.hasAttribute("data-dsp-switch-profile")){var chooser=window.DAR_TEST_PROFILE_CHOOSER;if(chooser&&typeof chooser.open==="function"){chooser.open()}else{var headerButton=document.querySelector("#darTestBrandHeaderV1 .dtbh-action-account");if(headerButton)headerButton.click()}return}
 if(b.hasAttribute("data-dsp-open-more")){nav("more");return}
 if(b.hasAttribute("data-dsp-open-women")){nav("frauen");return}
 if(b.hasAttribute("data-dsp-post")){var id=b.getAttribute("data-dsp-post"),p=read();p.opened=[id].concat(p.opened.filter(x=>x!==id)).slice(0,30);write(p);nav("post",id);return}
 if(b.hasAttribute("data-dsp-save")){var p=read(),id=b.getAttribute("data-dsp-save");p.saved=p.saved.includes(id)?p.saved.filter(x=>x!==id):p.saved.concat([id]).slice(-100);write(p);return}
 if(b.hasAttribute("data-dsp-add-note")){var input=document.getElementById("dspNoteText"),value=input&&input.value.trim();if(!value)return;var p=read();p.notes.push({text:value.slice(0,1600),date:new Date().toLocaleDateString("de-DE",{timeZone:"Europe/Berlin"})});p.notes=p.notes.slice(-40);write(p);openNotes();return}
 if(b.hasAttribute("data-dsp-remove-note")){var p=read(),n=Number(b.getAttribute("data-dsp-remove-note"));if(Number.isInteger(n)&&n>=0&&n<p.notes.length){p.notes.splice(n,1);write(p);openNotes()}return}
 if(b.hasAttribute("data-dsp-reset")){var p=read();p.gender="neutral";p.chosen=false;p.interests=[];p.palette="keep";write(p)}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.querySelector("#dspNotesOverlay:not([hidden])")){e.preventDefault();closeNotes()}});
function init(){body=document.body;refresh();document.addEventListener("dar:view-rendered",refresh);window.addEventListener("hashchange",refresh);window.addEventListener("pageshow",refresh);window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh()});
 var view=document.getElementById("appView");if(view)new MutationObserver(refresh).observe(view,{childList:true,subtree:false});
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:["class"]});
 // The last post content may arrive after the shell; refresh once when data finishes.
 setTimeout(refresh,700);setTimeout(refresh,1700);
}
window.DAR_TEST_SMART_PROFILE_V1={get:read,setGender:saveGender,image:image,recommendations:function(){return picks(read())},dashboard:function(){var p=read(),cards=picks(p),today=todayFeature(p,cards.map(x=>x.id));return {gender:p.gender,daily:cards,today:today,publications:publishedFor(p),focus:homeFocus(p)}},refresh:refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
