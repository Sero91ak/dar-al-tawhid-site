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
      referer.startsWith("https://www.dar-al-tawhid.de/voice-studio/") ||
      referer.startsWith(allowed + "/kids/") ||
      referer.startsWith("https://www.dar-al-tawhid.de/kids/");
    if (!validReferer) throw httpError("Voice Studio Referer nicht erlaubt", 403);
  }
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

export async function handleVoiceStudioWebRequest(request, env, cors, github = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/voice-studio/api")) return null;
  const rest = url.pathname.slice("/voice-studio/api".length) || "/";
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const githubGet = github.githubGet;
  const githubPut = github.githubPut;
  const base64ToUtf8 = github.base64ToUtf8;

  if (request.method === "GET" && rest === "/health") {
    const configured = isVoiceConfigured(env);
    const githubReady = Boolean(env.GITHUB_TOKEN);
    return json({
      ok: configured || githubReady,
      service: "dar-voice-studio-cloud",
      provider: configured ? "Cloud-Stimme + GitHub" : (githubReady ? "GitHub verbunden" : "Cloud Voice nicht konfiguriert"),
      voiceConfigured: configured,
      githubStorage: githubReady,
      appUrl: "https://dar-al-tawhid.de/voice-studio/",
      localEngineRequired: false,
      output: "audio/mpeg",
      ownerBatchEnabled: true
    }, cors, (configured || githubReady) ? 200 : 503);
  }

  if ((request.method === "GET" || request.method === "PUT") && rest === "/workspace") {
    assertVoiceStudioOrigin(request, env);
    if (!githubGet || !githubPut || !base64ToUtf8) {
      return json({ ok: false, error: "GitHub-Speicher ist serverseitig nicht angebunden." }, cors, 503);
    }
    const path = "voice-studio/workspace.json";
    if (request.method === "GET") {
      try {
        const file = await githubGet(env, owner, repo, path, branch);
        if (!file?.content) return json({ ok: true, workspace: { version: 1, text: "", prophetId: "" }, github: true }, cors);
        const workspace = JSON.parse(base64ToUtf8(file.content));
        return json({ ok: true, workspace, github: true, sha: file.sha }, cors);
      } catch (error) {
        return json({ ok: false, error: error.message || "GitHub-Lesen fehlgeschlagen" }, cors, error.status || 502);
      }
    }
    const body = await request.json().catch(() => ({}));
    const workspace = {
      version: 1,
      updatedAt: new Date().toISOString(),
      text: String(body.text || "").slice(0, 20000),
      prophetId: String(body.prophetId || "").slice(0, 80),
      styleMode: String(body.styleMode || "kids_story").slice(0, 40)
    };
    try {
      const existing = await githubGet(env, owner, repo, path, branch);
      await githubPut(
        env,
        owner,
        repo,
        path,
        JSON.stringify(workspace, null, 2) + "\n",
        "Voice Studio: Arbeitsstand in GitHub speichern [skip ci]",
        branch,
        existing?.sha
      );
      return json({ ok: true, saved: true, github: true, updatedAt: workspace.updatedAt }, cors);
    } catch (error) {
      return json({ ok: false, error: error.message || "GitHub-Speichern fehlgeschlagen" }, cors, error.status || 502);
    }
  }

  if (request.method === "POST" && rest === "/prophet-publish") {
    assertVoiceStudioOrigin(request, env);
    if (!githubGet || !githubPut || !base64ToUtf8) {
      return json({ ok: false, error: "GitHub-Speicher ist serverseitig nicht angebunden." }, cors, 503);
    }
    const body = await request.json().catch(() => ({}));
    const itemId = String(body.id || "").trim();
    const text = String(body.text || "").trim();
    if (!itemId) return json({ ok: false, error: "Prophet fehlt." }, cors, 400);
    if (text.length < 40) return json({ ok: false, error: "Erzähltext ist zu kurz." }, cors, 400);
    const path = "kids/data/prophet-stories.json";
    const file = await githubGet(env, owner, repo, path, branch);
    if (!file?.content) return json({ ok: false, error: "Propheten-Datei nicht gefunden." }, cors, 404);
    const manifest = JSON.parse(base64ToUtf8(file.content));
    const items = Array.isArray(manifest.items) ? manifest.items : [];
    const item = items.find((x) => String(x?.id || "") === itemId);
    if (!item) return json({ ok: false, error: "Prophet nicht gefunden: " + itemId }, cors, 404);
    const scripts = item.scripts && typeof item.scripts === "object" ? item.scripts : {};
    for (const age of ["4-5", "6-8", "9-10"]) scripts[age] = text;
    item.scripts = scripts;
    manifest.updatedAt = new Date().toISOString().slice(0, 10);
    try {
      await githubPut(
        env,
        owner,
        repo,
        path,
        JSON.stringify(manifest, null, 2) + "\n",
        "Kids: Prophetengeschichte " + (item.name || itemId) + " · Text aus Voice Studio Cloud",
        branch,
        file.sha
      );
      return json({ ok: true, id: itemId, name: item.name || itemId, ages: ["4-5", "6-8", "9-10"], github: true, pushed: true }, cors);
    } catch (error) {
      return json({ ok: false, error: error.message || "GitHub-Push fehlgeschlagen" }, cors, error.status || 502);
    }
  }

  if (request.method === "POST" && (rest === "/generate" || rest === "/generate-free")) {
    assertVoiceStudioOrigin(request, env);
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
    const result = await synthesizeDarVoice(env, prepared, { profile });
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
