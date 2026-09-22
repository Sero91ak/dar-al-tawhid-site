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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";
    const ua = String(request.headers.get("User-Agent") || "");
    const nativeIos = /DarAlTawhid-iOS/i.test(ua);

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
