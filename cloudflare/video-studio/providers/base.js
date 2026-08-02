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
  return String(env.FAL_KEY || env.FAL_API_KEY || "").trim();
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
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || data?.message || `fal ${modelPath} HTTP ${res.status}`);
  }
  return data;
}

export async function falStatus(env, modelPath, requestId) {
  const key = falKey(env);
  const res = await fetch(`https://queue.fal.run/${modelPath}/requests/${requestId}/status`, {
    headers: { Authorization: `Key ${key}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || `fal status HTTP ${res.status}`);
  return data;
}

export async function falResult(env, modelPath, requestId) {
  const key = falKey(env);
  const res = await fetch(`https://queue.fal.run/${modelPath}/requests/${requestId}`, {
    headers: { Authorization: `Key ${key}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || `fal result HTTP ${res.status}`);
  return data;
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
