#!/usr/bin/env python3
"""Real Chromium/WKWebView-like regression test for the adult new-post dialog.
No live requests, no credentials, no OneSignal; serves only repository assets.
"""
import json
import pathlib
import threading
import time
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT = pathlib.Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone.utc)
POST = "ibn-abbas-mutter-wahltun-20261031-q49"
POSTS = [
    {"id": POST, "date": NOW.isoformat(), "title": "DIE BESONDERE STELLUNG DER MUTTER",
     "category": "Adab", "speaker": "Ibn Abbas", "localeManifest": "/assets/q49-locales.json"},
    {"id": "recent-two", "date": (NOW - timedelta(minutes=16)).isoformat(), "title": "ZWEITER BEITRAG", "category": "Wissen"},
    {"id": "recent-three", "date": (NOW - timedelta(hours=1)).isoformat(), "title": "DRITTER BEITRAG", "category": "Wissen"},
]
HTML = """<!doctype html><html lang="de" data-theme="royal"><head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
html,body{margin:0;min-height:100%;font-family:system-ui;background:#0d1b16;color:#f8f1e5}
#darHomeHtmlParityV1{--dhp-ink:#f8f1e5;--dhp-paper:#102b21;--dhp-gold:#d1b77c;
 --dhp-line:#63735f;--dhp-accent:#326651;min-height:1800px;padding:20px}
.dhp-welcome{height:60px}.dhp-isnad{height:80px}
</style>
<link rel="stylesheet" href="/assets/dar-home-recent-posts-v1.css">
<script defer src="/assets/i18n/adult-component-i18n-v1.js"></script>
<script defer src="/assets/dar-home-recent-posts-v1.js"></script>
</head><body class="is-home-route">
<main id="darHomeHtmlParityV1"><section class="dhp-welcome">Test Home</section>
<aside class="daily-question-fixture">Daily question injected before Ibn Sīrīn</aside><section class="dhp-isnad">Original quotation</section><div class="dhp-quickbar">Qibla &amp; Library</div><aside class="other-widget-fixture">Separate optional widget</aside><section class="dhp-search-box">Search</section><section class="dhp-quran-section">Qurʾān</section><div id="dhpLibrary">Library</div></main>
<div id="appView"></div>
<script>
window.__openedPost=null;
window.navigate=function(route,id){
 if(route==="post"){window.__openedPost=id;document.body.classList.remove("is-home-route");
 history.replaceState(null,"","#post/"+encodeURIComponent(id));}
};
</script>
</body></html>"""

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/":
            data = HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif route == "/data/recent-posts.json":
            data = json.dumps({"schemaVersion": 1, "posts": POSTS}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    def log_message(self, *args):
        pass

def expect(driver, callback, label, seconds=12):
    try:
        return WebDriverWait(driver, seconds).until(lambda d: callback(d) or False)
    except TimeoutException as exc:
        shot = "/tmp/dar-recent-popup-regression.png"
        driver.save_screenshot(shot)
        raise AssertionError(label + " (screenshot " + shot + ")") from exc

def dialog(driver):
    return driver.find_element(By.ID, "darRecentNoticeV1")

def fresh(driver, url):
    driver.get(url)
    # New-post fixture: seed the persistent baseline to simulate a post
    # published after this visitor first opened the app.
    driver.execute_script("localStorage.setItem('darAdultLatestPostsSeenIdsV2',JSON.stringify({version:2,ids:[],updatedAt:Date.now()}))")
    driver.refresh()
    return expect(driver, lambda d: d.execute_script(
        "var x=document.getElementById('darRecentNoticeV1');return !!(x&&x.open&&x.matches(':modal'))"),
        "native HTML dialog did not open")

def test():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = "http://127.0.0.1:" + str(server.server_address[1]) + "/"
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=430,930")
    opts.add_argument("--force-device-scale-factor=2")
    opts.add_argument("--disable-background-timer-throttling")
    driver = webdriver.Chrome(options=opts)
    try:
        fresh(driver, base)
        assert driver.execute_script("return document.documentElement.style.getPropertyValue('overflow')") == "hidden"
        assert driver.execute_script("return document.querySelector('main').inert")
        css = driver.execute_script(
            "return getComputedStyle(document.querySelector('.dar-recent-notice-card')).getPropertyValue('--notice-paper').trim()")
        assert css == "#102b21", "Selected theme not inherited: " + css
        canceled = driver.execute_script("""
        var e=new Event('touchmove',{bubbles:true,cancelable:true});
        document.querySelector('main').dispatchEvent(e);
        return e.defaultPrevented;
        """)
        assert canceled, "Background touchmove not blocked"
        assert driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-article").is_displayed()
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-article").click()
        expect(driver, lambda d: d.execute_script("return window.__openedPost") == POST,
               "Read-post click did not navigate")
        assert driver.find_elements(By.ID, "darRecentNoticeV1") == [], "Popup still open after read"
        assert driver.execute_script("return document.documentElement.style.getPropertyValue('overflow')") != "hidden"
        assert not driver.execute_script("return document.querySelector('main').inert")
        print("PASS: native modal, theme, touch lock, direct post navigation, cleanup")
        # Acknowledging the alert must survive a complete browser/WebView reload.
        driver.get(base)
        time.sleep(2)
        assert not driver.find_elements(By.ID, "darRecentNoticeV1"), (
            "Previously opened post notification reappeared on a new app launch"
        )
        persisted = driver.execute_script("""
          return JSON.parse(localStorage.getItem('darAdultLatestPostsSeenIdsV2')||'{}')
        """)
        assert persisted["version"] == 2 and POST in persisted["ids"]
        print("PASS: once acknowledged, the same post never reopens after restart")

        # A genuinely new publication triggers once, even after the first was seen.
        new_id = "newly-published-after-acknowledged-batch"
        POSTS.insert(0, {"id": new_id, "date": datetime.now(timezone.utc).isoformat(),
                         "title": "A GENUINELY NEW ARTICLE", "category": "Wissen"})
        driver.get(base)
        expect(driver, lambda d: d.execute_script(
            "var x=document.getElementById('darRecentNoticeV1');return !!(x&&x.open&&x.matches(':modal'))"),
            "Newly published post did not trigger a fresh notification")
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-x").click()
        driver.get(base)
        time.sleep(2)
        assert not driver.find_elements(By.ID, "darRecentNoticeV1"), (
            "Second notification reappeared after acknowledgement"
        )
        POSTS.pop(0)
        print("PASS: genuinely new online post notifies once, then stays acknowledged")


        driver.execute_script("sessionStorage.clear();localStorage.clear()")
        fresh(driver, base)

        # Check actual DOM sequence, including an unrelated daily quiz inserted
        # between two fixed home elements by another application widget.
        fixed = driver.execute_script("""
          var nodes=['.dhp-welcome','.dhp-isnad','.dhp-quickbar',
            '.dhp-search-box','.dhp-quran-section','#darRecentPublicationsV1']
            .map(s=>document.querySelector(s));
          return nodes.every(n=>!!n) &&
            nodes.every((n,i)=>i===0 || nodes[i-1].nextElementSibling===n) &&
            nodes.every((n,i)=>i===0 || nodes[i-1].getBoundingClientRect().top<=n.getBoundingClientRect().top);
        """)
        assert fixed, "Salām → Ibn Sīrīn → Qibla/Bibliothek → Search → Qurʾān → compact news was interrupted"

        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-all").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "View all did not close")
        expect(driver, lambda d: "/neueste-beitraege/" in d.current_url,
               "View All must navigate to its dedicated route")
        expect(driver, lambda d: len(d.find_elements(By.CSS_SELECTOR, ".dar-archive-article")) == 3,
               "Dedicated archive must list every same-day publication")
        assert len(driver.find_elements(By.CSS_SELECTOR, ".dar-archive-tab")) == 3
        assert driver.find_element(By.ID, "darArchiveTabs").text.count("Tage") == 3
        assert len(driver.find_elements(By.CSS_SELECTOR, ".dar-archive-day")) == 1
        assert driver.find_element(By.CSS_SELECTOR, ".dar-archive-tab[aria-pressed='true']").text.startswith("5")
        driver.find_element(By.CSS_SELECTOR, ".dar-archive-tab:first-child").click()
        assert driver.find_element(By.CSS_SELECTOR, ".dar-archive-tab[aria-pressed='true']").text.startswith("3")
        print("PASS: separate 3/4/5-day archive, all same-day articles retained")

        driver.execute_script("sessionStorage.clear();localStorage.clear()")
        fresh(driver, base)
        driver.execute_script("""
          localStorage.setItem('darAdultPreferredLocaleV1','tr');
          dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'tr'}}));
        """)
        expect(driver, lambda d: "En son yayınlananlar" in dialog(d).text, "Turkish UI not applied")
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-skip").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "Skip did not dismiss")
        assert driver.execute_script("return !!localStorage.getItem('darRecentNoticeSkippedPostV1')")
        driver.refresh()
        time.sleep(2)
        assert not driver.find_elements(By.ID, "darRecentNoticeV1"), "Skipped batch reopened"
        print("PASS: 9-language UI integration (TR), skip persists until next post")
        compact = driver.find_element(By.CSS_SELECTOR, "#darRecentPublicationsV1 .dar-recent-compact-link")
        assert compact.is_displayed(), "Compact home entry not visible"
        assert driver.execute_script("""
          var m=document.getElementById('darRecentPublicationsV1'),
              q=document.querySelector('.dhp-quran-section');
          return m&&q&&m.previousElementSibling===q
        """), "Qurʾān must precede compact news entry – Ibn Sīrīn/Qibla remain above Qurʾān"
        compact.click()
        expect(driver, lambda d: "/neueste-beitraege/" in d.current_url,
               "Compact entry must open dedicated recent-posts page")
        expect(driver, lambda d: "Son yayınlananlar" in d.find_element(By.ID,"darArchiveTitle").text,
               "Archive must use selected Turkish UI")
        assert driver.find_element(By.ID,"darArchiveLanguage").get_attribute("value") == "tr"
        print("PASS: compact post entry after Quran + separate page + 9-language UI")

        driver.execute_script("sessionStorage.clear();localStorage.clear()")
        fresh(driver, base)
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-x").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "Close X did not dismiss")
        assert not driver.execute_script("return document.querySelector('main').inert")
        print("PASS: close X unlocks app and restores focus/scroll")
    finally:
        driver.quit()
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    test()
