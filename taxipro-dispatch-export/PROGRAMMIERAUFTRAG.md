# Programmierauftrag: Komplette Umstellung der Taxi-App

> Serienfahrten · Monatslisten · Krankenfahrten · Rechnungsfahrten · Unterschriftszettel

## Ziel

Die Taxi-App wird von Einzelfahrten auf ein professionelles Serienfahrten-System umgestellt:

**Kunde → Serienauftrag → automatische Monatsfahrten → Kontrolle → Freigabe → Unterschriftszettel**

## Kernprinzip

Automatisch erzeugte Daten werden **zuerst in einer Prüfliste** angezeigt. Erst nach **Freigeben** gelangen sie in die Monats-Auftragsliste.

## Hauptmodule

1. Dashboard
2. Kundenstamm
3. Serienfahrten
4. Krankenfahrten
5. Rechnungsfahrten
6. Listenimport
7. Prüfliste
8. Monats-Auftragsliste
9. Unterschriftszettel
10. Export/Druck
11. Einstellungen
12. Vorlagenverwaltung

## Mindestversion (MVP)

1. Kundenstamm mit Kilometer (KTS) und Preis (RE)
2. Serienauftrag erstellen
3. Automatische Tageserzeugung mit Hin-/Rückfahrt
4. Prüfliste vor Freigabe
5. Monats-Auftragsliste
6. Detailansicht pro Kunde/Monat
7. Unterschriftszettel PDF (getrennt KTS/RE)
8. Warnsystem bei fehlenden Daten

## Berechnungen

**Krankenfahrt:** Fahrtage × (Hin + Rück) × km einfach = Gesamtkilometer

**Rechnungsfahrt:** Fahrtage × (Hin + Rück) × Preis einfach = Gesamtpreis

## Datenmodell

- `customers` – Kundenstamm
- `recurring_orders` – Serienaufträge
- `monthly_trips` – erzeugte Tagesfahrten
- `monthly_summaries` – Monatsübersicht pro Kunde
- `templates` – Vorlagen KTS/RE
- `audit_logs` – Änderungsprotokoll

## Farben

| Farbe | Bedeutung |
|-------|-----------|
| Rot | Krankenfahrt/KTS |
| Gelb | Rechnungsfahrt |
| Blau | Serienfahrt |
| Grün | geprüft/erledigt |
| Orange | offene Prüfung |
| Grau | storniert |

## Später (nicht MVP)

Google Contacts, Maps-Kilometer, WhatsApp, Fahrer-App, OCR, DATEV

---

Vollständiger Auftrag: siehe Issue / Projektbeschreibung vom Auftraggeber.
