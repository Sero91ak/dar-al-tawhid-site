# DĀR AL TAWḤĪD – iOS-Bewertungsseite

## Freigegebenes Design
- `ios-review/approved-night-courtyard.webp`: das tatsächliche, in der Unterhaltung freigegebene fotorealistische Nacht-Moscheehofmotiv (nicht die frühere SVG-Nachzeichnung); Quellversion mit Salām, Text, Goldbutton und Abschiedsgruß.
- `ios-review/index.html`: responsives bildschirmfüllendes Artwork mit **echten transparenten Linkflächen** an den sichtbaren Positionen von „Im App Store bewerten“ und „Zurück zu Mehr“. Die mit dem Bild mitgelieferte Navigationsleiste wurde abgeschnitten und als echte HTML-Navigation nachgebildet. Es gibt keine opake Deckfläche über dem Bild.
- `assets/dar-more-final-v15.js`: Einstieg „App bewerten“ in „Mehr“ nur, wenn `window.DAR_OFFICIAL_IOS_APP===true`.
- App Store bestätigt: `https://apps.apple.com/de/app/id6805988753?action=write-review`.
- Die fünf Sterne sind **rein illustrativ**; Sterneauswahl, Text und Absenden erfolgen ausschließlich bei Apple. Ein Linkklick ist keine bestätigte Bewertung.
- Eingebettete Bildtypografie erhält exakt das freigegebene Erscheinungsbild. Bei späterer Neugestaltung sollten die Texte als echte dynamische HTML-Texte aus einer separaten Hintergrundaufnahme umgesetzt werden, ohne das Originalmotiv mit Dubletten zu überlagern.

## Noch NICHT implementierte automatische Erinnerung
Die eigene bildschirmfüllende HTML-Seite darf **nicht** automatisch als Bewertungspopup ausgelöst werden. Für automatische Anfragen ist ausschließlich Apples native StoreKit-Oberfläche vorgesehen.

Vorgesehene Voraussetzungen:
1. Mindestens sieben Tage seit erster erfolgreicher App-Nutzung.
2. Mindestens fünf sinnvolle Sitzungen mit jeweils mindestens zwei Minuten aktiver Nutzung und 30 Minuten Abstand zwischen gezählten Sitzungen.
3. Mindestens ein nachweislich abgeschlossener Lern- oder Lesevorgang.
4. Kein aktiver Lese-, Audio-, Download- oder Formularvorgang; App im Vordergrund, passender ruhiger Zeitpunkt.
5. Maximal ein Anfrageversuch je App-Version und mindestens 180 Tage Abstand zum vorigen Versuch.
6. Keine Benachrichtigung/Push und keine automatische eigene HTML-Aufforderung.
7. StoreKit entscheidet selbst, ob die Systemabfrage tatsächlich angezeigt wird. Rückschluss auf tatsächlich vergebene Bewertung ist nicht möglich.

Die nativen Integrationsstellen (`DarAlTawhidApp.swift`, `WebAppView.swift`) sind durch `content/admin/push-lanes-lock.json` geschützt. Ohne korrekte Spur-/Globalfreigabe dürfen sie auch für diese Funktion nicht geändert werden.

## Test- und Veröffentlichungspfad
- Der PR ist ein **Entwurf**; es gibt noch keinen Merge, keinen Live-Deploy und kein veröffentlichtes iOS-Build.
- iPhone SE/klein, iPhone Pro Max und iPad testen; Linkklick und Zurück-Navigation prüfen.
- Bei Änderungen an Live-Web-Assets zuvor App-Health-, Canonical-State- und Scope-Guards prüfen.
- Kinder-App, Android, Apple TV, OneSignal/Push und native Swift-Dateien bleiben unberührt.
