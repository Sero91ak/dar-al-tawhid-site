#!/usr/bin/env node
/**
 * BOTTOM_NAV_GUARD: blockiert Deploy wenn Tab-Leiste nicht am Viewport verankert ist.
 *
 * Usage: node scripts/bottom-nav-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VISITOR_FILES = ["index.html", "test/index.html"];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function runBottomNavGuard() {
  let failed = 0;

  function fail(msg) {
    console.error("BOTTOM-NAV-GUARD FAIL:", msg);
    failed += 1;
  }

  function ok(msg) {
    console.log("BOTTOM-NAV-GUARD OK:", msg);
  }

  const needles = [
    "BOTTOM NAV GUARD FINAL",
    'id="appChromeDock"',
    "app-chrome-dock",
    'data-nav-dock="bottom"',
    "function ensureBottomNavDock",
    "function initBottomNavGuard",
    "function verifyBottomNavDock",
    "function bottomNavDockMisplaced",
    "initBottomNavGuard()"
  ];

  const forbidden = [
    {
      pattern: /#appChromeDock\s+#bottomNav\.bottom-nav[\s\S]{0,220}position:relative!important/,
      msg: "#appChromeDock #bottomNav darf nicht position:relative haben"
    },
    {
      pattern: /html\[data-theme\]\s+#appChromeDock\s+\.bottom-nav\{left:auto!important;right:auto!important\}/,
      msg: "Theme-Override left:auto/right:auto auf Dock-Nav ist verboten"
    },
    {
      pattern: /clearBottomDockInlineSize/,
      msg: "Alte clearBottomDockInlineSize-Logik darf Positionierung nicht mehr löschen"
    },
    {
      pattern: /initBottomDock\(\)/,
      msg: "initBottomDock() darf Boot nicht mehr vor initBottomNavGuard() stören"
    }
  ];

  for (const file of VISITOR_FILES) {
    const html = read(file);
    for (const needle of needles) {
      if (!html.includes(needle)) {
        fail(`${file}: fehlt „${needle}“`);
      }
    }
    for (const rule of forbidden) {
      if (rule.pattern.test(html)) {
        fail(`${file}: ${rule.msg}`);
      } else {
        ok(`${file}: ${rule.msg}`);
      }
    }
    if (html.includes('if(nav.parentElement!==document.body)document.body.appendChild(nav)')) {
      fail(`${file}: alte Dock-Logik (direkt an body) noch vorhanden`);
    } else {
      ok(`${file}: keine veraltete body-Dock-Logik`);
    }
    if (!html.includes("nav.parentElement!==dock")) {
      fail(`${file}: ensureBottomNavDock muss #appChromeDock nutzen`);
    } else {
      ok(`${file}: Dock-Parent-Prüfung vorhanden`);
    }
    if (!html.includes('id="appChromeDock"') || !html.includes('</nav>\n</div>\n<script>!function(){try{var n=document.getElementById("bottomNav")')) {
      fail(`${file}: HTML-Dock-Struktur fehlt (#appChromeDock + Inline-Boot)`);
    } else {
      ok(`${file}: HTML-Dock-Struktur korrekt`);
    }
    const dockChunk = html.match(/<div id="appChromeDock"[\s\S]*?<\/nav>/)?.[0] || "";
    if (!dockChunk.includes('id="bottomNav"')) {
      fail(`${file}: #bottomNav muss innerhalb von #appChromeDock liegen`);
    } else {
      ok(`${file}: Tab-Leiste in #appChromeDock`);
    }
    if (!html.includes("getComputedStyle(nav).position!==\"fixed\"")) {
      fail(`${file}: verifyBottomNavDock muss position:fixed prüfen`);
    } else {
      ok(`${file}: position:fixed-Verifikation vorhanden`);
    }
    if (!html.includes("__bottomNavGuardRef")) {
      fail(`${file}: Scroll-Drift-Erkennung fehlt`);
    } else {
      ok(`${file}: Scroll-Drift-Erkennung vorhanden`);
    }
  }

  const version = JSON.parse(read("version.json"));
  const buildMatch = read("index.html").match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
  if (!buildMatch) {
    fail("index.html: APP_BUILD_ID fehlt");
  } else if (buildMatch[1] !== version.buildId) {
    fail(`APP_BUILD_ID (${buildMatch[1]}) stimmt nicht mit version.json (${version.buildId}) überein`);
  } else {
    ok(`Build-ID synchron: ${version.buildId}`);
  }

  return failed;
}

if (require.main === module) {
  const failed = runBottomNavGuard();
  if (failed) {
    console.error(`\n${failed} Bottom-Nav-Guard-Prüfung(en) fehlgeschlagen – Deploy blockiert.`);
    process.exit(1);
  }
  console.log("\nBottom-Nav-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runBottomNavGuard };
