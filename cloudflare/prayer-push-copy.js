/** Shared Gebets-Push-Texte – Vorab kurz, zur Gebetszeit mit Wechsel-Varianten. */

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "🌅 Fajr-Zeit ist eingetreten", body: "Beginne deinen Tag mit dem Gebet. Wer den Morgen mit Allah beginnt, verliert nicht." },
    { title: "🌅 Zeit für Fajr", body: "Steh auf für dein Gebet. Der Schlaf vergeht, aber die Pflicht vor Allah bleibt." },
    { title: "🌅 Fajr erinnert dich", body: "Der Tag beginnt nicht mit dem Handy, sondern mit der Niederwerfung vor Allah." },
    { title: "🌅 Antworte dem Ruf zum Fajr", body: "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah." },
    { title: "🌅 Beginne mit Gehorsam", body: "Beginne den Morgen mit dem, was Allah dir zur Pflicht gemacht hat." },
    { title: "🌅 Fajr – Zeit der Niederwerfung", body: "Lass den Schlaf zurück und stehe im Gebet vor deinem Herrn." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr-Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und antworte dem Ruf Allahs." },
    { title: "☀️ Zeit für Dhuhr", body: "Die Welt wartet – aber dein Gebet hat Vorrang." },
    { title: "☀️ Dhuhr erinnert dich", body: "Mitten am Tag ruft dich Allah zurück zu dem, wofür du erschaffen wurdest." },
    { title: "☀️ Dhuhr – das Gebet zuerst", body: "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah." },
    { title: "☀️ Kehre zum Gebet zurück", body: "Lass deine Arbeit kurz ruhen und bewahre die Pflicht vor Allah." },
    { title: "☀️ Zeit, vor Allah zu stehen", body: "Mitten im Alltag schenkt dir das Gebet eine Rückkehr zu deinem Herrn." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr-Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet. Verliere nicht, was bei Allah schwer wiegt." },
    { title: "🌤️ Zeit für ʿAṣr", body: "Der Tag geht weiter, doch dein Gebet darf nicht nach hinten fallen." },
    { title: "🌤️ ʿAṣr erinnert dich", body: "Wer seine Zeit schützt, schützt sein Gebet – und wer sein Gebet schützt, schützt seine Religion." },
    { title: "🌤️ Bewahre besonders ʿAṣr", body: "Der Prophet ﷺ warnte eindringlich davor, das ʿAṣr-Gebet zu versäumen." },
    { title: "🌤️ ʿAṣr – verliere es nicht", body: "Lass den Tag nicht verstreichen, ohne diese Pflicht rechtzeitig zu erfüllen." },
    { title: "🌤️ Zeit, dein Gebet zu schützen", body: "Das Gebet wurde den Gläubigen zu festgelegten Zeiten vorgeschrieben." }
  ],
  maghrib: [
    { title: "🌇 Maghrib-Zeit ist eingetreten", body: "Der Tag endet – schließe ihn mit Dankbarkeit und Gebet ab." },
    { title: "🌇 Zeit für Maghrib", body: "Bevor die Nacht beginnt, kehre mit deinem Herzen zu Allah zurück." },
    { title: "🌇 Maghrib erinnert dich", body: "Die Sonne ist untergegangen. Vergiss nicht, vor Allah zu stehen." },
    { title: "🌇 Maghrib – antworte jetzt", body: "Das Gebet wurde den Gläubigen zu festgelegten Zeiten vorgeschrieben." },
    { title: "🌇 Kehre zu Allah zurück", body: "Wenn der Tag endet, soll dein Gebet nicht zurückbleiben." },
    { title: "🌇 Zeit der Dankbarkeit", body: "Stehe vor Allah, bevor die Aufgaben der Nacht dich ablenken." }
  ],
  isha: [
    { title: "🌙 ʿIshāʾ-Zeit ist eingetreten", body: "Beende deinen Tag mit Gehorsam, bevor du dich zur Ruhe legst." },
    { title: "🌙 Zeit für ʿIshāʾ", body: "Lass dein letztes großes Werk des Tages das Gebet sein." },
    { title: "🌙 ʿIshāʾ erinnert dich", body: "Schließe den Tag nicht, bevor du vor deinem Herrn gestanden hast." },
    { title: "🌙 ʿIshāʾ – vollende deine Pflicht", body: "Beende den Tag mit dem Gebet, das Allah dir vorgeschrieben hat." },
    { title: "🌙 Lass ʿIshāʾ nicht aus", body: "Der Prophet ﷺ erwähnte den großen Lohn des ʿIshāʾ-Gebets in Gemeinschaft." },
    { title: "🌙 Vor dem Schlaf kommt das Gebet", body: "Gib deinem Herrn den Vorrang, bevor du dich zur Ruhe legst." }
  ],
  tahajjud: [
    { title: "🌙 Taḥajjud-Erinnerung", body: "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah." },
    { title: "🌙 Zeit für Taḥajjud", body: "Steh in der stillen Nacht für deinen Herrn auf – selbst wenige Rakʿāt sind kostbar." },
    { title: "🌙 Taḥajjud erinnert dich", body: "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah." },
    { title: "🌙 Die Nacht ist still", body: "Nutze das letzte Drittel der Nacht für Duʿāʾ, Istighfār und freiwilliges Gebet." },
    { title: "🌙 Taḥajjud – Nähe in der Nacht", body: "Das beste freiwillige Gebet nach den Pflichtgebeten ist das Nachtgebet." },
    { title: "🌙 Steh für deinen Herrn auf", body: "Auch wenige aufrichtige Rakʿāt können zu einer kostbaren Gewohnheit werden." }
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
