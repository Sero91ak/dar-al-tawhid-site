#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const SOURCE_JS = path.join(ROOT, "test", "assets", "library", "canonical-source-library.js");
const DEST_JS = path.join(ROOT, "assets", "library", "canonical-source-library.js");
const SOURCE_COVERS = path.join(ROOT, "test", "assets", "library", "covers", "qsrc");
const DEST_COVERS = path.join(ROOT, "assets", "library", "covers", "qsrc");
const SCRIPT_SRC = "/assets/library/canonical-source-library.js";
const SCRIPT_TAG = `<script src="${SCRIPT_SRC}?v=1"></script>`;

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const name of fs.readdirSync(src)) {
    if (!name.endsWith(".svg")) continue;
    fs.copyFileSync(path.join(src, name), path.join(dest, name));
    count += 1;
  }
  return count;
}

function replaceOnce(html, search, replacement, label) {
  if (!html.includes(search)) {
    throw new Error(`publish-visitor-canonical-library: Marker fehlt (${label})`);
  }
  return html.replace(search, replacement);
}

function patchIndex() {
  let html = fs.readFileSync(INDEX, "utf8");
  if (html.includes('quellenbibliothek:"books"') && html.includes("function ensureCanonicalSourceLibrary()")) {
    return;
  }

  html = replaceOnce(
    html,
    'books:"books",hadith:"hadith"',
    'books:"books",quellenbibliothek:"books",quellenbuch:"quellen-book","quellen-book":"quellen-book",quellengelehrter:"quellen-scholar","quellen-scholar":"quellen-scholar",hadith:"hadith"',
    "ROUTE_ALIASES"
  );

  html = replaceOnce(
    html,
    'if(route.view==="scholars")return{view:"more"};\n  if(route.view==="books")return{view:"more"};',
    'if(route.view==="scholars")return{view:"more"};\n  if(route.view==="quellen-book"||route.view==="quellen-scholar")return{view:"books"};\n  if(route.view==="books")return{view:"more"};',
    "navigateBackRoute"
  );

  html = replaceOnce(
    html,
    '"scholar","books","book","calendar"',
    '"scholar","books","book","quellen-book","quellen-scholar","calendar"',
    "bottomNavTabForRoute"
  );

  html = replaceOnce(
    html,
    'function renderBooks(){const items=bookLibraryItems();',
    'function renderBooks(){if(window.DARCanonicalSourceLibrary)return DARCanonicalSourceLibrary.renderRoute(currentRoute);return`${setPageHeader("Quellenbibliothek","Geprüfte historische Werke und zitierte Gelehrte","Quellenbibliothek")}<section class="qsrc-shell"><div class="qsrc-loading">Quellenbibliothek wird geladen…</div></section>`}function renderBooksLegacy(){const items=bookLibraryItems();',
    "renderBooks"
  );

  html = replaceOnce(
    html,
    '<article class="folder-card" data-nav="books"><div class="folder-icon">${iconMarkup("books","Bücher")}</div><h3>Bücher</h3><p>Beiträge direkt nach verwendeten Werken und Quellen.</p><div class="folder-meta"><span>${bookCount} Werke</span></div></article>',
    '<article class="folder-card" data-nav="books"><div class="folder-icon"><span class="emoji-emblem">📖</span></div><h3>Quellenbibliothek</h3><p>Geprüfte historische Werke und zitierte Gelehrte aus kanonischen Daten.</p><div class="folder-meta"><span>${window.DARCanonicalSourceLibrary?.getBookCount?window.DARCanonicalSourceLibrary.getBookCount():"Geprüft"}</span><span>Werke</span></div></article>',
    "renderHomeFolderSection"
  );

  html = replaceOnce(
    html,
    '{id:"books",title:"Bücher",icon:"📘",desc:bookCount+" Werke und Quellenordner.",button:"Ansehen",nav:"books",group:"Lernen & Wissen"},',
    '{id:"books",title:"Quellenbibliothek",icon:"📘",desc:typeof window.DARCanonicalSourceLibrary?.getBookCount==="function"?`${window.DARCanonicalSourceLibrary.getBookCount()} geprüfte Werke und zitierte Gelehrte.`:"Geprüfte historische Werke und zitierte Gelehrte.",button:"Ansehen",nav:"books",group:"Lernen & Wissen",badge:"Geprüft"},',
    "featureCatalog"
  );

  if (!html.includes("function ensureCanonicalSourceLibrary()")) {
    const anchor = "function render(){";
    const loader = `function ensureCanonicalSourceLibrary(){
  if(window.DARCanonicalSourceLibrary&&window.DARCanonicalSourceLibrary.isReady())return Promise.resolve(window.DARCanonicalSourceLibrary);
  if(window.__canonicalSourceLoading)return window.__canonicalSourceLoading;
  window.__canonicalSourceLoading=new Promise((resolve,reject)=>{
    if(window.DARCanonicalSourceLibrary){
      window.DARCanonicalSourceLibrary.ensureModule().then(()=>resolve(window.DARCanonicalSourceLibrary)).catch(reject);
      return;
    }
    const s=document.createElement("script");
    s.src="${SCRIPT_SRC}?v=1";
    s.defer=true;
    s.onload=()=>{
      if(!window.DARCanonicalSourceLibrary){reject(new Error("canonical source library missing"));return}
      window.DARCanonicalSourceLibrary.ensureModule().then(()=>resolve(window.DARCanonicalSourceLibrary)).catch(reject);
    };
    s.onerror=reject;
    document.head.appendChild(s);
  }).finally(()=>{window.__canonicalSourceLoading=null});
  return window.__canonicalSourceLoading;
}
`;
    if (!html.includes(anchor)) {
      throw new Error("publish-visitor-canonical-library: render() anchor fehlt");
    }
    html = html.replace(anchor, `${loader}${anchor}`);
  }

  html = replaceOnce(
    html,
    '    let html="";\n    if(currentRoute.view==="home")html=renderHome();',
    '    if(["books","quellen-book","quellen-scholar"].includes(currentRoute.view)){\n      const needsCanonicalBoot=!window.DARCanonicalSourceLibrary||(!window.DARCanonicalSourceLibrary.isReady()&&!window.DARCanonicalSourceLibrary.hasError());\n      if(needsCanonicalBoot){\n        ensureCanonicalSourceLibrary().then(()=>{\n          const r=readRoute();\n          if(["books","quellen-book","quellen-scholar"].includes(r.view))render();\n        }).catch(()=>{});\n      }\n    }\n    let html="";\n    if(currentRoute.view==="home")html=renderHome();',
    "render canonical boot"
  );

  html = replaceOnce(
    html,
    '    else if(currentRoute.view==="books")html=renderBooks();\n    else if(currentRoute.view==="topic")',
    '    else if(currentRoute.view==="books")html=renderBooks();\n    else if(currentRoute.view==="quellen-book")html=window.DARCanonicalSourceLibrary?DARCanonicalSourceLibrary.renderBookDetail(currentRoute.value):renderBooks();\n    else if(currentRoute.view==="quellen-scholar")html=window.DARCanonicalSourceLibrary?DARCanonicalSourceLibrary.renderScholarDetail(currentRoute.value):renderBooks();\n    else if(currentRoute.view==="topic")',
    "render quellen routes"
  );

  html = replaceOnce(
    html,
    '  const booksSearchInput=$("booksSearchInput");if(booksSearchInput)booksSearchInput.oninput=filterBooksLibrary;\n  const advancedFilterBtn',
    '  const booksSearchInput=$("booksSearchInput");if(booksSearchInput)booksSearchInput.oninput=filterBooksLibrary;\n  if(window.DARCanonicalSourceLibrary)DARCanonicalSourceLibrary.bind();\n  const advancedFilterBtn',
    "bind canonical library"
  );

  html = replaceOnce(
    html,
    '      initFontSettings();\n      loadCurrentUpdates().then(changed=>{try{if(changed)render()}catch(e){}}).catch(()=>{});\n      render();',
    '      initFontSettings();\n      ensureCanonicalSourceLibrary().catch(()=>{});\n      loadCurrentUpdates().then(changed=>{try{if(changed)render()}catch(e){}}).catch(()=>{});\n      render();',
    "boot canonical library"
  );

  if (!html.includes(SCRIPT_SRC)) {
    html = html.replace(
      '<script src="/assets/dar-account-visibility.js',
      `${SCRIPT_TAG}\n  <script src="/assets/dar-account-visibility.js`
    );
  }

  fs.writeFileSync(INDEX, html);
}

function main() {
  if (!fs.existsSync(SOURCE_JS)) {
    throw new Error("publish-visitor-canonical-library: canonical-source-library.js fehlt");
  }
  fs.mkdirSync(path.dirname(DEST_JS), { recursive: true });
  fs.copyFileSync(SOURCE_JS, DEST_JS);
  const coverCount = copyDir(SOURCE_COVERS, DEST_COVERS);
  patchIndex();
  console.log(`publish-visitor-canonical-library: Besucher-App verbunden (${coverCount} Cover).`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
