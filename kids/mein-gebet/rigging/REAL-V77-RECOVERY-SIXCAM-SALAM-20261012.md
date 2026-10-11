# KIDS Mein Gebet: echte V7.7-Kamerawinkel und Salām-GLB (intern, 12.10.2026)

**Quelle:** Ursprüngliches `Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip` nach Google Drive kopiert; die SHA-256-fixierte Original-GLB wurde wirklich geöffnet, nicht aus Platzhalterdaten rekonstruiert.

| Gegenstand | Binär-/Prüfbeleg | Entscheidung |
|---|---|---|
| Original-Jungen-V7.7-GLB | `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa` · 4.382.224 Bytes · 19 Gelenke, Qiyam/Takbir | Byte-Identität bestätigt, Optik **nicht** freigegeben |
| Sechs echte Kamerarender | Vorne 0°, rechts 45°, rechts 90°, hinten 180°, **links 270°**, links 315° | Aus tatsächlichem bestehenden GLB-Mesh, keine 2D-Spiegelung. Die unabhängige linke genehmigte Original-2D-Ansicht fehlt nach wie vor |
| Technischer Salām-Derivat-GLB | `b703087b31b2feffc25732594bf9af621af0dacade3e6b374ca0904fae97530f` · 4.382.888 Bytes | Nur `Head.rotation` sechs Keyframes; Original-Mesh, alte Qiyam-/Takbir-Clips und Skin-Metadaten unverändert. **Nur Forschungsentwurf.** |
| CPU-Skinning-Nachweis | 50.150/60.996 Vertices mit Head-Gewichtung; 0 m gemessene Verschiebung bei Vertices ohne Head-Gewichtung | Tatsächlich drehender Kopf wurde aus echter BIN/Skin/IBM-Geometrie gerendert, kein CSS-Puppen-Effekt |
| Modellvergleich | Originale Kinderbilder weiterhin fest gepinnt | Haar/Kufi, Gesicht, starre Ärmel und Proportionen weichen ab: **kein Originalitätsnachweis** |

**Google-Drive-Sicherung (19 Dateien):**
[Versionierter Arbeitsordner](https://drive.google.com/drive/folders/1BefdRLrrnmdk8LGsQIFiBx7mS5SV0jyw) unter
[Gebetsprojekt](https://drive.google.com/drive/folders/1EYqdSQ4e0ueoKhIQyY0ZxeAG6MYUQ4AM).
Dort liegen neue GLB, sechs Einzelkameras, zwei Kontrollbögen, drei Schlüsselframes, Python-Quellcode und getrennte JSON-Prüfberichte. Quellen ZIP und Originalbilder verbleiben in ihren eigenen, unveränderten Backup-Verzeichnissen.

## Unbedingt weiter offen

- Die neue Kopfdrehung beginnt an einem **stehenden** V7.7-Grundmodell. Es gibt noch keinen final sitzenden Tašahhud und keinen realen Übergang aus dem Sitzen.
- Noch kein Original-Mädchen-GLB; keine fertig animierten Rakʿāt, Rukūʿ, Suǧūd oder richtige Berührungspunkte, keine vollständige fachliche Quellen-/Fiqh-Abnahme.
- Blickrichtung aus eigener Anatomie visuell zu kontrollieren; der numerische Clip ist keine pädagogische Freigabe.
- 0 von 12 Meilensteinen genehmigt, `productionReady=false`, `mergeMain=false`, `liveDeploy=false`.
- Der Test-/Entwicklungszweig speichert nur Audit-/Statusdaten, keine privaten 4.4-MB-Original- oder abgeleiteten GLBs. Eine bloße Kopie auf Google Drive bedeutet **keinen** Live-Push.

**Nächster Modellschritt:** tatsächliche Gesicht/Haar/Kufi/Ärmel-Originaltreue herstellen; danach die Rigging- und Sitz-/Boden-Kontaktstufen unabhängig prüfen. Keine Ersatzfiguren als Original deklarieren.
