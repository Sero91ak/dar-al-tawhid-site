const DEFAULT_USER = "dar";
const DEFAULT_PASS = "NurIntern81";

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
  return new Response("Interner Bereich. Passwort erforderlich.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DAR intern", charset="UTF-8"',
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
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

function isGatedPath(pathname) {
  return pathname === "/kids"
    || pathname.startsWith("/kids/")
    || pathname === "/test"
    || pathname.startsWith("/test/")
    || pathname === "/test.html";
}

export function gateHiddenSurfaces(request, url, env, mode) {
  const pathname = url.pathname || "/";
  const ua = request.headers.get("User-Agent") || "";
  if (mode === "workers-dev") {
    if (isKidsNativeApp(ua) || isOfficialNativeApp(ua) || hasValidGateAuth(request, env)) return null;
    return unauthorizedGate();
  }
  if (!isGatedPath(pathname)) return null;
  if ((pathname === "/kids" || pathname.startsWith("/kids/")) && isKidsNativeApp(ua)) return null;
  if ((pathname === "/test" || pathname.startsWith("/test/")) && isOfficialNativeApp(ua)) return null;
  if (hasValidGateAuth(request, env)) return null;
  return unauthorizedGate();
}
