/**
 * Glyphen-/Schrift-Vorprüfung vor Render (Spezifikation §10).
 * Worker hat keine Font-Rasterung – strukturelle Unicode-/Tofu-Checks.
 */

const ARABIC_BLOCKS = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfefc]
];

const LATIN_DIACRITICS_OK = true;

function inRanges(cp, ranges) {
  return ranges.some(([a, b]) => cp >= a && cp <= b);
}

/**
 * @returns {{ ok: boolean, missing: string[], unsupported: string[], fontFamily: string, checked: number }}
 */
export function validateGlyphCoverage(text, { fonts = ["Amiri", "Cormorant Garamond"] } = {}) {
  const s = String(text || "");
  const missing = [];
  const unsupported = [];
  let checked = 0;

  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    checked += 1;

    // Replacement / tofu
    if (cp === 0xfffd || cp === 0x25a1 || cp === 0x25a0) {
      missing.push(ch);
      continue;
    }
    // Private Use / Surrogates
    if ((cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0xffffd) || (cp >= 0xd800 && cp <= 0xdfff)) {
      unsupported.push(`U+${cp.toString(16).toUpperCase()}`);
      missing.push(ch);
      continue;
    }
    // Control (außer whitespace)
    if (cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) {
      unsupported.push(`ctrl:${cp}`);
      missing.push(ch);
    }
  }

  // Arabisch: erwartet Amiri/Noto Naskh – wir erlauben Blöcke, warnen bei seltenen Ergänzungen
  const hasArabic = [...s].some((ch) => inRanges(ch.codePointAt(0), ARABIC_BLOCKS));
  const fontFamily = hasArabic
    ? fonts.find((f) => /amiri|naskh|arabic/i.test(f)) || fonts[0]
    : fonts.find((f) => /cormorant|garamond|baskerville|playfair/i.test(f)) || fonts[0];

  void LATIN_DIACRITICS_OK;

  return {
    ok: missing.length === 0 && unsupported.length === 0,
    missing: [...new Set(missing)].slice(0, 24),
    unsupported: [...new Set(unsupported)].slice(0, 24),
    fontFamily,
    checked,
    hasArabic
  };
}
