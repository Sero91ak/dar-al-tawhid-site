# DĀR AL TAWḤĪD – nicht veröffentlichte Tagesredaktion

Dieser GitHub-Branch ist **kein** Veröffentlichungs- oder Push-Kanal. Er enthält ausschließlich datierte redaktionelle Entwürfe für den bestehenden Erwachsenen-Beitragsauftrag um 18:00 Uhr Europe/Berlin.

Wichtig: Das Repository ist öffentlich. Dieser Branch ist zwar nicht auf der Website ausgerollt, aber kein privater Geheimnisspeicher. Niemals GitHub-Tokens, OneSignal-Keys, Passwörter, persönliche Daten oder ungeschützte Entwürfe mit Geheimnissen speichern.

## Ablauf

1. Die DĀR AL TAWḤĪD Zentrale prüft ab 16:00 Uhr zuerst den neuesten `main`-Stand, bereits veröffentlichte Beiträge und Quellenregister.
2. Pro Berliner Datum höchstens eine Datei `editorial/drafts/YYYY-MM-DD.json` anlegen. Ein bereits vorhandener geprüfter Tagesentwurf wird nicht überschrieben.
3. Der Entwurf enthält den deutschen Beitrag, die arabische Primärstelle **nur für die Quellenkarte**, die expliziten Primärlinks/Fragmentmarker, Bibliographie, Originalwortlaut, Zuschreibungs-/Authentizitätsnachweis, Dublettenbefund, die geplanten Q-Seiteninhalte und die gemessene Basis-SHA von `main`.
4. Der 18-Uhr-Veröffentlicher muss sämtliche Inhalte und die nächste freie Q-Nummer erneut **gegen aktuellen main** prüfen; ein Entwurf ist nie selbst eine Freigabe für einen GitHub-Commit auf `main`.
5. Vor einer erfolgreichen Quellenprüfung oder bei geschützten OneSignal-Sperren erfolgt **kein Release und kein Push**. PR #1075 enthält den Offline-Gate-Test des Systems.

## Zustandsbegriffe

- `draft` = ungeprüfter Entwurf; nie veröffentlichen.
- `source-reviewed` = Quellen und Zuschreibung redaktionell geprüft; weitere technische Gates bleiben offen.
- `blocked` = inhaltliches oder technisches Problem; keine Veröffentlichung.
- `released` darf erst nach geprüftem Live-Deploy und OneSignal-Nachweis dokumentiert werden.

Eine bloße JSON-Angabe `source-reviewed` ersetzt niemals den überprüfbaren Primärnachweis. Das Vorhandensein dieses Verzeichnisses ist **kein** End-to-End-Test.
