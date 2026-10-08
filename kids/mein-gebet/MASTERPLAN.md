# DĀR AL TAWḤĪD KIDS — „Mein Gebet“
## Masterplan für Inhalt, Design, 3D, Audio und technische Integration
**Status:** Entwurf zur Abnahme · 08.10.2026  
**Gültigkeit:** nur Kids-App (Web, iOS-Kids-WebView und kompatible Kids-Ansichten). Keine Änderung der Erwachsenen-App.  
**Freigabe:** Nur Staging/Entwurfs-PR. Nicht auf `main` oder live ausrollen, bis ausdrücklich genehmigt.  
**Grundsatz:** „Mein Gebet zurückstellen“ muss ausschließlich dieses Feature aus der App entfernen. Kein globaler App-Rollback.
**Nutzerkorrektur vom 08.10.2026:** Kein permanenter Tab und keine neue Hörwelten-Kapsel in der Erprobungsphase. Nur ein kleiner Home-Testzugang innerhalb des bestehenden Home-Tabs. Profilfigur ist immer automatisch und ausschließlich von der aktiven Kinderprofil-Einstellung abhängig; keine zweite Gender-Auswahl im Gebetsbereich.

---

## 0. Hanbalitische Quellen- und Animationsfreigabe (verbindliche Nutzerentscheidung vom 08.10.2026)

Für den gesamten Gebetstrainer ist **hanbalitischer Fiqh** als Lehrrahmen vereinbart. Vorrangige Prüfbasis sind Qurʾān und **authentische Sunnah**, darauf aufbauend Ṣaḥābah, Salaf und frühe hanbalitische Lehrwerke. Die Quellenqualität ist nicht schon deshalb ausreichend, weil eine Ansicht „hanbalitisch“ genannt wird. Bei mehreren Überlieferungen von Imām Aḥmad und unterschiedlichen Hadith-Bewertungen wird dies offen notiert, bevor eine bestimmte visuelle Variante festgelegt wird.

**Pflichtdokumente (isoliert in diesem Feature):**
- `content/hanbali-review.json`: 12 getrennte Positionen/Lehrentscheidungen, 11 direkte Quellennachweise; alle explizit **nicht freigegeben**.
- `HANBALI-QUELLENPRUEFUNG.md`: arabische Fundstellen, konkrete Fragen, Prüf-Reihenfolge und Regeln für die gemeinsame Freigabe.

**Keine religiöse Lehr-/Animationsfreigabe aus der bloßen UI-Vorschau ableiten.** `approvedToAnimate=false`, `approvedToRecord=false`, `approvedToTeach=false`; pro Stellung ein eigener Reviewstatus. Die vorhandenen Kinderlektionen sind noch reine Navigations-/Text-Entwürfe.

**Zwei besonders relevante Fragen:** 
1. Ibn Qudāmah, *al-Muġnī*, Masʾalah 662 beschreibt verschiedene Aḥmad-Überlieferungen zur Handposition im Qiyām (unter/über Nabel). Vor einem festen 3D-Bild vergleichen und gemeinsam entscheiden.
2. *al-Muġnī*, Masʾalah 783 beschreibt hanbalitisch Frauenhaltungen beim Rukūʿ/Suǧūd/Sitzen. Deshalb muss eine etwaige Differenz für die **Mädchenfigur**, auch unter Berücksichtigung ihres Alters und der stärksten authentischen Belege, eigens geprüft werden. Keine unreflektierte Kopie der Jungenbewegung und keine unbelegte Differenz.

**Erster Freigabeweg:** Qiyām/Handposition → Rukūʿ als Probe-Pose → Suǧūd-Kontaktstellen vs. Absenkreihenfolge → Mädchen-spezifische Fragen → übrige Stationen. Nach jedem Prüfentscheid gesonderte Nutzerfreigabe; keine Sammel-Freigabe. Die Bedienoberfläche bleibt im eigenen Draft-Branch, ohne neue Hauptkapsel oder Tab und ohne Live-Änderungen.

---

## 1. Gesperrte Figurenvorlagen (visuelle Identität)

Die vom Auftraggeber gelieferten Bilder sind die alleinigen **Designreferenzen**. Sie zeigen unterschiedliche Ansichten, sind aber **keine riggten/animierbaren 3D-Modelle**. Erst ein echtes Mesh mit Skelett, Gelenken und Animationsclips kann im 3D-Gebetstrainer benutzt werden.

- **Junge**: gleiches Gesicht, große braune Augen, braune Haare, weiße Kufi mit goldfarbenem Ornamentrand, langes weißes Gewand und passende Schuhe wie in den Originalbildern.
- **Mädchen**: gleiches Gesicht, große braune Augen, **kräftig rosafarbener** geschlossener Hijab, **passendes rosafarbenes** langes Kleid mit Ärmeln, hellrosa Schuhe wie in den vom Nutzer gelieferten Originalbildern. **Nicht** das abweichende weiße Kleid früherer Probe-Generierungen benutzen.
- Je Figur ein konsistenter Referenzsatz: frontal, links/rechts drei Viertel, Profil, Rückenansicht, Portrait. Dieselbe Identität in sämtlichen Perspektiven, niemals verschiedene Gesichter oder Kleidung.
- **Verbindliche automatische Zuordnung:** Aktives Jungenprofil → ausschließlich Jungenfigur; aktives Mädchenprofil → ausschließlich Mädchenfigur. Keine manuelle Figur-Auswahl innerhalb von „Mein Gebet“, weder im Hub noch im 3D-Trainer. Die App liest die vorhandene aktive Profil-Einstellung (`kids.activeProfile`/`kids.profiles.v1` bzw. `.app[data-gender]`). Wechsel des Profils greift beim nächsten Öffnen bzw. nach dem vorhandenen Profilwechsel-Neuladen automatisch. Gastprofile folgen ihrer vorhandenen gewählten Jungen-/Mädchen-Einstellung. Wenn noch keine Wahl existiert, Hinweis zur Profilwahl statt willkürlicher Jungenfigur. Andere Profilfunktionen und Daten niemals verändern.
- Neutrale Standpose ≠ kanonische Gebetsstellung. Die Hände der Mädchenfigur sind auf den gelieferten Bildern vor dem Körper, aber keine Gebetshaltung darf daraus abgeleitet werden.
- Für Indoor-Gebetsanimationen gesondert geprüft entscheiden, ob die Figuren barfuß/Socken statt mit den Referenzschuhen auftreten. Referenz-Avatar bleibt unverändert.
- Kein nicht freigegebenes KI-Bild als finale Lehrdarstellung verwenden.

## 2. Informationsarchitektur (V1 Endziel)

**Phase 1 – Kids Home (bestehender Home-Tab):** Noch **keine neue Hörwelten-Kapsel**, **kein fünfter Haupt-Capsule-Button**, **kein eigener Bottom-Navigations-Tab**. Zunächst nur ein dezenter anklickbarer **Home-Testzugang „Mein Gebet“** unmittelbar **unter** der bestehenden Hörwelten-Kartenliste, ohne sie zu verändern. So lässt sich der neue Bereich ausprobieren, bevor er ein fester Bestandteil der Navigation wird. Der Einstieg zeigt bereits den zum aktiven Profil passenden Jungen- oder Mädchen-Avatar. Gestaltung mit bestehendem **weichem Referenz-Glow** und ohne grellen Halo.

**Phase 2 – nach ausdrücklicher Designfreigabe:** Den Testzugang in einen separaten, dauerhaften **„Mein Gebet“-Tab** mit eigener vollwertiger Seite überführen. Dies ist ein **späterer eigenständiger Freigabeschritt**; die vorläufige Home-Verknüpfung wird dann ersetzt und nicht als doppelte Navigationsmöglichkeit behalten.

**Mein Gebet (Test-Hub)**: eine nur über den Home-Testzugang erreichbare Vorschauseite mit klarem Kopfbereich, automatisch profilabhängiger Figur, kurzem Einführungssatz und **exakt vier anklickbaren Lernfeldern**:

1. **Was ist das Gebet?** — kurze, altersgerechte Einführung; Ṣalāh als Gottesdienst, die fünf Pflichtgebete, Grundbegriffe.
2. **Warum beten wir?** — Liebe zu und Erinnerung an Allah, Sinn des Gebets, Umgang mit Ablenkung, aufbauende Motivation statt angstmachender Spielmechanik.
3. **Wie bete ich?** — Bedingungen vor dem Gebet, Grundstellungen, erster vollständig geprüfter 2-Rakʿah-Ablauf, später alle fünf Gebete.
4. **Mein 3D-Gebet** — interaktive Jungen-/Mädchenfigur, 360° Betrachtung, schrittweise animierte Bewegungen, Hören/Mitlesen/Lernen.

**Keine weiteren permanenten Home-Kapseln oder Navigationstabs in Phase 1.** Die vier Lernfelder gehören ausschließlich zur Vorschauseite, nicht zur bestehenden Home-Kartenliste. Wort-für-Wort, langsames Lernen, Wiederholen, Hinweise und Fortschritt sind später Funktionen **innerhalb** der Lektionen.

### Beispiel-Navigation

`Kids Home → Mein Gebet → Wie bete ich? → 2 Rakʿah lernen → Schritt 3: Qiyām → Audio / 3D-Ansicht`.

Die vierte Lernfläche führt künftig direkt zum 3D-Trainer. In Phase 1 sind die vier Lernfelder nur **anklickbare Gestaltungs-/Navigationsprototypen** ohne echte 3D-/Audio-Funktion. Zurück-Button ist bereits vorhanden; iOS-Wisch-zurück und Browser-History müssen vor einer dauerhaften Navigationserweiterung separat validiert werden, ohne andere Tabs zu beeinflussen.

## 3. Lerninhalte — genauer redaktioneller Aufbau

### 3.1 „Was ist das Gebet?“
- Kindgerechte Definition: Ṣalāh als regelmäßiger Gottesdienst für Allah.
- Die fünf Gebete als übersichtliche, einzeln antippbare Elemente: **Faǧr: 2**, **Ẓuhr: 4**, **ʿAṣr: 4**, **Maġrib: 3**, **ʿIšāʾ: 4** Rakʿāt (Pflicht-Rakʿāt; Sunan/Nawāfil getrennt behandeln).
- Was eine Rakʿah ist; Zeichenerklärung für Qiyām, Rukūʿ, Suǧūd.
- Pro Mini-Lektion: maximal wenige kurze Sätze, Audios, einfache Wissensfrage (freiwillig).

### 3.2 „Warum beten wir?“
- Allah allein anbeten, Ihm gedenken, Dankbarkeit und Regelmäßigkeit.
- Redaktionelle Leitbelege: Qurʾān **20:14** („… und verrichte das Gebet zu Meinem Gedenken“) und der Hadith **Ṣaḥīḥ al-Buḫārī 631** („Betet, wie ihr mich beten gesehen habt“). Wortlaut und deutschsprachige Übersetzung vor Veröffentlichung am arabischen Original prüfen.
- Kein Gleichsetzen von Versen, Ratschlägen oder optionalen Handlungen mit rechtlichen Pflichten ohne Beleg.

### 3.3 „Wie bete ich?“ — Vorbereitung
- Wuḍūʾ und rituelle Reinheit, saubere Kleidung/Ort, Gebetszeit, Qiblah, Bedeckung, aufrichtige Absicht im Herzen.
- Gebetswaschung als **eigener späterer Unterlehrgang** nur bei Bedarf. In V1 zunächst Erklärung + Verweis statt unkontrolliertem Scope-Wachstum.
- Keine erfundene verpflichtende ausgesprochene Niyyah.
- Text unterscheidet **Voraussetzungen**, **notwendige Bestandteile**, **Sunnah/empfohlene Handlungen**, **bekannte Fiqh-Meinungsunterschiede**. Klassifikation fachlich gegenprüfen und ggf. je Madhhab differenzieren.

### 3.4 Erste kanonische 2-Rakʿah-Lektion (Pilot)
Pro Schritt: **eindeutige Ausgangspose → Zielpose → Bewegung → zugeordneter Text → kindgerechte Erklärung → Quellenstatus**.

| Nr. | Lernstation | Lehrgegenstand |
|---|---|---|
| 0 | Vorbereiten | Reinheit, Zeit, Qiblah, Absicht |
| 1 | Takbīrat al-Iḥrām | Gebet eröffnen, zugeordneter Takbīr |
| 2 | Qiyām | Stehen, al-Fātiḥah; optionale zusätzliche Rezitation gesondert markieren |
| 3 | Rukūʿ | Verbeugen, geprüfter Dhikr |
| 4 | Iʿtidāl | Aufrichten, zugeordnete Formel |
| 5 | Erster Suǧūd | Niederwerfung; sieben Kontaktstellen anhand authentischer Belege prüfen |
| 6 | Ǧalsah | Aufrechtes Sitzen zwischen Niederwerfungen und Duʿāʾ |
| 7 | Zweiter Suǧūd | Zweite Niederwerfung |
| 8 | Zweite Rakʿah | Entsprechender Ablauf mit markierten Wiederholungen |
| 9 | Schluss-Sitzen | Tašahhud und weitere zugeordnete Texte, je nach geprüfter Lehre |
| 10 | Taslīm | Gebet beenden; Richtung/Anzahl der Grüße nach geprüfter Variante |

Quellenanker für animierte Suǧūd-Kontaktstellen: **Ṣaḥīḥ al-Buḫārī 812** (Stirn/Nase, beide Hände, beide Knie, Zehenspitzen beider Füße). Jede konkrete Gelenk-/Hand-/Fußdarstellung wird vor Abnahme mit überprüften Nachweisen abgeglichen.

**Wichtig:** Erfüllbare Grundbewegungen klar lehren; bei überlieferten Varianten (z. B. einzelne Handpositionen, Bewegungsdetails und rechtsschulische Unterschiede) keine unbelegte „einzig gültige“ Darstellung behaupten. Eine eventuelle geschlechtsspezifische Differenz muss ausdrücklich belastbar belegt sein; nicht aus Bildästhetik ableiten.

### 3.5 Skalierung auf alle fünf Pflichtgebete
Nach fertig geprüfter 2-Rakʿah-Vorlage **denselben Sequenz-Engine- und Bewegungsdatensatz** wiederverwenden. Anzahl und Reihenfolge der Rakʿāt über geprüfte Konfigurationsdaten steuern; keine fünf unabhängig kopierten Logiken. Gebetszeit-Erinnerungen der App werden **nicht** verändert.

## 4. Lernansicht je Gebetsstation

Die Oberfläche besitzt drei klar benannte Darstellungsmodi:
- **Hören & Mitlesen** (Standard): 3D-Bewegung/Standpose, synchron hervorgehobene deutsche Erklärung und arabische Formel, optionale Lautschrift.
- **Nur Hören**: große Figur mit minimalen Bedienelementen, Audio normal/langsam, Wiederholen.
- **Lesen & Üben**: Arabisch mit Diakritika, überprüfte Umschrift, kindgerechte Bedeutung, antippbare Wörter, ruhige Lernanweisungen.

**Controls**: Zurück | Schritt x von n | Abspielen/Pause | Wiederholen | Tempo „Normal / Langsam“ | nächster Schritt | 3D drehen | Zoom. Der Schrittwechsel stoppt alte Audio-Wiedergabe sofort. Keine automatischen Endlosschleifen.

**Worttippen** spielt **ausschließlich die sauber ausgesprochene Einzelwortdatei**, nicht einen willkürlich ausgeschnittenen Satzrest. Audiostart, Highlight und Fortschritt müssen mit stabilen Zeitmarken synchronisiert werden. Arabischer Text in korrekt gesetzter RTL-Schrift; Umschrift und Deutsch getrennt, ohne falsche Richtung/Zeilenumbrüche.

**Lernhilfen**: freiwillige Mini-Fragen, ruhige positive Rückmeldung, unabhängig von Spielen/Quiz des übrigen Produkts. Keine Gebets-Gamification, die religiöse Pflichten als bloße Punkteaufgabe darstellt.

## 5. 3D-Charaktertechnik

**Lieferobjekte pro Figur**:
1. konsistentes echtes 3D-Mesh, Texturen/Materialien, korrekte Normalen;
2. riggtes Skelett inkl. Wirbelsäule, Hüfte, Knie, Füße, Arme, Ellenbogen, Handgelenke, Kopf; genügend Freiheitsgrade für Suǧūd/Ǧalsah;
3. kontrollierte Pose-Clips und Übergänge, inklusive korrekter Hand-/Fuß- und Kniepositionen;
4. exportierte `.glb`-Datei mit eindeutigen Clipnamen und Metadaten;
5. Validierungsaufnahmen **Front, Seite, Rückseite, oben/Schräg** jeder Gebetsstellung.

**Technik**: glTF/GLB über Three.js/WebGL in isoliertem, lazy geladenem Viewer; keine Änderungen am bestehenden Qurʾān-/Duʿāʾ-/Story-Player. `OrbitControls` für 360°-Orbit (azimutal umlaufend), begrenzter vertikaler Winkel, Pinch-to-Zoom, Kameravoreinstellungen Front/Seite/Detail. Kinder können Bewegung pausieren und Figur drehen. Eine Filmaufnahme oder sechs 2D-Referenzbilder sind **kein** interaktives 3D-Modell.

**Animation**: zunächst gesicherte Keyframes/IK bzw. geprüfte Animationsclips statt generativer KI-Videobewegungen. Kleidung darf nicht durch Hände/Knie schneiden. Besonders beim rosafarbenen Kleid wird Stoffsimulation oder kontrolliertes Skirt-Rig notwendig. Wiederholbare, deterministische 3D-Clips statt Video-Halluzinationen.

**Ausfallsicherheit**: wenn WebGL/WebView zu schwach ist, fachlich freigegebene Standansichten/Schrittbilder als 2D-Fallback anzeigen und alle Lerntexte/Audios weiter benutzbar halten. Kein leerer Bildschirm. Viewer vollständig entladen, wenn „Mein Gebet“ verlassen wird.

## 6. Audio-Produktion

**Drei getrennte Quellen**:
- **Deutsche kindgerechte Erklärung**: vorhandene freigegebene ElevenLabs-Masterstimme des App-Inhabers, erst nach Testprobe und Zustimmung.
- **Arabische Gebets-Duʿāʾ und Adhkār**: dieselbe Masterstimme in Fuṣḥā, sofern Aussprache durch arabischkundige Prüfung freigegeben. Für jedes Wort separate, sorgfältig gesprochene Segmente.
- **Qurʾānverse/al-Fātiḥah**: ausschließlich authentisch/professionell geprüfte Aufnahmen mit geklärter Nutzungsberechtigung und korrektem Taǧwīd. Keine ungeprüfte automatische TTS-Generierung als Lehrrezitation.

**Dateisystem**: `audioId`, `speakerId`, `sourceType`, `textArabic`, `transliteration`, `meaningDe`, `normalAsset`, `slowAsset`, `wordAssets[]`, `timings[]`, `reviewStatus`, `sourceRefs[]`. Alle Dateien vor Freigabe abspielbar, kein Platzhalter-Audio.

**Synchronisation**: Abspielereignis ist Master-Zeitquelle; sichtbare Wortmarkierung folgt überprüften Segmentzeitmarken. Auflösung/Startlatenz auf echten iPhones messen und dokumentieren; kein behauptetes sekundengenaues Verhalten ohne Gerätetest. Konfliktfreiheit: jeder Schrittwechsel beendet laufenden Player, Verlassen zerstört die Session. Günstig und creditsparend: erst einzelne Beispielaudio-Dateien, nicht alle Lektionen vor Designfreigabe.

## 7. Datenarchitektur und Modulgrenzen

Nur unter `kids/mein-gebet/` neue Komponenten und Daten entwickeln:

```text
kids/mein-gebet/
├── MASTERPLAN.md
├── config.json              # Freigabestatus + Feature-Flag
├── hub.css                  # Nur #view-mein-gebet / prayer-prefixed Selektoren
├── hub.js                   # Navigation / Screen-State
├── content/
│   ├── lessons.json         # Texte mit Status + Quellen
│   ├── prayer-steps.json    # Sequenz, Zustände, Pose-IDs
│   └── source-review.json   # Fachprüfung, Belegstatus
├── audio/                   # Getrennte Sprach-/Rezitations-Assets
├── characters/
│   ├── boy.glb
│   └── girl.glb
├── 3d/
│   ├── viewer.js
│   └── poses.json
├── fallback/                # geprüfte 2D-Bilder
└── tests/                   # Feature, Performance, Revert
```

**Achtung**: Verzeichnisstruktur ist die **Zielstruktur**, noch nicht als vollständige Implementierung vorhanden. Vorhanden auf dem Entwurfsbranch ist `preview-v1.js` als unabhängige UI-Vorschau.

**Kleine Integrationsstellen**: exakt die benötigten Script-/Style-Verweise in `kids/index.html`, `kids/start.html`, `kids/shell.html`; alle drei Shells müssen identisch bleiben, weil der Kids-Release-Guard dies fordert. Keine Änderung an `index.html` der Erwachsenen-App, `cloudflare/worker.js`, Push, Manifest, vorhandenen Audios/Quiz/Story-Daten oder Service Worker ohne gesonderte Freigabe.

**Feature-Flag**: Im aktuellen Branch stoppt `window.DAR_KIDS_MEIN_GEBET_ENABLED=false` vor dem Skriptaufruf die gesamte Vorschau-Initialisierung. **Wichtig:** Eine dauerhaft zentral verwaltete Konfiguration mit produktionsseitigem Default OFF und erweiterten Offline/Asset-Regeln ist ein **noch zu implementierendes Release-Gate**. Der Branch ist bislang nicht auf `main` gemergt und nicht live. Bei deaktiviertem Modul darf kein „Mein Gebet“-DOM, neuer Navigationseintrag oder eigener Asset-Download entstehen.

**Offline**: geprüfte Kerntexte, 2D-Fallback, 3D-Modelle und die für das jeweilige Lernpaket benötigten Audioassets offline bereitstellen. Vorhandene Kids-Service-Worker-Strategie nur nach eigener Risikoanalyse und ausdrücklicher Freigabe anfassen. Download-Packs mit sichtbarem Fortschritt erst in späterer Stufe; nicht implizit große Mediendaten herunterladen. Personalisierte Lernstände lokal speichern und beim Rückbau kontrolliert nur diesen Namespace löschen, nicht Profildaten.

## 8. Abnahmebedingungen und Rückbau

1. Home: bestehende Karten, Markenlogo, Luftigkeit und **weicher globaler Glow** unverändert; der **temporäre schmale Test-Einstieg außerhalb des Kapselrasters** ist vollständig responsive, keine fünfte Hörwelten-Kapsel, kein zusätzlicher Bottom-Tab.
2. Navigation: Tap, Zurück, Edge-Swipe, Browser-Back in iPhone/iPad/Android/Desktop; keine überdeckte iOS-Statusbar oder Bottom-Navigation, kein Oversize/Edge-to-Edge-Fehler.
3. Charakter: **Originaldesign** Junge (weiß/gold), Mädchen (kräftig pink) erkennbar; keine Gesichts-/Kleidungswechsel beim Drehen oder zwischen Posen.
4. Gebetsinhalt: **jede** Pose + Text + Fiqh-Kategorie + Quellen nachweislich fachlich geprüft, bevor die Lektion als fertig gilt. Keine erfundenen Bewertungen/Varianten.
5. Audio: jede Normal-, Langsam- und Worttaste wirklich belegt, Sprecherwahl korrekt, kein Versatz nach Pausieren/Springen, Offline-Wiedergabe möglich.
6. 3D: Drehen, Vergrößern, Pose pausieren, Wechsel sanft, keine sichtbar unnatürlichen Gelenke, Hände/Füße richtig positioniert; Performance auf realen iPhones/iPads testen.
7. Fehlerfall: Offline-/WebGL-/Audiodateifehler führt zu sanftem Fallback, nie zu einem blockierten gesamten Kids-Shell.
8. **Rollbacktest**: Modulcode samt Einbindung zurücknehmen; das Diff enthält **keine** sonstige App-Dateiänderung. Bei späterer Weiterentwicklung nur featureeigene Prefs bereinigen. Nichts anderes zurücksetzen.
9. Tests: Build/Design-/Lane-/Integritäts-Guards laut Repo, keine Besucher-Pushs, erst Test/Staging. Produktionsdeploy nur nach direkter Nutzerfreigabe.

## 9. Freigabe- und Kostenphasen

| Phase | Lieferung | Freigabekriterium | Zusätzliche Generierungskosten |
|---|---|---|---|
| **0 (jetzt)** | Informationsarchitektur + technischer Masterplan | Nutzer akzeptiert Struktur | 0 € |
| **1** | Temporärer Home-Link + profilabhängiger klickbarer Hub auf Staging | Jungenprofil zeigt Jungenfigur, Mädchenprofil zeigt Mädchenfigur; visuelle Struktur gefällt | 0 € |
| **2** | Eine originalgetreue **Jungenfigur als riggtes GLB** + eine geprüfte Grundpose | 360° und Bewegung real funktionsfähig | nur nach Ausgabenfreigabe |
| **3** | Kompletter geprüfter 2-Rakʿah-Durchlauf + minimale Audio-Probe | Quellen, Gelenke, Audio und Synchronität abgenommen | nur nach Ausgabenfreigabe |
| **4** | Gleichwertige Mädchenfigur in **originalem pinkfarbenem Design** | gleiche Qualitätsstandards | nur nach Ausgabenfreigabe |
| **5** | Fünf Gebete, Altersstufen, alle Audiosegmente, Offline und Fallback | komplette QA bestanden | nur nach Ausgabenfreigabe |
| **6** | Kids-Release | ausdrückliches „push live“ | keine ungeplanten Extras |

**Keine Käufe oder Credit-Verbrauch ohne konkreten Kostenplan und Freigabe.** Blender und Three.js sind Open-Source-Werkzeuge, der reale 3D-Produktionsaufwand und eventuelle Fach-/Produktionsleistungen sind nicht automatisch kostenlos.

## 10. Unmittelbare Entscheidung / nächste Aufgabe

**Nächste Aufgabe: Phase 1 sicher in Staging bereitstellen und auf Geräten testen.** Das Draft-PR enthält den **kleinen Home-Testzugang außerhalb der Hörwelten-Kapseln**, vier anklickbare Vorschau-Lernbereiche und automatische Profilauswahl für die vorhandenen Mini-Profilbilder. **Die vom Nutzer gelieferten Ganzkörperfiguren sind bislang nur Designreferenzen und noch nicht als echte animierbare GLBs eingebunden.** Nach visueller Freigabe vorerst eine Jungenfigur als echten 3D-Rig-Prototypen entwickeln. **Erst nach ausdrücklicher späterer Freigabe** erhält „Mein Gebet“ einen eigenen permanenten Bottom-Tab/eine dauerhafte Seite. Weder sämtliche Gebete noch sämtliche Audios vor Machbarkeitstest produzieren.

**Nicht bereits geliefert:** animierbare GLBs, Gebets-Animationsclips, vollständige Quellenabnahme, Wort-Audios und Live-Deployment.


## Technischer Fortschritt – 08.10.2026 (Testbranch, nicht veröffentlicht)
- Originale Nutzerfiguren als transparente PNG erhalten, ohne das Aussehen zu ändern: `assets/figur-junge-original.png`, `assets/figur-maedchen-original.png`. Keine SVG-Ersatzfiguren im Gebetshub mehr.
- Zwei unabhängige, textfreie Hero-Hintergrundbilder: `assets/hero-boy.jpg` (Nachtblau/Gold) und `assets/hero-girl.jpg` (Rosé/Nachtblau).
- `preview-v1.js`: Home-Testlink und Hub-Hero erscheinen automatisch entsprechend `.app[data-gender]`; die Figuren sind unverändert, lediglich der Hintergrund ist profilspezifisch.
- Navigation der Vorschau ohne Abhängigkeit von `window.showTab` repariert. Vier Lernkarten öffnen Detailansichten; die beiden Zurück-Buttons bleiben innerhalb des Kids-Shell-Flows.
- Eigenständige klickbare Referenzen: `demo-junge.html` und `demo-maedchen.html`. Kein veröffentlichter App-Tab, keine Veränderung anderer Module.
- Separat lokal bereitgestellte Offline-HTML-Demos (ursprüngliche PNG-Figuren als Data-URI eingebettet) wurden mit Chromium/Playwright geprüft: Einstiegsbutton, vier Detailkarten, Rücknavigation jeweils erfolgreich und keine JavaScript-Ausnahme.
- GitHub-Entwurfsbranch ist **kein öffentlicher Preview-Deploy**. GitHub-Dateilinks dürfen nicht als funktionierende Website-URL bezeichnet werden. Browserseitige iOS/WKWebView-Prüfung und produktiver Deploy bleiben offen.
- **Noch nicht vorhanden:** geriggte GLB-3D-Modelle, geprüfte Gebetsbewegungen, Stimmen/Audios und veröffentlichte Lektionen. Render-PNGs sind keine animierbaren 3D-Dateien.
