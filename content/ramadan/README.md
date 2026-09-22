# DĀR AL TAWḤĪD · Ramaḍān-Serie

Dieser Ordner ist die zentrale Inhaltsquelle für die geplante Ramaḍān-Serie in iOS und tvOS.

## Sicherheitsprinzip

- `staging.json` ist ausschließlich für Aufbau und Tests.
- Religiöse Inhalte dürfen erst den Status `verified` erhalten, wenn Aussage, Zuschreibung und Fundstelle geprüft sind.
- Für Produktion verlangt der Validator pro Tag Nachweise der Typen `quran`, `sunnah` und `salaf`.
- Sichtbare Fremd-URLs werden nicht in der Serie gespeichert. Veröffentlichte Nachweise verwenden interne DAR-AL-TAWḤĪD-Kurzlinks.
- `actualDays` bleibt bis zur bestätigten Länge des Ramaḍān `null` und wird danach auf 29 oder 30 gesetzt.
- Das Startdatum wird nicht geschätzt. Produktion beginnt erst nach manueller Bestätigung.

## Testablauf

1. `testMode.enabled = true`
2. `overrideDay` von 1 bis 30 schalten.
3. iOS, Widget und tvOS müssen denselben Tag anzeigen.
4. Nach Tag 30 Abschlusszustand prüfen.
5. Danach Testmodus deaktivieren und den Datumsmodus mit einem kontrollierten Testdatum prüfen.

Validierung:

```bash
npm run test:ramadan
```
