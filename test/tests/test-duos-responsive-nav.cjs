#!/usr/bin/env node
"use strict";
/**
 * Test-only Duos responsive nav smoke suite (no browser dependencies).
 * Run from repo root: node test/tests/test-duos-responsive-nav.cjs
 * Does not access visitor/KIDS files or modify service workers.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const js = fs.readFileSync(path.join(ROOT, "test/assets/fold-thumb-nav.js"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "test/assets/fold-thumb-nav.css"), "utf8");

assert.doesNotThrow(() => new vm.Script(js), "navigation must parse");
assert.match(css, /html\.dar-test-side-nav/);
assert.doesNotMatch(js, /MutationObserver|setInterval|document\.body\.innerHTML\s*=/);
assert.doesNotMatch(js, /darDuosStatus|dar-duos-status-clock/);
assert.doesNotMatch(css, /html\.dar-test-side-nav\s+body:before/);
assert.match(js, /return "bottom"/);
assert.match(css, /30px!important/);

function classList(initial = []) {
  const state = new Set(initial);
  return {
    contains(value) { return state.has(value); },
    add(...args) { args.forEach(v => state.add(v)); },
    remove(...args) { args.forEach(v => state.delete(v)); },
    toggle(value, force) {
      const next = force === undefined ? !state.has(value) : force;
      if (next) state.add(value); else state.delete(value);
      return next;
    }
  };
}
function mount(width, height, preference, settings = {}) {
  const pending = [];
  const events = {};
  const docEvents = {};
  const stored = new Map([["darNavPositionV2", preference]]);
  const navStyle = {
    values: {},
    writes: 0,
    setProperty(k,v) { this.values[k] = v; this.writes++; },
    removeProperty(k) { delete this.values[k]; this.writes++; }
  };
  const nav = {
    classList: classList(["bottom-nav","is-adaptive-centered"]),
    style: navStyle,
    querySelectorAll(name) {return name === ".bottom-nav-btn" ? Array(5).fill({}) : []; }
  };
  const root = {
    clientWidth: width,
    clientHeight: height,
    attrs: {},
    classList: classList(),
    style: {values:{},setProperty(k,v){this.values[k]=v;}},
    setAttribute(k,v){this.attrs[k]=v;}
  };
  const body = {classList:classList(["is-home-route"])};
  const document = {
    documentElement: root,
    body,
    readyState:"complete",
    activeElement:null,
    getElementById(id){return id === "bottomNav" ? nav : null;},
    addEventListener(k,fn){(docEvents[k] ||= []).push(fn);}
  };
  let syncCount = 0;
  const context = {
    document,
    CustomEvent:function(type,args){this.type=type;this.detail=args.detail;},
    window:null
  };
  const win = {
    location: {pathname:"/test/"},
    innerWidth:width,
    innerHeight:height,
    visualViewport:{width,height,addEventListener(){}},
    localStorage:{
      getItem(k){return stored.get(k) ?? null;},
      setItem(k,v){stored.set(k,String(v));}
    },
    addEventListener(k,fn){(events[k] ||= []).push(fn);},
    dispatchEvent(e){(events[e.type] || []).forEach(f=>f(e));},
    requestAnimationFrame(fn){pending.push(fn);return pending.length;},
    setTimeout(){return 1;},
    clearTimeout(){},
    DarAdaptiveLayout:{syncNav(){syncCount++;}}
  };
  context.window = win;
  vm.runInNewContext(js,context,{timeout:1500,filename:"fold-thumb-nav.js"});

  function flush(){
    let n=0;
    while(pending.length){
      pending.shift()();
      assert.ok(++n<20,"requestAnimationFrame infinite loop");
    }
  }
  function dispatch(name){(events[name] || []).forEach(fn=>fn());flush();}
  flush();
  return {root,nav,win,body,store:stored,flush,dispatch,
    syncCount:()=>syncCount};
}

const cases = [
  [390,844,"right","bottom","small phone portrait"],
  [430,932,"right","bottom","iPhone Pro Max portrait"],
  [932,430,"right","right","iPhone Pro Max landscape"],
  [844,390,"left","left","medium phone landscape"],
  [639,390,"right","bottom","narrow split window"],
  [640,318,"right","right","small landscape threshold"],
  [768,1024,"left","left","iPad mini portrait with manual rail"],
  [1024,768,"right","right","iPad mini landscape"],
  [820,1190,"right","right","unfolded tall layout"],
  [1190,820,"right","right","Fold unfolded landscape"],
  [1366,1024,"bottom","bottom","large tablet user chooses bottom"]
];
for (const [w,h,p,expected,name] of cases) {
  const model = mount(w,h,p);
  assert.equal(model.win.DarAdaptiveNavPlacement.getEffectivePosition(), expected, name);
  assert.equal(model.root.classList.contains("dar-test-side-nav"), expected!=="bottom", name+" root class");
  if(expected!=="bottom") {
    assert.equal(model.nav.style.values.width,"68px",name+" Duos width");
    const top=Number.parseFloat(model.nav.style.values.top);
    const high=Number.parseFloat(model.nav.style.values.height);
    assert.ok(top>=12 && top+high<=h-12+0.01,name+" safe vertical bounds");
    assert.equal(model.nav.style.values["border-radius"],"30px",name+" radius");
  }
  const writes=model.nav.style.writes;
  model.dispatch("resize");
  assert.equal(model.nav.style.writes,writes,name+" resize does not rewrite identical styles");
}

const interaction = mount(932,430,"right");
interaction.win.DarAdaptiveNavPlacement.setPreference("left");
interaction.flush();
assert.equal(interaction.win.DarAdaptiveNavPlacement.getEffectivePosition(),"left");
assert.match(interaction.nav.style.values.left,/12px/);
interaction.win.DarAdaptiveNavPlacement.setPreference("bottom");
interaction.flush();
assert.equal(interaction.win.DarAdaptiveNavPlacement.getEffectivePosition(),"bottom");
assert.equal(interaction.nav.classList.contains("is-adaptive-rail"),false);
assert.ok(interaction.syncCount()>0,"original bottom nav controller resumes");

const keyboard = mount(1190,820,"right");
keyboard.root.classList.add("adaptive-keyboard-open");
keyboard.dispatch("resize");
assert.equal(keyboard.win.DarAdaptiveNavPlacement.getEffectivePosition(),"bottom");
const chat=mount(1190,820,"right");
chat.body.classList.add("is-ilm-chat-route");
chat.dispatch("hashchange");
assert.equal(chat.win.DarAdaptiveNavPlacement.getEffectivePosition(),"bottom");

const block=mount(932,430,"right");
block.root.clientWidth=430;
block.root.clientHeight=932;
block.win.visualViewport.width=932;
block.win.visualViewport.height=430; // stale Safari viewport after rotating upright
block.dispatch("orientationchange");
assert.equal(block.win.DarAdaptiveNavPlacement.getEffectivePosition(),"bottom",
  "stale visualViewport must not retain landscape side rail");

console.log("Duos navigation: 11 sizes + switching/keyboard/chat/rotation PASS");
