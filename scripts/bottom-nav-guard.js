#!/usr/bin/env node
/**
 * BOTTOM_NAV_GUARD: blockiert Deploy wenn Tab-Leiste nicht am Viewport verankert ist
 * oder Safari-Crash-Muster (Endlosschleife) wieder eingeführt werden.
 *
 * Usage: node scripts/bottom-nav-guard.js
 */
const { read, createReporter } = require("./lib/guard-report.cjs");

const VISITOR_FILES = ["index.html", "test/index.html"];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) return "";
  const open = source.indexOf("{", start);
  if (open === -1) return "";
  let depth = 1;
  let i = open + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return source.slice(start, i);
}

function extractInlineBoot(html) {
  const match = html.match(
    /<script>!function\(\)\{try\{var n=document\.getElementById\("bottomNav"\)[\s\S]*?\}\(\);<\/script>/
  );
  return match ? match[0] : "";
}

function runBottomNavGuard() {
  const report = createReporter("BOTTOM-NAV-GUARD");
  const { fail, ok, mustInclude, mustNotInclude } = report;

  function mustNotMatch(label, content, rules) {
    for (const rule of rules) {
      if (rule.pattern.test(content)) {
        fail(`${label}: ${rule.msg}`);
        return false;
      }
    }
    ok(`${label}: Regex-Sperren bestanden (${rules.length})`);
    return true;
  }

  const needles = [
    "BOTTOM NAV GUARD FINAL",
    "BOTTOM NAV CRASH GUARD FINAL",
    'id="appChromeDock"',
    "app-chrome-dock",
    'data-nav-dock="bottom"',
    "display:contents!important",
    "function ensureBottomNavDock",
    "function initBottomNavGuard",
    "function verifyBottomNavDock",
    "function bottomNavDockMisplaced",
    "initBottomNavGuard()"
  ];

  const forbidden = [
    {
      pattern: /#appChromeDock\.app-chrome-dock\{[^}]*contain:layout style!important/,
      msg: "#appChromeDock darf kein contain:layout style haben (bricht position:fixed am Viewport)"
    },
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

  const crashForbiddenGlobal = [
    "__bottomNavGuardRef",
    "setInterval(check,",
    "subtree:true",
    "Math.abs(rect.bottom-vh)>120",
    "ensureBottomNavDock();verifyBottomNavDock()"
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

    mustNotInclude(`${file} (Safari-Crash-Sperre)`, html, crashForbiddenGlobal);

    const ensureDock = extractFunction(html, "ensureBottomNavDock");
    const verifyDock = extractFunction(html, "verifyBottomNavDock");
    const initGuard = extractFunction(html, "initBottomNavGuard");
    const inlineBoot = extractInlineBoot(html);

    if (!ensureDock) {
      fail(`${file}: ensureBottomNavDock nicht gefunden`);
    } else {
      mustInclude(`${file} ensureBottomNavDock`, ensureDock, [
        "__bottomNavDockBusy",
        "nav.parentElement!==dock",
        'dock.style.setProperty("display","contents","important")',
        'nav.style.setProperty("position","fixed","important")',
        "finally{window.__bottomNavDockBusy=false}"
      ]);
      mustNotInclude(`${file} ensureBottomNavDock`, ensureDock, ["document.body.appendChild(nav)"]);
      if (
        !ensureDock.includes("dock.parentElement!==document.body") ||
        !ensureDock.includes("document.body.appendChild(dock)")
      ) {
        fail(`${file} ensureBottomNavDock: appendChild(dock) nur mit Parent-Prüfung erlaubt`);
      } else {
        ok(`${file} ensureBottomNavDock: bedingtes appendChild(dock)`);
      }
      const appendDockCount = (ensureDock.match(/document\.body\.appendChild\(dock\)/g) || []).length;
      if (appendDockCount !== 1) {
        fail(`${file} ensureBottomNavDock: genau ein appendChild(dock) erwartet, gefunden ${appendDockCount}`);
      } else {
        ok(`${file} ensureBottomNavDock: kein doppeltes appendChild(dock)`);
      }
    }

    if (!verifyDock) {
      fail(`${file}: verifyBottomNavDock nicht gefunden`);
    } else {
      mustInclude(`${file} verifyBottomNavDock`, verifyDock, [
        'getComputedStyle(nav).position!=="fixed"',
        "rect.top>vh",
        "rect.bottom<40"
      ]);
      mustNotInclude(`${file} verifyBottomNavDock`, verifyDock, [
        "__bottomNavGuardRef",
        "Math.abs(rect.bottom",
        "ensureBottomNavDock();verifyBottomNavDock()"
      ]);
    }

    if (!initGuard) {
      fail(`${file}: initBottomNavGuard nicht gefunden`);
    } else {
      mustInclude(`${file} initBottomNavGuard`, initGuard, [
        "__bottomNavGuardBound",
        "lastCheck",
        "verifyBottomNavDock()",
        "obs.observe(document.body,{childList:true})"
      ]);
      mustNotInclude(`${file} initBottomNavGuard`, initGuard, [
        "setInterval(check,",
        "subtree:true",
        "ensureBottomNavDock();verifyBottomNavDock()",
        "obs.observe(document.body,{childList:true,subtree:true})"
      ]);
      mustNotMatch(`${file} initBottomNavGuard check()`, initGuard, [
        {
          pattern: /const check=\([^)]*\)=>[\s\S]*ensureBottomNavDock\(\)/,
          msg: "check() darf ensureBottomNavDock nicht direkt aufrufen (nur verifyBottomNavDock)"
        }
      ]);
    }

    if (!inlineBoot) {
      fail(`${file}: Inline-Boot-Script für Bottom-Nav fehlt`);
    } else {
      mustInclude(`${file} inline-boot`, inlineBoot, [
        'n.parentElement!==d',
        'd.parentElement!==document.body',
        'if(d.parentElement!==document.body)document.body.appendChild(d)'
      ]);
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
    if (
      !html.includes('id="appChromeDock"') ||
      !html.includes('</nav>\n</div>\n<script>!function(){try{var n=document.getElementById("bottomNav")')
    ) {
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
    if (!html.includes('setProperty("display","contents","important")')) {
      fail(`${file}: ensureBottomNavDock muss Dock auf display:contents setzen`);
    } else {
      ok(`${file}: Dock display:contents vorhanden`);
    }
    if (!html.includes("#bottomNav.bottom-nav{position:fixed!important")) {
      fail(`${file}: #bottomNav muss direkt am Viewport position:fixed haben`);
    } else {
      ok(`${file}: #bottomNav Viewport-Fix vorhanden`);
    }
    if (!html.includes("__bottomNavDockBusy")) {
      fail(`${file}: Bottom-Nav-Guard muss Re-Entrancy-Schutz haben`);
    } else {
      ok(`${file}: Re-Entrancy-Schutz vorhanden`);
    }
    if (/setInterval\(check,\s*700\)/.test(html)) {
      fail(`${file}: setInterval(700) im Bottom-Nav-Guard verboten (Safari-Crash)`);
    } else {
      ok(`${file}: kein aggressives setInterval im Bottom-Nav-Guard`);
    }
    if (!html.includes("getComputedStyle(nav).position!==\"fixed\"")) {
      fail(`${file}: verifyBottomNavDock muss position:fixed prüfen`);
    } else {
      ok(`${file}: position:fixed-Verifikation vorhanden`);
    }
    if (!html.includes("lastCheck")) {
      fail(`${file}: Bottom-Nav-Guard Throttle fehlt`);
    } else {
      ok(`${file}: Bottom-Nav-Guard Throttle vorhanden`);
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

  return report.failed;
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
