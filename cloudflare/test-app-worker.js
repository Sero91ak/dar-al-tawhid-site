import { gateHiddenSurfaces } from "./preview-gate.js";
const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v12-tab1052",
  label: "KIDS · V1.05.2"
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


const DAR_TEST_HOME_STYLE_V1183 = "/test/assets/dar-home-knowledge-library-v1183.css";
const DAR_TEST_HOME_SCRIPT_V1183 = "/test/assets/dar-home-knowledge-library-v1183.js";

async function injectDarTestHomeV1183(asset) {
  const type = String(asset && asset.headers && asset.headers.get("content-type") || "");
  if (!asset || !asset.ok || !type.includes("text/html")) return asset;
  let html = await asset.text();
  const cssTag = '<link rel="stylesheet" href="' + DAR_TEST_HOME_STYLE_V1183 + '">';
  const jsTag = '<script defer src="' + DAR_TEST_HOME_SCRIPT_V1183 + '"><\/script>';
  if (!html.includes(DAR_TEST_HOME_STYLE_V1183)) html = html.replace("</head>", cssTag + "\n</head>");
  if (!html.includes(DAR_TEST_HOME_SCRIPT_V1183)) html = html.replace("</body>", jsTag + "\n</body>");
  const headers = new Headers(asset.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.delete("Content-Length");
  return new Response(html, { status: asset.status, statusText: asset.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const gated = gateHiddenSurfaces(request, url, env, "workers-dev");
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
      target.searchParams.set("kv", "kids-shell-v12-tab1052");
      return Response.redirect(target.toString(), 301);
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const kidsPath = path === "/test/kids" || path.startsWith("/test/kids/");
    if (kidsPath) return asset;
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
