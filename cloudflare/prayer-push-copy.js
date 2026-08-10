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
 */

export const PRAYER_ADVANCE_PUSH_VARIANTS = {
  fajr: [
    "In {minutes} Min · {time} Uhr. Bereite dich auf Fajr vor und beginne den Tag mit dem Gebet.",
    "In {minutes} Min · {time} Uhr. Fajr naht — bewahre dieses Gebet und stehe rechtzeitig auf.",
    "In {minutes} Min · {time} Uhr. Noch vor Sonnenaufgang ist Zeit, dich im Gebet Allah zuzuwenden."
  ],
  dhuhr: [
    "In {minutes} Min · {time} Uhr. Dhuhr naht — unterbrich deinen Tag und verrichte dein Gebet.",
    "In {minutes} Min · {time} Uhr. Die Tagesmitte ist nahe, gib Dhuhr jetzt Vorrang.",
    "In {minutes} Min · {time} Uhr. Richte dich neu aus und kehre mit Dhuhr zur Erinnerung an Allah zurück."
  ],
  asr: [
    "In {minutes} Min · {time} Uhr. ʿAṣr naht — bewahre dieses Gebet und verrichte es rechtzeitig.",
    "In {minutes} Min · {time} Uhr. Der späte Tag beginnt bald, verliere ʿAṣr nicht aus dem Blick.",
    "In {minutes} Min · {time} Uhr. Schütze ʿAṣr vor Aufschub, auch wenn der Tag voll ist."
  ],
  maghrib: [
    "In {minutes} Min · {time} Uhr. Maghrib naht — beginne den Abend mit dem Gebet.",
    "In {minutes} Min · {time} Uhr. Mit dem Sonnenuntergang kommt Maghrib, verrichte es ohne Aufschub.",
    "In {minutes} Min · {time} Uhr. Schließe den Tag mit Maghrib in Dankbarkeit vor Allah ab."
  ],
  isha: [
    "In {minutes} Min · {time} Uhr. ʿIshāʾ naht — beende deinen Tag mit dem Gebet.",
    "In {minutes} Min · {time} Uhr. Bewahre ʿIshāʾ und verrichte es vor der Ruhe der Nacht.",
    "In {minutes} Min · {time} Uhr. Gib ʿIshāʾ Vorrang, bevor Müdigkeit und Aufschub stärker werden."
  ],
  tahajjud: [
    "Das letzte Drittel der Nacht naht — Zeit für Duʿāʾ, Istighfār und Gebet.",
    "Taḥajjud ist bald. Nutze die stille Nacht für Bittgebet und Nähe zu Allah.",
    "Steh für Taḥajjud auf, auch wenn es nur wenige Minuten sind."
  ]
};

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "✨ Fajr-Zeit ist eingetreten", body: "Beginne deinen Tag mit dem Gebet. Wer den Morgen mit Allah beginnt, verliert nicht." },
    { title: "✨ Zeit für Fajr", body: "Steh auf für dein Gebet. Der Schlaf vergeht, aber die Pflicht vor Allah bleibt." },
    { title: "✨ Fajr erinnert dich", body: "Qurʾān al-Fajr ist bezeugt — verliere dieses Gebet nicht." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr-Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und antworte dem Ruf Allahs." },
    { title: "☀️ Zeit für Dhuhr", body: "Die Welt wartet – aber dein Gebet hat Vorrang." },
    { title: "☀️ Dhuhr erinnert dich", body: "Mitten am Tag erinnert dich Dhuhr daran, wofür du erschaffen wurdest." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr-Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet. Verliere nicht, was bei Allah schwer wiegt." },
    { title: "🌤️ Zeit für ʿAṣr", body: "Der Tag geht weiter, doch dein Gebet darf nicht nach hinten fallen." },
    { title: "🌤️ ʿAṣr erinnert dich", body: "Bewahre das mittlere Gebet und verrichte es rechtzeitig." }
  ],
  maghrib: [
    { title: "🌥️ Maghrib-Zeit ist eingetreten", body: "Der Tag endet – schließe ihn mit Dankbarkeit und Gebet ab." },
    { title: "🌥️ Zeit für Maghrib", body: "Bevor die Nacht beginnt, kehre mit deinem Herzen zu Allah zurück." },
    { title: "🌥️ Maghrib erinnert dich", body: "Die Sonne ist untergegangen. Vergiss nicht, vor Allah zu stehen." }
  ],
  isha: [
    { title: "🌙 ʿIshāʾ-Zeit ist eingetreten", body: "Beende deinen Tag mit Gehorsam, bevor du dich zur Ruhe legst." },
    { title: "🌙 Zeit für ʿIshāʾ", body: "Lass dein letztes großes Werk des Tages das Gebet sein." },
    { title: "🌙 ʿIshāʾ erinnert dich", body: "Schließe den Tag nicht, bevor du vor deinem Herrn gestanden hast." }
  ],
  tahajjud: [
    { title: "🌙 Taḥajjud-Erinnerung", body: "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah." },
    { title: "🌙 Zeit für Taḥajjud", body: "Steh in der stillen Nacht für deinen Herrn auf – selbst wenige Rakʿāt sind kostbar." },
    { title: "🌙 Taḥajjud erinnert dich", body: "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah." }
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

export function pickPrayerEntryVariant(prayerKey, seedExtra = "") {
  const key = String(prayerKey || "").toLowerCase();
  const list = PRAYER_ENTRY_PUSH_VARIANTS[key] || PRAYER_ENTRY_PUSH_VARIANTS.fajr;
  return pickPrayerVariantByCycle(list, key, "entry", seedExtra);
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

export function buildAdvancePushBody(prayerKey, advanceMinutes, timeLabel) {
  const key = String(prayerKey || "").toLowerCase();
  const m = Number(advanceMinutes) || 15;
  const time = String(timeLabel || "").trim();
  const template = pickPrayerAdvanceVariant(key, m, time);
  return template
    .replaceAll("{minutes}", String(m))
    .replaceAll("{time}", time || "--:--");
}
