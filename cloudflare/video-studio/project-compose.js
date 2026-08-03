/**
 * Deterministischer Compose aus Touch-Editor-Projekt (kein generatives Text/Logo).
 */
import { DAR_VIDEO_PROFILE, publicBrandAssetUrl } from "./profile.js";
import { emphasizeHtml, escapeHtml } from "./storyboard.js";
import { buildShotstackTimeline } from "./compose.js";
import { projectToCaptionPlan } from "./project.js";

function fontFaceCss() {
  const fonts = DAR_VIDEO_PROFILE.fonts;
  return fonts.faces
    .map((f) => {
      const style = f.style ? `font-style:${f.style};` : "font-style:normal;";
      return `@font-face{font-family:'${f.family}';${style}font-weight:${f.weight};src:url('${fonts.base}/${f.file}') format('woff2');}`;
    })
    .join("");
}

function mixScriptHtml(text, arabicFamily) {
  const esc = escapeHtml(text);
  return esc.replace(
    /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFCﷺ]+)/g,
    `<span style="font-family:'${arabicFamily || "Amiri"}';font-size:1.06em;direction:rtl;unicode-bidi:embed">$1</span>`
  );
}

function panelBg(style) {
  const mode = style?.background?.mode || "soft-panel";
  if (mode === "none") return "background:transparent;border:0;box-shadow:none;padding:0;";
  const color = style?.background?.color || "rgba(12,14,16,0.78)";
  return `background:${color};border:1px solid rgba(230,200,130,0.28);border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.42);padding:18px 22px;`;
}

function elementHtml(el) {
  const style = el.style || {};
  const family = style.fontFamily || "Cormorant Garamond";
  const arabic = style.arabicFontFamily || "Amiri";
  const size = Number(style.fontSize || 42);
  const color = style.color || "#fff8e8";
  const align = style.alignment || "center";
  const weight = style.fontWeight || 600;
  const lh = style.lineHeight || 1.42;
  const ls = style.letterSpacing || 0;
  const shadow = style.shadow
    ? `text-shadow:${style.shadow.x || 0}px ${style.shadow.y || 2}px ${style.shadow.blur || 12}px ${style.shadow.color || "rgba(0,0,0,.6)"}`
    : "text-shadow:0 2px 12px rgba(0,0,0,.55)";
  const w = Math.max(200, Number(el.transform?.width || 900));
  const h = Math.max(80, Math.round(size * lh * 6));

  if (el.role === "social" && el.social) {
    const s = el.social;
    const body = `
      <div style="font-family:'${family}';font-size:${Math.round(size * 0.85)}px;line-height:1.35;margin-bottom:12px;color:${color};font-weight:${weight};${shadow}">${escapeHtml(s.followLine || "")}</div>
      <div style="font-family:Manrope,system-ui,sans-serif;font-size:${Math.round(size * 0.62)}px;display:flex;flex-direction:column;gap:8px;align-items:center;color:${color}">
        <div>✈ ${escapeHtml(s.telegram || "")}</div>
        <div>🌐 ${escapeHtml(s.website || "")}</div>
        <div>◎ ${escapeHtml(s.instagram || "")}</div>
      </div>
      <div style="margin-top:12px;font-family:'${family}';font-size:${Math.round(size * 0.55)}px;color:#efd78e;${shadow}">${escapeHtml(s.credit || "")}</div>`;
    return {
      html: `<div style="width:${w}px;min-height:200px;box-sizing:border-box;${panelBg(style)}text-align:center"><style>${fontFaceCss()}</style>${body}</div>`,
      width: w,
      height: Math.max(280, h)
    };
  }

  const raw = String(el.content || "");
  const body =
    el.role === "quote"
      ? emphasizeHtml(raw)
      : mixScriptHtml(raw, arabic);

  return {
    html: `<div style="width:${w}px;box-sizing:border-box;${panelBg(style)}text-align:${align}"><style>${fontFaceCss()}</style>
      <div style="font-family:'${family}',Georgia,serif;font-size:${size}px;font-weight:${weight};font-style:${style.fontStyle || "normal"};line-height:${lh};letter-spacing:${ls}em;color:${color};${shadow}">${body}</div>
    </div>`,
    width: w,
    height: Math.min(520, Math.max(100, h))
  };
}

function shotstackPositionFromTransform(el, canvasW = 1080, canvasH = 1920) {
  const x = Number(el.transform?.x || 0);
  const y = Number(el.transform?.y || 0);
  const w = Number(el.transform?.width || 900);
  const cx = (x + w / 2) / canvasW;
  const cy = (y + 120) / canvasH;
  // Shotstack offset: from center, -1..1 roughly via offset x/y
  return {
    position: "center",
    offset: {
      x: Number(((cx - 0.5) * 2).toFixed(3)),
      y: Number(((0.5 - cy) * 2).toFixed(3))
    }
  };
}

/**
 * Baut Shotstack-Timeline direkt aus Editor-Projekt (Positionen/Styles aus Editor).
 */
export function buildTimelineFromProject(env, project) {
  const clipUrls = project.background?.clipUrls?.filter(Boolean) || [];
  const voiceUrl = (project.audioTracks || []).find((a) => a.type === "voice")?.url || "";
  const captionPlan = projectToCaptionPlan(project);

  // Basis-Timeline (Clips + Meta), dann Textclips durch Editor-HTML ersetzen
  const base = buildShotstackTimeline({
    clipUrls: clipUrls.length ? clipUrls : ["https://example.com/placeholder.mp4"],
    voiceUrl,
    captionPlan,
    watermarkUrl: publicBrandAssetUrl(env || {}, DAR_VIDEO_PROFILE.branding.watermarkPublicPath),
    logoUrl: publicBrandAssetUrl(env || {}, DAR_VIDEO_PROFILE.branding.logoPublicPath),
    sceneDurationSec: Math.max(3, (Number(project.duration) || 15) / 3)
  });

  if (!clipUrls.length) {
    // Kein echter Clip – nur Struktur für Validierung/Preview-Meta
    return { ...base, previewOnly: true };
  }

  const duration = Number(project.duration) || 15;
  const textElements = (project.elements || []).filter(
    (el) => el.visible && el.role !== "watermark" && (el.type === "text" || el.type === "social" || el.role === "social")
  );

  const textClips = textElements.map((el) => {
    const built = elementHtml(el);
    const pos = shotstackPositionFromTransform(el);
    return {
      asset: { type: "html", html: built.html, width: built.width, height: built.height },
      start: Math.max(0, el.timing.start),
      length: Math.max(0.4, el.timing.end - el.timing.start),
      position: pos.position,
      offset: pos.offset,
      opacity: Number(el.opacity ?? 1),
      transition: { in: "fade", out: "fade" }
    };
  });

  const wm = (project.elements || []).find((el) => el.role === "watermark" && el.visible);
  const brand = DAR_VIDEO_PROFILE.branding;
  const markUrl =
    String(env?.VIDEO_STUDIO_WATERMARK_URL || "").trim() ||
    publicBrandAssetUrl(env || {}, brand.watermarkPublicPath);

  const tracks = [];
  if (wm && markUrl) {
    const scale = Number(wm.scale || brand.watermarkScale || 0.44);
    tracks.push({
      clips: [{
        asset: { type: "image", src: markUrl },
        start: Math.max(0, wm.timing.start),
        length: Math.max(0.5, wm.timing.end - wm.timing.start),
        position: "center",
        opacity: Number(wm.opacity ?? brand.watermarkOpacity ?? 0.09),
        scale,
        offset: {
          x: Number((((wm.transform.x + wm.transform.width / 2) / 1080 - 0.5) * 2).toFixed(3)),
          y: Number((((0.5 - (wm.transform.y + 270) / 1920)) * 2).toFixed(3))
        }
      }]
    });
  }

  const dimFrom = Number(project.background?.dimFrom ?? duration - 2.5);
  const dimOpacity = Number(project.background?.dimOpacity ?? 0.34);
  const dimClip = {
    asset: {
      type: "html",
      html: `<div style="width:1080px;height:1920px;background:rgba(0,0,0,${dimOpacity})"></div>`,
      width: 1080,
      height: 1920
    },
    start: Math.max(0, dimFrom),
    length: Math.max(0.5, duration - dimFrom),
    position: "center"
  };

  tracks.push({ clips: [dimClip, ...textClips] });

  const sceneLen = duration / Math.max(1, clipUrls.length);
  const videoClips = clipUrls.map((src, index) => ({
    asset: { type: "video", src, volume: 0 },
    start: index * sceneLen,
    length: index === clipUrls.length - 1 ? duration - index * sceneLen : sceneLen,
    fit: "cover"
  }));
  tracks.push({ clips: videoClips });

  return {
    timeline: {
      background: "#1a1814",
      soundtrack: voiceUrl ? { src: voiceUrl, effect: "fadeOut", volume: 1 } : undefined,
      tracks
    },
    output: {
      format: "mp4",
      size: { width: 1080, height: 1920 },
      fps: 30,
      quality: "high",
      destinations: []
    },
    meta: {
      durationSec: duration,
      watermarkCount: wm ? 1 : 0,
      watermark: wm
        ? {
            position: "center",
            scale: Number(wm.scale || 0.44),
            opacity: Number(wm.opacity ?? 0.09)
          }
        : null,
      lastClipCoversEnd: true,
      background: "#1a1814",
      previewFrames: [2, 6, 10, 13, Math.max(1, duration - 0.2)],
      fromEditor: true
    }
  };
}
