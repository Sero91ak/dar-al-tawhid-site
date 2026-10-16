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
      file === "scripts/purge-test-kids-cache.js"
    )) return true;

    if (changed.includes("cloudflare/test-app-worker.js")) {
      try {
        const workerDiff = execFileSync(
          "git",
          ["diff", "HEAD^", "HEAD", "--", "cloudflare/test-app-worker.js"],
          { cwd: ROOT_DIR, encoding: "utf8" }
        );
        return /(?:\/test\/kids|kidsPath|dar-al-tawhid-kids|kids\/)/i.test(workerDiff);
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
  // The page must reference the fresh CSS, not a cached old layout layer.
  for (const [label, base] of [["public", publicBase], ["workers.dev", workersBase]]) {
    const { status, text: html } = await fetchText(`${base}/index.html?motif-check=v5`);
    const settingsOk = html.includes("dar-settings-permissions-v1.css?v=20261016-motifs-v5");
    const prayerOk = html.includes("prayer-v1254.css?v=20261016-motifs-v5");
    console.log(`motif-css ${label}: status=${status} settings=${settingsOk} prayer=${prayerOk}`);
    if (status !== 200 || !settingsOk || !prayerOk) {
      throw new Error(`Test CSS ist nicht frisch auf ${label}; Bilder könnten unsichtbar bleiben`);
    }
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
    async function waitKids(label, base, allowProtected = false) {
      for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        const url = `${base}/kids/version.json?v=${Date.now()}`;
        const { status, text, cf } = await fetchText(url);
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
    const kidsDev = await waitKids("workers.dev", workersBase, false);
    if (!kidsPub || !kidsDev) {
      throw new Error(
        `Kids Test Cache noch alt (expect ${kidsExpect}). public=${kidsPub} workers.dev=${kidsDev}`
      );
    }

    async function verifyKidsCinema(label, base) {
      const startUrl = `${base}/kids/start?verify=${Date.now()}`;
      const startRes = await fetch(startUrl, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
      });
      const html = await startRes.text();
      const forbiddenOverlay = [
        "k77-brand","k77-letter","k77-spark","k77-copy","k77-sound",
        "kidsLaunchAudio","kidsLaunchSound",
        "As-Salāmu ʿalaykum wa raḥmatullāhi wa barakātuh, Kids"
      ];
      const overlayFree = forbiddenOverlay.every((needle) => !html.includes(needle));
      const htmlOk =
        startRes.status === 200 &&
        html.includes("kids-launch-v79") &&
        html.includes('id="kidsCinemaV79"') &&
        html.includes("/kids/assets/kids-cinema/intro-v74.mp4?v=79") &&
        html.includes("if(!started)removeLaunch()") &&
        html.includes("},3200)") &&
        overlayFree;
      console.log(
        `${label} kids cinema HTML: ${startUrl} -> ${startRes.status} overlayFree=${overlayFree} ok=${htmlOk}`
      );
      if (!htmlOk) return false;

      const videoUrl = `${base}/kids/assets/kids-cinema/intro-v74.mp4?verify=${Date.now()}`;
      const videoRes = await fetch(videoUrl, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Range: "bytes=0-2047"
        }
      });
      const contentType = String(videoRes.headers.get("content-type") || "").toLowerCase();
      const buf = new Uint8Array(await videoRes.arrayBuffer());
      const hasFtyp =
        buf.length >= 12 &&
        String.fromCharCode(...buf.slice(4, 8)) === "ftyp";
      const videoOk =
        (videoRes.status === 200 || videoRes.status === 206) &&
        contentType.includes("video/mp4") &&
        hasFtyp;
      console.log(
        `${label} kids cinema MP4: ${videoUrl} -> ${videoRes.status} type=${contentType || "?"} bytes=${buf.length} ftyp=${hasFtyp} ok=${videoOk}`
      );
      return videoOk;
    }

    const cinemaPub = kidsPub === "protected"
      ? (console.log("public kids route is access-protected; cinema verification uses workers.dev mirror"), true)
      : await verifyKidsCinema("public", publicBase);
    const cinemaDev = await verifyKidsCinema("workers.dev", workersBase);
    if (!cinemaPub || !cinemaDev) {
      throw new Error(
        `Kids Cinema Intro fehlt/ist nicht abspielbar. public=${cinemaPub} workers.dev=${cinemaDev}`
      );
    }

    console.log(`Kids Test live OK — ${kidsExpect} + Cinema Intro MP4`);
  } else if (fs.existsSync(kidsPath)) {
    console.log("Kids Test verification skipped — aktueller Commit hat keinen Kids-Scope.");
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
