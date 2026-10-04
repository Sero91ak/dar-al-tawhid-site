(function(){
  "use strict";
  if(window.__DAR_GLOBAL_SHARE_V1230)return;
  window.__DAR_GLOBAL_SHARE_V1230=true;

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
    "/kids/assets/kids-cinema/runtime/scene-1.webp",
    "/kids/assets/kids-cinema/runtime/scene-2.webp",
    "/kids/assets/kids-cinema/runtime/scene-3.webp",
    "/assets/post-templates/bibliothek-braun.jpg",
    "/assets/post-templates/nachtblau-buecher.jpg",
    "/assets/post-templates/gruen-moschee.jpg",
    "/assets/post-templates/sand-buecher.jpg",
    "/assets/post-templates/olive-mihrab.jpg",
    "/assets/post-templates/nacht-mond.jpg",
    "/assets/post-templates/petrol-pflanze.jpg",
    "/assets/post-templates/buecher-teal.jpg",
    "/kids/assets/sahaba-mubashshirun/abu-bakr.jpg",
    "/kids/assets/sahaba-mubashshirun/umar.jpg",
    "/kids/assets/sahaba-mubashshirun/uthman.jpg",
    "/kids/assets/sahaba-mubashshirun/ali.jpg",
    "/kids/assets/sahaba-mubashshirun/talha.jpg",
    "/kids/assets/sahaba-mubashshirun/zubayr.jpg",
    "/kids/assets/sahaba-mubashshirun/sad.jpg",
    "/kids/assets/sahaba-mubashshirun/said.jpg",
    "/kids/assets/sahaba-mubashshirun/abu-ubaydah.jpg",
    "/kids/assets/sahaba-mubashshirun/abd-ar-rahman.jpg"
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
    var source=text(first(root,"[data-post-after-source],.post-source-main,.post-reader-cite,.hadith-source-line,.source-text,.post-after-source,.dua-source,.quran-ayah-ref,.frauen-source-card"));
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
    var sahabaAny=[
      "/kids/assets/sahaba-mubashshirun/abu-bakr.jpg",
      "/kids/assets/sahaba-mubashshirun/umar.jpg",
      "/kids/assets/sahaba-mubashshirun/uthman.jpg",
      "/kids/assets/sahaba-mubashshirun/ali.jpg",
      "/kids/assets/sahaba-mubashshirun/talha.jpg",
      "/kids/assets/sahaba-mubashshirun/zubayr.jpg",
      "/kids/assets/sahaba-mubashshirun/sad.jpg",
      "/kids/assets/sahaba-mubashshirun/said.jpg",
      "/kids/assets/sahaba-mubashshirun/abu-ubaydah.jpg",
      "/kids/assets/sahaba-mubashshirun/abd-ar-rahman.jpg"
    ];
    var makkah=["/kids/assets/prophet-scenes/desert.webp","/kids/assets/prophet-scenes/mountain.webp","/assets/post-templates/sand-buecher.jpg","/kids/assets/prophet-scenes/royal.webp","/kids/assets/kids-cinema/runtime/scene-1.webp"];
    var madinah=["/kids/assets/prophet-scenes/garden.webp","/kids/assets/prophet-scenes/royal.webp","/assets/post-templates/gruen-moschee.jpg","/assets/post-templates/olive-mihrab.jpg","/kids/assets/kids-cinema/runtime/scene-2.webp"];
    var ilm=["/kids/assets/prophet-scenes/library.webp","/assets/post-templates/bibliothek-braun.jpg","/assets/post-templates/nachtblau-buecher.jpg","/assets/post-templates/buecher-teal.jpg","/kids/assets/prophet-scenes/night.webp","/kids/assets/kids-cinema/runtime/scene-3.webp"];
    var quran=["/assets/post-templates/buecher-teal.jpg","/assets/post-templates/nachtblau-buecher.jpg","/kids/assets/prophet-scenes/night.webp","/kids/assets/prophet-scenes/library.webp"];
    var dua=["/kids/assets/prophet-scenes/night.webp","/kids/assets/prophet-scenes/garden.webp","/assets/post-templates/nacht-mond.jpg","/assets/post-templates/olive-mihrab.jpg"];
    var family=["/kids/assets/prophet-scenes/garden.webp","/kids/assets/prophet-scenes/water.webp","/assets/post-templates/olive-mihrab.jpg","/kids/assets/prophet-scenes/library.webp"];
    var ramadan=["/kids/assets/prophet-scenes/night.webp","/assets/post-templates/nacht-mond.jpg","/assets/post-templates/gruen-moschee.jpg","/kids/assets/prophet-scenes/royal.webp"];
    var pool=GENERIC_SCENES;
    if(/ṣaḥāb|sahab|salaf|gefährten|gefaehrten/.test(hay))pool=sahabaAny;
    else if(/makkah|mekka|ḥajj|hajj|ʿumrah|umrah|kaʿba|kaaba/.test(hay))pool=makkah;
    else if(/madīnah|madinah|medina|masjid|moschee/.test(hay))pool=madinah;
    else if(/ramaḍān|ramadan|qiyām|qiyam|iʿtikāf|itikaf/.test(hay))pool=ramadan;
    else if(/qurʾān|quran|āyah|ayah|sūrah|surah/.test(hay))pool=quran;
    else if(/duʿā|dua|dhikr|adhkār|adhkar/.test(hay))pool=dua;
    else if(/ehe|nikāḥ|nikah|familie|kinder|töchter|toechter|schwangerschaft|stillzeit|nifās|nifas/.test(hay))pool=family;
    else if(/ʿilm|ilm|wissen|fiqh|ḥadī|hadith|sunnah|quelle|gelehrt/.test(hay))pool=ilm;
    var key="darGlobalShareSceneV1231",seq=0;try{seq=Number(localStorage.getItem(key)||0)||0;localStorage.setItem(key,String(seq+1))}catch(e){}
    return pool[(hash(hay+"|"+seq))%pool.length];
  }
  function splitBody(ctx,body,bodySize,maxW,maxH){
    ctx.font="400 "+bodySize+"px Georgia, 'Times New Roman', serif";
    var lines=wrap(ctx,body,maxW),lh=Math.round(bodySize*1.42),per=Math.max(5,Math.floor(maxH/lh)),pages=[];
    for(var i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));return pages.length?pages:[[]];
  }
  async function drawBadge(ctx){
    var x=700,y=1238,w=310,h=72;
    roundRect(ctx,x,y,w,h,15);ctx.fillStyle="rgba(7,12,12,.62)";ctx.fill();ctx.strokeStyle="rgba(236,211,148,.48)";ctx.lineWidth=1.5;ctx.stroke();
    var icon=null;try{icon=await loadImage(APP_STORE_ICON)}catch(e){}
    if(icon){ctx.save();roundRect(ctx,x+10,y+10,52,52,12);ctx.clip();ctx.drawImage(icon,x+10,y+10,52,52);ctx.restore()}
    else{ctx.fillStyle="#f0d797";ctx.font="700 28px Arial";ctx.fillText("A",x+22,y+40)}
    ctx.fillStyle="rgba(255,249,233,.68)";ctx.font="800 10px Arial, sans-serif";ctx.fillText("JETZT IM",x+74,y+19);
    ctx.fillStyle="#fff9e9";ctx.font="700 19px Arial, sans-serif";ctx.fillText("App Store",x+74,y+43);
    ctx.fillStyle="rgba(255,249,233,.72)";ctx.font="650 10px Arial, sans-serif";ctx.fillText("DĀR AL TAWḤĪD",x+74,y+59);
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
    var bodySize=data.body.length>900?34:data.body.length>620?38:42;
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
      ctx.strokeStyle="rgba(239,216,159,.62)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(margin,y+8);ctx.lineTo(margin+210,y+8);ctx.stroke();
      y+=62;

      ctx.font="400 "+bodySize+"px Georgia, 'Times New Roman', serif";ctx.fillStyle="#fffdf5";ctx.shadowColor="rgba(0,0,0,.45)";ctx.shadowBlur=4;var lh=Math.round(bodySize*1.42);
      ctx.strokeStyle="rgba(239,216,159,.72)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(margin-18,y-10);ctx.lineTo(margin-18,Math.min(bodyBottom,y+pages[p].length*lh));ctx.stroke();
      pages[p].forEach(function(line){if(!line){y+=Math.round(lh*.55);return}ctx.fillText(line,margin,y);y+=lh});ctx.shadowBlur=0;

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
        var payload={files:files,title:data.title+" · DĀR AL TAWḤĪD",text:"DĀR AL TAWḤĪD · "+SITE+"\nApp Store: "+APP_STORE_URL};
        if(!navigator.canShare||navigator.canShare({files:files})){await navigator.share(payload);return true}
        if(!navigator.canShare||navigator.canShare({files:[files[0]]})){await navigator.share({files:[files[0]],title:payload.title,text:payload.text});return true}
      }
    }catch(e){if(e&&e.name==="AbortError")return true}
    try{
      var h=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darShareImage;
      if(h&&typeof h.postMessage==="function"){
        /* GLOBAL_SHARE_MULTI_NATIVE_V1226 */
        var dataUrls=[];
        for(var ni=0;ni<files.length;ni++){
          var fr=new FileReader();
          var dataUrl=await new Promise(function(resolve,reject){
            fr.onload=function(){resolve(String(fr.result||""))};
            fr.onerror=reject;
            fr.readAsDataURL(files[ni]);
          });
          dataUrls.push(dataUrl);
        }
        h.postMessage({
          dataUrl:dataUrls[0]||"",
          dataUrls:dataUrls,
          filename:files[0].name,
          filenames:files.map(function(f){return f.name}),
          title:data.title+" · DĀR AL TAWḤĪD",
          text:"dar-al-tawhid.de\nApp Store: "+APP_STORE_URL
        });
        return true;
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
  /* GLOBAL_SHARE_ACTIONS_V1227 · einheitliche Share-Aktionen in Besucher- und Test-App */
  function shareSvg(kind){
    if(kind==="wa")return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.84 9.84 0 0 0-8.46 14.86L2 22l5.3-1.39A9.98 9.98 0 1 0 12.04 2Zm0 17.96a8.1 8.1 0 0 1-4.12-1.13l-.3-.18-3.15.83.84-3.07-.2-.31a8.06 8.06 0 1 1 6.93 3.86Zm4.43-6.04c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28Z"/></svg>';
    if(kind==="tg")return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.65 3.25 18.5 20.1c-.24 1.19-.88 1.48-1.78.92l-4.8-3.54-2.32 2.23c-.26.26-.47.47-.97.47l.35-4.89 8.9-8.04c.39-.35-.08-.54-.6-.19L6.28 14l-4.74-1.48c-1.03-.32-1.05-1.03.21-1.52L20.28 3.86c.86-.32 1.61.19 1.37 1.39Z"/></svg>';
    if(kind==="ig")return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 3.1a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 2.2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm5.3-2.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/></svg>';
    if(kind==="native")return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0-11 4 4m-4-4L8 7M5 11v8h14v-8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM7 15l3-3 2 2 3-4 2 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="9" r="1.2"/></svg>';
  }
  function actionButton(kind,label,attr){
    var b=document.createElement("button");
    b.type="button";
    b.className="share-btn dar-global-share-action dar-global-share-"+kind;
    b.setAttribute(attr||("data-dar-global-"+kind),"1");
    b.innerHTML='<span class="dar-global-share-icon">'+shareSvg(kind)+'</span><span>'+label+'</span>';
    return b;
  }
  function sharePayload(data){
    data=data||{};
    var lines=["DĀR AL TAWḤĪD"];
    if(clean(data.title))lines.push(clean(data.title));
    if(clean(data.body))lines.push(clean(data.body));
    if(clean(data.source))lines.push("Quelle: "+trimSource(data.source));
    lines.push(SITE);
    lines.push("App Store: "+APP_STORE_URL);
    return {title:(clean(data.title)||"DĀR AL TAWḤĪD")+" · DĀR AL TAWḤĪD",text:lines.join("\n\n"),url:data.url||location.href};
  }
  async function nativeTextShare(data){
    var p=sharePayload(data);
    if(navigator.share){
      try{await navigator.share({title:p.title,text:p.text,url:p.url});return true}catch(e){if(e&&e.name==="AbortError")return true}
    }
    try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(p.text+"\n\n"+p.url);toast("Text und Link kopiert");return true}}catch(e2){}
    return false;
  }
  function panelHas(panel,kind){
    if(kind==="wa")return !!panel.querySelector('[data-dar-global-wa],a[href*="wa.me"],a[href*="whatsapp"],.share-btn.wa');
    if(kind==="tg")return !!panel.querySelector('[data-dar-global-tg],a[href*="t.me/share"],.share-btn.tg');
    if(kind==="ig")return !!panel.querySelector('[data-dar-global-ig],[data-share-instagram],[data-frauen-share="ig"],.share-btn.ig');
    if(kind==="native")return !!panel.querySelector('[data-dar-global-native],[data-share-native],[data-frauen-share="native"],.share-btn.native');
    if(kind==="image")return !!panel.querySelector('[data-image-post-open],[data-image-dua-open],[data-image-ayah-open],[data-image-hadith-open],[data-dar-global-image],[data-frauen-share="image"]');
    return false;
  }

  function imageButton(){
    var b=document.createElement("button");b.type="button";b.className="share-btn image-post dar-global-image-btn";b.setAttribute("data-dar-global-image","1");
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><path d="M6.5 16l3.4-3.4 2.6 2.5 2.1-2.2 3.1 3.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Bildbeitrag</span>';
    return b;
  }
  function enhance(root){
    (root||document).querySelectorAll(".share-panel").forEach(function(panel){
      var holder=panel.querySelector(".share-flat-v410,.post-after-share,.frauen-share-primary")||panel;
      if(!panelHas(panel,"wa"))holder.appendChild(actionButton("wa","WhatsApp","data-dar-global-wa"));
      if(!panelHas(panel,"tg"))holder.appendChild(actionButton("tg","Telegram","data-dar-global-tg"));
      if(!panelHas(panel,"ig"))holder.appendChild(actionButton("ig","Instagram","data-dar-global-ig"));
      if(!panelHas(panel,"native"))holder.appendChild(actionButton("native","Teilen","data-dar-global-native"));
      if(!panelHas(panel,"image"))holder.appendChild(imageButton());
      panel.dataset.darGlobalShareEnhanced="1";
    });
  }
  document.addEventListener("click",function(ev){
    var wa=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-wa]"):null;
    if(wa){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      var wd=ctxFromDom(wa),wp=sharePayload(wd);window.open("https://wa.me/?text="+encodeURIComponent(wp.text+"\n\n"+wp.url),"_blank","noopener,noreferrer");return;
    }
    var tg=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-tg]"):null;
    if(tg){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      var td=ctxFromDom(tg),tp=sharePayload(td);window.open("https://t.me/share/url?url="+encodeURIComponent(tp.url)+"&text="+encodeURIComponent(tp.text),"_blank","noopener,noreferrer");return;
    }
    var nt=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-native]"):null;
    if(nt){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();nativeTextShare(ctxFromDom(nt));return;
    }
    var gi=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-ig]"):null;
    if(gi){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();createAndShare(gi,true);return;
    }
    var t=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-image],[data-image-post-open],[data-image-dua-open],[data-image-ayah-open],[data-image-hadith-open],[data-frauen-share=\"image\"]"):null;
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
  window.DARGlobalShare={version:"1231",createAndShare:createAndShare,renderFiles:renderFiles,appStoreUrl:APP_STORE_URL,site:SITE};
})();