import { DAR_VIDEO_PROFILE, publicBrandAssetUrl } from "./profile.js";
import { emphasizeHtml, escapeHtml } from "./storyboard.js";
import { DAR_INTRO_SEC, computeSpeechImageDurationSec } from "./timeline.js";

function shotstackKey(env) {
  return String(env.SHOTSTACK_API_KEY || "").trim();
}

/** Stage = interne Tests (Fremdwasserzeichen möglich). v1 = Freigabe-Endfassung. */
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
  return Boolean(shotstackKey(env));
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
      reason: prodOk ? null : `Shotstack Production (v1) HTTP ${prodRes.status}`
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
  const tg = `<span style="display:inline-flex;align-items:center;gap:6px;margin:0 8px;white-space:nowrap"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path d="M17.6 6.8 5.8 11.35c-.8.32-.8.77-.15.97l3.03.95 1.17 3.74c.15.42.08.58.52.58.34 0 .49-.15.68-.34l1.64-1.6 3.42 2.53c.63.35 1.08.17 1.24-.58l2.1-9.9c.24-.92-.35-1.34-.94-1.07Z" fill="#fff"/></svg><span style="font-family:${typo.ui};font-size:18px;font-weight:600;color:${typo.cream}">${escapeHtml(b.telegram)}</span></span>`;
  const ig = `<span style="display:inline-flex;align-items:center;gap:6px;margin:0 8px;white-space:nowrap"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igv" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f58529"/><stop offset="45%" stop-color="#dd2a7b"/><stop offset="100%" stop-color="#515bd4"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igv)"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.3" fill="#fff"/></svg><span style="font-family:${typo.ui};font-size:18px;font-weight:600;color:${typo.cream}">${escapeHtml(b.instagram)}</span></span>`;
  const web = `<span style="display:inline-flex;align-items:center;gap:6px;margin:0 8px;white-space:nowrap"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="${typo.gold}" stroke-width="1.6"/><path d="M3 12h18M12 3c2.8 3 4.2 6 4.2 9s-1.4 6-4.2 9c-2.8-3-4.2-6-4.2-9s1.4-6 4.2-9Z" fill="none" stroke="${typo.gold}" stroke-width="1.4"/></svg><span style="font-family:${typo.ui};font-size:18px;font-weight:600;color:${typo.cream}">${escapeHtml(b.website)}</span></span>`;
  return `${tg}${web}${ig}`;
}

function softPanel(extra = "") {
  const typo = DAR_VIDEO_PROFILE.typography;
  return `background:rgba(8,10,14,0.42);border:1px solid rgba(230,200,130,0.16);border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.28);padding:16px 22px;box-sizing:border-box;${extra}`;
}

function mixScriptHtml(text, typo) {
  const esc = escapeHtml(text);
  return esc.replace(
    /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFCﷺ]+)/g,
    `<span style="font-family:${typo.arabic};font-size:1.06em;direction:rtl;unicode-bidi:embed;letter-spacing:0">$1</span>`
  );
}

function overlayHtml(overlay) {
  const typo = DAR_VIDEO_PROFILE.typography;
  const b = DAR_VIDEO_PROFILE.branding;

  if (overlay.role === "brand") {
    return htmlShell(
      `<div style="text-align:center;width:100%;padding-top:8px">
        <div style="font-family:${typo.display};font-size:26px;letter-spacing:.18em;color:${typo.gold};font-weight:700;line-height:1.15;text-shadow:0 2px 12px rgba(0,0,0,.55)">${escapeHtml(b.title)}</div>
      </div>`,
      { height: 88 }
    );
  }
  if (overlay.role === "speaker") {
    return htmlShell(
      `<div style="${softPanel("max-width:900px;text-align:center;padding:14px 20px")}">
        <div style="font-family:${typo.display};font-size:34px;line-height:1.4;color:${typo.cream};font-weight:600;text-shadow:0 2px 14px rgba(0,0,0,.6)">${mixScriptHtml(overlay.text, typo)}</div>
      </div>`,
      { height: 160 }
    );
  }
  if (overlay.role === "statement") {
    const body = overlay.htmlEmphasis ? emphasizeHtml(overlay.text) : escapeHtml(overlay.text);
    return htmlShell(
      `<div style="${softPanel("max-width:920px;text-align:center")}">
        <div style="font-family:${typo.body};font-size:42px;line-height:1.42;color:${typo.cream};font-weight:600;letter-spacing:.01em;text-shadow:0 3px 16px rgba(0,0,0,.65)">${body}</div>
      </div>`,
      { height: 360 }
    );
  }
  if (overlay.role === "source") {
    return htmlShell(
      `<div style="${softPanel("max-width:880px;text-align:center;padding:12px 20px")}">
        <div style="font-family:${typo.source};font-size:24px;font-style:italic;letter-spacing:.015em;line-height:1.4;color:${typo.soft};text-shadow:0 2px 12px rgba(0,0,0,.55)">${mixScriptHtml(overlay.text, typo)}</div>
      </div>`,
      { height: 120 }
    );
  }
  if (overlay.role === "cta") {
    /* Kompakter dauerhafter Footer – kein Outro-Panel */
    return htmlShell(
      `<div style="text-align:center;width:100%;padding:8px 10px 4px;box-sizing:border-box;background:linear-gradient(180deg,transparent,rgba(6,8,12,0.55) 28%,rgba(6,8,12,0.72));border-radius:0">
        <div style="font-family:${typo.display};font-size:22px;line-height:1.3;margin-bottom:10px;color:${typo.cream};font-weight:600;text-shadow:0 2px 10px rgba(0,0,0,.55)">${escapeHtml(b.followLine)}</div>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px">${socialRowHtml(b, typo)}</div>
        <div style="font-family:${typo.display};font-size:18px;letter-spacing:.04em;color:${typo.gold};text-shadow:0 2px 8px rgba(0,0,0,.45)">${escapeHtml(b.credit)}</div>
      </div>`,
      { height: 200 }
    );
  }
  return htmlShell(`<div style="color:#fff;font-size:36px;text-align:center">${escapeHtml(overlay.text || "")}</div>`);
}

function positionForRole(role) {
  if (role === "brand") return { position: "top", offset: { x: 0, y: -0.02 } };
  if (role === "speaker") return { position: "center", offset: { x: 0, y: -0.18 } };
  if (role === "statement") return { position: "center", offset: { x: 0, y: -0.02 } };
  if (role === "source") return { position: "center", offset: { x: 0, y: 0.18 } };
  if (role === "cta") return { position: "bottom", offset: { x: 0, y: 0.02 } };
  return { position: "center", offset: { x: 0, y: 0 } };
}

function clipLengthForRole(role, length, totalDuration) {
  const n = Number(length || 0);
  if (role === "brand" || role === "cta") {
    return Math.max(totalDuration - 0.02, n || totalDuration);
  }
  if (role === "source") return Math.max(2.0, n || 2.0);
  if (role === "speaker") return Math.max(1.8, n || 2.0);
  return Math.max(1.6, n || 3.0);
}

/**
 * Sprach-Bildbeitrag: ein Standbild (Ken Burns) + Stimme + DAR-Texte.
 * clipUrls werden nur als Legacy-Fallback genutzt, wenn kein sceneImageUrl gesetzt ist.
 */
export function buildShotstackTimeline({
  sceneImageUrl,
  clipUrls,
  voiceUrl,
  captionPlan,
  captionLines,
  watermarkUrl,
  logoUrl,
  durationSec,
  voiceStartSec,
  kenBurns = "zoomIn"
} = {}) {
  const overlays = captionPlan?.overlays?.length
    ? captionPlan.overlays
    : (captionLines || []).map((line, i) => ({
        role: i === 0 ? "speaker" : i === 1 ? "statement" : "source",
        at: Number(line.at || i * 4),
        length: 3.8,
        text: line.text,
        htmlEmphasis: i === 1
      }));

  const planned =
    Number(durationSec) ||
    Number(captionPlan?.durationSec) ||
    computeSpeechImageDurationSec(Number(captionPlan?.voiceDurationSec) || 8);
  const overlayEnd = (overlays || []).reduce((max, o) => {
    return Math.max(max, Number(o.at || 0) + Number(o.length || 0));
  }, 0);
  const totalDuration = Math.max(10, planned, overlayEnd + 0.2);
  const voiceStart = Number(voiceStartSec ?? captionPlan?.voiceStart ?? DAR_INTRO_SEC);
  const imageUrl = String(sceneImageUrl || "").trim() || String((clipUrls || [])[0] || "").trim();

  const stillClip = imageUrl
    ? {
        asset: { type: "image", src: imageUrl },
        start: 0,
        length: totalDuration,
        fit: "cover",
        effect: kenBurns === "none" ? undefined : kenBurns || "zoomIn"
      }
    : null;

  /* Leichte Lesbarkeitszone über die gesamte Dauer – keine Endkarte */
  const readZone = {
    asset: {
      type: "html",
      html: `<div style="width:1080px;height:1920px;background:linear-gradient(180deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.08) 18%,rgba(0,0,0,0.10) 52%,rgba(0,0,0,0.34) 78%,rgba(0,0,0,0.52) 100%)"></div>`,
      width: 1080,
      height: 1920
    },
    start: 0,
    length: totalDuration,
    position: "center",
    opacity: 1
  };

  const persistent = [];
  const content = [];
  for (const overlay of overlays) {
    const pos = positionForRole(overlay.role);
    const height =
      overlay.role === "statement" ? 360 :
      overlay.role === "cta" ? 200 :
      overlay.role === "speaker" ? 160 :
      overlay.role === "source" ? 120 :
      overlay.role === "brand" ? 88 : 140;
    const isPersist = overlay.role === "brand" || overlay.role === "cta" || overlay.persistent;
    const clip = {
      asset: {
        type: "html",
        html: overlayHtml(overlay),
        width: 980,
        height
      },
      start: Math.max(0, Number(overlay.at || 0)),
      length: clipLengthForRole(overlay.role, overlay.length, totalDuration),
      position: pos.position,
      offset: pos.offset,
      transition: isPersist ? { in: "fade" } : { in: "fade", out: "fade" },
      opacity: 1
    };
    if (isPersist) persistent.push(clip);
    else content.push(clip);
  }

  const brand = DAR_VIDEO_PROFILE.branding;
  const markUrl = watermarkUrl || logoUrl;
  const wmOpacity = Math.min(0.10, Math.max(0.08, Number(brand.watermarkOpacity) || 0.09));
  const watermarkClip = markUrl
    ? {
        asset: { type: "image", src: markUrl },
        start: 0,
        length: totalDuration,
        position: "center",
        opacity: wmOpacity,
        scale: Number(brand.watermarkScale) || 0.44,
        offset: { x: 0, y: 0 }
      }
    : null;

  const audioClips = voiceUrl
    ? [
        {
          asset: { type: "audio", src: voiceUrl, volume: 1 },
          start: Math.max(0, voiceStart),
          length: Math.max(4, totalDuration - voiceStart - 0.35)
        }
      ]
    : [];

  /* Ebenen: Branding/Text fest – Hintergrund separat (Ken Burns bewegt nur das Bild) */
  const tracks = [];
  if (watermarkClip) tracks.push({ clips: [watermarkClip] });
  if (persistent.length) tracks.push({ clips: persistent });
  if (content.length) tracks.push({ clips: content });
  tracks.push({ clips: [readZone] });
  if (stillClip) tracks.push({ clips: [stillClip] });
  if (audioClips.length) tracks.push({ clips: audioClips });

  const brandOverlay = overlays.find((o) => o.role === "brand");
  const ctaOverlay = overlays.find((o) => o.role === "cta");
  const meta = {
    durationSec: totalDuration,
    mode: "speech-image",
    layout: "full-brand-frame",
    noEndCard: true,
    kenBurns: kenBurns || "zoomIn",
    sceneImageUrl: imageUrl || null,
    watermarkCount: watermarkClip ? 1 : 0,
    watermark: watermarkClip
      ? { position: watermarkClip.position, scale: watermarkClip.scale, opacity: watermarkClip.opacity }
      : null,
    brandPersistent: Boolean(brandOverlay && Number(brandOverlay.length) >= totalDuration - 0.5),
    ctaPersistent: Boolean(ctaOverlay && Number(ctaOverlay.length) >= totalDuration - 0.5),
    lastClipCoversEnd: Boolean(stillClip && stillClip.length >= totalDuration - 0.05),
    background: "#1a1814",
    previewFrames: [
      Math.min(1.2, totalDuration - 0.5),
      Math.min(Math.round(totalDuration * 0.35), totalDuration - 0.5),
      Math.min(Math.round(totalDuration * 0.7), totalDuration - 0.5),
      Math.max(1, totalDuration - 0.8)
    ].map((n) => Number(n.toFixed(1)))
  };

  return {
    timeline: {
      background: "#1a1814",
      tracks
    },
    output: {
      format: "mp4",
      size: { width: DAR_VIDEO_PROFILE.width, height: DAR_VIDEO_PROFILE.height },
      fps: DAR_VIDEO_PROFILE.fps,
      quality: "high",
      destinations: []
    },
    meta
  };
}

export async function composeFinalVideo(env, payload = {}) {
  const final = payload.final !== false;
  if (!shotstackKey(env)) {
    return {
      ok: false,
      setupRequired: true,
      reason: "SHOTSTACK_API_KEY fehlt – Sprach-Bildbeitrag braucht Shotstack für das MP4."
    };
  }
  if (!String(payload.sceneImageUrl || "").trim() && !(payload.clipUrls || []).length) {
    return { ok: false, reason: "Ausgangsbild fehlt für den Sprach-Bildbeitrag" };
  }
  return composeWithShotstack(env, payload, { final });
}

async function composeWithShotstack(env, payload, { final }) {
  const envInfo = shotstackEnvironment(env, { final });
  if (final && envInfo.isStage) {
    return {
      ok: false,
      httpStatus: 0,
      reason: "Endfassung darf nicht über Shotstack Stage laufen (Fremdwasserzeichen)",
      shotstackEnv: "stage"
    };
  }
  const brands = brandUrls(env);
  const bodyFull = buildShotstackTimeline({
    sceneImageUrl: payload.sceneImageUrl,
    clipUrls: payload.clipUrls,
    voiceUrl: payload.voiceUrl,
    captionPlan: payload.captionPlan,
    captionLines: payload.captionLines,
    watermarkUrl: brands.watermarkUrl,
    logoUrl: brands.logoUrl,
    durationSec: payload.durationSec,
    voiceStartSec: payload.voiceStartSec,
    kenBurns: payload.kenBurns || "zoomIn"
  });
  return submitShotstackTimeline(env, bodyFull, { final, envInfo });
}

export async function submitShotstackTimeline(env, bodyFull, { final = true, envInfo = null } = {}) {
  const info = envInfo || shotstackEnvironment(env, { final });
  const { meta: timelineMeta, ...body } = bodyFull;
  const res = await fetch(`${info.host}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": shotstackKey(env)
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      httpStatus: res.status,
      reason: data?.message || data?.response?.message || `Shotstack HTTP ${res.status} (${info.isStage ? "stage" : "v1"})`,
      shotstackEnv: info.isStage ? "stage" : "v1"
    };
  }
  const renderId = data?.response?.id || data?.id || "";
  return {
    ok: true,
    provider: "shotstack",
    renderId,
    shotstackEnv: info.isStage ? "stage" : "v1",
    host: info.host,
    foreignWatermarkRisk: info.isStage,
    brandingApplied: true,
    isPreview: info.isStage,
    timelineMeta: timelineMeta || null,
    durationSeconds: Number(timelineMeta?.durationSec || 15),
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

/** Legacy: fal-ffmpeg ist für Sprach-Bildbeiträge deaktiviert. */
export async function pollFalMerge() {
  return { ok: false, status: "failed", reason: "fal-ffmpeg ist für Sprach-Bildbeiträge deaktiviert" };
}
