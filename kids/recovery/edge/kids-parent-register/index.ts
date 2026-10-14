/**
 * KIDS parent-register (STAGED, NOT DEPLOYED).
 * Parents authenticate their email via Supabase Auth OTP. This service validates
 * the resulting JWT against Supabase Auth and performs an atomic service-role-only
 * SQL registration. There are no SMTP credentials in frontend or source control.
 *
 * DEPLOY ONLY after:
 * 1. A permitted free/approved custom SMTP sender + six-digit Token email template.
 * 2. The stage SQL migration and the legacy kids_register cutover migration.
 * 3. Negative auth, duplicate, existing-account and iPhone regression tests.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const origins = new Set([
  "https://dar-al-tawhid.de",
  "https://www.dar-al-tawhid.de",
  "https://dar-al-tawhid-kids-creator.sero91ak.workers.dev",
]);
const baseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
function headers(origin: string | null): HeadersInit {
  return origin && origins.has(origin)
    ? {
        ...baseHeaders,
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      }
    : baseHeaders;
}
function reply(status: number, body: Record<string, unknown>, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
function invalid(status = 400, origin: string | null = null): Response {
  // Never disclose account existence, verified email, identities or account details.
  return reply(status, {
    ok: false,
    error: "Die sichere Registrierung konnte nicht abgeschlossen werden.",
  }, origin);
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (origin && !origins.has(origin)) return invalid(403, origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers(origin) });
  }
  if (request.method !== "POST") return invalid(405, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const roleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !roleKey) return invalid(503, origin);

  const tokenMatch = (request.headers.get("Authorization") || "").match(/^Bearer ([A-Za-z0-9._~-]{30,4096})$/);
  if (!tokenMatch) return invalid(401, origin);

  try {
    const raw = await request.text();
    if (raw.length > 65536) return invalid(413, origin);
    const form = JSON.parse(raw) as Record<string, unknown>;
    if (!form || typeof form !== "object" || Array.isArray(form)) return invalid(400, origin);

    const name = String(form.p_name ?? "").trim();
    const hash = String(form.p_hash ?? "");
    const gender = String(form.p_gender ?? "");
    const age = String(form.p_age ?? "");
    const email = String(form.p_parent_email ?? "").trim().toLowerCase();
    const data = form.p_data;
    if (name.length < 2 || name.length > 24 ||
        !/^[a-f0-9]{64}$/.test(hash) ||
        !["boy", "girl"].includes(gender) ||
        !["4–5", "6–8", "9–10"].includes(age) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254 ||
        form.parent_consent !== true ||
        !data || typeof data !== "object" || Array.isArray(data)) return invalid(400, origin);

    // A client-provided email or "email_verified" field is NEVER an identity proof.
    const admin = createClient(url, roleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: auth, error: authError } = await admin.auth.getUser(tokenMatch[1]);
    const user = auth?.user;
    if (authError || !user || !user.email_confirmed_at ||
        user.email?.toLowerCase() !== email) return invalid(401, origin);

    const { data: result, error } = await admin.rpc("kids_register_verified_parent", {
      p_auth_user_id: user.id,
      p_parent_email: email,
      p_name: name,
      p_hash: hash,
      p_gender: gender,
      p_age: age,
      p_data: data,
    });
    if (error || !result || result.ok !== true || result.verified !== true) {
      return invalid(400, origin);
    }
    // Send no email, password hash, access token or internal DB record to the browser.
    return reply(200, { ok: true, verified: true }, origin);
  } catch (_error) {
    // Do not log request or secrets (contains credentials and children's data).
    return invalid(400, origin);
  }
});
