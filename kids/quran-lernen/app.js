(()=>{"use strict";
const $=id=>document.getElementById(id), audio=$("ql-audio"), state={catalog:null,item:null,index:0,repeats:0,urls:[],fallback:0,profile:"",gender:"boy",progress:{version:1,items:{}}};
const pad=n=>String(n).padStart(3,"0");
const txt=(id,value)=>{$(id).textContent=String(value??"")};
const message=value=>txt("ql-audio-message",value);
function profile(){
 let gender="",id="",age="";try{const profiles=JSON.parse(localStorage.getItem("kids.profiles.v1")||"[]");const active=localStorage.getItem("kids.activeProfile");const child=Array.isArray(profiles)?profiles.find(p=>String(p.id)===String(active)):null;
 if(child){id=String(child.id);gender=child.gender;age=child.age}else{gender=localStorage.getItem("kids.guest.gender.v1")||"";age=localStorage.getItem("kids.age")||""}}catch(_){}
 state.gender=gender==="girl"?"girl":"boy";state.profile=id||"guest-"+state.gender;state.age=age;
 document.documentElement.dataset.gender=state.gender;txt("ql-profile","Dein Lernplatz · "+(state.gender==="girl"?"Mädchen":"Junge"));
}
const key=()=> "kids.quran-lernen.v1."+state.profile;
function load(){try{const d=JSON.parse(localStorage.getItem(key())||"{}");state.progress=d&&d.version===1&&d.items&&typeof d.items==="object"?d:{version:1,items:{}}}catch(_){state.progress={version:1,items:{}}}}
function save(){try{localStorage.setItem(key(),JSON.stringify(state.progress))}catch(_){message("Dein Fortschritt konnte nicht gespeichert werden.")}}
function record(item){const id=item.id;return state.progress.items[id]||(state.progress.items[id]={heard:{},spoken:{},understood:{},days:[],secure:false})}
function done(item,r){return item.verses.every(v=>r.heard[v.id]&&r.spoken[v.id]&&r.understood[v.id])}
function stats(item){const r=record(item),completed=item.verses.filter(v=>r.heard[v.id]&&r.spoken[v.id]&&r.understood[v.id]).length;return {r,completed,pct:Math.round(100*completed/item.verses.length)}}
function today(){return new Date().toLocaleDateString("sv-SE")}
function markDay(r){r.days=Array.isArray(r.days)?r.days:[];if(!r.days.includes(today()))r.days.push(today());r.days=r.days.slice(-60)}
function card(item){
 const st=stats(item),b=document.createElement("button");b.type="button";b.className="ql-card";b.setAttribute("aria-label",item.title+" öffnen");
 const image=document.createElement("span");image.className="ql-card-art";image.style.backgroundImage="url("+JSON.stringify(item.image)+")";b.append(image);
 const body=document.createElement("span");body.className="ql-card-content";
 for(const [tag,cls,label] of [["small","ql-card-tag",item.category==="surah"?"SŪRAH "+item.surah:"QURʾĀN "+item.source.replace("Qurʾān ","")],["strong","ql-card-title",item.title],["small","ql-card-meta",item.verses.length+" Āyāt · "+(st.r.secure?"Sicher gelernt":st.pct+"% geübt")]]){
 const t=document.createElement(tag);t.className=cls;t.textContent=label;body.append(t)}
 const bar=document.createElement("span");bar.className="ql-card-bar";const fill=document.createElement("span");fill.style.width=st.pct+"%";bar.append(fill);body.append(bar);b.append(body);b.addEventListener("click",()=>open(item.id));return b;
}
function renderList(){const a=$("ql-surahs"),b=$("ql-extras");a.replaceChildren();b.replaceChildren();let secure=0;
 for(const item of state.catalog.items){(item.category==="surah"?a:b).append(card(item));if(stats(item).r.secure)secure++}
 const pct=Math.round(100*secure/state.catalog.items.length);txt("ql-summary-text",secure+" von "+state.catalog.items.length+" Einheiten sicher gelernt");$("ql-progress-fill").style.width=pct+"%";$("ql-progress-track").setAttribute("aria-valuenow",String(pct));
}
function clearAudio(){state.repeats=0;state.urls=[];audio.pause();audio.removeAttribute("src");audio.load();$("ql-stop").disabled=true;$("ql-play").textContent="▶ Āyah anhören"}
function library(){clearAudio();state.item=null;$("ql-catalog").hidden=false;$("ql-lesson").hidden=true;history.replaceState(null,"",location.pathname);renderList();window.scrollTo({top:0,behavior:"instant"})}
function open(id){const item=state.catalog.items.find(x=>x.id===id);if(!item)return;
 state.item=item;const r=record(item);let next=item.verses.findIndex(v=>!(r.heard[v.id]&&r.spoken[v.id]&&r.understood[v.id]));state.index=next<0?0:next;
 $("ql-catalog").hidden=true;$("ql-lesson").hidden=false;
 const head=$("ql-lesson-heading");head.style.setProperty("--lesson-image","url("+JSON.stringify(item.image)+")");head.replaceChildren();
 for(const [tag,text] of [["small",item.category==="surah"?"SŪRAH "+item.surah:"AUSGEWÄHLTE ĀYĀT"],["h2",item.title],["p",item.overview]]){const el=document.createElement(tag);el.textContent=text;head.append(el)}
 renderVerse();head.scrollIntoView({block:"start",behavior:"instant"});history.replaceState(null,"","#quran-"+encodeURIComponent(id));
}
const verse=()=>state.item.verses[state.index];
function renderWords(v){const holder=$("ql-word-tiles"),detail=$("ql-word-detail");holder.replaceChildren();detail.textContent="Wähle ein Wort aus.";
 for(const word of v.words){const b=document.createElement("button");b.type="button";b.className="ql-word-tile";b.setAttribute("aria-pressed","false");b.textContent=word.ar;
 b.addEventListener("click",()=>{holder.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");detail.replaceChildren();
 const t=document.createElement("strong");t.textContent=word.meaning?"Bedeutung: "+word.meaning:"Einzelübersetzung noch in Prüfung.";detail.append(t);
 const letters=document.createElement("div");letters.className="ql-letters";letters.dir="rtl";
 const chars=(typeof Intl.Segmenter==="function")?Array.from(new Intl.Segmenter("ar",{granularity:"grapheme"}).segment(word.ar),x=>x.segment):Array.from(word.ar);
 for(const ch of chars){const span=document.createElement("span");span.textContent=ch;letters.append(span)}detail.append(letters)});
 holder.append(b)}
}
function renderProgress(){if(!state.item)return;const s=stats(state.item),r=s.r,v=verse();txt("ql-verse-progress",s.completed+" von "+state.item.verses.length+" Āyāt mit allen Lernschritten");txt("ql-days-progress",(r.days||[]).length+" von 3 Übungstagen");
 const eligible=done(state.item,r)&&(r.days||[]).length>=3;
 txt("ql-checklist",r.secure?"Sicher gelernt – von dir bestätigt.":eligible?"Alle Schritte sind erfüllt. Du kannst deinen Lernerfolg bestätigen.":"Höre, sprich nach und verstehe jede Āyah. Übe an drei verschiedenen Tagen.");
 $("ql-secure").disabled=!eligible||!!r.secure;$("ql-secure").textContent=r.secure?"✓ Sicher gelernt":"Als sicher gelernt bestätigen";
 txt("ql-status",r.heard[v.id]?"Schon gehört":"Bereit");$("ql-repeat-done").textContent=r.spoken[v.id]?"✓ Nachgesprochen":"Ich habe nachgesprochen";$("ql-understood").textContent=r.understood[v.id]?"✓ Verstanden":"Bedeutung verstanden";
}
function renderVerse(){clearAudio();const item=state.item,v=verse();txt("ql-ayah-index","Qurʾān "+item.surah+":"+v.id+" · "+(state.index+1)+" / "+item.verses.length);
 txt("ql-arabic",v.ar);txt("ql-transliteration",v.tr);txt("ql-german",v.de);txt("ql-source","Qurʾān "+item.surah+":"+v.id);
 txt("ql-meaning",item.overview);$("ql-prev").disabled=state.index===0;$("ql-next").disabled=state.index===item.verses.length-1;
 renderWords(v);renderProgress();message("Menschliche Rezitation über das Internet. Exakte Wort-Audios sind noch in Prüfung.");}
const QURAN_AUDIO_OFFSETS={"1":0,"2":7,"3":293,"4":493,"5":669,"6":789,"7":954,"8":1160,"9":1235,"10":1364,"11":1473,"12":1596,"13":1707,"14":1750,"15":1802,"16":1901,"17":2029,"18":2140,"19":2250,"20":2348,"21":2483,"22":2595,"23":2673,"24":2791,"25":2855,"26":2932,"27":3159,"28":3252,"29":3340,"30":3409,"31":3469,"32":3503,"33":3533,"34":3606,"35":3660,"36":3705,"37":3788,"38":3970,"39":4058,"40":4133,"41":4218,"42":4272,"43":4325,"44":4414,"45":4473,"46":4510,"47":4545,"48":4583,"49":4612,"50":4630,"51":4675,"52":4735,"53":4784,"54":4846,"55":4901,"56":4979,"57":5075,"58":5104,"59":5126,"60":5150,"61":5163,"62":5177,"63":5188,"64":5199,"65":5217,"66":5229,"67":5241,"68":5271,"69":5323,"70":5375,"71":5419,"72":5447,"73":5475,"74":5495,"75":5551,"76":5591,"77":5622,"78":5672,"79":5712,"80":5758,"81":5800,"82":5829,"83":5848,"84":5884,"85":5909,"86":5931,"87":5948,"88":5967,"89":5993,"90":6023,"91":6043,"92":6058,"93":6079,"94":6090,"95":6098,"96":6106,"97":6125,"98":6130,"99":6138,"100":6146,"101":6157,"102":6168,"103":6176,"104":6179,"105":6188,"106":6193,"107":6197,"108":6204,"109":6207,"110":6213,"111":6216,"112":6221,"113":6225,"114":6230};
function audioUrls(){const v=verse(),s=pad(state.item.surah),a=pad(v.id),g=QURAN_AUDIO_OFFSETS[state.item.surah]+v.id;return ["https://everyayah.com/data/Husary_128kbps/"+s+a+".mp3","https://dar-al-tawhid.de/quran-audio/ar.husary/"+g+".mp3"]}
function failAudio(){message("Die Rezitation ist zurzeit nicht erreichbar. Bitte Internetverbindung prüfen.");txt("ql-status","Audio nicht erreichbar");$("ql-play").textContent="▶ Erneut versuchen";$("ql-stop").disabled=true;state.repeats=0}
function fallback(){if(!state.repeats)return;if(state.fallback+1>=state.urls.length){failAudio();return}
 state.fallback++;audio.src=state.urls[state.fallback];audio.play().then(()=>{txt("ql-status","Wird rezitiert");$("ql-play").textContent="❚❚ Pause"}).catch(()=>failAudio());
}
function start(){clearAudio();state.urls=audioUrls();state.fallback=0;state.repeats=Number($("ql-repeat").value)||1;audio.src=state.urls[0];$("ql-stop").disabled=false;txt("ql-status","Audio lädt");message("Der Rezitator wird geladen …");
 audio.play().then(()=>{txt("ql-status","Wird rezitiert");$("ql-play").textContent="❚❚ Pause"}).catch(()=>fallback());}
function stop(){clearAudio();txt("ql-status","Angehalten");message("Wiedergabe angehalten.")}
function mark(type){const v=verse(),r=record(state.item);r[type][v.id]=true;markDay(r);save();renderProgress()}
audio.addEventListener("ended",()=>{if(!state.item||!state.repeats)return;const v=verse();if(state.repeats>1){state.repeats--;audio.currentTime=0;audio.play().catch(()=>fallback());return}
 const r=record(state.item);r.heard[v.id]=true;markDay(r);save();state.repeats=0;renderProgress();message("Āyah vollständig gehört. Jetzt kannst du nachsprechen und die Bedeutung lernen.");$("ql-play").textContent="▶ Noch einmal hören";$("ql-stop").disabled=true;});
audio.addEventListener("error",()=>{if(state.repeats)fallback()});
$("ql-play").addEventListener("click",()=>{if(!audio.paused&&audio.src){audio.pause();$("ql-play").textContent="▶ Fortsetzen";txt("ql-status","Pausiert")}else if(audio.src&&audio.currentTime>0&&!audio.ended){audio.play().then(()=>{$("ql-play").textContent="❚❚ Pause"}).catch(()=>start())}else start()});
$("ql-stop").addEventListener("click",stop);$("ql-repeat-done").addEventListener("click",()=>mark("spoken"));$("ql-understood").addEventListener("click",()=>mark("understood"));$("ql-library").addEventListener("click",library);
$("ql-prev").addEventListener("click",()=>{state.index=Math.max(0,state.index-1);renderVerse()});$("ql-next").addEventListener("click",()=>{state.index=Math.min(state.item.verses.length-1,state.index+1);renderVerse()});
$("ql-secure").addEventListener("click",()=>{const r=record(state.item);if(done(state.item,r)&&(r.days||[]).length>=3){r.secure=true;save();renderProgress()}});
window.addEventListener("pagehide",()=>{audio.pause()});
(async function init(){profile();load();
 try{const response=await fetch("/kids/quran-lernen/catalog.json?v=1",{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);const data=await response.json();
 if(!data||!Array.isArray(data.items)||!data.items.length)throw Error("Katalog leer");
 for(const item of data.items){if(!item.verses||!item.verses.length||item.verses.some(v=>!v.ar||!v.de||!Array.isArray(v.words)))throw Error("Sūra-Daten fehlen")}
 state.catalog=data;renderList();const hash=decodeURIComponent(location.hash||"");if(hash.startsWith("#quran-")){const id=hash.slice(7);if(data.items.some(x=>x.id===id))open(id)}
 }catch(err){$("ql-surahs").textContent="Der Qurʾān-Katalog konnte nicht geladen werden. Bitte Verbindung prüfen und erneut öffnen.";console.error("Qurʾān learning",err)}
})();
})();