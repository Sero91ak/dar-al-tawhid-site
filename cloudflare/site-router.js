function wantsDesktopWebsite(request, url) {
  const ua = String(request.headers.get("User-Agent") || "");
  const q = url.searchParams;
  if (q.get("homescreen") === "1" || q.get("app") === "1" || q.get("mobile") === "1") return false;
  if (/DarAlTawhid-iOS|DarAlTawhidAndroid/i.test(ua)) return false;
  const phone = /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Android[^;]*Mobile/i.test(ua);
  const tablet =
    /iPad|Tablet|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    (/Macintosh/i.test(ua) && /Mobile\//i.test(ua));
  if (phone && !tablet) return false;
  return true;
}

function desktopHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.set("Vary", "User-Agent");
  headers.set("Cache-Control", "no-cache, must-revalidate");
  headers.set("X-Dar-Surface", "desktop-web");
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  headers.delete("ETag");
  return headers;
}

function iosNativeHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.set("Vary", "User-Agent");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("X-Dar-Surface", "ios-native");
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  headers.delete("ETag");
  return headers;
}

const KIDS_MIRROR = "https://dar-al-tawhid-test.sero91ak.workers.dev";

async function fetchKidsMirror(pathname, search) {
  const path = pathname === "/test/kids" ? "/test/kids/" : pathname;
  const dest = `${KIDS_MIRROR}${path}${search || ""}`;
  const res = await fetch(dest, { method: "GET", redirect: "manual" });
  if (res.status < 300 || res.status >= 400) return res;
  const loc = res.headers.get("Location");
  if (!loc) return res;
  const next = new URL(loc, dest);
  next.protocol = "https:";
  next.hostname = "dar-al-tawhid-test.sero91ak.workers.dev";
  return fetch(next.toString(), { method: "GET", redirect: "follow" });
}

function kidsHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  headers.set("X-Kids-Build", "kids-shell-v12-start1");
  headers.delete("ETag");
  headers.delete("Content-Length");
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";
    const ua = String(request.headers.get("User-Agent") || "");
    const nativeIos = /DarAlTawhid-iOS/i.test(ua);
    const kidsPath = url.pathname === "/test/kids" || url.pathname.startsWith("/test/kids/");
    const voicePath = url.pathname === "/voice-studio" || url.pathname.startsWith("/voice-studio/");
    const legacyVoicePath = url.pathname === "/test/voice-studio" || url.pathname.startsWith("/test/voice-studio/");

    if ((request.method === "GET" || request.method === "HEAD") && legacyVoicePath) {
      const target = new URL(request.url);
      const suffix = url.pathname.slice("/test/voice-studio".length);
      target.pathname = "/voice-studio" + (suffix || "/");
      return Response.redirect(target.toString(), 301);
    }

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/voice-studio") {
      const target = new URL(request.url);
      target.pathname = "/voice-studio/";
      return Response.redirect(target.toString(), 308);
    }

    if ((request.method === "GET" || request.method === "HEAD") && voicePath) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("X-DAR-Voice-Studio", "voice-studio-v4");
      headers.delete("ETag");
      headers.delete("Content-Length");
      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    if (kidsPath && (request.method === "GET" || request.method === "HEAD")) {
      if (url.pathname.endsWith("/v12-alive.txt")) {
        const headers = kidsHeaders(new Response(""));
        headers.set("Content-Type", "text/plain; charset=utf-8");
        const body = "kids-shell-v12-start1\nKIDS · V0.12r\n";
        if (request.method === "HEAD") return new Response(null, { status: 200, headers });
        return new Response(body, { status: 200, headers });
      }

      const isKidsDocument = url.pathname === "/test/kids"
        || url.pathname === "/test/kids/"
        || url.pathname === "/test/kids/index.html"
        || url.pathname === "/test/kids/start"
        || url.pathname === "/test/kids/start.html"
        || url.pathname === "/test/kids/shell.html"
        || url.pathname === "/test/kids/shell";
      if (isKidsDocument) {
        const headers = kidsHeaders(new Response(""));
        headers.set("Content-Type", "text/html; charset=utf-8");
        const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1220">
<title>DĀR AL TAWḤĪD Kids</title>
<style>html,body{margin:0;height:100%;background:#0b1220}iframe{display:block;width:100%;height:100%;border:0}</style>
</head>
<body>
<iframe src="${KIDS_MIRROR}/test/kids/" title="DĀR AL TAWḤĪD Kids" allow="autoplay *; fullscreen *; geolocation *"></iframe>
</body>
</html>`;
        if (request.method === "HEAD") return new Response(null, { status: 200, headers });
        return new Response(html, { status: 200, headers });
      }

      const assetResponse = await fetchKidsMirror(url.pathname, url.search);
      const headers = kidsHeaders(assetResponse);
      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && nativeIos) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = iosNativeHeaders(assetResponse);
      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && wantsDesktopWebsite(request, url)) {
      const target = new URL("/desktop-preview/index.html", url.origin);
      const assetRequest = new Request(target.toString(), request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      const headers = desktopHeaders(assetResponse);

      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }

      let html = await assetResponse.text();
      if (assetResponse.ok) {
        const styleTag = '<link rel="stylesheet" href="/desktop-preview/desktop-overhaul.css?v=181">';
        const scriptTag = '<script defer src="/desktop-preview/desktop-overhaul.js?v=181"><\/script>';
        if (!html.includes("desktop-overhaul.css")) html = html.replace("</head>", styleTag + "</head>");
        if (!html.includes("desktop-overhaul.js")) html = html.replace("</body>", scriptTag + "</body>");
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(html, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
    }

    return env.ASSETS.fetch(request);
  }
};
