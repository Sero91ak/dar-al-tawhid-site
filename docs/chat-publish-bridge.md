# Chat-Veröffentlichung – Einrichtung

Diese Branch vorbereitet eine sichere Weiterleitung von ChatGPT an den vorhandenen Admin-Publisher.

- Nur der Erwachsenen-Besucherfeed: iOS (nativ und Web), Android-PWA, Webseite/Desktop.
- Kids, Apple TV und Dar Test sind ausdrücklich ausgeschlossen.
- **DĀR-Admin-Push / „Push live“ = nur Inhaltsveröffentlichung bzw. Aktualisierung in der Besucher-App/Website.** Keine OneSignal-Gerätebenachrichtigung durch dieses Kommando.
- Quellen- und Indexregeln bleiben verbindlich. Gerätebenachrichtigungen sind ein strikt getrennter Vorgang und benötigen einen **separaten eindeutigen Versandauftrag** mit freigegebenem Text und Empfängergruppe.
- Keine Zugangsdaten in GitHub-Dateien speichern.

## Verbindlicher Veröffentlichungsinhalt

- Ein Chat-Prüfentwurf enthält genau vier Hashtags direkt unter dem Titel: **immer `#DarAlTawhid` zuerst**, dann **einen Sprecher-/Überlieferer-Hashtag** und **zwei Themen-Hashtags** (mindestens einer muss die bestehende Telegram-Kategorie treffend routen, siehe `AGENTS.md`, Abschnitt „Telegram-Kategorien und Hashtag-Routing“). Beim Veröffentlichen werden alle Hashtags aus der Aussage entfernt und `tags: []` erzwungen; sie sind niemals Teil des veröffentlichten Fließtexts.
- Telegram-Kategorien bleiben die neun bereits bestehenden: ʿAqīdah & Tawḥīd; Takfīr/Kufr/Nawāqiḍ; Qurʾān/Tafsīr; Ḥadīṯ/Āṯār; Salaf/Ahl al-Ḥadīṯ; Fiqh/Uṣūl al-Fiqh; Sīrah/Geschichte; Widerlegungen; Manhaǧ/Adab. Beispiel Ibn Sīrīn (nur für diese Aussage): `#DarAlTawhid #IbnSirin #Adab #Wissen`, Routing **Manhaǧ & Adab**.
- Auf den Besucheroberflächen werden **Titel**, **Sprecher**, **Aussage**, **Fazit** und **Quelle mit geprüftem `/q/N/`-Nachweis** als getrennte Bereiche dargestellt. Die Aussagefläche enthält ausschließlich das Zitat. Der Fazit-Absatz `🌙 Fazit:` wird vor der Anzeige aus dem Zitat herausgelöst.
- Keine Social-Media-Hashtags, Telegram-/Instagram-/Webseiten-Fußzeilen, arabischen Originalpassagen oder Werbeaufrufe im veröffentlichten Beitrag. Mathematische Schmuckalphabet-Zeichen im Zitat/Fazit werden beim Erstellen normalisiert, damit Umlaute (z. B. „Lebensführung“) einheitlich lesbar bleiben.
- **Quellenlink-Schreibweise für Chat/WhatsApp/Telegram (19.10.2026):** sichtbare und kopierbare Kurzform immer `dar-al-tawhid.de/q/<nummer>/` **ohne `https://`, mit abschließendem `/`**, als reine URL in eigener Zeile, z. B. `dar-al-tawhid.de/q/46/`. Keine Linkbeschriftung statt der URL, keine Emojis/unsichtbaren Unicode-Zeichen als Teil des zu kopierenden Links. **Technische Linkziele** in HTML/Markdown, Routing und Metadaten bleiben `https://dar-al-tawhid.de/q/<nummer>/` und klickbar. Der Originalquellen-Nachweis zur Kontrolle bleibt gesondert erhalten.
- Bei `Erzeuge Quellenlink` werden zunächst die überprüften `/q/<nummer>`-Quellenseiten samt Registry angelegt. Dieser Auftrag veröffentlicht noch keinen Beitrag und sendet keine Gerätebenachrichtigung.
- **Wenn ein bestehender Beitrag korrigiert wurde:** denselben Post aktualisieren, Index und App-Deploy synchronisieren, tatsächliche Besucheransicht prüfen; **keine Gerätebenachrichtigung**. Eine gesonderte Berichtigungsnachricht darf erst nach einer ausdrücklichen Nachricht-versenden-Anweisung mit festgelegtem Wortlaut und Empfängern verschickt werden.
- Die Linknummerierung, Quellenprüfung, Einzel-/Slide-Logik und der bestehende DAR-Admin-Publisher bleiben verbindlich.
- Kids, Apple TV und Dar Test erhalten über diese Verbindung weder neue Inhalte noch Änderungen.
