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
    "In {minutes} Min · {time} Uhr. Qurʾān al-Fajr ist bezeugt — bereite dich auf Fajr vor.",
    "In {minutes} Min · {time} Uhr. Lass den Beginn deines Tages mit dem Gebet sein.",
    "In {minutes} Min · {time} Uhr. Fajr naht — steh für das Gebet auf, bevor der Alltag beginnt.",
    "In {minutes} Min · {time} Uhr. Bewahre Fajr früh, bevor dich Schlaf oder Ablenkung festhalten.",
    "In {minutes} Min · {time} Uhr. Fajr ist eine Grenze zwischen Nachlässigkeit und einem Morgen in Gehorsam.",
    "In {minutes} Min · {time} Uhr. Vor dem Trubel des Tages ruft dich Fajr zuerst zum Gebet."
  ],
  dhuhr: [
    "In {minutes} Min · {time} Uhr. Die Sonne hat sich geneigt — Zeit, dich Dhuhr zuzuwenden.",
    "In {minutes} Min · {time} Uhr. Unterbrich deine Beschäftigung und antworte dem Ruf zum Gebet.",
    "In {minutes} Min · {time} Uhr. Dhuhr kommt — gib Allah jetzt einen festen Teil deines Tages.",
    "In {minutes} Min · {time} Uhr. Mitten im Tag ruft dich das Gebet zurück zur Erinnerung an Allah.",
    "In {minutes} Min · {time} Uhr. Wenn der Tag dich bindet, löst dich Dhuhr wieder zum Gehorsam.",
    "In {minutes} Min · {time} Uhr. Dhuhr naht — richte deinen Tag neu aus, bevor er dich ganz einnimmt."
  ],
  asr: [
    "In {minutes} Min · {time} Uhr. ʿAṣr naht — bewahre das Gebet, das besonders geschützt werden soll.",
    "In {minutes} Min · {time} Uhr. Wer Fajr und ʿAṣr bewahrt, bewahrt viel vor Allah.",
    "In {minutes} Min · {time} Uhr. Der Tag geht weiter, aber ʿAṣr darf nicht nach hinten fallen.",
    "In {minutes} Min · {time} Uhr. Richte dich auf ʿAṣr aus, bevor Müdigkeit oder Arbeit dich ablenken.",
    "In {minutes} Min · {time} Uhr. ʿAṣr naht — verliere nicht das Gebet, wenn der Tag sich dem Ende nähert.",
    "In {minutes} Min · {time} Uhr. Halte ʿAṣr fest, bevor Eile, Termine oder Erschöpfung dich überrollen."
  ],
  maghrib: [
    "In {minutes} Min · {time} Uhr. Der Abend tritt ein — bereite dich auf Maghrib vor.",
    "In {minutes} Min · {time} Uhr. Schließe den Tag nicht ohne Maghrib vor Allah ab.",
    "In {minutes} Min · {time} Uhr. Die Sonne sinkt — kehre mit deinem Herzen zum Gebet zurück.",
    "In {minutes} Min · {time} Uhr. Maghrib naht — beginne den Abend mit Dankbarkeit und Gebet.",
    "In {minutes} Min · {time} Uhr. Wenn der Tag endet, lass Maghrib nicht untergehen wie die Sonne.",
    "In {minutes} Min · {time} Uhr. Der Wechsel in die Nacht beginnt — empfange ihn mit Maghrib."
  ],
  isha: [
    "In {minutes} Min · {time} Uhr. ʿIshāʾ naht — beende den Tag mit Gehorsam.",
    "In {minutes} Min · {time} Uhr. Lass ʿIshāʾ nicht schwer werden, wenn die Nacht beginnt.",
    "In {minutes} Min · {time} Uhr. ʿIshāʾ kommt — schließe deinen Tag mit dem Gebet ab.",
    "In {minutes} Min · {time} Uhr. Wer ʿIshāʾ bewahrt, schützt den Abschluss seines Tages.",
    "In {minutes} Min · {time} Uhr. Die Nacht beginnt — gib dem Gebet den Vorrang vor Müdigkeit und Aufschub.",
    "In {minutes} Min · {time} Uhr. ʿIshāʾ naht — lass der letzte große Schritt deines Tages vor Allah sein."
  ],
  tahajjud: [
    "Das letzte Drittel der Nacht naht — Zeit für Duʿāʾ, Istighfār und Gebet.",
    "Taḥajjud ist bald. Nutze die stille Nacht für Bittgebet und Nähe zu Allah.",
    "Die Nacht öffnet sich für Taḥajjud — steh auf, auch wenn es nur wenig ist.",
    "Taḥajjud rückt näher. In der Nacht liegt eine besondere Zeit für Duʿāʾ und Reue.",
    "Das letzte Drittel der Nacht ist nahe — richte dein Herz auf Istighfār und Bittgebet aus.",
    "Taḥajjud naht. In der Stille der Nacht ist der Aufruf zum Herrn freier von Ablenkung."
  ]
};

export const PRAYER_ENTRY_PUSH_VARIANTS = {
  fajr: [
    { title: "✨ Fajr-Zeit ist eingetreten", body: "Beginne deinen Tag mit dem Gebet. Wer den Morgen mit Allah beginnt, verliert nicht." },
    { title: "✨ Zeit für Fajr", body: "Steh auf für dein Gebet. Der Schlaf vergeht, aber die Pflicht vor Allah bleibt." },
    { title: "✨ Fajr erinnert dich", body: "Der Tag beginnt nicht mit dem Handy, sondern mit der Niederwerfung vor Allah." },
    { title: "✨ Fajr ruft dich", body: "Qurʾān al-Fajr ist bezeugt — verpasse nicht dieses Gebet am Beginn des Tages." },
    { title: "✨ Fajr ist da", body: "Wer Fajr bewahrt, beginnt den Morgen mit Gehorsam und klarer Ausrichtung." },
    { title: "✨ Der Morgen hat begonnen", body: "Antworte zuerst dem Gebet, bevor die Welt deinen Tag für sich beansprucht." },
    { title: "✨ Fajr tritt ein", body: "Die Engel bezeugen diese Zeit — verliere Fajr nicht im Schlaf oder in Aufschub." }
  ],
  dhuhr: [
    { title: "☀️ Dhuhr-Zeit ist eingetreten", body: "Unterbrich deine Beschäftigung und antworte dem Ruf Allahs." },
    { title: "☀️ Zeit für Dhuhr", body: "Die Welt wartet – aber dein Gebet hat Vorrang." },
    { title: "☀️ Dhuhr erinnert dich", body: "Mitten am Tag ruft dich Allah zurück zu dem, wofür du erschaffen wurdest." },
    { title: "☀️ Dhuhr ist eingetreten", body: "Wenn der Tag dich bindet, löst dich Dhuhr wieder zur Erinnerung an Allah." },
    { title: "☀️ Dhuhr ist jetzt", body: "Die Sonne ist nach dem Zenit — richte deinen Tag mit dem Gebet neu aus." },
    { title: "☀️ Dhuhr ruft dich", body: "Halte im Lauf des Tages an und gib Allah den Vorrang vor deinen Aufgaben." },
    { title: "☀️ Dhuhr ist da", body: "Mit Dhuhr kehrt der Tag zurück zur Erinnerung an Allah und weg von bloßer Ablenkung." }
  ],
  asr: [
    { title: "🌤️ ʿAṣr-Zeit ist eingetreten", body: "Bewahre dein ʿAṣr-Gebet. Verliere nicht, was bei Allah schwer wiegt." },
    { title: "🌤️ Zeit für ʿAṣr", body: "Der Tag geht weiter, doch dein Gebet darf nicht nach hinten fallen." },
    { title: "🌤️ ʿAṣr erinnert dich", body: "Wer seine Zeit schützt, schützt sein Gebet – und wer sein Gebet schützt, schützt seine Religion." },
    { title: "🌤️ ʿAṣr ist da", body: "Bewahre das mittlere Gebet mit Sorgfalt und steh vor Allah in Hingabe." },
    { title: "🌤️ ʿAṣr ruft dich", body: "Wer die beiden kühlen Gebete bewahrt, hat eine große Verheißung — verliere ʿAṣr nicht." },
    { title: "🌤️ ʿAṣr tritt ein", body: "Lass nicht zu, dass der späte Tag dir das Gebet nimmt." },
    { title: "🌤️ Jetzt ist ʿAṣr", body: "Halte das Gebet fest, bevor der Rest des Tages in Eile vergeht." }
  ],
  maghrib: [
    { title: "🌥️ Maghrib-Zeit ist eingetreten", body: "Der Tag endet – schließe ihn mit Dankbarkeit und Gebet ab." },
    { title: "🌥️ Zeit für Maghrib", body: "Bevor die Nacht beginnt, kehre mit deinem Herzen zu Allah zurück." },
    { title: "🌥️ Maghrib erinnert dich", body: "Die Sonne ist untergegangen. Vergiss nicht, vor Allah zu stehen." },
    { title: "🌥️ Maghrib ist da", body: "An der Schwelle zur Nacht beginnt Maghrib — lass den Tag mit Gebet enden." },
    { title: "🌥️ Maghrib ruft dich", body: "Wenn das Licht des Tages weicht, halte am Gebet fest und beginne den Abend richtig." },
    { title: "🌥️ Der Abend ist eingetreten", body: "Begib dich zu Maghrib, bevor die Nacht dich mit anderem beschäftigt." },
    { title: "🌥️ Maghrib tritt ein", body: "Mit dem Untergang der Sonne ist die Zeit da, vor Allah zu stehen." }
  ],
  isha: [
    { title: "🌙 ʿIshāʾ-Zeit ist eingetreten", body: "Beende deinen Tag mit Gehorsam, bevor du dich zur Ruhe legst." },
    { title: "🌙 Zeit für ʿIshāʾ", body: "Lass dein letztes großes Werk des Tages das Gebet sein." },
    { title: "🌙 ʿIshāʾ erinnert dich", body: "Schließe den Tag nicht, bevor du vor deinem Herrn gestanden hast." },
    { title: "🌙 ʿIshāʾ ist da", body: "Die Nacht ist eingetreten — gib dem Gebet Vorrang, bevor Ruhe und Müdigkeit dich einholen." },
    { title: "🌙 ʿIshāʾ ruft dich", body: "Wer ʿIshāʾ und Fajr bewahrt, hat einen großen Lohn — beginne mit ʿIshāʾ." },
    { title: "🌙 ʿIshāʾ tritt ein", body: "Bevor du den Tag abschließt, stelle dich im Gebet vor deinen Herrn." },
    { title: "🌙 Jetzt ist ʿIshāʾ", body: "Verschiebe dieses Gebet nicht, wenn Müdigkeit und Ruhe schon näher kommen." }
  ],
  tahajjud: [
    { title: "🌙 Taḥajjud-Erinnerung", body: "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah." },
    { title: "🌙 Zeit für Taḥajjud", body: "Steh in der stillen Nacht für deinen Herrn auf – selbst wenige Rakʿāt sind kostbar." },
    { title: "🌙 Taḥajjud erinnert dich", body: "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah." },
    { title: "🌙 Die Nacht ruft dich", body: "Im letzten Drittel der Nacht liegt eine besondere Zeit für Istighfār und Duʿāʾ." },
    { title: "🌙 Steh für Taḥajjud auf", body: "Wer in der stillen Nacht aufsteht, sucht eine Zeit besonderer Nähe und Antwort." },
    { title: "🌙 Das letzte Drittel ist da", body: "Diese Nachtzeit lädt zu Reue, Duʿāʾ und stillem Gebet vor Allah ein." },
    { title: "🌙 Taḥajjud tritt näher", body: "Nutze die Nacht, bevor der Morgen beginnt und der Tag dich wieder bindet." }
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
  const text = seededPrayerText(key, "entry", seedExtra);
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed + text.charCodeAt(i)) % 9973;
  return list[seed % list.length];
}

function seededPrayerText(prayerKey, mode, seedExtra = "") {
  const dayKey = new Date().toISOString().slice(0, 10);
  return `${dayKey}-${prayerKey}-${mode}-${seedExtra}`;
}

function pickPrayerAdvanceVariant(prayerKey, advanceMinutes, timeLabel = "") {
  const key = String(prayerKey || "").toLowerCase();
  const list = PRAYER_ADVANCE_PUSH_VARIANTS[key] || PRAYER_ADVANCE_PUSH_VARIANTS.fajr;
  const text = seededPrayerText(key, "advance", `${advanceMinutes}-${timeLabel}`);
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed + text.charCodeAt(i)) % 9973;
  return list[seed % list.length];
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
