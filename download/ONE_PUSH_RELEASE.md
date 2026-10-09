# DAR AL TAWḤĪD — ein Push, Apple und Android

## So arbeitet das System

1. Alle Erwachsenen-Inhalte und Web-Layouts werden wie bisher **einmal** in die gemeinsame Website eingespielt.
2. Der bestehende **Cloudflare-Besucher-App-Deploy** veröffentlicht sie auf der DAR Website (erst nach Test/Freigabe). Die native iOS- und Android-Smartphone-Hülle öffnet dieselbe Live-App. Dafür ist **keine neue IPA/APK nötig**.
3. `apple-tv/`-Katalogdaten können von der Android-TV-App zur Laufzeit neu geladen werden, sofern deren jeweilige Funktion bereits implementiert ist. Ein Apple-TV-**tvOS-Archiv** ist kein Teil dieses Android-/iOS-Workflows.
4. Bei Änderungen an `android/**` oder `ios/DarAlTawhid/**` startet der neue GitHub-Workflow **„DAR · Ein Push – Apple und Android“** automatisch und baut nur betroffene native Plattformen.
5. Android erstellt Debug-APKs für interne technische Tests, und bei hinterlegten Produktionssignaturen auf `main` zusätzlich installierbare Release-APKs und Play-AABs. Die Android-Kids-Hülle bleibt ein **internes Testpaket**.
6. iOS kompiliert auf einem macOS-Runner für iPhone/iPad. Mit eingerichteten Apple-Distributionszugängen auf `main` erstellt der Workflow zusätzlich eine **signierte IPA als internes Artefakt**, ohne App Store Connect hochzuladen.
7. `/download/` bietet öffentliche Links **nur** für nachweislich signierte, vorhandene und geprüfte Erwachsenen- und Android-TV-APKs. Die Kids-App bleibt in Testphase und ist nicht öffentlich verlinkt.

## Bedienung ohne Android Studio oder Xcode

Im Alltag: Änderungen wie gewohnt am gemeinsamen Web-Code vornehmen und nach Test freigeben. Die installierten Erwachsenen-Apps übernehmen die Web-Änderungen.

Bei nativen Änderungen: Nach dem Push wird der passende Build automatisch erzeugt. Alternativ **GitHub → Actions → „DAR · Ein Push – Apple und Android“ → Run workflow → Android / iOS / Alle**. Das ist ein manueller Ersatzstart, kein lokaler Build auf einem Android-PC.

Öffentliche Dateien werden erst nach technischem Test und expliziter Freigabe über die Website freigeschaltet. Neue Versionen müssen eine höhere Android `versionCode` haben und mit dem **gleichen dauerhaften App-Signaturschlüssel** signiert sein. Android erlaubt kein stilles APK-Update ohne entsprechende Berechtigung/Benutzeraktion; die Installation eines Updates erfolgt über die Bestätigung am Gerät.

## Einmalige geschützte Signierung

Android-Erwachsenen-App (`de.daraltawhid.app`):

- `DAR_ANDROID_UPLOAD_KEYSTORE_BASE64`
- `DAR_ANDROID_UPLOAD_STORE_PASSWORD`
- `DAR_ANDROID_UPLOAD_KEY_ALIAS`
- `DAR_ANDROID_UPLOAD_KEY_PASSWORD`

Android TV (`de.daraltawhid.tv`):

- `DAR_ANDROID_TV_KEYSTORE_BASE64`
- `DAR_ANDROID_TV_STORE_PASSWORD`
- `DAR_ANDROID_TV_KEY_ALIAS`
- `DAR_ANDROID_TV_KEY_PASSWORD`

Kids (`de.daraltawhid.kids`): separater Schlüssel, solange **nur intern**; keine Kids-Website-Veröffentlichung.

Für die iOS-Build-Abhängigkeiten gilt zusätzlich **einmalig** die Repository-Variable `DAR_IOS_ONESIGNAL_SDK_VERSION` (genau die bisher genutzte native OneSignal-iOS-SDK-Version). Der bestehende Xcode-Code verweist auf acht nicht im Git gespeicherte Vendor-XCFrameworks. Die CI lädt diese gezielt von OneSignals offiziellen Releases nach und kontrolliert alle acht gegen die offiziellen SHA-256-Prüfsummen. **Keine unbekannte SDK-Version automatisch einsetzen**: Das könnte das geschützte Push-System verändern. Ohne diese exakte Version darf der iOS-Build nicht fälschlich als erfolgreich gelten.

iOS (`de.daraltawhid.app`, mit eigener Widget- und OneSignal-Extension):

- `DAR_IOS_DISTRIBUTION_CERT_BASE64` (Apple Distribution .p12)
- `DAR_IOS_DISTRIBUTION_CERT_PASSWORD`
- `DAR_ASC_API_PRIVATE_KEY` (Apple App Store Connect .p8)
- `DAR_ASC_API_KEY_ID`
- `DAR_ASC_ISSUER_ID`

Alle Geheimnisse ausschließlich unter GitHub **Settings → Secrets and variables → Actions** speichern, niemals in Git-Dateien oder im Chat veröffentlichen. Die iOS-Builds verwenden die App-Store-Connect-API für automatische Bereitstellungsprofile, sofern der Account dazu berechtigt ist. Das muss auf einem echten signierten CI-Archiv erfolgreich überprüft werden. Bestehende Signaturzertifikate und iOS-App-Extensions behalten ihre getrennten Provisioning-Anforderungen.

**Achtung bei Google Play App Signing:** Wenn Google Play und eigene Website dieselben installierten Apps gegenseitig aktualisieren sollen, muss die App-Signatur auf dem Gerät übereinstimmen. Der **Play-Upload-Key allein** genügt nicht unbedingt, denn Google signiert die APK für Store-Installationen mit dem Play-App-Signing-Key. Vor Freigabe die Zertifikate beider Installationswege abgleichen.

## Offene Freigabeprüfungen

- Echte Release-Signaturschlüssel sicher einrichten und nicht verlieren.
- Signierte Android-APK und Android-TV-APK auf Geräten installieren und Upgrades testen.
- Apple iOS-Archiv und signierte IPA auf CI prüfen; nicht als einfache Website-APK behandeln.
- Die TV-Oberfläche funktional ergänzen und auf realer Fernbedienung testen.
- Signierte APKs für die eigene Website bereitstellen, korrekt in `download/releases.json` eintragen und SHA-256 prüfen.
- Das öffentliche Website-Deploy erst nach ausdrücklicher Live-Freigabe auslösen.

**Schutz:** Keine Änderung an der Push-Logik, keine unbeabsichtigte Besucher-Veröffentlichung, kein öffentliches Kids-Paket.
