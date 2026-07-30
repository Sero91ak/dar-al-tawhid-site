/**
 * DAR AL TAWḤĪD — Zakāt-Rechner UI (Besucher-App)
 */
(function (global) {
  "use strict";

  const CONFIG_PATH = "/content/admin/zakat-config.json";
  const DEFAULT_PRICES_URL = "https://dar-admin-publisher.sero91ak.workers.dev/api/zakat/prices";
  const DEBOUNCE_MS = 250;

  let zakatConfig = null;
  let zakatConfigLoaded = false;
  let zakatLivePrices = null;
  let zakatPricesLoading = false;
  let zakatPricesError = "";
  let zakatInput = defaultInput();
  let zakatSourceTab = "quran";
  let zakatManualOpen = false;
  let zakatSections = defaultSections();

  const SOURCE_TABS = [
    { id: "quran", label: "Qurʾān", short: "Qurʾān" },
    { id: "sunnah", label: "Sunnah", short: "Sunnah" },
    { id: "salaf", label: "Salaf", short: "Salaf" },
    { id: "athar", label: "Āthār", short: "Āthār" },
    { id: "fiqh", label: "Fiqh", short: "Fiqh" }
  ];

  const TAB_SOURCE_ORDER = {
    quran: ["quran-zakat-obligation", "quran-zakat-righteous"],
    sunnah: ["sunnah-nisab-gold", "sunnah-nisab-silver", "sunnah-zakat-rate", "sunnah-hawl"],
    athar: ["athar-abu-bakr-zakat", "athar-ibn-abbas-zakat-yemen", "athar-ibn-umar-zakat-purifier"],
    salaf: ["salaf-ahmad-sahihayn", "salaf-nisab-silver-preference"],
    fiqh: [
      "fiqh-nisab-standard-kasani",
      "salaf-ibn-qudamah-hawl",
      "fiqh-debts-deductible",
      "fiqh-jewelry-hanafi",
      "fiqh-jewelry-majority"
    ]
  };
  let zakatHistory = [];
  let zakatDebounceTimer = null;

  function defaultSections() {
    return {
      liquids: true,
      metals: false,
      prices: false,
      hawl: false,
      sources: false,
      details: false,
      steps: false
    };
  }

  function defaultInput() {
    return {
      cash: "",
      bank: "",
      digital: "",
      otherLiquid: "",
      goldGrams: "",
      goldValueManual: "",
      goldType: "investment",
      silverGrams: "",
      silverValueManual: "",
      debtsDue: "",
      nisabSinceDate: "",
      todayDate: new Date().toISOString().slice(0, 10),
      manualPrices: { goldPerGramEur: "", silverPerGramEur: "" }
    };
  }

  function $(id) {
    return global.document.getElementById(id);
  }

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "");
  }

  /** Mobile: Zahlentastatur (nicht Buchstaben) — Komma/Punkt für Dezimalwerte */
  function zakatNumInputAttrs() {
    return 'type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"';
  }

  function pricesApiUrl() {
    const worker = global.PRAYER_PUSH_WORKER_URL || global.DAR_WORKER_URL || "";
    if (worker) return `${String(worker).replace(/\/$/, "")}/api/zakat/prices`;
    return global.DAR_ZAKAT_PRICES_URL || DEFAULT_PRICES_URL;
  }

  function isZakatRoute() {
    const route = global.readRoute?.() || global.currentRoute;
    return route?.view === "zakat";
  }

  async function loadZakatConfig(force) {
    if (zakatConfigLoaded && !force) return zakatConfig;
    const bust = Date.now();
    const urls = [
      `${CONFIG_PATH}?v=${bust}`,
      `https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main${CONFIG_PATH}?v=${bust}`
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        zakatConfig = global.DARZakat?.normalizeConfig(await r.json()) || null;
        zakatConfigLoaded = !!zakatConfig;
        return zakatConfig;
      } catch (e) {
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[dar-zakat] config fetch failed for " + url + ", trying next source", e);
        }
      }
    }
    zakatConfig = global.DARZakat?.normalizeConfig({}) || null;
    zakatConfigLoaded = true;
    return zakatConfig;
  }

  async function loadZakatPrices(force) {
    if (zakatLivePrices && !force) {
      const fetchedAt = Date.parse(zakatLivePrices.fetchedAt || "");
      const stale = !Number.isFinite(fetchedAt) || Date.now() - fetchedAt >= 15 * 60 * 1000;
      if (!stale) return zakatLivePrices;
    }
    zakatPricesLoading = true;
    zakatPricesError = "";
    try {
      const r = await fetch(`${pricesApiUrl()}?v=${Date.now()}`, { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Preisabruf HTTP ${r.status}`);
      zakatLivePrices = data;
      if (zakatConfig && global.DARZakat?.mergeLivePrices) {
        zakatConfig = global.DARZakat.mergeLivePrices(zakatConfig, data);
      }
      return data;
    } catch (e) {
      zakatPricesError = e.message || String(e);
      return null;
    } finally {
      zakatPricesLoading = false;
    }
  }

  function effectiveConfig() {
    if (!zakatConfig) return null;
    if (zakatLivePrices && global.DARZakat?.mergeLivePrices) {
      return global.DARZakat.mergeLivePrices(zakatConfig, zakatLivePrices);
    }
    return zakatConfig;
  }

  function currentResult() {
    const cfg = effectiveConfig();
    if (!global.DARZakat || !cfg) return null;
    return global.DARZakat.computeZakat(zakatInput, cfg);
  }

  function hasAnyInput() {
    const i = zakatInput;
    return [
      i.cash, i.bank, i.digital, i.otherLiquid,
      i.goldGrams, i.goldValueManual, i.silverGrams, i.silverValueManual, i.debtsDue
    ].some((v) => global.DARZakat?.parseAmount(v) > 0);
  }

  function statusPill(ok, yes, no) {
    const cls = ok ? "zakat-pill ok" : ok === false ? "zakat-pill warn" : "zakat-pill muted";
    return `<span class="${cls}">${esc(ok ? yes : ok === false ? no : "—")}</span>`;
  }

  function resultBanner(result) {
    if (!result) return "";
    const cls =
      result.zakatObligatory ? "zakat-banner ok"
        : result.previewOnly ? "zakat-banner preview"
          : result.resultCase === "A" ? "zakat-banner calm"
            : result.resultCase === "D" ? "zakat-banner warn"
              : "zakat-banner neutral";
    return `<div class="zakat-banner ${cls}"><span class="zakat-banner-label">${esc(result.statusMessage || "Berechnung bereit")}</span></div>`;
  }

  function priceBadge(prices) {
    if (zakatPricesLoading) return `<span class="zakat-pill muted">Preise laden …</span>`;
    const fresh = prices?.freshness;
    if (fresh?.level === "realtime") return `<span class="zakat-pill ok">${esc(fresh.label || "Echtzeit geprüft")}</span>`;
    if (fresh?.badge === "ok") return `<span class="zakat-pill ok">${esc(fresh.label || "Preisquelle geprüft")}</span>`;
    if (fresh?.badge === "warn") return `<span class="zakat-pill warn">${esc(fresh.label || "Preis mit Hinweis")}</span>`;
    if (prices?.hasAnyPrice) return `<span class="zakat-pill warn">Preisquelle mit Hinweis</span>`;
    return `<span class="zakat-pill warn">Preisquelle wird geladen</span>`;
  }

  function renderPriceRow(label, meta, grams, currency) {
    if (zakatPricesLoading) {
      return `<div class="zakat-price-row"><div class="zakat-price-head"><span>${esc(label)}</span><span class="zakat-price-tag">Niṣāb ${grams} g</span></div><div class="zakat-skeleton"><span class="zakat-skel-line"></span><span class="zakat-skel-line short"></span></div></div>`;
    }
    if (!meta?.pricePerGram) {
      return `<div class="zakat-price-row muted-row"><div class="zakat-price-head"><span>${esc(label)}</span><span class="zakat-price-tag">Niṣāb ${grams} g</span></div><p class="zakat-muted">Wird geladen …</p></div>`;
    }
    return `<div class="zakat-price-row">
      <div class="zakat-price-head"><span>${esc(label)}</span><span class="zakat-price-tag">Niṣāb ${grams} g</span></div>
      <div class="zakat-price-metrics">
        <div><span>€/g</span><b>${global.DARZakat.formatMoney(meta.pricePerGram, currency)}</b></div>
        <div><span>Niṣāb</span><b>${global.DARZakat.formatMoney(meta.nisabEur, currency)}</b></div>
      </div>
      <p class="zakat-muted">${esc(meta.source || "—")} · ${esc(global.DARZakat.formatDateTime(meta.fetchedAt))}</p>
    </div>`;
  }

  function renderLiquidBreakdown(result) {
    const b = result?.modules?.cashBreakdown;
    if (!b || !result.liquidWealth) return "";
    const rows = [
      ["Bargeld", b.physical],
      ["Bank", b.bank],
      ["Digital", b.digital],
      ["Sonstige", b.other]
    ].filter(([, v]) => v > 0);
    if (!rows.length) return "";
    return `<div class="zakat-liquid-grid">${rows.map(([l, v]) => `<div class="zakat-liquid-item"><span>${esc(l)}</span><b>${global.DARZakat.formatMoney(v, result.currency)}</b></div>`).join("")}<div class="zakat-liquid-item total"><span>Summe liquide</span><b>${global.DARZakat.formatMoney(result.liquidWealth, result.currency)}</b></div></div>`;
  }

  function configSources(cfg) {
    return (cfg?.sources || []).filter((s) => s && s.active !== false && s.verified !== false);
  }

  function sourceTabsOf(s) {
    if (Array.isArray(s.sourceTabs) && s.sourceTabs.length) return s.sourceTabs;
    if (s.category === "Qurʾān") return ["quran"];
    if (s.category === "Salaf") return ["salaf"];
    if (s.category === "Āthār") return ["athar"];
    if (s.category === "Fiqh-Anwendung") return ["fiqh"];
    if (s.category === "Sunnah") return ["sunnah"];
    return ["sunnah"];
  }

  function sourcesForTab(sources, tab) {
    const list = sources.filter((s) => sourceTabsOf(s).includes(tab));
    const order = TAB_SOURCE_ORDER[tab];
    if (!order?.length) return list;
    const rank = new Map(order.map((id, i) => [id, i]));
    return list.slice().sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : 999;
      const rb = rank.has(b.id) ? rank.get(b.id) : 999;
      if (ra !== rb) return ra - rb;
      return String(a.reference || a.id).localeCompare(String(b.reference || b.id), "de");
    });
  }

  function sourceTabIntro(tab) {
    const intros = {
      quran: "Grundlage aus dem Qurʾān.",
      sunnah: "Authentische Sunnah — Niṣāb, Satz, Ḥawl.",
      salaf: "Verständnis der Salaf as-Ṣāliḥīn.",
      athar: "Gesicherte Āthār — arabische Texte.",
      fiqh: "Vorsichtige Fiqh-Anwendung bei Ikhtilāf."
    };
    return intros[tab] || "";
  }

  function trustLabel(s) {
    if (s.trust === "sahih") return "Ṣaḥīḥ";
    if (s.trust === "mutawatir") return "Mutawātir";
    if (s.trust === "fiqh") return "Fiqh";
    if (s.trust === "manhaj") return "Manhaj";
    if (s.trust === "ijma") return "Ijmāʿ";
    return "";
  }

  function renderSourceCard(s, tab) {
    const trust = trustLabel(s);
    const trustCls = s.trust === "fiqh" ? "fiqh" : s.trust === "manhaj" || s.trust === "ijma" ? "manhaj" : "";
    const showArabic = tab === "athar" || tab === "quran" || (tab === "sunnah" && s.arabic) || (tab === "salaf" && s.arabic);
    const note = s.explanation && s.german && s.explanation !== s.german ? s.explanation : "";
    const title = s.reference || s.work || s.category || "Quelle";
    const cat = s.category && s.category !== title ? s.category : "";
    return `<details class="zakat-source-card">
      <summary class="zakat-source-summary">
        <span class="zakat-source-summary-title">${esc(title)}</span>
        <span class="zakat-source-summary-badges">
          ${cat ? `<span class="zakat-source-cat">${esc(cat)}</span>` : ""}
          ${trust ? `<span class="zakat-source-trust ${trustCls}">${esc(trust)}</span>` : ""}
          <span class="zakat-source-open-hint">Antippen</span>
        </span>
      </summary>
      <div class="zakat-source-body">
        <div class="zakat-source-meta"><span class="zakat-source-cat">${esc(s.work || s.category)}</span></div>
        ${showArabic && s.arabic ? `<div class="zakat-ar">${esc(s.arabic)}</div>` : ""}
        <p class="zakat-source-text">${esc(s.german || s.explanation || "")}</p>
        ${note ? `<p class="zakat-source-note">${esc(note)}</p>` : ""}
        ${s.link ? `<a class="zakat-source-link" href="${esc(s.link)}" target="_blank" rel="noopener">Quelle öffnen ↗</a>` : ""}
      </div>
    </details>`;
  }

  function renderAccordion(id, title, kicker, body, preview) {
    const open = !!zakatSections[id];
    const previewLine = !open && preview ? `<div class="zakat-acc-preview-line">${preview}</div>` : "";
    return `<section class="zakat-acc app-card app-card--zakat premium-surface ${open ? "is-open" : "is-closed"}" data-zakat-acc="${esc(id)}">
      <button type="button" class="zakat-acc-head card-header card-header--row" data-zakat-section="${esc(id)}" aria-expanded="${open}">
        <div class="zakat-acc-copy card-header__copy">
          ${kicker ? `<span class="zakat-acc-kicker card-label">${esc(kicker)}</span>` : ""}
          <h3 class="card-title">${esc(title)}</h3>
          ${previewLine}
        </div>
        <span class="zakat-acc-chevron ${open ? "open" : ""}" aria-hidden="true"></span>
      </button>
      ${open ? `<div class="zakat-acc-body"><div class="zakat-acc-body-inner">${body}</div></div>` : ""}
    </section>`;
  }

  function renderSourceHub(cfg) {
    const sources = configSources(cfg);
    const tabSources = sourcesForTab(sources, zakatSourceTab);
    const tabs = SOURCE_TABS.map(
      (t) =>
        `<button type="button" class="zakat-source-tab ${zakatSourceTab === t.id ? "active" : ""}" data-zakat-source-tab="${esc(t.id)}" aria-pressed="${zakatSourceTab === t.id}">${esc(t.label)}</button>`
    ).join("");

    const body = `<div class="zakat-source-tabs" role="tablist">${tabs}</div>
      <p class="zakat-source-intro">${esc(sourceTabIntro(zakatSourceTab))}</p>
      <div class="zakat-source-list">${tabSources.length ? tabSources.map((s) => renderSourceCard(s, zakatSourceTab)).join("") : `<p class="zakat-muted">Keine Belege in dieser Kategorie.</p>`}</div>`;

    const preview = `<span class="zakat-muted">Qurʾān · Sunnah · Salaf · Āthār · Fiqh — mit Referenzen</span>`;

    return renderAccordion("sources", "Authentische Quellen", "Geprüfte Belege", body, preview);
  }

  function renderZakatSteps(result) {
    if (!result?.steps?.length) return `<p class="zakat-muted">Noch keine Eingaben.</p>`;
    return result.steps
      .map(
        (s, i) => `<div class="zakat-step ${s.highlight ? "highlight" : ""} ${s.preview ? "preview" : ""}">
      <span class="zakat-step-num">${i + 1}</span>
      <span class="zakat-step-label">${esc(s.label)}</span>
      <strong>${global.DARZakat.formatMoney(s.value, result.currency)}</strong>
      <small>${esc(s.detail || "")}</small>
    </div>`
      )
      .join("");
  }

  function renderResultStrip(result) {
    const amount = result ? global.DARZakat.formatMoney(result.zakatDue, result.currency) : "0,00 €";
    const sub = result
      ? result.previewOnly ? "Vorschau" : result.zakatObligatory ? "Zakāt fällig" : result.resultCase === "A" ? "Keine Zakāt fällig" : "Live berechnet"
      : "Zahlen eingeben — Ergebnis live";
    const badges = result
      ? `${result.previewOnly ? `<span class="zakat-pill preview">Vorschau</span>` : ""}${result.zakatObligatory ? `<span class="zakat-pill ok">Zakāt fällig</span>` : ""}`
      : "";
    return `<section class="zakat-result-strip premium-surface">
      <div class="zakat-strip-head"><span class="zakat-strip-kicker">Amānah · vertraulich</span><h2 class="zakat-strip-title">Zakāt-Rechner</h2><span class="zakat-strip-sub">Qurʾān · Sunnah · live</span></div>
      ${result ? resultBanner(result) : ""}
      <span class="zakat-result-label">Pflichtbetrag</span>
      <div class="zakat-result-amount">${amount}</div>
      <div class="zakat-result-strip-meta"><span class="zakat-result-sub">${esc(sub)}</span>${badges ? `<div class="zakat-head-badges">${badges}</div>` : ""}</div>
    </section>`;
  }

  function renderZakat() {
    const cfg = effectiveConfig() || global.DARZakat?.DEFAULT_CONFIG || {};
    const result = global.DARZakat ? currentResult() : null;
    const w = cfg.warnings || {};
    const prices = result?.prices || {};
    const session = global.accountSession?.() || null;
    const live = zakatLivePrices || {};
    const goldMeta = live.gold || cfg.livePriceMeta?.gold || null;
    const silverMeta = live.silver || cfg.livePriceMeta?.silver || null;

    const warnings = (result?.warnings || [])
      .map((x) => `<div class="zakat-warn">${esc(x.text)}</div>`)
      .join("");

    const num = zakatNumInputAttrs();
    const liquidsBody = `<div class="zakat-form-grid">
        <label>Bargeld<input class="field zakat-field zakat-num" id="zakatCash" ${num} value="${esc(zakatInput.cash)}" placeholder="0,00"></label>
        <label>Bank<input class="field zakat-field zakat-num" id="zakatBank" ${num} value="${esc(zakatInput.bank)}" placeholder="0,00"></label>
        <label>PayPal / digital<input class="field zakat-field zakat-num" id="zakatDigital" ${num} value="${esc(zakatInput.digital)}" placeholder="0,00"></label>
        <label>Sonstige liquide<input class="field zakat-field zakat-num" id="zakatOtherLiquid" ${num} value="${esc(zakatInput.otherLiquid)}" placeholder="0,00"></label>
      </div>`;

    const metalsBody = `<div class="zakat-form-grid zakat-form-grid-3">
        <label>Gold (g)<input class="field zakat-field zakat-num" id="zakatGoldGrams" ${num} value="${esc(zakatInput.goldGrams)}" placeholder="0"></label>
        <label>Silber (g)<input class="field zakat-field zakat-num" id="zakatSilverGrams" ${num} value="${esc(zakatInput.silverGrams)}" placeholder="0"></label>
        <label>Gold-Art<select class="field zakat-field" id="zakatGoldType"><option value="investment" ${zakatInput.goldType === "investment" ? "selected" : ""}>Anlage</option><option value="jewelry" ${zakatInput.goldType === "jewelry" ? "selected" : ""}>Schmuck</option><option value="other" ${zakatInput.goldType === "other" ? "selected" : ""}>Sonstiges</option></select></label>
      </div>
      <div class="zakat-form-grid">
        <label>Gold manuell (optional)<input class="field zakat-field zakat-num" id="zakatGoldManual" ${num} value="${esc(zakatInput.goldValueManual)}" placeholder="€"></label>
        <label>Silber manuell (optional)<input class="field zakat-field zakat-num" id="zakatSilverManual" ${num} value="${esc(zakatInput.silverValueManual)}" placeholder="€"></label>
      </div>
      <div class="zakat-subsection-label">Schulden</div>
      <label>Kurzfristig fällig<input class="field zakat-field zakat-num" id="zakatDebts" ${num} value="${esc(zakatInput.debtsDue)}" placeholder="0,00"></label>`;

    const metalsPreview = `<span class="zakat-muted">Gold · Silber · Schulden — optional</span>`;

    const pricePanelIntro = zakatPricesLoading
      ? `<p class="zakat-muted zakat-loading-msg">Niṣāb-Werte laden …</p>`
      : prices.freshness?.level === "realtime"
        ? `<p class="zakat-muted zakat-loading-msg ok">Echtzeit geprüft</p>`
        : zakatPricesError
          ? `<p class="zakat-warn">Preisabruf: ${esc(zakatPricesError)}</p>`
          : "";

    const pricesBody = `${pricePanelIntro}
      <div class="zakat-price-grid">${renderPriceRow("Gold", goldMeta, 85, "EUR")}${renderPriceRow("Silber", silverMeta, 595, "EUR")}</div>
      <p class="zakat-standard-line">Standard-Niṣāb: <b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result?.nisab?.standardEur || live.standardNisabEur || 0, "EUR") : "—"}</b></p>
      <details class="zakat-manual-prices" ${zakatManualOpen ? "open" : ""}>
        <summary>Notfall: Preise manuell</summary>
        <div class="zakat-form-grid">
          <label>Gold €/g<input class="field zakat-field zakat-num" id="zakatManualGoldPrice" ${num} value="${esc(zakatInput.manualPrices.goldPerGramEur)}" placeholder="Notfall"></label>
          <label>Silber €/g<input class="field zakat-field zakat-num" id="zakatManualSilverPrice" ${num} value="${esc(zakatInput.manualPrices.silverPerGramEur)}" placeholder="Notfall"></label>
        </div>
      </details>`;

    const pricesPreview = prices.hasAnyPrice
      ? `<span class="zakat-muted">Niṣāb ${global.DARZakat.formatMoney(result?.nisab?.standardEur || live.standardNisabEur || 0, "EUR")}</span> ${priceBadge(prices)}`
      : `<span class="zakat-muted">Echtzeit-Niṣāb — antippen</span>`;

    const hawlBody = `<div class="zakat-form-grid">
        <label>Niṣāb seit<input class="field zakat-field" id="zakatNisabSince" type="date" value="${esc(zakatInput.nisabSinceDate)}"></label>
        <label>Stichtag<input class="field zakat-field" id="zakatToday" type="date" value="${esc(zakatInput.todayDate)}"></label>
      </div>
      ${result?.hawl?.nextDueDate ? `<p class="zakat-muted">Nächster Termin: ${esc(result.hawl.nextDueDate)}${result.hawl.daysRemaining != null && !result.hawl.fulfilled ? ` · ${esc(String(result.hawl.daysRemaining))} Tage` : ""}</p>` : `<p class="zakat-muted">Optional — ohne Datum nur Vorschau.</p>`}`;

    const hawlPreview = result?.hawl?.fulfilled
      ? `<span class="zakat-pill ok">Ḥawl erfüllt</span>`
      : result?.hawl?.fulfilled === false
        ? `<span class="zakat-pill warn">Ḥawl offen</span>`
        : `<span class="zakat-muted">Ḥawl optional</span>`;

    const detailsBody = result
      ? `<div class="zakat-kpi-grid">
        <div class="zakat-kpi"><span>Gesamt</span><b>${global.DARZakat.formatMoney(result.totalWealth, result.currency)}</b></div>
        <div class="zakat-kpi"><span>Pflichtig</span><b>${global.DARZakat.formatMoney(result.zakatableWealth, result.currency)}</b></div>
        <div class="zakat-kpi accent"><span>Schulden</span><b>${global.DARZakat.formatMoney(result.debtsDue, result.currency)}</b></div>
      </div>
      ${renderLiquidBreakdown(result)}
      <div class="zakat-status-row">
        ${statusPill(prices.hasAnyPrice ? result.nisab.reached : null, "Niṣāb erreicht", "Niṣāb nicht erreicht")}
        ${statusPill(result.hawl.fulfilled, "Ḥawl erfüllt", result.hawl.fulfilled === false ? "Ḥawl offen" : "Ḥawl —")}
        ${priceBadge(prices)}
      </div>
      <div class="zakat-nisab-compare">
        <div><span>Silber 595 g</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.silverEur, result.currency) : "—"}</b></div>
        <div><span>Gold 85 g</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.goldEur, result.currency) : "—"}</b></div>
        <div class="standard"><span>Standard</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.standardEur, result.currency) : "—"}</b></div>
      </div>
      ${warnings}`
      : `<p class="zakat-muted">Details erscheinen nach Eingabe.</p>`;

    const detailsPreview = result && hasAnyInput()
      ? `<span class="zakat-muted">Vermögen ${global.DARZakat.formatMoney(result.totalWealth, result.currency)}</span>`
      : `<span class="zakat-muted">KPI · Niṣāb · Aufschlüsselung</span>`;

    const stepsBody = result
      ? `<div class="zakat-steps">${renderZakatSteps(result)}</div>`
      : `<p class="zakat-muted">Rechenweg nach Eingabe.</p>`;

    const stepsPreview = result?.steps?.length
      ? `<span class="zakat-muted">${result.steps.length} Schritte · ${global.DARZakat.formatNumber(result.ratePercent, 2)} %</span>`
      : `<span class="zakat-muted">Transparente Schritte</span>`;

    const historyBlock =
      session && zakatHistory.length
        ? `<section class="zakat-acc app-card app-card--zakat premium-surface is-open"><div class="zakat-acc-head card-header card-header--row" style="pointer-events:none"><div class="zakat-acc-copy card-header__copy"><span class="zakat-acc-kicker card-label">Account</span><h3 class="card-title">Mein Verlauf</h3></div><span class="zakat-acc-chevron open" aria-hidden="true"></span></div><div class="zakat-acc-body"><div class="zakat-acc-body-inner"><div class="zakat-panel-head" style="border:0;padding:0;margin:0 0 10px"><h3 style="font-size:1rem">Einträge</h3><span>${zakatHistory.length}</span></div>
      <div class="zakat-history">${zakatHistory
          .map(
            (h) => `<div class="zakat-history-row"><span>${esc(h.zakat_year || h.calculated_at?.slice(0, 10) || "")}</span><b>${global.DARZakat.formatMoney(h.zakat_due, result?.currency || "EUR")}</b><button type="button" class="zakat-mini-btn" data-zakat-delete="${esc(h.id)}">Löschen</button></div>`
          )
          .join("")}</div></div></div></section>`
        : "";

    return `<div class="zakat-view">
    <div class="zakat-shell">
    ${renderResultStrip(result)}
    ${renderAccordion("liquids", "Liquide Mittel", "1 · Eingabe", liquidsBody, "")}
    ${renderAccordion("metals", "Edelmetalle & Schulden", "2 · optional", metalsBody, metalsPreview)}
    ${renderAccordion("prices", "Niṣāb & Echtzeitpreise", "3 · Marktdaten", pricesBody, pricesPreview)}
    ${renderAccordion("hawl", "Ḥawl", "4 · Mondjahr", hawlBody, hawlPreview)}
    ${renderSourceHub(cfg)}
    ${hasAnyInput() ? renderAccordion("details", "Ergebnis-Details", "Aufschlüsselung", detailsBody, detailsPreview) : ""}
    ${renderAccordion("steps", "Rechenweg", "5 · Transparenz", stepsBody, stepsPreview)}
    <section class="zakat-actions zakat-actions-compact">
      <button type="button" class="zakat-btn" id="zakatClearBtn">Zurücksetzen</button>
      <button type="button" class="zakat-btn" id="zakatPdfBtn">PDF</button>
      ${session ? `<button type="button" class="zakat-btn primary" id="zakatSaveBtn">Speichern</button>` : `<button type="button" class="zakat-btn" data-nav="account">Anmelden</button>`}
    </section>
    ${historyBlock}
    <p class="zakat-footer">${esc(w.footer || w.privacy || "")}</p>
    </div>
    </div>`;
  }

  function readInputFromDom() {
    zakatInput = {
      ...zakatInput,
      cash: $("zakatCash")?.value ?? "",
      bank: $("zakatBank")?.value ?? "",
      digital: $("zakatDigital")?.value ?? "",
      otherLiquid: $("zakatOtherLiquid")?.value ?? "",
      goldGrams: $("zakatGoldGrams")?.value ?? "",
      goldValueManual: $("zakatGoldManual")?.value ?? "",
      goldType: $("zakatGoldType")?.value || "investment",
      silverGrams: $("zakatSilverGrams")?.value ?? "",
      silverValueManual: $("zakatSilverManual")?.value ?? "",
      debtsDue: $("zakatDebts")?.value ?? "",
      nisabSinceDate: $("zakatNisabSince")?.value ?? "",
      todayDate: $("zakatToday")?.value ?? new Date().toISOString().slice(0, 10),
      manualPrices: {
        goldPerGramEur: $("zakatManualGoldPrice")?.value ?? "",
        silverPerGramEur: $("zakatManualSilverPrice")?.value ?? ""
      }
    };
    const details = document.querySelector(".zakat-manual-prices");
    if (details) zakatManualOpen = details.open;
  }

  function zakatRenderPreserve() {
    if (global.DARScrollManager?.preserveNextRender) global.DARScrollManager.preserveNextRender();
    else global.__preserveScrollOnRender = true;
    global.render?.();
  }

  function scheduleRender() {
    if (zakatDebounceTimer) clearTimeout(zakatDebounceTimer);
    zakatDebounceTimer = setTimeout(() => {
      zakatDebounceTimer = null;
      readInputFromDom();
      zakatRenderPreserve();
    }, DEBOUNCE_MS);
  }

  function resetZakatInput() {
    if (zakatDebounceTimer) {
      clearTimeout(zakatDebounceTimer);
      zakatDebounceTimer = null;
    }
    zakatInput = defaultInput();
    zakatSections = defaultSections();
    zakatSourceTab = "quran";
    zakatManualOpen = false;
  }

  function installZakatDelegation() {
    if (installZakatDelegation.done) return;
    installZakatDelegation.done = true;

    document.addEventListener("click", (e) => {
      if (!isZakatRoute()) return;
      if (!e.target.closest(".zakat-view")) return;

      const secBtn = e.target.closest("[data-zakat-section]");
      if (secBtn) {
        e.preventDefault();
        readInputFromDom();
        const id = secBtn.getAttribute("data-zakat-section");
        if (id && Object.prototype.hasOwnProperty.call(zakatSections, id)) {
          zakatSections[id] = !zakatSections[id];
          zakatRenderPreserve();
        }
        return;
      }

      const tabBtn = e.target.closest("[data-zakat-source-tab]");
      if (tabBtn) {
        e.preventDefault();
        e.stopPropagation();
        readInputFromDom();
        zakatSourceTab = tabBtn.getAttribute("data-zakat-source-tab") || "quran";
        zakatSections.sources = true;
        zakatRenderPreserve();
      }
    });

    document.addEventListener("input", (e) => {
      if (!isZakatRoute()) return;
      if (e.target?.classList?.contains("zakat-field")) scheduleRender();
    });
    document.addEventListener("change", (e) => {
      if (!isZakatRoute()) return;
      if (e.target?.classList?.contains("zakat-field")) scheduleRender();
    });
  }

  function bindZakat() {
    if (!isZakatRoute()) return;
    installZakatDelegation();

    const clear = $("zakatClearBtn");
    if (clear)
      clear.onclick = () => {
        if (!hasAnyInput() || confirm("Alle Eingaben zurücksetzen?")) {
          resetZakatInput();
          zakatRenderPreserve();
        }
      };
    const pdf = $("zakatPdfBtn");
    if (pdf)
      pdf.onclick = async () => {
        readInputFromDom();
        const result = currentResult();
        if (!result || !global.DARZakat) {
          alert("Bitte zuerst Werte eingeben.");
          return;
        }
        const oldLabel = pdf.textContent;
        pdf.disabled = true;
        pdf.textContent = "PDF…";
        try {
          const meta = {
            siteOrigin: global.location?.origin || "https://dar-al-tawhid.de",
            savedForVisitor: Boolean(global.accountSession?.()),
            input: zakatInput,
            exportedAt: new Date().toISOString()
          };
          const html = global.DARZakat.buildPdfHtml(result, effectiveConfig() || {}, meta);
          const fname = global.DARZakat.buildPdfFilename(meta);
          if (global.DARZakatPdf?.exportZakatPdf) {
            const out = await global.DARZakatPdf.exportZakatPdf(html, fname);
            if (out.method === "share") {
              /* iOS/Android Share Sheet geöffnet */
            } else if (out.method === "overlay") {
              /* Vorschau mit „Als PDF speichern“ — kein about:blank */
            } else if (out.method === "cancelled") {
              /* Nutzer hat Teilen abgebrochen */
            }
          } else {
            alert("PDF-Modul nicht geladen. Bitte Seite neu laden.");
          }
        } catch (e) {
          alert(e.message || "PDF-Export fehlgeschlagen.");
        } finally {
          pdf.disabled = false;
          pdf.textContent = oldLabel;
        }
      };
    const save = $("zakatSaveBtn");
    if (save) save.onclick = () => saveZakatToAccount();
    document.querySelectorAll("[data-zakat-delete]").forEach((btn) => {
      btn.onclick = () => deleteZakatRecord(btn.getAttribute("data-zakat-delete"));
    });
  }

  async function fetchZakatHistory(userId) {
    if (!global.supabaseRest || !userId) return [];
    try {
      const rows = await global.supabaseRest(
        `user_zakat_calculations?user_id=eq.${encodeURIComponent(userId)}&select=id,zakat_year,calculated_at,zakat_due,payment_status&order=calculated_at.desc&limit=20`
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  async function saveZakatToAccount() {
    const session = global.accountSession?.();
    if (!session?.id) {
      alert("Bitte zuerst anmelden.");
      return;
    }
    readInputFromDom();
    const result = currentResult();
    if (!result) return;
    const year = String(new Date().getFullYear());
    try {
      await global.supabaseRest("user_zakat_calculations", {
        method: "POST",
        prefer: "return=representation",
        body: {
          user_id: session.id,
          zakat_year: year,
          payload: { input: zakatInput, result, configVersion: zakatConfig?.version },
          total_wealth: result.totalWealth,
          debts_due: result.debtsDue,
          zakatable_wealth: result.zakatableWealth,
          zakat_due: result.zakatDue,
          hawl_next_date: result.hawl?.nextDueDate || null,
          payment_status: "open"
        }
      });
      zakatHistory = await fetchZakatHistory(session.id);
      alert("Berechnung gespeichert.");
      zakatRenderPreserve();
    } catch (e) {
      alert(e.message || "Speichern fehlgeschlagen.");
    }
  }

  async function deleteZakatRecord(id) {
    const session = global.accountSession?.();
    if (!session?.id || !id) return;
    if (!confirm("Diese Berechnung löschen?")) return;
    try {
      await global.supabaseRest(`user_zakat_calculations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(session.id)}`, {
        method: "DELETE",
        prefer: "return=minimal"
      });
      zakatHistory = await fetchZakatHistory(session.id);
      zakatRenderPreserve();
    } catch (e) {
      alert(e.message || "Löschen fehlgeschlagen");
    }
  }

  async function ensureZakatReady() {
    await loadZakatConfig(false);
    const pricePromise = loadZakatPrices(false);
    const session = global.accountSession?.();
    if (session?.id) zakatHistory = await fetchZakatHistory(session.id);
    await pricePromise;
    if (isZakatRoute()) zakatRenderPreserve();
  }

  installZakatDelegation();

  global.DARZakatApp = {
    renderZakat,
    bindZakat,
    ensureZakatReady,
    loadZakatConfig,
    loadZakatPrices,
    getConfig: () => effectiveConfig(),
    resetInput: resetZakatInput
  };
})(typeof window !== "undefined" ? window : global);
