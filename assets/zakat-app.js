/**
 * DAR AL TAWḤĪD — Zakāt-Rechner UI (Staging / test)
 */
(function (global) {
  "use strict";

  const CONFIG_PATH = "/content/admin/zakat-config.json";
  const DEFAULT_PRICES_URL = "https://dar-admin-publisher.sero91ak.workers.dev/api/zakat/prices";
  const DEBOUNCE_MS = 200;

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

  function statusPill(ok, yes, no) {
    const cls = ok ? "zakat-pill ok" : ok === false ? "zakat-pill warn" : "zakat-pill muted";
    return `<span class="${cls}">${esc(ok ? yes : ok === false ? no : "—")}</span>`;
  }

  function priceBadge(prices) {
    if (zakatPricesLoading) {
      return `<span class="zakat-pill muted">Preise werden geladen …</span>`;
    }
    const fresh = prices?.freshness;
    if (fresh?.badge === "ok") {
      return `<span class="zakat-pill ok">${esc(fresh.label || "✅ Preisquelle aktuell geprüft")}</span>`;
    }
    if (fresh?.badge === "warn") {
      return `<span class="zakat-pill warn">${esc(fresh.label || "⚠️ Preis älter als 24 Stunden")}</span>`;
    }
    if (prices?.hasAnyPrice) {
      return `<span class="zakat-pill warn">${esc(fresh?.label || "Preisquelle mit Hinweis")}</span>`;
    }
    return `<span class="zakat-pill warn">❌ Keine geprüfte Preisquelle</span>`;
  }

  function renderPriceRow(label, meta, grams, currency) {
    if (zakatPricesLoading) {
      return `<div class="zakat-price-row"><span>${esc(label)}</span><div class="zakat-skeleton"><span class="zakat-skel-line"></span><span class="zakat-skel-line short"></span></div></div>`;
    }
    if (!meta?.pricePerGram) {
      return `<div class="zakat-price-row"><span>${esc(label)}</span><p class="zakat-muted">Noch nicht geladen</p></div>`;
    }
    return `<div class="zakat-price-row">
      <span>${esc(label)} (${grams} g)</span>
      <p>Preis pro Gramm: <b>${global.DARZakat.formatMoney(meta.pricePerGram, currency)}</b></p>
      <p>Niṣāb ${grams} g: <b>${global.DARZakat.formatMoney(meta.nisabEur, currency)}</b></p>
      <p class="zakat-muted">Quelle: ${esc(meta.source || "—")} · Stand: ${esc(global.DARZakat.formatDateTime(meta.fetchedAt))}</p>
    </div>`;
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
    return (result?.steps || [])
      .map(
        (s) => `<div class="zakat-step ${s.highlight ? "highlight" : ""} ${s.preview ? "preview" : ""}">
      <span>${esc(s.label)}</span>
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

    const statusMsg = result?.statusMessage
      ? `<p class="zakat-status-msg">${esc(result.statusMessage)}</p>`
      : "";

    const kpiSkeleton = zakatPricesLoading && !result?.liquidWealth
      ? `<div class="zakat-kpi"><span>Gesamtvermögen</span><div class="zakat-skel-line"></div></div>`
      : "";

    const resultBlock = result
      ? `<section class="zakat-panel zakat-result">
      <div class="zakat-panel-head"><h3>Ergebnis</h3>${result.previewOnly ? `<span class="zakat-pill preview">Nur Vorschau</span>` : ""}${result.finalResult && result.zakatObligatory ? `<span class="zakat-pill ok">Zakāt fällig</span>` : ""}</div>
      ${statusMsg}
      <div class="zakat-kpi-grid">
        <div class="zakat-kpi"><span>Gesamtvermögen</span><b>${global.DARZakat.formatMoney(result.totalWealth, result.currency)}</b></div>
        <div class="zakat-kpi"><span>Zakātpflichtig</span><b>${global.DARZakat.formatMoney(result.zakatableWealth, result.currency)}</b></div>
        <div class="zakat-kpi"><span>Pflichtbetrag</span><b class="zakat-gold">${global.DARZakat.formatMoney(result.zakatDue, result.currency)}</b></div>
      </div>
      <div class="zakat-status-row">
        ${statusPill(prices.hasAnyPrice ? result.nisab.reached : null, "Niṣāb erreicht", "Niṣāb nicht erreicht")}
        ${statusPill(result.hawl.fulfilled, "Ḥawl erfüllt", result.hawl.fulfilled === false ? "Ḥawl nicht erfüllt" : "Ḥawl —")}
        ${priceBadge(prices)}
      </div>
      <div class="zakat-nisab-compare">
        <div><span>Niṣāb Silber (595 g)</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.silverEur, result.currency) : "—"}</b></div>
        <div><span>Niṣāb Gold (85 g)</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.goldEur, result.currency) : "—"}</b></div>
        <div class="standard"><span>Standard (vorsichtig)</span><b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result.nisab.standardEur, result.currency) : "—"}</b></div>
      </div>
      ${warnings}
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>Rechenweg</h3><span>${global.DARZakat.formatNumber(result.ratePercent, 2)} %</span></div>
      <div class="zakat-steps">${renderZakatSteps(result)}</div>
    </section>`
      : kpiSkeleton;

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
        ? `<p class="zakat-muted zakat-loading-msg ok">✅ Echtzeit geprüft (COMEX Spot, alle ~15 Min.)</p>`
      : prices.hasVerified
        ? `<p class="zakat-muted zakat-loading-msg ok">Niṣāb-Werte aktuell geprüft</p>`
        : zakatPricesError
          ? `<p class="zakat-warn">Preisabruf: ${esc(zakatPricesError)} — liquide Mittel werden trotzdem berechnet.</p>`
          : "";

    return `${global.setHeader("Zakāt-Rechner", "Berechnung nach Qurʾān, Sunnah und gesicherten Āthār", "Zakāt")}
    <section class="zakat-hero premium-surface">
      <div class="zakat-hero-icon">🕌</div>
      <h2 class="zakat-hero-title">Zakāt-Rechner</h2>
      <p class="zakat-hero-sub">Berechnung nach Qurʾān, Sunnah und gesicherten Āthār</p>
      <p class="zakat-privacy">${esc(w.privacy || "")}</p>
      <p class="zakat-muted" style="margin-top:8px;font-size:11px;line-height:1.45">Die religiöse Grundlage der Zakāt stammt aus Qurʾān, authentischer Sunnah und gesicherten Āthār. Die Gold- und Silberpreise dienen nur zur aktuellen Umrechnung des Niṣāb.</p>
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>1 · Vermögen eingeben</h3></div>
      <div class="zakat-form-grid">
        <label>Bargeld<input class="field zakat-field" id="zakatCash" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(zakatInput.cash)}" placeholder="0"></label>
        <label>Bankguthaben<input class="field zakat-field" id="zakatBank" type="number" min="0" step="0.01" value="${esc(zakatInput.bank)}" placeholder="0"></label>
        <label>PayPal / digital<input class="field zakat-field" id="zakatDigital" type="number" min="0" step="0.01" value="${esc(zakatInput.digital)}" placeholder="0"></label>
        <label>Sonstige liquide Mittel<input class="field zakat-field" id="zakatOtherLiquid" type="number" min="0" step="0.01" value="${esc(zakatInput.otherLiquid)}" placeholder="0"></label>
      </div>
      <div class="zakat-subsection-label">Gold</div>
      <div class="zakat-form-grid">
        <label>Gold (Gramm)<input class="field zakat-field" id="zakatGoldGrams" type="number" min="0" step="0.01" value="${esc(zakatInput.goldGrams)}" placeholder="0"></label>
        <label>Goldwert manuell<input class="field zakat-field" id="zakatGoldManual" type="number" min="0" step="0.01" value="${esc(zakatInput.goldValueManual)}" placeholder="optional"></label>
        <label>Art<select class="field zakat-field" id="zakatGoldType"><option value="investment" ${zakatInput.goldType === "investment" ? "selected" : ""}>Anlagegold</option><option value="jewelry" ${zakatInput.goldType === "jewelry" ? "selected" : ""}>Schmuck</option><option value="other" ${zakatInput.goldType === "other" ? "selected" : ""}>Sonstiges</option></select></label>
      </div>
      <div class="zakat-subsection-label">Silber</div>
      <div class="zakat-form-grid">
        <label>Silber (Gramm)<input class="field zakat-field" id="zakatSilverGrams" type="number" min="0" step="0.01" value="${esc(zakatInput.silverGrams)}" placeholder="0"></label>
        <label>Silberwert manuell<input class="field zakat-field" id="zakatSilverManual" type="number" min="0" step="0.01" value="${esc(zakatInput.silverValueManual)}" placeholder="optional"></label>
      </div>
      <div class="zakat-subsection-label">Schulden (kurzfristig fällig)</div>
      <label>Abzugsfähige fällige Schulden<input class="field zakat-field" id="zakatDebts" type="number" min="0" step="0.01" value="${esc(zakatInput.debtsDue)}" placeholder="0"></label>
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>2 · Niṣāb &amp; Preise</h3>${priceBadge(prices)}</div>
      ${pricePanelIntro}
      ${renderPriceRow("Gold", goldMeta, 85, "EUR")}
      ${renderPriceRow("Silber", silverMeta, 595, "EUR")}
      <p class="zakat-muted">Standard: Vorsichtige Berechnung nach niedrigerem Niṣāb: <b>${prices.hasAnyPrice ? global.DARZakat.formatMoney(result?.nisab?.standardEur || live.standardNisabEur || 0, "EUR") : "—"}</b></p>
      <details class="zakat-manual-prices" ${zakatManualOpen ? "open" : ""}>
        <summary>Notfall: Preise manuell (nur wenn API ausfällt)</summary>
        <div class="zakat-form-grid">
          <label>Goldpreis/g (€)<input class="field zakat-field" id="zakatManualGoldPrice" type="number" min="0" step="0.01" value="${esc(zakatInput.manualPrices.goldPerGramEur)}" placeholder="nur Notfall"></label>
          <label>Silberpreis/g (€)<input class="field zakat-field" id="zakatManualSilverPrice" type="number" min="0" step="0.01" value="${esc(zakatInput.manualPrices.silverPerGramEur)}" placeholder="nur Notfall"></label>
        </div>
      </details>
    </section>
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>3 · Ḥawl prüfen</h3></div>
      <div class="zakat-form-grid">
        <label>Niṣāb erreicht seit<input class="field zakat-field" id="zakatNisabSince" type="date" value="${esc(zakatInput.nisabSinceDate)}"></label>
        <label>Heute<input class="field zakat-field" id="zakatToday" type="date" value="${esc(zakatInput.todayDate)}"></label>
      </div>
      ${result?.hawl?.nextDueDate ? `<p class="zakat-muted">Nächster Zakāt-Termin (Vorschau): ${esc(result.hawl.nextDueDate)} · ${result.hawl.daysRemaining != null && !result.hawl.fulfilled ? esc(String(result.hawl.daysRemaining) + " Tage verbleibend") : ""}</p>` : ""}
    </section>
    ${resultBlock}
    <section class="zakat-panel">
      <div class="zakat-panel-head"><h3>Belege</h3><button type="button" class="zakat-btn ghost" id="zakatToggleSources">${zakatSourcesOpen ? "Belege ausblenden" : "📚 Belege anzeigen"}</button></div>
      <div id="zakatSourcesBox" ${zakatSourcesOpen ? "" : 'hidden'}>${result ? renderZakatSources(result) : ""}</div>
    </section>
    <section class="zakat-actions">
      <button type="button" class="zakat-btn primary" id="zakatRecalcBtn">Berechnen</button>
      <button type="button" class="zakat-btn" id="zakatClearBtn">Eingaben löschen</button>
      <button type="button" class="zakat-btn" id="zakatPdfBtn">PDF exportieren</button>
      ${session ? `<button type="button" class="zakat-btn" id="zakatSaveBtn">Im Account speichern</button>` : `<button type="button" class="zakat-btn" data-nav="account">Anmelden zum Speichern</button>`}
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

  function bindZakat() {
    if (global.currentRoute?.view !== "zakat") return;
    document.querySelectorAll(".zakat-field").forEach((el) => {
      el.oninput = scheduleRender;
    });
    const recalc = $("zakatRecalcBtn");
    if (recalc) recalc.onclick = () => { readInputFromDom(); global.render(); };
    const clear = $("zakatClearBtn");
    if (clear)
      clear.onclick = () => {
        zakatInput = defaultInput();
        zakatSourcesOpen = false;
        global.render();
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
    if (!confirm("Diese Berechnung löschen?")) return;
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
    resetInput: () => {
      zakatInput = defaultInput();
    }
  };
})(typeof window !== "undefined" ? window : global);
