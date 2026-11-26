#!/usr/bin/env node
/* Visitor Home route contract: exactly one canonical parity loader, warm
 * recovery after a failed/late orientation mount, no Swift or push changes. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const router=fs.readFileSync(path.join(root,'cloudflare/site-router.js'),'utf8');
const boot=fs.readFileSync(path.join(root,'assets/dar-visitor-home-bootstrap-v2.js'),'utf8');
const parity=fs.readFileSync(path.join(root,'assets/dar-home-test-parity-visitor.js'),'utf8');
new vm.Script(boot,{filename:'dar-visitor-home-bootstrap-v2.js'});
new vm.Script(parity,{filename:'dar-home-test-parity-visitor.js'});
const begin=router.indexOf('function activateAdultGlobalBrandV2(');
const end=router.indexOf('/* DAR_HTML5_DOCTYPE_BARRIER',begin);
assert.ok(begin>=0&&end>begin,'adult native/PWA router missing');
const activate=vm.runInNewContext(router.slice(begin,end)+'\nactivateAdultGlobalBrandV2;');
for(const html of [
 '<!doctype html><html><head></head><body></body></html>',
 '<html><body><script defer src="/assets/dar-home-test-parity-visitor.js?v=20261111-home-performance-v1"></script></body></html>',
 '<html><body><script src="/assets/dar-home-test-parity-visitor.js"></script></body></html>',
 '<html><body><script defer src="/assets/dar-home-test-parity-visitor.js?v=20261126-single-home-landscape-v1"></script></body></html>'
]){
 const after=activate(html);
 const parityTags=after.match(/<script[^>]*src="\/assets\/dar-home-test-parity-visitor\.js[^"]*"/g)||[];
 const bootTags=after.match(/<script[^>]*src="\/assets\/dar-visitor-home-bootstrap-v2\.js[^"]*"/g)||[];
 assert.equal(parityTags.length,1,'native shell needs one canonical parity loader');
 assert.equal(bootTags.length,1,'native shell needs one bounded recovery boot');
 assert.match(parityTags[0],/20261126-single-home-landscape-v1/,'stale script path');
 assert.equal(activate(after),after,'native router injection is not idempotent');
}
assert.match(router,/if \(assetResponse\.ok\) html = activateAdultGlobalBrandV2\(html\)/,'production native/PWA branch must inject boot');
assert.match(router,/20261126-single-home-landscape-v1/,'Android PWA parity URL not upgraded');

let currentPath='/',isHome=true,hasParity=false,loadedParity=false;
const listeners={},scripts=[],events=[];
const doc={
 readyState:'complete',
 body:{
  classList:{contains:k=>k==='is-home-route'&&isHome},
  appendChild:script=>scripts.push(script)
 },
 getElementById:id=>id==='darHomeHtmlParityV1'&&hasParity?{}:null,
 querySelector:sel=>sel==='.top-shell'?{}:null,
 createElement:tag=>({tag}),
 addEventListener:(type,fn)=>{listeners['document:'+type]=fn},
 dispatchEvent:event=>events.push(event.type)
};
const win={
 addEventListener:(type,fn)=>{listeners[type]=fn},
 __darHomeHtmlParityV1:false
};
const clock=[];
const context={window:win,document:doc,location:{pathname:currentPath},
 console:{warn:()=>{}},Event:class{constructor(type){this.type=type}},
 requestAnimationFrame:fn=>fn(),setTimeout:(fn)=>{clock.push(fn);return clock.length},
 clearTimeout:()=>{}};
vm.runInNewContext(boot,context);
assert.equal(scripts.length,1,'without the canonical renderer the boot must load it');
assert.match(scripts[0].src,/20261126-single-home-landscape-v1/);
assert.equal(scripts[0].id,'darVisitorParityRescueV2');
listeners.resize();
assert.equal(scripts.length,1,'repeated resize must never import a second renderer');
// A successfully loaded but temporarily unmounted parity renderer is
// re-synced via its existing event rather than restarted from scratch.
win.__darHomeHtmlParityV1=true;
scripts[0].onload();
assert.ok(events.includes('dar:view-rendered'),'parity renderer must be remounted after orientation');
hasParity=true;
listeners.orientationchange();
assert.equal(scripts.length,1,'mounted Home must be idempotent');
isHome=false;
listeners.hashchange();
assert.equal(scripts.length,1,'navigation away from Home must not reload parity');
const swift=fs.readFileSync(path.join(root,'ios/DarAlTawhid/DarAlTawhid/DarAppShell.swift'),'utf8');
assert.match(swift,/native_ios=1#home/,'native shell still uses canonical web entry');
assert.match(swift,/usesStagingWeb = false/,'production native URL changed');
console.log('VISITOR_HOME_BOOTSTRAP PASS: iOS/Android/PWA script presence, one renderer, warm recovery and portrait-safe route changes');
