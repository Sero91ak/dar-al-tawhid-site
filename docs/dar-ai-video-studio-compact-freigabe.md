# DAR KI-Video-Studio – kompakter Autonomie-Stand

**Branch:** `cursor/video-studio-compact-autonomous-e34c`  
**Staging zuerst · kein main-Merge · kein Auto-Feed/Push · keine Live-Veröffentlichung**

## Verbindlicher Standardablauf

1. Fertigen Textbeitrag manuell einfügen und bearbeiten  
2. **Externes 4K-/9:16-Ausgangsbild** hochladen oder aus der Medienbibliothek wählen  
3. 15 Sekunden echte Bewegung (3×5 s image-to-video)  
4. DAR-Männerstimme automatisch  
5. Text elegant synchron einblenden  
6. Quelle, Logo, Wasserzeichen, CTA, Social  
7. MP4-Vorschau  
8. Download / Teilen  
9. Feed und Push nur getrennt und manuell  

### Ausgangsbild (extern, z. B. ChatGPT)

Bereits vorausgesetzt: 4K, 9:16, textfrei, logofrei, fotorealistisch, themenbezogen, ohne klar erkennbare Gesichter, ohne Propheten/Ṣaḥābah/Salaf-Darstellung.

**Interne KI-Bildgenerierung bleibt optional** und ist in der UI unter „Optional: KI-Szenenbild“ versteckt.  
**Upload / Bibliothek sind der zentrale Standardweg.**

## Oberfläche

Kompakte 4-Schritte-Produktion in `admin/video-studio.html` / `test/admin-video-studio.html`.

## Backend

- `POST /parse-text`, `/estimate`, `/scene-image/upload` (Standard)  
- `POST /scene-image` nur optional  
- Jobs: `sceneImageUrl` + `costConfirmed:true`  
- fal Wan image-to-video · Shotstack Production ohne Fremdwasserzeichen  

## Freigabe

Vollständig in Staging prüfen. **Nicht auf main mergen, nicht live veröffentlichen.**
