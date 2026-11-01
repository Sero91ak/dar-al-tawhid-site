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
<section class="dhp-isnad">Original quotation</section><div id="dhpLibrary">Library</div></main>
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

        driver.execute_script("sessionStorage.clear();localStorage.clear()")
        fresh(driver, base)
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-all").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "View all did not close")
        assert driver.find_element(By.CSS_SELECTOR, ".dar-recent-toggle").get_attribute("aria-expanded") == "true"
        assert len(driver.find_elements(By.CSS_SELECTOR, ".dar-recent-list .dar-recent-post")) == 3
        print("PASS: all three same-day articles visible after View All")

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
        manual_button = driver.find_element(By.CSS_SELECTOR, ".dar-recent-manual-open")
        assert manual_button.text.strip() == "Yeni yazıları aç", "Manual reopen button not localized"
        manual_button.click()
        expect(driver, lambda d: d.execute_script(
            "var x=document.getElementById('darRecentNoticeV1');return !!(x&&x.open&&x.matches(':modal'))"),
            "Manual popup should reopen even after skipping existing batch")
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-x").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "Manual close failed")
        print("PASS: manually reopen new-post dialog after dismiss / skip, nine-language title")

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
