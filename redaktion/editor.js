(function(){
"use strict";
const LANGS=[
["de","Deutsch","ltr"],["ar","العربية · Fuṣḥā","rtl"],["en","English","ltr"],
["tr","Türkçe","ltr"],["ku","Kurmancî","ltr"],["ckb","سۆرانی","rtl"],
["bs","Bosanski","ltr"],["fr","Français","ltr"],["es","Español","ltr"]
];
const $=id=>document.getElementById(id), STORAGE="dar_private_editorial_v1_";
let catalog=[],registry=[],picked=null,lang="de",platform="telegram",state=null,canonicalLinks=[],qLinks=[],busy=false;
const fresh=()=>({id:"",file:"",revision:"",q:"",qConfirmed:false,texts:{},reviews:{},extraLinks:[]});
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const plain=s=>String(s||"").replace(/^["']|["']$/g,"").trim();
const absolute=s=>{try{const u=new URL(s,location.origin);return u.protocol==="https:"||u.protocol==="http:"?u.href:""}catch(_){return""}};
const status=(text,target="copyNotice")=>{const el=$(target);if(el)el.textContent=text};
function key(){return STORAGE+String(state?.id||"new").replace(/[^a-z0-9_-]/gi,"-")}
function save(){if(!state)return;try{localStorage.setItem(key(),JSON.stringify(state))}catch(_){status("Lokaler Speicher voll – bitte JSON exportieren.","importStatus")}}
function load(id,file,rev){
 let data=null;const storageKey=STORAGE+String(id||"new").replace(/[^a-z0-9_-]/gi,"-");
 try{data=JSON.parse(localStorage.getItem(storageKey)||"null")}catch(_){}
 const base=Object.assign(fresh(),data&&typeof data==="object"?data:{});
 base.texts=base.texts||{};base.reviews=base.reviews||{};base.extraLinks=Array.isArray(base.extraLinks)?base.extraLinks:[];
 if(base.revision&&rev&&base.revision!==rev){base.reviews={};status("GitHub-Original hat eine neue Revision. Sprachfreigaben wurden zurückgesetzt.","importStatus")}
 base.id=id;base.file=file;base.revision=rev;return base;
}
async function request(path,type="text"){
 const r=await fetch(path,{cache:"no-store",credentials:"same-origin"});
 if(!r.ok)throw Error("HTTP "+r.status+" · "+path);
 return type==="json"?r.json():r.text();
}
function parseMd(raw){
 const match=raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
 const meta={},links=[];
 const fm=(match?match[1]:"").split(/\r?\n/);
 let area="",entry=null;
 for(const row of fm){
  const top=row.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
  if(top){area=top[1];if(top[2])meta[area]=plain(top[2]);continue}
  if(area==="links"){
    const l=row.match(/^\s*-\s*label:\s*(.+)$/);
    if(l){entry={title:plain(l[1]),url:""};links.push(entry)}
    const u=row.match(/^\s*url:\s*(.+)$/);if(u&&entry)entry.url=plain(u[1]);
  }
  if(area==="tags"){const t=row.match(/^\s*-\s*(.+)$/);if(t){meta.tags=meta.tags||[];meta.tags.push(plain(t[1]))}}
 }
 return {meta,body:match?raw.slice(match[0].length).trim():raw.trim(),links};
}
function sourceDraft(meta,body){
 const title=(meta.title||"Neuer Beitrag").replace(/^\s*📖\s*/u,"");
 const tags=[...(meta.tags||[])].filter(x=>/^#[A-Za-z][A-Za-z0-9_]*$/.test(x));
 const unique=["#DarAlTawhid"];
 for(const t of tags){if(!unique.includes(t)&&unique.length<4)unique.push(t)}
 while(unique.length<4)unique.push(["#Adab","#Wissen","#Sunnah"][unique.length-1]||"#Thema");
 let statement=body.trim(),fazit="";
 const ix=statement.indexOf("🌙");
 if(ix>=0){fazit=statement.slice(ix).trim();statement=statement.slice(0,ix).trim()}
 const source=String(meta.source||"").replace(/^\s*📝\s*/u,"").replace(/^(Quelle|𝐐𝐮𝐞𝐥𝐥𝐞)\s*:\s*/u,"");
 return "📖 "+title+"\n"+unique.join(" ")+"\n\n"+statement+
       (source?"\n\n📝 𝐐𝐮𝐞𝐥𝐥𝐞: "+source:"")+(fazit?"\n\n"+fazit:"");
}
function sourceText(){
 if(!state)return "";
 let text=String(state.texts[lang]||"").trim();
 if(platform==="whatsapp")text=text.split(/\r?\n/).filter(line=>!(/^\s*(?:#[\p{L}\p{N}_-]+\s*){4}\s*$/u.test(line))).join("\n").trim();
 if(state.qConfirmed&&/^[1-9]\d*$/.test(state.q)){
   const link="dar-al-tawhid.de/q/"+state.q+"/";
   if(!text.includes(link))text+="\n\n"+link;
 }
 return text;
}
function mdHtml(raw){
 const e=esc(raw||"");
 return e.replace(/\*\*\*([^*\n]+)\*\*\*/g,"<strong><em>$1</em></strong>")
   .replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>")
   .replace(/(^|[^\*])\*([^*\n]+)\*/g,"$1<em>$2</em>")
   .replace(/^&gt;\s?/gm,"")
   .replace(/\n/g,"<br>");
}
function validation(){
 const text=String(state?.texts[lang]||"").trim(),errs=[];
 if(!text)return ["Keine Sprachfassung vorhanden"];
 const lines=text.split(/\r?\n/).filter(x=>x.trim());
 if(!lines[0]?.startsWith("📖"))errs.push("📖 Titel fehlt");
 const tags=(lines[1]||"").match(/#[\p{L}\p{N}_-]+/gu)||[];
 if(tags.length!==4||tags[0]!=="#DarAlTawhid")errs.push("Vier Hashtags direkt unter dem Titel erforderlich (zuerst #DarAlTawhid)");
 if(!text.includes("🖋️"))errs.push("🖋️ Aussage fehlt");
 if(!text.includes("📝"))errs.push("📝 Quelle fehlt");
 if(!text.includes("🌙"))errs.push("🌙 Fazit fehlt");
 return errs;
}
function drawTabs(){
 const el=$("languages");el.replaceChildren();
 for(const [code,label,dir] of LANGS){
  const b=document.createElement("button");b.className="locale-tab";b.type="button";b.setAttribute("role","tab");
  b.setAttribute("aria-selected",String(code===lang));
  const checked=Boolean(state?.reviews?.[code]);const has=Boolean(state?.texts?.[code]?.trim());
  b.textContent=label+" "+(checked?"✓":has?"•":"○");b.onclick=()=>{lang=code;draw();};el.appendChild(b);
 }
}
function draw(){
 if(!state)return;
 const choice=LANGS.find(x=>x[0]===lang)||LANGS[0];
 $("selectedTitle").textContent=picked?.meta?.title||"Privater Entwurf";
 $("postIdDisplay").textContent=state.id||"Keine kanonische ID";
 $("sourceMetaDisplay").textContent=[picked?.meta?.scholar,picked?.meta?.book].filter(Boolean).join(" · ")||"–";
 $("qNumber").value=state.q||"";
 $("qStatus").textContent=state.qConfirmed?"Q-"+state.q+" · Originalseite bestätigt":"Noch kein geprüfter Quellenlink. Q-Nummer nur nach Prüfung eintragen.";
 $("copyQ").disabled=!state.qConfirmed;$("openQ").disabled=!state.qConfirmed;
 $("reviewCounter").textContent=LANGS.filter(x=>state.reviews[x[0]]).length+"/9 geprüft";
 $("revisionStatus").textContent=state.file?"Kanonischer GitHub-Beitrag · "+state.revision.slice(0,9):"Lokaler, unveröffentlichter Entwurf";
 drawTabs();
 $("editorLabel").textContent=choice[1];
 $("previewLang").textContent=choice[1];
 $("postText").value=state.texts[lang]||"";
 $("postText").dir=choice[2];
 $("preview").dir=choice[2];
 $("langStatus").textContent=state.reviews[lang]?"Manuell geprüft ✓":"Redaktioneller Entwurf";
 platform=$("platform").value;updatePreview();
 drawSources();
}
function updatePreview(){
 if(!state)return;
 const text=sourceText(),v=$("preview");
 v.innerHTML=text?mdHtml(text):'<span class="preview-empty">Noch keine Übersetzung eingefügt. Der deutsche Originaltext bleibt maßgeblich.</span>';
 const errs=validation();
 $("validation").textContent=errs.length?errs.join(" · "):"Textstruktur vollständig. Fachbegriffe, Originalzitate und sinngemäße Wiedergabe gesondert prüfen.";
 $("approveBtn").disabled=errs.length>0;
 $("copyAll").disabled=!text;$("shareAll").disabled=!text;
 $("copyQuote").disabled=!text;
}
async function copy(text){
 if(!text.trim())return;
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
  else{
   const el=document.createElement("textarea");el.value=text;el.style.position="fixed";el.style.left="-9999px";
   document.body.appendChild(el);el.select();if(!document.execCommand("copy"))throw Error("Zwischenablage");el.remove();
  }
  status("Vollständig kopiert. Unicode-Zeichen und Zeilenumbrüche bleiben erhalten.");
 }catch(e){status("Kopieren nicht möglich: "+String(e.message||e))}
}
function highlight(which){
 const el=$("postText"),s=el.selectionStart,e=el.selectionEnd;
 if(s===e){status("Markiere zuerst ein Wort oder einen Satz.");return}
 const chosen=el.value.slice(s,e);
 if(/[^\x20-\x7e]/.test(chosen)){status("Sonderzeichen, Umlaute oder Diakritika nicht in dekorative Mischschrift umwandeln.");return}
 const formatted=Array.from(chosen).map(c=>{
  let n=c.codePointAt(0);
  if(n>=65&&n<=90)return String.fromCodePoint((which==="bold"?0x1d400:0x1d468)+n-65);
  if(n>=97&&n<=122)return String.fromCodePoint((which==="bold"?0x1d41a:0x1d482)+n-97);
  if(n>=48&&n<=57&&which==="bold")return String.fromCodePoint(0x1d7ce+n-48);
  return c;
 }).join("");
 const pre=el.value.slice(0,s),post=el.value.slice(e);el.value=pre+formatted+post;
 state.texts[lang]=el.value;state.reviews[lang]=false;save();drawTabs();updatePreview();
 el.focus();el.setSelectionRange(s,s+formatted.length);
}
function quoteOnly(){
 let txt=String(state?.texts[lang]||"");let start=txt.indexOf("🖋️");
 if(start<0)return "";
 let end=txt.length;
 for(const ch of ["📝","🌙"]){const idx=txt.indexOf(ch,start+2);if(idx>=0&&idx<end)end=idx}
 return txt.slice(start,end).trim();
}
function card(title,url,sub,index){
 const root=document.createElement("div");root.className="source-card";
 const icon=document.createElement("div");icon.className="source-number";icon.textContent=index+1;
 const content=document.createElement("div");content.className="source-content";
 const heading=document.createElement("strong");heading.textContent=title;
 const desc=document.createElement("small");desc.textContent=sub;
 const actions=document.createElement("div");actions.className="source-actions";
 const link=document.createElement("a");link.className="btn";link.textContent="Nachweis öffnen ↗";link.href=url;link.target="_blank";link.rel="noopener noreferrer";
 const cp=document.createElement("button");cp.className="btn";cp.type="button";cp.textContent="Link kopieren";cp.onclick=()=>copy(url);
 actions.append(link,cp);content.append(heading,desc,actions);root.append(icon,content);
 return root;
}
function drawSources(){
 const wrapper=$("sourceCards");wrapper.replaceChildren();
 const seen=new Set(),links=[...qLinks,...canonicalLinks,...(state?.extraLinks||[])];
 let n=0;
 for(const item of links){
  const url=absolute(item.url);if(!url||seen.has(url))continue;seen.add(url);
  const name=item.title||"Originalnachweis";
  wrapper.appendChild(card(name,url,item.origin||"Geprüfte bibliografische Angabe beachten",n++));
 }
 if(!n){const p=document.createElement("p");p.className="help";p.textContent="Noch keine externen Nachweise zugeordnet. Prüfe die zugehörige Q-Seite oder füge einen belegten Link hinzu.";wrapper.appendChild(p)}
}
async function checkQ(){
 if(!state)return;
 const number=$("qNumber").value.trim();
 if(!/^[1-9]\d{0,5}$/.test(number)){status("Ungültige Q-Nummer.","qStatus");return}
 state.q=number;state.qConfirmed=false;qLinks=[];save();draw();
 status("Originalseite wird geprüft…","qStatus");
 try{
  const path="/q/"+number+"/";
  const page=await request(path);
  const dom=new DOMParser().parseFromString(page,"text/html");
  if(!dom.querySelector(".qsource-page,.qsource-body,.qsource-header"))throw Error("Keine valide Q-Quellenseite");
  qLinks=Array.from(dom.querySelectorAll("a.qsource-link[href]")).map(a=>{
   const h=a.querySelector(".qsource-link-title,.qsource-link-body strong,strong");
   return {title:(h?.textContent||a.textContent||"Direktnachweis").trim().slice(0,240),
    url:a.href||a.getAttribute("href"),origin:"Direktnachweis aus Q-"+number};
  }).filter(x=>absolute(x.url));
  state.qConfirmed=true;save();draw();
  status("Q-"+number+" ist nachweislich erreichbar. "+qLinks.length+" Direktnachweise geladen.","qStatus");
 }catch(e){state.qConfirmed=false;save();draw();status("Q-Nummer NICHT bestätigt: "+String(e.message||e),"qStatus")}
}
function manualDraft(){
 picked={meta:{id:"",title:"Neuer, unveröffentlichter Beitrag",scholar:"",book:""}};
 state=load("new","",String(Date.now()).slice(0,0));
 canonicalLinks=[];qLinks=[];lang="de";draw();status("Lokaler Entwurf. Erst nach zentraler Beitrags-ID und Q-Freigabe veröffentlichen.","importStatus");
}
async function selectFile(file){
 if(busy)return;busy=true;
 try{
  status("Originalbeitrag wird aus GitHub geladen…","importStatus");
  const row=catalog.find(x=>x.name===file);if(!row)throw Error("Beitrag nicht im Index");
  const md=await request("/content/posts/"+encodeURIComponent(file));
  const parsed=parseMd(md);picked=parsed;
  const id=parsed.meta.id||file.replace(/\.md$/,"");
  state=load(id,file,row.sha||"");
  if(!state.texts.de?.trim())state.texts.de=sourceDraft(parsed.meta,parsed.body);
  canonicalLinks=parsed.links.map(l=>({
    title:/^(?:→|https?:)/.test(l.title||"")?
       [parsed.meta.scholar,parsed.meta.book,parsed.meta.source].filter(Boolean).join(" · "):l.title,
    url:l.url,origin:parsed.meta.source||"Aus Beitrag"
  })).filter(x=>absolute(x.url));
  qLinks=[];lang="de";
  if(!state.q){
   const exact=registry.filter(x=>[id,file.replace(/\.md$/,"")].includes(x.postReference));
   if(exact.length===1)state.q=String(exact[0].number);
  }
  save();draw();
  // Only existing explicitly approved translations may be loaded from manifest.
  await loadApprovedTranslations(file.replace(/\.md$/,""));
  if(state.q)await checkQ();else status("Originalbeitrag geladen; Q-Nummer noch nicht eindeutig zugeordnet.","importStatus");
 }catch(e){status("Laden fehlgeschlagen: "+String(e.message||e),"importStatus")}
 finally{busy=false}
}
async function loadApprovedTranslations(slug){
 try{
  if(!/^[a-z0-9][a-z0-9-]+$/.test(slug))return;
  const manifest=await request("/content/i18n/adult-posts/"+slug+".json","json");
  if(manifest.postId!==slug||manifest.contentId!=="post:"+slug)return;
  for(const [code] of LANGS){
   if(code==="de"||state.texts[code]?.trim())continue;
   const x=manifest.languages?.[code];
   if(x?.status!=="approved"||x.publicDisplayAllowed!==true||typeof x.path!=="string"||
      !/^\/desktop-preview\/i18n-core-v1\/translations\/[a-z]+\/post\/[a-z0-9-]+\.json$/.test(x.path))continue;
   try{
    const translation=await request(x.path,"json");
    if(translation.status!=="approved"||translation.locale!==code||translation.sourceHash!==manifest.sourceHash||
       !translation.fields?.title||!translation.fields?.body)continue;
    state.texts[code]=sourceDraft({...picked.meta,title:translation.fields.title},translation.fields.body);
    state.reviews[code]=false; // social formatting is still an unreviewed draft
   }catch(_){}
  }
  save();draw();
 }catch(_){}
}
function renderCatalog(query=""){
 const root=$("catalog");root.replaceChildren();
 const filtered=catalog.filter(x=>x.name.toLowerCase().includes(query.toLowerCase())).slice(0,90);
 filtered.forEach(x=>{
  const b=document.createElement("button");b.type="button";b.className="library-item"+(state?.file===x.name?" selected":"");
  const s=document.createElement("strong");s.textContent=x.name.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ");
  const small=document.createElement("small");small.textContent=x.name;b.append(s,small);b.onclick=()=>selectFile(x.name);root.append(b);
 });
 if(!filtered.length)root.textContent="Keine passenden Beiträge.";
}
async function loadCatalog(){
 try{
  const [posts,q]=await Promise.all([request("/content/posts/posts-index.json","json"),request("/q/_registry/shortlinks.json","json").catch(()=>({links:[]}))]);
  catalog=(posts.files||[]).map(x=>typeof x==="string"?{name:x,sha:""}:x).filter(x=>/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.md$/.test(x.name));
  registry=Array.isArray(q.links)?q.links:[];
  $("catalogStatus").textContent=catalog.length+" kanonische Dateien geladen";
  renderCatalog();
 }catch(e){$("catalogStatus").textContent="GitHub-Katalog konnte nicht geladen werden: "+String(e.message||e)}
}
function download(){
 if(!state)return;
 const pack={schemaVersion:1,type:"dar-owner-social-review",exportedAt:new Date().toISOString(),
   id:state.id,filename:state.file,revision:state.revision,
   q:state.q,qConfirmed:state.qConfirmed,texts:state.texts,reviews:state.reviews,extraLinks:state.extraLinks};
 const blob=new Blob([JSON.stringify(pack,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;
 a.download="dar-social-"+(state.id||"entwurf").replace(/[^a-z0-9_-]/gi,"-")+".json";
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
 status("Neun Sprachfassungen als Datei gesichert.","importStatus");
}
async function importFile(e){
 const file=e.target.files?.[0];if(!file||!state)return;
 try{
  const data=JSON.parse(await file.text());
  if(data.type!=="dar-owner-social-review"||data.id!==state.id||!data.texts||typeof data.texts!=="object")
   throw Error("Datei gehört nicht zu dieser kanonischen Beitrags-ID");
  if(!confirm("Lokale Sprachfassungen dieses Beitrags durch die Datei ersetzen?"))return;
  const clean={};for(const [code] of LANGS)if(typeof data.texts[code]==="string")clean[code]=data.texts[code];
  state.texts=clean;state.reviews={};state.extraLinks=Array.isArray(data.extraLinks)?data.extraLinks.filter(x=>absolute(x.url)).slice(0,40):[];
  // Never implicitly restore a source verification from an imported file.
  state.q=data.q||"";state.qConfirmed=false;save();qLinks=[];draw();
  status("Texte importiert. Quellenprüfung und Sprachfreigaben müssen neu erfolgen.","importStatus");
 }catch(err){status("Import abgewiesen: "+String(err.message||err),"importStatus")}
 finally{e.target.value=""}
}
async function share(){
 const text=sourceText();if(!text)return;
 if(navigator.share){try{await navigator.share({text});return}catch(_){}}
 await copy(text);
}
function bind(){
 $("postSearch").oninput=e=>renderCatalog(e.target.value);
 $("newDraft").onclick=manualDraft;
 $("checkQ").onclick=checkQ;
 $("qNumber").oninput=e=>{if(!state)return;state.q=e.target.value;state.qConfirmed=false;state.reviews={};qLinks=[];save();$("copyQ").disabled=true;$("openQ").disabled=true;status("Q-Nummer geändert – erneute Prüfung erforderlich.","qStatus")};
 $("copyQ").onclick=()=>state?.qConfirmed&&copy("dar-al-tawhid.de/q/"+state.q+"/");
 $("openQ").onclick=()=>state?.qConfirmed&&window.open("/q/"+state.q+"/","_blank","noopener");
 $("postText").oninput=e=>{if(!state)return;state.texts[lang]=e.target.value;state.reviews[lang]=false;save();drawTabs();$("langStatus").textContent="Entwurf";updatePreview()};
 $("platform").onchange=e=>{platform=e.target.value;updatePreview()};
 $("formatBold").onclick=()=>state&&highlight("bold");
 $("formatItalic").onclick=()=>state&&highlight("italic");
 $("copySelection").onclick=()=>copy($("postText").value.slice($("postText").selectionStart,$("postText").selectionEnd));
 $("copyQuote").onclick=()=>copy(quoteOnly());
 $("copyAll").onclick=()=>copy(sourceText());
 $("shareAll").onclick=share;
 $("approveBtn").onclick=()=>{
  if(!state||validation().length)return;
  if(!confirm("Hast du Wortlaut, sinngemäße Wiedergabe, Namen, Fachbegriffe und Quelle in dieser Sprache vollständig geprüft?"))return;
  state.reviews[lang]=true;save();draw();status("Manuelle Redaktionskontrolle dokumentiert; keine unabhängige Muttersprachlerprüfung behauptet.");
 };
 $("refreshSources").onclick=()=>state?.q?checkQ():drawSources();
 $("addSource").onclick=()=>{
  if(!state)return;
  const title=$("sourceTitle").value.trim(),url=absolute($("sourceUrl").value.trim());
  if(title.length<8||!url){status("Autor/Werk/Seite und gültige https-URL erforderlich.");return}
  state.extraLinks.push({title,url,origin:"Eigener Originalnachweis · fachlich prüfen"});
  save();drawSources();$("sourceTitle").value="";$("sourceUrl").value="";
 };
 $("exportDraft").onclick=download;$("importDraft").onchange=importFile;
}
bind();loadCatalog();
})();