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

  function pdfStyles() {
    return `@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#e8e0d0}
.zakat-pdf-root{font-family:"Segoe UI",system-ui,sans-serif;color:#1a2f35}
.zakat-pdf-page{width:794px;min-height:1123px;margin:0 auto;padding:22px 24px 18px;background:#f6f1e8;border:3px double #c5a059;position:relative;page-break-after:always;break-after:page;overflow:hidden}
.zakat-pdf-page:last-child{page-break-after:auto}
.zakat-pdf-head{display:grid;grid-template-columns:92px 1fr 190px;gap:12px;align-items:start;margin-bottom:14px}
.zakat-pdf-logo{width:84px;height:84px;border-radius:50%;border:2px solid #c5a059;background:#fff;object-fit:cover}
.zakat-pdf-brand{text-align:center;padding-top:2px}
.zakat-pdf-brand h1{margin:0;font:700 28px/1.1 Georgia,"Times New Roman",serif;letter-spacing:.06em;color:#173843}
.zakat-pdf-brand .script{margin:6px 0 0;font:italic 22px/1.2 "Palatino Linotype","Book Antiqua",Palatino,serif;color:#173843}
.zakat-pdf-brand .rule{height:2px;background:linear-gradient(90deg,transparent,#c5a059,transparent);margin:8px auto 0;width:72%}
.zakat-pdf-meta{font-size:11px;line-height:1.55;color:#173843}
.zakat-pdf-meta b{color:#0f252c;font-weight:700}
.zakat-pdf-sec{margin-top:12px;border:2px solid #c5a059;background:rgba(255,255,255,.35)}
.zakat-pdf-sec-head{display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,#1f4f5d,#173843);color:#f6f1e8;font:700 13px/1.2 Georgia,serif;padding:8px 12px;text-align:center}
.zakat-pdf-spark{color:#d4b56a;font-size:11px}
.zakat-pdf-sec-body{padding:12px 14px}
.zakat-pdf-cols2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.zakat-pdf-kv{font-size:12px;line-height:1.65;color:#1a2f35}
.zakat-pdf-kv b{display:block;font-size:13px;color:#173843;margin-bottom:4px;font-family:Georgia,serif}
.zakat-pdf-highlight{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:10px 12px;background:#e8dcc4;border:1px solid #c5a059;font-weight:700;font-size:13px;color:#173843}
.zakat-pdf-hawl{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.zakat-pdf-hawl .cell{border:1px solid #c5a059;background:rgba(255,255,255,.45);padding:8px 10px;font-size:11px;line-height:1.45}
.zakat-pdf-hawl .cell b{display:block;font-size:11px;color:#173843;margin-bottom:4px}
.zakat-pdf-calc{position:relative;margin-top:12px;border:2px solid #c5a059;background:rgba(255,255,255,.42);padding:12px 14px}
.zakat-pdf-calc .wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:.06;pointer-events:none}
.zakat-pdf-calc .wm img{width:320px;height:320px;object-fit:contain}
.zakat-pdf-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(23,56,67,.12);font-size:12px;position:relative;z-index:1}
.zakat-pdf-row:last-child{border-bottom:0}
.zakat-pdf-row.total{margin-top:6px;padding:10px 12px;background:#e8dcc4;border:1px solid #c5a059;font-weight:800;font-size:14px;color:#173843}
.zakat-pdf-row.debt span:last-child{color:#7a2e2e}
.zakat-pdf-sources .zakat-pdf-kv ul{margin:6px 0 0;padding:0;list-style:none}
.zakat-pdf-sources .zakat-pdf-kv li{padding:3px 0 3px 14px;position:relative}
.zakat-pdf-sources .zakat-pdf-kv li:before{content:"◆";position:absolute;left:0;color:#c5a059;font-size:9px;top:5px}
.zakat-pdf-foot{margin-top:14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:linear-gradient(180deg,#1f4f5d,#173843);color:#f6f1e8;padding:10px 12px;font-size:10px;line-height:1.4}
.zakat-pdf-foot span{display:flex;align-items:center;gap:6px;justify-content:center;text-align:center}
.zakat-pdf-cover-main{text-align:center;padding:28px 16px 18px;border:2px solid #c5a059;background:rgba(255,255,255,.42);margin:18px 0 14px}
.zakat-pdf-cover-main .amount{font:700 42px/1.1 Georgia,serif;color:#173843;margin:8px 0}
.zakat-pdf-cover-main .status{font-size:13px;color:#1a2f35;max-width:520px;margin:0 auto;line-height:1.55}
.zakat-pdf-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.zakat-pdf-badge{border:1px solid #c5a059;background:rgba(255,255,255,.5);padding:10px;font-size:11px;line-height:1.45;text-align:center}
.zakat-pdf-badge b{display:block;font-size:12px;color:#173843;margin-bottom:4px}
.zakat-pdf-note{margin-top:12px;font-size:10px;line-height:1.55;color:#42565c;border-top:1px solid rgba(197,160,89,.45);padding-top:10px}`;
  }

  function renderPdfHeader(meta, page, totalPages, origin) {
    const logo = `${origin}/logo-cream.jpg`;
    return `<header class="zakat-pdf-head">
      <img class="zakat-pdf-logo" src="${escapeHtml(logo)}" alt="DAR AL TAWHID">
      <div class="zakat-pdf-brand">
        <h1>DAR AL TAWHID</h1>
        <div class="rule"></div>
        <div class="script">Zakāt-Rechner Bericht</div>
      </div>
      <div class="zakat-pdf-meta">
        <div><b>Berichts-ID:</b> ${escapeHtml(meta.reportId)}</div>
        <div><b>Seite:</b> ${page} / ${totalPages}</div>
        <div><b>Exportiert am:</b> ${escapeHtml(meta.exportedAtLabel)}</div>
      </div>
    </header>`;
  }

  function renderPdfFooter(meta, page, totalPages) {
    return `<footer class="zakat-pdf-foot">
      <span>📅 Erstellt am ${escapeHtml(meta.exportedAtLabel)}</span>
      <span>🕌 Exportiert über DAR AL TAWHID</span>
      <span>📄 Seite ${page} / ${totalPages}</span>
    </footer>`;
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
    const priceSource = prices.source || config.prices?.source || "—";
    const nisabSince = input.nisabSinceDate ? formatPdfDate(input.nisabSinceDate) : "—";
    const todayLabel = input.todayDate ? formatPdfDate(input.todayDate) : formatPdfDate(exportedAt);
    const hawlYes =
      hawl.fulfilled === true ? "Ja" : hawl.fulfilled === false ? "Nein" : "—";
    const statusLabel = result.previewOnly
      ? "Vorschau / nicht erfüllt"
      : result.finalResult
        ? "Abgeschlossen"
        : result.statusMessage || "In Bearbeitung";
    const savedLabel = meta.savedForVisitor ? "Ja" : "Nein";
    const liquid = result.modules?.cash ?? result.liquidWealth ?? 0;
    const goldVal = result.modules?.goldValue ?? 0;
    const silverVal = result.modules?.silverValue ?? 0;
    const ratePct = formatNumber(result.ratePercent || (Number(config.zakatRate) || 0.025) * 100, 2);
    const wm = `${origin}/watermark-circle.png`;
    const disclaimer = w.disclaimer || w.privacy || "";

    const page1 = `<section class="zakat-pdf-page">
      ${renderPdfHeader(reportMeta, 1, 2, origin)}
      <div class="zakat-pdf-sec">
        <div class="zakat-pdf-sec-head"><span class="zakat-pdf-spark">✦</span><span>Ergebnis &amp; Übersicht</span><span class="zakat-pdf-spark">✦</span></div>
        <div class="zakat-pdf-sec-body">
          <div class="zakat-pdf-cover-main">
            <div style="font-size:12px;color:#173843;font-weight:700;letter-spacing:.04em">Pflichtbetrag</div>
            <div class="amount">${escapeHtml(formatMoney(result.zakatDue, currency))}${result.previewOnly ? " *" : ""}</div>
            <p class="status">${escapeHtml(result.statusMessage || "Persönliche Zakāt-Berechnung nach Qurʾān &amp; Sunnah.")}</p>
          </div>
          <div class="zakat-pdf-badges">
            <div class="zakat-pdf-badge"><b>Niṣāb</b>${nisab.reached ? "Erreicht" : "Nicht erreicht"}<br>${escapeHtml(formatMoney(nisab.standardEur || 0, currency))}</div>
            <div class="zakat-pdf-badge"><b>Ḥawl</b>${escapeHtml(hawlYes)}<br>${escapeHtml(hawl.nextDueDate ? `Nächster Stichtag ${formatPdfDate(hawl.nextDueDate)}` : "Mondjahr prüfen")}</div>
            <div class="zakat-pdf-badge"><b>Vermögen</b>${escapeHtml(formatMoney(result.zakatableWealth || 0, currency))}<br>zakātpflichtig</div>
          </div>
          <p class="zakat-pdf-note">${escapeHtml(disclaimer)}${result.previewOnly ? " · * Vorschau — keine rechtsverbindliche Feststellung." : ""}</p>
        </div>
      </div>
      ${renderPdfFooter(reportMeta, 1, 2)}
    </section>`;

    const page2 = `<section class="zakat-pdf-page">
      ${renderPdfHeader(reportMeta, 2, 2, origin)}
      <div class="zakat-pdf-sec">
        <div class="zakat-pdf-sec-head"><span class="zakat-pdf-spark">✦</span><span>Marktdaten &amp; Niṣāb</span><span class="zakat-pdf-spark">✦</span></div>
        <div class="zakat-pdf-sec-body">
          <div class="zakat-pdf-cols2">
            <div class="zakat-pdf-kv"><b>Gold</b>
              Preis je Gramm: ${escapeHtml(formatMoney(prices.goldPerGramEur || 0, currency))}<br>
              Niṣāb ${nisab.goldGrams || 85} g: ${escapeHtml(formatMoney(nisab.goldEur || 0, currency))}<br>
              Preisquelle: ${escapeHtml(priceSource)}<br>
              Aktualisiert am: ${escapeHtml(priceUpdated)}
            </div>
            <div class="zakat-pdf-kv"><b>Silber</b>
              Preis je Gramm: ${escapeHtml(formatMoney(prices.silverPerGramEur || 0, currency))}<br>
              Niṣāb ${nisab.silverGrams || 595} g: ${escapeHtml(formatMoney(nisab.silverEur || 0, currency))}<br>
              Preisquelle: ${escapeHtml(priceSource)}<br>
              Aktualisiert am: ${escapeHtml(priceUpdated)}
            </div>
          </div>
          <div class="zakat-pdf-highlight"><span>Standard-Niṣāb (vorsichtiger Wert)</span><span>${escapeHtml(formatMoney(nisab.standardEur || 0, currency))}</span></div>
        </div>
      </div>
      <div class="zakat-pdf-sec">
        <div class="zakat-pdf-sec-head"><span class="zakat-pdf-spark">✦</span><span>Ḥawl &amp; Zeitbezug</span><span class="zakat-pdf-spark">✦</span></div>
        <div class="zakat-pdf-hawl">
          <div class="cell"><b>Niṣāb erreicht seit</b>${escapeHtml(nisabSince)}</div>
          <div class="cell"><b>Stichtag heute</b>${escapeHtml(todayLabel)}</div>
          <div class="cell"><b>Mondjahr erfüllt</b>${escapeHtml(hawlYes)}</div>
          <div class="cell"><b>Status</b>${escapeHtml(statusLabel)}</div>
        </div>
      </div>
      <div class="zakat-pdf-sec">
        <div class="zakat-pdf-sec-head"><span class="zakat-pdf-spark">✦</span><span>Rechenweg im Detail</span><span class="zakat-pdf-spark">✦</span></div>
        <div class="zakat-pdf-calc">
          <div class="wm"><img src="${escapeHtml(wm)}" alt=""></div>
          <div class="zakat-pdf-row"><span>Summe liquide Mittel</span><span>${escapeHtml(formatMoney(liquid, currency))}</span></div>
          <div class="zakat-pdf-row"><span>Gold</span><span>${escapeHtml(formatMoney(goldVal, currency))}</span></div>
          <div class="zakat-pdf-row"><span>Silber</span><span>${escapeHtml(formatMoney(silverVal, currency))}</span></div>
          <div class="zakat-pdf-row"><span>Zwischensumme Vermögen</span><span>${escapeHtml(formatMoney(result.totalWealth || 0, currency))}</span></div>
          <div class="zakat-pdf-row debt"><span>Kurzfristig fällige Schulden</span><span>-${escapeHtml(formatMoney(result.debtsDue || 0, currency))}</span></div>
          <div class="zakat-pdf-row"><span>Zakātpflichtiges Vermögen</span><span>${escapeHtml(formatMoney(result.zakatableWealth || 0, currency))}</span></div>
          <div class="zakat-pdf-row"><span>Satz ${ratePct} %</span><span>${escapeHtml(formatMoney(result.zakatDue || 0, currency))}</span></div>
          <div class="zakat-pdf-row total"><span>Pflichtbetrag</span><span>${escapeHtml(formatMoney(result.zakatDue || 0, currency))}</span></div>
        </div>
      </div>
      <div class="zakat-pdf-sec zakat-pdf-sources">
        <div class="zakat-pdf-sec-head"><span class="zakat-pdf-spark">✦</span><span>Authentische Quellen &amp; Belegübersicht</span><span class="zakat-pdf-spark">✦</span></div>
        <div class="zakat-pdf-sec-body zakat-pdf-cols2">
          <div class="zakat-pdf-kv"><b>Quellenrahmen</b><ul>
            <li>Qurʾān</li><li>Sunnah</li><li>Salaf</li><li>Āthār</li><li>Fiqh-Referenzen</li>
          </ul></div>
          <div class="zakat-pdf-kv"><b>Belege / Export</b>
            Exportformat: PDF<br>
            Gespeichert für Besucher: ${escapeHtml(savedLabel)}<br>
            Berichtsstatus: ${escapeHtml(statusLabel)}
          </div>
        </div>
      </div>
      ${renderPdfFooter(reportMeta, 2, 2)}
    </section>`;

    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Zakāt-Rechner Bericht — ${escapeHtml(reportMeta.reportId)}</title><style>${pdfStyles()}</style></head><body><div class="zakat-pdf-root">${page1}${page2}</div></body></html>`;
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
