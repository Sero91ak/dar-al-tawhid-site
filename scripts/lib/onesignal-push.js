/* Shared OneSignal push helpers – icons, auth fallback, retries. */

const DEFAULT_SITE_ORIGIN = "https://dar-al-tawhid.de";

function siteOriginFromEnv(siteUrl) {
  return String(siteUrl || DEFAULT_SITE_ORIGIN).replace(/#.*$/, "").replace(/\/$/, "");
}

function notificationAssets(siteUrl) {
  const origin = siteOriginFromEnv(siteUrl);
  const icon = `${origin}/notification-icon-192.png?v=3`;
  const badge = `${origin}/notification-badge-96.png?v=3`;
  return { origin, icon, badge };
}

function withNotificationIcons(payload, siteUrl) {
  const { icon, badge } = notificationAssets(siteUrl);
  return {
    ...payload,
    chrome_web_icon: icon,
    chrome_web_badge: badge,
    firefox_icon: icon
  };
}

function separatePushLaunchUrls(payload = {}) {
  const web = String(payload.web_url || payload.url || "").trim();
  const next = { ...payload };
  delete next.url;
  if (!web) return next;
  next.web_url = web;
  next.app_url = `daraltawhid://in-app?src=${encodeURIComponent(web)}`;
  return next;
}

async function postOneSignalNotification(body, apiKey, { retries = 3 } = {}) {
  const cleanKey = String(apiKey || process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();

  if (!cleanKey) {
    throw new Error("ONESIGNAL API key fehlt");
  }

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const authMode of ["Key", "Basic"]) {
      try {
        const res = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `${authMode} ${cleanKey}`
          },
          body: JSON.stringify(separatePushLaunchUrls(body))
        });

        const text = await res.text();

        if (res.ok) {
          return { ok: true, status: res.status, text, attempt, authMode };
        }

        // Nur Auth-Fehler mit anderem Header erneut versuchen — nie denselben
        // Payload nach nicht-auth Fehlern (oder erneutem 200-Pfad) doppelt senden.
        if (res.status === 401 || res.status === 403) {
          lastError = new Error(`OneSignal ${res.status} (${authMode}): ${text}`);
          continue;
        }

        if (res.status === 400) {
          lastError = new Error(`OneSignal ${res.status} (${authMode}): ${text}`);
          break;
        }

        lastError = new Error(`OneSignal ${res.status}: ${text}`);
      } catch (err) {
        lastError = err;
      }
    }

    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }

  throw lastError || new Error("OneSignal send failed");
}

module.exports = {
  DEFAULT_SITE_ORIGIN,
  siteOriginFromEnv,
  notificationAssets,
  withNotificationIcons,
  separatePushLaunchUrls,
  postOneSignalNotification
};
