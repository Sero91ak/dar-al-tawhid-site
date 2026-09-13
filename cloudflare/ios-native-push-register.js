const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function cleanApnsToken(raw) {
  return String(raw || "").trim().replace(/\s+/g, "").toLowerCase();
}

function isOneSignalUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function extractSubscriptionId(payload) {
  const subs = Array.isArray(payload?.subscriptions) ? payload.subscriptions : [];
  const ios = subs.find((entry) => String(entry?.type || "").toLowerCase() === "iospush") || subs[0];
  const id = String(ios?.id || payload?.subscription?.id || "").trim();
  return isOneSignalUUID(id) ? id : "";
}

function normalizeTags(raw = {}) {
  const out = {};
  for (const [key, value] of Object.entries(raw || {})) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    out[cleanKey] = String(value ?? "").trim();
  }
  return out;
}

export async function registerNativeIosPush(env, input = {}) {
  const apiKey = oneSignalApiKey(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  const deviceId = String(input.deviceId || input.device_id || "").trim();
  const pushToken = cleanApnsToken(input.pushToken || input.push_token || input.token || "");
  const tags = normalizeTags(input.tags || {});

  if (!deviceId) return { ok: false, error: "deviceId fehlt" };
  if (!pushToken || pushToken.length < 64) return { ok: false, error: "pushToken ungueltig" };
  if (!apiKey) return { ok: false, error: "OneSignal API Key fehlt am Worker" };

  const body = {
    identity: { external_id: deviceId },
    subscriptions: [
      {
        type: "iOSPush",
        token: pushToken,
        enabled: true,
        notification_types: 1,
        test_type: input.production === false || input.sandbox === true ? 1 : 0,
        sdk: "050801",
        device_os: String(input.deviceOs || input.device_os || "17.0").trim() || "17.0"
      }
    ],
    properties: {
      tags: {
        dar_push: "true",
        platform: "ios",
        dar_app: "true",
        dar_client: "native_ios",
        dar_surface: "native",
        push_site: "dar-al-tawhid",
        ...tags
      }
    }
  };

  const response = await fetch(`https://api.onesignal.com/apps/${encodeURIComponent(appId)}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  const subscriptionId = extractSubscriptionId(payload);
  if (!response.ok) {
    return {
      ok: false,
      error: String(payload?.errors?.[0] || payload?.error || text || "OneSignal user create failed").slice(0, 400),
      status: response.status,
      subscriptionId
    };
  }

  return {
    ok: Boolean(subscriptionId),
    subscriptionId,
    deviceId,
    pushToken
  };
}
