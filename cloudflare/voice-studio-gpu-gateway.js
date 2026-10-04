// DĀR Voice remote GPU gateway.
// Keeps provider credentials server-side and lets the existing Voice Studio HTTP API
// run on an external always-on GPU host without exposing its origin or token to clients.

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

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

function normalizedOrigin(env) {
  const raw = String(env.DAR_VOICE_GPU_ORIGIN || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (url.protocol !== "https:" && !local) return "";
    return raw;
  } catch (_) {
    return "";
  }
}

function upstreamToken(env) {
  return String(env.DAR_VOICE_GPU_TOKEN || "").trim();
}

function webAccessToken(env) {
  return String(env.DAR_VOICE_WEB_TOKEN || "").trim();
}

function constantTimeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export function darVoiceWebAccessConfigured(env) {
  return Boolean(webAccessToken(env));
}

export function darVoiceWebCodeAuthorized(code, env) {
  const expected = webAccessToken(env);
  const supplied = String(code || "").trim();
  return Boolean(expected && supplied && constantTimeEqual(supplied, expected));
}

async function webSessionValue(env) {
  const secret = webAccessToken(env);
  if (!secret) return "";
  const bytes = new TextEncoder().encode("dar-voice-cloud-session-v1|" + secret);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("");
}

function cookieValue(request, name) {
  const cookie = String(request.headers.get("Cookie") || "");
  const parts = cookie.split(";");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return "";
}

export async function darVoiceWebAuthorized(request, env) {
  const header = String(request.headers.get("X-DAR-Voice-Access") || "").trim();
  if (header && darVoiceWebCodeAuthorized(header, env)) return true;
  const suppliedSession = cookieValue(request, "DARVOICE_CLOUD");
  if (!suppliedSession) return false;
  const expectedSession = await webSessionValue(env);
  return Boolean(expectedSession && constantTimeEqual(suppliedSession, expectedSession));
}

export async function darVoiceWebSessionCookie(env) {
  const value = await webSessionValue(env);
  if (!value) return "";
  return [
    "DARVOICE_CLOUD=" + encodeURIComponent(value),
    "Path=/voice-studio/api/engine",
    "Max-Age=2592000",
    "HttpOnly",
    "Secure",
    "SameSite=Strict"
  ].join("; ");
}

export function darVoiceGpuConfigured(env) {
  return Boolean(normalizedOrigin(env) && upstreamToken(env));
}

export function darVoiceGpuPublicStatus(env) {
  const origin = normalizedOrigin(env);
  return {
    configured: Boolean(origin && upstreamToken(env)),
    originConfigured: Boolean(origin),
    authenticatedUpstream: Boolean(upstreamToken(env)),
    webAccessProtected: Boolean(webAccessToken(env)),
    transport: "cloudflare-gateway",
    mode: "remote-gpu",
    localIpRequired: false
  };
}

function safeEnginePath(enginePath) {
  let value = String(enginePath || "/").trim();
  if (!value.startsWith("/")) value = "/" + value;
  if (value.includes("..") || value.includes("\\")) throw new Error("Ungültiger Engine-Pfad.");
  return value;
}

function copyUpstreamHeaders(request, env) {
  const headers = new Headers(request.headers);
  for (const key of [
    "host",
    "cookie",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-admin-secret",
    "x-dar-voice-access",
    "authorization",
    "origin",
    "referer"
  ]) headers.delete(key);

  const token = upstreamToken(env);
  if (token) {\n    headers.set("Authorization", "Bearer " + token);\n    headers.set("X-DAR-Voice-Token", token);\n  }
  headers.set("X-DAR-Voice-Gateway", "cloudflare-v1");
  headers.set("X-Forwarded-Proto", "https");
  return headers;
}

function copyResponseHeaders(upstream, cors) {
  const headers = new Headers(upstream.headers);
  for (const [key, value] of Object.entries(cors || {})) headers.set(key, value);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-DAR-Voice-Transport", "remote-gpu");
  headers.delete("Set-Cookie");
  return headers;
}

export async function proxyDarVoiceGpuRequest(request, env, cors, enginePath) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return json({ ok: false, error: "Methode für DĀR Voice Cloud Engine nicht erlaubt." }, cors, 405);
  }

  const origin = normalizedOrigin(env);
  const token = upstreamToken(env);
  if (!origin || !token) {
    return json({
      ok: false,
      error: !origin
        ? "DĀR Voice GPU-Origin fehlt oder ist nicht per HTTPS abgesichert."
        : "DĀR Voice GPU-Token fehlt serverseitig.",
      setupRequired: true,
      localIpRequired: false,
      transport: "cloudflare-gateway"
    }, cors, 503);
  }

  let path;
  try {
    path = safeEnginePath(enginePath);
  } catch (error) {
    return json({ ok: false, error: error?.message || "Ungültiger Engine-Pfad." }, cors, 400);
  }

  const sourceUrl = new URL(request.url);
  const target = new URL(origin + path);
  target.search = sourceUrl.search;

  const headers = copyUpstreamHeaders(request, env);
  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

  let upstream;
  try {
    upstream = await fetch(target.toString(), init);
  } catch (error) {
    return json({
      ok: false,
      error: "DĀR Voice GPU-Host ist momentan nicht erreichbar.",
      detail: String(error?.message || error || "").slice(0, 240),
      transport: "cloudflare-gateway"
    }, cors, 502);
  }

  const responseHeaders = copyResponseHeaders(upstream, cors);
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
