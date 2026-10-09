# DĀR AL TAWḤĪD KIDS – Duʿāʾ-Audio: Abnahme vor Live-Freigabe

Stand: 09.10.2026 · Entwicklungszweig `fix/kids-dua-natural-fusha-audio-20261009` / PR #908.

## Verbindliche Sollqualität

- **Ganz hören:** Die vorhandene flüssige Fuṣḥā-Masteraufnahme bleibt unverändert (1,00×). Keine künstliche Pause zwischen Einzelwörtern.
- **Langsam hören:** Kinderfreundlich ruhig und zusammenhängend; keine flüsternden Bühnenanweisungen, keine hörbare Atemerschöpfung. Bis zur Freigabe neuer nativer Takes: dieselbe gute Gesamtaufnahme mit moderater Pitch-erhaltender Geschwindigkeit (0,86×). Auch die Duʿāʾ-Vorschau verwendet diese Quelle.
- **Wort für Wort:** Originalgetreue isolierte Wortaussprache; keine Zusatzwörter, kein scharfes Zerschneiden eines arabischen Konsonanten, kein Pusten vor oder nach dem Wort. 190 ms natürliche Trennung, sanfte Hüllkurven. Gelber Fokus bleibt auf Arabisch, Lautschrift und Deutsch synchron.

## Datenbestand und technische Prüfung

120 Duʿāʾs, 1.366 Wortpositionen, 696 unterschiedliche arabische Einzelwortaufnahmen. In den **bestehenden** Manifesten: 120 normale, 120 separate langsame Gesamtaufnahmen, 696 Einzelwörter. Das technisch erfolgreiche CI-Prüfskript ist `scripts/kids-dua-audio-playback-guard.js`.

Die längere Laufzeit vieler Einzelwörter und hörbare Atemeffekte in Nutzeraufnahmen sind **kein** Beweis dafür, dass alle 696 Dateien fehlerhaft sind. Zeitdauer, RMS und automatisches Schweigetrimmen können die menschliche Hörprüfung nicht ersetzen.

## Nächster verantwortlicher Audio-Schritt (ohne ungeplanten Credit-Verbrauch)

1. Zunächst folgende 10 vorhandene Originalclips **einzeln anhören und notieren**: `رَبِّ`, `زِدْنِي`, `عِلْمًا`, `لَا`, `مَنْ`, `هُوَ`, `وَأَنْتَ`, `الْحَمْدُ`, `أَعُوذُ`, `اللَّهُمَّ`. Kurze und lange Wörter sowie Hamzah/ʿAyn/Hāʾ/Ḥāʾ, Madd und Shaddah anhand tatsächlich vorhandener Texte gesondert bewerten.
2. Nur beanstandete Wörter als **kleine ElevenLabs-V4-Fuṣḥā-Probe** neu rendern: exakt vokalisiertes Arabisch; keine Regie-Tags wie `[slowly]`, keine automatisch angehängten Punkte; keine System-TTS. Masterstimme beibehalten.
3. Die Probe auf iPhone/iPad sowie Android gegen bisherige Aufnahme anhören. Prüfen: Anlaut, Auslaut, Madd, Shaddah, kurze Vokale, Lautreinheit und natürliche Pausen. Menschliches A/B-Votum protokollieren.
4. Separate langsame Gesamtaufnahme nur dann freigeben, wenn das **konkrete** Manifest-Entry `audioListeningApproved: true` und `qaApproval: "human-reviewed-natural-fusha"` nach echter Hörprüfung erhalten hat. Neue generierte Entries beginnen absichtlich mit `false`/pending.
5. Erst nach erfolgreichem Stichprobentest über weitere Wörter und 120 Duʿāʾs rollen, anschließend Geräte-QA, GitHub-Prüfungen, Cloudflare-Deploy und Live-Kontrolle. Keine automatische Massen-Neugenerierung auf bloße Code-Pushes.

## Release-Zustand

**NICHT LIVE / NICHT VOLLSTÄNDIG ABGENOMMEN.** PR #908 bleibt bis zum Hörtest und zur Prüfung der allgemeinen CI-Blocker als Entwurf bestehen. Bloße Automatik-QA ist keine sprachwissenschaftliche Freigabe.
