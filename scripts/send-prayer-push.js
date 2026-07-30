#!/usr/bin/env node

/**
 * DEAKTIVIERT:
 * Gebets-Pushs werden ausschließlich durch den Cloudflare Worker Cron ausgeführt.
 * Dadurch existiert nur ein Scheduler, eine Idempotency-Logik und eine Textversion.
 */

console.error([
  "Der alte direkte Gebets-Push-Sender ist deaktiviert.",
  "Produktiver Pfad: Cloudflare Worker Cron (alle 5 Minuten).",
  "Manueller Wiederherstellungspfad: POST /api/admin/prayer/run.",
  "Diese Datei darf keine OneSignal-Nachrichten mehr senden."
].join("\n"));

process.exit(1);
