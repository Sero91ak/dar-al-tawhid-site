(function () {
  "use strict";

  const ACCOUNT_LAST_SYNC_KEY = "darAccountLastSyncV1";
  const ACCOUNT_SYNC_STATE_KEY = "darAccountSyncStateV1";
  const ACCOUNT_INTRO_DISMISSED_KEY = "darAccountIntroDismissedV1";

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function accountIconSvg() {
    return '<svg class="account-card-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"/></svg>';
  }

  function hasRealAccountSystem() {
    return typeof hasSupabaseCfg === "function" && hasSupabaseCfg();
  }

  function offlineQueueCount() {
    try {
      return Number(localStorage.getItem("darOfflineQueueCountV1") || 0);
    } catch (e) {
      return 0;
    }
  }

  function getAccountSyncState() {
    try {
      return localStorage.getItem(ACCOUNT_SYNC_STATE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setAccountSyncState(state) {
    try {
      if (state) localStorage.setItem(ACCOUNT_SYNC_STATE_KEY, state);
      else localStorage.removeItem(ACCOUNT_SYNC_STATE_KEY);
    } catch (e) {}
  }

  function recordAccountSyncSuccess() {
    try {
      localStorage.setItem(ACCOUNT_LAST_SYNC_KEY, new Date().toISOString());
      setAccountSyncState("synced");
    } catch (e) {}
  }

  function formatAccountSyncTime(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const now = new Date();
      const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      const time = new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
      return sameDay ? `heute, ${time} Uhr` : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
    } catch (e) {
      return "";
    }
  }

  function getAccountSyncMeta() {
    const session = typeof accountSession === "function" ? accountSession() : null;
    const lastSync = (() => {
      try {
        return localStorage.getItem(ACCOUNT_LAST_SYNC_KEY) || "";
      } catch (e) {
        return "";
      }
    })();
    const lastSyncLabel = formatAccountSyncTime(lastSync);
    const pending = offlineQueueCount() > 0;
    const online = navigator.onLine !== false;
    const syncState = getAccountSyncState();

    if (!session) {
      return { state: "logged_out", lastSync, lastSyncLabel, pending, online };
    }
    if (!online) {
      return { state: "offline", lastSync, lastSyncLabel, pending, online, username: session.username };
    }
    if (pending || syncState === "pending") {
      return { state: "pending", lastSync, lastSyncLabel, pending: true, online, username: session.username };
    }
    if (syncState === "error") {
      return { state: "error", lastSync, lastSyncLabel, pending, online, username: session.username };
    }
    return { state: "synced", lastSync, lastSyncLabel, pending, online, username: session.username };
  }

  function statusClass(state) {
    if (state === "synced") return "is-synced";
    if (state === "offline") return "is-offline";
    if (state === "pending") return "is-pending";
    if (state === "error") return "is-error";
    return "";
  }

  function statusLabel(meta) {
    if (!hasRealAccountSystem()) return "Nur auf diesem Gerät";
    if (meta.state === "logged_out") return "Nicht angemeldet";
    if (meta.state === "offline") return "Offline – lokal gespeichert";
    if (meta.state === "pending") return "Synchronisierung ausstehend";
    if (meta.state === "error") return "Synchronisierung prüfen";
    return "Synchronisiert";
  }

  function hubTitle() {
    return hasRealAccountSystem() ? "Konto & Synchronisierung" : "Lokaler geschützter Bereich";
  }

  function syncedDataListHtml() {
    const items = [
      "Favoriten (Beiträge)",
      "Qurʾān-Lesestand",
      "Quiz-Fortschritt und Statistik",
      "Zakāt-Berechnungen (bei Speichern im Konto)",
    ];
    return `<ul class="account-sync-list">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }

  function localOnlyDataListHtml() {
    return `<ul class="account-sync-list"><li>Theme und Schriftgrößen</li><li>Gebetszeiten-Einstellungen</li><li>Qurʾān-Lesezeichen (lokal)</li><li>Bereits geladene Offline-Inhalte auf diesem Gerät</li></ul>`;
  }

  function renderHomeAccountPill() {
    if (!hasRealAccountSystem()) return "";
    const meta = getAccountSyncMeta();
    if (meta.state === "logged_out") {
      return `<button type="button" class="home-account-pill is-guest is-guest-neon" data-account-open-register aria-label="Konto erstellen und auf allen Geräten synchronisieren"><span class="home-account-pill-label">Konto &amp; Sync</span></button>`;
    }
    const icon =
      meta.state === "synced" ? "✓" : meta.state === "offline" ? "◌" : meta.state === "pending" ? "↻" : "!";
    const shortName = String(meta.username || "Konto").slice(0, 12);
    return `<button type="button" class="home-account-pill is-logged-in ${statusClass(meta.state)}" data-nav="account" aria-label="Konto öffnen"><span class="home-account-pill-label">${esc(icon)} ${esc(shortName)}</span></button>`;
  }

  function renderHomeHijriFrameHtml() {
    return `<button id="homeHijriDayBtn" class="home-hijri-frame" type="button" data-hijri-today data-nav="calendar" aria-label="Islamischen Kalender öffnen"><span class="home-hijri-frame-day" data-hijri-day-num aria-hidden="true">—</span><span class="home-hijri-frame-copy"><span class="home-hijri-frame-kicker">Islam. Kalender</span><span class="home-hijri-frame-date" data-hijri-date-text>Islamisches Datum</span></span></button>`;
  }

  function renderHomeHeaderChipsHtml() {
    const pill = renderHomeAccountPill();
    return pill ? `<div class="view-head-home-chips">${pill}</div>` : "";
  }

  function syncHomeAccountSlots() {
    const pill = renderHomeAccountPill();
    document.querySelectorAll("[data-home-account-slot]").forEach((slot) => {
      slot.innerHTML = pill || "";
      slot.style.display = pill ? "" : "none";
    });
    const top = document.querySelector("[data-header-top-chips]");
    if (top) {
      top.querySelectorAll(".home-account-pill").forEach((el) => el.remove());
      if (pill) {
        const wrap = document.createElement("span");
        wrap.innerHTML = pill;
        const btn = wrap.firstElementChild;
        if (btn) top.insertBefore(btn, top.firstChild);
      }
    }
    bindAccountVisibilityEvents();
    if (typeof updateHijriHeaderDate === "function") updateHijriHeaderDate();
  }

  function renderMoreAccountCard() {
    const meta = getAccountSyncMeta();
    const title = hubTitle();
    const status = statusLabel(meta);
    let desc = "";
    let note = "";
    let actions = "";
    let actionsClass = "account-hub-actions account-hub-actions-inline";

    if (!hasRealAccountSystem()) {
      desc = "Persönlicher Bereich mit Anmeldename und PIN.";
      note = "Synchronisiert derzeit keine Daten zwischen Geräten.";
      actions = '<button type="button" class="primary" data-nav="account">Öffnen</button>';
      actionsClass = "account-hub-actions";
    } else if (meta.state === "logged_out") {
      desc = "Daten auf allen Geräten sichern.";
      note = "Die App bleibt auch ohne Konto nutzbar.";
      actions =
        '<button type="button" class="primary" data-account-open-login>Anmelden</button><button type="button" data-account-open-register>Registrieren</button>';
    } else {
      const syncLine = meta.lastSyncLabel ? `Zuletzt: ${meta.lastSyncLabel}` : "Bereit";
      desc = `${esc(meta.username || "")} · ${syncLine}`;
      actions =
        meta.state === "error" || meta.state === "pending" || meta.state === "offline"
          ? '<button type="button" class="primary" data-nav="account">Konto</button><button type="button" data-account-retry-sync>Sync</button>'
          : '<button type="button" class="primary" data-nav="account">Konto öffnen</button>';
    }

    return `<section class="account-hub-card account-hub-card--compact premium-surface" data-account-hub-card>${note ? `<p class="account-hub-note account-hub-note-top">${esc(note)}</p>` : ""}<div class="account-hub-head">${accountIconSvg()}<div><h3 class="account-hub-title">${esc(title)}</h3><p class="account-hub-status ${statusClass(meta.state)}">${esc(status)}</p></div></div>${desc ? `<p class="account-hub-desc">${desc}</p>` : ""}<div class="${actionsClass}">${actions}</div></section>`;
  }

  function accountFormMode() {
    const value = String(currentRoute?.value || "").toLowerCase();
    if (value === "register") return "register";
    if (value === "login") return "login";
    return "login";
  }

  function renderAccountModeTabs(mode) {
    const isRegister = mode === "register";
    return `<div class="account-mode-tabs" role="tablist"><button type="button" class="account-mode-tab${!isRegister ? " is-active" : ""}" data-account-open-login role="tab" aria-selected="${!isRegister}">Anmelden</button><button type="button" class="account-mode-tab${isRegister ? " is-active" : ""}" data-account-open-register role="tab" aria-selected="${isRegister}">Registrieren</button></div>`;
  }

  function renderAccountLoginForm(mode) {
    const isRegister = mode === "register";
    const savedCount = typeof savedIds === "function" ? savedIds().length : 0;
    const title = isRegister ? "Konto erstellen" : "Anmelden";
    const subtitle = isRegister
      ? "Unterstützte Daten werden auf allen Geräten synchronisiert."
      : "Melde dich an, um deine Daten auf allen Geräten zu nutzen.";
    return `${typeof setPageHeader === "function" ? setPageHeader("Konto & Synchronisierung", subtitle, "Konto") : ""}<section class="account-panel premium-surface">${renderAccountModeTabs(mode)}<h3>${esc(title)}</h3><p class="account-panel-lead">${isRegister ? "Wähle Anmeldename und PIN – ohne E-Mail-Zwang. Lokale Favoriten, Qurʾān-Lesestand und Quiz-Fortschritt werden mit deinem Konto zusammengeführt." : "Mit Anmeldename und PIN anmelden. Deine Daten stehen danach auf allen Geräten zur Verfügung."}</p><div class="account-form"><input id="accountUsername" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Anmeldename"><input id="accountPin" type="password" inputmode="numeric" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="PIN, 4-8 Zahlen"></div><div class="account-actions"><button id="${isRegister ? "accountCreateBtn" : "accountLoginBtn"}" type="button" class="primary">${isRegister ? "Registrieren" : "Anmelden"}</button><button type="button" data-account-continue-guest>Ohne Konto fortfahren</button></div><div id="accountStatus" class="account-status">Favoriten auf diesem Gerät: ${savedCount}. Bei Anmeldung werden lokale und Kontodaten standardmäßig zusammengeführt.</div></section>`;
  }

  function renderAccountDashboard() {
    const s = accountSession();
    const savedCount = typeof savedIds === "function" ? savedIds().length : 0;
    const meta = getAccountSyncMeta();
    const status = statusLabel(meta);
    const syncLine = meta.lastSyncLabel ? `Zuletzt synchronisiert: ${meta.lastSyncLabel}` : "Noch keine Synchronisierung auf diesem Gerät.";
    const statusNote =
      meta.state === "offline"
        ? "Offline – Änderungen bleiben lokal gespeichert und werden bei Verbindung synchronisiert."
        : meta.state === "pending"
          ? "Synchronisierung ausstehend – Änderungen sind lokal gesichert."
          : meta.state === "error"
            ? "Bitte Verbindung prüfen und erneut synchronisieren."
            : "Favoriten, Qurʾān-Lesestand und Quiz-Fortschritt werden automatisch synchronisiert.";
    return `${typeof setPageHeader === "function" ? setPageHeader("Konto & Synchronisierung", "Unterstützte Daten zwischen Geräten sichern", "Konto") : ""}<section class="account-panel premium-surface account-panel-dashboard"><div class="account-dashboard-head"><div><h3>${esc(s.username)}</h3><p class="account-hub-status ${statusClass(meta.state)}">${esc(status)}</p></div><button id="accountLogoutBtn" type="button" class="account-logout-chip">Abmelden</button></div><p class="account-dashboard-syncline">${esc(syncLine)}</p><div class="account-summary account-summary-compact"><div class="account-summary-card"><b>${savedCount}</b><span>Favoriten</span></div><div class="account-summary-card"><b>${navigator.onLine ? "Online" : "Offline"}</b><span>Verbindung</span></div><div class="account-summary-card"><b>☁</b><span>Geräte-Sync</span></div></div><div class="account-actions account-actions-compact"><button id="accountSyncBtn" type="button" class="primary">Jetzt synchronisieren</button></div><div id="accountStatus" class="account-status ${meta.state === "synced" ? "ok" : meta.state === "error" ? "warn" : ""}">${esc(statusNote)}</div><details class="account-details-block"><summary>Synchronisierte Daten</summary>${syncedDataListHtml()}</details><details class="account-details-block"><summary>Nur lokal auf diesem Gerät</summary>${localOnlyDataListHtml()}</details></section>`;
  }

  function renderAccountVisibility() {
    const s = typeof accountSession === "function" ? accountSession() : null;
    if (s) return renderAccountDashboard();
    if (!hasRealAccountSystem()) {
      return `${typeof setPageHeader === "function" ? setPageHeader("Lokaler geschützter Bereich", "Anmeldename und PIN nur auf diesem Gerät", "Konto") : ""}<section class="account-panel premium-surface"><h3>Lokaler geschützter Bereich</h3><p>Schütze deinen persönlichen Bereich mit Anmeldename und PIN. Diese Funktion synchronisiert derzeit keine Daten zwischen mehreren Geräten.</p><div class="account-form"><input id="accountUsername" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Anmeldename"><input id="accountPin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN, 4-8 Zahlen"></div><div class="account-actions"><button id="accountLoginBtn" type="button" class="primary">Bereich öffnen</button><button id="accountCreateBtn" type="button">PIN einrichten</button></div><div id="accountStatus" class="account-status">Nur auf diesem Gerät – keine geräteübergreifende Synchronisierung.</div></section>`;
    }
    return renderAccountLoginForm(accountFormMode());
  }

  function renderAccountPromptVisibility() {
    const s = typeof accountSession === "function" ? accountSession() : null;
    const title = hasRealAccountSystem() ? "Konto & Synchronisierung" : "Lokaler geschützter Bereich";
    const text = s
      ? `Angemeldet als ${s.username}. Unterstützte Daten werden auf allen Geräten synchronisiert.`
      : hasRealAccountSystem()
        ? "Melde dich an oder registriere dich, um Favoriten, Qurʾān-Lesestand und Quiz-Fortschritt auf allen Geräten zu sichern."
        : "Richte einen lokalen Anmeldenamen und eine PIN für dieses Gerät ein.";
    const btn = s ? "Konto öffnen" : hasRealAccountSystem() ? "Anmelden" : "Einrichten";
    return `<section class="account-panel premium-surface"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="account-actions"><button type="button" class="primary" data-nav="account">${esc(btn)}</button></div></section>`;
  }

  function hasLocalAccountData() {
    const favs = typeof savedIds === "function" ? savedIds().length : 0;
    const progress =
      typeof getQuranReadingState === "function"
        ? getQuranReadingState()
        : null;
    const hasProgress = !!(progress?.manual || progress?.automatic);
    return favs > 0 || hasProgress;
  }

  async function chooseMergeStrategy(userId) {
    if (!hasLocalAccountData()) return "merge";
    let remoteFavs = [];
    try {
      remoteFavs = await fetchAccountSaved(userId);
    } catch (e) {
      return "merge";
    }
    if (!remoteFavs.length) return "merge";
    const box = document.createElement("div");
    box.className = "account-merge-dialog";
    box.innerHTML =
      '<h3 style="margin:0;font-family:var(--serif);color:var(--gold2)">Lokale Daten gefunden</h3><p style="margin:0;color:var(--muted);font-size:13px;line-height:1.5">Auf diesem Gerät sind bereits Daten gespeichert. Wie möchtest du fortfahren?</p><div class="account-actions"><button type="button" class="primary" data-merge="merge">Mit Kontodaten zusammenführen</button><button type="button" data-merge="remote">Nur Kontodaten verwenden</button><button type="button" data-merge="cancel">Abbrechen</button></div>';
    const mount = document.getElementById("accountStatus");
    if (!mount) return "merge";
    mount.replaceWith(box);
    return new Promise((resolve) => {
      box.querySelectorAll("[data-merge]").forEach((btn) => {
        btn.onclick = () => resolve(btn.getAttribute("data-merge"));
      });
    });
  }

  async function applyAccountAuthSuccess(profile, mode) {
    if (mode === "login" && hasRealAccountSystem() && hasLocalAccountData()) {
      const choice = await chooseMergeStrategy(profile.id);
      if (choice === "cancel") {
        setAccountSession(null);
        throw new Error("Anmeldung abgebrochen.");
      }
      setAccountSession(profile);
      if (choice === "remote") {
        const remote = await fetchAccountSaved(profile.id);
        setSavedIds(remote);
        await replaceAccountSaved(profile.id, remote);
        try {
          const remoteProgress = await fetchAccountQuranProgress(profile.id);
          setQuranReadingState(remoteProgress);
          await replaceAccountQuranProgress(profile.id, remoteProgress);
        } catch (e) {}
      } else {
        await mergeAccountSaved(profile.id);
        try {
          await mergeAccountQuranProgress(profile.id);
        } catch (e) {}
      }
    } else {
      setAccountSession(profile);
      await mergeAccountSaved(profile.id);
      try {
        await mergeAccountQuranProgress(profile.id);
      } catch (e) {}
    }
    await syncAllAccountData({ silent: true });
    recordAccountSyncSuccess();
    setAccountStatus(
      mode === "register"
        ? "Konto erstellt. Unterstützte Daten wurden synchronisiert."
        : "Angemeldet. Unterstützte Daten sind auf allen Geräten verfügbar.",
      "ok"
    );
  }

  async function syncAllAccountData({ silent = false } = {}) {
    const fav = await syncAccountSaved({ silent: true });
    const quran = await syncAccountQuranProgress({ silent: true });
    const ok = fav !== false && quran !== false;
    if (ok) recordAccountSyncSuccess();
    else if (!navigator.onLine) setAccountSyncState("pending");
    else if (fav !== false || quran !== false) {
      recordAccountSyncSuccess();
      setAccountSyncState("synced");
    } else setAccountSyncState("error");
    if (!silent) {
      setAccountStatus(
        ok
          ? "Synchronisierung abgeschlossen."
          : navigator.onLine
            ? "Synchronisierung teilweise nicht möglich. Bitte erneut versuchen."
            : "Offline gespeichert. Wird bei Verbindung synchronisiert.",
        ok ? "ok" : "warn"
      );
    }
    return ok;
  }

  function openAccountMode(mode) {
    if (typeof navigate === "function") navigate("account", mode === "register" ? "register" : "login");
  }

  function bindAccountVisibilityEvents() {
    document.querySelectorAll("[data-account-open-login]").forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        openAccountMode("login");
      };
    });
    document.querySelectorAll("[data-account-open-register]").forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        openAccountMode("register");
      };
    });
    document.querySelectorAll("[data-account-continue-guest]").forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        if (typeof navigate === "function") navigate("home");
      };
    });
    document.querySelectorAll("[data-account-retry-sync]").forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        await syncAllAccountData({ silent: false });
        render();
      };
    });
  }

  function patchSetHeader() {
    if (typeof setHeader !== "function" || setHeader.__darAccountPatched) return;
    const originalSetHeader = setHeader;
    setHeader = function (title, desc, eyebrow, headClass) {
      if (title === "Startseite") {
        const eyebrowText = eyebrow || "DAR AL TAWḤID";
        const headClassAttr = headClass ? ` ${headClass}` : "";
        const safe = (v) => (typeof esc === "function" ? esc(v) : String(v == null ? "" : v));
        return `<div class="view-head view-head-home${headClassAttr}"><div class="eyebrow">${safe(eyebrowText)}</div><div class="view-head-home-row"><h2 class="home-start-title">${safe(title)}</h2>${renderHomeHijriFrameHtml()}</div>${renderHomeHeaderChipsHtml()}${desc ? `<div class="view-desc">${safe(desc)}</div>` : ""}</div>`;
      }
      return originalSetHeader(title, desc, eyebrow, headClass);
    };
    setHeader.__darAccountPatched = true;
  }

  function patchCore() {
    patchSetHeader();

    if (typeof featureCatalog !== "function") return;

    const originalFeatureCatalog = featureCatalog;
    featureCatalog = function () {
      return originalFeatureCatalog().filter((item) => item.id !== "account");
    };

    function insertAfterViewHead(html, injection) {
      const match = html.match(/<div class="view-head[^"]*">[\s\S]*?<\/div>/);
      if (match) {
        const end = match.index + match[0].length;
        return `${html.slice(0, end)}${injection}${html.slice(end)}`;
      }
      const marker = '<section class="feature-section">';
      if (html.includes(marker)) return html.replace(marker, `${injection}${marker}`);
      return `${injection}${html}`;
    }

    if (typeof renderMore === "function") {
      const originalRenderMore = renderMore;
      renderMore = function () {
        return insertAfterViewHead(originalRenderMore(), renderMoreAccountCard());
      };
    }

    renderAccount = renderAccountVisibility;
    renderAccountPrompt = renderAccountPromptVisibility;

    if (typeof loginAccount === "function") {
      loginAccount = async function () {
        try {
          setAccountStatus("Anmeldung wird geprüft …", "warn");
          const username = validateUsername($("accountUsername")?.value);
          const pin = validatePin($("accountPin")?.value);
          const profile = await accountFindProfile(username);
          if (!profile) throw new Error("Anmeldename nicht gefunden.");
          const hash = await accountPinHash(username, pin, profile.pin_salt);
          if (hash !== profile.pin_hash) throw new Error("PIN stimmt nicht.");
          await applyAccountAuthSuccess(profile, "login");
          render();
        } catch (e) {
          setAccountStatus(e.message || String(e), "warn");
        }
      };
    }

    if (typeof createAccount === "function") {
      createAccount = async function () {
        try {
          setAccountStatus("Konto wird angelegt …", "warn");
          const username = validateUsername($("accountUsername")?.value);
          const pin = validatePin($("accountPin")?.value);
          const existing = await accountFindProfile(username);
          if (existing) throw new Error("Dieser Anmeldename ist bereits vergeben.");
          const salt = randomHex(16);
          const pin_hash = await accountPinHash(username, pin, salt);
          const rows = await supabaseRest("user_profiles", {
            method: "POST",
            prefer: "return=representation",
            body: { username, pin_hash, pin_salt: salt },
          });
          const profile = Array.isArray(rows) ? rows[0] : rows;
          if (!profile || !profile.id) throw new Error("Konto konnte nicht gespeichert werden.");
          await applyAccountAuthSuccess(profile, "register");
          render();
        } catch (e) {
          setAccountStatus(e.message || String(e), "warn");
        }
      };
    }

    if (typeof logoutAccount === "function") {
      logoutAccount = function () {
        const proceed = confirm(
          "Abmelden?\n\nDeine synchronisierten Kontodaten bleiben in deinem Konto gespeichert."
        );
        if (!proceed) return;
        const removeLocal = confirm(
          "Lokale Kontodaten von diesem Gerät entfernen?\n\nOK = Lokale Favoriten und Lesestand auf diesem Gerät löschen\nAbbrechen = Lokale Daten behalten"
        );
        setAccountSession(null);
        setAccountSyncState("");
        if (removeLocal) {
          try {
            localStorage.removeItem("darSavedPostsV5DuaFinal");
            localStorage.removeItem("darQuranReadingProgressV2");
          } catch (e) {}
        }
        render();
      };
    }

    if (typeof syncAccountSaved === "function") {
      const originalSyncSaved = syncAccountSaved;
      syncAccountSaved = async function (opts) {
        const result = await originalSyncSaved(opts);
        if (result) recordAccountSyncSuccess();
        else if (accountSession() && !navigator.onLine) setAccountSyncState("pending");
        else if (accountSession() && result === false) setAccountSyncState("error");
        return result;
      };
    }

    if (typeof syncAccountQuranProgress === "function") {
      const originalSyncQuran = syncAccountQuranProgress;
      syncAccountQuranProgress = async function (opts) {
        const result = await originalSyncQuran(opts);
        if (result) recordAccountSyncSuccess();
        else if (accountSession() && !navigator.onLine) setAccountSyncState("pending");
        return result;
      };
    }

    if (typeof bindEvents === "function") {
      const originalBindEvents = bindEvents;
      bindEvents = function () {
        originalBindEvents();
        bindAccountVisibilityEvents();
        const syncBtn = $("accountSyncBtn");
        if (syncBtn) syncBtn.onclick = () => syncAllAccountData({ silent: false });
        const accountPin = $("accountPin");
        if (accountPin) {
          accountPin.onkeydown = (e) => {
            if (e.key !== "Enter") return;
            const mode = accountFormMode();
            if (mode === "register") $("accountCreateBtn")?.click();
            else $("accountLoginBtn")?.click();
          };
        }
        if (currentRoute?.view === "account" && typeof accountSession === "function" && accountSession()) {
          syncAllAccountData({ silent: true });
        }
      };
    }

    if (typeof render === "function") {
      const originalRender = render;
      render = function () {
        const result = originalRender();
        syncHomeAccountSlots();
        return result;
      };
    }

    if (typeof updateChrome === "function") {
      const originalUpdateChrome = updateChrome;
      updateChrome = function (route) {
        originalUpdateChrome(route);
        syncHomeAccountSlots();
        if (route?.view !== "account") return;
        const crumb = $("crumb");
        if (!crumb) return;
        const title = hasRealAccountSystem() ? "Konto & Synchronisierung" : "Lokaler geschützter Bereich";
        crumb.textContent = title;
        crumb.classList.remove("is-hidden");
      };
    }

    window.addEventListener("online", () => {
      if (typeof accountSession !== "function" || !accountSession()) return;
      syncAllAccountData({ silent: true }).then(() => syncHomeAccountSlots());
    });

    if (typeof accountSession === "function" && accountSession() && navigator.onLine) {
      syncAllAccountData({ silent: true }).then(() => syncHomeAccountSlots());
    }
  }

  patchCore();
  syncHomeAccountSlots();
  window.DAR_ACCOUNT_VISIBILITY = {
    getAccountSyncMeta,
    renderMoreAccountCard,
    renderHomeAccountPill,
    syncAllAccountData,
    syncHomeAccountSlots,
  };
})();
