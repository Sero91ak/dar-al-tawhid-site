/* DAR Admin · Sprachkontrolle & Social Media · private editor UI, no publish or push. */
(function(global){
  "use strict";
  const KEY="darAdminSocialReviewV1";
  const LANGS=[
    ["de","Deutsch","ltr"],["ar","Arabisch · Fuṣḥā","rtl"],
    ["en","Englisch","ltr"],["tr","Türkisch","ltr"],
    ["ku","Kurmancî","ltr"],["ckb","Soranî","rtl"],
    ["bs","Bosnisch","ltr"],["fr","Französisch","ltr"],
    ["es","Spanisch","ltr"]
  ];
  const fresh=()=>({version:1,postId:"",qNumber:"",qVerified:false,selected:"de",platform:"telegram",texts:{},reviews:{}});
  let state=load(),notice="";
  function load(){try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||"null");
    if(!parsed||typeof parsed!=="object")return fresh();
    return Object.assign(fresh(),parsed,{texts:parsed.texts||{},reviews:parsed.reviews||{}});
  }catch(_){return fresh();}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(_){notice="Speichern im Browser fehlgeschlagen. Bitte JSON exportieren.";return false}}
  function safe(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
  function active(){return LANGS.find(x=>x[0]===state.selected)||LANGS[0]}
  function body(){return String(state.texts[state.selected]||"")}
  function qLink(){return state.qVerified&&/^[1-9]\d{0,5}$/.test(String(state.qNumber))?"dar-al-tawhid.de/q/"+state.qNumber+"/":""}
  function socialText(code,platform){
    let txt=String(state.texts[code]||"").trim();
    if(!txt)return "";
    if(platform==="whatsapp"){
      const lines=txt.split(/\r?\n/);
      txt=lines.filter(line=>!(/^\s*(?:#[\p{L}\p{N}_-]+\s*){4}\s*$/u.test(line))).join("\n").trim();
    }
    const q=qLink();
    if(q&&!txt.includes(q)&&!txt.includes("https://"+q))txt+="\n\n"+q;
    return txt;
  }
  function validate(code){
    const txt=String(state.texts[code]||"").trim(),issues=[];
    if(!txt)return ["Kein vollständiger Sprachtext vorhanden"];
    const lines=txt.split(/\r?\n/).filter(x=>x.trim());
    if(!lines[0].trim().startsWith("📖"))issues.push("Titel muss mit 📖 beginnen");
    const tags=(lines[1]||"").match(/#[\p{L}\p{N}_-]+/gu)||[];
    if(tags.length!==4||tags[0]!=="#DarAlTawhid")issues.push("Genau vier Hashtags unmittelbar unter dem Titel; erster #DarAlTawhid");
    if(!txt.includes("🖋️"))issues.push("🖋️ Sprecher/Aussage fehlt");
    if(!txt.includes("📝"))issues.push("📝 Quellenangabe fehlt");
    if(!txt.includes("🌙"))issues.push("🌙 Fazit fehlt");
    if(!state.postId.trim())issues.push("Eine kanonische Beitrags-ID fehlt");
    if(!qLink())issues.push("Gemeinsamer Q-Link noch nicht als geprüft markiert");
    return issues;
  }
  function render(){
    const lang=active(),notes=validate(lang[0]);
    const count=LANGS.filter(x=>state.reviews[x[0]]===true&&validate(x[0]).length===0).length;
    const current=body(),q=qLink();
    return '<section class="social-review panel" data-no-collapse>'+
      '<div class="social-header"><div><span class="social-kicker">DĀR AL TAWḤĪD · Redaktion</span><h2>Sprachkontrolle &amp; Social Media</h2><p>Eine Beitrags-ID · ein Quellenlink · neun kopierfertige Sprachfassungen</p></div><span class="social-count">'+count+'/9 geprüft</span></div>'+
      '<div class="social-warning">Privater Entwurfsbereich. Die Texte bleiben zunächst nur in diesem Browser gespeichert. Kein automatischer Upload, keine Übersetzung und keine Veröffentlichung.</div>'+
      '<div class="social-meta">'+
       '<label>Beitrags-ID<input class="field" id="socialPostId" value="'+safe(state.postId)+'" placeholder="Kanonische ID (keine neue pro Sprache)"></label>'+
       '<label>Q-Quellennummer<input class="field" id="socialQ" inputmode="numeric" pattern="[0-9]*" value="'+safe(state.qNumber)+'" placeholder="Erst nach Vergabe im Quellenmanager"></label>'+
      '</div>'+
      '<label class="social-check"><input type="checkbox" id="socialQVerified"'+(state.qVerified?' checked':'')+'> Q-Seite existiert und wurde im Quellenmanager überprüft</label>'+
      '<p class="social-q">'+(q?'Gemeinsamer Social-Quellenlink: <strong>'+safe(q)+'</strong>':'Q-Link offen – es wird keine Nummer erfunden.')+'</p>'+
      '<div class="social-langs" role="group" aria-label="Sprache auswählen">'+LANGS.map(x=>{
        const s=state.reviews[x[0]]&&validate(x[0]).length===0?"✓":String(state.texts[x[0]]||"").trim()?"•":"○";
        return '<button type="button" class="social-lang'+(x[0]===state.selected?' active':'')+'" data-social-lang="'+safe(x[0])+'"><span>'+safe(x[1])+'</span><small>'+s+'</small></button>';
      }).join("")+'</div>'+
      '<div class="social-grid">'+
        '<div class="social-editor">'+
          '<h3>'+safe(lang[1])+' · kompletter Social-Text</h3>'+
          '<p>Originalgetreue Unicode-Schrift einfügen. Die gewählte Schriftgestaltung wird nicht beim Kopieren durch CSS ersetzt.</p>'+
          '<textarea id="socialText" spellcheck="false" dir="'+lang[2]+'" placeholder="📖 Titel&#10;#DarAlTawhid #Sprecher #Thema #Thema&#10;&#10;🖋️ Aussage&#10;&#10;📝 Quelle&#10;&#10;🌙 Fazit">'+safe(current)+'</textarea>'+
          '<div class="social-review-state"><span>'+(state.reviews[lang[0]]&&notes.length===0?'✓ Diese Fassung manuell geprüft':'Entwurf · nicht freigegeben')+'</span><button type="button" class="btn" id="socialReviewBtn"'+(notes.length?' disabled':'')+'>Fassung manuell bestätigen</button></div>'+
          '<div class="social-validation" id="socialValidation">'+(notes.length?notes.map(x=>'<div>• '+safe(x)+'</div>').join(""):'Grundstruktur geprüft. Sprachliche und religiöse Fachprüfung ist weiterhin manuell erforderlich.')+'</div>'+
        '</div>'+
        '<div class="social-preview">'+
          '<div class="social-preview-top"><span>Social-Media-Vorschau</span><span>'+safe(lang[0].toUpperCase())+'</span></div>'+
          '<div class="social-paper" dir="'+lang[2]+'" id="socialPreview">'+safe(socialText(lang[0],state.platform)||"Noch kein Beitragstext vorhanden.")+'</div>'+
          '<label for="socialPlatform">Ausgabe für</label><select class="field" id="socialPlatform"><option value="telegram"'+(state.platform==="telegram"?' selected':'')+'>Telegram (4 Hashtags)</option><option value="instagram"'+(state.platform==="instagram"?' selected':'')+'>Instagram (4 Hashtags)</option><option value="whatsapp"'+(state.platform==="whatsapp"?' selected':'')+'>WhatsApp (ohne Hashtags)</option></select>'+
          '<button type="button" class="btn primary social-copy" id="socialCopyBtn"'+(!current.trim()?' disabled':'')+'>⌁ Vollständigen Text kopieren</button>'+
          '<p id="socialNotice" aria-live="polite">'+safe(notice)+'</p>'+
        '</div>'+
      '</div>'+
      '<div class="social-footer"><button class="btn" type="button" id="socialExportBtn">Alle neun Texte als JSON sichern</button><label class="btn social-import">JSON wieder einlesen<input type="file" id="socialImport" accept=".json,application/json" hidden></label><button class="btn" type="button" id="socialClearBtn">Neuen Beitrag beginnen</button></div>'+
      '<p class="social-small">Die Q-Nummer gilt für alle Sprachen. Ein grüner Status bedeutet nur die hiesige Struktur- und manuelle Redaktionsbestätigung, keine unabhängige Muttersprachler-Zertifizierung. Die Speicherung in der gemeinsamen Zentrumsdatenbank ist ein separater Integrationsschritt.</p>'+
    '</section>';
  }
  function status(){const el=document.getElementById("socialNotice");if(el)el.textContent=notice}
  function rerender(){if(typeof global.renderAdminSocialShell==="function")global.renderAdminSocialShell()}
  function updateValidation(){
    const lang=active(),notes=validate(lang[0]);
    const box=document.getElementById("socialValidation");
    if(box)box.innerHTML=notes.length?notes.map(x=>'<div>• '+safe(x)+'</div>').join(""):"Grundstruktur geprüft. Sprachliche und religiöse Fachprüfung ist weiterhin manuell erforderlich.";
    const preview=document.getElementById("socialPreview");
    if(preview)preview.textContent=socialText(lang[0],state.platform)||"Noch kein Beitragstext vorhanden.";
    const review=document.getElementById("socialReviewBtn");
    if(review)review.disabled=notes.length>0;
    const copy=document.getElementById("socialCopyBtn");
    if(copy)copy.disabled=!body().trim();
  }
  async function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return;}
    const node=document.createElement("textarea");node.value=text;node.style.position="fixed";node.style.left="-9999px";document.body.appendChild(node);node.select();
    const ok=document.execCommand("copy");node.remove();if(!ok)throw new Error("Browser blockiert die Zwischenablage");
  }
  function exportData(){
    const data={version:1,exportedAt:new Date().toISOString(),postId:state.postId,qNumber:state.qNumber,qVerified:state.qVerified,texts:state.texts,reviews:state.reviews};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
    const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download="DAR-social-9sprachen-"+(state.postId.replace(/[^a-z0-9_-]/gi,"-")||"entwurf")+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    notice="Alle gespeicherten Texte wurden als JSON exportiert.";status();
  }
  function bind(){
    const byId=id=>document.getElementById(id);
    const post=byId("socialPostId");if(post)post.oninput=()=>{state.postId=post.value;state.reviews={};save();updateValidation()};
    const q=byId("socialQ");if(q)q.onchange=()=>{state.qNumber=q.value.trim();state.qVerified=false;state.reviews={};save();rerender()};
    const verified=byId("socialQVerified");if(verified)verified.onchange=()=>{
      if(verified.checked&&!/^[1-9]\d{0,5}$/.test(state.qNumber)){verified.checked=false;notice="Zuerst eine gültige, bereits angelegte Q-Nummer eintragen.";status();return;}
      state.qVerified=verified.checked;state.reviews={};save();rerender();
    };
    document.querySelectorAll("[data-social-lang]").forEach(el=>{el.onclick=()=>{state.selected=el.dataset.socialLang;notice="";save();rerender()}});
    const editor=byId("socialText");if(editor)editor.oninput=()=>{state.texts[state.selected]=editor.value;state.reviews[state.selected]=false;save();updateValidation()};
    const platform=byId("socialPlatform");if(platform)platform.onchange=()=>{state.platform=platform.value;save();updateValidation()};
    const review=byId("socialReviewBtn");if(review)review.onclick=()=>{
      if(validate(state.selected).length)return;
      if(!confirm("Hast du diese komplette Sprachfassung auf Bedeutung, Quellen, Qurʾān-/Ḥadīṯ-Zitate und korrekte Fachbegriffe geprüft?"))return;
      state.reviews[state.selected]=true;save();notice="Manuelle redaktionelle Prüfung für "+active()[1]+" dokumentiert.";rerender();
    };
    const btn=byId("socialCopyBtn");if(btn)btn.onclick=async()=>{
      const text=socialText(state.selected,state.platform);if(!text)return;
      if(!state.reviews[state.selected]&&!confirm("Dieser Text ist noch nicht redaktionell bestätigt. Trotzdem als Entwurf kopieren?"))return;
      if(!qLink()&&!confirm("Der Q-Quellenlink ist noch offen und wird NICHT ergänzt. Trotzdem kopieren?"))return;
      try{await copy(text);notice="Vollständiger "+active()[1]+"-Text wurde kopiert."}catch(e){notice="Kopieren fehlgeschlagen: "+String(e.message||e)}status();
    };
    const exporter=byId("socialExportBtn");if(exporter)exporter.onclick=exportData;
    const importer=byId("socialImport");if(importer)importer.onchange=async()=>{
      const file=importer.files&&importer.files[0];if(!file)return;
      try{
        const obj=JSON.parse(await file.text());
        if(!obj||typeof obj!=="object"||!obj.texts||typeof obj.texts!=="object")throw new Error("Ungültige Social-JSON-Datei");
        if(!confirm("Die bisherigen lokalen Entwürfe durch die importierten Texte ersetzen?"))return;
        state=Object.assign(fresh(),{postId:String(obj.postId||""),qNumber:String(obj.qNumber||""),qVerified:false,texts:{},reviews:{}});
        LANGS.forEach(x=>{if(typeof obj.texts[x[0]]==="string")state.texts[x[0]]=obj.texts[x[0]]});
        save();notice="Neunsprachige Texte geladen. Quellenprüfung und Freigaben müssen erneut bestätigt werden.";rerender();
      }catch(e){notice="Import fehlgeschlagen: "+String(e.message||e);status()}
    };
    const clear=byId("socialClearBtn");if(clear)clear.onclick=()=>{
      if(!confirm("Einen neuen Beitrag beginnen? Bitte vorher die neun Texte als JSON sichern."))return;
      state=fresh();save();notice="Neuer Entwurf begonnen.";rerender();
    };
  }

  /* Immersive editorial surface inside the EXISTING authenticated Admin SPA.
     Legacy Social Review renderer remains available for recovery. */
  function renderImmersiveAtelier(){
    return '<section class="admin-editorial-host" data-no-collapse aria-label="Redaktionsatelier">'+
      '<div class="admin-editorial-hostbar"><div><small>DĀR ADMIN / REDAKTION</small>'+
      '<strong>Redaktionsatelier</strong><span>Neun Sprachen · Kanonische Beiträge · Originalnachweise</span></div>'+
      '<button type="button" id="darEditorFullscreen" class="admin-editorial-popout" aria-pressed="false">Widescreen öffnen ↗</button></div>'+
      '<div id="darAdminEditorialStatus" class="admin-editorial-loading" aria-live="polite">Redaktionsatelier wird geladen …</div><iframe id="darAdminEditorialFrame" title="DĀR AL TAWḤĪD Redaktion" src="/admin/redaktion/?v=2" referrerpolicy="same-origin"></iframe>'+
      '</section>';
  }
  function bindImmersiveAtelier(){
    const frame=document.getElementById("darAdminEditorialFrame");
    if(!frame)return;
    function resize(){
      if(!frame.isConnected)return;
      const top=frame.getBoundingClientRect().top;
      const room=window.innerHeight-top-(document.body.classList.contains("dar-editorial-fullscreen")?0:10);
      frame.style.height=Math.max(420,room)+"px";
    }
    const fullscreen=document.getElementById("darEditorFullscreen");
    const closeFullscreen=()=>{
      document.body.classList.remove("dar-editorial-fullscreen");
      if(fullscreen){fullscreen.textContent="Widescreen öffnen ↗";fullscreen.setAttribute("aria-pressed","false")}
      resize();
    };
    if(fullscreen)fullscreen.addEventListener("click",()=>{
      const active=document.body.classList.toggle("dar-editorial-fullscreen");
      fullscreen.textContent=active?"Widescreen schließen ×":"Widescreen öffnen ↗";
      fullscreen.setAttribute("aria-pressed",String(active));resize();
    });
    if(global.__darEditorResize)window.removeEventListener("resize",global.__darEditorResize);
    global.__darEditorResize=resize;
    window.addEventListener("resize",resize,{passive:true});
    if(global.__darEditorEsc)window.removeEventListener("keydown",global.__darEditorEsc);
    global.__darEditorEsc=e=>{if(e.key==="Escape"&&document.body.classList.contains("dar-editorial-fullscreen"))closeFullscreen()};
    window.addEventListener("keydown",global.__darEditorEsc);
    frame.addEventListener("load",()=>{
      resize();
      const indicator=document.getElementById("darAdminEditorialStatus");
      if(!indicator)return;
      let healthy=false;
      try{healthy=!!frame.contentDocument?.getElementById("postText")&&!!frame.contentDocument?.getElementById("catalog")}catch(_){}
      if(healthy){indicator.hidden=true;return}
      indicator.hidden=false;
      indicator.textContent="Die Redaktionsdatei wurde noch nicht korrekt ausgeliefert. Bitte den Cloudflare-Produktionsdeploy prüfen.";
      const retry=document.createElement("button");retry.type="button";retry.textContent="Erneut laden";
      retry.className="btn";retry.onclick=()=>{
        indicator.textContent="Redaktionsatelier wird neu geladen …";
        frame.src="/admin/redaktion/?v="+Date.now();
      };
      indicator.appendChild(retry);
    });
    resize();
  }
  global.DARAdminSocialReview={render:renderImmersiveAtelier,bind:bindImmersiveAtelier,renderLegacy:render,bindLegacy:bind};

})(window);