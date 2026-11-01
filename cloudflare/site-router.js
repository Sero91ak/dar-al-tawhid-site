// PUBLIC_WEBSITE_RECOVERY_TRIGGER_20261010_V2
/* pwa-dedicated-shell-live-20261009-2050 */
/* public-pwa-emergency-repair-live-20261009-1824 */
import { gateHiddenSurfaces, academyOwnerAccess, academyOwnerAssetPath } from "./preview-gate.js";
import { editorialOwnerAccess } from "./editorial-gate.js";
/* Dar Test (/test) ohne Browser-Anmeldefenster. Kids bleibt geschützt. v1096 */
function isNativeAppRequest(ua) {
  return /DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(String(ua || ""));
}

function isAndroidBrowserRequest(ua) {
  // Android mobile browsers use the visitor web app; native shells stay separate.
  return /\bAndroid\b/i.test(String(ua || "")) && !isNativeAppRequest(ua);
}

// IOS_PUBLIC_WEBSITE_ONLY_V1: browser navigation on Apple mobile devices
// always receives the public website. The official App Store WebView
// has its own user agent and remains outside this restriction.
function isAppleMobileBrowserRequest(ua) {
  return /iPhone|iPad|iPod/i.test(String(ua || "")) && !isNativeAppRequest(ua);
}

function wantsPublicWebsite(request) {
  const ua = String(request.headers.get("User-Agent") || "");
  const url = new URL(request.url);
  // iPhone and iPad browser links never activate the deprecated visitor PWA.
  if (isAppleMobileBrowserRequest(ua)) return true;
  // Android PWA launches still receive their dedicated application shell.
  if (url.searchParams.get("pwa") === "1") return false;
  // Every normal browser, including Android, receives the public website.
  // Native iOS/Android shells stay on their own app route.
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
const KIDS_BUILD = "kids-shell-v1421-learn-center-dua-fourth-salaf-in-hoeren";
const KIDS_LABEL = "KIDS · V1.09.22";

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

const DAR_PWA_ICON_CATALOG = [{"id":"type-creme-ar","label":"Creme · Arabisch","theme":"#10282a","bg":"#f6f0e4","high":true},{"id":"emblem-creme-petrol","label":"Emblem · Creme/Petrol","theme":"#163b3a","bg":"#f3ead8","high":true},{"id":"emblem-nachtblau","label":"Emblem · Nachtblau","theme":"#101c34","bg":"#0c1630","high":true},{"id":"emblem-schwarzgold","label":"Emblem · Schwarz/Gold","theme":"#0a0a0c","bg":"#0a0a0c","high":true},{"id":"type-anthrazit-ar","label":"Anthrazit · Arabisch","theme":"#25292f","bg":"#25292f","high":false},{"id":"type-anthrazit-fein","label":"Anthrazit · Fein","theme":"#292d33","bg":"#292d33","high":false},{"id":"type-creme","label":"Creme · Name","theme":"#10282a","bg":"#f6f0e4","high":true},{"id":"type-weiss-ar","label":"Weiß · Arabisch","theme":"#111111","bg":"#ffffff","high":false},{"id":"type-schwarz-rund","label":"Schwarz · Rund","theme":"#101010","bg":"#101010","high":false},{"id":"type-schwarz-ar","label":"Schwarz · Arabisch","theme":"#0b0b0d","bg":"#0b0b0d","high":true},{"id":"type-schwarz","label":"Schwarz · Name","theme":"#0b0b0d","bg":"#0b0b0d","high":true},{"id":"type-navy-ar","label":"Navy · Arabisch","theme":"#102038","bg":"#102038","high":true},{"id":"type-navy","label":"Navy · Name","theme":"#102038","bg":"#102038","high":true},{"id":"type-bordeaux-ar","label":"Bordeaux · Arabisch","theme":"#581620","bg":"#581620","high":true},{"id":"type-bordeaux","label":"Bordeaux · Name","theme":"#581620","bg":"#581620","high":true},{"id":"type-gruen-ar","label":"Grün · Arabisch","theme":"#123024","bg":"#123024","high":true},{"id":"type-gruen","label":"Grün · Name","theme":"#123024","bg":"#123024","high":true},{"id":"type-schwarz-ar2","label":"Schwarz · Fein","theme":"#0b0b0d","bg":"#0b0b0d","high":true}];
const DAR_PWA_ICON_MAP = Object.fromEntries(DAR_PWA_ICON_CATALOG.map((item) => [item.id, item]));

function normalizePwaIconId(value) {
  const id = String(value || "").trim().toLowerCase();
  return DAR_PWA_ICON_MAP[id] ? id : "type-creme-ar";
}

function pwaIconPath(id, size) {
  return "/assets/app-icons/" + normalizePwaIconId(id) + "/icon-" + size + ".png";
}

function browserManifestResponse(request, androidBrowser = false) {
  const url = new URL(request.url);
  const cookieHeader = String(request.headers.get("Cookie") || "");
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)dar_pwa_icon=([^;]+)/);
  let cookieIcon = "";
  if (cookieMatch) {
    try { cookieIcon = decodeURIComponent(cookieMatch[1] || ""); } catch (e) { cookieIcon = cookieMatch[1] || ""; }
  }
  const iconId = normalizePwaIconId(cookieIcon || url.searchParams.get("icon"));
  const icon = DAR_PWA_ICON_MAP[iconId] || DAR_PWA_ICON_MAP["type-creme-ar"];
  const icon192 = pwaIconPath(iconId, 192);
  const icon512 = icon.high ? pwaIconPath(iconId, 512) : pwaIconPath("type-creme-ar", 512);
  const icon1024 = icon.high ? pwaIconPath(iconId, 1024) : pwaIconPath("type-creme-ar", 1024);
  const stamp = "pwa-icon-v2-20261009-" + iconId;
  const manifest = {
    $schema: "https://json.schemastore.org/web-manifest-combined.json",
    name: "DĀR AL TAWḤĪD",
    short_name: "DĀR AL TAWḤĪD",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    start_url: "/pwa/?pwa=1",
    // Installation from public website has to include the current page in scope.
    // The installed Android app continues using /manifest.json with /pwa/ scope.
    scope: url.pathname === "/install-manifest.json" ? "/" : "/pwa/",
    id: "/pwa/",
    theme_color: icon.theme,
    background_color: "#050706",
    description: "DĀR AL TAWḤĪD – installierbare Web-App mit Qurʾān, Sunnah, Āṯār, Beiträgen, Duʿāʾ und Bibliothek.",
    orientation: "any",
    prefer_related_applications: false,
    icons: [
      { src: icon192 + "?v=" + stamp, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon512 + "?v=" + stamp, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icon192 + "?v=" + stamp, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: (icon.high ? icon512 : icon192) + "?v=" + stamp, sizes: icon.high ? "512x512" : "192x192", type: "image/png", purpose: "maskable" },
      { src: icon1024 + "?v=" + stamp, sizes: "1024x1024", type: "image/png", purpose: "any" }
    ]
  };
  const headers = new Headers({
    "Vary": "User-Agent, Cookie",
    "Content-Type": "application/manifest+json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "X-Dar-Surface": androidBrowser ? "android-pwa-manifest" : "public-website-manifest",
    "X-Dar-PWA-Icon": iconId,
    "X-Dar-PWA-Install-Build": "dedicated-app-id-v7-loader-clickable-20261009"
  });
  return new Response(request.method === "HEAD" ? null : JSON.stringify(manifest, null, 2), { status: 200, headers });
}
/* Visitor-only hero activation: versioned CSS and read-only measured offset.
 * Do not append the historical DOM-reparenting Frauen immersive adapter. */
function adultCompactHeroAddon() {
  return '<link rel="stylesheet" id="darAdultHeroCompactEdgeV1404" href="/assets/adult-responsive-viewport-v1381.css?v=visitor-hero-safearea-v1404-20261019-kids-parity-v1-20261027">' +
    '<script defer id="darAdultHeroHeightRuntimeV1404" src="/assets/adult-hero-height-runtime-v1403.js?v=visitor-hero-safearea-v1404-20261019"></' + 'script>';
}
/* DAR_ADULT_TOP_SCROLL_BOUNDARY_V1 – adult visitor HTML only.
 * Add a root-only scroll stop; preserve Hero, sticky search, and all carousels. */
function adultTopScrollBoundaryAddon() {
  return '<link rel="stylesheet" id="darAdultTopScrollCssV1" href="/assets/dar-adult-top-scroll-boundary-v1.css?v=20261020-no-overlay-v8">' +
    '<script defer id="darAdultTopScrollJsV1" src="/assets/dar-adult-top-scroll-boundary-v1.js?v=20261030-no-pull-hero-v9"></' + 'script>';
}

/* DĀR adult identity header v2 – mounted only in native iOS/Android and dedicated PWA.
 * The public browser website keeps its own navigation and is not overlaid.
 * No Kids, native OS code, push, prayer calculation, SW or scroll handlers changed. */
/* VISITOR_PROFILE_SHORTCUTS_V9_FINAL_RELEASE_20261030: horizontal profile + notes/account quick capsule; PIN-gated account switch, iOS/PWA parity. */
function activateAdultGlobalBrandV2(html) {
  if (typeof html !== "string") return html;
  // Refresh only adult profile module URLs, preserving all account and prayer logic.
  html = html.replaceAll("dar-visitor-smart-profile-v1.js?v=20261030-my-dar-dashboard-v11", "dar-visitor-smart-profile-v1.js?v=20261031-neutral-hooded-v14");
  html = html.replaceAll("dar-visitor-profile-picker-v1.js?v=20261030-profile-single-hub-v10", "dar-visitor-profile-picker-v1.js?v=20261030-left-select-v12");
  /* Native iOS and PWA must use the same fresh prayer presentation as Test.
     Keep desktop public browser, Kids and the original prayer engine isolated. */
  html = html.replace(/\/assets\/dar-home-test-parity-visitor\.js\?v=[a-zA-Z0-9-]+/g,
    "/assets/dar-home-test-parity-visitor.js?v=20261031-neutral-hooded-v14");
  /* VISITOR_PROFILE_HEADER_BOOT_V4: adult visitor native/PWA only.
   * Guarantee the approved palette icon, profile picker, smart personalization
   * and adaptive Frauen/Entdecken tab load with the original branded header.
   * Keep the public website, Kids and Test in their existing isolated lanes.
   * Reuse the lazy-loader's IDs so each module is loaded at most once. */
  const addons = [
    ['darAdultGlobalBrandStyleV2','<link rel="stylesheet" id="darAdultGlobalBrandStyleV2" href="/assets/dar-adult-brand-header-v2.css?v=20261030-restore-original-hero-rail-v5">'],
    ['darVisitorSmartProfileCssV1','<link rel="stylesheet" id="darVisitorSmartProfileCssV1" href="/assets/dar-visitor-smart-profile-v1.css?v=20261030-my-dar-dashboard-v11">'],
    ['darVisitorProfilePickerCssV1','<link rel="stylesheet" id="darVisitorProfilePickerCssV1" href="/assets/dar-visitor-profile-picker-v1.css?v=20261030-profile-single-hub-v10">'],
    ['darVisitorDailyHubCssV1','<link rel="stylesheet" id="darVisitorDailyHubCssV1" href="/assets/dar-visitor-daily-hub-v1.css?v=20261030-mehr-responsive-v2">'],
    ['darVisitorOnboardingCssV1','<link rel="stylesheet" id="darVisitorOnboardingCssV1" href="/assets/dar-visitor-onboarding-v1.css?v=20261030-mehr-responsive-v2">'],
    ['darAdultGlobalBrandScriptV2','<script defer id="darAdultGlobalBrandScriptV2" src="/assets/dar-adult-brand-header-v2.js?v=20261030-fixed-occlusion-v1"></' + 'script>'],
    ['darVisitorSmartProfileJsV1','<script defer id="darVisitorSmartProfileJsV1" src="/assets/dar-visitor-smart-profile-v1.js?v=20261031-neutral-hooded-v14"></' + 'script>'],
    ['darVisitorProfilePickerJsV1','<script defer id="darVisitorProfilePickerJsV1" src="/assets/dar-visitor-profile-picker-v1.js?v=20261030-left-select-v12"></' + 'script>'],
    ['darVisitorDailyHubJsV1','<script defer id="darVisitorDailyHubJsV1" src="/assets/dar-visitor-daily-hub-v1.js?v=20261030-mehr-responsive-v2"></' + 'script>'],
    ['darVisitorOnboardingJsV1','<script defer id="darVisitorOnboardingJsV1" src="/assets/dar-visitor-onboarding-v1.js?v=20261030-profile-single-hub-v10"></' + 'script>']
  ];
  const foldLink = html.includes('id="darAdultGlobalFoldAxisV1"') ? "" :
    '<link rel="stylesheet" id="darAdultGlobalFoldAxisV1" href="/assets/adult-fold-global-v1.css?v=20261031-fold-axis-v1">';
  // Do not globally inject reading-language controls. Arabic, transliteration and
  // German display settings belong exclusively to the dedicated Quran/text reader.
  const addon = addons.filter(([id]) => !html.includes('id="' + id + '"')).map(([,tag]) => tag).join("") + foldLink;
  if (!addon) return html;
  return html.includes("</body>") ? html.replace("</body>", addon + "</body>") : html.includes("</html>") ? html.replace("</html>", addon + "</html>") : html + addon;
}

function activateAdultCompactHero(html) {
  if (typeof html !== "string") return html;
  // Clean only known injected Hero tags. Never remove the underlying native
  // viewport bridge or the original Frauen CSS, photos or app navigation.
  html = html.replace(/<link\b(?=[^>]*\bid=["']darAdultHeroCompactEdgeV(?:1396|1403)["'])[^>]*>/gi, "");
  html = html.replace(/<script\b(?=[^>]*\bid=["']darAdultHeroHeightRuntimeV1403["'])[^>]*>\s*<\/script\s*>/gi, "");
  if (!html.includes('id="darAdultHeroCompactEdgeV1404"') ||
      !html.includes('id="darAdultHeroHeightRuntimeV1404"')) {
    const injection = adultCompactHeroAddon();
    html = html.includes("</body>") ? html.replace("</body>", injection + "</body>") : html + injection;
  }
  if (!html.includes('id="darAdultTopScrollCssV1"') ||
      !html.includes('id="darAdultTopScrollJsV1"')) {
    // One injection for all adult surfaces, including iOS WebApp and PWA.
    // If the shell was partially cached, clear only these own two tags.
    html = html.replace(/<link\b[^>]*\bid=["']darAdultTopScrollCssV1["'][^>]*>\s*/gi, "");
    html = html.replace(/<script\b[^>]*\bid=["']darAdultTopScrollJsV1["'][^>]*>\s*<\/script\s*>\s*/gi, "");
    const scrollAddon = adultTopScrollBoundaryAddon();
    html = html.includes("</body>") ? html.replace("</body>", scrollAddon + "</body>") : html + scrollAddon;
  }
  /* Visitor front-display width correction: always install independently of
     the older hero tags. Native iOS WKWebView, Android PWA and visitor website
     receive the same narrow-stage rules; Kids/Test and admin remain excluded. */
  if(!html.includes('id="darVisitorFrontstageCssV1"')){
    const style='<link rel="stylesheet" id="darVisitorFrontstageCssV1" href="/assets/dar-visitor-frontstage-v1.css?v=20261030-frontstage-v3">';
    html=html.includes("</body>")?html.replace("</body>",style+"</body>"):html+style;
  }
  if(!html.includes('id="darVisitorFrontstageJsV1"')){
    const script='<script defer id="darVisitorFrontstageJsV1" src="/assets/dar-visitor-frontstage-v1.js?v=20261030-frontstage-v3"></' + 'script>';
    html=html.includes("</body>")?html.replace("</body>",script+"</body>"):html+script;
  }
  // Each new adult interface reads the same nine-language component registry.
  // Load it before latest-posts; keep Test/Kids and all notifications untouched.
  if (!html.includes('id="darAdultComponentI18nV1"')) {
    const locale = '<script defer id="darAdultComponentI18nV1" src="/assets/i18n/adult-component-i18n-v1.js?v=20261101-1"></' + 'script>';
    html = html.includes("</body>") ? html.replace("</body>", locale + "</body>") : html + locale;
  }
  // DĀR_HOME_RECENT_POSTS_V1: lightweight 2–5-day publications timeline in
  // public visitor, iOS WKWebView and Android PWA. No Test/Kids/push routes.
  if (!html.includes('id="darHomeRecentPostsV1Css"')) {
    const css = '<link rel="stylesheet" id="darHomeRecentPostsV1Css" href="/assets/dar-home-recent-posts-v1.css?v=20261101-9theme">';
    html = html.includes("</head>") ? html.replace("</head>", css + "</head>") : css + html;
  }
  if (!html.includes('id="darHomeRecentPostsV1Js"')) {
    const js = '<script defer id="darHomeRecentPostsV1Js" src="/assets/dar-home-recent-posts-v1.js?v=20261101-9fix"></' + 'script>';
    html = html.includes("</body>") ? html.replace("</body>", js + "</body>") : html + js;
  }
  return html;
}
function liveFrauenNativeAddon() {
  return [
    '<link rel="stylesheet" href="/assets/frauen/frauen-fiqh.css?v=frauen-rollback-20261016-1500">',
    '<link rel="stylesheet" href="/assets/frauen/frauen-authority-v1292.css?v=frauen-rollback-20261016-1500">',
    '<script defer src="/test/assets/frauen/frauen-fiqh.js?v=frauen-rollback-20261016-1500"><\/script>',
    '<script defer src="/assets/frauen/frauen-live-adapter.js?v=mehr-frauen-duplicate-fix-20261019"><\/script>'
  ].join("");
}
function androidNativeToolsAddon() {
  return `
<style id="darAndroidNativeToolsV1">
#darAndroidNativeTools{margin:18px 0 0;padding:18px 0 2px;border-top:1px solid color-mix(in srgb,var(--gold2,#e8c96a) 26%,rgba(255,255,255,.10) 74%);font-family:inherit}
#darAndroidNativeTools .dar-ant-kicker{margin:0 0 5px;color:var(--gold2,#d9ba69);font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
#darAndroidNativeTools h3{margin:0 0 5px;font:600 19px/1.2 Georgia,"Times New Roman",serif;color:var(--text,#f6f1e5)}
#darAndroidNativeTools p{margin:0 0 13px;color:var(--muted,#a9aaa5);font-size:11px;line-height:1.55}
#darAndroidNativeTools .dar-ant-actions{display:flex;flex-wrap:wrap;gap:9px}
#darAndroidNativeTools button,#darAndroidNativeTools a{min-height:42px;padding:0 13px;border:1px solid color-mix(in srgb,var(--gold2,#e8c96a) 42%,transparent);border-radius:12px;background:transparent;color:var(--gold2,#e8c96a);font:750 10px/1 system-ui,-apple-system,sans-serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
#darAndroidNativeTools button.dar-ant-primary{background:color-mix(in srgb,var(--gold2,#e8c96a) 16%,transparent)}
#darAndroidNativeToolsStatus{display:block;min-height:16px;margin-top:8px;color:var(--muted,#a9aaa5);font-size:9px;line-height:1.45}

/* darRouterTapFlashKillV9 */
@media (hover:none),(pointer:coarse){html,body,body *{-webkit-tap-highlight-color:transparent!important}a,button,[role="button"],summary,[tabindex]{-webkit-tap-highlight-color:transparent!important;-webkit-touch-callout:none!important}a:active,button:active,[role="button"]:active,summary:active,[tabindex]:active{filter:none!important;opacity:1!important;outline:none!important;box-shadow:none!important}a:focus,button:focus,[role="button"]:focus,summary:focus,[tabindex]:focus{outline:none!important;box-shadow:none!important}}
</style>
<script id="darAndroidNativeToolsScriptV1">
(function(){
  "use strict";
  if(!/DarAlTawhidAndroid/i.test(String(navigator.userAgent||"")))return;
  function currentToolsRoute(){
    var hash=String(location.hash||"").toLowerCase();
    if(/(^|[#/])settings(?:$|[/?&])/.test(hash)||document.body.classList.contains("is-settings-route")||!!document.querySelector(".settings-one-page"))return "settings";
    if(/(^|[#/])more(?:$|[/?&])/.test(hash)||document.body.classList.contains("is-more-route")||!!document.querySelector(".more-page"))return "more";
    return "";
  }
  function requestWidget(kind,label){
    var status=document.getElementById("darAndroidNativeToolsStatus");
    try{
      var api=window.DarNative;
      var ok=!!(api&&typeof api.requestWidget==="function"&&api.requestWidget(kind));
      if(status)status.textContent=ok
        ?"Android öffnet jetzt die Systemabfrage für „"+label+"“."
        :"Der Launcher unterstützt das direkte Anheften hier nicht. Öffne die Android-Widget-Auswahl auf dem Startbildschirm.";
    }catch(e){
      if(status)status.textContent="Widget konnte nicht angefordert werden.";
    }
  }
  function ensure(){
    var route=currentToolsRoute();
    if(!route)return;
    var page=route==="settings"
      ? (document.querySelector(".settings-one-page")||document.querySelector(".settings-page")||document.getElementById("appView"))
      : (document.querySelector(".more-page")||document.querySelector('[data-view="more"]')||document.getElementById("appView"));
    if(!page||document.getElementById("darAndroidNativeTools"))return;
    var section=document.createElement("section");
    section.id="darAndroidNativeTools";
    section.setAttribute("aria-label","Android Widgets und App-Icon");
    section.innerHTML=
      '<div class="dar-ant-kicker">ANDROID · STARTBILDSCHIRM</div>'+
      '<h3>Widgets & App-Icon</h3>'+
      '<p>Launcher-Icon wechseln oder echte Android-Widgets direkt auf den Startbildschirm setzen.</p>'+
      '<div class="dar-ant-actions">'+
        '<a class="dar-ant-primary" href="/widgets/?platform=android&native=1">App-Icon & Widgets öffnen</a>'+
        '<button type="button" data-dar-native-widget="prayer">Gebetszeiten hinzufügen</button>'+
        '<button type="button" data-dar-native-widget="faith">Heute & Dhikr hinzufügen</button>'+
      '</div>'+
      '<span id="darAndroidNativeToolsStatus" role="status"></span>';
    page.appendChild(section);
    section.addEventListener("click",function(ev){
      var btn=ev.target&&ev.target.closest?ev.target.closest("[data-dar-native-widget]"):null;
      if(!btn)return;
      ev.preventDefault();
      var kind=btn.getAttribute("data-dar-native-widget")||"prayer";
      requestWidget(kind,kind==="faith"?"Heute & Dhikr":"Gebetszeiten");
    });
  }
  function schedule(){setTimeout(ensure,0);setTimeout(ensure,120);setTimeout(ensure,420)}
  schedule();
  window.addEventListener("hashchange",schedule);
  window.addEventListener("pageshow",schedule);
  document.addEventListener("dar:render",schedule);
  try{
    new MutationObserver(function(){if(currentToolsRoute())schedule()}).observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
})();
<\\/script>`;
}

// DAR_ANDROID_PWA_INSTALL_RUNTIME_V3_20261009
// DAR_ANDROID_PWA_DIRECT_INSTALL_TAP_CLEAN_LIVE_V4_20261009
// DAR_ANDROID_PWA_INSTALL_READY_GATE_V6_20261009
function publicWebsiteAddon() {
  return `
<style id="darPublicTouchRectangleHardStopV6">
@media (hover:none) and (pointer:coarse){
 html,body,body *{-webkit-tap-highlight-color:rgba(0,0,0,0)!important}
 a,button,[role="button"],summary,[tabindex],label,.desktop-link,.more-row,.category-card,.feature-card,.header-action,.main-nav a,
 a *,button *,[role="button"] *,summary *,.desktop-link *,.more-row *,.category-card *,.feature-card *,.header-action *,.main-nav a *{-webkit-tap-highlight-color:rgba(0,0,0,0)!important}
 a:focus,a:focus-visible,button:focus,button:focus-visible,[role="button"]:focus,[role="button"]:focus-visible,
 summary:focus,summary:focus-visible,[tabindex]:focus,[tabindex]:focus-visible,.desktop-link:focus,.desktop-link:focus-visible,
 .more-row:focus,.more-row:focus-visible,.category-card:focus,.category-card:focus-visible,.feature-card:focus,.feature-card:focus-visible,
 .header-action:focus,.header-action:focus-visible,.main-nav a:focus,.main-nav a:focus-visible{outline:0!important;outline-offset:0!important}
}
</style>
<style id="darPublicTapCleanV4">
*{-webkit-tap-highlight-color:transparent!important}
@media(hover:none) and (pointer:coarse){
 a,button,[role="button"],summary,[tabindex],label,input,select,textarea{
  -webkit-tap-highlight-color:transparent!important;
 }
 html body.desktop-overhaul-v18 a:focus,
 html body.desktop-overhaul-v18 a:focus-visible,
 html body.desktop-overhaul-v18 button:focus,
 html body.desktop-overhaul-v18 button:focus-visible,
 html body.desktop-overhaul-v18 [role="button"]:focus,
 html body.desktop-overhaul-v18 [role="button"]:focus-visible,
 html body.desktop-overhaul-v18 summary:focus,
 html body.desktop-overhaul-v18 [tabindex]:focus,
 html body.desktop-overhaul-v18 .desktop-link:focus,
 html body.desktop-overhaul-v18 .desktop-link:focus-visible,
 html body.desktop-overhaul-v18 .more-row:focus,
 html body.desktop-overhaul-v18 .more-row:focus-visible,
 html body.desktop-overhaul-v18 .category-card:focus,
 html body.desktop-overhaul-v18 .category-card:focus-visible,
 html body.desktop-overhaul-v18 .feature-card:focus,
 html body.desktop-overhaul-v18 .feature-card:focus-visible,
 html body.desktop-overhaul-v18 .header-action:focus,
 html body.desktop-overhaul-v18 .header-action:focus-visible,
 html body.desktop-overhaul-v18 .main-nav a:focus,
 html body.desktop-overhaul-v18 .main-nav a:focus-visible{
  outline:0!important;
  outline-offset:0!important;
 }
 a:active,button:active,[role="button"]:active,.desktop-link:active,.more-row:active,.category-card:active,.feature-card:active,.header-action:active,.main-nav a:active{
  filter:none!important;
  opacity:1!important;
  transform:none!important;
 }
 a:active::before,a:active::after,
 button:active::before,button:active::after,
 [role="button"]:active::before,[role="button"]:active::after,
 .desktop-link:active::before,.desktop-link:active::after,
 .more-row:active::before,.more-row:active::after,
 .category-card:active::before,.category-card:active::after,
 .feature-card:active::before,.feature-card:active::after{
  opacity:0!important;
  filter:none!important;
  background:transparent!important;
 }
}
</style>
<style id="darPublicWebsiteOnlyV1">
/* dar-public-tap-clean-v1 */
html{-webkit-tap-highlight-color:transparent}
a,button,[role="button"],summary,[tabindex],label{-webkit-tap-highlight-color:transparent}
@media(hover:none) and (pointer:coarse){
 a:focus,button:focus,[role="button"]:focus,summary:focus,[tabindex]:focus{outline:none}
}
.dar-download-fallback{padding:18px 0 34px}
.dar-download-fallback__intro{padding:18px 0 20px;border-bottom:1px solid rgba(132,111,72,.18)}
.dar-download-fallback__intro small{display:block;color:#8c6a2d;font-size:9px;font-weight:850;letter-spacing:.14em}
.dar-download-fallback__intro h1{margin:7px 0 5px;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:clamp(34px,5vw,58px);font-weight:500;color:#2b2923}
.dar-download-fallback__intro p{margin:0;color:#70685c;font-size:13px;line-height:1.6}
.dar-download-fallback__grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin-top:22px}
.dar-download-fallback__card{padding:22px;border:1px solid rgba(124,97,45,.2);border-radius:22px;background:linear-gradient(145deg,#fffdf8,#f5f0e6);box-shadow:0 10px 30px rgba(65,48,24,.07)}
.dar-download-fallback__head{display:flex;align-items:center;gap:14px}
.dar-download-fallback__icon{width:58px;height:58px;flex:0 0 58px;display:grid;place-items:center;border-radius:17px;background:#102b2b;color:#a4c639;overflow:hidden}
.dar-download-fallback__icon svg{width:36px;height:36px;display:block}.dar-download-fallback__icon img{width:100%;height:100%;display:block;object-fit:cover;border-radius:17px;transform:scale(1.035)}
.dar-download-fallback__card small{display:block;color:#8a6b2d;font-size:8px;font-weight:850;letter-spacing:.13em}
.dar-download-fallback__card h2{margin:4px 0 0;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:22px;font-weight:600;color:#2a2924}
.dar-download-fallback__card p,.dar-download-fallback__card ol{color:#625c53;font-size:11px;line-height:1.7}
.dar-download-fallback__btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 15px;border:1px solid #9a7738;border-radius:13px;background:#17342f;color:#fff9e9;text-decoration:none;font-size:10px;font-weight:850;cursor:pointer}.dar-download-fallback__btn:disabled{cursor:default;opacity:.62;filter:saturate(.65);pointer-events:none}
.dar-download-fallback__btn svg{width:18px;height:18px}.dar-pwa-icon-picker{margin-top:16px;padding-top:14px;border-top:1px solid rgba(124,97,45,.16)}.dar-pwa-icon-picker__title{margin-bottom:9px;color:#51483d;font-size:10px;font-weight:850;letter-spacing:.06em}.dar-pwa-icon-picker__strip{display:flex;gap:8px;overflow-x:auto;padding:2px 1px 8px;scrollbar-width:thin}.dar-pwa-icon-picker__strip button{width:48px;height:48px;flex:0 0 48px;padding:2px;border:2px solid transparent;border-radius:14px;background:#0f282a;overflow:hidden;cursor:pointer}.dar-pwa-icon-picker__strip button.is-active{border-color:#a77c32;box-shadow:0 0 0 2px rgba(167,124,50,.14)}.dar-pwa-icon-picker__strip img{width:100%;height:100%;display:block;object-fit:cover;border-radius:10px}.dar-pwa-icon-picker__status{margin-top:5px;color:#81776b;font-size:8.5px;line-height:1.45}
@media(max-width:760px){.dar-download-fallback__grid{grid-template-columns:1fr}.dar-download-fallback__card{padding:18px}}
@media (hover:none) and (pointer:coarse){
  html,body,a,button,[role="button"],summary,[tabindex],label,.desktop-link,.more-row,.category-card,.feature-card,.header-action,.main-nav a,.download-app-btn,.dar-pwa-home-action,.dar-pwa-icon-choice{
    -webkit-tap-highlight-color:rgba(0,0,0,0)!important;
  }
  a:focus,a:focus-visible,a:active,button:focus,button:focus-visible,button:active,[role="button"]:focus,[role="button"]:focus-visible,[role="button"]:active,
  .desktop-link:focus,.desktop-link:focus-visible,.desktop-link:active,.more-row:focus,.more-row:focus-visible,.more-row:active,
  .category-card:focus,.category-card:focus-visible,.category-card:active,.feature-card:focus,.feature-card:focus-visible,.feature-card:active{
    outline:0!important;outline-offset:0!important;filter:none!important;transform:none!important;
  }
}
</style>
<script id="darPublicWebsiteGuardV1">
(function(){
  "use strict";
  var ua=String(navigator.userAgent||"");
  if(/DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(ua))return;
  var android=/\bAndroid\b/i.test(ua);
  var standalone=false;
  try{standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true}catch(e){}
  try{
    document.documentElement.classList.add("dar-public-website");
    if(android)document.documentElement.classList.add("dar-android-browser");
    if(standalone)document.documentElement.classList.add("dar-pwa-standalone");
  }catch(e){}

  var pwaIcons=[{"id":"type-creme-ar","label":"Creme · Arabisch","theme":"#10282a","bg":"#f6f0e4","high":true},{"id":"emblem-creme-petrol","label":"Emblem · Creme/Petrol","theme":"#163b3a","bg":"#f3ead8","high":true},{"id":"emblem-nachtblau","label":"Emblem · Nachtblau","theme":"#101c34","bg":"#0c1630","high":true},{"id":"emblem-schwarzgold","label":"Emblem · Schwarz/Gold","theme":"#0a0a0c","bg":"#0a0a0c","high":true},{"id":"type-anthrazit-ar","label":"Anthrazit · Arabisch","theme":"#25292f","bg":"#25292f","high":false},{"id":"type-anthrazit-fein","label":"Anthrazit · Fein","theme":"#292d33","bg":"#292d33","high":false},{"id":"type-creme","label":"Creme · Name","theme":"#10282a","bg":"#f6f0e4","high":true},{"id":"type-weiss-ar","label":"Weiß · Arabisch","theme":"#111111","bg":"#ffffff","high":false},{"id":"type-schwarz-rund","label":"Schwarz · Rund","theme":"#101010","bg":"#101010","high":false},{"id":"type-schwarz-ar","label":"Schwarz · Arabisch","theme":"#0b0b0d","bg":"#0b0b0d","high":true},{"id":"type-schwarz","label":"Schwarz · Name","theme":"#0b0b0d","bg":"#0b0b0d","high":true},{"id":"type-navy-ar","label":"Navy · Arabisch","theme":"#102038","bg":"#102038","high":true},{"id":"type-navy","label":"Navy · Name","theme":"#102038","bg":"#102038","high":true},{"id":"type-bordeaux-ar","label":"Bordeaux · Arabisch","theme":"#581620","bg":"#581620","high":true},{"id":"type-bordeaux","label":"Bordeaux · Name","theme":"#581620","bg":"#581620","high":true},{"id":"type-gruen-ar","label":"Grün · Arabisch","theme":"#123024","bg":"#123024","high":true},{"id":"type-gruen","label":"Grün · Name","theme":"#123024","bg":"#123024","high":true},{"id":"type-schwarz-ar2","label":"Schwarz · Fein","theme":"#0b0b0d","bg":"#0b0b0d","high":true}];
  var pwaIconMap={};pwaIcons.forEach(function(row){pwaIconMap[row.id]=row});
  var pwaIconKey="dar_pwa_icon_v2";
  function getPwaIconId(){
    try{var saved=localStorage.getItem(pwaIconKey);if(saved&&pwaIconMap[saved])return saved}catch(e){}
    return "type-creme-ar";
  }
  function pwaIconSrc(id){
    id=pwaIconMap[id]?id:"type-creme-ar";
    return "/assets/app-icons/"+id+"/icon-192.png?v=pwa-picker-v2-20261009";
  }
  function refreshManifestForIcon(id){
    id=pwaIconMap[id]?id:"type-creme-ar";
    try{
      document.cookie="dar_pwa_icon="+encodeURIComponent(id)+"; Max-Age=31536000; Path=/; SameSite=Lax";
      var row=pwaIconMap[id];
      var meta=document.querySelector('meta[name="theme-color"]');
      if(meta&&row)meta.setAttribute("content",row.theme);
      document.documentElement.setAttribute("data-dar-pwa-icon-current",id);
      fetch("/install-manifest.json",{cache:"no-store",credentials:"same-origin"}).catch(function(){});
    }catch(e){}
  }
  function applyPwaIcon(id,persist){
    id=pwaIconMap[id]?id:"type-creme-ar";
    if(persist!==false){try{localStorage.setItem(pwaIconKey,id)}catch(e){}}
    refreshManifestForIcon(id);
    try{
      document.querySelectorAll("[data-dar-pwa-logo]").forEach(function(img){img.setAttribute("src",pwaIconSrc(id))});
      document.querySelectorAll("[data-dar-pwa-icon]").forEach(function(btn){btn.classList.toggle("is-active",btn.getAttribute("data-dar-pwa-icon")===id)});
      document.querySelectorAll("[data-dar-pwa-icon-status]").forEach(function(el){
        var nativeAndroid=!!(window.DarNative&&typeof window.DarNative.setAppIcon==="function");
        el.textContent=nativeAndroid
          ?"Launcher-Icon wird direkt in der Android-App geändert."
          :standalone
            ?"Icon gespeichert. Android/Chrome übernimmt die Änderung beim WebAPK-Metadatenupdate; für einen sofortigen Wechsel ist eine Neuinstallation nötig."
            :"Dieses Icon wird für die nächste Android-Web-App-Installation verwendet.";
      });
      try{
        if(window.DarNative&&typeof window.DarNative.setAppIcon==="function"){
          window.DarNative.setAppIcon(id);
        }
      }catch(eAndroidIcon){}
      var nativeHandler=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darAppIcon;
      if(nativeHandler&&nativeHandler.postMessage)nativeHandler.postMessage({name:id,id:id});
    }catch(e){}
    return id;
  }
  window.darSetPwaIcon=applyPwaIcon;
  window.darGetPwaIcon=getPwaIconId;
  applyPwaIcon(getPwaIconId(),false);

  var deferredInstall=window.__darEarlyInstallPrompt||null;
  var installPromptWaiters=[];
  function setPwaHint(text){
    try{
      var home=document.getElementById("darPwaHomeHint");
      if(home)home.textContent=text;
      document.querySelectorAll("[data-dar-pwa-hint]").forEach(function(el){el.textContent=text});
    }catch(e){}
  }
  function setInstalledState(){
    try{document.documentElement.classList.add("dar-pwa-standalone")}catch(e){}
    setPwaHint("Bereits als App installiert.");
  }
  function publishInstallPrompt(event){
    window.__darEarlyInstallPrompt=event;
    deferredInstall=event;
    var waiters=installPromptWaiters.splice(0);
    waiters.forEach(function(resolve){try{resolve(event)}catch(e){}});
  }
  function waitForInstallPrompt(ms){
    if(deferredInstall)return Promise.resolve(deferredInstall);
    return new Promise(function(resolve){
      var done=false;
      function finish(value){if(done)return;done=true;resolve(value||null)}
      installPromptWaiters.push(finish);
      setTimeout(function(){
        var idx=installPromptWaiters.indexOf(finish);
        if(idx>=0)installPromptWaiters.splice(idx,1);
        finish(null);
      },Math.max(250,Number(ms)||1800));
    });
  }
  async function ensureAndroidServiceWorkerReady(){
    try{
      await fetch("/install-manifest.json",{cache:"no-store",credentials:"same-origin"});
      if("serviceWorker" in navigator){
        var regs=await navigator.serviceWorker.getRegistrations();
        regs.forEach(function(reg){var worker=reg.active||reg.waiting||reg.installing;if(!worker||!worker.scriptURL)return;try{var sw=new URL(worker.scriptURL,location.href);if(sw.origin===location.origin&&sw.pathname==="/service-worker.js")reg.unregister()}catch(eSw){}});
      }
      return true;
    }catch(e){return false}
  }
  function syncRouterInstallButtons(){
    try{
      var ready=!!(window.__darEarlyInstallPrompt||deferredInstall);
      var installed=false;
      try{installed=window.matchMedia("(display-mode: standalone)").matches}catch(e){}
      document.querySelectorAll("[data-dar-pwa-install]").forEach(function(btn){
        if(!btn.dataset.darInstallLabel)btn.dataset.darInstallLabel=btn.textContent||"Web-App installieren";
        var preparing=android&&!installed&&!ready;
        btn.disabled=installed;
        btn.setAttribute("aria-disabled",installed?"true":"false");
        btn.setAttribute("data-dar-pwa-install-state",installed?"installed":(ready?"ready":"preparing"));
        var nextLabel=installed?"Bereits installiert":"Web-App installieren";
        if(btn.textContent!==nextLabel)btn.textContent=nextLabel;
      });
    }catch(e){}
  }
  window.addEventListener("beforeinstallprompt",function(event){
    if(!android||standalone)return;
    event.preventDefault();
    publishInstallPrompt(event);
    window.__darPwaInstallState="ready";
    syncRouterInstallButtons();
    setPwaHint("Bereit zur direkten Installation.");
  });
  window.addEventListener("appinstalled",function(){
    deferredInstall=null;
    window.__darEarlyInstallPrompt=null;
    setInstalledState();
  });
  window.addEventListener("dar:pwa-install-choice",function(){
    deferredInstall=null;
    syncRouterInstallButtons();
  });
  window.addEventListener("dar:pwa-install-error",function(){
    deferredInstall=null;
    syncRouterInstallButtons();
  });
  window.darInstallAndroidPwa=async function(){
    if(!android){
      setPwaHint("Bitte diese Seite auf einem Android-Gerät öffnen.");
      return false;
    }
    try{
      if(window.matchMedia("(display-mode: standalone)").matches){
        setInstalledState();
        return true;
      }
    }catch(e){}
    // Keep the native prompt inside the original user gesture.
    var installEvent=window.__darEarlyInstallPrompt||deferredInstall;
    if(installEvent){
      window.__darEarlyInstallPrompt=null;
      deferredInstall=null;
      syncRouterInstallButtons();
      try{
        installEvent.prompt();
        var choice=await installEvent.userChoice;
        if(choice&&choice.outcome==="accepted"){
          deferredInstall=null;
          window.__darEarlyInstallPrompt=null;
          setPwaHint("Installation bestätigt.");
          return true;
        }
        setPwaHint("Installation wurde nicht bestätigt.");
        return false;
      }catch(e){
        deferredInstall=null;
        window.__darEarlyInstallPrompt=null;
      }
    }
    setPwaHint("Android bereitet den direkten Installationsdialog vor. Bitte erneut auf „Web-App installieren“ tippen.");
    return false;
  };
  document.addEventListener("click",function(event){
    var btn=event.target&&event.target.closest?event.target.closest("[data-dar-pwa-install]"):null;
    if(!btn)return;

    // Use the stored install event immediately inside this tap.
    // No async work may happen before prompt(), otherwise Chrome can drop user activation.
    var directEvent=window.__darEarlyInstallPrompt||deferredInstall;
    if(directEvent&&!window.__darInstallPromptBusy){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.__darInstallPromptBusy=true;
      window.__darEarlyInstallPrompt=null;
      deferredInstall=null;
      syncRouterInstallButtons();
      try{
        directEvent.prompt();
        Promise.resolve(directEvent.userChoice).then(function(choice){
          deferredInstall=null;
          window.__darEarlyInstallPrompt=null;
          window.__darInstallPromptBusy=false;
          if(choice&&choice.outcome==="accepted")setPwaHint("Installation bestätigt.");
          else setPwaHint("Installation wurde nicht bestätigt.");
        }).catch(function(){
          deferredInstall=null;
          window.__darEarlyInstallPrompt=null;
          window.__darInstallPromptBusy=false;
        });
        return;
      }catch(eDirect){
        deferredInstall=null;
        window.__darEarlyInstallPrompt=null;
        window.__darInstallPromptBusy=false;
      }
    }
    event.preventDefault();
    window.darInstallAndroidPwa();
  },true);

  document.addEventListener("click",function(event){
    var iconBtn=event.target&&event.target.closest?event.target.closest("button[data-dar-pwa-icon]"):null;
    if(!iconBtn)return;
    event.preventDefault();
    applyPwaIcon(iconBtn.getAttribute("data-dar-pwa-icon"),true);
  });

  document.addEventListener("DOMContentLoaded",function(){
    syncRouterInstallButtons();
    try{
      var mo=new MutationObserver(function(){syncRouterInstallButtons()});
      mo.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  });

  try{
    var u=new URL(location.href);
    ["homescreen","app","mobile","source"].forEach(function(k){u.searchParams.delete(k)});
    if(u.hash==="#home")u.hash="";
    if((u.pathname==="/"||u.pathname==="/index.html")&&!u.searchParams.has("page"))u.searchParams.set("page","start");
    history.replaceState(history.state||{},"",u.pathname+(u.search||"")+(u.hash||""));
  }catch(eUrl){}

  try{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(reg){var worker=reg.active||reg.waiting||reg.installing;if(!worker||!worker.scriptURL)return;try{var sw=new URL(worker.scriptURL,location.href);if(sw.origin===location.origin&&sw.pathname==="/service-worker.js")reg.unregister()}catch(eSw){}})}).catch(function(){});
    }
    if("caches" in window)caches.keys().then(function(keys){keys.forEach(function(k){if(/^dar-al-tawhid-offline-light-/i.test(k))caches.delete(k)})}).catch(function(){});
  }catch(eReg){}

  function appleLogoMarkup(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.64c-.03-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.69-1.32-.14-2.59.78-3.26.78s-1.7-.76-2.81-.74c-1.44.02-2.78.84-3.52 2.14-1.51 2.62-.39 6.5 1.08 8.63.72 1.04 1.58 2.21 2.71 2.17 1.09-.05 1.5-.7 2.81-.7s1.68.7 2.82.68c1.17-.02 1.91-1.06 2.62-2.11.83-1.2 1.17-2.37 1.19-2.43-.03-.01-2.27-.87-2.3-3.48zM14.5 6.9c.6-.73 1-1.74.89-2.75-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.95-.49 2.54-1.2z"/></svg>';
  }
  function androidLogoMarkup(){
    return '<img src="/assets/app-icons/type-creme-ar/icon-512.png?v=pwa-standard-v1-20261009" alt="" width="58" height="58" decoding="async">';
  }
  function pwaIconPickerMarkup(){
    return '<div class="dar-pwa-icon-picker"><div class="dar-pwa-icon-picker__title">App-Icon wählen</div><div class="dar-pwa-icon-picker__strip">'+pwaIcons.map(function(row){return '<button type="button" data-dar-pwa-icon="'+row.id+'" title="'+row.label+'"><img src="/assets/app-icons/'+row.id+'/icon-192.png?v=pwa-picker-v2-20261009" alt="'+row.label+'" loading="lazy"></button>'}).join('')+'</div><div class="dar-pwa-icon-picker__status" data-dar-pwa-icon-status></div></div>';
  }
  function ensurePublicDownloads(){
    var page="start";
    try{page=(new URLSearchParams(location.search).get("page")||"start").toLowerCase()}catch(e){}
    if(page==="mehr"){
      var grid=document.querySelector(".more-grid");
      if(grid&&!grid.querySelector('[data-page="downloads"],.dar-download-route')){
        var link=document.createElement("a");
        link.className="more-row dar-download-route";
        link.href="/?page=downloads";
        link.innerHTML='<div><h3>Downloads</h3><p>Android-Web-App installieren · iPhone & iPad im Apple App Store.</p></div><b>→</b>';
        grid.insertBefore(link,grid.firstChild);
      }
      // Widgets & App-Icon intentionally absent from the public Mehr route.
      // Dedicated widgets page remains accessible at /widgets/.

    }
    if(page==="downloads"&&!document.querySelector(".download-hub-grid,.dar-download-fallback")){
      var root=document.getElementById("pageRoot");
      if(!root)return;
      root.innerHTML='<section class="dar-download-fallback"><div class="dar-download-fallback__intro"><small>DOWNLOADS</small><h1>DĀR AL TAWḤĪD als App nutzen.</h1><p>Android direkt als Web-App installieren.</p></div><div class="dar-download-fallback__grid">'+
        '<article class="dar-download-fallback__card"><div class="dar-download-fallback__head"><span class="dar-download-fallback__icon">'+androidLogoMarkup()+'</span><div><small>ANDROID · SMARTPHONE & TABLET</small><h2>Web-App installieren</h2></div></div><p>Die öffentliche DĀR AL TAWḤĪD Website lässt sich auf Android direkt wie eine App installieren. Keine APK nötig.</p><ol><li>In Chrome, Edge oder Samsung Internet öffnen.</li><li>Auf Web-App installieren tippen.</li><li>Der native Android-Installationsdialog erscheint direkt hier, sobald der Browser die Web-App freigegeben hat.</li></ol><button class="dar-download-fallback__btn" type="button" data-dar-pwa-install>Web-App installieren</button></article>'+
        '<article class="dar-download-fallback__card"><div class="dar-download-fallback__head"><span class="dar-download-fallback__icon">'+appleLogoMarkup()+'</span><div><small>APPLE · IPHONE & IPAD</small><h2>iOS-App</h2></div></div><p>Die offizielle iOS-App ist im Apple App Store erhältlich.</p><a class="dar-download-fallback__btn" href="https://apps.apple.com/de/app/id6805988753">Im App Store laden</a></article>'+
        '</div></section>';
      applyPwaIcon(getPwaIconId(),false);
      if(typeof syncRouterInstallButtons==="function")syncRouterInstallButtons();
    }
  }
  function schedulePublicDownloads(){
    setTimeout(ensurePublicDownloads,0);
    setTimeout(ensurePublicDownloads,120);
    setTimeout(ensurePublicDownloads,420);
  }
  ensurePublicDownloads();
  window.addEventListener("pageshow",schedulePublicDownloads);
  window.addEventListener("popstate",schedulePublicDownloads);
  try{
    ["pushState","replaceState"].forEach(function(method){
      var original=history[method];
      if(typeof original!=="function"||original.__darDownloadsWrapped)return;
      var wrapped=function(){
        var result=original.apply(history,arguments);
        schedulePublicDownloads();
        return result;
      };
      wrapped.__darDownloadsWrapped=true;
      history[method]=wrapped;
    });
  }catch(eHistory){}
  // Route navigation already schedules download rendering; avoid a subtree-wide
  // observer that otherwise queues three timers for every content mutation.
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
    // Owner-only editorial route: fail-closed login before public static assets/router.
    const editorialAccess = await editorialOwnerAccess(request,url,env);
    if(editorialAccess instanceof Response)return editorialAccess;
    // Q_SOURCE_LIBRARY_DIRECT_ROUTING_V2
    // These are standalone public sources, NOT an SPA shell. Cloudflare's
    // default HTML handling already maps /quellen/ to quellen/index.html.
    // Do not rewrite /quellen/ to /quellen/index.html in _redirects.
    if (request.method === "GET" || request.method === "HEAD") {
      const sourcePath = url.pathname;
      const numericSource = sourcePath.match(/^\/q\/([1-9][0-9]*)(?:\/index\.html|\/?)$/);
      const canonicalSourcePath = numericSource ? "/q/" + numericSource[1] + "/" : "";
      const sourceIsLibrary = sourcePath === "/quellen" || sourcePath === "/quellen/" ||
        sourcePath === "/quellen/index.html" || sourcePath === "/quellen/shortlinks.json";
      const sourceIsArchive = sourcePath === "/q" || sourcePath === "/q/" || sourcePath === "/q/index.html";
      if (sourceIsArchive) {
        // A public /q/ index is never a doorway to the owner's register.
        return new Response("Quellenbeleg nicht gefunden. Bitte den vollständigen Q-Link öffnen.", {
          status: 404, headers: {
            "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex,nofollow"
          }
        });
      }
      if (sourceIsLibrary || canonicalSourcePath) {
        const canonicalPath =
          canonicalSourcePath || (sourcePath === "/quellen/shortlinks.json" ? sourcePath : "/quellen/");
        if (sourcePath !== canonicalPath) {
          const location = canonicalPath + (url.search || "");
          return new Response(null, { status: 308, headers: {
            "Location": location,
            "Cache-Control": "no-store, max-age=0",
            "X-DAR-Q-Route": "canonical-redirect"
          } });
        }
        try {
          // Numbered source pages are physical /q/N/index.html files.
          // Resolve the asset explicitly to avoid Workers Static Assets
          // trailing-slash canonical redirects and accidental SPA fallbacks.
          let asset = await env.ASSETS.fetch(request);
          if (canonicalSourcePath && (!asset.ok || (asset.status >= 300 && asset.status < 400))) {
            const directUrl = new URL(request.url);
            directUrl.pathname = canonicalSourcePath + "index.html";
            asset = await env.ASSETS.fetch(new Request(directUrl.toString(), request));
          }
          const headers = new Headers(asset.headers);
          headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
          headers.set("CDN-Cache-Control", "no-store");
          headers.set("Cloudflare-CDN-Cache-Control", "no-store");
          headers.set("X-DAR-Q-Route", "direct-static-asset-v2");
          headers.delete("Content-Length");
          if (asset.status >= 300 && asset.status < 400) {
            // Never loop a canonical asset back to itself.
            return new Response("Quellen-Routingfehler", { status: 502, headers });
          }
          // ROYAL_Q_MANUSCRIPT_V42: apply one presentation to all existing and
          // future numbered Q pages. Original HTML text, links, isnads and SEO
          // metadata are retained byte-for-byte except new stylesheet/script tags.
          if (sourceIsLibrary) {
            headers.set("X-Robots-Tag", "noindex,nofollow,noarchive");
          }
          if (canonicalSourcePath && request.method === "GET" && asset.ok &&
              /text\/html/i.test(asset.headers.get("Content-Type") || "")) {
            let documentHtml = await asset.text();
            // Set shell mode before styles load: third-party in-app browsers
            // already render their own URL/status toolbar outside our document.
            if (!documentHtml.includes('data-q-shell="v2"')) {
              const shellMode = '<script data-q-shell="v2">(function(){var u=navigator.userAgent||"";var p=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;var n=navigator.standalone===true;var a=/DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/.test(u)||window.DAR_IOS_NATIVE_APP===true;document.documentElement.setAttribute("data-q-shell",p||n||a?"installed":"browser")})();</script>';
              documentHtml = documentHtml.replace(/<head[^>]*>/i, function(tag){return tag+shellMode});
            }
            if (!documentHtml.includes("q-royal-manuscript-v42.css") &&
                /<\/head>/i.test(documentHtml)) {
              documentHtml = documentHtml.replace(/<\/head>/i,
                '<link rel="stylesheet" href="/assets/q-royal-manuscript-v42.css?v=qapp-20261013-2" data-q-royal="v42">' +
                '<script src="/assets/q-royal-manuscript-v42.js?v=qapp-20261013-1" defer><\\/script>'.replace('<\\/script>', '</script>') +
                '<script src="/assets/q-source-app-view.js?v=20261013-1" defer></script>' +
                '</head>');
            }
            // Future Q pages may already link Royal CSS. The in-app route
            // handler must still be injected exactly once in those pages.
            if (!documentHtml.includes("q-source-app-view.js") && documentHtml.toLowerCase().includes("</head>")) {
              documentHtml = documentHtml.replace(new RegExp("</head>", "i"),
                '<script src="/assets/q-source-app-view.js?v=20261013-1" defer></script></head>');
            }
            headers.set("Content-Type", "text/html; charset=utf-8");
            headers.set("X-DAR-Q-Layout", "royal-manuscript-v42");
            return new Response(documentHtml, { status: asset.status,
              statusText: asset.statusText, headers });
          }
          return new Response(request.method === "HEAD" ? null : asset.body, {
            status: asset.status, statusText: asset.statusText, headers
          });
        } catch (error) {
          return new Response("Quellenbibliothek vorübergehend nicht erreichbar", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store",
              "X-DAR-Q-Route": "asset-error" }
          });
        }
      }
    }
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
    // Die öffentliche KIDS-Web-App und Lernakademie benötigen kein HTTP-Basic-Login.
    // Nur /kids (einschließlich CSS, JSON, Audio und Unterricht) freigeben;
    // /test/kids und andere interne Routen bleiben hinter der bisherigen Sperre.
    // Owner Academy V19 is handled BEFORE generic Basic-Auth / Kids redirects.
    // A signed HttpOnly cookie authorizes only Academy assets and never child accounts.
    const ownerAccess = await academyOwnerAccess(request, url, env);
    if (ownerAccess instanceof Response) return ownerAccess;
    if (ownerAccess === true) {
      const ownerUrl = new URL(request.url);
      ownerUrl.pathname = academyOwnerAssetPath(url.pathname);
      const asset = await env.ASSETS.fetch(new Request(ownerUrl.toString(), request));
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      headers.set("X-Frame-Options", "DENY");
      if (request.method === "HEAD") return new Response(null, { status: asset.status, statusText: asset.statusText, headers });
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }
    const gated = isLiveKidsPath(url.pathname) ? null : gateHiddenSurfaces(request, url, env, "live");
    if (gated) return gated;
    // TV-only stable short URL, pinned to a verified signed public GitHub release.
    // Update the pinned version only after the next TV-APK signature/release audit.
    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/tv.apk") {
      const tvReleaseUrl = "https://github.com/Sero91ak/dar-al-tawhid-site/releases/download/android-website-v1.54/dar-al-tawhid-tv.apk";
      return new Response(null, {
        status: 302,
        headers: {
          "Location": tvReleaseUrl,
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Content-Security-Policy": "default-src 'none'",
          "Referrer-Policy": "no-referrer",
          "X-Dar-Surface": "official-android-tv-apk"
        }
      });
    }
    if (request.method === "GET" || request.method === "HEAD") {
      const intro = await serveKidsIntroVideo(request, url, env);
      if (intro) return intro;
    }
    const isRoot = url.pathname === "/" || url.pathname === "/index.html";
    const ua = String(request.headers.get("User-Agent") || "");
    const nativeApp = isNativeAppRequest(ua);
    const androidNativeApp = /DarAlTawhidAndroid/i.test(ua);
    const androidBrowser = isAndroidBrowserRequest(ua);
    const appleMobileBrowser = isAppleMobileBrowserRequest(ua);
    const kidsPath = isKidsPath(url.pathname);
    const kidsRecitationGrade =
      url.pathname === "/kids/api/recitation/grade" ||
      url.pathname === "/test/kids/api/recitation/grade";
    const voiceAliasPath = url.pathname === "/voice" || url.pathname === "/voice/";
    const voicePath = url.pathname === "/voice-studio" || url.pathname.startsWith("/voice-studio/");
    const legacyVoicePath = url.pathname === "/test/voice-studio" || url.pathname.startsWith("/test/voice-studio/");

    if ((request.method === "GET" || request.method === "HEAD") && (url.pathname === "/manifest.json" || url.pathname === "/install-manifest.json") && !nativeApp) {
      return browserManifestResponse(request, androidBrowser);
    }

    const legacyPwaLaunch = url.searchParams.get("homescreen") === "1"
      || url.searchParams.get("app") === "1"
      || url.searchParams.get("mobile") === "1";
    // Explicit iOS visitor-PWA links are canonicalized to the PUBLIC WEBSITE,
    // never to /pwa/. Keep the existing native iOS application route intact.
    if ((request.method === "GET" || request.method === "HEAD") && isRoot &&
        appleMobileBrowser && (url.searchParams.get("pwa") === "1" || legacyPwaLaunch)) {
      return new Response(null, { status: 307, headers: {
        "Location": "/",
        "Cache-Control": "no-store, max-age=0",
        "Vary": "User-Agent",
        "X-Dar-Surface": "ios-website-only"
      } });
    }
    if ((request.method === "GET" || request.method === "HEAD") && isRoot && (url.searchParams.get("pwa") === "1" || legacyPwaLaunch) && !nativeApp && !appleMobileBrowser) {
      const target = new URL(request.url);
      target.pathname = "/pwa/";
      target.searchParams.set("pwa", "1");
      target.searchParams.delete("homescreen");
      target.searchParams.delete("app");
      target.searchParams.delete("mobile");
      return new Response(null, {
        status: 307,
        headers: {
          "Location": target.pathname + target.search,
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Cloudflare-CDN-Cache-Control": "no-store",
          "X-Dar-Surface": "android-pwa-redirect"
        }
      });
    }

    if ((request.method === "GET" || request.method === "HEAD") &&
        (url.pathname === "/pwa" || url.pathname === "/pwa/" || url.pathname === "/pwa/index.html")) {
      // Apple browser requests cannot reach the Android-only visitor app shell.
      if (appleMobileBrowser) {
        return new Response(null, { status: 307, headers: {
          "Location": "/",
          "Cache-Control": "no-store, max-age=0",
          "Vary": "User-Agent",
          "X-Dar-Surface": "ios-website-only"
        } });
      }
      // Workers Static Assets canonicalizes /index.html to /. Fetch the
      // canonical root asset through the binding so /pwa/ receives HTML, not
      // a redirect that escapes into the public desktop website.
      const target = new URL("/", url.origin);
      const assetRequest = new Request(target.toString(), request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("X-Dar-Surface", "android-pwa-app");
      headers.set("X-Dar-PWA-Revision", "visitor-android-20261030-v10");
      headers.delete("ETag");
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      if (request.method === "HEAD") {
        headers.set("Content-Type", "text/html; charset=utf-8");
        return new Response(null, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      let html = await assetResponse.text();
      if (assetResponse.ok) {
        // The shared app HTML sets all non-test routes to visitor.
        // In /pwa/ that overwrites our Android-PWA boot identity; patch only
        // the isolated PWA response, leaving the public site and iOS intact.
        const appPathMarker = "document.documentElement.dataset.appPath=(location.pathname.indexOf(\"/test/\")===0||location.pathname===\"/test\")?\"test\":\"visitor\"";
        const pwaAppPathMarker = "document.documentElement.dataset.appPath=location.pathname.startsWith(\"/pwa\")?\"android-pwa\":((location.pathname.indexOf(\"/test/\")===0||location.pathname===\"/test\")?\"test\":\"visitor\")";
        if (html.includes(appPathMarker)) html = html.replace(appPathMarker, pwaAppPathMarker);
        // This old Android-wide watchdog strips the boot overlay after 3.5 s,
        // even if the app has not rendered. Keep it for the regular website,
        // but let the dedicated PWA finish only after its actual content is ready.
        const prematureBootWipe = "/* SOFTBOOT_UNSTICK_V672 */(function(){";
        const pwaSafeBootWipe = "/* SOFTBOOT_UNSTICK_V672 */(function(){if(location.pathname.indexOf(\"/pwa\")===0)return;";
        if (html.includes(prematureBootWipe)) html = html.replace(prematureBootWipe, pwaSafeBootWipe);
        // Freshly installed apps must not reload themselves during their first
        // navigation. The shared root app purges visual caches and redirects on
        // first build; that races Android's OS splash on an empty PWA cache.
        // The /pwa/ worker already has independent build-scoped cache handling.
        const visualPurgeStart = "/* VISUAL_PAST_PURGE_V588: alte Optik-Caches löschen – aktuelle Darstellung bleibt Autorität */(function(){";
        const pwaVisualPurgeStart = "/* VISUAL_PAST_PURGE_V588: alte Optik-Caches löschen – aktuelle Darstellung bleibt Autorität */(function(){if(location.pathname.indexOf(\"/pwa\")===0)return;";
        if (html.includes(visualPurgeStart)) html = html.replace(visualPurgeStart, pwaVisualPurgeStart);
        // Other shared-app recovery code forces another hard navigation after
        // 11 seconds. For /pwa/, preserve its soft render retry and let the
        // dedicated loader show the existing retry control at 16 seconds.
        const legacyHardReload = "function hard(){try{var r=sessionStorage.getItem(K)";
        const pwaNoHardReload = "function hard(){if(location.pathname.indexOf(\"/pwa\")===0)return;try{var r=sessionStorage.getItem(K)";
        if (html.includes(legacyHardReload)) html = html.replace(legacyHardReload, pwaNoHardReload);
        // The dedicated PWA must never register the website-wide worker from
        // the shared app HTML. Keep OneSignal at /push/onesignal/ unchanged.
        html = html.replace("navigator.serviceWorker.register(\"/service-worker.js\",{updateViaCache:\"none\"})", "navigator.serviceWorker.register(\"/pwa/service-worker.js\",{scope:\"/pwa/\",updateViaCache:\"none\"})");
        html = html.replace("<script src=\"/assets/app-soft-boot.js?v=677\"></script>", "<script src=\"/assets/app-soft-boot.js?v=678\"></script>");
        // Refresh only the isolated Android Fold workspace CSS after this layout fix.
        html = html.replace('/assets/fold-split.css?v=2', '/assets/fold-split.css?v=4');
        html = html.replace('/assets/fold-split.js?v=4', '/assets/fold-split.js?v=5');
        // Android installed PWA: bump URLs for the shared visitor home and 3D icon renderer.
        // An old v3 PWA worker may otherwise return a permanently stale cache-first asset.
        html = html.replace('/assets/dar-home-test-parity-visitor.js?v=20261030-home-order-clock-v2', '/assets/dar-home-test-parity-visitor.js?v=20261031-neutral-hooded-v14');
        html = html.replaceAll('/assets/dar-noble-3d-icons.js?v=1095', '/assets/dar-noble-3d-icons.js?v=20261030-android-global-parity-v8');
        html = html.replace('/assets/dar-noble-3d-icons.css?v=1095', '/assets/dar-noble-3d-icons.css?v=20261030-android-global-parity-v8');
        // iPadOS desktop-class Safari identifies as Macintosh, even on a tablet.
        // Check touch capability synchronously before the Android PWA bootstrap.
        const iosPwaGuard =
          '<style id="darIosWebsiteOnlyStyleV1">html[data-ios-website-only="1"]{visibility:hidden!important}</style>' +
          '<script id="darIosWebsiteOnlyPwaGuardV1">(function(){try{' +
          'var u=navigator.userAgent||"";' +
          'var apple=/iPhone|iPad|iPod/i.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);' +
          'var nativeApp=/DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(u)||window.DAR_IOS_NATIVE_APP===true;' +
          'if(apple&&!nativeApp){document.documentElement.setAttribute("data-ios-website-only","1");location.replace("/")}' +
          '}catch(e){}})();<\/script>';
        const pwaHead =
          '<base href="/">' +
          '<link rel="stylesheet" id="darPwaReleaseNoticeCssV1" href="/assets/dar-pwa-release-notice-v1.css?v=20261030-android-v8">' +
          '<script defer id="darPwaReleaseNoticeJsV1" src="/assets/dar-pwa-release-notice-v1.js?v=20261030-android-v8"></' + 'script>' +
          '<script id="darDedicatedPwaBootV2">' +
          'window.__DAR_PWA_STANDARD_BOOT=true;' +
          'window.__DAR_PWA_DEDICATED_APP=true;' +
          'window.__DAR_PWA_VISITOR_RELEASE="visitor-android-20261030-v10";' +
          'window.__DAR_PWA_LAUNCH_MARKER=true;' +
          'try{sessionStorage.setItem("dar_pwa_launch_session_v1","1")}catch(e){}' +
          // Ask Chrome to retain offline cache only after the PWA has loaded.
          // This is best-effort and never blocks the first screen.
          'try{window.addEventListener("load",function(){setTimeout(function(){try{var s=navigator.storage;if(s&&s.persist)s.persist().catch(function(){})}catch(e){}},3000)},{once:true})}catch(e){}' +
          // Warm only small cached resources after the first paint, never while loading.
          'try{window.addEventListener("load",function(){setTimeout(function(){try{var w=navigator.serviceWorker;if(w){w.getRegistration("/pwa/").then(function(reg){var active=reg&&reg.active;if(active)active.postMessage({type:"PWA_WARM_CORE"})}).catch(function(){})}}catch(e){}},9000)},{once:true})}catch(e){}' +
          'try{if("serviceWorker" in navigator){navigator.serviceWorker.register("/pwa/service-worker.js",{scope:"/pwa/"}).catch(function(){})}}catch(eSw){}' +
          'try{var r=document.documentElement;r.classList.add("dar-pwa-standalone-boot","dar-soft-booting","dar-dedicated-pwa-app","is-standalone-pwa","is-android");r.dataset.appPath="android-pwa"}catch(e){}' +
          '<\/script>';
        if (!html.includes('id="darDedicatedPwaBootV2"')) {
          html = html.includes("<head>") ? html.replace("<head>", "<head>" + iosPwaGuard + pwaHead) : iosPwaGuard + pwaHead + html;
        }
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      html = assetResponse.ok ? activateAdultCompactHero(html) : html;
      if (assetResponse.ok) html = activateAdultGlobalBrandV2(html);
      if (assetResponse.ok && !html.includes("dar-onesignal-language-sync.js")) {
        const localeTag = '<script defer id="darAdultOneSignalLocaleV1" src="/assets/dar-onesignal-language-sync.js?v=1"></script>';
        html = html.includes("</body>") ? html.replace("</body>", localeTag + "</body>") : html + localeTag;
      }
      return new Response(html, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
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
            // The teacher's standalone archive must load its exact reading
            // document, not an extensionless Kids app-shell fallback.
            if (url.pathname === "/kids/unterrichtsarchiv.html") {
              add(url.pathname);
              add(url.pathname.replace(/\.html$/, ""));
            } else {
              add(url.pathname.replace(/\.html$/, ""));
              add(url.pathname);
            }
          } else {
            // Prefer the explicit canonical HTML asset first. Cloudflare pretty-URL
            // resolution may otherwise return a stale extensionless /kids/start.
            add(pretty[url.pathname]);
            add(url.pathname.replace(/\/$/, "") || url.pathname);
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
      let html = await assetResponse.text();
      if (assetResponse.ok) html = activateAdultCompactHero(html);
      if (assetResponse.ok) html = activateAdultGlobalBrandV2(html);
      if (assetResponse.ok && !html.includes("frauen-live-adapter.js")) {
        const frauenAddon = liveFrauenNativeAddon();
        html = html.includes("</body>") ? html.replace("</body>", frauenAddon + "</body>") : html + frauenAddon;
      }
      if (assetResponse.ok && androidNativeApp && !html.includes("darAndroidNativeToolsScriptV1")) {
        const androidAddon = androidNativeToolsAddon();
        html = html.includes("</body>") ? html.replace("</body>", androidAddon + "</body>") : html + androidAddon;
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(html, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    if ((request.method === "GET" || request.method === "HEAD") && isRoot && wantsPublicWebsite(request)) {
      // Workers Static Assets canonicalizes */index.html to the directory URL.
      // Fetch the canonical directory asset internally so the public root never
      // leaks a 30x redirect to /desktop-preview/ and still receives our injected guards.
      const target = new URL("/desktop-preview/", url.origin);
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
        if (!html.includes("dar-onesignal-language-sync.js")) html = html.replace("</body>", '<script defer src="/assets/dar-onesignal-language-sync.js?v=1"></script></body>');
        if (!html.includes("darPublicWebsiteGuardV1")) html = html.replace("</body>", publicWebsiteAddon() + "</body>");
        html = activateAdultCompactHero(html);
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
      // The public dar-al-tawhid.de/test route is served by THIS router,
      // not by cloudflare/test-app-worker.js. Previous Home CSS updates there
      // therefore never reached the user's real Test iOS app.
      const testHomeHtml =
        (url.pathname === "/test" || url.pathname === "/test/" || url.pathname === "/test/index.html");
      if (testHomeHtml && assetResponse.ok) {
        let html = await assetResponse.text();
        // Refresh the public DĀR TEST profile modules across iOS/Android caches.
        html = html.replace(/(\/test\/assets\/dar-test-premium-header-v2\.js\?v=)[^"'\s<>]+/g,
          "$1" + "20261031-neutral-hooded-test-v14");
        html = html.replace(/(\/test\/assets\/dar-home-html-parity-v1\.js\?v=)[^"'\s<>]+/g,
          "$1" + "20261031-neutral-hooded-test-v14");
        html = html.replace(/(\/test\/assets\/dar-smart-profile-v1\.js\?v=)[^"'\s<>]+/g,
          "$1" + "20261031-neutral-hooded-test-v14");
        if (!html.includes("dar-onesignal-language-sync.js")) {
          const tag = '<script defer id="darTestOneSignalLocaleV1" src="/assets/dar-onesignal-language-sync.js?v=1"></script>';
          html = html.includes("</body>") ? html.replace("</body>", tag + "</body>") : html + tag;
        }
        // SMART_TEST_HOME_V3: actual public /test/ router, cache-busted test-only Home JS.
        // No visitor, public website, or KIDS HTML is modified by this branch.
        html = html.replace(/dar-home-library-v1194\.js\?v=[^"'\x60\s]+/g,
          "dar-home-library-v1194.js?v=20261020-smart-v3");
        if (!html.includes("dar-home-library-v1194.js?v=20261020-smart-v3")) {
          const homeScript = '<script defer id="darTestSmartHomeV3" src="/test/assets/dar-home-library-v1194.js?v=20261020-smart-v3"></script>';
          html = html.includes("</body>") ? html.replace("</body>", homeScript + "\n</body>") : html + homeScript;
        }
        const v3Styles = '<link rel="stylesheet" id="darTestHomeV3ActualRoute" href="/test/assets/dar-home-v3-compact.css?v=20261019-home-plain-v2">';
        const noPhotos = '<link rel="stylesheet" id="darTestHomeNoPhotosActualRouteV2" href="/test/assets/home-background-remove-v2.css?v=20261019-photo-free-v2">';
        if (!html.includes('id="darTestHomeV3ActualRoute"')) {
          html = html.includes("</head>") ? html.replace("</head>", v3Styles + "\n</head>") : v3Styles + html;
        }
        // Put the no-photo rule after all older Startseite CSS. It is limited
        // to body.is-home-route and never replaces theme colours or icons.
        if (!html.includes('id="darTestHomeNoPhotosActualRouteV2"')) {
          html = html.includes("</body>") ? html.replace("</body>", noPhotos + "\n</body>") : html + noPhotos;
        }
        headers.set("X-DAR-Test-Home", "smart-v3-20261020");
        headers.set("Content-Type", "text/html; charset=utf-8");
        headers.delete("Content-Length");
        headers.delete("Content-Encoding");
        return new Response(html, {
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
