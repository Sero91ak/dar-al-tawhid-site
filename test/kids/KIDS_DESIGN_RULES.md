# DĀR AL TAWḤĪD Kids — verbindliche Visual- und Icon-Regeln

Status: **verbindlich für jede künftige Änderung an DĀR AL TAWḤĪD Kids**.

## Keine System-Emojis
- In der Kinder-App werden **keine Unicode-/OS-Emojis als Icons oder Illustrationen** verwendet.
- Das gilt für HTML, JavaScript, JSON-Inhalte, Navigation, Karten, Quiz, Duʿāʾ, Qurʾān, Geschichten, Modals und neue Bereiche.
- Inhalte speichern nur semantische Asset-Namen wie `book`, `moon`, `food`, `mosque`, `home`, `spark`.

## Neue Funktionen brauchen passende echte Assets
- Wenn eine neue Seite, Karte, Aktion oder Inhaltsart ein Symbol benötigt, wird **gleichzeitig ein passendes realistisches, kinderfreundliches Asset erzeugt und eingecheckt**.
- Bevorzugt: transparente PNG/WebP-Icons in `test/kids/assets/kids-icons/`.
- Hintergründe/Illustrationen liegen in `test/kids/assets/kids-art/`.
- Keine temporären Emoji-Platzhalter.

## Bildqualität und Seitenverhältnis
- Neue Hintergrund-Master mindestens **2048 px an der langen Kante**, nach Möglichkeit 4K-/High-Res-Master.
- Ein Motiv wird **nicht auf 100% × 100% verzerrt**.
- Für stark abweichende Kartenformate wird ein eigenes Motiv im passenden Seitenverhältnis erzeugt.
- Wichtige Motive bleiben in einer sicheren Fokuszone, damit Phone, iPad und Split View funktionieren.

## Einbettung
- Bilder wirken edge-to-edge und als Teil der Oberfläche, nicht wie aufgeklebt.
- Keine sichtbaren Trennlinien, leeren Farbbänder, abgeschnittenen Moscheen, gestauchten Motive oder harten Übergänge.
- Textzonen werden mit weichen Farb-/Lichtverläufen geschützt; das Motiv selbst bleibt proportional.

## Gestaltung
- Stil: hochwertig, ruhig, realistisch-illustriert, kinderfreundlich, islamisch, DĀR-AL-TAWḤĪD-Kids-Farbwelt.
- Keine Personen/Gesichter in generierten Dekorationsbildern, sofern nicht ausdrücklich freigegeben.
- Qurʾān-Text bleibt echter UI-Text; KI-Bilder dürfen keinen vermeintlichen Qurʾān-Text als Dekoration erzeugen.

## Pflichtprüfung vor Live-Deploy
- Smartphone schmal/normal/groß.
- iPad/Tablet und Split View.
- Navigation, Karten, Modals und Scrollabstände.
- Keine Emoji-Glyphen.
- Kein leerer Icon-Platzhalter.
- Kein Stretching/Cropping eines wichtigen Motivs.
- Neue Assets und Code werden gemeinsam committed.

Der CI-Guard `scripts/kids-design-system-guard.js` verhindert Emoji-Rückfälle und alte Sprite-Referenzen.
