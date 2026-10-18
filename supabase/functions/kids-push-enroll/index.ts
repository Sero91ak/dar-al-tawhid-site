// TAWḤĪD KIDS push enrollment. Explicit parent consent and verified email required.
// No secrets are stored in the code; Supabase injects the service role key.
const ALLOWED_ORIGINS = new Set([
  "https://dar-al-tawhid.de",
  "https://kids.dar-al-tawhid.de"
]);
const PLATFORMS = new Set(["native_ios", "web_pwa", "android_web"]);
const AGES = new Set(["4–5", "6–8", "9–10"]);
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MAX_BODY = 4096;

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin))
    return new Response('{"error":"origin_denied"}', { status: 403 });

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Origin": origin || "https://dar-al-tawhid.de",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info"
  };
  const reply = (code, data) => new Response(JSON.stringify(data), { status: code, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const projectURL = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!projectURL.startsWith("https://") || !anonKey || !serviceKey)
    return reply(503, { error: "server_not_configured" });

  const auth = request.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(auth)) return reply(401, { error: "parent_login_required" });

  // Verify the JWT with Supabase Auth, rather than trusting client-supplied IDs.
  const verified = await fetch(projectURL + "/auth/v1/user", {
    headers: { apikey: anonKey, Authorization: auth },
    cache: "no-store"
  }).catch(() => null);
  if (!verified || !verified.ok) return reply(401, { error: "parent_login_required" });
  const user = await verified.json().catch(() => null);
  if (!user || !UUID_RE.test(String(user.id || "")) || !user.email_confirmed_at)
    return reply(403, { error: "verified_parent_email_required" });

  const raw = await request.text().catch(() => "");
  if (!raw || raw.length > MAX_BODY) return reply(413, { error: "invalid_request" });
  let body;
  try { body = JSON.parse(raw); } catch (_) { return reply(400, { error: "invalid_json" }); }
  const action = String(body?.action || "");
  if (!["enable", "disable"].includes(action)) return reply(400, { error: "unknown_action" });
  if (body.parentConfirmed !== true) return reply(403, { error: "parent_confirmation_required" });

  const subscriptionID = String(body.subscriptionId || "").trim();
  if (!UUID_RE.test(subscriptionID)) return reply(400, { error: "invalid_subscription" });
  const guardianID = String(user.id);
  const uri = projectURL + "/rest/v1/kids_push_subscriptions";
  const svcHeaders = {
    apikey: serviceKey,
    "Content-Type": "application/json",
    Accept: "application/json",
    Prefer: "return=minimal"
  };
  if (serviceKey.startsWith("eyJ")) svcHeaders.Authorization = "Bearer " + serviceKey;
  const db = async (method, params, record) => {
    const target = new URL(uri);
    for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
    return fetch(target.toString(), {
      method,
      headers: svcHeaders,
      body: record ? JSON.stringify(record) : undefined,
      cache: "no-store"
    });
  };

  // Cross-guardian device takeover is forbidden. Existing rows reveal no
  // subscriber or child information in the API response.
  const existingURL = new URL(uri);
  existingURL.searchParams.set("select", "guardian_auth_id");
  existingURL.searchParams.set("onesignal_subscription_id", "eq." + subscriptionID);
  const current = await fetch(existingURL.toString(), {
    headers: svcHeaders, cache: "no-store"
  }).catch(() => null);
  if (!current || !current.ok) return reply(503, { error: "enrollment_unavailable" });
  const rows = await current.json().catch(() => null);
  if (!Array.isArray(rows)) return reply(503, { error: "enrollment_unavailable" });
  if (rows.length && rows[0]?.guardian_auth_id !== guardianID)
    return reply(409, { error: "device_already_registered" });

  const at = new Date().toISOString();
  const match = {
    onesignal_subscription_id: "eq." + subscriptionID,
    guardian_auth_id: "eq." + guardianID
  };
  if (action === "disable") {
    if (!rows.length) return reply(200, { ok: true, enabled: false });
    const stopped = await db("PATCH", match, {
      consent_revoked_at: at, prayer_enabled: false, learning_enabled: false,
      quiz_enabled: false, content_enabled: false, updated_at: at
    }).catch(() => null);
    return stopped?.ok ? reply(200, { ok: true, enabled: false })
      : reply(503, { error: "enrollment_unavailable" });
  }

  const platform = String(body.platform || "");
  const age = String(body.ageBand || "");
  if (!PLATFORMS.has(platform) || !AGES.has(age))
    return reply(400, { error: "invalid_platform_or_age" });
  const source = body.preferences && typeof body.preferences === "object"
    && !Array.isArray(body.preferences) ? body.preferences : {};
  const prefs = Object.fromEntries(
    ["prayer", "learning", "quiz", "content"].map(k => [k, source[k] === true])
  );
  // Never infer coordinates from a child's profile or IP address.
  let lat = null, lon = null, city = null, timezone = null;
  if (prefs.prayer) {
    lat = Number(body.location?.lat);
    lon = Number(body.location?.lon);
    timezone = String(body.location?.timezone || "");
    city = String(body.location?.city || "").trim().slice(0, 100);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180 ||
        !timezone || timezone.length > 80)
      return reply(400, { error: "location_required_for_prayer" });
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); }
    catch (_) { return reply(400, { error: "invalid_timezone" }); }
  }
  // A single guardian may register a limited number of devices, no bulk abuse.
  if (!rows.length) {
    const countURL = new URL(uri);
    countURL.searchParams.set("select", "id");
    countURL.searchParams.set("guardian_auth_id", "eq." + guardianID);
    countURL.searchParams.set("consent_revoked_at", "is.null");
    countURL.searchParams.set("limit", "13");
    const countResponse = await fetch(countURL.toString(), {
      headers: svcHeaders, cache: "no-store"
    }).catch(() => null);
    const already = countResponse?.ok ? await countResponse.json().catch(() => null) : null;
    if (!Array.isArray(already)) return reply(503, { error: "enrollment_unavailable" });
    if (already.length >= 12) return reply(429, { error: "device_limit" });
  }

  const digest = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(guardianID + ":" + subscriptionID));
  const installationHash = Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
  const data = {
    guardian_auth_id: guardianID,
    installation_hash: installationHash,
    onesignal_subscription_id: subscriptionID,
    client_platform: platform,
    parent_consent_verified_at: at,
    consent_revoked_at: null,
    prayer_enabled: prefs.prayer,
    learning_enabled: prefs.learning,
    quiz_enabled: prefs.quiz,
    content_enabled: prefs.content,
    kids_age_band: age,
    prayer_lat: lat, prayer_lon: lon, prayer_city: city,
    prayer_timezone: timezone,
    last_seen_at: at, updated_at: at
  };
  // Never re-assign a device to another guardian on conflict.
  const saved = await db(rows.length ? "PATCH" : "POST", rows.length ? match : {}, data)
    .catch(() => null);
  if (!saved?.ok) return reply(503, { error: "enrollment_unavailable" });
  return reply(200, { ok: true, enabled: true });
});
