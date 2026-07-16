#!/usr/bin/env node
/**
 * Port Premium-Feed from test/index.html → index.html (live)
 */
import fs from 'fs';

if (String(process.env.CODEX_LIVE_APPROVED || "").trim() !== "1") {
  throw new Error(
    "patch-live-feed blockiert: Live-Patch braucht ausdruecklich CODEX_LIVE_APPROVED=1."
  );
}

const livePath = 'index.html';
const testPath = 'test/index.html';
let live = fs.readFileSync(livePath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');

function extractBetween(src, start, end) {
  const i = src.indexOf(start);
  if (i < 0) throw new Error('start not found: ' + start.slice(0, 60));
  const j = src.indexOf(end, i + start.length);
  if (j < 0) throw new Error('end not found after: ' + start.slice(0, 60));
  return src.slice(i, j);
}

function replaceOnce(hay, old, neu, label) {
  if (!hay.includes(old)) throw new Error('replace failed: ' + label);
  return hay.replace(old, neu);
}

// CSS: feed fullscreen block (after body.has-bottom-nav .footer)
const feedCss = extractBetween(test, 'body.is-feed-fullscreen{padding-left:0!important', '@media(max-width:700px){body.is-feed-fullscreen{padding-left:0!important;padding-right:0!important}body.is-feed-fullscreen .view{border-radius:0;padding:0!important}}');
if (!live.includes('body.is-feed-fullscreen{padding-left:0!important')) {
  live = replaceOnce(
    live,
    'body.has-bottom-nav .footer{padding-bottom:calc(18px + env(safe-area-inset-bottom))}',
    'body.has-bottom-nav .footer{padding-bottom:calc(18px + env(safe-area-inset-bottom))}\n' + feedCss + '@media(max-width:700px){body.is-feed-fullscreen{padding-left:0!important;padding-right:0!important}body.is-feed-fullscreen .view{border-radius:0;padding:0!important}}',
    'feed-css-base'
  );
}

// Theme feed CSS block
const themeFeedCss = extractBetween(test, 'html[data-theme] body.is-feed-fullscreen,\nhtml[data-theme] body.is-feed-fullscreen.has-bottom-nav{', 'html[data-theme] body.is-feed-fullscreen .sf-post__head{');
const themeFeedCssTail = extractBetween(test, 'html[data-theme] body.is-feed-fullscreen .sf-post__head{', ':root{\n  --feed-col-max:100%;\n}');
if (!live.includes('html[data-theme] body.is-feed-fullscreen,')) {
  live = replaceOnce(
    live,
    ':root{\n  --feed-col-max:100%;\n}',
    themeFeedCss + 'html[data-theme] body.is-feed-fullscreen .sf-post__head{' + themeFeedCssTail + ':root{\n  --feed-col-max:100%;\n}',
    'feed-theme-css'
  );
}

// Scripts
live = replaceOnce(
  live,
  '<script src="/assets/focus-feed-app.js?v=3" defer></script>',
  '<script src="/assets/focus-feed-app.js?v=6" defer></script>\n<script src="/assets/html2canvas.min.js"></script>\n<script src="/assets/premium-feed-app.js?v=65" defer></script>',
  'scripts'
);

// Bottom nav
live = replaceOnce(
  live,
  `  <button class="bottom-nav-btn" type="button" data-bottom-nav="topics" aria-label="Beiträge"><span class="nav-icon" aria-hidden="true">📚</span><span>Beiträge</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="duas" aria-label="Duʿāʾ"><span class="nav-icon" aria-hidden="true">🤲</span><span>Duʿāʾ</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true">📖</span><span>Qurʾān</span></button>`,
  `  <button class="bottom-nav-btn" type="button" data-bottom-nav="topics" aria-label="Beiträge"><span class="nav-icon" aria-hidden="true">📚</span><span>Beiträge</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true">✦</span><span>Feed</span></button>
  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true">📖</span><span>Qurʾān</span></button>`,
  'bottom-nav'
);

// POST_PARSE_VERSION + parseFeedFromYaml + parseFrontMatter feed field
live = replaceOnce(live, 'const POST_PARSE_VERSION=7;', 'const POST_PARSE_VERSION=8;', 'parse-version');
if (!live.includes('function parseFeedFromYaml')) {
  live = replaceOnce(
    live,
    'function parseFrontMatter(md,filename){',
    extractBetween(test, 'function parseFeedFromYaml(yaml){', 'function parseFrontMatter(md,filename){') + 'function parseFrontMatter(md,filename){',
    'parseFeedFromYaml'
  );
}
live = replaceOnce(
  live,
  'slides:ensurePostSlidesArray(slides),statement,_rawBody:body,_sourceFile:filename||""}}',
  'slides:ensurePostSlidesArray(slides),statement,feed:parseFeedFromYaml(yaml),_rawBody:body,_sourceFile:filename||""}}',
  'parseFrontMatter-feed'
);

// applyPostsList
live = replaceOnce(
  live,
  'if(typeof window.DAR_FOCUS_FEED?.onAppReady==="function"&&document.getElementById("focusFeedMount"))window.DAR_FOCUS_FEED.onAppReady()}',
  'if(typeof window.DAR_FOCUS_FEED?.onAppReady==="function"&&document.getElementById("focusFeedMount"))window.DAR_FOCUS_FEED.onAppReady();if(document.getElementById("premiumFeedMount"))initPremiumFeedTab(true)}',
  'applyPostsList'
);

// navigate
live = replaceOnce(
  live,
  'function navigate(view,value="",opts={}){const from=currentRoute&&currentRoute.view?{...currentRoute}:readRoute();const to={view,value};const skipPush=!!opts.skipPush;if(view==="post"&&value&&from.view!=="post")rememberPostBrowseFromRoute(from);',
  'function navigate(view,value="",opts={}){const from=currentRoute&&currentRoute.view?{...currentRoute}:readRoute();const to={view,value};const skipPush=!!opts.skipPush;if(!routeEqual(from,to))saveNavScroll(from);if(from.view==="feed"&&from.value!=="topics"&&!routeEqual(from,to)&&window.DAR_PREMIUM_FEED?.saveState)window.DAR_PREMIUM_FEED.saveState();if(view==="post"&&value&&from.view!=="post")rememberPostBrowseFromRoute(from);',
  'navigate'
);

// bottom nav helpers from test
const testBottomNav = extractBetween(test, 'function bottomNavTabForRoute(routeOrView){', 'function initBottomNavContentSwipe(){');
live = replaceOnce(
  live,
  extractBetween(live, 'function bottomNavTabForRoute(view){', 'function initBottomNavContentSwipe(){'),
  testBottomNav,
  'bottomNavTabForRoute block'
);

// updateChrome from test (feed fullscreen)
const testUpdateChrome = extractBetween(test, 'function updateChrome(route){const backBtn=$("backBtn");const homeBtn=$("homeBtn");const crumb=$("crumb");const appBar=document.querySelector(".app-bar");const isFeedFull=route.view==="feed"&&route.value!=="topics";', 'function resolveRenderScroll(scrollBefore,sameRoute,fromGesture,ayahJump){');
live = replaceOnce(
  live,
  extractBetween(live, 'function updateChrome(route){const backBtn=$("backBtn");', 'function render(){'),
  testUpdateChrome + 'function render(){',
  'updateChrome'
);

// Feed render functions before renderHome in test - insert before function renderHome in live
const feedFns = extractBetween(test, 'function renderFeedModeNav(){', 'function renderHome(){');
if (!live.includes('function renderFeedModeNav(){')) {
  live = replaceOnce(live, 'function renderHome(){', feedFns + 'function renderHome(){', 'feed-fns');
}

// render() - feed route + initPremiumFeedTab
live = replaceOnce(
  live,
  'else if(currentRoute.view==="topics")html=renderTopics();',
  'else if(currentRoute.view==="feed"||currentRoute.view==="topics")html=renderFeed();',
  'render-feed-route'
);

live = replaceOnce(
  live,
  'if(currentRoute.view==="home"&&window.DAR_FOCUS_FEED){(window.DAR_FOCUS_FEED.onAppReady||window.DAR_FOCUS_FEED.refresh).call(window.DAR_FOCUS_FEED,{force:true})}\n    if(currentRoute.view==="zakat"&&window.DARZakatApp){',
  'if(currentRoute.view==="home"&&window.DAR_FOCUS_FEED){(window.DAR_FOCUS_FEED.onAppReady||window.DAR_FOCUS_FEED.refresh).call(window.DAR_FOCUS_FEED,{force:true})}\n    if(currentRoute.view==="feed"&&currentRoute.value!=="topics")initPremiumFeedTab(true);\n    else if(window.DAR_PREMIUM_FEED&&typeof window.DAR_PREMIUM_FEED.destroy==="function")window.DAR_PREMIUM_FEED.destroy();\n    if(currentRoute.view==="zakat"&&window.DARZakatApp){',
  'render-init-feed'
);

// bindEvents feed mode
if (!live.includes('[data-feed-mode]')) {
  live = replaceOnce(
    live,
    'function bindEvents(){',
    'function bindEvents(){\n  document.querySelectorAll("[data-feed-mode]").forEach(btn=>{btn.onclick=()=>{const mode=btn.getAttribute("data-feed-mode")||"";navigate("feed",mode,{skipPush:false})}});',
    'bind-feed-mode'
  );
}

// load listener for feed
if (!live.includes('initPremiumFeedTab(true));')) {
  live = replaceOnce(
    live,
    'window.addEventListener("load",()=>{',
    'window.addEventListener("load",()=>{if(readRoute().view==="feed"&&readRoute().value!=="topics")initPremiumFeedTab(true);',
    'load-feed'
  );
}

// sync posts onAppReady premium feed
if (!live.includes('DAR_PREMIUM_FEED?.onAppReady')) {
  live = replaceOnce(
    live,
    'if(typeof window.DAR_FOCUS_FEED?.onAppReady==="function")window.DAR_FOCUS_FEED.onAppReady();',
    'if(typeof window.DAR_FOCUS_FEED?.onAppReady==="function")window.DAR_FOCUS_FEED.onAppReady();\n      if(typeof window.DAR_PREMIUM_FEED?.onAppReady==="function")window.DAR_PREMIUM_FEED.onAppReady();',
    'sync-premium-feed'
  );
}

// service worker bump
live = replaceOnce(
  live,
  'const CACHE_VERSION = \'dar-al-tawhid-offline-light-v189\';',
  'const CACHE_VERSION = \'dar-al-tawhid-offline-light-v192\';',
  'sw-live'
);

fs.writeFileSync(livePath, live);
console.log('Live feed patch applied to index.html');
