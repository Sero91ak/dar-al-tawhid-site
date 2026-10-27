#!/usr/bin/env node
/**
 * Verifiziert Dar Test nach Deploy:
 * 1) öffentliches https://dar-al-tawhid.de/test/
 * 2) workers.dev-Spiegel
 * Beide müssen denselben Build wie test/version.json ausliefern.
 * Kein stilles SKIP mehr — öffentliche URL ist Pflicht.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_TEST_BASE = "https://dar-al-tawhid.de/test";
const WORKERS_DEV_TEST_BASE = "https://dar-al-tawhid-test.sero91ak.workers.dev/test";
const ATTEMPTS = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 12);
const DELAY_MS = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 5000);

const TEST_EXPECT_BUILD =
  process.env.EXPECT_TEST_BUILD ||
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "test/version.json"), "utf8")).buildId;

// Live verification must use the exact canonical script version injected by the Worker.
const PARITY_SCRIPT_SRC = (fs.readFileSync(path.join(ROOT_DIR, "cloudflare/test-app-worker.js"), "utf8")
  .match(/\/test\/assets\/dar-home-html-parity-v1\.js\?v=[A-Za-z0-9._-]+/) || [])[0];
if (!PARITY_SCRIPT_SRC) throw new Error("Test Worker lacks Home parity script");
const PARITY_SCRIPT_REL = PARITY_SCRIPT_SRC.replace(/^\/test\//, "/");

function normalizeTestBase(raw, fallback) {
  let base = String(raw || fallback || PUBLIC_TEST_BASE).trim().replace(/\/$/, "");
  if (!base) base = fallback || PUBLIC_TEST_BASE;
  if (!/\/test$/i.test(base)) base = `${base.replace(/\/$/, "")}/test`;
  return base;
}

const publicBase = normalizeTestBase(
  process.env.SITE_URL || process.env.DAR_TEST_SITE_URL,
  PUBLIC_TEST_BASE
);
const workersBase = normalizeTestBase(
  process.env.DAR_TEST_WORKERS_URL,
  WORKERS_DEV_TEST_BASE
);

function currentCommitTouchesKids() {
  if (process.env.VERIFY_KIDS_TEST === "1") return true;
  if (process.env.VERIFY_KIDS_TEST === "0") return false;
  try {
    const changed = execFileSync(
      "git",
      ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
      { cwd: ROOT_DIR, encoding: "utf8" }
    ).split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
    if (changed.some((file) =>
      /^kids\//.test(file) ||
      /^test\/kids\//.test(file) ||
      file === "test/kids-quiz-preview-version.json" ||
      file === "scripts/verify-test-app-deploy.js" ||
      file === "scripts/purge-test-kids-cache.js"
    )) return true;

    if (changed.includes("cloudflare/test-app-worker.js")) {
      try {
        const workerDiff = execFileSync(
          "git",
          ["diff", "HEAD^", "HEAD", "--", "cloudflare/test-app-worker.js"],
          { cwd: ROOT_DIR, encoding: "utf8" }
        );
        // An isolated adult Test repair page is embedded as an HTML string.
        // Its safety code mentions /test/kids/ solely to protect KIDS caches;
        // that string must not misclassify an adult-only release as a KIDS change.
        // Keep detecting real edits to Worker KIDS routes and handlers.
        const actualWorkerDiff = workerDiff.replace(/^\+\s*const repairHtml = .*$/gm, "");
        return /(?:\/test\/kids|kidsPath|dar-al-tawhid-kids|kids\/)/i.test(actualWorkerDiff);
      } catch (error) {
        console.log("Kids worker diff detection failed; generic Test-Worker change does not force Kids verification:", error.message || error);
      }
    }
    return false;
  } catch (error) {
    console.log("Kids scope detection failed; unrelated Kids verification is skipped:", error.message || error);
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  const text = await res.text();
  return {
    status: res.status,
    text,
    cf: res.headers.get("cf-cache-status") || "n/a"
  };
}

async function waitForBuild(label, urls) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let matched = null;
    for (const url of urls) {
      try {
        const { status, text, cf } = await fetchText(url);
        const ok = status === 200 && text.includes(TEST_EXPECT_BUILD);
        console.log(
          `${label}: ${url} -> ${status} cf=${cf} expect=${TEST_EXPECT_BUILD} ok=${ok} (attempt ${attempt}/${ATTEMPTS})`
        );
        if (ok) {
          matched = url;
          break;
        }
      } catch (err) {
        console.log(`${label}: ${url} -> error ${err.message || err} (attempt ${attempt}/${ATTEMPTS})`);
      }
    }
    if (matched) return matched;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return null;
}

async function fetchVersionBuild(base) {
  const url = `${base}/version.json?v=${Date.now()}`;
  const { status, text, cf } = await fetchText(url);
  let buildId = "";
  try {
    buildId = JSON.parse(text).buildId || "";
  } catch (e) {
    buildId = "";
  }
  console.log(`version: ${url} -> ${status} cf=${cf} buildId=${buildId || "?"}`);
  return { url, status, buildId };
}

(async function main() {
  console.log(`Dar Test Verify: expect=${TEST_EXPECT_BUILD}`);
  console.log(`public=${publicBase}`);
  console.log(`workers.dev=${workersBase}`);

  const publicOk = await waitForBuild("public", [
    `${publicBase}/`,
    `${publicBase}/index.html`,
    `${publicBase}/version.json`
  ]);
  if (!publicOk) {
    throw new Error(
      `Öffentliche Test-URL liefert noch nicht ${TEST_EXPECT_BUILD}. Route/Cache prüfen: ${publicBase}/`
    );
  }

  const workersOk = await waitForBuild("workers.dev", [
    `${workersBase}/`,
    `${workersBase}/index.html`,
    `${workersBase}/version.json`
  ]);
  if (!workersOk) {
    throw new Error(`workers.dev Test-App liefert noch nicht ${TEST_EXPECT_BUILD}: ${workersBase}/`);
  }

  // DAR_TEST_PWA_BOOT_NO_REDIRECT_GUARD_20261016: Installed iOS/Android test PWA must boot without a 302.
  // The ordinary fetchText() intentionally follows redirects for other routes;
  // that would hide a broken /test/?env=staging&source=pwa&v=1371 start_url.
  async function waitForPwaBootWithoutRedirect(label, base) {
    const bootUrl = `${base}/?env=staging&source=pwa&v=1371`;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const res = await fetch(bootUrl, {
          redirect: "manual",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
        });
        const location = res.headers.get("location") || "";
        const html = res.status === 200 ? await res.text() : "";
        const ok = res.status === 200 && !location &&
          html.includes(TEST_EXPECT_BUILD) && /<html\b/i.test(html);
        console.log(`${label} PWA boot: status=${res.status} redirect=${location || "none"} build=${TEST_EXPECT_BUILD} ok=${ok} attempt=${attempt}/${ATTEMPTS}`);
        if (ok) return true;
      } catch (err) {
        console.log(`${label} PWA boot: ${err.message || err} (attempt ${attempt}/${ATTEMPTS})`);
      }
      if (attempt < ATTEMPTS) await sleep(DELAY_MS);
    }
    return false;
  }
  const publicPwaBootOk = await waitForPwaBootWithoutRedirect("public", publicBase);
  const workerPwaBootOk = await waitForPwaBootWithoutRedirect("workers.dev", workersBase);
  if (!publicPwaBootOk || !workerPwaBootOk) {
    throw new Error("Dar Test PWA startup rejected: HTML shell must respond HTTP 200 directly; redirect/invalid HTML detected");
  }

  // DAR_TEST_REPAIR_ENTRY_VERIFY_20261016: If an installed Test PWA is stuck,
  // Safari must be able to open this independent, non-destructive recovery page.
  // Verify the actual deployed response on BOTH Test origins, not only the repo file.
  // Do not change or inspect the visitor/KIDS application routes.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    const repairUrl = `${base}/repair.html?repair-check=${Date.now()}`;
    const res = await fetch(repairUrl, {
      redirect: "manual",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
    });
    const page = res.status === 200 ? await res.text() : "";
    const safeRepair =
      page.includes('id="repair"') &&
      page.includes("navigator.serviceWorker.getRegistrations()") &&
      page.includes('url.pathname.indexOf("/test/")===0') &&
      page.includes('location.replace("/test/index.html?env=staging');
    const ok = res.status === 200 && !res.headers.get("location") && safeRepair;
    console.log(`Test repair route ${label}: status=${res.status} safe=${safeRepair} ok=${ok}`);
    if (!ok) throw new Error(`Test repair page unavailable or unsafe: ${label} ${repairUrl}`);
  }

  // DAR_TEST_GLOBAL_EDGE_WIDTH_LIVE_VERIFY_V1372: validate both externally served Test origin assets.
  // HTTP success of a deployment alone does not prove the last CSS
  // authority is actually present in the app shell.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    const { status: shellStatus, text: shellHtml } =
      await fetchText(`${base}/index.html?edge-width-check=v1383-${Date.now()}`);
    const edgeLinkOk = shellHtml.includes('id="darTestEdgeWidthV1372"') &&
      shellHtml.includes('/test/assets/test-global-edge-width-v1372.css?v=edge-no-perimeter-v1393');
    const { status: edgeStatus, text: edgeCss } =
      await fetchText(`${base}/assets/test-global-edge-width-v1372.css?v=edge-no-perimeter-v1393`);
    const cssOk = edgeCss.includes("DAR TEST ADULT ONLY") &&
      edgeCss.includes("DAR_ADULT_RESPONSIVE_AXIS_V1383") &&
      edgeCss.includes("DAR_HADITH_CONTINUOUS_FULLBLEED_V1386") &&
      edgeCss.includes("DAR_ADULT_TOPICS_EMPTY_FOLD_V1384") &&
      edgeCss.includes("DAR_ADULT_EMPTY_FOLD_GLOBAL_V1387") &&
      edgeCss.includes("DAR_TEST_ANDROID_SCROLL_RESPONSIVE_V1388") &&
      edgeCss.includes("DAR_TEST_ANDROID_NATIVE_SCROLL_CHAIN_V1392") &&
      edgeCss.includes("DAR_TEST_EDGE_NO_PERIMETER_V1393") &&
      edgeCss.includes("--dt-top-oversize:0px!important") &&
      edgeCss.includes("--dar-axis-gutter") &&
      edgeCss.includes("background-size:cover") &&
      edgeCss.includes("--dar-responsive-safe-gutter") &&
      edgeCss.includes("--dar-test-edge-stage") &&
      edgeCss.includes(".is-more-route") &&
      edgeCss.includes(".is-quiz-route") &&
      edgeCss.includes(".is-settings-route") &&
      edgeCss.includes(".is-quran-overview") &&
      edgeCss.includes(".is-topics-route");
    const scrollLinkOk =
      shellHtml.includes('id="darTestAndroidScrollRecoveryV1390"') &&
      shellHtml.includes('/test/assets/android-scroll-recovery-v1390.js?v=android-touch-v1390');
    const {status: scrollStatus, text: scrollJs} =
      await fetchText(`${base}/assets/android-scroll-recovery-v1390.js?v=android-touch-v1390`);
    const scrollJsOk = scrollStatus === 200 &&
      scrollJs.includes("DAR_TEST_ANDROID_TOUCH_SCROLL_RECOVERY_V1390") &&
      scrollJs.includes("forceResetQrcOverlayLocks") &&
      scrollJs.includes("__darTestScrollDiagnostic");
    if (!scrollLinkOk || !scrollJsOk)
      throw new Error(`Dar Test Android scroll runtime missing: ${label} link=${scrollLinkOk} status=${scrollStatus} asset=${scrollJsOk}`);
    const ok = shellStatus === 200 && edgeLinkOk &&
      edgeStatus === 200 && cssOk;
    console.log(`edge-width ${label}: shell=${shellStatus} linked=${edgeLinkOk} CSS=${edgeStatus} rules=${cssOk} ok=${ok}`);
    if (!ok) throw new Error(`Dar Test full-width stylesheet not live: ${label}`);
  }

  // DAR_TEST_HOME_ELEGANT_CAPSULE_V52_LIVE_GATE:
  // No stale V51 stylesheet: verify that the REAL #darHomeHtmlParityV1
  // is loaded and supplies thin accent borders, theme-dependent glow, and
  // transparent rectangular wrappers on both separate Test origins.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    let ok = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const shell = await fetchText(base + "/index.html?dhp-capsules-v53=" + Date.now());
      const runtime = await fetchText(base + PARITY_SCRIPT_REL);
      const linked = shell.status === 200 &&
        shell.text.includes(PARITY_SCRIPT_SRC);
      const checks = [
        "DAR_TEST_HOME_ELEGANT_CAPSULE_V52",
        "DAR_TEST_LAST_ROW_FOOTER_FLOW_V53",
        "grid-auto-rows:minmax(108px,auto)!important",
        "#darHomeHtmlParityV1 .dhp-content",
        "max-width:1280px!important",
        "--dhp-capsule-rim:",
        "--dhp-capsule-active-rim:",
        "--dhp-capsule-glow:",
        "border:1px solid var(--dhp-capsule-rim)!important",
        "background:transparent!important;background-image:none!important",
        "box-shadow:0 0 0 1px",
        ":is(:active,:focus-visible,:focus-within)",
        "@media(hover:hover) and (pointer:fine)",
        '--dhp-capsule-accent:#c5a66c',
        '--dhp-capsule-accent:#bd9084',
        '--dhp-capsule-accent:#bea878',
        '--dhp-capsule-accent:#a27791',
        '--dhp-capsule-accent:#a18a4f',
        '--dhp-capsule-accent:#8e9d77',
        "DAR TEST HOME EDITORIAL HIERARCHY V59",
        ".dhp-home-source-v55::after",
        ".dhp-welcome::before",
        ".dhp-isnad-label::after",
        ".dhp-welcome-rule::before{content:none!important;display:none!important;}",
        ".dhp-quote-text{display:block!important",
        "font:650 clamp(20px,3.6vw,24px)",
        "font:400 clamp(13px,2.2vw,15px)",
        "font:550 clamp(14px,2.25vw,16px)",
        "max-width:72ch!important",
        "margin:clamp(13px,2.5vw,18px)",
        "text-wrap:balance!important",
        "@media(prefers-reduced-motion:reduce)"
      ];
      const valid = runtime.status === 200 && checks.every(s => runtime.text.includes(s));
      ok = linked && valid;
      console.log("home-elegant-capsules-v53 " + label +
        ": html=" + shell.status + " link=" + linked + " js=" + runtime.status +
        " rules=" + valid + " ok=" + ok + " attempt=" + attempt + "/5");
      if (ok) break;
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 2500));
    }
    if (!ok) throw new Error("Dar Test V53 capsule layout and theme-glow runtime not LIVE: " + label);
  }

  // DAR_TEST_HADITH_SHARH_INLINE_V1308: prove the actual served Test shell
  // contains the inline canonical reader, not only a version.json bump or
  // an unused dynamically injected script. Never check visitor or Kids routes.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    let verified = false;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const html = await fetchText(`${base}/index.html?hadith-sharh-inline-check=v1308-${Date.now()}`);
        const css = await fetchText(`${base}/assets/ilm-hadith-v1243.css?v=hadith-sharh-inline-v1308`);
        verified = html.status === 200 &&
          html.text.includes("DAR_HADITH_SHARH_INLINE_V1308") &&
          html.text.includes("/test/assets/ilm-hadith-v1243.css?v=hadith-sharh-inline-v1308") &&
          html.text.includes(TEST_EXPECT_BUILD) &&
          css.status === 200 &&
          css.text.includes("DAR_HADITH_SHARH_READER_DISTINCTION_20261017");
        console.log(`hadith-sharh-inline ${label}: html=${html.status} css=${css.status} canonical=${html.text.includes("DAR_HADITH_SHARH_INLINE_V1308")} v1358=${html.text.includes("app-shell-v1358")} result=${verified} attempt=${attempt}/${ATTEMPTS}`);
      } catch (error) {
        console.log(`hadith-sharh-inline ${label}: ${error.message || error} attempt=${attempt}/${ATTEMPTS}`);
      }
      if (verified) break;
      if (attempt < ATTEMPTS) await sleep(DELAY_MS);
    }
    if (!verified) throw new Error(`Ḥadīṯ-Šarḥ-Detailansicht V1308 nicht ausgeliefert: ${label} ${base}`);
  }

  async function waitForMatchingVersion(label, base) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const v = await fetchVersionBuild(base);
      const ok = v.status === 200 && v.buildId === TEST_EXPECT_BUILD;
      console.log(
        `${label} version check: buildId=${v.buildId || "?"} expect=${TEST_EXPECT_BUILD} ok=${ok} (attempt ${attempt}/${ATTEMPTS})`
      );
      if (ok) return v;
      if (attempt < ATTEMPTS) await sleep(DELAY_MS);
    }
    return null;
  }

  const publicVersion = await waitForMatchingVersion("public", publicBase);
  const workersVersion = await waitForMatchingVersion("workers.dev", workersBase);
  if (!publicVersion) {
    throw new Error(
      `public /test/version.json still ≠ expect ${TEST_EXPECT_BUILD}`
    );
  }
  if (!workersVersion) {
    throw new Error(
      `workers.dev /test/version.json still ≠ expect ${TEST_EXPECT_BUILD}`
    );
  }
  if (publicVersion.buildId !== workersVersion.buildId) {
    throw new Error(
      `Parität fehlgeschlagen: public=${publicVersion.buildId} workers.dev=${workersVersion.buildId}`
    );
  }

  console.log(
    `Dar Test live OK — public und workers.dev liefern identisch ${TEST_EXPECT_BUILD}.`
  );
  // DAR_PRAYER_MOTIFS_DELIVERY_V6_20261016: assert that the actual HTML includes the inline route-specific
  // theme authority, not a stale cached CSS link. Both routes must be covered.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    const { status, text: html } = await fetchText(`${base}/index.html?motif-check=v6`);
    const marker = 'id="darTestPrayerMotifAuthorityV6"';
    const settingsOk = html.includes(marker) && html.includes("body.is-settings-route .settings-one-page .notification-prayer-grid");
    const prayerOk = html.includes(marker) && html.includes("prayer-time-grid--top") && html.includes("dar-time-photo");
    const imageUrlOk = ["fajr","dhuhr","asr","maghrib","isha"].every(name=>html.includes("/test/assets/prayer-motifs/"+name+".webp?v=20261016-visual-v6"));
    const domRuntimeOk=html.includes('id="darPrayerMotifsDomV7"')
      && html.includes("live-photo-v6.js?v=20261016-visible-v7");
    const oldNavPanelGone=!html.includes('${renderAdaptiveNavPanel()}');
    console.log(`motif-html ${label}: status=${status} settings=${settingsOk} prayer=${prayerOk} images=${imageUrlOk} domRuntime=${domRuntimeOk} oldNavGone=${oldNavPanelGone}`);
    if(status!==200 || !settingsOk || !prayerOk || !imageUrlOk || !domRuntimeOk || !oldNavPanelGone) {
      throw new Error(`Test Gebetsmotive fehlen im HTML auf ${label}; Worker/Cache pruefen`);
    }
  }

  // Check the exact browser script and its card-image selectors are deployable.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    for (const [file, marker] of [
      ["live-photo-v6.js", "data-notification-prayer"],
      ["live-photo-v6.css", "dar-prayer-motif-image"]
    ]) {
      const url=base+"/assets/prayer-motifs/"+file+"?v=20261016-visible-v7";
      const result=await fetchText(url);
      const ok=result.status===200 && result.text.includes(marker);
      console.log("motif-runtime "+label+"/"+file+": status="+result.status+" valid="+ok);
      if(!ok)throw new Error("Test Motiv-Anzeige nicht ladbar: "+url);
    }
  }

  // ADULT_HERO_EDGE_V6_REAL_ORIGIN_GATE: both test routes must deliver the
  // very same first-touch edge-stop logic as the production visitor app.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    let ok=false;
    for (let attempt=1;attempt<=5;attempt++) {
      try {
        const shell=await fetchText(base+"/?scroll-v4-check="+Date.now());
        const js=await fetchText(base+"/assets/dar-adult-top-scroll-boundary-v1.js?v=20261020-no-overlay-v8");
        const css=await fetchText(base+"/assets/dar-adult-top-scroll-boundary-v1.css?v=20261020-no-overlay-v8");
        const htmlOk=shell.status===200
          &&shell.text.includes("darAdultTopBoundaryJsV1")
          &&shell.text.includes("20261020-no-overlay-v8");
        const jsOk=js.status===200&&js.text.includes("DAR_ADULT_TOP_SCROLL_BOUNDARY_V3")
          &&js.text.includes("window.innerHeight")&&js.text.includes('stepY>0?"up":"down"')&&js.text.includes("DAR_ADULT_SCROLL_EDGE_NO_OVERLAY_20261020")&&!js.text.includes("darHeroSafeTopFill");
        const cssOk=css.status===200&&css.text.includes("overscroll-behavior-y:none")&&css.text.includes("DAR_ADULT_SCROLL_EDGE_NO_OVERLAY_20261020")&&!css.text.includes("darHeroSafeTopFill")&&css.text.includes("overscroll-behavior-y:none");
        ok=htmlOk&&jsOk&&cssOk;
        console.log("adult no-cloned-hero v8 "+label+": html="+htmlOk+" js="+jsOk+" css="+cssOk+" attempt="+attempt+"/5");
        if(ok)break;
      }catch(error){console.log("adult no-cloned-hero v8 "+label+": "+(error.message||error))}
      if(attempt<5)await sleep(DELAY_MS);
    }
    if(!ok)throw new Error("Adult no-cloned-hero V8 not live at "+base);
  }

  // HTML_V3_PARITY_LIVE_GUARD: verify real HTML and JS, not just buildId.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    let ok=false;
    for(let attempt=1;attempt<=5;attempt++){
      try{
        const shell=await fetchText(base+"/?parity-v1368="+Date.now());
        const js=await fetchText(base+PARITY_SCRIPT_REL);
        const linked=shell.status===200&&shell.text.includes('id="darTestHomeHtmlParityV1"')&&shell.text.includes(PARITY_SCRIPT_SRC);
        const source=js.text||"";
        const sequence=source.indexOf('class="dhp-welcome"')>=0
          &&source.indexOf('class="dhp-isnad"')>source.indexOf('class="dhp-welcome"');
        const present=js.status===200
          &&source.includes("window.__darHomeHtmlParityV1=true")
          &&source.includes("dhp-welcome-rule")
          &&source.includes("dhp-search-pill")
          &&source.includes("dhp-results-head")
          &&source.includes("dhp-today-stack")
          // Require the actual home parity renderer to begin with prayer, NOT
          // the historic second logo + title. Builds alone cannot prove this.
          &&source.includes("DAR_TEST_HOME_PRAYER_FIRST_ACTUAL_V54")
          &&source.includes("DAR_TEST_HOME_WELCOME_DENSITY_V56")
          &&source.includes("dhp-home-source-v55")
          &&source.includes('class="dhp-quote-text"')
          &&source.includes("dhp-welcome-rule::before{content:none!important;display:none!important;}")
          &&source.includes("text-wrap:balance!important")
          &&source.includes("Beiträge nach Qurʾān, Sunnah und Āthār")
          &&source.includes("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh")
          &&source.includes("Willkommen bei <strong>DĀR AL TAWḤĪD</strong>")
          &&!source.includes('<div class="dhp-brand">')
          &&!source.includes("Wissen · Überlieferung · Erkenntnis")
          &&source.includes('class="dhp-prayer"')
          &&source.includes("wasiyyah.png")
          &&source.includes("quran-player")
          &&sequence;
        ok=linked&&present;
        if (!linked && attempt===1) {
          const refs=(shell.text.match(/<script[^>]+(?:darTestHomeHtmlParityV1|dar-home-html-parity-v1\\.js)[^>]*>/gi)||[]).slice(0,5);
          console.log("HTML parity delivered refs "+label+":",JSON.stringify(refs));
          console.log("HTML parity shell diagnostics "+label+":",JSON.stringify({
            bodyClose:shell.text.includes("</body>"),htmlClose:shell.text.includes("</html>"),
            marker:shell.text.includes("darTestHomeHtmlParityV1"),
            current:shell.text.includes(PARITY_SCRIPT_SRC),oldV53:shell.text.includes("v53-footer-flow"),
            oldV55:shell.text.includes("v55-source-salam"),
            length:shell.text.length
          }));
        }
        console.log("HTML parity "+label+": shell="+shell.status+" linked="+linked+" js="+js.status+" runtime="+present+" attempt="+attempt+"/5");
        if(ok)break;
      }catch(e){console.log("HTML parity "+label+": "+(e.message||e))}
      if(attempt<5)await sleep(DELAY_MS);
    }
    if(!ok)throw new Error("HTML V3 parity missing on "+label+": "+base);
  }

  // MOTIF_IMAGE_DELIVERY_V5: ensure real assets reach both public and workers.dev.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    for (const name of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
      const url = `${base}/assets/prayer-motifs/${name}.webp?v=20261016-motifs-v5`;
      let checked = false;
      for (let attempt = 1; attempt <= 4 && !checked; attempt++) {
        try {
          const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
          const bytes = new Uint8Array(await res.arrayBuffer());
          const webp = bytes.length > 500
            && String.fromCharCode(...bytes.slice(0,4)) === "RIFF"
            && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
          checked = res.status === 200 && webp;
          console.log(`prayer-photo ${label}/${name}: status=${res.status} bytes=${bytes.length} valid-webp=${webp} ok=${checked}`);
        } catch (error) { console.log(`prayer-photo ${label}/${name}: ${error.message || error}`); }
        if (!checked && attempt < 4) await sleep(DELAY_MS);
      }
      if (!checked) throw new Error(`Motiv ${name} auf ${label} nicht ausgeliefert: ${url}`);
    }
  }


  const kidsPath = path.join(ROOT_DIR, "kids/version.json");
  const verifyKids = currentCommitTouchesKids();
  if (fs.existsSync(kidsPath) && verifyKids) {
    const kidsExpect = JSON.parse(fs.readFileSync(kidsPath, "utf8")).buildId;
    // The Kids Test worker intentionally gates web-browser requests. A genuine
    // Kids iOS shell supplies this native user agent, so CI must test the same
    // authorized route rather than falsely classifying its 401 as stale assets.
    const nativeKidsTestHeaders={
      "User-Agent":"DarAlTawhidKids-iOS/CI-V4-Audio",
      "Cache-Control":"no-cache",Pragma:"no-cache"
    };
    async function fetchNativeKidsTestText(url){
      const response=await fetch(url,{cache:"no-store",headers:nativeKidsTestHeaders});
      return {status:response.status,text:await response.text(),
        cf:response.headers.get("cf-cache-status")||"n/a"};
    }
    async function waitKids(label, base, allowProtected = false) {
      for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        const url = `${base}/kids/version.json?v=${Date.now()}`;
        const { status, text, cf } = label.startsWith("workers.dev Kids preview")
          ? await fetchNativeKidsTestText(url) : await fetchText(url);
        let buildId = "";
        try {
          buildId = JSON.parse(text).buildId || "";
        } catch (e) {
          buildId = "";
        }
        const protectedRoute = allowProtected && (status === 401 || status === 403);
        const ok = status === 200 && buildId === kidsExpect;
        console.log(
          `${label} kids: ${url} -> ${status} cf=${cf} buildId=${buildId || "?"} expect=${kidsExpect} ok=${ok} protected=${protectedRoute} (attempt ${attempt}/${ATTEMPTS})`
        );
        if (protectedRoute) return "protected";
        if (ok) return true;
        if (attempt < ATTEMPTS) await sleep(DELAY_MS);
      }
      return false;
    }
    const kidsPub = await waitKids("public", publicBase, true);
    // The isolated Kids preview uses /kids on the same dedicated workers.dev
    // origin. /test/kids is an intentionally access-protected editor route:
    // probing it anonymously always returns 401 and falsely fails every deploy.
    const kidsTestOrigin = new URL(workersBase).origin;
    const kidsDev = await waitKids("workers.dev Kids preview", kidsTestOrigin, false);
    if (!kidsPub || !kidsDev) {
      throw new Error(
        `Kids Test Cache noch alt (expect ${kidsExpect}). public=${kidsPub} workers.dev=${kidsDev}`
      );
    }

    // Kids v146x removed the legacy Cinema/intro-v74 boot overlay. A video
    // marker probe for that retired intro was causing a false negative and
    // stopped before the essential V4 MP3 audit. Verify actual Quiz HTML instead.
    async function verifyKidsQuizShell(label,base){
      const src=base+"/kids/start?quiz-audit="+Date.now();
      const response=await fetch(src,{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
      const html=await response.text();
      const hasShell=html.includes('id="quizModal"')&&
        html.includes('id="openQuizButton"')&&
        html.includes("/kids/quiz-library.js")&&
        html.includes("/kids/quiz-v4-approved-player.js")&&
        html.includes("/kids/quiz-v4-test-preview.js");
      const noObsoleteOverlay=!html.includes('id="kidsCinemaV79"')&&
        !html.includes('id="kidsLaunchAudio"');
      const good=response.status===200&&hasShell&&noObsoleteOverlay;
      console.log(label+" Kids Quiz shell: HTTP="+response.status+
        " quiz="+hasShell+" obsoleteOverlayAbsent="+noObsoleteOverlay+" ok="+good);
      return good;
    }
    const quizShellPub = kidsPub === "protected"
      ?(console.log("public Kids Test is access protected; preview checked on workers.dev"),true)
      :await verifyKidsQuizShell("public",publicBase);
    const quizShellDev = await verifyKidsQuizShell("workers.dev",workersBase);
    if(!quizShellPub||!quizShellDev){
      throw new Error("Kids Quiz shell missing: public="+quizShellPub+" workers.dev="+quizShellDev);
    }

    // KIDS_V4_REAL_AUDIO_DELIVERY_AUDIT_20261027
    // A successful build, local SHA audit, or 450x4 JSON manifest alone does
    // NOT establish that any child can hear the deployed ElevenLabs V4 MP3.
    // Probe the isolated Test worker ONLY; never enable visitor playback,
    // modify review flags, regenerate paid audio or touch other app lanes.
    const audioOrigin = new URL(workersBase).origin;
    if (audioOrigin !== "https://dar-al-tawhid-test.sero91ak.workers.dev") {
      throw new Error("KIDS V4 audio audit refused unexpected Test origin: " + audioOrigin);
    }
    // Check the actual browser resources, not just a manifest in GitHub.
    const auditionShellResponse=await fetch(audioOrigin+"/kids/start?v4-audit="+Date.now(),{cache:"no-store"});
    const auditionShell=await auditionShellResponse.text();
    if(auditionShellResponse.status!==200||
       !auditionShell.includes("/kids/quiz-v4-test-preview.js")||
       !auditionShell.includes('id="quizModal"')){
      throw new Error("KIDS V4: Test Quiz shell not publicly delivered, HTTP "+auditionShellResponse.status);
    }
    const auditionScriptResponse=await fetch(audioOrigin+"/kids/quiz-v4-test-preview.js?v4-audit="+Date.now(),{cache:"no-store"});
    const auditionScript=await auditionScriptResponse.text();
    if(auditionScriptResponse.status!==200||
       !auditionScript.includes('isTestPreview:true')||
       !auditionScript.includes('quiz-v4-full-rebuild-review.json')){
      throw new Error("KIDS V4: Test preview player missing or gated, HTTP "+auditionScriptResponse.status);
    }
    console.log("KIDS V4 TEST PLAYER PASS — real browser shell and preview runtime HTTP 200");
    const auditionPath="/kids/data/quiz-v4-full-rebuild-review.json";
    const auditionResponse=await fetch(audioOrigin+auditionPath+"?delivery-audit="+Date.now(),{
      cache:"no-store",headers:nativeKidsTestHeaders
    });
    if(auditionResponse.status!==200){
      throw new Error("KIDS V4: Test manifest missing on real Worker, HTTP "+auditionResponse.status);
    }
    const audition=await auditionResponse.json();
    const expectedVoice="DkU7j9uO4ZEtLD2iRZSH";
    const keys=Object.keys(audition.questions||{});
    if(audition.modelId!=="eleven_v4"||audition.voiceId!==expectedVoice||
        audition.releaseEnabled!==false||audition.humanListeningApproved!==false||keys.length!==450){
      throw new Error("KIDS V4: deployed review-only manifest identity/voice/QA gate invalid");
    }
    const byBand={"4-6":[],"7-8":[],"9-10":[]};
    const parts=["question","correct","retry","explanation"];
    for(const id of keys){
      const q=audition.questions[id];
      if(!q||!Object.prototype.hasOwnProperty.call(byBand,q.ageBand)||
          !q.clips||Object.keys(q.clips).length!==4)throw new Error("KIDS V4: invalid question "+id);
      byBand[q.ageBand].push({id,q});
      for(const part of parts){
        const clip=q.clips[part];
        if(!clip||clip.modelId!=="eleven_v4"||clip.voiceId!==expectedVoice||
            clip.humanListeningApproved!==false||clip.approvedForPlayback!==false||
            !/^[a-f0-9]{64}$/.test(clip.sha256||"")||
            !new RegExp("^/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"+
              q.ageBand+"/[a-f0-9]{28}\\.mp3$").test(clip.url)){
          throw new Error("KIDS V4: bad deployed clip "+id+"/"+part);
        }
      }
    }
    if(!Object.values(byBand).every(items=>items.length===150)){
      throw new Error("KIDS V4: deployed 150/150/150 age distribution missing");
    }
    let checkedClips=0;
    // First and last questions in all ages, all four speech parts:
    // 24 actual HTTP MP3 responses, without downloading the full 1,217 files.
    for(const [band,items] of Object.entries(byBand)){
      for(const picked of [items[0],items[items.length-1]]){
        for(const part of parts){
          const clip=picked.q.clips[part];
          const response=await fetch(audioOrigin+clip.url,{
            cache:"no-store",
            headers:{Range:"bytes=0-2047","Cache-Control":"no-cache"}
          });
          const bytes=new Uint8Array(await response.arrayBuffer());
          const id3=bytes.length>=3&&bytes[0]===73&&bytes[1]===68&&bytes[2]===51;
          const mpeg=bytes.length>=2&&bytes[0]===255&&(bytes[1]&224)===224;
          const ok=(response.status===200||response.status===206)&&bytes.length>=1000&&(id3||mpeg);
          console.log("KIDS V4 remote MP3 "+band+"/"+picked.id+"/"+part+
            " HTTP="+response.status+" bytes="+bytes.length+" mp3="+(id3||mpeg)+" ok="+ok);
          if(!ok)throw new Error("KIDS V4 MP3 not delivered: "+clip.url);
          checkedClips++;
        }
      }
    }
    console.log("KIDS V4 REMOTE PASS — 450 question IDs, 1800 test-only segments, "+
      checkedClips+" sampled real MP3 HTTP files across all three ages; human listening remains PENDING.");

    console.log(`Kids Test live OK — ${kidsExpect} + 450 Quiz question/MP3 review delivery`);
  } else if (fs.existsSync(kidsPath)) {
    console.log("Kids Test verification skipped — aktueller Commit hat keinen Kids-Scope.");
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
