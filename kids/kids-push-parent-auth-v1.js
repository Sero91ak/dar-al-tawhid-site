/* TAWḤĪD KIDS: verify guardian email before enrolling devices in protected Supabase. */
(function () {
  "use strict";
  if (!location.pathname.startsWith("/kids/") || window.DAR_KIDS_TEST_CONTAINER) return;
  const SUPABASE = "https://djyfkttjbdraynuxrzno.supabase.co";
  // Public Supabase publishable key (NOT a service-role key).
  const PUBLIC_KEY = "sb_publishable_kR6b1SlL3uoVq4gbTFWKkQ_a2Rcfg2i";
  const ENDPOINT = SUPABASE + "/functions/v1/kids-push-enroll";
  const STORAGE_SESSION = "dar.kids.push.guardian.session.v1";
  const STORAGE_CONSENT = "dar.kids.push.parent.consent.v1";
  const STORAGE_PREFS = "dar.kids.push.preferences.v1";
  const NATIVE = Boolean(window.DAR_KIDS_IOS_APP || window.DAR_IOS_NATIVE_APP);
  const WEB_HOST_OK = location.hostname === "kids.dar-al-tawhid.de";
  const $ = id => document.getElementById(id);
  let submitting = false, lastRegistered = "", requestedAt = 0;
  const get = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const sessionGet = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORAGE_SESSION) || "null");
      return s && s.access_token && Date.now() < Number(s.expires_at || 0) - 15000 ? s : null;
    } catch (_) { return null; }
  };
  const preferences = () => {
    try { return JSON.parse(get(STORAGE_PREFS) || "{}"); } catch (_) { return {}; }
  };
  function say(text) {
    const status = $("kidsPushGuardianStatus");
    if (status) status.textContent = text;
  }
  async function authPost(route, body) {
    const response = await fetch(SUPABASE + "/auth/v1/" + route, {
      method: "POST",
      headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(result.msg || result.error_description || result.message || "Eltern-Anmeldung fehlgeschlagen"));
    return result;
  }
  async function requestCode() {
    const email = String($("kidsPushGuardianEmail")?.value || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say("Bitte eine gültige Eltern-E-Mail-Adresse eingeben."); return; }
    if (Date.now() - requestedAt < 60000) { say("Bitte vor dem erneuten Versand eine Minute warten."); return; }
    requestedAt = Date.now();
    try {
      await authPost("otp", { email, create_user: true });
      say("Bestätigung angefordert. Bitte den E-Mail-Code eingeben.");
    } catch (_) {
      say("Der Bestätigungscode konnte nicht gesendet werden. Bitte Supabase-E-Mail-Einstellungen prüfen.");
    }
  }
  async function verifyCode() {
    const email = String($("kidsPushGuardianEmail")?.value || "").trim().toLowerCase();
    const token = String($("kidsPushGuardianCode")?.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6,8}$/.test(token)) {
      say("Bitte Eltern-E-Mail und sechs- bis achtstelligen Bestätigungscode eingeben.");
      return;
    }
    try {
      const result = await authPost("verify", { email, token, type: "email" });
      if (!result.access_token) throw new Error("token_missing");
      const expires = Date.now() + Math.min(Math.max(Number(result.expires_in) || 3600, 60), 7200) * 1000;
      sessionStorage.setItem(STORAGE_SESSION, JSON.stringify({ access_token: result.access_token, expires_at: expires }));
      $("kidsPushGuardianCode").value = "";
      say("Eltern-E-Mail bestätigt. Die Gerätefreigabe kann jetzt abgeschlossen werden.");
      await registerDevice();
    } catch (_) {
      say("Code ungültig oder abgelaufen. Bitte neuen Code anfordern.");
    }
  }
  async function subscriptionId() {
    if (NATIVE) {
      return await new Promise((resolve) => {
        const listener = event => { clearTimeout(timeout); resolve(event.detail?.id || ""); };
        const timeout = setTimeout(() => {
          window.removeEventListener("dar-kids-native-subscription", listener);
          resolve("");
        }, 7000);
        window.addEventListener("dar-kids-native-subscription", listener, { once: true });
        if (!window.webkit?.messageHandlers?.darKidsPush) {
          clearTimeout(timeout);
          window.removeEventListener("dar-kids-native-subscription", listener);
          resolve("");
          return;
        }
        window.webkit.messageHandlers.darKidsPush.postMessage({ action: "subscription" });
      });
    }
    if (!WEB_HOST_OK) return "";
    const sdk = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("sdk_timeout")), 7000);
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(oneSignal => { clearTimeout(timeout); resolve(oneSignal); });
    }).catch(() => null);
    if (!sdk) return "";
    for (let i = 0; i < 20; i++) {
      const id = sdk.User?.PushSubscription?.id;
      if (id) return id;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return "";
  }
  function readAge() {
    const age = String(get("kids.age") || document.documentElement.dataset.kidsAge || "");
    if (["4–5", "6–8", "9–10"].includes(age)) return age;
    return "";
  }
  async function locationIfNeeded(prefs) {
    if (prefs.prayer !== true) return null;
    if (!navigator.geolocation) throw new Error("location_missing");
    const coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => reject(new Error("location_denied")),
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 }
      );
    });
    return { ...coords, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }
  async function callEnrollment(body) {
    const token = sessionGet()?.access_token;
    if (!token) throw new Error("session_missing");
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { apikey: PUBLIC_KEY, Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, parentConfirmed: true }),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("enrollment_" + response.status);
    return response.json();
  }
  async function registerDevice() {
    if (submitting || !sessionGet()) return;
    if (get(STORAGE_CONSENT) !== "yes") {
      say("Bitte zuerst die Benachrichtigungen als Elternteil aktivieren.");
      return;
    }
    if (!NATIVE && !WEB_HOST_OK) {
      say("Web-Push wartet auf die getrennte Kinder-Webadresse.");
      return;
    }
    const age = readAge();
    if (!age) { say("Bitte zuerst die Altersstufe im Elternbereich festlegen."); return; }
    submitting = true;
    try {
      const id = await subscriptionId();
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("subscription_pending");
      const prefs = preferences();
      const normalized = ["prayer", "learning", "quiz", "content"]
        .reduce((a, k) => { a[k] = prefs[k] === true; return a; }, {});
      const fingerprint = JSON.stringify({ id, age, normalized });
      if (fingerprint === lastRegistered) return;
      const loc = await locationIfNeeded(normalized);
      await callEnrollment({
        action: "enable", subscriptionId: id,
        platform: NATIVE ? "native_ios" : /android/i.test(navigator.userAgent) ? "android_web" : "web_pwa",
        ageBand: age, preferences: normalized, location: loc
      });
      lastRegistered = fingerprint;
      say("Elternkonto und Gerät sind für die ausgewählten Push-Arten freigegeben.");
    } catch (e) {
      if (String(e.message).includes("location")) say("Für Gebets-Push bitte den Standort erlauben oder Gebets-Push abwählen.");
      else if (String(e.message).includes("subscription")) say("Das Gerät ist noch nicht bei OneSignal registriert. Bitte in Kürze erneut versuchen.");
      else say("Geräteanmeldung noch nicht abgeschlossen. Bitte Eltern-Anmeldung und Verbindung prüfen.");
    } finally {
      submitting = false;
    }
  }
  async function disableServerEnrollment() {
    if (!sessionGet()) return;
    try {
      const id = await subscriptionId();
      if (/^[0-9a-f-]{36}$/i.test(id)) {
        await callEnrollment({ action: "disable", subscriptionId: id });
        lastRegistered = "";
      }
    } catch (_) {
      say("Auf dem Gerät deaktiviert. Zur serverseitigen Abmeldung bitte die Eltern-E-Mail erneut bestätigen.");
    }
  }
  function setup() {
    const card = $("kidsPushParentPanel");
    if (!card || $("kidsPushGuardianVerify")) return;
    const wrap = document.createElement("div");
    wrap.id = "kidsPushGuardianVerify";
    wrap.style.cssText = "margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18)";
    const headline = document.createElement("strong");
    headline.textContent = "Eltern-E-Mail bestätigen";
    const note = document.createElement("p");
    note.textContent = "Zum sicheren Versand einmalig einen Code an die Eltern-E-Mail senden. Der Code wird nicht im Kinderprofil gespeichert.";
    const email = document.createElement("input");
    email.id = "kidsPushGuardianEmail";
    email.type = "email";
    email.autocomplete = "email";
    email.placeholder = "E-Mail der Eltern";
    email.setAttribute("aria-label", "Eltern-E-Mail");
    const code = document.createElement("input");
    code.id = "kidsPushGuardianCode";
    code.type = "text";
    code.inputMode = "numeric";
    code.autocomplete = "one-time-code";
    code.maxLength = 8;
    code.placeholder = "Bestätigungscode";
    code.setAttribute("aria-label", "E-Mail-Bestätigungscode");
    for (const el of [email, code]) {
      el.style.cssText = "display:block;width:100%;box-sizing:border-box;min-height:46px;padding:10px 12px;margin:10px 0;font-size:16px";
    }
    const send = document.createElement("button");
    send.type = "button";
    send.textContent = "Code anfordern";
    send.addEventListener("click", requestCode);
    const verify = document.createElement("button");
    verify.type = "button";
    verify.textContent = "Code bestätigen";
    verify.style.marginLeft = "10px";
    verify.addEventListener("click", verifyCode);
    const finish = document.createElement("button");
    finish.type = "button";
    finish.textContent = "Geräteanmeldung prüfen";
    finish.style.cssText = "display:block;margin-top:12px";
    finish.addEventListener("click", registerDevice);
    const status = document.createElement("p");
    status.id = "kidsPushGuardianStatus";
    status.setAttribute("role", "status");
    status.textContent = sessionGet() ? "Eltern-E-Mail für diese Sitzung bestätigt." : "Eltern-E-Mail noch nicht bestätigt.";
    wrap.append(headline, note, email, code, send, verify, finish, status);
    card.append(wrap);

    card.addEventListener("change", e => {
      if (e.target?.type === "checkbox" && e.target.id !== "kidsPushParentConfirm")
        setTimeout(registerDevice, 100);
    });
    const disable = Array.from(card.querySelectorAll("button"))
      .find(x => x.textContent?.trim() === "Deaktivieren");
    disable?.addEventListener("click", () => setTimeout(disableServerEnrollment, 0));
    window.addEventListener("dar-kids-push-permission", e => {
      if (e.detail?.enabled) setTimeout(registerDevice, 200);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
