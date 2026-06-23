/**
 * DAR AL TAWḤĪD — Zakāt-Rechner UI (Staging / test)
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
  let zakatSourcesOpen = false;
  let zakatManualOpen = false;
  let zakatHistory = [];
  let zakatDebounceTimer = null;

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

  function pricesApiUrl() {
    const worker = global.PRAYER_PUSH_WORKER_URL || global.DAR_WORKER_URL || "";
    if (worker) return `${String(worker).replace(/\/$/, "")}/api/zakat/prices`;
    return global.DAR_ZAKAT_PRICES_URL || DEFAULT_PRICES_URL;
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
      } catch (e) {}
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

  function renderZakatSources(result) {
    const sources = result?.sources || [];
    if (!sources.length) return `<p class="zakat-muted">Keine geprüften Belege für diese Berechnung geladen.</p>`;
    return sources
      .map(
        (s) => `<article class="zakat-source-card">
      <div class="zakat-source-meta"><span class="zakat-source-cat">${esc(s.category)}</span><span>${esc(s.reference || "")}</span></div>
      ${s.arabic ? `<div class="zakat-ar">${esc(s.arabic)}</div>` : ""}
      <p>${esc(s.german || s.explanation || "")}</p>
      ${s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">Quelle öffnen</a>` : ""}
    </article>`
      )
      .join("");
  }

  function renderZakatSteps(result) {
    if (!result?.steps?.length) return `<p class="zakat-muted">Noch keine Eingaben — Zahlen eingeben, Ergebnis aktualisiert sich live.</p>`;
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

    const resultHero = result
      ? `<div class="zakat-result-hero">
      <span class="zakat-result-label">Pflichtbetrag</span>
      <div class="zakat-result-amount">${global.DARZakat.formatMoney(result.zakatDue, result.currency)}</div>
      <span class="zakat-result-sub">${result.previewOnly ? "Vorschau — keine endgültige Fatwa" : result.zakatObligatory ? "Zakāt fällig nach Berechnung" : result.resultCase === "A" ? "Keine Zakāt fällig" : "Transparent berechnet"}</span>
    </div>`
      : "";

    const resultBlock = result
      ? `<section class="zakat-panel zakat-result zakat-panel-accent">
      <div class="zakat-panel-head"><h3>Ergebnis</h3><div class="zakat-head-badges">${result.previewOnly ? `<span class="zakat-pill preview">Vorschau</span>` : ""}${result.zakatObligatory ? `<span class="zakat-pill ok">Zakāt fällig</span>` : ""}</div></div>
      ${resultBanner(result)}
      ${resultHero}
      <div class="zakat-kpi-grid">
        <div class="zakat-kpi"><span>Gesamtvermögen</span><b>${global.DARZakat.formatMoney(result.totalWealth, result.currency)}</b></div>
        <div class="zakat-kpi"><span>Zakātpflichtig</span><b>${global.DARZakat.formatMoney(result.zakatableWealth, result.currency)}</b></div>
        <div class="zakat-kpi accent"><span>Abzüge (Schulden)</span><b>${global.DARZakat.formatMoney(result.debtsDue, result.currency)}</b></div>
      </div>
      ${renderLiquidBreakdown(result)}
      <div class="zakat-status-row">
        ${statusPill(prices.hasAnyPrice ? result.nisab.reached : null, "Niṣāb erreicht", "Niṣāb nicht erreicht")}
        ${statusPill(result.hawl.fulfilled, "Ḥawl erfüllt", result.hawl.fulfilled === false ? "Ḥawl offen" : "Ḥawl —")}
        ${priceBadge(prices)}
      </div>
      <div class="zakat-nisab-compare">
        <div><span>Niṣāb Silber · 595 g</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.silverEur, result.currency) : "—"}</b></div>
        <div><span>Niṣāb Gold · 85 g</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.goldEur, result.currency) : "—"}</b></div>
        <div class="standard"><span>Standard (vorsichtig)</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.standardEur, result.currency) : "—"}</b></div>
      </div>
      ${warnings}
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>Rechenweg</h3><span class="zakat-rate-tag">${global.DARZakat.formatNumber(result.ratePercent, 2)} %</span></div>
      <div class="zakat-steps">${renderZakatSteps(result)}</div>
    </section>`
      : "";

    const historyBlock =
      session && zakatHistory.length
        ? `<section class="zakat-panel"><div class="zakat-panel-head"><h3>Mein Verlauf</h3><span>${zakatHistory.length}</span></div>
      <div class="zakat-history">${zakatHistory
          .map(
            (h) => `<div class="zakat-history-row"><span>${esc(h.zakat_year || h.calculated_at?.slice(0, 10) || "")}</span><b>${global.DARZakat.formatMoney(h.zakat_due, result?.currency || "EUR")}</b><button type="button" class="zakat-mini-btn" data-zakat-delete="${esc(h.id)}">Löschen</button></div>`
          )
          .join("")}</div></section>`
        : "";

    const pricePanelIntro = zakatPricesLoading
      ? `<p class="zakat-muted zakat-loading-msg">Echtzeit-Niṣāb-Werte werden geladen …</p>`
      : prices.freshness?.level === "realtime"
        ? `<p class="zakat-muted zakat-loading-msg ok">Echtzeit geprüft · Aktualisierung alle ~15 Min.</p>`
        : prices.hasVerified
          ? `<p class="zakat-muted zakat-loading-msg ok">Niṣāb-Werte aktuell geprüft</p>`
          : zakatPricesError
            ? `<p class="zakat-warn">Preisabruf: ${esc(zakatPricesError)} — liquide Mittel werden trotzdem exakt berechnet.</p>`
            : "";

    return `${global.setHeader("Zakāt-Rechner", "Berechnung nach Qurʾān, Sunnah und gesicherten Āthār", "Zakāt")}
    <section class="zakat-hero premium-surface">
      <div class="zakat-hero-badge">Amānah · vertraulich &amp; transparent</div>
      <div class="zakat-hero-icon">🕌</div>
      <h2 class="zakat-hero-title">Zakāt-Rechner</h2>
      <p class="zakat-hero-sub">Qurʾān · Sunnah · gesicherte Āthār · live berechnet</p>
      <p class="zakat-trust-note">Religiöse Grundlage und Marktdaten sind getrennt. Gold-/Silberpreise dienen nur der Niṣāb-Umrechnung — keine Fatwa.</p>
      <p class="zakat-privacy">${esc(w.privacy || "")}</p>
    </section>
    ${resultBlock}
    <div class="zakat-flow-label">Eingaben</div>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>1 · Liquide Mittel</h3></div>
      <div class="zakat-form-grid">
        <label>Bargeld<input class="field zakat-field" id="zakatCash" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(zakatInput.cash)}" placeholder="0,00"></label>
        <label>Bankguthaben<input class="field zakat-field" id="zakatBank" type="number" min="0" step="0.01" value="${esc(zakatInput.bank)}" placeholder="0,00"></label>
        <label>PayPal / digital<input class="field zakat-field" id="zakatDigital" type="number" min="0" step="0.01" value="${esc(zakatInput.digital)}" placeholder="0,00"></label>
        <label>Sonstige liquide<input class="field zakat-field" id="zakatOtherLiquid" type="number" min="0" step="0.01" value="${esc(zakatInput.otherLiquid)}" placeholder="0,00"></label>
      </div>
      <div class="zakat-subsection-label">Edelmetalle</div>
      <div class="zakat-form-grid zakat-form-grid-3">
        <label>Gold (Gramm)<input class="field zakat-field" id="zakatGoldGrams" type="number" min="0" step="0.01" value="${esc(zakatInput.goldGrams)}" placeholder="0"></label>
        <label>Silber (Gramm)<input class="field zakat-field" id="zakatSilverGrams" type="number" min="0" step="0.01" value="${esc(zakatInput.silverGrams)}" placeholder="0"></label>
        <label>Gold-Art<select class="field zakat-field" id="zakatGoldType"><option value="investment" ${zakatInput.goldType === "investment" ? "selected" : ""}>Anlagegold</option><option value="jewelry" ${zakatInput.goldType === "jewelry" ? "selected" : ""}>Schmuck</option><option value="other" ${zakatInput.goldType === "other" ? "selected" : ""}>Sonstiges</option></select></label>
      </div>
      <div class="zakat-form-grid">
        <label>Goldwert manuell (optional)<input class="field zakat-field" id="zakatGoldManual" type="number" min="0" step="0.01" value="${esc(zakatInput.goldValueManual)}" placeholder="nur wenn kein Preis"></label>
        <label>Silberwert manuell (optional)<input class="field zakat-field" id="zakatSilverManual" type="number" min="0" step="0.01" value="${esc(zakatInput.silverValueManual)}" placeholder="nur wenn kein Preis"></label>
      </div>
      <div class="zakat-subsection-label">Schulden</div>
      <label>Kurzfristig fällige Schulden<input class="field zakat-field" id="zakatDebts" type="number" min="0" step="0.01" value="${esc(zakatInput.debtsDue)}" placeholder="0,00"></label>
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>2 · Niṣāb &amp; Echtzeitpreise</h3>${priceBadge(prices)}</div>
      ${pricePanelIntro}
      <div class="zakat-price-grid">${renderPriceRow("Gold", goldMeta, 85, "EUR")}${renderPriceRow("Silber", silverMeta, 595, "EUR")}</div>
      <p class="zakat-standard-line">Standard-Niṣāb (vorsichtig, niedrigerer Wert): <b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result?.nisab?.standardEur || live.standardNisabEur || 0, "EUR") : "—"}</b></p>
      <details class="zakat-manual-prices" ${zakatManualOpen ? "open" : ""}>
        <summary>Notfall: Preise manuell (nur wenn API ausfällt)</summary>
        <div class="zakat-form-grid">
          <label>Gold €/g<input class="field zakat-field" id="zakatManualGoldPrice" type="number" min="0" step="0.01" value="${esc(zakatInput.manualPrices.goldPerGramEur)}" placeholder="Notfall"></label>
          <label>Silber €/g<input class="field zakat-field" id="zakatManualSilverPrice" type="number" min="0" step="0.01" value="${esc(zakatInput.manualPrices.silverPerGramEur)}" placeholder="Notfall"></label>
        </div>
      </details>
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>3 · Ḥawl</h3></div>
      <div class="zakat-form-grid">
        <label>Niṣāb erreicht seit<input class="field zakat-field" id="zakatNisabSince" type="date" value="${esc(zakatInput.nisabSinceDate)}"></label>
        <label>Stichtag (heute)<input class="field zakat-field" id="zakatToday" type="date" value="${esc(zakatInput.todayDate)}"></label>
      </div>
      ${result?.hawl?.nextDueDate ? `<p class="zakat-muted">Nächster Termin (Vorschau): ${esc(result.hawl.nextDueDate)}${result.hawl.daysRemaining != null && !result.hawl.fulfilled ? ` · ${esc(String(result.hawl.daysRemaining))} Tage verbleibend` : ""}</p>` : `<p class="zakat-muted">Datum optional — ohne Ḥawl-Datum nur Vorschau.</p>`}
    </section>
    <section class="zakat-panel zakat-panel-soft">
      <div class="zakat-panel-head"><h3>Belege &amp; Quellen</h3><button type="button" class="zakat-btn ghost" id="zakatToggleSources">${zakatSourcesOpen ? "Ausblenden" : "Anzeigen"}</button></div>
      <div id="zakatSourcesBox" ${zakatSourcesOpen ? "" : 'hidden'}>${result ? renderZakatSources(result) : ""}</div>
    </section>
    <section class="zakat-actions">
      <button type="button" class="zakat-btn" id="zakatClearBtn">Alle Eingaben löschen</button>
      <button type="button" class="zakat-btn" id="zakatPdfBtn">PDF exportieren</button>
      ${session ? `<button type="button" class="zakat-btn primary" id="zakatSaveBtn">Im Account speichern</button>` : `<button type="button" class="zakat-btn" data-nav="account">Anmelden zum Speichern</button>`}
    </section>
    ${historyBlock}
    <p class="zakat-footer">${esc(w.footer || "")}</p>`;
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

  function scheduleRender() {
    if (zakatDebounceTimer) clearTimeout(zakatDebounceTimer);
    zakatDebounceTimer = setTimeout(() => {
      zakatDebounceTimer = null;
      readInputFromDom();
      global.render();
    }, DEBOUNCE_MS);
  }

  function resetZakatInput() {
    if (zakatDebounceTimer) {
      clearTimeout(zakatDebounceTimer);
      zakatDebounceTimer = null;
    }
    zakatInput = defaultInput();
    zakatSourcesOpen = false;
    zakatManualOpen = false;
  }

  function bindZakat() {
    if (global.currentRoute?.view !== "zakat") return;
    document.querySelectorAll(".zakat-field").forEach((el) => {
      el.oninput = scheduleRender;
      el.onchange = scheduleRender;
    });
    const clear = $("zakatClearBtn");
    if (clear)
      clear.onclick = () => {
        if (!hasAnyInput() || confirm("Alle Eingaben zurücksetzen und neu berechnen?")) {
          resetZakatInput();
          global.render();
        }
      };
    const toggle = $("zakatToggleSources");
    if (toggle) toggle.onclick = () => { zakatSourcesOpen = !zakatSourcesOpen; global.render(); };
    const pdf = $("zakatPdfBtn");
    if (pdf)
      pdf.onclick = () => {
        readInputFromDom();
        const result = currentResult();
        if (!result || !global.DARZakat) return;
        const html = global.DARZakat.buildPdfHtml(result, effectiveConfig() || {}, {});
        const w = global.open("", "_blank", "noopener");
        if (w) {
          w.document.write(html);
          w.document.close();
          w.focus();
          w.print();
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
      alert("Berechnung in deinem privaten Bereich gespeichert.");
      global.render();
    } catch (e) {
      alert(e.message || "Speichern fehlgeschlagen. Ist die Zakāt-Tabelle in Supabase eingerichtet?");
    }
  }

  async function deleteZakatRecord(id) {
    const session = global.accountSession?.();
    if (!session?.id || !id) return;
    if (!confirm("Diese Berechnung endgültig löschen?")) return;
    try {
      await global.supabaseRest(`user_zakat_calculations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(session.id)}`, {
        method: "DELETE",
        prefer: "return=minimal"
      });
      zakatHistory = await fetchZakatHistory(session.id);
      global.render();
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
    if (global.currentRoute?.view === "zakat" || global.readRoute?.()?.view === "zakat") {
      global.render?.();
    }
  }

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
