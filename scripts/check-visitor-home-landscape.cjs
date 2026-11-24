#!/usr/bin/env node
/* Single visible visitor Home in tablet/phone/Fold landscape.
 * Safeguards the working portrait view and five navigation tabs.
 * No live website, notifications or browser mutation required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../assets/dar-home-test-parity-visitor.js'),'utf8');
new vm.Script(src,{filename:'dar-home-test-parity-visitor.js'});
const begin=src.indexOf('var landscapeHiddenApp=null,landscapeAppOriginal=null;');
const end=src.indexOf('function sync(){',begin);
assert.ok(begin>0&&end>begin,'Missing dedicated landscape ownership controller');
const attrs=new Map();
const style=new Map([['display',{value:'grid',priority:''}]]);
const app={
 style:{
  getPropertyValue:k=>style.get(k)?.value||'',
  getPropertyPriority:k=>style.get(k)?.priority||'',
  setProperty(k,value,priority=''){style.set(k,{value,priority})},
  removeProperty:k=>style.delete(k)
 },
 hasAttribute:k=>attrs.has(k),
 getAttribute:k=>attrs.get(k)??null,
 setAttribute(k,v){attrs.set(k,String(v))},
 removeAttribute:k=>attrs.delete(k),
 contains:()=>false
};
const root={isConnected:true};
const body={classList:{contains:k=>k==='is-home-route'&&home}};
let home=true;
const window={innerWidth:390,innerHeight:844};
const document={
 body,
 getElementById:id=>id==='appView'?app:null
};
const context=vm.createContext({document,window});
const hide=vm.runInContext(src.slice(begin,end)+';lockLandscapeHome;',context);
function frame(w,h,isHome=true){
 window.innerWidth=w;window.innerHeight=h;home=isHome;
 hide(root);
 return {
  display:app.style.getPropertyValue('display'),
  priority:app.style.getPropertyPriority('display'),
  hidden:app.getAttribute('aria-hidden'),
  inert:app.hasAttribute('inert')
 };
}
let x=frame(390,844);
assert.equal(x.display,'grid','portrait appearance must not be touched');
assert.equal(x.hidden,null,'portrait accessible reading surface unexpectedly hidden');
for(const [w,h]of [[844,390],[1366,1024],[1024,768],[900,650],[780,560]]){
 x=frame(w,h);
 assert.equal(x.display,'none',w+'x'+h+' reveals the old Home');
 assert.equal(x.priority,'important','landscape renderer must win over CSS overrides');
 assert.equal(x.hidden,'true','duplicate reader must be hidden from screen reader');
 assert.equal(x.inert,true,'hidden duplicate must not capture clicks or focus');
 x=frame(w,h);
 assert.equal(x.display,'none','idempotent orientation refresh');
}
x=frame(768,1024);
assert.equal(x.display,'grid','landscape-only override leaked into portrait');
assert.equal(x.hidden,null);
assert.equal(x.inert,false);
x=frame(1024,768);
x=frame(1024,768,false);
assert.equal(x.display,'grid','leaving Start must restore the original reader');
assert.equal(x.hidden,null);
assert.equal(x.inert,false);
x=frame(844,390);
root.isConnected=false;
hide(root);
assert.equal(app.style.getPropertyValue('display'),'grid','removed parity root must release the legacy reader');
root.isConnected=true;
hide(root);
assert.equal(app.style.getPropertyValue('display'),'none');
const newAttrs=new Map();
const other={
 ...app,style:{
  getPropertyValue:k=>newAttrs.get('style:'+k)||'',
  getPropertyPriority:k=>newAttrs.get('priority:'+k)||'',
  setProperty(k,v,p){newAttrs.set('style:'+k,v);newAttrs.set('priority:'+k,p)},
  removeProperty(k){newAttrs.delete('style:'+k);newAttrs.delete('priority:'+k)}
 },
 setAttribute(k,v){newAttrs.set(k,String(v))},
 getAttribute:k=>newAttrs.get(k)??null,
 hasAttribute:k=>newAttrs.has(k),
 removeAttribute:k=>newAttrs.delete(k)
};
document.getElementById=id=>id==='appView'?other:null;
hide(root);
assert.equal(app.style.getPropertyValue('display'),'grid','replaced appView did not restore original state');
assert.equal(other.style.getPropertyValue('display'),'none','new appView reveals second Home');
assert.equal(other.getAttribute('aria-hidden'),'true');
for(const key of ['"resize",queue','"orientationchange",queue','"dar:layoutchange",queue'])
 assert.ok(src.includes(key),'missing orientation/layout event: '+key);
assert.ok(src.includes('root=create();')&&src.includes('lockLandscapeHome(root);'),'actual Home renderer is not protected');
assert.ok(src.includes('restoreDarHomeScroll()'),'portrait navigation/scroll-back contract lost');
const router=fs.readFileSync(path.join(__dirname,'../cloudflare/site-router.js'),'utf8');
assert.ok(router.includes('dar-home-test-parity-visitor.js?v=20261124-single-home-boot-v2'),
 'native iOS / Android asset pin must load the fixed Home, not cached legacy JS');
console.log('Visitor landscape single Home ownership passed: phone, Fold, tablet, rotation, route, DOM replacement.');
