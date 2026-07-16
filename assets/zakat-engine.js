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

  function roundMoney(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

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
    const ageMinutes = ageHours * 60;
    if (ageMinutes <= 15) {
      return { level: "realtime", badge: "ok", label: "✅ Echtzeit geprüft", canFinalize: true, ageHours };
    }
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
    if (priceMissing && !hasMetalInput && zakatableWealth > 0 && !prices.hasAnyPrice) {
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
      const parts = [];
      if (parseAmount(input.cash) > 0) parts.push(`Bargeld ${formatMoney(parseAmount(input.cash), currency)}`);
      if (parseAmount(input.bank) > 0) parts.push(`Bank ${formatMoney(parseAmount(input.bank), currency)}`);
      if (parseAmount(input.digital) > 0) parts.push(`Digital ${formatMoney(parseAmount(input.digital), currency)}`);
      if (parseAmount(input.otherLiquid) > 0) parts.push(`Sonstige ${formatMoney(parseAmount(input.otherLiquid), currency)}`);
      steps.push({
        label: "Liquide Mittel",
        value: roundMoney(cash),
        detail: parts.join(" · ")
      });
    }

    const goldGrams = parseAmount(input.goldGrams);
    let goldValue = parseAmount(input.goldValueManual);
    const goldType = String(input.goldType || "investment");
    let goldUnvalued = false;

    if (goldGrams > 0 && prices.goldPerGramEur > 0) {
      goldValue = roundMoney(goldGrams * prices.goldPerGramEur);
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
      silverValue = roundMoney(silverGrams * prices.silverPerGramEur);
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
    const totalWealth = roundMoney(cash + goldValue + silverValue);
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

    const zakatableWealth = roundMoney(Math.max(0, totalWealth - debtsDue));
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
      nisabGoldEur = roundMoney((config.nisab?.goldGrams || 85) * prices.goldPerGramEur);
      nisabSilverEur = roundMoney((config.nisab?.silverGrams || 595) * prices.silverPerGramEur);
      nisabStandardEur = roundMoney(Math.min(nisabGoldEur, nisabSilverEur));
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
      zakatDue = roundMoney(zakatableWealth * rate);
      steps.push({
        label: "Vorschau Pflichtbetrag (Ḥawl noch nicht erfüllt)",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
        preview: true
      });
    } else if (resultCase.caseId === "C") {
      finalResult = true;
      zakatDue = roundMoney(zakatableWealth * rate);
      steps.push({
        label: "Zakāt-Pflichtbetrag",
        value: zakatDue,
        detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} % = ${formatMoney(zakatDue, currency)}`,
        highlight: true
      });
    } else {
      previewOnly = true;
      if (prices.hasAnyPrice && nisabReached && zakatableWealth > 0) {
        zakatDue = roundMoney(zakatableWealth * rate);
        steps.push({
          label: "Vorschau Pflichtbetrag (Preisquelle mit Hinweis)",
          value: zakatDue,
          detail: `${formatMoney(zakatableWealth, currency)} × ${formatNumber(rate * 100, 2)} %`,
          preview: true
        });
      } else if (zakatableWealth > 0 && !hasMetalInput && !priceMissing) {
        zakatDue = roundMoney(zakatableWealth * rate);
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
        cash: roundMoney(cash),
        cashBreakdown: {
          physical: parseAmount(input.cash),
          bank: parseAmount(input.bank),
          digital: parseAmount(input.digital),
          other: parseAmount(input.otherLiquid)
        },
        goldValue,
        goldGrams,
        goldType,
        silverValue,
        silverGrams
      }
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildReportId(iso) {
    const d = new Date(iso || Date.now());
    const y = d.getFullYear();
    const n = String(Math.floor(d.getTime() / 1000) % 1000000).padStart(6, "0");
    return `ZK-${y}-${n}`;
  }

  function formatPdfDate(iso) {
    const ts = Date.parse(String(iso || ""));
    if (!Number.isFinite(ts)) return new Date().toLocaleDateString("de-DE");
    return new Date(ts).toLocaleDateString("de-DE");
  }

  function formatPdfDateTime(iso) {
    const ts = Date.parse(String(iso || ""));
    if (!Number.isFinite(ts)) return formatDateTime(iso);
    return new Date(ts).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function buildPdfFilename(meta = {}) {
    const id = meta.reportId || buildReportId(meta.exportedAt);
    return `zakat-bericht-${id}.pdf`;
  }

  function pdfCornerSvg() {
    return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 46 C2 20 20 2 46 2" fill="none" stroke="#c5a059" stroke-width="1.4"/><path d="M8 44 C8 26 26 8 44 8" fill="none" stroke="#c5a059" stroke-width=".9"/><circle cx="10" cy="10" r="2.2" fill="#c5a059"/><path d="M14 6 L18 10 L14 14" fill="none" stroke="#c5a059" stroke-width=".8"/></svg>`;
  }

  function pdfIcon(kind) {
    const icons = {
      calendar: "📅",
      person: "👤",
      id: "🪪",
      currency: "💶",
      clock: "🕐",
      edit: "✎",
      coins: "🪙",
      minus: "➖",
      check: "✓",
      percent: "%",
      question: "?",
      scale: "⚖",
      gold: "🥇",
      info: "ℹ",
      exchange: "↻",
      calc: "🧮",
      star: "★",
      dash: "▢",
      window: "⌂"
    };
    return icons[kind] || "•";
  }

  function pdfFieldRow(icon, label, value, opts = {}) {
    const prefix = opts.prefix !== undefined ? opts.prefix : "€";
    const bold = opts.bold ? " zakat-pdf-val-bold" : "";
    const valHtml =
      prefix === false
        ? `<span class="zakat-pdf-val${bold}">${escapeHtml(value)}</span>`
        : `<span class="zakat-pdf-cur">${escapeHtml(prefix || "€")}</span><span class="zakat-pdf-val${bold}">${escapeHtml(value)}</span>`;
    return `<div class="zakat-pdf-field">
      <span class="zakat-pdf-ico">${pdfIcon(icon)}</span>
      <span class="zakat-pdf-lbl">${escapeHtml(label)}</span>
      <span class="zakat-pdf-dots">${valHtml}</span>
    </div>`;
  }

  function pdfMetaField(icon, label, value) {
    return `<div class="zakat-pdf-meta-field">
      <span class="zakat-pdf-ico">${pdfIcon(icon)}</span>
      <span class="zakat-pdf-meta-lbl">${escapeHtml(label)}</span>
      <span class="zakat-pdf-meta-val">${escapeHtml(value)}</span>
    </div>`;
  }

  function pdfSection(num, title, bodyHtml, extraClass) {
    const cls = extraClass ? `zakat-pdf-sec ${extraClass}` : "zakat-pdf-sec";
    return `<article class="${cls}">
      <header class="zakat-pdf-sec-head"><span class="zakat-pdf-num">${num}</span><span class="zakat-pdf-sec-title">${escapeHtml(title)}</span></header>
      <div class="zakat-pdf-sec-body">${bodyHtml}</div>
    </article>`;
  }

  function formatPdfMoneyPlain(amount, currency = "EUR") {
    const n = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n);
    } catch (e) {
      return n.toFixed(2);
    }
  }

  function pdfStyles() {
    return `@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#f3ecdf}
.zakat-pdf-root{font-family:"Segoe UI",system-ui,sans-serif;color:#173843;width:794px;height:1123px;overflow:hidden}
.zakat-pdf-page{width:794px;height:1123px;max-height:1123px;margin:0;padding:16px 20px 0;background:#f6f1e8;position:relative;page-break-after:auto;break-after:auto;overflow:hidden;display:flex;flex-direction:column}
.zakat-pdf-frame{position:relative;flex:1 1 auto;min-height:0;border:2.5px solid #173843;outline:2px solid #c5a059;outline-offset:-10px;padding:14px 16px 0;display:flex;flex-direction:column;overflow:hidden}
.zakat-pdf-corner{position:absolute;width:42px;height:42px;color:#c5a059;pointer-events:none;z-index:2}
.zakat-pdf-corner svg{width:100%;height:100%}
.zakat-pdf-corner.tl{top:4px;left:4px}
.zakat-pdf-corner.tr{top:4px;right:4px;transform:scaleX(-1)}
.zakat-pdf-corner.bl{bottom:34px;left:4px;transform:scaleY(-1)}
.zakat-pdf-corner.br{bottom:34px;right:4px;transform:scale(-1,-1)}
.zakat-pdf-wm{position:absolute;inset:80px 40px 80px;z-index:0;display:flex;align-items:center;justify-content:center;opacity:.055;pointer-events:none}
.zakat-pdf-wm img{width:min(420px,72%);height:auto;object-fit:contain}
.zakat-pdf-hero{position:relative;z-index:1;text-align:center;margin-bottom:8px;flex:0 0 auto}
.zakat-pdf-logo{width:72px;height:72px;border-radius:50%;border:2px solid #c5a059;background:#fff;object-fit:cover;margin:0 auto 6px;display:block}
.zakat-pdf-hero h1{margin:0;font:700 24px/1.05 Georgia,"Times New Roman",serif;letter-spacing:.08em;color:#173843}
.zakat-pdf-subtitle{margin-top:6px;display:flex;align-items:center;justify-content:center;gap:10px;font:italic 15px/1.2 "Palatino Linotype","Book Antiqua",Palatino,serif;color:#b8923a}
.zakat-pdf-subtitle:before,.zakat-pdf-subtitle:after{content:"";width:42px;height:2px;background:linear-gradient(90deg,transparent,#c5a059)}
.zakat-pdf-subtitle:after{background:linear-gradient(90deg,#c5a059,transparent)}
.zakat-pdf-infobox{position:relative;z-index:1;border:1.5px solid #c5a059;border-radius:10px;background:rgba(255,255,255,.48);padding:8px 10px;margin-bottom:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;flex:0 0 auto}
.zakat-pdf-meta-field{display:grid;grid-template-columns:16px 1fr;grid-template-rows:auto auto;column-gap:6px;row-gap:1px;font-size:8.5px;line-height:1.25;align-items:center}
.zakat-pdf-meta-lbl{grid-column:2;color:#42565c;font-weight:600}
.zakat-pdf-meta-val{grid-column:2;border-bottom:1px dotted rgba(23,56,67,.45);padding-bottom:1px;font-size:9px;color:#173843;font-weight:700}
.zakat-pdf-grid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:7px;flex:1 1 auto;min-height:0;align-content:start}
.zakat-pdf-sec{border:1.5px solid #c5a059;border-radius:8px;background:rgba(255,255,255,.42);overflow:hidden;display:flex;flex-direction:column;min-height:0}
.zakat-pdf-sec-head{display:flex;align-items:center;gap:7px;padding:5px 8px;background:linear-gradient(180deg,#1f4f5d,#173843);color:#f6f1e8;font:700 9.5px/1.2 Georgia,serif;letter-spacing:.04em;text-transform:uppercase}
.zakat-pdf-num{width:18px;height:18px;border-radius:50%;background:#c5a059;color:#173843;display:inline-flex;align-items:center;justify-content:center;font:800 9px/1 "Segoe UI",sans-serif;flex:0 0 auto}
.zakat-pdf-sec-title{flex:1 1 auto}
.zakat-pdf-sec-body{padding:5px 7px 6px;display:flex;flex-direction:column;gap:3px}
.zakat-pdf-field{display:grid;grid-template-columns:14px minmax(0,1fr) minmax(0,1.05fr);gap:4px;align-items:end;font-size:8.5px;line-height:1.2;color:#1a2f35}
.zakat-pdf-ico{font-size:9px;line-height:1;color:#c5a059;text-align:center}
.zakat-pdf-lbl{font-weight:600;color:#173843;padding-bottom:2px}
.zakat-pdf-dots{display:flex;align-items:baseline;gap:3px;border-bottom:1px dotted rgba(23,56,67,.42);padding-bottom:1px;justify-content:flex-end;min-height:14px}
.zakat-pdf-cur{font-size:8px;color:#b8923a;font-weight:700}
.zakat-pdf-val{font-size:9px;font-weight:700;color:#173843;text-align:right;flex:1 1 auto}
.zakat-pdf-val-bold{font-size:10px;font-weight:800}
.zakat-pdf-checks{display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:4px;align-items:center;font-size:8.5px;margin-top:1px}
.zakat-pdf-checks .zakat-pdf-lbl{padding-bottom:0}
.zakat-pdf-check-group{display:flex;gap:10px;justify-content:flex-end;font-size:8.5px;font-weight:600;color:#173843}
.zakat-pdf-check{display:inline-flex;align-items:center;gap:3px}
.zakat-pdf-check .box{width:11px;height:11px;border:1.2px solid #173843;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;line-height:1;background:#fff;color:#173843}
.zakat-pdf-check .box.on{background:#173843;color:#f6f1e8}
.zakat-pdf-sec-highlight .zakat-pdf-field:last-child .zakat-pdf-dots{background:rgba(232,220,196,.85);border:1px solid #c5a059;border-radius:4px;padding:2px 4px;margin-top:1px}
.zakat-pdf-notes{position:relative;z-index:1;margin-top:7px;border:1.5px solid #c5a059;border-radius:8px;background:rgba(255,255,255,.42);overflow:hidden;flex:0 0 auto}
.zakat-pdf-notes .zakat-pdf-sec-body{padding:6px 8px 8px;min-height:52px;position:relative}
.zakat-pdf-note-line{border-bottom:1px dotted rgba(23,56,67,.35);min-height:13px;margin-bottom:4px;font-size:8.5px;line-height:1.35;color:#42565c}
.zakat-pdf-note-line:first-child{color:#173843;font-weight:600}
.zakat-pdf-note-deco{position:absolute;right:8px;bottom:6px;font-size:16px;color:#c5a059;opacity:.75}
.zakat-pdf-foot{margin-top:8px;flex:0 0 auto;background:#173843;color:#f6f1e8;text-align:center;padding:8px 10px;font:600 10px/1.3 Georgia,serif;letter-spacing:.06em;position:relative;z-index:1}`;
  }

  function buildPdfHtml(result, config, meta = {}) {
    const w = config.warnings || {};
    const origin = String(meta.siteOrigin || "https://dar-al-tawhid.de").replace(/\/$/, "");
    const exportedAt = meta.exportedAt || new Date().toISOString();
    const reportMeta = {
      reportId: meta.reportId || buildReportId(exportedAt),
      exportedAt,
      exportedAtLabel: formatPdfDateTime(exportedAt)
    };
    const input = meta.input || {};
    const prices = result.prices || getPrices(config, input.manualPrices || {});
    const nisab = result.nisab || {};
    const hawl = result.hawl || {};
    const currency = result.currency || "EUR";
    const priceUpdated = formatPdfDate(prices.verifiedAt || config.prices?.verifiedAt);
    const priceSource = prices.source || prices.provider || config.prices?.source || "—";
    const nisabSince = input.nisabSinceDate ? formatPdfDate(input.nisabSinceDate) : "—";
    const todayLabel = input.todayDate ? formatPdfDate(input.todayDate) : formatPdfDate(exportedAt);
    const periodLabel =
      input.nisabSinceDate && input.todayDate ? `${nisabSince} – ${todayLabel}` : `${nisabSince} – ${todayLabel}`;
    const ratePct = formatNumber(result.ratePercent || (Number(config.zakatRate) || 0.025) * 100, 2);
    const logo = `${origin}/logo-cream.jpg`;
    const wm = `${origin}/watermark-circle.png`;
    const disclaimer = w.disclaimer || w.privacy || "";
    const visitorName = String(meta.visitorName || meta.userName || "").trim() || "—";
    const createdBy = meta.createdBy || "DAR AL TAWHID Zakāt-Rechner";
    const zakatDuePlain = formatPdfMoneyPlain(result.zakatDue || 0, currency);
    const zakatObligatory = Boolean(result.zakatObligatory);
    const checkJa = zakatObligatory ? "on" : "";
    const checkNein = zakatObligatory ? "" : "on";
    const marketStand = priceUpdated !== "—" ? `${priceSource} · ${priceUpdated}` : priceSource;
    const exchangeRate = currency === "EUR" ? "1,00 (EUR)" : "—";
    const notes = [];
    if (result.statusMessage) notes.push(result.statusMessage);
    if (result.previewOnly) notes.push("Vorschau — keine rechtsverbindliche Feststellung.");
    (result.warnings || []).slice(0, 2).forEach((item) => {
      if (item?.text) notes.push(item.text);
    });
    if (disclaimer) notes.push(disclaimer);
    while (notes.length < 4) notes.push("");
    const corner = pdfCornerSvg();

    const section1 = pdfSection(
      1,
      "Übersicht",
      [
        pdfFieldRow("coins", "Gesamtvermögen (Brutto)", formatPdfMoneyPlain(result.totalWealth || 0, currency)),
        pdfFieldRow("minus", "Abzugsfähige Schulden", formatPdfMoneyPlain(result.debtsDue || 0, currency)),
        pdfFieldRow("check", "Reines Vermögen", formatPdfMoneyPlain(result.zakatableWealth || 0, currency)),
        pdfFieldRow("percent", "Zakat-Satz", `${ratePct} %`, { prefix: false }),
        `<div class="zakat-pdf-checks">
          <span class="zakat-pdf-ico">${pdfIcon("question")}</span>
          <span class="zakat-pdf-lbl">Zakat fällig?</span>
          <span class="zakat-pdf-check-group">
            <span class="zakat-pdf-check"><span class="box ${checkJa}">${checkJa ? "✓" : ""}</span> Ja</span>
            <span class="zakat-pdf-check"><span class="box ${checkNein}">${checkNein ? "✓" : ""}</span> Nein</span>
          </span>
        </div>`
      ].join("")
    );

    const section2 = pdfSection(
      2,
      "Niṣāb & Marktdaten",
      [
        pdfFieldRow(
          "scale",
          `Niṣāb (2,5 % von ${nisab.goldGrams || 85} g Gold)`,
          formatPdfMoneyPlain(nisab.goldEur || 0, currency)
        ),
        pdfFieldRow("gold", "Aktueller Goldpreis (pro g)", formatPdfMoneyPlain(prices.goldPerGramEur || 0, currency)),
        pdfFieldRow("coins", "Niṣāb in Ihrer Währung", formatPdfMoneyPlain(nisab.standardEur || 0, currency)),
        pdfFieldRow("info", "Marktquelle / Stand", marketStand, { prefix: false }),
        pdfFieldRow("exchange", "Wechselkurs (falls abweichend)", exchangeRate, { prefix: false })
      ].join("")
    );

    const section3 = pdfSection(
      3,
      "Berechnung",
      [
        pdfFieldRow("calc", "Reines Vermögen", formatPdfMoneyPlain(result.zakatableWealth || 0, currency)),
        pdfFieldRow("percent", "Zakat-Satz", `× ${ratePct} %`, { prefix: false }),
        pdfFieldRow("calc", "Berechnete Zakat", zakatDuePlain, { bold: true })
      ].join("")
    );

    const section4 = pdfSection(
      4,
      "Pflichtbetrag",
      [
        pdfFieldRow("calc", "Berechnete Zakat", zakatDuePlain),
        pdfFieldRow("dash", "Rundung / Anpassung", formatPdfMoneyPlain(0, currency)),
        pdfFieldRow("star", "Zakat-Pflichtbetrag", zakatDuePlain, { bold: true })
      ].join(""),
      "zakat-pdf-sec-highlight"
    );

    const section5 = `<article class="zakat-pdf-sec zakat-pdf-notes">
      <header class="zakat-pdf-sec-head"><span class="zakat-pdf-num">5</span><span class="zakat-pdf-sec-title">Notizen</span></header>
      <div class="zakat-pdf-sec-body">
        ${notes.map((line, i) => `<div class="zakat-pdf-note-line">${escapeHtml(line)}</div>`).join("")}
        <span class="zakat-pdf-note-deco">${pdfIcon("window")}</span>
      </div>
    </article>`;

    const page = `<section class="zakat-pdf-page">
      <div class="zakat-pdf-frame">
        <div class="zakat-pdf-corner tl">${corner}</div>
        <div class="zakat-pdf-corner tr">${corner}</div>
        <div class="zakat-pdf-corner bl">${corner}</div>
        <div class="zakat-pdf-corner br">${corner}</div>
        <div class="zakat-pdf-wm"><img src="${escapeHtml(wm)}" alt=""></div>
        <header class="zakat-pdf-hero">
          <img class="zakat-pdf-logo" src="${escapeHtml(logo)}" alt="DAR AL TAWHID">
          <h1>DAR AL TAWHID</h1>
          <div class="zakat-pdf-subtitle">Zakāt-Rechner Bericht</div>
        </header>
        <div class="zakat-pdf-infobox">
          ${pdfMetaField("calendar", "Berichtsdatum", formatPdfDate(exportedAt))}
          ${pdfMetaField("currency", "Währung", currency)}
          ${pdfMetaField("person", "Name", visitorName)}
          ${pdfMetaField("clock", "Berechnungszeitraum", periodLabel)}
          ${pdfMetaField("id", "Berichts-ID", reportMeta.reportId)}
          ${pdfMetaField("edit", "Erstellt von", createdBy)}
        </div>
        <div class="zakat-pdf-grid">
          ${section1}
          ${section2}
          ${section3}
          ${section4}
        </div>
        ${section5}
      </div>
      <footer class="zakat-pdf-foot">dar-al-tawhid.de</footer>
    </section>`;

    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Zakāt-Rechner Bericht — ${escapeHtml(reportMeta.reportId)}</title><style>${pdfStyles()}</style></head><body><div class="zakat-pdf-root">${page}</div></body></html>`;
  }

  global.DARZakat = {
    parseAmount,
    roundMoney,
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
    buildPdfFilename,
    buildReportId,
    TROY_OZ_TO_GRAM,
    DEFAULT_CONFIG
  };
})(typeof window !== "undefined" ? window : global);
