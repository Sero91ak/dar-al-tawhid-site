function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function normalizeArabic(value) {
  return String(value || "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/ٱ/g, "ا")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const cur = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        cur[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function similarity(a, b) {
  a = normalizeArabic(a);
  b = normalizeArabic(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const max = Math.max(a.length, b.length);
  return Math.max(0, 1 - levenshtein(a, b) / max);
}

function thresholdsForAge(age) {
  if (age === "4–5") return { green: 0.72, orange: 0.42 };
  if (age === "9–10") return { green: 0.88, orange: 0.60 };
  return { green: 0.81, orange: 0.52 };
}

function bestWordMatch(transcript, expected) {
  const words = normalizeArabic(transcript).split(/\s+/).filter(Boolean);
  let best = { heard: "", score: 0 };
  for (const word of words) {
    const score = similarity(word, expected);
    if (score > best.score) best = { heard: word, score };
  }
  if (!words.length && transcript) {
    const heard = normalizeArabic(transcript);
    best = { heard, score: similarity(heard, expected) };
  }
  return best;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

async function gradeRecitation(request, env) {
  if (!env.AI) return json({ ok: false, error: "ai_binding_missing" }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "invalid_form_data" }, 400);
  }

  const audio = form.get("audio");
  const expectedRaw = String(form.get("expected") || "").trim();
  const age = String(form.get("age") || "6–8").trim();
  const expected = normalizeArabic(expectedRaw);

  if (!audio || typeof audio.arrayBuffer !== "function") {
    return json({ ok: false, error: "audio_missing" }, 400);
  }
  if (!expected) return json({ ok: false, error: "expected_missing" }, 400);
  if (Number(audio.size || 0) > 2_500_000) {
    return json({ ok: false, error: "audio_too_large" }, 413);
  }

  const audioBuffer = await audio.arrayBuffer();
  if (!audioBuffer.byteLength) return json({ ok: false, error: "audio_empty" }, 400);

  let result;
  try {
    result = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio: arrayBufferToBase64(audioBuffer),
      task: "transcribe",
      language: "ar",
      vad_filter: true,
      condition_on_previous_text: false,
      initial_prompt: expectedRaw
    });
  } catch (error) {
    return json({
      ok: false,
      error: "transcription_failed",
      message: String(error && error.message ? error.message : error)
    }, 502);
  }

  const transcript = String(result && result.text ? result.text : "").trim();
  const best = bestWordMatch(transcript, expected);
  const thresholds = thresholdsForAge(age);
  let grade = "red";
  if (best.score >= thresholds.green) grade = "green";
  else if (best.score >= thresholds.orange) grade = "orange";

  return json({
    ok: true,
    expected: expectedRaw,
    transcript,
    heard: best.heard,
    score: Number(best.score.toFixed(4)),
    grade,
    thresholds
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const KIDS_SHELL_REV = "20260925-11-quran-mic-focus1";
    const isKidsPath = /^\/test\/kids(?:\/|$)/.test(url.pathname);

    if ((url.pathname === "/test/kids" || url.pathname === "/test/kids/") && url.searchParams.get("kv") !== KIDS_SHELL_REV) {
      url.pathname = "/test/kids/";
      url.searchParams.set("kv", KIDS_SHELL_REV);
      return new Response(null, {
        status: 302,
        headers: {
          "Location": url.toString(),
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      });
    }

    if (url.pathname === "/test/kids/api/recitation/health") {
      return json({
        ok: true,
        service: "dar-al-tawhid-kids-recitation",
        ai: Boolean(env.AI),
        model: "@cf/openai/whisper-large-v3-turbo"
      });
    }

    if (url.pathname === "/test/kids/api/recitation/grade") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return gradeRecitation(request, env);
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return Response.redirect(`${url.origin}/test/${url.search || ""}`, 302);
    }

    if (url.pathname === "/test/kids" || url.pathname === "/test/kids/") {
      const kidsUrl = new URL(request.url);
      kidsUrl.pathname = "/test/kids/index.html";
      return Response.redirect(kidsUrl.toString(), 302);
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

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const bust = isKidsPath
      || /\/test\/(index\.html)?$/.test(path)
      || /dar-quran-player\.(js|css)$/.test(path)
      || path.endsWith("/test/version.json")
      || path.endsWith("/test/service-worker.js");
    if (!bust || !asset) return asset;
    const out = new Response(asset.body, asset);
    out.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    out.headers.set("Pragma", "no-cache");
    if (isKidsPath) {
      out.headers.set("X-DAR-Kids-Build", "kids-shell-v11-creative1");
    }
    return out;
  }
};
