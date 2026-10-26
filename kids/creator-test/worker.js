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
    // KIDS TEST: exact public, read-only prayer calculation (same adult engine).
    // This does not grant access to any adult data or mutable APIs.
    if (url.pathname === "/api/prayer/times") {
      const lat = Number(url.searchParams.get("lat"));
      const lon = Number(url.searchParams.get("lon"));
      const angle = Number(url.searchParams.get("angle") || "12");
      const asr = Number(url.searchParams.get("asr") || "1");
      const tz = String(url.searchParams.get("tz") || "");
      const date = String(url.searchParams.get("date") || "");
      if (!Number.isFinite(lat) || Math.abs(lat) > 90 ||
          !Number.isFinite(lon) || Math.abs(lon) > 180 ||
          !Number.isFinite(angle) || angle < 1 || angle > 30 ||
          ![1, 2].includes(asr) || !tz || tz.length > 80 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return textResponse("Invalid prayer time query", 400);
      }
      const upstream = new URL("https://dar-admin-publisher.sero91ak.workers.dev/api/prayer/times");
      for (const key of ["lat","lon","angle","asr","tz","date"]) {
        upstream.searchParams.set(key, url.searchParams.get(key) || "");
      }
      try {
        const res = await fetch(upstream.toString(), { method: "GET", redirect: "error", cache: "no-store" });
        const data = await res.text();
        return new Response(request.method === "HEAD" ? null : data, {
          status: res.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "private, no-store, max-age=0",
            "X-Robots-Tag": ROBOT,
            "X-Content-Type-Options": "nosniff"
          }
        });
      } catch (_) {
        return textResponse("Prayer times unavailable", 503);
      }
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
    // KIDS TEST QUIZ 450: the 900-item editorial catalog and unapproved
    // ElevenLabs V4 candidate audio must never be exposed on this
    // unauthenticated workers.dev preview.
    if (/^\\/kids\\/data\\/(?:quiz-kids\\.json|quiz-kids-expansion-reserve-450\\.json|quiz-kids-curated-450-review\\.json|quiz-v4[^/]*)$/i.test(url.pathname)
        || /^\\/kids\\/review-only(?:\\/|$)/i.test(url.pathname)
        || /^\\/kids\\/assets\\/kids-quiz-audio\\/v4[^/]*(?:\\/|$)/i.test(url.pathname)) {
      return textResponse("Quiz editorial or unapproved V4 asset unavailable", 404);
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
      // The first KIDS TEST frame has critical CSS inline in the HEAD.
      // This prevents an unstyled/white document while the optional CSS bundle arrives.
      const posterURL = "/kids/assets/kids-splash-20261017-v1.jpg";
      const critical = '<script id="kids-test-first-frame">document.documentElement.classList.add("kids-test-booting");setTimeout(function(){if(!window.__KIDS_CREATOR_SPLASH_2__){document.documentElement.classList.remove("kids-test-booting");var s=document.getElementById("kids-test-boot");if(s)s.remove();}},10000);</script>'
        + '<meta name="theme-color" content="#07152f">'
        + '<meta name="color-scheme" content="dark">'
        + '<style id="kids-test-first-frame-css">'
        + 'html.kids-test-booting,html.kids-test-booting body{margin:0;background:#07152f!important;color-scheme:dark;overflow:hidden!important}'
        + 'html.kids-test-booting body>:not(#kids-test-boot):not(script){visibility:hidden!important}'
        + '#kids-test-boot{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;align-items:center;justify-content:center;overflow:hidden;background:#07152f!important;visibility:visible!important;color:#fff4dd;text-align:center;font-family:system-ui,sans-serif}'
        + '#kids-test-boot .ktb-poster{position:relative;width:min(100vw,56.25dvh);height:100dvh;overflow:hidden;background:#07152f url("' + posterURL + '") center/cover no-repeat}'
        + '#kids-test-boot .ktb-loading{position:absolute;left:7%;top:81%;width:86%;z-index:2}'
        + '#kids-test-boot .ktb-progress-labels{display:grid;grid-template-columns:28px 1fr 44px;gap:7px;align-items:center}'
        + '#kids-test-boot .ktb-track{height:30px;border-radius:99px;border:2px solid #f3b83d;background:#002654;overflow:hidden;padding:3px}'
        + '#kids-test-boot .ktb-fill{height:100%;width:0%;border-radius:99px;background:linear-gradient(#ffeda1,#e9a30c)}'
        + '#kids-test-boot .ktb-percent{margin:7px 0 0;font-weight:900;font-size:29px;color:#ffd16a}'
        + '#kids-test-boot .ktb-status{font-size:12px}'
        + '#kids-test-boot .ktb-recover{display:none}'
        + '</style>'
        + '<link rel="preload" as="image" href="' + posterURL + '" fetchpriority="high">'
        // Best-effort iOS Add-to-Home-Screen static launch image (browser-controlled).
        + '<link rel="apple-touch-startup-image" href="' + posterURL + '" media="(orientation: portrait)">'
        // Styles are non-blocking; critical visual styles are already inline.
        + '<link rel="stylesheet" href="/kids/splash-boot-v1.css?v=20261017-9" media="print" onload="this.media=' + "'all'" + '">'
        + '<script defer src="/kids/splash-boot-v1.js?v=20261017-9"></script>';
      const boot = '<div id="kids-test-boot" role="region" aria-label="TAWḤĪD KIDS lädt">'
        + '<div class="ktb-poster"><div class="ktb-loading">'
        + '<div class="ktb-progress-labels"><span class="ktb-edge">0%</span>'
        + '<div class="ktb-track" role="progressbar" aria-label="Startvorbereitung" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ktb-fill"></div></div>'
        + '<span class="ktb-edge">100%</span></div>'
        + '<p class="ktb-percent" aria-live="off">0%</p>'
        + '<p class="ktb-status" aria-live="polite"></p>'
        + '<button type="button" class="ktb-recover">App trotzdem öffnen</button>'
        + '</div></div><div class="ktb-reveal-glow" aria-hidden="true"></div></div>';
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      headers.delete("ETag");
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "private, no-store, max-age=0");
      // Stream the 534KB HTML rather than waiting for asset.text() before the
      // first response byte. Chunk edges retain 32 chars for tag matching.
      // Fallback remains for environments without Web Streams (including CI).
      if (asset.body && typeof TextDecoderStream !== "undefined"
          && typeof TextEncoderStream !== "undefined"
          && typeof TransformStream !== "undefined") {
        let pending = "", headDone = false, bodyDone = false;
        const decorate = new TransformStream({
          transform(chunk, controller) {
            pending += chunk;
            if (!headDone) {
              const n = pending.indexOf("<head>");
              if (n < 0) {
                if (pending.length > 32) {
                  controller.enqueue(pending.slice(0, -32));
                  pending = pending.slice(-32);
                }
                return;
              }
              pending = pending.slice(0, n) + "<head>" + critical + pending.slice(n + 6);
              headDone = true;
            }
            if (!bodyDone) {
              const n = pending.indexOf("<body>");
              if (n < 0) {
                if (pending.length > 32) {
                  controller.enqueue(pending.slice(0, -32));
                  pending = pending.slice(-32);
                }
                return;
              }
              pending = pending.slice(0, n) + "<body>" + boot + pending.slice(n + 6);
              bodyDone = true;
            }
            controller.enqueue(pending);
            pending = "";
          },
          flush(controller) { if (pending) controller.enqueue(pending); }
        });
        const html = asset.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(decorate)
          .pipeThrough(new TextEncoderStream());
        return new Response(html, { status: asset.status, headers });
      }
      const original = await asset.clone().text();
      if (original.includes("<head>") && original.includes("<body>")) {
        const decorated = original.replace("<head>", "<head>" + critical).replace("<body>", "<body>" + boot);
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
