#!/usr/bin/env node
"use strict";
/* Zero-paid, offline regression: 15 adult DAR TEST routes share full UI control/error
 * captions across all nine registered languages. This is not a native-speaker,
 * pixel-visual, device, or religious-edition validation. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const codes=["tr","en","ar","ku","ckb","bs","fr","es"];
assert.equal(pack.scope,"adult-interface-only");
assert.equal(pack.noPaidProvider,true);
assert.deepEqual([...pack.availableLocales].sort(),["de",...codes].sort());
assert.deepEqual([...pack.rtlLocales].sort(),["ar","ckb"].sort());
const bySection={
 home:["Heute im DĀR","Bibliothek des Wissens","Neu im Wissen","Dein letzter Stand","Wissen durchsuchen"],
 library:["Bücher & Quellen","Bibliotheken & Quellen","Sammlungen & Quellen","Weniger Werke anzeigen","Werke anzeigen"],
 quran:["Sūrah suchen","Āyah suchen","Qāriʾ wählen","Rezitator suchen…","Āyāt werden geladen …","Die Qurʾān-Texte konnten nicht geladen werden. Bitte erneut versuchen."],
 audio:["Rezitation konnte nicht geladen werden.","Für diese Āyah ist keine Audiodatei verfügbar.","15 Sekunden zurück"],
 hadith:["Ḥadīṯ-Bibliothek öffnen","Dieser Ḥadīṯ konnte nicht geladen werden.","Nur Hauptwerke anzeigen"],
 search:["Suchfilter öffnen","Treffer anzeigen","In der App suchen","Direkt öffnen"],
 prayer_location:["Standort nicht gefunden","Wetter nicht verfügbar","Standort konnte nicht ermittelt werden. Bitte GPS prüfen oder eine Stadt wählen.","Bitte die passende Stadt aus der Liste auswählen."],
 settings:["iOS-Einstellungen öffnen","Standortfreigabe in iOS öffnen","Neue Version verfügbar","Neue Version laden"],
 more:["Weitere Bereiche öffnen","Weitere Funktionen und Einstellungen","Zeiten & Erinnerungen"],
 content_ui:["Bild konnte nicht geteilt werden. Bitte kurz warten und erneut versuchen.","Weitere Beiträge laden…"],
 learn:["Āyah gespeichert. Nächste Āyah wird geladen.","Live-Worterkennung ist auf diesem Gerät nicht verfügbar. Aufnahme läuft trotzdem."],
 chat:["Gespräch & Einstellungen","Menü schließen","Zurück zum ʿIlm-Chat","Geprüfte Quellen","Fundstellen prüfen","Fragevorschläge","Quellen werden geprüft …","Weitere Belege","Passende Inhalte der App"],
 feed:["Beitrag lesen","Bild wird vorbereitet…","Bildbeitrag erstellen und teilen","Feed aktualisieren","Noch keine Bildbeiträge im Feed.","Wissen weitergeben"],
 home_content:["Bittgebet des Tages","Bücher & PDFs","Neueste Veröffentlichungen","Suchtext löschen","Meist gelesen"],
 settings_extended:["Hintergrundaktualisierung ausschalten","Hintergrundaktualisierung erlauben","Daten für Widgets und Watch aktualisieren","Ort wird ermittelt …"],
 quran_extended:["Textgröße","Lautstärke","Timer aus","Vorige Āyah","Wiedergabe beenden","Sūrah zufällig"],
 hadith_extended:["Die Bibliothek ist gerade nicht erreichbar.","Werke · Kitāb · Bāb · Nummer","Šarḥ – Erklärung zum Ḥadīṯ"],
 weather:["Klar","Leicht bewölkt","Schneeschauer","Gewitter","Wetter: Standort in Gebetszeiten festlegen"],
 player_error:["Sūrah-Verzeichnis unvollständig","Keine Audio-Dateien für diesen Rezitator",
               "Wiedergabe konnte nicht gestartet werden.","Player-Optionen",
               "Synchron zur Rezitation","15 Sekunden vor","Sleep-Timer"],
 nav_more:["Mitteilungen","App-Update erforderlich","Nachweise","Sammlungen","Grundlagen"]
};
for(const code of codes){
 const strings=pack.translations[code];
 assert(strings&&Object.keys(strings).length>=786,"Insufficient "+code+" UI entries");
 for(const [section,labels] of Object.entries(bySection))
  for(const source of labels){
   const localized=strings[source];
   assert(typeof localized==="string"&&localized.trim(),"Missing "+section+" / "+code+" / "+source);
   assert(!/[<>]/.test(localized),"Markup in "+code+" / "+source);
   assert(localized!==source,"German fallback in "+section+" / "+code+" / "+source);
  }
 const protectedVerse="„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“";
 assert(!Object.hasOwn(strings,protectedVerse),"Protected quote in UI dictionary "+code);
}
const source=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
for(const token of ["[data-canonical-content]","[class*='source-quote']","[class*='hadith-text']","[class*='quran-arabic']","event?.detail?.source===\"native\""]){
 assert(source.includes(token),"Protected source/bridge guard missing: "+token);
}
console.log("PASS: "+codes.length+" target locales, "+Object.keys(bySection).length+
 " functional UI categories, 786+ labels and protected source/bridge guards");
