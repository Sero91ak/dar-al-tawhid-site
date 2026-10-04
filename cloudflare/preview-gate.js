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
