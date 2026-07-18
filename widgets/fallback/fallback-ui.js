/**
 * DAR AL TAWḤĪD – Widget fallback views (safe, no technical errors)
 */
(function (global) {
  "use strict";

  const VERSION = "widget-fallback-v1";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setupNeeded(appPath) {
    const href = esc(appPath || "/#prayer");
    return `<div class="pw-fallback" role="status">
      <b>Gebetszeiten noch nicht eingerichtet</b>
      <p>App öffnen und Standort auswählen</p>
      <a class="pw-fallback-link" href="${href}">Zur Einrichtung</a>
    </div>`;
  }

  function locationNeeded(appPath) {
    const href = esc(appPath || "/#prayer");
    return `<div class="pw-fallback" role="status">
      <b>Standort auswählen</b>
      <p>Bitte in der App einen Ort freigeben oder manuell wählen.</p>
      <a class="pw-fallback-link" href="${href}">Standort öffnen</a>
    </div>`;
  }

  function staleHint(isoDate) {
    if (!isoDate) return "";
    try {
      const d = new Date(isoDate);
      if (Number.isNaN(d.getTime())) return "";
      const label = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `<div class="pw-stale-hint">Zuletzt aktualisiert: ${esc(label)}</div>`;
    } catch (e) {
      return "";
    }
  }

  global.DarWidgetFallback = {
    VERSION,
    esc,
    setupNeeded,
    locationNeeded,
    staleHint
  };
})(typeof window !== "undefined" ? window : globalThis);
