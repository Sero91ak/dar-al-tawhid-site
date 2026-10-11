# Korrektur: Bereits vorhandene Figuren-Ansichten und Gebetsposen (11.10.2026)

**Verbindliche Korrektur früherer falscher Assistentenaussagen.** Keine Dateien durch Ersatzfiguren überschreiben.

## In der jetzigen Nachricht wiedergefunden, tatsächlich angezeigt

Der Nutzer hat zehn originale Avatar-Ansichtsbilder bereitgestellt: **5× Mädchen** (zwei Dreiviertelansichten, rechte Seite, hinten, vorn) und **5× Junge** (zwei Dreiviertelansichten, hinten, vorn, Seite). Alle 10 wurden als echte **1254×1254-Pixel-Bilddateien** lokal eingelesen. Mit diesen Quellen war die Aussage, für das Mädchen seien keine Seiten-/Rückansichten vorhanden, **falsch**. Diese Bilder sind Referenz-Renderings, noch kein nachgewiesenes animierbares GLB und nicht die einzelnen Gebetsposen.

| Figur | Ansicht (in diesem Upload) | Originaldatei | SHA-256 |
|---|---|---|---|
| Mädchen | 3/4 | `6818EF58-ED92-4BAB-9EAC-D93986052719(1).jpeg` | `bd6691ae29efd0932a94119d7cdb892bb3bf91f2b8ca6e66b9a3062976e9fa89` |
| Mädchen | 3/4 | `786D18AD-4FDF-497F-84D9-5A0FBC2F66A6(1).jpeg` | `fab7a97457566c972d53525b06c85a9fec99f4ba8f943bfa58183917724ea115` |
| Mädchen | Seitenprofil | `868DF01B-C4C8-4B04-9AA8-233983E5AD0D(1).png` | `e4895261ce9917ca889c580b72a529137b0150e4a7c36cd7820c482fb9211dc7` |
| Mädchen | hinten | `0642C85F-798E-4675-8CA9-655DBCA3CEFC(1).jpeg` | `5e0778a8397b8a2c868134e4c15c7b16953ba19ab3aa60cc8a84ea0ac5ca8d0e` |
| Mädchen | vorn | `60CD26FA-87ED-4ADE-9529-ED9DBA317B2E.jpeg` | `8d4c25c0be2781224ab447bed3fe88a03f3a65a87be269379c706b1362df1a2d` |
| Junge | 3/4 | `F79FD061-19F6-4014-9AA0-467AE264AA1B(1).png` | `4078f510b9589921d7fc1a090cc332f9299ed6f65522efb88c6da28afc3fd063` |
| Junge | hinten | `792B4279-9017-490D-967F-7B178E0DEFD1(1).png` | `0c5043be127edfa13349bbde9009efa0ce752a8f54b88d3ccf51388d901f5d1d` |
| Junge | vorn | `E5E90127-3E31-4B51-9EB4-A60618B3EF03(1).jpeg` | `0c7b73601cb1bcd86d262bb114e9933a214e360b1dbed2f6f2c2c1c765d0e4cf` |
| Junge | 3/4 | `D49F1F8A-6665-43AB-8BB9-416C68A5A5CF(1).png` | `752addf3d60c659b215fa1cadab941d661003050bf5571a8d7b2804520bedbb1` |
| Junge | Seitenprofil | `3FA95B72-92C4-4B43-9225-5AEC18E9F5C8(1).png` | `e56edc83447be88ef174eeea291ebcb7183f86d35682d0f8ad50b13aba18692f` |

These are conversation uploads, **not committed binary assets in the repository**. Do not claim a GitHub copy or approval without an explicit source materialization and validation.

## Bereits in GitHub auffindbare Gebets-Referenzbilder

- `kids/mein-gebet/assets/gebetspositionen-sieben-schritte-user-approved-review.jpg`: **sieben dargestellte Bewegungs-/Gebetsstellungen als Bildtafel**, nicht sieben separate animierbare 3D-Clips.
- `kids/mein-gebet/assets/qiyam-brusthoehe-user-approved-ref-v1.jpg`: verifizierte Referenz zum Halten der Hände auf Brusthöhe.
- `kids/mein-gebet/assets/takbir-raf-yadayn-candidate-v1.jpg`: ausdrücklich nur Kandidatenreferenz.
- `kids/mein-gebet/assets/figur-junge-original.png` und `figur-maedchen-original.png`: originale Standfiguren.

**Offen:** Nutzer berichtet, dass jede Stellung bereits in weiteren früheren Chats generiert wurde. Einzeldateien aller gebetsspezifischen Posendarstellungen sind im aktuell geprüften GitHub-Draft-Tree **nicht vollständig auffindbar**; diese Aussage ist **kein** Beweis, dass es sie in früheren Chats nicht gibt. Diese alten Bildbeiträge müssen weiterhin gezielt wiedergefunden und mit den übergebenen Originalansichten abgeglichen werden.

## Früherer Assistentenfehler / gebotene Abhilfe

1. Mehrere unähnliche prozedurale HTML-3D-Platzhalter V7.9–V8.1 erstellt, obwohl die festgelegten Figuren/Posen existierten; keine dieser Figuren als Original verwerten.
2. Originale 2D-Posebilder und vorhandene Referenzen wurden mit dem Status einer **riggbaren GLB-Animationsdatei** vermischt. Umgekehrt wurden bereits erstellte Bildposen ungerechtfertigt als nicht vorhanden abgetan.
3. Die Aussage 'für das Mädchen fehlen Seiten-/Rückansichten' ist anhand obiger fünf Dateien korrigiert.
4. Keine automatische 100%-Ähnlichkeitsbehauptung aus SHA-Checks/Einzelansichten; nötige echte GLB-Skin-Daten bleiben weiterhin unbestätigt.
5. HTML-/Sandbox-Links auf dem iPhone waren nicht zuverlässig erreichbar; künftig für Nutzer Bilder direkt anzeigen und interaktive **erreichbare HTTPS-Testansichten** unabhängig prüfen.
6. Alle Posen zu **Junge und Mädchen**, die tatsächlich gefunden werden, als Referenzarchiv einordnen, nicht neu generieren oder stillschweigend überschreiben; Kontaktpunkte/Fiqh gegen die Quelle pro Haltung prüfen. Die Suǧūd-Bildunterschrift 'nur die Stirn' ist **kein** fertiger Lehrtext; Nasenkontakt und weitere Auflagepunkte gesondert prüfen.

**Projektstatus unverändert:** Wiederhergestellte V4-Geometrie nicht originalgetreu, V7.7-Binärdaten noch nicht verfügbar, noch keine freigegebenen kompletten 3D-Animationsclips für beide Figuren; `productionReady=false` und kein Merge in `main`.
