/**
 * Sprachtext-Vorbereitung für die feste DAR-Männerstimme.
 * Standard: Sprecher + Aussage. Quelle und Social werden nicht vorgelesen.
 */

export function stripVoiceNoise(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/#[\p{L}\p{N}_-]+/gu, " ")
    .replace(/[*_~`>#]+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[🖋️📝🌙📌✅❌⚠️]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {{ speakerLine?: string, quote?: string, source?: string, followLine?: string, readSource?: boolean, readFollow?: boolean }} opts
 */
export function prepareVoiceScript({
  speakerLine,
  quote,
  source,
  followLine,
  readSource = false,
  readFollow = false
} = {}) {
  const parts = [
    stripVoiceNoise(speakerLine),
    stripVoiceNoise(quote)
  ];
  if (readSource && source) parts.push(`Quelle: ${stripVoiceNoise(source)}.`);
  if (readFollow && followLine) parts.push(stripVoiceNoise(followLine));
  return parts.filter(Boolean).join("\n\n");
}
