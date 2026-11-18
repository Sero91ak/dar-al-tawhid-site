/* DAR_FRAUEN_ENTRY_LOCALE_V1
 * Localize a canonical FRAUEN contribution by its existing "kennung".
 * Never create Q URLs or numbers, duplicate posts, or change source hrefs.
 * Frozen Frauen renderer/hero/layout remain unchanged.
 */
(function (w,d) {
  "use strict";
  if(w.__DAR_FRAUEN_ENTRY_LOCALE_V1)return;
  w.__DAR_FRAUEN_ENTRY_LOCALE_V1=true;
  var URI="/assets/frauen/frauen-entry-locales-v1.json?v=20261118-batch16-learning";
  var KEY="darAdultPreferredLocaleV1";
  var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  var manifest=null,loading=false,scheduled=false;
  var rootSelector=".dar-frauen-production-root";
  function norm(code) {
    code=String(code||"").trim().toLowerCase().replace(/_/g,"-");
    if(code==="kr")code="ku";
    if(code==="ku-sorani")code="ckb";
    if(CODES.indexOf(code)<0&&code.indexOf("-")>=0){
      var primary=code.split("-")[0];
      if(CODES.indexOf(primary)>=0)code=primary;
    }
    return CODES.indexOf(code)>=0?code:"";
  }
  function selected() {
    var query="";
    try{query=norm(new URL(w.location.href).searchParams.get("lang")||"")}catch(_){}
    if(query)return query;
    try{return norm(w.localStorage.getItem(KEY))||"de"}catch(_){return"de"}
  }
  function visibleRoot(){
    var live=d.querySelector(rootSelector);
    if(live)return live;
    try{
      var desktop=d.getElementById("womenApp"),route=w.readRoute&&w.readRoute();
      if(desktop&&route&&route.view==="frauen")return desktop;
    }catch(_){}
    return null;
  }
  function readId() {
    try {
      var route=(w.location.hash||"").replace(/^#\/?/,"");
      var parts=route.split("/").map(function(x){try{return decodeURIComponent(x)}catch(_){return x}});
      if(parts[0]==="frauen"&&parts.length===3)return parts[2];
      var desktop=w.readRoute&&w.readRoute();
      if(desktop&&desktop.view==="frauen"){
        var sub=String(desktop.value||"").split("/");
        if(sub.length===2)return sub[1];
      }
    }catch(_){}
    return "";
  }
  function set(el,value) {
    if(!el||value==null)return;
    var text=String(value);
    if(el.textContent!==text)el.textContent=text;
  }
  function text(container,selector,value){if(container)set(container.querySelector(selector),value)}
  function active(id) {
    if(!manifest||!manifest.entries)return null;
    var e=manifest.entries[id],l=e&&e.locales;
    var code=selected();
    if(!e||!l||!l[code])return null; // Incomplete languages are not silently fabricated.
    if(e.id!==id)return null;
    return {entry:e,pack:l[code],code:code};
  }
  // Read-only bridge for image-share exports: the visual canvas must receive
  // exactly the same selected-language pack as the card and detail reader.
  // Never expose draft IDs that do not exist in the canonical catalog.
  w.DARFrauenEntryLocaleV1=Object.freeze({
    current:function(id){
      var item=active(String(id||""));
      if(!item)return null;
      return Object.freeze({
        id:item.entry.id,
        area:item.entry.area,
        lang:item.code,
        dir:item.code==="ar"||item.code==="ckb"?"rtl":"ltr",
        title:item.pack.title,
        statement:item.pack.statement,
        source:item.pack.source,
        statementLabel:(item.pack.labels||{}).statement||"",
        sourceLabel:(item.pack.labels||{}).source||""
      });
    }
  });
  var LEARN_LABELS={
    de:"Lernbereich öffnen · 4 Verständnisfragen",
    ar:"فتح قسم التعلّم · أربعة أسئلة للفهم",
    en:"Open learning area · 4 comprehension questions",
    tr:"Öğrenme bölümünü aç · 4 anlama sorusu",
    ku:"Beşa fêrbûnê veke · 4 pirsên têgihiştinê",
    ckb:"کردنەوەی بەشی فێربوون · ٤ پرسیاری تێگەیشتن",
    bs:"Otvori lekciju · 4 pitanja za razumijevanje",
    fr:"Ouvrir le module · 4 questions de compréhension",
    es:"Abrir la lección · 4 preguntas de comprensión"
  };
  function attachLearningButton(article,item){
    // No new canonical Q route and no duplicated post. Existing adult app
    // intercepts /lernen/ and opens it in the mounted internal reader.
    var area=article.querySelector(".post-reader-main");
    if(!area||!d.createElement)return;
    var link=area.querySelector("[data-dar-frauen-learning-cta]");
    if(!link&&(!area.appendChild||!d.head))return;
    if(!link){
      link=d.createElement("a");link.className="dar-frauen-learning-cta";
      link.setAttribute("data-dar-frauen-learning-cta","");
      link.setAttribute("aria-label","Lernbereich zum aktuellen Frauenbeitrag");
      var source=area.querySelector(".post-source-module");
      if(source&&source.insertAdjacentElement)source.insertAdjacentElement("afterend",link);
      else area.appendChild(link);
      if(!d.getElementById("darFrauenLearningCtaStylesV1")){
        var style=d.createElement("style");style.id="darFrauenLearningCtaStylesV1";
        style.textContent="article.post-reader .dar-frauen-learning-cta{display:flex;align-items:center;justify-content:center;text-align:center;gap:7px;width:100%;min-height:52px;margin:14px 0;padding:13px 17px;border:1px solid var(--gold2,#b69c70);border-radius:16px;background:color-mix(in srgb,var(--card,#182b24) 86%,#bd9c56 14%);color:var(--text,#f5ebd7);font:750 clamp(13px,3.7vw,17px)/1.3 system-ui,sans-serif;text-decoration:none;overflow-wrap:anywhere}article.post-reader .dar-frauen-learning-cta:focus-visible{outline:3px solid #b89457;outline-offset:3px}@media(prefers-reduced-motion:no-preference){article.post-reader .dar-frauen-learning-cta{transition:border-color .15s ease,transform .15s ease}article.post-reader .dar-frauen-learning-cta:active{transform:scale(.99)}}";
        d.head.appendChild(style);
      }
    }
    link.href="/lernen/frauen-wissen/?id="+encodeURIComponent(item.entry.id)+"&lang="+encodeURIComponent(item.code);
    link.lang=item.code;link.dir=(item.code==="ar"||item.code==="ckb")?"rtl":"ltr";
    link.textContent=LEARN_LABELS[item.code];
    link.setAttribute("aria-label",LEARN_LABELS[item.code]);
  }
  function applyOneArticle(article,item){
    var p=item.pack,lab=p.labels||{},code=item.code;
    var dir=code==="ar"||code==="ckb"?"rtl":"ltr";
    article.lang=code;article.dir=dir;
    article.setAttribute("data-dar-frauen-content-id",item.entry.id);
    article.setAttribute("data-dar-frauen-locale",code);
    text(article,".post-reader-title h2",p.title);
    text(article,".post-reader-title .kicker",lab.area);
    text(article,".statement.post-aussage .post-aussage-kicker",lab.statement);
    text(article,".post-aussage-text",p.statement);
    text(article,".post-key-message[data-post-fazit] h3",lab.lesson);
    text(article,".post-key-message[data-post-fazit] .post-fazit-body",p.lesson);
    text(article,".post-source-module .post-reader-cite > b",lab.source);
    text(article,".post-source-module [data-post-after-source]",p.source);
    text(article,".post-source-module .frauen-oval__kicker",lab.proof);
    text(article,".frauen-direktnachweis",lab.open);
    text(article,".frauen-open-btn",lab.back);
    text(article,".frauen-share-head > div > span",lab.shareTop);
    text(article,".frauen-share-head h3",lab.share);
    text(article,".frauen-share-head > p",lab.shareHint);
    text(article,"[data-frauen-share='copy-text'] b",lab.copyText);
    text(article,"[data-frauen-share='copy-link'] b",lab.copyLink);
    text(article,"[data-frauen-share='image'] b",lab.image);
    text(article,"[data-frauen-share='native'] b",lab.shareButton);
    text(article,".frauen-share-note",lab.shareNote);
    var aria={wa:lab.waAria,tg:lab.tgAria,ig:lab.igAria,native:lab.nativeAria};
    Object.keys(aria).forEach(function(k){
      var btn=article.querySelector('[data-frauen-share="'+k+'"]');
      if(btn&&aria[k]&&btn.getAttribute("aria-label")!==aria[k])btn.setAttribute("aria-label",aria[k]);
    });
    // The only citation link is the original direct source, identical in every locale.
    var citation=article.querySelector("a.frauen-direktnachweis[href]");
    if(citation && citation.getAttribute("href")!==item.entry.sourceUrl){
      citation.setAttribute("href",item.entry.sourceUrl);
      citation.target="_blank";citation.rel="noopener noreferrer";
    }
    // Editorial explanation is NOT passed off as a classical scholar quotation.
    var area=article.querySelector(".post-reader-main"),explanation=area&&area.querySelector("[data-dar-frauen-local-sharh]");
    if(area&&p.sharh) {
      if(!explanation){
        explanation=d.createElement("section");explanation.className="post-key-message";
        explanation.setAttribute("data-dar-frauen-local-sharh","");
        var h=d.createElement("h3"),body=d.createElement("div");
        body.className="post-fazit-body";explanation.append(h,body);
        var source=area.querySelector(".post-source-module");
        if(source)area.insertBefore(explanation,source);else area.appendChild(explanation);
      }
      text(explanation,"h3",lab.sharh);
      text(explanation,".post-fazit-body",p.sharh);
    }
    attachLearningButton(article,item);
  }
  function applyOneCard(card,item) {
    var p=item.pack,lab=p.labels||{},code=item.code;
    card.lang=code;card.dir=(code==="ar"||code==="ckb"?"rtl":"ltr");
    card.setAttribute("data-dar-frauen-content-id",item.entry.id);
    card.setAttribute("data-dar-frauen-locale",code);
    text(card,".post-row__body h3",p.title);
    text(card,".frauen-row__aussage",p.preview||p.statement);
    text(card,".frauen-row__quelle",p.source);
    text(card,".post-row__meta span:first-child",lab.area);
    text(card,".post-row__meta span:last-child",lab.status);
    // Keep source route, card data-value and speaker identity as originally authored.
  }
  function apply() {
    var root=visibleRoot();
    if(!root||!manifest)return;
    var id=readId(),detail=root.querySelector("article.post-reader");
    if(detail&&id){
      var value=active(id);
      if(value)applyOneArticle(detail,value);
    }
    var cards=root.querySelectorAll('.frauen-post-row[data-nav="frauen"][data-value]');
    for(var i=0;i<cards.length;i++){
      var key=String(cards[i].getAttribute("data-value")||"").split("/").pop();
      var translated=active(key);
      if(translated)applyOneCard(cards[i],translated);
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    var raf=w.requestAnimationFrame||function(fn){Promise.resolve().then(fn)};
    raf(function(){scheduled=false;attach();apply()});
  }
  function load(){
    if(loading||manifest)return;
    loading=true;
    w.fetch(URI,{cache:"no-store"}).then(function(resp){if(!resp.ok)throw Error("Frauen locale catalog HTTP "+resp.status);return resp.json()})
      .then(function(data){
        if(data.schemaVersion!==1||!data.entries||!Array.isArray(data.languages)||
          CODES.some(function(l){return data.languages.indexOf(l)<0}))throw Error("Invalid women locale catalog");
        for(var id in data.entries) {
          var e=data.entries[id];
          if(!e||e.id!==id||!e.sourceUrl||CODES.some(function(c){var x=e.locales&&e.locales[c];return !x||!x.title||!x.statement||!x.lesson||!x.sharh||!x.source})) {
            throw Error("Incomplete nine-language women entry: "+id);
          }
        }
        manifest=data;schedule();
      })
      .catch(function(e){try{console.warn("DAR Frauen locale overlay unavailable",e)}catch(_){} })
      .finally(function(){loading=false});
  }
  /* Isolated localized image share; the canonical/frozen Frauen renderer is unchanged.
     The same pack currently visible in the reader is the sole text source.
     No external export API or subscription service is called. */
  function imgWrap(ctx,value,maxWidth){
    var result=[];
    String(value||"").split(/\n/).forEach(function(paragraph){
      var words=paragraph.trim().split(/\s+/).filter(Boolean),line="";
      if(!words.length){result.push("");return}
      words.forEach(function(word){
        var next=line?line+" "+word:word;
        if(line&&ctx.measureText(next).width>maxWidth){result.push(line);line=word}
        else line=next;
      });
      if(line)result.push(line);
    });
    return result;
  }
  function imgRounded(ctx,x,y,width,height,r){
    if(typeof ctx.roundRect==="function"){
      ctx.beginPath();ctx.roundRect(x,y,width,height,r);return;
    }
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+width,y,x+width,y+height,r);
    ctx.arcTo(x+width,y+height,x,y+height,r);
    ctx.arcTo(x,y+height,x,y,r);ctx.arcTo(x,y,x+width,y,r);ctx.closePath();
  }
  function imgLoad(url){
    return new Promise(function(resolve){
      try{
        var img=new w.Image();
        img.onload=function(){resolve(img)};
        img.onerror=function(){resolve(null)};
        img.src=url;
      }catch(e){resolve(null)}
    });
  }
  async function localImageExport(item,instagramIntent){
    var p=item.pack,lab=p.labels||{},rtl=item.code==="ar"||item.code==="ckb";
    var W=1080,H=1350,m=76,x=rtl?W-m:m,inner=rtl?W-m-20:m+20;
    var canvas=d.createElement("canvas");canvas.width=W;canvas.height=H;
    var ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas nicht verfügbar");
    var brand=await imgLoad("/watermark-my-logo-full.png?share-brand=v1275");
    var badge=await imgLoad("/assets/app-store-badge-de-official.svg?share-brand=v1275");
    var backgrounds=["/assets/frauen/share-v1292/01.webp","/assets/frauen/share-v1292/02.webp","/assets/frauen/share-v1292/03.webp"];
    var photo=null;
    for(var i=0;i<backgrounds.length&&!photo;i++)photo=await imgLoad(backgrounds[i]);
    try{if(d.fonts&&d.fonts.ready)await d.fonts.ready}catch(_){}
    var titleSize=p.title.length>86?35:p.title.length>55?40:46;
    ctx.font="600 "+titleSize+"px Georgia, serif";
    var titleLines=imgWrap(ctx,p.title,W-2*m);
    var textSize=String(p.statement).length>750?36:String(p.statement).length>400?40:46;
    ctx.font="400 "+textSize+"px Georgia, serif";
    var lines=imgWrap(ctx,p.statement,W-2*m-44);
    var titleHeight=Math.min(220,titleLines.length*(titleSize+11));
    var contentTop=176+titleHeight+20,contentEnd=1082;
    var lineHeight=Math.round(textSize*1.39),linesPerPage=Math.max(3,Math.floor((contentEnd-contentTop-120)/lineHeight));
    var pages=[];
    for(var j=0;j<lines.length;j+=linesPerPage)pages.push(lines.slice(j,j+linesPerPage));
    if(!pages.length)pages.push([""]);
    var files=[];
    for(var page=0;page<pages.length;page++){
      ctx.clearRect(0,0,W,H);ctx.direction="ltr";ctx.textAlign="left";
      ctx.fillStyle="#0b211d";ctx.fillRect(0,0,W,H);
      if(photo){
        var iw=photo.naturalWidth||photo.width,ih=photo.naturalHeight||photo.height;
        if(iw&&ih){var scale=Math.max(W/iw,H/ih),dw=iw*scale,dh=ih*scale;
          ctx.drawImage(photo,(W-dw)/2,(H-dh)/2,dw,dh);}
      }
      var overlay=ctx.createLinearGradient(0,0,W,H);
      overlay.addColorStop(0,"rgba(2,13,17,.85)");
      overlay.addColorStop(1,"rgba(4,20,18,.82)");
      ctx.fillStyle=overlay;ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#efd89f";ctx.font="700 25px Arial, sans-serif";
      ctx.fillText("DĀR AL TAWḤĪD",m,69);
      ctx.strokeStyle="rgba(239,216,159,.55)";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(m,101);ctx.lineTo(W-m,101);ctx.stroke();
      ctx.direction=rtl?"rtl":"ltr";ctx.textAlign=rtl?"right":"left";
      ctx.fillStyle="#fff7e7";ctx.font="600 "+titleSize+"px Georgia, serif";
      titleLines.forEach(function(line,n){ctx.fillText(line,x,160+n*(titleSize+11))});
      var y=176+titleHeight;
      imgRounded(ctx,m-15,y-16,W-2*m+30,Math.max(260,contentEnd-y),25);
      ctx.fillStyle="rgba(3,15,15,.48)";ctx.fill();
      ctx.strokeStyle="rgba(239,216,159,.28)";ctx.stroke();
      ctx.fillStyle="#efd89f";ctx.font="700 16px Arial, sans-serif";
      ctx.fillText(lab.statement||"AUSSAGE",inner,y+24);
      ctx.fillStyle="#fff9e9";ctx.font="400 "+textSize+"px Georgia, serif";
      pages[page].forEach(function(line,k){if(line)ctx.fillText(line,inner,y+86+k*lineHeight)});
      var footerY=1110;
      imgRounded(ctx,m,footerY,W-2*m,145,20);
      ctx.fillStyle="rgba(3,15,15,.78)";ctx.fill();
      ctx.strokeStyle="rgba(239,216,159,.29)";ctx.stroke();
      ctx.fillStyle="#e9cf91";ctx.font="700 16px Arial, sans-serif";
      ctx.fillText(lab.source||"QUELLE",inner,footerY+28);
      ctx.fillStyle="#fff8e9";ctx.font="400 19px Arial, sans-serif";
      var sourceLines=imgWrap(ctx,p.source,W-2*m-48);
      sourceLines.slice(0,4).forEach(function(line,k){ctx.fillText(line,inner,footerY+56+k*24)});
      if(pages.length>1){ctx.fillStyle="#e9cf91";ctx.font="600 15px Arial, sans-serif";ctx.fillText((page+1)+" / "+pages.length,rtl?m+20:W-m-20,1088);}
      ctx.direction="ltr";ctx.textAlign="left";
      ctx.strokeStyle="rgba(239,216,159,.48)";ctx.beginPath();ctx.moveTo(m,1284);ctx.lineTo(W-m,1284);ctx.stroke();
      ctx.fillStyle="#fff8e9";ctx.font="600 21px Georgia, serif";
      ctx.fillText("dar-al-tawhid.de",m+18,1324);
      if(brand){ctx.save();ctx.beginPath();ctx.arc(W-m-54,58,42,0,Math.PI*2);ctx.clip();ctx.drawImage(brand,W-m-96,16,84,84);ctx.restore()}
      if(badge)ctx.drawImage(badge,W-m-162,1294,162,54);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,"image/png",.96)});
      if(!blob)throw Error("Bildexport konnte nicht erstellt werden");
      files.push(new w.File([blob],"dar-al-tawhid-frauen-"+(page+1)+".png",{type:"image/png"}));
    }
    var nav=w.navigator||{};
    if(typeof nav.share==="function"&&(!nav.canShare||nav.canShare({files:files}))){
      try{await nav.share({files:files});return true}catch(e){if(e&&e.name==="AbortError")return true;}
    }
    var ios=w.webkit&&w.webkit.messageHandlers&&w.webkit.messageHandlers.darShareImage;
    // Native bridge transports one image only. Never silently share the last
    // page of a multi-page hadith as if it were the complete statement.
    if(ios&&typeof ios.postMessage==="function"&&files.length===1){
      var dataUrl=canvas.toDataURL("image/png");
      ios.postMessage({dataUrl:dataUrl,filename:"dar-al-tawhid-frauen.png",title:p.title});
      return true;
    }
    if(typeof nav.share==="function"){
      await nav.share({title:p.title,text:p.statement,url:w.location.href});return true;
    }
    throw Error(files.length>1?"Mehrseitige Bildbeiträge können auf diesem Gerät nicht vollständig geteilt werden":"Bild-Teilen wird auf diesem Gerät nicht unterstützt");
  }
  function userShare(ev){
    var btn=ev.target&&ev.target.closest?ev.target.closest("button[data-frauen-share]"):null;
    if(!btn||ev.defaultPrevented||ev.button!==0||ev.ctrlKey||ev.shiftKey||ev.altKey||ev.metaKey)return;
    var kind=btn.getAttribute("data-frauen-share");
    if(["copy-text","wa","tg","native","image","ig"].indexOf(kind)<0)return;
    var article=btn.closest("article.post-reader");
    var id=readId(),item=active(id);
    if(!article||!item||!visibleRoot()||!visibleRoot().contains(article))return;
    var p=item.pack,lab=p.labels||{};
    var msg="DĀR AL TAWḤĪD · "+p.title+"\n\n"+p.statement+"\n\n"+lab.lesson+":\n"+p.lesson+"\n\n"+lab.source+": "+p.source;
    // Original share route: same ID and same URL in all languages (NO Q alias).
    var url=w.location.origin+w.location.pathname+"#/frauen/"+item.entry.area+"/"+encodeURIComponent(id);
    ev.preventDefault();ev.stopImmediatePropagation();
    if(kind==="image"||kind==="ig"){
      localImageExport(item,kind==="ig").catch(function(e){try{console.warn("DAR Frauen Bildbeitrag:",e)}catch(_){}});
      return;
    }
    function copy(v){return w.navigator.clipboard&&w.navigator.clipboard.writeText?w.navigator.clipboard.writeText(v):Promise.reject(Error("Clipboard unavailable"))}
    if(kind==="wa"){w.open("https://wa.me/?text="+encodeURIComponent(msg+"\n\n"+url),"_blank","noopener,noreferrer");return}
    if(kind==="tg"){w.open("https://t.me/share/url?url="+encodeURIComponent(url)+"&text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");return}
    if(kind==="copy-text"){copy(msg).catch(function(){try{console.warn("Copy unavailable")}catch(_){}});return}
    if(w.navigator.share){w.navigator.share({title:p.title,text:msg,url:url}).catch(function(e){if(e&&e.name!=="AbortError")copy(msg+"\n\n"+url).catch(function(){})});return}
    copy(msg+"\n\n"+url).catch(function(){});
  }
  d.addEventListener("click",userShare,true);
  d.addEventListener("dar:frauen-render",schedule);
  d.addEventListener("dar:view-rendered",schedule);
  w.addEventListener("dar-adult-locale-changed",schedule);
  w.addEventListener("dar-adult-ui-languages-ready",schedule);
  w.addEventListener("hashchange",schedule);
  w.addEventListener("popstate",schedule);
  w.addEventListener("pageshow",schedule);
  w.addEventListener("storage",function(ev){if(ev.key===KEY)schedule()});
  d.addEventListener("click",function(ev){if(ev.target&&ev.target.closest&&ev.target.closest("[data-language],[data-locale],[data-lang],[data-ui-language],#darAdultLanguagePicker"))schedule()},true);
  d.addEventListener("change",function(ev){var el=ev.target;if(el&&(/lang/i.test(el.id||"")||/lang/i.test(el.name||"")))schedule()},true);
  // Observe text set by the original frozen renderer; avoid replacing it or editing geometry.
  function attach(){
    var roots=[d.getElementById("appView"),d.getElementById("womenApp")];
    roots.forEach(function(root){
      if(!root||root.__darFrauenLocaleObserved)return;
      root.__darFrauenLocaleObserved=true;
      new MutationObserver(function(changes){
        if(changes.some(function(c){return c.type==="childList"}))schedule();
      }).observe(root,{childList:true,subtree:true});
    });
  }
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",function(){attach();load()});
  else{attach();load()}
})(window,document);
