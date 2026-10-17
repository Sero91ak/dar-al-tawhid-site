/* Dedicated DĀR AL TAWḤĪD KIDS creator-preview Worker.
 * This Worker serves only already-approved KIDS web assets from the separate
 * kids-creator-staging branch; it never routes main/visitor, Adult Test or admin.
 * NO creator privileges are granted by User-Agent or URL params.
 */
const ROBOT = "noindex, nofollow, noarchive";
function textResponse(message, status, type="text/plain; charset=utf-8") {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": ROBOT,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    }
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method)) {
      // Paid APIs and mutating calls remain disabled until owner auth exists.
      return textResponse("Creator staging: API currently disabled", 405);
    }
    if (url.pathname === "/kids" || url.pathname === "/kids/") {
      // Cloudflare HTML handling canonically serves start.html at /kids/start.
      // Never redirect /kids/start back to start.html: that creates a 307 loop.
      const out = new URL("/kids/start", url);
      return Response.redirect(out.toString(), 302);
    }
    if (!url.pathname.startsWith("/kids/")) {
      return textResponse("This private-purpose preview Worker serves KIDS only", 404);
    }
    // The source and deployment configuration are not web assets.
    if (/^\/kids\/(?:creator-test|tools)(?:\/|$)/i.test(url.pathname)
        || /^\/kids\/api\//i.test(url.pathname)) {
      return textResponse("Not available in this KIDS preview", 404);
    }
    if (url.pathname.includes("\\") || /%(?:2f|5c|00)/i.test(url.pathname)) {
      return textResponse("Invalid KIDS URL", 400);
    }
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set("X-Robots-Tag", ROBOT);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "same-origin");
    const path = url.pathname.toLowerCase();
    if (/\.(?:html?|js|css|json|webmanifest)$/.test(path)
        || asset.status !== 200) {
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
    }
    // KIDS TEST only: decorate the web entry document; no modifications to the
    // 530 KB visitor HTML or public routes. The script runs before app parsing.
    const isBootPage = ["/kids/start", "/kids/start.html", "/kids/index.html", "/kids/shell.html"].includes(path);
    if (isBootPage && asset.ok && request.method === "GET") {
      const original = await asset.text();
      const head = '<link rel="stylesheet" href="/kids/splash-boot-v1.css?v=20261017-1">'
        + '<script src="/kids/splash-boot-v1.js?v=20261017-1"></script>';
      const boot = '<div id="kids-test-boot" role="region" aria-label="TAWḤĪD KIDS wird vorbereitet">'
        + '<div class="ktb-arch" aria-hidden="true"></div>'
        + '<div class="ktb-stage"><div class="ktb-brand">'
        + '<img class="ktb-logo" src="/kids/icons/icon-512.png?v=logo28" alt="DĀR AL TAWḤĪD Kids" width="512" height="512" fetchpriority="high">'
        + '<p class="ktb-greeting">Assalāmu ʿalaikum wa raḥmatullāhi wa barakātuh</p>'
        + '<p class="ktb-tag">Entdecken · Lernen · Verstehen</p>'
        + '</div><div class="ktb-loading"><div class="ktb-progress-labels">'
        + '<span class="ktb-edge">0%</span><div class="ktb-track" role="progressbar" aria-label="App wird geladen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ktb-fill"></div></div><span class="ktb-edge">100%</span></div>'
        + '<p class="ktb-percent">0%</p><p class="ktb-status" aria-live="polite">Deine Lernwelt wird vorbereitet</p>'
        + '<button type="button" class="ktb-recover">Erneut versuchen</button></div></div></div>';
      if (original.includes("<head>") && original.includes("<body>")) {
        const decorated = original.replace("<head>", "<head>" + head).replace("<body>", "<body>" + boot);
        headers.delete("Content-Length");
        headers.delete("ETag");
        headers.set("Content-Type", "text/html; charset=utf-8");
        headers.set("Cache-Control", "private, no-store, max-age=0");
        return new Response(decorated, { status: asset.status, headers });
      }
    }
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers
    });
  }
};
