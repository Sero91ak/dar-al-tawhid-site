const DEFAULT_USER = "Dawud";
const DEFAULT_PASS = "Malik20";

export function isKidsNativeApp(ua) {
  return /DarAlTawhidKids-iOS/i.test(String(ua || ""));
}

export function isOfficialNativeApp(ua) {
  return /DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(String(ua || ""));
}

function gateUser(env) {
  return String((env && (env.PREVIEW_GATE_USER || env.KIDS_GATE_USER)) || DEFAULT_USER);
}

function gatePass(env) {
  return String((env && (env.PREVIEW_GATE_PASS || env.KIDS_GATE_PASS)) || DEFAULT_PASS);
}

function unauthorizedGate() {
  const html = "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title></title><style>html,body{margin:0;min-height:100%;background:#0b0a09;color:#0b0a09}</style></head><body></body></html>";
  return new Response(html, {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic realm=\"DAR intern\", charset=\"UTF-8\"",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Frame-Options": "DENY"
    }
  });
}

function hasValidGateAuth(request, env) {
  const header = String(request.headers.get("Authorization") || "");
  const match = header.match(/^Basic\s+(\S+)/i);
  if (!match) return false;
  let decoded = "";
  try {
    decoded = atob(match[1]);
  } catch (eAuth) {
    return false;
  }
  const idx = decoded.indexOf(":");
  const user = idx < 0 ? decoded : decoded.slice(0, idx);
  const pass = idx < 0 ? "" : decoded.slice(idx + 1);
  return user === gateUser(env) && pass === gatePass(env);
}

function isDarTestPath(pathname) {
  return pathname === "/test" || pathname.startsWith("/test/");
}

function isKidsAssetPath(pathname) {
  return pathname.startsWith("/kids/assets/") || pathname.startsWith("/test/kids/assets/");
}

function isGatedPath(pathname) {
  if (isKidsAssetPath(pathname)) return false;
  if (isDarTestPath(pathname) && pathname !== "/test/kids" && !pathname.startsWith("/test/kids/")) return false;
  return pathname === "/kids"
    || pathname.startsWith("/kids/")
    || pathname === "/test/kids"
    || pathname.startsWith("/test/kids/");
}

export function gateHiddenSurfaces(request, url, env, mode) {
  const pathname = url.pathname || "/";
  const ua = request.headers.get("User-Agent") || "";
  if (hasValidGateAuth(request, env)) return null;
  if (isKidsAssetPath(pathname)) return null;
  if (isDarTestPath(pathname) && pathname !== "/test/kids" && !pathname.startsWith("/test/kids/")) return null;
  if (mode === "workers-dev" && !isDarTestPath(pathname)) return unauthorizedGate();
  if (!isGatedPath(pathname)) return null;
  if ((pathname === "/kids" || pathname.startsWith("/kids/")) && isKidsNativeApp(ua)) return null;
  if ((pathname === "/test/kids" || pathname.startsWith("/test/kids/")) && isKidsNativeApp(ua)) return null;
  return unauthorizedGate();
}


/* KIDS Academy owner V19. Browser login backed ONLY by configured Worker secrets.
 * A client-side website PIN is NOT evidence of server-side authentication.
 * This signed, HttpOnly session is valid for the owner Academy routes only.
 * No HTTP WWW-Authenticate challenge is emitted, so iPhone will not open
 * its native Basic Auth dialog on these routes. */
const ACADEMY_SESSION_COOKIE = "dar_kids_academy_owner_v19";
const ACADEMY_SESSION_SECONDS = 12 * 60 * 60;
const ACADEMY_NEW_ROOT = "/test/academy";
const ACADEMY_OLD_ROOT = "/test/kids/akademie";

export function isAcademyOwnerRoute(pathname) {
  // Explicit allowlist: no wildcard, no traversal into unrelated test assets.
  const allowed = ["", "/", "/index.html", "/audio-audit-v18.html", "/unterrichtszentrale-v23.html", "/redaktion-katalog-v1.json", "/login"];
  return allowed.some(suffix => pathname === ACADEMY_NEW_ROOT + suffix ||
    pathname === ACADEMY_OLD_ROOT + suffix);
}

function academyOwnerSecret(env) {
  // This HMAC key MUST be a private Cloudflare Worker secret, not a tracked
  // wrangler [vars] value or the frontend PIN exposed in public JavaScript.
  return String(env && env.ACADEMY_OWNER_SESSION_SECRET || "");
}
function academyOwnerPassword(env) {
  // Configure the familiar site PIN privately in Cloudflare under this name.
  // A public/legacy Basic-Auth fallback is deliberately NOT accepted.
  return String(env && env.ACADEMY_OWNER_PASSWORD || "");
}
function academySafeDestination(path) {
  const value = String(path || "");
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return ACADEMY_NEW_ROOT + "/index.html";
  let pathname = "";
  try { pathname = new URL(value, "https://dar-al-tawhid.de").pathname; } catch (_) {}
  if (!isAcademyOwnerRoute(pathname) || pathname.endsWith("/login")) return ACADEMY_NEW_ROOT + "/index.html";
  // Migrate old /test/kids/ links away from cached 301 Kids-app redirects.
  if (pathname === ACADEMY_OLD_ROOT || pathname.startsWith(ACADEMY_OLD_ROOT + "/")) {
    return ACADEMY_NEW_ROOT + pathname.slice(ACADEMY_OLD_ROOT.length) + new URL(value, "https://dar-al-tawhid.de").search;
  }
  return value;
}
function academyB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function academySign(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return academyB64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))));
}
async function academyPasswordMatches(a, b) {
  // Equal-length hash comparison avoids leaking the length of a server secret.
  const [left, right] = await Promise.all([a, b].map(v =>
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(v)))));
  const aa = new Uint8Array(left), bb = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
function academyCookieValue(request) {
  const cookie = String(request.headers.get("Cookie") || "");
  const match = cookie.match(/(?:^|;\s*)dar_kids_academy_owner_v19=([^;]+)/);
  return match ? match[1] : "";
}
async function academyHasSession(request, secret) {
  const value = academyCookieValue(request);
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !/^\d{10,13}$/.test(parts[1])) return false;
  const until = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(until) || until <= now || until > now + ACADEMY_SESSION_SECONDS) return false;
  const expected = await academySign(secret, "academy-owner-v19|" + parts[1]);
  return await academyPasswordMatches(parts[2], expected);
}
function academyNoStore(headers = {}) {
  return { "Cache-Control": "private, no-store, max-age=0", "CDN-Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive", "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", ...headers };
}
function academyRedirect(destination, cookie) {
  const headers = academyNoStore({ "Location": academySafeDestination(destination) });
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}
function academyEscape(value) {
  return String(value).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function academyLoginPage(destination, status = 200, error = "") {
  const action = ACADEMY_NEW_ROOT + "/login";
  const page = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>Ersteller-Zugang · DĀR AL TAWḤĪD KIDS</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:calc(24px + env(safe-area-inset-top)) 17px calc(24px + env(safe-area-inset-bottom));font:16px/1.55 -apple-system,BlinkMacSystemFont,"Avenir Next",sans-serif;color:#fff0d6;background:radial-gradient(ellipse at top,#174857,transparent 65%),#091c2a}
main{width:min(100%,435px);padding:clamp(22px,6vw,38px);border:1px solid #5a6973;border-radius:24px;background:#102f3d;box-shadow:0 20px 65px #0004}
aside{font-size:12px;letter-spacing:.12em;color:#efd38e;font-weight:800}h1{font:normal 31px/1.18 Georgia,serif;margin:12px 0;color:#efd38e}p{color:#d3e2e2}label{display:block;font-weight:750;margin:21px 0 8px}
input,button{width:100%;min-height:50px;border-radius:12px;font:inherit}input{background:#071c29;border:1px solid #81909b;color:#fff;padding:11px 14px}button{background:#ebce93;border:0;color:#112837;font-weight:850;margin-top:14px}
input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid white;outline-offset:3px}.error{color:#ffe3ba;border-left:3px solid #efd38e;padding-left:10px}small{display:block;color:#c2d5d5;margin-top:16px}a{color:#efd38e}
</style></head><body><main><aside>DĀR AL TAWḤĪD KIDS · INTERN</aside><h1>Ersteller-Prüfstand</h1><p>Einmal anmelden und die Akademie während dieser Browsersitzung ohne weiteren iPhone-Passwortdialog prüfen.</p>
${error ? '<p class="error" role="alert">' + academyEscape(error) + '</p>' : ""}
<form method="post" action="${action}" autocomplete="on">
<input type="hidden" name="next" value="${academyEscape(academySafeDestination(destination))}">
<label for="password">Ersteller-Passwort</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required autofocus>
<button type="submit">Sicher anmelden</button></form><small>Der Zugang wird serverseitig geprüft. Es werden keine Kinder-Lernstände verändert. <a href="/">Zur Website</a></small></main></body></html>`;
  return new Response(page, { status, headers: academyNoStore({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  }) });
}

/**
 * null = unrelated route; true = authorized Academy request;
 * Response = login page, redirect, or deliberately blocked request.
 */
export async function academyOwnerAccess(request, url, env) {
  if (!isAcademyOwnerRoute(url.pathname)) return null;
  const secret = academyOwnerSecret(env), password = academyOwnerPassword(env);
  const isLogin = url.pathname === ACADEMY_NEW_ROOT + "/login"
    || url.pathname === ACADEMY_OLD_ROOT + "/login";
  const destination = academySafeDestination(url.searchParams.get("next")
    || (isLogin ? ACADEMY_NEW_ROOT + "/index.html" : url.pathname + url.search));

  if (!secret || !password) {
    // Zero-regression rollout: retain the old Basic gate for the former URL
    // until both private Cloudflare secrets have been provisioned.
    if (url.pathname === ACADEMY_OLD_ROOT || url.pathname.startsWith(ACADEMY_OLD_ROOT + "/")) return null;
    return academyLoginPage(destination, 503, "Der geschützte Serverzugang ist noch nicht eingerichtet. Bitte den Betreiber informieren.");
  }

  if (isLogin && request.method === "POST") {
    // Prevent cross-origin auto-submission of login requests.
    const origin = request.headers.get("Origin");
    if (!origin || origin !== url.origin) {
      return academyLoginPage(destination, 403, "Diese Anmeldung wurde aus Sicherheitsgründen abgewiesen.");
    }
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 2048) return academyLoginPage(destination, 413, "Die Anmeldung enthält zu viele Daten.");
    let data;
    try { data = await request.formData(); } catch (_) {
      return academyLoginPage(destination, 400, "Bitte das Passwort erneut eingeben.");
    }
    const supplied = String(data.get("password") || "").slice(0,257);
    const target = academySafeDestination(String(data.get("next") || ""));
    if (!supplied || supplied.length > 256 || !(await academyPasswordMatches(supplied, password))) {
      return academyLoginPage(target, 401, "Das Passwort ist nicht korrekt.");
    }
    const expiry = String(Math.floor(Date.now() / 1000) + ACADEMY_SESSION_SECONDS);
    const signed = await academySign(secret, "academy-owner-v19|" + expiry);
    const cookie = ACADEMY_SESSION_COOKIE + "=v1." + expiry + "." + signed
      + "; Path=/test/; Max-Age=" + ACADEMY_SESSION_SECONDS + "; HttpOnly; Secure; SameSite=Lax";
    return academyRedirect(target, cookie);
  }
  if (isLogin && request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: academyNoStore({ Allow: "GET, HEAD, POST" }) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: academyNoStore({ Allow: "GET, HEAD" }) });
  }

  if (await academyHasSession(request, secret)) {
    if (isLogin) return academyRedirect(destination);
    return true;
  }
  if (isLogin) return academyLoginPage(destination);
  const loginUrl = new URL(ACADEMY_NEW_ROOT + "/login", url.origin);
  loginUrl.searchParams.set("next", academySafeDestination(url.pathname + url.search));
  return new Response(null, { status: 302, headers: academyNoStore({ Location: loginUrl.pathname + loginUrl.search }) });
}

export function academyOwnerAssetPath(pathname) {
  if (!isAcademyOwnerRoute(pathname)) return null;
  const suffix = pathname.startsWith(ACADEMY_NEW_ROOT)
    ? pathname.slice(ACADEMY_NEW_ROOT.length) : pathname.slice(ACADEMY_OLD_ROOT.length);
  if (suffix === "" || suffix === "/" || suffix === "/index.html") return ACADEMY_OLD_ROOT + "/index.html";
  if (suffix === "/audio-audit-v18.html") return ACADEMY_OLD_ROOT + "/audio-audit-v18.html";
  if (suffix === "/unterrichtszentrale-v23.html") return ACADEMY_OLD_ROOT + "/unterrichtszentrale-v23.html";
  if (suffix === "/redaktion-katalog-v1.json") return ACADEMY_OLD_ROOT + "/redaktion-katalog-v1.json";
  return null;
}
