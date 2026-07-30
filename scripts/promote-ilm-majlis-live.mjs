#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const testPath = resolve(root, "test/index.html");
const indexPath = resolve(root, "index.html");

let test = readFileSync(testPath, "utf8");
let index = readFileSync(indexPath, "utf8");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return null;
  let i = source.indexOf("{", start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function replaceFunction(target, name, replacement) {
  const current = extractFunction(target, name);
  if (!current) throw new Error(`Function ${name} not found`);
  return target.replace(current, replacement);
}

const jsStart = "function loadIlmAdminState(){";
const jsEnd = "function renderDirectPickPanel";
const testJsStart = test.indexOf(jsStart);
const testJsEnd = test.indexOf(jsEnd);
if (testJsStart < 0 || testJsEnd < 0) throw new Error("ILM JS block not found in test/index.html");
const ilmJs = test.slice(testJsStart, testJsEnd);

const indexJsStart = index.indexOf(jsStart);
const indexJsEnd = index.indexOf(jsEnd);
if (indexJsStart < 0 || indexJsEnd < 0) throw new Error("ILM JS block not found in index.html");
index = index.slice(0, indexJsStart) + ilmJs + index.slice(indexJsEnd);

const cssStart = "html:has(body.is-ilm-chat-route)";
const cssEnd = ".ilm-clarify-chip{border:1px solid var(--ilm-border);border-radius:999px;background:color-mix(in srgb,var(--ilm-header-bg) 70%,white 4%);color:var(--ilm-primary-text);min-height:34px;padding:7px 11px;font-size:12px;font-weight:850;cursor:pointer;text-align:left}";
const testCssStart = test.indexOf(cssStart);
const testCssEnd = test.indexOf(cssEnd, testCssStart);
if (testCssStart < 0 || testCssEnd < 0) throw new Error("ILM fullscreen CSS not found in test/index.html");
const ilmCss = test.slice(testCssStart, testCssEnd + cssEnd.length);

if (!index.includes(cssStart)) {
  const anchor = ".ilm-empty-hint{padding:14px;border:1px dashed var(--line2);border-radius:18px;color:var(--muted);font-size:11.5px;line-height:1.55}";
  const anchorIdx = index.indexOf(anchor);
  if (anchorIdx < 0) throw new Error("ILM CSS anchor not found in index.html");
  const insertAt = anchorIdx + anchor.length;
  index = index.slice(0, insertAt) + "\n" + ilmCss + index.slice(insertAt);
}

index = index.replace(
  'else if(currentRoute.view==="ilm")html=renderHome();',
  'else if(currentRoute.view==="ilm")html=renderIlm();'
);

const bottomNavFn = extractFunction(test, "bottomNavTabForRoute");
if (!bottomNavFn) throw new Error("bottomNavTabForRoute missing in test");
index = replaceFunction(index, "bottomNavTabForRoute", bottomNavFn);

index = index.replace(
  /const BOTTOM_NAV_TABS=\[[^\]]+\];/,
  'const BOTTOM_NAV_TABS=["home","ilm","feed","quran","more"];'
);

const bottomNavTest = `<nav id="bottomNav" class="bottom-nav" aria-label="Hauptnavigation">
  <button class="bottom-nav-btn" type="button" data-bottom-nav="home" aria-label="Startseite"><span class="nav-icon" aria-hidden="true">⌂</span><span>Start</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="ilm" aria-label="ʿIlm"><span class="nav-icon" aria-hidden="true">📘</span><span>ʿIlm</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true">✦</span><span>Feed</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true">📖</span><span>Qurʾān</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="more" aria-label="Weitere Bereiche"><span class="nav-icon" aria-hidden="true">☰</span><span>Mehr</span></button>
</nav>`;
index = index.replace(
  /<nav id="bottomNav" class="bottom-nav" aria-label="Hauptnavigation">[\s\S]*?<\/nav>/,
  bottomNavTest
);

const rememberFns = `
function rememberIlmReturnRoute(route=currentRoute,scroll=window.scrollY||0){try{if(route&&route.view&&route.view!=="ilm")sessionStorage.setItem("darIlmReturnRouteV1",JSON.stringify({route,scroll:Number(scroll)||0,at:Date.now()}))}catch(e){}}
function getIlmReturnRoute(){try{const saved=JSON.parse(sessionStorage.getItem("darIlmReturnRouteV1")||"null");if(saved&&saved.route&&saved.route.view&&saved.route.view!=="ilm")return saved}catch(e){}return {route:{view:"home",value:""},scroll:0}}
function exitIlmChat(){const saved=getIlmReturnRoute();const target=saved.route||{view:"home",value:""};const y=Number(saved.scroll)||0;window.__restoreScrollY=y;navigate(target.view,target.value||"",{skipPush:true,noAnim:true});requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.DARScrollManager?.stableScrollTo?.(y,{force:true})}catch(e){window.scrollTo({top:y,behavior:"auto"})}}))}
`;
if (!index.includes("function rememberIlmReturnRoute")) {
  index = index.replace("function hardGoHome(){", rememberFns + "\nfunction hardGoHome(){");
}

const navigateBottomNav = extractFunction(test, "navigateBottomNavTab");
if (navigateBottomNav && !index.includes('if(tab==="ilm")rememberIlmReturnRoute')) {
  index = replaceFunction(index, "navigateBottomNavTab", navigateBottomNav);
}

const updateChromeTest = extractFunction(test, "updateChrome");
if (updateChromeTest) {
  index = replaceFunction(index, "updateChrome", updateChromeTest);
}

const ensureDockTest = extractFunction(test, "ensureBottomNavDock");
if (ensureDockTest && !index.includes("is-ilm-chat-route")) {
  index = replaceFunction(index, "ensureBottomNavDock", ensureDockTest);
}

if (!index.includes("ilm-majlis-v2.js")) {
  index = index.replace(
    '<script src="/assets/slide-post-parser.js?v=2"></script>',
    '<script src="/assets/slide-post-parser.js?v=2"></script>\n<script src="/assets/ilm-majlis-v2.js?v=1"></script>'
  );
}
if (!test.includes("ilm-majlis-v2.js")) {
  test = test.replace(
    '<script src="/assets/slide-post-parser.js?v=2"></script>',
    '<script src="/assets/slide-post-parser.js?v=2"></script>\n<script src="/assets/ilm-majlis-v2.js?v=1"></script>'
  );
}

if (!index.includes("function render()")) throw new Error("render() missing after promote");
if (!index.includes("html=renderIlm()")) throw new Error("renderIlm dispatch missing after promote");
if (!extractFunction(index, "setHeader")) throw new Error("setHeader missing after promote");

writeFileSync(indexPath, index, "utf8");
writeFileSync(testPath, test, "utf8");
console.log("Promoted Majlis al-ʿIlm blocks to index.html and ensured v2 script in both apps.");
