/* DAR_FRAUEN_CANONICAL_Q_SHARE_V1
 * One canonical Q URL for share actions without mutating frozen women renderer.
 * Other women cards, image generation, site routing and source reader unchanged. */
(function(){
"use strict";
if(window.__DAR_FRAUEN_CANONICAL_Q_SHARE_V1)return;
window.__DAR_FRAUEN_CANONICAL_Q_SHARE_V1=true;
function canonical(anchor){
  if(!anchor)return "";
  try{
    var u=new URL(anchor.getAttribute("href")||"",location.href);
    if(u.origin!==location.origin||!/^\/q\/[1-9][0-9]*\/$/.test(u.pathname))return "";
    return "https://dar-al-tawhid.de"+u.pathname;
  }catch(_){return ""}
}
async function copy(value){
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(value);return true;}}catch(_){}
  try{
    var t=document.createElement("textarea");t.value=value;t.readOnly=true;
    t.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(t);t.select();var ok=document.execCommand("copy");t.remove();return !!ok;
  }catch(_){return false}
}
function notice(s){
  try{if(typeof window.__darToast==="function")window.__darToast(s);}catch(_){}
}
document.addEventListener("click",function(ev){
  if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.altKey||ev.shiftKey)return;
  var button=ev.target&&ev.target.closest?ev.target.closest("button[data-frauen-share]"):null;
  if(!button)return;
  var kind=button.getAttribute("data-frauen-share")||"";
  if(!/^(copy-link|wa|tg|native)$/.test(kind))return;
  var article=button.closest("article.post-reader");
  if(!article||!document.body.classList.contains("is-frauen-route"))return;
  var link=canonical(article.querySelector("a.frauen-direktnachweis[href]"));
  if(!link)return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  if(button.getAttribute("aria-busy")==="true")return;
  var title=article.querySelector(".post-reader-title h2");
  var heading=title?String(title.textContent||"").trim():"Frauenwissen";
  var prefix="DĀR AL TAWḤĪD · "+heading;
  if(kind==="wa"){window.open("https://wa.me/?text="+encodeURIComponent(prefix+"\n\n"+link),"_blank","noopener,noreferrer");return}
  if(kind==="tg"){window.open("https://t.me/share/url?url="+encodeURIComponent(link)+"&text="+encodeURIComponent(prefix),"_blank","noopener,noreferrer");return}
  button.setAttribute("aria-busy","true");
  (async function(){
    try{
      if(kind==="copy-link"){notice(await copy(link)?"Link kopiert":"Kopieren nicht möglich");return}
      if(navigator.share){try{await navigator.share({title:heading,text:prefix,url:link});return}catch(e){if(e&&e.name==="AbortError")return}}
      notice(await copy(prefix+"\n\n"+link)?"Text und Link kopiert":"Teilen nicht möglich");
    }finally{button.removeAttribute("aria-busy")}
  })().catch(function(){button.removeAttribute("aria-busy");notice("Teilen gerade nicht verfügbar")});
},true);
})();