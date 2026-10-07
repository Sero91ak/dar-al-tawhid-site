// owner-voice-config-recovery-20261004
import { elevenKey, isVoiceConfigured, synthesizeDarVoice } from "./video-studio/voice.js";
import { darVoiceGpuConfigured, darVoiceGpuPublicStatus, darVoiceWebAccessConfigured, darVoiceWebAuthorized, darVoiceWebCodeAuthorized, darVoiceWebSessionCookie, proxyDarVoiceGpuRequest } from "./voice-studio-gpu-gateway.js";

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
  const validReferer =
    !referer ||
    referer.startsWith(allowed + "/voice-studio/") ||
    referer.startsWith("https://www.dar-al-tawhid.de/voice-studio/") ||
    referer.startsWith(allowed + "/voice/") ||
    referer.startsWith("https://www.dar-al-tawhid.de/voice/") ||
    referer.startsWith(allowed + "/kids/") ||
    referer.startsWith("https://www.dar-al-tawhid.de/kids/");
  const validOrigin =
    origin === allowed ||
    origin === "https://www.dar-al-tawhid.de" ||
    local ||
    (!origin && Boolean(referer) && validReferer);
  if (!validOrigin) throw httpError("Voice Studio Anfrage nicht erlaubt", 403);
  if (referer && !local && !validReferer) throw httpError("Voice Studio Referer nicht erlaubt", 403);
}

function isOwnerAutomationAuthorized(request, env) {
  const supplied = String(request.headers.get("X-Admin-Secret") || "").trim();
  const expected = String(env.ADMIN_PUBLISH_SECRET || "").trim();
  return Boolean(supplied && expected && supplied === expected);
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
  return (maxRun >= 8 && arabicTokens >= 16) || (arabicRatio >= 0.70 && arabicTokens >= 8);
}

function splitStoryParagraphsWithOffsets(text) {
  const value = String(text || "");
  const rows = [];
  const re = /(?:^|\n\s*\n)([^\n](?:[\s\S]*?))(?=\n\s*\n|$)/g;
  let match;
  while ((match = re.exec(value))) {
    const raw = String(match[1] || "");
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const local = raw.indexOf(trimmed);
    rows.push({
      text: trimmed,
      startOffset: Math.max(0, match.index + (match[0].length - raw.length) + Math.max(0, local))
    });
  }
  if (!rows.length && value.trim()) {
    rows.push({ text: value.trim(), startOffset: value.indexOf(value.trim()) });
  }
  return rows;
}

function paragraphTimingsFromForcedAlignment(text, characters) {
  const paragraphs = splitStoryParagraphsWithOffsets(text);
  const chars = Array.isArray(characters) ? characters : [];
  if (!paragraphs.length || !chars.length) return [];

  const joined = chars.map((row) => String(row?.text ?? "")).join("");
  const direct = joined === String(text || "");
  let cursor = 0;
  const starts = paragraphs.map((paragraph, index) => {
    let charIndex = -1;
    if (direct) {
      charIndex = Math.max(0, Math.min(chars.length - 1, paragraph.startOffset));
    } else {
      const probe = paragraph.text.slice(0, Math.min(80, paragraph.text.length));
      const hit = joined.indexOf(probe, cursor);
      if (hit >= 0) charIndex = hit;
      else {
        const ratio = paragraph.startOffset / Math.max(1, String(text || "").length);
        charIndex = Math.max(0, Math.min(chars.length - 1, Math.round(ratio * (chars.length - 1))));
      }
    }
    while (charIndex < chars.length - 1 && /^\s*$/.test(String(chars[charIndex]?.text ?? ""))) charIndex += 1;
    cursor = Math.max(cursor, charIndex);
    const start = Number(chars[charIndex]?.start);
    return {
      paragraphIndex: index,
      start: Number.isFinite(start) ? Math.max(0, start) : 0,
      charIndex
    };
  });

  return starts.map((row, index) => {
    const next = starts[index + 1];
    let end;
    if (next) {
      end = next.start;
    } else {
      const last = chars[chars.length - 1] || {};
      const lastEnd = Number(last.end);
      end = Number.isFinite(lastEnd) ? Math.max(row.start, lastEnd) : row.start;
    }
    return {
      paragraphIndex: row.paragraphIndex,
      start: Number(row.start.toFixed(3)),
      end: Number(Math.max(row.start, end).toFixed(3))
    };
  });
}

async function alignStoryAudio(env, file, text) {
  const key = elevenKey(env);
  if (!key) throw httpError("ElevenLabs API-Key fehlt für die Mitlese-Synchronisierung.", 503);
  if (!(file instanceof File) && !(file instanceof Blob)) throw httpError("Audiodatei fehlt.", 400);
  if (!String(text || "").trim()) throw httpError("Story-Text fehlt.", 400);
  if (file.size > 64 * 1024 * 1024) throw httpError("Audiodatei ist größer als 64 MB.", 413);

  const form = new FormData();
  form.append("file", file, String(file.name || "story-audio"));
  form.append("text", String(text));

  const res = await fetch("https://api.elevenlabs.io/v1/forced-alignment", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw httpError("Mitlese-Synchronisierung fehlgeschlagen: " + (detail || ("HTTP " + res.status)).slice(0, 300), res.status === 422 ? 422 : 502);
  }
  const payload = await res.json();
  const timings = paragraphTimingsFromForcedAlignment(text, payload?.characters || []);
  if (!timings.length) throw httpError("Keine gültigen Absatz-Zeitstempel erhalten.", 502);
  return {
    timings,
    loss: Number.isFinite(Number(payload?.loss)) ? Number(payload.loss) : null,
    words: Array.isArray(payload?.words) ? payload.words.length : 0,
    characters: Array.isArray(payload?.characters) ? payload.characters.length : 0,
    wordAlignment: Array.isArray(payload?.words) ? payload.words : [],
    characterAlignment: Array.isArray(payload?.characters) ? payload.characters : []
  };
}

export async function handleVoiceStudioWebRequest(request, env, cors) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/voice-studio/api")) return null;
  const rest = url.pathname.slice("/voice-studio/api".length) || "/";

  if (request.method === "POST" && rest === "/access") {
    assertVoiceStudioOrigin(request, env);
    if (!darVoiceWebAccessConfigured(env)) {
      return json({
        ok: false,
        error: "DĀR Voice Cloud-Zugang ist serverseitig noch nicht aktiviert.",
        accessSetupRequired: true
      }, cors, 503);
    }
    const body = await request.json().catch(() => ({}));
    const code = String(body.code || request.headers.get("X-DAR-Voice-Access") || "").trim();
    if (!darVoiceWebCodeAuthorized(code, env)) {
      return json({ ok: false, error: "DĀR Voice Zugangscode ist nicht korrekt.", accessRequired: true }, cors, 401);
    }
    const cookie = await darVoiceWebSessionCookie(env);
    return new Response(JSON.stringify({ ok: true, session: "httpOnly", expiresInSeconds: 2592000 }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Set-Cookie": cookie
      }
    });
  }

  if (rest === "/engine" || rest.startsWith("/engine/")) {
    assertVoiceStudioOrigin(request, env);
    if (!darVoiceWebAccessConfigured(env)) {
      return json({
        ok: false,
        error: "DĀR Voice Cloud-Zugang ist serverseitig noch nicht aktiviert.",
        accessSetupRequired: true
      }, cors, 503);
    }
    if (!(await darVoiceWebAuthorized(request, env))) {
      return json({
        ok: false,
        error: "DĀR Voice Zugangscode erforderlich.",
        accessRequired: true
      }, cors, 401);
    }
    const enginePath = rest.slice("/engine".length) || "/";
    return proxyDarVoiceGpuRequest(request, env, cors, enginePath);
  }

  if (request.method === "GET" && rest === "/mobile-release") {
    return json({
      ok: true,
      version: "2.9.121",
      cache: "dar-voice-studio-v90",
      installUrl: "https://dar-al-tawhid.de/voice-studio/mobile.html?app=1&cloud=1&v=29121",
      serviceWorker: "/voice-studio/sw-v11.js",
      forceRefresh: true,
      localEngineRequired: false
    }, cors, 200);
  }

  if (request.method === "GET" && rest === "/health") {
    const gpu = darVoiceGpuPublicStatus(env);
    const elevenConfigured = isVoiceConfigured(env);
    const configured = darVoiceGpuConfigured(env) || elevenConfigured;
    return json({
      ok: configured,
      service: "dar-voice-studio-cloud",
      provider: gpu.configured ? "DĀR Voice Remote GPU" : (elevenConfigured ? "ElevenLabs Cloud" : "Cloud Voice nicht konfiguriert"),
      voiceConfigured: configured,
      elevenLabsConfigured: elevenConfigured,
      mobileCloudRevision: "2.9.121",
      remoteGpu: gpu,
      localEngineRequired: false,
      output: gpu.configured ? "engine-native" : "audio/mpeg",
      ownerBatchEnabled: true,
      storyAlignment: "elevenlabs-forced-alignment-v1"
    }, cors, configured ? 200 : 503);
  }

  if (request.method === "POST" && rest === "/align-story") {
    assertVoiceStudioOrigin(request, env);
    if (!isOwnerAutomationAuthorized(request, env)) {
      return json({ ok: false, error: "Owner-Freigabe für Story-Synchronisierung fehlt." }, cors, 401);
    }
    if (!elevenKey(env)) {
      return json({ ok: false, error: "ElevenLabs API-Key fehlt serverseitig für die Mitlese-Synchronisierung.", setupRequired: true }, cors, 503);
    }
    try {
      const form = await request.formData();
      const file = form.get("file");
      const text = String(form.get("text") || "").trim();
      const detail = String(form.get("detail") || "").trim();
      const result = await alignStoryAudio(env, file, text);
      return json({
        ok: true,
        timings: result.timings,
        alignmentLoss: result.loss,
        alignedWords: result.words,
        alignedCharacters: result.characters,
        characters: detail === "characters" ? result.characterAlignment : undefined,
        words: detail === "characters" ? result.wordAlignment : undefined,
        syncMode: "elevenlabs-forced-alignment-v1"
      }, cors, 200);
    } catch (error) {
      return json({ ok: false, error: error?.message || String(error) }, cors, Number(error?.status || 500));
    }
  }

  if (request.method === "POST" && (rest === "/generate" || rest === "/generate-with-timings")) {
    assertVoiceStudioOrigin(request, env);
    const includeTimings = rest === "/generate-with-timings";
    const body = await request.json().catch(() => ({}));
    const original = String(body.text || "").trim();
    const prepared = String(body.prepared || original).trim();
    const profile = String(body.profile || "").trim().toLowerCase();

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

    const ownerAutomation = isOwnerAutomationAuthorized(request, env);
    if (!ownerAutomation) assertVoiceRateLimit(request, prepared.length);
    const result = await synthesizeDarVoice(env, prepared, { profile, timestamps: includeTimings });
    if (!result.ok) {
      return json({
        ok: false,
        error: result.reason || "Audio konnte nicht erzeugt werden.",
        setupRequired: Boolean(result.setupRequired)
      }, cors, result.setupRequired ? 503 : 502);
    }

    if (includeTimings) {
      return json({
        ok: true,
        audioBase64: result.audioBase64 || "",
        alignment: result.alignment || null,
        normalizedAlignment: result.normalizedAlignment || null,
        contentType: result.contentType || "audio/mpeg",
        chars: result.chars || prepared.length,
        timingMode: "elevenlabs-character-alignment-v1"
      }, cors, 200);
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
