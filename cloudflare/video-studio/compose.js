import { falKey, falQueue, falStatus, falResult } from "./providers/base.js";
import { DAR_VIDEO_PROFILE } from "./profile.js";

function shotstackKey(env) {
  return String(env.SHOTSTACK_API_KEY || "").trim();
}

function shotstackHost(env) {
  return String(env.SHOTSTACK_HOST || "https://api.shotstack.io/edit/stage").replace(/\/$/, "");
}

export function isComposerConfigured(env) {
  return Boolean(shotstackKey(env) || falKey(env));
}

function buildShotstackTimeline({ clipUrls, voiceUrl, captionLines, logoUrl }) {
  const videoClips = clipUrls.map((src, index) => ({
    asset: { type: "video", src, volume: 0 },
    start: index * 5,
    length: 5,
    fit: "cover"
  }));
  const textClips = (captionLines || []).map((line, i) => ({
    asset: {
      type: "html",
      html: `<p style="color:#fff5d4;font-size:42px;text-align:center;font-family:sans-serif;text-shadow:0 2px 10px #000">${escapeHtml(line.text)}</p>`,
      width: 980,
      height: 220
    },
    start: Number(line.at || i * 4),
    length: 3.8,
    position: "bottom",
    offset: { x: 0, y: 0.12 }
  }));
  const tracks = [{ clips: textClips }, { clips: videoClips }];
  if (logoUrl) {
    tracks.unshift({
      clips: [{
        asset: { type: "image", src: logoUrl },
        start: 0,
        length: Math.max(20, clipUrls.length * 5),
        position: "topRight",
        opacity: 0.72,
        scale: 0.14,
        offset: { x: -0.04, y: -0.05 }
      }]
    });
  }
  return {
    timeline: {
      background: "#05080f",
      soundtrack: voiceUrl
        ? { src: voiceUrl, effect: "fadeOut", volume: 1 }
        : undefined,
      tracks
    },
    output: {
      format: "mp4",
      size: { width: DAR_VIDEO_PROFILE.width, height: DAR_VIDEO_PROFILE.height },
      fps: DAR_VIDEO_PROFILE.fps,
      quality: "high"
    }
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function composeFinalVideo(env, payload) {
  if (shotstackKey(env)) return composeWithShotstack(env, payload);
  if (falKey(env)) return composeWithFalFfmpeg(env, payload);
  return {
    ok: false,
    setupRequired: true,
    reason: "Kein Compose-Dienst verbunden (SHOTSTACK_API_KEY oder FAL_KEY für ffmpeg-api)."
  };
}

async function composeWithShotstack(env, { clipUrls, voiceUrl, captionLines, logoUrl }) {
  const body = buildShotstackTimeline({ clipUrls, voiceUrl, captionLines, logoUrl });
  const res = await fetch(`${shotstackHost(env)}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": shotstackKey(env)
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, reason: data?.message || `Shotstack HTTP ${res.status}` };
  }
  const renderId = data?.response?.id || data?.id || "";
  return {
    ok: true,
    provider: "shotstack",
    renderId,
    poll: async () => pollShotstackRender(env, renderId)
  };
}

/** Shotstack Stage/Sandbox status poll – exportiert für Pipeline-Ticks */
export async function pollShotstackRender(env, renderId) {
  const res = await fetch(`${shotstackHost(env)}/render/${renderId}`, {
    headers: { "x-api-key": shotstackKey(env) }
  });
  const data = await res.json().catch(() => ({}));
  const status = String(data?.response?.status || data?.status || "").toLowerCase();
  if (status === "done") {
    const url = data?.response?.url || data?.url || "";
    const file = await fetch(url);
    return {
      ok: true,
      status: "completed",
      url,
      bytes: await file.arrayBuffer(),
      mime: "video/mp4",
      width: DAR_VIDEO_PROFILE.width,
      height: DAR_VIDEO_PROFILE.height,
      fps: DAR_VIDEO_PROFILE.fps,
      audioAttached: true,
      hasMusic: false
    };
  }
  if (status === "failed") return { ok: false, status: "failed", reason: data?.response?.error || "Shotstack failed" };
  return { ok: true, status: "running" };
}

async function composeWithFalFfmpeg(env, { clipUrls, voiceUrl }) {
  const queued = await falQueue(env, "fal-ai/ffmpeg-api/merge-videos", {
    video_urls: clipUrls,
    target_fps: 30,
    resolution: { width: 1080, height: 1920 }
  }, { preferAsync: true });
  const requestId = queued.request_id || queued.requestId;
  return {
    ok: true,
    provider: "fal-ffmpeg",
    renderId: requestId,
    voiceUrl,
    poll: async () => pollFalMerge(env, requestId, voiceUrl)
  };
}

/** fal ffmpeg merge status poll – exportiert für Pipeline-Ticks */
export async function pollFalMerge(env, requestId, voiceUrl = "") {
  const status = await falStatus(env, "fal-ai/ffmpeg-api/merge-videos", requestId);
  const state = String(status.status || "").toUpperCase();
  if (state === "COMPLETED" || state === "OK") {
    const result = await falResult(env, "fal-ai/ffmpeg-api/merge-videos", requestId);
    const url = result?.video?.url || result?.video_url || result?.output?.url || "";
    const file = await fetch(url);
    return {
      ok: true,
      status: "completed",
      url,
      bytes: await file.arrayBuffer(),
      mime: "video/mp4",
      width: 1080,
      height: 1920,
      fps: 30,
      audioAttached: Boolean(voiceUrl),
      hasMusic: false,
      note: voiceUrl ? "Clips gemerged – Stimme/Untertitel ggf. in Nachbearbeitung ergänzen" : ""
    };
  }
  if (state === "FAILED" || state === "ERROR") {
    return { ok: false, status: "failed", reason: status.error || "fal merge failed" };
  }
  return { ok: true, status: "running" };
}

export function shotstackEnvironment(env) {
  const host = shotstackHost(env);
  return {
    host,
    isStage: /\/stage\b|api\.shotstack\.io\/edit\/stage/i.test(host)
  };
}
