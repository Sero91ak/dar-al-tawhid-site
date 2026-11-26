#!/usr/bin/env node
"use strict";
/* Adult visitor header regression contract, independent of the Test and Kids shells. */
const fs = require("node:fs");
const assert = require("node:assert/strict");
const read = p => fs.readFileSync(p, "utf8");

const css = read("assets/dar-visitor-profile-picker-v1.css");
const sharedCss = read("assets/dar-adult-brand-header-v2.css");
const visitorPicker = read("assets/dar-visitor-profile-picker-v1.js");
const visitorLoader = read("assets/dar-home-test-parity-visitor.js");
const edgeRouter = read("cloudflare/site-router.js");
const iosWebView = read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const testHeader = read("test/assets/dar-test-premium-header-v2.js");

assert(css.includes("VISITOR_HEADER_SINGLE_ROW_V5"), "Missing visitor-only one-row layout");
assert(!/grid-row\s*:\s*2\s*!important/.test(css), "Legacy second-row visitor rule must not return");
assert(/grid-template-rows\s*:\s*minmax\(44px,auto\)\s*!important/.test(css), "One-row phone grid absent");
assert(/grid-template-columns\s*:\s*54px\s+minmax\(0,1fr\)\s+48px\s+48px\s+48px/.test(css), "Tablet grid absent");

for(const marker of [
  "#darVisitorProfileButtonV1",
  "grid-column:3!important",
  "grid-column:4!important",
  "grid-column:5!important",
  "#darVisitorLanguageButtonV1",
  "VISITOR_HEADER_LANGUAGE_V1",
  'html[dir="rtl"] body #darAdultBrandHeaderV2 .dtbh-row{direction:rtl!important}',
  "grid-row:1!important",
  ".dvp-chooser",
  ".dvp-palette-icon",
  "PROFILE_ICON_SAFE_AREA_V4",
  "VISITOR_PROFILE_CAPSULE_PARITY_V6"
]){
  assert(css.includes(marker), "Missing visitor header/popup contract: "+marker);
}
for(const property of [
 "border:1px solid var(--dtbh-line,rgba(128,91,104,.28))!important;",
 "background:var(--dtbh-btn,rgba(128,91,104,.10))!important;",
 "border-radius:13px!important;",
 "padding:3px!important;"
]){
 assert(css.includes(property),"Capsule parity broken: "+property);
}
assert(css.includes(".dtbh-row > #darVisitorProfileButtonV1")&&css.includes(".dtbh-row > .dtbh-toggle"),"Profile and palette must use same capsule selector");
assert(sharedCss.includes("dar-adult-brand-header-height"), "Header spacer height synchronization removed");
assert(visitorPicker.includes('row.insertBefore(trigger,theme)'), "Profile button order before palette changed");
assert(visitorPicker.includes('row.querySelector(".dtbh-toggle")'), "Original palette handler must be reused");
assert(!visitorPicker.includes("language-classic-v7"), "Profile picker must stay the profile control");
assert(testHeader.includes('button("Sprache auswählen","language")'), "Test language shortcut was changed");
assert(testHeader.includes("language-classic-v7.png"), "Test language icon missing");
const pickerURL = "/assets/dar-visitor-profile-picker-v1.css?v=20261126-header-language-v1";
const dashboardCSS = "/assets/dar-visitor-smart-profile-v1.css?v=20261030-my-dar-dashboard-v11";
const dashboardJS = "/assets/dar-visitor-smart-profile-v1.js?v=20261031-neutral-hooded-v14";
for(const [name,file] of [["Visitor lazy-loader",visitorLoader],["PWA edge response",edgeRouter]]){
 assert(file.includes(pickerURL),name+" does not load approved profile-picker style");
 assert(file.includes(dashboardCSS),name+" does not load current dashboard style");
 assert(file.includes(dashboardJS),name+" does not load current personal dashboard logic");
}
assert(iosWebView.includes("ios-visitor-my-dar-dashboard-20261030"), "Native iOS fallback cache key outdated");

const languageJs = read("assets/dar-visitor-header-language-v1.js");
const languageCss = read("assets/dar-visitor-header-language-v1.css");
const translate = read("assets/i18n/adult-ui-translate.js");
const picker = read("assets/i18n/adult-language-picker-v1.js");
const desktop = read("desktop-preview/index.html");
const desktopRuntime = read("desktop-preview/assets/dar-v8-portal-live.js");
const rootHtml = read("index.html");
const sw = read("pwa/service-worker.js");
new Function(languageJs);
assert(fs.existsSync("assets/header-icons/language-classic-v7.png"), "Visitor language icon missing");
for (const code of ["de","ar","en","tr","ku","ckb","bs","fr","es"]) {
  assert(languageJs.includes('code:"'+code+'"'), "Header language missing "+code);
  assert(picker.includes('code:"'+code+'"'), "Shared picker missing "+code);
}
assert(languageJs.includes('name:"العربية"'), "Arabic endonym missing");
assert(languageJs.includes('name:"سۆرانی"'), "Sorani endonym missing");
assert(languageJs.includes("darAdultPreferredLocaleV1"), "Locale key diverges");
assert(languageJs.includes('params.get("lang")'), "Query language must win");
assert(languageJs.includes('picker.open("quick"'), "Header must open the shared picker");
assert(languageJs.includes("/kids"), "Kids path must stay excluded");
assert(languageJs.includes('root.dir=(code==="ar"||code==="ckb")?"rtl":"ltr"'), "RTL mirror missing");
assert(translate.includes('data-dar-language-entry","settings"'), "Settings language option removed");
assert(translate.includes('global.dispatchEvent(new CustomEvent("dar-adult-locale-changed"'), "Locale switch must re-render");
assert(picker.includes("is-selected") && picker.includes('aria-pressed'), "Current language is not marked");
assert(desktopRuntime.includes("darV8LanguageSelect"), "Desktop settings language select removed");
assert(desktopRuntime.includes('getElementById("darVisitorLanguageButtonV1")'), "Desktop must keep the header control");
assert(rootHtml.includes('id="darVisitorHeaderLanguageJsV1"'), "Visitor index missing language control");
assert(desktop.includes('id="darVisitorHeaderLanguageJsV1"'), "Public website missing language control");
assert(edgeRouter.includes('id="darVisitorHeaderLanguageJsV1"'), "PWA/native shell missing language control");
assert(sw.includes("/assets/dar-visitor-header-language-v1.js"), "PWA live cache missing language control");
assert(languageCss.includes("#darVisitorLanguageButtonV1"), "Desktop language capsule missing");
assert(!languageJs.includes("kids/"), "Language control must not target Kids files");

const {vm} = {vm: require("node:vm")};
function mount(pathname, search, surface) {
  const store = new Map();
  function el(tag) {
    const node = {
      tag, id: "", type: "", className: "", title: "",
      parentNode: null, nextElementSibling: null, childNodes: [],
      classList: { add(name){ node.className += " "+name; } },
      style: {},
      setAttribute(k, v){ node.attrs[k] = String(v); },
      getAttribute(k){ return node.attrs[k] || null; },
      attrs: {},
      appendChild(child){ child.parentNode = node; node.childNodes.push(child); return child; },
      insertBefore(child, anchor){
        if (child.parentNode) child.parentNode.childNodes = child.parentNode.childNodes.filter(n => n !== child);
        child.parentNode = node;
        const at = node.childNodes.indexOf(anchor);
        node.childNodes.splice(at < 0 ? node.childNodes.length : at, 0, child);
        node.childNodes.forEach((n, i) => { n.nextElementSibling = node.childNodes[i + 1] || null; });
        return child;
      },
      remove(){
        if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter(n => n !== this);
        this.parentNode = null;
        this.nextElementSibling = null;
      },
      addEventListener(){}
    };
    return node;
  }
  const ids = {};
  const row = el("div");
  if (surface === "desktop") row.id = "absent-row";
  row.className = "dtbh-row";
  const theme = el("button");
  theme.className = "dtbh-toggle";
  const profile = el("button");
  profile.id = "darVisitorProfileButtonV1";
  row.insertBefore(theme, null);
  row.insertBefore(profile, theme);
  const header = el("header");
  header.id = "darAdultBrandHeaderV2";
  header.appendChild(row);
  ids.darAdultBrandHeaderV2 = header;
  ids.darVisitorProfileButtonV1 = profile;
  const actions = el("div");
  actions.className = "dar-v8-top-actions";
  const themeToggle = el("button");
  themeToggle.id = "darV8ThemeToggle";
  const legacy = el("button");
  legacy.id = "darV8LangToggle";
  actions.insertBefore(themeToggle, null);
  actions.insertBefore(legacy, themeToggle);
  ids.darV8ThemeToggle = themeToggle;
  ids.darV8LangToggle = legacy;
  const doc = {
    readyState: "complete",
    documentElement: { lang: "de", dir: "ltr" },
    head: el("head"),
    body: el("body"),
    getElementById(id){ return ids[id] || null; },
    querySelector(sel){
      if (sel === "#darAdultBrandHeaderV2 .dtbh-row") return surface === "desktop" ? null : row;
      if (sel === ".dar-v8-top-actions") return actions;
      if (sel === 'script[src*="adult-language-picker-v1.js"]') return { src: "adult-language-picker-v1.js" };
      return null;
    },
    createElement: el,
    addEventListener(){}
  };
  const realGet = doc.getElementById.bind(doc);
  doc.getElementById = function(id){
    if (id === "darVisitorLanguageButtonV1") return ids[id] || null;
    return realGet(id);
  };
  const origInsert = row.insertBefore.bind(row);
  row.insertBefore = function(child, anchor){ ids[child.id] = child; return origInsert(child, anchor); };
  const origMount = actions.insertBefore.bind(actions);
  actions.insertBefore = function(child, anchor){ ids[child.id] = child; return origMount(child, anchor); };
  row.querySelector = function(sel){
    if (sel === "#darVisitorProfileButtonV1") return profile;
    if (sel === ".dtbh-toggle") return theme;
    return null;
  };
  const context = {
    window: {},
    document: doc,
    addEventListener(){},
    URLSearchParams,
    setTimeout(fn){ fn(); return 0; },
    setInterval(){ return 0; },
    clearInterval(){},
    MutationObserver: undefined
  };
  context.window = context;
  context.location = { pathname, search: search || "" };
  context.localStorage = { getItem(k){ return store.has(k) ? store.get(k) : null; }, setItem(k, v){ store.set(k, String(v)); } };
  context.window.DARAdultLanguagePickerV1 = { open(mode, trigger){ context.opened = { mode, trigger }; } };
  vm.createContext(context);
  vm.runInContext(languageJs, context, { filename: "dar-visitor-header-language-v1.js" });
  return { context, ids, row, actions, doc };
}
const de = mount("/", "");
const order = de.row.childNodes.map(n => n.id || n.className);
assert.deepEqual(order, ["darVisitorLanguageButtonV1", "darVisitorProfileButtonV1", "dtbh-toggle"], "App order "+order.join(","));
assert.equal(de.ids.darVisitorLanguageButtonV1.getAttribute("aria-label"), "Sprache: Deutsch. Sprache wählen");
assert.equal(de.context.opened, undefined);
de.ids.darVisitorLanguageButtonV1.childNodes = [];
const click = de.ids.darVisitorLanguageButtonV1;
click.addEventListener = function(type, fn){ click["on"+type] = fn; };
// Re-bind by running the installed listener: the script already attached a no-op fake.
// Call the exported opener instead.
de.context.DAR_VISITOR_HEADER_LANGUAGE_V1.open();
assert.equal(de.context.opened.mode, "quick");
const ar = mount("/pwa/", "?lang=ar");
assert.equal(ar.doc.documentElement.dir, "rtl");
assert.match(ar.ids.darVisitorLanguageButtonV1.getAttribute("aria-label"), /العربية/);
assert.match(ar.ids.darVisitorLanguageButtonV1.getAttribute("aria-label"), /اختر اللغة/);
const desk = mount("/", "?lang=ckb", "desktop");
assert.equal(desk.doc.documentElement.dir, "rtl");
assert.equal(desk.actions.childNodes[0].id, "darVisitorLanguageButtonV1");
assert.equal(desk.actions.childNodes[1].id, "darV8ThemeToggle");
assert.equal(desk.ids.darV8LangToggle.parentNode, null);
assert.match(desk.ids.darVisitorLanguageButtonV1.getAttribute("aria-label"), /سۆرانی/);
const kids = mount("/kids/", "");
assert.equal(kids.context.DAR_VISITOR_HEADER_LANGUAGE_V1, undefined);
console.log("PASS: adult visitor brand + language + profile + palette share one row; settings language stays; Kids/Test untouched.");
