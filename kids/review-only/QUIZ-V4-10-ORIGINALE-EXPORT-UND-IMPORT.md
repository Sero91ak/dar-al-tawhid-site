# TAWḤĪD KIDS – zehn neu bezahlte V4-Originale

**Nicht live. Nicht noch einmal synthetisieren.** Diese exakt zehn Sprechbausteine wurden mit der persönlichen Masterstimme und `eleven_v4` bei ElevenLabs bereits produziert. Die MP3-Originalbytes wurden noch nicht in GitHub importiert.

- Anzahl einzigartiger Aufnahmen: **10**
- Provider-bestätigte Credits: **293.6270**
- Stimme: **Serhat Abu Malik – Master** (`DkU7j9uO4ZEtLD2iRZSH`)
- Flow: https://elevenlabs.io/app/flows/1q8pGIR0nRKIekoSCt0j
- Original-QA: **Ausstehend** – inklusive korrekter arabischer Aussprache/Fuṣḥā.

| Bezahlt: Generation-ID / Dateiname | Zugehöriger Originaltext | Credits |
|---|---|---:|
| `UW1YgOL7E8RpT6kIq9y5.mp3` | Der Glaube an den Jüngsten Tag gehört zu den Grundlagen des Īmān. | 62.989 |
| `IO0SpylbAzEhGGam0zLh.mp3` | Nur einmal in der Woche zu beten. | 31.979 |
| `CGwynSaXKlKbB41tgCkJ.mp3` | Die Gebete zu bewahren. | 22.289 |
| `aR55oBzgC8dvN9w4VRW3.mp3` | Gebete beliebig auszulassen. | 27.134 |
| `LZTYYIhtzp2h57p2J2HN.mp3` | Etwas erfinden. | 14.536 |
| `NA6VIp2dXxvQwXedzO3u.mp3` | Leute des Wissens fragen. | 24.227 |
| `bdsbpIHXoHiKvLuOJOUx.mp3` | Einfach raten. | 13.567 |
| `WbVlLuSlX7OapRxAZ3H6.mp3` | Raten und als sicher ausgeben. | 29.072 |
| `JlulX3gxfopy5QY3D0yp.mp3` | Was sollen Menschen tun, wenn sie etwas nicht wissen? | 51.361 |
| `XLIMpsjTtv0Fp1dnDwGk.mp3` | Nur vor Freunden. | 16.474 |

## Einmaliger verlustfreier MP3-Export und Import

1. In der oben verlinkten ElevenLabs-Flow-Sammlung die **bestehenden zehn Aufnahmen herunterladen**; **nicht** auf Neu generieren oder Variationen klicken.
2. Die Originaldateien genau nach ihrer Generation-ID als `GENERATION-ID.mp3` benennen; alle zehn in ein ZIP legen. Falls Dateinamen beibehalten werden sollen, `flow-audio-map.json` in das ZIP legen und IDs auf Originaldateinamen mappen.
3. Mit `python3 kids/tools/import_quiz_v4_connected_flow_originals.py --zip <Pfad-zur-ZIP>` lokal in den Reviewzweig importieren. Der Import verbraucht **null** ElevenLabs-Credits und kontrolliert SHA256, Codec, Dauer, Dateigröße, Stimme/Modell-Provenienz und frühere Bezahlbelege.
4. Anschließend die vorhandenen Offline-Joins für 4–6 und 7–10 Jahre und das private 450-Quiz-Staging laufen lassen. Vor dem Live-Push weiterhin reale menschliche Aussprachekontrolle und Release-Gate erforderlich.

Die unveränderten Quizfragen und die neun weiteren, schon früher bezahlten historischen Flow-Dateien bleiben erhalten und müssen weiterhin aus dem jeweiligen Originalexport gerettet werden.
