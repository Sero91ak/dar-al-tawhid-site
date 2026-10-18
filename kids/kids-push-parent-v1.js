/* onesignal:managed v1 — Kids-only parent opt-in; no automatic permission prompts. */
(function () {
  "use strict";
  const APP_ID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
  const PREF_KEY = "dar.kids.push.preferences.v1";
  const CONSENT_KEY = "dar.kids.push.parent.consent.v1";
  const IS_NATIVE = Boolean(window.DAR_KIDS_IOS_APP || window.DAR_IOS_NATIVE_APP);
  // Browsers share push permissions and storage across / and /kids/ on one
  // origin. Never register a second OneSignal Web App on the adult host.
  const DEDICATED_WEB_HOST = "kids.dar-al-tawhid.de";
  const WEB_HOST_SAFE = location.hostname === DEDICATED_WEB_HOST;
  const IS_TEST = Boolean(window.DAR_KIDS_TEST_CONTAINER);
  const $ = (id) => document.getElementById(id);
  const TYPES = [
    ["prayer", "Fünf Gebete", "Fajr, Ẓuhr, ʿAṣr, Maġrib und ʿIšāʾ"],
    ["learning", "Lernen fortsetzen", "An begonnene Lerneinheiten erinnern"],
    ["quiz", "Quiz fortsetzen", "An unterbrochene Quizrunden erinnern"],
    ["content", "Neue Inhalte", "Neue Geschichten und Lernangebote"]
  ];
  if (IS_TEST || !location.pathname.startsWith("/kids/")) return;
  let os = null;
  let initPromise = null;
  let panel = null;
  const read = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  function prefs() {
    try {
      const parsed = JSON.parse(read(PREF_KEY) || "{}");
      return Object.fromEntries(TYPES.map(([key]) => [key, parsed[key] === true]));
    } catch (_) {
      return Object.fromEntries(TYPES.map(([key]) => [key, false]));
    }
  }
  function ageGroup() {
    const raw = String(read("kids.age") || "").trim();
    const valid = ["4–5", "6–8", "9–10"];
    return valid.includes(raw) ? raw : "";
  }
  function tags() {
    const settings = prefs();
    const v = (flag) => (flag ? "yes" : "no");
    const consent = read(CONSENT_KEY) === "yes";
    const result = {
      dar_kids: "true",
      kids_parent_push_consent: v(consent),
      kids_prayer_push: v(consent && settings.prayer),
      kids_learning_push: v(consent && settings.learning),
      kids_quiz_push: v(consent && settings.quiz),
      kids_content_push: v(consent && settings.content)
    };
    if (ageGroup()) result.kids_age = ageGroup();
    return result;
  }
  function status(message) {
    const el = $("kidsPushParentStatus");
    if (el) el.textContent = message;
  }
  function nativeMessage(action) {
    if (!IS_NATIVE || !window.webkit?.messageHandlers?.darKidsPush) return false;
    window.webkit.messageHandlers.darKidsPush.postMessage({
      action, settings: prefs(), age: ageGroup()
    });
    return true;
  }
  async function syncTags() {
    if (IS_NATIVE) {
      nativeMessage("configure");
      return;
    }
    if (!os) return;
    await os.User.addTags(tags());
    if (read(CONSENT_KEY) === "yes") {
      os.User.PushSubscription.optIn();
    } else {
      os.User.PushSubscription.optOut();
    }
  }
  async function ensureWebSDK() {
    if (IS_NATIVE) return null; // WKWebView uses native APNs, never web push.
    if (!WEB_HOST_SAFE) throw new Error("Kids web push needs a separate origin.");
    if (initPromise) return initPromise;
    initPromise = new Promise((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (oneSignal) => {
        try {
          await oneSignal.init({
            appId: APP_ID,
            serviceWorkerPath: "kids/push/onesignal/OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/kids/push/onesignal/" }
          });
          os = oneSignal;
          resolve(oneSignal);
        } catch (error) { reject(error); }
      });
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;
      script.onerror = () => reject(new Error("OneSignal-SDK konnte nicht geladen werden"));
      document.head.appendChild(script);
    }).catch(error => { initPromise = null; throw error; });
    return initPromise;
  }
  async function enable() {
    const checkbox = $("kidsPushParentConfirm");
    if (!checkbox?.checked) {
      status("Bitte zuerst bestätigen, dass du erziehungsberechtigt bist.");
      return;
    }
    if (IS_NATIVE) {
      status("Bitte die Geräte-Authentifizierung bestätigen.");
      nativeMessage("enable");
      return;
    }
    if (!WEB_HOST_SAFE) {
      status("Web-Push wird erst auf der eigenen Kids-Adresse aktiviert, damit die Erwachsenen-App geschützt bleibt.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      status("Dieser Browser unterstützt keine Push-Benachrichtigungen.");
      return;
    }
    if (Notification.permission === "denied") {
      status("Benachrichtigungen sind im Browser blockiert. Bitte in den Browser-Einstellungen erlauben.");
      return;
    }
    try {
      const oneSignal = await ensureWebSDK();
      if (Notification.permission !== "granted") {
        // The OneSignal in-page prompt supplies the user gesture for Safari.
        await oneSignal.Slidedown.promptPush();
      }
      if (Notification.permission !== "granted") {
        status("Die Browser-Berechtigung wurde noch nicht erteilt.");
        return;
      }
      save(CONSENT_KEY, "yes");
      await syncTags();
      status("Aktiviert. Wähle oben die gewünschten Benachrichtigungen.");
    } catch (error) {
      status("Aktivierung derzeit nicht möglich. Bitte später erneut versuchen.");
    }
  }
  async function disable() {
    save(CONSENT_KEY, "no");
    if (IS_NATIVE) {
      nativeMessage("disable");
      status("Benachrichtigungen auf diesem Gerät deaktiviert.");
      return;
    }
    if (os) {
      try { await os.User.addTags(tags()); os.User.PushSubscription.optOut(); } catch (_) {}
    }
    status("Benachrichtigungen auf diesem Gerät deaktiviert.");
  }
  function makePanel() {
    const page = $("view-parents");
    if (!page || $("kidsPushParentPanel")) return;
    panel = document.createElement("section");
    panel.className = "parent-card";
    panel.id = "kidsPushParentPanel";
    panel.style.cssText = "margin:16px 0;padding:18px;border-radius:22px;";
    const title = document.createElement("h3");
    title.textContent = "Benachrichtigungen";
    const hint = document.createElement("p");
    hint.textContent = "Nur mit Freigabe der Eltern. Jeder Bereich ist einzeln einstellbar.";
    panel.append(title, hint);
    const settings = prefs();
    TYPES.forEach(([key, label, description]) => {
      const row = document.createElement("label");
      row.style.cssText = "display:flex;align-items:center;gap:12px;padding:11px 0;cursor:pointer;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = settings[key];
      input.setAttribute("aria-label", label);
      input.addEventListener("change", () => {
        const updated = prefs();
        updated[key] = input.checked;
        save(PREF_KEY, JSON.stringify(updated));
        syncTags().catch(() => {});
      });
      const texts = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = label;
      const small = document.createElement("small");
      small.textContent = description;
      small.style.cssText = "display:block;opacity:.8;margin-top:3px;";
      texts.append(strong, small);
      row.append(input, texts);
      panel.appendChild(row);
    });
    const consent = document.createElement("label");
    consent.style.cssText = "display:flex;align-items:center;gap:9px;margin:12px 0;";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.id = "kidsPushParentConfirm";
    const text = document.createElement("span");
    text.textContent = "Ich bin erziehungsberechtigt und stimme diesen Benachrichtigungen zu.";
    consent.append(check, text);
    panel.appendChild(consent);
    const yes = document.createElement("button");
    yes.type = "button";
    yes.textContent = "Benachrichtigungen aktivieren";
    yes.addEventListener("click", enable);
    const no = document.createElement("button");
    no.type = "button";
    no.textContent = "Deaktivieren";
    no.style.marginLeft = "12px";
    no.addEventListener("click", disable);
    const result = document.createElement("p");
    result.id = "kidsPushParentStatus";
    result.setAttribute("role", "status");
    result.style.marginTop = "12px";
    result.textContent = read(CONSENT_KEY) === "yes"
      ? "Benachrichtigungen auf diesem Gerät eingerichtet."
      : "Noch nicht aktiviert.";
    panel.append(yes, no, result);
    page.querySelector(".page-head")?.after(panel);
  }
  window.addEventListener("dar-kids-push-permission", (event) => {
    const enabled = event.detail?.enabled === true;
    save(CONSENT_KEY, enabled ? "yes" : "no");
    if (enabled) nativeMessage("configure");
    status(enabled ? "Benachrichtigungen aktiviert." : "Berechtigung nicht erteilt.");
  });
  function openNotificationDestination() {
    const requested = new URL(location.href).searchParams.get("view");
    if (!["quiz", "learning", "stories", "parents"].includes(requested)) return;
    let attempts = 0;
    const waitForKidsUI = () => {
      if (document.getElementById("profileJoin")?.hidden === false) return;
      const selector = {
        quiz: "#openQuizButton",
        learning: "[data-academy-open=\"1\"]",
        stories: ".bottom-nav .nav-btn[data-target=\"stories\"]",
        parents: ".bottom-nav .nav-btn[data-target=\"parents\"]"
      }[requested];
      const button = document.querySelector(selector);
      if (!button) {
        if (++attempts < 10) setTimeout(waitForKidsUI, 300);
        return;
      }
      // Open the existing library/lesson-resume controls, never restart progress.
      button.click();
      const url = new URL(location.href);
      url.searchParams.delete("view");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    };
    setTimeout(waitForKidsUI, 180);
  }
  function init() {
    makePanel();
    openNotificationDestination();
    // Only initialize Web SDK on existing explicit consent. Never auto-prompt.
    if (!IS_NATIVE && WEB_HOST_SAFE && read(CONSENT_KEY) === "yes") {
      ensureWebSDK().then(syncTags).catch(() => status("Push derzeit nicht erreichbar."));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
