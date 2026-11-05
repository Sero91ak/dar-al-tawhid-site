/* DĀR AL TAWḤĪD · Q01–Q05 nine-locale source-card adapter (batch 1/10).
   One canonical /q/N/ address; no translated routes, redirect URLs or back chrome.
   Never publish unreviewed religious text: the verified German page remains
   visible until the individual locale is explicitly editorially approved. */
(function(){
  "use strict";
  var canonical=document.querySelector('link[rel="canonical"]');
  var match=canonical&&/^https:\/\/dar-al-tawhid\.de\/q\/([1-5])\/$/.exec(canonical.getAttribute("href")||"");
  if(!match||!document.body||!document.body.classList.contains("qsource-body"))return;
  if(window.__darQSourceFirstFiveLocales)return;
  window.__darQSourceFirstFiveLocales=true;
  var number=match[1],codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  var names={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
  var localeData=null,manual="",picker=null,notice=null;
  var root=document.querySelector(".qsource-page");
  if(!root)return;
  function norm(value){
    var v=String(value||"").trim().toLowerCase().replace(/_/g,"-");
    if(v==="kr")v="ku";
    if(v==="ku-sorani")v="ckb";
    return codes.indexOf(v)>=0?v:"";
  }
  function explicit(){
    try{return norm(new URL(document.baseURI||location.href).searchParams.get("lang"))}catch(_){return ""}
  }
  function stored(){
    try{return norm(localStorage.getItem("darAdultPreferredLocaleV1"))}catch(_){return ""}
  }
  function selected(){return manual||explicit()||stored()||"de"}
  function phrase(code,key){
    var ui=localeData&&localeData.ui;
    return ui&&ui[code]&&ui[code][key]||ui&&ui.de&&ui.de[key]||"";
  }
  function find(selector){return root.querySelector(selector)}
  var original={
    header:find(".qsource-brand-top")?.textContent||"",
    title:find(".qsource-title")?.textContent||"",
    quote:find(".qsource-quote")?.textContent||"",
    speaker:find(".qsource-meta-row:nth-child(1) .qsource-meta-value")?.textContent||"",
    topic:find(".qsource-meta-row:nth-child(2) .qsource-meta-value")?.textContent||"",
    section:find(".qsource-section-title")?.textContent||"",
    note:find(".qsource-section p:not(.qsource-arabic)")?.textContent||"",
    linkTitles:Array.from(root.querySelectorAll(".qsource-link-title"),function(e){return e.textContent}),
    linkSubs:Array.from(root.querySelectorAll(".qsource-link-sub"),function(e){return e.textContent})
  };
  function set(selector,value){
    var node=find(selector);if(node&&typeof value==="string")node.textContent=value;
  }
  function render(){
    if(!localeData)return;
    var code=selected(),locales=localeData.cards&&localeData.cards[number];
    if(!locales)return;
    var item=locales[code],authorized=code==="de"||Boolean(item&&item.approved===true);
    var data=authorized&&item?item:null;
    if(picker)picker.value=code;
    var rtl=authorized&&(code==="ar"||code==="ckb");
    document.documentElement.lang=authorized?code:"de";
    document.documentElement.dir=rtl?"rtl":"ltr";
    root.setAttribute("lang",authorized?code:"de");
    root.setAttribute("dir",rtl?"rtl":"ltr");
    root.setAttribute("data-q-locale",code);
    root.setAttribute("data-q-locale-approved",String(authorized));
    var header=original.header;
    if(authorized)header=phrase(code,"header")||header;
    set(".qsource-brand-top",header);
    set(".qsource-title",data?data.title:original.title);
    set(".qsource-quote",data?"„"+data.quote+"“":original.quote);
    set(".qsource-meta-row:nth-child(1) .qsource-meta-value",data?data.speaker:original.speaker);
    set(".qsource-meta-row:nth-child(2) .qsource-meta-value",data?data.topic:original.topic);
    set(".qsource-section-title",data?data.section:original.section);
    set(".qsource-section p:not(.qsource-arabic)",data?data.note:original.note);
    var labels=root.querySelectorAll(".qsource-meta-label"),labelKeys=["speaker","topic","sources"];
    Array.from(labels).forEach(function(el,i){
      if(labelKeys[i])el.textContent=phrase(authorized?code:"de",labelKeys[i]);
    });
    Array.from(root.querySelectorAll(".qsource-link-title")).forEach(function(el,i){
      el.textContent=data&&data.actions&&data.actions[i]?data.actions[i]:original.linkTitles[i];
    });
    Array.from(root.querySelectorAll(".qsource-link-sub")).forEach(function(el,i){
      el.textContent=data&&data.linkSubs&&data.linkSubs[i]?data.linkSubs[i]:original.linkSubs[i];
    });
    if(notice){
      notice.lang=code;notice.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
      notice.textContent=authorized?"":phrase(code,"pending");
      notice.hidden=authorized;
    }
    var label=document.getElementById("qSourceFirstFiveLocaleLabel");
    if(label){label.lang=code;label.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";label.textContent="🌐 "+phrase(code,"language")}
    if(picker)picker.setAttribute("aria-label",phrase(code,"language"));
    // The excerpt and original evidence URLs are immutable in every language.
    document.title=(data?data.title:original.title)+" · Q"+number+" | DĀR AL TAWḤĪD";
  }
  function mount(){
    if(document.getElementById("qSourceFirstFiveLocale"))return;
    var area=document.createElement("section");
    area.id="qSourceFirstFiveLocale";
    area.className="qsource-locale-first-five";
    area.setAttribute("aria-label","Source language");
    var label=document.createElement("label");
    label.id="qSourceFirstFiveLocaleLabel";
    label.setAttribute("for","qSourceFirstFiveLocaleSelect");
    label.textContent="🌐 Sprache";
    var select=document.createElement("select");
    select.id="qSourceFirstFiveLocaleSelect";
    codes.forEach(function(code){
      var option=document.createElement("option");
      option.value=code;
      option.textContent=names[code];
      select.appendChild(option);
    });
    select.addEventListener("change",function(){
      manual=norm(select.value);
      try{localStorage.setItem("darAdultPreferredLocaleV1",manual)}catch(_){}
      render();
    });
    var warning=document.createElement("p");
    warning.className="qsource-locale-pending";
    warning.setAttribute("role","status");
    warning.setAttribute("aria-live","polite");
    warning.hidden=true;
    area.appendChild(label);area.appendChild(select);area.appendChild(warning);
    var header=find(".qsource-header");
    if(header&&header.parentNode)header.parentNode.insertBefore(area,header.nextSibling);
    var style=document.createElement("style");
    style.id="qSourceFirstFiveLocaleStyle";
    style.textContent=".qsource-locale-first-five{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0 17px;padding:10px 0;border-block:1px solid var(--q-line,rgba(153,129,85,.36));color:var(--q-text,#e8dfcb);box-sizing:border-box}.qsource-locale-first-five label{font:700 .85rem/1.4 system-ui,sans-serif}.qsource-locale-first-five select{min-width:140px;max-width:100%;min-height:44px;border:1px solid #b49b6b;border-radius:12px;padding:8px 10px;font:600 .9rem/1.3 system-ui,sans-serif;background:var(--rq-surface,#f9f5ed);color:var(--rq-ink,#1c332b)}.qsource-locale-first-five select:focus-visible{outline:2px solid #b49b6b;outline-offset:3px}.qsource-locale-pending{flex-basis:100%;font-size:.81rem;line-height:1.6;margin:0;color:inherit;opacity:.85}.qsource-locale-pending[hidden]{display:none!important}@media(max-width:370px){.qsource-locale-first-five select{flex:1 1 100%;min-width:0}}";
    document.head.appendChild(style);
    picker=select;notice=warning;
  }
  mount();
  fetch("/q/_registry/source-locales-01-05.json?v=20261105-b1",{cache:"default",credentials:"same-origin"})
    .then(function(response){if(!response.ok)throw Error("Locale data unavailable");return response.json()})
    .then(function(data){
      if(!data||data.schemaVersion!==1||!data.cards||!data.cards[number]||!data.ui)throw Error("Invalid locale data");
      localeData=data;render();
    })
    .catch(function(){
      if(notice){notice.textContent="Sprachdaten derzeit nicht verfügbar. Deutsche Originalfassung bleibt sichtbar.";notice.hidden=false}
    });
  window.addEventListener("storage",function(event){
    if(event.key==="darAdultPreferredLocaleV1"&&!manual)render();
  });
})();