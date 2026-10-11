/* KIDS TEST standalone shell bridge. Only on the dedicated workers.dev host.
 * Does not grant privileges, change lessons or access private records.
 */
(function(){
"use strict";
const HOST="dar-al-tawhid-kids-creator.sero91ak.workers.dev";
if(location.hostname!==HOST||!location.pathname.startsWith("/kids/")||location.pathname.startsWith("/kids/test-console/"))return;
if(document.getElementById("darKidsCreatorBack"))return;
const style=document.createElement("style");
style.id="kids-creator-bridge-css";
style.textContent=`#darKidsCreatorBack{all:initial!important;position:fixed!important;right:10px!important;top:calc(54px + env(safe-area-inset-top,0px))!important;z-index:2147483600!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:8px 11px!important;min-height:40px!important;min-width:87px!important;max-width:160px!important;border:1px solid #d6c28c!important;border-radius:18px!important;background:#0c2837f2!important;box-shadow:0 3px 15px #0008!important;color:#f0d79d!important;font:800 12px/1.15 -apple-system,BlinkMacSystemFont,"Avenir Next",Arial,sans-serif!important;text-decoration:none!important;letter-spacing:.015em!important}#darKidsCreatorBack:focus-visible{outline:3px solid white!important;outline-offset:3px!important}@media(max-width:370px){#darKidsCreatorBack{right:5px!important;top:calc(46px + env(safe-area-inset-top,0px))!important;padding:6px!important;min-width:66px!important;font-size:11px!important}}`;
const button=document.createElement("a");button.id="darKidsCreatorBack";button.href="/kids/test-console/";button.textContent="← KIDS TEST";button.title="Zur getrennten KIDS-Prüfzentrale";button.setAttribute("aria-label","Zur KIDS TEST Prüfzentrale zurück");
const attach=()=>{(document.head||document.documentElement).appendChild(style);(document.body||document.documentElement).appendChild(button)};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});else attach();
})();
