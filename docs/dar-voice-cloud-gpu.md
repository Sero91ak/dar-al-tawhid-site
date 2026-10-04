# DĀR Voice – Cloud-GPU-Architektur

Stand: 2026-10-04

## Ziel

DĀR Voice soll unter `https://dar-al-tawhid.de/voice/` als installierbare PWA überall funktionieren, ohne lokale IP, ohne gleiches WLAN und ohne eingeschalteten Mac.

Die bestehende Voice-Studio-2.9.93-API bleibt erhalten. Die Web-App wechselt im Cloud-Modus nur den Transport:

`Browser/PWA → Cloudflare Gateway → privater GPU-Host → bestehende DĀR Voice Engine`

Der Browser sieht weder die GPU-Origin noch deren Auth-Token.

## Implementierter Stand

- `/voice/` leitet auf `/voice-studio/?app=1&cloud=1`.
- Der normale lokale `/voice-studio/`-Workflow bleibt unverändert.
- Cloud-Modus nutzt:
  `https://dar-admin-publisher.sero91ak.workers.dev/voice-studio/api/engine`
- Cloudflare leitet die bestehende Engine-API transparent weiter.
- Async-Jobs, Render-Status, progressive Audio-Chunks, History und Aussprache-Endpunkte bleiben auf demselben API-Vertrag.
- Der bestehende Python-Engine-Server kann nun automatisch CUDA verwenden.
- Der Engine-Port kann über `DAR_VOICE_PORT` bzw. `PORT` gesetzt werden.
- Die bereits vorhandene Remote-Authentifizierung der Engine wird wiederverwendet.

## GPU-Host – erforderliche Umgebungsvariablen

```
DAR_VOICE_NETWORK_MODE=1
DAR_VOICE_PAIR_TOKEN=<langes-zufälliges-token>
DAR_VOICE_DEVICE=cuda
DAR_VOICE_PORT=<provider-port>
SERHAT_VOICE_REF=/data/Serhat_Adobe_MASTER.wav
SERHAT_VOICE_REF_AR=/data/Serhat_AR_MASTER.wav
```

Der GPU-Host muss die vorhandenen Voice-Studio-Daten/Regeln und die privaten Referenz-Audios erhalten. Referenz-Audios gehören nicht in Git.

## Cloudflare – erforderliche Secrets

Im Worker `dar-admin-publisher`:

```
wrangler secret put DAR_VOICE_GPU_ORIGIN
wrangler secret put DAR_VOICE_GPU_TOKEN
```

`DAR_VOICE_GPU_ORIGIN` ist die HTTPS-Origin des GPU-Hosts.  
`DAR_VOICE_GPU_TOKEN` muss exakt dem `DAR_VOICE_PAIR_TOKEN` des GPU-Hosts entsprechen.

## Sicherheitsmodell

- Provider-Token bleibt ausschließlich serverseitig in Cloudflare.
- Browserzugriffe werden auf die DĀR-Weboberflächen begrenzt.
- Cloudflare entfernt Browser-Cookies/Admin-Secrets vor dem Upstream-Aufruf.
- Der GPU-Host akzeptiert Remote-Zugriffe nur mit dem Voice-Token.
- Referenz-Audio und Lernzustand bleiben private Serverdaten.

## Noch offen

Die Software-Seite ist GPU-ready. Für echten Always-on-Betrieb fehlt nur noch ein provisionierter externer GPU-Host samt URL/Token und den privaten Voice-Dateien. Cloudflare Workers selbst führen das TTS-Modell nicht aus.
