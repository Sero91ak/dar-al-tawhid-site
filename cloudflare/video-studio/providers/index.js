import { BaseVideoProvider, falKey, falQueue, falStatus, falResult, sceneToFalPrompt, probeFalAuth } from "./base.js";

/**
 * Günstigster geeigneter Default über fal.ai:
 * Wan 2.5 @ 480p · 9:16 · echte Bewegung (~0,05 €/s)
 */
export class FalAutoProvider extends BaseVideoProvider {
  constructor() {
    super("fal-auto", "fal.ai · Wan 2.5 Auto");
    this.modelPath = "fal-ai/wan-25-preview/text-to-video";
    this.costPerSec = 0.05;
    this.resolution = "480p";
  }

  isConfigured(env) {
    return Boolean(falKey(env));
  }

  async estimateCost({ scenes = [] } = {}) {
    const seconds = scenes.reduce((n, s) => n + Number(s.durationSec || 5), 0) || 20;
    return Number((seconds * this.costPerSec).toFixed(4));
  }

  async createClip(env, { scene, imageUrl }) {
    const prompt = sceneToFalPrompt(scene);
    const rawDuration = Number(scene?.durationSec || 5);
    const duration = rawDuration >= 8 ? 10 : 5;
    const input = {
      prompt,
      aspect_ratio: "9:16",
      resolution: this.resolution,
      duration: String(duration)
    };
    if (imageUrl) input.image_url = imageUrl;
    const queued = await falQueue(env, this.modelPath, input, { preferAsync: true });
    return {
      providerJobId: queued.request_id || queued.requestId || "",
      status: queued.status || "IN_QUEUE",
      modelPath: this.modelPath,
      durationSec: duration,
      estimatedCostEur: Number((duration * this.costPerSec).toFixed(4))
    };
  }

  async getStatus(env, providerJobId, modelPath = this.modelPath) {
    const status = await falStatus(env, modelPath, providerJobId);
    const state = String(status.status || "").toUpperCase();
    if (state === "COMPLETED" || state === "OK") return { status: "completed", raw: status };
    if (state === "FAILED" || state === "ERROR") {
      return { status: "failed", reason: status.error || status.detail || "fal failed", raw: status };
    }
    return { status: "running", raw: status };
  }

  async downloadResult(env, providerJobId, modelPath = this.modelPath) {
    const result = await falResult(env, modelPath, providerJobId);
    const url =
      result?.video?.url ||
      result?.video_url ||
      result?.output?.url ||
      result?.data?.video?.url ||
      "";
    if (!url) throw new Error("fal Ergebnis ohne Video-URL");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fal Video-Download HTTP ${res.status}`);
    const bytes = await res.arrayBuffer();
    return { url, bytes, contentType: res.headers.get("content-type") || "video/mp4" };
  }
}

export class KlingProvider extends FalAutoProvider {
  constructor() {
    super();
    this.id = "kling";
    this.label = "Kling (via fal.ai)";
    this.modelPath = "fal-ai/kling-video/v2.1/standard/text-to-video";
    this.costPerSec = 0.07;
    this.resolution = "720p";
  }
}

export class LumaProvider extends FalAutoProvider {
  constructor() {
    super();
    this.id = "luma";
    this.label = "Luma (via fal.ai)";
    this.modelPath = "fal-ai/luma-dream-machine/ray-2";
    this.costPerSec = 0.12;
  }
}

export class VeoProvider extends FalAutoProvider {
  constructor() {
    super();
    this.id = "veo";
    this.label = "Google Veo (via fal.ai)";
    this.modelPath = "fal-ai/veo3";
    this.costPerSec = 0.2;
  }
}

export class RunwayProvider extends BaseVideoProvider {
  constructor() {
    super("runway", "Runway");
  }

  isConfigured(env) {
    return Boolean(String(env.RUNWAY_API_KEY || "").trim());
  }

  async estimateCost({ scenes = [] } = {}) {
    const seconds = scenes.reduce((n, s) => n + Number(s.durationSec || 5), 0) || 20;
    return Number((seconds * 0.15).toFixed(4));
  }

  async createClip(env, { scene }) {
    const key = String(env.RUNWAY_API_KEY || "").trim();
    const res = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        promptText: sceneToFalPrompt(scene),
        ratio: "1080:1920",
        duration: Math.min(10, Math.max(5, Number(scene?.durationSec || 5))),
        model: "gen4_turbo"
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Runway HTTP ${res.status}`);
    return {
      providerJobId: data.id || "",
      status: data.status || "PENDING",
      estimatedCostEur: Number(((Number(scene?.durationSec || 5)) * 0.15).toFixed(4))
    };
  }

  async getStatus(env, providerJobId) {
    const key = String(env.RUNWAY_API_KEY || "").trim();
    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${providerJobId}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "X-Runway-Version": "2024-11-06"
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Runway status HTTP ${res.status}`);
    const state = String(data.status || "").toUpperCase();
    if (state === "SUCCEEDED") return { status: "completed", raw: data };
    if (state === "FAILED") return { status: "failed", reason: data.failure || "runway failed", raw: data };
    return { status: "running", raw: data };
  }

  async downloadResult(env, providerJobId) {
    const status = await this.getStatus(env, providerJobId);
    const url = status.raw?.output?.[0] || status.raw?.output || "";
    if (!url) throw new Error("Runway ohne Video-URL");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Runway Download HTTP ${res.status}`);
    return { url, bytes: await res.arrayBuffer(), contentType: "video/mp4" };
  }
}

export class AdobeProvider extends BaseVideoProvider {
  constructor() {
    super("adobe", "Adobe Firefly");
  }

  isConfigured(env) {
    return Boolean(String(env.ADOBE_FIREFLY_TOKEN || env.ADOBE_API_KEY || "").trim());
  }
}

export function listProviders() {
  return [
    new FalAutoProvider(),
    new KlingProvider(),
    new LumaProvider(),
    new VeoProvider(),
    new RunwayProvider(),
    new AdobeProvider()
  ];
}

export function getProviderByMode(mode) {
  const id = String(mode || "auto").toLowerCase();
  if (id === "auto" || id === "fal-auto") return new FalAutoProvider();
  if (id === "kling") return new KlingProvider();
  if (id === "luma") return new LumaProvider();
  if (id === "veo") return new VeoProvider();
  if (id === "runway") return new RunwayProvider();
  if (id === "adobe") return new AdobeProvider();
  return new FalAutoProvider();
}

export async function chooseProvider(env, { mode = "auto", scenes = [], maxPerVideoEur = 1.2 } = {}) {
  const preferred = String(mode || "auto").toLowerCase();
  const all = listProviders();
  const configured = all.filter((p) => p.isConfigured(env));
  if (!configured.length) {
    return {
      ok: false,
      setupRequired: true,
      message: "Kein Video-Anbieter verbunden. Setze mindestens FAL_KEY (empfohlen) oder RUNWAY_API_KEY als Cloudflare Secret."
    };
  }

  if (preferred !== "auto") {
    const exact = configured.find((p) => p.id === preferred) || configured.find((p) => preferred === "fal" && p.id === "fal-auto");
    if (!exact) {
      return {
        ok: false,
        setupRequired: true,
        message: `Anbieter „${preferred}“ ist nicht verbunden. Verfügbar: ${configured.map((p) => p.id).join(", ")}`
      };
    }
    const estimateEur = await exact.estimateCost({ scenes });
    if (estimateEur > maxPerVideoEur) {
      return {
        ok: false,
        message: `Anbieter ${exact.label} schätzt ${estimateEur.toFixed(2)} € – über Limit ${maxPerVideoEur.toFixed(2)} €.`
      };
    }
    return { ok: true, provider: exact, estimateEur };
  }

  const ranked = [];
  for (const provider of configured) {
    const estimateEur = await provider.estimateCost({ scenes });
    ranked.push({ provider, estimateEur });
  }
  ranked.sort((a, b) => a.estimateEur - b.estimateEur);
  const affordable = ranked.find((row) => row.estimateEur <= maxPerVideoEur);
  if (!affordable) {
    return {
      ok: false,
      message: `Kein Anbieter unter ${maxPerVideoEur.toFixed(2)} €. Günstigste Schätzung: ${ranked[0].estimateEur.toFixed(2)} € (${ranked[0].provider.label}).`
    };
  }
  return { ok: true, provider: affordable.provider, estimateEur: affordable.estimateEur };
}

export function providersStatus(env) {
  return listProviders().map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(env)
  }));
}

export { probeFalAuth };
