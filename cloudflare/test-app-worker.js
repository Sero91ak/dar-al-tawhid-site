import { ILM_SCIENCE_SYSTEM_INSTRUCTIONS, ILM_SCIENCE_POLICY_VERSION } from "./ilm-science-policy.js";
import { composeIlmWithGemini } from "./ilm-gemini-bridge.js";
import { researchIlmWithGemini } from "./ilm-gemini-open-research.js";
import { composeIlmWithGroqFree } from "./ilm-groq-free-bridge.js";
import { gateHiddenSurfaces, academyOwnerAccess, academyOwnerAssetPath, layoutEditorAccess } from "./preview-gate.js";
import { EDITOR_STUDIO_HTML } from "./layout-editor-bundle-v3.js";
const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v1421-learn-center-dua-fourth-salaf-in-hoeren",
  label: "KIDS · V1.09.22"
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
  if (!asset || !asset.ok) return asset; // /test is HTML; proxy content-type may be stale
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

  // v20261019: no background-photo preloads in the Test Home.
  // Remove any legacy links already embedded in the static Test shell.
  html = html.replace(/<link\b[^>]*\bid=["']darHome(?:HeroMobile|HeroWide|Study)PreloadV1239["'][^>]*>\s*/gi, "");

  // v1211: load the global light/dark contrast authority LAST on every Test-App HTML route.
  // Reuses the Test-only Salbei stylesheet; its final section is theme-agnostic and fixes all appearances.
  if (!html.includes("darThemeContrastAuthorityV1212")) {
    const contrastLink = '<link rel="stylesheet" id="darThemeContrastAuthorityV1212" href="/test/assets/theme-salbei-elfenbein.css?v=1212-contrast-authority">\n';
    if (html.includes("</head>")) html = html.replace("</head>", contrastLink + "</head>");
    else html = html.replace("<body", contrastLink + "<body");
  }

  // Keep only the existing v1194 home authority and refresh its assets.
  html = html.replace(/dar-home-library-v1194\.css\?v=[^"'`\s]+/g, "dar-home-library-v1194.css?v=20261019-plain-home");
  html = html.replace(/dar-home-library-v1194\.js\?v=[^"'`\s]+/g, "dar-home-library-v1194.js?v=20261020-smart-v4");
  html = html.replace(/dar-library-redesign-v1168\.css\?v=[^"'`\s]+/g, "dar-library-redesign-v1168.css?v=1213-quran-native");
  html = html.replace(/dar-library-redesign-v1168\.js\?v=[^"'`\s]+/g, "dar-library-redesign-v1168.js?v=1213-quran-native");

  // v1227 library hero depth: force the current Test library presentation assets.
  html = html.replace(/library-app\.css(?:\?v=[^"'`\s]*)?/g, "library-app.css?v=1227-hero-depth");
  html = html.replace(/library-app\.js(?:\?v=[^"'`\s]*)?/g, "library-app.js?v=1227-library");
        // DAR_QURAN_PLAYER_V1252

// DAR_QURAN_READER_V1251

// DAR_QURAN_OVERVIEW_V1250

// DAR_ILM_START_PHASE1_CACHE
  html = html.replace(/ilm-research-chat\.css(?:\?v=[^"'`\s]*)?/g, "ilm-research-chat.css?v=ilm-dialog-v1342");
  html = html.replace(/ilm-research-chat\.js(?:\?v=[^"'`\s]*)?/g, "ilm-research-chat.js?v=ilm-dialog-v1356");

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

  // DAR_TEST_PRAYER_ASSETS_VISIBLE_V5_20261016: only the settings CSS's old cache key changes.
  // The separate area authority contains the sole prayer CSS reference.
  html = html.replace("20261016-1", "20261016-motifs-v5");
    // DAR_PRAYER_V1254

// Preserve the original DĀR tab implementation; only cache-bust the no-op shim.
  html = html.replace(/dar-tab-restore-v1197\.css\?v=[^"'`\s]+/g, "dar-tab-restore-v1197.css?v=1200-original");

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
      '@import url("/test/assets/prayer-v1254.css?v=20261016-motifs-v5");' +
      '@import url("/test/assets/frauen/frauen-authority-v1292.css?v=frauen-rollback-20261016-1500");' +
      '@import url("/test/assets/library/library-app.css?v=library-base-v1293");' +
      '@import url("/test/assets/library/library-authority-v1293.css?v=library-authority-v1293");' +
      '@import url("/test/assets/area-shell-v1294.css?v=area-shell-v1314-settings-edge");' +
      '@import url("/test/assets/area-utility-v1300.css?v=area-utility-v1300");' +
      '@import url("/test/assets/primary-area-embedded-v1313.css?v=primary-area-v1313");' +
      '@import url("/test/assets/tawhid-guide-v1295.css?v=tawhid-guide-v1295");' +
      '@import url("/test/assets/ilm-hadith-v1243.css?v=hadith-final-v1303");' +
      '@import url("/test/assets/hero-background-authority.css?v=hero-bg-v7");' +
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

  // DAR_HADITH_REFRAME_FINAL_V1307 — Adult Dar Test only.
  // test/index.html has an early closing </body> followed by many more inline
  // scripts and styles. The override must load after ALL of them, immediately
  // before the final </html>, and its closing </script> must be valid HTML.
  if (!html.includes('id="darHadithReframeScriptV1307"')) {
    const hadithCss = '<link rel="stylesheet" id="darHadithReframeFinalV1307" href="/test/assets/ilm-hadith-v1243.css?v=hadith-sharh-v1307">';
    const hadithJs = '<script id="darHadithReframeScriptV1307" src="/test/assets/hadith-library-reframe-v1299.js?v=hadith-sharh-v1307"></script>';
    const hadithAssets = hadithCss + hadithJs;
    if (html.includes("</html>")) html = html.replace("</html>", hadithAssets + "</html>");
    else html += hadithAssets;
  }
  // DAR_ADAPTIVE_FOLD_V1326
  // Force every pre-existing adaptive/fold reference to the same v1326 bytes.
  // This prevents an older service-worker-cached controller from running first.
  html = html.replace(/adaptive-layout\.css(?:\?v=[^"'`\s]*)?/g, "adaptive-layout.css?v=1331-reader-safe");
  html = html.replace(/adaptive-layout\.js(?:\?v=[^"'`\s]*)?/g, "adaptive-layout.js?v=1331-reader-safe");
  html = html.replace(/fold-split\.css(?:\?v=[^"'`\s]*)?/g, "fold-split.css?v=1331-reader-safe");
  html = html.replace(/fold-split\.js(?:\?v=[^"'`\s]*)?/g, "fold-split.js?v=1331-reader-safe");
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
  html = html.replace(/fold-thumb-nav\.css(?:\?v=[^"'`\s]*)?/g, "fold-thumb-nav.css?v=1331-reader-safe");
  html = html.replace(/fold-thumb-nav\.js(?:\?v=[^"'`\s]*)?/g, "fold-thumb-nav.js?v=1331-reader-safe");
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
  // DAR_TOPICS_THEME_PALETTE_V1350: Dar Test HTML only; no visitor or KIDS asset changes.
  if (!html.includes('id="darTopicsThemePaletteV1350"')) {
    const topicsThemePaletteCss = "/* DAR_TOPICS_THEME_PALETTE_V1350 — test only, adult topics and topic details.\n   Isolated theme-specific ink, contrast and interactive components.\n   Preserve existing route rendering, search/filter JS, navigation and content. */\n\nbody:is(.is-topics-route,.is-topic-route){\n  --tp-accent:var(--gold2,#ddc687);\n  --tp-ink:var(--text,#f4ecdf);\n  --tp-muted:var(--muted,#c4bba9);\n  --tp-rule:color-mix(in srgb,var(--tp-accent) 35%,transparent);\n  --tp-panel:color-mix(in srgb,var(--card,var(--bg)) 89%,transparent);\n  --tp-hover:color-mix(in srgb,var(--tp-accent) 10%,var(--card,var(--bg)));\n  --tp-placeholder:var(--tp-muted);\n}\nhtml[data-theme=\"dark\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#e0c682;--tp-ink:#f5efe3;--tp-muted:#c6beac;\n  --tp-rule:rgba(224,198,130,.28);--tp-panel:#12140f;--tp-hover:#272516;\n}\nhtml[data-theme=\"light\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#80602b;--tp-ink:#292216;--tp-muted:#635741;\n  --tp-rule:rgba(128,96,43,.28);--tp-panel:#fffcf3;--tp-hover:#f4eada;\n}\nhtml[data-theme=\"soft\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#85576c;--tp-ink:#32252b;--tp-muted:#6b5561;\n  --tp-rule:rgba(133,87,108,.29);--tp-panel:#fff5f8;--tp-hover:#f5e4ec;\n}\nhtml[data-theme=\"salbei\"] body:is(.is-topics-route,.is-topic-route),\nhtml[data-theme=\"light\"][data-theme-variant=\"salbei\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#496950;--tp-ink:#203126;--tp-muted:#506354;\n  --tp-rule:rgba(73,105,80,.3);--tp-panel:#f5f8ef;--tp-hover:#e8efe4;\n}\nhtml[data-theme=\"eisgold\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#92702e;--tp-ink:#142338;--tp-muted:#536276;\n  --tp-rule:rgba(146,112,46,.3);--tp-panel:#f7fbff;--tp-hover:#edf3fa;\n}\nhtml[data-theme=\"royal\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#e1c88e;--tp-ink:#f7eedb;--tp-muted:#d3c7b5;\n  --tp-rule:rgba(225,200,142,.3);--tp-panel:#0a1b2e;--tp-hover:#192f47;\n}\nhtml[data-theme=\"bordeaux\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#ecc999;--tp-ink:#faeee5;--tp-muted:#d9c3b9;\n  --tp-rule:rgba(236,201,153,.3);--tp-panel:#2c101c;--tp-hover:#451a2b;\n}\nhtml[data-theme=\"dar-al-layl\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#d4c295;--tp-ink:#f2eee4;--tp-muted:#c2c7ba;\n  --tp-rule:rgba(212,194,149,.28);--tp-panel:#171e1b;--tp-hover:#28302a;\n}\nhtml[data-theme=\"aurora\"] body:is(.is-topics-route,.is-topic-route){\n  --tp-accent:#a7d6bd;--tp-ink:#f2f6ed;--tp-muted:#c2d2c7;\n  --tp-rule:rgba(167,214,189,.31);--tp-panel:#112522;--tp-hover:#22403a;\n}\n\n/* Theme color governs the full topics hierarchy; no forced gold on light modes. */\nbody.is-topics-route .topics-hub :is(.view-head .eyebrow,.category-cluster > h3),\nbody.is-topics-route .topics-hub__label b,\nbody.is-topic-route .topic-collection-page > .view-head .eyebrow{\n  color:var(--tp-accent)!important;\n}\nbody.is-topics-route .topics-hub :is(.view-head h2,.view-head .view-desc,.topics-theme-card__body h3),\nbody.is-topic-route .topic-collection-page > .view-head :is(h2,.view-desc),\nbody.is-topic-route .topic-collection-page .post-row :is(h3,.post-row__title){\n  color:var(--tp-ink)!important;\n}\nbody.is-topics-route .topics-hub :is(.topics-hub__label span,.topics-theme-card__idx,.topics-theme-card__count,.topics-theme-card__chev){\n  color:var(--tp-muted)!important;opacity:1!important;\n}\nbody.is-topics-route .topics-hub__label,\nbody.is-topics-route .category-cluster > h3,\nbody.is-topics-route .topics-theme-card,\nbody.is-topic-route .topic-collection-page .post-row{\n  border-bottom-color:var(--tp-rule)!important;\n}\n\n/* Search: iPhone placeholder no longer collides with its icon or clips the label. */\nbody.is-topics-route :is(.search-panel input,.search-panel .search-input,#homeSearchInput){\n  box-sizing:border-box!important;\n  min-width:0!important;\n  max-width:100%!important;\n  height:52px!important;\n  padding-inline:44px 18px!important;\n  font-size:clamp(.875rem,3.5vw,1rem)!important;\n  line-height:1.3!important;\n  font-weight:550!important;\n  letter-spacing:0!important;\n  text-overflow:ellipsis!important;\n  background:var(--tp-panel)!important;\n  color:var(--tp-ink)!important;\n  border:1px solid var(--tp-rule)!important;\n  box-shadow:none!important;\n}\nbody.is-topics-route :is(.search-panel input,.search-panel .search-input,#homeSearchInput)::placeholder{\n  color:var(--tp-placeholder)!important;\n  -webkit-text-fill-color:var(--tp-placeholder)!important;\n  opacity:1!important;\n  font-size:inherit!important;\n  font-weight:500!important;\n  letter-spacing:0!important;\n}\nbody.is-topics-route :is(.search-panel input,.search-panel .search-input,#homeSearchInput):focus-visible{\n  outline:2px solid var(--tp-accent)!important;\n  outline-offset:2px!important;\n}\nbody.is-topics-route :is(.search-panel .advanced-toggle,.search-panel .filter-toggle,#homeSearchFilterToggle){\n  color:var(--tp-ink)!important;\n  background:var(--tp-panel)!important;\n  border:1px solid var(--tp-rule)!important;\n  font-weight:700!important;\n}\n\n/* Editorial list: calm density; long names break instead of overflow. */\nbody.is-topics-route .topics-theme-card{\n  min-height:72px!important;\n  box-sizing:border-box!important;\n  gap:10px!important;\n  padding:9px 8px!important;\n  transition:background-color .14s ease,border-color .14s ease!important;\n}\nbody.is-topics-route .topics-theme-card__body{min-width:0!important;}\nbody.is-topics-route .topics-theme-card__body h3{\n  font-size:clamp(.94rem,3.7vw,1.075rem)!important;\n  line-height:1.28!important;\n  letter-spacing:.055em!important;\n  overflow-wrap:anywhere!important;\n  text-wrap:pretty!important;\n}\nbody.is-topics-route .topics-theme-card__count{\n  font-size:.72rem!important;\n  line-height:1.25!important;\n  font-weight:650!important;\n  margin-top:3px!important;\n}\nbody.is-topics-route .topics-theme-card__icon{\n  border-color:var(--tp-rule)!important;\n  border-radius:50%!important;\n  background:color-mix(in srgb,var(--tp-accent) 7%,var(--tp-panel))!important;\n}\nbody.is-topics-route .topics-theme-card:is(:hover,:active,:focus-visible,.is-active,[aria-current=\"true\"],[aria-pressed=\"true\"]){\n  background:var(--tp-hover)!important;\n  border-radius:16px!important;\n  box-shadow:inset 3px 0 0 var(--tp-accent)!important;\n  padding:9px 8px!important;\n}\nbody.is-topics-route .topics-theme-card:focus-visible{\n  outline:2px solid var(--tp-accent)!important;\n  outline-offset:2px!important;\n}\nbody.is-topic-route .topic-collection-page .post-row:is(:hover,:focus-visible,:active){\n  background:var(--tp-hover)!important;\n  border-radius:12px!important;\n  outline-offset:2px!important;\n}\nbody.is-topic-route .topic-collection-page .post-row__icon{\n  border-color:var(--tp-rule)!important;\n  background:var(--tp-panel)!important;\n}\n@media(max-width:599px){\n  body.is-topics-route .topics-theme-card{\n    grid-template-columns:19px 38px minmax(0,1fr) 16px!important;\n    column-gap:9px!important;\n  }\n  body.is-topics-route .topics-theme-card__idx{font-size:.61rem!important;}\n  body.is-topics-route .topics-theme-card__icon{\n    width:38px!important;height:38px!important;max-width:38px!important;\n  }\n  body.is-topics-route .topics-hub__label{\n    align-items:center!important;\n    flex-wrap:wrap!important;\n  }\n}\n@media(prefers-reduced-motion:reduce){\n  body.is-topics-route .topics-theme-card{transition:none!important;}\n}";
    const topicsThemePaletteStyle = '<style id="darTopicsThemePaletteV1350">' + topicsThemePaletteCss + '</style>';
    if (html.includes("</html>")) html = html.replace("</html>", topicsThemePaletteStyle + "</html>");
    else html += topicsThemePaletteStyle;
  }

  // DAR_TOPICS_LIBRARY_LAYOUT_V1351: unambiguously visible editorial library layout (Dar Test).
  if (!html.includes('id="darTopicsLibraryLayoutV1351"')) {
    const styles = "/* DAR_TOPICS_LIBRARY_LAYOUT_V1351 — visual upgrade, adult Test topics only.\n   Preserve all data, links, search and category order. */\nbody.is-topics-route .topics-hub__label{\n  padding:8px 4px 15px!important;\n  margin-top:19px!important;\n  margin-bottom:17px!important;\n  border-bottom:2px solid var(--tp-rule)!important;\n}\nbody.is-topics-route .topics-hub__label b{\n  font-size:clamp(1.5rem,5.1vw,2.02rem)!important;\n  font-weight:720!important;\n  letter-spacing:.015em!important;\n}\nbody.is-topics-route .category-cluster{\n  box-sizing:border-box!important;\n  margin-bottom:18px!important;\n  padding:13px 14px 15px!important;\n  border:1px solid var(--tp-rule)!important;\n  border-radius:22px!important;\n  background:color-mix(in srgb,var(--tp-panel) 88%,transparent)!important;\n  box-shadow:0 10px 28px color-mix(in srgb,var(--bg) 18%,transparent)!important;\n}\nbody.is-topics-route .category-cluster > h3{\n  display:flex!important;\n  align-items:center!important;\n  gap:9px!important;\n  margin:0 0 11px!important;\n  padding:7px 5px 13px!important;\n  font-size:clamp(1.05rem,3.8vw,1.23rem)!important;\n  font-weight:750!important;\n  line-height:1.25!important;\n  letter-spacing:.04em!important;\n  color:var(--tp-accent)!important;\n  border-bottom:1px solid var(--tp-rule)!important;\n}\nbody.is-topics-route .category-cluster > h3::after{\n  background:var(--tp-rule)!important;\n}\nbody.is-topics-route .topics-theme-grid{\n  display:grid!important;\n  grid-template-columns:minmax(0,1fr)!important;\n  gap:8px!important;\n  width:100%!important;\n  margin:0!important;\n}\nbody.is-topics-route .topics-theme-card{\n  display:grid!important;\n  box-sizing:border-box!important;\n  min-width:0!important;\n  min-height:76px!important;\n  grid-template-columns:22px 42px minmax(0,1fr) 16px!important;\n  align-items:center!important;\n  column-gap:10px!important;\n  padding:10px 11px!important;\n  background:color-mix(in srgb,var(--tp-panel) 83%,var(--bg))!important;\n  border:1px solid var(--tp-rule)!important;\n  border-radius:14px!important;\n  box-shadow:none!important;\n  overflow:hidden!important;\n  transition:background-color .15s ease,border-color .15s ease!important;\n}\nbody.is-topics-route .topics-theme-card__icon{\n  width:42px!important;\n  height:42px!important;\n  max-width:42px!important;\n  border-radius:50%!important;\n  border-color:var(--tp-rule)!important;\n  background:color-mix(in srgb,var(--tp-accent) 12%,var(--tp-panel))!important;\n}\nbody.is-topics-route .topics-theme-card__body{min-width:0!important}\nbody.is-topics-route .topics-theme-card__body h3{\n  font-size:clamp(.98rem,3.7vw,1.1rem)!important;\n  font-weight:730!important;\n  letter-spacing:.025em!important;\n  line-height:1.3!important;\n  overflow-wrap:anywhere!important;\n}\nbody.is-topics-route .topics-theme-card__count{\n  font-size:.74rem!important;\n  margin-top:4px!important;\n  font-weight:650!important;\n}\nbody.is-topics-route .topics-theme-card__chev{\n  color:var(--tp-accent)!important;\n  opacity:.9!important;\n}\nbody.is-topics-route .topics-theme-card:is(:hover,:focus-visible,:active,.is-active,[aria-current=\"true\"],[aria-pressed=\"true\"]){\n  padding:10px 11px!important;\n  background:var(--tp-hover)!important;\n  border-color:var(--tp-accent)!important;\n  border-radius:14px!important;\n  box-shadow:inset 3px 0 0 var(--tp-accent)!important;\n}\nbody.is-topics-route .topics-hub :is(.search-panel input,.search-panel .search-input,#homeSearchInput){\n  border:1px solid var(--tp-rule)!important;\n  border-radius:15px!important;\n  box-shadow:0 5px 18px color-mix(in srgb,var(--bg) 17%,transparent)!important;\n}\n@media(min-width:760px){\n  body.is-topics-route .topics-theme-grid{\n    grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  }\n}\n@media(max-width:599px){\n  body.is-topics-route .category-cluster{padding:11px!important;border-radius:18px!important}\n  body.is-topics-route .topics-theme-card{\n    grid-template-columns:18px 39px minmax(0,1fr) 16px!important;\n    gap:9px!important;\n    min-height:70px!important;\n    padding:9px 8px!important;\n  }\n  body.is-topics-route .topics-theme-card__icon{\n    width:39px!important;height:39px!important;max-width:39px!important;\n  }\n  body.is-topics-route .topics-theme-card:is(:hover,:focus-visible,:active,.is-active,[aria-current=\"true\"],[aria-pressed=\"true\"]){\n    padding:9px 8px!important;\n  }\n}\n@media(prefers-reduced-motion:reduce){\n  body.is-topics-route .topics-theme-card{transition:none!important;}\n}";
    const block = '<style id="darTopicsLibraryLayoutV1351">' + styles + '</style>';
    if (html.includes("</html>")) html = html.replace("</html>", block + "</html>");
    else html += block;
  }

  // DAR_TOPICS_LIBRARY_V1360: functional overview, filtered groups and full theme palette; test HTML only.
  if (!html.includes('id="darTopicsLibraryV1360"')) {
    const libraryCss = "/* DAR_TOPICS_LIBRARY_V1360 — adult Test only; functional library overview */\nhtml[data-theme] body.is-topics-route .topics-hub{\n  --tl-accent:var(--tp-accent,var(--gold2));\n  --tl-ink:var(--tp-ink,var(--text));\n  --tl-muted:var(--tp-muted,var(--muted));\n  --tl-rule:var(--tp-rule,var(--line2));\n  --tl-surface:var(--tp-panel,var(--card));\n  --tl-hover:var(--tp-hover,var(--card));\n  width:100%!important; max-width:none!important; min-width:0!important;\n  color:var(--tl-ink)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .view-head{\n  margin-bottom:13px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-pro-panel{\n  width:min(980px,calc(100% - 28px))!important;\n  margin:0 auto 16px!important;\n  padding:0!important;\n  box-sizing:border-box!important;\n  background:transparent!important;\n  border:0!important;\n  box-shadow:none!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-line{\n  display:grid!important;\n  grid-template-columns:minmax(0,1fr) auto!important;\n  align-items:stretch!important;\n  gap:11px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-input-shell{\n  position:relative!important;\n  display:flex!important; align-items:center!important;\n  min-width:0!important; width:100%!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-input-shell .search-input-icon{\n  position:absolute!important;\n  left:18px!important;top:50%!important;transform:translateY(-50%)!important;\n  display:flex!important;align-items:center!important;justify-content:center!important;\n  width:18px!important;height:18px!important;\n  color:var(--tl-accent)!important;\n  opacity:1!important; z-index:2!important;pointer-events:none!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-input-shell input#homeSearchInput{\n  display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;\n  height:52px!important;min-height:52px!important;\n  padding:0 16px 0 53px!important;\n  border-radius:16px!important;\n  border:1px solid var(--tl-rule)!important;\n  background:var(--tl-surface)!important;\n  box-shadow:none!important;\n  color:var(--tl-ink)!important;\n  -webkit-text-fill-color:var(--tl-ink)!important;\n  font:600 clamp(13px,2.95vw,15px)/1.3 var(--sans,system-ui,sans-serif)!important;\n  letter-spacing:0!important; box-sizing:border-box!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-input-shell input#homeSearchInput::placeholder{\n  color:var(--tl-muted)!important;\n  -webkit-text-fill-color:var(--tl-muted)!important;\n  font:500 clamp(12px,2.7vw,14px)/1.3 var(--sans,system-ui,sans-serif)!important;\n  opacity:1!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub input#homeSearchInput:focus-visible{\n  border-color:var(--tl-accent)!important;\n  outline:2px solid var(--tl-accent)!important;outline-offset:2px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub #advancedFilterBtn{\n  width:auto!important;min-height:52px!important;height:52px!important;\n  padding:0 23px!important; border-radius:16px!important;\n  border:1px solid var(--tl-rule)!important;\n  background:var(--tl-surface)!important;\n  color:var(--tl-ink)!important;\n  box-shadow:none!important;\n  font:750 13px/1.25 var(--sans,system-ui,sans-serif)!important;\n  letter-spacing:.01em!important;white-space:nowrap!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub #advancedFilterBtn:is(:hover,:focus-visible,.active){\n  border-color:var(--tl-accent)!important;background:var(--tl-hover)!important;\n  outline-offset:2px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .search-helper{display:none!important}\nhtml[data-theme] body.is-topics-route #appView .topics-hub :is(.dar-tl-intro,.dar-tl-filterbar,.dar-tl-groups,.topics-hub__label){\n  width:min(980px,calc(100% - 28px))!important;\n  margin-left:auto!important;margin-right:auto!important;\n  min-width:0!important;box-sizing:border-box!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-intro{\n  position:relative!important;\n  display:flex!important;justify-content:space-between!important;align-items:center!important;gap:15px!important;\n  padding:22px 23px!important;margin-top:7px!important;margin-bottom:18px!important;\n  border:1px solid var(--tl-rule)!important;\n  border-radius:21px!important;\n  background:linear-gradient(122deg,color-mix(in srgb,var(--tl-accent) 9%,var(--tl-surface)),var(--tl-surface))!important;\n  box-shadow:0 12px 26px color-mix(in srgb,var(--bg) 19%,transparent)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-intro__eyebrow{\n  margin:0 0 6px!important;color:var(--tl-accent)!important;\n  font:850 10px/1.2 var(--sans,system-ui,sans-serif)!important;\n  letter-spacing:.17em!important;text-transform:uppercase!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-intro h3{\n  margin:0!important;\n  color:var(--tl-ink)!important;\n  font:650 clamp(23px,4.5vw,31px)/1.14 var(--serif,Georgia,serif)!important;\n  letter-spacing:.015em!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-intro__desc{\n  color:var(--tl-muted)!important;margin:9px 0 0!important;\n  font:500 clamp(12px,2.8vw,14px)/1.5 var(--sans,system-ui,sans-serif)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-seal{\n  flex:0 0 63px!important;width:63px!important;height:63px!important;\n  display:flex!important;align-items:center!important;justify-content:center!important;\n  border-radius:50%!important;border:1px solid var(--tl-rule)!important;\n  color:var(--tl-accent)!important;\n  background:color-mix(in srgb,var(--tl-accent) 9%,var(--tl-surface))!important;\n  font:700 26px/1 var(--serif,Georgia,serif)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .topics-hub__label{\n  display:flex!important;align-items:center!important;justify-content:space-between!important;\n  margin-top:5px!important;margin-bottom:11px!important;\n  padding:0 4px 13px!important;\n  border-bottom:1px solid var(--tl-rule)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .topics-hub__label b{\n  color:var(--tl-accent)!important;font:750 clamp(14px,3.4vw,17px)/1.15 var(--serif,Georgia,serif)!important;\n  letter-spacing:.095em!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .topics-hub__label span{\n  color:var(--tl-muted)!important;\n  font:700 12px/1.15 var(--sans,system-ui,sans-serif)!important;\n  opacity:1!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-filterbar{\n  display:flex!important;flex-wrap:wrap!important;align-items:center!important;\n  gap:8px!important;margin-top:0!important;margin-bottom:18px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-chip{\n  display:inline-flex!important;align-items:center!important;gap:6px!important;\n  min-height:38px!important;padding:8px 14px!important;\n  border:1px solid var(--tl-rule)!important;border-radius:999px!important;\n  background:var(--tl-surface)!important;\n  color:var(--tl-ink)!important;\n  font:700 12px/1.2 var(--sans,system-ui,sans-serif)!important;\n  cursor:pointer!important;white-space:normal!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-chip small{\n  font:750 11px/1 var(--sans,system-ui,sans-serif)!important;\n  opacity:.8!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-chip[aria-pressed=\"true\"]{\n  background:var(--tl-accent)!important;color:var(--bg,#090909)!important;\n  border-color:var(--tl-accent)!important;\n}\nhtml[data-theme=\"light\"] body.is-topics-route #appView .dar-tl-chip[aria-pressed=\"true\"],\nhtml[data-theme=\"soft\"] body.is-topics-route #appView .dar-tl-chip[aria-pressed=\"true\"],\nhtml[data-theme=\"salbei\"] body.is-topics-route #appView .dar-tl-chip[aria-pressed=\"true\"],\nhtml[data-theme=\"eisgold\"] body.is-topics-route #appView .dar-tl-chip[aria-pressed=\"true\"]{\n  color:#fff!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-chip:focus-visible,\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion summary:focus-visible{\n  outline:2px solid var(--tl-accent)!important;outline-offset:3px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-groups{\n  display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;\n  padding-bottom:12px!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion{\n  display:block!important;min-width:0!important;\n  border:1px solid var(--tl-rule)!important;\n  border-radius:20px!important;overflow:hidden!important;\n  background:var(--tl-surface)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion[hidden]{\n  display:none!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion summary{\n  display:grid!important;grid-template-columns:38px minmax(0,1fr) auto 20px!important;\n  align-items:center!important;column-gap:13px!important;\n  min-height:73px!important;padding:13px 19px!important;\n  cursor:pointer!important;list-style:none!important;\n  background:linear-gradient(105deg,color-mix(in srgb,var(--tl-accent) 7%,var(--tl-surface)),var(--tl-surface))!important;\n  color:var(--tl-ink)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion summary::-webkit-details-marker{display:none!important}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-groupno{\n  color:var(--tl-accent)!important;font:700 15px/1 var(--serif,Georgia,serif)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-groupname{\n  color:var(--tl-ink)!important;\n  font:650 clamp(15px,3.5vw,19px)/1.2 var(--serif,Georgia,serif)!important;\n  overflow-wrap:anywhere!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-groupcount{\n  color:var(--tl-muted)!important;\n  font:700 11px/1.25 var(--sans,system-ui,sans-serif)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-arrow{\n  color:var(--tl-accent)!important;font:750 23px/1 var(--sans,system-ui,sans-serif)!important;\n  transform:rotate(0deg);transition:transform .18s ease!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion[open] .dar-tl-arrow{\n  transform:rotate(90deg)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion .dar-tl-grid{\n  display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:9px!important;\n  padding:11px!important;border-top:1px solid var(--tl-rule)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card{\n  position:relative!important;display:grid!important;\n  grid-template-columns:22px 45px minmax(0,1fr) 18px!important;\n  align-items:center!important;gap:12px!important;min-width:0!important;\n  min-height:84px!important;padding:12px 13px!important;\n  border:1px solid var(--tl-rule)!important;\n  border-radius:15px!important;\n  background:color-mix(in srgb,var(--tl-accent) 4%,var(--tl-surface))!important;\n  box-shadow:none!important;\n  cursor:pointer!important;overflow:hidden!important;\n  box-sizing:border-box!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card::before,\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card::after{\n  display:none!important;content:none!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card:is(:hover,:focus-visible,:active){\n  padding:12px 13px!important;\n  background:var(--tl-hover)!important;\n  border-color:var(--tl-accent)!important;\n  border-radius:15px!important;\n  box-shadow:inset 3px 0 0 var(--tl-accent)!important;\n  transform:none!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__idx{\n  color:var(--tl-accent)!important;\n  opacity:.85!important;\n  font:650 12px/1 var(--serif,Georgia,serif)!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__icon{\n  display:flex!important;align-items:center!important;justify-content:center!important;\n  width:45px!important;height:45px!important;max-width:45px!important;\n  border-radius:50%!important;border:1px solid var(--tl-rule)!important;\n  background:color-mix(in srgb,var(--tl-accent) 9%,var(--tl-surface))!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__body{\n  display:block!important;min-width:0!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__body h3{\n  color:var(--tl-ink)!important;\n  font:650 clamp(16px,3.5vw,18px)/1.25 var(--serif,Georgia,serif)!important;\n  letter-spacing:.035em!important;overflow-wrap:anywhere!important;margin:0!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__count{\n  color:var(--tl-muted)!important;\n  font:650 11px/1.3 var(--sans,system-ui,sans-serif)!important;\n  margin:4px 0 0!important;\n}\nhtml[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__chev{\n  color:var(--tl-accent)!important;opacity:1!important;\n  font-size:22px!important;\n}\n@media(min-width:760px){\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion .dar-tl-grid{\n    grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  }\n}\n@media(max-width:680px){\n  html[data-theme] body.is-topics-route #appView .topics-hub .search-line{\n    grid-template-columns:minmax(0,1fr)!important;gap:9px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub #advancedFilterBtn{\n    width:100%!important;height:44px!important;min-height:44px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-intro{\n    padding:18px!important;border-radius:18px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-seal{\n    flex-basis:48px!important;width:48px!important;height:48px!important;font-size:21px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-accordion summary{\n    grid-template-columns:24px minmax(0,1fr) auto 16px!important;\n    padding:12px!important;column-gap:8px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card{\n    grid-template-columns:18px 39px minmax(0,1fr) 15px!important;\n    gap:9px!important;min-height:73px!important;\n    padding:10px 9px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card__icon{\n    width:39px!important;height:39px!important;max-width:39px!important;\n  }\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-grid .topics-theme-card:is(:hover,:focus-visible,:active){\n    padding:10px 9px!important;\n  }\n}\n@media(prefers-reduced-motion:reduce){\n  html[data-theme] body.is-topics-route #appView .topics-hub .dar-tl-arrow{\n    transition:none!important;\n  }\n}\n";
    const libraryJs = "/* DAR_TOPICS_LIBRARY_V1360 — preserve original data and native routing */\n(function(){\n\"use strict\";\nif(window.__DAR_TOPICS_LIBRARY_V1360)return;\nwindow.__DAR_TOPICS_LIBRARY_V1360=true;\nif(typeof renderTopics!==\"function\")return;\nconst original=renderTopics;\nconst definitions=[\n{id:\"glauben\",title:\"Glaube & Grundlagen\",words:[\"aqid\",\"tawhid\",\"sunnah\",\"iman\",\"shirk\",\"tagut\",\"akhira\",\"jannah\",\"jahannam\",\"mak an\",\"allah\"],desc:\"Grundlagen des Glaubens\"},\n{id:\"quellen\",title:\"Qurʾān, Sunnah & Überlieferung\",words:[\"quran\",\"tafsir\",\"hadith\",\"athar\",\"sahaba\",\"sahabiyyat\",\"sahabiyy\",\"salaf\",\"wissen\",\"ilm\",\"adhkar\",\"dhikr\"],desc:\"Texte, Überlieferer und Wissen\"},\n{id:\"recht\",title:\"Fiqh, Urteile & Methodik\",words:[\"fiqh\",\"hukm\",\"muhakam\",\"takfir\",\"manhaj\",\"usul\",\"ijma\",\"widerlegung\",\"qiyas\",\"recht\"],desc:\"Rechtsfragen und Prinzipien\"},\n{id:\"leben\",title:\"Charakter, Herz & Leben\",words:[\"adab\",\"akhlaq\",\"tarbiy\",\"tazkiy\",\"tawakkul\",\"zuhd\",\"familie\",\"liebe\",\"dunya\",\"geduld\",\"erzieh\"],desc:\"Adab und tägliche Lebensführung\"},\n{id:\"weitere\",title:\"Weitere Wissensgebiete\",words:[],desc:\"Weitere Themen mit Quellen\"}\n];\nfunction key(v){return String(v||\"\").normalize(\"NFKD\").replace(/[\\u0300-\\u036f]/g,\"\").toLocaleLowerCase(\"de\").replace(/[ʿʾʽʻ‘’']/g,\"\").replace(/[^a-z0-9]/g,\"\");}\nfunction groupFor(v){\n const k=key(v);\n for(const d of definitions.slice(0,-1)){\n   if(d.words.some(w=>k.includes(key(w))))return d.id;\n }\n return \"weitere\";\n}\nfunction escHtml(v){return String(v||\"\").replace(/[&<>\"']/g,c=>({\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#39;\"}[c]));}\nfunction label(n,one,many){return n+\" \"+(n===1?one:many);}\nfunction enhance(html){\n const template=document.createElement(\"template\");\n template.innerHTML=html;\n const hub=template.content.querySelector(\".topics-hub\");\n if(!hub || hub.querySelector(\".dar-tl-groups\"))return html;\n const labelNode=hub.querySelector(\".topics-hub__label\");\n const originalGroups=Array.from(hub.querySelectorAll(\".category-cluster\"));\n if(!labelNode || !originalGroups.length)return html;\n const originalCards=originalGroups.flatMap(el=>Array.from(el.querySelectorAll(\".topics-theme-card\")));\n if(!originalCards.length)return html;\n const groups=new Map(definitions.map(d=>[d.id,[]]));\n let count=0;\n for(const card of originalCards){\n   const name=card.getAttribute(\"data-value\") || card.querySelector(\".topics-theme-card__body h3\")?.textContent || \"\";\n   const id=groupFor(name);\n   groups.get(id).push(card.outerHTML);\n   count++;\n }\n let articles=0;\n try{\n   const counts=originalCards.map(card=>Number((card.querySelector(\".topics-theme-card__count\")?.textContent||\"\").match(/\\d+/)?.[0]||0));\n   articles=counts.reduce((a,b)=>a+b,0);\n }catch(e){}\n const intro=document.createElement(\"section\");\n intro.className=\"dar-tl-intro\";\n intro.setAttribute(\"aria-label\",\"Wissensbibliothek\");\n intro.innerHTML='<div><p class=\"dar-tl-intro__eyebrow\">DĀR AL TAWḤĪD · THEMENBIBLIOTHEK</p><h3>Wissen nach Themen entdecken</h3><p class=\"dar-tl-intro__desc\">Geordnetes Wissen mit Aussagen, Quellen und Nachweisen.</p></div><div class=\"dar-tl-seal\" aria-hidden=\"true\">۞</div>';\n labelNode.parentNode.insertBefore(intro,labelNode);\n const filter=document.createElement(\"nav\");\n filter.className=\"dar-tl-filterbar\";\n filter.setAttribute(\"aria-label\",\"Wissensgebiete wählen\");\n const available=definitions.filter(d=>groups.get(d.id).length);\n filter.innerHTML='<button type=\"button\" class=\"dar-tl-chip\" data-dar-topic-filter=\"all\" aria-pressed=\"true\">Alle Themen <small>'+count+'</small></button>'+\n available.map(d=>'<button type=\"button\" class=\"dar-tl-chip\" data-dar-topic-filter=\"'+d.id+'\" aria-pressed=\"false\">'+escHtml(d.title)+' <small>'+groups.get(d.id).length+'</small></button>').join(\"\");\n const stack=document.createElement(\"div\");\n stack.className=\"dar-tl-groups\";\n stack.setAttribute(\"aria-label\",\"Themenbereiche\");\n available.forEach((d,index)=>{\n   const items=groups.get(d.id);\n   const details=document.createElement(\"details\");\n   details.className=\"dar-tl-accordion\";\n   details.setAttribute(\"data-dar-tl-group\",d.id);\n   if(index===0 || count<=8)details.open=true;\n   details.innerHTML='<summary><span class=\"dar-tl-groupno\" aria-hidden=\"true\">'+String(index+1).padStart(2,\"0\")+'</span><span class=\"dar-tl-groupname\">'+escHtml(d.title)+'</span><span class=\"dar-tl-groupcount\">'+label(items.length,\"Thema\",\"Themen\")+'</span><span class=\"dar-tl-arrow\" aria-hidden=\"true\">›</span></summary><div class=\"dar-tl-grid\">'+items.join(\"\")+'</div>';\n   stack.appendChild(details);\n });\n originalGroups.forEach(el=>el.remove());\n labelNode.insertAdjacentElement(\"afterend\",filter);\n filter.insertAdjacentElement(\"afterend\",stack);\n labelNode.querySelector(\"span\").textContent=label(count,\"Bereich\",\"Bereiche\")+\" · \"+label(articles,\"Beitrag\",\"Beiträge\");\n return template.innerHTML;\n}\nrenderTopics=function(){try{return enhance(original.apply(this,arguments));}catch(e){console.warn(\"Topics layout fallback\",e);return original.apply(this,arguments);}};\ndocument.addEventListener(\"click\",function(e){\n const button=e.target?.closest?.(\".dar-tl-filterbar [data-dar-topic-filter]\");\n if(!button)return;\n const hub=button.closest(\".topics-hub\");\n if(!hub)return;\n const value=button.getAttribute(\"data-dar-topic-filter\")||\"all\";\n hub.querySelectorAll(\".dar-tl-filterbar [data-dar-topic-filter]\").forEach(b=>b.setAttribute(\"aria-pressed\",b===button?\"true\":\"false\"));\n hub.querySelectorAll(\".dar-tl-accordion\").forEach(item=>{\n   const selected=value===\"all\"||item.getAttribute(\"data-dar-tl-group\")===value;\n   item.hidden=!selected;\n   if(value!==\"all\"&&selected)item.open=true;\n });\n});\n})();\n";
    const block = '<style id="darTopicsLibraryV1360">' + libraryCss + '</style>' +
      '<script id="darTopicsLibraryRuntimeV1360">' + libraryJs + '<\/script>';
    if (html.includes("</html>")) html = html.replace("</html>", block + "</html>");
    else html += block;
  }

  // DAR_PRAYER_MOTIFS_DELIVERY_V6_20261016: integrate into the final Test HTML, independently of stale static-CSS caches.
  // Only adult /test/ markup; all existing buttons/icons and notification logic remain unchanged.
  if (!html.includes('id="darTestPrayerMotifAuthorityV6"')) {
    const motifNames = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const motifDir = "/test/assets/prayer-motifs/";
    const motifCacheKey = "?v=20261016-visual-v6";
    const settingsCard = "html[data-theme] body.is-settings-route .settings-one-page .notification-prayer-grid > .notification-prayer";
    const prayerCard = "html[data-theme] body #appView.view:has(.prayer-page-noble) .prayer-page-noble .prayer-time-grid--top > :is(.prayer-time-card,.prayer-time-card--slim)";
    const css = [
      settingsCard + "{position:relative!important;isolation:isolate!important;overflow:hidden!important;min-height:102px!important;--dar-motif-top:rgba(4,12,28,.23);--dar-motif-bottom:rgba(4,12,28,.88);background-image:linear-gradient(180deg,var(--dar-motif-top),var(--dar-motif-bottom)),var(--dar-prayer-image)!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;border:1px solid color-mix(in srgb,var(--gold2) 30%,transparent)!important;border-radius:12px!important;}",
      prayerCard + "{position:relative!important;isolation:isolate!important;overflow:hidden!important;min-width:0!important;min-height:108px!important;--dar-motif-top:rgba(4,12,28,.23);--dar-motif-bottom:rgba(4,12,28,.88);background-image:linear-gradient(180deg,var(--dar-motif-top),var(--dar-motif-bottom)),var(--dar-time-photo)!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;border:1px solid color-mix(in srgb,var(--gold2) 30%,transparent)!important;border-radius:12px!important;}",
      ...motifNames.map((name,index)=>settingsCard + ":nth-child("+(index+1)+"){--dar-prayer-image:url(\""+motifDir+name+".webp"+motifCacheKey+"\")!important;}"),
      ...["fajr","fajr","dhuhr","asr","maghrib","isha"].map((name,index)=>prayerCard + ":nth-child("+(index+1)+"){--dar-time-photo:url(\""+motifDir+name+".webp"+motifCacheKey+"\")!important;}"),
      "html:is([data-theme=light],[data-theme=soft],[data-theme=eisgold],[data-theme=salbei]) body.is-settings-route .settings-one-page .notification-prayer-grid > .notification-prayer,html:is([data-theme=light],[data-theme=soft],[data-theme=eisgold],[data-theme=salbei]) body #appView.view:has(.prayer-page-noble) .prayer-page-noble .prayer-time-grid--top > :is(.prayer-time-card,.prayer-time-card--slim){--dar-motif-top:rgba(16,23,29,.10);--dar-motif-bottom:rgba(13,23,31,.80);}",
      "html[data-theme=bordeaux] body.is-settings-route .settings-one-page .notification-prayer-grid > .notification-prayer,html[data-theme=bordeaux] body #appView.view:has(.prayer-page-noble) .prayer-page-noble .prayer-time-grid--top > :is(.prayer-time-card,.prayer-time-card--slim){--dar-motif-top:rgba(40,6,22,.25);--dar-motif-bottom:rgba(40,6,22,.9);}",
      "html[data-theme=dar-al-layl] body.is-settings-route .settings-one-page .notification-prayer-grid > .notification-prayer,html[data-theme=dar-al-layl] body #appView.view:has(.prayer-page-noble) .prayer-page-noble .prayer-time-grid--top > :is(.prayer-time-card,.prayer-time-card--slim){--dar-motif-top:rgba(10,28,23,.22);--dar-motif-bottom:rgba(10,28,23,.90);}",
      settingsCard + " :is(b,small,.dar-prayer-clock),"+prayerCard+" :is(b,small,span){color:#fff8ea!important;-webkit-text-fill-color:#fff8ea!important;text-shadow:0 1px 4px rgba(0,0,0,.95)!important;}",
      settingsCard + ":is(.is-on,[aria-pressed=true]),"+prayerCard+":is(.active,.is-current){border-color:var(--gold2)!important;}",
      "@media(max-width:400px){"+settingsCard+"{min-height:90px!important;padding:6px 1px!important;}"+prayerCard+"{min-height:93px!important;padding:7px 1px!important;}}"
    ].join("\n");
    const motifStyle = '<style id="darTestPrayerMotifAuthorityV6">'+css+'</style>';
    // Place AFTER legacy theme sheets, so the existing app hierarchy remains
    // while generated photographs are demonstrably visible on both routes.
    html += motifStyle;
  }


  // DAR_PRAYER_MOTIF_DOM_V7_20261016: after every SPA route redraw, add decorative image elements.
  // Static CSS background selectors alone were not reliable on this test shell.
  // Existing buttons/icons, handlers and calculation code remain unmodified.
  if (!html.includes('id="darPrayerMotifsDomV7"')) {
    const motifRuntime = '<script id="darPrayerMotifsDomV7" src="/test/assets/prayer-motifs/live-photo-v6.js?v=20261016-visible-v7" defer><\/script>';
    if (html.includes("</body>")) html = html.replace("</body>", motifRuntime + "</body>");
    else html += motifRuntime;
  }
  // The old settings positions must not be rendered by the inline SPA.
  html = html.split("${renderAdaptiveNavPanel()}").join("");
  html = html.split('${typeof renderAdaptiveNavPanel==="function"?renderAdaptiveNavPanel():""}').join("");

  // DAR_TEST_GLOBAL_EDGE_WIDTH_V1372_20261016: adult /test only.
  // Load after every legacy style authority, including the embedded prayer
  // motif layer. Route-based CSS: no modification of navigation JS or assets.
  // The 10px mobile content gutter follows the existing floating bottom nav.
  // DAR_TEST_ANDROID_CSS_DELIVERY_V1389: guarantee the exact latest Test
  // stylesheet even if the static shell already contains an old link.
  // Keep it late in the document for consistent theme/layout precedence.
  const edgeLinkV1389 = '<link rel="stylesheet" id="darTestEdgeWidthV1372" href="/test/assets/test-global-edge-width-v1372.css?v=edge-no-perimeter-v1393">';
  const existingEdgeLinkV1389 = /<link\b[^>]*\bid=["']darTestEdgeWidthV1372["'][^>]*>/i;
  if (existingEdgeLinkV1389.test(html)) {
    html = html.replace(existingEdgeLinkV1389, edgeLinkV1389);
  } else if (html.includes("</body>")) {
    html = html.replace("</body>", edgeLinkV1389 + "\n</body>");
  } else {
    html += edgeLinkV1389;
  }
  // DAR_TEST_ANDROID_TOUCH_SCROLL_RECOVERY_V1390: only in adult /test HTML.
  // Preserve active Qurʾān sheets; repair orphaned global lock after navigation.
  const scrollRecoveryV1390 = '<script defer id="darTestAndroidScrollRecoveryV1390" src="/test/assets/android-scroll-recovery-v1390.js?v=android-touch-v1390"><\/script>';
  if (!html.includes('id="darTestAndroidScrollRecoveryV1390"')) {
    if (html.includes("</body>")) html = html.replace("</body>", scrollRecoveryV1390 + "\n</body>");
    else html += scrollRecoveryV1390;
  }
  if (!html.includes('id="darHeroBackgroundAuthorityV3"')) {
    html += '<link rel="stylesheet" id="darHeroBackgroundAuthorityV3" href="/test/assets/hero-background-authority.css?v=hero-bg-v7">';
  }
  // Same visual fix as the public-domain site router, for the separate
  // dedicated Test Worker origin. Only affects the adult Test Home.
  const homeV3Css = '<link rel="stylesheet" id="darTestHomeV3ActualRoute" href="/test/assets/dar-home-v3-compact.css?v=20261019-home-plain-v2">';
  const photoRemoveCss = '<link rel="stylesheet" id="darTestHomeNoPhotosActualRouteV2" href="/test/assets/home-background-remove-v2.css?v=20261019-photo-free-v2">';
  html = html.replace(/<link\b[^>]*\bid=["']darTestHomeNoBackgroundsV1["'][^>]*>\s*/gi, "");
  if (!html.includes('id="darTestHomeV3ActualRoute"')) {
    html = html.includes("</head>") ? html.replace("</head>", homeV3Css + "\n</head>") : homeV3Css + html;
  }
  if (!html.includes('id="darTestHomeNoPhotosActualRouteV2"')) {
    html = html.includes("</body>") ? html.replace("</body>", photoRemoveCss + "\n</body>") : html + photoRemoveCss;
  }


  // DAR_FRAUEN_HERO_DOM_RUNTIME_V1394: repair cache-key only.
  // The script already exists in the Test shell; never duplicate it.
  html = html.replace(/(\/test\/assets\/frauen\/frauen-fiqh\.js)(?:\?v=[^"'<\s]*)?/g,
    "$1?v=frauen-rollback-20261016-1500");


  // DĀR TEST HOME V4.7R2: final and directly versioned visual authority.
  // This is limited to the /test HTML shell by the caller, never visitor/KIDS.
  // The older JS-only loader could be cached and cannot guarantee these assets.
  html = html.replace(/<link\b[^>]*\bid=["']darHomeV47CssFinal["'][^>]*>\s*/gi, "");
  html = html.replace(/<script\b[^>]*\bid=["']darHomeV47JsFinal["'][^>]*><\/script>\s*/gi, "");
  // V4.8: adult Test Home only — layout polish and fuzzy multi-source search.
  // Do not change the bottom navigation, prayer engine, KIDS or live visitor.
  html = html.replace(/<link\b[^>]*\bid=["']darHomeV48Polish["'][^>]*>\s*/gi, "");
  html = html.replace(/<script\b[^>]*\bid=["']darSearchV48Core["'][^>]*><\/script>\s*/gi, "");
  html = html.replace(/<script\b[^>]*\bid=["']darSearchV48Ui["'][^>]*><\/script>\s*/gi, "");
  const v47FinalAssets =
    '<link rel="stylesheet" id="darHomeV47CssFinal" href="/test/assets/dar-home-v47-layout.css?v=20261019-v47r2">' +
    '<script id="darHomeV47JsFinal" data-dar-home-v47 src="/test/assets/dar-home-v47-layout.js?v=20261021-brand-prayer-first-v4"></script>' +
    '<script id="darLocalHomeEditorV1" src="/test/assets/dar-test-home-editor-apply-v1.js?v=editor-20261019-1"></script>' +
    '<script id="darLocalHomeStudioV2" src="/test/assets/dar-test-studio-local-v2.js?v=studio-20261019-3"></script>' +
    '<link rel="stylesheet" id="darHomeV48Polish" href="/test/assets/dar-home-v48-polish.css?v=20261019-48-1">' +
    '<script id="darSearchV48Core" src="/test/assets/dar-smart-search-core-v48.js?v=20261019-48-1"></script>' +
    '<script id="darSearchV48Ui" src="/test/assets/dar-smart-search-ui-v48.js?v=20261019-48-1"></script>';
  const v47Insert = html.lastIndexOf("</html>");
  if (v47Insert >= 0) html = html.slice(0, v47Insert) + v47FinalAssets + html.slice(v47Insert);
  else html += v47FinalAssets;

  // SMART_TEST_HOME_V3: active workers.dev /test shell; refresh canonical Home JS.
  html = html.replace(/dar-home-library-v1194\.js\?v=[^"'\x60\s]+/g,
    "dar-home-library-v1194.js?v=20261020-smart-v4");
  if (!html.includes("dar-home-library-v1194.js?v=20261020-smart-v4")) {
    const smartSrc = '<script defer id="darTestSmartHomeV3" src="/test/assets/dar-home-library-v1194.js?v=20261020-smart-v4"></script>';
    html = html.includes("</body>") ? html.replace("</body>", smartSrc + "\n</body>") : html + smartSrc;
  }
  // DAR_TEST_PARITY_CURRENT_SCRIPT_AUTHORITY_V55: refresh an existing
  // <script id="darTestHomeHtmlParityV1"> from cached HTML before reinjecting.
  // A bare includes(id) skipped version upgrades, leaving the old visible UI.
  html = html.replace(/<script\b(?=[^>]*\bid=["']darTestHomeHtmlParityV1["'])[^>]*>\s*<\/script>\s*/gi, "");
  const parityScript = '<script defer id="darTestHomeHtmlParityV1" src="/test/assets/dar-home-html-parity-v1.js?v=20261030-prayer-hierarchy-v2"></script>';
  html = html.includes("</body>") ? html.replace("</body>", parityScript + "\n</body>") : html + parityScript;
  // DAR_ADULT_TOP_SCROLL_BOUNDARY_V1: every adult Dar Test route uses
  // the real document scroll; clamp downward drags at the top without
  // locking vertical lists, prayers, Qurʾān or the bottom navigation.
  const scrollCss = '<link rel="stylesheet" id="darAdultTopBoundaryCssV1" href="/test/assets/dar-adult-top-scroll-boundary-v1.css?v=20261020-no-overlay-v8">';
  const scrollJs = '<script defer id="darAdultTopBoundaryJsV1" src="/test/assets/dar-adult-top-scroll-boundary-v1.js?v=20261020-no-overlay-v8"></script>';
  if(!html.includes('id="darAdultTopBoundaryCssV1"'))
    html=html.includes("</head>")?html.replace("</head>",scrollCss+"\n</head>"):scrollCss+html;
  if(!html.includes('id="darAdultTopBoundaryJsV1"'))
    html=html.includes("</body>")?html.replace("</body>",scrollJs+"\n</body>"):html+scrollJs;
  // DAR_TEST_BRAND_HEADER_V1: test-route only; the public visitor worker is unchanged.
  if (!html.includes('id="darTestGlobalBrandHeaderAssetsV1"')) {
    const brandHeaderAssets = "<style id=\"darTestGlobalBrandHeaderAssetsV1\">\n/* DAR TEST · Markenleiste mit Scroll-under, alle Erwachsenen-Routen */\nhtml[data-theme]{--dtbh-bg:var(--bg,#111b17);--dtbh-ink:#f6eddb;--dtbh-muted:#d9c28a;--dtbh-line:rgba(208,174,107,.34);--dtbh-btn:rgba(192,160,91,.10);}\nhtml[data-theme=\"light\"]{--dtbh-bg:#fbf7eb;--dtbh-ink:#26382f;--dtbh-muted:#886b3d;--dtbh-line:rgba(136,107,61,.27);--dtbh-btn:#f3eddf;}\nhtml[data-theme=\"soft\"]{--dtbh-bg:#fcf5f3;--dtbh-ink:#48313e;--dtbh-muted:#886372;--dtbh-line:rgba(128,91,104,.28);--dtbh-btn:#f5eae9;}\nhtml[data-theme=\"eisgold\"]{--dtbh-bg:#f7f4ea;--dtbh-ink:#26384b;--dtbh-muted:#a67c30;--dtbh-line:rgba(167,127,57,.31);--dtbh-btn:#eee8d9;}\nhtml[data-theme=\"salbei\"],html[data-theme=\"light\"][data-theme-variant=\"salbei\"]{--dtbh-bg:#ebf0e7;--dtbh-ink:#294539;--dtbh-muted:#748354;--dtbh-line:rgba(78,118,90,.25);--dtbh-btn:#e0e9dd;}\nhtml[data-theme=\"dark\"]{--dtbh-bg:#111711;--dtbh-ink:#f3e8d3;--dtbh-muted:#d0b477;--dtbh-line:rgba(213,179,112,.27);--dtbh-btn:#222a23;}\nhtml[data-theme=\"royal\"]{--dtbh-bg:#08192e;--dtbh-ink:#f4e9d3;--dtbh-muted:#e0bf81;--dtbh-line:rgba(221,182,105,.28);--dtbh-btn:#132b46;}\nhtml[data-theme=\"bordeaux\"]{--dtbh-bg:#25181f;--dtbh-ink:#f1e4d4;--dtbh-muted:#e0b989;--dtbh-line:rgba(211,167,112,.3);--dtbh-btn:#392831;}\nhtml[data-theme=\"dar-al-layl\"]{--dtbh-bg:#0b110e;--dtbh-ink:#eee3cb;--dtbh-muted:#d2b681;--dtbh-line:rgba(211,177,110,.27);--dtbh-btn:#19241c;}\n#darTestBrandHeaderV1{position:fixed!important;top:0!important;inset-inline:0!important;z-index:730!important;width:100%!important;margin:0!important;padding:max(9px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,12px)) 9px max(12px,env(safe-area-inset-left,12px))!important;box-sizing:border-box!important;background:var(--dtbh-bg)!important;background-image:none!important;color:var(--dtbh-ink)!important;border-bottom:1px solid var(--dtbh-line)!important;box-shadow:0 2px 14px rgba(0,0,0,.075)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;transform:none!important;contain:none!important}\n#darTestBrandHeaderV1,#darTestBrandHeaderV1 *{box-sizing:border-box!important}\n#darTestBrandHeaderV1 .dtbh-row{display:flex!important;align-items:center!important;gap:11px!important;max-width:1536px;margin:0 auto!important;min-height:52px!important}\n#darTestBrandHeaderV1 .dtbh-logo{display:block!important;object-fit:contain!important;width:clamp(45px,10vw,54px)!important;height:clamp(45px,10vw,54px)!important;border-radius:50%!important;flex:none!important}\n#darTestBrandHeaderV1 .dtbh-copy{min-width:0!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;gap:3px!important}\n#darTestBrandHeaderV1 .dtbh-name{display:block!important;font:800 clamp(16px,4.6vw,25px)/1.05 Georgia,\"Iowan Old Style\",serif!important;letter-spacing:.025em!important;color:var(--dtbh-ink)!important;-webkit-text-fill-color:var(--dtbh-ink)!important;white-space:nowrap!important}\n#darTestBrandHeaderV1 .dtbh-tagline{font:600 clamp(9px,2.4vw,11.5px)/1.3 system-ui,-apple-system,sans-serif!important;color:var(--dtbh-muted)!important;letter-spacing:.015em!important;white-space:normal!important;overflow-wrap:normal!important}\n#darTestBrandHeaderV1 .dtbh-toggle{width:45px!important;height:45px!important;flex:0 0 45px!important;display:grid!important;place-items:center!important;background:var(--dtbh-btn)!important;color:var(--dtbh-ink)!important;border:1px solid var(--dtbh-line)!important;border-radius:14px!important;cursor:pointer!important;box-shadow:none!important;min-width:0!important;padding:0!important}\n#darTestBrandHeaderV1 .dtbh-toggle svg{width:21px;height:21px;stroke:currentColor}\n#darTestBrandHeaderV1 .dtbh-toggle:focus-visible,#darTestBrandHeaderV1 .dtbh-choice:focus-visible{outline:2px solid var(--dtbh-muted)!important;outline-offset:2px!important}\n#darTestBrandHeaderV1 .dtbh-panel{position:absolute!important;right:max(12px,env(safe-area-inset-right,12px))!important;top:calc(100% + 4px)!important;width:min(320px,calc(100vw - 24px))!important;max-height:min(480px,70dvh)!important;overflow:auto!important;padding:13px!important;background:var(--dtbh-bg)!important;color:var(--dtbh-ink)!important;border:1px solid var(--dtbh-line)!important;border-radius:16px!important;box-shadow:0 14px 34px rgba(0,0,0,.22)!important}\n#darTestBrandHeaderV1 .dtbh-panel[hidden]{display:none!important}\n#darTestBrandHeaderV1 .dtbh-panel-title{display:block!important;font:700 13px/1.3 system-ui,sans-serif!important;margin-bottom:10px!important}\n#darTestBrandHeaderV1 .dtbh-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}\n#darTestBrandHeaderV1 .dtbh-choice{display:flex!important;align-items:center!important;gap:7px!important;min-width:0!important;min-height:43px!important;padding:7px!important;background:var(--dtbh-btn)!important;color:var(--dtbh-ink)!important;border:1px solid var(--dtbh-line)!important;border-radius:11px!important;font:600 11px/1.25 system-ui,sans-serif!important;text-align:left!important;cursor:pointer!important}\n#darTestBrandHeaderV1 .dtbh-choice[aria-pressed=\"true\"]{outline:1px solid var(--dtbh-muted)!important}\n#darTestBrandHeaderV1 .dtbh-swatch{width:18px;height:18px;border:1px solid rgba(127,127,127,.4);border-radius:50%;flex:none}\n#darTestBrandHeaderSpacerV1{display:block!important;width:100%!important;height:var(--dar-test-brand-header-height,80px)!important;flex:0 0 var(--dar-test-brand-header-height,80px)!important;grid-column:1/-1!important;pointer-events:none!important}\nhtml.dar-test-global-brand-ready body .top-shell .header-row--brand-only{display:none!important}\n@media(min-width:720px){#darTestBrandHeaderV1{padding-left:clamp(16px,3vw,46px)!important;padding-right:clamp(16px,3vw,46px)!important}#darTestBrandHeaderV1 .dtbh-row{gap:15px!important;min-height:59px!important}#darTestBrandHeaderV1 .dtbh-logo{width:56px!important;height:56px!important}#darTestBrandHeaderV1 .dtbh-copy{gap:5px!important}#darTestBrandHeaderV1 .dtbh-toggle{width:48px!important;height:48px!important;flex-basis:48px!important}}\n@media(max-width:349px){#darTestBrandHeaderV1 .dtbh-row{gap:7px!important}#darTestBrandHeaderV1 .dtbh-logo{width:40px!important;height:40px!important}#darTestBrandHeaderV1 .dtbh-toggle{width:40px!important;height:40px!important;flex-basis:40px!important}#darTestBrandHeaderV1 .dtbh-name{font-size:15px!important}}\n\n/* DAR_TEST_BRAND_HEADER_V2: compact fixed rail; original scroll starts at prayer */\n#darTestBrandHeaderV1 .dtbh-row{min-height:62px!important;gap:10px!important}\n#darTestBrandHeaderV1 .dtbh-logo{width:clamp(56px,15vw,65px)!important;height:clamp(56px,15vw,65px)!important;flex-basis:clamp(56px,15vw,65px)!important}\n#darTestBrandHeaderV1 .dtbh-copy{gap:4px!important}\n#darTestBrandHeaderV1 .dtbh-name{font-size:clamp(18px,5.6vw,27px)!important;line-height:1.12!important;letter-spacing:0!important}\n#darTestBrandHeaderV1 .dtbh-tagline{font-size:clamp(9px,2.35vw,11px)!important;line-height:1.23!important;letter-spacing:.012em!important;font-weight:750!important}\nhtml.dar-test-global-brand-ready body .top-shell .header-row--brand-only{display:none!important;height:0!important;margin:0!important;padding:0!important;border:0!important}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header{margin-top:0!important;padding-top:0!important}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell{margin-top:0!important;border-top:0!important}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header #headerPrayerStatus{margin-top:0!important}\n@media(max-width:390px){#darTestBrandHeaderV1 .dtbh-name{font-size:clamp(17px,5.35vw,22px)!important}#darTestBrandHeaderV1 .dtbh-tagline{font-size:clamp(8.5px,2.25vw,10px)!important}}\n@media(min-width:720px){#darTestBrandHeaderV1 .dtbh-logo{width:64px!important;height:64px!important;flex-basis:64px!important}#darTestBrandHeaderV1 .dtbh-name{font-size:27px!important}}\n\n/* DAR_ADULT_BRAND_PRAYER_START_V3 · remove duplicate home brand, compact to iOS Safe Area. */\n#darTestBrandHeaderV1{\n  padding-top:env(safe-area-inset-top,0px)!important;\n  padding-bottom:4px!important;\n  padding-inline-start:max(11px,env(safe-area-inset-left,0px))!important;\n  padding-inline-end:max(11px,env(safe-area-inset-right,0px))!important;\n}\n#darTestBrandHeaderV1 .dtbh-row{min-height:53px!important;gap:9px!important}\n#darTestBrandHeaderV1 .dtbh-logo{\n  width:clamp(49px,13.5vw,54px)!important;\n  height:clamp(49px,13.5vw,54px)!important;\n  flex:0 0 clamp(49px,13.5vw,54px)!important;\n}\n#darTestBrandHeaderV1 .dtbh-copy{gap:3px!important;min-width:0!important}\n#darTestBrandHeaderV1 .dtbh-tagline{\n  display:block!important;order:0!important;\n  font-size:clamp(9px,2.45vw,11px)!important;\n  line-height:1.25!important;letter-spacing:0!important;\n  font-weight:750!important;text-transform:none!important;\n  white-space:normal!important;\n}\n#darTestBrandHeaderV1 .dtbh-name{\n  display:block!important;order:1!important;\n  font-size:clamp(17px,5.05vw,25px)!important;\n  font-weight:800!important;line-height:1.1!important;\n  letter-spacing:0!important;white-space:nowrap!important;\n}\n#darTestBrandHeaderV1 .dtbh-toggle{\n  width:43px!important;height:43px!important;\n  flex:0 0 43px!important;\n  border-radius:13px!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header :is(.header-row--brand-only,.dar-v47-leadin),\nhtml.dar-test-global-brand-ready.dar-home-v47-layout.dar-home-v1194 body.is-home-route .top-shell .header :is(.header-row--brand-only,.dar-v47-leadin){\n  display:none!important;visibility:hidden!important;\n  height:0!important;min-height:0!important;\n  max-height:0!important;margin:0!important;padding:0!important;\n  border:0!important;overflow:hidden!important;\n  order:-99!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell,\nhtml.dar-test-global-brand-ready.dar-home-v47-layout.dar-home-v1194 body.is-home-route .top-shell{\n  padding-top:0!important;margin-top:0!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header,\nhtml.dar-test-global-brand-ready.dar-home-v47-layout.dar-home-v1194 body.is-home-route .top-shell .header{\n  padding-top:0!important;margin-top:0!important;\n  gap:0!important;min-height:0!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header #headerPrayerStatus,\nhtml.dar-test-global-brand-ready.dar-home-v47-layout.dar-home-v1194 body.is-home-route .top-shell .header #headerPrayerStatus.header-prayer-hub{\n  order:-100!important;\n  margin-top:0!important;\n  position:relative!important;\n  top:auto!important;bottom:auto!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell .header #dv3HeaderActions{\n  display:none!important;\n}\nhtml.dar-test-global-brand-ready body.is-home-route .top-shell > .isnad{\n  margin-top:8px!important;\n}\n@media(min-width:720px){\n  #darTestBrandHeaderV1 .dtbh-row{min-height:56px!important}\n  #darTestBrandHeaderV1 .dtbh-logo{width:56px!important;height:56px!important;flex:0 0 56px!important}\n  #darTestBrandHeaderV1 .dtbh-name{font-size:26px!important}\n  #darTestBrandHeaderV1 .dtbh-tagline{font-size:11px!important}\n}\n@media(max-width:359px){\n  #darTestBrandHeaderV1 .dtbh-row{gap:6px!important}\n  #darTestBrandHeaderV1 .dtbh-logo{width:44px!important;height:44px!important;flex-basis:44px!important}\n  #darTestBrandHeaderV1 .dtbh-toggle{width:40px!important;height:40px!important;flex-basis:40px!important}\n  #darTestBrandHeaderV1 .dtbh-name{font-size:clamp(15px,4.9vw,19px)!important}\n  #darTestBrandHeaderV1 .dtbh-tagline{font-size:9px!important}\n}\n\n/* ADULT_BRAND_COMPACT_TOP_V3_20261021\n * Actual V4.7 / V4.8 duplicate: #darHomeV47Leadin + .header-row--brand-only.\n * Keep the original native prayer DOM and its live updater.\n * No extra scroll container, no gesture interception, no changes to status-bar pixels. */\n@media(max-width:699px){\n  #darTestBrandHeaderV1{\n    padding-top:max(env(safe-area-inset-top,0px),var(--dar-native-safe-top,0px))!important;\n    padding-bottom:4px!important;\n    padding-inline:clamp(10px,3vw,14px)!important;\n    min-height:0!important;\n  }\n  #darTestBrandHeaderV1 .dtbh-row{\n    display:grid!important;\n    grid-template-columns:42px minmax(0,1fr) 42px!important;\n    grid-template-rows:auto 42px!important;\n    align-items:center!important;\n    gap:3px 9px!important;\n    min-height:0!important;\n    max-width:100%!important;\n  }\n  #darTestBrandHeaderV1 .dtbh-copy{display:contents!important}\n  #darTestBrandHeaderV1 .dtbh-tagline{\n    grid-column:1 / -1!important;grid-row:1!important;\n    display:block!important;\n    min-width:0!important;\n    margin:0 0 1px!important;\n    padding:0!important;\n    width:auto!important;\n    font:750 clamp(9px,2.65vw,11px)/1.22 system-ui,-apple-system,sans-serif!important;\n    letter-spacing:0!important;\n    text-transform:none!important;\n    color:var(--dtbh-muted)!important;\n    -webkit-text-fill-color:var(--dtbh-muted)!important;\n    opacity:1!important;\n    visibility:visible!important;\n    white-space:nowrap!important;\n  }\n  #darTestBrandHeaderV1 .dtbh-logo{\n    grid-row:2!important;grid-column:1!important;\n    width:42px!important;height:42px!important;\n    flex:0 0 42px!important;\n    object-fit:contain!important;\n  }\n  #darTestBrandHeaderV1 .dtbh-name{\n    grid-row:2!important;grid-column:2!important;\n    margin:0!important;\n    font:750 clamp(18px,5.4vw,24px)/1.08 Georgia,\"Iowan Old Style\",serif!important;\n    letter-spacing:-.025em!important;\n    white-space:nowrap!important;\n  }\n  #darTestBrandHeaderV1 .dtbh-toggle{\n    grid-row:2!important;grid-column:3!important;\n    width:40px!important;height:40px!important;\n    flex:0 0 40px!important;\n    border-radius:12px!important;\n  }\n}\n@media(min-width:700px){\n  #darTestBrandHeaderV1{padding-bottom:8px!important}\n  #darTestBrandHeaderV1 .dtbh-logo{width:46px!important;height:46px!important;flex-basis:46px!important}\n  #darTestBrandHeaderV1 .dtbh-copy{display:flex!important;flex-direction:column!important;gap:3px!important}\n  #darTestBrandHeaderV1 .dtbh-tagline{order:0!important;display:block!important;visibility:visible!important}\n  #darTestBrandHeaderV1 .dtbh-name{order:1!important;font-size:24px!important}\n  #darTestBrandHeaderV1 .dtbh-row{min-height:48px!important}\n}\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header > #darHomeV47Leadin,\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header > .dar-v47-leadin,\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header .header-row--brand-only{\n display:none!important;\n visibility:hidden!important;\n max-height:0!important;height:0!important;min-height:0!important;\n margin:0!important;padding:0!important;border:0!important;\n overflow:hidden!important;\n}\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell{\n padding-top:0!important;margin-top:0!important;\n}\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header{\n padding-top:0!important;\n min-height:0!important;\n margin-top:0!important;\n row-gap:0!important;\n}\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header #headerPrayerStatus.header-prayer-hub{\n order:-10!important;\n margin-top:4px!important;\n}\nhtml:has(#darTestBrandHeaderV1) body.is-home-route .top-shell .header .hero-text{\n display:none!important;\n}\n</style><script id=\"darTestGlobalBrandHeaderScriptV1\">\n(function(){\n\"use strict\";\nif(!/^\\/test(?:\\/|$)/.test(location.pathname)||/^\\/test\\/kids(?:\\/|$)/.test(location.pathname))return;\nif(window.__DAR_TEST_GLOBAL_BRAND_HEADER_V1)return;\nwindow.__DAR_TEST_GLOBAL_BRAND_HEADER_V1=true;\nvar OPTIONS=[[\"light\",\"Hell\",\"#f8f2e5\"],[\"soft\",\"Sanft Elegant\",\"#eacbc9\"],[\"eisgold\",\"Eisgold\",\"#d4b76c\"],[\"salbei\",\"Salbei Elfenbein\",\"#a1bca9\"],[\"dark\",\"Klassisch Dunkel\",\"#141a15\"],[\"royal\",\"Royal Nachtblau\",\"#112f4f\"],[\"bordeaux\",\"Bordeaux Royal\",\"#592d42\"],[\"dar-al-layl\",\"Dār al-Layl\",\"#1c3328\"]];\nfunction start(){\n if(document.getElementById(\"darTestBrandHeaderV1\"))return;\n var app=document.querySelector(\"body > .app\")||document.querySelector(\".app\");\n if(!app||!document.body)return;\n var header=document.createElement(\"header\");\n header.id=\"darTestBrandHeaderV1\";\n header.setAttribute(\"aria-label\",\"DĀR AL TAWḤĪD · App-Kopf\");\n header.innerHTML='<div class=\"dtbh-row\"><img class=\"dtbh-logo\" alt=\"DĀR AL TAWḤĪD Logo\"><div class=\"dtbh-copy\"><span class=\"dtbh-tagline\">Beiträge nach Qurʾān, Sunnah und Āthār</span><strong class=\"dtbh-name\">DĀR AL TAWḤĪD</strong></div><button type=\"button\" class=\"dtbh-toggle\" aria-label=\"Erscheinungsbild auswählen\" title=\"Erscheinungsbild auswählen\" aria-haspopup=\"true\" aria-expanded=\"false\" aria-controls=\"darTestBrandPaletteV1\"><svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 3a9 9 0 0 0 0 18c2 0 3.4-1.6 3.4-3.1 0-1.1-.9-1.8-.9-2.6 0-.8.7-1.4 1.8-1.4h1.8a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z\"></path><circle cx=\"7.6\" cy=\"10\" r=\"1\"></circle><circle cx=\"10.8\" cy=\"6.7\" r=\"1\"></circle><circle cx=\"6.9\" cy=\"14.1\" r=\"1\"></circle></svg></button></div><div id=\"darTestBrandPaletteV1\" class=\"dtbh-panel\" role=\"group\" aria-label=\"Erscheinungsbild\" hidden><span class=\"dtbh-panel-title\">Erscheinungsbild auswählen</span><div class=\"dtbh-grid\"></div></div>';\n document.body.insertBefore(header,document.body.firstChild);\n var logo=header.querySelector(\".dtbh-logo\");\n function syncLogo(){\n  var original=document.querySelector(\".top-shell img.logo,.top-shell .brand img.logo\");\n  var src=original&&(original.getAttribute(\"src\")||original.currentSrc);\n  if(src&&logo.getAttribute(\"src\")!==src)logo.setAttribute(\"src\",src);\n  else if(!logo.getAttribute(\"src\"))logo.setAttribute(\"src\",\"/app-icon-512.png\");\n }\n syncLogo();\n var spacer=document.createElement(\"div\");\n spacer.id=\"darTestBrandHeaderSpacerV1\";\n spacer.setAttribute(\"aria-hidden\",\"true\");\n app.insertBefore(spacer,app.firstChild);\n function sizing(){\n  var height=Math.ceil(header.getBoundingClientRect().height);\n  if(height>0&&height<250)document.documentElement.style.setProperty(\"--dar-test-brand-header-height\",height+\"px\");\n }\n if(typeof ResizeObserver===\"function\")new ResizeObserver(sizing).observe(header);\n window.addEventListener(\"resize\",sizing,{passive:true});\n var panel=header.querySelector(\".dtbh-panel\");\n var toggle=header.querySelector(\".dtbh-toggle\");\n var grid=header.querySelector(\".dtbh-grid\");\n OPTIONS.forEach(function(item){\n  var btn=document.createElement(\"button\");\n  btn.type=\"button\";btn.className=\"dtbh-choice\";btn.setAttribute(\"data-dtbh-theme\",item[0]);\n  var swatch=document.createElement(\"span\");swatch.className=\"dtbh-swatch\";swatch.style.background=item[2];swatch.setAttribute(\"aria-hidden\",\"true\");\n  var name=document.createElement(\"span\");name.textContent=item[1];\n  btn.appendChild(swatch);btn.appendChild(name);grid.appendChild(btn);\n });\n function current(){\n  var root=document.documentElement;\n  return root.getAttribute(\"data-theme-variant\")===\"salbei\"?\"salbei\":root.getAttribute(\"data-theme\")||\"dark\";\n }\n function refresh(){\n  var value=current();\n  grid.querySelectorAll(\".dtbh-choice\").forEach(function(button){button.setAttribute(\"aria-pressed\",String(button.getAttribute(\"data-dtbh-theme\")===value));});\n }\n function close(){panel.hidden=true;toggle.setAttribute(\"aria-expanded\",\"false\");}\n toggle.addEventListener(\"click\",function(e){\n  e.stopPropagation();panel.hidden=!panel.hidden;toggle.setAttribute(\"aria-expanded\",String(!panel.hidden));refresh();\n });\n grid.addEventListener(\"click\",function(e){\n  var btn=e.target.closest(\"[data-dtbh-theme]\");if(!btn)return;\n  var value=btn.getAttribute(\"data-dtbh-theme\");close();\n  var existing=document.querySelector('.theme-switch-btn[data-theme-select=\"'+value+'\"]');\n  if(existing){existing.click();refresh();return;}\n  try{\n   if(typeof applyTheme===\"function\"){applyTheme(value);refresh();return;}\n   if(typeof window.applyTheme===\"function\"){window.applyTheme(value);refresh();return;}\n  }catch(_){}\n  try{if(typeof navigate===\"function\")navigate(\"settings\",\"appearance\");else location.hash=\"#settings\";}catch(_){location.hash=\"#settings\";}\n });\n document.addEventListener(\"click\",function(e){if(!header.contains(e.target))close();});\n document.addEventListener(\"keydown\",function(e){if(e.key===\"Escape\"&&!panel.hidden){close();toggle.focus();}});\n new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:[\"data-theme\",\"data-theme-variant\"]});\n document.addEventListener(\"dar:view-rendered\",syncLogo);\n window.addEventListener(\"pageshow\",syncLogo);\n document.documentElement.classList.add(\"dar-test-global-brand-ready\");\n refresh();sizing();\n document.dispatchEvent(new Event(\"dar:brand-header-mounted\"));\n}\nif(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",start,{once:true});\nelse start();\n})();\n\n/* DAR_TEST_PRAYER_FIRST_V2: preserve existing prayer content and native scroller. */\n(function(){\nif(!/^\\/test(?:\\/|$)/.test(location.pathname))return;\nvar pending=false;\nfunction order(){\n if(!document.body||!document.body.classList.contains(\"is-home-route\"))return;\n var h=document.querySelector(\".top-shell .header\"),p=h&&h.querySelector(\"#headerPrayerStatus\");\n if(p&&h.firstElementChild!==p)h.insertBefore(p,h.firstElementChild);\n}\nfunction schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;order();});}\ndocument.addEventListener(\"dar:view-rendered\",schedule);\nwindow.addEventListener(\"hashchange\",schedule);\nwindow.addEventListener(\"pageshow\",schedule);\nfunction boot(){schedule();var h=document.querySelector(\".top-shell .header\");if(h)new MutationObserver(schedule).observe(h,{childList:true});}\nif(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",boot,{once:true});else boot();\n})();\n</script>";
    html = html.includes("</html>") ? html.replace("</html>", brandHeaderAssets + "</html>") : html + brandHeaderAssets;
  }

  // DAR_TEST_PREMIUM_HEADER_V2_20261023: /test/ only.
  // Enhance the original brand bar without changing its palette handler,
  // account routes, language availability, prayer updater or spacer.
  const premiumHeaderAssets =
    '<link rel="stylesheet" id="darTestPremiumHeaderCssV2" href="/test/assets/dar-test-premium-header-v2.css?v=20261030-duo-compact-v1">' +
    '<script defer id="darTestPremiumHeaderJsV2" src="/test/assets/dar-test-premium-header-v2.js?v=20261030-smart-v3"><\/script>';
  if (!html.includes('id="darTestPremiumHeaderJsV2"')) {
    const at = html.lastIndexOf("</html>");
    html = at >= 0 ? html.slice(0, at) + premiumHeaderAssets + html.slice(at) : html + premiumHeaderAssets;
  }
  const headers = new Headers(asset.headers);
  headers.set("X-DAR-Test-Scroll-Boundary", "v3");
  headers.set("X-DAR-Test-Home", "html-parity-v50-20261020");
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
  // Free-Tier-compatible Gemini primary-source discovery; Groq never searches unsourced facts.
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
  if (gemini.ok) return send({
    ok:true, answer:gemini.answer, usedSourceCount:topicSources.length,
    mode:"source_bound", answerMode:mode, provider:"gemini",
    policyVersion:ILM_SCIENCE_POLICY_VERSION
  });
  // Groq fallback is unlocked only if user independently confirms the
  // Groq account is Free, the key is stored as a Cloudflare secret, and
  // rate-limit bindings are installed. No chargeable model is called by default.
  const groq = await composeIlmWithGroqFree(request, env, question, topicSources, mode);
  if (groq.ok) return send({
    ok:true,answer:groq.answer,usedSourceCount:topicSources.length,
    mode:"source_bound",answerMode:mode,provider:"groq",
    policyVersion:ILM_SCIENCE_POLICY_VERSION
  });
  return send({
    ok:false,error:gemini.limited?"gemini_quota_exhausted":"evidence_compose_unavailable",
    provider:"gemini",usedSourceCount:topicSources.length,sourceBound:true,
    fallback:groq.reason||"not_active"
  },gemini.limited?429:503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/test/api/ilm/compose") return ilmScienceCompose(request, env);
    if (url.pathname === "/test/api/ilm/research") return ilmOpenResearch(request, env);
    // Owner Academy V19 is handled BEFORE generic Basic-Auth / Kids redirects.
    // A signed HttpOnly cookie authorizes only Academy assets and never child accounts.
    // Test Layout Editor login, isolated from KIDS Academy owner privileges.
    const editorAccess = await layoutEditorAccess(request,url,env);
    if(editorAccess instanceof Response)return editorAccess;
    // V3 Editor: return one prebuilt, self-contained HTML page only after
    // successful server-side password validation. Avoid dynamic ASSETS.fetch
    // on POST, which could return 503 on iPad and mask the real editor.
    // The public Test/Kids/Visitor applications are not modified here.
    if(editorAccess && editorAccess.renderEditor===true) {
      return new Response(EDITOR_STUDIO_HTML,{
        status:200,
        headers:{
          "Content-Type":"text/html; charset=utf-8",
          "Cache-Control":"private, no-store, max-age=0",
          "CDN-Cache-Control":"no-store",
          "X-Content-Type-Options":"nosniff",
          "X-Frame-Options":"DENY",
          "X-Robots-Tag":"noindex,nofollow,noarchive",
          "Referrer-Policy":"same-origin"
        }
      });
    }
    if(editorAccess===true){
      const mapped=academyOwnerAssetPath(url.pathname);
      if(!mapped)return new Response("Not found",{status:404});
      const destination=new URL(request.url);destination.pathname=mapped;
      const asset=await env.ASSETS.fetch(new Request(destination.toString(),request));
      const headers=new Headers(asset.headers);
      headers.set("Cache-Control","private, no-store, max-age=0");
      headers.set("CDN-Cache-Control","no-store");
      headers.set("X-Robots-Tag","noindex, nofollow, noarchive");
      headers.set("X-Content-Type-Options","nosniff");
      return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
    }
    const ownerAccess = await academyOwnerAccess(request, url, env);
    if (ownerAccess instanceof Response) return ownerAccess;
    if (ownerAccess === true) {
      const ownerUrl = new URL(request.url);
      ownerUrl.pathname = academyOwnerAssetPath(url.pathname);
      const asset = await env.ASSETS.fetch(new Request(ownerUrl.toString(), request));
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      headers.set("X-Frame-Options", "DENY");
      if (request.method === "HEAD") return new Response(null, { status: asset.status, statusText: asset.statusText, headers });
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }
    const gated = gateHiddenSurfaces(request, url, env, "live");
    if (gated) return gated;


    // DAR_TEST_PWA_REPAIR_WORKER_FIRST_DIRECT_200_20261016
    // Cloudflare static asset HTML handling can 307 /test/repair.html before
    // JS has an opportunity to clear the broken installed PWA cache. Deliver
    // the standalone repair entry directly, with no redirect and no app boot.
    // This handler is restricted to the ADULT TEST path and touches no other app.
    if ((url.pathname === "/test/repair.html" || url.pathname === "/test/repair") &&
        (request.method === "GET" || request.method === "HEAD")) {
      const repairHtml = "<!doctype html>\n<html lang=\"de\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <meta name=\"theme-color\" content=\"#081b1b\">\n  <meta http-equiv=\"Cache-Control\" content=\"no-store\">\n  <title>DĀR AL TAWḤĪD · Test-App wieder öffnen</title>\n  <style>\n    :root{color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}\n    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#081b1b;color:#f7f1e2}\n    body{min-height:100svh;display:grid;place-items:center;padding:calc(24px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom))}\n    main{width:min(100%,430px);padding:30px 24px;border:1px solid #a3915a75;border-radius:20px;background:linear-gradient(145deg,#112c2b,#071414);box-shadow:0 22px 80px #0005;text-align:center}\n    .mark{font-size:12px;letter-spacing:.17em;color:#d7c48d;font-weight:700}\n    h1{font-size:23px;line-height:1.28;margin:18px 0 12px}\n    p{font-size:15px;line-height:1.65;color:#e0e1d6;margin:0 0 20px}\n    button,a.action{appearance:none;border:1px solid #e8d69e;background:#d5bd7e;color:#14241e;font-size:16px;font-weight:700;padding:15px 18px;border-radius:12px;display:block;text-align:center;width:100%;text-decoration:none;cursor:pointer;min-height:52px}\n    button:disabled{opacity:.55;cursor:wait}\n    a.action{background:transparent;color:#e8d69e;margin-top:12px}\n    #status{min-height:44px;font-size:14px;color:#ddd6b9;margin:18px 0 0;overflow-wrap:anywhere}\n    small{display:block;margin-top:10px;color:#afb9ac;line-height:1.5}\n  </style>\n</head>\n<body>\n<main>\n  <div class=\"mark\">DĀR AL TAWḤĪD · TEST</div>\n  <h1>Test-App wieder öffnen</h1>\n  <p>Wenn die Test-App nach einer Aktualisierung nicht startet, können veraltete Test-Dateien zurückgesetzt werden. Gespeicherte Einstellungen und Lernstände bleiben erhalten.</p>\n  <button type=\"button\" id=\"repair\">Test-App reparieren</button>\n  <a class=\"action\" href=\"/test/index.html?env=staging&amp;source=repair#home\">Ohne Reparatur öffnen</a>\n  <div id=\"status\" role=\"status\" aria-live=\"polite\">Nur Test-App-Dateien werden bereinigt. Die öffentliche App und KIDS bleiben unverändert.</div>\n  <small>Die Reparatur löscht weder Anmeldedaten noch localStorage, IndexedDB oder sonstige Nutzerdaten.</small>\n</main>\n<script>\n(function(){\n \"use strict\";\n var button=document.getElementById(\"repair\");\n var status=document.getElementById(\"status\");\n function say(s){status.textContent=s;}\n async function repair(){\n   button.disabled=true;\n   say(\"Test-App-Cache wird bereinigt …\");\n   var deleted=0, removed=0, errors=0;\n   try{\n     if(\"serviceWorker\" in navigator){\n       var registrations=await navigator.serviceWorker.getRegistrations();\n       for(var i=0;i<registrations.length;i++){\n         var registration=registrations[i];\n         try{\n           var scope=new URL(registration.scope);\n           // Never unregister the shared / service worker or any /kids registration.\n           if(scope.origin===location.origin && scope.pathname.indexOf(\"/test/\")===0 && scope.pathname.indexOf(\"/test/kids/\")!==0){\n             if(await registration.unregister())removed++;\n           }\n         }catch(_e){errors++;}\n       }\n     }\n   }catch(_e){errors++;}\n   try{\n     if(\"caches\" in window){\n       var names=await caches.keys();\n       for(var j=0;j<names.length;j++){\n         var name=names[j];\n         try{\n           if(/^dar-test(?:-|$)/i.test(name)){\n             if(await caches.delete(name))deleted++;\n             continue;\n           }\n           // Mixed caches may also contain public visitor entries: preserve them.\n           var cache=await caches.open(name);\n           var requests=await cache.keys();\n           for(var k=0;k<requests.length;k++){\n             try{\n               var url=new URL(requests[k].url);\n               if(url.origin===location.origin && (url.pathname===\"/test\" || (url.pathname.indexOf(\"/test/\")===0 && url.pathname.indexOf(\"/test/kids/\")!==0))){\n                 if(await cache.delete(requests[k]))deleted++;\n               }\n             }catch(_e){errors++;}\n           }\n         }catch(_e){errors++;}\n       }\n     }\n   }catch(_e){errors++;}\n   say(\"Bereinigt: \"+deleted+\" Test-Dateien, \"+removed+\" Test-Service-Worker. Die App wird neu geöffnet …\");\n   // Bypass the old manifest query without changing the user's installation or data.\n   location.replace(\"/test/index.html?env=staging&source=repair&recovery=\"+Date.now()+\"#home\");\n }\n button.addEventListener(\"click\",function(){repair().catch(function(e){\n   say(\"Automatische Bereinigung nicht möglich. Bitte direkt öffnen oder Safari verwenden.\");\n   button.disabled=false;\n });});\n})();\n</script>\n</body>\n</html>\n";
      return new Response(request.method === "HEAD" ? null : repairHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer"
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return Response.redirect(`${url.origin}/test/${url.search || ""}`, 302);
    }

    // DAR_TEST_PWA_BOOT_RECOVERY_20261016
    // /test and /test/ must retain their original PWA start URL/query.
    // In particular, never inject ?dqp=915 after enabling run_worker_first
    // for the HTML shell: it can conflict with the installed PWA launch URL.
    // Serve the real HTML below, preserving its existing imagery/icons.

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

    // DAR_TEST_KIDS_QUIZ_ISOLATED_V1: user-authorized KIDS preview.
    // Do NOT redirect /test/kids to the visitor production origin.
    // HTML, JS, CSS, 450 published question pack, and PWA storage all
    // run under the separate DAR Test workers.dev origin.
    // No unpublished/review-only MP3 files are copied into live assets.
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/test/kids" || url.pathname === "/test/kids/" || url.pathname.startsWith("/test/kids/"))
    ) {
      const previewOrigin = "https://dar-al-tawhid-test.sero91ak.workers.dev";
      let path = url.pathname.replace(/^\/test\/kids/, "/kids");
      if (path === "/kids" || path === "/kids/" || path === "/kids/start.html" || path === "/kids/quiz") {
        path = "/kids/start";
      }
      const target = new URL(path, previewOrigin);
      // No untrusted credential/query copying into the preview URL.
      const headers = new Headers({
        "Location": target.toString(),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
      });
      return new Response(null, { status: 302, headers });
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
