import { gateHiddenSurfaces } from "./preview-gate.js";
/* Dar Test (/test) ohne Browser-Anmeldefenster. Kids bleibt geschützt. v1096 */
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
const PRAYER_API_ORIGIN = "https://dar-admin-publisher.sero91ak.workers.dev";
const VOICE_API_ORIGIN = "https://dar-admin-publisher.sero91ak.workers.dev";
/* Apple TV live: /api/prayer/* und /quran-audio/* über diesen Router */
const KIDS_BUILD = "kids-shell-v108-home-sky1187";
const KIDS_LABEL = "KIDS · V1.08.14";

function isPrayerApiPath(pathname) {
  return /^\/api\/(prayer|daily|jummah)(\/|$)/.test(pathname) || pathname === "/api/push/welcome";
}

function isVoiceApiPath(pathname) {
  return pathname === "/voice-studio/api" || pathname.startsWith("/voice-studio/api/");
}

async function proxyVoiceApi(request, url) {
  if (!isVoiceApiPath(url.pathname)) return null;
  const dest = `${VOICE_API_ORIGIN}${url.pathname}${url.search || ""}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const upstream = await fetch(dest, init);
  const out = new Headers(upstream.headers);
  out.set("Cache-Control", "no-store, max-age=0");
  out.set("CDN-Cache-Control", "no-store");
  out.set("Cloudflare-CDN-Cache-Control", "no-store");
  out.set("X-DAR-Voice-Edge", "same-origin-gateway");
  out.delete("Content-Length");
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out
  });
}

async function proxyPrayerApi(request, url) {
  if (!isPrayerApiPath(url.pathname)) return null;
  const dest = `${PRAYER_API_ORIGIN}${url.pathname}${url.search || ""}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  const init = {
    method: request.method,
    headers,
    redirect: "follow"
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const upstream = await fetch(dest, init);
  const out = new Headers(upstream.headers);
  out.set("Access-Control-Allow-Origin", "*");
  out.set("Cache-Control", "no-store");
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

function isLegacyKidsPath(pathname) {
  return pathname === "/test/kids" || pathname.startsWith("/test/kids/");
}

function isLiveKidsPath(pathname) {
  return pathname === "/kids" || pathname.startsWith("/kids/");
}

function isKidsPath(pathname) {
  return isLiveKidsPath(pathname) || isLegacyKidsPath(pathname);
}

function toLiveKidsPath(pathname) {
  if (!isLegacyKidsPath(pathname)) return pathname;
  return "/kids" + pathname.slice("/test/kids".length);
}

function toMirrorKidsPath(pathname) {
  const live = toLiveKidsPath(pathname);
  if (live === "/kids" || live === "/kids/") return "/test/kids/";
  return "/test/kids" + live.slice("/kids".length);
}

async function fetchKidsMirror(pathname, search) {
  const path = toMirrorKidsPath(pathname);
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

const RUNTIME_MEDIA_RE = /\.(?:avif|webp|png|jpe?g|gif|svg|mp4|m4a|mp3|aac|ogg|wav)$/i;

function runtimeMediaHeaders(assetResponse, url, extra = {}) {
  const headers = new Headers(assetResponse.headers);
  const versioned = Boolean(
    url.searchParams.get("v") ||
    url.searchParams.get("ver") ||
    url.searchParams.get("version") ||
    url.searchParams.get("build") ||
    url.searchParams.get("kv")
  );
  if (versioned) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("CDN-Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
  } else {
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    headers.set("CDN-Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
    headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
  }
  headers.delete("Pragma");
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return headers;
}

function mediaAssetResponse(assetResponse, request, url, extra = {}) {
  if (!assetResponse || !assetResponse.ok || !RUNTIME_MEDIA_RE.test(url.pathname)) return null;
  const headers = runtimeMediaHeaders(assetResponse, url, extra);
  if (request.method === "HEAD") {
    return new Response(null, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers
  });
}

function kidsHeaders(assetResponse) {
  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  headers.set("X-Kids-Build", KIDS_BUILD);
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

const SURAH_AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

const QURAN_EDITION_ALIASES = {
  "ar.alafasy": "ar.alafasy",
  "alafasy": "ar.alafasy",
  "alafasy_128kbps": "ar.alafasy",
  "ar.abdurrahmaansudais": "ar.abdurrahmaansudais",
  "sudais": "ar.abdurrahmaansudais",
  "abdurrahmaan_as-sudais_192kbps": "ar.abdurrahmaansudais",
  "ar.saoodshuraym": "ar.saoodshuraym",
  "ar.saudalshuraim": "ar.saoodshuraym",
  "shuraim": "ar.saoodshuraym",
  "saood_ash-shuraym_128kbps": "ar.saoodshuraym",
  "ar.husary": "ar.husary",
  "husary": "ar.husary",
  "husary_128kbps": "ar.husary",
  "ar.husarymujawwad": "ar.husarymujawwad",
  "husary_mujawwad_128kbps": "ar.husarymujawwad",
  "ar.minshawi": "ar.minshawi",
  "minshawi": "ar.minshawi",
  "minshawy_murattal_128kbps": "ar.minshawi",
  "ar.minshawimujawwad": "ar.minshawimujawwad",
  "minshawy_mujawwad_192kbps": "ar.minshawimujawwad",
  "ar.abdulbasitmurattal": "ar.abdulbasitmurattal",
  "basit": "ar.abdulbasitmurattal",
  "abdul_basit_murattal_192kbps": "ar.abdulbasitmurattal",
  "ar.abdulbasitmujawwad": "ar.abdulbasitmujawwad",
  "abdul_basit_mujawwad_128kbps": "ar.abdulbasitmujawwad",
  "ar.ahmedajamy": "ar.ahmedajamy",
  "ajamy": "ar.ahmedajamy",
  "ahmed_ibn_ali_al-ajamy_128kbps_ketaballah.net": "ar.ahmedajamy",
  "ar.muhammadayyoub": "ar.muhammadayyoub",
  "ar.muhammadayoub": "ar.muhammadayyoub",
  "muhammadayoub": "ar.muhammadayyoub",
  "muhammad_ayyoub_128kbps": "ar.muhammadayyoub",
  "ar.hudhaify": "ar.hudhaify",
  "hudhaify": "ar.hudhaify",
  "hudhaify_128kbps": "ar.hudhaify",
  "ar.muhammadjibreel": "ar.muhammadjibreel",
  "muhammad_jibreel_128kbps": "ar.muhammadjibreel",
  "ar.mahermuaiqly": "ar.mahermuaiqly",
  "maher": "ar.mahermuaiqly",
  "maheralmuaiqly128kbps": "ar.mahermuaiqly",
  "ar.shaatree": "ar.shaatree",
  "abu_bakr_ash-shaatree_128kbps": "ar.shaatree",
  "ar.hanirifai": "ar.hanirifai",
  "hani_rifai_192kbps": "ar.hanirifai",
  "ar.abdullahbasfar": "ar.abdullahbasfar",
  "abdullah_basfar_192kbps": "ar.abdullahbasfar",
  "ar.yasseraldossari": "ar.yasseraldossari",
  "yasser_ad-dussary_128kbps": "ar.yasseraldossari",
  "ar.aymanswoaid": "ar.aymanswoaid",
  "ayman_sowaid_64kbps": "ar.aymanswoaid"
};

function resolveQuranEdition(raw) {
  const key = decodeURIComponent(String(raw || "")).trim();
  if (!key) return "";
  if (QURAN_EDITION_ALIASES[key]) return QURAN_EDITION_ALIASES[key];
  const lower = key.toLowerCase();
  if (QURAN_EDITION_ALIASES[lower]) return QURAN_EDITION_ALIASES[lower];
  return QURAN_EDITION_ALIASES[lower.replace(/\s+/g, "_")] || "";
}

function globalAyahFromToken(token) {
  const raw = String(token || "");
  if (/^\d{6}$/.test(raw)) {
    const surah = Number(raw.slice(0, 3));
    const ayah = Number(raw.slice(3));
    if (!(surah >= 1 && surah <= 114) || ayah < 1) return 0;
    const count = SURAH_AYAH_COUNTS[surah - 1] || 0;
    if (ayah > count) return 0;
    let global = ayah;
    for (let i = 0; i < surah - 1; i += 1) global += SURAH_AYAH_COUNTS[i];
    return global;
  }
  const ayah = Number(raw);
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 6236) return 0;
  return ayah;
}

function audioFail(status, message) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

function audioRangeResponse(body, request, extra) {
  const size = body.byteLength;
  const range = request.headers.get("Range") || request.headers.get("range") || "";
  const rangeMatch = range.match(/bytes=(\d*)-(\d*)/);
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (rangeMatch) {
    start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
    end = rangeMatch[2] ? Number(rangeMatch[2]) : size - 1;
    if (Number.isNaN(start) || start < 0) start = 0;
    if (Number.isNaN(end) || end >= size) end = size - 1;
    if (start > end) start = 0;
    status = 206;
  }
  const headers = {
    "Content-Type": "audio/mpeg",
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Cache-Control": "public, max-age=86400, must-revalidate",
    ...(extra || {})
  };
  if (status === 206) {
    headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
    headers["Content-Length"] = String(end - start + 1);
  } else {
    headers["Content-Length"] = String(size);
  }
  if (request.method === "HEAD") return new Response(null, { status, headers });
  const slice = status === 206 ? body.slice(start, end + 1) : body;
  return new Response(slice, { status, headers });
}

async function fetchFullAudio(upstreams) {
  let used = upstreams[0];
  for (const upstream of upstreams) {
    used = upstream;
    try {
      const res = await fetch(upstream, {
        method: "GET",
        headers: {
          Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
          "User-Agent": "DarAlTawhidTV"
        },
        cf: { cacheEverything: true, cacheTtlByStatus: { "200": 86400, "400-599": 0 } }
      });
      if (!res || !res.ok) continue;
      const buf = await res.arrayBuffer();
      if (buf && buf.byteLength > 800) return { body: buf, used };
    } catch (eUp) {}
  }
  return { body: null, used };
}

async function proxyQuranAudio(request, url) {
  const surahMatch = url.pathname.match(/^\/quran-audio\/([^/]+)\/surah\/(\d+)\.json$/);
  if (surahMatch) {
    const edition = resolveQuranEdition(surahMatch[1]);
    const surah = Number(surahMatch[2]);
    if (!edition || !(surah >= 1 && surah <= 114)) return audioFail(400, "Bad recitation request");
    try {
      const dest = `https://api.alquran.cloud/v1/surah/${surah}/${edition}`;
      const upstream = await fetch(dest, {
        headers: { Accept: "application/json" },
        cf: { cacheTtlByStatus: { "200": 3600, "400-599": 0 } }
      });
      if (!upstream.ok) return audioFail(upstream.status, "Recitation metadata unavailable");
      const payload = await upstream.json();
      const ayahs = (((payload || {}).data || {}).ayahs) || [];
      for (const ayah of ayahs) {
        const n = Number(ayah.number);
        if (n >= 1) {
          ayah.audio = `https://dar-al-tawhid.de/quran-audio/${edition}/${n}.mp3`;
          ayah.audioSecondary = [`https://cdn.islamic.network/quran/audio/128/${edition}/${n}.mp3`];
        }
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300, must-revalidate"
        }
      });
    } catch (eMeta) {
      return audioFail(502, "Recitation metadata error");
    }
  }

  const match = url.pathname.match(/^\/quran-audio\/([^/]+)\/(\d+)\.mp3$/);
  if (!match) return null;
  const edition = resolveQuranEdition(match[1]);
  const ayah = globalAyahFromToken(match[2]);
  if (!edition || !ayah) return audioFail(400, "Bad recitation request");
  const upstreams = [
    `https://cdn.islamic.network/quran/audio/128/${edition}/${ayah}.mp3`,
    `https://cdn.alquran.cloud/media/audio/ayah/${edition}/${ayah}`
  ];
  try {
    const { body, used } = await fetchFullAudio(upstreams);
    if (!body) return audioFail(502, "Recitation upstream unavailable");
    return audioRangeResponse(body, request, { "X-Dar-Quran-Audio": used });
  } catch (eProxy) {
    return audioFail(502, "Recitation proxy error");
  }
}

async function proxyQuranText(request, url) {
  if (url.pathname === "/quran-text/surah-list.json") {
    try {
      const upstream = await fetch("https://api.alquran.cloud/v1/surah", {
        headers: { Accept: "application/json" },
        cf: { cacheTtlByStatus: { "200": 86400, "400-599": 0 } }
      });
      if (!upstream.ok) return audioFail(upstream.status, "Surah list unavailable");
      return new Response(await upstream.text(), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400, must-revalidate"
        }
      });
    } catch (eList) {
      return audioFail(502, "Surah list error");
    }
  }
  const textMatch = url.pathname.match(/^\/quran-text\/([^/]+)\/surah\/(\d+)\.json$/);
  if (!textMatch) return null;
  const edition = decodeURIComponent(textMatch[1] || "");
  const surah = Number(textMatch[2]);
  if (!edition || edition.indexOf("..") >= 0 || !(surah >= 1 && surah <= 114)) {
    return audioFail(400, "Bad text request");
  }
  try {
    const dest = `https://api.alquran.cloud/v1/surah/${surah}/${edition}`;
    const upstream = await fetch(dest, {
      headers: { Accept: "application/json" },
      cf: { cacheTtlByStatus: { "200": 3600, "400-599": 0 } }
    });
    if (!upstream.ok) return audioFail(upstream.status, "Text unavailable");
    return new Response(await upstream.text(), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, must-revalidate"
      }
    });
  } catch (eText) {
    return audioFail(502, "Text proxy error");
  }
}

async function proxyAdhanAudio(request, url) {
  const match = url.pathname.match(/^\/(?:apple-tv\/)?adhan\/(.+\.mp3)$/i);
  if (!match) return null;
  let file = decodeURIComponent(match[1] || "");
  if (!file || file.indexOf("..") >= 0 || file.indexOf("/") >= 0) return audioFail(400, "Bad adhan request");
  const encoded = encodeURIComponent(file).replace(/%2F/g, "/");
  const upstreams = [
    `https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/${encoded}`,
    `https://cdn.jsdelivr.net/gh/Kiwifu/adhan-mp3@main/${encoded}`
  ];
  try {
    let body = null;
    let used = upstreams[0];
    for (const upstream of upstreams) {
      used = upstream;
      const res = await fetch(upstream, {
        method: "GET",
        headers: {
          Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
          "User-Agent": "DarAlTawhidTV"
        },
        cf: { cacheEverything: true, cacheTtlByStatus: { "200": 86400, "400-599": 0 } }
      });
      if (!res || !res.ok) continue;
      const buf = await res.arrayBuffer();
      if (buf && buf.byteLength > 1024) {
        body = buf;
        break;
      }
    }
    if (!body) return audioFail(502, "Adhan upstream unavailable");
    const size = body.byteLength;
    const range = request.headers.get("Range") || request.headers.get("range") || "";
    const rangeMatch = range.match(/bytes=(\d*)-(\d*)/);
    let start = 0;
    let end = size - 1;
    let status = 200;
    if (rangeMatch) {
      start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
      end = rangeMatch[2] ? Number(rangeMatch[2]) : size - 1;
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end) start = 0;
      status = 206;
    }
    const headers = {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, must-revalidate",
      "X-Dar-Adhan-Audio": used
    };
    if (status === 206) {
      headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
      headers["Content-Length"] = String(end - start + 1);
    } else {
      headers["Content-Length"] = String(size);
    }
    if (request.method === "HEAD") {
      return new Response(null, { status, headers });
    }
    const slice = status === 206 ? body.slice(start, end + 1) : body;
    return new Response(slice, { status, headers });
  } catch (eAdhan) {
    return audioFail(502, "Adhan proxy error");
  }
}


let kidsIntroBuffer = null;
async function serveKidsIntroVideo(request, url, env) {
  if (!/^\/kids\/assets\/kids-cinema\/.+\.mp4$/i.test(url.pathname)) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  try {
    if (!kidsIntroBuffer) {
      const assetUrl = new URL(url.pathname, url.origin);
      const asset = await env.ASSETS.fetch(new Request(assetUrl.toString(), { method: "GET" }));
      if (!asset || !asset.ok) return null;
      kidsIntroBuffer = await asset.arrayBuffer();
    }
    const size = kidsIntroBuffer.byteLength;
    const range = request.headers.get("Range") || request.headers.get("range") || "";
    const match = range.match(/bytes=(\d*)-(\d*)/);
    let start = 0;
    let end = size - 1;
    let status = 200;
    if (match) {
      start = match[1] ? Number(match[1]) : 0;
      end = match[2] ? Number(match[2]) : size - 1;
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end) start = 0;
      status = 206;
    }
    const headers = {
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*"
    };
    if (status === 206) {
      headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
      headers["Content-Length"] = String(end - start + 1);
    } else {
      headers["Content-Length"] = String(size);
    }
    if (request.method === "HEAD") return new Response(null, { status, headers });
    const body = status === 206 ? kidsIntroBuffer.slice(start, end + 1) : kidsIntroBuffer;
    return new Response(body, { status, headers });
  } catch (eVid) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const audio = await proxyQuranAudio(request, url);
      if (audio) return audio;
      const text = await proxyQuranText(request, url);
      if (text) return text;
      const adhan = await proxyAdhanAudio(request, url);
      if (adhan) return adhan;
    }
    if (request.method === "OPTIONS" && isPrayerApiPath(url.pathname)) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization"
        }
      });
    }
    const prayerApi = await proxyPrayerApi(request, url);
    if (prayerApi) return prayerApi;
    const voiceApi = await proxyVoiceApi(request, url);
    if (voiceApi) return voiceApi;
    const gated = gateHiddenSurfaces(request, url, env, "live");
    if (gated) return gated;
    if (request.method === "GET" || request.method === "HEAD") {
      const intro = await serveKidsIntroVideo(request, url, env);
      if (intro) return intro;
    }
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";
    const ua = String(request.headers.get("User-Agent") || "");
    const nativeApp = isNativeAppRequest(ua);
    const kidsPath = isKidsPath(url.pathname);
    const kidsRecitationGrade =
      url.pathname === "/kids/api/recitation/grade" ||
      url.pathname === "/test/kids/api/recitation/grade";
    const voiceAliasPath = url.pathname === "/voice" || url.pathname === "/voice/";
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

    if ((request.method === "GET" || request.method === "HEAD") && voiceAliasPath) {
      const target = new URL(request.url);
      target.pathname = "/voice-studio/";
      target.searchParams.set("app", "1");
      target.searchParams.set("cloud", "1");
      return Response.redirect(target.toString(), 308);
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

    if (kidsRecitationGrade && request.method === "POST") {
      try {
        const target = new URL(request.url);
        target.protocol = "https:";
        target.hostname = "dar-al-tawhid-test.sero91ak.workers.dev";
        target.port = "";
        target.pathname = "/test/kids/api/recitation/grade";
        const upstream = await fetch(new Request(target.toString(), request));
        const headers = new Headers(upstream.headers);
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        headers.set("CDN-Cache-Control", "no-store");
        headers.set("Cloudflare-CDN-Cache-Control", "no-store");
        headers.delete("Content-Length");
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers
        });
      } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: "kids_recitation_proxy_failed" }), {
          status: 502,
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
        });
      }
    }

    if (kidsPath && (request.method === "GET" || request.method === "HEAD")) {
      try {
        if (isLegacyKidsPath(url.pathname)) {
          const target = new URL(request.url);
          target.pathname = toLiveKidsPath(url.pathname) || "/kids/";
          return Response.redirect(target.toString(), 301);
        }
        if (url.pathname === "/kids" || url.pathname === "/kids/") {
          const target = new URL(request.url);
          target.pathname = "/kids/start";
          target.searchParams.delete("darsw");
          target.searchParams.set("kv", KIDS_BUILD);
          return new Response(null, {
            status: 307,
            headers: {
              "Location": target.toString(),
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              "CDN-Cache-Control": "no-store",
              "Cloudflare-CDN-Cache-Control": "no-store",
              "X-Kids-Build": KIDS_BUILD
            }
          });
        }
        if ((url.pathname === "/kids/start" || url.pathname === "/kids/start/") &&
            String(url.searchParams.get("kv") || "") !== KIDS_BUILD) {
          const target = new URL(request.url);
          target.pathname = "/kids/start";
          target.searchParams.delete("darsw");
          target.searchParams.set("kv", KIDS_BUILD);
          if (target.pathname !== url.pathname || target.search !== url.search) {
            return new Response(null, {
              status: 307,
              headers: {
                "Location": target.pathname + target.search,
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "CDN-Cache-Control": "no-store",
                "Cloudflare-CDN-Cache-Control": "no-store",
                "X-Kids-Build": KIDS_BUILD
              }
            });
          }
        }
        if (url.pathname === "/kids/version.json" || url.pathname === "/kids/version.json/") {
          const headers = kidsHeaders(new Response(""));
          headers.set("Content-Type", "application/json; charset=utf-8");
          const body = JSON.stringify({ buildId: KIDS_BUILD, label: KIDS_LABEL });
          if (request.method === "HEAD") return new Response(null, { status: 200, headers });
          return new Response(body, { status: 200, headers });
        }
        if (url.pathname.endsWith("/v12-alive.txt")) {
          const headers = kidsHeaders(new Response(""));
          headers.set("Content-Type", "text/plain; charset=utf-8");
          const body = `${KIDS_BUILD}\n${KIDS_LABEL}\n`;
          if (request.method === "HEAD") return new Response(null, { status: 200, headers });
          return new Response(body, { status: 200, headers });
        }

        const pretty = {
          "/kids/start": "/kids/start.html",
          "/kids/start/": "/kids/start.html",
          "/kids/start.html": "/kids/start.html",
          "/kids/index": "/kids/index.html",
          "/kids/index.html": "/kids/index.html",
          "/kids/shell": "/kids/shell.html",
          "/kids/shell.html": "/kids/shell.html"
        };
        async function fetchKidsPage() {
          const paths = [];
          const seen = new Set();
          function add(p) {
            if (!p || seen.has(p)) return;
            seen.add(p);
            paths.push(p);
          }
          if (url.pathname.endsWith(".html")) {
            add(url.pathname.replace(/\.html$/, ""));
            add(url.pathname);
          } else {
            add(url.pathname.replace(/\/$/, "") || url.pathname);
            add(pretty[url.pathname]);
          }
          let last = null;
          for (const pathname of paths) {
            const pageUrl = new URL(request.url);
            pageUrl.pathname = pathname;
            const assetResponse = await env.ASSETS.fetch(new Request(pageUrl.toString(), request));
            last = assetResponse;
            if (assetResponse && assetResponse.status === 200) return assetResponse;
            if (assetResponse && assetResponse.status >= 300 && assetResponse.status < 400) {
              const loc = assetResponse.headers.get("Location") || "";
              try {
                const next = new URL(loc, pageUrl);
                if (next.origin === pageUrl.origin) {
                  if (next.pathname.endsWith(".html")) add(next.pathname.replace(/\.html$/, ""));
                  else add(next.pathname);
                }
              } catch (eLoc) {}
            }
          }
          return last && last.status === 200 ? last : null;
        }
        let assetResponse = await fetchKidsPage();
        if (!assetResponse || assetResponse.status >= 300) {
          try {
            assetResponse = await fetchKidsMirror(url.pathname, url.search);
          } catch (mirrorErr) {}
        }
        if (!assetResponse) {
          return new Response("Kids unavailable", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const mediaResponse = mediaAssetResponse(assetResponse, request, url, { "X-Kids-Build": KIDS_BUILD });
        if (mediaResponse) return mediaResponse;
        const headers = kidsHeaders(assetResponse);
        if (request.method === "HEAD") {
          return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
        }
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers
        });
      } catch (kidsErr) {
        return new Response("Kids unavailable", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
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
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
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
      const assetResponse = await env.ASSETS.fetch(request);
      const mediaResponse = mediaAssetResponse(assetResponse, request, url);
      return mediaResponse || assetResponse;
    } catch (err) {
      return new Response("Not Found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
  }
};
