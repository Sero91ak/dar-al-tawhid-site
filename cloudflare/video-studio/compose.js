import { falKey, falQueue, falStatus, falResult } from "./providers/base.js";
import { DAR_VIDEO_PROFILE, publicBrandAssetUrl } from "./profile.js";
import { emphasizeHtml, escapeHtml } from "./storyboard.js";

function shotstackKey(env) {
  return String(env.SHOTSTACK_API_KEY || "").trim();
}

/** Stage = interne Vorschau (Fremdwasserzeichen möglich). v1 = Freigabe-Endfassung. */
export function shotstackHost(env, { final = false } = {}) {
  if (final) {
    return String(env.SHOTSTACK_PROD_HOST || "https://api.shotstack.io/edit/v1").replace(/\/$/, "");
  }
  return String(env.SHOTSTACK_HOST || "https://api.shotstack.io/edit/stage").replace(/\/$/, "");
}

export function shotstackEnvironment(env, { final = false } = {}) {
  const host = shotstackHost(env, { final });
  const isStage = /\/stage\b/i.test(host);
  const isProd = /\/edit\/v1\b/i.test(host) || (!isStage && /shotstack\.io/i.test(host));
  return { host, isStage, isProd, final: Boolean(final) };
}

export function isComposerConfigured(env) {
  return Boolean(shotstackKey(env) || falKey(env));
}

export async function probeShotstackAuth(env) {
  const key = shotstackKey(env);
  const stage = shotstackEnvironment(env, { final: false });
  const prod = shotstackEnvironment(env, { final: true });
  if (!key) {
    return { ok: false, present: false, host: stage.host, isStage: true, reason: "SHOTSTACK_API_KEY fehlt" };
  }
  try {
    const [stageRes, prodRes] = await Promise.all([
      fetch(`${stage.host}/templates`, { headers: { "x-api-key": key, Accept: "application/json" } }),
      fetch(`${prod.host}/templates`, { headers: { "x-api-key": key, Accept: "application/json" } })
    ]);
    if (stageRes.status === 401 || stageRes.status === 403) {
      return {
        ok: false,
        present: true,
        host: stage.host,
        isStage: true,
        prodHost: prod.host,
        httpStatus: stageRes.status,
        prodHttpStatus: prodRes.status,
        prodOk: prodRes.status >= 200 && prodRes.status < 400,
        reason: "Shotstack-Key ungültig (Stage)"
      };
    }
    const prodOk = prodRes.status >= 200 && prodRes.status < 400;
    return {
      ok: true,
      present: true,
      host: stage.host,
      isStage: stage.isStage,
      prodHost: prod.host,
      httpStatus: stageRes.status,
      prodHttpStatus: prodRes.status,
      prodOk,
      reason: prodOk
        ? null
        : `Shotstack Production (v1) HTTP ${prodRes.status} – Endfassung nutzt fal-ffmpeg-Fallback`
    };
  } catch (error) {
    return { ok: false, present: true, host: stage.host, isStage: true, reason: error.message || String(error) };
  }
}

function brandUrls(env) {
  const b = DAR_VIDEO_PROFILE.branding;
  return {
    logoUrl: String(env.VIDEO_STUDIO_LOGO_URL || "").trim() || publicBrandAssetUrl(env, b.logoPublicPath),
    watermarkUrl:
      String(env.VIDEO_STUDIO_WATERMARK_URL || "").trim() ||
      publicBrandAssetUrl(env, b.watermarkPublicPath)
  };
}

function htmlShell(inner, { width = 980, height = 280, align = "center" } = {}) {
  return `<div style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:${align};padding:18px 28px;box-sizing:border-box;">${inner}</div>`;
}

function overlayHtml(overlay) {
  const typo = DAR_VIDEO_PROFILE.typography;
  if (overlay.role === "brand") {
    const topic = overlay.topic ? `<div style="margin-top:10px;font-family:${typo.ui};font-size:22px;letter-spacing:.08em;color:${typo.soft};text-shadow:0 2px 10px rgba(0,0,0,.5)">${escapeHtml(overlay.topic)}</div>` : "";
    return htmlShell(
      `<div style="text-align:center;width:100%">
        <div style="font-family:${typo.display};font-size:34px;letter-spacing:.18em;color:${typo.gold};font-weight:700;text-shadow:0 2px 14px rgba(0,0,0,.55)">DAR AL TAWḤĪD</div>
        ${topic}
      </div>`,
      { height: topic ? 150 : 120 }
    );
  }
  if (overlay.role === "speaker") {
    return htmlShell(
      `<div style="text-align:center;width:100%">
        <div style="font-family:${typo.display};font-size:40px;line-height:1.35;color:${typo.cream};font-weight:600;text-shadow:0 3px 16px rgba(0,0,0,.65)">${escapeHtml(overlay.text)}</div>
      </div>`,
      { height: 200 }
    );
  }
  if (overlay.role === "statement") {
    const body = overlay.htmlEmphasis ? emphasizeHtml(overlay.text) : escapeHtml(overlay.text);
    return htmlShell(
      `<div style="text-align:center;width:100%">
        <div style="font-family:${typo.body};font-size:46px;line-height:1.38;color:${typo.cream};font-weight:500;text-shadow:0 4px 18px rgba(0,0,0,.7)">${body}</div>
      </div>`,
      { height: 360 }
    );
  }
  if (overlay.role === "source") {
    return htmlShell(
      `<div style="text-align:center;width:100%">
        <div style="font-family:${typo.ui};font-size:28px;letter-spacing:.04em;color:${typo.soft};text-shadow:0 2px 12px rgba(0,0,0,.6)">${escapeHtml(overlay.text)}</div>
      </div>`,
      { height: 120 }
    );
  }
  if (overlay.role === "cta") {
    const b = DAR_VIDEO_PROFILE.branding;
    const tg = `<span style="display:inline-flex;align-items:center;gap:8px;margin:0 10px"><svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path d="M17.6 6.8 5.8 11.35c-.8.32-.8.77-.15.97l3.03.95 1.17 3.74c.15.42.08.58.52.58.34 0 .49-.15.68-.34l1.64-1.6 3.42 2.53c.63.35 1.08.17 1.24-.58l2.1-9.9c.24-.92-.35-1.34-.94-1.07Z" fill="#fff"/></svg><span>${escapeHtml(b.telegram)}</span></span>`;
    const ig = `<span style="display:inline-flex;align-items:center;gap:8px;margin:0 10px"><svg width="28" height="28" viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#feda75"/><stop offset="50%" stop-color="#d62976"/><stop offset="100%" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.25" fill="#fff"/></svg><span>${escapeHtml(b.instagram)}</span></span>`;
    const web = `<span style="margin:0 10px">${escapeHtml(b.website)}</span>`;
    return htmlShell(
      `<div style="text-align:center;width:100%;color:${typo.cream}">
        <div style="font-family:${typo.display};font-size:28px;line-height:1.35;margin-bottom:12px;text-shadow:0 2px 14px rgba(0,0,0,.65)">${escapeHtml(b.followLine)}</div>
        <div style="font-family:${typo.ui};font-size:22px;display:flex;justify-content:center;flex-wrap:wrap;gap:8px;align-items:center;text-shadow:0 2px 10px rgba(0,0,0,.55);margin-bottom:12px">${tg}${web}${ig}</div>
        <div style="font-family:${typo.display};font-size:20px;letter-spacing:.06em;color:${typo.soft};text-shadow:0 2px 10px rgba(0,0,0,.55)">${escapeHtml(b.credit)}</div>
      </div>`,
      { height: 300 }
    );
  }
  return htmlShell(`<div style="color:#fff;font-size:36px;text-align:center">${escapeHtml(overlay.text || "")}</div>`);
}

function positionForRole(role) {
  // Safe areas: avoid extreme edges (Shotstack offset y: positive moves up from bottom / down from top depending on position)
  if (role === "brand") return { position: "top", offset: { x: 0, y: -0.06 } };
  if (role === "speaker") return { position: "center", offset: { x: 0, y: -0.18 } };
  if (role === "statement") return { position: "center", offset: { x: 0, y: 0.02 } };
  if (role === "source") return { position: "center", offset: { x: 0, y: 0.22 } };
  if (role === "cta") return { position: "bottom", offset: { x: 0, y: 0.12 } };
  return { position: "center", offset: { x: 0, y: 0 } };
}

export function buildShotstackTimeline({
  clipUrls,
  voiceUrl,
  captionPlan,
  captionLines,
  watermarkUrl,
  logoUrl,
  sceneDurationSec = 5
}) {
  const sceneLen = Math.max(3, Number(sceneDurationSec) || 5);
  const videoClips = (clipUrls || []).map((src, index) => ({
    asset: { type: "video", src, volume: 0 },
    start: index * sceneLen,
    length: sceneLen,
    fit: "cover"
  }));
  const totalDuration = Math.max(sceneLen * Math.max(1, videoClips.length), 15);

  const overlays = captionPlan?.overlays?.length
    ? captionPlan.overlays
    : (captionLines || []).map((line, i) => ({
        role: i === 0 ? "speaker" : i === 1 ? "statement" : "source",
        at: Number(line.at || i * 4),
        length: 3.8,
        text: line.text,
        htmlEmphasis: i === 1
      }));

  const textClips = overlays.map((overlay) => {
    const pos = positionForRole(overlay.role);
    const height =
      overlay.role === "statement" ? 360 :
      overlay.role === "cta" ? 300 :
      overlay.role === "speaker" ? 200 :
      overlay.role === "brand" ? 120 : 140;
    return {
      asset: {
        type: "html",
        html: overlayHtml(overlay),
        width: 980,
        height
      },
      start: Math.max(0, Number(overlay.at || 0)),
      length: Math.max(1.5, Number(overlay.length || 3.5)),
      position: pos.position,
      offset: pos.offset,
      transition: { in: "fade", out: "fade" }
    };
  });

  const tracks = [
    { clips: textClips },
    { clips: videoClips }
  ];

  // Dezentes DAR-Wasserzeichen (oben rechts), kein Fremdlogo
  const markUrl = watermarkUrl || logoUrl;
  if (markUrl) {
    tracks.unshift({
      clips: [{
        asset: { type: "image", src: markUrl },
        start: 0,
        length: totalDuration,
        position: "topRight",
        opacity: 0.55,
        scale: 0.11,
        offset: { x: -0.045, y: -0.055 }
      }]
    });
  }

  return {
    timeline: {
      background: "#070b14",
      soundtrack: voiceUrl
        ? { src: voiceUrl, effect: "fadeOut", volume: 1 }
        : undefined,
      tracks
    },
    output: {
      format: "mp4",
      size: { width: DAR_VIDEO_PROFILE.width, height: DAR_VIDEO_PROFILE.height },
      fps: DAR_VIDEO_PROFILE.fps,
      quality: "high",
      // Fast-start friendly progressive MP4
      destinations: []
    }
  };
}

export async function composeFinalVideo(env, payload = {}) {
  const final = payload.final !== false; // Endfassung standardmäßig Production
  if (shotstackKey(env)) {
    const shot = await composeWithShotstack(env, payload, { final });
    if (shot.ok) return shot;
    // Production oft 403 (nur Stage-Plan) – kein Stage-Wasserzeichen als Endfassung.
    // Stattdessen fal-ffmpeg-Merge ohne Fremdwasserzeichen (Download/Admin; Branding-Freigabe gesperrt).
    const code = Number(shot.httpStatus || 0);
    const authFail = code === 401 || code === 403 || /HTTP 401|HTTP 403/i.test(String(shot.reason || ""));
    if (final && authFail && falKey(env)) {
      const fal = await composeWithFalFfmpeg(env, payload);
      if (fal.ok) {
        return {
          ...fal,
          composeFallback: "fal-ffmpeg",
          shotstackBlocked: shot.reason || `Shotstack HTTP ${code || "?"} (v1)`,
          note: "Shotstack Production gesperrt – fal-ffmpeg-Merge ohne Fremdwasserzeichen"
        };
      }
    }
    return shot;
  }
  if (falKey(env)) return composeWithFalFfmpeg(env, payload);
  return {
    ok: false,
    setupRequired: true,
    reason: "Kein Compose-Dienst verbunden (SHOTSTACK_API_KEY oder FAL_KEY für ffmpeg-api)."
  };
}

async function composeWithShotstack(env, payload, { final }) {
  const envInfo = shotstackEnvironment(env, { final });
  const brands = brandUrls(env);
  const body = buildShotstackTimeline({
    clipUrls: payload.clipUrls,
    voiceUrl: payload.voiceUrl,
    captionPlan: payload.captionPlan,
    captionLines: payload.captionLines,
    watermarkUrl: brands.watermarkUrl,
    logoUrl: brands.logoUrl,
    sceneDurationSec: payload.sceneDurationSec
  });
  const res = await fetch(`${envInfo.host}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": shotstackKey(env)
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Production fehlgeschlagen → klar melden (kein stilles Stage-Fallback für Endfassung)
    return {
      ok: false,
      httpStatus: res.status,
      reason: data?.message || data?.response?.message || `Shotstack HTTP ${res.status} (${envInfo.isStage ? "stage" : "v1"})`,
      shotstackEnv: envInfo.isStage ? "stage" : "v1"
    };
  }
  const renderId = data?.response?.id || data?.id || "";
  return {
    ok: true,
    provider: "shotstack",
    renderId,
    shotstackEnv: envInfo.isStage ? "stage" : "v1",
    host: envInfo.host,
    foreignWatermarkRisk: envInfo.isStage,
    brandingApplied: true,
    isPreview: envInfo.isStage,
    poll: async () => pollShotstackRender(env, renderId, { final })
  };
}

export async function pollShotstackRender(env, renderId, { final = true } = {}) {
  const envInfo = shotstackEnvironment(env, { final });
  const res = await fetch(`${envInfo.host}/render/${renderId}`, {
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
      hasMusic: false,
      shotstackEnv: envInfo.isStage ? "stage" : "v1",
      foreignWatermarkRisk: envInfo.isStage,
      brandingApplied: true
    };
  }
  if (status === "failed") {
    return { ok: false, status: "failed", reason: data?.response?.error || "Shotstack failed" };
  }
  return { ok: true, status: "running", shotstackEnv: envInfo.isStage ? "stage" : "v1" };
}

async function composeWithFalFfmpeg(env, { clipUrls, voiceUrl }) {
  const queued = await falQueue(env, "fal-ai/ffmpeg-api/merge-videos", {
    video_urls: clipUrls,
    target_fps: 30,
    resolution: { width: 1080, height: 1920 }
  }, { preferAsync: true });
  const requestId = queued.request_id || queued.requestId;
  const statusUrl = String(queued.status_url || queued.statusUrl || "").trim();
  const responseUrl = String(queued.response_url || queued.responseUrl || "").trim();
  return {
    ok: true,
    provider: "fal-ffmpeg",
    renderId: requestId,
    statusUrl,
    responseUrl,
    shotstackEnv: null,
    foreignWatermarkRisk: false,
    brandingApplied: false,
    voiceUrl,
    poll: async () => pollFalMerge(env, requestId, voiceUrl, { statusUrl, responseUrl })
  };
}

export async function pollFalMerge(env, requestId, voiceUrl = "", { statusUrl = "", responseUrl = "" } = {}) {
  const status = await falStatus(env, "fal-ai/ffmpeg-api/merge-videos", requestId, { statusUrl });
  const state = String(status.status || "").toUpperCase();
  if (state === "COMPLETED" || state === "OK") {
    const result = await falResult(env, "fal-ai/ffmpeg-api/merge-videos", requestId, { responseUrl });
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
      brandingApplied: false,
      note: "fal-ffmpeg Merge ohne DAR-Texthierarchie – Shotstack Production für Endfassung verwenden"
    };
  }
  if (state === "FAILED" || state === "ERROR") {
    return { ok: false, status: "failed", reason: status.error || "fal merge failed" };
  }
  return { ok: true, status: "running" };
}
