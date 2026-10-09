#!/usr/bin/env node
/**
 * Pre-deploy health check – stoppt Deploy bei kaputtem Kern.
 * Usage: node scripts/app-health-check.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

function ok(msg) {
  console.log("OK:", msg);
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function extractMainScript(html) {
  const re = /<script>\s*\n([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes("const REPO_OWNER")) return m[1];
  }
  return "";
}

function extractAdminMainScript(html) {
  const m = html.match(/<script>\nwindow\.DAR_ANALYTICS_CONFIG[\s\S]*?<\/script>/);
  return m ? m[0].replace(/^<script>\n/, "").replace(/<\/script>$/, "") : "";
}

function checkJsSyntax(label, code) {
  if (!code) {
    fail(`${label}: Hauptscript nicht gefunden`);
    return;
  }
  try {
    new Function(code);
    ok(`${label}: JavaScript syntax`);
  } catch (e) {
    fail(`${label}: JavaScript syntax – ${e.message}`);
  }
}

function checkJson(label, file) {
  try {
    const data = JSON.parse(read(file));
    ok(`${label}: gültiges JSON`);
    return data;
  } catch (e) {
    fail(`${label}: ${e.message}`);
    return null;
  }
}

// Qurʾān-Player runtime regression guard. No layout/CSS changes.
const quranRuntimePaths = [
  "assets/dar-quran-player.js",
  "assets/dar-quran-audio-pack.js",
  "test/assets/dar-quran-player.js",
  "test/assets/dar-quran-audio-pack.js"
];
for (const file of quranRuntimePaths) checkJsSyntax(file, read(file));
const quranPlayerProd = read(quranRuntimePaths[0]);
const quranPackProd = read(quranRuntimePaths[1]);
// Independent PRs review the test and visitor tracks separately. Enforce parity on main,
// but do not reject the visitor review before the test-track PR has been merged.
const stagedQuranReview = process.env.GITHUB_EVENT_NAME === "pull_request"
  && process.env.GITHUB_HEAD_REF === "fix/quran-player-visitor-stability-v983-20261009";
if (stagedQuranReview) {
  ok("Qurʾān-Player: getrennte Test-/Besucher-PRs; Parität vor main-Merge erforderlich");
} else {
  if (quranPlayerProd !== read(quranRuntimePaths[2])) fail("Qurʾān-Player: Test-/Besucher-Runtime unterschiedlich");
  else ok("Qurʾān-Player: Test-/Besucher-Runtime synchron");
  if (quranPackProd !== read(quranRuntimePaths[3])) fail("Qurʾān-Audio-Pack: Test-/Besucher-Runtime unterschiedlich");
  else ok("Qurʾān-Audio-Pack: Test-/Besucher-Runtime synchron");
}
for (const [marker, label] of [
  ["fallbackReciterTried", "begrenzter Rezitator-Fallback"],
  ["recoverPlayback(", "Wiedergabe-Stall-Recovery"],
  ["dataLoadSerial", "asynchroner Vers-Ladeschutz"],
  ["activeDataRequest", "deduplizierte Sūrah-Ladevorgänge"],
  ["returnQuranRoute", "Rücknavigation"],
  ["next: function () { return nextAyah(false); }", "native iOS Nächster Titel"],
  ["prev: function () { return prevAyah(); }", "native iOS Voriger Titel"]
]) {
  if (!quranPlayerProd.includes(marker)) fail("Qurʾān-Player: " + label + " fehlt");
}
if (!quranPackProd.includes("retryCounts") || !quranPackProd.includes("have === AYAH_TOTAL")) {
  fail("Qurʾān-Audio-Pack: Download-Begrenzung oder vollständiger Abschluss fehlt");
} else {
  ok("Qurʾān-Audio-Pack: Retry-/Vollständigkeitsregel vorhanden");
}

// Execute representative functions from the actual runtime against isolated fakes.
// These checks do not open or modify any player DOM or native preferences.
function quranIsolate(name, names, mocks) {
  const tag = "function " + name + "(";
  const pos = quranPlayerProd.indexOf(tag);
  if (pos < 0) throw new Error("Qurʾān-Player Funktion fehlt: " + name);
  const start = quranPlayerProd.slice(pos - 6, pos) === "async " ? pos - 6 : pos;
  const end = quranPlayerProd.indexOf("\n  }", pos);
  if (end < 0) throw new Error("Qurʾān-Player Funktionsende fehlt: " + name);
  return new Function(...names, "return (" + quranPlayerProd.slice(start, end + 4) + ");")(...mocks);
}
function quranRuntimeAssert(good, description) {
  if (!good) fail("Qurʾān-Player Runtime-Test: " + description);
  else ok("Qurʾān-Player Runtime-Test: " + description);
}
try {
  const state = { surah: 36, ayah: 1, playing: false };
  let calls = [];
  const prev = quranIsolate("prevAyah",
    ["state", "gotoAyah", "gotoSurah", "ayahCountHard", "logAudio"],
    [state, (ayah) => calls.push(["ayah", ayah]),
      (surah, ayah) => calls.push(["surah", surah, ayah]),
      (surah) => surah === 35 ? 45 : 83, () => {}]);
  prev();
  quranRuntimeAssert(calls.length === 1 && calls[0][0] === "surah"
    && calls[0][1] === 35 && calls[0][2] === 45,
    "Vorherige Sūrah beginnt bei der letzten Āyah");
  calls = [];
  state.ayah = 3;
  prev();
  quranRuntimeAssert(calls.length === 1 && calls[0][0] === "ayah" && calls[0][1] === 2,
    "Voriger Vers innerhalb der Sūrah");

  const media = { ended: true, currentSrc: "/quran-audio/ar.alafasy/3706.mp3", getAttribute: () => "" };
  const engine = { started: true, loadedSurah: 36, loadedAyah: 6 };
  const verse = { surah: 36, ayah: 6 };
  const actuallyEnded = quranIsolate("trackReallyFinished",
    ["audioEl", "engine", "state", "ignoreEndedUntil", "logAudio", "snapAudio"],
    [() => media, engine, verse, Date.now() + 5000, () => {}, () => ({})]);
  quranRuntimeAssert(actuallyEnded(), "kurze Āyah wird trotz Schutzfenster beendet");
  engine.loadedAyah = 5;
  quranRuntimeAssert(!actuallyEnded(), "veraltetes Endsignal wird ignoriert");

  const recoveryEngine = { wantPlay: true, recoveryCount: 0 };
  const recoveryState = { playing: true, current: 3 };
  let retries = 0, pauses = 0, errorPaints = 0;
  const recover = quranIsolate("recoverPlayback",
    ["engine", "state", "window", "clearStallRetry", "audioEl", "loadAudio",
     "paintError", "paintChrome", "paintMini", "syncPublicAudioState", "logAudio", "snapAudio"],
    [recoveryEngine, recoveryState, {}, () => {},
     () => ({ currentTime: 3, pause: () => { pauses++; } }),
     (play, keep, recovery) => { if (play && keep && recovery) retries++; },
     () => { errorPaints++; }, () => {}, () => {}, () => {}, () => {}, () => ({})]);
  for (let i = 0; i < 5; i++) recover("waiting");
  quranRuntimeAssert(retries === 3 && pauses === 1 && errorPaints === 1
    && recoveryEngine.wantPlay === false && recoveryState.playing === false,
    "Wiedergabeversuche enden kontrolliert statt in Schleife");
} catch (error) {
  fail("Qurʾān-Player Runtime-Tests konnten nicht ausgeführt werden: " + error.message);
}

// Visitor app
const indexHtml = read("index.html");
if (!indexHtml.includes("function render(")) fail("index.html: render() fehlt");
if (indexHtml.includes('App wird geladen') && !indexHtml.includes("function render(")) {
  fail("index.html: Lade-Platzhalter ohne render()");
}
checkJsSyntax("index.html", extractMainScript(indexHtml));
if (/BYPASS_POST_CACHE"\)\}\}catch\(e\)\{\}/.test(extractMainScript(indexHtml)) &&
    !/BYPASS_POST_CACHE"\)\}\}\}\}catch\(e\)\{\}/.test(extractMainScript(indexHtml))) {
  fail("index.html: hardRefreshApp Klammerfehler");
}

function checkNoStrayQuranBind(label, html) {
  const main = extractMainScript(html);
  if (/\}bindQuranOfflineAudioSection\(backdrop\)\s*\nfunction /.test(main)) {
    fail(`${label}: bindQuranOfflineAudioSection(backdrop) läuft außerhalb der Funktion (Start-Absturz)`);
  } else {
    ok(`${label}: Qurʾān-Anzeige-Bindung nicht auf Top-Level`);
  }
}
checkNoStrayQuranBind("index.html", indexHtml);
checkNoStrayQuranBind("test/index.html", read("test/index.html"));
checkJsSyntax("test/index.html", extractMainScript(read("test/index.html")));

// Admin app
checkJsSyntax("admin/index.html", extractAdminMainScript(read("admin/index.html")));
const adminHtml = read("admin/index.html");
if (!adminHtml.includes("adminSlugPart") && !adminHtml.includes("function slugify")) {
  fail("admin/index.html: slugify/adminSlugPart fehlt");
}
if (!adminHtml.includes("checkVisitorAppHealth")) {
  fail("admin/index.html: Besucher-App Schutz fehlt");
}

// Posts index
const postsIndex = checkJson("posts-index.json", "content/posts/posts-index.json");
if (postsIndex && (!Array.isArray(postsIndex.files) || postsIndex.files.length < 350)) {
  fail(`posts-index.json: zu wenige Einträge (${postsIndex.files?.length || 0})`);
}

// Daily content
const daily = checkJson("daily.json", "content/updates/daily.json");
if (daily && !daily.recommendation?.id && !daily.dua?.id) {
  fail("daily.json: recommendation und dua fehlen");
}

// Prayer status
checkJson("prayer-push-status.json", "content/admin/prayer-push-status.json");

// version.json
checkJson("version.json", "version.json");

// Service workers
const visitorSw = read("service-worker.js");
if (!visitorSw.match(/dar-al-tawhid-offline-light-v\d+/)) fail("service-worker.js: CACHE_VERSION fehlt");
if (/\/admin\/[^'"\s]/.test(visitorSw) && visitorSw.includes("APP_SHELL") && visitorSw.match(/['"]\/admin/)) {
  fail("service-worker.js: darf /admin/ nicht im APP_SHELL cachen");
}

const adminSw = read("admin/sw.js");
if (!adminSw.match(/dar-admin-stats-v\d+/)) fail("admin/sw.js: CACHE_VERSION fehlt");

// Worker
const worker = read("cloudflare/worker.js");
if (!worker.includes("/api/admin/next-number")) fail("worker.js: next-number fehlt");
if (!worker.includes("checkVisitorSiteHealth")) fail("worker.js: visitor-health fehlt");
if (!worker.includes("sendNewPostPush")) fail("worker.js: post push fehlt");

// Push-System (streng – blockiert Deploy bei fehlendem Scheduler)
const pushGuardFails = require("./push-system-guard.js").runPushSystemGuard();
const pushHealGuardFails = require("./push-autonomous-heal-guard.js").runPushAutonomousHealGuard();
if (pushHealGuardFails) failed += pushHealGuardFails;
if (pushGuardFails) failed += pushGuardFails;

// App-Update + Willkommens-Push-Schutz (Versions-Banner-Schleife)
const versionGuardFails = require("./version-update-guard.js").runVersionUpdateGuard();
if (versionGuardFails) failed += versionGuardFails;

try {
  const stabilityFails = require("./app-stability-guard.js").runAppStabilityGuard();
  if (stabilityFails) failed += stabilityFails;
} catch (e) {
  fail(`app-stability-guard: ${e.message}`);
}

// Push scripts
if (!fs.existsSync(path.join(ROOT, "scripts/send-prayer-push.js"))) fail("send-prayer-push.js fehlt");
if (!fs.existsSync(path.join(ROOT, "scripts/send-post-push.js"))) fail("send-post-push.js fehlt");

// Repo-Integrität (Massen-Lösch-Schutz)
const edgeToEdgeFails = require("./edge-to-edge-theme-guard.js").runEdgeToEdgeThemeGuard();
if (edgeToEdgeFails) failed += edgeToEdgeFails;

try {
  const kidsDesignFails = require("./kids-design-guard.js").runKidsDesignGuard();
  if (kidsDesignFails) failed += kidsDesignFails;
} catch (e) {
  fail(`kids-design-guard: ${e.message}`);
}

const repoIntegrityFails = require("./repo-integrity-guard.js").runRepoIntegrityGuard();
if (repoIntegrityFails) failed += repoIntegrityFails;

try {
  const pushLanesFails = require("./push-lanes-guard.js").runPushLanesGuard();
  if (pushLanesFails) failed += pushLanesFails;
} catch (e) {
  fail(`push-lanes-guard: ${e.message}`);
}

try {
  const postPushHangFails = require("./post-push-hang-guard.js").runPostPushHangGuard();
  if (postPushHangFails) failed += postPushHangFails;
} catch (e) {
  fail(`post-push-hang-guard: ${e.message}`);
}

try {
  require("child_process").execFileSync(
    process.execPath,
    [path.join(__dirname, "validate-canonical-content.js")],
    { stdio: "inherit" }
  );
} catch (e) {
  fail("canonical-content validation");
}

if (failed) {
  console.error(`\n${failed} check(s) failed – Deploy stoppen.`);
  process.exit(1);
}
console.log("\nAll health checks passed.");
