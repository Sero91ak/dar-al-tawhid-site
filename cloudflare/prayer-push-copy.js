/** Shared Gebets-Push-Texte – Vorab kurz, zur Gebetszeit mit Wechsel-Varianten. */

export const PRAYER_PUSH_COPY_VERSION = "v4";

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "✨ Fajr – Zeit ist eingetreten", body: "Beginne deinen Tag mit dem Gebet und dem Gedenken an Allah." },
    { title: "✨ Fajr – Zeit für das Gebet", body: "Lass den Schlaf zurück und antworte dem Ruf zum Gebet." },
    { title: "✨ Fajr – Erinnerung", body: "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah." },
    { title: "✨ Fajr – unter Allahs Schutz", body: "Wer das Fajr-Gebet verrichtet, steht unter Allahs Schutz." },
    { title: "✨ Fajr – bewahre das Gebet", body: "Der Prophet ﷺ verkündete großen Lohn für das Bewahren von Fajr und ʿAṣr." },
    { title: "✨ Fajr – stehe vor deinem Herrn", body: "Bevor der Tag dich beschäftigt, beginne ihn mit der Niederwerfung vor Allah." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr – Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und antworte dem Ruf Allahs." },
    { title: "☀️ Dhuhr – Zeit für das Gebet", body: "Die Welt wartet – aber dein Gebet hat Vorrang." },
    { title: "☀️ Dhuhr – Erinnerung", body: "Mitten am Tag ruft dich das Gebet zurück zu deinem Herrn." },
    { title: "☀️ Dhuhr – das Gebet zuerst", body: "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah." },
    { title: "☀️ Dhuhr – bewahre die Gebetszeit", body: "Das Gebet wurde den Gläubigen zu festgelegten Zeiten vorgeschrieben." },
    { title: "☀️ Dhuhr – kehre zum Gebet zurück", body: "Lass deine Arbeit kurz ruhen und erfülle zuerst deine Pflicht vor Allah." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr – Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet und schiebe es nicht auf." },
    { title: "🌤️ ʿAṣr – Zeit für das Gebet", body: "Der Tag geht weiter, doch dein Gebet darf nicht zurückbleiben." },
    { title: "🌤️ ʿAṣr – Erinnerung", body: "Schütze dein Gebet vor Aufschub, bevor der Tag vergeht." },
    { title: "🌤️ ʿAṣr – versäume es nicht", body: "Der Prophet ﷺ warnte eindringlich davor, das ʿAṣr-Gebet zu versäumen." },
    { title: "🌤️ ʿAṣr – bewahre das Gebet", body: "Wer Fajr und ʿAṣr bewahrt, dem verkündete der Prophet ﷺ das Paradies." },
    { title: "🌤️ ʿAṣr – erfülle deine Pflicht", body: "Das Gebet wurde den Gläubigen zu festgelegten Zeiten vorgeschrieben." }
  ],
  maghrib: [
    { title: "🌥️ Maghrib – Zeit ist eingetreten", body: "Der Tag endet – schließe ihn mit Dankbarkeit und Gebet ab." },
    { title: "🌥️ Maghrib – Zeit für das Gebet", body: "Bevor die Nacht beginnt, kehre mit deinem Herzen zu Allah zurück." },
    { title: "🌥️ Maghrib – Erinnerung", body: "Die Sonne ist untergegangen. Vergiss nicht, vor Allah zu stehen." },
    { title: "🌥️ Maghrib – antworte jetzt", body: "Lass die Aufgaben des Abends warten und bete zur vorgeschriebenen Zeit." },
    { title: "🌥️ Maghrib – beende den Tag im Gebet", body: "Schließe den vergangenen Tag mit Gehorsam und Dankbarkeit ab." },
    { title: "🌥️ Maghrib – kehre zu deinem Herrn zurück", body: "Wenn der Tag endet, soll dein Gebet nicht zurückbleiben." }
  ],
  isha: [
    { title: "🌙 ʿIshāʾ – Zeit ist eingetreten", body: "Beende deinen Tag mit Gehorsam, bevor du dich zur Ruhe legst." },
    { title: "🌙 ʿIshāʾ – Zeit für das Gebet", body: "Lass dein letztes großes Werk des Tages das Gebet sein." },
    { title: "🌙 ʿIshāʾ – Erinnerung", body: "Schließe den Tag nicht, bevor du vor deinem Herrn gestanden hast." },
    { title: "🌙 ʿIshāʾ – großer Lohn", body: "Wer ʿIshāʾ in Gemeinschaft betet, erhält den Lohn einer halben Nacht im Gebet." },
    { title: "🌙 ʿIshāʾ – vollende deine Pflicht", body: "Beende den Tag mit dem Gebet, das Allah dir vorgeschrieben hat." },
    { title: "🌙 ʿIshāʾ – vor dem Schlaf", body: "Gib deinem Herrn den Vorrang, bevor du dich zur Ruhe legst." }
  ],
  tahajjud: [
    { title: "🌙 Taḥajjud – Erinnerung", body: "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah." },
    { title: "🌙 Taḥajjud – Zeit für das Nachtgebet", body: "Steh in der stillen Nacht für deinen Herrn auf – selbst wenige Rakʿāt sind kostbar." },
    { title: "🌙 Taḥajjud – nutze die Nacht", body: "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah." },
    { title: "🌙 Taḥajjud – das beste freiwillige Gebet", body: "Das beste Gebet nach den Pflichtgebeten ist das Nachtgebet." },
    { title: "🌙 Taḥajjud – suche Allahs Nähe", body: "Nutze die Nacht für Duʿāʾ, Istighfār und freiwilliges Gebet." },
    { title: "🌙 Taḥajjud – stehe für deinen Herrn auf", body: "Auch wenige aufrichtige Rakʿāt können zu einer beständigen guten Tat werden." }
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
