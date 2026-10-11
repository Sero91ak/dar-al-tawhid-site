# Mein Gebet — verbindliche Abschlusskette (11.10.2026)

**Einziges Endziel:** Ein originalgetreuer Junge und ein originalgetreues Mädchen als echte, sorgfältig geriggte 3D-Figuren; korrekte, einzeln nach Qurʾān, authentischer Sunnah und dem gewählten hanbalitischen Unterrichtskonzept geprüfte Gebetsstellungen; ein vollständig benutzbarer Gebetstrainer in der eigenständigen KIDS-App. **Keine Abkürzung durch Platzhalter.**

**Reihenfolge und maschinenlesbare Nachweise:** `rigging/COMPLETION-GATES-V1.json`, geprüft mit `node rigging/validate-completion-gates.cjs` und `node --test rigging/test-completion-gates.cjs`. Das sind nur technische Vertragsprüfungen; der echte GLB-Nachweis und die visuelle/religiöse Abnahme sind separat und dürfen nicht von JSON-Metadaten ersetzt werden.

## 12 nicht überspringbare Einzelabnahmen

| Nr. | Was wird tatsächlich beendet? | Derzeit | Was muss vorher nachweisbar sein? |
| --- | --- | --- | --- |
| 01 | Originalbilder, fünf Perspektiven und V7.7-Quelldaten rekonstruieren | **Arbeit läuft; blockiert an ZIP-Rohdaten** | Unveränderte Originalreferenzen Junge/Mädchen, lesbares V7.7-GLB, SHA-256-Originaltafel; fehlende Mädchen-Perspektiven klären |
| 02 | **Original-Junge** als echtes 3D fertig modellieren | Gesperrt | Gesicht, Haare, große braune Augen, weiß-goldene Kufi, weißer Thawb, Schuhe; 5 Ansichten und ausdrückliche Zustimmung |
| 03 | **Original-Mädchen** als eigenständiges 3D fertig modellieren | Gesperrt | Identisches Gesicht, kräftig rosa vollständig bedeckender Hijab, Kleid, Schuhe; 5 Ansichten und ausdrückliche Zustimmung |
| 04 | Echter GLB-Skin und Gelenke für **beide** Figuren | Gesperrt | Gelenkgewichte, Skelett, Bindepose, identische Knochenlängen, keine Gesichts-/Stoffdeformationen |
| 05 | Sämtliche Gebetsbewegungen auf den **echten** Figuren | Gesperrt | Qiyām, Takbīr, Rukūʿ, Aufrichten, Suǧūd, Sitzen, zweiter Suǧūd, Tašahhud, Salām mit Kontakt-/Seitentests |
| 06 | Islamisch-fachliche Einzelprüfung jeder Bewegung | Gesperrt | Text-/Fiqh-Nachweise; Mädchenvarianten getrennt prüfen; Bildreferenz ist keine Lehrfreigabe |
| 07 | Vollständiger **Zwei-Rakʿah**-Ablauf | Gesperrt | Reihenfolge, Wiederholung, Rezitation, Sitzhaltung, Ende rechts → links; kein Heben zur dritten Rakʿah |
| 08 | Drei-/Vier-Rakʿah- und Pflichtgebetsvarianten | Gesperrt | Rafʿ al-Yadayn bei Aufstehen zur dritten Rakʿah nur wenn eine dritte folgt; alle fünf Gebete |
| 09 | Lerninhalte, Audio, Wiederholen, Offline und Profil-Fortschritt | Gesperrt | Vier Lernbereiche, echte geprüfte Stimmen, Downloads, altersgerechter Unterricht und Fortschritt |
| 10 | Vollständige schöne, responsive **Mein-Gebet-Seite** | Gesperrt | Kleine und große iPhones, Android, Foldables, Tablets, Safe Areas und lesbare Controls |
| 11 | Isolationstest in Kids-App ohne Besucherfreigabe | Gesperrt | Nur bestehender Home-Testzugang; automatische Figur vom aktiven Kids-Profil; Rollback/Realgeräte |
| 12 | Deine endgültige Abnahme, danach kontrollierte Freigabe | Gesperrt | Alle 11 Vorgänger vollständig; fachlich/visuell/technisch geprüft; ausdrücklicher Releaseentscheid |

## Bereits erarbeitete Dinge gehen nicht verloren

- **Originalidentität:** `rigging/original-boy-identity-lock-v1.json` und die Originalreferenzen unter `assets/`.
- **Modellkandidat:** V7.7 GLB samt Referenztafel ist über Hash bekannt, aber die ZIP-Rohdaten in der ChatGPT-Dateibibliothek sind zurzeit nicht lesbar. **Dateiname und Metadaten sind kein Besitz der echten Modellbytes.**
- **Vorherige Animationstechnik:** Nur Qiyām/Takbīr als unfreigegebene Clips in der beschriebenen Offline-V7.7-Kandidatenfassung. Ein `append_taslim_draft.py` kann später den Kopfclip anhängen; nur an gepinnter V7.7-Datei, noch nicht am Original ausgeführt.
- **V8.1 HTML:** frei drehbares **Testlabor**, startet aus Sicht des Betenden; Salām anatomisch rechts → Mitte → links; **procedural placeholder**, ausdrücklich nicht Originalfigur und nicht fachlich abgenommen.
- **Religiöse Details aus dem bisherigen Masterplan behalten:** Qiyām rechte über linke Hand auf Brusthöhe; gewählte Rafʿ-anlässe einschließlich Aufstehen zur dritten Rakʿah (aber nicht beim Ende von zwei); flacher gerader Rukūʿ-Rücken, beim Suǧūd Stirn und leichte Nase auf der Unterlage, Mund/Kinn frei; Mädchenvarianten separat prüfen.
- **Integration:** aktives Kids-Profil bestimmt die Figur. Der manuelle Jungen-/Mädchenumschalter aus isolierten Laborvorschauen darf **nicht** in die Besucher-App übernommen werden. Für die Erprobung ausschließlich Home-Testzugang, keine Änderung bestehender Tab-/Kapselarchitektur.
- **Regressionssicherheit:** Alle alten Gebetsinhalte, Audio-, Offline-, Kinderprofil- und Layoutentscheidungen bleiben erhalten. Neue Fortschritte werden pro Meilenstein mit konkreten Nachweisen eingetragen, bestehende Freigaben nicht stillschweigend überschrieben.

## Aktuelles echtes Hindernis

Das bereits gefundene Archiv `/Kinder App/Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip` hat Metadaten in der Bibliothek. Der direkte Rohdatenzugriff war ausdrücklich nicht autorisiert. Ohne echte GLB- und PNG-Bytes können wir keine ursprüngliche Jungenidentität beweisen oder mit ihr vollständig realistische Gebetsanimationen abnehmen. Solange diese Grundlage fehlt, dürfen nachgelagerte Meilensteine technisch vorbereitet, **aber nicht als abgeschlossen behauptet** werden.

**Sicherheitslinie:** `main` unverändert; keine Live-Veröffentlichung, keine fremden 3D-Generierungscredits, kein echter Kinder-Lernstand verändert; `productionReady=false`.
