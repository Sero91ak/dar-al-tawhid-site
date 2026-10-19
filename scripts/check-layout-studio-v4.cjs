#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync("test/kids/akademie/startseiten-editor.html","utf8");
const css=fs.readFileSync("test/kids/akademie/startseiten-studio-v3.css","utf8");
const js=fs.readFileSync("test/kids/akademie/startseiten-studio-v3.js","utf8");
const moduleText=fs.readFileSync("cloudflare/layout-editor-bundle-v3.js","utf8");
const expr=moduleText.slice(moduleText.indexOf("export const EDITOR_STUDIO_HTML = ")+"export const EDITOR_STUDIO_HTML = ".length).trim().replace(/;\s*$/,"");
const bundled=JSON.parse(expr);
new vm.Script(js,{filename:"startseiten-studio-v3.js"});
for(const id of ["historyPosition","checkpointList","quickBackground","pinBackground","bgScale","bgX","bgY"])assert(html.includes('id="'+id+'"'),"Missing "+id);
assert.match(css,/\.studio-head \.history-picker/);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,"HTML IDs must be unique");
for(const match of js.matchAll(/\$\("([^"]+)"\)/g))assert(ids.includes(match[1]),"Missing control "+match[1]);
const cssTag=/<link\b[^>]*href=["'][^"']*startseiten-studio-v3\.css[^"']*["'][^>]*>/i;
const jsTag=/<script\b[^>]*src=["'][^"']*startseiten-studio-v3\.js[^"']*["'][^>]*><\/script>/i;
const expected=html.replace(cssTag,'<style id="editor-inline-v4">'+css.replace(/<\/style/gi,"<\\/style")+'</style>')
.replace(jsTag,'<script id="editor-inline-v4">'+js.replace(/<\/script/gi,"<\\/script")+'</script>');
assert.equal(bundled,expected,"Bundled editor must exactly match current sources");
assert(!bundled.includes("Dawud26"),"No credentials in editor bundle");
assert.match(js,/frame\.contentWindow\.addEventListener\("click"/);
assert.match(js,/function restoreVisuals\(\)/);
assert.match(js,/const anchors=\{nw:/);
assert.match(js,/safeCss\(el,"background-size"/);
const undoBody=js.split("function undoAction()")[1]?.split("function redoAction()")[0]||"";
const redoBody=js.split("function redoAction()")[1]?.split("function hide(")[0]||"";
assert(!/rebuildFrame\(/.test(undoBody+redoBody),"Undo/redo must never reload iframe");
assert(/jumpTo\(/.test(undoBody+redoBody));
const elements=new Map();
function element(id){
 if(!elements.has(id))elements.set(id,{value:"",textContent:"",disabled:false,children:[],
 replaceChildren(...nodes){this.children=nodes},appendChild(node){this.children.push(node)},
 setAttribute(){},classList:{toggle(){}}});
 return elements.get(id);
}
const document={readyState:"loading",getElementById:element,
 createElement:tag=>({tagName:tag,value:"",textContent:"",selected:false}),addEventListener(){}};
const context={document,window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,
 clearTimeout(){},Date,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Error,console};
const ending='if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();\n})();';
assert(js.endsWith(ending),"Expected editor script tail");
const harness=js.slice(0,-ending.length)+[
 'window.__test={snapshot,undoAction,redoAction,getState:()=>state,',
 'change:(name,value)=>{state.items[name]=value},',
 'counts:()=>[history.length,redo.length]};',
 '})();'
].join("\n");
vm.runInNewContext(harness,context,{timeout:1000});
const h=context.window.__test;
h.change(".test",{fontSize:14});
h.snapshot("Testgröße");h.change(".test",{fontSize:35});
h.undoAction();
assert.equal(h.getState().items[".test"].fontSize,14);
assert.equal(h.counts()[1],1);
h.redoAction();
assert.equal(h.getState().items[".test"].fontSize,35);
console.log("PASS · V4 editor bundle, controls, history, undo/redo without iframe reload, edit lock and background.");
