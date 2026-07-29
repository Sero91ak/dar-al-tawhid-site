// DAR AL TAWḤID – Live-Statistik (Besucher, Beitrags-Aufrufe, Teilen, Speichern)
(function () {
  const CFG = window.DAR_ANALYTICS_CONFIG || {};
  const SUPABASE_URL = String(CFG.supabaseUrl || "").replace(/\/$/, "");
  const SUPABASE_KEY = String(CFG.supabaseKey || "");
  const GA4_ID = String(CFG.ga4Id || "").trim();
  const SESSION_KEY = "darAnalyticsSessionV1";

  function sessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (crypto.randomUUID && crypto.randomUUID()) ||
          ("s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return "anon-" + Date.now();
    }
  }

  function initGA4() {
    if (!GA4_ID || window.__darGa4Init) return;
    window.__darGa4Init = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA4_ID, { send_page_view: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
  }

  function diag(context, err) {
    try {
      if (typeof console !== "undefined" && console.debug) console.debug("[dar-analytics] " + context, err);
    } catch (e) {}
  }

  function gaEvent(name, params) {
    if (!GA4_ID || !window.gtag) return;
    try { gtag("event", name, params || {}); } catch (e) { diag("gtag event failed: " + name, e); }
  }

  async function supabaseInsert(eventType, meta) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    try {
      await fetch(SUPABASE_URL + "/rest/v1/site_events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          event_type: eventType,
          content_type: meta.contentType || null,
          content_id: meta.contentId != null ? String(meta.contentId) : null,
          content_title: meta.contentTitle || null,
          session_id: sessionId()
        })
      });
    } catch (e) { diag("supabase insert failed: " + eventType, e); }
  }

  function track(eventType, meta) {
    meta = meta || {};
    initGA4();
    gaEvent(eventType, {
      content_type: meta.contentType,
      content_id: meta.contentId,
      content_title: meta.contentTitle,
      channel: meta.channel
    });
    supabaseInsert(eventType, meta);
  }

  async function supabaseGet(path) {
    const res = await fetch(SUPABASE_URL + path, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    });
    if (!res.ok) throw new Error("Supabase " + res.status);
    return res.json();
  }

  async function fetchDashboard() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { configured: false, live: null, totals: [] };
    }
    const [live, totals] = await Promise.all([
      supabaseGet("/rest/v1/rpc/analytics_live"),
      supabaseGet("/rest/v1/stats_totals?select=content_type,content_id,content_title,views,shares,saves&order=views.desc&limit=200")
    ]);
    return { configured: true, live: live || {}, totals: Array.isArray(totals) ? totals : [] };
  }

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_KEY) || !!GA4_ID;
  }

  function checkAdminPin(pin) {
    const cfg = window.DAR_ANALYTICS_CONFIG || CFG || {};
    return String(pin || "").trim() === String(cfg.adminPin || "").trim();
  }

  initGA4();

  window.DarAnalytics = {
    track: track,
    sessionId: sessionId,
    fetchDashboard: fetchDashboard,
    isConfigured: isConfigured,
    checkAdminPin: checkAdminPin,
    hasSupabase: function () { return !!(SUPABASE_URL && SUPABASE_KEY); },
    hasGA4: function () { return !!GA4_ID; }
  };
})();
