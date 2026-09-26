function isNativeAppRequest(ua) {
  return /DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(String(ua || ""));
}

function wantsPublicWebsite(request) {
  const ua = String(request.headers.get("User-Agent") || "");
  return !isNativeAppRequest(ua);
}

function desktopHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.set("Vary", "User-Agent");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("X-Dar-Surface", "public-website");
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
  headers.set("X-Kids-Build", "kids-shell-v12-tab12");
  headers.delete("ETag");
  headers.delete("Content-Length");
  return headers;
}

function browserManifestResponse(request) {
  const manifest = {
    $schema: "https://json.schemastore.org/web-manifest-combined.json",
    name: "DĀR AL TAWḤĪD Website",
    short_name: "DĀR AL TAWḤĪD",
    display: "browser",
    display_override: ["browser"],
    start_url: "/?page=start",
    scope: "/",
    id: "/?page=start",
    theme_color: "#fbfaf6",
    background_color: "#fbfaf6",
    description: "DĀR AL TAWḤĪD – Webseite mit Qurʾān, Sunnah, Āṯār, Beiträgen, Duʿāʾ und Bibliothek.",
    orientation: "any",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
  const headers = new Headers({
    "Content-Type": "application/manifest+json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "X-Dar-Surface": "public-website-manifest"
  });
  return new Response(request.method === "HEAD" ? null : JSON.stringify(manifest, null, 2), { status: 200, headers });
}

function publicWebsiteAddon() {
  return `
<style id="darPublicWebsiteOnlyV1">
#darIosAppStorePromo{display:none;width:min(1180px,calc(100% - 28px));margin:26px auto 38px;padding:17px 18px;border:1px solid rgba(152,116,57,.22);border-radius:24px;background:linear-gradient(105deg,#121d25,#1b2d34 52%,#213a32);box-shadow:0 14px 34px rgba(14,25,28,.13);color:#fffaf0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
#darIosAppStorePromo.is-visible{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:14px}
#darIosAppStorePromo .dar-store-apple{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.08);color:#ead39a}
#darIosAppStorePromo .dar-store-apple svg{width:25px;height:25px}
#darIosAppStorePromo .dar-store-copy strong{display:block;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:17px;font-weight:600;letter-spacing:.01em}
#darIosAppStorePromo .dar-store-copy span{display:block;margin-top:4px;color:rgba(255,250,240,.68);font-size:10px;line-height:1.45}
#darIosAppStorePromo .dar-store-link{display:flex;align-items:center;gap:9px;min-height:46px;padding:0 15px;border:1px solid rgba(234,211,154,.26);border-radius:15px;background:#fffaf0;color:#15231f;text-decoration:none;font-size:10px;font-weight:850;letter-spacing:.02em;white-space:nowrap}
#darIosAppStorePromo .dar-store-link svg{width:22px;height:22px;flex:0 0 auto}
@media(max-width:680px){#darIosAppStorePromo.is-visible{grid-template-columns:40px minmax(0,1fr);gap:12px;padding:15px;border-radius:20px}#darIosAppStorePromo .dar-store-link{grid-column:1/3;justify-content:center;width:100%}}
</style>
<section id="darIosAppStorePromo" aria-label="DĀR AL TAWḤĪD im App Store">
  <div class="dar-store-apple" aria-hidden="true">
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.37 12.64c-.03-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.69-1.32-.14-2.59.78-3.26.78s-1.7-.76-2.81-.74c-1.44.02-2.78.84-3.52 2.14-1.51 2.62-.39 6.5 1.08 8.63.72 1.04 1.58 2.21 2.71 2.17 1.09-.05 1.5-.7 2.81-.7s1.68.7 2.82.68c1.17-.02 1.91-1.06 2.62-2.11.83-1.2 1.17-2.37 1.19-2.43-.03-.01-2.27-.87-2.3-3.48zM14.5 6.9c.6-.73 1-1.74.89-2.75-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.95-.49 2.54-1.2z"/></svg>
  </div>
  <div class="dar-store-copy">
    <strong>DĀR AL TAWḤĪD für iPhone & iPad</strong>
    <span>Die Webseite bleibt im Browser eine Webseite. Für die native App nutze die offizielle App-Store-Version.</span>
  </div>
  <a class="dar-store-link" href="https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753" rel="noopener" aria-label="DĀR AL TAWḤĪD im App Store öffnen">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#147CE5"/><path d="M8.1 16.8 14 6.6M6.3 13.5h11.5M10.2 6.6l6 10.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
    <span>Im App Store laden</span>
  </a>
</section>
<script id="darPublicWebsiteGuardV1">
(function(){
  "use strict";
  var ua=String(navigator.userAgent||"");
  if(/DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(ua))return;
  try{document.documentElement.classList.add("dar-public-website")}catch(e){}
  var apple=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&Number(navigator.maxTouchPoints||0)>1);
  var promo=document.getElementById("darIosAppStorePromo");
  if(apple&&promo)promo.classList.add("is-visible");
  try{
    var u=new URL(location.href);
    ["homescreen","app","mobile","source"].forEach(function(k){u.searchParams.delete(k)});
    if(u.hash==="#home")u.hash="";
    if((u.pathname==="/"||u.pathname==="/index.html")&&!u.searchParams.has("page"))u.searchParams.set("page","start");
    history.replaceState(history.state||{},"",u.pathname+(u.search||"")+(u.hash||""));
  }catch(eUrl){}
  try{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(reg){
          var worker=reg.active||reg.waiting||reg.installing;
          if(!worker||!worker.scriptURL)return;
          try{
            var sw=new URL(worker.scriptURL,location.href);
            if(sw.origin===location.origin&&sw.pathname==="/service-worker.js")reg.unregister();
          }catch(eSw){}
        });
      }).catch(function(){});
    }
  }catch(eReg){}
  try{
    if("caches" in window){
      caches.keys().then(function(keys){
        keys.forEach(function(k){
          if(/^dar-al-tawhid-offline-light-/i.test(k))caches.delete(k);
        });
      }).catch(function(){});
    }
  }catch(eCache){}
})();
</script>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";
    const ua = String(request.headers.get("User-Agent") || "");
    const nativeApp = isNativeAppRequest(ua);
    const kidsPath = url.pathname === "/test/kids" || url.pathname.startsWith("/test/kids/");
    const voicePath = url.pathname === "/voice-studio" || url.pathname.startsWith("/voice-studio/");
    const legacyVoicePath = url.pathname === "/test/voice-studio" || url.pathname.startsWith("/test/voice-studio/");

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/manifest.json" && !nativeApp) {
      return browserManifestResponse(request);
    }

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
        const body = "kids-shell-v12-tab12\nKIDS · V0.13\n";
        if (request.method === "HEAD") return new Response(null, { status: 200, headers });
        return new Response(body, { status: 200, headers });
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

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && nativeApp) {
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

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && wantsPublicWebsite(request)) {
      const target = new URL("/desktop-preview/index.html", url.origin);
      const assetRequest = new Request(target.toString(), request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      const headers = desktopHeaders(assetResponse);

      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }

      let html = await assetResponse.text();
      if (assetResponse.ok) {
        const styleTag = '<link rel="stylesheet" href="/desktop-preview/desktop-overhaul.css?v=183">';
        const scriptTag = '<script defer src="/desktop-preview/desktop-overhaul.js?v=183"><\/script>';
        if (!html.includes("desktop-overhaul.css")) html = html.replace("</head>", styleTag + "</head>");
        if (!html.includes("desktop-overhaul.js")) html = html.replace("</body>", scriptTag + "</body>");
        if (!html.includes("darPublicWebsiteGuardV1")) html = html.replace("</body>", publicWebsiteAddon() + "</body>");
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(html, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
    }

    if ((request.method === "GET" || request.method === "HEAD") && !kidsPath && (
      url.pathname === "/test" ||
      url.pathname === "/test/" ||
      url.pathname === "/test/index.html" ||
      url.pathname === "/test/version.json" ||
      url.pathname === "/test/service-worker.js" ||
      url.pathname.startsWith("/test/assets/")
    )) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("X-DAR-Test-App", "isolated");
      headers.delete("ETag");
      if (request.method === "HEAD") {
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response("Not Found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
  }
};
