/* DĀR AL TAWḤĪD · protected Test start-page visual studio V2
   Visual browser editor, no automatic site writes. Same-origin /test iframe only. */
(function(){"use strict";
const $=id=>document.getElementById(id);
const STORAGE="dar_visual_studio_v3",ACTIVE="dar_visual_studio_local_enabled_v3";
const SOURCE_V2="dar_visual_studio_v2";
const sourceUrls={
 test:"/test/index.html?env=staging&dar-editor=3",
 html:"/test/editor/startseite-v47-canvas.html?dar-editor=3",
 visitor:"/index.html?dar-editor=3"
};
const sourceNames={test:"Test-App · echte Testseite",html:"HTML · Layoutvorlage",visitor:"Besucher-App · NUR ENTWURF"};
function blank(){return {format:"dar-test-layout-v2",version:2,items:{},fragments:[],images:[],moves:[],transfers:[],lastSaved:0}}
let pages={test:blank(),html:blank(),visitor:blank()},activePage="test";
let copied=null,longPress=null,longPoint=null;
let paneShift={x:0,y:0};

const legacyKey="dar_v47_visual_editor_enabled_v1";
const presets=[
 ["leadin","Beitragszeile",".dar-v47-leadin"],
 ["logo","Markenlogo",".brand-main .logo"],
 ["brand","DĀR AL TAWḤĪD",".brand-main .brand-title-refined"],
 ["actions","Header-Symbole","#dv3HeaderActions"],
 ["prayer","Gebetszeiten","#headerPrayerStatus"],
 ["current","Aktuelles Gebet","#headerPrayerStatus .header-prayer-zone--now"],
 ["next","Nächstes Gebet","#headerPrayerStatus .header-prayer-zone--next"],
 ["meta","Datum und Uhrzeit","#headerPrayerStatus .header-prayer-hub__status"],
 ["salam","Begrüßung",".dar-v47-salam"],
 ["intro","Einleitung",".dar-v47-intro"],
 ["search","Wissenssuche","#dtHero1194 .dt-hero-search-slot"],
 ["ibn","Ibn-Sīrīn-Aussage",".top-shell>.isnad"],
 ["links","Schnellzugriffe","#dv3Home .dv3-quick-grid"],
 ["posts","Neueste Beiträge","#dv3Latest"],
 ["header","Markenheader",".top-shell .header"],
 ["home","Startseiten-Inhalt","#dv3Home"]
];
const rootSel=presets.map(x=>x[2]);
const settings=["fontSize","fontFamily","fontWeight","lineHeight","letterSpacing","textAlign","x","y","width","height","marginTop","marginBottom","padding","radius","color","background","opacity"];
let state=blank(),
 history=[],redo=[],selected=[],mode="select",tab="select",
 frame=$("appFrame"),doc=null,zoom=1,deviceWidth=393,viewportHeight=950,
 gesture=null,outline=null,handle=null,lasso=null,lastSelectedText="",savedTimer=0,
 imageCandidate="",imgFit="cover",imgOpacity=1,editorLoaded=false,
 historyNames=[],redoNames=[],versionPoints=[],quickImagePending=false,
 cleanStyles=new Map(),cleanText=new Map(),originalMoves=new Map(),nodeKeys=new Map(),drawHandles=[];
const isTextEl=n=>n&&(/^(P|SPAN|H1|H2|H3|H4|B|STRONG|SMALL|LABEL|EM|A|BUTTON)$/.test(n.tagName)||n.classList.contains("isnad-quote"));
const esc=s=>window.CSS&&CSS.escape?CSS.escape(s):String(s).replace(/([^a-zA-Z0-9_-])/g,"\\$1");
const limit=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const fmt=n=>Math.round(Number(n)*100)/100;
const deep=x=>JSON.parse(JSON.stringify(x));
const info=s=>{$("status").textContent=s};
function getTheme(){return $("theme").value}
function pathFor(el){
 if(!el||el===doc.documentElement||el===doc.body)return null;
 if(el.dataset.veImageId)return "image:"+el.dataset.veImageId;
 if(el.dataset.veFragmentId)return "fragment:"+el.dataset.veFragmentId;
 if(el.dataset.veTransferId)return "transfer:"+el.dataset.veTransferId;
 for(const p of presets){try{if(el.matches(p[2]))return p[2]}catch(e){}}
 if(el.id&&doc.querySelectorAll("#"+esc(el.id)).length===1)return "#"+esc(el.id);
 let parts=[],n=el;
 for(let k=0;k<11&&n&&n!==doc.body&&n!==doc.documentElement;k++,n=n.parentElement){
  let item=n.tagName.toLowerCase();
  if(n.id){parts.unshift("#"+esc(n.id));break}
  let siblings=n.parentElement&&Array.from(n.parentElement.children).filter(x=>x.tagName===n.tagName)||[];
  if(siblings.length>1)item+=":nth-of-type("+(siblings.indexOf(n)+1)+")";
  parts.unshift(item);
 }
 return parts.join(" > ");
}
function byPath(path){
 if(!doc||!path)return null;
 if(path.startsWith("image:"))return doc.querySelector('[data-ve-image-id="'+esc(path.slice(6))+'"]');
 if(path.startsWith("fragment:"))return doc.querySelector('[data-ve-fragment-id="'+esc(path.slice(9))+'"]');
 if(path.startsWith("transfer:"))return doc.querySelector('[data-ve-transfer-id="'+esc(path.slice(9))+'"]');
 const cached=nodeKeys.get(path);
 if(cached&&cached.isConnected&&cached.ownerDocument===doc)return cached;
 try{const el=doc.querySelector(path);if(el)trackNode(path,el);return el}catch(e){return null}
}
function describe(path){
 const found=presets.find(p=>p[2]===path);
 if(found)return found[1];
 if(path.startsWith("image:"))return "Bildebene "+path.slice(6).slice(-4);
 if(path.startsWith("fragment:"))return "Wort-Ebene "+path.slice(9).slice(-4);
 if(path.startsWith("transfer:"))return "Übertragene Entwurfs-Ebene";
 if(path.startsWith("transfer:"))return "Übertragener Abschnitt "+path.slice(-4);
 const el=byPath(path);
 return el ? ((el.innerText||el.getAttribute("aria-label")||el.tagName).trim().replace(/\s+/g," ").slice(0,43)||el.tagName) : path.slice(0,45);
}
function first(){return selected[0]||""}
function choose(path,append=false){
 if(!path)return;
 if(append){if(!selected.includes(path))selected.push(path)}
 else selected=[path];
 $("selectedName").textContent=selected.length>1?selected.length+" Bereiche ausgewählt":describe(first());
 $("selectedPath").textContent=first();
 $("selectionInfo").textContent=selected.length>1?selected.length+" Ebenen":describe(first());
 redraw();refreshControls();renderLayers();
}
function defaultTarget(){return presets.find(p=>byPath(p[2]))?.[2]||""}
function historyUI(){
 const p=$("historyPosition");if(!p)return;
 const labels=[...historyNames,"Jetzt · aktueller Bearbeitungsstand",...redoNames.slice().reverse()];
 const current=history.length;p.replaceChildren();
 for(let k=0;k<labels.length;k++){
  const opt=document.createElement("option");opt.value=String(k);
  opt.textContent=(k===current?"● ":"")+"#"+(k+1)+" · "+labels[k];
  p.appendChild(opt);
 }
 p.value=String(current);
 $("undo").disabled=!history.length;$("redo").disabled=!redo.length;
}
function snapshot(label){
 history.push(deep(state));historyNames.push(String(label||describe(first())||"Layoutänderung").slice(0,58));
 if(history.length>55){history.shift();historyNames.shift();}
 redo=[];redoNames=[];historyUI();
}
function jumpTo(pos){
 if(!Number.isInteger(pos)||pos<0||pos>history.length+redo.length)return;
 let change=false;
 while(history.length>pos){
  redo.push(deep(state));redoNames.push(historyNames.pop()||"Rückgängig");
  state=history.pop();pages[activePage]=state;change=true;
 }
 while(history.length<pos&&redo.length){
  history.push(deep(state));historyNames.push(redoNames.pop()||"Wiederherstellen");
  state=redo.pop();pages[activePage]=state;change=true;
 }
 if(change){pages[activePage]=state;reconcile();scheduleSave();info("Bearbeitungsstand wiederhergestellt · ohne App-Neustart.");}
 historyUI();
}
function rememberStyle(el){
 if(!el||!el.isConnected||!doc||el.ownerDocument!==doc)return;
 if(!cleanStyles.has(el))cleanStyles.set(el,el.getAttribute("style"));
}
function rememberText(el){
 if(!el||!el.isConnected||!doc||el.ownerDocument!==doc)return;
 if(!cleanText.has(el))cleanText.set(el,[...el.childNodes]);
}
function trackNode(key,el){if(key&&el&&el.isConnected)nodeKeys.set(key,el);}
function restoreVisuals(){
 if(!doc||!doc.body)return;
 removeMarkers();
 for(const el of doc.querySelectorAll("[data-ve-image-id],[data-ve-transfer-id]"))el.remove();
 for(const el of doc.querySelectorAll("[data-ve-fragment-id]"))el.replaceWith(doc.createTextNode(el.textContent));
 for(const [el,children] of cleanText){if(el.isConnected)el.replaceChildren(...children)}
 for(const [el,attr] of cleanStyles){
  if(!el.isConnected)continue;
  if(attr===null)el.removeAttribute("style");else el.setAttribute("style",attr);
 }
 for(const [el,orig] of [...originalMoves].reverse()){
  if(!el.isConnected||!orig.parent||!orig.parent.isConnected)continue;
  if(orig.next&&orig.next.parentNode===orig.parent)orig.parent.insertBefore(el,orig.next);
  else orig.parent.appendChild(el);
 }
 cleanStyles.clear();cleanText.clear();originalMoves.clear();
}
function reconcile(){
 if(!doc||!doc.body)return;
 const sy=frame.contentWindow.scrollY,sx=frame.contentWindow.scrollX;
 restoreVisuals();paint();redraw();refreshControls();renderLayers();
 try{frame.contentWindow.scrollTo(sx,sy)}catch(_){}
}
function alter(fn,{reset=false}={}){
 snapshot();fn();
 if(reset)reconcile();else{paint();redraw();refreshControls();renderLayers();}
 scheduleSave();historyUI();
}
function scheduleSave(){clearTimeout(savedTimer);savedTimer=setTimeout(save,550)}
function save(){
 state.lastSaved=Date.now();pages[activePage]=state;
 try{
  localStorage.setItem(STORAGE,JSON.stringify({version:3,pages,activePage,updated:Date.now()}));
  info(sourceNames[activePage]+" · Entwurf lokal gespeichert");
 }catch(e){info("Lokaler Speicher ist voll. Bitte zuerst JSON exportieren.")}
}
function restore(){
 try{
  const raw=JSON.parse(localStorage.getItem(STORAGE)||"null");
  if(raw&&raw.version===3&&raw.pages){
   for(const p of ["test","html","visitor"]){
    const v=raw.pages[p];
    if(v&&v.version===2&&v.items&&typeof v.items==="object")
     pages[p]={...blank(),...v,images:Array.isArray(v.images)?v.images:[],fragments:Array.isArray(v.fragments)?v.fragments:[],moves:Array.isArray(v.moves)?v.moves:[],transfers:Array.isArray(v.transfers)?v.transfers:[]};
   }
   if(sourceUrls[raw.activePage])activePage=raw.activePage;
  }else{
   const older=JSON.parse(localStorage.getItem(SOURCE_V2)||"null");
   if(older?.version===2&&older.items)pages.test={...blank(),...older};
  }
 }catch(e){}
 state=pages[activePage];
 $("applyLocal").checked=localStorage.getItem(ACTIVE)==="1";
}
function itemFor(k){return state.items[k]||(state.items[k]={})}
function bucket(w){return w<=500?"phone":w<=1100?"tablet":"wide"}
function currentItem(k){
 const base=state.items[k]||{};
 return {...base,...(base.breakpoints?.[bucket(deviceWidth)]||{})};
}
function variantFor(k){
 const base=itemFor(k);
 if(!$("perDevice").checked)return base;
 base.breakpoints=base.breakpoints||{};
 const key=bucket(deviceWidth);
 return (base.breakpoints[key]=base.breakpoints[key]||{});
}
function editedValue(k){return(state.items[first()]||{})[k]}
function safeCss(el,prop,value){if(value===null||value===undefined||value===""){el.style.removeProperty(prop)}else el.style.setProperty(prop,String(value),"important")}
function applyTo(el,data){
 if(!el||!data)return;
 const num=(key,a,b)=>Number.isFinite(Number(data[key]))?limit(data[key],a,b):null;
 rememberStyle(el);
 if(data.hidden)safeCss(el,"display","none");
 if(typeof data.text==="string"&&!withinLiveData(el)&&el.textContent!==data.text){
  rememberText(el);el.textContent=data.text;
 }
 const defs=[
 ["fontSize","font-size",8,110,"px"],["fontFamily","font-family",0,0,""],["fontWeight","font-weight",0,0,""],["lineHeight","line-height",.8,2.6,""],["letterSpacing","letter-spacing",-4,14,"px"],
 ["textAlign","text-align",0,0,""],["marginTop","margin-top",-120,220,"px"],["marginBottom","margin-bottom",-120,220,"px"],
 ["padding","padding",0,100,"px"],["radius","border-radius",0,70,"px"],["opacity","opacity",.05,1,""],
 ["color","color",0,0,""],["background","background-color",0,0,""]
 ];
 for(const [k,css,a,b,unit]of defs)if(data[k]!==undefined){
  const value=typeof data[k]==="string"&&a===0&&b===0?data[k]:num(k,a,b);
  if(value!==null) safeCss(el,css,String(value)+unit);
 }
 let x=num("x",-450,450),y=num("y",-600,600);
 if(x!==null||y!==null)safeCss(el,"translate",(x||0)+"px "+(y||0)+"px");
 let w=num("width",12,150),h=num("height",0,700);
 if(w!==null)safeCss(el,"width",w+"%");
 if(h!==null)safeCss(el,"height",h+"px");
 if(data.zIndex!==undefined)safeCss(el,"z-index",limit(data.zIndex,-9,999));
 if(data.backgroundImage&&(/^(https:\/\/|data:image\/)/.test(data.backgroundImage))){
  safeCss(el,"background-image",'url("'+data.backgroundImage.replace(/["\\\n\r]/g,"")+'")');
  const scale=limit(Number(data.bgScale)||100,100,250);
  const fit=data.imageFit==="contain"?"contain":"cover";
  // One-axis percentage preserves the image's intrinsic aspect ratio.
  safeCss(el,"background-size",scale===100?fit:scale+"% auto");
  safeCss(el,"background-position",limit(data.bgX??50,0,100)+"% "+limit(data.bgY??50,0,100)+"%");
  safeCss(el,"background-repeat","no-repeat");
  if(data.pinnedBackground){
   safeCss(el,"position","sticky");safeCss(el,"top","0px");
   safeCss(el,"z-index","8");safeCss(el,"isolation","isolate");
  }
 }
 if(el.tagName==="IMG"||el.hasAttribute("data-ve-image-id")){
  safeCss(el,"height","auto");safeCss(el,"object-fit","contain");safeCss(el,"aspect-ratio","auto");
 }
}
function withinLiveData(el){
 return !!el.closest("#headerPrayerStatus")||!!el.closest("#homeSearchBlock")||
 !!el.closest("#dv3Latest")||el.tagName==="INPUT"||el.tagName==="SELECT"||el.tagName==="TEXTAREA";
}
function applyFragments(){
 for(const f of state.fragments){
  if(!f||!f.parent||!f.text||!f.id)continue;
  const parent=byPath(f.parent);if(!parent||parent.querySelector('[data-ve-fragment-id="'+esc(f.id)+'"]'))continue;
  const walker=doc.createTreeWalker(parent,NodeFilter.SHOW_TEXT);
  let n;
  while(n=walker.nextNode()){
   let idx=n.textContent.indexOf(f.text);if(idx<0)continue;
   try{const r=doc.createRange();r.setStart(n,idx);r.setEnd(n,idx+f.text.length);
    const span=doc.createElement("span");span.dataset.veFragmentId=f.id;
    span.className="dar-ve-fragment";span.style.display="inline-block";
    r.surroundContents(span);break;
   }catch(e){break}
  }
 }
}
function applyImages(){
 for(const i of state.images){
  if(!i||!i.id||!i.anchor||!i.src)continue;
  const host=byPath(i.anchor);if(!host)continue;
  let el=byPath("image:"+i.id);
  if(!el){
   el=doc.createElement("img");el.dataset.veImageId=i.id;
   el.alt="Eingefügte Designgrafik";el.draggable=false;
   el.className="dar-ve-float-image";
   host.appendChild(el);
  }
  if(el.src!==i.src)el.src=i.src;
  const cs=frame.contentWindow.getComputedStyle(host);
  if(cs.position==="static"){rememberStyle(host);host.style.position="relative"}
  el.style.cssText="display:block;position:absolute;top:0;left:0;width:30%;height:auto;aspect-ratio:auto;object-fit:contain;z-index:8;user-select:none;touch-action:none;pointer-events:auto;max-width:none;";
  const overlayState=currentItem("image:"+i.id);
  applyTo(el,{...overlayState,opacity:overlayState.opacity??i.opacity??1,width:overlayState.width??30});
 }
}

function uid(prefix){return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function snapshotSelection(){
 const el=byPath(first());if(!el)return null;
 const style=frame.contentWindow.getComputedStyle(el);
 const sourceImage=el.tagName==="IMG"?el:el.querySelector("img");
 const imageUrl=sourceImage&&sourceImage.currentSrc&&safeImageUrl(sourceImage.currentSrc)||"";
 return {
  sourcePage:activePage,label:describe(first()),sourcePath:first(),
  text:(el.innerText||el.textContent||"").replace(/\s+/g," ").trim().slice(0,1800),
  image:imageUrl,
  style:{fontSize:limit(parseFloat(style.fontSize)||14,8,80),
   fontWeight:["400","500","600","700","800"].includes(style.fontWeight)?style.fontWeight:"500",
   textAlign:["left","center","right"].includes(style.textAlign)?style.textAlign:"left"}
 };
}
function copySelection(target){
 const snapshot=snapshotSelection();
 if(!snapshot)return info("Zuerst ein sichtbares Element markieren.");
 copied=snapshot;
 info("„"+snapshot.label+"“ kopiert. Jetzt Ziel wählen und vor oder nach dem Ziel einsetzen.");
 if(target&&sourceUrls[target])switchPage(target);
}
function flowAnchor(node){
 if(!node)return null;
 const target=node.closest("section,article,header,footer,li,.dv3-post,.dv3-quick,.home-line-row,.brand-main")||node;
 return target.parentNode&&target.parentNode!==doc.documentElement?target:node;
}
function applyTransfers(){
 for(const x of state.transfers||[]){
  if(!x?.id||!x?.anchor||!x?.snapshot)continue;
  let el=byPath("transfer:"+x.id);
  const destination=flowAnchor(byPath(x.anchor));if(!destination||!destination.parentNode)continue;
  if(!el){
   el=doc.createElement("section");el.dataset.veTransferId=x.id;el.className="dar-ve-transfer";
   el.setAttribute("aria-label","Designentwurf: "+String(x.snapshot.label||"Bereich").slice(0,75));
   const txt=doc.createElement("p");txt.textContent=String(x.snapshot.text||"").slice(0,1800);
   txt.style.cssText="margin:0!important;font:inherit!important;white-space:normal!important;color:inherit!important;";
   if(x.snapshot.image&&safeImageUrl(x.snapshot.image)){
    const img=doc.createElement("img");img.src=x.snapshot.image;img.alt="";
    img.style.cssText="display:block;width:100%;max-height:260px;object-fit:contain;margin:0 0 9px;";
    el.appendChild(img);
   }
   el.appendChild(txt);
   el.style.cssText="display:block;position:relative;min-width:0;max-width:100%;padding:14px 16px;border:1px solid var(--dt-accent,#af9972);border-radius:12px;color:var(--dt-ink,#2a302f);background:var(--dt-page,transparent);box-sizing:border-box;";
  }
  if(x.where==="after"){
   if(destination.nextElementSibling!==el)destination.parentNode.insertBefore(el,destination.nextSibling);
  }else if(destination.previousElementSibling!==el)destination.parentNode.insertBefore(el,destination);
 }
}
function applyMoves(){
 for(const m of state.moves||[]){
  const source=byPath(m.source),anchor=flowAnchor(byPath(m.anchor));
  if(!source||!anchor||source===anchor||source.contains(anchor)||!anchor.parentNode)continue;
  if(!originalMoves.has(source))originalMoves.set(source,{parent:source.parentNode,next:source.nextSibling});
  if(m.where==="after"){
   if(anchor.nextElementSibling!==source)anchor.parentNode.insertBefore(source,anchor.nextSibling);
  }else if(anchor.previousElementSibling!==source)anchor.parentNode.insertBefore(source,anchor);
 }
}
function pasteAt(where){
 if(!copied)return info("Zuerst auf einer der drei Seiten einen Bereich kopieren.");
 if(!first()||!byPath(first()))return info("Ziel auswählen, bevor du den kopierten Bereich einfügst.");
 const dest=first();
 const transfer={id:uid("t"),anchor:dest,where,snapshot:copied};
 alter(()=>{state.transfers=state.transfers||[];state.transfers.push(transfer)});
 choose("transfer:"+transfer.id);
 info("Designentwurf eingefügt. Andere Elemente rücken automatisch. Kein Live-Push.");
}
function showTransfer(){
 if(!first())return info("Zuerst ein Element markieren.");
 const n=$("transferPanel");$("transferName").textContent=describe(first());
 $("transferTarget").value=activePage==="test"?"visitor":"test";
 n.hidden=false;
}
function switchPage(to){
 if(!sourceUrls[to]||to===activePage)return;
 save();pages[activePage]=state;
 activePage=to;state=pages[to]||blank();pages[to]=state;
 history=[];redo=[];selected=[];
 for(const b of document.querySelectorAll("[data-page]"))b.classList.toggle("active",b.dataset.page===to);
 const target=$("pageTabs");target.setAttribute("data-current",to);
 $("applyLocal").disabled=to!=="test";
 $("applyLocal").title=to!=="test"?"Nur die Test-App erlaubt lokale Übernahme.":"Lokale Test-App Vorschau";
 $("selectedName").textContent="Wähle einen Bereich";
 $("selectedPath").textContent="Arbeitsfläche: "+sourceNames[to];
 $("selectionInfo").textContent="Nicht ausgewählt";
 $("transferPanel").hidden=true;
 rebuildFrame();syncCompare();
 info(sourceNames[to]+" geöffnet. Alle Änderungen bleiben ein privater Entwurf.");
}
function syncCompare(){
 const other=$("comparePage").value;
 if($("comparison").hidden)return;
 const src=sourceUrls[other];
 $("compareFrame").src=src+(src.includes("?")?"&":"?")+"compare=readonly&x="+Date.now()+(other==="html"?"":"#home");
}
function execCommand(){
 const cmd=$("layoutCommand").value.trim();if(!cmd)return;
 if(/^kopier/i.test(cmd)){
  const match=cmd.match(/(?:nach|zu)\s+(test|html|besucher|visitor)/i);
  copySelection(match?(match[1].toLowerCase()==="besucher"?"visitor":match[1].toLowerCase()):null);return;
 }
 if(/lücke.*schließ|abstand.*null/i.test(cmd)){collapse();return;}
 if(/^(?:zoom|ansicht)\s+(\d+)\s*%?$/i.test(cmd)){
  const n=limit(Number(RegExp.$1),25,250);$("zoom").value=n;resizeViewport();return;
 }
 if(!first())return info("Zuerst ein Element wählen.");
 let match;
 if(match=cmd.match(/^(?:schrift|textgröße|schriftgröße)\s+(\d+)/i)){
  alter(()=>{variantFor(first()).fontSize=limit(Number(match[1]),8,110)});return;
 }
 if(match=cmd.match(/^(?:rechts|links|oben|unten|nach\s+(?:rechts|links|oben|unten))\s+(\d+)/i)){
  const dir=match[0].toLowerCase().match(/rechts|links|oben|unten/)[0],dist=Number(match[1]);
  alter(()=>{const d=variantFor(first());
   if(dir==="rechts")d.x=(Number(d.x)||0)+dist;
   if(dir==="links")d.x=(Number(d.x)||0)-dist;
   if(dir==="oben")d.y=(Number(d.y)||0)-dist;
   if(dir==="unten")d.y=(Number(d.y)||0)+dist;
  });return;
 }
 if(/^text\s*:/i.test(cmd)){
  const el=byPath(first());if(!el||withinLiveData(el))return info("Live-Daten sind vor Textüberschreibungen geschützt.");
  alter(()=>{variantFor(first()).text=cmd.replace(/^text\s*:/i,"").trim()});return;
 }
 info("Unterstützt: Schrift 28, rechts 20, links 10, oben 12, unten 5, Lücke schließen, Zoom 150, Text: …, Kopiere nach Test/HTML/Besucher.");
}

function paint(){
 if(!doc||!doc.body)return;
 try{
  applyFragments();applyTransfers();applyMoves();applyImages();
  for(const key of Object.keys(state.items)){let el=byPath(key);if(el)applyTo(el,currentItem(key));}
  doc.documentElement.classList.add("dar-ve-active");
 }catch(e){info("Teil der Gestaltung konnte nicht angezeigt werden: "+e.message)}
}
function styleOverlay(){
 let style=doc.getElementById("darVeStudioCss");
 if(style)return;
 style=doc.createElement("style");style.id="darVeStudioCss";
 style.textContent="[data-ve-image-id]{user-select:none!important;touch-action:none!important}[data-ve-fragment-id]{display:inline-block!important}[data-ve-studio-outline]{outline:2px dashed #b89152!important;outline-offset:3px!important;position:fixed!important;z-index:2147483500!important;pointer-events:none!important;border-radius:3px!important;background:none!important}[data-ve-studio-handle]{width:19px!important;height:19px!important;background:#d6b981!important;border:2px solid #112226!important;border-radius:5px!important;position:fixed!important;z-index:2147483590!important;touch-action:none!important;cursor:nwse-resize!important;box-shadow:0 2px 9px #0005!important}[data-ve-lasso]{position:fixed!important;pointer-events:none!important;border:2px dashed #ba9b5c!important;background:rgba(186,155,92,.18)!important;z-index:2147483591!important}";
 doc.head.appendChild(style);
}
function removeMarkers(){
 for(const el of doc?.querySelectorAll("[data-ve-studio-outline],[data-ve-studio-handle],[data-ve-lasso]")||[])el.remove();
 drawHandles=[];
 outline=null;handle=null;lasso=null;
}
function redraw(){
 if(!doc||!doc.body)return;
 removeMarkers();drawHandles=[];
 if(!selected.length||mode==="app")return;
 const rects=selected.map(byPath).filter(Boolean).map(x=>x.getBoundingClientRect()).filter(r=>r.width&&r.height);
 if(!rects.length)return;
 const r={left:Math.min(...rects.map(x=>x.left)),top:Math.min(...rects.map(x=>x.top)),right:Math.max(...rects.map(x=>x.right)),bottom:Math.max(...rects.map(x=>x.bottom))};
 outline=doc.createElement("div");outline.dataset.veStudioOutline="";
 for(const [key,value] of Object.entries({left:r.left,top:r.top,width:r.right-r.left,height:r.bottom-r.top}))outline.style[key]=value+"px";
 doc.body.appendChild(outline);
 if(selected.length!==1||!(mode==="move"||mode==="select"))return;
 const anchors={nw:[r.left,r.top],n:[(r.left+r.right)/2,r.top],ne:[r.right,r.top],
  e:[r.right,(r.top+r.bottom)/2],se:[r.right,r.bottom],s:[(r.left+r.right)/2,r.bottom],
  sw:[r.left,r.bottom],w:[r.left,(r.top+r.bottom)/2]};
 for(const [side,xy] of Object.entries(anchors)){
  const grip=doc.createElement("div");
  grip.dataset.veStudioHandle=side;grip.title="Größe verändern: "+side;
  grip.style.left=(xy[0]-10)+"px";grip.style.top=(xy[1]-10)+"px";
  doc.body.appendChild(grip);grip.addEventListener("pointerdown",handleResizeStart,true);
  drawHandles.push(grip);
 }
}
function dynamicName(path){return path.startsWith("image:")||path.startsWith("fragment:")}
function captureKey(node){
 if(!node||!node.closest)return null;
 const media=node.closest("[data-ve-image-id],[data-ve-fragment-id],[data-ve-transfer-id]");
 if(media)return pathFor(media);
 const blocked=node.closest("[data-ve-studio-outline],[data-ve-studio-handle],[data-ve-lasso]");
 if(blocked)return null;
 if(node.matches("svg,path,button,i,em,span,strong,b,p,small,h1,h2,h3,h4,label,img,a")||node.childElementCount<5){
  let el=node;
  if(el.tagName==="SVG"||el.tagName==="PATH")el=el.closest("button")||el.parentElement;
  return pathFor(el);
 }
 return pathFor(node);
}
function coords(e){return {x:e.clientX,y:e.clientY}}
function snap(n){return $("snap").checked?Math.round(n/8)*8:Math.round(n)}
function pointerStart(e){
 if(mode==="app")return;
 if(mode==="area"){
  e.preventDefault();e.stopPropagation();const v=coords(e);
  gesture={type:"area",start:v,end:v,pointer:e.pointerId};
  lasso=doc.createElement("div");lasso.dataset.veLasso="";doc.body.appendChild(lasso);
  resizeLasso();return;
 }
 if(mode==="word"){e.stopImmediatePropagation();return;}
 if(e.target.closest&&e.target.closest("[data-ve-studio-handle]"))return;
 const key=captureKey(e.target);
 if(!key)return;
 if(e.pointerType!=="touch"||mode==="move"||mode==="reflow")e.preventDefault();
 e.stopImmediatePropagation();
 if(mode==="select"){
  choose(key,e.shiftKey);
  longPoint={x:e.clientX,y:e.clientY};
  clearTimeout(longPress);
  longPress=setTimeout(()=>{showTransfer();longPress=null},650);
  return
 }
 if(mode==="reflow"){
  if(!selected.includes(key))choose(key);
  gesture={type:"reflow",key,start:coords(e),pointer:e.pointerId};
  try{e.target.setPointerCapture(e.pointerId)}catch(_){}
  return;
 }
 if(mode==="move"){
  if(!selected.includes(key))choose(key);
  const d=variantFor(key),start=coords(e);
  snapshot();
  gesture={type:"move",key,start,prev:{x:Number(d.x)||0,y:Number(d.y)||0},pointer:e.pointerId};
  try{e.target.setPointerCapture(e.pointerId)}catch(_){}
 }
}
function handleResizeStart(e){
 if(!selected.length)return;
 const key=first(),el=byPath(key);if(!el)return;
 e.preventDefault();e.stopImmediatePropagation();
 snapshot("Größe · "+describe(key));
 const r=el.getBoundingClientRect(),parent=el.parentElement||el;
 const pr=parent.getBoundingClientRect(),isImage=el.tagName==="IMG";
 const d=variantFor(key),side=e.currentTarget.dataset.veStudioHandle||"se";
 const intrinsicWidth=isImage?(el.naturalWidth||r.width):Infinity;
 const pixelRatio=Math.max(1,Math.min(3,frame.contentWindow.devicePixelRatio||1));
 const safeMax=isImage?limit(intrinsicWidth/Math.max(1,pr.width)/pixelRatio*100,12,150):150;
 gesture={type:"resize",key,side,isImage,start:coords(e),pointer:e.pointerId,
  px:r.width,py:r.height,ratio:r.height/Math.max(1,r.width),pw:Math.max(1,pr.width),
  startX:Number(d.x)||0,startY:Number(d.y)||0,
  baseWidth:Number(d.width)||r.width/Math.max(1,pr.width)*100,
  baseHeight:Number(d.height)||r.height,maxWidth:safeMax};
 try{doc.documentElement.setPointerCapture(e.pointerId)}catch(_){}
}
function resizeLasso(){
 if(!gesture||gesture.type!=="area"||!lasso)return;
 const {start,end}=gesture;
 lasso.style.left=Math.min(start.x,end.x)+"px";
 lasso.style.top=Math.min(start.y,end.y)+"px";
 lasso.style.width=Math.abs(start.x-end.x)+"px";
 lasso.style.height=Math.abs(start.y-end.y)+"px";
}
function pointerMove(e){
 if(longPress&&longPoint&&Math.hypot(e.clientX-longPoint.x,e.clientY-longPoint.y)>10){clearTimeout(longPress);longPress=null}
 if(!gesture||gesture.pointer!==e.pointerId)return;
 e.preventDefault();
 const v=coords(e);
 if(gesture.type==="area"){gesture.end=v;resizeLasso();return}
 if(gesture.type==="reflow"){return}
 const {key,start}=gesture,d=variantFor(key);
 if(gesture.type==="move"){
  d.x=limit(snap(gesture.prev.x+v.x-start.x),-450,450);
  d.y=limit(snap(gesture.prev.y+v.y-start.y),-600,600);
 }else if(gesture.type==="resize"){
  const horizontal=gesture.side.includes("e")?1:gesture.side.includes("w")?-1:0;
  const vertical=gesture.side.includes("s")?1:gesture.side.includes("n")?-1:0;
  const changeX=horizontal*(v.x-start.x),changeY=vertical*(v.y-start.y);
  let pixels=gesture.px+changeX;
  if(gesture.isImage&&horizontal===0) pixels=gesture.px+changeY/Math.max(.01,gesture.ratio);
  const width=limit(pixels/gesture.pw*100,12,gesture.maxWidth);
  const realWidth=width*gesture.pw/100;
  d.width=Math.round(width*10)/10;
  if(gesture.isImage){delete d.height;}
  else if(vertical)d.height=limit(snap(gesture.py+changeY),8,700);
  if(horizontal<0)d.x=gesture.startX+(gesture.px-realWidth);
  if(vertical<0){
   d.y=gesture.startY+(gesture.py-(gesture.isImage?realWidth*gesture.ratio:Number(d.height)||gesture.py));
  }
 }
 paint();redraw();updateSliderVals();
}
function pointerEnd(e){
 if(longPress){clearTimeout(longPress);longPress=null}
 if(!gesture||gesture.pointer!==e.pointerId)return;
 if(gesture.type==="reflow"){
  const src=byPath(gesture.key);
  const hit=doc.elementFromPoint(e.clientX,e.clientY);
  const target=hit&&flowAnchor(hit);
  const safe=target&&src&&target!==src&&!target.contains(src)&&!src.contains(target)&&target!==doc.body;
  if(safe){
   const key=pathFor(target);
   if(key){
    const r=target.getBoundingClientRect();
    const where=e.clientY>r.top+r.height/2?"after":"before";
    const source=gesture.key;
    alter(()=>{state.moves=state.moves||[];state.moves=state.moves.filter(m=>m.source!==source);state.moves.push({source,anchor:key,where})});
    info("Abschnitt im Seitenfluss umgeordnet. Folgende Bereiche rücken automatisch.");
   }
  }else info("Kein gültiger Zielbereich. Bitte ober- oder unterhalb eines anderen Abschnitts ablegen.");
  gesture=null;redraw();return;
 }
 if(gesture.type==="area"){
  const a=gesture.start,b=gesture.end,minX=Math.min(a.x,b.x),minY=Math.min(a.y,b.y),maxX=Math.max(a.x,b.x),maxY=Math.max(a.y,b.y);
  const selectors=[".home-v380-section",".dv3-section",".dv3-quick",".dv3-post",".dar-v47-welcome",".dt-isnad",".home-line-row",".dt-access-item","#headerPrayerStatus",".brand-main",".dv3-tawhid"];
  const found=[];
  for(const q of selectors){for(const el of doc.querySelectorAll(q)){
   let r=el.getBoundingClientRect();
   const ix=Math.max(0,Math.min(maxX,r.right)-Math.max(minX,r.left));
   const iy=Math.max(0,Math.min(maxY,r.bottom)-Math.max(minY,r.top));
   if(r.width&&r.height&&ix*iy/r.width/r.height>.23){
    const path=pathFor(el);if(path&&!found.includes(path))found.push(path);
   }
  }}
  if(found.length){selected=found.slice(0,14);$("selectedName").textContent=selected.length+" Flächen";info(selected.length+" Flächen markiert. „Fläche entfernen“ gibt ihren Platz frei.");refreshControls();renderLayers()}
  else info("Keine Fläche im markierten Rechteck gefunden. Versuche einen größeren Ausschnitt.");
 }
 gesture=null;paint();redraw();scheduleSave();
}
function onTextSelect(e){
 if(mode!=="word")return;
 const sel=frame.contentWindow.getSelection();lastSelectedText=sel?sel.toString().trim():"";
 if(lastSelectedText)info("Text gewählt: „"+lastSelectedText.slice(0,45)+"“. Jetzt „Wort als eigene Ebene“ tippen.");
}
function fragmentFromSelection(){
 if(!doc)return info("Test-App noch nicht geladen.");
 const selection=frame.contentWindow.getSelection();
 if(!selection||selection.rangeCount===0||selection.isCollapsed)return info("Zuerst im Wortmodus ein Wort in der Vorschau markieren.");
 const range=selection.getRangeAt(0),txt=selection.toString().trim();
 if(!txt||txt.length>120)return info("Bitte ein Wort oder einen kurzen Satz bis 120 Zeichen markieren.");
 if(range.startContainer!==range.endContainer||range.startContainer.nodeType!==3)return info("Bitte Text innerhalb einer einzelnen Textzeile markieren.");
 let parent=range.startContainer.parentElement;
 if(withinLiveData(parent))return info("Live-Daten dürfen nicht in Wort-Ebenen umgewandelt werden.");
 const parentPath=pathFor(parent);
 const id="w"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 snapshot();
 const sp=doc.createElement("span");sp.dataset.veFragmentId=id;sp.style.display="inline-block";sp.style.position="relative";
 try{range.surroundContents(sp)}catch(e){return info("Markierung kann hier nicht getrennt werden.")}
 state.fragments.push({id,parent:parentPath,text:txt});
 selection.removeAllRanges();
 choose("fragment:"+id);scheduleSave();
 setTab("text");info("Wort oder Satz ist eine eigene bewegliche Ebene.");
}
function updateSliderVals(){
 const data=currentItem(first());
 for(const k of ["bgScale","bgX","bgY"]){
  const value=k==="bgScale"?(data.bgScale??100):k==="bgX"?(data.bgX??50):(data.bgY??50);
  $(k).value=Number(value);$(k+"Out").textContent=value+"%";
 }
 $("pinBackground").checked=!!data.pinnedBackground;
 if(data.imageFit)$("imageFit").value=data.imageFit;
 for(const input of document.querySelectorAll("[data-prop]")){
  const k=input.dataset.prop,v=data[k];
  if(input.type==="range"){
   let x=v===undefined?{fontSize:24,lineHeight:1.2,letterSpacing:0,x:0,y:0,width:100,height:0,marginTop:0,marginBottom:0,padding:0,radius:0,opacity:1}[k]:v;
   if(x!==undefined){input.value=x;let out=document.querySelector('[data-value="'+k+'"]');if(out)out.textContent=String(fmt(x))+(k==="lineHeight"?"×":k==="opacity"?"":k==="width"?"%":" px")}
  }else if(input.tagName==="SELECT"){input.value=v===undefined?"":v;}
 }
}
function refreshControls(){
 updateSliderVals();
 const sel=first(),el=byPath(sel);
 if(el)$("textValue").value=currentItem(sel).text??(el.innerText||el.textContent||"").trim().slice(0,4000);
 else $("textValue").value="";
 $("textValue").disabled=!el||withinLiveData(el);
 $("applyText").disabled=$("textValue").disabled;
}
function renderLayers(){
 const filter=$("layerFilter").value.toLowerCase();
 const rows=[];
 for(const p of presets){if(byPath(p[2]))rows.push([p[2],p[1]])}
 for(const key of Object.keys(state.items)){if(byPath(key)&&!rows.some(r=>r[0]===key))rows.push([key,describe(key)])}
 for(const image of state.images){let key="image:"+image.id;if(byPath(key)&&!rows.some(r=>r[0]===key))rows.push([key,describe(key)])}
 for(const f of state.fragments){let key="fragment:"+f.id;if(byPath(key)&&!rows.some(r=>r[0]===key))rows.push([key,describe(key)])}
 for(const t of state.transfers||[]){let key="transfer:"+t.id;if(byPath(key)&&!rows.some(r=>r[0]===key))rows.push([key,"Übernahme: "+(t.snapshot.label||"Bereich")])}
 const area=$("layerList");area.replaceChildren();
 for(const [k,name]of rows){
  if(filter&&!name.toLowerCase().includes(filter))continue;
  const row=document.createElement("div");row.className="layer"+(selected.includes(k)?" active":"");row.setAttribute("role","listitem");
  const eye=document.createElement("button");eye.className="eye";eye.textContent=state.items[k]?.hidden?"⊘":"◉";eye.title="Sichtbarkeit umschalten";
  eye.addEventListener("click",()=>alter(()=>{itemFor(k).hidden=!itemFor(k).hidden},{reset:true}));
  const btn=document.createElement("button");btn.className="name";btn.textContent=name;btn.title=k;btn.addEventListener("click",()=>{choose(k);setTab("layout")});
  const select=document.createElement("button");select.textContent="◇";select.title="Auswählen";select.addEventListener("click",()=>choose(k));
  row.append(eye,btn,select);area.append(row);
 }
}
function resizeViewport(){
 deviceWidth=Number($("customWidth").value)||Number($("device").value)||393;zoom=Number($("zoom").value)/100;
 viewportHeight=Number($("customHeight").value)||Number($("viewHeight").value)||950;
 $("zoomOut").textContent=Math.round(zoom*100)+"%";
 $("heightOut").textContent=viewportHeight+" px";
 const w=$("deviceWrap"),b=$("deviceBox");
 w.style.width=(deviceWidth*zoom)+"px";w.style.height=((viewportHeight+25)*zoom)+"px";
 b.style.width=deviceWidth+"px";b.style.height=(viewportHeight+25)+"px";
 b.style.transform="scale("+zoom+")";
 frame.style.height=viewportHeight+"px";
 $("viewHeight").value=limit(viewportHeight,450,2200);
 $("canvasScroll").dataset.placement=$("placement").value;
 $("deviceWrap").style.translate=paneShift.x+"px "+paneShift.y+"px";
 const comp=$("comparison");if(!comp.hidden)$("compareFrame").style.height=Math.max(440,Math.min(950,viewportHeight*zoom))+"px";
 if(doc){paint();redraw();updateSliderVals();}
}
function setMode(next){
 gesture=null;mode=next;
 $("editIndicator").textContent=next==="app"?"Bedienen aktiv · App-Funktionen freigegeben":"Bearbeiten aktiv · App-Schaltflächen gesperrt";
 $("editIndicator").classList.toggle("is-live",next==="app");
 if(doc)doc.documentElement.setAttribute("data-ve-mode",next);for(const x of document.querySelectorAll("[data-mode]"))x.classList.toggle("active",x.dataset.mode===next);
 if(doc)doc.documentElement.style.cursor=next==="area"?"crosshair":next==="move"?"grab":next==="word"?"text":"";
 if(next==="app")info("App-Bedienmodus: Links, Suche und Scrollen stehen zur Verfügung.");
 else if(next==="reflow")info("Umordnen: Abschnitt gedrückt halten und vor oder hinter einen anderen Abschnitt ziehen.");
 else if(next==="word")info("Ein Wort oder einen Satz mit dem Finger oder Pencil markieren.");
 else if(next==="area")info("Finger oder Pencil über die Fläche ziehen, um Bereiche zu markieren.");
 else info("Werkzeug „"+next+"“ aktiv.");
 redraw();
}
function setTab(t){tab=t;
 for(const x of document.querySelectorAll("[data-tab]"))x.classList.toggle("active",x.dataset.tab===t);
 for(const x of document.querySelectorAll("[data-panel]"))x.classList.toggle("active",x.dataset.panel===t);
}
function applyTheme(){
 if(!doc)return;
 const theme=getTheme();
 const root=doc.documentElement;
 root.setAttribute("data-theme",theme==="salbei"?"light":theme);
 if(theme==="salbei")root.setAttribute("data-theme-variant","salbei");else root.removeAttribute("data-theme-variant");
}
function frameLoaded(){
 try{
  if(!frame.contentDocument||frame.contentDocument.location.origin!==location.origin)throw Error("domain mismatch");
  doc=frame.contentDocument;
  if(!doc.body)throw Error("missing body");
  cleanStyles.clear();cleanText.clear();originalMoves.clear();nodeKeys.clear();
  styleOverlay();paint();
  doc.documentElement.setAttribute("data-ve-mode",mode);
  frame.contentWindow.addEventListener("click",function(e){
   if(mode==="app")return;
   e.preventDefault();e.stopImmediatePropagation();
  },true);
  doc.addEventListener("click",function(e){
   if(mode==="app")return;
   e.preventDefault();e.stopImmediatePropagation();
  },true);
  doc.addEventListener("keydown",function(e){
   if(mode==="app")return;
   if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  frame.contentWindow.addEventListener("submit",function(e){
   if(mode==="app")return;
   e.preventDefault();e.stopImmediatePropagation();
  },true);
  doc.addEventListener("submit",function(e){
   if(mode==="app")return;
   e.preventDefault();e.stopImmediatePropagation();
  },true);
  doc.addEventListener("pointerdown",pointerStart,true);
  doc.addEventListener("pointermove",pointerMove,true);
  doc.addEventListener("pointerup",pointerEnd,true);
  doc.addEventListener("pointercancel",pointerEnd,true);
  doc.addEventListener("selectionchange",onTextSelect);
  doc.addEventListener("scroll",redraw,true);
  frame.contentWindow.addEventListener("scroll",redraw,{passive:true});
  let busy=false;
  new MutationObserver(mutations=>{
   const own=n=>n&&n.nodeType===1&&n.matches("[data-ve-studio-outline],[data-ve-studio-handle],[data-ve-lasso]");
   if(mutations.every(m=>[...m.addedNodes,...m.removedNodes].every(own)))return;
   if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;paint();redraw()});
  }).observe(doc.body,{subtree:false,childList:true});
  setTimeout(()=>{paint();applyTheme();choose(first()||defaultTarget());},350);
  setTimeout(()=>{paint();applyTheme();redraw();renderLayers()},1700);
  setTimeout(()=>{paint();redraw()},3400);
  editorLoaded=true;info(sourceNames[activePage]+" geladen. Änderungen gelten ausschließlich für den Entwurf.");
 }catch(e){doc=null;info("Test-App konnte nicht als Vorschau geladen werden. Bitte den Editor direkt auf dar-al-tawhid.de in Safari öffnen.");}
}
function rebuildFrame(){
 doc=null;outline=null;handle=null;lasso=null;
 const src=sourceUrls[activePage];
 frame.src=src+(src.includes("?")?"&":"?")+"refresh="+Date.now()+(activePage==="html"?"":"#home");
 $("activePageLabel").textContent=sourceNames[activePage];
}
function undoAction(){if(!history.length)return;jumpTo(history.length-1)}
function redoAction(){if(!redo.length)return;jumpTo(history.length+1)}
function hide(flag){if(!selected.length)return info("Zuerst einen Bereich wählen.");
 alter(()=>{for(const key of selected)variantFor(key).hidden=flag},{reset:true});
 info(flag?"Bereich ausgeblendet · ohne Neuladen, freier Platz geschlossen.":"Bereich direkt wieder eingeblendet.");
}
function collapse(){
 if(!selected.length)return info("Zuerst Bereich wählen.");
 alter(()=>{for(const key of selected){const d=variantFor(key);d.marginTop=0;d.marginBottom=0;d.padding=0;}});
 info("Abstände im gewählten Bereich auf 0 gesetzt.");
}
function shorten(n){
 if(!first())return;
 alter(()=>{const el=byPath(first()),d=variantFor(first());const h=el?.getBoundingClientRect().height||100;
  d.height=limit((Number(d.height)||h)+n,0,700);
 });
}
function resetChosen(){
 if(!selected.length)return;
 alter(()=>{for(const key of selected){delete state.items[key];
  if(key.startsWith("image:"))state.images=state.images.filter(x=>"image:"+x.id!==key);
  if(key.startsWith("fragment:"))state.fragments=state.fragments.filter(x=>"fragment:"+x.id!==key);
  if(key.startsWith("transfer:"))state.transfers=state.transfers.filter(x=>"transfer:"+x.id!==key);
 }},{reset:true});info("Ausgewähltes Element zurückgesetzt.");
}
function selectRelative(kind){
 const el=byPath(first());if(!el)return;
 let n=kind==="parent"?el.parentElement:kind==="child"?el.firstElementChild:
 kind==="prev"?el.previousElementSibling:el.nextElementSibling;
 if(n&&n!==doc.body&&n!==doc.documentElement){const k=pathFor(n);if(k)choose(k)}
}
function changeLayer(delta){
 if(!first())return;
 alter(()=>{const data=variantFor(first());data.zIndex=limit((Number(data.zIndex)||1)+delta,-9,999)});
}
function inputProp(input){
 if(!first())return;
 const key=input.dataset.prop;
 const val=input.type==="range"?Number(input.value):input.value;
 let data=variantFor(first());data[key]=val;paint();redraw();updateSliderVals();
}
function safeImageUrl(text){
 if(typeof text!=="string")return "";
 const s=text.trim();
 if(s.startsWith("data:image/jpeg;base64,")||s.startsWith("data:image/png;base64,")||s.startsWith("data:image/webp;base64,"))return s;
 try{const url=new URL(s,location.origin);if(url.protocol==="https:"&&url.href.length<2100)return url.href}catch(e){}
 return "";
}
async function localImage(file){
 if(!file||!file.type.startsWith("image/"))throw Error("Bitte eine Bilddatei auswählen.");
 if(file.size>15*1024*1024)throw Error("Maximal 15 MB Quelldatei.");
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await img.decode();
  // Never upscale original pixels; keep up to 2304 px for crisp tablet/retina previews.
  const s=Math.min(1,2304/Math.max(img.width,img.height));const c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(img.width*s));c.height=Math.max(1,Math.round(img.height*s));
  const ctx=c.getContext("2d");if(!ctx)throw Error("Bildverarbeitung fehlt");
  ctx.drawImage(img,0,0,c.width,c.height);
  const data=c.toDataURL("image/webp",.9);
  if(data.length>2600000)throw Error("Bild zu groß für den lokalen Entwurf. Bitte kleinere Datei wählen.");
  return data;
 }finally{URL.revokeObjectURL(url)}
}
function insertImage(asBackground){
 let src=safeImageUrl(imageCandidate||$("imageUrl").value);
 if(!src)return info("Bitte zuerst ein Bild wählen oder eine HTTPS-Adresse eintragen.");
 let key=first(),el=byPath(key);
 if(!el)return info("Bitte zuerst den Zielbereich in der App markieren.");
 if(asBackground){
  alter(()=>{
   const d=variantFor(key);d.backgroundImage=src;d.imageFit=$("imageFit").value;
   d.bgScale=Number($("bgScale").value)||100;
   d.bgX=Number($("bgX").value)||50;d.bgY=Number($("bgY").value)||50;
   d.pinnedBackground=$("pinBackground").checked;
  });
  setTab("images");
  info("Bild als Hintergrund eingebettet: Fläche und Bildausschnitt lassen sich getrennt ändern.");return;
 }
 const host=el.closest(".dv3-section,.home-v380-section,.dar-v47-welcome,.dt-isnad,.dv3-home")||el.parentElement;
 if(!host)return info("Für diesen Bereich kann keine Bildebene angelegt werden.");
 const anchor=pathFor(host),id="i"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 alter(()=>{state.images.push({id,anchor,src,opacity:imgOpacity});state.items["image:"+id]={x:0,y:0,width:30,zIndex:12}});
 choose("image:"+id);setMode("move");setTab("layout");
 info("Neue Bildebene eingebettet. Mit dem Finger ziehen und am Griff skalieren.");
}
function removeImage(){
 if(!first())return;
 alter(()=>{const d=variantFor(first());delete d.backgroundImage;delete d.imageFit;delete d.bgScale;delete d.bgX;delete d.bgY;delete d.pinnedBackground;
  if(first().startsWith("image:")){state.images=state.images.filter(x=>x.id!==first().slice(6));delete state.items[first()]}}
 ,{reset:true});info("Bild aus dem Entwurf entfernt.");
}
function download(obj,file){
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportPart(review){
 if(!first())return info("Wähle zuerst einen Bereich.");
 const key=first(),payload={format:"dar-test-layout-section-v2",version:2,sourcePage:activePage,targetPage:activePage,target:key,
  label:describe(key),item:state.items[key]||{},
  fragments:state.fragments.filter(f=>key==="fragment:"+f.id||f.parent===key),
  images:state.images.filter(i=>key==="image:"+i.id||i.anchor===key),
  transfers:(state.transfers||[]).filter(x=>key==="transfer:"+x.id||x.anchor===key),
  moves:(state.moves||[]).filter(x=>x.source===key||x.anchor===key),
  destination:activePage,status:"DRAFT_REVIEW_REQUIRED",requiresAuthenticatedDeployment:true,
  capturedAt:new Date().toISOString()};
 download(payload,review?"dar-test-bereich-freigabe.json":"dar-test-bereich-entwurf.json");
 info(review?"Freigabe-Paket erstellt. Es verändert die Test-App noch nicht.":"Einzelner Bereich exportiert.");
}
function importDraft(data){
 if(!data||!["dar-test-layout-v2","dar-test-layout-section-v2"].includes(data.format)||data.version!==2)throw Error("Kein gültiger Studio-V2-Entwurf.");
 snapshot();
 if(data.format==="dar-test-layout-v2"){
  if(!data.items||typeof data.items!=="object")throw Error("Elemente fehlen");
  state={format:"dar-test-layout-v2",version:2,items:{},fragments:[],images:[],lastSaved:Date.now()};
  for(const [k,v] of Object.entries(data.items).slice(0,350)){
   if(k.length<800&&v&&typeof v==="object"&&!Array.isArray(v))state.items[k]=v;
  }
  state.fragments=Array.isArray(data.fragments)?data.fragments.slice(0,80):[];
  state.images=Array.isArray(data.images)?data.images.slice(0,30):[];
 }else{
  if(typeof data.target!=="string"||!data.item||typeof data.item!=="object")throw Error("Bereich ungültig");
  state.items[data.target]=data.item;
  state.fragments.push(...(Array.isArray(data.fragments)?data.fragments.slice(0,8):[]));
  state.images.push(...(Array.isArray(data.images)?data.images.slice(0,3):[]));
 }
 save();reconcile();historyUI();info("Entwurf importiert · Vorschau bleibt geöffnet.");
}
function readPoints(){
 try{const v=JSON.parse(localStorage.getItem("dar_studio_v4_checkpoints")||"[]");return Array.isArray(v)?v:[]}catch(_){return []}
}
function writePoints(v){try{localStorage.setItem("dar_studio_v4_checkpoints",JSON.stringify(v))}catch(_){info("Speicher voll – Zwischenstand bitte als JSON exportieren.")}}
function updatePoints(){
 const el=$("checkpointList");el.replaceChildren();
 const base=document.createElement("option");base.value="";base.textContent="Zwischenstand wählen";el.append(base);
 for(const [i,p] of readPoints().entries()){
  const opt=document.createElement("option");opt.value=String(i);opt.textContent=p.page+" · "+p.name+" · "+new Date(p.date).toLocaleDateString("de-DE");el.append(opt);
 }
}
function on(key,fn){$(key).addEventListener("click",fn)}
function init(){
 restore();
 frame.addEventListener("load",frameLoaded);
 const ts=document.querySelectorAll("[data-tab]");ts.forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
 document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
 $("device").addEventListener("change",()=>{$("customWidth").value=$("device").value;resizeViewport()});
 $("customWidth").addEventListener("input",resizeViewport);
 $("customHeight").addEventListener("input",resizeViewport);
 $("viewHeight").addEventListener("input",()=>{$("customHeight").value=$("viewHeight").value;resizeViewport()});
 $("zoom").addEventListener("input",resizeViewport);
 $("zoomUp").addEventListener("click",()=>{$("zoom").value=limit(Number($("zoom").value)+10,25,250);resizeViewport()});
 $("zoomDown").addEventListener("click",()=>{$("zoom").value=limit(Number($("zoom").value)-10,25,250);resizeViewport()});
 $("zoomFit").addEventListener("click",()=>{
  const pane=$("canvasScroll"),ratio=(pane.clientWidth-42)/(Number($("customWidth").value)||393);
  $("zoom").value=limit(Math.floor(Math.min(1,ratio)*100/5)*5,25,250);resizeViewport();
  info("Ansicht an Arbeitsfläche angepasst.");
 });
 $("orientation").addEventListener("click",()=>{
  const w=Number($("customWidth").value),h=Number($("customHeight").value);
  $("customWidth").value=limit(h,240,2560);$("customHeight").value=limit(w,320,3500);
  resizeViewport();info("Hoch-/Querformat gewechselt.");
 });
 $("placement").addEventListener("change",()=>{if($("placement").value!=="free")paneShift={x:0,y:0};resizeViewport()});
 document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));
 $("focusStage").addEventListener("click",()=>{
  const active=$("studio").classList.toggle("focus");
  $("focusStage").textContent=active?"Werkzeuge":"Fokus";
  resizeViewport();
 });
 $("toggleCompare").addEventListener("click",()=>{
  const comp=$("comparison");comp.hidden=!comp.hidden;
  $("canvasScroll").classList.toggle("is-comparing",!comp.hidden);
  $("toggleCompare").textContent=comp.hidden?"Vergleich":"Vergleich aus";
  syncCompare();resizeViewport();
 });
 $("comparePage").addEventListener("change",syncCompare);
 let paneGesture=null;
 $("deviceBox").querySelector(".device-bar").addEventListener("pointerdown",e=>{
  if($("placement").value!=="free")return;
  paneGesture={id:e.pointerId,x:e.clientX,y:e.clientY,prev:{...paneShift}};
  try{doc.documentElement.setPointerCapture(e.pointerId)}catch(_){}
 });
 $("deviceBox").querySelector(".device-bar").addEventListener("pointermove",e=>{
  if(!paneGesture||paneGesture.id!==e.pointerId)return;
  paneShift.x=paneGesture.prev.x+e.clientX-paneGesture.x;
  paneShift.y=paneGesture.prev.y+e.clientY-paneGesture.y;
  $("deviceWrap").style.translate=paneShift.x+"px "+paneShift.y+"px";
 });
 $("deviceBox").querySelector(".device-bar").addEventListener("pointerup",()=>paneGesture=null);
 $("deviceBox").querySelector(".device-bar").addEventListener("pointercancel",()=>paneGesture=null);
 const touchDistance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 let pinch=null;
 $("canvasScroll").addEventListener("touchstart",e=>{
  if(e.touches.length===2)pinch={distance:touchDistance(e.touches),initial:Number($("zoom").value)};
 },{passive:true});
 $("canvasScroll").addEventListener("touchmove",e=>{
  if(e.touches.length!==2||!pinch)return;
  e.preventDefault();
  $("zoom").value=limit(Math.round(pinch.initial*touchDistance(e.touches)/Math.max(1,pinch.distance)/5)*5,25,250);
  resizeViewport();
 },{passive:false});
 $("canvasScroll").addEventListener("touchend",e=>{if(e.touches.length<2)pinch=null},{passive:true});

 $("theme").addEventListener("change",applyTheme);
 on("reload",rebuildFrame);on("undo",undoAction);on("redo",redoAction);
 $("historyPosition").addEventListener("change",e=>jumpTo(Number(e.target.value)));
 on("savePoint",()=>{
  const label=prompt("Name für diesen Zwischenstand:",describe(first())||"Entwurf");
  if(label===null)return;
  const name=(label.trim()||"Zwischenstand").slice(0,64);
  const values=readPoints();
  values.unshift({name,date:new Date().toISOString(),page:activePage,state:deep(state)});
  writePoints(values.slice(0,10));updatePoints();info("Zwischenstand „"+name+"“ gespeichert.");
 });
 on("restorePoint",()=>{
  const id=Number($("checkpointList").value),points=readPoints();
  if(!Number.isInteger(id)||id<0||id>=points.length)return info("Bitte zuerst einen Zwischenstand auswählen.");
  const p=points[id];if(p.page!==activePage)return info("Bitte zuerst den passenden Seitentab wählen.");
  snapshot("Vor Zwischenstand "+p.name);
  state=deep(p.state);pages[activePage]=state;
  reconcile();scheduleSave();historyUI();info("Zwischenstand „"+p.name+"“ geladen · kein App-Neustart.");
 });

 on("save",save);on("save2",save);

 on("copyElement",()=>copySelection());
 on("pasteBefore",()=>pasteAt("before"));on("pasteAfter",()=>pasteAt("after"));
 on("copyBetween",showTransfer);
 on("cancelTransfer",()=>{$("transferPanel").hidden=true});
 on("copyToTarget",()=>{const target=$("transferTarget").value;copySelection(target);$("transferPanel").hidden=true;});
 on("executeCommand",execCommand);
 $("layoutCommand").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();execCommand()}});
 on("hideSelected",()=>hide(true));on("showSelected",()=>hide(false));on("collapseGap",collapse);
 on("removeSpace",collapse);on("selectParent",()=>selectRelative("parent"));
 on("selectChild",()=>selectRelative("child"));on("selectPrevious",()=>selectRelative("prev"));
 on("selectNext",()=>selectRelative("next"));
 on("createFragment",fragmentFromSelection);
 on("applyText",()=>{const el=byPath(first());if(!el)return;if(withinLiveData(el))return info("Live-Daten bleiben geschützt.");alter(()=>{variantFor(first()).text=$("textValue").value.slice(0,4000)});info("Textänderung als Entwurf gespeichert.")});
 for(const input of document.querySelectorAll("[data-prop]")){
  input.addEventListener("pointerdown",()=>{if(first())snapshot()},{passive:true});
  input.addEventListener("change",()=>{if(!first())return;inputProp(input);scheduleSave()});
  input.addEventListener("input",()=>inputProp(input));
 }
 $("perDevice").addEventListener("change",()=>{updateSliderVals();info($("perDevice").checked?"Anpassungen für "+bucket(deviceWidth)+"-Breiten.":"Anpassungen gelten für alle Formate.");});
 on("zForward",()=>changeLayer(1));on("zBackward",()=>changeLayer(-1));
 on("layerUp",()=>changeLayer(1));on("layerDown",()=>changeLayer(-1));
 on("shrinkSection",()=>shorten(-32));on("expandSection",()=>shorten(32));
 on("autoTheme",()=>{if(!first())return;alter(()=>{let d=variantFor(first());d.color="var(--dt-ink)";d.background="transparent"});info("Theme-Farbwerte gesetzt.")});
 on("removeBackground",()=>{if(!first())return;alter(()=>{let d=variantFor(first());d.background="transparent";delete d.backgroundImage;delete d.pinnedBackground},{reset:true})});
 on("cycleTheme",()=>{const select=$("theme");select.selectedIndex=(select.selectedIndex+1)%select.options.length;applyTheme()});
 $("layerFilter").addEventListener("input",renderLayers);
 on("resetElement",resetChosen);on("resetCurrent",resetChosen);
 on("exportCurrent",()=>exportPart(false));on("exportPart",()=>exportPart(false));on("exportReview",()=>exportPart(true));
 on("exportAll",()=>{pages[activePage]=state;download({format:"dar-multi-surface-design-v3",version:3,pages,capturedAt:new Date().toISOString(),requiresSeparatePublish:true},"dar-tawhid-alle-drei-arbeitsflaechen.json")});
 on("loadDraft",()=>{
  restore();
  for(const b of document.querySelectorAll("[data-page]"))b.classList.toggle("active",b.dataset.page===activePage);
  $("applyLocal").disabled=activePage!=="test";
  rebuildFrame();info("Letzten gespeicherten Entwurf geladen.");
 });
 on("importBtn",()=>$("importFile").click());
 $("importFile").addEventListener("change",async function(){
  try{
   const f=this.files?.[0];if(!f)return;if(f.size>8*1024*1024)throw Error("Datei zu groß");
   const data=JSON.parse(await f.text());
   if(data.format==="dar-multi-surface-design-v3"&&data.version===3&&data.pages){
    snapshot();for(const key of ["test","html","visitor"]){
     const source=data.pages[key];if(source?.version===2&&source.items&&typeof source.items==="object")
      pages[key]={...blank(),...source,transfers:Array.isArray(source.transfers)?source.transfers.slice(0,100):[],moves:Array.isArray(source.moves)?source.moves.slice(0,100):[]};
    }
    state=pages[activePage];save();reconcile();historyUI();info("Alle drei Arbeitsflächen importiert.");
   }else importDraft(data);
  }catch(e){info("Import: "+e.message)}
  this.value="";
 });
 on("resetAll",()=>{if(!confirm("Entwurf der aktuellen Arbeitsfläche zurücksetzen?"))return;
  snapshot();state=blank();pages[activePage]=state;
  save();
  reconcile();historyUI();info("Layout-Entwurf zurückgesetzt · ohne App-Neustart.")});
 $("applyLocal").addEventListener("change",e=>{save();localStorage.setItem(ACTIVE,e.target.checked?"1":"0");localStorage.setItem("dar_visual_studio_local_enabled_v2","0");localStorage.setItem(legacyKey,"0");
  info(e.target.checked?"Nur die Test-App kann lokal auf diesem Gerät übernommen werden. HTML/Besucher bleiben Entwürfe.":"Lokale Test-App-Übernahme deaktiviert.")});
 on("quickBackground",()=>{
  if(!first()||!byPath(first()))return info("Bitte zuerst die Fläche markieren, die ein Hintergrundbild erhalten soll.");
  quickImagePending=true;$("imageFile").click();
 });
 $("imageFile").addEventListener("change",async function(){
  try{
   const f=this.files?.[0];if(!f){quickImagePending=false;return}
   info("Hochwertige Bildvorschau wird für das iPad vorbereitet …");
   imageCandidate=await localImage(f);
   if(quickImagePending){insertImage(true);quickImagePending=false;}
   else info("Bild bereit. Wähle „Bild als Hintergrund“ oder „Bild als Ebene“.");
  }catch(e){quickImagePending=false;info(e.message)}
  this.value="";
 });
 for(const field of ["bgScale","bgX","bgY"]){
  $(field).addEventListener("pointerdown",()=>{if(first())snapshot("Bildausschnitt "+describe(first()))});
  $(field).addEventListener("input",()=>{
   if(!first())return;
   const d=variantFor(first());d[field]=Number($(field).value);
   $(field+"Out").textContent=d[field]+"%";paint();redraw();
  });
  $(field).addEventListener("change",scheduleSave);
 }
 $("pinBackground").addEventListener("change",e=>{
  if(!first())return;
  alter(()=>{variantFor(first()).pinnedBackground=e.target.checked},{reset:true});
  info(e.target.checked?"Bild-Hintergrund bleibt beim Scrollen am oberen Rand; Inhalte laufen darunter.":"Hintergrund folgt wieder normal dem Bereich.");
 });
 $("imageUrl").addEventListener("change",e=>{imageCandidate=safeImageUrl(e.target.value);if(!imageCandidate)info("Nur gültige HTTPS-Bilder erlaubt.")});
 $("imageFit").addEventListener("change",()=>{if(first()&&currentItem(first())?.backgroundImage)alter(()=>{variantFor(first()).imageFit=$("imageFit").value})});
 $("imageOpacity").addEventListener("input",()=>{$("imageOpacityOut").textContent=Math.round(Number($("imageOpacity").value)*100)+"%";imgOpacity=Number($("imageOpacity").value);
  if(first().startsWith("image:")){snapshot("Bild-Deckkraft");variantFor(first()).opacity=imgOpacity;paint();redraw();scheduleSave();}});
 on("imageOverlay",()=>insertImage(false));on("imageBackground",()=>insertImage(true));on("clearImage",removeImage);
 document.addEventListener("keydown",function(e){
  if(e.target.closest("input,select,textarea"))return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()!=="z")return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redoAction():undoAction();return}
  if(e.key==="Escape"){selected=[];redraw();return}
  if((e.key==="Delete"||e.key==="Backspace")&&selected.length){e.preventDefault();hide(true);return}
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)&&first()){e.preventDefault();const step=e.shiftKey?10:1;
   alter(()=>{const d=itemFor(first());if(e.key==="ArrowLeft")d.x=(Number(d.x)||0)-step;if(e.key==="ArrowRight")d.x=(Number(d.x)||0)+step;
    if(e.key==="ArrowUp")d.y=(Number(d.y)||0)-step;if(e.key==="ArrowDown")d.y=(Number(d.y)||0)+step;
   });
  }
 });
 resizeViewport();setTab("select");setMode("select");historyUI();updatePoints();
 for(const button of document.querySelectorAll("[data-page]"))button.classList.toggle("active",button.dataset.page===activePage);
 $("applyLocal").disabled=activePage!=="test";
 $("pageTabs").setAttribute("data-current",activePage);
 rebuildFrame();
 window.addEventListener("beforeunload",()=>{try{pages[activePage]=state;localStorage.setItem(STORAGE,JSON.stringify({version:3,pages,activePage,updated:Date.now()}))}catch(e){}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();