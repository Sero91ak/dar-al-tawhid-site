import { gateHiddenSurfaces } from "./preview-gate.js";
const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v38-quiz650-never-empty1105",
  label: "KIDS · V1.07.44"
});

function kidsVersionResponse() {
  return new Response(KIDS_VERSION_BODY, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}

function kidsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function normalizeArabicForMatch(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-غف-ي]/g, "");
}

function levenshtein(a, b) {
  const left = Array.from(String(a || ""));
  const right = Array.from(String(b || ""));
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let prev = right.map((_, i) => i + 1);
  for (let i = 0; i < left.length; i += 1) {
    const next = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      next[j + 1] = Math.min(
        next[j] + 1,
        prev[j + 1] + 1,
        prev[j] + (left[i] === right[j] ? 0 : 1)
      );
    }
    prev = next;
  }
  return prev[right.length];
}

function arabicWordScore(expected, heard) {
  const e = normalizeArabicForMatch(expected);
  const full = normalizeArabicForMatch(heard);
  if (!e || !full) return 0;
  const candidates = [full];
  const tokens = String(heard || "").split(/\s+/).map(normalizeArabicForMatch).filter(Boolean);
  tokens.forEach((token) => candidates.push(token));
  let best = 0;
  for (const candidate of candidates) {
    const maxLen = Math.max(e.length, candidate.length, 1);
    const score = Math.max(0, 1 - levenshtein(e, candidate) / maxLen);
    if (score > best) best = score;
  }
  return Math.max(0, Math.min(1, best));
}

function bytesToBase64(bytes) {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(bytes.length, i + chunk)));
  }
  return btoa(out);
}

function kidsRecitationThresholds(age) {
  if (age === "4–5") return { green: 0.72, orange: 0.42 };
  if (age === "9–10") return { green: 0.88, orange: 0.60 };
  return { green: 0.81, orange: 0.52 };
}

async function gradeKidsRecitation(request, env) {
  if (!env.AI || typeof env.AI.run !== "function") {
    return kidsJson({ ok: false, error: "recitation_ai_unavailable" }, 503);
  }

  const origin = String(request.headers.get("Origin") || "");
  if (origin && origin !== "https://dar-al-tawhid.de" && origin !== "https://dar-al-tawhid-test.sero91ak.workers.dev") {
    return kidsJson({ ok: false, error: "origin_not_allowed" }, 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return kidsJson({ ok: false, error: "invalid_form_data" }, 400);
  }

  const audio = form.get("audio");
  const expected = String(form.get("expected") || "").trim();
  const age = String(form.get("age") || "6–8").trim();

  if (!audio || typeof audio.arrayBuffer !== "function") {
    return kidsJson({ ok: false, error: "audio_missing" }, 400);
  }
  if (!expected || expected.length > 80 || !/[ء-ي]/.test(expected)) {
    return kidsJson({ ok: false, error: "expected_arabic_word_invalid" }, 400);
  }
  if (Number(audio.size || 0) < 500 || Number(audio.size || 0) > 900000) {
    return kidsJson({ ok: false, error: "audio_size_invalid" }, 413);
  }

  const bytes = new Uint8Array(await audio.arrayBuffer());
  if (!bytes.length) return kidsJson({ ok: false, error: "audio_empty" }, 400);

  let result;
  try {
    result = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio: bytesToBase64(bytes),
      task: "transcribe",
      language: "ar",
      vad_filter: true,
      condition_on_previous_text: false,
      no_speech_threshold: 0.45
    });
  } catch (error) {
    return kidsJson({
      ok: false,
      error: "recitation_transcription_failed",
      detail: String(error && error.message || error || "").slice(0, 180)
    }, 502);
  }

  const heard = String(result && result.text || "").trim();
  const score = arabicWordScore(expected, heard);
  const thresholds = kidsRecitationThresholds(age);
  const grade = score >= thresholds.green ? "green" : (score >= thresholds.orange ? "orange" : "red");

  return kidsJson({
    ok: true,
    grade,
    score: Number(score.toFixed(4)),
    heard,
    transcript: heard,
    expected,
    method: "workers-ai-asr-word-match",
    pronunciationReference: false
  });
}


const DAR_TEST_HOME_V1193_CSS = "/test/assets/dar-home-library-v1193.css?v=1195-tabrestore";
const DAR_TEST_HOME_V1193_JS = "/test/assets/dar-home-library-v1193.js?v=1193";

async function finalizeDarTestHomeV1193(asset) {
  const type = String(asset && asset.headers && asset.headers.get("content-type") || "");
  if (!asset || !asset.ok || !type.includes("text/html")) return asset;
  let html = await asset.text();

  // Test v1200: exactly one Home authority. Remove the obsolete v1193 runtime
  // injection so it cannot race the v1194 home observer and recreate duplicate blocks.
  html = html.replace(/<link[^>]+dar-home-library-v1193\.css[^>]*>\s*/g, "");
  html = html.replace(/<script[^>]+dar-home-library-v1193\.js[^>]*><\/script>\s*/g, "");

  // FORCE_TEST_DEPLOY_V1224
  // v1202: existing Adobe/Runway imagery becomes one continuous Home background.
  // CSS only; no navigation, route or bottom-tab behavior changes.
  if (!html.includes("dar-home-atmosphere-v1202.css")) {
    const atmosphereLink = '<link rel="stylesheet" id="darHomeAtmosphereV1224" href="/test/assets/dar-home-atmosphere-v1202.css?v=1238-home">\n';
    if (html.includes("</head>")) html = html.replace("</head>", atmosphereLink + "</head>");
    else html = html.replace("<body", atmosphereLink + "<body");
  }

  // v1238: start loading both Home scenes before layout JS runs.
  // The URLs are exactly the same cache keys used by CSS/JS, so no duplicate image transfer occurs.
  if (!html.includes("darHomeHeroMobilePreloadV1238")) {
    const homePreloads =
      '<link rel="preload" id="darHomeHeroMobilePreloadV1238" as="image" href="/test/assets/home-v1194/hero-mobile-adobe.jpg?v=1238-home" media="(max-width:759px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeHeroWidePreloadV1238" as="image" href="/test/assets/home-v1194/hero-wide-adobe.jpg?v=1238-home" media="(min-width:760px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeStudyPreloadV1238" as="image" href="/test/assets/home-v1194/study-runway.jpg?v=1238-home" fetchpriority="high">\n';
    if (html.includes("</head>")) html = html.replace("</head>", homePreloads + "</head>");
    else html = html.replace("<body", homePreloads + "<body");
  }

  // v1211: load the global light/dark contrast authority LAST on every Test-App HTML route.
  // Reuses the Test-only Salbei stylesheet; its final section is theme-agnostic and fixes all appearances.
  if (!html.includes("darThemeContrastAuthorityV1212")) {
    const contrastLink = '<link rel="stylesheet" id="darThemeContrastAuthorityV1212" href="/test/assets/theme-salbei-elfenbein.css?v=1212-contrast-authority">\n';
    if (html.includes("</head>")) html = html.replace("</head>", contrastLink + "</head>");
    else html = html.replace("<body", contrastLink + "<body");
  }

  // Keep only the existing v1194 home authority and refresh its assets.
  html = html.replace(/dar-home-library-v1194\.css\?v=[^"']+/g, "dar-home-library-v1194.css?v=1238-home");
  html = html.replace(/dar-home-library-v1194\.js\?v=[^"']+/g, "dar-home-library-v1194.js?v=1238-home");
  html = html.replace(/dar-library-redesign-v1168\.css\?v=[^"']+/g, "dar-library-redesign-v1168.css?v=1213-quran-native");
  html = html.replace(/dar-library-redesign-v1168\.js\?v=[^"']+/g, "dar-library-redesign-v1168.js?v=1213-quran-native");

  // v1227 library hero depth: force the current Test library presentation assets.
  html = html.replace(/library-app\.css(?:\?v=[^"']*)?/g, "library-app.css?v=1227-hero-depth");
  html = html.replace(/library-app\.js(?:\?v=[^"']*)?/g, "library-app.js?v=1227-library");
  // DAR_ILM_START_PHASE1_CACHE
  html = html.replace(/ilm-research-chat\.css(?:\?v=[^"']*)?/g, "ilm-research-chat.css?v=ilm-compact-v1233d");
  html = html.replace(/ilm-research-chat\.js(?:\?v=[^"']*)?/g, "ilm-research-chat.js?v=ilm-compact-v1233d");

  // Preserve the original DĀR tab implementation; only cache-bust the no-op shim.
  html = html.replace(/dar-tab-restore-v1197\.css\?v=[^"']+/g, "dar-tab-restore-v1197.css?v=1200-original");

  // Build markers only; no route/page geometry is changed here.
  html = html.replace(/const APP_BUILD_ID="app-shell-v1238"]+"/, 'const APP_BUILD_ID="app-shell-v1238"');
  html = html.replace(/window\.__DAR_EXPECTED_BUILD="app-shell-v[^"]+"/, 'window.__DAR_EXPECTED_BUILD="app-shell-v1238"');

  // Remove superseded visual layers that can still be present in older cached HTML.
  html = html.replace(/<link[^>]+dar-home-knowledge-library-v1183\.css[^>]*>\s*/g, "");
  html = html.replace(/<script[^>]+dar-home-knowledge-library-v1183\.js[^>]*><\/script>\s*/g, "");
  html = html.replace(/<link[^>]+dar-home-visual-authority-v1191\.css[^>]*>\s*/g, "");
  html = html.replace(/<link[^>]+dar-home-visual-v1190\.css[^>]*>\s*/g, "");
  html = html.replace(/<script[^>]+dar-home-visual-v1190\.js[^>]*><\/script>\s*/g, "");

  const headers = new Headers(asset.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.delete("Content-Length");
  return new Response(html, { status: asset.status, statusText: asset.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const gated = gateHiddenSurfaces(request, url, env, "live");
    if (gated) return gated;

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return Response.redirect(`${url.origin}/test/${url.search || ""}`, 302);
    }

    if (url.pathname === "/test" || url.pathname === "/test/") {
      if (url.searchParams.get("dqp") !== "915") {
        url.searchParams.set("dqp", "915");
        return Response.redirect(url.toString(), 302);
      }
    }

    if (url.pathname === "/version.json") {
      const testVersionUrl = new URL("/test/version.json", url.origin);
      return env.ASSETS.fetch(new Request(testVersionUrl.toString(), request));
    }

    // Kids-Haupteinstieg immer auf die kanonische /start-Oberfläche führen.
    // Dadurch nutzt /test/kids/ exakt dieselbe App-Shell wie der funktionierende
    // /test/kids/start-Aufruf und alte darsw-Cache-Buster können keine ältere
    // Root-Darstellung mit abgesetzter unterer Safe-Area mehr festhalten.
    if (url.pathname === "/kids/api/recitation/grade" || url.pathname === "/test/kids/api/recitation/grade") {
      if (request.method !== "POST") return kidsJson({ ok: false, error: "method_not_allowed" }, 405);
      return gradeKidsRecitation(request, env);
    }

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/test/kids" || url.pathname === "/test/kids/" || url.pathname.startsWith("/test/kids/"))
    ) {
      const target = new URL("https://dar-al-tawhid.de" + url.pathname.replace(/^\/test\/kids/, "/kids") + url.search);
      if (target.pathname === "/kids" || target.pathname === "/kids/") {
        target.pathname = "/kids/start";
      }
      target.searchParams.delete("darsw");
      target.searchParams.set("kv", "kids-shell-v38-quiz650-never-empty1105");
      return Response.redirect(target.toString(), 301);
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const kidsPath = path === "/test/kids" || path.startsWith("/test/kids/");
    if (kidsPath) return asset;
    if (request.method === "GET" && (path === "/test" || path === "/test/" || path === "/test/index.html")) {
      return finalizeDarTestHomeV1193(asset);
    }
    const bust = /\/test\/(index\.html)?$/.test(path)
      || /dar-quran-player\.(js|css)$/.test(path)
      || path.endsWith("/test/version.json")
      || path.endsWith("/test/service-worker.js");
    if (!bust || !asset) return asset;
    const out = new Response(asset.body, asset);
    out.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    out.headers.set("Pragma", "no-cache");
    return out;
  }
};
