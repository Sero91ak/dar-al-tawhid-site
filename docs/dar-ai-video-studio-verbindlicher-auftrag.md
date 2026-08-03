# Verbindlicher Auftrag – DAR KI-Video-Studio (Staging)

**Branch:** `cursor/video-studio-compact-autonomous-e34c` · PR #441  
**Issue:** #437 · Staging-Kontext #436  
**Kein Merge auf main · keine Live-Veröffentlichung · keine Besucher-Pushs**

## Begriffstrennung

| Ort | Begriff | Bedeutung |
|---|---|---|
| ChatGPT | „Video-Bild erstellen“, „Video-Bildbeitrag erstellen“, „Videobeitrag erstellen“ | Nur das **reine Ausgangsbild** (4K, 9:16, textfrei, logofrei) |
| Admin-App | Button **„Video-Beitrag erstellen“** | Volle Produktion: Text + Bild → 15 s Bewegung → Stimme → Overlays → Branding → MP4 |

## Standardablauf Admin

1. Text manuell einfügen/bearbeiten  
2. Externes Ausgangsbild hochladen oder Bibliothek  
3. „Video-Beitrag erstellen“ (Kostenbestätigung)  
4. 15 s image-to-video (3×5 s)  
5. DAR-Männerstimme exakt  
6. Elegante Texteinblendungen + Quelle + CTA/Social/Credit  
7. Production-Render ohne Fremdwasserzeichen  
8. Vorschau → Download/Teilen  
9. Optional Feed / optional Push – nur manuell und getrennt  

Interne KI-Bildgenerierung = **optional**.

## Darstellungsregeln (verbindlich)

- Propheten: **keine** körperliche Darstellung (auch keine Silhouette/Schattenfigur)  
- Ṣaḥābah/Salaf/Gelehrte: nur anonyme Symbolfiguren, gesichtslos  
- Historisch/zeitlich plausibel, themengebunden  
- Clips ohne eingebrannten Text/Logos  

## Technik

fal · ElevenLabs · Shotstack Production · R2 `dar-video-studio` · Worker `dar-admin-publisher`
