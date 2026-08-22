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

function fontFaceCss() {
  const fonts = DAR_VIDEO_PROFILE.fonts;
  const base = fonts.base;
  return fonts.faces
    .map((f) => {
      const style = f.style ? `font-style:${f.style};` : "font-style:normal;";
      return `@font-face{font-family:'${f.family}';${style}font-weight:${f.weight};src:url('${base}/${f.file}') format('woff2');}`;
    })
    .join("");
}

function panelStyle(extra = "") {
  const typo = DAR_VIDEO_PROFILE.typography;
  return `background:${typo.panelBg};border:1px solid ${typo.panelBorder};border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.08);padding:22px 26px;box-sizing:border-box;${extra}`;
}

function htmlShell(inner, { width = 980, height = 280, align = "center" } = {}) {
  return `<div style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:${align};padding:14px 22px;box-sizing:border-box;"><style>${fontFaceCss()}</style>${inner}</div>`;
}

function socialRowHtml(b, typo) {
  /* Offizielle Markenfarben – klare Telegram-/Instagram-/Web-Erkennung wie Social-Original */
  const tg = `<span style="display:inline-flex;align-items:center;gap:10px;margin:0 12px;white-space:nowrap"><svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path d="M17.6 6.8 5.8 11.35c-.8.32-.8.77-.15.97l3.03.95 1.17 3.74c.15.42.08.58.52.58.34 0 .49-.15.68-.34l1.64-1.6 3.42 2.53c.63.35 1.08.17 1.24-.58l2.1-9.9c.24-.92-.35-1.34-.94-1.07Z" fill="#fff"/></svg><span style="font-family:${typo.ui};font-size:24px;font-weight:600;color:${typo.cream}">${escapeHtml(b.telegram)}</span></span>`;
  const ig = `<span style="display:inline-flex;align-items:center;gap:10px;margin:0 12px;white-space:nowrap"><svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igv" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f58529"/><stop offset="45%" stop-color="#dd2a7b"/><stop offset="100%" stop-color="#515bd4"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igv)"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.3" fill="#fff"/></svg><span style="font-family:${typo.ui};font-size:24px;font-weight:600;color:${typo.cream}">${escapeHtml(b.instagram)}</span></span>`;
  const web = `<span style="display:inline-flex;align-items:center;gap:10px;margin:0 12px;white-space:nowrap"><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="${typo.gold}" stroke-width="1.6"/><path d="M3 12h18M12 3c2.8 3 4.2 6 4.2 9s-1.4 6-4.2 9c-2.8-3-4.2-6-4.2-9s1.4-6 4.2-9Z" fill="none" stroke="${typo.gold}" stroke-width="1.4"/></svg><span style="font-family:${typo.ui};font-size:24px;font-weight:600;color:${typo.cream}">${escapeHtml(b.website)}</span></span>`;
  return `${tg}${web}${ig}`;
}

function overlayHtml(overlay) {
  const typo = DAR_VIDEO_PROFILE.typography;
  const b = DAR_VIDEO_PROFILE.branding;

  if (overlay.role === "brand") {
    /* Nur dezente Markenzeile – kein Topic (Dhikr). Großes Logo läuft separat als Wasserzeichen. */
    return htmlShell(
      `<div style="${panelStyle("max-width:720px;text-align:center;padding:16px 28px")}">
        <div style="font-family:${typo.display};font-size:28px;letter-spacing:.14em;color:${typo.gold};font-weight:700;line-height:1.15;text-shadow:0 2px 12px rgba(0,0,0,.55)">${escapeHtml(b.title)}</div>
      </div>`,
      { height: 110 }
    );
  }
  if (overlay.role === "speaker") {
    return htmlShell(
      `<div style="${panelStyle("max-width:900px;text-align:center")}">
        <div style="font-family:${typo.display};font-size:42px;line-height:1.4;color:${typo.cream};font-weight:600;text-shadow:0 2px 14px rgba(0,0,0,.6)">
          <span style="font-family:${typo.arabic};font-size:1.05em">${escapeHtml(overlay.text)}</span>
        </div>
      </div>`,
      { height: 220 }
    );
  }
  if (overlay.role === "statement") {
    const body = overlay.htmlEmphasis ? emphasizeHtml(overlay.text) : escapeHtml(overlay.text);
    return htmlShell(
      `<div style="${panelStyle("max-width:920px;text-align:center")}">
        <div style="font-family:${typo.body};font-size:48px;line-height:1.42;color:${typo.cream};font-weight:600;letter-spacing:.01em;text-shadow:0 3px 16px rgba(0,0,0,.65)">${body}</div>
      </div>`,
      { height: 420 }
    );
  }
  if (overlay.role === "source") {
    return htmlShell(
      `<div style="${panelStyle("max-width:880px;text-align:center;padding:18px 26px")}">
        <div style="height:1px;width:42%;margin:0 auto 14px;background:linear-gradient(90deg,transparent,${typo.gold},transparent);opacity:.85"></div>
        <div style="font-family:${typo.source};font-size:30px;font-style:italic;letter-spacing:.02em;line-height:1.4;color:${typo.soft};text-shadow:0 2px 12px rgba(0,0,0,.55)">${escapeHtml(overlay.text)}</div>
      </div>`,
      { height: 160 }
    );
  }
  if (overlay.role === "cta") {
    return htmlShell(
      `<div style="${panelStyle("max-width:940px;text-align:center;padding:26px 28px")}">
        <div style="font-family:${typo.display};font-size:34px;line-height:1.35;margin-bottom:18px;color:${typo.cream};font-weight:600;text-shadow:0 2px 14px rgba(0,0,0,.6)">${escapeHtml(b.followLine)}</div>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px">${socialRowHtml(b, typo)}</div>
        <div style="font-family:${typo.display};font-size:22px;letter-spacing:.05em;color:${typo.gold};text-shadow:0 2px 10px rgba(0,0,0,.5)">${escapeHtml(b.credit)}</div>
      </div>`,
      { height: 340 }
    );
  }
  return htmlShell(`<div style="color:#fff;font-size:36px;text-align:center">${escapeHtml(overlay.text || "")}</div>`);
}

function positionForRole(role) {
  if (role === "brand") return { position: "top", offset: { x: 0, y: -0.04 } };
  if (role === "speaker") return { position: "center", offset: { x: 0, y: -0.16 } };
  if (role === "statement") return { position: "center", offset: { x: 0, y: 0.04 } };
  if (role === "source") return { position: "center", offset: { x: 0, y: 0.24 } };
  if (role === "cta") return { position: "center", offset: { x: 0, y: 0.12 } };
  return { position: "center", offset: { x: 0, y: 0 } };
}

function overlayEnd(overlays) {
  return (overlays || []).reduce((max, o) => {
    const end = Number(o.at || 0) + Number(o.length || 0);
    return Math.max(max, end);
  }, 0);
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

  const overlays = captionPlan?.overlays?.length
    ? captionPlan.overlays
    : (captionLines || []).map((line, i) => ({
        role: i === 0 ? "speaker" : i === 1 ? "statement" : "source",
        at: Number(line.at || i * 4),
        length: 3.8,
        text: line.text,
        htmlEmphasis: i === 1
      }));

  const contentEnd = Math.max(
    sceneLen * Math.max(1, videoClips.length),
    overlayEnd(overlays),
    15
  );
  /* Letzter Clip hält bis Ende – kein schwarzes Restbild hinter CTA */
  if (videoClips.length) {
    const last = videoClips[videoClips.length - 1];
    last.length = Math.max(last.length, contentEnd - last.start);
  }
  const totalDuration = contentEnd;

  const textClips = overlays.map((overlay) => {
    const pos = positionForRole(overlay.role);
    const height =
      overlay.role === "statement" ? 420 :
      overlay.role === "cta" ? 340 :
      overlay.role === "speaker" ? 220 :
      overlay.role === "source" ? 160 :
      overlay.role === "brand" ? 110 : 140;
    return {
      asset: {
        type: "html",
        html: overlayHtml(overlay),
        width: 980,
        height
      },
      start: Math.max(0, Number(overlay.at || 0)),
      length: Math.max(2.0, Number(overlay.length || 3.5)),
      position: pos.position,
      offset: pos.offset,
      /* Sanfter Einblend – kein schnelles Flash-Out */
      transition: { in: "fade", out: "fade" },
      opacity: overlay.role === "brand" ? 0.92 : 1
    };
  });

  const tracks = [
    { clips: textClips },
    { clips: videoClips }
  ];

  const brand = DAR_VIDEO_PROFILE.branding;
  const markUrl = watermarkUrl || logoUrl;
  if (markUrl) {
    tracks.unshift({
      clips: [{
        asset: { type: "image", src: markUrl },
        start: 0,
        length: totalDuration,
        position: "center",
        opacity: Number(brand.watermarkOpacity) || 0.28,
        scale: Number(brand.watermarkScale) || 0.42,
        offset: { x: 0, y: 0 }
      }]
    });
  }

  return {
    timeline: {
      /* Warmer Bildbeitrag-Ton statt kaltem Schwarz */
      background: "#1a1814",
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
      destinations: []
    }
  };
}

export async function composeFinalVideo(env, payload = {}) {
  const final = payload.final !== false;
  if (shotstackKey(env)) {
    const shot = await composeWithShotstack(env, payload, { final });
    if (shot.ok) return shot;
    const code = Number(shot.httpStatus || 0);
    const authFail = code === 401 || code === 403 || /HTTP 401|HTTP 403/i.test(String(shot.reason || ""));
    /*
     * Production gesperrt → KEIN Stage-Fallback (Shotstack-Wasserzeichen verboten).
     * Stattdessen fal-Merge als unvollständige Vorschau ohne Fremdwasserzeichen.
     */
    if (final && authFail && falKey(env)) {
      const fal = await composeWithFalFfmpeg(env, payload);
      if (fal.ok) {
        return {
          ...fal,
          composeFallback: "fal-ffmpeg",
          shotstackBlocked: shot.reason || `Shotstack HTTP ${code || "?"} (v1)`,
          note: "Shotstack Production gesperrt – fal-Merge ohne Shotstack-Wasserzeichen; DAR-Texte fehlen bis Production frei"
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
    falPhase: "merge-videos",
    voiceUrl: voiceUrl || "",
    shotstackEnv: null,
    foreignWatermarkRisk: false,
    brandingApplied: false,
    poll: async () => pollFalMerge(env, requestId, voiceUrl, { statusUrl, responseUrl, phase: "merge-videos" })
  };
}

export async function pollFalMerge(
  env,
  requestId,
  voiceUrl = "",
  { statusUrl = "", responseUrl = "", phase = "merge-videos", mergedVideoUrl = "" } = {}
) {
  const model =
    phase === "merge-audio" ? "fal-ai/ffmpeg-api/merge-audio-video" : "fal-ai/ffmpeg-api/merge-videos";
  const status = await falStatus(env, model, requestId, { statusUrl });
  const state = String(status.status || "").toUpperCase();
  if (state === "COMPLETED" || state === "OK") {
    const result = await falResult(env, model, requestId, { responseUrl });
    const url = result?.video?.url || result?.video_url || result?.output?.url || "";
    if (!url) return { ok: false, status: "failed", reason: "fal Merge ohne Video-URL" };

    // Phase 1 fertig → Stimme muxen
    if (phase !== "merge-audio" && voiceUrl) {
      const audioJob = await falQueue(
        env,
        "fal-ai/ffmpeg-api/merge-audio-video",
        { video_url: url, audio_url: voiceUrl, start_offset: 0 },
        { preferAsync: true }
      );
      const audioId = audioJob.request_id || audioJob.requestId;
      return {
        ok: true,
        status: "running",
        provider: "fal-ffmpeg",
        falPhase: "merge-audio",
        renderId: audioId,
        statusUrl: String(audioJob.status_url || audioJob.statusUrl || "").trim(),
        responseUrl: String(audioJob.response_url || audioJob.responseUrl || "").trim(),
        voiceUrl,
        mergedVideoUrl: url,
        brandingApplied: false,
        audioAttached: false
      };
    }

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
      audioAttached: Boolean(voiceUrl) || phase === "merge-audio",
      audioMuxed: phase === "merge-audio" || !voiceUrl,
      hasMusic: false,
      brandingApplied: false,
      note: voiceUrl
        ? "fal-ffmpeg mit Stimme – DAR-Texte/Wasserzeichen fehlen (Shotstack Production nötig)"
        : "fal-ffmpeg ohne Stimme/DAR-Texte – Shotstack Production nötig"
    };
  }
  if (state === "FAILED" || state === "ERROR") {
    return { ok: false, status: "failed", reason: status.error || "fal merge failed" };
  }
  return {
    ok: true,
    status: "running",
    falPhase: phase,
    renderId: requestId,
    statusUrl,
    responseUrl,
    voiceUrl,
    mergedVideoUrl
  };
}
