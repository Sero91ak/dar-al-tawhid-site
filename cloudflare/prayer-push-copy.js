/**
 * Shared Gebets-Push-Texte.
 *
 * Inhaltlich angelehnt an:
 * - Qur'an 17:78
 * - Qur'an 11:114
 * - Qur'an 2:238
 * - Sahih-Hadith zu Fajr/ʿAṣr ("من صلى البردين دخل الجنة")
 * - Sahih-Hadith zu ʿIshāʾ und Fajr in Jamaʿah
 * - Sahih-Hadith zum letzten Drittel der Nacht
 *
 * {minutes} in Vorwarn-Texten ist immer die Nutzer-Vorwarnzeit 5, 10 oder 15 —
 * niemals die Restminuten bis zum Gebet (sonst „ʿAṣr in 1573 Min“).
 */

const DEFAULT_ADVANCE_MINUTES = 15;

export const PRAYER_ADVANCE_PUSH_VARIANTS = {
  fajr: [
    "In {minutes} Min · {time} Uhr. Fajr naht — bereite dich vor und verrichte das Gebet für Allah."
  ],
  dhuhr: [
    "In {minutes} Min · {time} Uhr. Dhuhr naht — unterbrich deinen Tag und verrichte das Gebet für Allah."
  ],
  asr: [
    "In {minutes} Min · {time} Uhr. ʿAṣr naht — bewahre dieses Gebet und verrichte es rechtzeitig für Allah."
  ],
  maghrib: [
    "In {minutes} Min · {time} Uhr. Maghrib naht — verrichte das Gebet ohne Aufschub für Allah."
  ],
  isha: [
    "In {minutes} Min · {time} Uhr. ʿIshāʾ naht — beende deinen Tag mit dem Gebet für Allah."
  ],
  tahajjud: [
    "Das letzte Drittel der Nacht naht — Zeit für Taḥajjud, Duʿāʾ und Istighfār."
  ]
};

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "✨ Fajr-Zeit ist eingetreten", body: "Steh auf für Allah und verrichte dein Fajr-Gebet rechtzeitig." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr-Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und verrichte dein Dhuhr-Gebet für Allah." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr-Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet und verrichte es rechtzeitig für Allah." }
  ],
  maghrib: [
    { title: "🌥️ Maghrib-Zeit ist eingetreten", body: "Die Sonne ist untergegangen — verrichte jetzt dein Maghrib-Gebet für Allah." }
  ],
  isha: [
    { title: "🌙 ʿIshāʾ-Zeit ist eingetreten", body: "Beende deinen Tag mit dem ʿIshāʾ-Gebet für Allah." }
  ],
  tahajjud: [
    { title: "🌙 Taḥajjud-Erinnerung", body: "Nutze die letzte Nachtzeit für Taḥajjud, Duʿāʾ und Istighfār." }
  ]
};

export const PRAYER_TITLE_EMOJI = {
  fajr: "✨",
  dhuhr: "☀️",
  asr: "🌤️",
  maghrib: "🌥️",
  isha: "🌙",
  tahajjud: "🌙"
};

const BLOCKED_PHRASES = [
  { pattern: /ʿasr\b/gi, replacement: "ʿAṣr" },
  { pattern: /(?:['‘’`]\s*)asr\b/gi, replacement: "ʿAṣr" },
  { pattern: /\basr\b/gi, replacement: "ʿAṣr" },
  { pattern: /wer\s+die\s+beiden\s+kühlen\s+gebete\s+bewahrt\b/gi, replacement: "Bewahre besonders Fajr und ʿAṣr" },
  { pattern: /verliere\s+['‘’`ʿ]?\s*a(?:s|ṣ)r\s+nicht\b/gi, replacement: "bewahre dein ʿAṣr-Gebet" },
  { pattern: /\bsteh(?:e)?\s+(?:für|zum)\s+den?\s+morgen\b/gi, replacement: "Steh auf für Allah" },
  { pattern: /ʿaṣr\s+ruft\s+dich\b/gi, replacement: "ʿAṣr-Zeit ist eingetreten" },
  { pattern: /\b(?:dhuhr|zuhr)\s+ruft\s+dich\b/gi, replacement: "Dhuhr-Zeit ist eingetreten" },
  { pattern: /\b(?:fajr|maghrib|isha|ʿi(?:sh|š)aʾ?)\s+ruft\s+dich\b/gi, replacement: "Gebetszeit ist eingetreten" },
  { pattern: /\bruft\s+dich\b/gi, replacement: "ist eingetreten" }
];

const HARD_BLOCK_PATTERNS = [
  /\bruft\s+dich\b/i,
  /wer\s+die\s+beiden\s+kühlen\s+gebete\s+bewahrt\b/i,
  /verliere\s+['‘’`ʿ]?\s*a(?:s|ṣ)r\s+nicht\b/i
];

export function sanitizePrayerPushText(value) {
  let text = String(value || "").trim();
  for (const rule of BLOCKED_PHRASES) {
    text = text.replace(rule.pattern, rule.replacement);
  }
  return text.replace(/\s{2,}/g, " ").trim();
}

export function hasBlockedPrayerPhrase(value) {
  const text = String(value || "");
  return HARD_BLOCK_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizePrayerPushCopy(copy) {
  if (!copy || typeof copy !== "object") return copy;
  return {
    ...copy,
    title: sanitizePrayerPushText(copy.title),
    body: sanitizePrayerPushText(copy.body)
  };
}

export function pickPrayerEntryVariant(prayerKey, seedExtra = "") {
  const key = String(prayerKey || "").toLowerCase();
  const list = PRAYER_ENTRY_PUSH_VARIANTS[key] || PRAYER_ENTRY_PUSH_VARIANTS.fajr;
  return sanitizePrayerPushCopy(pickPrayerVariantByCycle(list, key, "entry", seedExtra));
}

function utcDaySerial() {
  return Math.floor(Date.now() / 86400000);
}

function stablePrayerOffset(prayerKey, mode, seedExtra, listLength) {
  if (!listLength) return 0;
  const text = `${String(prayerKey || "").toLowerCase()}::${mode}::${seedExtra || ""}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33 + text.charCodeAt(i)) % 104729;
  }
  return hash % listLength;
}

function pickPrayerVariantByCycle(list, prayerKey, mode, seedExtra = "") {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = (utcDaySerial() + stablePrayerOffset(prayerKey, mode, seedExtra, list.length)) % list.length;
  return list[index];
}

function pickPrayerAdvanceVariant(prayerKey, advanceMinutes, timeLabel = "") {
  const key = String(prayerKey || "").toLowerCase();
  const list = PRAYER_ADVANCE_PUSH_VARIANTS[key] || PRAYER_ADVANCE_PUSH_VARIANTS.fajr;
  return pickPrayerVariantByCycle(list, key, "advance", `${advanceMinutes}-${timeLabel}`);
}

/** Vorwarn-Text nutzt nur die gewählte Vorwarnzeit (5/10/15), nie die Restzeit bis zum Gebet. */
export function clampPrayerAdvanceMinutes(value) {
  const n = Number(value);
  return [5, 10, 15].includes(n) ? n : DEFAULT_ADVANCE_MINUTES;
}

export function buildAdvancePushBody(prayerKey, advanceMinutes, timeLabel) {
  const key = String(prayerKey || "").toLowerCase();
  const m = clampPrayerAdvanceMinutes(advanceMinutes);
  const time = String(timeLabel || "").trim();
  const template = pickPrayerAdvanceVariant(key, m, time);
  return sanitizePrayerPushText(
    template
    .replaceAll("{minutes}", String(m))
    .replaceAll("{time}", time || "--:--")
  );
}
