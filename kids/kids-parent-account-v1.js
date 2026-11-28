/* DĀR AL TAWḤĪD KIDS · Elternkonto V1 (STAGING)
 * Anmeldung der Eltern per E-Mail-Einmalcode über Supabase Auth (kein Passwort).
 * Kinder sind Profile unter dem Elternkonto. Läuft nur auf Test-Hosts (siehe isEnabledHost).
 * Dieses Modul ist absichtlich NICHT in kids/start.html eingebunden (App-Store-Vertrag: keine Server-Aufrufe).
 * Der Schlüssel unten ist der öffentliche Publishable/Anon-Key; Schutz erfolgt über RLS und RPCs. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DarKidsParent = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
  var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
  var STORE_KEY = "dar-kids-parent-session-v1";
  var AVATARS = ["star", "moon", "book", "palm", "lantern", "heart", "leaf", "sun"];
  var AGE_BANDS = ["4-6", "7-9", "10-12", "13+"];

  function isEnabledHost(hostname) {
    var h = String(hostname || "").toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || /\.workers\.dev$/.test(h);
  }
  function normalizeEmail(v) {
    var e = String(v || "").trim().toLowerCase();
    if (e.length < 5 || e.length > 254) return "";
    return /^[^\s@<>()"',;:\\]+@[^\s@<>()"',;:\\]+\.[a-z0-9-]{2,}$/i.test(e) ? e : "";
  }
  function normalizeCode(v) { return String(v || "").replace(/\s+/g, ""); }
  function validCode(c) { return /^[0-9]{6,10}$/.test(c); }
  function cleanName(v) { return String(v || "").replace(/\s+/g, " ").trim(); }

  function create(opts) {
    opts = opts || {};
    var f = opts.fetch || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    var store = opts.storage || null;
    var url = opts.url || SUPABASE_URL;
    var key = opts.key || SUPABASE_KEY;
    var now = opts.now || function () { return Date.now(); };
    var session = null;
    var lastRequestAt = 0;

    function load() {
      if (session || !store) return session;
      try { session = JSON.parse(store.getItem(STORE_KEY) || "null"); } catch (e) { session = null; }
      return session;
    }
    function save(s) {
      session = s;
      if (!store) return;
      try { if (s) store.setItem(STORE_KEY, JSON.stringify(s)); else store.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    }
    function toSession(j) {
      if (!j || !j.access_token || !j.refresh_token) return null;
      return {
        access_token: j.access_token,
        refresh_token: j.refresh_token,
        expires_at: now() + Math.max(60, Number(j.expires_in || 3600)) * 1000,
        email: (j.user && j.user.email) || ""
      };
    }
    async function http(method, path, body, token) {
      if (!f) return { status: 0, json: null };
      var headers = { apikey: key, "Content-Type": "application/json" };
      headers.Authorization = "Bearer " + (token || key);
      var res;
      try {
        res = await f(url + path, { method: method, headers: headers, body: body == null ? undefined : JSON.stringify(body) });
      } catch (e) { return { status: 0, json: null }; }
      var j = null;
      try { j = await res.json(); } catch (e) { j = null; }
      return { status: res.status, json: j };
    }
    async function freshToken() {
      var s = load();
      if (!s) return null;
      if (s.expires_at - now() > 60000) return s.access_token;
      var r = await http("POST", "/auth/v1/token?grant_type=refresh_token", { refresh_token: s.refresh_token });
      var ns = r.status === 200 ? toSession(r.json) : null;
      if (!ns) { save(null); return null; }
      if (!ns.email) ns.email = s.email;
      save(ns);
      return ns.access_token;
    }
    async function authed(method, path, body, extra) {
      var t = await freshToken();
      if (!t) return { status: 401, json: null };
      var headers = { apikey: key, Authorization: "Bearer " + t, "Content-Type": "application/json" };
      if (extra) Object.keys(extra).forEach(function (k) { headers[k] = extra[k]; });
      var res;
      try { res = await f(url + path, { method: method, headers: headers, body: body == null ? undefined : JSON.stringify(body) }); }
      catch (e) { return { status: 0, json: null }; }
      var j = null;
      try { j = await res.json(); } catch (e) { j = null; }
      return { status: res.status, json: j };
    }

    return {
      isLoggedIn: function () { return !!load(); },
      email: function () { var s = load(); return s ? s.email : ""; },
      /* Neutral: gleiche Antwort, egal ob die Adresse schon ein Konto hat. */
      requestCode: async function (emailRaw) {
        var email = normalizeEmail(emailRaw);
        if (!email) return { ok: false, error: "invalid_email" };
        if (now() - lastRequestAt < 45000) return { ok: false, error: "wait" };
        lastRequestAt = now();
        var r = await http("POST", "/auth/v1/otp", { email: email, create_user: true });
        if (r.status === 0) return { ok: false, error: "network" };
        if (r.status === 429) return { ok: false, error: "rate_limited" };
        if (r.status >= 500) return { ok: false, error: "server" };
        return { ok: true };
      },
      verifyCode: async function (emailRaw, codeRaw) {
        var email = normalizeEmail(emailRaw), code = normalizeCode(codeRaw);
        if (!email || !validCode(code)) return { ok: false, error: "invalid_code" };
        var r = await http("POST", "/auth/v1/verify", { type: "email", email: email, token: code });
        if (r.status === 0) return { ok: false, error: "network" };
        if (r.status === 429) return { ok: false, error: "rate_limited" };
        var s = r.status === 200 ? toSession(r.json) : null;
        if (!s) return { ok: false, error: "invalid_code" };
        if (!s.email) s.email = email;
        save(s);
        return { ok: true };
      },
      signOut: async function () {
        var s = load();
        if (s) await http("POST", "/auth/v1/logout", null, s.access_token);
        save(null);
        return { ok: true };
      },
      listChildren: async function () {
        var r = await authed("GET", "/rest/v1/kids_children?select=id,display_name,avatar,age_band,created_at&order=created_at.asc");
        if (r.status === 401) return { ok: false, error: "session" };
        if (r.status !== 200 || !Array.isArray(r.json)) return { ok: false, error: "server" };
        return { ok: true, children: r.json };
      },
      addChild: async function (c) {
        var name = cleanName(c && c.display_name);
        var avatar = AVATARS.indexOf(c && c.avatar) >= 0 ? c.avatar : "star";
        var age = AGE_BANDS.indexOf(c && c.age_band) >= 0 ? c.age_band : "7-9";
        if (name.length < 1 || name.length > 24) return { ok: false, error: "invalid_name" };
        var s = load();
        if (!s) return { ok: false, error: "session" };
        var uid = userIdFromToken(s.access_token);
        var r = await authed("POST", "/rest/v1/kids_children", { parent_id: uid, display_name: name, avatar: avatar, age_band: age }, { Prefer: "return=representation" });
        if (r.status === 401) return { ok: false, error: "session" };
        if (r.status === 201) return { ok: true, child: Array.isArray(r.json) ? r.json[0] : r.json };
        var msg = JSON.stringify(r.json || {});
        if (/child_limit/.test(msg)) return { ok: false, error: "limit" };
        if (r.status === 409 || /duplicate|unique/.test(msg)) return { ok: false, error: "duplicate" };
        return { ok: false, error: "server" };
      },
      deleteChild: async function (id) {
        if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return { ok: false, error: "invalid" };
        var r = await authed("DELETE", "/rest/v1/kids_children?id=eq." + id);
        if (r.status === 401) return { ok: false, error: "session" };
        return r.status === 204 || r.status === 200 ? { ok: true } : { ok: false, error: "server" };
      },
      /* Löscht Elternkonto, E-Mail-Zuordnung und alle Kinderprofile serverseitig. */
      deleteAccount: async function () {
        var r = await authed("POST", "/rest/v1/rpc/kids_delete_my_account", {});
        if (r.status === 401) return { ok: false, error: "session" };
        if (r.status === 200 && r.json && r.json.ok === true) { save(null); return { ok: true }; }
        return { ok: false, error: "server" };
      }
    };
  }
  function userIdFromToken(t) {
    try {
      var p = String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var json = typeof atob === "function" ? atob(p) : Buffer.from(p, "base64").toString("utf8");
      return JSON.parse(json).sub || null;
    } catch (e) { return null; }
  }
  return { create: create, isEnabledHost: isEnabledHost, normalizeEmail: normalizeEmail, AVATARS: AVATARS, AGE_BANDS: AGE_BANDS };
});
