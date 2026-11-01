#!/usr/bin/env node
/* DAR_SOURCE_ROUTER_INPLACE_V3
 * Verify same-page Q/Learn drawer, no full reload, source checks,
 * external links unchanged, error feedback, and reversible reader state. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=fs.readFileSync(path.join(root,'assets/dar-app-chrome.js'),'utf8');
new vm.Script(source,{filename:'assets/dar-app-chrome.js'});
assert.match(source,/DAR_INTERNAL_READER_V3/);
assert.doesNotMatch(source,/location\.assign\(target\)/);
assert.doesNotMatch(source,/location\.reload\(\)/);
class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.hidden=false;this.style={overflow:'',removeProperty(n){delete this[n];}};this.handlers={};this.textContent='';this.srcdoc='';this.parentNode=null;}
  setAttribute(k,v){this.attrs[k]=v}
  getAttribute(k){return this.attrs[k]??null}
  removeAttribute(k){delete this.attrs[k]}
  appendChild(c){this.children.push(c);c.parentNode=this;return c}
  removeChild(c){this.children=this.children.filter(x=>x!==c)}
  remove(){if(this.parentNode)this.parentNode.removeChild(this)}
  addEventListener(n,fn){(this.handlers[n]??=[]).push(fn)}
  querySelector(s){if(s==='.dar-source-label')return this.deep(x=>x.className==='dar-source-label');return null}
  deep(p){for(let x of this.children){if(p(x))return x;let r=x.deep?.(p);if(r)return r;}return null;}
  closest(){return null}
}
const good='<html lang="de"><head></head><body class="qsource-body"><main class="qsource-page"><div class="qsource-links"><a class="qsource-link web" href="https://islamweb.net/ar/library/content/50/123/#:~:text=abc">Nachweis</a></div></main></body></html>';
const learning='<html><head></head><body><main><section id="quiz">Lernfragen</section></main></body></html>';
async function simulate(href,html=good,status=200){
 const listeners={},fetches=[],assigned=[],registry=[],historyStates=[];
 const body=new Element('body'),head=new Element('head'),documentElement=new Element('html');
 const doc={
  body,head,documentElement,
  createElement(t){let e=new Element(t);registry.push(e);return e;},
  getElementById(id){return registry.find(x=>x.id===id)||null},
  querySelector(s){if(s==='meta[name="viewport"]')return {setAttribute(){}};return null},
  querySelectorAll(){return []},
  addEventListener(n,fn){(listeners[n]??=[]).push(fn)},
 };
 let currentState=null,backCount=0;
 const winEvents={};
 const win={
  __darAppChromeInstalled:false,
  history:{
   get state(){return currentState},
   pushState(v){currentState=v;historyStates.push(v)},
   back(){backCount++;currentState=null;for(const fn of winEvents.popstate||[])fn({state:null});}
  },
  addEventListener(n,fn){(winEvents[n]??=[]).push(fn);}
 };
 const ctx={
  document:doc,window:win,
  location:{origin:'https://dar-al-tawhid.de',href:'https://dar-al-tawhid.de/?page=posts',
   assign(u){assigned.push(u)},reload(){assigned.push('RELOAD')}},
  fetch:async u=>{fetches.push(u);return {ok:status===200,status,headers:{get(n){return n==='content-type'?'text/html; charset=utf-8':''}},text:async()=>html}},
  MutationObserver:class{observe(){}},
  setTimeout(){return 11},clearTimeout(){},AbortController,requestAnimationFrame(){},
  performance:{now(){return 0}},URL
 };
 vm.runInNewContext(source,ctx,{timeout:4500});
 const anchor={hasAttribute(){return false},getAttribute(k){return k==='href'?href:null}};
 const event={defaultPrevented:false,button:0,target:{closest(){return anchor}},
  preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){}};
 listeners.click[0](event);
 for(let i=0;i<8;i++)await Promise.resolve();
 const panel=registry.find(x=>x.id==='darInternalSourceV3');
 const frame=registry.find(x=>x.id==='darInternalSourceFrameV3');
 const toast=registry.find(x=>x.id==='darSourceNavigationError');
 return {event,panel,frame,toast,assigned,fetches,historyStates,body,win,getBackCount:()=>backCount};
}
let opened=await simulate('/q/45/',good);
assert.equal(opened.event.defaultPrevented,true,'Internal Q link intercepted');
assert.equal(opened.assigned.length,0,'Opening Q must NOT navigate parent or reload');
assert.equal(opened.fetches.length,1,'Q HTML validated only once');
assert.equal(opened.panel.hidden,false,'Drawer visible');
assert.ok(opened.frame.srcdoc.includes('class="qsource-body"'));
assert.ok(opened.frame.srcdoc.includes('<base href="https://dar-al-tawhid.de/q/45/">'));
assert.equal(opened.historyStates.length,1,'Back history marker installed');
assert.equal(opened.body.style.overflow,'hidden','App scroll frozen while source open');
let toolbar=opened.panel.children[0],actions=toolbar.children[0],back=actions.children[0],home=actions.children[1];
assert.equal(back.textContent,"← Zurück","Compact Back text must not consume whole header");
assert.equal(home.textContent,"⌂ Startseite","Reader must have independent Home control");
assert.equal(opened.panel.hidden,false,"The app reader remains mounted");
assert.match(opened.frame.srcdoc,/darEmbeddedReaderEdgeV4/,"Embedded Q/Learn content must have safe-area responsive reader layout");
back.handlers.click[0]();
assert.equal(opened.panel.hidden,true,'Back restores app reader');
assert.equal(opened.body.style.overflow,'','Scroll unlocked');
assert.equal(opened.getBackCount(),1,'Browser history marker removed');
assert.equal(opened.assigned.length,0,'Back never reloads app');
let lesson=await simulate('/lernen/ikhlas/',learning);
assert.equal(lesson.event.defaultPrevented,true);
assert.equal(lesson.panel.hidden,false);
assert.ok(lesson.frame.srcdoc.includes('Lernfragen'));
assert.match(lesson.frame.srcdoc,/body\.heritage-learning main/,"Learning page needs safe-area reading style");
let homeReader=await simulate('/q/45/',good);
homeReader.panel.children[0].children[0].children[1].handlers.click[0]();
assert.equal(homeReader.panel.hidden,true,"Home control must close source surface without reloading app");
assert.equal(homeReader.assigned.length,0,"Home control must not call location.assign");
const direct=fs.readFileSync(path.join(root,'assets/dar-reading-surface-v1.js'),'utf8');
new vm.Script(direct,{filename:'assets/dar-reading-surface-v1.js'});
assert.match(direct,/window\.self!==window\.top/,"Direct-page chrome must not duplicate embedded app toolbar");
const recentCss=fs.readFileSync(path.join(root,'assets/dar-home-recent-posts-v1.css'),'utf8');
assert.match(recentCss,/DAR_RECENT_COMPACT_ACTION_V2/,"Home disclosure must no longer stretch full width");
let missing=await simulate('/q/45/','404',404);
assert.equal(missing.event.defaultPrevented,true);
assert.equal(missing.panel,undefined);
assert.ok(missing.toast,'404 shows error without changing page');
let spa=await simulate('/q/45/','<html><body>App shell fallback</body></html>');
assert.ok(spa.toast,'SPA fallback is not accepted as Q HTML');
assert.equal(spa.panel,undefined);
let external=await simulate('https://islamweb.net/ar/library/content/50/123/');
assert.equal(external.event.defaultPrevented,false);
assert.equal(external.fetches.length,0);
assert.equal(external.panel,undefined);
assert.equal(external.assigned.length,0);
console.log('DAR in-app source navigation OK: source, learning, back, SPA/404 protection, external URLs, no reload.');
