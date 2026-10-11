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
    // KIDS academy uses five genuine artwork assets below /desktop-preview/.
    // Those assets are already part of the deployed public site, but the
    // dedicated test Worker previously rejected the paths and broke images.
    // Serve only these explicit five, never open the rest of desktop-preview.
    const publicAcademyArt = new Set([
      "/desktop-preview/assets/kids-academy-akhlaq-v1.jpg",
      "/desktop-preview/assets/kids-academy-adab-v1.jpg",
      "/desktop-preview/assets/kids-academy-hero-v1.jpg",
      "/desktop-preview/assets/kids-academy-hero-boys-v1.jpg",
      "/desktop-preview/assets/kids-academy-hero-girls-v1.jpg"
    ]);
    if (publicAcademyArt.has(url.pathname)) {
      const art=await env.ASSETS.fetch(request);
      const headers=new Headers(art.headers);
      headers.set("X-Robots-Tag", ROBOT);
      headers.set("X-Content-Type-Options","nosniff");
      headers.set("Cache-Control","public, max-age=3600");
      return new Response(request.method==="HEAD"?null:art.body,{
        status:art.status,statusText:art.statusText,headers
      });
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
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers
    });
  }
};
