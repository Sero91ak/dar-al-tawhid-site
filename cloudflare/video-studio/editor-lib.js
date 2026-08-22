/**
 * Editor-Hilfen: Lesedauer, Kontrast, Hervorhebungen, Keyframes, Animationen
 */

export const HIGHLIGHT_PRESETS = Object.freeze({
  "dar-gold": {
    label: "DAR Gold",
    color: "#efd78e",
    fontWeight: 700,
    underline: false,
    scale: 1.08,
    shadow: true
  },
  "dar-script": {
    label: "DAR Script",
    fontFamily: "Great Vibes",
    color: "#efd78e",
    fontWeight: 400,
    underline: false,
    scale: 1.12
  },
  "dar-line": {
    label: "DAR Linie",
    color: "#efd78e",
    underline: true,
    fontWeight: 600
  },
  "dar-fokus": {
    label: "DAR Fokus",
    color: "#fff8e8",
    fontWeight: 800,
    scale: 1.15
  },
  "dar-leise": {
    label: "DAR Leise",
    color: "#d2c9b7",
    fontWeight: 500,
    opacity: 0.82
  }
});

export const ANIMATION_PRESETS = Object.freeze({
  fade: { label: "Sanft einblenden", type: "fade", durationMs: 600, distancePx: 0 },
  "from-bottom": { label: "Langsam von unten", type: "slide", durationMs: 650, distancePx: 18, dir: "up" },
  "from-top": { label: "Langsam von oben", type: "slide", durationMs: 650, distancePx: 18, dir: "down" },
  "from-left": { label: "Leicht von links", type: "slide", durationMs: 550, distancePx: 14, dir: "right" },
  "from-right": { label: "Leicht von rechts", type: "slide", durationMs: 550, distancePx: 14, dir: "left" },
  none: { label: "Keine Animation", type: "none", durationMs: 0, distancePx: 0 }
});

export const SOCIAL_LAYOUTS = Object.freeze([
  "horizontal",
  "vertical",
  "zweizeilig",
  "minimal",
  "gold-elegant",
  "royal-night",
  "cream-classic"
]);

/** Empfohlene Mindestlesedauer in Sekunden (deutsch, ruhig). */
export function recommendedReadingSeconds(text, { role = "quote" } = {}) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  const chars = String(text || "").replace(/\s+/g, "").length;
  const base = Math.max(words / 2.4, chars / 14);
  const minRole =
    role === "source" ? 2.0 :
    role === "social" ? 2.2 :
    role === "speaker" ? 1.8 :
    role === "branding" ? 1.2 : 2.4;
  return Number(Math.max(minRole, base).toFixed(2));
}

/** Relative Luminanz 0–1 */
function relLum(hex) {
  const h = String(hex || "#fff").replace("#", "");
  if (h.length < 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg, bg) {
  const L1 = relLum(fg);
  const L2 = relLum(bg);
  const a = Math.max(L1, L2);
  const b = Math.min(L1, L2);
  return Number(((a + 0.05) / (b + 0.05)).toFixed(2));
}

/** Grobe Lesbarkeitsprüfung gegen typischen dunklen Panel-/Bildhintergrund */
export function checkTextContrast(style = {}) {
  const fg = style.color || "#fff8e8";
  const bgGuess =
    style.background?.mode === "none" ? "#2a2418" :
    (style.background?.color && String(style.background.color).startsWith("#")
      ? style.background.color
      : "#12141a");
  const ratio = contrastRatio(fg, bgGuess.length === 7 ? bgGuess : "#12141a");
  return {
    ok: ratio >= 3.5,
    ratio,
    fg,
    bg: bgGuess,
    advice: ratio < 3.5
      ? ["Schriftfarbe ändern", "Schatten hinzufügen", "Lokale Abdunklung aktivieren", "Text verschieben"]
      : []
  };
}

export function redistributeTimings(elements, duration, voiceScript = "") {
  const list = (elements || []).filter((e) => e.visible !== false && e.role !== "watermark");
  const wm = (elements || []).filter((e) => e.role === "watermark");
  const weights = list.map((e) => {
    const read = recommendedReadingSeconds(e.content || e.social?.followLine || "", { role: e.role });
    return Math.max(0.8, read);
  });
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  // Wasserzeichen volle Dauer; Rest verteilt mit Puffer für CTA
  const usable = Math.max(8, Number(duration) || 15);
  let cursor = 0.1;
  const next = list.map((el, i) => {
    const share = (weights[i] / sum) * (usable - 0.4);
    const start = Number(cursor.toFixed(2));
    const end = Number(Math.min(usable, cursor + share).toFixed(2));
    cursor = end + 0.08;
    return {
      ...el,
      timing: { start, end, duration: Number((end - start).toFixed(2)) }
    };
  });
  void voiceScript;
  return [
    ...wm.map((w) => ({
      ...w,
      timing: { start: 0, end: usable, duration: usable }
    })),
    ...next
  ];
}

export function addKeyframe(el, time, props = {}) {
  const keyframes = Array.isArray(el.keyframes) ? el.keyframes.slice() : [];
  const t = Number(time);
  const existing = keyframes.findIndex((k) => Math.abs(Number(k.t) - t) < 0.05);
  const frame = { t, ...props };
  if (existing >= 0) keyframes[existing] = { ...keyframes[existing], ...frame };
  else keyframes.push(frame);
  keyframes.sort((a, b) => a.t - b.t);
  return { ...el, keyframes };
}

export function interpolateKeyframes(keyframes, time) {
  const frames = (keyframes || []).slice().sort((a, b) => a.t - b.t);
  if (!frames.length) return null;
  if (time <= frames[0].t) return frames[0];
  if (time >= frames[frames.length - 1].t) return frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i];
    const b = frames[i + 1];
    if (time >= a.t && time <= b.t) {
      const u = (time - a.t) / Math.max(0.001, b.t - a.t);
      const mix = (ka, kb) => (ka == null || kb == null ? kb ?? ka : ka + (kb - ka) * u);
      return {
        t: time,
        x: mix(a.x, b.x),
        y: mix(a.y, b.y),
        opacity: mix(a.opacity, b.opacity),
        scale: mix(a.scale, b.scale),
        rotation: mix(a.rotation, b.rotation),
        fontSize: mix(a.fontSize, b.fontSize)
      };
    }
  }
  return frames[frames.length - 1];
}

export function applyHighlightToSelection(text, selection, presetId) {
  const preset = HIGHLIGHT_PRESETS[presetId];
  if (!preset || !selection) return { text, segments: [] };
  const { start, end } = selection;
  const slice = String(text || "").slice(start, end);
  if (!slice) return { text, segments: [] };
  return {
    text,
    segments: [
      {
        text: slice,
        start,
        end,
        fontFamily: preset.fontFamily,
        fontWeight: preset.fontWeight,
        color: preset.color,
        underline: Boolean(preset.underline),
        scale: preset.scale || 1,
        opacity: preset.opacity
      }
    ]
  };
}

export function snapshotVersion(project, label = "") {
  return {
    id: `ver_${Date.now().toString(36)}`,
    label: label || `Stand ${new Date().toLocaleString("de-DE")}`,
    createdAt: new Date().toISOString(),
    project: JSON.parse(JSON.stringify(project))
  };
}
