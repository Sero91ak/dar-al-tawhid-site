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

Wenn ein Feld noch nicht zuverlässig belegt ist, bleibt es leer. Die App erfindet keine Offenbarungsgründe oder Jahresangaben.
