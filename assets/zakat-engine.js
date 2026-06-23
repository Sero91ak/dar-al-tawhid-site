/**
 * DAR AL TAWḤĪD — Zakāt-Rechner Engine (clientseitig, transparent)
 */
(function (global) {
  "use strict";

  const TROY_OZ_TO_GRAM = 31.1034768;

  const DEFAULT_CONFIG = {
    nisab: { goldGrams: 85, silverGrams: 595, standard: "silver" },
    zakatRate: 0.025,
    hawlDaysLunar: 354,
    prices: {},
    priceFreshness: null,
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

  function formatDateTime(iso) {
    const ts = Date.parse(String(iso || ""));
    if (!Number.isFinite(ts)) return "—";
    return new Date(ts).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function priceFreshnessFromAge(fetchedAt) {
    const ts = Date.parse(String(fetchedAt || ""));
    if (!Number.isFinite(ts)) {
      return { level: "missing", badge: "error", label: "❌ Keine geprüfte Preisquelle", canFinalize: false };
    }
    const ageHours = (Date.now() - ts) / 3600000;
    if (ageHours <= 6) {
      return { level: "current", badge: "ok", label: "✅ Preisquelle aktuell geprüft", canFinalize: true, ageHours };
    }
    if (ageHours <= 24) {
      return { level: "today", badge: "ok", label: "Heute geprüft", canFinalize: true, ageHours };
    }
    if (ageHours <= 48) {
      return {
        level: "stale",
        badge: "warn",
        label: "⚠️ Preis älter als 24 Stunden – Ergebnis mit Hinweis",
        canFinalize: false,
        ageHours
      };
    }
    return {
      level: "expired",
      badge: "error",
      label: "❌ Kein aktueller geprüfter Preis – nur Vorschau",
      canFinalize: false,
      ageHours
    };
  }

  function normalizeConfig(raw) {
    const c = raw && typeof raw === "object" ? raw : {};
    return {
      ...DEFAULT_CONFIG,
      ...c,
      nisab: { ...DEFAULT_CONFIG.nisab, ...(c.nisab || {}) },
      prices: { ...(c.prices || {}) },
      priceFreshness: c.priceFreshness || null,
      sources: Array.isArray(c.sources) ? c.sources.filter((s) => s && s.active !== false && s.verified) : [],
      rules: Array.isArray(c.rules) ? c.rules.filter((r) => r && r.active !== false && r.verified) : [],
      warnings: { ...DEFAULT_CONFIG.warnings, ...(c.warnings || {}) }
    };
  }

  function mergeLivePrices(config, livePayload) {
    const next = normalizeConfig(config);
    if (!livePayload || typeof livePayload !== "object") return next;
    if (livePayload.prices) {
      next.prices = { ...next.prices, ...livePayload.prices };
    }
    if (livePayload.freshness) {
      next.priceFreshness = livePayload.freshness;
    } else if (livePayload.fetchedAt) {
      next.priceFreshness = priceFreshnessFromAge(livePayload.fetchedAt);
    }
    next.livePriceMeta = {
      provider: livePayload.provider || "",
      fetchedAt: livePayload.fetchedAt || "",
      gold: livePayload.gold || null,
      silver: livePayload.silver || null,
      standardNisabEur: livePayload.standardNisabEur || 0
    };
    return next;
  }

  function activeSourcesForRule(config, ruleId) {
    return (config.sources || []).filter(
      (s) => s.verified && s.active !== false && (s.ruleIds || []).includes(ruleId)
    );
  }

  function getPrices(config, manual = {}) {
    const p = config.prices || {};
    const manualGold = parseAmount(manual.goldPerGramEur);
    const manualSilver = parseAmount(manual.silverPerGramEur);
    const gold = manualGold || parseAmount(p.goldPerGramEur) || 0;
    const silver = manualSilver || parseAmount(p.silverPerGramEur) || 0;
    const fetchedAt = p.verifiedAt || config.livePriceMeta?.fetchedAt || "";
    const freshness =
      config.priceFreshness ||
      (manualGold && manualSilver
        ? { level: "manual", badge: "warn", label: "Manuell eingetragen (Notfall)", canFinalize: false }
        : priceFreshnessFromAge(fetchedAt));
    const hasVerified = gold > 0 && silver > 0 && (freshness.canFinalize || manualGold > 0);
    const hasAnyPrice = gold > 0 && silver > 0;
    return {
      goldPerGramEur: gold,
      silverPerGramEur: silver,
      currency: p.currency || "EUR",
      source: p.source || config.livePriceMeta?.provider || (manualGold ? "Manuell eingetragen" : ""),
      provider: p.provider || config.livePriceMeta?.provider || "",
      verifiedAt: fetchedAt,
      hasVerified,
      hasAnyPrice,
      active: p.active !== false,
      freshness,
      isManual: Boolean(manualGold || manualSilver || p.isManual)
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

  function resolveResultCase(ctx) {
    const {
      priceMissing,
      hasMetalInput,
      goldUnvalued,
      silverUnvalued,
      nisabReached,
      hawl,
      zakatableWealth,
      prices
    } = ctx;

    if (priceMissing && (goldUnvalued || silverUnvalued)) {
      return {
        caseId: "D",
        statusMessage:
          "Keine endgültige Berechnung möglich, da Gold-/Silberpreis fehlt. Liquide Mittel werden trotzdem berechnet."
      };
    }
    if (priceMissing && !hasMetalInput && zakatableWealth > 0) {
      return {
        caseId: "E",
        statusMessage: prices.freshness?.level === "missing"
          ? "Liquide Mittel berechnet — Niṣāb-Vergleich erst nach geladenen Preisen möglich."
          : "Liquide Mittel berechnet — endgültiger Niṣāb-Vergleich mit Hinweis."
      };
    }
    if (!nisabReached) {
      return { caseId: "A", statusMessage: "Keine Zakāt fällig, da Niṣāb nicht erreicht." };
    }
    if (hawl.fulfilled === false) {
      return { caseId: "B", statusMessage: "Nur Vorschau – Ḥawl noch nicht erfüllt." };
    }
    if (priceMissing || !prices.hasVerified) {
      return { caseId: "D", statusMessage: "Keine endgültige Berechnung möglich — Preisquelle unvollständig." };
    }
    return { caseId: "C", statusMessage: "Zakāt fällig." };
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

    const goldGrams = parseAmount(input.goldGrams);
    let goldValue = parseAmount(input.goldValueManual);
    const goldType = String(input.goldType || "investment");
    let goldUnvalued = false;

    if (goldGrams > 0 && prices.goldPerGramEur > 0) {
      goldValue = goldGrams * prices.goldPerGramEur;
      steps.push({
        label: "Gold",
        value: goldValue,
        detail: `${formatNumber(goldGrams, 2)} g × ${formatMoney(prices.goldPerGramEur, currency)}/g`
      });
    } else if (goldValue > 0) {
      steps.push({ label: "Gold (manueller Wert)", value: goldValue, detail: formatMoney(goldValue, currency) });
    } else if (goldGrams > 0) {
      goldUnvalued = true;
      warnings.push({
        id: "gold-unvalued",
        text: "Gold konnte nicht bewertet werden, weil keine geprüfte Preisquelle vorhanden ist.",
        ruleId: "nisab-gold"
      });
    }

    if (goldType === "jewelry" && goldValue > 0) {
      warnings.push({
        id: "jewelry",
        text: config.warnings?.jewelryIkhtilaf || "Ikhtilāf bei Schmuck",
        ruleId: "gold-jewelry"
      });
      activeSourcesForRule(config, "gold-jewelry").forEach((s) => sourceIds.add(s.id));
    }

    const silverGrams = parseAmount(input.silverGrams);
    let silverValue = parseAmount(input.silverValueManual);
    let silverUnvalued = false;

    if (silverGrams > 0 && prices.silverPerGramEur > 0) {
      silverValue = silverGrams * prices.silverPerGramEur;
      steps.push({
        label: "Silber",
        value: silverValue,
        detail: `${formatNumber(silverGrams, 2)} g × ${formatMoney(prices.silverPerGramEur, currency)}/g`
      });
    } else if (silverValue > 0) {
      steps.push({ label: "Silber (manueller Wert)", value: silverValue, detail: formatMoney(silverValue, currency) });
    } else if (silverGrams > 0) {
      silverUnvalued = true;
      warnings.push({
        id: "silver-unvalued",
        text: "Silber konnte nicht bewertet werden, weil keine geprüfte Preisquelle vorhanden ist.",
        ruleId: "nisab-silver"
      });
    }

    const liquidWealth = cash;
    const totalWealth = cash + goldValue + silverValue;
    steps.push({
      label: "Gesamtvermögen",
      value: totalWealth,
      detail:
        goldUnvalued || silverUnvalued
          ? `Liquide ${formatMoney(liquidWealth, currency)}${goldUnvalued ? " · Gold nicht bewertbar" : ""}${silverUnvalued ? " · Silber nicht bewertbar" : ""}`
          : "Summe aller bewerteten Module",
      highlight: true
    });

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
    const priceMissing = !prices.hasAnyPrice;
    const hasMetalInput = goldGrams > 0 || silverGrams > 0 || goldValue > 0 || silverValue > 0;

    if (prices.goldPerGramEur > 0 && prices.silverPerGramEur > 0) {
      nisabGoldEur = (config.nisab?.goldGrams || 85) * prices.goldPerGramEur;
      nisabSilverEur = (config.nisab?.silverGrams || 595) * prices.silverPerGramEur;
      nisabStandardEur = Math.min(nisabGoldEur, nisabSilverEur);
      nisabReached = zakatableWealth >= nisabStandardEur;
      activeSourcesForRule(config, "nisab-gold").forEach((s) => sourceIds.add(s.id));
      activeSourcesForRule(config, "nisab-silver").forEach((s) => sourceIds.add(s.id));
      if (!prices.hasVerified) {
        warnings.push({
          id: "price-stale",
          text: prices.freshness?.label || config.warnings?.noPrice || "Preisquelle nicht aktuell geprüft",
          ruleId: "nisab-silver"
        });
      }
    } else {
      warnings.push({
        id: "no-price",
        text: config.warnings?.noPrice || "Kein geprüfter Niṣāb-Wert — liquide Mittel werden trotzdem berechnet.",
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

    const resultCase = resolveResultCase({
      priceMissing,
      hasMetalInput,
      goldUnvalued,
      silverUnvalued,
      nisabReached,
      hawl,
      zakatableWealth,
      prices
    });

    let zakatDue = 0;
    let finalResult = false;
    let previewOnly = false;

    if (resultCase.caseId === "A") {
      finalResult = true;
      zakatDue = 0;
      steps.push({
        label: "Zakāt fällig",
        value: 0,
        detail: resultCase.statusMessage,
        highlight: true
      });
    } else if (resultCase.caseId === "B") {
      previewOnly = true;
      zakatDue = zakatableWealth * rate;
      steps.push({
        label: "Vorschau Pflichtbetrag (Ḥawl noch nicht erfüllt)",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
        preview: true
      });
    } else if (resultCase.caseId === "C") {
      finalResult = true;
      zakatDue = zakatableWealth * rate;
      steps.push({
        label: "Rechenweg",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} % = ${formatMoney(zakatDue, currency)}`,
        highlight: true
      });
    } else {
      previewOnly = true;
      if (prices.hasAnyPrice && nisabReached && zakatableWealth > 0) {
        zakatDue = zakatableWealth * rate;
        steps.push({
          label: "Vorschau Pflichtbetrag (Preisquelle mit Hinweis)",
          value: zakatDue,
          detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
          preview: true
        });
      } else if (zakatableWealth > 0 && !hasMetalInput && !priceMissing) {
        zakatDue = zakatableWealth * rate;
        steps.push({
          label: "Vorschau Pflichtbetrag (liquide Mittel)",
          value: zakatDue,
          detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
          preview: true
        });
      } else if (zakatableWealth === 0 && cash > 0) {
        steps.push({
          label: "Zakātpflichtig aus liquiden Mitteln",
          value: 0,
          detail: `Liquide Mittel ${formatMoney(cash, currency)} nach Schuldenabzug`,
          highlight: true
        });
      }
    }

    const sources = (config.sources || []).filter((s) => sourceIds.has(s.id));

    return {
      ok: true,
      currency,
      liquidWealth: cash,
      totalWealth,
      debtsDue,
      zakatableWealth,
      nisab: {
        goldGrams: config.nisab?.goldGrams || 85,
        silverGrams: config.nisab?.silverGrams || 595,
        goldEur: nisabGoldEur,
        silverEur: nisabSilverEur,
        standardEur: nisabStandardEur,
        standardLabel:
          nisabStandardEur > 0 && nisabStandardEur === nisabSilverEur
            ? "Silber-Niṣāb (vorsichtig)"
            : nisabStandardEur > 0
              ? "Gold-Niṣāb (vorsichtig)"
              : "—",
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
      goldUnvalued,
      silverUnvalued,
      resultCase: resultCase.caseId,
      statusMessage: resultCase.statusMessage,
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
<p>${result.statusMessage || ""}</p>
<p>Niṣāb: ${result.nisab.reached ? "erreicht" : "nicht erreicht"} · Ḥawl: ${result.hawl.fulfilled === true ? "erfüllt" : result.hawl.fulfilled === false ? "noch nicht" : "—"}</p>
<h2>Rechenweg</h2><table><thead><tr><th>Schritt</th><th>Betrag</th><th>Detail</th></tr></thead><tbody>${steps}</tbody></table>
<h2>Belege</h2>${src || "<p>Keine Belege geladen.</p>"}
<p class="note">${w.disclaimer || ""}</p></body></html>`;
  }

  global.DARZakat = {
    parseAmount,
    formatMoney,
    formatNumber,
    formatDateTime,
    normalizeConfig,
    mergeLivePrices,
    priceFreshnessFromAge,
    computeZakat,
    computeHawl,
    getPrices,
    activeSourcesForRule,
    buildPdfHtml,
    TROY_OZ_TO_GRAM,
    DEFAULT_CONFIG
  };
})(typeof window !== "undefined" ? window : global);
