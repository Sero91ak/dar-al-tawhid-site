import { isVoiceConfigured, synthesizeDarVoice } from "./video-studio/voice.js";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 8;
const RATE_MAX_CHARS = 12000;
const rateBuckets = new Map();

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertVoiceStudioOrigin(request, env) {
  const origin = String(request.headers.get("Origin") || "").trim();
  const referer = String(request.headers.get("Referer") || "").trim();
  const allowed = String(env.ALLOWED_ORIGIN || "https://dar-al-tawhid.de").replace(/\/$/, "");
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);
  const validOrigin = origin === allowed || origin === "https://www.dar-al-tawhid.de" || local;
  if (!validOrigin) throw httpError("Voice Studio Anfrage nicht erlaubt", 403);

  if (referer && !local) {
    const validReferer =
      referer.startsWith(allowed + "/voice-studio/") ||
      referer.startsWith("https://www.dar-al-tawhid.de/voice-studio/");
    if (!validReferer) throw httpError("Voice Studio Referer nicht erlaubt", 403);
  }
}

function assertVoiceRateLimit(request, chars) {
  const key =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { requests: 0, chars: 0, resetAt: now + RATE_WINDOW_MS };
  }
  bucket.requests += 1;
  bucket.chars += Math.max(0, Number(chars || 0));
  rateBuckets.set(key, bucket);
  if (bucket.requests > RATE_MAX_REQUESTS || bucket.chars > RATE_MAX_CHARS) {
    throw httpError("Voice Studio Rate-Limit erreicht – bitte einige Minuten warten", 429);
  }
}

function looksLikeLongArabicRecitation(text) {
  const value = String(text || "");
  const arabicChars = (value.match(/[\u0600-\u06ff]/g) || []).length;
  if (arabicChars < 24) return false;

  let run = 0;
  let maxRun = 0;
  let arabicTokens = 0;
  const punctuation = /^[\.,،؛:!?؟…·\-–—()\[\]{}«»"“”„‘’]+$/;

  for (const token of value.match(/\S+/g) || []) {
    const hasArabic = /[\u0600-\u06ff]/.test(token);
    const hasLatin = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(token);
    if (hasArabic && !hasLatin) {
      run += 1;
      arabicTokens += 1;
      maxRun = Math.max(maxRun, run);
    } else if (punctuation.test(token)) {
      continue;
    } else {
      run = 0;
    }
  }

  const letters = (value.match(/[A-Za-zÀ-ÖØ-öø-ÿ\u0600-\u06ff]/g) || []).length;
  const arabicRatio = arabicChars / Math.max(1, letters);
  return maxRun >= 4 || (arabicRatio >= 0.70 && arabicTokens >= 4);
}

export async function handleVoiceStudioWebRequest(request, env, cors) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/voice-studio/api")) return null;
  const rest = url.pathname.slice("/voice-studio/api".length) || "/";

  if (request.method === "GET" && rest === "/health") {
    const configured = isVoiceConfigured(env);
    return json({
      ok: configured,
      service: "dar-voice-studio-cloud",
      provider: configured ? "ElevenLabs Cloud" : "Cloud Voice nicht konfiguriert",
      voiceConfigured: configured,
      localEngineRequired: false,
      output: "audio/mpeg"
    }, cors, configured ? 200 : 503);
  }

  if (request.method === "POST" && rest === "/generate") {
    assertVoiceStudioOrigin(request, env);
    const body = await request.json().catch(() => ({}));
    const original = String(body.text || "").trim();
    const prepared = String(body.prepared || original).trim();

    if (!original || !prepared) return json({ ok: false, error: "Text fehlt." }, cors, 400);
    if (original.length > 5000 || prepared.length > 5000) {
      return json({ ok: false, error: "Text ist zu lang. Maximal 5.000 Zeichen pro Audio." }, cors, 413);
    }
    if (looksLikeLongArabicRecitation(original)) {
      return json({
        ok: false,
        error: "Qurʾān-/Rezitationsaudio wird nicht synthetisch erzeugt. Verwende dafür eine echte Rezitation."
      }, cors, 422);
    }
    if (!isVoiceConfigured(env)) {
      return json({
        ok: false,
        error: "Die Cloud-Stimme ist serverseitig noch nicht verbunden.",
        setupRequired: true
      }, cors, 503);
    }

    assertVoiceRateLimit(request, prepared.length);
    const result = await synthesizeDarVoice(env, prepared);
    if (!result.ok) {
      return json({
        ok: false,
        error: result.reason || "Audio konnte nicht erzeugt werden.",
        setupRequired: Boolean(result.setupRequired)
      }, cors, result.setupRequired ? 503 : 502);
    }

    return new Response(result.bytes, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": result.contentType || "audio/mpeg",
        "Content-Disposition": 'inline; filename="dar-serhat-voice.mp3"',
        "Cache-Control": "no-store, max-age=0",
        "X-DAR-Voice-Engine": "cloud-v1"
      }
    });
  }

  return json({ ok: false, error: "Voice Studio Route nicht gefunden" }, cors, 404);
}
