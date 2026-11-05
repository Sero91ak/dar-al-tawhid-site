/* DĀR ADMIN · two-appearance controller, limited to /admin/.
 * Never mutates content, auth, publishing, visitor themes, or push settings. */
(()=>{"use strict";
 if(!/^\/admin(?:\/|$)/.test(location.pathname))return;
 const KEY="darAdminAppearanceV2", DARK="layl", LIGHT="salbei";
 const MODES=new Set([DARK,LIGHT]);
 const root=document.documentElement;
 const label={layl:"DĀR AL LAYL",salbei:"Salbei–Elfenbein"};
 let current=MODES.has(root.dataset.darAdminTheme)?root.dataset.darAdminTheme:DARK;
 const $=(s)=>document.querySelector(s);
 function icon(mode){return mode===DARK?"☾":"☀"}
 function make(tag,className,text){
   const node=document.createElement(tag);if(className)node.className=className;
   if(text!==undefined)node.textContent=text;return node;
 }
 function apply(mode,save){
   current=MODES.has(mode)?mode:DARK;
   root.dataset.darAdminTheme=current;
   root.style.colorScheme=current===LIGHT?"light":"dark";
   const meta=$('meta[name="theme-color"]');
   if(meta)meta.setAttribute("content",current===LIGHT?"#f4f6f0":"#0c0e0d");
   if(save){try{localStorage.setItem(KEY,current)}catch(_){}}
   document.querySelectorAll("[data-dar-admin-switch]").forEach(btn=>{
     const target=current===DARK?LIGHT:DARK;
     btn.title="Zu "+label[target]+" wechseln";
     btn.setAttribute("aria-label",btn.title);
     const ico=btn.querySelector(".theme-icon"),txt=btn.querySelector(".theme-label");
     if(ico)ico.textContent=icon(current);
     if(txt)txt.textContent=label[current];
   });
   document.querySelectorAll("[data-dar-admin-choice]").forEach(btn=>{
     const selected=btn.dataset.darAdminChoice===current;
     btn.setAttribute("aria-pressed",String(selected));
   });
   // The nine-language studio is a same-origin iframe with a separate document.
   // Mirror only appearance state, never editorial content or credentials.
   try{
     const frame=$("#darAdminEditorialFrame"),doc=frame?.contentDocument;
     if(doc?.documentElement){
       doc.documentElement.dataset.darAdminTheme=current;
       doc.documentElement.style.colorScheme=current===LIGHT?"light":"dark";
       const childMeta=doc.querySelector('meta[name="theme-color"]');
       if(childMeta)childMeta.setAttribute("content",current===LIGHT?"#f4f6f0":"#0c0e0d");
     }
   }catch(_){}
   document.dispatchEvent(new CustomEvent("dar-admin-appearance-change",{detail:{theme:current}}));
 }
 function switchButton(classExtra=""){
   const btn=make("button","dar-admin-appearance-toggle "+classExtra);
   btn.type="button";btn.dataset.darAdminSwitch="1";
   btn.append(make("span","theme-icon"),make("span","theme-label"));
   btn.addEventListener("click",()=>apply(current===DARK?LIGHT:DARK,true));
   return btn;
 }
 function choice(mode){
   const btn=make("button","dar-admin-theme-choice");
   btn.type="button";btn.dataset.darAdminChoice=mode;
   btn.setAttribute("aria-label",label[mode]+" auswählen");
   const swatch=make("span","dar-admin-theme-swatch "+mode);swatch.setAttribute("aria-hidden","true");
   const content=make("span","");
   content.append(make("strong","",label[mode]),make("small","",mode===DARK?"Dunkel · Nachtgrün und Gold":"Hell · Salbei und Elfenbein"));
   btn.append(swatch,content);
   btn.addEventListener("click",()=>apply(mode,true));
   return btn;
 }
 function mountToolbar(){
   const bar=$("#topbar .toolbar");
   if(bar&&!bar.querySelector("[data-dar-admin-switch]"))bar.prepend(switchButton());
 }
 function mountLogin(){
   const login=$("#panel .login");
   if(!login||login.querySelector("[data-dar-admin-switch]"))return;
   const btn=switchButton("dar-admin-appearance-login");
   const anchor=login.querySelector("#loginBtn");
   if(anchor)anchor.insertAdjacentElement("afterend",btn);else login.append(btn);
 }
 function mountSettings(){
   if($("#adminTabSelect")?.value!=="settings")return;
   const first=$("#panel .split>.panel");
   if(!first||first.querySelector(".dar-admin-appearance-settings"))return;
   const card=make("section","dar-admin-appearance-settings");
   const title=make("h3","","Erscheinungsbild");
   const description=make("p","","Wird nur für die Admin-App auf diesem Gerät gespeichert. Beide Designs verwenden dieselben Funktionen.");
   const options=make("div","dar-admin-theme-choices");
   options.setAttribute("role","group");options.setAttribute("aria-label","Admin-Erscheinungsbild");
   options.append(choice(DARK),choice(LIGHT));
   card.append(title,description,options);
   const heading=first.querySelector(".section-head");
   if(heading)heading.insertAdjacentElement("afterend",card);else first.prepend(card);
 }
 function mount(){
   mountToolbar();mountLogin();mountSettings();
   apply(current,false);
 }
 function boot(){
   const panel=$("#panel");
   if(!panel)return;
   // Observe replacement of the main panel only. Never observe our own nested buttons.
   new MutationObserver(()=>queueMicrotask(mount)).observe(panel,{childList:true});
   mount();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
 else boot();
})();
