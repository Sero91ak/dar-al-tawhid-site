(function(){
  "use strict";
  /* LEGACY_DEPLOY_VERIFY_COMPAT: BILDBEITRAG_HISTORICAL_REPAIR_V1247 · HISTORICAL_SHARE_FALLBACKS · superseded by BILDBEITRAG_CURATED_POOL_V1250 */
  /* BILDBEITRAG_CURATED_POOL_V1250 · AI disabled · curated random pool + women-exclusive ownership */
  if(window.__DAR_GLOBAL_SHARE_V1250)return;
  window.__DAR_GLOBAL_SHARE_V1250=true;

  var SITE="dar-al-tawhid.de";
  var W=1080,H=1350;
  var GENERAL_SHARE_IMAGE_POOL=[
    "/kids/assets/prophet-scenes/library.webp",
    "/kids/assets/prophet-scenes/desert.webp",
    "/kids/assets/prophet-scenes/mountain.webp",
    "/kids/assets/prophet-scenes/night.webp",
    "/kids/assets/prophet-scenes/royal.webp",
    "/kids/assets/prophet-scenes/garden.webp",
    "/kids/assets/prophet-scenes/ocean.webp",
    "/kids/assets/prophet-scenes/water.webp"
  ];
  var lastGeneralShareImage="";
  function randomIndex(len){
    if(!len)return 0;
    try{
      if(window.crypto&&window.crypto.getRandomValues){
        var a=new Uint32Array(1);window.crypto.getRandomValues(a);return a[0]%len;
      }
    }catch(e){}
    return Math.floor(Math.random()*len);
  }
  async function generalPoolBackground(){
    if(!GENERAL_SHARE_IMAGE_POOL.length)throw new Error("Kein freigegebener Bildpool verfügbar.");
    var start=randomIndex(GENERAL_SHARE_IMAGE_POOL.length);
    if(GENERAL_SHARE_IMAGE_POOL.length>1&&GENERAL_SHARE_IMAGE_POOL[start]===lastGeneralShareImage)start=(start+1)%GENERAL_SHARE_IMAGE_POOL.length;
    var last=null;
    for(var i=0;i<GENERAL_SHARE_IMAGE_POOL.length;i++){
      var src=GENERAL_SHARE_IMAGE_POOL[(start+i)%GENERAL_SHARE_IMAGE_POOL.length];
      try{
        var image=await loadImage(src+"?share-pool=v1250");
        lastGeneralShareImage=src;
        return image;
      }catch(e){last=e}
    }
    throw last||new Error("Kein freigegebenes Hintergrundbild konnte geladen werden.");
  }

  function clean(s){return String(s||"").replace(/\s+/g," ").trim()}
  function stripUiLabel(value,kind){
    var s=clean(value);
    if(kind==="body")return s.replace(/^(?:AUSSAGE|STATEMENT)\s*[:·–—-]?\s*/i,"").trim();
    if(kind==="source")return s.replace(/^(?:QUELLE|SOURCE|NACHWEISE?)\s*[:·–—-]?\s*/i,"").trim();
    return s;
  }
  function text(el){return el?clean(el.innerText||el.textContent||""):""}
  function first(root,sel){try{return root&&root.querySelector?root.querySelector(sel):null}catch(e){return null}}
  function copyPlainText(text){
    text=String(text||"");
    if(!text){toast("Nichts zum Kopieren");return false}
    var ok=false;
    try{
      var ta=document.createElement("textarea");
      ta.value=text;
      ta.setAttribute("readonly","readonly");
      ta.style.cssText="position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;font-size:16px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try{ta.setSelectionRange(0,text.length)}catch(e1){}
      ok=document.execCommand("copy");
      ta.remove();
    }catch(e){ok=false}
    if(ok){toast("Kopiert");return true}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){toast("Kopiert")}).catch(function(){showCopySheet(text)});
      return true;
    }
    showCopySheet(text);
    return false;
  }
  function showCopySheet(text){
    var old=document.getElementById("darCopySheet");if(old)old.remove();
    var wrap=document.createElement("div");
    wrap.id="darCopySheet";
    wrap.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px";
    var box=document.createElement("div");
    box.style.cssText="width:min(560px,100%);background:#14120f;color:#f6f1e4;border-radius:18px;padding:16px;border:1px solid rgba(239,215,142,.35)";
    var title=document.createElement("div");title.textContent="Text markiert halten und kopieren";title.style.cssText="font-weight:700;margin-bottom:8px";
    var area=document.createElement("textarea");
    area.value=text;area.readOnly=true;
    area.style.cssText="width:100%;min-height:180px;border-radius:12px;padding:10px;background:#0c0b09;color:#f6f1e4;border:1px solid rgba(239,215,142,.25)";
    var close=document.createElement("button");close.type="button";close.textContent="Schließen";
    close.style.cssText="margin-top:10px;width:100%;height:44px;border-radius:12px;border:0;background:#efd78e;color:#1a1408;font-weight:700";
    close.onclick=function(){wrap.remove()};
    box.appendChild(title);box.appendChild(area);box.appendChild(close);wrap.appendChild(box);
    wrap.addEventListener("click",function(ev){if(ev.target===wrap)wrap.remove()});
    document.body.appendChild(wrap);
    area.focus();area.select();
  }
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
    var root=(trigger&&trigger.closest&&trigger.closest(".article,.post-reader,[data-frauen-view],.dua-detail,.quran-ayah,.prophets-detail"))||document.querySelector("#appView .post-reader,#appView .article,#appView .quran-ayah,#appView .prophets-detail")||document.getElementById("appView")||document.body;
    var route=(window.currentRoute&&window.currentRoute.view)||String(location.hash||"").replace(/^#\/?/,"").split("/")[0];
    var title=text(first(root,".post-reader-title h2,.article-title h2,.prophets-detail__name,.view-head h2,.quran-explain-title strong,h1,h2"));
    var category=text(first(root,".post-reader-title .kicker,.article-title .eyebrow,.post-aussage-kicker,.prophets-tab.is-active,.dua-label,.kicker,.eyebrow"))||"Wissen";
    var body="";
    if(route==="dua"||first(root,".dua-detail-box")){
      var ar=text(first(root,".dua-arabic")),de=text(first(root,".dua-de"));body=[ar,de].filter(Boolean).join("\n\n");category="Duʿāʾ";
    }else if(root&&root.classList&&root.classList.contains("prophets-detail")){
      var prophetParts=[];
      root.querySelectorAll(".prophets-chapter .prophets-quote__de,.prophets-chapter p,.prophets-card p").forEach(function(el){
        var value=text(el);if(value&&prophetParts.indexOf(value)<0&&value.length>18)prophetParts.push(value);
      });
      body=prophetParts.slice(0,5).join("\n\n");
      category="Propheten";
    }else{
      body=text(first(root,".post-aussage-text,.post-reader .statement,.statement,.post-slide.is-active .post-slide-quote,.post-slide-quote,.quran-ayah-de,.quran-ayah-ar"));
    }
    var source=text(first(root,"[data-post-after-source],.post-source-main,.post-reader-cite,.hadith-source-line,.prophets-source-panel__meta,.prophets-source-actions,.source-text,.post-after-source,.dua-source,.quran-ayah-ref,.frauen-source-card"));
    if(!source){var srcPanel=first(root,".source-area-panel,.post-source,.frauen-source-card");source=text(srcPanel)}
    body=stripUiLabel(body,"body");
    source=stripUiLabel(source,"source");
    if(!title)title=category||"DĀR AL TAWḤĪD";
    if(!body){
      var share=trigger&&trigger.closest&&trigger.closest(".share-panel");if(share){var t=trigger.getAttribute("data-share-text")||"";try{t=decodeURIComponent(t)}catch(e){}body=clean(t)}
    }
    return {kind:String(route||"post"),category:category||"Wissen",title:title,body:body,source:trimSource(source||"Quelle siehe Beitrag in der App."),url:location.href};
  }


  function adaptiveBodyLayout(ctx,body,maxW,maxH){
    body=stripUiLabel(body||"","body");
    var len=body.length;
    var maxSize=len<=90?72:len<=180?64:len<=320?56:len<=520?49:len<=760?44:40;
    var minSize=len<=180?52:len<=420?42:34;
    var chosen=maxSize,lines=[],lh=0;
    for(var size=maxSize;size>=minSize;size-=2){
      ctx.font="400 "+size+"px Georgia, 'Times New Roman', serif";
      var candidate=wrap(ctx,body,maxW);
      var candidateLh=Math.round(size*1.34);
      if(candidate.length*candidateLh<=maxH){
        chosen=size;lines=candidate;lh=candidateLh;break;
      }
      chosen=size;lines=candidate;lh=candidateLh;
    }
    var per=Math.max(4,Math.floor(maxH/lh));
    var pages=[];
    for(var i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));
    return {size:chosen,lineHeight:lh,pages:pages.length?pages:[[]]};
  }
  async function renderFiles(data){
    var canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;var ctx=canvas.getContext("2d");if(!ctx)return[];
    try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch(e){}
    var bg=await generalPoolBackground();
    var margin=76,contentW=W-margin*2;
    data.body=stripUiLabel(data.body||data.title,"body");
    data.source=stripUiLabel(data.source||"Quelle siehe Beitrag in der App.","source");

    var titleSize=data.title.length>90?40:data.title.length>55?45:50;
    ctx.font="650 "+titleSize+"px Georgia, 'Times New Roman', serif";
    var titleLines=wrap(ctx,data.title,contentW).slice(0,3);
    var titleBottom=150+titleLines.length*Math.round(titleSize*1.14);
    var bodyTop=titleBottom+48;
    var bodyBottom=1100;
    var bodyTextMaxH=Math.max(300,bodyBottom-bodyTop-104);
    var bodyLayout=adaptiveBodyLayout(ctx,data.body,contentW-92,bodyTextMaxH);
    var pages=bodyLayout.pages;
    if(pages.length>8){pages=pages.slice(0,8);pages[7].push("…")}
    var bodySize=bodyLayout.size,lh=bodyLayout.lineHeight;
    var files=[];

    for(var p=0;p<pages.length;p++){
      ctx.clearRect(0,0,W,H);
      if(bg){
        ctx.save();
        try{ctx.filter="saturate(1.08) contrast(1.02) brightness(1.06)"}catch(e){}
        cover(ctx,bg);
        ctx.restore();
      }else{ctx.fillStyle="#0b211d";ctx.fillRect(0,0,W,H)}
      var g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,"rgba(2,13,14,.54)");
      g.addColorStop(.58,"rgba(4,18,19,.31)");
      g.addColorStop(1,"rgba(5,13,16,.20)");
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      var rg=ctx.createRadialGradient(W*.82,H*.18,20,W*.82,H*.18,W*.66);
      rg.addColorStop(0,"rgba(255,225,150,.16)");
      rg.addColorStop(1,"rgba(231,200,123,0)");
      ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);

      ctx.fillStyle="#efd89f";
      ctx.font="700 23px Arial, sans-serif";
      ctx.textAlign="left";
      ctx.fillText("DĀR AL TAWḤĪD",margin,76);
      ctx.strokeStyle="rgba(239,216,159,.62)";
      ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(margin,105);ctx.lineTo(W-margin,105);ctx.stroke();

      var y=158;
      ctx.fillStyle="#fff8e9";
      ctx.font="650 "+titleSize+"px Georgia, 'Times New Roman', serif";
      titleLines.forEach(function(line){ctx.fillText(line,margin,y);y+=Math.round(titleSize*1.14)});
      ctx.strokeStyle="rgba(239,216,159,.62)";
      ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(margin,y+8);ctx.lineTo(margin+210,y+8);ctx.stroke();

      var textH=pages[p].length*lh;
      var maxCardH=Math.max(260,bodyBottom-bodyTop);
      var cardH=Math.min(maxCardH,Math.max(250,textH+128));
      var cardY=bodyTop;
      roundRect(ctx,margin-18,cardY,contentW+36,cardH,26);
      ctx.fillStyle="rgba(2,13,14,.26)";
      ctx.fill();
      ctx.strokeStyle="rgba(239,216,159,.16)";
      ctx.lineWidth=1.1;
      ctx.stroke();

      ctx.fillStyle="#f2d99b";
      ctx.font="800 15px Arial, sans-serif";
      ctx.letterSpacing="2px";
      ctx.fillText("AUSSAGE",margin+18,cardY+39);
      ctx.letterSpacing="0px";

      var quoteY=cardY+92;
      if(textH+128<cardH)quoteY+=Math.round((cardH-(textH+128))/2);
      ctx.font="400 "+bodySize+"px Georgia, 'Times New Roman', serif";
      ctx.fillStyle="#fffdf7";
      ctx.shadowColor="rgba(0,0,0,.46)";
      ctx.shadowBlur=4;
      pages[p].forEach(function(line){
        if(!line){quoteY+=Math.round(lh*.55);return}
        ctx.fillText(line,margin+18,quoteY);
        quoteY+=lh;
      });
      ctx.shadowBlur=0;

      if(pages.length>1){
        ctx.fillStyle="rgba(255,249,235,.68)";
        ctx.font="650 13px Arial, sans-serif";
        ctx.textAlign="right";
        ctx.fillText((p+1)+" / "+pages.length,W-margin-18,cardY+cardH-22);
        ctx.textAlign="left";
      }

      var sy=1130,sh=160;
      roundRect(ctx,margin,sy,contentW,sh,20);
      ctx.fillStyle="rgba(3,14,15,.76)";
      ctx.fill();
      ctx.strokeStyle="rgba(239,216,159,.34)";
      ctx.lineWidth=1.2;
      ctx.stroke();
      ctx.fillStyle="#f2d99b";
      ctx.font="800 15px Arial, sans-serif";
      ctx.fillText("QUELLE",margin+22,sy+29);
      ctx.fillStyle="rgba(255,250,238,.96)";
      ctx.font="550 18px Arial, sans-serif";
      var sl=wrap(ctx,trimSource(data.source),contentW-44).slice(0,3),sly=sy+59;
      sl.forEach(function(line){ctx.fillText(line,margin+22,sly);sly+=27});

      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,"image/png",.97)});
      if(blob)files.push(new File([blob],"dar-al-tawhid-bildbeitrag-"+(p+1)+".png",{type:"image/png"}));
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
          text:SITE
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
    catch(e){console.error("DAR global image share",e);toast(e&&e.message?String(e.message).slice(0,180):"Bildbeitrag konnte nicht erstellt werden.");return false}
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
  function standaloneSharePanel(){
    var section=document.createElement("section");
    section.className="share-panel share-panel-v11 dar-global-injected-panel";
    section.setAttribute("aria-label","Inhalt teilen");
    var title=document.createElement("div");title.className="share-panel-title";title.textContent="Weitergeben";
    var holder=document.createElement("div");holder.className="share-flat-v410";
    holder.appendChild(actionButton("wa","WhatsApp","data-dar-global-wa"));
    holder.appendChild(actionButton("tg","Telegram","data-dar-global-tg"));
    holder.appendChild(actionButton("ig","Instagram","data-dar-global-ig"));
    holder.appendChild(actionButton("native","Teilen","data-dar-global-native"));
    holder.appendChild(imageButton());
    section.appendChild(title);section.appendChild(holder);
    return section;
  }
  function injectStandalonePanels(root){
    var scope=root&&root.querySelectorAll?root:document;
    var targets=[];
    if(scope.matches&&scope.matches(".prophets-detail:not(.prophets-detail--loading)"))targets.push(scope);
    scope.querySelectorAll(".prophets-detail:not(.prophets-detail--loading)").forEach(function(el){targets.push(el)});
    targets.forEach(function(target){
      if(target.querySelector(".share-panel")||target.querySelector(".dar-global-injected-panel"))return;
      if(clean(target.textContent).length<80)return;
      target.appendChild(standaloneSharePanel());
    });
  }
  function enhance(root){
    injectStandalonePanels(root||document);
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
    var frauenOwned=ev.target&&ev.target.closest?ev.target.closest("[data-frauen-share]"):null;
    if(frauenOwned)return; // Frauenbereich besitzt seine Share-Aktionen exklusiv (women-historical Profil).
    var linkBtn=ev.target&&ev.target.closest?ev.target.closest("[data-dar-global-copy-link]"):null;
    if(linkBtn){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      copyPlainText(linkBtn.getAttribute("data-share-url")||location.href);
      return;
    }
    var copyBtn=ev.target&&ev.target.closest?ev.target.closest("[data-share-copy],[data-post-copy],[data-ilm-copy-answer],[data-post-share-channel=\"copy\"]"):null;
    if(copyBtn){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      var raw=copyBtn.getAttribute("data-share-text")||copyBtn.getAttribute("data-copy-text")||"";
      var data=ctxFromDom(copyBtn);
      var payload=raw||(data?sharePayload(data).text:"");
      copyPlainText(payload);
      return;
    }
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
  function ensureShareCardStyle(){
    if(document.getElementById("darShareCardStyleV1233"))return;
    var css='.dar-share-card{position:relative;overflow:hidden;margin:18px 0 12px!important;padding:15px 14px 13px!important;border:1px solid var(--theme-share-btn-border,var(--line))!important;border-radius:22px!important;background:var(--theme-share-panel-bg,radial-gradient(circle at 16% 0%,color-mix(in srgb,var(--gold2,#d9bf79) 9%,transparent),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--card) 94%,transparent),color-mix(in srgb,var(--bg) 93%,transparent)))!important;box-shadow:0 10px 26px rgba(4,14,15,.10),inset 0 1px 0 rgba(255,255,255,.055)!important}'
      +'.dar-share-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 2px 12px}'
      +'.dar-share-head span{display:block;margin-bottom:3px;color:var(--gold2,var(--gold,#d9bf79))!important;-webkit-text-fill-color:var(--gold2,var(--gold,#d9bf79))!important;font-size:8.8px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}'
      +'.dar-share-head h3{margin:0!important;color:var(--ink,var(--text))!important;-webkit-text-fill-color:var(--ink,var(--text))!important;font-family:var(--serif,Georgia,serif)!important;font-size:20px!important;line-height:1.12!important;font-weight:650!important}'
      +'.dar-share-head>p{margin:0;color:var(--muted)!important;-webkit-text-fill-color:var(--muted)!important;font-size:10.5px;line-height:1.3;text-align:right}'
      +'.dar-share-card .dar-share-primary,.dar-share-card .share-flat-v410{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}'
      +'.dar-share-btn{appearance:none;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:78px!important;padding:9px 5px 8px!important;border:1px solid var(--line)!important;border-radius:16px!important;background:color-mix(in srgb,var(--card) 92%,transparent)!important;cursor:pointer}'
      +'.dar-share-btn b{font-size:10.2px!important;line-height:1!important;font-weight:800!important;color:inherit!important;-webkit-text-fill-color:currentColor!important}'
      +'.dar-share-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:color-mix(in srgb,currentColor 8%,transparent)}'
      +'.dar-share-icon svg{width:22px;height:22px;fill:currentColor}'
      +'html[data-theme] .dar-share-btn.wa{color:#18884a!important;-webkit-text-fill-color:#18884a!important;border-color:rgba(37,211,102,.27)!important;background:linear-gradient(145deg,rgba(37,211,102,.115),color-mix(in srgb,var(--card) 90%,transparent))!important}'
      +'html[data-theme] .dar-share-btn.tg{color:#218ac3!important;-webkit-text-fill-color:#218ac3!important;border-color:rgba(42,171,238,.28)!important;background:linear-gradient(145deg,rgba(42,171,238,.11),color-mix(in srgb,var(--card) 90%,transparent))!important}'
      +'html[data-theme] .dar-share-btn.ig{color:#b73570!important;-webkit-text-fill-color:#b73570!important;border-color:rgba(214,41,118,.25)!important;background:linear-gradient(145deg,rgba(214,41,118,.09),color-mix(in srgb,var(--card) 90%,transparent))!important}'
      +'html:is([data-theme="dark"],[data-theme="royal"],[data-theme="bordeaux"],[data-theme="dar-al-layl"]) .dar-share-btn.wa{color:#8ee7ad!important;-webkit-text-fill-color:#8ee7ad!important}'
      +'html:is([data-theme="dark"],[data-theme="royal"],[data-theme="bordeaux"],[data-theme="dar-al-layl"]) .dar-share-btn.tg{color:#9fdcff!important;-webkit-text-fill-color:#9fdcff!important}'
      +'html:is([data-theme="dark"],[data-theme="royal"],[data-theme="bordeaux"],[data-theme="dar-al-layl"]) .dar-share-btn.ig{color:#ffacd2!important;-webkit-text-fill-color:#ffacd2!important}'
      +'.dar-share-tools{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px;margin-top:8px}'
      +'.dar-share-tool{appearance:none;display:grid!important;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:7px;min-height:42px!important;padding:8px 9px!important;border:1px solid var(--line)!important;border-radius:13px!important;background:color-mix(in srgb,var(--card) 74%,transparent)!important;color:var(--ink,var(--text))!important;-webkit-text-fill-color:var(--ink,var(--text))!important;cursor:pointer}'
      +'.dar-share-tool svg{width:19px;height:19px;fill:currentColor}'
      +'.dar-share-tool b{font-size:10px!important;line-height:1.15!important;font-weight:760!important;color:inherit!important;-webkit-text-fill-color:currentColor!important}'
      +'.dar-share-tool--image{border-color:color-mix(in srgb,var(--gold2,#d9bf79) 34%,transparent)!important}'
      +'.dar-share-note{margin:9px 2px 0!important;color:var(--muted)!important;-webkit-text-fill-color:var(--muted)!important;font-size:9.4px!important;line-height:1.4!important}'
      +'html[data-theme] body.is-hadith-route .hadith-detail .post-aussage-text{border-left:2px solid color-mix(in srgb,var(--gold2,#d9bf79) 78%,transparent)!important;padding-left:14px!important}'
      +'@media(max-width:420px){.dar-share-head>p{display:none}.dar-share-head h3{font-size:18px!important}}';
    var tag=document.createElement("style");tag.id="darShareCardStyleV1233";tag.textContent=css;document.head.appendChild(tag);
  }
  function boot(){ensureShareCardStyle();enhance(document);try{mo.observe(document.getElementById("appView")||document.body,{childList:true,subtree:true})}catch(e){}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.darCopyText=copyPlainText;
  window.DARGlobalShare={version:"1250",createAndShare:createAndShare,renderFiles:renderFiles,copyText:copyPlainText,site:SITE,imageMode:"curated-pool-only",poolSize:GENERAL_SHARE_IMAGE_POOL.length};
})();