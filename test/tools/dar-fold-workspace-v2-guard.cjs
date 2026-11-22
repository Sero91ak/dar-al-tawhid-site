#!/usr/bin/env node
"use strict";
/* DAR Test Fold V2 architecture guard. Never validates the live visitor App. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("test/assets/dar-fold-workspace-v2.js");
const css=read("test/assets/dar-fold-workspace-v2.css");
const worker=read("cloudflare/test-app-worker.js");
const offline=read("test/service-worker.js");
new vm.Script(js,{filename:"dar-fold-workspace-v2.js"});
assert.match(js,/darFoldPane/);
assert.match(js,/dar-fold-v2-route/);
assert.match(js,/scrollByCategory/);
assert.doesNotMatch(js,/Bereich wechseln/);
assert.doesNotMatch(js,/make\("header","dar-fold-v2-topbar"\)/);
assert.doesNotMatch(js,/dar-fold-v2-heading-3d/);
assert.match(js,/doc\.body\.append\(nav,pane\)/);
assert.match(js,/--dar-fold-v2-visible-height/);
assert.match(js,/optionCache/);
assert.match(js,/moveContentRight/);
assert.match(js,/restoreContent/);
assert.match(js,/contentInRight/);
assert.doesNotMatch(js,/make\("iframe"/);
assert.match(css,/#darFoldV2Pane > #appView/);
assert.match(css,/body>\.app\{/);
assert.doesNotMatch(css,/#darFoldV2Frame\{/);
assert.match(js,/getAttribute\("data-value"\)/); // Qurʾān surahs share data-nav and must remain distinct
assert.match(js,/result\.push\(\{text:title,el:el,key:key,hash:hash,route:route,value:value\}\)/);
assert.match(js,/aria-label/);
assert.match(css,/dar-fold-v2-menu-row/);
assert.match(css,/dar-fold-v2-context/);
assert.match(css,/dar-fold-v2-options/);
assert.match(js,/darFoldV2/);
assert.match(js,/ICON_3D/);
assert.match(js,/dar-3d-icons/);
assert.match(js,/savedReaderTop/);
assert.match(js,/dataset\.railVariant/);
assert.match(css,/DAR_PREMIUM_FOLD_SIDEBAR_20261122/);
assert.match(css,/DAR_TEST_FOLD_UNCLIPPED_V5_20261122/);
assert.match(css,/--dar-fold-v2-safe-bottom/);
assert.match(css,/overflow-y:auto!important/);
assert.match(css,/data-rail-variant="compact"/);
assert.match(css,/\.dar-fold-v2-active/);
assert.match(css,/\.dar-fold-v2-reader/);
assert.match(css,/overflow-y:auto!important/);
assert.match(css,/width:calc\(100% - var\(--dar-fold-v2-rail\)\)/);
assert.match(worker,/DAR_TEST_PREMIUM_LANDSCAPE_SINGLE_OWNER_20261122/);
assert.match(worker,/darTestFoldWorkspaceV2Css/);
assert.match(worker,/darTestFoldWorkspaceV2Js/);
assert.match(worker,/no-header-unclipped-20261122-v2/);
assert.match(worker,/fold-thumb-nav/); // legacy ref removal is explicitly retained
assert.match(js,/dar-duo-side-active/);
assert.match(offline,/offline-light-v1374/);
assert.match(offline,/dar-fold-workspace-v2\.js\?v=20261122-no-header-viewport-v2/);
assert.match(offline,/dar-fold-workspace-v2\.css\?v=20261122-no-header-viewport-v2/);
assert.doesNotMatch(offline,/['"]\/test\/assets\/fold-thumb-nav\.js['"]/);
assert.doesNotMatch(offline,/['"]\/test\/assets\/dar-duo-responsive-v1\.js['"]/);

assert.match(worker,/dar-fold-workspace-v2\.js\?v=20261122-no-header-viewport-v2/);
assert.match(worker,/dar-fold-workspace-v2\.css\?v=20261122-no-header-viewport-v2/);
assert.doesNotMatch(worker,/\/\/ DAR_ADAPTIVE_FOLD_V1326/);
assert.doesNotMatch(worker,/const adaptiveFoldScripts/);
assert.doesNotMatch(worker,/const foldLink = '<link rel="stylesheet" id="darAdultGlobalFoldAxisV1"/);
const attrs={};
const rootNode={clientWidth:726,clientHeight:512,classList:{add(){},remove(){}},style:{setProperty(){}}};
const doc={documentElement:rootNode,readyState:"loading",addEventListener(){}};
const win={document:doc,location:{search:"",pathname:"/test/",hash:"#quran"},innerWidth:726,innerHeight:512,URLSearchParams};
vm.runInNewContext(js,{window:win,document:doc,URLSearchParams});
const capacity=win.DARTestFoldV2.capacity;
for(const [w,h,expected,compact] of [
  [320,700,false,false],[390,844,false,false],[600,960,false,false],
  [640,480,true,false],[726,512,true,false],[800,700,true,false],
  [900,550,true,false],[915,412,true,true],[730,390,true,true],
  [720,345,false,false],[1024,768,true,false],[1280,850,true,false]]) {
  const c=capacity(w,h);
  assert.equal(c.dual,expected,w+"x"+h+" dual mode mismatch");
  assert.equal(c.compact,compact,w+"x"+h+" rail mode mismatch");
  if(compact)assert.equal(c.rail,80,"compact rail must be 80px");
  else assert.ok(c.rail>=194&&c.rail<=274,"full rail bounds");
  assert.equal(c.rail+c.pane,w,"no lost reader pixels");
  if(c.dual)assert.ok(c.pane>c.rail,"reader must be dominant");
}
console.log("PASS DAR Test Fold V2: syntax, sole authority, responsive capacity, isolated reader, route/scroll contract");


/* Functional regression: the same DOM node must move into the right pane
   when unfolded, then return to its exact original parent when folded. */
{
  const node=(tag,id)=>{
    const e={
      tagName:tag,id:id||"",children:[],dataset:{},
      attributes:{},parentNode:null,hidden:false,
      classList:{add(){},remove(){},toggle(){}},
      style:{setProperty(){},removeProperty(){}},
      setAttribute(k,v){this.attributes[k]=String(v);},
      removeAttribute(k){delete this.attributes[k];},
      appendChild(child){
        if(child.parentNode){
          const siblings=child.parentNode.children;
          const index=siblings.indexOf(child);
          if(index>=0)siblings.splice(index,1);
        }
        this.children.push(child);child.parentNode=this;return child;
      },
      append(...children){children.forEach(c=>this.appendChild(c));},
      insertBefore(child,next){
        if(child.parentNode){
          const siblings=child.parentNode.children;
          const index=siblings.indexOf(child);
          if(index>=0)siblings.splice(index,1);
        }
        const idx=this.children.indexOf(next);
        this.children.splice(idx<0?this.children.length:idx,0,child);
        child.parentNode=this;return child;
      },
      querySelectorAll(){return[];},
      querySelector(){return null;},
      addEventListener(){},
      replaceChildren(...children){this.children=[];this.append(...children);},
      getBoundingClientRect(){return{x:0,y:0,width:200,height:400};},
      contains(child){let v=child;while(v){if(v===this)return true;v=v.parentNode;}return false;},
      getAttribute(k){return this.attributes[k]||null;},
      remove(){if(!this.parentNode)return;const i=this.parentNode.children.indexOf(this);if(i>=0)this.parentNode.children.splice(i,1);this.parentNode=null;}
    };
    Object.defineProperty(e,"nextSibling",{get(){
      if(!this.parentNode)return null;
      const list=this.parentNode.children,idx=list.indexOf(this);
      return list[idx+1]||null;
    }});
    return e;
  };
  const html=node("html"), body=node("body");
  html.clientWidth=726;html.clientHeight=512;
  const measuredStyles={};
  html.style.setProperty=(key,value)=>{measuredStyles[key]=value;};
  const app=node("div"), view=node("main","appView"), after=node("footer");
  app.append(view,after);body.append(app);
  const find=(tree,id)=>{
    if(tree.id===id)return tree;
    for(const child of tree.children||[]){const v=find(child,id);if(v)return v;}
    return null;
  };
  const fixture={
    documentElement:html,body,readyState:"complete",
    createElement:tag=>node(tag),
    createElementNS:(ns,tag)=>node(tag),
    createDocumentFragment:()=>node("fragment"),
    getElementById:id=>find(body,id),
    addEventListener(){}
  };
  const window={
    document:fixture,
    innerWidth:726,innerHeight:512,
    location:{search:"?darFoldV2=1",pathname:"/test/",hash:"#quran",origin:"https://example.test"},
    visualViewport:{height:480,addEventListener(){}},
    addEventListener(){},
    requestAnimationFrame(fn){return 1;} // no implicit layout reentry in this fixture
  };
  vm.runInNewContext(js,{window,document:fixture,URLSearchParams,Set,MutationObserver:undefined,ResizeObserver:undefined});
  const api=window.DARTestFoldV2;
  assert.ok(api,"fold controller must initialize");
  let result=api.audit();
  assert.equal(result.active,true);
  assert.equal(measuredStyles["--dar-fold-v2-visible-height"],"480px","real visualViewport height must limit both panes");
  assert.equal(result.contentInRight,true,"Real SPA must be inside the right pane");
  const pane=fixture.getElementById("darFoldV2Pane");
  assert.ok(pane&&view.parentNode===pane,"same live #appView moved right");
  const nav=fixture.getElementById("darFoldV2Rail");
  const menu=fixture.getElementById("darFoldV2Menu");
  const context=fixture.getElementById("darFoldV2Context");
  assert.ok(nav && menu && context, "independent left navigation and search must exist");
  assert.equal(menu.children.filter(e=>e.dataset.foldCategory).length,7,"seven 3D category buttons remain");
  assert.equal(menu.hidden,false,"category buttons always remain visible");
  assert.equal(context.hidden,false,"context selection remains independently accessible");
  assert.equal(body.children.filter(e=>e.id==="darFoldV2Topbar").length,0,"redundant header removed");
  assert.equal(nav.children.filter(e=>e.className==="dar-fold-v2-intro").length,0,"oversized selected-category hero removed");
  assert.equal(body.children.filter(e=>e.id==="darFoldV2Frame").length,0,"no duplicate iframe");
  html.clientWidth=390;html.clientHeight=844;window.innerWidth=390;window.innerHeight=844;
  api.apply();
  assert.equal(view.parentNode,app,"view restored on Fold cover");
  assert.equal(app.children[0],view,"original DOM order restored");
  html.clientWidth=726;html.clientHeight=512;window.innerWidth=726;window.innerHeight=512;
  api.apply();
  assert.equal(view.parentNode,pane,"same view resumes on Fold unfold");
  assert.equal(api.audit().contentInRight,true);
}

console.log('PASS: real appView reparented to right, cover restore, no iframe');
