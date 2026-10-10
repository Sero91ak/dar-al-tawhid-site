/* KIDS_OWNER_STUDIO_V1 – Global owner test controls, not a child-facing release. */
(function(){
"use strict";
if(location.hostname!=="dar-al-tawhid-kids-owner-test.sero91ak.workers.dev"||
   window.__DAR_KIDS_OWNER_TEST__!==true)return;
if(window.__kidsOwnerStudioReady)return;
window.__kidsOwnerStudioReady=true;
const doc=document;
function boot(){
 if(doc.getElementById("kidsOwnerStudio"))return;
 const style=doc.createElement("style");
 style.textContent=`
#kidsOwnerStudio{position:fixed;z-index:2147483000;right:max(12px,env(safe-area-inset-right,0px));bottom:calc(88px + env(safe-area-inset-bottom,0px));font:500 14px/1.4 system-ui,sans-serif;color:#f7ead0}
#kidsOwnerStudio *{box-sizing:border-box}
#kidsOwnerStudio button,#kidsOwnerStudio a,#kidsOwnerStudio select{font:inherit;touch-action:manipulation}
#kidsOwnerStudio .ko-launch{display:block;margin-left:auto;background:#133b42;color:#ffe6aa;border:1px solid #b79a57;border-radius:50px;padding:12px 16px;box-shadow:0 5px 18px #0007;font-weight:800;min-height:46px}
#kidsOwnerStudio .ko-panel{display:none;width:min(350px,calc(100vw - 24px));max-height:min(72dvh,580px);overflow:auto;background:#092935;border:1px solid #c3a46b;border-radius:20px;padding:16px;box-shadow:0 16px 45px #0009;margin:0 0 8px}
#kidsOwnerStudio[data-open="1"] .ko-panel{display:block}
#kidsOwnerStudio h2{color:#ffe6aa;font-size:17px;line-height:1.3;margin:0 0 6px}
#kidsOwnerStudio p{margin:0 0 12px;font-size:12px;color:#c4d8d7}
#kidsOwnerStudio .ko-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
#kidsOwnerStudio .ko-grid button,#kidsOwnerStudio .ko-grid a{display:grid;place-items:center;text-align:center;text-decoration:none;color:#fff5dc;background:#17434a;border:1px solid #527779;border-radius:11px;min-height:44px;padding:8px}
#kidsOwnerStudio label{display:block;font-weight:700;font-size:12px;margin-top:12px;color:#e6d09d}
#kidsOwnerStudio select{width:100%;min-height:44px;border:1px solid #537b77;border-radius:10px;background:#143e43;color:#fff5dc;padding:8px;margin-top:4px}
#kidsOwnerStudio .ko-status{border-top:1px solid #426d6d;padding-top:9px;margin-top:9px;font-size:11px;color:#bdd8d5}
#kidsOwnerStudio button:focus-visible,#kidsOwnerStudio a:focus-visible,#kidsOwnerStudio select:focus-visible{outline:3px solid #f0c877;outline-offset:2px}
`;
 doc.head.appendChild(style);
 const root=doc.createElement("aside");root.id="kidsOwnerStudio";root.dataset.open="0";
 root.setAttribute("aria-label","Ersteller-Teststeuerung");
 root.innerHTML=`
 <div class="ko-panel" id="koPanel">
 <h2>Ersteller-Studio · TEST</h2>
 <p>Gesamte Kinder-App testen. Nur dieser isolierte Testzugang – kein öffentlicher Kinderbereich.</p>
 <div class="ko-grid">
 <button data-ko-view="today">Startseite</button>
 <button data-ko-view="stories">Hörbücher</button>
 <button data-ko-view="quran">Qurʾān</button>
 <button data-ko-view="dua">Duʿāʾ</button>
 <button data-ko-view="quiz">Quiz</button>
 <button data-ko-view="parents">Eltern</button>
 <a href="/kids/akademie/index.html">Lernakademie</a>
 <button data-ko-view="today">Alle Bereiche</button>
 </div>
 <label for="koGender">Testprofil</label>
 <select id="koGender"><option value="boy">Junge</option><option value="girl">Mädchen</option></select>
 <label for="koAge">Altersgruppe</label>
 <select id="koAge"><option value="4-5">4–5 Jahre</option><option value="6-8">6–8 Jahre</option><option value="9-10">9–10 Jahre</option></select>
 <div class="ko-status">Sperren nur in der Test-Akademie aufgehoben. Alle anderen vorhandenen App-Funktionen behalten ihre eigenen Tests und Sicherheitsprüfungen. Keine Live-Veröffentlichung.</div>
 </div>
 <button class="ko-launch" id="koLaunch" aria-expanded="false" aria-controls="koPanel">TEST · Ersteller</button>`;
 doc.body.appendChild(root);
 const gender=root.querySelector("#koGender"),age=root.querySelector("#koAge");
 try{gender.value=localStorage.getItem("kids.guest.gender.v1")==="girl"?"girl":"boy";age.value=localStorage.getItem("kids.age")||"4-5";}catch(e){}
 const launch=root.querySelector("#koLaunch");
 launch.addEventListener("click",()=>{
  const open=root.dataset.open!=="1";root.dataset.open=open?"1":"0";
  launch.setAttribute("aria-expanded",String(open));
 });
 function chooseProfile(){
  try{
   // This storage belongs ONLY to the test origin, never live.
   localStorage.removeItem("kids.activeProfile");
   localStorage.setItem("kids.guest.gender.v1",gender.value);
   localStorage.setItem("kids.age",age.value);
  }catch(e){}
  if(location.pathname.startsWith("/kids/akademie")){
   const u=new URL(location.href);
   u.searchParams.set("previewProfil",gender.value==="girl"?"maedchen":"junge");
   u.searchParams.set("previewAlter",age.value);
   location.assign(u.toString());
  }else location.reload();
 }
 gender.addEventListener("change",chooseProfile);
 age.addEventListener("change",chooseProfile);
 function goTo(view){
  if(location.pathname.startsWith("/kids/akademie")){
   location.assign("/kids/start?ownerView="+encodeURIComponent(view));return;
  }
  const target=view==="dua"?doc.getElementById("openDuaButton"):
   view==="quiz"?doc.getElementById("openQuizButton"):
   doc.querySelector('.nav-btn[data-target="'+view+'"]');
  if(target)target.click();
  root.dataset.open="0";launch.setAttribute("aria-expanded","false");
 }
 root.querySelectorAll("[data-ko-view]").forEach(btn=>btn.addEventListener("click",()=>goTo(btn.dataset.koView)));
 const requested=new URLSearchParams(location.search).get("ownerView");
 if(requested&&["today","stories","quran","dua","quiz","parents"].includes(requested)){
  const u=new URL(location.href);u.searchParams.delete("ownerView");
  history.replaceState(null,"",u.pathname+u.search);
  requestAnimationFrame(()=>goTo(requested));
 }
}
if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
