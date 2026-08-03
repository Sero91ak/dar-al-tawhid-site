/**
 * DAR-Video-Projektmodell (Touch-Editor Phase 1)
 */
import { DAR_VIDEO_PROFILE } from "./profile.js";
import { DAR_CAPTION_SLOTS, DAR_VIDEO_DURATION_SEC } from "./timeline.js";

function uid(prefix = "el") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

const DEFAULT_TEXT_STYLE = Object.freeze({
  fontFamily: "Cormorant Garamond",
  arabicFontFamily: "Amiri",
  fontSize: 46,
  fontWeight: 600,
  fontStyle: "normal",
  color: "#fff8e8",
  alignment: "center",
  lineHeight: 1.42,
  letterSpacing: 0.01,
  shadow: { color: "rgba(0,0,0,0.65)", blur: 14, x: 0, y: 3 },
  background: { mode: "soft-panel" },
  segments: []
});

export const DAR_EDITOR_TEMPLATES = Object.freeze([
  {
    id: "dar-gold-elegant",
    label: "DAR Gold Elegant",
    colors: { cream: "#fff8e8", gold: "#efd78e", panel: "rgba(12,14,16,0.78)" }
  },
  {
    id: "dar-royal-night",
    label: "DAR Royal Night",
    colors: { cream: "#eef3ff", gold: "#d4b56a", panel: "rgba(8,12,28,0.82)" }
  },
  {
    id: "dar-cream-classic",
    label: "DAR Cream Classic",
    colors: { cream: "#f7efe0", gold: "#c9a227", panel: "rgba(28,20,12,0.72)" }
  },
  {
    id: "dar-manuscript",
    label: "DAR Manuscript",
    colors: { cream: "#f3e6c8", gold: "#b8923a", panel: "rgba(24,16,10,0.7)" }
  },
  {
    id: "dar-cinematic-minimal",
    label: "DAR Cinematic Minimal",
    colors: { cream: "#ffffff", gold: "#efd78e", panel: "rgba(0,0,0,0.45)" }
  }
]);

function styleForRole(role, templateColors) {
  const c = templateColors || DAR_EDITOR_TEMPLATES[0].colors;
  if (role === "branding") {
    return {
      ...DEFAULT_TEXT_STYLE,
      fontFamily: "Cormorant Garamond",
      fontSize: 30,
      fontWeight: 700,
      color: c.gold,
      letterSpacing: 0.16,
      background: { mode: "none" }
    };
  }
  if (role === "speaker") {
    return {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 40,
      color: c.cream,
      background: { mode: "soft-panel", color: c.panel }
    };
  }
  if (role === "quote") {
    return {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 46,
      color: c.cream,
      background: { mode: "soft-panel", color: c.panel }
    };
  }
  if (role === "source") {
    return {
      ...DEFAULT_TEXT_STYLE,
      fontFamily: "EB Garamond",
      fontSize: 28,
      fontStyle: "italic",
      color: "#e8dcc0",
      background: { mode: "soft-panel", color: c.panel }
    };
  }
  if (role === "footer" || role === "social") {
    return {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 28,
      color: c.cream,
      background: { mode: "soft-panel", color: c.panel }
    };
  }
  return { ...DEFAULT_TEXT_STYLE };
}

function transformForRole(role) {
  // Design-Koordinaten: 1080×1920 – feste Branding-Rahmen (nicht mit Ken Burns)
  if (role === "branding") return { x: 90, y: 96, width: 900, rotation: 0 };
  if (role === "speaker") return { x: 70, y: 420, width: 940, rotation: 0 };
  if (role === "quote") return { x: 60, y: 600, width: 960, rotation: 0 };
  if (role === "source") return { x: 70, y: 1120, width: 940, rotation: 0 };
  if (role === "watermark") return { x: 270, y: 700, width: 540, rotation: 0 };
  if (role === "social" || role === "footer") return { x: 50, y: 1580, width: 980, rotation: 0 };
  return { x: 90, y: 800, width: 900, rotation: 0 };
}

function emptyValidation() {
  return {
    noForeignWatermark: false,
    noMissingGlyphs: false,
    onlyOneDarLogo: false,
    darLogoCentered: false,
    socialIconsValid: false,
    sourceReadable: false,
    textInsideSafeArea: false,
    noAnachronisticObjects: false,
    noVisibleFaces: false,
    noEmptyEndScreen: false,
    noInventedCategory: false,
    audioPresent: false,
    durationValid: false,
    speechSynchronized: false
  };
}

/**
 * Baut ein editierbares Projekt aus Job/CaptionPlan (Auto-Modus Ergebnis).
 */
export function createProjectFromJob({
  jobId = "",
  name = "",
  statement = {},
  captionPlan = null,
  sceneImageUrl = "",
  voiceUrl = "",
  clipUrls = [],
  templateId = "dar-gold-elegant",
  durationSec = DAR_VIDEO_DURATION_SEC
} = {}) {
  const brand = DAR_VIDEO_PROFILE.branding;
  const tpl = DAR_EDITOR_TEMPLATES.find((t) => t.id === templateId) || DAR_EDITOR_TEMPLATES[0];
  const plan = captionPlan || { overlays: [] };
  const duration = Math.max(10, Number(durationSec) || DAR_VIDEO_DURATION_SEC);
  const elements = [];

  const pushText = (role, content, timing, extra = {}) => {
    if (!String(content || "").trim() && role !== "social") return;
    elements.push({
      id: uid(role),
      type: role === "watermark" ? "logo" : role === "social" ? "social" : "text",
      role,
      content: String(content || ""),
      transform: { ...transformForRole(role), ...(extra.transform || {}) },
      timing: {
        start: Number(timing.start || 0),
        end: Number(timing.end || duration),
        duration: Number(timing.end || duration) - Number(timing.start || 0)
      },
      style: { ...styleForRole(role, tpl.colors), ...(extra.style || {}) },
      animationIn: { type: "fade", durationMs: 600 },
      animationOut: { type: "fade", durationMs: 400 },
      keyframes: [],
      visible: true,
      locked: role === "watermark" ? false : false,
      opacity: role === "watermark" ? Number(brand.watermarkOpacity) || 0.09 : 1,
      ...extra
    });
  };

  const byRole = {};
  (plan.overlays || []).forEach((o) => {
    const role =
      o.role === "brand" ? "branding" :
      o.role === "statement" ? "quote" :
      o.role === "cta" ? "social" :
      o.role;
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(o);
  });

  if (byRole.branding?.[0]) {
    pushText("branding", byRole.branding[0].text || brand.title, {
      start: 0,
      end: duration
    });
  } else {
    pushText("branding", brand.title, { start: 0, end: duration });
  }

  if (byRole.speaker?.[0]) {
    pushText("speaker", byRole.speaker[0].text, {
      start: byRole.speaker[0].at,
      end: byRole.speaker[0].at + byRole.speaker[0].length
    });
  }

  (byRole.quote || []).forEach((o, i) => {
    const t = transformForRole("quote");
    t.y = 560 + i * 36;
    pushText("quote", o.text, { start: o.at, end: o.at + o.length }, { transform: t, blockIndex: i });
  });

  if (byRole.source?.[0]) {
    pushText("source", byRole.source[0].text || statement.source || "", {
      start: byRole.source[0].at,
      end: Math.max(byRole.source[0].at + byRole.source[0].length, duration)
    });
  }

  const social = byRole.social?.[0];
  pushText(
    "social",
    [
      brand.followLine,
      brand.telegram,
      brand.website,
      brand.instagram,
      brand.credit
    ].join("\n"),
    {
      start: 0,
      end: duration
    },
    {
      social: {
        followLine: brand.followLine,
        telegram: brand.telegram,
        website: brand.website,
        instagram: brand.instagram,
        credit: brand.credit,
        layout: "vertical"
      }
    }
  );
  void social;

  elements.push({
    id: uid("wm"),
    type: "logo",
    role: "watermark",
    content: brand.watermarkPublicPath || "/watermark-my-logo-full.png",
    transform: transformForRole("watermark"),
    timing: { start: 0, end: duration, duration },
    style: { ...DEFAULT_TEXT_STYLE },
    animationIn: { type: "fade", durationMs: 800 },
    animationOut: { type: "none", durationMs: 0 },
    keyframes: [],
    visible: true,
    locked: false,
    opacity: Number(brand.watermarkOpacity) || 0.09,
    scale: Number(brand.watermarkScale) || 0.44
  });

  const projectName =
    String(name || "").trim() ||
    `${String(statement.speaker || "DAR").slice(0, 40)} – Video`;

  return {
    id: uid("proj"),
    jobId: String(jobId || ""),
    name: projectName,
    width: 1080,
    height: 1920,
    duration,
    frameRate: 30,
    mode: "schnell",
    templateId: tpl.id,
    background: {
      assetId: sceneImageUrl || "",
      assetUrl: sceneImageUrl || "",
      clipUrls: Array.isArray(clipUrls) ? clipUrls.slice() : [],
      motionType: "subtle-camera",
      startTransform: { x: 0, y: 0, scale: 1 },
      endTransform: { x: 0, y: 0, scale: 1.06 },
      protectOriginalContent: true,
      dimFrom: Math.max(0, duration - 2.5),
      dimOpacity: 0.34
    },
    elements,
    audioTracks: [
      {
        id: uid("aud"),
        type: "voice",
        url: voiceUrl || "",
        start: 0,
        end: duration,
        volume: 1,
        fadeInMs: 0,
        fadeOutMs: 400
      }
    ],
    history: [],
    historyIndex: -1,
    validation: emptyValidation(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    version: 1
  };
}

export function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const duration = Math.max(5, Number(raw.duration) || 15);
  const elements = Array.isArray(raw.elements) ? raw.elements.map((el) => ({
    ...el,
    transform: {
      x: Number(el.transform?.x || 0),
      y: Number(el.transform?.y || 0),
      width: Number(el.transform?.width || 900),
      rotation: Number(el.transform?.rotation || 0)
    },
    timing: {
      start: Number(el.timing?.start || 0),
      end: Number(el.timing?.end || duration),
      duration: Number(el.timing?.end || duration) - Number(el.timing?.start || 0)
    },
    opacity: Number(el.opacity ?? 1),
    visible: el.visible !== false,
    locked: Boolean(el.locked)
  })) : [];
  return {
    ...raw,
    width: 1080,
    height: 1920,
    frameRate: 30,
    duration,
    elements,
    updatedAt: nowIso()
  };
}

export function scaleProjectDuration(project, nextDuration, { proportional = true } = {}) {
  const prev = Math.max(0.1, Number(project.duration) || 15);
  const next = Math.max(5, Number(nextDuration) || 15);
  const ratio = next / prev;
  const elements = (project.elements || []).map((el) => {
    if (!proportional) {
      return {
        ...el,
        timing: {
          start: Math.min(el.timing.start, next),
          end: Math.min(el.timing.end, next),
          duration: Math.max(0.2, Math.min(el.timing.end, next) - Math.min(el.timing.start, next))
        }
      };
    }
    const start = Number((el.timing.start * ratio).toFixed(2));
    const end = Number((el.timing.end * ratio).toFixed(2));
    return { ...el, timing: { start, end, duration: Number((end - start).toFixed(2)) } };
  });
  return normalizeProject({
    ...project,
    duration: next,
    elements,
    background: {
      ...project.background,
      dimFrom: Math.max(0, next - 2.5)
    },
    audioTracks: (project.audioTracks || []).map((a) => ({
      ...a,
      end: proportional ? Number((a.end * ratio).toFixed(2)) : Math.min(a.end, next)
    }))
  });
}

export function projectToCaptionPlan(project) {
  const overlays = [];
  (project.elements || []).forEach((el) => {
    if (!el.visible) return;
    if (el.type === "logo" && el.role === "watermark") return;
    const role =
      el.role === "branding" ? "brand" :
      el.role === "quote" ? "statement" :
      el.role === "social" ? "cta" :
      el.role;
    overlays.push({
      role,
      at: el.timing.start,
      length: Math.max(0.4, el.timing.end - el.timing.start),
      text: el.role === "social"
        ? (el.social?.followLine || el.content || "")
        : el.content,
      topic: null,
      htmlEmphasis: el.role === "quote",
      credit: el.social?.credit,
      social: el.social
        ? {
            telegram: el.social.telegram,
            website: el.social.website,
            instagram: el.social.instagram
          }
        : undefined,
      editor: {
        transform: el.transform,
        style: el.style,
        opacity: el.opacity
      }
    });
  });
  overlays.sort((a, b) => a.at - b.at);
  return {
    version: 6,
    templateId: project.templateId || DAR_VIDEO_PROFILE.id,
    durationSec: project.duration,
    overlays,
    captionLines: overlays.map((o) => ({ at: o.at, text: o.text, role: o.role }))
  };
}

export function applyTemplateToProject(project, templateId) {
  const tpl = DAR_EDITOR_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl || !project) return project;
  const colors = tpl.colors;
  const elements = (project.elements || []).map((el) => {
    const base = styleForRole(el.role === "quote" ? "quote" : el.role, colors);
    return {
      ...el,
      style: {
        ...base,
        ...(el.style || {}),
        color: el.role === "branding" || el.role === "watermark" ? colors.gold : (el.role === "source" ? "#e8dcc0" : colors.cream),
        background: el.style?.background?.mode === "none"
          ? { mode: "none" }
          : { mode: "soft-panel", color: colors.panel }
      }
    };
  });
  return normalizeProject({
    ...project,
    templateId: tpl.id,
    elements
  });
}

export function groupElements(project, ids) {
  const set = new Set(ids || []);
  if (set.size < 2) return project;
  const groupId = uid("grp");
  const elements = (project.elements || []).map((el) =>
    set.has(el.id) ? { ...el, groupId } : el
  );
  return normalizeProject({ ...project, elements });
}

export function ungroupElements(project, groupId) {
  const elements = (project.elements || []).map((el) =>
    el.groupId === groupId ? { ...el, groupId: null } : el
  );
  return normalizeProject({ ...project, elements });
}

export function moveElements(project, ids, dx, dy) {
  const set = new Set(ids || []);
  const elements = (project.elements || []).map((el) => {
    if (!set.has(el.id) || el.locked) return el;
    return {
      ...el,
      transform: {
        ...el.transform,
        x: Math.round(el.transform.x + dx),
        y: Math.round(el.transform.y + dy)
      }
    };
  });
  return normalizeProject({ ...project, elements });
}

export function alignElements(project, ids, mode = "center-x") {
  const set = new Set(ids || []);
  const targets = (project.elements || []).filter((el) => set.has(el.id));
  if (!targets.length) return project;
  const canvasW = 1080;
  const canvasH = 1920;
  const elements = (project.elements || []).map((el) => {
    if (!set.has(el.id) || el.locked) return el;
    const t = { ...el.transform };
    if (mode === "center-x" || mode === "center") t.x = Math.round((canvasW - t.width) / 2);
    if (mode === "center-y" || mode === "center") t.y = Math.round(canvasH / 2 - 80);
    if (mode === "top") t.y = 110;
    if (mode === "bottom") t.y = canvasH - 360;
    if (mode === "left") t.x = 70;
    if (mode === "right") t.x = canvasW - t.width - 70;
    return { ...el, transform: t };
  });
  return normalizeProject({ ...project, elements });
}

export function extractTemplatePayload(project) {
  return {
    id: uid("tpl"),
    label: project.name || "Eigene DAR-Vorlage",
    createdAt: nowIso(),
    templateId: project.templateId,
    duration: project.duration,
    elements: (project.elements || []).map((el) => ({
      role: el.role,
      type: el.type,
      style: el.style,
      transform: el.transform,
      opacity: el.opacity,
      animationIn: el.animationIn,
      animationOut: el.animationOut,
      social: el.social,
      scale: el.scale
    })),
    background: {
      motionType: project.background?.motionType,
      dimOpacity: project.background?.dimOpacity,
      protectOriginalContent: project.background?.protectOriginalContent !== false
    }
  };
}
