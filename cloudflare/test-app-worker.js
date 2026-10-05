import { gateHiddenSurfaces } from "./preview-gate.js";
const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v73-stories1143",
  label: "KIDS · V1.07.77"
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
    const atmosphereLink = '<link rel="stylesheet" id="darHomeAtmosphereV1224" href="/test/assets/dar-home-atmosphere-v1202.css?v=1239-home">\n';
    if (html.includes("</head>")) html = html.replace("</head>", atmosphereLink + "</head>");
    else html = html.replace("<body", atmosphereLink + "<body");
  }

  // v1239: mark the Test Home authority synchronously so the already-loaded CSS can paint immediately.
  if (!html.includes("darHomeEarlyClassV1239")) {
    const earlyHomeClass = '<script id="darHomeEarlyClassV1239">document.documentElement.classList.add("dar-home-v1194")<\/script>\n';
    if (html.includes("</head>")) html = html.replace("</head>", earlyHomeClass + "</head>");
    else html = html.replace("<body", earlyHomeClass + "<body");
  }

  // v1239: start loading both Home scenes before layout JS runs.
  // The URLs are exactly the same cache keys used by CSS/JS, so no duplicate image transfer occurs.
  if (!html.includes("darHomeHeroMobilePreloadV1239")) {
    const homePreloads =
      '<link rel="preload" id="darHomeHeroMobilePreloadV1239" as="image" href="/test/assets/home-v1194/hero-mobile-adobe.jpg?v=1239-home" media="(max-width:759px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeHeroWidePreloadV1239" as="image" href="/test/assets/home-v1194/hero-wide-adobe.jpg?v=1239-home" media="(min-width:760px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeStudyPreloadV1239" as="image" href="/test/assets/home-v1194/study-runway.jpg?v=1239-home" fetchpriority="high">\n';
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
  html = html.replace(/dar-home-library-v1194\.css\?v=[^"']+/g, "dar-home-library-v1194.css?v=1239-home");
  html = html.replace(/dar-home-library-v1194\.js\?v=[^"']+/g, "dar-home-library-v1194.js?v=1239-home");
  html = html.replace(/dar-library-redesign-v1168\.css\?v=[^"']+/g, "dar-library-redesign-v1168.css?v=1213-quran-native");
  html = html.replace(/dar-library-redesign-v1168\.js\?v=[^"']+/g, "dar-library-redesign-v1168.js?v=1213-quran-native");

  // v1227 library hero depth: force the current Test library presentation assets.
  html = html.replace(/library-app\.css(?:\?v=[^"']*)?/g, "library-app.css?v=1227-hero-depth");
  html = html.replace(/library-app\.js(?:\?v=[^"']*)?/g, "library-app.js?v=1227-library");
        // DAR_QURAN_PLAYER_V1252

// DAR_QURAN_READER_V1251

// DAR_QURAN_OVERVIEW_V1250

// DAR_ILM_START_PHASE1_CACHE
  html = html.replace(/ilm-research-chat\.css(?:\?v=[^"']*)?/g, "ilm-research-chat.css?v=ilm-cgi-v1252");
  html = html.replace(/ilm-research-chat\.js(?:\?v=[^"']*)?/g, "ilm-research-chat.js?v=ilm-compact-v1239");

    // DAR_ILM_SCHOLARS_V1240

    // DAR_ILM_TOPICS_V1242


  // DAR_ILM_HADITH_V1243
  // This authority must be LAST because legacy Hadith style tags exist near the end of test/index.html.
  if (!html.includes('id="darHadithAuthorityV1287"')) {
    const hadithAuthority = '<style id="darHadithAuthorityV1287">@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-authority-v1288");</style>';
    if (html.includes("</html>")) html = html.replace("</html>", hadithAuthority + "</html>");
    else html += hadithAuthority;
  }

  // DAR_ILM_DUA_V1244

// DAR_MORE_V1241

  // DAR_ILM_SCHOLAR_PROFILE_V1253

  // DAR_ILM_TOPIC_DETAIL_V1254

  // DAR_ILM_POST_READER_V1255

  // DAR_ILM_SCHOLAR_DETAIL_V1251

  // DAR_ILM_BOOK_DETAIL_V1252

  // DAR_MORE_V1253

  // DAR_PRAYER_V1254

// Preserve the original DĀR tab implementation; only cache-bust the no-op shim.
  html = html.replace(/dar-tab-restore-v1197\.css\?v=[^"']+/g, "dar-tab-restore-v1197.css?v=1200-original");

  // Build IDs are produced by scripts/sync-app-build-ids.js during the deploy build.
  // Do not overwrite them in the Worker; doing so creates a permanent
  // test/version.json ↔ HTML mismatch and an endless stale-update state.

  // Remove superseded visual layers that can still be present in older cached HTML.
  html = html.replace(/<link[^>]+dar-home-knowledge-library-v1183\.css[^>]*>\s*/g, "");
  html = html.replace(/<script[^>]+dar-home-knowledge-library-v1183\.js[^>]*><\/script>\s*/g, "");
  html = html.replace(/<link[^>]+dar-home-visual-authority-v1191\.css[^>]*>\s*/g, "");
  html = html.replace(/<link[^>]+dar-home-visual-v1190\.css[^>]*>\s*/g, "");
  html = html.replace(/<script[^>]+dar-home-visual-v1190\.js[^>]*><\/script>\s*/g, "");

  // DAR_TEST_AREA_AUTHORITIES_V1300
  // test/index.html currently has no closing </head>; load all redesign layers as a final authority
  // so the intended Test-App designs are visible and legacy inline styles cannot win afterwards.
  if (!html.includes('id="darTestAreaAuthoritiesV1300"')) {
    const areaAuthority = '<style id="darTestAreaAuthoritiesV1300">' +
      '@import url("/test/assets/quran-player-v1252.css?v=area-authority-v1300");' +
      '@import url("/test/assets/quran-learn-v1256.css?v=area-authority-v1300");' +
      '@import url("/test/assets/quran-reader-v1251.css?v=area-authority-v1300");' +
      '@import url("/test/assets/quran-overview-v1250.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-scholars-v1240.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-topics-v1242.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-dua-v1244.css?v=area-authority-v1300");' +
      '@import url("/test/assets/quiz-overview-v1257.css?v=area-authority-v1300");' +
      '@import url("/test/assets/more-v1241.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-scholar-profile-v1253.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-topic-detail-v1254.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-post-reader-v1255.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-scholar-detail-v1251.css?v=area-authority-v1300");' +
      '@import url("/test/assets/ilm-book-detail-v1252.css?v=area-authority-v1300");' +
      '@import url("/test/assets/more-v1253.css?v=area-authority-v1300");' +
      '@import url("/test/assets/jummah-v1258.css?v=area-authority-v1300");' +
      '@import url("/test/assets/qibla-v1259.css?v=area-authority-v1300");' +
      '@import url("/test/assets/prayer-v1254.css?v=area-authority-v1300");' +
      '@import url("/test/assets/frauen/frauen-authority-v1292.css?v=frauen-authority-v1292");' +
      '@import url("/test/assets/library/library-app.css?v=library-base-v1293");' +
      '@import url("/test/assets/library/library-authority-v1293.css?v=library-authority-v1293");' +
      '@import url("/test/assets/area-shell-v1294.css?v=area-shell-v1294");' +
      '@import url("/test/assets/area-utility-v1300.css?v=area-utility-v1300");' +
      '@import url("/test/assets/tawhid-guide-v1295.css?v=tawhid-guide-v1295");' +
      '@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-final-v1302");' +
      '</style>';
    if (html.includes("</html>")) html = html.replace("</html>", areaAuthority + "</html>");
    else html += areaAuthority;
  }

  // DAR_HADITH_STRUCTURE_V1297
  if (!html.includes('id="darHadithStructureV1297"')) {
    const hadithStructure = '<script id="darHadithStructureV1297" src="/test/assets/hadith-structure-v1297.js?v=1297"></script>';
    if (html.includes("</body>")) html = html.replace("</body>", hadithStructure + "</body>");
    else if (html.includes("</html>")) html = html.replace("</html>", hadithStructure + "</html>");
    else html += hadithStructure;
  }

  // DAR_HADITH_REFRAME_FINAL_V1299
  if (!html.includes('id="darHadithReframeFinalV1299"')) {
    const hadithFinal = '<style id="darHadithReframeFinalV1299">@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-reader-fix-v1302");</style>' +
      '<script id="darHadithReframeScriptV1299" src="/test/assets/hadith-library-reframe-v1299.js?v=1299"><\/script>';
    if (html.includes("</html>")) html = html.replace("</html>", hadithFinal + "</html>");
    else html += hadithFinal;
  }
  html = html.replace(/window\.__DAR_EXPECTED_BUILD="app-shell-v\d+"/g, 'window.__DAR_EXPECTED_BUILD="app-shell-v1300"');
  html = html.replace(/const APP_BUILD_ID="app-shell-v\d+"/g, 'const APP_BUILD_ID="app-shell-v1300"');

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
      target.searchParams.set("kv", "kids-shell-v72-stories1142");
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
      || /^\/test\/(?:widgets|wasiyyah)(?:\/|$)/.test(path)
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
