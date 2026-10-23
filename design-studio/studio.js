/* DAR Visual Design Studio V1
   Standalone, local-only visual workspace. Never writes to DAR production files.
   The live inspector changes only its own iframe and exports optional CSS proposals. */
(function () {
  "use strict";

  const STORE = "darVisualStudioV1";
  const DEVICES = [
    {id:"iphone-mini",name:"iPhone · kompakt",w:375,h:812,type:"phone"},
    {id:"iphone-pro",name:"iPhone · Pro",w:402,h:874,type:"phone"},
    {id:"iphone-max",name:"iPhone · Pro Max",w:440,h:956,type:"phone"},
    {id:"android",name:"Android · Smartphone",w:412,h:915,type:"phone"},
    {id:"fold-closed",name:"Galaxy Z Fold · geschlossen",w:402,h:920,type:"phone"},
    {id:"fold-open",name:"Galaxy Z Fold · aufgeklappt",w:884,h:1104,type:"tablet"},
    {id:"ipad-mini",name:"iPad mini",w:744,h:1133,type:"tablet"},
    {id:"ipad-pro",name:"iPad Pro · 13 Zoll",w:1032,h:1376,type:"tablet"},
    {id:"android-tablet",name:"Android Tablet",w:800,h:1280,type:"tablet"},
    {id:"macbook-air",name:"MacBook Air",w:1280,h:832,type:"desktop"},
    {id:"macbook-pro",name:"MacBook Pro",w:1512,h:982,type:"desktop"},
    {id:"desktop",name:"Desktop · 1440",w:1440,h:900,type:"desktop"},
    {id:"tv",name:"Apple TV · 16:9",w:1920,h:1080,type:"desktop"}
  ];
  const COMPONENTS = [
    {kind:"text",name:"Text / Titel",symbol:"T"},
    {kind:"capsule",name:"Kapsel",symbol:"▭"},
    {kind:"button",name:"Schaltfläche",symbol:"◉"},
    {kind:"card",name:"Karte",symbol:"▣"},
    {kind:"line",name:"Trennlinie",symbol:"─"},
    {kind:"badge",name:"Label",symbol:"◇"},
    {kind:"icon",name:"Symbol",symbol:"✦"},
    {kind:"image",name:"Bildfläche",symbol:"▧"},
    {kind:"hero",name:"Hero-Fläche",symbol:"▥"},
    {kind:"arabic",name:"Arabischer Text",symbol:"ع"}
  ];
  const FONT_LIST = ["system-ui","Georgia","Arial","Trebuchet MS","Times New Roman","Tahoma","Amiri, Georgia, serif","Noto Naskh Arabic, Georgia, serif"];
  const PROP_NAMES = ["name","text","x","y","w","h","font","fontSize","weight","align","color","bg","radius","border","opacity","padding"];
  const COLOR_KEYS = ["color","bg"];
  const NUMBER_KEYS = ["x","y","w","h","fontSize","radius","border","opacity","padding"];
  const LIMITS = {x:[0,99],y:[0,4000],w:[1,100],h:[4,4000],fontSize:[6,200],radius:[0,400],border:[0,30],opacity:[0,100],padding:[0,100]};
  const $ = id => document.getElementById(id);
  let project;
  let selectedId = null;
  let currentPage = "home";
  let currentDevice = "iphone-max";
  let rotated = false;
  let currentZoom = 1;
  let currentMode = "canvas";
  let editScope = "global";
  let liveTarget = null;
  let liveSelector = "";
  let editSession = null;
  let history = [];
  let future = [];
  let toastTimer = null;

  function clamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0));}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function randomId(){return "node-" + Math.random().toString(36).slice(2,11);}
  function validColor(c,fallback){return /^#[0-9a-f]{6}$/i.test(String(c))?String(c):fallback;}
  function rgbToHex(s,fallback) {
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    const match=String(s).match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return match?"#"+[match[1],match[2],match[3]].map(v=>clamp(v,0,255).toString(16).padStart(2,"0")).join(""):fallback;
  }
  function toast(message){
    const node=$("toast"); node.textContent=message;node.classList.add("visible");
    window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>node.classList.remove("visible"),3000);
  }
  function make(kind,name,text,x,y,w,h,options){
    const specs={
      text:{bg:"#f3f0e7",color:"#153b2e",fontSize:24,radius:0,padding:0,weight:"700"},
      capsule:{bg:"#194838",color:"#f1d99b",fontSize:16,radius:24,padding:15,weight:"600"},
      button:{bg:"#b69a5c",color:"#182d25",fontSize:16,radius:15,padding:10,weight:"700"},
      card:{bg:"#e3dece",color:"#15382c",fontSize:16,radius:18,padding:15,weight:"500"},
      hero:{bg:"#153e31",color:"#f4e8cb",fontSize:20,radius:22,padding:18,weight:"600"},
      line:{bg:"#f3f0e7",color:"#b69a5c",fontSize:12,radius:0,padding:0,weight:"400"},
      badge:{bg:"#e5d6b4",color:"#254333",fontSize:12,radius:24,padding:8,weight:"700"},
      icon:{bg:"#e0cf9f",color:"#1c4434",fontSize:40,radius:22,padding:8,weight:"600"},
      image:{bg:"#224e3f",color:"#f6e6b7",fontSize:18,radius:18,padding:10,weight:"500"},
      arabic:{bg:"#f3f0e7",color:"#17392b",fontSize:30,radius:0,padding:4,weight:"400"}
    };
    const base=specs[kind]||specs.text;
    return Object.assign({id:randomId(),kind,name,text,x,y,w,h,font:kind==="arabic"?"Amiri, Georgia, serif":"system-ui",fontSize:base.fontSize,weight:base.weight,align:"center",color:base.color,bg:base.bg,radius:base.radius,border:0,opacity:100,padding:base.padding,hidden:false,locked:false,overrides:{}},options||{});
  }
  function sampleHome(){
    return [
      make("hero","Titelbereich","",5,34,90,253,{radius:25}),
      make("badge","Markenname","DAR AL TAWḤĪD",13,57,74,29,{bg:"#153e31",color:"#eacb81",fontSize:12,padding:1}),
      make("text","Salām","As-salāmu ʿalaykum",10,102,80,47,{fontSize:29,color:"#f6eaca",bg:"#153e31",weight:"700"}),
      make("text","Willkommen","Willkommen bei DAR AL TAWḤĪD",11,157,78,36,{fontSize:14,weight:"500",color:"#f8f1df",bg:"#153e31"}),
      make("line","Goldlinie","",22,202,56,10),
      make("text","Leitsatz","Qurʾān · Sunnah · Āthār",13,224,74,25,{fontSize:14,color:"#d7c18e",bg:"#153e31"}),
      make("capsule","Qurʾān-Kapsel","◈  Qurʾān lesen und hören",6,311,88,56),
      make("capsule","Beiträge-Kapsel","📖  Neueste Beiträge",6,385,88,56,{bg:"#233d55",color:"#ffdfab"}),
      make("card","Duʿāʾ-Karte","☾  Duʿāʾ des Tages",6,472,42,139,{fontSize:15}),
      make("card","Tadabbur-Karte","✧  Āyah & Tadabbur",52,472,42,139,{fontSize:15}),
      make("line","Feine Linie","",10,635,80,8),
      make("text","Fußnote","Designentwurf · Inhalte sind Platzhalter",8,671,84,36,{fontSize:12,color:"#65766d",weight:"400"})
    ];
  }
  function samplePage(title,subtitle){
    return [
      make("hero","Bereichsheader","",5,28,90,152),
      make("text","Bereichstitel",title,10,60,80,52,{fontSize:29,color:"#f7e5be",bg:"#153e31"}),
      make("text","Untertitel",subtitle,10,125,80,30,{fontSize:13,weight:"400",bg:"#153e31",color:"#e4d6b4"}),
      make("capsule","Suchen","⌕  Suche in "+title,7,215,86,52,{bg:"#ffffff",color:"#375746",border:1}),
      make("card","Erste Karte","Inhaltsvorschau · frei gestaltbar",7,295,86,128),
      make("card","Zweite Karte","Element anklicken und rechts bearbeiten",7,442,86,128),
      make("line","Trennlinie","",12,600,76,12)
    ];
  }
  function starterProject(){
    return {version:1,name:"DAR Design · Entwurf 01",created:new Date().toISOString(),livePatches:{},pages:[
      {id:"home",name:"Startseite",icon:"⌂",liveHash:"#home",nodes:sampleHome()},
      {id:"posts",name:"Beiträge",icon:"▤",liveHash:"#posts",nodes:samplePage("Beiträge","Qurʾān · Sunnah · Āthār")},
      {id:"quran",name:"Qurʾān",icon:"◈",liveHash:"#quran",nodes:samplePage("Qurʾān","114 Sūren · Lesen und Hören")},
      {id:"dua",name:"Duʿāʾ",icon:"☾",liveHash:"#dua",nodes:samplePage("Mein Duʿāʾ","Bittgebete und Erinnerungen")},
      {id:"books",name:"Bibliothek",icon:"▣",liveHash:"#books",nodes:samplePage("Bibliothek","Werke · Autoren · Quellen")},
      {id:"more",name:"Mehr",icon:"☷",liveHash:"#more",nodes:samplePage("Einstellungen","Konto · Sprache · Erscheinungsbild")}
    ]};
  }
  function validateNode(raw){
    const kind=COMPONENTS.some(x=>x.kind===raw.kind)?raw.kind:"text";
    const base=make(kind,String(raw.name||kind).slice(0,90),String(raw.text||"").slice(0,10000),8,50,84,60);
    for(const k of PROP_NAMES){
      if(!(k in raw))continue;
      if(NUMBER_KEYS.includes(k))base[k]=clamp(raw[k],...LIMITS[k]);
      else if(COLOR_KEYS.includes(k))base[k]=validColor(raw[k],base[k]);
      else if(k==="font")base[k]=FONT_LIST.includes(raw[k])?raw[k]:"system-ui";
      else if(k==="weight")base[k]=["400","500","600","700","800"].includes(String(raw[k]))?String(raw[k]):"400";
      else if(k==="align")base[k]=["left","center","right"].includes(raw[k])?raw[k]:"center";
      else base[k]=String(raw[k]).slice(0,k==="text"?10000:90);
    }
    base.id=String(raw.id||randomId()).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80)||randomId();
    base.hidden=!!raw.hidden;base.locked=!!raw.locked;
    base.overrides={};
    for(const [id,over] of Object.entries(raw.overrides||{})){
      if(!DEVICES.some(d=>d.id===id)||typeof over!=="object"||!over)continue;
      base.overrides[id]={};
      for(const k of PROP_NAMES){
        if(!(k in over))continue;
        const v=over[k];
        if(NUMBER_KEYS.includes(k))base.overrides[id][k]=clamp(v,...LIMITS[k]);
        else if(COLOR_KEYS.includes(k))base.overrides[id][k]=validColor(v,base[k]);
        else if(k==="font" && FONT_LIST.includes(v))base.overrides[id][k]=v;
        else if(k==="weight" && ["400","500","600","700","800"].includes(String(v)))base.overrides[id][k]=String(v);
        else if(k==="align" && ["left","center","right"].includes(v))base.overrides[id][k]=v;
        else if(k==="name"||k==="text")base.overrides[id][k]=String(v).slice(0,k==="text"?10000:90);
      }
    }
    return base;
  }
  function validateProject(raw){
    if(!raw||!Array.isArray(raw.pages)||!raw.pages.length||raw.pages.length>30)throw new Error("Ungültiges Projekt oder zu viele Seiten");
    const pages=raw.pages.map((p,i)=>{
      if(!Array.isArray(p.nodes)||p.nodes.length>1000)throw new Error("Ungültige Ebenen");
      return {id:String(p.id||"page-"+i).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,50),name:String(p.name||"Seite").slice(0,70),icon:String(p.icon||"▣").slice(0,3),liveHash:/^#[\w/-]+$/.test(String(p.liveHash))?p.liveHash:"#home",nodes:p.nodes.map(validateNode)};
    });
    const livePatches={};
    if(raw.livePatches&&typeof raw.livePatches==="object"){
      for(const [pageId, entries] of Object.entries(raw.livePatches)){
        if(!pages.some(p=>p.id===pageId)||!entries||typeof entries!=="object")continue;
        livePatches[pageId]={};
        for(const [selector,patch] of Object.entries(entries).slice(0,500)){
          if(!/^[#.: >+~a-zA-Z0-9_\-\[\]()]+$/.test(selector)||!patch||typeof patch!=="object")continue;
          livePatches[pageId][selector]={};
          for(const k of PROP_NAMES){
            if(!(k in patch))continue;
            const v=patch[k];
            if(NUMBER_KEYS.includes(k))livePatches[pageId][selector][k]=clamp(v,...LIMITS[k]);
            else if(COLOR_KEYS.includes(k))livePatches[pageId][selector][k]=validColor(v,"#ffffff");
            else if(k==="font"&&FONT_LIST.includes(v))livePatches[pageId][selector][k]=v;
            else if(k==="align"||k==="weight")livePatches[pageId][selector][k]=String(v).replace(/[^a-z0-9-]/gi,"").slice(0,20);
            else if(k==="text")livePatches[pageId][selector][k]=String(v).slice(0,10000);
          }
        }
      }
    }
    return {version:1,name:String(raw.name||"DAR Entwurf").slice(0,80),created:String(raw.created||new Date().toISOString()),pages,livePatches};
  }
  function save(){
    try{localStorage.setItem(STORE,JSON.stringify(project));$("saveStatus").textContent="✓ Lokal gespeichert";}
    catch(e){$("saveStatus").textContent="Speichern nicht möglich";toast("Bitte Entwurf als JSON exportieren.");}
    updateHistoryButtons();
  }
  function takeSnapshot(){history.push(JSON.stringify(project));if(history.length>80)history.shift();future=[];updateHistoryButtons();}
  function undo(){
    if(!history.length)return;
    future.push(JSON.stringify(project));project=JSON.parse(history.pop());selectedId=null;renderAll();save();
  }
  function redo(){
    if(!future.length)return;
    history.push(JSON.stringify(project));project=JSON.parse(future.pop());selectedId=null;renderAll();save();
  }
  function updateHistoryButtons(){$("undoBtn").disabled=!history.length;$("redoBtn").disabled=!future.length;}
  function page(){return project.pages.find(p=>p.id===currentPage)||project.pages[0];}
  function findNode(){return page().nodes.find(n=>n.id===selectedId);}
  function nodeValues(node){return Object.assign({},node,node.overrides&&node.overrides[currentDevice]||{});}
  function applyProp(node,key,val){
    if(editScope==="device"){
      if(!node.overrides)node.overrides={};
      if(!node.overrides[currentDevice])node.overrides[currentDevice]={};
      node.overrides[currentDevice][key]=val;
    }else node[key]=val;
  }
  function device(){
    const base=DEVICES.find(d=>d.id===currentDevice)||DEVICES[2];
    return {id:base.id,name:base.name,type:base.type,w:rotated?base.h:base.w,h:rotated?base.w:base.h};
  }
  function refreshDevices(){
    const d=device();
    $("deviceWidth").textContent=d.w;$("deviceHeight").textContent=d.h;
    $("deviceShell").style.width=d.w+"px";$("deviceShell").style.height=d.h+"px";
    $("deviceScreen").style.width=d.w+"px";$("deviceScreen").style.height=d.h+"px";
    $("deviceShell").className="device-shell "+(d.type==="desktop"?"desktop-device":d.type==="tablet"?"tablet-device":"");
    $("board").style.width=(d.w+18)+"px";
    $("board").style.maxWidth="none";
    $("deviceStatus").style.display=d.type==="desktop"?"none":"flex";
    $("safeOutline").classList.toggle("visible",$("safeToggle").checked);
    $("viewport").classList.toggle("grid-on",$("gridToggle").checked);
    const val=$("zoomSelect").value;
    const vp=$("viewport");
    currentZoom=val==="fit"?Math.min(1,Math.max(.16,(vp.clientWidth-100)/(d.w+20)),Math.max(.16,(vp.clientHeight-125)/(d.h+30))):Number(val);
    $("board").style.zoom=String(currentZoom);
    $("boardCaption").textContent=(currentMode==="live"?"DAR Test · unveränderte Vorschau":"DAR Designentwurf · lokale Arbeitsfläche")+" · "+d.name;
  }
  function paintNode(element,node){
    const n=nodeValues(node);
    element.style.left=n.x+"%";element.style.top=n.y+"px";element.style.width=n.w+"%";element.style.height=n.h+"px";
    element.style.fontFamily=n.font;element.style.fontSize=n.fontSize+"px";element.style.fontWeight=n.weight;
    element.style.textAlign=n.align;element.style.color=n.color;element.style.backgroundColor=n.kind==="line"?"transparent":n.bg;
    element.style.borderRadius=n.radius+"px";element.style.borderWidth=n.border+"px";
    element.style.borderColor=n.color;element.style.opacity=n.opacity/100;
    element.style.padding=n.padding+"px";element.style.display=node.hidden?"none":"flex";
    element.dataset.kind=n.kind;
  }
  function renderCanvas(){
    const surface=$("canvasPage");surface.replaceChildren();
    page().nodes.forEach(node=>{
      const n=nodeValues(node);
      const el=document.createElement("div");el.className="studio-node"+(selectedId===node.id?" selected":"");
      el.dataset.id=node.id;el.tabIndex=0;el.setAttribute("aria-label",node.name);
      paintNode(el,node);
      if(n.kind==="line"){const line=document.createElement("span");line.className="node-line";el.append(line);}
      else if(n.kind==="image"){
        const icon=document.createElement("span");icon.className="image-symbol";icon.textContent="▧";
        const txt=document.createElement("span");txt.textContent=n.text;el.append(icon,txt);
      }else{const txt=document.createElement("span");txt.textContent=n.text;el.append(txt);}
      if(selectedId===node.id&&!node.locked){
        const handle=document.createElement("span");handle.className="resize-handle";handle.title="Größe ziehen";el.append(handle);
      }
      el.addEventListener("pointerdown",onNodePointerDown);
      el.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectNode(node.id);}});
      surface.append(el);
    });
    surface.style.width=device().w+"px";surface.style.height=device().h+"px";
  }
  function onNodePointerDown(event){
    if(event.button!==0)return;
    const el=event.currentTarget;
    const node=page().nodes.find(n=>n.id===el.dataset.id);
    if(!node)return;
    event.stopPropagation();
    selectNode(node.id,false);
    if(node.locked){toast("Ebene ist gesperrt.");return;}
    const isResize=event.target.classList.contains("resize-handle");
    const start=nodeValues(node);
    const startX=event.clientX,startY=event.clientY;
    let changed=false;
    el.setPointerCapture(event.pointerId);
    el.classList.add("dragging");
    const onMove=e=>{
      const dx=(e.clientX-startX)/currentZoom;
      const dy=(e.clientY-startY)/currentZoom;
      if(Math.abs(dx)+Math.abs(dy)<1&&!changed)return;
      if(!changed){takeSnapshot();changed=true;}
      const d=device();
      if(isResize){
        applyProp(node,"w",Math.round(clamp(start.w+dx/d.w*100,1,100-start.x)*10)/10);
        applyProp(node,"h",Math.round(clamp(start.h+dy,4,4000)));
      }else{
        applyProp(node,"x",Math.round(clamp(start.x+dx/d.w*100,0,100-start.w)*10)/10);
        applyProp(node,"y",Math.round(clamp(start.y+dy,0,4000)));
      }
      paintNode(el,node);
      updatePropertyValues();
    };
    const onEnd=()=>{
      el.removeEventListener("pointermove",onMove);el.removeEventListener("pointerup",onEnd);el.removeEventListener("pointercancel",onEnd);
      el.classList.remove("dragging");
      if(changed){save();renderLayers();}
    };
    el.addEventListener("pointermove",onMove);el.addEventListener("pointerup",onEnd);el.addEventListener("pointercancel",onEnd);
  }
  function renderPages(){
    const target=$("pageList");target.replaceChildren();
    project.pages.forEach(p=>{
      const button=document.createElement("button");button.className="page-item"+(p.id===currentPage?" active":"");
      const icon=document.createElement("span");icon.className="miniicon";icon.textContent=p.icon;
      const name=document.createElement("span");name.textContent=p.name;
      button.append(icon,name);button.addEventListener("click",()=>{currentPage=p.id;selectedId=null;liveTarget=null;liveSelector="";renderAll();if(currentMode==="live")loadLiveFrame();});
      target.append(button);
    });
  }
  function renderComponents(query){
    const target=$("componentList");target.replaceChildren();
    COMPONENTS.filter(c=>c.name.toLowerCase().includes((query||"").toLowerCase())).forEach(c=>{
      const b=document.createElement("button");b.className="component";b.title=c.name+" hinzufügen";
      const symbol=document.createElement("span");symbol.className="symbol";symbol.textContent=c.symbol;
      const name=document.createElement("span");name.className="component-title";name.textContent=c.name;
      b.append(symbol,name);b.addEventListener("click",()=>addNode(c.kind));target.append(b);
    });
  }
  function renderLayers(){
    const target=$("layerList");target.replaceChildren();
    if(currentMode==="live"){
      $("layerCount").textContent="LIVE";
      const span=document.createElement("div");span.className="hint";span.textContent="In der Vorschau direkt auf ein Element klicken, um CSS-Änderungen lokal auszuprobieren.";target.append(span);return;
    }
    $("layerCount").textContent=page().nodes.length;
    [...page().nodes].reverse().forEach(node=>{
      const row=document.createElement("div");row.className="layer-item"+(selectedId===node.id?" active":"");
      const b=document.createElement("button");b.className="layer-control layer-glyph";b.textContent=COMPONENTS.find(x=>x.kind===node.kind)?.symbol||"▣";b.title="Ebene auswählen";
      const name=document.createElement("button");name.className="layer-control layer-name";name.textContent=node.name;name.title=node.name;
      const eye=document.createElement("button");eye.className="layer-control";eye.textContent=node.hidden?"◌":"◉";eye.title=node.hidden?"Einblenden":"Ausblenden";
      const lock=document.createElement("button");lock.className="layer-control";lock.textContent=node.locked?"▣":"◇";lock.title=node.locked?"Entsperren":"Sperren";
      [b,name].forEach(x=>x.addEventListener("click",()=>selectNode(node.id)));
      eye.addEventListener("click",()=>{takeSnapshot();node.hidden=!node.hidden;renderAll();save();});
      lock.addEventListener("click",()=>{takeSnapshot();node.locked=!node.locked;renderAll();save();});
      row.append(b,name,eye,lock);target.append(row);
    });
  }
  function selectNode(id,render=true){
    selectedId=id;liveTarget=null;liveSelector="";
    if(render)renderCanvas();
    else{
      document.querySelectorAll(".studio-node.selected").forEach(el=>el.classList.remove("selected"));
      document.querySelectorAll(".studio-node").forEach(el=>{if(el.dataset.id===id)el.classList.add("selected");});
    }
    renderLayers();renderProperties();
    if(window.innerWidth<=850)$("inspectorPanel")?.classList.add("mobile-visible");
    if(window.innerWidth<=850)$("inspectorTitle").closest(".inspector").classList.add("mobile-visible");
  }
  function renderProperties(){
    const node=currentMode==="canvas"?findNode():null;
    const available=!!node||(currentMode==="live"&&!!liveTarget);
    $("inspectPlaceholder").hidden=available;$("propertyPanel").hidden=!available;
    $("inspectorTitle").textContent=available?(currentMode==="live"?"Live-Element":"Element bearbeiten"):"Eigenschaften";
    $("inspectorSubtitle").textContent=currentMode==="live"?"Änderungen nur in der iframe-Vorschau · exportierbar":node?node.kind+" · "+(editScope==="device"?"nur "+device().name:"alle Geräte"):"Wähle ein Element auf der Designfläche.";
    $("liveSelectorWrap").hidden=currentMode!=="live";
    const isLive=currentMode==="live";
    for(const id of ["propX","propY","propW","propH","propLabel","propText"]){$(id).disabled=isLive&&["propX","propY","propW","propH","propLabel"].includes(id);}
    for(const id of ["duplicateBtn","frontBtn","backBtn","deleteBtn"])$(id).disabled=isLive;
    if(!available)return;
    $("liveSelector").textContent=liveSelector;
    updatePropertyValues();
  }
  function updatePropertyValues(){
    const node=currentMode==="canvas"?findNode():null;
    const data=node?nodeValues(node):getCurrentLiveProperties();
    if(!data)return;
    for(const key of PROP_NAMES){
      const field=$("prop"+key[0].toUpperCase()+key.slice(1));if(!field)continue;
      if(document.activeElement===field&&editSession===field.id)continue;
      field.value=data[key]===undefined?"":data[key];
    }
    if(node){
      $("inspectorSubtitle").textContent=node.kind+" · "+(editScope==="device"?"nur "+device().name:"alle Geräte");
    }
  }
  function addNode(kind){
    if(currentMode!=="canvas"){toast("Bitte zunächst Entwurf wählen.");return;}
    const settings={
      text:["Text","Neuer Text",8,60,84,60],
      capsule:["Kapsel","Neue Kapsel",8,100,84,56],
      button:["Schaltfläche","Öffnen",8,150,84,54],
      card:["Karte","Neue Inhaltskarte",7,210,86,120],
      line:["Trennlinie","",10,270,80,10],
      badge:["Label","NEU",34,120,32,35],
      icon:["Symbol","✦",40,140,20,65],
      image:["Bildfläche","Bild platzieren",8,210,84,180],
      hero:["Titelbereich","Titel des Bereichs",6,80,88,210],
      arabic:["Arabischer Text","بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",6,120,88,100]
    };
    const s=settings[kind]||settings.text;
    const maxY=page().nodes.reduce((v,n)=>Math.max(v,n.y+n.h),0);
    const y=Math.max(s[3],Math.min(3500,maxY+22));
    takeSnapshot();
    const n=make(kind,s[0],s[1],s[2],y,s[4],s[5]);
    page().nodes.push(n);selectedId=n.id;renderAll();save();toast(s[0]+" eingefügt.");
  }
  function duplicate(){
    const node=findNode();if(!node)return;
    takeSnapshot();const copy=JSON.parse(JSON.stringify(node));copy.id=randomId();copy.name=node.name+" · Kopie";copy.y+=24;copy.x=Math.min(98,copy.x+2);
    page().nodes.push(copy);selectedId=copy.id;renderAll();save();
  }
  function deleteSelected(){
    const node=findNode();if(!node||!confirm("Ebene '"+node.name+"' aus diesem lokalen Entwurf entfernen?"))return;
    takeSnapshot();page().nodes=page().nodes.filter(n=>n.id!==node.id);selectedId=null;renderAll();save();
  }
  function moveLayer(direction){
    const p=page(),i=p.nodes.findIndex(n=>n.id===selectedId),j=i+direction;
    if(i<0||j<0||j>=p.nodes.length)return;
    takeSnapshot();[p.nodes[i],p.nodes[j]]=[p.nodes[j],p.nodes[i]];renderAll();save();
  }
  function addPage(){
    const name=prompt("Name der neuen Entwurfsseite:","Neue Seite");
    if(!name||!name.trim())return;
    if(project.pages.length>=30){toast("Maximal 30 Seiten pro Entwurf.");return;}
    takeSnapshot();
    const id="page-"+Date.now().toString(36);
    project.pages.push({id,name:name.trim().slice(0,70),icon:"▣",liveHash:"#home",nodes:[]});
    currentPage=id;selectedId=null;renderAll();save();
  }
  function updateFromField(event){
    const key=event.target.dataset.prop;
    if(!key)return;
    const node=currentMode==="canvas"?findNode():null;
    if(!node&&currentMode!=="live")return;
    const input=event.target;
    if(editSession!==input.id){takeSnapshot();editSession=input.id;}
    let value=input.value;
    if(NUMBER_KEYS.includes(key))value=clamp(value,...LIMITS[key]);
    if(COLOR_KEYS.includes(key))value=validColor(value,"#ffffff");
    if(currentMode==="canvas"){
      applyProp(node,key,value);
      renderCanvas();renderLayers();
    }else{
      if(!liveSelector)return;
      const patch=ensureLivePatch();
      patch[key]=value;
      applyLivePatches();
    }
    save();
  }
  function download(name,content,mime){
    const blob=new Blob([content],{type:mime||"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function cssForNode(n){
    return "position:absolute;left:"+n.x+"%;top:"+n.y+"px;width:"+n.w+"%;height:"+n.h+"px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;white-space:pre-wrap;overflow-wrap:anywhere;overflow:hidden;text-align:"+n.align+";font-family:"+n.font+";font-size:"+n.fontSize+"px;font-weight:"+n.weight+";color:"+n.color+";background:"+((n.kind==="line")?"transparent":n.bg)+";border:"+n.border+"px solid "+n.color+";border-radius:"+n.radius+"px;opacity:"+(n.opacity/100)+";padding:"+n.padding+"px;";
  }
  function exportHtml(){
    if(currentMode==="live"){toast("Im Live-Modus stattdessen CSS-Entwurf exportieren.");return;}
    const d=device();
    const nodes=page().nodes.filter(n=>!n.hidden).map(node=>{
      const n=nodeValues(node);
      const html=n.kind==="line"?"<span style='width:100%;border-top:1px solid currentColor'></span>":escapeHtml(n.text);
      return '<div style="'+escapeHtml(cssForNode(n))+'">'+html+"</div>";
    }).join("\n");
    const html='<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escapeHtml(page().name)+'</title><style>body{background:#111a16;color:#eee;display:flex;justify-content:center;padding:25px;font-family:system-ui}.artboard{position:relative;width:'+d.w+'px;height:'+d.h+'px;background:#f3f0e7;overflow:hidden;flex:none;box-shadow:0 20px 90px #0008}@media(max-width:'+d.w+'px){.artboard{zoom:calc((100vw - 40px) / '+d.w+');}}</style><main class="artboard">'+nodes+'</main></html>';
    download("dar-entwurf-"+page().id+".html",html,"text/html;charset=utf-8");
    toast("Eigenständige HTML-Vorschau gespeichert.");
  }
  function exportProject(){
    if(currentMode==="live"){
      const css=buildLiveCss();
      download("dar-test-css-vorschlag.css",css,"text/css;charset=utf-8");
      toast("CSS-Vorschlag exportiert – nicht veröffentlicht.");return;
    }
    download("dar-visual-studio-entwurf.json",JSON.stringify(project,null,2),"application/json;charset=utf-8");
    toast("Projektdatei gespeichert.");
  }
  function newProject(){
    if(!confirm("Neuen Entwurf anlegen? Den bisherigen Entwurf vorher als JSON exportieren, falls du ihn behalten möchtest."))return;
    takeSnapshot();project=starterProject();selectedId=null;currentPage="home";renderAll();save();
  }
  async function importProject(file){
    try{
      if(file.size>5*1024*1024)throw new Error("Datei größer als 5 MB");
      const obj=JSON.parse(await file.text()),next=validateProject(obj);
      takeSnapshot();project=next;currentPage=project.pages[0].id;selectedId=null;renderAll();save();toast("Entwurf importiert.");
    }catch(e){toast("Import fehlgeschlagen: "+e.message);}
  }
  function livePath(){
    const u=new URL("../test/",document.baseURI);
    u.hash=page().liveHash||"#home";
    return u.href;
  }
  function loadLiveFrame(){
    liveTarget=null;liveSelector="";
    if(currentMode!=="live")return;
    $("testPreview").src=livePath();renderProperties();
  }
  function onLiveLoad(){
    if(currentMode!=="live")return;
    try{
      const doc=$("testPreview").contentDocument;
      if(!doc||!doc.body)throw new Error("kein DOM");
      doc.addEventListener("click",onLiveClick,true);
      doc.addEventListener("submit",event=>{event.preventDefault();event.stopImmediatePropagation();},true);
      applyLivePatches();
      $("modeHint").textContent="Elemente anklicken · Vorschau";
      toast("DAR-Test-Vorschau bereit. Änderungen sind temporär.");
    }catch(e){
      $("modeHint").textContent="Vorschau (nur Lesen)";
      toast("DOM-Inspektor benötigt denselben Ursprung (same origin).");
    }
  }
  function getSelector(el){
    const doc=el.ownerDocument;
    if(el.id && /^[A-Za-z][\w-]*$/.test(el.id))return "#"+el.id;
    const chunks=[];
    let node=el;
    while(node&&node!==doc.documentElement&&chunks.length<7){
      const tag=node.tagName?.toLowerCase();
      if(!tag)break;
      if(node.id&&/^[A-Za-z][\w-]*$/.test(node.id)){chunks.unshift("#"+node.id);break;}
      let nth=1,s=node;
      while((s=s.previousElementSibling)){if(s.tagName===node.tagName)nth++;}
      chunks.unshift(tag+":nth-of-type("+nth+")");
      node=node.parentElement;
    }
    return chunks.join(" > ");
  }
  function onLiveClick(event){
    if(currentMode!=="live")return;
    const el=event.target instanceof Element?event.target:null;
    if(!el||!el.tagName||["HTML","BODY","SCRIPT","STYLE","HEAD"].includes(el.tagName))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(liveTarget&&liveTarget!==el)liveTarget.style.outline=liveTarget.dataset.studioOldOutline||"";
    liveTarget=el;
    liveSelector=getSelector(el);
    el.dataset.studioOldOutline=el.style.outline||"";
    el.style.outline="2px solid #ddb86b";
    selectedId=null;renderProperties();
    if(window.innerWidth<=850)$("inspectorTitle").closest(".inspector").classList.add("mobile-visible");
  }
  function getCurrentLiveProperties(){
    if(!liveTarget)return null;
    const css=liveTarget.ownerDocument.defaultView.getComputedStyle(liveTarget);
    const patch=project.livePatches[currentPage]?.[liveSelector]||{};
    const leaf=liveTarget.children.length===0;
    const baseline={
      name:liveTarget.tagName.toLowerCase(),text:leaf?liveTarget.textContent.trim().slice(0,10000):"[Enthält Unterelemente – Textbearbeitung gesperrt]",
      x:0,y:0,w:100,h:Math.round(liveTarget.getBoundingClientRect().height),
      font:FONT_LIST.includes(css.fontFamily)?css.fontFamily:"system-ui",
      fontSize:Math.round(parseFloat(css.fontSize)||16),
      weight:["400","500","600","700","800"].includes(css.fontWeight)?css.fontWeight:"400",
      align:["left","center","right"].includes(css.textAlign)?css.textAlign:"left",
      color:rgbToHex(css.color,"#1b372c"),
      bg:rgbToHex(css.backgroundColor,"#ffffff"),
      radius:Math.round(parseFloat(css.borderRadius)||0),
      border:Math.round(parseFloat(css.borderWidth)||0),
      opacity:Math.round(parseFloat(css.opacity||1)*100),
      padding:Math.round(parseFloat(css.paddingTop)||0)
    };
    $("propText").disabled=!leaf;
    return Object.assign(baseline,patch);
  }
  function ensureLivePatch(){
    if(!project.livePatches[currentPage])project.livePatches[currentPage]={};
    if(!project.livePatches[currentPage][liveSelector])project.livePatches[currentPage][liveSelector]={};
    return project.livePatches[currentPage][liveSelector];
  }
  function liveRule(selector,patch){
    const statements=[];
    const rules={font:"font-family",fontSize:"font-size",weight:"font-weight",align:"text-align",color:"color",bg:"background-color",radius:"border-radius",border:"border-width",opacity:"opacity",padding:"padding"};
    for(const key of Object.keys(rules)){
      if(patch[key]===undefined)continue;
      let val=patch[key];
      if(["fontSize","radius","border","padding"].includes(key))val+="px";
      if(key==="opacity")val=val/100;
      statements.push("  "+rules[key]+": "+val+" !important;");
      if(key==="border")statements.push("  border-style: solid !important;");
    }
    return statements.length?selector+" {\n"+statements.join("\n")+"\n}\n":"";
  }
  function buildLiveCss(){
    let out="/* DAR Visual Studio: CSS-Entwurf. Vor Einbau in DAR TEST sorgfältig prüfen. */\n";
    for(const [pageId,entries] of Object.entries(project.livePatches)){
      out+="\n/* Seite: "+pageId+" */\n";
      for(const [selector,patch] of Object.entries(entries))out+=liveRule(selector,patch);
    }
    return out;
  }
  function applyLivePatches(){
    try{
      const doc=$("testPreview").contentDocument;if(!doc||!doc.head)return;
      let style=doc.getElementById("dar-design-studio-preview");
      if(!style){style=doc.createElement("style");style.id="dar-design-studio-preview";doc.head.append(style);}
      const entries=project.livePatches[currentPage]||{};
      style.textContent=Object.entries(entries).map(([selector,patch])=>liveRule(selector,patch)).join("\n");
      for(const [selector,patch] of Object.entries(entries)){
        if(patch.text===undefined)continue;
        try{doc.querySelectorAll(selector).forEach(el=>{if(!el.children.length)el.textContent=patch.text;});}catch(e){}
      }
    }catch(e){}
  }
  function setMode(next){
    currentMode=next;selectedId=null;liveTarget=null;liveSelector="";
    $("canvasMode").classList.toggle("active",next==="canvas");
    $("canvasMode").setAttribute("aria-pressed",String(next==="canvas"));
    $("liveMode").classList.toggle("active",next==="live");
    $("liveMode").setAttribute("aria-pressed",String(next==="live"));
    $("canvasPage").hidden=next==="live";$("testPreview").hidden=next!=="live";
    $("componentsSection").style.opacity=next==="live"?.35:1;
    $("modeHint").textContent=next==="live"?"Live-Inspektor · ohne Veröffentlichung":"Visuelle Arbeitsfläche";
    $("exportBtn").textContent=next==="live"?"↗ CSS-Vorschlag":"↗ Export";
    renderAll();
    if(next==="live")loadLiveFrame();
    else $("testPreview").src="about:blank";
  }
  function renderAll(){
    if(!project.pages.some(p=>p.id===currentPage))currentPage=project.pages[0].id;
    $("projectName").textContent=project.name;
    refreshDevices();renderPages();renderLayers();renderCanvas();renderProperties();
  }
  function bind(){
    const selector=$("deviceSelect");
    DEVICES.forEach(d=>{const opt=document.createElement("option");opt.value=d.id;opt.textContent=d.name;selector.append(opt);});
    selector.value=currentDevice;
    selector.addEventListener("change",()=>{currentDevice=selector.value;renderAll();});
    $("rotateBtn").addEventListener("click",()=>{rotated=!rotated;renderAll();});
    $("zoomSelect").addEventListener("change",refreshDevices);
    $("gridToggle").addEventListener("change",refreshDevices);
    $("safeToggle").addEventListener("change",refreshDevices);
    $("canvasMode").addEventListener("click",()=>setMode("canvas"));
    $("liveMode").addEventListener("click",()=>setMode("live"));
    $("undoBtn").addEventListener("click",undo);
    $("redoBtn").addEventListener("click",redo);
    $("newBtn").addEventListener("click",newProject);
    $("exportBtn").addEventListener("click",exportProject);
    $("exportHtmlBtn").addEventListener("click",exportHtml);
    $("importBtn").addEventListener("click",()=>$("importFile").click());
    $("importFile").addEventListener("change",event=>{if(event.target.files[0])importProject(event.target.files[0]);event.target.value="";});
    $("addPageBtn").addEventListener("click",addPage);
    $("componentSearch").addEventListener("input",event=>renderComponents(event.target.value));
    $("duplicateBtn").addEventListener("click",duplicate);
    $("deleteBtn").addEventListener("click",deleteSelected);
    $("frontBtn").addEventListener("click",()=>moveLayer(1));
    $("backBtn").addEventListener("click",()=>moveLayer(-1));
    for(const field of document.querySelectorAll("[data-prop]")){
      field.addEventListener("input",updateFromField);
      field.addEventListener("change",updateFromField);
      field.addEventListener("blur",()=>{editSession=null;});
    }
    $("canvasPage").addEventListener("pointerdown",e=>{if(e.target===$("canvasPage")){selectedId=null;renderAll();}});
    $("testPreview").addEventListener("load",onLiveLoad);
    window.addEventListener("resize",()=>{if($("zoomSelect").value==="fit")refreshDevices();});
    document.addEventListener("keydown",event=>{
      const command=event.metaKey||event.ctrlKey;
      if(command&&event.key.toLowerCase()==="z"){event.preventDefault();if(event.shiftKey)redo();else undo();}
      else if(command&&event.key.toLowerCase()==="d"){event.preventDefault();duplicate();}
      else if((event.key==="Delete"||event.key==="Backspace")&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){if(findNode()){event.preventDefault();deleteSelected();}}
      else if(event.key==="Escape")$("inspectorTitle").closest(".inspector").classList.remove("mobile-visible");
    });
    const toolbar=document.querySelector(".canvas-toolbar");
    const responsiveLabel=document.createElement("label");responsiveLabel.className="compact-field";responsiveLabel.textContent="Bearbeiten ";
    const responsiveSelect=document.createElement("select");responsiveSelect.setAttribute("aria-label","Bearbeitungsgeltung");
    [["global","Alle Geräte"],["device","Nur dieses Gerät"]].forEach(([value,label])=>{const opt=document.createElement("option");opt.value=value;opt.textContent=label;responsiveSelect.append(opt);});
    responsiveSelect.addEventListener("change",()=>{editScope=responsiveSelect.value;renderProperties();});
    responsiveLabel.append(responsiveSelect);
    toolbar.insertBefore(responsiveLabel,$("gridToggle").closest("label"));
  }
  function init(){
    try{const saved=localStorage.getItem(STORE);project=saved?validateProject(JSON.parse(saved)):starterProject();}
    catch(e){project=starterProject();toast("Gespeicherter Entwurf war ungültig. Neuer lokaler Entwurf geladen.");}
    bind();renderComponents("");renderAll();save();updateHistoryButtons();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
