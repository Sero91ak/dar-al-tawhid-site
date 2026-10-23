# DĀR NEXT Phase 4 – GitHub-QA-Nachweis

Zeitpunkt: 2026-10-23 16:43 Europe/Berlin  
Branch: `codex/darnext-phase4-wip-2026-10-23`  
Commit: `ae68b2446f0`

## Vorprüfung

- Der isolierte DARNext-Build in Xcode war erfolgreich.
- Buildzeit: 2,665 s.
- Buildlog: `QA/BuildProject-Log-20261023-164224.txt`.
- Der WIP-Branch wurde erfolgreich nach GitHub gepusht.
- Die Workflow-Datei `darnext-wip-qa.yml` ist im WIP-Branch vorhanden.

## Dispatch-Ergebnis

Der Start mit

```text
gh workflow run darnext-wip-qa.yml --ref codex/darnext-phase4-wip-2026-10-23
```

wurde von GitHub abgewiesen:

```text
HTTP 404: workflow darnext-wip-qa.yml not found on the default branch
```

## Status

GitHub-QA ist **nicht ausgeführt**. Es gibt deshalb keine GitHub-Unit-Tests,
keine GitHub-UI-Tests, kein XCResult und keine GitHub-Screenshots, die als
bestanden gelten könnten.

Ursache ist die GitHub-Dispatch-Regel: Ein `workflow_dispatch`-Workflow muss
auf dem Default-Branch bekannt sein, bevor er per API/CLI gestartet werden kann.
Die Workflow-Datei wurde absichtlich nicht in den produktiven Default-Branch
übernommen. Erforderliche nächste Aktion: Der Repository-Verantwortliche muss
den WIP-Workflow kontrolliert auf dem Default-Branch sichtbar machen oder einen
bereits vorhandenen Workflow entsprechend konfigurieren. Danach kann der
Dispatch mit dem unveränderten WIP-Branch wiederholt werden.
