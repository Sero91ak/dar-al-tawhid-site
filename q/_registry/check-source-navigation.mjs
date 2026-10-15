#!/usr/bin/env node
/* Q_SOURCE_CLICK_REGRESSION_V1: real adult-shell click delegate in sandbox.
   Guards: valid Q page opens; 404/SPA pages never blank the current reader;
   non-Q destinations are untouched. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=fs.readFileSync(path.join(root,'assets/dar-app-chrome.js'),'utf8');
new vm.Script(source,{filename:'assets/dar-app-chrome.js'});
assert.match(source,/Q_SOURCE_IN_FRAME_V2/);
function simulate(href,html,status=200){
  const listeners={};
  const assigned=[];
  const toasts=[];
  let fetched=0;
  const viewport={setAttribute(){}};
  const doc={
    documentElement:{appendChild(){}},
    body:{appendChild(node){toasts.push(node)}},
    head:{appendChild(){}},
    querySelector(){return viewport},
    querySelectorAll(){return []},
    getElementById(){return null},
    createElement(){return {
      style:{},setAttribute(){},addEventListener(){},remove(){},
      textContent:'',hidden:false
    }},
    addEventListener(name,handler){(listeners[name]??=[]).push(handler)}
  };
  const context={
    document:doc,
    window:{__darAppChromeInstalled:false,addEventListener(){}},
    location:{origin:'https://dar-al-tawhid.de',href:'https://dar-al-tawhid.de/',
      assign(url){assigned.push(url)}},
    fetch:async()=>{fetched++;return {ok:status===200,status,
      headers:{get(name){return name==='content-type'?'text/html; charset=utf-8':''}},
      text:async()=>html}},
    MutationObserver:class{observe(){}},
    setTimeout(){return 123},
    clearTimeout(){},
    AbortController,
    requestAnimationFrame(){},
    performance:{now(){return 0}},
    URL
  };
  vm.runInNewContext(source,context,{timeout:4000});
  assert.ok(listeners.click?.length);
  const anchor={hasAttribute(){return false},getAttribute(k){return k==='href'?href:''}};
  const ev={defaultPrevented:false,button:0,target:{closest(){return anchor}},
    preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){}};
  listeners.click[0](ev);
  return new Promise(resolve=>setImmediate(()=>setImmediate(()=>resolve({assigned,toasts,fetched,prevented:ev.defaultPrevented}))));
}
const valid='<html><body class="qsource-body"><main class="qsource-page"><div class="qsource-links"><a class="qsource-link web" href="https://islamweb.net/ar/library/content/50/123/#:~:text=abc">Nachweis</a></div></main></body></html>';
const good=await simulate('/q/43/',valid);
assert.deepEqual(good.assigned,['/q/43/'],'Valid Q must navigate in app main frame');
assert.equal(good.fetched,1);
assert.equal(good.toasts.length,0);
const broken=await simulate('/q/43/','Missing',404);
assert.equal(broken.assigned.length,0,'404 may not navigate to blank page');
assert.equal(broken.toasts.length,1,'404 must display a visible error');
const spa=await simulate('/q/43/','<html><body>App Startbildschirm</body></html>');
assert.equal(spa.assigned.length,0,'SPA fallback may not masquerade as Q');
assert.equal(spa.toasts.length,1);
const external=await simulate('https://islamweb.net/ar/library/content/50/123/','');
assert.equal(external.fetched,0,'External originals keep their own destination');
assert.equal(external.prevented,false);
console.log('Adult Q-source navigation OK: valid, 404, SPA fallback and external links.');
