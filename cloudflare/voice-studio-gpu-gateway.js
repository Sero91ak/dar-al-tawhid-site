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
  return String(env.DAR_VOICE_GPU_ORIGIN || "").trim().replace(/\/+$/, "");
}

function upstreamToken(env) {
  return String(env.DAR_VOICE_GPU_TOKEN || "").trim();
}

export function darVoiceGpuConfigured(env) {
  return Boolean(normalizedOrigin(env));
}

export function darVoiceGpuPublicStatus(env) {
  const origin = normalizedOrigin(env);
  return {
    configured: Boolean(origin),
    authenticatedUpstream: Boolean(upstreamToken(env)),
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
    "origin",
    "referer"
  ]) headers.delete(key);

  const token = upstreamToken(env);
  if (token) headers.set("Authorization", "Bearer " + token);
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
  if (!origin) {
    return json({
      ok: false,
      error: "DĀR Voice Cloud Engine ist vorbereitet, aber noch nicht mit einem GPU-Host verbunden.",
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
