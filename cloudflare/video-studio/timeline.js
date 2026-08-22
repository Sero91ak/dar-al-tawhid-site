/**
 * Feste 15-Sekunden-DAR-Videostruktur (Spezifikation).
 * Alle Zeiten in Sekunden absolut vom Videoanfang.
 */

export const DAR_VIDEO_DURATION_SEC = 15;

/** Verbotene automatische Overlay-Labels (nur wenn ausdrücklich im Beitrag). */
export const FORBIDDEN_AUTO_LABELS = Object.freeze([
  "dhikr",
  "hadith",
  "daily reminder",
  "islamic quote",
  "motivation",
  "motivational"
]);

/**
 * Preserve-Prompt für Image-to-Video (Ausgangsbild) – verbindlich.
 */
export const PRESERVE_SCENE_PROMPT = [
  "Preserve the original composition and all existing objects.",
  "Do not introduce any new people, vehicles, buildings, signs,",
  "text, logos, modern objects or architectural elements.",
  "Animate only subtle camera movement, natural light, wind,",
  "fabric, dust, water and existing environmental details."
].join(" ");

export const PRESERVE_SCENE_NEGATIVE = [
  "new people", "new person", "crowd appearing", "face reveal",
  "car", "automobile", "truck", "van", "bus", "motorcycle", "scooter", "vehicle", "traffic",
  "new building", "modern road", "power line", "utility pole", "street lamp modern",
  "text", "logo", "watermark", "signage", "neon",
  "wardrobe change", "new clothing", "new object", "morphing hands", "deformed body"
].join(", ");

/** Absolute Einblendungsfenster laut Spezifikation */
export const DAR_CAPTION_SLOTS = Object.freeze({
  brand: { at: 0.0, length: 1.5 },
  speaker: { at: 1.5, length: 2.0 },
  statement: { at: 3.5, end: 10.5 },
  source: { at: 10.5, length: 2.0 },
  cta: { at: 12.5, length: 2.5 }
});

/** Sanfte Textanimation (Shotstack-kompatibel, spezkonform) */
export const DAR_TEXT_MOTION = Object.freeze({
  fadeInMs: 600,
  fadeOutMs: 400,
  maxVerticalPx: 18,
  scaleFrom: 0.98,
  scaleTo: 1.0
});

export function isForbiddenAutoLabel(value) {
  const t = String(value || "").trim().toLowerCase();
  if (!t) return false;
  return FORBIDDEN_AUTO_LABELS.some((label) => t === label || t.includes(label));
}

export function sanitizeTopicLabel(topic, contributionHaystack = "") {
  const raw = String(topic || "").trim();
  if (!raw) return "";
  if (!isForbiddenAutoLabel(raw)) return raw;
  const hay = String(contributionHaystack || "").toLowerCase();
  // Nur erlauben, wenn der Begriff ausdrücklich im Beitrag vorkommt
  if (hay.includes(raw.toLowerCase())) return raw;
  return "";
}
