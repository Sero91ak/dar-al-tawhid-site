# Deutscher Tafsīr-Datensatz

Die App lädt pro Sure optional eine Datei wie `001.json`, `002.json` usw.

**Nur Deutsch** — kein arabischer Tafsīr-, Offenbarungs- oder Hadith-Rohtext in der App.

Schema pro Datei:

```json
{
  "source": "Tafsīr Ibn Kathīr, as-Saʿdī, Ibn ʿAbbās — deutsche Übertragung",
  "updated": "2026-06-09",
  "verses": [
    {
      "id": 1,
      "meaning": "Kurze deutsche Bedeutung dieser Ayah.",
      "tafsir": [
        { "source": "Ibn Kathīr", "text": "Deutscher Tafsīr-Text." },
        { "source": "as-Saʿdī", "text": "Deutscher Tafsīr-Text." },
        { "source": "Ibn ʿAbbās", "text": "Deutscher Tafsīr-Text." }
      ],
      "sabab": "Offenbarungsgrund auf Deutsch, falls authentisch überliefert.",
      "hadiths": [
        {
          "source": "Ṣaḥīḥ al-Bukhārī / Muslim",
          "text": "Hadith zur Ayah in deutscher Übertragung.",
          "grading": "ṣaḥīḥ / ḥasan / geprüft"
        }
      ],
      "place": "Mekka",
      "period": "Makkanische Phase",
      "year": "",
      "words": []
    }
  ]
}
```

## Neu generieren

```bash
node scripts/build-tafsir-de.js 1-114
```

Quellen im Build:
- **Bedeutung:** `content/quran` (Bubenheim & Elyas)
- **Tafsīr:** Ibn Kathīr, as-Saʿdī, Ibn ʿAbbās (deutsch; Curated-Overrides in `scripts/tafsir-curated/`)
- **Offenbarung / Hadithe:** nur geprüfte deutsche Texte aus Curated-Dateien

Vollständige Band-Übersetzungen (z. B. DIDI / Darulkitab) können später eingespielt werden.
