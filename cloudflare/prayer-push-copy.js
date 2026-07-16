/** Shared Gebets-Push-Texte – Vorab kurz, zur Gebetszeit mit Wechsel-Varianten. */

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "🌅 Fajr-Zeit ist eingetreten", body: "Beginne deinen Tag mit dem Gebet. Wer den Morgen mit Allah beginnt, verliert nicht." },
    { title: "🌅 Zeit für Fajr", body: "Steh auf für dein Gebet. Der Schlaf vergeht, aber die Pflicht vor Allah bleibt." },
    { title: "🌅 Fajr erinnert dich", body: "Der Tag beginnt nicht mit dem Handy, sondern mit der Niederwerfung vor Allah." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr-Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und antworte dem Ruf Allahs." },
    { title: "☀️ Zeit für Dhuhr", body: "Die Welt wartet – aber dein Gebet hat Vorrang." },
    { title: "☀️ Dhuhr erinnert dich", body: "Mitten am Tag ruft dich Allah zurück zu dem, wofür du erschaffen wurdest." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr-Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet. Verliere nicht, was bei Allah schwer wiegt." },
    { title: "🌤️ Zeit für ʿAṣr", body: "Der Tag geht weiter, doch dein Gebet darf nicht nach hinten fallen." },
    { title: "🌤️ ʿAṣr erinnert dich", body: "Wer seine Zeit schützt, schützt sein Gebet – und wer sein Gebet schützt, schützt seine Religion." }
  ],
  maghrib: [
    { title: "🌇 Maghrib-Zeit ist eingetreten", body: "Der Tag endet – schließe ihn mit Dankbarkeit und Gebet ab." },
    { title: "🌇 Zeit für Maghrib", body: "Bevor die Nacht beginnt, kehre mit deinem Herzen zu Allah zurück." },
    { title: "🌇 Maghrib erinnert dich", body: "Die Sonne ist untergegangen. Vergiss nicht, vor Allah zu stehen." }
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

export function pickPrayerEntryVariant(prayerKey, seedExtra = "") {
  const key = String(prayerKey || "").toLowerCase();
  const list = PRAYER_ENTRY_PUSH_VARIANTS[key] || PRAYER_ENTRY_PUSH_VARIANTS.fajr;
  const dayKey = new Date().toISOString().slice(0, 10);
  let seed = 0;
  const text = `${dayKey}-${key}-entry-${seedExtra}`;
  for (let i = 0; i < text.length; i++) seed = (seed + text.charCodeAt(i)) % 9973;
  return list[seed % list.length];
}

export function buildAdvancePushBody(prayerKey, advanceMinutes, timeLabel) {
  const key = String(prayerKey || "").toLowerCase();
  if (key === "tahajjud") return "Taḥajjud-Erinnerung ist bald.";
  const m = Number(advanceMinutes) || 15;
  const time = String(timeLabel || "").trim();
  return time ? `In ${m} Min · ${time} Uhr.` : `In ${m} Min.`;
}
