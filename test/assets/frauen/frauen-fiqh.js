/* Prüf-App only: Frauen im Islam → Fiqh der Frauen */
(function(){
  const DATA_URL="/test/data/frauen-fiqh.json";
  const ERLAUBTE_ARTEN=new Set(["quran","sahih","hasan","zuverlaessiger-athar"]);
  const BEREICHE=[
    {id:"alle",label:"Alle"},
    {id:"grundlagen",label:"Grundlagen"},
    {id:"reinigung",label:"Reinigung"},
    {id:"gebet",label:"Gebet"},
    {id:"fasten",label:"Fasten"},
    {id:"kleidung-im-gebet",label:"Kleidung im Gebet"},
    {id:"hijab-schamhaftigkeit",label:"Ḥijāb & Schamhaftigkeit"},
    {id:"moschee-gemeinschaft",label:"Moschee & Gemeinschaft"},
    {id:"hajj-umrah",label:"Ḥajj & ʿUmrah"},
    {id:"ehe-familie",label:"Ehe & Familie"},
    {id:"fragen-antworten",label:"Fragen & Antworten"}
  ];
  const BEREICH_LABEL=Object.fromEntries(BEREICHE.filter(b=>b.id!=="alle").map(b=>[b.id,b.label]));
  const ART_LABEL={quran:"Qurʾān",sahih:"ṣaḥīḥ",hasan:"ḥasan","zuverlaessiger-athar":"zuverlässiger Āthār"};
  let cache=null;
  let laden=null;
  let filterId="alle";
  let suche="";

  function esc(s){
    if(typeof window.esc==="function")return window.esc(s);
    return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function header(title,sub,eye){
    if(typeof window.setPageHeader==="function")return window.setPageHeader(title,sub,eye);
    return `<div class="article-title"><div class="eyebrow">${esc(eye||"")}</div><h2>${esc(title)}</h2><p>${esc(sub||"")}</p></div>`;
  }
  function sichtbareArt(art){return ERLAUBTE_ARTEN.has(String(art||""))}
  function eintragSichtbar(e){
    if(!e||typeof e!=="object")return false;
    if(String(e.quellenstatus||"")!=="geprueft")return false;
    if(!sichtbareArt(e.quellenart))return false;
    const titel=String(e.titel||"").trim();
    const inhalt=String(e.inhalt||"").trim();
    const quelle=String(e.quellenanzeige||"").trim();
    if(!titel||!inhalt||!quelle)return false;
    const hinweis=String(e.hinweise||"").toLowerCase();
    if(hinweis.includes("nicht sichtbar"))return false;
    return true;
  }
  async function load(force){
    if(cache&&!force)return cache;
    if(laden)return laden;
    laden=fetch(DATA_URL,{cache:"no-store"}).then(r=>{
      if(!r.ok)throw new Error("fiqh");
      return r.json();
    }).then(data=>{
      cache=data&&typeof data==="object"?data:{eintraege:[]};
      return cache;
    }).catch(()=>{
      cache={eintraege:[]};
      return cache;
    }).finally(()=>{laden=null});
    return laden;
  }
  function sichtbareListe(){
    const list=Array.isArray(cache?.eintraege)?cache.eintraege:[];
    return list.filter(eintragSichtbar);
  }
  function gefiltert(){
    let list=sichtbareListe();
    if(filterId!=="alle")list=list.filter(e=>e.bereich===filterId);
    const q=suche.trim().toLowerCase();
    if(q){
      list=list.filter(e=>{
        const hay=[e.titel,e.kurzbeschreibung,e.inhalt,e.nutzen,e.quellenanzeige,(e.schlagwoerter||[]).join(" ")].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }
  function karte(e){
    const art=ART_LABEL[e.quellenart]||"geprüft";
    const bereich=BEREICH_LABEL[e.bereich]||e.bereich;
    return `<article class="frauen-card" data-frauen-karte="${esc(e.kennung)}">
      <h3>${esc(e.titel)}</h3>
      <div class="frauen-meta">
        <span>${esc(bereich)}</span>
        <span>Quellenstatus: geprüft</span>
        <span>${esc(art)}</span>
      </div>
      <div class="frauen-kicker">Kurzbeschreibung</div>
      <p>${esc(e.kurzbeschreibung)}</p>
      <div class="frauen-kicker">Inhalt</div>
      <p>${esc(e.inhalt)}</p>
      <div class="frauen-kicker">Nutzen</div>
      <p>${esc(e.nutzen)}</p>
      <p class="frauen-source"><strong>Quelle:</strong> ${esc(e.quellenanzeige)}</p>
    </article>`;
  }
  function hub(){
    return `<div class="frauen-root">
      ${header("Frauen im Islam","Fiqh, Ṣaḥābiyyāt, Tābiʿiyyāt, Ehe, Familie und Wissen.","Frauen im Islam")}
      <div class="frauen-hub-grid">
        <button type="button" class="frauen-hub-tile" data-nav="frauen" data-value="fiqh">
          <span>
            <h3>Fiqh der Frauen</h3>
            <p>Reinigung, Gebet, Fasten, Kleidung im Gebet, Familie und Alltag – mit geprüften Quellen.</p>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>`;
  }
  function fiqhSeite(){
    const chips=BEREICHE.map(b=>`<button type="button" class="frauen-chip${filterId===b.id?" is-active":""}" data-frauen-filter="${esc(b.id)}">${esc(b.label)}</button>`).join("");
    const items=gefiltert();
    const karten=items.length?items.map(karte).join(""):`<p class="frauen-empty">Noch keine geprüften Inhalte vorhanden.</p>`;
    return `<div class="frauen-root">
      ${header("Fiqh der Frauen","Geprüfte Grundlagen zu Reinigung, Gebet, Fasten, Kleidung im Gebet, Schamhaftigkeit, Familie und Alltag.","Frauen im Islam")}
      <aside class="frauen-note">Dieser Bereich wird mit geprüften Inhalten aus Qurʾān, authentischer Sunnah und zuverlässigen klassischen Quellen aufgebaut. Inhalte mit offenem oder schwachem Quellenstatus werden nicht angezeigt.</aside>
      <label class="frauen-kicker" for="frauenThemaSuche">Thema suchen</label>
      <input id="frauenThemaSuche" class="frauen-search" type="search" placeholder="Thema suchen" value="${esc(suche)}" autocomplete="off">
      <div class="frauen-chips" role="tablist">${chips}</div>
      <div class="frauen-list">${karten}</div>
    </div>`;
  }
  function render(value){
    const pfad=String(value||"").split("/").filter(Boolean)[0]||"";
    if(pfad==="fiqh"||pfad==="fiqh-der-frauen"){
      if(!cache){
        load().then(()=>{
          const r=typeof window.readRoute==="function"?window.readRoute():null;
          if(r&&r.view==="frauen"){if(typeof window.render==="function")window.render()}
        });
        return `<div class="frauen-root">${header("Fiqh der Frauen","Geprüfte Inhalte werden geladen…","Frauen im Islam")}<p class="frauen-empty">Wird geladen …</p></div>`;
      }
      return fiqhSeite();
    }
    return hub();
  }
  function bind(){
    const root=document.querySelector(".frauen-root");
    if(!root)return;
    root.querySelectorAll("[data-frauen-filter]").forEach(btn=>{
      btn.onclick=()=>{
        filterId=btn.getAttribute("data-frauen-filter")||"alle";
        if(typeof window.render==="function")window.render();
      };
    });
    const sucheFeld=document.getElementById("frauenThemaSuche");
    if(sucheFeld){
      sucheFeld.oninput=()=>{
        suche=sucheFeld.value||"";
        const hold=sucheFeld.selectionStart;
        if(typeof window.render==="function")window.render();
        const again=document.getElementById("frauenThemaSuche");
        if(again){again.focus();try{again.setSelectionRange(hold,hold)}catch(e){}}
      };
    }
  }
  load();
  window.DARFrauenFiqh={render,bind,load};
})();
