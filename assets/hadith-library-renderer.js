/* DĀR AL TAWḤĪD – universal Ḥadīṯ library renderer
 * One source for iOS, Web App, Website and Test App.
 * Data source is DARHadithLibraryData -> apple-tv-hadith-staging.
 */
(function(){
"use strict";
if(window.__DAR_HADITH_LIBRARY_RENDERER_V1)return;
window.__DAR_HADITH_LIBRARY_RENDERER_V1=true;
var ROOT_ID="dar-hadith-library-view";
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]})}
function fold(v){return String(v||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function route(){return String(location.hash||"").replace(/^#\/?/,"").split(/[/?&]/)[0].toLowerCase()}
function active(){return ["hadith","hadith-library","hadith-bibliothek","hadithbibliothek"].indexOf(route())>=0}
function host(){return document.getElementById("appView")||document.querySelector("main")||document.body}
function ensure(){
 var h=host(),root=document.getElementById(ROOT_ID);
 if(!root){root=document.createElement("section");root.id=ROOT_ID;root.className="dar-hadith-library-view";root.innerHTML='<div class="dar-hadith-library-head"><button type="button" class="dar-hadith-back" aria-label="Zurück">‹</button><div><div class="dar-hadith-kicker">DĀR AL TAWḤĪD</div><h1>Ḥadīṯ-Bibliothek</h1><p id="darHadithStats">Wird geladen…</p></div></div><div class="dar-hadith-tools"><input id="darHadithSearch" type="search" placeholder="Ḥadīṯ, Überlieferer, Werk, Nummer oder Šarḥ suchen" autocomplete="off"><select id="darHadithBook"><option value="">Alle Werke</option></select></div><div id="darHadithList" class="dar-hadith-list" aria-live="polite"></div>';h.replaceChildren(root);
 root.querySelector(".dar-hadith-back").onclick=function(){location.hash="#more"};
 root.querySelector("#darHadithSearch").addEventListener("input",render);
 root.querySelector("#darHadithBook").addEventListener("change",render);
 }
 return root
}
var records=[];
function card(r){return '<article class="dar-hadith-card"><div class="dar-hadith-card-top"><span>'+esc(r.id)+'</span><span>'+esc(r.grade||"Ṣaḥīḥ")+'</span></div>'+(r.narratorLine?'<p class="dar-hadith-narrator">'+esc(r.narratorLine)+'</p>':'')+'<p class="dar-hadith-text">'+esc(r.textMarkdown)+'</p><div class="dar-hadith-source"><strong>Quelle:</strong> '+esc(r.sourceBook||r.source||"")+(r.sourceHadithNumber?' · '+esc(r.sourceHadithNumber):'')+(r.sourceChapter?' · '+esc(r.sourceChapter):'')+'</div>'+(r.sharhText?'<details class="dar-hadith-sharh"><summary>Šarḥ anzeigen</summary><p>'+esc(r.sharhText)+'</p><div><strong>Šarḥ:</strong> '+esc([r.sharhScholar,r.sharhBook,r.sharhReference].filter(Boolean).join(" · "))+'</div></details>':'')+'</article>'}
function render(){if(!active())return;var root=ensure(),q=fold(root.querySelector("#darHadithSearch").value),book=root.querySelector("#darHadithBook").value;var filtered=records.filter(function(r){if(book&&String(r.sourceBook||r.source)!==book)return false;if(!q)return true;return fold([r.id,r.narratorLine,r.textMarkdown,r.sourceBook,r.sourceHadithNumber,r.sourceChapter,r.sourceSection,r.sharhText,r.sharhScholar,r.sharhBook].join(" ")).indexOf(q)>=0});root.querySelector("#darHadithList").innerHTML=filtered.length?filtered.map(card).join(""):'<div class="dar-hadith-empty">Keine passenden Ḥadīṯe gefunden.</div>';root.querySelector("#darHadithStats").textContent=records.length.toLocaleString("de-DE")+" verifizierte Datensätze · "+filtered.length.toLocaleString("de-DE")+" angezeigt"}
function load(){
 if(!active())return;
 var root=ensure(),list=root.querySelector("#darHadithList");list.innerHTML='<div class="dar-hadith-empty">Aktueller Stand wird geladen…</div>';
 function go(){if(!window.DARHadithLibraryData){setTimeout(go,60);return}window.DARHadithLibraryData.load().then(function(data){records=data.completeRecords||data.records||[];var sel=root.querySelector("#darHadithBook"),books=[...new Set(records.map(function(r){return r.sourceBook||r.source}).filter(Boolean))].sort();sel.innerHTML='<option value="">Alle Werke</option>'+books.map(function(b){return '<option value="'+esc(b)+'">'+esc(b)+'</option>'}).join("");render();window.__DAR_HADITH_LIBRARY_LAST_STATS=data.stats||{total:records.length}}).catch(function(e){list.innerHTML='<div class="dar-hadith-empty">Ḥadīṯ-Daten konnten nicht geladen werden. Bitte erneut öffnen.</div>';try{console.error("[DAR Hadith Library]",e)}catch(_){}})}
 if(window.DARHadithLibraryData)go();else{try{window.DARHadithLibraryGate&&window.DARHadithLibraryGate.ensureDataLoader()}catch(_){}go()}
}
window.DARHadithLibraryRenderer={load:load,render:render};
window.addEventListener("hashchange",function(){setTimeout(load,20)});
document.addEventListener("dar:render",function(){setTimeout(load,20)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();
