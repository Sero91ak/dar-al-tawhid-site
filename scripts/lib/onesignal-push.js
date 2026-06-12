/* Shared OneSignal push helpers – icons, auth fallback, retries. */

const DEFAULT_SITE_ORIGIN = "https://dar-al-tawhid.de";

function siteOriginFromEnv(siteUrl) {
  return String(siteUrl || DEFAULT_SITE_ORIGIN).replace(/#.*$/, "").replace(/\/$/, "");
}

function notificationAssets(siteUrl) {
  const origin = siteOriginFromEnv(siteUrl);
  const icon = `${origin}/notification-icon-192.png?v=2`;
  const badge = `${origin}/notification-badge-96.png?v=2`;
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
          body: JSON.stringify(body)
        });

        const text = await res.text();

        if (res.ok) {
          return { ok: true, status: res.status, text, attempt, authMode };
        }

        if (res.status === 400 || res.status === 401 || res.status === 403) {
          lastError = new Error(`OneSignal ${res.status} (${authMode}): ${text}`);
          continue;
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
  postOneSignalNotification
};
