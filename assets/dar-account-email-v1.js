/* DĀR AL TAWḤĪD · optionale E-Mail für PIN-Zurücksetzen (STAGING, noch nicht in index.html eingebunden).
 * Ablauf: E-Mail-Einmalcode (Supabase Auth) beweist die Adresse; der Server verknüpft Profil und Auth-Benutzer.
 * Zurücksetzen: Code anfordern + bestätigen -> RPC acct_pin_reset_by_email mit dem Auth-JWT.
 * Der PIN-Hash wird wie bei der Registrierung im Browser gebildet (sha256(user:pin:salt:dar-al-tawhid-v1)). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DarAccountEmail = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var URL0 = "https://djyfkttjbdraynuxrzno.supabase.co";
  var KEY0 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

  function normalizeEmail(v) {
    var e = String(v || "").trim().toLowerCase();
    if (e.length < 5 || e.length > 254) return "";
    return /^[^\s@<>()"',;:\\]+@[^\s@<>()"',;:\\]+\.[a-z0-9-]{2,}$/i.test(e) ? e : "";
  }
  function randomSaltHex(cryptoImpl) {
    var b = new Uint8Array(16); cryptoImpl.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }
  async function sha256Hex(cryptoImpl, text) {
    var d = await cryptoImpl.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(d), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }

  function create(opts) {
    opts = opts || {};
    var f = opts.fetch || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    var url = opts.url || URL0, key = opts.key || KEY0;
    var cr = opts.crypto || (typeof crypto !== "undefined" ? crypto : null);
    var now = opts.now || function () { return Date.now(); };
    var lastRequestAt = 0;

    async function call(path, body, bearer) {
      var res;
      try {
        res = await f(url + path, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + (bearer || key), "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
      } catch (e) { return { status: 0, json: null }; }
      var j = null; try { j = await res.json(); } catch (e) { j = null; }
      return { status: res.status, json: j };
    }
    /* Gibt bei Erfolg das kurzlebige Auth-JWT zurück (nur im Speicher halten, nicht dauerhaft speichern). */
    async function requestCode(emailRaw) {
      var email = normalizeEmail(emailRaw);
      if (!email) return { ok: false, error: "invalid_email" };
      if (now() - lastRequestAt < 45000) return { ok: false, error: "wait" };
      lastRequestAt = now();
      var r = await call("/auth/v1/otp", { email: email, create_user: true });
      if (r.status === 0) return { ok: false, error: "network" };
      if (r.status === 429) return { ok: false, error: "rate_limited" };
      if (r.status >= 500) return { ok: false, error: "server" };
      return { ok: true }; // neutral
    }
    async function verifyCode(emailRaw, codeRaw) {
      var email = normalizeEmail(emailRaw), code = String(codeRaw || "").replace(/\s+/g, "");
      if (!email || !/^[0-9]{6,10}$/.test(code)) return { ok: false, error: "invalid_code" };
      var r = await call("/auth/v1/verify", { type: "email", email: email, token: code });
      if (r.status === 0) return { ok: false, error: "network" };
      if (r.status === 429) return { ok: false, error: "rate_limited" };
      if (r.status !== 200 || !r.json || !r.json.access_token) return { ok: false, error: "invalid_code" };
      return { ok: true, jwt: r.json.access_token };
    }
    async function rpc(name, args, bearer) {
      var r = await call("/rest/v1/rpc/" + name, args, bearer);
      if (r.status === 0) return { ok: false, error: "network" };
      if (r.status === 429) return { ok: false, error: "rate_limited" };
      if (r.status !== 200 || !r.json) return { ok: false, error: "failed" };
      return r.json;
    }
    return {
      requestCode: requestCode,
      verifyCode: verifyCode,
      /* Eingeloggt in der App (sessionToken) + frisch bestätigte Adresse (jwt) -> verknüpfen */
      linkEmail: function (sessionToken, jwt) { return rpc("acct_email_link", { p_token: sessionToken }, jwt); },
      status: function (sessionToken) { return rpc("acct_email_status", { p_token: sessionToken }); },
      unlink: function (sessionToken) { return rpc("acct_email_unlink", { p_token: sessionToken }); },
      /* Vergessene PIN: jwt aus verifyCode. Antwort ist bei jedem Fehlschlag identisch ("failed"). */
      resetPin: async function (usernameRaw, newPin, jwt) {
        var u = String(usernameRaw || "").trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,24}$/.test(u) || !/^[0-9]{4,8}$/.test(String(newPin || ""))) return { ok: false, error: "failed" };
        var salt = randomSaltHex(cr);
        var hash = await sha256Hex(cr, u + ":" + newPin + ":" + salt + ":dar-al-tawhid-v1");
        return rpc("acct_pin_reset_by_email", { p_username: u, p_pin_hash: hash, p_pin_salt: salt }, jwt);
      },
      _internals: { sha256Hex: function (t) { return sha256Hex(cr, t); } }
    };
  }
  return { create: create, normalizeEmail: normalizeEmail };
});
