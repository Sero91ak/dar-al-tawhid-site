#!/usr/bin/env node
"use strict";
/* Fail closed if a newly added adult UI omits one of nine required languages
 * or recreates the broken new-post popup actions and background access. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const registryJs=read("assets/i18n/adult-component-i18n-v1.js");
const moduleJs=read("assets/dar-home-recent-posts-v1.js");
const moduleCss=read("assets/dar-home-recent-posts-v1.css");
const builder=read("scripts/build-desktop-posts-index.js");
const router=read("cloudflare/site-router.js");
assert(router.includes("/assets/dar-home-recent-posts-v1.js?v=20261101-premium-home-v11"),"Current adult Worker must bust cached pre-scroll-fix JS in iOS/PWA");
const dailyHub=read("assets/dar-visitor-daily-hub-v1.js");
const archiveJs=read("assets/dar-recent-archive-v1.js");
const archiveHtml=read("neueste-beitraege/index.html");
const pwaArchiveHtml=read("pwa/neueste-beitraege/index.html");

const languages=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(languages,["de","ar","en","tr","ku","ckb","bs","fr","es"]);
const first=moduleJs.indexOf("var labels={");
const last=moduleJs.indexOf("\n};\n",first);
assert(first>=0&&last>first,"Latest-posts UI translation dictionary missing");
const labels=vm.runInNewContext("("+moduleJs.slice(first+"var labels=".length,last+2)+")");
assert.deepEqual(Object.keys(labels),languages,"Nine adult UI locale catalogues required in exact app order");
for(const code of languages){
 assert(Array.isArray(labels[code])&&labels[code].length===19,code+" must have 19 UI strings");
 assert(labels[code].every(x=>typeof x==="string"&&x.trim()),code+" has empty UI label");
 for(const index of [0,1,2,3,4,5,7,8,9,11,12,13,14,15,16,17,18])assert(labels[code][index],code+" missing UI label "+index);
}
const win={localStorage:{getItem:()=> "tr"},addEventListener:()=>{}};
vm.runInNewContext(registryJs,{window:win});
const api=win.DARAdultComponentI18nV1;
assert(api&&api.languages.length===9,"Reusable adult UI registry missing");
assert.equal(api.register("recent-posts",labels),true);
assert.equal(api.t("recent-posts","7"),labels.tr[7],"App language not applied");
assert.throws(()=>api.register("incomplete",{de:{x:"one"}}),"Incomplete new feature language catalog passed");
assert(moduleJs.includes('var registry=w.DARAdultComponentI18nV1'),"Latest-posts UI bypasses shared adult locale registry");
assert(moduleJs.includes('var layer=e("dialog","dar-recent-notice-overlay")')&&moduleJs.includes("layer.showModal()"),"Popup must use the native top-layer dialog");
assert(moduleJs.includes("function bindNoticeAction(el,fn)")&&moduleJs.includes('el.addEventListener("pointerup"')&&moduleJs.includes('el.addEventListener("click"'),"Per-control iOS touch/click handlers missing");
assert(moduleJs.includes('bindNoticeAction(a,function(){dismissNotice(false);openPostById(p.id)})'),"Popup must dismiss before opening post");
assert(moduleJs.includes('bindNoticeAction(all,function(){dismissNotice(false);openArchive()})')&&moduleJs.includes('function openArchive(){openInlineList(false)}'),"View all popup must use the internal app post list");
assert(moduleJs.includes('bindNoticeAction(skip,function(){dismissNotice(true)})'),"Skip new-post batch missing");
assert(moduleJs.includes("child.inert=true")&&moduleJs.includes('root.style.setProperty("overflow","hidden","important")')&&moduleJs.includes('d.addEventListener("touchmove",noticeTouchGuard,{capture:true,passive:false})'),"WKWebView scroll/focus not locked");
assert(moduleJs.includes("unlockNoticeBackground()")&&moduleJs.includes("item.node.inert=item.inert")&&moduleJs.includes("restore(d.documentElement,lock.html)"),"Background not restored after close");
assert(moduleJs.includes('function openInlineList(returning)')&&moduleJs.includes('function closeInlineList(toPost)')&&moduleJs.includes('function syncInlineAfterRoute()'),"In-app posts list and back-navigation missing");
assert(!moduleJs.includes('location.assign(archiveUrl())')&&!moduleJs.includes('a.href=archiveUrl()'),"Opening recent posts must never load a separate web page");
assert(moduleJs.includes('function recentInlinePosts(){return recent(state.posts,5)}'),"Recent list must internally use recent publications without visible day selector");
assert(!moduleJs.includes('dar-archive-tab')&&!moduleJs.includes('darArchiveLanguage'),"Internal recent list must never show manual language or day filter");
assert(moduleJs.includes('t(7)+" ›"'),"Read post label must use correct translation");
assert(moduleJs.includes('function fetchTitleManifests(posts)'),"Localized titles not supported");
assert(moduleJs.includes("var NOTICE_READ=\"darAdultLatestPostsSeenIdsV2\""),"Persistent per-app read-state missing");
assert(moduleJs.includes("function initializeSeen(posts)")&&moduleJs.includes("function unreadPosts()")&&moduleJs.includes("function acknowledgeCurrentPosts()"),"New-post-only acknowledgement logic missing");
assert(moduleJs.includes("acknowledgeCurrentPosts();")&&moduleJs.includes("w.localStorage.setItem(NOTICE_READ"),"Notification interactions must persist read status");
assert(moduleJs.includes("if(!force&&!unreadPosts().length)return false"),"Same contribution must never pop up again after app restart");
assert(moduleJs.includes("if(unreadPosts().length)state.modalShown=false"),"App foreground must notice genuinely new content");
assert(moduleJs.includes("function enforceCanonicalHomeOrder(native,mount)")&&moduleJs.includes('".dhp-welcome",".dhp-isnad",".dhp-quickbar",".dhp-search-box",".dhp-quran-section"'),"Fixed Salām→Ibn Sīrīn→Qibla/Library→Search→Qurʾān sequence not enforced");
assert(moduleJs.includes('content.querySelector(".dat-smart-prayer")')&&moduleJs.includes('content.querySelector("#dhpPrayerNativeMount")')&&moduleJs.includes('preWelcome=prayer')&&moduleJs.includes('preWelcome.insertAdjacentElement("afterend",chain[0])'),"Prayer-time card must remain BEFORE Salām, never behind recent posts");
assert(dailyHub.includes('root.querySelector("#darRecentPublicationsV1")')&&dailyHub.includes('root.querySelector(".dhp-quran-section")')&&!dailyHub.includes('(mount||welcome).insertAdjacentElement("afterend",card)'),"Daily question must not interrupt the fixed Salām-to-Qurʾān home sequence");

assert(moduleJs.includes('dar-recent-premium-track')&&moduleJs.includes('dar-recent-premium-toggle')&&moduleJs.includes('anchor:q||native.querySelector("#dhpLibrary")'),"Home publication capsule must be readable and anchored directly after Quran");
assert(moduleCss.includes("HOME_RECENT_PREMIUM_V1")&&moduleCss.includes("scroll-snap-type:x mandatory"),"Responsive premium post slider missing");
assert(router.includes("/assets/dar-home-recent-posts-v1.css?v=20261101-premium-home-v11"),"Premium CSS cache bust missing");
assert(builder.includes('localeManifest:/^\\/assets\\/'),"Canonical per-post locale manifest missing from generated index");
assert(moduleCss.includes("var(--notice-paper")&&moduleCss.includes("dialog#darRecentNoticeV1::backdrop")&&moduleJs.includes("applyNoticeTheme(layer)"),"Modern native modal appearance palette missing");
assert(router.indexOf('id="darAdultComponentI18nV1"')<router.indexOf('id="darHomeRecentPostsV1Js"'),"Shared locale registry must load before latest-posts component");
assert(archiveHtml.includes('location.replace("/?recent=1")')&&pwaArchiveHtml.includes('location.replace("/pwa/?pwa=1&recent=1")'),"Legacy archive URL must lead to the same internal visitor view");
assert(!archiveHtml.includes("darArchiveTabs")&&!pwaArchiveHtml.includes("darArchiveTabs"),"No separate day-filter archive screens may be linked");
assert(moduleJs.includes('toggle.addEventListener("click",function(){flat.hidden=!flat.hidden;')&&moduleJs.includes('var link=e("a","dar-recent-premium-read"'),"Premium capsule must expand a flat list and open the native post reader");
assert(moduleJs.includes('a.addEventListener("click",function(ev){')&&moduleJs.includes('closeInlineList(true);')&&moduleJs.includes('openPostById(p.id);'),"Post row must open original app post reader, without full page load");
assert(moduleJs.includes('state.renderedInlineLocale=locale()')&&moduleJs.includes('paintInlineList()')&&moduleJs.includes('dar-adult-locale-changed'),"Inline post titles must follow the chosen app language");
assert(moduleCss.includes('body.dar-recent-inline-open #darHomeHtmlParityV1')&&moduleCss.includes('#darRecentInlineListV2 .dar-recent-inline-entry'),"Native inline post list visual style missing");
assert(!moduleCss.includes('darArchiveLanguage'),"Internal list must have no standalone language picker");


/* Executed, not only string-matched: reproduce the WKWebView interaction
   contract for touch, synthetic click, and scroll lock restoration. */
const actionSource=moduleJs.slice(moduleJs.indexOf("function bindNoticeAction(el,fn){"),moduleJs.indexOf("function noticeClick(ev){"));
assert(actionSource.includes("function bindNoticeAction"),"Missing direct click action source");
const bindNoticeAction=new Function(actionSource+";return bindNoticeAction")();
const handlers={};const button={addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)};
let fired=0;
bindNoticeAction(button,()=>{fired++});
const ev=(x=10,y=9)=>({clientX:x,clientY:y,key:"Enter",preventDefault(){},stopPropagation(){}});
handlers.pointerdown[0](ev());handlers.pointerup[0](ev());handlers.click[0](ev());
assert.equal(fired,1,"Touch plus synthetic click must fire once");
const drag={handlers:{},addEventListener:function(n,f){(this.handlers[n]??=[]).push(f)}};let dragged=0;
bindNoticeAction(drag,()=>{dragged++});
drag.handlers.pointerdown[0](ev());drag.handlers.pointerup[0](ev(37,10));
assert.equal(dragged,0,"Scroll gesture must not activate a post");

const lockSource=moduleJs.slice(moduleJs.indexOf("function lockNoticeBackground(layer){"),moduleJs.indexOf("function noticeFocus(ev){"));
assert(lockSource.includes("function unlockNoticeBackground"),"Missing scroll restoration logic");
function fakeStyle(){const values={},priority={};return{
 getPropertyValue:k=>values[k]||"",getPropertyPriority:k=>priority[k]||"",
 setProperty:(k,v,p)=>{values[k]=String(v);priority[k]=p||""},
 removeProperty:k=>{delete values[k];delete priority[k]}
}}
const lockRoot={style:fakeStyle(),classList:{add(){},remove(){}},scrollTop:0};
const body={style:fakeStyle(),children:[],scrollTop:35};
const content={tagName:"MAIN",inert:false,isConnected:true},dialog={tagName:"DIALOG"};
body.children=[content,dialog];
lockRoot.style.setProperty("overflow","auto","important");
body.style.setProperty("position","relative","");
const listeners={};
const mockDocument={
 body,documentElement:lockRoot,scrollingElement:lockRoot,
 addEventListener:(k,fn)=>{(listeners[k]??=[]).push(fn)},
 removeEventListener:()=>{},getElementById:()=>dialog
};
const mockWindow={scrollY:35,scrollTo(){}};
const mockState={inertItems:[],scrollLock:null};
const testLock=new Function("d","w","state",lockSource+";return {lockNoticeBackground,unlockNoticeBackground}")(mockDocument,mockWindow,mockState);
testLock.lockNoticeBackground(dialog);
assert(content.inert,"Background not inert during native dialog");
assert.equal(lockRoot.style.getPropertyValue("overflow"),"hidden","iPhone root scroll not locked");
assert.equal(body.style.getPropertyValue("position"),"fixed","iPhone body scroll not locked");
assert.equal(listeners.touchmove.length,1,"Nonpassive touch guard missing");
let prevented=false;
listeners.touchmove[0]({target:content,touches:[{clientY:8}],cancelable:true,preventDefault(){prevented=true}});
assert(prevented,"Touchmove on background must be cancelled");
testLock.unlockNoticeBackground();
assert.equal(content.inert,false,"Background remains inert after closing");
assert.equal(lockRoot.style.getPropertyValue("overflow"),"auto","Original root overflow not restored");
assert.equal(body.style.getPropertyValue("position"),"relative","Original body position not restored");
assert.equal(lockRoot.style.getPropertyPriority("overflow"),"important","Original overflow priority not restored");

console.log("ADULT_UI_NINE_LOCALES_AND_POPUP OK: 9 languages, native dialog, direct touch actions, WKWebView lock, theme, localized titles and executed interaction tests.");
