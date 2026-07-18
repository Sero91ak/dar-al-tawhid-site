/**
 * DAR Admin – Quiz-Statistik (nur Admin-App)
 */
(function (global) {
  "use strict";

  const WORKER_BASE = "https://dar-admin-publisher.sero91ak.workers.dev";
  const ROLE_KEY = "darAdminQuizStatsRoleV1";
  const SUBTAB_KEY = "darAdminQuizStatsSubV1";

  let state = {
    subTab: "overview",
    days: 30,
    category: "",
    loading: false,
    error: "",
    overview: null,
    users: [],
    questions: [],
    categories: [],
    sessions: [],
    alerts: [],
    selectedUser: null,
    role: "admin"
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readRole() {
    try {
      const r = localStorage.getItem(ROLE_KEY);
      if (["content_reviewer", "admin", "super_admin"].includes(r)) return r;
    } catch (e) {}
    return "admin";
  }

  function workerSecret() {
    try {
      return localStorage.getItem("darAdminWorkerSecretV1") || "";
    } catch (e) {
      return "";
    }
  }

  function canUsers() {
    return state.role === "admin" || state.role === "super_admin";
  }

  function canExportPersonal() {
    return state.role === "super_admin";
  }

  async function api(path, { method = "GET" } = {}) {
    const secret = workerSecret();
    if (!secret) throw new Error("Worker-Secret fehlt (Einstellungen → Technik).");
    const q = new URLSearchParams();
    q.set("days", String(state.days));
    if (state.category) q.set("category", state.category);
    const url = `${WORKER_BASE}/api/admin/quiz-stats${path}?${q.toString()}`;
    const res = await fetch(url, {
      method,
      headers: {
        "X-Admin-Secret": secret,
        "X-Admin-Role": state.role
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Fehler ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/csv")) return { csv: await res.text() };
    return res.json();
  }

  function kpi(label, value, hint) {
    return `<article class="quiz-admin-kpi"><b>${esc(value)}</b><span>${esc(label)}</span>${hint ? `<small>${esc(hint)}</small>` : ""}</article>`;
  }

  function subTabs() {
    const tabs = [
      ["overview", "Übersicht"],
      ["categories", "Kategorien"],
      ["questions", "Fragen"],
      ["alerts", "Auffälligkeiten"]
    ];
    if (canUsers()) {
      tabs.splice(1, 0, ["users", "Nutzer"]);
      tabs.push(["sessions", "Sitzungen"], ["export", "Export"]);
    }
    return tabs;
  }

  function filtersHtml() {
    return `<div class="quiz-admin-filters">
      <label>Zeitraum
        <select id="quizStatsDays">
          <option value="1" ${state.days === 1 ? "selected" : ""}>Heute</option>
          <option value="7" ${state.days === 7 ? "selected" : ""}>7 Tage</option>
          <option value="30" ${state.days === 30 ? "selected" : ""}>30 Tage</option>
          <option value="90" ${state.days === 90 ? "selected" : ""}>90 Tage</option>
        </select>
      </label>
      <label>Rolle (serverseitig)
        <select id="quizStatsRole">
          <option value="content_reviewer" ${state.role === "content_reviewer" ? "selected" : ""}>content_reviewer</option>
          <option value="admin" ${state.role === "admin" ? "selected" : ""}>admin</option>
          <option value="super_admin" ${state.role === "super_admin" ? "selected" : ""}>super_admin</option>
        </select>
      </label>
      <button class="btn primary" type="button" id="quizStatsRefreshBtn">Aktualisieren</button>
    </div>`;
  }

  function renderOverview() {
    const o = state.overview;
    if (!o) return `<div class="empty">Keine Daten geladen.</div>`;
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Quiz-Statistik · Übersicht</h3><span>Produktion · Besucher-App</span></div>
      ${filtersHtml()}
      <div class="quiz-admin-kpi-grid">
        ${kpi("Registrierte Quiznutzer", o.registeredQuizUsers)}
        ${kpi("Aktiv heute", o.activeQuizUsersToday)}
        ${kpi("Aktiv 7 Tage", o.activeQuizUsers7d)}
        ${kpi("Aktiv 30 Tage", o.activeQuizUsers30d)}
        ${kpi("Anonyme Nutzer (30 Tage)", o.anonymousQuizUsers30d)}
        ${kpi("Gestartete Runden", o.startedSessions)}
        ${kpi("Abgeschlossene Runden", o.completedSessions)}
        ${kpi("Abgebrochene Runden", o.abandonedSessions)}
        ${kpi("Abschlussquote", o.completionRate + "%")}
        ${kpi("Beantwortete Fragen", o.totalAnswers)}
        ${kpi("Richtige Antworten", o.correctAnswers)}
        ${kpi("Falsche Antworten", o.wrongAnswers)}
        ${kpi("Übersprungen", o.skippedAnswers)}
        ${kpi("Erstversuchsquote", o.avgFirstAttemptRate + "%")}
        ${kpi("Ø Antwortzeit", o.avgResponseTimeMs + " ms")}
        ${kpi("Ø Sitzungsdauer", Math.round(o.avgSessionDurationMs / 1000) + " s")}
        ${kpi("Ø Fragen / Sitzung", o.avgQuestionsPerSession)}
        ${kpi("Top-Kategorie", o.topCategory || "—")}
        ${kpi("Schwächste Kategorie", o.weakestCategory || "—")}
        ${kpi("Schwierigste Frage", o.hardestQuestion || "—")}
        ${kpi("Leichteste Frage", o.easiestQuestion || "—")}
      </div>
    </section>`;
  }

  function renderUsers() {
    if (!canUsers()) return `<div class="empty">Keine Berechtigung für Nutzerstatistiken.</div>`;
    const rows = state.users
      .map(
        (u) => `<tr class="quiz-admin-row" data-quiz-user="${esc(u.userId)}">
      <td>${esc(u.displayName)}</td>
      <td>${esc(u.lastActivity ? new Date(u.lastActivity).toLocaleString("de-DE") : "—")}</td>
      <td>${u.uniqueQuestions}</td>
      <td>${u.firstAttemptRate}%</td>
      <td>${u.currentAccuracy}%</td>
      <td>${esc(u.knowledgeLevel)}</td>
    </tr>`
      )
      .join("");
    const detail = state.selectedUser
      ? `<div class="quiz-admin-detail">
        <h4>${esc(state.selectedUser.displayName)}</h4>
        <p>Account-ID: <code>${esc(state.selectedUser.userId)}</code></p>
        <div class="quiz-admin-kpi-grid compact">
          ${kpi("Fragen", state.selectedUser.uniqueQuestions)}
          ${kpi("Erstversuchsquote", state.selectedUser.firstAttemptRate + "%")}
          ${kpi("Trefferquote", state.selectedUser.currentAccuracy + "%")}
          ${kpi("Lernfortschritt", state.selectedUser.learningGain + " PP")}
          ${kpi("Wissensstand", state.selectedUser.knowledgeLevel)}
        </div>
        <h5>Stärkste Kategorien</h5>
        <ul>${(state.selectedUser.strongestCategories || []).map((c) => `<li>${esc(c.category)} · ${c.firstAttemptRate}%</li>`).join("") || "<li>—</li>"}</ul>
        <h5>Kategorien mit Lernbedarf</h5>
        <ul>${(state.selectedUser.weakestCategories || []).map((c) => `<li>${esc(c.category)} · ${c.firstAttemptRate}%</li>`).join("") || "<li>—</li>"}</ul>
      </div>`
      : "";
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Nutzer</h3><span>Angemeldete Quiznutzer</span></div>
      ${filtersHtml()}
      <div class="quiz-admin-split">
        <table class="quiz-admin-table"><thead><tr><th>Name</th><th>Letzte Aktivität</th><th>Fragen</th><th>Erstversuch</th><th>Treffer</th><th>Wissensstand</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Noch keine Nutzerdaten.</td></tr>`}</tbody></table>
        ${detail}
      </div>
    </section>`;
  }

  function renderQuestions() {
    const rows = state.questions
      .map(
        (q) => `<tr>
      <td><code>${esc(q.questionId)}</code></td>
      <td>${esc(q.category)}</td>
      <td>${esc(q.level)}</td>
      <td>${q.firstAttempts}</td>
      <td>${q.firstAttemptRate}%</td>
      <td>${q.avgResponseTimeMs} ms</td>
      <td>${(q.optionDistribution || []).map((p, i) => `${"ABCD"[i]}:${p}%`).join(" · ")}</td>
    </tr>`
      )
      .join("");
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Fragen</h3><span>Erstversuche & Antwortverteilung</span></div>
      ${filtersHtml()}
      <table class="quiz-admin-table"><thead><tr><th>ID</th><th>Kategorie</th><th>Stufe</th><th>Erstversuche</th><th>Quote</th><th>Ø Zeit</th><th>Verteilung</th></tr></thead><tbody>${rows || `<tr><td colspan="7">Noch keine Fragedaten.</td></tr>`}</tbody></table>
    </section>`;
  }

  function renderCategories() {
    const rows = state.categories
      .map(
        (c) => `<tr>
      <td>${esc(c.category)}</td>
      <td>${c.uniqueQuestions}</td>
      <td>${c.answeredQuestions}</td>
      <td>${c.firstAttemptRate}%</td>
      <td>${c.avgResponseTimeMs} ms</td>
    </tr>`
      )
      .join("");
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Kategorien</h3><span>Themenstärke & Trefferquoten</span></div>
      ${filtersHtml()}
      <table class="quiz-admin-table"><thead><tr><th>Kategorie</th><th>Fragen</th><th>Beantwortet</th><th>Erstversuchsquote</th><th>Ø Zeit</th></tr></thead><tbody>${rows || `<tr><td colspan="5">Noch keine Kategoriedaten.</td></tr>`}</tbody></table>
    </section>`;
  }

  function renderSessions() {
    if (!canUsers()) return `<div class="empty">Keine Berechtigung.</div>`;
    const rows = state.sessions
      .map(
        (s) => `<tr>
      <td>${esc(s.startedAt ? new Date(s.startedAt).toLocaleString("de-DE") : "—")}</td>
      <td>${esc(s.mode)}</td>
      <td>${s.userType === "registered" ? "Angemeldet" : "Anonym"}</td>
      <td>${s.answeredQuestions}/${s.totalQuestions}</td>
      <td>${s.correctAnswers}✓ / ${s.wrongAnswers}✕</td>
      <td>${s.completedAt ? "Abgeschlossen" : s.abandonedAt ? "Abgebrochen" : "Offen"}</td>
    </tr>`
      )
      .join("");
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Quizsitzungen</h3></div>
      ${filtersHtml()}
      <table class="quiz-admin-table"><thead><tr><th>Start</th><th>Modus</th><th>Typ</th><th>Fragen</th><th>Ergebnis</th><th>Status</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Noch keine Sitzungen.</td></tr>`}</tbody></table>
    </section>`;
  }

  function renderAlerts() {
    const rows = state.alerts
      .map(
        (a) => `<tr>
      <td><code>${esc(a.questionId)}</code></td>
      <td>${esc(a.message)}</td>
      <td>${a.rate != null ? a.rate + "%" : a.option || a.dominantWrongPct + "%" || "—"}</td>
      <td>${a.attempts || "—"}</td>
    </tr>`
      )
      .join("");
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Auffällige Fragen</h3><span>Nur redaktionelle Hinweise</span></div>
      ${filtersHtml()}
      <table class="quiz-admin-table"><thead><tr><th>Frage</th><th>Hinweis</th><th>Wert</th><th>Basis</th></tr></thead><tbody>${rows || `<tr><td colspan="4">Keine Auffälligkeiten im Zeitraum.</td></tr>`}</tbody></table>
    </section>`;
  }

  function renderExport() {
    if (!canUsers()) return `<div class="empty">Keine Berechtigung.</div>`;
    return `<section class="quiz-admin-panel">
      <div class="section-head"><h3>Datenexport</h3><span>Nur Produktionsdaten</span></div>
      ${filtersHtml()}
      <div class="quiz-admin-export-grid">
        <button class="btn" type="button" data-quiz-export="overview">CSV Übersicht</button>
        <button class="btn" type="button" data-quiz-export="questions">CSV Fragen</button>
        <button class="btn" type="button" data-quiz-export="categories">CSV Kategorien</button>
        ${canExportPersonal() ? `<button class="btn" type="button" data-quiz-export="users">CSV Nutzer (personenbezogen)</button>` : `<p class="hint">Personenbezogener Export nur mit super_admin.</p>`}
      </div>
    </section>`;
  }

  function renderSubNav() {
    return `<nav class="quiz-admin-subnav">${subTabs()
      .map(([id, label]) => `<button type="button" class="quiz-admin-subtab ${state.subTab === id ? "active" : ""}" data-quiz-subtab="${id}">${esc(label)}</button>`)
      .join("")}</nav>`;
  }

  function renderTab() {
    state.role = readRole();
    try {
      const saved = localStorage.getItem(SUBTAB_KEY);
      if (saved && subTabs().some(([id]) => id === saved)) state.subTab = saved;
    } catch (e) {}
    const body =
      state.subTab === "users"
        ? renderUsers()
        : state.subTab === "questions"
          ? renderQuestions()
          : state.subTab === "categories"
            ? renderCategories()
            : state.subTab === "sessions"
              ? renderSessions()
              : state.subTab === "alerts"
                ? renderAlerts()
                : state.subTab === "export"
                  ? renderExport()
                  : renderOverview();
    return `${renderSubNav()}${state.loading ? `<div class="notice-note">Lade Quiz-Statistik …</div>` : ""}${state.error ? `<div class="notice-note wide" style="color:#ffc9c3">${esc(state.error)}</div>` : ""}${body}`;
  }

  async function loadSubTab() {
    state.loading = true;
    state.error = "";
    try {
      if (state.subTab === "overview") state.overview = await api("/overview");
      else if (state.subTab === "users") state.users = await api("/users");
      else if (state.subTab === "questions") state.questions = await api("/questions");
      else if (state.subTab === "categories") state.categories = await api("/categories");
      else if (state.subTab === "sessions") state.sessions = await api("/sessions");
      else if (state.subTab === "alerts") state.alerts = await api("/alerts");
    } catch (e) {
      state.error = e.message || String(e);
    } finally {
      state.loading = false;
    }
  }

  async function loadUserDetail(userId) {
    try {
      state.selectedUser = await api(`/users/${encodeURIComponent(userId)}`);
    } catch (e) {
      state.error = e.message || String(e);
    }
  }

  async function downloadExport(type) {
    const secret = workerSecret();
    const q = new URLSearchParams({ days: String(state.days), type });
    const res = await fetch(`${WORKER_BASE}/api/admin/quiz-stats/export?${q}`, {
      headers: { "X-Admin-Secret": secret, "X-Admin-Role": state.role }
    });
    if (!res.ok) throw new Error("Export fehlgeschlagen");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quiz-stats-${type}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function bind(panel) {
    if (!panel) return;
    panel.querySelectorAll("[data-quiz-subtab]").forEach((btn) => {
      btn.onclick = async () => {
        state.subTab = btn.getAttribute("data-quiz-subtab");
        try {
          localStorage.setItem(SUBTAB_KEY, state.subTab);
        } catch (e) {}
        await loadSubTab();
        if (typeof global.renderShell === "function") global.renderShell();
      };
    });
    const days = panel.querySelector("#quizStatsDays");
    if (days)
      days.onchange = () => {
        state.days = Number(days.value) || 30;
      };
    const role = panel.querySelector("#quizStatsRole");
    if (role)
      role.onchange = () => {
        state.role = role.value;
        try {
          localStorage.setItem(ROLE_KEY, state.role);
        } catch (e) {}
      };
    const refresh = panel.querySelector("#quizStatsRefreshBtn");
    if (refresh)
      refresh.onclick = async () => {
        await loadSubTab();
        if (typeof global.renderShell === "function") global.renderShell();
      };
    panel.querySelectorAll("[data-quiz-user]").forEach((row) => {
      row.onclick = async () => {
        await loadUserDetail(row.getAttribute("data-quiz-user"));
        if (typeof global.renderShell === "function") global.renderShell();
      };
    });
    panel.querySelectorAll("[data-quiz-export]").forEach((btn) => {
      btn.onclick = () => downloadExport(btn.getAttribute("data-quiz-export")).catch((e) => alert(e.message));
    });
  }

  async function ensureLoaded() {
    if (!state.overview && state.subTab === "overview") await loadSubTab();
    else if (state.subTab !== "overview" && state.subTab !== "export") await loadSubTab();
  }

  global.DARQuizStatsAdmin = {
    renderQuizStatsTab: renderTab,
    bindQuizStatsTab: bind,
    ensureQuizStatsLoaded: ensureLoaded,
    resetQuizStatsState() {
      state.overview = null;
      state.users = [];
      state.questions = [];
      state.categories = [];
      state.sessions = [];
      state.alerts = [];
      state.selectedUser = null;
    }
  };
})(window);
