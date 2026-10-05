#!/usr/bin/env node
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
  let match;
  while ((match = re.exec(html)) !== null) {
    if (match[1].includes("const REPO_OWNER")) return match[1];
  }
  return "";
}

function checkJsSyntax(label, code) {
  if (!code) {
    fail(`${label}: Hauptscript nicht gefunden`);
    return;
  }
  try {
    new Function(code);
    ok(`${label}: JavaScript syntax`);
  } catch (error) {
    fail(`${label}: JavaScript syntax – ${error.message}`);
  }
}

function checkJson(file) {
  try {
    const data = JSON.parse(read(file));
    ok(`${file}: gültiges JSON`);
    return data;
  } catch (error) {
    fail(`${file}: ${error.message}`);
    return null;
  }
}

const testHtml = read("test/index.html");
checkJsSyntax("test/index.html", extractMainScript(testHtml));

const testVersion = checkJson("test/version.json");
const testBuildMatch = testHtml.match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
if (!testBuildMatch) {
  fail("test/index.html: APP_BUILD_ID fehlt");
} else if (!testVersion || testBuildMatch[1] !== testVersion.buildId) {
  fail(
    `test/index.html APP_BUILD_ID (${testBuildMatch ? testBuildMatch[1] : "?"}) stimmt nicht mit test/version.json (${testVersion?.buildId || "unbekannt"}) überein`
  );
} else {
  ok(`test/index.html Build-ID synchron: ${testVersion.buildId}`);
}

if (!testHtml.includes("renderStagingBanner")) fail("test/index.html: renderStagingBanner fehlt");
if (!testHtml.includes("window.__DAR_STAGING_APP")) fail("test/index.html: Staging-Markierung fehlt");

for (const marker of [
  'document.body.classList.toggle("is-more-route",isMore)',
  'document.body.classList.toggle("is-account-route",route.view==="account")',
  'document.body.classList.toggle("is-about-route",route.view==="about")',
  'document.body.classList.toggle("is-tawhid-guide-route",route.view==="tawhid-guide")',
  'document.body.classList.toggle("is-notifications-route",route.view==="notifications")',
  'document.body.classList.toggle("is-settings-route",route.view==="settings")',
  'document.body.classList.toggle("is-news-route",route.view==="news")',
  'document.body.classList.toggle("is-news-detail-route",route.view==="news-detail")',
  'document.body.classList.toggle("is-ramadan-route",route.view==="ramadan")',
  'document.body.classList.toggle("is-zakat-route",route.view==="zakat")',
  'document.body.classList.toggle("is-source-library-route",["books","quellen-book","quellen-scholar"].includes(route.view))',
  'document.body.classList.toggle("is-recent-route",route.view==="recent")',
  'document.body.classList.toggle("is-saved-route",route.view==="saved")',
  'document.body.classList.toggle("is-quran-topic-route",route.view==="quran-topic")',
  'document.body.classList.toggle("is-topics-route",["topics","recent","saved"].includes(route.view))'
]) {
  if (!testHtml.includes(marker)) fail(`test/index.html: Route-State fehlt: ${marker}`);
}
const settingsFnStart = testHtml.indexOf("function renderSettings(){");
const settingsFnEnd = settingsFnStart >= 0 ? testHtml.indexOf("function renderJummah(){", settingsFnStart) : -1;
const settingsFn = settingsFnStart >= 0 && settingsFnEnd > settingsFnStart ? testHtml.slice(settingsFnStart, settingsFnEnd) : "";
if (!settingsFn || settingsFn.indexOf('setHeader("Einstellungen"') < 0 || settingsFn.indexOf("renderDarSetupHubHtml()") < 0 || settingsFn.indexOf('setHeader("Einstellungen"') > settingsFn.indexOf("renderDarSetupHubHtml()")) {
  fail("test/index.html: Settings-Hero muss vor Setup-Hub stehen");
} else {
  ok("test/index.html: Settings-Hero steht vor Setup-Hub");
}

if (testHtml.includes('location.href="/widgets/?from=test"')) {
  fail("test/index.html: Widgets verlassen die Test-App auf /widgets/");
} else if (!testHtml.includes('location.href="/test/widgets/?from=test"')) {
  fail("test/index.html: Test-Widgets-Ziel fehlt");
} else {
  ok("test/index.html: Mehr/Account Route-State + Widgets-Test-Isolation");
}


const heroCssFiles = [
  "test/assets/quran-player-v1252.css",
  "test/assets/quran-learn-v1256.css",
  "test/assets/quran-reader-v1251.css",
  "test/assets/quran-overview-v1250.css",
  "test/assets/ilm-scholars-v1240.css",
  "test/assets/ilm-topics-v1242.css",
  "test/assets/ilm-dua-v1244.css",
  "test/assets/quiz-overview-v1257.css",
  "test/assets/more-v1241.css",
  "test/assets/ilm-scholar-profile-v1253.css",
  "test/assets/ilm-topic-detail-v1254.css",
  "test/assets/ilm-post-reader-v1255.css",
  "test/assets/ilm-scholar-detail-v1251.css",
  "test/assets/ilm-book-detail-v1252.css",
  "test/assets/more-v1253.css",
  "test/assets/jummah-v1258.css",
  "test/assets/qibla-v1259.css",
  "test/assets/prayer-v1254.css",
  "test/assets/ilm-research-chat.css",
  "test/assets/library/library-app.css"
];
let remoteHeroRefs = 0;
let localizedHeroRefs = 0;
for (const file of heroCssFiles) {
  const css = read(file);
  const remote = (css.match(/https?:\/\/dnznrvs05pmza\.cloudfront\.net/g) || []).length +
    (css.match(/_jwt=/g) || []).length;
  const local = (css.match(/\/test\/assets\/area-heroes-v1290\//g) || []).length;
  remoteHeroRefs += remote;
  localizedHeroRefs += local;
  if (remote) fail(`${file}: ablaufender Remote-Hero-Link vorhanden`);
}
if (!remoteHeroRefs && localizedHeroRefs >= 17) {
  ok(`Test-Area-Heroes lokal: ${localizedHeroRefs} lokale CSS-Referenzen, keine signierten Remote-URLs`);
} else if (!remoteHeroRefs) {
  fail(`Test-Area-Heroes: nur ${localizedHeroRefs} lokale Referenzen gefunden; erwartet mindestens 17`);
}

const areaShell = read("test/assets/area-shell-v1294.css");
for (const marker of [
  "body.is-calendar-route",
  "body.is-ramadan-route",
  "body.is-notifications-route",
  "body.is-settings-route",
  "body.is-account-route",
  "body.is-about-route",
  "body.is-news-route",
  "body.is-news-detail-route",
  "body.is-zakat-route",
  "body.is-source-library-route",
  "body.is-quran-topic-route"
]) {
  if (!areaShell.includes(marker)) fail(`area-shell-v1294.css: Route-Authority fehlt: ${marker}`);
}

const utilityShell = read("test/assets/area-utility-v1299.css");
for (const marker of [
  "body.is-settings-route",
  "body.is-notifications-route",
  "body.is-account-route",
  "body.is-about-route",
  "body.is-news-route",
  "body.is-ramadan-route",
  "body.is-quran-topic-route",
  "body.is-calendar-route"
]) {
  if (!utilityShell.includes(marker)) fail(`area-utility-v1299.css: Utility-Authority fehlt: ${marker}`);
}
if (!worker.includes("area-utility-v1299.css")) {
  fail("test-app-worker.js: area-utility-v1299.css fehlt in finaler Authority");
} else {
  ok("test-app-worker.js: Utility-Surface v1299 aktiv");
}

const heroDir = path.join(ROOT, "test/assets/area-heroes-v1290");
if (!fs.existsSync(heroDir)) {
  fail("test/assets/area-heroes-v1290 fehlt");
} else {
  const heroFiles = fs.readdirSync(heroDir).filter((name) => /\.webp$/i.test(name));
  if (heroFiles.length < 17) fail(`area-heroes-v1290: nur ${heroFiles.length} WebP-Dateien; erwartet mindestens 17`);
  else ok(`area-heroes-v1290: ${heroFiles.length} permanente WebP-Heroes vorhanden`);
}

const sw = read("service-worker.js");
if (!/dar-al-tawhid-offline-light-v\d+/.test(sw)) fail("service-worker.js: CACHE_VERSION fehlt");
else ok("service-worker.js: CACHE_VERSION vorhanden");

const worker = read("cloudflare/test-app-worker.js");
if (!worker.includes("Response.redirect")) fail("test-app-worker.js: Root-Redirect fehlt");
else ok("test-app-worker.js: Root-Redirect vorhanden");
const areaAuthorityFiles = [
  "quran-player-v1252.css",
  "quran-learn-v1256.css",
  "quran-reader-v1251.css",
  "quran-overview-v1250.css",
  "ilm-scholars-v1240.css",
  "ilm-topics-v1242.css",
  "ilm-dua-v1244.css",
  "quiz-overview-v1257.css",
  "more-v1241.css",
  "ilm-scholar-profile-v1253.css",
  "ilm-topic-detail-v1254.css",
  "ilm-post-reader-v1255.css",
  "ilm-scholar-detail-v1251.css",
  "ilm-book-detail-v1252.css",
  "more-v1253.css",
  "jummah-v1258.css",
  "qibla-v1259.css",
  "prayer-v1254.css"
];
if (!worker.includes("area-shell-v1294.css") || !worker.includes("tawhid-guide-v1295.css") || !worker.includes("darTestAreaAuthoritiesV1299")) {
  fail("test-app-worker.js: v1299 finale Area-/Tawhid-Authority fehlt");
} else {
  ok("test-app-worker.js: v1299 finale Area-/Tawhid-Authority aktiv");
}
if (/html\s*=\s*html\.replace\(\/<\\\/head>\/i,\s*'<link rel="stylesheet"/.test(worker)) {
  fail("test-app-worker.js: Bereichs-CSS darf nicht mehr von </head> abhängen");
} else {
  ok("test-app-worker.js: keine </head>-abhängige Bereichs-CSS-Injection");
}
for (const file of areaAuthorityFiles) {
  const count = worker.split(file).length - 1;
  if (count !== 1) fail(`test-app-worker.js: ${file} muss exakt einmal in der finalen Authority stehen (gefunden: ${count})`);
}
if (areaAuthorityFiles.every((file) => worker.split(file).length - 1 === 1)) {
  ok(`test-app-worker.js: ${areaAuthorityFiles.length} Bereichs-Styles exakt einmal eingebunden`);
}
if (worker.includes("injectLateTestStylesheet")) {
  fail("test-app-worker.js: alte doppelte Einzel-Stylesheet-Injection noch vorhanden");
} else {
  ok("test-app-worker.js: keine doppelte Einzel-Stylesheet-Injection");
}

const testWidgets = read("test/widgets/index.html");
if (/http-equiv=["']refresh["']/i.test(testWidgets) || /location\.replace\(["']\/widgets\//.test(testWidgets)) {
  fail("test/widgets/index.html: darf nicht in die Besucher-Widgets umleiten");
} else {
  ok("test/widgets/index.html: bleibt in der Test-App");
}
if (!testWidgets.includes("pw-test-hero") || !testWidgets.includes("Nur Test-App")) {
  fail("test/widgets/index.html: v1297 Test-Widgets-Hero fehlt");
} else {
  ok("test/widgets/index.html: v1297 Test-Widgets-Oberfläche aktiv");
}
if (!worker.includes('(?:widgets|wasiyyah)')) {
  fail("test-app-worker.js: No-Cache-Schutz für Widgets/Wasiyyah fehlt");
} else {
  ok("test-app-worker.js: Widgets/Wasiyyah Cache-Schutz aktiv");
}

const testWrangler = read("wrangler.test.toml");
if (!testWrangler.includes('[ai]') || !testWrangler.includes('binding = "AI"')) {
  fail("wrangler.test.toml: Workers-AI-Binding für Kids-Rezitationsprüfung fehlt");
} else {
  ok("wrangler.test.toml: Workers-AI-Binding vorhanden");
}
for (const marker of [
  '"/kids/api/recitation/grade"',
  '@cf/openai/whisper-large-v3-turbo',
  'gradeKidsRecitation',
  'pronunciationReference: false'
]) {
  if (!worker.includes(marker)) fail(`test-app-worker.js: Kids-Rezitationsmarker fehlt: ${marker}`);
}
if (worker.includes('"/kids/api/recitation/grade"') && worker.includes("@cf/openai/whisper-large-v3-turbo")) {
  ok("test-app-worker.js: Kids-Rezitationsendpoint vorhanden");
}

if (failed) {
  console.error(`\n${failed} Test-App-Check(s) fehlgeschlagen – Deploy stoppen.`);
  process.exit(1);
}

console.log("\nTest-App-Checks bestanden.");
