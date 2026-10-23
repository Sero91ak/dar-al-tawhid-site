"use strict";

const sourceFiles = [
    "assets/stories-app.js",
    "desktop-preview/assets/dar-v8-cross-pages.js"
];

const expandedWebKeys = [
    "Beitrag",
    "Ein Duʿāʾ aus der Sammlung.",
    "Gebetszeiten und Erinnerungen findest du in der App — ruhig und ohne Ablenkung.",
    "Gebets-Push",
    "15 Minuten vor dem Gebet und zur Gebetszeit — dezente Push-Erinnerung auf dem Sperrbildschirm.",
    "App-Hinweis",
    "Qibla & Zeiten",
    "Standort freigeben — dann siehst du die Zeiten für deinen Ort und den Qibla-Kompass.",
    "Jumuʿah",
    "Freitagsgebet nicht vergessen — prüfe die Dhuhr-/Jumuʿah-Zeit in deiner Region.",
    "Erinnerung",
    "Adhkar nach Gebet",
    "Nach dem Gebet: kurze Adhkār aus Qurʾān und Sunnah — in der Duʿāʾ-Sammlung.",
    "Storys",
    "Kurzinhalt",
    "Story",
    "Vorherige",
    "Nächste",
    "Links/rechts wischen · Inhalt unten öffnen",
    "Kategorie öffnen",
    "Mehr lesen",
    "Ordner öffnen",
    "Wissenschat",
    "Ḥadīṯ & Āṯār",
    "Mobile V8 Hauptnavigation",
    "✦ Wissenschat öffnen",
    "◷ Gebetszeiten",
    "Fundstellen aus unserem Bestand",
    "Keine passende Fundstelle verfügbar",
    "Ich habe {count} passende Fundstellen in den aktuell indexierten Inhalten gefunden. Öffne die Quellen unten, um die Originalbelege und den vollständigen Kontext zu lesen.",
    "In den derzeit indexierten Inhalten unserer Website ist keine passende Fundstelle vorhanden. Ich ergänze keine unbelegten Aussagen.",
    "{count} indexierte Einträge",
    "Keine geprüfte deutsche Fassung im Suchindex.",
    "Einstufung: {grade}",
    "Zu diesem Begriff wurde im aktuellen Ḥadīṯ-Suchindex keine passende Überlieferung gefunden.",
    "Ḥadīṯe und Āṯār werden aus der vorhandenen Suchbibliothek geladen …",
    "Die Ḥadīṯ-Suchliste ist momentan nicht erreichbar. Die übrigen Bereiche bleiben verfügbar.",
    "Hauptnavigation · {page}",
    "DĀR AL TAWḤĪD · {page}",
    "Nächstes: {nextPrayer}",
    "Das nächste Gebet ist {nextPrayer}. Aktiviere die Erinnerung, um rechtzeitig informiert zu werden.",
    "Qurʾān & Tafsīr",
    "Werk",
    "Themen",
    "Zakāt",
    "Nr. {number}"
];

const sourceMarkers = {
    "Ich habe {count} passende Fundstellen in den aktuell indexierten Inhalten gefunden. Öffne die Quellen unten, um die Originalbelege und den vollständigen Kontext zu lesen.": "Ich habe ",
    "{count} indexierte Einträge": " indexierte Einträge",
    "Einstufung: {grade}": "Einstufung: ",
    "Hauptnavigation · {page}": "Hauptnavigation · ",
    "DĀR AL TAWḤĪD · {page}": "DĀR AL TAWḤĪD · ",
    "Nächstes: {nextPrayer}": "Nächstes: ",
    "Das nächste Gebet ist {nextPrayer}. Aktiviere die Erinnerung, um rechtzeitig informiert zu werden.": "Das nächste Gebet ist ",
    "Nr. {number}": "Nr. "
};

module.exports = { sourceFiles, expandedWebKeys, sourceMarkers };
