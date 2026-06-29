# Automatischer Sync nach taxipro-dispatch

Der Cloud Agent kann direkt nur in `dar-al-tawhid-site` pushen.
Für `taxipro-dispatch` läuft der Sync über GitHub Actions.

## Einmalig: Secret anlegen

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained**
2. Token erstellen mit Zugriff auf **`Sero91ak/taxipro-dispatch`** → **Contents: Read and write**
3. GitHub → **`dar-al-tawhid-site`** → **Settings → Secrets and variables → Actions**
4. **New repository secret**: Name `TAXIPRO_DISPATCH_PAT`, Wert = dein Token

## Sync starten

GitHub → **dar-al-tawhid-site** → **Actions** → **Sync to taxipro-dispatch** → **Run workflow**

Oder: Branch `cursor/taxipro-sync-19cc` ist bereits gepusht – Workflow startet automatisch nach Secret-Anlage.
