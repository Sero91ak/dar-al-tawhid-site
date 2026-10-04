# DĀR Voice – Cloud-GPU-Architektur

Stand: 2026-10-04

## Ziel

DĀR Voice soll unter `https://dar-al-tawhid.de/voice/` als installierbare PWA überall funktionieren, ohne lokale IP, ohne gleiches WLAN und ohne eingeschalteten Mac.

Die bestehende Voice-Studio-2.9.95-API bleibt erhalten. Die Web-App wechselt im Cloud-Modus nur den Transport:

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
wrangler secret put DAR_VOICE_WEB_TOKEN
```

`DAR_VOICE_GPU_ORIGIN` ist die HTTPS-Origin des GPU-Hosts.  
`DAR_VOICE_GPU_TOKEN` muss exakt dem `DAR_VOICE_PAIR_TOKEN` des GPU-Hosts entsprechen.  
`DAR_VOICE_WEB_TOKEN` ist ein **separater** privater Zugangscode für die installierte Voice-PWA. Er wird nie an den GPU-Host weitergegeben. Der Code wird nur beim ersten Entsperren an Cloudflare übermittelt; danach setzt der Worker eine `HttpOnly`-/`Secure`-/`SameSite=Strict`-Session. Der Code selbst wird nicht im Browser gespeichert.

## Sicherheitsmodell

- GPU-Origin und GPU-Token bleiben ausschließlich serverseitig in Cloudflare.
- Die Cloud-PWA ist zusätzlich mit einem eigenen `DAR_VOICE_WEB_TOKEN` geschützt, tauscht ihn gegen eine 30-Tage-`HttpOnly`-Session und arbeitet fail-closed, wenn das Secret fehlt.
- Browserzugriffe werden auf die DĀR-Weboberflächen begrenzt.
- Cloudflare entfernt Browser-Cookies/Admin-Secrets vor dem Upstream-Aufruf.
- Der GPU-Host akzeptiert Remote-Zugriffe nur mit dem Voice-Token.
- Referenz-Audio und Lernzustand bleiben private Serverdaten.

## Always-on-Stack

Unter `voice-studio/cloud-gpu/` liegen zusätzlich:

- `docker-compose.yml` – Voice-Container + Caddy-TLS-Proxy.
- `Caddyfile` – HTTPS und Streaming-Reverse-Proxy.
- `.env.example` – Domain, Pair-Token, Datenpfade und Autowarm.
- `bootstrap.sh` – prüft NVIDIA/Docker, private Referenzdatei, baut und startet den Stack.
- `export-cloud-state.command` – erstellt auf dem bisherigen Mac ein privates Migrationspaket aus Referenz-Audios, Lernwortschatz und bestätigten Audio-Locks.
- `import-cloud-state.sh` – importiert dieses Paket auf den GPU-Host.

Der Hugging-Face-Modellcache wird getrennt persistent gemountet. Nach einem Host-/Container-Neustart wird das CUDA-Modell automatisch vorgewärmt, damit der erste echte Nutzerauftrag nicht erst das Modell laden muss.

## DigitalOcean-Pfad

Für den ersten produktiven Host ist ein NVIDIA GPU Droplet mit AI/ML-ready Image vorgesehen. Dieses Image bringt NVIDIA-Treiber/CUDA und den NVIDIA Container Toolkit bereits mit; unser Stack benötigt anschließend nur Repository, private Voice-Daten, Domain und Secrets.

Ablauf:

1. NVIDIA GPU Droplet erstellen.
2. Eine nur für den Origin bestimmte DNS-Adresse (z. B. `voice-gpu.dar-al-tawhid.de`) auf den Server zeigen lassen.
3. Repo auf den Host holen und `voice-studio/cloud-gpu/.env.example` nach `.env` kopieren.
4. Das Mac-Migrationspaket erzeugen und mit `import-cloud-state.sh` importieren.
5. `bootstrap.sh` starten; Caddy stellt HTTPS bereit und die Engine lädt CUDA + Voice-Referenz vor.
6. Die HTTPS-Origin und Tokens als Cloudflare-Secrets setzen.
7. `https://dar-al-tawhid.de/voice/` öffnen, privaten Voice-Zugangscode einmalig eingeben und PWA installieren.

## Performance-Benchmark

Nach dem ersten echten GPU-Start wird nicht geraten, sondern gemessen. `voice-studio/cloud-gpu/benchmark.py` startet einen normalen Async-Render über die öffentliche Cloud-PWA, misst Job-Annahme, erstes progressives Audio und vollständige Audiodatei und nutzt dabei denselben HttpOnly-Owner-Zugang wie die App.

Beispiel:

```bash
DAR_VOICE_WEB_TOKEN='…' \
python voice-studio/cloud-gpu/benchmark.py \
  --text-file /pfad/testtext.txt
```

Für DigitalOcean ist beim aktuell verbundenen Konto in TOR1 als NVIDIA-Einzel-GPU `gpu-h100x1-80gb` sichtbar. Der Provisioner prüft vor jeder kostenpflichtigen Erstellung den Kontostatus und die reale GPU-Verfügbarkeit der Zielregion. Das NVIDIA-AI/ML-Ready-Image bleibt über `DO_GPU_IMAGE` überschreibbar. Wenn später ein günstigerer freigegebener NVIDIA-Plan wie RTX 6000 Ada verfügbar wird, kann derselbe Stack ohne Architekturänderung über `DO_GPU_SIZE` darauf umgestellt und erneut gemessen werden.

`provision-digitalocean.sh` läuft standardmäßig nur als **Plan** und erzeugt erst mit `--apply` eine kostenpflichtige GPU. Im Plan-Modus darf der SSH-Key noch fehlen; im Apply-Modus werden Kontostatus, GPU-Region und SSH-Key strikt geprüft.

## Noch offen

Die Software-Seite einschließlich CUDA-Container, TLS-Stack, Cloudflare-Gateway, Owner-Zugang und PWA-Routing ist vorbereitet. Für echten Always-on-Betrieb fehlt nur noch das **Anlegen des externen GPU-Servers**, die DNS-Origin und das sichere Übertragen der privaten Voice-Daten/Secrets. Cloudflare Workers selbst führen das TTS-Modell nicht aus.
