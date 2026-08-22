# Worker-Secrets Sicherheitssperre (dar-admin-publisher)

**Status: GESPERRT** — nur nach ausdrücklichem Nutzer-Auftrag ändern.

## Warum
Cloudflare **Workers Builds** für `dar-admin-publisher` hat wiederholt den API-Worker überschrieben und Secrets gelöscht (`GITHUB_TOKEN fehlt`). Live-Bibliothek-Publish brach deshalb zusammen.

## Regel (nicht brechen)
1. **Workers Builds** für `dar-admin-publisher`: **deaktivieren**  
   **oder** Root Directory = `cloudflare`
2. Deploy nur über GitHub Action **Deploy Admin Publisher Worker**
3. Secrets nur über GitHub Actions Secrets + Sync-Workflow setzen — nicht manuell „leer“ speichern
4. Auto-Heal läuft alle **2 Minuten** (`Sync Admin Publisher Secrets`)

## Prüfen
`https://dar-admin-publisher.sero91ak.workers.dev/health`

Muss `hasGithubToken`, `hasAdminSecret`, `hasOneSignalKey` = true zeigen.

## Sperre aufheben
Nur wenn der Nutzer ausdrücklich sagt: Secrets/Builds ändern oder Sperre aufheben.  
Dann `content/admin/worker-secrets-safety-lock.json` → `"locked": false` und Auftrag dokumentieren.
