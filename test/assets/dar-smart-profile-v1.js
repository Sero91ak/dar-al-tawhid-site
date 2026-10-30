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
var TOPICS=[["tawhid","Tawḥīd"],["quran","Qurʾān"],["sunnah","Sunnah & Ḥadīṯ"],["fiqh","Fiqh"],["women","Frauenwissen"],["family","Ehe & Familie"],["adab","Adab & Akhlāq"],["dua","Duʿāʾ"],["history","Geschichte"]];
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function account(){try{return typeof accountSession==="function"?accountSession():null}catch(_){return null}}
function owner(){var s=account();return s&&String(s.id||s.username||"").trim()?"account-"+String(s.id||s.username).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,96):"guest"}
function key(){return K+owner()}
function fresh(){return {gender:"neutral",palette:"keep",chosen:false,interests:[],notes:[],saved:[],opened:[],updated:Date.now()}}
function read(){var p=fresh();try{var item=JSON.parse(localStorage.getItem(key())||"null");if(item&&typeof item==="object"){p.gender=["neutral","woman","man"].includes(item.gender)?item.gender:"neutral";p.palette=THEMES.includes(item.palette)?item.palette:"keep";p.chosen=item.chosen===true;p.interests=Array.isArray(item.interests)?item.interests.filter(x=>TOPICS.some(y=>y[0]===x)).slice(0,9):[];p.notes=Array.isArray(item.notes)?item.notes.filter(x=>x&&typeof x.text==="string").slice(0,40).map(x=>({text:x.text.slice(0,1600),date:String(x.date||"").slice(0,30)})):[];p.saved=Array.isArray(item.saved)?item.saved.filter(x=>typeof x==="string").slice(0,100):[];p.opened=Array.isArray(item.opened)?item.opened.filter(x=>typeof x==="string").slice(0,30):[]}}catch(_){}
return p}
function write(p){p.updated=Date.now();try{localStorage.setItem(key(),JSON.stringify(p))}catch(e){console.warn("DĀR TEST: Profil kann nicht gespeichert werden",e)}refresh()}
function saveGender(gender){if(!["woman","man","neutral"].includes(gender))return;var p=read(),previous=p.gender;p.gender=gender;p.chosen=true;if(!p.interests.length){p.interests=gender==="woman"?["women","quran","family"]:["tawhid","quran","sunnah"]}if(previous==="neutral"&&gender==="woman"&&p.palette==="keep"){p.palette="salbei";write(p);chooseTheme("salbei");return}write(p)}
function chooseTheme(value){if(value==="keep")return false;
 var actual=document.querySelector('.dtbh-choice[data-dtbh-theme="'+value+'"]')||document.querySelector('.theme-switch-btn[data-theme-select="'+value+'"]');
 if(actual){actual.click();return true}
 try{if(typeof applyTheme==="function"){applyTheme(value);return true}}catch(_){}
 try{if(typeof window.applyTheme==="function"){window.applyTheme(value);return true}}catch(_){}
 return false
}
function themePick(v){if(!THEMES.includes(v))return;var p=read();p.palette=v;write(p);if(v!=="keep")chooseTheme(v)}
function image(g){return g==="woman"?"/test/assets/smart-profile/avatar-woman.svg":g==="man"?"/test/assets/smart-profile/avatar-man.svg":"/test/assets/dar-3d-icons/ilm.png"}
function hero(g){return g==="woman"?"/test/assets/smart-profile/hero-woman.svg":g==="man"?"/test/assets/smart-profile/hero-man.svg":"/test/assets/dar-3d-icons/dar-home-cinematic-hero.png"}
function display(g){return g==="woman"?"Mein Frauenbereich":g==="man"?"Mein Männerbereich":"Mein DĀR"}
function label(g){return g==="woman"?"Frau":g==="man"?"Mann":"Neutral"}
function hashText(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function today(){return new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"})}
function classification(x){var s=[x.title,x.category,x.scholar,x.tags,x.description,x.topic].filter(Boolean).join(" ").toLowerCase();var a=[];if(/frau|schwester|ḥiǧāb|hijab|niq[aā]b|menstru|ḥaiḍ|haidh|nik[aā]h|ehefrau|mutter|mütter|tochter|schwanger/.test(s))a.push("women");if(/taw[hḥ]id|ʿaq[iī]da|aqid|širk|shirk|glaubens/.test(s))a.push("tawhid");if(/qur|koran|s[uū]ra|āya|aya|vers/.test(s))a.push("quran");if(/sunn|ḥad[iī][tṯh]|hadith|prophet|salaf|bukh[aā]r|muslim/.test(s))a.push("sunnah");if(/fiqh|gebet|wu[dḍ]u|fasten|zak[aā]t|pflicht|reinheit/.test(s))a.push("fiqh");if(/famil|ehe|kind|eltern|erzieh|mutter|vater/.test(s))a.push("family");if(/adab|akhl[aā]q|charakter|geduld|benehmen|herz|aufrichtig/.test(s))a.push("adab");if(/du[aʿ]|bittgebet|dhikr|[dḏ]ikr/.test(s))a.push("dua");if(/geschichte|ṣaḥ[aā]b|sahab|im[aā]m|gelehrte|biograf/.test(s))a.push("history");return a}
function inventory(){var raw=[];try{if(typeof posts!=="undefined"&&Array.isArray(posts))raw=posts;else if(Array.isArray(window.posts))raw=window.posts}catch(_){}
return raw.filter(x=>x&&x.id&&x.title).map(x=>({id:String(x.id),title:String(x.title),sub:[x.scholar,x.category].filter(Boolean).join(" · "),tags:classification(x)}))}
function picks(p){var arr=inventory();if(!arr.length)return[];if(p.gender==="man"){var general=arr.filter(x=>!x.tags.includes("women"));if(general.length>=3)arr=general}var date=today(),seen=new Set(p.opened);
 arr=arr.map(x=>{var score=hashText(date+"|"+owner()+"|"+x.id)%300;
 x.tags.forEach(tag=>{if(p.interests.includes(tag))score+=450;if(p.gender==="woman"&&tag==="women")score+=650;if(p.gender==="man"&&tag==="women")score-=350});
 if(seen.has(x.id))score-=1000;if(p.saved.includes(x.id))score-=200;
 return {item:x,score:score}
 }).sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
 var selected=[],groups=new Set();for(var row of arr){if(selected.length>=3)break;var cat=row.item.tags[0]||"all";if(groups.has(cat)&&arr.length>8)continue;groups.add(cat);selected.push(row.item)}
 if(selected.length<3)for(var another of arr){if(selected.length>=3)break;if(!selected.some(x=>x.id===another.item.id))selected.push(another.item)}
 return selected}
function iconSpan(g){return '<img class="dsp-avatar" src="'+image(g)+'" alt="" loading="lazy" decoding="async">'}
function choice(g,active){return '<button type="button" class="dsp-gender'+(active===g?" is-active":"")+'" data-dsp-gender="'+g+'" aria-pressed="'+String(active===g)+'">'+iconSpan(g)+'<span><strong>'+label(g)+'</strong><small>'+(g==="woman"?"Frauenwissen zuerst":g==="man"?"Allgemeines Wissen zuerst":"Alles gleichberechtigt")+'</small></span></button>'}
function themeOptions(p){var items=[["keep","Wie bisher"],["salbei","Salbei · Elfenbein"],["royal","Royal Nachtblau"],["soft","Sanft Elegant"],["eisgold","Eisgold"],["bordeaux","Bordeaux"],["dark","Dunkel"],["light","Hell"],["dar-al-layl","Dār al-Layl"]];
 return items.map(a=>'<button type="button" class="dsp-chip'+(p.palette===a[0]?" is-active":"")+'" data-dsp-theme="'+a[0]+'" aria-pressed="'+(p.palette===a[0])+'">'+a[1]+'</button>').join("")}
function interestOptions(p){return TOPICS.map(a=>'<button type="button" class="dsp-chip'+(p.interests.includes(a[0])?" is-active":"")+'" data-dsp-interest="'+a[0]+'" aria-pressed="'+p.interests.includes(a[0])+'">'+a[1]+'</button>').join("")}
function card(p){var g=p.gender,chosen=p.chosen,rs=picks(p);
 var top='<section class="dsp-home" aria-label="Persönlicher Wissensbereich" data-dsp-gender="'+g+'">'+
 '<div class="dsp-home-hero"><img class="dsp-hero-art" alt="" src="'+hero(g)+'" loading="lazy" decoding="async"><div class="dsp-home-copy"><span class="dsp-eyebrow">DĀR SMART · PERSÖNLICH</span>'+
 '<h2>'+(chosen?display(g):"Dein persönlicher Wissensbereich")+'</h2><p>'+(chosen?"Dein täglicher Zugang zu ausgewählten, bereits veröffentlichten Quellen und Lerninhalten.":"Wähle freiwillig dein Profil. Deine Startseite stellt daraufhin passende Inhalte zusammen.")+'</p>'+
 '<div class="dsp-actions"><button type="button" class="dsp-primary" data-dsp-open-account>'+(chosen?"Profil & Notizen":"Jetzt einrichten")+'</button><button type="button" class="dsp-subtle" data-dsp-open-more>Bibliothek öffnen</button>'+(g==="woman"?'<button type="button" class="dsp-subtle" data-dsp-open-women>Frauen-Fiqh</button>':'')+'</div></div></div>';
 if(!chosen)top+='<div class="dsp-onboarding"><span>Wie möchtest du deine Startseite nutzen?</span><div class="dsp-choices">'+choice("woman",g)+choice("man",g)+choice("neutral",g)+'</div></div>';
 else top+='<div class="dsp-prefs-inline"><span>'+label(g)+' · '+p.interests.map(x=>TOPICS.find(y=>y[0]===x)?.[1]||x).slice(0,3).join(" · ")+'</span><button type="button" data-dsp-open-account>Ändern</button></div>';
 top+='<div class="dsp-recommendations"><div class="dsp-section-head"><h3>Dein Wissensweg heute</h3><span>'+new Date().toLocaleDateString("de-DE",{timeZone:"Europe/Berlin",day:"2-digit",month:"long"})+'</span></div>';
 if(rs.length){top+='<div class="dsp-recommend-list">'+rs.map((x,i)=>'<div class="dsp-recommend-row"><button type="button" class="dsp-recommend-open" data-dsp-post="'+esc(x.id)+'"><span class="dsp-number">0'+(i+1)+'</span><span class="dsp-recommend-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.sub||"Qurʾān · Sunnah · Āthār")+'</small></span><span aria-hidden="true">›</span></button><button type="button" class="dsp-save'+(p.saved.includes(x.id)?" is-active":"")+'" data-dsp-save="'+esc(x.id)+'" aria-label="'+(p.saved.includes(x.id)?"Aus Merkliste entfernen":"Beitrag merken")+'" aria-pressed="'+p.saved.includes(x.id)+'">☆</button></div>').join("")+'</div>'}
 else top+='<p class="dsp-empty">Veröffentlichte Beiträge werden geladen. Die vorhandene Bibliothek bleibt über „Beiträge“ erreichbar.</p>';
 top+='</div><p class="dsp-footnote">Automatisch aus vorhandenen Beiträgen zusammengestellt · keine automatisch erfundenen religiösen Aussagen.</p></section>';
 return top}
function accountPanel(p){var g=p.gender;return '<section id="darTestSmartAccount" class="dsp-account" data-dsp-gender="'+g+'" aria-label="Mein persönlicher DĀR-Bereich">'+
 '<div class="dsp-account-hero"><img class="dsp-account-hero-img" alt="" src="'+hero(g)+'"><span class="dsp-account-ident">'+iconSpan(g)+'</span><div><span class="dsp-eyebrow">MEIN DĀR · PERSÖNLICH</span><h2>'+display(g)+'</h2><p>Profil, Wissen und persönliche Einträge an einem Ort.</p></div></div>'+
 '<div class="dsp-setting"><h3>Mein Profil</h3><p>Die Wahl ist freiwillig. Alle Bibliotheksbereiche bleiben für jede Person zugänglich.</p><div class="dsp-choices">'+choice("woman",g)+choice("man",g)+choice("neutral",g)+'</div></div>'+
 '<div class="dsp-setting"><h3>Erscheinungsbild</h3><div class="dsp-chip-set">'+themeOptions(p)+'</div></div>'+
 '<div class="dsp-setting"><h3>Meine Interessen</h3><p>Diese Auswahl beeinflusst nur die Reihenfolge der Empfehlungen.</p><div class="dsp-chip-set">'+interestOptions(p)+'</div></div>'+
 '<div class="dsp-setting"><h3>Meine Notizen <span class="dsp-count">'+p.notes.length+'</span></h3><label class="dsp-field-label" for="dspNoteText">Privater Entwurf auf diesem Gerät</label><textarea id="dspNoteText" class="dsp-note-input" maxlength="1600" rows="4" placeholder="Schreibe deine Gedanken, Lernnotizen oder Quellenhinweise …"></textarea><div class="dsp-note-actions"><button type="button" class="dsp-primary" data-dsp-add-note>Notiz speichern</button><span class="dsp-note-status" role="status"></span></div>'+
 '<p class="dsp-local-hint">Testversion: Diese Notizen werden lokal auf diesem Gerät gespeichert, noch nicht verschlüsselt oder mit dem Konto synchronisiert. Keine vertraulichen Informationen eintragen.</p>'+
 '<div class="dsp-notes-list">'+(p.notes.length?p.notes.slice().reverse().map((n,i)=>'<article class="dsp-note"><p>'+esc(n.text).replace(/\n/g,"<br>")+'</p><small>'+esc(n.date)+'</small><button type="button" data-dsp-remove-note="'+(p.notes.length-i-1)+'" aria-label="Notiz löschen">Löschen</button></article>').join(""):'<p class="dsp-empty">Noch keine Notizen gespeichert.</p>')+'</div></div>'+
 '<div class="dsp-setting"><h3>Meine Merkliste <span class="dsp-count">'+p.saved.length+'</span></h3><div class="dsp-notes-list">'+(p.saved.length?p.saved.map(id=>{var item=inventory().find(x=>x.id===id);return '<div class="dsp-saved-line"><button type="button" data-dsp-post="'+esc(id)+'">'+esc(item?item.title:"Gespeicherter Beitrag · "+id)+'</button><button type="button" data-dsp-save="'+esc(id)+'" aria-label="Aus Merkliste entfernen">×</button></div>'}).join(""):'<p class="dsp-empty">Beiträge auf der Startseite mit dem Stern speichern.</p>')+'</div></div>'+
 '<div class="dsp-setting"><h3>Meine Einstellungen</h3><button class="dsp-subtle" type="button" data-dsp-reset>Interessen und Profilauswahl zurücksetzen</button></div></section>'}
function syncLatest(p,root){
 var target=root.querySelector("#dhpPosts"),source=inventory();
 if(!target||!source.length)return;
 // Keep publication order; women's topics are not shown on the men's homepage.
 var list=(p.gender==="man"?source.filter(x=>!x.tags.includes("women")):source).slice(0,2);
 if(!list.length)return;
 var sig=p.gender+"|"+list.map(x=>x.id+"|"+x.title).join(";");
 var old=target.querySelector("[data-dhp-value]");
 if(target.dataset.dspRecentSig===sig&&old&&old.dataset.dhpValue===list[0].id&&target.children.length===list.length)return;
 target.replaceChildren();
 list.forEach(function(post,i){
  var btn=document.createElement("button");btn.type="button";
  btn.className=i?"dhp-article dhp-post-capsule":"dhp-panel dhp-feature dhp-post-capsule";
  btn.dataset.dhpRoute="post";btn.dataset.dhpValue=post.id;
  if(!i){var label=document.createElement("span");label.className="dhp-kicker";label.textContent="NEUESTE VERÖFFENTLICHUNG";btn.append(label)}
  var title=document.createElement("h3");title.textContent=post.title;
  var sub=document.createElement("p");sub.textContent=post.sub||"Qurʾān · Sunnah · Āthār";
  if(i){var div=document.createElement("div");div.append(title,sub);btn.append(div)}else btn.append(title,sub);
  target.append(btn)
 });
 target.dataset.dspRecentSig=sig;
}
function updateHome(p){var root=document.getElementById("darHomeHtmlParityV1");if(!root)return;
 var widget=root.querySelector(".dsp-mount");if(!widget){widget=document.createElement("div");widget.className="dsp-mount";var welcome=root.querySelector(".dhp-welcome");if(!welcome)return;welcome.insertAdjacentElement("afterend",widget)}
 var sig=owner()+"|"+today()+"|"+JSON.stringify([p.gender,p.chosen,p.palette,p.interests,p.saved,p.opened])+ "|" + inventory().length;
 if(widget.dataset.dspSig!==sig){widget.innerHTML=card(p);widget.dataset.dspSig=sig}
 root.dataset.smartGender=p.gender;
 syncLatest(p,root);
 // Do not delete or move native routes. Women's library shortcut remains in Mehr.
 var women=root.querySelector('.dhp-library-tile[data-dhp-route="frauen"]');
 if(women)women.hidden=p.gender==="man";
 var rec=picks(p)[0],todayName=root.querySelector("#dhpTodayName"),todayRow=root.querySelector("#dhpTodayArticle");
 if(rec&&todayName&&todayRow){todayName.textContent=rec.title;todayRow.dataset.dhpRoute="post";todayRow.dataset.dhpValue=rec.id}
}
function syncHeaderAvatar(p){document.querySelectorAll(".home-account-pill").forEach(function(pill){var old=pill.querySelector(".dsp-header-avatar");if(p.gender!=="woman"){if(old)old.remove();return}if(!old){old=document.createElement("img");old.className="dsp-header-avatar";old.alt="";old.setAttribute("aria-hidden","true");pill.prepend(old)}old.src=image(p.gender)})}
function updateAccount(p){if(!document.body.classList.contains("is-account-route"))return;
 var panel=document.querySelector("#appView .account-panel");if(!panel)return;var el=panel.querySelector("#darTestSmartAccount");
 if(!el){el=document.createElement("div");el.className="dsp-account-mount";panel.insertBefore(el,panel.firstChild)}
 var sig=owner()+"|"+JSON.stringify([p.gender,p.palette,p.interests,p.notes,p.saved]);if(el.dataset.dspSig!==sig){el.innerHTML=accountPanel(p);el.dataset.dspSig=sig}
}
function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;try{var o=owner(),p=read();if(o!==lastOwner){lastOwner=o;if(p.palette!=="keep")chooseTheme(p.palette)}
 updateHome(p);updateAccount(p);syncHeaderAvatar(p)}catch(e){console.warn("DĀR TEST Smart Profile",e)}})}
function nav(view,value){try{if(typeof navigate==="function"){navigate(view,value||"");return}}catch(_){}location.hash="#"+view}
document.addEventListener("click",function(e){
 var nativePost=e.target.closest('#darHomeHtmlParityV1 [data-dhp-route="post"]');
 if(nativePost&&nativePost.dataset.dhpValue){var opened=read(),pid=nativePost.dataset.dhpValue;opened.opened=[pid].concat(opened.opened.filter(x=>x!==pid)).slice(0,30);write(opened);return}
 var nativeTheme=e.target.closest("[data-dtbh-theme],[data-theme-select]");
 if(nativeTheme){var chosen=nativeTheme.getAttribute("data-dtbh-theme")||nativeTheme.getAttribute("data-theme-select");if(THEMES.includes(chosen)){var current=read();if(current.palette!==chosen){current.palette=chosen;write(current)}}return}
 var b=e.target.closest("[data-dsp-gender],[data-dsp-theme],[data-dsp-interest],[data-dsp-open-account],[data-dsp-open-more],[data-dsp-open-women],[data-dsp-post],[data-dsp-save],[data-dsp-add-note],[data-dsp-remove-note],[data-dsp-reset]");
 if(!b)return;
 e.preventDefault();e.stopPropagation();
 if(b.hasAttribute("data-dsp-gender")){saveGender(b.getAttribute("data-dsp-gender"));return}
 if(b.hasAttribute("data-dsp-theme")){themePick(b.getAttribute("data-dsp-theme"));return}
 if(b.hasAttribute("data-dsp-interest")){var p=read(),tag=b.getAttribute("data-dsp-interest");p.interests=p.interests.includes(tag)?p.interests.filter(x=>x!==tag):p.interests.concat([tag]);write(p);return}
 if(b.hasAttribute("data-dsp-open-account")){nav("account");return}
 if(b.hasAttribute("data-dsp-open-more")){nav("more");return}
 if(b.hasAttribute("data-dsp-open-women")){nav("frauen");return}
 if(b.hasAttribute("data-dsp-post")){var id=b.getAttribute("data-dsp-post"),p=read();p.opened=[id].concat(p.opened.filter(x=>x!==id)).slice(0,30);write(p);nav("post",id);return}
 if(b.hasAttribute("data-dsp-save")){var p=read(),id=b.getAttribute("data-dsp-save");p.saved=p.saved.includes(id)?p.saved.filter(x=>x!==id):p.saved.concat([id]).slice(-100);write(p);return}
 if(b.hasAttribute("data-dsp-add-note")){var input=document.getElementById("dspNoteText"),value=input&&input.value.trim();if(!value)return;var p=read();p.notes.push({text:value.slice(0,1600),date:new Date().toLocaleDateString("de-DE",{timeZone:"Europe/Berlin"})});p.notes=p.notes.slice(-40);write(p);return}
 if(b.hasAttribute("data-dsp-remove-note")){var p=read(),n=Number(b.getAttribute("data-dsp-remove-note"));if(Number.isInteger(n)&&n>=0&&n<p.notes.length){p.notes.splice(n,1);write(p)}return}
 if(b.hasAttribute("data-dsp-reset")){var p=read();p.gender="neutral";p.chosen=false;p.interests=[];p.palette="keep";write(p)}
});
function init(){body=document.body;refresh();document.addEventListener("dar:view-rendered",refresh);window.addEventListener("hashchange",refresh);window.addEventListener("pageshow",refresh);window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh()});
 var view=document.getElementById("appView");if(view)new MutationObserver(refresh).observe(view,{childList:true,subtree:false});
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:["class"]});
 // The last post content may arrive after the shell; refresh once when data finishes.
 setTimeout(refresh,700);setTimeout(refresh,1700);
}
window.DAR_TEST_SMART_PROFILE_V1={get:read,recommendations:function(){return picks(read())},refresh:refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
