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
    if (url.pathname === "/kids" || url.pathname === "/kids/"
        || url.pathname === "/kids/start") {
      const out = new URL("/kids/start.html", url);
      return Response.redirect(out.toString(), 302);
    }
    // html_handling=none does not add index.html. Keep the academy iframe
    // and typed /kids/akademie URLs on the real document.
    if (url.pathname === "/kids/akademie" || url.pathname === "/kids/akademie/") {
      const out = new URL("/kids/akademie/index.html", url);
      out.search = url.search;
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
    headers.set("Referrer-Policy", "same-origin");
    const path = url.pathname.toLowerCase();
    // Lernen opens the academy in a same-origin iframe. DENY leaves that tab blank
    // (live does not send X-Frame-Options). Keep DENY on the shell and other assets.
    const allowSameOriginFrame = path === "/kids/akademie/index.html"
      || path.startsWith("/kids/akademie/");
    headers.set("X-Frame-Options", allowSameOriginFrame ? "SAMEORIGIN" : "DENY");
    if (/\.(?:html?|js|css|json|webmanifest)$/.test(path)
        || asset.status !== 200) {
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
    }
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers
    });
  }
};
