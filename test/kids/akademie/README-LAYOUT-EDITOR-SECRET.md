# Layout-Editor: eigenes Passwort

Geschützter Editor: `https://dar-al-tawhid.de/test/academy/startseiten-editor.html`

## Cloudflare-Konfiguration

Der Dar-Test-Worker unterstützt den **verschlüsselten Worker-Secret**-Namen
`DAR_LAYOUT_EDITOR_PASSWORD`. Dieser Wert hat Vorrang vor dem bestehenden
`PREVIEW_GATE_PASS`. Der bestehende Test-App-Zugang und die Kids-Akademie
werden dadurch nicht geändert.

- Im Cloudflare-Dashboard den tatsächlich eingesetzten **Dar-Test-Worker** öffnen.
- **Settings → Variables and Secrets → Add** wählen.
- Den Namen `DAR_LAYOUT_EDITOR_PASSWORD` angeben, Typ **Secret** auswählen.
- Den gewünschten Wert direkt in Cloudflare eingeben und bereitstellen.
- Den Editor in einer privaten Safari-Ansicht neu öffnen und die Anmeldung testen.

**Wichtig:** Keine Passwörter in `.toml`, GitHub, JSON, HTML, CSS, JavaScript,
Logs oder Dokumentation eintragen. Falls der neue Secret-Wert noch nicht
gesetzt ist, funktioniert vorläufig weiterhin das bestehende Test-Zugangspasswort.

Die separate, signierte Editor-Sitzung ist auf die geschützten Editor-Dateien
beschränkt und gewährt keine Kids-Akademie-Erstellerrechte.
