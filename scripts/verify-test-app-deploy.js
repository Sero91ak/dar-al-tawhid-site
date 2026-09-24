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

function readJsonLocal(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));
}

function validateKidsQuizCanonicalLocal() {
  const kids = readJsonLocal("test/kids/data/quiz-kids.json");
  const canonical = readJsonLocal("data/quiz-questions.json");
  const map = new Map(canonical.map((q) => [q.id, q]));
  const items = Array.isArray(kids.items) ? kids.items : [];
  if (items.length < 34) throw new Error("Kids Quiz: zu wenige geprüfte Fragen.");

  for (const item of items) {
    const source = map.get(item.canonicalQuizId);
    if (!source) throw new Error(`Kids Quiz: kanonische Frage fehlt: ${item.canonicalQuizId}`);
    if (source.status !== "published" || source.reviewStatus !== "approved") {
      throw new Error(`Kids Quiz: Quelle nicht mehr freigegeben: ${item.canonicalQuizId}`);
    }
    if (Array.isArray(source.validationErrors) && source.validationErrors.length) {
      throw new Error(`Kids Quiz: Validierungsfehler in ${item.canonicalQuizId}`);
    }
    if (String(source.source || "") !== String(item.source || "")) {
      throw new Error(`Kids Quiz: Quellenabweichung bei ${item.canonicalQuizId}`);
    }
    if (item.verification !== "approved") {
      throw new Error(`Kids Quiz: Kinderfassung nicht approved: ${item.id}`);
    }
  }
  console.log(`Kids canonical quiz guard OK — ${items.length} geprüfte Fragen.`);
}

function validateKidsAuthenticStoriesCanonicalLocal() {
  const stories = readJsonLocal("test/kids/data/stories-authentic.json");
  const items = Array.isArray(stories.items) ? stories.items : [];
  if (items.length < 4) throw new Error("Kids Stories: zu wenige geprüfte Qurʾān-Geschichten.");

  for (const story of items) {
    if (story.verification !== "approved") {
      throw new Error(`Kids Stories: Story nicht approved: ${story.id}`);
    }
    if (!story.prophetId || !Array.isArray(story.claimIds) || !story.claimIds.length) {
      throw new Error(`Kids Stories: Claim-Verknüpfung fehlt: ${story.id}`);
    }
    const profilePath = `data/prophets/${story.prophetId}.json`;
    const profile = readJsonLocal(profilePath);
    const profileStatus = profile.status || profile.profileStatus || "";
    if (profileStatus !== "approved") {
      throw new Error(`Kids Stories: Prophetenprofil nicht approved: ${story.prophetId}`);
    }
    const claims = new Map((profile.claims || []).map((claim) => [claim.id, claim]));
    for (const claimId of story.claimIds) {
      const claim = claims.get(claimId);
      if (!claim) throw new Error(`Kids Stories: Claim fehlt: ${story.prophetId}/${claimId}`);
      if (claim.verificationStatus !== "approved") {
        throw new Error(`Kids Stories: Claim nicht approved: ${story.prophetId}/${claimId}`);
      }
      if (claim.evidenceType !== "quran" || claim.grading !== "quran") {
        throw new Error(`Kids Stories: Claim ist nicht reine Qurʾān-Evidenz: ${story.prophetId}/${claimId}`);
      }
    }
  }
  console.log(`Kids canonical story guard OK — ${items.length} Qurʾān-Geschichten.`);
}

function validateKidsDuaCanonicalLocal() {
  const kids = readJsonLocal("test/kids/data/dua-kids.json");
  const canonical = readJsonLocal("content/duas/duas.json");
  const ids = new Set(canonical.map((d) => d.id));
  const items = Array.isArray(kids.items) ? kids.items : [];
  for (const item of items) {
    if (item.verification !== "verified") {
      throw new Error(`Kids Duʿāʾ: Eintrag nicht verified: ${item.id}`);
    }
    if (item.canonicalId && !ids.has(item.canonicalId)) {
      throw new Error(`Kids Duʿāʾ: kanonischer Eintrag fehlt: ${item.canonicalId}`);
    }
    if (!item.source) throw new Error(`Kids Duʿāʾ: Quelle fehlt: ${item.id}`);
  }
  console.log(`Kids canonical Duʿāʾ guard OK — ${items.length} geprüfte Einträge.`);
}

(async function main() {
  validateKidsQuizCanonicalLocal();
  validateKidsAuthenticStoriesCanonicalLocal();
  validateKidsDuaCanonicalLocal();
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

  async function verifyKidsPage(label, base) {
    const url = `${base}/kids/?v=${Date.now()}`;
    const { status, text, cf } = await fetchText(url);
    const ok =
      status === 200 &&
      text.includes("DĀR AL TAWḤĪD KIDS") &&
      text.includes("id=\"view-today\"") &&
      text.includes("id=\"openQuizButton\"") &&
      text.includes("id=\"quizModal\"") &&
      text.includes("id=\"dailyJourney\"") &&
      text.includes("id=\"storyQuestion\"") &&
      text.includes("id=\"parentStoriesDone\"") &&
      text.includes("id=\"openDuaButton\"") &&
      text.includes("id=\"duaModal\"") &&
      text.includes("id=\"authenticStoryList\"");
    console.log(
      `${label} kids: ${url} -> ${status} cf=${cf} marker=${ok}`
    );
    if (!ok) {
      throw new Error(
        `${label} Kinder-App nicht erreichbar oder falscher Inhalt: ${url}`
      );
    }
  }

  await verifyKidsPage("public", publicBase);
  await verifyKidsPage("workers.dev", workersBase);

  async function verifyKidsRecitationApi(label, base) {
    const url = `${base}/kids/api/recitation/health?v=${Date.now()}`;
    const { status, text, cf } = await fetchText(url);
    let payload = {};
    try { payload = JSON.parse(text); } catch {}
    const ok =
      status === 200 &&
      payload.ok === true &&
      payload.ai === true &&
      payload.service === "dar-al-tawhid-kids-recitation";
    console.log(
      `${label} kids speech: ${url} -> ${status} cf=${cf} ai=${payload.ai} ok=${ok}`
    );
    if (!ok) {
      throw new Error(
        `${label} Kinder-Sprach-API/AI-Binding nicht bereit: ${url}`
      );
    }
  }

  await verifyKidsRecitationApi("public", publicBase);
  await verifyKidsRecitationApi("workers.dev", workersBase);

  async function verifyKidsDuaData(label, base) {
    const url = `${base}/kids/data/dua-kids.json?v=${Date.now()}`;
    const { status, text, cf } = await fetchText(url);
    let payload = {};
    try { payload = JSON.parse(text); } catch {}
    const items = Array.isArray(payload.items) ? payload.items : [];
    const ok =
      status === 200 &&
      payload?.policy?.status === "verified-only" &&
      items.length >= 7 &&
      items.every((x) => x && x.verification === "verified");
    console.log(
      `${label} kids duas: ${url} -> ${status} cf=${cf} items=${items.length} ok=${ok}`
    );
    if (!ok) {
      throw new Error(
        `${label} Kinder-Duʿāʾ-Daten nicht vollständig/geprüft: ${url}`
      );
    }
  }

  await verifyKidsDuaData("public", publicBase);
  await verifyKidsDuaData("workers.dev", workersBase);

  async function verifyKidsQuizData(label, base) {
    const url = `${base}/kids/data/quiz-kids.json?v=${Date.now()}`;
    const { status, text, cf } = await fetchText(url);
    let payload = {};
    try { payload = JSON.parse(text); } catch {}
    const items = Array.isArray(payload.items) ? payload.items : [];
    const ok =
      status === 200 &&
      payload?.policy?.status === "approved-only" &&
      items.length >= 34 &&
      items.every((x) =>
        x &&
        x.verification === "approved" &&
        x.canonicalStatus === "published" &&
        x.canonicalReviewStatus === "approved" &&
        x.canonicalQuizId &&
        x.source
      );
    console.log(
      `${label} kids quiz: ${url} -> ${status} cf=${cf} items=${items.length} ok=${ok}`
    );
    if (!ok) {
      throw new Error(
        `${label} Kinder-Quiz-Daten nicht vollständig/geprüft: ${url}`
      );
    }
  }

  await verifyKidsQuizData("public", publicBase);
  await verifyKidsQuizData("workers.dev", workersBase);

  async function verifyKidsAuthenticStories(label, base) {
    const url = `${base}/kids/data/stories-authentic.json?v=${Date.now()}`;
    const { status, text, cf } = await fetchText(url);
    let payload = {};
    try { payload = JSON.parse(text); } catch {}
    const items = Array.isArray(payload.items) ? payload.items : [];
    const ok =
      status === 200 &&
      payload?.policy?.status === "approved-only" &&
      items.length >= 4 &&
      items.every((x) =>
        x &&
        x.verification === "approved" &&
        x.prophetId &&
        Array.isArray(x.claimIds) &&
        x.claimIds.length > 0 &&
        Array.isArray(x.sourceRefs) &&
        x.sourceRefs.length > 0
      );
    console.log(
      `${label} kids authentic stories: ${url} -> ${status} cf=${cf} items=${items.length} ok=${ok}`
    );
    if (!ok) {
      throw new Error(
        `${label} geprüfte Kinder-Qurʾān-Geschichten fehlen/ungültig: ${url}`
      );
    }
  }

  await verifyKidsAuthenticStories("public", publicBase);
  await verifyKidsAuthenticStories("workers.dev", workersBase);

  console.log(
    `Dar Test live OK — public und workers.dev liefern identisch ${TEST_EXPECT_BUILD}.`
  );
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
