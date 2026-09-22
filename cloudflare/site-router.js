function wantsDesktopWebsite(request, url) {
  const ua = String(request.headers.get("User-Agent") || "");
  const q = url.searchParams;

  // Explicit app/PWA entry always keeps the visitor app.
  if (q.get("homescreen") === "1" || q.get("app") === "1" || q.get("mobile") === "1") return false;
  if (/DarAlTawhid-iOS|DarAlTawhidAndroid/i.test(ua)) return false;

  // Phones keep the visitor app.
  const phone = /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Android[^;]*Mobile/i.test(ua);

  // Tablet browsers must use the real website.
  const tablet =
    /iPad|Tablet|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    (/Macintosh/i.test(ua) && /Mobile\//i.test(ua));

  if (phone && !tablet) return false;
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && wantsDesktopWebsite(request, url)) {
      const target = new URL("/desktop-preview/index.html", url.origin);
      const assetRequest = new Request(target.toString(), request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      const headers = new Headers(assetResponse.headers);
      headers.set("Vary", "User-Agent");
      headers.set("Cache-Control", "no-cache, must-revalidate");
      headers.set("X-Dar-Surface", "desktop-web");
      return new Response(request.method === "HEAD" ? null : assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
};
