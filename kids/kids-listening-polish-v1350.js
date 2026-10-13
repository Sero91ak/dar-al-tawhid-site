/* DĀR AL TAWḤĪD KIDS · Hören shortcuts V1350
 * Only links existing child-facing experiences. No new navigation logic.
 */
(function(){
  "use strict";
  function bind(){
    var dua=document.getElementById("kidsListenDuaEntry");
    if(!dua||dua.dataset.kidsListenBound==="1")return;
    dua.dataset.kidsListenBound="1";
    dua.addEventListener("click",function(){
      var existing=document.getElementById("openDuaButton");
      if(existing)existing.click();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();
