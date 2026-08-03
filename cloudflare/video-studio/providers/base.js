import { DAR_VIDEO_PROFILE } from "../profile.js";

export class BaseVideoProvider {
  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  isConfigured(_env) {
    return false;
  }

  async estimateCost({ scenes = [] } = {}) {
    const seconds = scenes.reduce((n, s) => n + Number(s.durationSec || 5), 0) || 20;
    return Number((seconds * 0.08).toFixed(4));
  }

  async createClip(_env, _input) {
    throw new Error(`${this.id} ist nicht konfiguriert`);
  }

  async getStatus(_env, _providerJobId) {
    return { status: "failed", reason: "nicht konfiguriert" };
  }

  async downloadResult(_env, _providerJobId) {
    throw new Error(`${this.id}: Download nicht verfügbar`);
  }
}

export function falKey(env) {
  let key = String(env.FAL_KEY || env.FAL_API_KEY || "").trim();
  // Häufige Paste-Fehler: führendes "Key ", Anführungszeichen, Zeilenumbrüche
  key = key.replace(/^Key\s+/i, "").replace(/^["']+|["']+$/g, "").replace(/\s+/g, "").trim();
  return key;
}

/** Leichter Auth-Check ohne teuren Videoclip.
 * 422/400 = Key akzeptiert; request_id = Key ok; 401 = Key falsch.
 * 403 oft Scope/Modell – dann zweiter Versuch mit flux/schnell.
 */
export async function probeFalAuth(env) {
  const key = falKey(env);
  if (!key) return { ok: false, present: false, reason: "FAL_KEY fehlt" };
  const fingerprint = {
    present: true,
    length: key.length,
    hasColon: key.includes(":"),
    prefix: key.slice(0, 4)
  };

  async function hit(modelPath, body) {
    const res = await fetch(`https://queue.fal.run/${modelPath}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try { data = JSON.parse(text); } catch {}
    return { res, text, data };
  }

  try {
    // 1) leerer Body → bei gültigem Key meist 422
    let { res, text, data } = await hit("fal-ai/flux/schnell", {});
    if (res.status === 401) {
      return {
        ok: false,
        ...fingerprint,
        httpStatus: 401,
        reason: "fal.ai: ungültiger API-Key – bitte FAL_KEY neu setzen",
        detail: String(data?.detail || data?.message || text).slice(0, 180)
      };
    }
    if (res.status === 422 || res.status === 400) {
      return { ok: true, ...fingerprint, httpStatus: res.status, model: "fal-ai/flux/schnell" };
    }
    if (res.ok || data?.request_id || data?.requestId) {
      return { ok: true, ...fingerprint, httpStatus: res.status, model: "fal-ai/flux/schnell", queued: true };
    }

    // 2) Minimaler Prompt (sehr günstig) – bestätigt Key endgültig
    ({ res, text, data } = await hit("fal-ai/flux/schnell", { prompt: "solid charcoal silhouette test frame", image_size: "square_hd", num_images: 1 }));
    if (res.status === 401) {
      return {
        ok: false,
        ...fingerprint,
        httpStatus: 401,
        reason: "fal.ai: ungültiger API-Key",
        detail: String(data?.detail || text).slice(0, 180)
      };
    }
    if (res.ok || data?.request_id || data?.requestId || res.status === 422) {
      return {
        ok: true,
        ...fingerprint,
        httpStatus: res.status,
        model: "fal-ai/flux/schnell",
        queued: Boolean(data?.request_id || data?.requestId)
      };
    }

    // 3) Video-Modell erreichbar?
    ({ res, text, data } = await hit("fal-ai/wan-25-preview/text-to-video", {
      prompt: "anonymous silhouette walking away, face hidden, cinematic 9:16",
      aspect_ratio: "9:16",
      resolution: "480p",
      duration: "5"
    }));
    if (res.ok || data?.request_id || data?.requestId) {
      return {
        ok: true,
        ...fingerprint,
        httpStatus: res.status,
        model: "fal-ai/wan-25-preview/text-to-video",
        queued: true
      };
    }
    return {
      ok: false,
      ...fingerprint,
      httpStatus: res.status,
      reason: String(data?.detail || data?.message || text || `HTTP ${res.status}`).slice(0, 220)
    };
  } catch (error) {
    return { ok: false, ...fingerprint, reason: error.message || String(error) };
  }
}

export async function falQueue(env, modelPath, input, { preferAsync = true } = {}) {
  const key = falKey(env);
  if (!key) throw new Error("FAL_KEY fehlt");
  const endpoint = preferAsync
    ? `https://queue.fal.run/${modelPath}`
    : `https://fal.run/${modelPath}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail || data?.error || data?.message;
    throw new Error(typeof detail === "string" ? detail : (detail?.message || `fal ${modelPath} HTTP ${res.status}`));
  }
  return data;
}

function falQueueCandidateUrls(modelPath, requestId, { status = false } = {}) {
  const id = encodeURIComponent(String(requestId || "").trim());
  const path = String(modelPath || "").replace(/^\/+|\/+$/g, "");
  const base = `https://queue.fal.run/${path}/requests/${id}`;
  const urls = [status ? `${base}/status` : base];
  // Nested endpoints (z. B. ffmpeg-api/merge-videos) ggf. unter App-Root
  const parts = path.split("/");
  if (parts.length >= 3) {
    const root = `${parts[0]}/${parts[1]}`;
    const rootBase = `https://queue.fal.run/${root}/requests/${id}`;
    urls.push(status ? `${rootBase}/status` : rootBase);
  }
  return [...new Set(urls.filter(Boolean))];
}

export async function falStatus(env, modelPath, requestId, { statusUrl } = {}) {
  const key = falKey(env);
  const id = String(requestId || "").trim();
  const urls = [];
  if (String(statusUrl || "").trim()) urls.push(String(statusUrl).trim());
  urls.push(...falQueueCandidateUrls(modelPath, id, { status: true }));
  if (!urls.length) throw new Error("fal status: request_id fehlt");
  let lastErr = null;
  for (const url of urls) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Key ${key}`,
        Accept: "application/json"
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const detail = data?.detail || data?.error || data?.message;
    lastErr = typeof detail === "string"
      ? detail
      : (detail?.message || `fal status HTTP ${res.status} (${modelPath} · id=${id.slice(0, 12) || "—"})`);
    // 404/405 → nächste Kandidaten-URL; andere Fehler sofort
    if (res.status !== 404 && res.status !== 405) break;
  }
  throw new Error(lastErr || "fal status fehlgeschlagen");
}

export async function falResult(env, modelPath, requestId, { responseUrl } = {}) {
  const key = falKey(env);
  const id = String(requestId || "").trim();
  const urls = [];
  if (String(responseUrl || "").trim()) urls.push(String(responseUrl).trim());
  urls.push(...falQueueCandidateUrls(modelPath, id, { status: false }));
  if (!urls.length) throw new Error("fal result: request_id fehlt");
  let lastErr = null;
  for (const url of urls) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Key ${key}`,
        Accept: "application/json"
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const detail = data?.detail || data?.error || data?.message;
    lastErr = typeof detail === "string" ? detail : (detail?.message || `fal result HTTP ${res.status}`);
    if (res.status !== 404 && res.status !== 405) break;
  }
  throw new Error(lastErr || "fal result fehlgeschlagen");
}

export function clipAspectPayload() {
  return {
    aspect_ratio: "9:16",
    resolution: "1080p"
  };
}

export function sceneToFalPrompt(scene) {
  return String(scene?.fullPrompt || scene?.prompt || DAR_VIDEO_PROFILE.promptSafetySuffix);
}
