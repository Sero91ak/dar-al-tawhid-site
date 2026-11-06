"use strict";
const ALL = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
const PROVIDER = new Set(["de", "en", "tr", "ar", "bs", "fr", "es"]);

function plan(locale) {
  const code = String(locale || "").toLowerCase();
  if (!ALL.includes(code)) {
    return { locale: code, send: false, claimedDelivered: false, status: "rejected", doubleDelivery: false };
  }
  const tag = "dar_app_locale=" + code;
  if (code === "ku" || code === "ckb") {
    return {
      locale: code,
      send: false,
      claimedDelivered: false,
      providerLanguage: null,
      tag,
      status: "blocked-provider",
      doubleDelivery: false,
      blocker: "OneSignal hat keine Sprachkennung für ku oder ckb. Der bestehende Sync setzt die Anbieter-Sprache auf de, damit keine veraltete andere Sprache stehen bleibt. Das ist keine Zustellung auf Kurmancî oder Soranî. Ein eigener Abo-Tag ist hier nur der Prüfplan; der geschützte Versandweg wurde nicht verändert und es wird keine zweite Nachricht erzeugt."
    };
  }
  return {
    locale: code,
    send: false,
    claimedDelivered: false,
    providerLanguage: PROVIDER.has(code) ? code : null,
    tag,
    status: "dry-run-only",
    doubleDelivery: false,
    note: "Der vorhandene Client kann setLanguage für diese Kennung aufrufen. Dieser Plan ruft ihn nicht auf und versendet nichts."
  };
}

module.exports = { ALL, PROVIDER, plan };
