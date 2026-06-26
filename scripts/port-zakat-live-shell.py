#!/usr/bin/env python3
"""Port Zakāt essentials from test/index.html into live index.html."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
test = (ROOT / "test/index.html").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")

def extract(start_marker, end_marker, src=test):
    s = src.index(start_marker)
    e = src.index(end_marker, s)
    return src[s:e]

# 1) Teaser / focus card CSS (after quran-home-teaser-btn block)
teaser_css = extract(".zakat-home-teaser{border-radius:22px", ".suhur-iftar-row{display:grid")
if ".zakat-home-teaser{border-radius:22px" not in index:
    anchor = ".quran-home-teaser-btn{min-height:39px;padding:8px 15px;font-size:11px;font-weight:950;cursor:pointer;margin-top:8px}\n"
    index = index.replace(anchor, anchor + teaser_css, 1)

# 2) Main zakat view CSS
zakat_css = extract("/* ZAKĀT-RECHNER", ".prayer-quick-label,.prayer-small-label")
if "/* ZAKĀT-RECHNER" not in index:
    anchor = ".prayer-quick-label,.prayer-small-label{color:var(--muted2)"
    index = index.replace(anchor, zakat_css + anchor, 1)

# 3) Script tags
scripts_block = """<script src="/assets/zakat-engine.js?v=8" defer></script>
<script src="/assets/zakat-app.js?v=15" defer></script>
<script src="/assets/focus-feed-app.js?v=2" defer></script>
"""
if "zakat-app.js" not in index:
    index = index.replace(
        '<script src="assets/site-analytics.js?v=4" defer></script>\n',
        '<script src="assets/site-analytics.js?v=4" defer></script>\n' + scripts_block,
        1,
    )

# 4) JS helpers + renderZakatMoreFocus
js_block = extract('const ZAKAT_FOCUS_START="', "function renderPrayerQuickCard(){")
if 'const ZAKAT_FOCUS_START="' not in index:
    index = index.replace(
        "function renderPrayerQuickCard(){",
        js_block + "function renderPrayerQuickCard(){",
        1,
    )
    index = index.replace("function renderZakatHomeTeaser()", "function renderZakatMoreFocus()", 1)

# 5) parentRoute zakat
if 'if(route.view==="zakat")return{view:"more"}' not in index:
    index = index.replace(
        'if(route.view==="calendar")return{view:"more"};',
        'if(route.view==="calendar")return{view:"more"};if(route.view==="zakat")return{view:"more"};',
        1,
    )

# 6) bottomNavTabForRoute zakat
if '"zakat"' not in index.split("bottomNavTabForRoute")[1][:800]:
    index = index.replace(
        '"image-editor-test"].includes(view))return"more"',
        '"image-editor-test","zakat"].includes(view))return"more"',
        1,
    )

# 7) currentUpdateIcon / meta / renderCurrentFocus — copy from test
focus_block = extract("function currentUpdateIcon(item){const key=String", "function renderQuranHomeTeaser(){")
old_focus = index[index.index("function currentUpdateIcon"):index.index("function renderQuranHomeTeaser(){")]
if "current-focus-row--zakat" not in old_focus:
    index = index.replace(old_focus, focus_block, 1)

# 8) renderMore — inject focus card + zakat list entry
more_old = """function renderMore(){const scholarCount=buildScholarCatalog().length;const bookCount=[...countBy("book").keys()].filter(x=>x&&x!=="Unbekannt").length;const ramadan=seasonalIslamicContext()?listCard("Ramaḍān & ʿĪd","Saisonale Beiträge & Zeiten","ramadan","","🌙"):"";const account=accountSession()?`${accountSession().username} · Sync aktiv`:"Anmeldename + PIN";return `${setHeader("Mehr","Gelehrte, Bücher, Kalender und persönliche Bereiche.","Menü")}${renderThemeSwitchPanel()}"""
more_new = """function renderMore(){const scholarCount=buildScholarCatalog().length;const bookCount=[...countBy("book").keys()].filter(x=>x&&x!=="Unbekannt").length;const ramadan=seasonalIslamicContext()?listCard("Ramaḍān & ʿĪd","Saisonale Beiträge & Zeiten","ramadan","","🌙"):"";const account=accountSession()?`${accountSession().username} · Sync aktiv`:"Anmeldename + PIN";const zakatCard=listCard("Zakāt-Rechner",isZakatFocusActive()?"72 Std. im Fokus · jetzt online":"Qurʾān · Sunnah · live & anonym","zakat","","🕌");return `${setHeader("Mehr","Gelehrte, Bücher, Kalender und persönliche Bereiche.","Menü")}${renderZakatMoreFocus()}${renderThemeSwitchPanel()}"""
if "renderZakatMoreFocus()" not in index:
    index = index.replace(more_old, more_new, 1)
    index = index.replace(
        '<section class="grid-list">${listCard("Mein Bereich",account,"account","","🔐")}${ramadan}',
        '<section class="grid-list">${zakatCard}${listCard("Mein Bereich",account,"account","","🔐")}${ramadan}',
        1,
    )

# 9) renderHome — focus feed mount, no zakat teaser on home
home_old = 'function renderHome(){const latest=posts.slice(0,4);return`${renderStagingBanner()}${renderPostsSyncBanner()}${setHeader("Startseite","","App-Übersicht")}${renderOfflineBox()}'
home_new = 'function renderHome(){const latest=posts.slice(0,4);return`${renderStagingBanner()}${renderPostsSyncBanner()}${setHeader("Startseite","","App-Übersicht")}<div id="focusFeedMount" style="display:none"></div>${renderOfflineBox()}'
if 'id="focusFeedMount"' not in index:
    index = index.replace(home_old, home_new, 1)

# 10) applyPostsList focus feed hook
if "DAR_FOCUS_FEED?.onAppReady" not in index:
    index = index.replace(
        "function applyPostsList(list){posts=dedupePostsByContent((Array.isArray(list)?list:[]).map(post=>({...post,statement:cleanBodyText(post.statement)})));normalizeLoadedPosts()}",
        "function applyPostsList(list){posts=dedupePostsByContent((Array.isArray(list)?list:[]).map(post=>({...post,statement:cleanBodyText(post.statement)})));normalizeLoadedPosts();if(typeof window.DAR_FOCUS_FEED?.onAppReady===\"function\"&&document.getElementById(\"focusFeedMount\"))window.DAR_FOCUS_FEED.onAppReady()}",
        1,
    )

# 11) refreshContent focus feed
if "DAR_FOCUS_FEED.onAppReady" not in index.split("refreshContent")[1][:2500]:
    index = index.replace(
        "await loadCurrentUpdates();",
        "await loadCurrentUpdates();\n      if(typeof window.DAR_FOCUS_FEED?.onAppReady===\"function\")window.DAR_FOCUS_FEED.onAppReady();",
        1,
    )

# 12) render() zakat route + focus feed on home
if 'else if(currentRoute.view==="zakat")' not in index:
    index = index.replace(
        'else if(currentRoute.view==="about")html=renderAbout();\n    else if(currentRoute.view==="more")html=renderMore();',
        'else if(currentRoute.view==="about")html=renderAbout();\n    else if(currentRoute.view==="zakat")html=window.DARZakatApp?DARZakatApp.renderZakat():`<section class="empty">Zakāt-Rechner lädt…</section>`;\n    else if(currentRoute.view==="more")html=renderMore();',
        1,
    )

if "currentRoute.view===\"home\"&&window.DAR_FOCUS_FEED" not in index:
    index = index.replace(
        "if(currentRoute.view===\"home\")loadPopularPostsBlock();",
        "if(currentRoute.view===\"home\")loadPopularPostsBlock();\n    if(currentRoute.view===\"home\"&&window.DAR_FOCUS_FEED){(window.DAR_FOCUS_FEED.onAppReady||window.DAR_FOCUS_FEED.refresh).call(window.DAR_FOCUS_FEED,{force:true})}",
        1,
    )

if "currentRoute.view===\"zakat\"&&window.DARZakatApp" not in index:
    index = index.replace(
        "stopStatsRefresh();",
        "if(currentRoute.view===\"zakat\"&&window.DARZakatApp){\n      window.DARZakatApp.bindZakat();\n      if(!window.__zakatConfigReady){window.DARZakatApp.ensureZakatReady().then(()=>{window.__zakatConfigReady=true;if(readRoute().view===\"zakat\")render()})}\n    }\n    stopStatsRefresh();",
        1,
    )

# 13) OneSignal click — zakat push target
if 'data.type||"")==="zakat"' not in index:
    index = index.replace(
        'if(openDailyPushTarget(data,url)){try{event.preventDefault?.()}catch(e){}return}',
        'if(openDailyPushTarget(data,url)){try{event.preventDefault?.()}catch(e){}return}\n      if(String(data.type||"")==="zakat"||String(data.nav||"")==="zakat"){try{event.preventDefault?.()}catch(e){}navigate("zakat");return}',
        1,
    )

(ROOT / "index.html").write_text(index, encoding="utf-8")
print("index.html updated")
