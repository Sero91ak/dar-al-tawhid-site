#!/usr/bin/env node
/**
 * Live-Verifikation mit CDN-Retries nach Deploy.
 * Voice-Cloud: öffentliche Website und native App-Shell werden getrennt geprüft.
 * Voice-Cloud-Parität v2: zentraler Live-Paritätscheck nutzt ebenfalls die native App-Shell.
 * Nutzbar für Besucher-App, Test-App und Quellenbibliothek.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const ATTEMPTS = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 10);
const DELAY_MS = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 4000);

function readBuildId(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")).buildId;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatus(url, extraHeaders = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache", ...extraHeaders }
  });
  return {
    status: res.status,
    text: await res.text(),
    cf: res.headers.get("cf-cache-status") || "n/a",
    surface: res.headers.get("x-dar-surface") || ""
  };
}

async function waitForStatus(url, expected = 200) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { status, cf } = await fetchStatus(url);
    console.log(`verify: ${url} -> ${status} (cf=${cf}, attempt ${attempt}/${ATTEMPTS})`);
    if (status === expected) return true;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return false;
}

async function waitForHtmlIncludes(url, needles, extraHeaders = {}) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { status, text, cf, surface } = await fetchStatus(url, extraHeaders);
    const ok = status === 200 && needles.every((needle) => text.includes(needle));
    console.log(
      `verify: ${url} -> ${status} (cf=${cf}, surface=${surface || "n/a"}, attempt ${attempt}/${ATTEMPTS}, html=${ok ? "ok" : "pending"})`
    );
    if (ok) return true;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return false;
}

async function waitForPublicWebsite(url) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { status, text, cf, surface } = await fetchStatus(url);
    const htmlOk =
      text.includes("DĀR AL TAWḤĪD") &&
      text.includes("desktop-overhaul") &&
      text.includes("darPublicWebsiteGuardV1") &&
      !text.includes('id="darDedicatedPwaBootV2"');
    const ok = status === 200 && surface === "public-website" && htmlOk;
    console.log(
      `verify-public: ${url} -> ${status} (cf=${cf}, surface=${surface || "n/a"}, attempt ${attempt}/${ATTEMPTS}, html=${htmlOk ? "ok" : "fail"})`
    );
    if (ok) return true;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return false;
}

async function main() {
  const mode = process.env.DEPLOY_VERIFY_MODE || "all";
  let failed = 0;

  if (mode === "test" || mode === "all") {
    const testBuild = process.env.EXPECT_TEST_BUILD || readBuildId("test/version.json");
    const assetOk = await waitForStatus(
      `${SITE_URL}/test/assets/library/canonical-source-library.js`,
      200
    );
    const booksOk = await waitForStatus(`${SITE_URL}/data/books-library.json`, 200);
    const scholarsOk = await waitForStatus(`${SITE_URL}/data/scholars-library.json`, 200);
    const htmlOk = await waitForHtmlIncludes(`${SITE_URL}/test/index.html`, [
      testBuild,
      "canonical-source-library.js",
      "Quellenbibliothek",
      testBuild.includes("v360") ? "QURAN_OVERVIEW_V360" : "quran-surah-card"
    ]);
    if (!assetOk || !booksOk || !scholarsOk || !htmlOk) failed += 1;
    else console.log(`verify: Test-App Quellenbibliothek live OK (${testBuild})`);
  }

  if (mode === "visitor" || mode === "all") {
    const visitorBuild = process.env.EXPECT_BUILD || readBuildId("version.json");
    const expectZakat = Number(process.env.EXPECT_ZAKAT_VERSION || 18);
    const nativeHeaders = { "User-Agent": "DarAlTawhid-iOS/DeployVerify" };

    // Browser root intentionally serves the public desktop website, while the
    // installed/native app receives the canonical app shell. Validate both.
    const publicWebsiteOk = await waitForPublicWebsite(`${SITE_URL}/`);
    const publicIsolationSwOk = await waitForHtmlIncludes(
      `${SITE_URL}/service-worker.js?cb=${Date.now()}`,
      ["PUBLIC_WEBSITE_NETWORK_ONLY_V1"]
    );
    let visitorOk = await waitForHtmlIncludes(`${SITE_URL}/`, [visitorBuild], nativeHeaders);
    if (!visitorOk) {
      visitorOk = await waitForHtmlIncludes(`${SITE_URL}/index.html`, [visitorBuild], nativeHeaders);
    }
    const pwaOk = await waitForHtmlIncludes(`${SITE_URL}/pwa/?pwa=1`, [
      visitorBuild,
      "darDedicatedPwaBootV2",
      "__DAR_PWA_DEDICATED_APP=true",
      'dataset.appPath="android-pwa"'
    ]);
    const publicInstallManifestOk = await waitForHtmlIncludes(`${SITE_URL}/install-manifest.json`, [
      '"scope": "/"',
      '"start_url": "/pwa/?pwa=1"',
      '"id": "/pwa/"'
    ]);
    const publicInstallWorkerOk = await waitForHtmlIncludes(`${SITE_URL}/public-pwa-install-sw.js`, [
      "DAR PUBLIC PWA INSTALL BRIDGE V1",
      "event.respondWith(fetch(event.request))"
    ]);
    const pwaInstallerOk = await waitForHtmlIncludes(`${SITE_URL}/pwa/install/`, [
      "Web-App installieren",
      "/pwa/service-worker.js",
      "Browser-Menü"
    ]);
    const downloadButtonsOk = await waitForHtmlIncludes(`${SITE_URL}/?page=downloads`, [
      // One-tap install stays on the site; the old /pwa/install/ fallback is no longer required.
      "Android bereitet den direkten Installationsdialog vor.",
      "https://apps.apple.com/de/app/id6805988753"
    ]);

    // DAR_ADULT_RESPONSIVE_VIEWPORT_V1381_LIVE_GATE
    // Confirm iOS/visitor HTML links the final geometry authority AND the
    // independently served CSS actually contains its viewport correction.
    // A successful GitHub merge or unchanged app-shell build ID is not enough.
    const responsiveHref = "/assets/adult-responsive-viewport-v1381.css?v=20261017-responsive-v1382";
    const responsiveHtmlOk = await waitForHtmlIncludes(
      `${SITE_URL}/index.html?responsive-check=${Date.now()}`,
      ['id="darAdultResponsiveViewportV1381"', responsiveHref],
      nativeHeaders
    );
    const responsiveCssOk = await waitForHtmlIncludes(
      `${SITE_URL}${responsiveHref}`,
      [
        "adult visitor adaptive viewport v1381",
        "DAR_ADULT_RESPONSIVE_AXIS_V1382",
        "--dar-axis-stage:calc(100% - var(--dar-axis-gutter) - var(--dar-axis-gutter))",
        "--dar-responsive-safe-gutter",
        "--dar-responsive-stage-width",
        ".post-reader > .post-reader-title"
      ]
    );

    // VISITOR_IOS_SCROLL_BOUNDARY_LIVE_V2
    // Verify the REAL WKWebView response, not the public browser website.
    // A successful Worker deploy alone cannot prove that the native shell
    // receives the CSS/JS. Only the TestFlight binary can disable UIKit bounce.
    const scrollCssHref = "/assets/dar-adult-top-scroll-boundary-v1.css?v=20261020-no-overlay-v8";
    const scrollJsHref = "/assets/dar-adult-top-scroll-boundary-v1.js?v=20261030-no-pull-hero-v9";
    const iosScrollHtmlOk = await waitForHtmlIncludes(
      `${SITE_URL}/?ios-scroll-v2=${Date.now()}`,
      [
        'id="darAdultTopScrollCssV1"',
        'id="darAdultTopScrollJsV1"',
        scrollCssHref, scrollJsHref
      ],
      { "User-Agent": "DarAlTawhid-iOS/1.0 WKWebView" }
    );
    const iosScrollCssOk = await waitForHtmlIncludes(
      `${SITE_URL}${scrollCssHref}`,
      ["DAR_ADULT_TOP_SCROLL_BOUNDARY_V2", "POST HERO V2", "DAR_ADULT_SCROLL_EDGE_NO_OVERLAY_20261020", "overscroll-behavior-y:none"]
    );
    const iosScrollJsOk = await waitForHtmlIncludes(
      `${SITE_URL}${scrollJsHref}`,
      ["DAR_ADULT_TOP_SCROLL_BOUNDARY_V4", "DAR_ADULT_SCROLL_EDGE_NO_OVERLAY_20261020", "window.innerHeight", "function canScroll(direction)", 'stepY>0?"up":"down"', "dy>0.15"]
    );
    console.log(
      `verify iOS scroll boundary: native-html=${iosScrollHtmlOk ? "ok" : "FAIL"}, ` +
      `css=${iosScrollCssOk ? "ok" : "FAIL"}, js=${iosScrollJsOk ? "ok" : "FAIL"} ` +
      "(native UIKit bounces requires a separately installed TestFlight build)"
    );

    const { text } = await fetchStatus(`${SITE_URL}/`, nativeHeaders);
    const zakatMatch = text.match(/zakat-app\.js\?v=(\d+)/);
    const zakatVer = zakatMatch ? Number(zakatMatch[1]) : 0;

    const voiceStudioOk = await waitForHtmlIncludes(`${SITE_URL}/voice-studio/`, [
      "DĀR AL TAWḤĪD – Voice Studio",
      "SERHAT VOICE",
      "sw-v11.js",
      "content-studio.js"
    ]);
    const voiceVersionOk = await waitForStatus(`${SITE_URL}/voice-studio/version.json`, 200);
    const pronunciationOk = await waitForStatus(
      `${SITE_URL}/data/pronunciation/pronunciation-rules.json`,
      200
    );

    // Release gate: inspect the actual CDN-delivered Quran playback engine.
    const quranGaplessOk = await waitForHtmlIncludes(
      `${SITE_URL}/assets/dar-quran-player.js?cb=${Date.now()}`,
      ["PLAYER_BUILD = 1112", "PLAYER_BUILD = 983",
       "function beginWarmHandoff()", "function adoptWarmHandoff(",
       "Date.now() < ignoreEndedUntil && !a.ended"]
    );
    console.log(`verify Quran audio deck handoff: ${quranGaplessOk ? "ok" : "FAIL"}`);
    if (!iosScrollHtmlOk || !iosScrollCssOk || !iosScrollJsOk || !responsiveHtmlOk || !responsiveCssOk || !publicWebsiteOk || !publicIsolationSwOk || !publicInstallManifestOk || !publicInstallWorkerOk || !visitorOk || !pwaOk || !pwaInstallerOk || !downloadButtonsOk || zakatVer < expectZakat || !voiceStudioOk || !voiceVersionOk || !pronunciationOk || !quranGaplessOk) {
      console.error(
        `verify: Besucher-App fehlgeschlagen (ios-scroll-html=${iosScrollHtmlOk ? "ok" : "fail"}, ios-scroll-css=${iosScrollCssOk ? "ok" : "fail"}, ios-scroll-js=${iosScrollJsOk ? "ok" : "fail"}, responsive-html=${responsiveHtmlOk ? "ok" : "fail"}, responsive-css=${responsiveCssOk ? "ok" : "fail"}, public=${publicWebsiteOk ? "ok" : "fail"}, web-sw-isolation=${publicIsolationSwOk ? "ok" : "fail"}, public-install-manifest=${publicInstallManifestOk ? "ok" : "fail"}, public-install-sw=${publicInstallWorkerOk ? "ok" : "fail"}, native-build=${visitorOk ? visitorBuild : "fail"}, android-pwa=${pwaOk ? "ok" : "fail"}, pwa-install=${pwaInstallerOk ? "ok" : "fail"}, downloads=${downloadButtonsOk ? "ok" : "fail"}, zakat=v${zakatVer || "?"}, voice=${voiceStudioOk ? "ok" : "fail"}, voice-version=${voiceVersionOk ? "ok" : "fail"}, pronunciation=${pronunciationOk ? "ok" : "fail"}, quran-gapless=${quranGaplessOk ? "ok" : "fail"})`
      );
      failed += 1;
    } else {
      console.log(
        `verify: Besucher-App live OK (public website + native ${visitorBuild} + Android PWA /pwa/, zakat>=v${expectZakat}, Voice Studio + Aussprachebibliothek OK)`
      );
    }
  }

  if (failed) {
    throw new Error(`${failed} Live-Verifikation(en) fehlgeschlagen nach ${ATTEMPTS} Versuchen.`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
