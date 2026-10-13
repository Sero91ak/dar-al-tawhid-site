# Prüfprotokoll

## 2026-10-13 · Bestandsaufnahme, kein neuer Primärtext

Geprüft wurde der Repository-Stand, nicht eine neue Handschrift oder eine neu geöffnete Dorar-Seite.

Verglichen:

- `kids/data/academy-year-52weeks-v1.json`: 52 Wochen, 208 Neueinheiten, 90 mit Lektions-ID, 118 ohne ID.
- `kids/research/academy-208-research-ledger-v1.json`: dieselben 208 Slots. Sechs Slots `target-hadith-checked-online` (79, 82, 83, 84, 85, 86). Fünfzig `metadata-in-repository-not-reverified`. Der Rest `not-reviewed`.
- `kids/unterrichtsarchiv.html`: Katalog mit 89 Modulen. Alle 89 geplanten IDs außer `sidq` sind enthalten und haben Fragen für drei Altersgruppen.
- `kids/data/academy-source-bank-researched-v1.json`: sieben Ḥadīṯ-Saatgutdatensätze. Sie sind ausdrücklich nicht auf beliebige Slots übertragbar.
- `node kids/tools/test-academy-208-research-ledger-v1.cjs`: grün, mit der Meldung 90/208 implementiert, 118 geplant, 6 Stichproben, kein Audio.

Widerspruch zur älteren Statuszeile „66 auf main“: dieser Zweig enthält 90 IDs. Main wurde in diesem Lauf nicht neu ausgezählt. Die 66 bleiben eine ältere Beobachtung in `kids/docs/ACADEMY-208-PRODUKTIONSSTATUS.md`, keine neue Zählung.

Nicht gelesen, weil der Abruf scheiterte:

- `https://dorar.net/hadith/sharh/3429` antwortete mit HTTP 403. Damit bleibt SRC-BANK-001 ungeprüft für diesen Lauf.

Prüfung durch: Repository-Inventar in Cursor, 13. Oktober 2026. Keine Gelehrtenfreigabe.
