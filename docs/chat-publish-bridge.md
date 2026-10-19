# Chat-Veröffentlichung – Einrichtung

Diese Branch vorbereitet eine sichere Weiterleitung von ChatGPT an den vorhandenen Admin-Publisher.

- Nur der Erwachsenen-Besucherfeed: iOS (nativ und Web), Android-PWA, Webseite/Desktop.
- Kids, Apple TV und Dar Test sind ausdrücklich ausgeschlossen.
- Live-Veröffentlichung und Beitrags-Push nur nach ausdrücklicher Freigabe.
- Bestehende Quellen-, Index- und Push-Regeln unverändert.
- Keine Zugangsdaten in GitHub-Dateien speichern.

## Verbindlicher Veröffentlichungsinhalt

- Ein Chat-Prüfentwurf enthält genau vier Hashtags direkt unter dem Titel. Beim Veröffentlichen werden alle Hashtags aus der Aussage entfernt und `tags: []` erzwungen; sie sind niemals Teil des veröffentlichten Fließtexts.
- Auf den Besucheroberflächen werden **Titel**, **Sprecher**, **Aussage**, **Fazit** und **Quelle mit geprüftem `/q/N/`-Nachweis** als getrennte Bereiche dargestellt. Die Aussagefläche enthält ausschließlich das Zitat. Der Fazit-Absatz `🌙 Fazit:` wird vor der Anzeige aus dem Zitat herausgelöst.
- Keine Social-Media-Hashtags, Telegram-/Instagram-/Webseiten-Fußzeilen, arabischen Originalpassagen oder Werbeaufrufe im veröffentlichten Beitrag. Mathematische Schmuckalphabet-Zeichen im Zitat/Fazit werden beim Erstellen normalisiert, damit Umlaute (z. B. „Lebensführung“) einheitlich lesbar bleiben.
- Bei `Erzeuge Quellenlink` werden zunächst die überprüften `/q/<nummer>`-Quellenseiten samt Registry angelegt. Dieser Auftrag veröffentlicht noch keinen Beitrag und sendet keinen Push.
- Die Linknummerierung, Quellenprüfung, Einzel-/Slide-Logik, der bestehende DAR Admin-Publisher und die Besucher-Push-Regeln bleiben verbindlich.
- Kids, Apple TV und Dar Test erhalten über diese Verbindung weder neue Inhalte noch Änderungen.
