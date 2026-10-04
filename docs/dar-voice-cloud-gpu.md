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
  `https://dar-al-tawhid.de/voice-studio/api/engine`
- Die Besucher-Domain leitet die Voice-API intern an den Admin-Worker weiter; dessen Adresse bleibt aus der App-Oberfläche heraus. Danach leitet Cloudflare die bestehende Engine-API transparent an den privaten GPU-Host weiter.
- Async-Jobs, Render-Status, progressive Audio-Chunks, History und Aussprache-Endpunkte bleiben auf demselben API-Vertrag.
- Der bestehende Python-Engine-Server kann nun automatisch CUDA verwenden.
- Der Engine-Port kann über `DAR_VOICE_PORT` bzw. `PORT` gesetzt werden.
- Die bereits vorhandene Remote-Authentifizierung der Engine wird wiederverwendet.

## Fertiges GPU-Containerpaket

Das Repo enthält jetzt unter `voice-studio/cloud-gpu/` einen providerneutralen NVIDIA-CUDA-Container.

Build aus dem Repository-Root:

```bash
docker build -f voice-studio/cloud-gpu/Dockerfile -t dar-voice-gpu .
```

Der persistente private Voice-State wird als Volume nach `/root/SerhatVoice` gemountet. Dort liegen insbesondere die Referenz-Audios und die lernenden Aussprache-/Renderdaten. Der Container startet nur, wenn ein Pair-Token vorhanden ist und CUDA wirklich sichtbar ist; damit kann ein versehentlich gestarteter CPU-Dienst nicht unbemerkt produktiv gehen.

## GPU-Host – erforderliche Umgebungsvariablen

```
DAR_VOICE_NETWORK_MODE=1
DAR_VOICE_PAIR_TOKEN=<langes-zufälliges-token>
DAR_VOICE_DEVICE=cuda
DAR_VOICE_PORT=<provider-port>
SERHAT_VOICE_REF=/root/SerhatVoice/Serhat_Adobe_MASTER.wav
SERHAT_VOICE_REF_AR=/root/SerhatVoice/Serhat_AR_MASTER.wav
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

Die Software-Seite einschließlich CUDA-Container, Cloudflare-Gateway und PWA-Routing ist GPU-ready. Für echten Always-on-Betrieb fehlt nur noch ein provisionierter externer GPU-Host samt HTTPS-URL/Token und den privaten Voice-Dateien. Cloudflare Workers selbst führen das TTS-Modell nicht aus.
