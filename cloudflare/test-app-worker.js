import { ILM_SCIENCE_SYSTEM_INSTRUCTIONS, ILM_SCIENCE_POLICY_VERSION } from "./ilm-science-policy.js";
import { composeIlmWithGemini } from "./ilm-gemini-bridge.js";
import { researchIlmWithGemini } from "./ilm-gemini-open-research.js";
import { gateHiddenSurfaces } from "./preview-gate.js";
const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v152-parents-profile-hero1255",
  label: "KIDS · V1.08.73"
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


const DAR_TEST_HOME_V1193_CSS = "/test/assets/dar-home-library-v1193.css?v=1196-tabrestore";
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
    const atmosphereLink = '<link rel="stylesheet" id="darHomeAtmosphereV1224" href="/test/assets/dar-home-atmosphere-v1202.css?v=1324-single-canvas">\n';
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
      '<link rel="preload" id="darHomeHeroMobilePreloadV1239" as="image" href="/test/assets/home-v1194/home-mobile-canvas-v1324.svg?v=1324-home" media="(max-width:759px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeHeroWidePreloadV1239" as="image" href="/test/assets/home-v1194/hero-wide-adobe.jpg?v=1239-home" media="(min-width:760px)" fetchpriority="high">\n' +
      '<link rel="preload" id="darHomeStudyPreloadV1239" as="image" href="/test/assets/home-v1194/study-runway.jpg?v=1239-home" media="(min-width:760px)" fetchpriority="high">\n';
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
  html = html.replace(/dar-home-library-v1194\.css\?v=[^"']+/g, "dar-home-library-v1194.css?v=1324-single-canvas");
  html = html.replace(/dar-home-library-v1194\.js\?v=[^"']+/g, "dar-home-library-v1194.js?v=1324-single-canvas");
  html = html.replace(/dar-library-redesign-v1168\.css\?v=[^"']+/g, "dar-library-redesign-v1168.css?v=1213-quran-native");
  html = html.replace(/dar-library-redesign-v1168\.js\?v=[^"']+/g, "dar-library-redesign-v1168.js?v=1213-quran-native");

  // v1227 library hero depth: force the current Test library presentation assets.
  html = html.replace(/library-app\.css(?:\?v=[^"']*)?/g, "library-app.css?v=1227-hero-depth");
  html = html.replace(/library-app\.js(?:\?v=[^"']*)?/g, "library-app.js?v=1227-library");
        // DAR_QURAN_PLAYER_V1252

// DAR_QURAN_READER_V1251

// DAR_QURAN_OVERVIEW_V1250

// DAR_ILM_START_PHASE1_CACHE
  html = html.replace(/ilm-research-chat\.css(?:\?v=[^"']*)?/g, "ilm-research-chat.css?v=ilm-dialog-v1342");
  html = html.replace(/ilm-research-chat\.js(?:\?v=[^"']*)?/g, "ilm-research-chat.js?v=ilm-dialog-v1355");

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
      '@import url("/test/assets/area-shell-v1294.css?v=area-shell-v1312");' +
      '@import url("/test/assets/area-utility-v1300.css?v=area-utility-v1300");' +
      '@import url("/test/assets/primary-area-embedded-v1313.css?v=primary-area-v1313");' +
      '@import url("/test/assets/tawhid-guide-v1295.css?v=tawhid-guide-v1295");' +
      '@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-final-v1303");' +
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
    const hadithFinal = '<style id="darHadithReframeFinalV1299">@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-reader-fix-v1303");</style>' +
      '<script id="darHadithReframeScriptV1299" src="/test/assets/hadith-library-reframe-v1299.js?v=1303"><\/script>';
    if (html.includes("</html>")) html = html.replace("</html>", hadithFinal + "</html>");
    else html += hadithFinal;
  }
  // DAR_ADAPTIVE_FOLD_V1326
  // Force every pre-existing adaptive/fold reference to the same v1326 bytes.
  // This prevents an older service-worker-cached controller from running first.
  html = html.replace(/adaptive-layout\.css(?:\?v=[^"']*)?/g, "adaptive-layout.css?v=1331-reader-safe");
  html = html.replace(/adaptive-layout\.js(?:\?v=[^"']*)?/g, "adaptive-layout.js?v=1331-reader-safe");
  html = html.replace(/fold-split\.css(?:\?v=[^"']*)?/g, "fold-split.css?v=1331-reader-safe");
  html = html.replace(/fold-split\.js(?:\?v=[^"']*)?/g, "fold-split.js?v=1331-reader-safe");
  // Final test authority: real capacity-based Fold/iPad shell. These imports are
  // layout-only and load after legacy route styles so fixed 1400px rules cannot win.
  if (!html.includes('id="darAdaptiveFoldAuthorityV1326"')) {
    const adaptiveFoldStyle =
      '<style id="darAdaptiveFoldAuthorityV1326">' +
      '@import url("/assets/adaptive-layout.css?v=1331-reader-safe");' +
      '@import url("/assets/fold-split.css?v=1331-reader-safe");' +
      '@import url("/test/assets/fold-thumb-nav.css?v=1331-reader-safe");' +
      '</style>';
    if (html.includes("</html>")) html = html.replace("</html>", adaptiveFoldStyle + "</html>");
    else html += adaptiveFoldStyle;
  }
  if (!html.includes('id="darAdaptiveFoldScriptsV1326"')) {
    const adaptiveFoldScripts =
      '<script id="darAdaptiveFoldScriptsV1326" src="/assets/adaptive-layout.js?v=1331-reader-safe"><\/script>' +
      '<script src="/assets/fold-split.js?v=1331-reader-safe"><\/script>';
    if (html.includes("</body>")) html = html.replace("</body>", adaptiveFoldScripts + "</body>");
    else if (html.includes("</html>")) html = html.replace("</html>", adaptiveFoldScripts + "</html>");
    else html += adaptiveFoldScripts;
  }

  // DAR_ADAPTIVE_NAV_V1325
  html = html.replace(/fold-thumb-nav\.css(?:\?v=[^"']*)?/g, "fold-thumb-nav.css?v=1331-reader-safe");
  html = html.replace(/fold-thumb-nav\.js(?:\?v=[^"']*)?/g, "fold-thumb-nav.js?v=1331-reader-safe");
  // Test-only foundation for user-selectable bottom/left/right navigation.
  // Loaded as a final authority so legacy bottom-nav CSS cannot override side placement.
  if (!html.includes("fold-thumb-nav.css?v=1331-reader-safe")) {
    const adaptiveNavStyle =
      '<style id="darAdaptiveNavStyleV1325">@import url("/test/assets/fold-thumb-nav.css?v=1331-reader-safe");</style>';
    if (html.includes("</html>")) html = html.replace("</html>", adaptiveNavStyle + "</html>");
    else html += adaptiveNavStyle;
  }
  if (!html.includes("fold-thumb-nav.js?v=1331-reader-safe")) {
    const adaptiveNavScript =
      '<script id="darAdaptiveNavScriptV1325" src="/test/assets/fold-thumb-nav.js?v=1331-reader-safe"><\/script>';
    if (html.includes("</body>")) html = html.replace("</body>", adaptiveNavScript + "</body>");
    else if (html.includes("</html>")) html = html.replace("</html>", adaptiveNavScript + "</html>");
    else html += adaptiveNavScript;
  }

  // Preserve the build ID generated by sync-app-build-ids.js.
  // An old hard-coded v1337 override caused potential false update checks.

  // Load history CSS using a normal stylesheet link ahead of the body, never
  // with a late @import appended at the end of the HTML document.
  if (!html.includes('id="darIlmHistoryArchiveV1340"')) {
    const archiveLink = '<link rel="stylesheet" id="darIlmHistoryArchiveV1340" href="/test/assets/ilm-history-archive-v1338.css?v=1340">\n';
    if (html.includes("</head>")) html = html.replace("</head>", archiveLink + "</head>");
    else if (html.includes("<body")) html = html.replace("<body", archiveLink + "<body");
    else html = archiveLink + html;
  }
  // Test-only welcome quick starts and four separate Wissenswege; keep global themes.
  if (!html.includes('id="darIlmWelcomeFinishV1341"')) {
    const welcomeLink = '<link rel="stylesheet" id="darIlmWelcomeFinishV1341" href="/test/assets/ilm-welcome-finish-v1341.css?v=1349">\n';
    if (html.includes("</head>")) html = html.replace("</head>", welcomeLink + "</head>");
    else if (html.includes("<body")) html = html.replace("<body", welcomeLink + "<body");
    else html = welcomeLink + html;
  }
  const headers = new Headers(asset.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.delete("Content-Length");
  return new Response(html, { status: asset.status, statusText: asset.statusText, headers });
}


// MAJLIS OPEN RESEARCH V1352 — Gemini Google Search is a discovery tool;
// only fetched allowlisted primary texts may reach the final composer.
async function ilmOpenResearch(request, env) {
  const headers = {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store, no-cache, max-age=0",
    "X-Content-Type-Options":"nosniff"
  };
  const send = (payload,code=200)=>new Response(JSON.stringify(payload),{status:code,headers});
  const origin = String(request.headers.get("Origin")||"");
  if (request.method !== "POST") return send({ok:false,error:"method_not_allowed"},405);
  if (origin && !["https://dar-al-tawhid.de","https://dar-al-tawhid-test.sero91ak.workers.dev"].includes(origin)) {
    return send({ok:false,error:"origin_not_allowed"},403);
  }
  if (Number(request.headers.get("Content-Length")||0)>5000) return send({ok:false,error:"payload_too_large"},413);
  const data = await request.json().catch(()=>null);
  const question = String(data?.question||"").trim().slice(0,550);
  const mode = data?.mode === "sources" ? "sources" : data?.mode === "short" ? "short" : "detailed";
  if (question.length<7) return send({ok:false,error:"insufficient_question"},422);
  // GEMINI ONLY: Free-Tier-compatible search via Gemini 2.5 Flash-Lite; no paid fallback.
  const gemini = await researchIlmWithGemini(request,env,question,mode);
  if(gemini.ok)return send(gemini);
  return send({
    ok:false,
    error:gemini.limited?"gemini_quota_exhausted":"gemini_research_unavailable",
    provider:"gemini",
    reason:String(gemini.reason||"unavailable").slice(0,65),
    internalSourcesAvailable:true,
    epistemicStatus:"research_not_completed"
  },gemini.limited?429:422);
}

// ILM_SCIENCE_COMPOSE_V1332 — test-only, sources-constrained German answer.
// Uses the already configured Workers AI binding; no API key in the browser.
async function ilmScienceCompose(request, env) {
  const origin = String(request.headers.get("Origin") || "");
  const allowed = ["https://dar-al-tawhid.de", "https://dar-al-tawhid-test.sero91ak.workers.dev"];
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, max-age=0",
    "X-Content-Type-Options": "nosniff"
  };
  const send = (data, status = 200) => new Response(JSON.stringify(data), {status, headers});
  if (request.method !== "POST") return send({ok:false,error:"method_not_allowed"},405);
  if (origin && !allowed.includes(origin)) return send({ok:false,error:"origin_not_allowed"},403);
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > 12000) return send({ok:false,error:"payload_too_large"},413);
  // Gemini is optional; if no Cloudflare AI binding is available, Gemini can still answer.

  // Best-effort edge POP quota; cap each completion as an additional cost bound.
  try {
    const ip = String(request.headers.get("CF-Connecting-IP") || "unknown").slice(0,70);
    const cache = caches.default;
    const key = new Request(new URL("/__ilm_test_rate/" + encodeURIComponent(ip), request.url).toString());
    const old = await cache.match(key);
    const hits = Number(old && await old.text() || 0) || 0;
    if (hits >= 12) return send({ok:false,error:"rate_limited"},429);
    await cache.put(key, new Response(String(hits+1), {headers:{"Cache-Control":"public, max-age=60"}}));
  } catch (_) {}

  const body = await request.json().catch(() => null);
  const question = String(body && body.question || "").trim().slice(0,550);
  const mode = body && body.mode === "short" ? "short" : "detailed";
  const evidence = Array.isArray(body && body.evidence) ? body.evidence.slice(0,3) : [];
  if (question.length < 7 || !evidence.length) return send({ok:false,error:"insufficient_input"},422);
  const sources = evidence.map((e, i) => ({
    number:i+1,
    author:String(e && e.speaker || "").slice(0,100),
    work:String(e && e.work || "").slice(0,140),
    reference:String(e && e.reference || "").slice(0,170),
    authenticity:String(e && e.authenticity || "").slice(0,70),
    verification_status:String(e && e.verification_status || "unverified").slice(0,30),
    excerpt:String(e && e.statement || "").replace(/<[^>]*>/g," ").trim().slice(0,900)
  })).filter(e => e.excerpt.length >= 18 && e.verification_status === "verified");
  if (!sources.length) return send({ok:false,error:"no_verified_source_text"},422);
  const sourceNormalize = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ");
  const questionNorm = sourceNormalize(question);
  const requireRuku = /\b(?:ruku|rukuh|verbeugung)\b/.test(questionNorm);
  const requireHands = requireRuku && /\b(?:hand|hande|handen|heben|hoch|unten|senken)\b/.test(questionNorm);
  const sourceSupportsRuku = source => {
    const text = sourceNormalize([source.work,source.reference,source.excerpt].join(" "));
    return (!requireRuku || /\b(?:ruku|rukuh|verbeugung)\b/.test(text)) &&
      (!requireHands || /\b(?:hand|hande|handen|heben|hebt|hob|hoben|gehoben|erhob|erhoben|erhebt|senkte|senken)\b/.test(text));
  };
  const topicSources = sources.filter(sourceSupportsRuku);
  if (!topicSources.length) return send({ok:false,error:"no_topic_relevant_verified_source"},422);
  // Gemini is the preferred evidence-bound model when a server-side key exists.
  // No personal Gemini/ChatGPT account is involved. Rate limit is enforced by
  // Cloudflare bindings before contacting Google; a limited request must not
  // silently bypass the cap through a different model.
  const gemini = await composeIlmWithGemini(request, env, question, topicSources, mode);
  if (gemini.limited) return send({ok:false,error:"gemini_quota_exhausted",provider:"gemini"},429);
  if (gemini.ok) return send({
    ok:true, answer:gemini.answer, usedSourceCount:topicSources.length,
    mode:"source_bound", answerMode:mode, provider:"gemini",
    policyVersion:ILM_SCIENCE_POLICY_VERSION
  });
  // No Gemini quota => use local checked texts in the UI; never pay another model.
  return send({
    ok:false, error:gemini.limited?"gemini_quota_exhausted":"gemini_compose_unavailable",
    provider:"gemini", usedSourceCount:topicSources.length, sourceBound:true
  },gemini.limited?429:503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/test/api/ilm/compose") return ilmScienceCompose(request, env);
    if (url.pathname === "/test/api/ilm/research") return ilmOpenResearch(request, env);
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
      target.searchParams.set("kv", "kids-shell-v152-parents-profile-hero1255");
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
