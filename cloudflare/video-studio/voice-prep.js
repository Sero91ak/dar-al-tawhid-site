/**
 * Sprachtext-Vorbereitung für die feste DAR-Männerstimme (§14).
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

export function prepareVoiceScript({ speakerLine, quote, source, followLine } = {}) {
  const parts = [
    stripVoiceNoise(speakerLine),
    stripVoiceNoise(quote),
    source ? `Quelle: ${stripVoiceNoise(source)}.` : "",
    stripVoiceNoise(followLine)
  ].filter(Boolean);
  return parts.join("\n\n");
}
