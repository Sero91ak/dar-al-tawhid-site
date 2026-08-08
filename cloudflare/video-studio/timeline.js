/**
 * Sprach-Bildbeitrag – Dauer und Einblendungen folgen der Stimme (kein festes 15s-KI-Video).
 */

/** Fallback, wenn noch keine Stimmlänge bekannt ist */
export const DAR_VIDEO_DURATION_SEC = 15;

export const DAR_INTRO_SEC = 1.8;
export const DAR_OUTRO_SEC = 3.0;

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
 * Nur für Dokumentation / Legacy – keine generative Bildbewegung mehr.
 */
export const PRESERVE_SCENE_PROMPT = [
  "Preserve the original composition and all existing objects.",
  "Do not introduce any new people, vehicles, buildings, signs,",
  "text, logos, modern objects or architectural elements.",
  "Only subtle non-generative camera motion is allowed."
].join(" ");

export const PRESERVE_SCENE_NEGATIVE = [
  "new people", "new person", "crowd appearing", "face reveal",
  "car", "automobile", "truck", "van", "bus", "motorcycle", "scooter", "vehicle", "traffic",
  "new building", "modern road", "power line", "utility pole", "street lamp modern",
  "text", "logo", "watermark", "signage", "neon",
  "wardrobe change", "new clothing", "new object", "morphing hands", "deformed body",
  "generative video", "ai morph", "heavy zoom", "tiktok transition"
].join(", ");

/** Legacy-Fenster (Tests / Fallback) – absolute Sekunden bei 15s */
export const DAR_CAPTION_SLOTS = Object.freeze({
  brand: { at: 0.0, length: 1.5 },
  speaker: { at: 1.5, length: 2.0 },
  statement: { at: 3.5, end: 10.5 },
  source: { at: 10.5, length: 2.0 },
  cta: { at: 12.5, length: 2.5 }
});

/** Sanfte Textanimation (Shotstack-kompatibel) */
export const DAR_TEXT_MOTION = Object.freeze({
  fadeInMs: 600,
  fadeOutMs: 400,
  maxVerticalPx: 18,
  scaleFrom: 0.98,
  scaleTo: 1.0
});

/** Ruhige deutsche Vorlesedauer (kein Beschleunigen). */
export function estimateVoiceDurationSec(text) {
  const chars = String(text || "").replace(/\s+/g, " ").trim().length;
  if (!chars) return 4;
  return Number(Math.max(4, chars / 13.2).toFixed(2));
}

/** Gesamtdauer = Einstieg + Stimme + Abschluss */
export function computeSpeechImageDurationSec(voiceDurationSec) {
  const voice = Math.max(4, Number(voiceDurationSec) || 4);
  return Number((DAR_INTRO_SEC + voice + DAR_OUTRO_SEC).toFixed(2));
}

/**
 * Branding (Titel + CTA/Social) gilt die gesamte Dauer.
 * Nur Sprecher/Aussage/Quelle sind stimmbezogen getaktet.
 */
export function buildDynamicCaptionSlots(totalSec, voiceDurationSec) {
  const total = Math.max(10, Number(totalSec) || 15);
  const voice = Math.max(4, Number(voiceDurationSec) || total - DAR_INTRO_SEC - DAR_OUTRO_SEC);
  const voiceStart = DAR_INTRO_SEC;
  const voiceEnd = Math.min(total - DAR_OUTRO_SEC + 0.15, voiceStart + voice);
  const holdAfterSpeech = Math.min(2.5, Math.max(1.5, DAR_OUTRO_SEC - 0.4));
  const speakerAt = Math.max(0.85, voiceStart - 0.35);
  const statementAt = speakerAt + 1.55;
  const statementEnd = Math.max(statementAt + 2.4, voiceEnd);
  const sourceAt = Math.min(statementEnd + 0.08, Math.max(statementAt + 2.2, voiceEnd - 0.4));
  return {
    brand: { at: 0, length: total, persistent: true },
    cta: { at: 0, length: total, persistent: true },
    speaker: { at: speakerAt, length: Number(Math.max(2, statementEnd - speakerAt).toFixed(2)) },
    statement: { at: statementAt, end: statementEnd },
    source: {
      at: sourceAt,
      length: Number(Math.max(2, total - sourceAt).toFixed(2)),
      holdThroughEnd: true
    },
    voiceStart,
    voiceEnd,
    holdAfterSpeech,
    total
  };
}

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
  if (hay.includes(raw.toLowerCase())) return raw;
  return "";
}
