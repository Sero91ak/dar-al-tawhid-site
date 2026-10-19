/* Dar Test Studio V2 – opt-in local appearance; NEVER modifies server/shared app.
   Only /test Home; no visitors, Kids, Qibla, OneSignal or prayer-calculation changes. */
(function(){"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__DAR_TEST_STUDIO_LOCAL_V2)return;window.__DAR_TEST_STUDIO_LOCAL_V2=true;
const KEY="dar_visual_studio_v2",ACTIVE="dar_visual_studio_local_enabled_v2";
const root=document.documentElement;
let running=false,queued=false;
const num=(v,a,b)=>typeof v==="number"&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):null;
const cssEsc=v=>window.CSS&&CSS.escape?CSS.escape(v):String(v).replace(/([^a-zA-Z0-9_-])/g,"\\$1");
function get(){try{const data=JSON.parse(localStorage.getItem(KEY)||"null");return data?.version===2&&data.items&&typeof data.items==="object"?data:null}catch(e){return null}}
function enabled(){try{return localStorage.getItem(ACTIVE)==="1"}catch(e){return false}}
function byKey(key){
 if(key.startsWith("image:"))return document.querySelector('[data-ve-image-id="'+cssEsc(key.slice(6))+'"]');
 if(key.startsWith("fragment:"))return document.querySelector('[data-ve-fragment-id="'+cssEsc(key.slice(9))+'"]');
 try{return document.querySelector(key)}catch(e){return null}
}
function applyOne(el,v){
 if(!el||!v)return;
 if(v.hidden)el.style.setProperty("display","none","important");
 const numerics=[
 ["fontSize","font-size",8,110,"px"],["lineHeight","line-height",.8,2.6,""],
 ["letterSpacing","letter-spacing",-4,14,"px"],["marginTop","margin-top",-120,220,"px"],["marginBottom","margin-bottom",-120,220,"px"],
 ["padding","padding",0,100,"px"],["radius","border-radius",0,70,"px"],["opacity","opacity",.05,1,""],
 ["height","height",0,700,"px"],["width","width",12,150,"%"],["zIndex","z-index",-9,999,""]
 ];
 for(const [key,prop,a,b,suffix]of numerics){
  const n=num(v[key],a,b);if(n!==null)el.style.setProperty(prop,n+suffix,"important");
 }
 for(const [key,prop]of [["fontFamily","font-family"],["fontWeight","font-weight"],["textAlign","text-align"],["color","color"],["background","background-color"]]){
  if(typeof v[key]==="string"&&v[key].length<200)el.style.setProperty(prop,v[key],"important");
 }
 const x=num(v.x,-450,450),y=num(v.y,-600,600);
 if(x!==null||y!==null)el.style.setProperty("translate",(x||0)+"px "+(y||0)+"px","important");
 if(typeof v.text==="string"&&!el.closest("#headerPrayerStatus,#dv3Latest,#homeSearchBlock")&&!el.matches("input,select,textarea")&&v.text.length<=4000&&el.textContent!==v.text){
  el.textContent=v.text;
 }
 const url=typeof v.backgroundImage==="string"?v.backgroundImage:"";
 if((/^https:\/\//.test(url)||/^data:image\/(png|jpeg|webp);base64,/.test(url))&&url.length<1500000){
  el.style.setProperty("background-image",'url("'+url.replace(/["\\\r\n]/g,"")+'")',"important");
  el.style.setProperty("background-size",v.imageFit==="contain"?"contain":"cover","important");
  el.style.setProperty("background-position","center","important");
 }
}
function fragments(data){
 for(const f of data.fragments||[]){
  if(!f?.id||!f?.parent||!f?.text||f.text.length>120)continue;
  const node=byKey(f.parent);
  if(!node||node.closest("#headerPrayerStatus,#dv3Latest")||node.querySelector('[data-ve-fragment-id="'+cssEsc(f.id)+'"]'))continue;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let n;
  while(n=walker.nextNode()){
   const i=n.textContent.indexOf(f.text);if(i<0)continue;
   try{const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+f.text.length);
    const span=document.createElement("span");span.dataset.veFragmentId=f.id;span.style.display="inline-block";
    r.surroundContents(span);break;
   }catch(e){break}
  }
 }
}
function images(data){
 for(const image of data.images||[]){
  if(!image?.id||!image?.anchor||!image?.src)continue;
  if(!/^https:\/\//.test(image.src)&&!/^data:image\/(png|jpeg|webp);base64,/.test(image.src))continue;
  const anchor=byKey(image.anchor);if(!anchor)continue;
  let el=byKey("image:"+image.id);
  if(!el){el=document.createElement("img");el.alt="Design-Bild";el.dataset.veImageId=image.id;el.draggable=false;anchor.appendChild(el)}
  if(el.src!==image.src)el.src=image.src;
  if(getComputedStyle(anchor).position==="static")anchor.style.position="relative";
  el.style.cssText="position:absolute;top:0;left:0;width:30%;height:auto;object-fit:contain;z-index:8;pointer-events:none;";
  const base=data.items["image:"+image.id]||{};
  const bp=(base.breakpoints||{})[innerWidth<=500?"phone":innerWidth<=1100?"tablet":"wide"]||{};
  applyOne(el,{opacity:image.opacity??1,width:30,...base,...bp});
 }
}
function apply(){
 if(!document.body?.classList.contains("is-home-route")||!enabled())return;
 const data=get();if(!data)return;
 fragments(data);images(data);
 const width=innerWidth,group=width<=500?"phone":width<=1100?"tablet":"wide";
 for(const [key,value]of Object.entries(data.items).slice(0,350)){
  const el=byKey(key);if(el)applyOne(el,{...value,...(value.breakpoints?.[group]||{})});
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{apply()}catch(e){}})}
function init(){
 if(!enabled())return;
 const parent=document.querySelector(".top-shell")||document.body;
 new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes,...x.removedNodes].some(n=>n.nodeType===1&&!n.hasAttribute?.("data-ve-image-id")&&!n.hasAttribute?.("data-ve-fragment-id"))))schedule()})
   .observe(parent,{subtree:false,childList:true});
 document.addEventListener("dar:view-rendered",schedule);
 window.addEventListener("pageshow",schedule);
 window.addEventListener("hashchange",schedule);
 window.addEventListener("storage",schedule);
 setTimeout(schedule,250);setTimeout(schedule,1100);setTimeout(schedule,2600);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();