# Deutscher Tafsīr-Datensatz

Die App lädt pro Sure optional eine Datei wie `001.json`, `002.json` usw.

Schema pro Datei:

```json
{
  "source": "Tafsīr Ibn Kathīr, arabische Quelle; deutsche Übertragung",
  "updated": "2026-06-09",
  "verses": [
    {
      "id": 1,
      "meaning": "Kurze deutsche Bedeutung dieser Ayah.",
      "tafsir": [
        {
          "source": "Ibn Kathīr",
          "text": "Deutscher Tafsīr-Text."
        }
      ],
      "sabab": "Offenbarungsgrund, falls authentisch überliefert.",
      "hadiths": [
        {
          "source": "Ṣaḥīḥ al-Bukhārī / Muslim / Sunan usw.",
          "text": "Hadith oder Athar zur Ayah in deutscher Übertragung.",
          "grading": "ṣaḥīḥ / ḥasan / geprüft",
          "url": "https://..."
        }
      ],
      "place": "Mekka",
      "period": "Makkanische Phase",
      "year": "",
      "words": [
        {
          "term": "Tawḥīd",
          "text": "Kurze deutsche Erklärung des Begriffs."
        }
      ]
    }
  ]
}
```

Wenn ein Feld noch nicht zuverlässig belegt ist, bleibt es leer. Die App erfindet keine Offenbarungsgründe, Hadithe, Bewertungen oder Jahresangaben.

## Neu generieren

```bash
node scripts/build-tafsir-data.js
```

Quellen im Build:
- **Bedeutung:** `content/quran` (Bubenheim & Elyas)
- **Tafsīr:** Ibn Kathīr (arabisch, spa5k/tafsir_api)
- **Offenbarung / Hadithe:** Asbāb al-Nuzūl (arabisch, mostafaahmed97/asbab-al-nuzul-dataset)

Deutsche Übersetzungen für Tafsīr und Offenbarungsgründe werden später ergänzt, sobald geprüft.
