/**
 * DAR AL TAWḤĪD — Zakāt-Rechner Engine (clientseitig, transparent)
 */
(function (global) {
  "use strict";

  const DEFAULT_CONFIG = {
    nisab: { goldGrams: 85, silverGrams: 595, standard: "silver" },
    zakatRate: 0.025,
    hawlDaysLunar: 354,
    prices: {},
    sources: [],
    rules: [],
    warnings: {}
  };

  function parseAmount(value) {
    const n = parseFloat(String(value ?? "").replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function formatMoney(amount, currency = "EUR") {
    const n = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(n);
    } catch (e) {
      return `${n.toFixed(2)} ${currency}`;
    }
  }

  function formatNumber(n, digits = 2) {
    return (Number(n) || 0).toLocaleString("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function normalizeConfig(raw) {
    const c = raw && typeof raw === "object" ? raw : {};
    return {
      ...DEFAULT_CONFIG,
      ...c,
      nisab: { ...DEFAULT_CONFIG.nisab, ...(c.nisab || {}) },
      prices: { ...(c.prices || {}) },
      sources: Array.isArray(c.sources) ? c.sources.filter((s) => s && s.active !== false && s.verified) : [],
      rules: Array.isArray(c.rules) ? c.rules.filter((r) => r && r.active !== false && r.verified) : [],
      warnings: { ...DEFAULT_CONFIG.warnings, ...(c.warnings || {}) }
    };
  }

  function activeSourcesForRule(config, ruleId) {
    return (config.sources || []).filter(
      (s) => s.verified && s.active !== false && (s.ruleIds || []).includes(ruleId)
    );
  }

  function activeRule(config, ruleId) {
    const r = (config.rules || []).find((x) => x.id === ruleId);
    return r && r.active !== false && r.verified ? r : null;
  }

  function getPrices(config, manual = {}) {
    const p = config.prices || {};
    const gold =
      parseAmount(manual.goldPerGramEur) ||
      parseAmount(p.goldPerGramEur) ||
      0;
    const silver =
      parseAmount(manual.silverPerGramEur) ||
      parseAmount(p.silverPerGramEur) ||
      0;
    const hasVerified =
      Boolean(p.active && p.verifiedAt && gold > 0 && silver > 0) ||
      (parseAmount(manual.goldPerGramEur) > 0 && parseAmount(manual.silverPerGramEur) > 0);
    return {
      goldPerGramEur: gold,
      silverPerGramEur: silver,
      currency: p.currency || "EUR",
      source: p.source || (manual.goldPerGramEur ? "Manuell eingetragen" : ""),
      verifiedAt: p.verifiedAt || "",
      hasVerified,
      active: p.active !== false
    };
  }

  function computeHawl(input, config) {
    const startStr = String(input.nisabSinceDate || "").trim();
    const todayStr = String(input.todayDate || "").trim() || new Date().toISOString().slice(0, 10);
    if (!startStr) {
      return {
        fulfilled: null,
        startDate: "",
        nextDueDate: "",
        daysRemaining: null,
        daysElapsed: null,
        previewOnly: true,
        message: config.warnings?.hawlPreview || "Ḥawl nicht angegeben — nur Vorschau."
      };
    }
    const start = new Date(startStr + "T12:00:00");
    const today = new Date(todayStr + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) {
      return { fulfilled: null, previewOnly: true, message: "Ungültiges Datum." };
    }
    const daysElapsed = Math.floor((today - start) / 86400000);
    const required = Number(config.hawlDaysLunar) || 354;
    const fulfilled = daysElapsed >= required;
    const nextDue = new Date(start);
    nextDue.setDate(nextDue.getDate() + required);
    return {
      fulfilled,
      startDate: startStr,
      nextDueDate: nextDue.toISOString().slice(0, 10),
      daysRemaining: fulfilled ? 0 : Math.max(0, required - daysElapsed),
      daysElapsed,
      previewOnly: !fulfilled,
      message: fulfilled ? "" : config.warnings?.hawlPreview || ""
    };
  }

  function computeZakat(input, configRaw) {
    const config = normalizeConfig(configRaw);
    const currency = config.prices?.currency || "EUR";
    const prices = getPrices(config, input.manualPrices || {});
    const warnings = [];
    const steps = [];
    const sourceIds = new Set();

    const cash =
      parseAmount(input.cash) +
      parseAmount(input.bank) +
      parseAmount(input.digital) +
      parseAmount(input.otherLiquid);
    if (cash > 0) {
      steps.push({
        label: "Liquide Mittel (Bargeld, Bank, digital)",
        value: cash,
        detail: `Bargeld ${formatMoney(parseAmount(input.cash), currency)} + Bank ${formatMoney(parseAmount(input.bank), currency)} + Digital ${formatMoney(parseAmount(input.digital), currency)}`
      });
    }

    let goldGrams = parseAmount(input.goldGrams);
    let goldValue = parseAmount(input.goldValueManual);
    const goldType = String(input.goldType || "investment");
    if (goldGrams > 0 && prices.goldPerGramEur > 0) {
      goldValue = goldGrams * prices.goldPerGramEur;
      steps.push({
        label: "Gold",
        value: goldValue,
        detail: `${formatNumber(goldGrams, 2)} g × ${formatMoney(prices.goldPerGramEur, currency)}/g`
      });
    } else if (goldValue > 0) {
      steps.push({ label: "Gold (manueller Wert)", value: goldValue, detail: formatMoney(goldValue, currency) });
    }
    if (goldType === "jewelry" && goldValue > 0) {
      warnings.push({
        id: "jewelry",
        text: config.warnings?.jewelryIkhtilaf || "Ikhtilāf bei Schmuck",
        ruleId: "gold-jewelry"
      });
      activeSourcesForRule(config, "gold-jewelry").forEach((s) => sourceIds.add(s.id));
    }

    let silverGrams = parseAmount(input.silverGrams);
    let silverValue = parseAmount(input.silverValueManual);
    if (silverGrams > 0 && prices.silverPerGramEur > 0) {
      silverValue = silverGrams * prices.silverPerGramEur;
      steps.push({
        label: "Silber",
        value: silverValue,
        detail: `${formatNumber(silverGrams, 2)} g × ${formatMoney(prices.silverPerGramEur, currency)}/g`
      });
    } else if (silverValue > 0) {
      steps.push({ label: "Silber (manueller Wert)", value: silverValue, detail: formatMoney(silverValue, currency) });
    }

    const totalWealth = cash + goldValue + silverValue;
    steps.push({ label: "Gesamtvermögen", value: totalWealth, detail: "Summe aller Module", highlight: true });

    const debtsDue = parseAmount(input.debtsDue);
    if (debtsDue > 0) {
      steps.push({
        label: "Abzugsfähige fällige Schulden",
        value: -debtsDue,
        detail: "Kurzfristig fällig (Standard-Berechnung)"
      });
      activeSourcesForRule(config, "debts-deductible").forEach((s) => sourceIds.add(s.id));
    }

    const zakatableWealth = Math.max(0, totalWealth - debtsDue);
    steps.push({
      label: "Zakātpflichtiges Vermögen",
      value: zakatableWealth,
      detail: `${formatMoney(totalWealth, currency)} − ${formatMoney(debtsDue, currency)}`,
      highlight: true
    });

    let nisabGoldEur = 0;
    let nisabSilverEur = 0;
    let nisabStandardEur = 0;
    let nisabReached = false;
    let priceMissing = !prices.hasVerified;

    if (prices.goldPerGramEur > 0 && prices.silverPerGramEur > 0) {
      nisabGoldEur = (config.nisab?.goldGrams || 85) * prices.goldPerGramEur;
      nisabSilverEur = (config.nisab?.silverGrams || 595) * prices.silverPerGramEur;
      nisabStandardEur = Math.min(nisabGoldEur, nisabSilverEur);
      nisabReached = zakatableWealth >= nisabStandardEur;
      activeSourcesForRule(config, "nisab-gold").forEach((s) => sourceIds.add(s.id));
      activeSourcesForRule(config, "nisab-silver").forEach((s) => sourceIds.add(s.id));
    } else {
      priceMissing = true;
      warnings.push({
        id: "no-price",
        text: config.warnings?.noPrice || "Kein geprüfter Niṣāb-Wert",
        ruleId: "nisab-silver"
      });
    }

    const hawl = computeHawl(input, config);
    if (hawl.previewOnly && hawl.message) {
      warnings.push({ id: "hawl", text: hawl.message, ruleId: "hawl" });
    }
    activeSourcesForRule(config, "hawl").forEach((s) => sourceIds.add(s.id));

    const rate = Number(config.zakatRate) || 0.025;
    activeSourcesForRule(config, "zakat-rate").forEach((s) => sourceIds.add(s.id));

    let zakatDue = 0;
    let finalResult = false;
    let previewOnly = false;

    if (priceMissing) {
      previewOnly = true;
      if (zakatableWealth > 0) {
        zakatDue = zakatableWealth * rate;
        steps.push({
          label: "Vorschau Pflichtbetrag (ohne geprüften Niṣāb)",
          value: zakatDue,
          detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
          preview: true
        });
      }
    } else if (!nisabReached) {
      finalResult = true;
      steps.push({
        label: "Zakāt fällig",
        value: 0,
        detail: "Niṣāb nicht erreicht — keine Vermögens-Zakāt fällig",
        highlight: true
      });
    } else if (hawl.fulfilled === false) {
      previewOnly = true;
      zakatDue = zakatableWealth * rate;
      steps.push({
        label: "Vorschau Pflichtbetrag (Ḥawl noch nicht erfüllt)",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
        preview: true
      });
    } else {
      finalResult = true;
      zakatDue = zakatableWealth * rate;
      steps.push({
        label: "Rechenweg",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} % = ${formatMoney(zakatDue, currency)}`,
        highlight: true
      });
    }

    const sources = (config.sources || []).filter((s) => sourceIds.has(s.id));

    return {
      ok: true,
      currency,
      totalWealth,
      debtsDue,
      zakatableWealth,
      nisab: {
        goldGrams: config.nisab?.goldGrams || 85,
        silverGrams: config.nisab?.silverGrams || 595,
        goldEur: nisabGoldEur,
        silverEur: nisabSilverEur,
        standardEur: nisabStandardEur,
        standardLabel: nisabStandardEur === nisabSilverEur ? "Silber-Niṣāb (vorsichtig)" : "Gold-Niṣāb",
        reached: nisabReached
      },
      prices,
      hawl,
      rate,
      ratePercent: rate * 100,
      zakatDue,
      finalResult,
      previewOnly,
      priceMissing,
      zakatObligatory: finalResult && nisabReached && hawl.fulfilled !== false && zakatDue > 0,
      steps,
      warnings,
      sources,
      modules: {
        cash,
        goldValue,
        goldGrams,
        goldType,
        silverValue,
        silverGrams
      }
    };
  }

  function buildPdfHtml(result, config, meta = {}) {
    const w = config.warnings || {};
    const date = meta.date || new Date().toLocaleDateString("de-DE");
    const steps = (result.steps || [])
      .map(
        (s) =>
          `<tr><td>${s.label}${s.preview ? " (Vorschau)" : ""}</td><td>${formatMoney(s.value, result.currency)}</td><td>${s.detail || ""}</td></tr>`
      )
      .join("");
    const src = (result.sources || [])
      .map(
        (s) =>
          `<div class="src"><b>${s.category}</b> · ${s.reference}<br>${s.german || ""}${s.arabic ? `<div class="ar">${s.arabic}</div>` : ""}</div>`
      )
      .join("");
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Zakāt-Berechnung</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:32px auto;padding:24px;color:#1a1208;background:#faf6eb}
h1{color:#5c1a1a;border-bottom:2px solid #c8a85b;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}
td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}th{background:#2a1f14;color:#f8efd4}
.note{font-size:12px;color:#555;margin-top:24px;line-height:1.5}.ar{font-family:serif;direction:rtl;text-align:right;margin-top:6px}
.src{margin:12px 0;padding:10px;border-left:3px solid #c8a85b;background:#fff}</style></head>
<body><h1>🕌 Zakāt-Berechnung — DAR AL TAWḤĪD</h1><p>Datum: ${date}</p>
<h2>Ergebnis</h2><p><b>Pflichtbetrag:</b> ${formatMoney(result.zakatDue, result.currency)}${result.previewOnly ? " (Vorschau)" : ""}</p>
<p>Niṣāb: ${result.nisab.reached ? "erreicht" : "nicht erreicht"} · Ḥawl: ${result.hawl.fulfilled === true ? "erfüllt" : result.hawl.fulfilled === false ? "noch nicht" : "—"}</p>
<h2>Rechenweg</h2><table><thead><tr><th>Schritt</th><th>Betrag</th><th>Detail</th></tr></thead><tbody>${steps}</tbody></table>
<h2>Belege</h2>${src || "<p>Keine Belege geladen.</p>"}
<p class="note">${w.disclaimer || ""}</p></body></html>`;
  }

  global.DARZakat = {
    parseAmount,
    formatMoney,
    formatNumber,
    normalizeConfig,
    computeZakat,
    computeHawl,
    getPrices,
    activeSourcesForRule,
    buildPdfHtml,
    DEFAULT_CONFIG
  };
})(typeof window !== "undefined" ? window : global);
