/* DAR_FRAUEN_ENTRY_LOCALE_V1
 * Localize a canonical FRAUEN contribution by its existing "kennung".
 * Never create Q URLs or numbers, duplicate posts, or change source hrefs.
 * Frozen Frauen renderer/hero/layout remain unchanged.
 */
(function (w,d) {
  "use strict";
  if(w.__DAR_FRAUEN_ENTRY_LOCALE_V1)return;
  w.__DAR_FRAUEN_ENTRY_LOCALE_V1=true;
  var URI="/assets/frauen/frauen-entry-locales-v1.json?v=20261106-entry-v1";
  var KEY="darAdultPreferredLocaleV1";
  var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  var manifest=null,loading=false,scheduled=false;
  var rootSelector=".dar-frauen-production-root";
  function norm(code) {
    code=String(code||"").trim().toLowerCase().replace(/_/g,"-");
    if(code==="kr")code="ku";
    if(code==="ku-sorani")code="ckb";
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
  function userShare(ev){
    var btn=ev.target&&ev.target.closest?ev.target.closest("button[data-frauen-share]"):null;
    if(!btn||ev.defaultPrevented||ev.button!==0||ev.ctrlKey||ev.shiftKey||ev.altKey||ev.metaKey)return;
    var kind=btn.getAttribute("data-frauen-share");
    if(["copy-text","wa","tg","native"].indexOf(kind)<0)return;
    var article=btn.closest("article.post-reader");
    var id=readId(),item=active(id);
    if(!article||!item||!visibleRoot()||!visibleRoot().contains(article))return;
    var p=item.pack,lab=p.labels||{};
    var msg="DĀR AL TAWḤĪD · "+p.title+"\n\n"+p.statement+"\n\n"+lab.lesson+":\n"+p.lesson+"\n\n"+lab.source+": "+p.source;
    // Original share route: same ID and same URL in all languages (NO Q alias).
    var url=w.location.origin+w.location.pathname+"#/frauen/"+item.entry.area+"/"+encodeURIComponent(id);
    ev.preventDefault();ev.stopImmediatePropagation();
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
