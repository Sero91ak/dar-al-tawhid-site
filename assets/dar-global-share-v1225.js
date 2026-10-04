(function(){
  "use strict";
  if(window.__DAR_GLOBAL_SHARE_V1225)return;
  window.__DAR_GLOBAL_SHARE_V1225=true;

  var APP_STORE_URL="https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753";
  var APP_STORE_ICON="/assets/app-store-icon-fixed.svg?v=share-v1225";
  var SITE="dar-al-tawhid.de";
  var W=1080,H=1350;

  var GENERIC_SCENES=[
    "/kids/assets/prophet-scenes/library.webp",
    "/kids/assets/prophet-scenes/desert.webp",
    "/kids/assets/prophet-scenes/mountain.webp",
    "/kids/assets/prophet-scenes/night.webp",
    "/kids/assets/prophet-scenes/royal.webp",
    "/kids/assets/prophet-scenes/garden.webp",
    "/kids/assets/prophet-scenes/water.webp",
    "/kids/assets/prophet-scenes/ocean.webp",
    "/assets/post-templates/bibliothek-braun.jpg",
    "/assets/post-templates/nachtblau-buecher.jpg",
    "/assets/post-templates/gruen-moschee.jpg",
    "/assets/post-templates/sand-buecher.jpg",
    "/assets/post-templates/olive-mihrab.jpg",
    "/assets/post-templates/nacht-mond.jpg",
    "/assets/post-templates/petrol-pflanze.jpg",
    "/assets/post-templates/buecher-teal.jpg"
  ];
  var SAHABA_SCENES={
    "abu bakr":"/kids/assets/sahaba-mubashshirun/abu-bakr.jpg",
    "abū bakr":"/kids/assets/sahaba-mubashshirun/abu-bakr.jpg",
    "umar":"/kids/assets/sahaba-mubashshirun/umar.jpg",
    "ʿumar":"/kids/assets/sahaba-mubashshirun/umar.jpg",
    "uthman":"/kids/assets/sahaba-mubashshirun/uthman.jpg",
    "ʿuthman":"/kids/assets/sahaba-mubashshirun/uthman.jpg",
    "ali":"/kids/assets/sahaba-mubashshirun/ali.jpg",
    "ʿali":"/kids/assets/sahaba-mubashshirun/ali.jpg",
    "talha":"/kids/assets/sahaba-mubashshirun/talha.jpg",
    "zubayr":"/kids/assets/sahaba-mubashshirun/zubayr.jpg",
    "saʿd":"/kids/assets/sahaba-mubashshirun/sad.jpg",
    "sa'd":"/kids/assets/sahaba-mubashshirun/sad.jpg",
    "saʿid":"/kids/assets/sahaba-mubashshirun/said.jpg",
    "sa'id":"/kids/assets/sahaba-mubashshirun/said.jpg",
    "abu ubaydah":"/kids/assets/sahaba-mubashshirun/abu-ubaydah.jpg",
    "abū ʿubaydah":"/kids/assets/sahaba-mubashshirun/abu-ubaydah.jpg",
    "abd ar-rahman":"/kids/assets/sahaba-mubashshirun/abd-ar-rahman.jpg",
    "ʿabd ar-raḥman":"/kids/assets/sahaba-mubashshirun/abd-ar-rahman.jpg"
  };

  function clean(s){return String(s||"").replace(/\s+/g," ").trim()}
  function text(el){return el?clean(el.innerText||el.textContent||""):""}
  function first(root,sel){try{return root&&root.querySelector?root.querySelector(sel):null}catch(e){return null}}
  function hash(s){s=String(s||"");var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)}return Math.abs(h>>>0)}
  function toast(msg){
    var old=document.querySelector(".dar-global-share-toast");if(old)old.remove();
    var n=document.createElement("div");n.className="dar-global-share-toast";n.textContent=msg;document.body.appendChild(n);
    requestAnimationFrame(function(){n.classList.add("is-visible")});
    setTimeout(function(){n.classList.remove("is-visible");setTimeout(function(){try{n.remove()}catch(e){}},220)},1800);
  }
  function loadImage(src){
    return new Promise(function(resolve,reject){
      var im=new Image();im.decoding="async";
      try{var u=new URL(src,location.href);if(u.origin!==location.origin)im.crossOrigin="anonymous"}catch(e){}
      im.onload=function(){resolve(im)};im.onerror=reject;im.src=src;
    });
  }
  function cover(ctx,img){
    var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;if(!iw||!ih)return;
    var s=Math.max(W/iw,H/ih),dw=iw*s,dh=ih*s;
    ctx.drawImage(img,(W-dw)/2,(H-dh)/2,dw,dh);
  }
  function roundRect(ctx,x,y,w,h,r){
    r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }
  function wrap(ctx,str,maxWidth){
    var lines=[];String(str||"").replace(/\r\n/g,"\n").split("\n").forEach(function(raw){
      var words=raw.trim().split(/\s+/).filter(Boolean);if(!words.length){lines.push("");return}
      var line="";words.forEach(function(word){var t=line?line+" "+word:word;if(line&&ctx.measureText(t).width>maxWidth){lines.push(line);line=word}else line=t});if(line)lines.push(line)
    });return lines;
  }
  function trimSource(s){s=clean(s);return s.length>340?s.slice(0,337).trim()+"…":s}
  function ctxFromAyah(btn){
    var raw=btn.getAttribute("data-image-ayah-open")||btn.getAttribute("data-quran-share-ayah")||"";
    var d=null;try{if(typeof window.parseQuranAyahShareData==="function")d=window.parseQuranAyahShareData(raw)}catch(e){}
    if(!d){try{d=JSON.parse(decodeURIComponent(raw))}catch(e2){}}
    if(!d)return null;
    var sid=Number(d.s)||"",aid=Number(d.a)||"",name=clean(d.name);
    return {kind:"quran",category:"Qurʾān",title:"Qurʾān "+sid+":"+aid+(name?" · "+name:""),body:[clean(d.ar),clean(d.de)].filter(Boolean).join("\n\n"),source:"Qurʾān · "+(name?name+" · ":"")+"Āyah "+aid,url:location.href};
  }
  function ctxFromDom(trigger){
    if(trigger&&(trigger.hasAttribute("data-image-ayah-open")||trigger.hasAttribute("data-quran-share-ayah")))return ctxFromAyah(trigger);
    var root=(trigger&&trigger.closest&&trigger.closest(".article,.post-reader,[data-frauen-view],.dua-detail,.quran-ayah"))||document.querySelector("#appView .post-reader,#appView .article,#appView .quran-ayah")||document.getElementById("appView")||document.body;
    var route=(window.currentRoute&&window.currentRoute.view)||String(location.hash||"").replace(/^#\/?/,"").split("/")[0];
    var title=text(first(root,".post-reader-title h2,.article-title h2,.view-head h2,.quran-explain-title strong,h1,h2"));
    var category=text(first(root,".post-reader-title .kicker,.article-title .eyebrow,.post-aussage-kicker,.dua-label,.kicker,.eyebrow"))||"Wissen";
    var body="";
    if(route==="dua"||first(root,".dua-detail-box")){
      var ar=text(first(root,".dua-arabic")),de=text(first(root,".dua-de"));body=[ar,de].filter(Boolean).join("\n\n");category="Duʿāʾ";
    }else{
      body=text(first(root,".post-aussage-text,.post-reader .statement,.statement,.post-slide.is-active .post-slide-quote,.post-slide-quote,.quran-ayah-de,.quran-ayah-ar"));
    }
    var source=text(first(root,"[data-post-after-source],.post-source-main,.post-reader-cite,.source-text,.post-after-source,.dua-source,.quran-ayah-ref"));
    if(!source){var srcPanel=first(root,".source-area-panel,.post-source,.frauen-source-card");source=text(srcPanel)}
    if(!title)title=category||"DĀR AL TAWḤĪD";
    if(!body){
      var share=trigger&&trigger.closest&&trigger.closest(".share-panel");if(share){var t=trigger.getAttribute("data-share-text")||"";try{t=decodeURIComponent(t)}catch(e){}body=clean(t)}
    }
    return {kind:String(route||"post"),category:category||"Wissen",title:title,body:body,source:trimSource(source||"Quelle siehe Beitrag in der App."),url:location.href};
  }
  function sceneFor(data){
    var hay=(data.title+" "+data.body+" "+data.category).toLowerCase();
    var exact=null;Object.keys(SAHABA_SCENES).some(function(k){if(hay.indexOf(k)>=0){exact=SAHABA_SCENES[k];return true}return false});
    if(exact)return exact;
    var key="darGlobalShareSceneV1225",seq=0;try{seq=Number(localStorage.getItem(key)||0)||0;localStorage.setItem(key,String(seq+1))}catch(e){}
    return GENERIC_SCENES[(hash(hay+"|"+seq))%GENERIC_SCENES.length];
  }
  function splitBody(ctx,body,bodySize,maxW,maxH){
    ctx.font="400 "+bodySize+"px Georgia, 'Times New Roman', serif";
    var lines=wrap(ctx,body,maxW),lh=Math.round(bodySize*1.42),per=Math.max(5,Math.floor(maxH/lh)),pages=[];
    for(var i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));return pages.length?pages:[[]];
  }
  async function drawBadge(ctx){
    var x=730,y=1250,w=280,h=62;
    roundRect(ctx,x,y,w,h,15);ctx.fillStyle="rgba(7,12,12,.62)";ctx.fill();ctx.strokeStyle="rgba(236,211,148,.48)";ctx.lineWidth=1.5;ctx.stroke();
    var icon=null;try{icon=await loadImage(APP_STORE_ICON)}catch(e){}
    if(icon){ctx.save();roundRect(ctx,x+10,y+8,46,46,11);ctx.clip();ctx.drawImage(icon,x+10,y+8,46,46);ctx.restore()}
    else{ctx.fillStyle="#f0d797";ctx.font="700 28px Arial";ctx.fillText("A",x+22,y+40)}
    ctx.fillStyle="#fff9e9";ctx.font="700 14px Arial, sans-serif";ctx.fillText("DĀR AL TAWḤĪD",x+66,y+26);
    ctx.fillStyle="rgba(255,249,233,.77)";ctx.font="600 12px Arial, sans-serif";ctx.fillText("Im App Store",x+66,y+45);
  }
  async function renderFiles(data){
    var canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;var ctx=canvas.getContext("2d");if(!ctx)return[];
    try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch(e){}
    var bg=null;try{bg=await loadImage(sceneFor(data))}catch(e2){try{bg=await loadImage(GENERIC_SCENES[0])}catch(e3){}}
    var margin=76,contentW=W-margin*2;
    var titleSize=data.title.length>90?38:data.title.length>55?43:48;
    ctx.font="650 "+titleSize+"px Georgia, 'Times New Roman', serif";
    var titleLines=wrap(ctx,data.title,contentW).slice(0,3);
    var titleBottom=150+titleLines.length*Math.round(titleSize*1.14);
    var bodyTop=titleBottom+54,bodyBottom=960,bodyH=bodyBottom-bodyTop;
    var bodySize=data.body.length>900?31:data.body.length>620?34:38;
    var pages=splitBody(ctx,data.body||data.title,bodySize,contentW-18,bodyH);
    if(pages.length>8){pages=pages.slice(0,8);pages[7].push("…")}
    var files=[];
    for(var p=0;p<pages.length;p++){
      ctx.clearRect(0,0,W,H);if(bg)cover(ctx,bg);else{ctx.fillStyle="#0b211d";ctx.fillRect(0,0,W,H)}
      var g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"rgba(2,13,14,.91)");g.addColorStop(.55,"rgba(4,18,19,.79)");g.addColorStop(1,"rgba(5,13,16,.69)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      var rg=ctx.createRadialGradient(W*.82,H*.18,20,W*.82,H*.18,W*.66);rg.addColorStop(0,"rgba(231,200,123,.10)");rg.addColorStop(1,"rgba(231,200,123,0)");ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);

      ctx.fillStyle="#efd89f";ctx.font="700 23px Arial, sans-serif";ctx.textAlign="left";ctx.fillText("DĀR AL TAWḤĪD",margin,76);
      ctx.textAlign="right";ctx.font="700 15px Arial, sans-serif";ctx.fillText(String(p+1).padStart(2,"0")+" / "+String(pages.length).padStart(2,"0"),W-margin,75);ctx.textAlign="left";
      ctx.strokeStyle="rgba(239,216,159,.62)";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(margin,105);ctx.lineTo(W-margin,105);ctx.stroke();

      var y=158;ctx.fillStyle="#fff8e9";ctx.font="650 "+titleSize+"px Georgia, 'Times New Roman', serif";
      titleLines.forEach(function(line){ctx.fillText(line,margin,y);y+=Math.round(titleSize*1.14)});
      ctx.strokeStyle="rgba(239,216,159,.50)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(margin,y+8);ctx.lineTo(margin+170,y+8);ctx.stroke();
      y+=54;

      ctx.font="400 "+bodySize+"px Georgia, 'Times New Roman', serif";ctx.fillStyle="#fffaf0";var lh=Math.round(bodySize*1.42);
      ctx.strokeStyle="rgba(239,216,159,.72)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(margin-18,y-10);ctx.lineTo(margin-18,Math.min(bodyBottom,y+pages[p].length*lh));ctx.stroke();
      pages[p].forEach(function(line){if(!line){y+=Math.round(lh*.55);return}ctx.fillText(line,margin,y);y+=lh});

      var sy=1002,sh=166;roundRect(ctx,margin,sy,contentW,sh,22);ctx.fillStyle="rgba(3,14,15,.64)";ctx.fill();ctx.strokeStyle="rgba(239,216,159,.25)";ctx.lineWidth=1.2;ctx.stroke();
      ctx.fillStyle="#e9cf91";ctx.font="800 15px Arial, sans-serif";ctx.fillText(clean(data.category).toUpperCase(),margin+22,sy+29);
      ctx.fillStyle="rgba(255,249,235,.86)";ctx.font="400 17px Arial, sans-serif";var sl=wrap(ctx,"Quelle: "+trimSource(data.source),contentW-44).slice(0,3),sly=sy+60;sl.forEach(function(line){ctx.fillText(line,margin+22,sly);sly+=24});
      ctx.fillStyle="rgba(255,249,235,.72)";ctx.font="600 14px Arial, sans-serif";ctx.fillText("Folgt für mehr Wissen aus Qurʾān & Sunnah",margin+22,sy+143);

      ctx.fillStyle="#efd89f";ctx.font="700 18px Arial, sans-serif";ctx.fillText(SITE,margin,H-73);
      ctx.fillStyle="rgba(255,249,235,.68)";ctx.font="500 13px Arial, sans-serif";ctx.fillText("by Serhat Abu Malik",margin,H-49);
      await drawBadge(ctx);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,"image/png",.97)});if(blob)files.push(new File([blob],"dar-al-tawhid-bildbeitrag-"+(p+1)+".png",{type:"image/png"}));
    }
    return files;
  }
  async function shareFiles(files,data,instagram){
    if(!files||!files.length)throw new Error("no files");
    if(instagram)toast("Bildbeitrag erstellt · im Teilen-Menü Instagram auswählen");
    try{
      if(navigator.share){
        var payload={files:files,title:data.title+" · DĀR AL TAWḤĪD",text:"DĀR AL TAWḤĪD · "+SITE};
        if(!navigator.canShare||navigator.canShare({files:files})){await navigator.share(payload);return true}
        if(!navigator.canShare||navigator.canShare({files:[files[0]]})){await navigator.share({files:[files[0]],title:payload.title,text:payload.text});return true}
      }
    }catch(e){if(e&&e.name==="AbortError")return true}
    try{
      var h=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darShareImage;
      if(h&&typeof h.postMessage==="function"){
        var fr=new FileReader();var dataUrl=await new Promise(function(resolve,reject){fr.onload=function(){resolve(String(fr.result||""))};fr.onerror=reject;fr.readAsDataURL(files[0])});
        h.postMessage({dataUrl:dataUrl,filename:files[0].name,title:data.title+" · DĀR AL TAWḤĪD"});return true;
      }
    }catch(e2){}
    files.forEach(function(file,idx){setTimeout(function(){var u=URL.createObjectURL(file),a=document.createElement("a");a.href=u;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},30000)},idx*180)});
    toast("Bildbeitrag erstellt und gespeichert");return true;
  }
  async function createAndShare(trigger,instagram){
    var data=ctxFromDom(trigger);if(!data||!clean(data.body)){toast("Für diesen Bereich ist noch kein teilbarer Inhalt erkannt.");return false}
    if(trigger&&trigger.dataset.darShareBusy==="1")return true;
    if(trigger){trigger.dataset.darShareBusy="1";trigger.classList.add("is-busy")}
    try{toast("Bildbeitrag wird erstellt …");var files=await renderFiles(data);await shareFiles(files,data,instagram);return true}
    catch(e){console.error("DAR global image share",e);toast("Bildbeitrag konnte nicht erstellt werden.");return false}
    finally{if(trigger){trigger.dataset.darShareBusy="0";trigger.classList.remove("is-busy")}}
  }
  function imageButton(){
    var b=document.createElement("button");b.type="button";b.className="share-btn image-post dar-global-image-btn";b.setAttribute("data-dar-global-image","1");
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><path d="M6.5 16l3.4-3.4 2.6 2.5 2.1-2.2 3.1 3.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Bildbeitrag</span>';
    return b;
  }
  function enhance(root){
    (root||document).querySelectorAll(".share-panel").forEach(function(panel){
      if(panel.dataset.darGlobalShareEnhanced==="1")return;panel.dataset.darGlobalShareEnhanced="1";
      var holder=panel.querySelector(".share-flat-v410,.post-after-share")||panel;
      if(!panel.querySelector("[data-image-post-open],[data-image-dua-open],[data-image-ayah-open],[data-dar-global-image]"))holder.appendChild(imageButton());
    });
  }
  document.addEventListener("click",function(ev){
    var t=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-image],[data-image-post-open],[data-image-dua-open],[data-image-ayah-open],[data-frauen-share=\"image\"]"):null;
    if(t){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();createAndShare(t,false);return}
    var ig=ev.target&&ev.target.closest?ev.target.closest("[data-share-instagram],[data-frauen-share=\"ig\"]"):null;
    if(ig){
      var data=ctxFromDom(ig);
      if(data&&clean(data.body)){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();createAndShare(ig,true)}
    }
  },true);
  var mo=new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){for(var j=0;j<ms[i].addedNodes.length;j++){var n=ms[i].addedNodes[j];if(n&&n.nodeType===1)enhance(n)}}});
  function boot(){enhance(document);try{mo.observe(document.getElementById("appView")||document.body,{childList:true,subtree:true})}catch(e){}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.DARGlobalShare={createAndShare:createAndShare,renderFiles:renderFiles,appStoreUrl:APP_STORE_URL,site:SITE};
})();