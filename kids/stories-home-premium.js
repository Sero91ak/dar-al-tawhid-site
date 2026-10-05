/* DĀR AL TAWḤĪD Kids · Geschichten Startseite · Premium Hub v1133 */
(function(){
  "use strict";
  var ROOT="#view-stories";
  var ASSETS={
    prophets:"/kids/assets/prophet-scenes/library.webp?v=1",
    sahaba:"/kids/assets/prophet-scenes/desert.webp?v=1",
    sahabiyyat:"/kids/assets/sahabiyyat/khadijah-v1124.webp?v=1124"
  };

  function setImage(selector,src){
    var img=document.querySelector(selector);
    if(!img||img.dataset.premiumStoryArt==="1")return;
    img.dataset.premiumStoryArt="1";
    img.src=src;
    img.removeAttribute("srcset");
  }

  function normalizeCopy(){
    var gh=document.getElementById("ghEntry");
    if(gh){
      var sub=gh.querySelector(".gh-entry-sub");
      if(sub)sub.textContent="Propheten, Ṣaḥābah und Ṣaḥābiyyāt an einem Ort.";
      gh.setAttribute("aria-label","Geschichten des Īmān öffnen");
    }

    var prophet=document.getElementById("psProphetEntry");
    if(prophet){
      setImage("#psProphetEntry .ps-entry-visual img",ASSETS.prophets);
      var pk=prophet.querySelector(".ps-entry-kicker");
      if(pk)pk.textContent="GESCHICHTEN DER PROPHETEN";
    }

    var sahaba=document.getElementById("msEntry");
    if(sahaba){
      setImage("#msEntry .ms-entry-bg img",ASSETS.sahaba);
      sahaba.setAttribute("aria-label","Die zehn Mubaschschirūn entdecken");
    }

    var women=document.getElementById("syEntry");
    if(women){
      setImage("#syEntry .ms-entry-bg img",ASSETS.sahabiyyat);
      women.setAttribute("aria-label","Ṣaḥābiyyāt entdecken");
      var wk=women.querySelector(".ms-entry-kicker");
      if(wk)wk.textContent="ṢAḤĀBIYYĀT · FRAUEN DER ERSTEN GENERATION";
    }
  }

  function hideRedundancy(){
    var root=document.querySelector(ROOT);
    if(!root)return;
    var jump=root.querySelector(".stories-area-jump");
    if(jump)jump.setAttribute("aria-hidden","true");
  }

  function sync(){
    var root=document.querySelector(ROOT);
    if(!root)return;
    normalizeCopy();
    hideRedundancy();
  }

  function start(){
    sync();
    var root=document.querySelector(ROOT);
    if(!root)return;
    var queued=false;
    new MutationObserver(function(){
      if(queued)return;
      queued=true;
      requestAnimationFrame(function(){queued=false;sync()});
    }).observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
