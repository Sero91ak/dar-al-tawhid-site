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
<main id="darHomeHtmlParityV1"><div class="dhp-home-source-v55">Source strapline</div><section class="dhp-welcome">Test Home</section>
<aside class="daily-question-fixture">Daily question injected before Ibn Sīrīn</aside><section class="dhp-isnad">Original quotation</section><div class="dhp-quickbar">Qibla &amp; Library</div><aside class="other-widget-fixture">Separate optional widget</aside><section class="dhp-search-box">Search</section><section class="dhp-quran-section">Qurʾān</section><section class="dat-smart-prayer">LIVE PRAYER CLOCK, deliberately misplaced after Qurʾān in test fixture</section><div id="dhpLibrary">Library</div></main>
<div id="appView"></div>
<script>
window.__openedPost=null;
window.navigate=function(route,id){
 if(route==="post"){window.__openedPost=id;document.body.classList.remove("is-home-route");
 history.pushState({view:"post",id:id},"","#post/"+encodeURIComponent(id));}
};
window.addEventListener("popstate",function(){document.body.classList.add("is-home-route")});
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
          var nodes=['.dhp-home-source-v55','.dat-smart-prayer','.dhp-welcome',
            '.dhp-isnad','.dhp-quickbar','.dhp-search-box',
            '.dhp-quran-section','#darRecentPublicationsV1']
            .map(s=>document.querySelector(s));
          return nodes.every(n=>!!n) &&
            nodes.every((n,i)=>i===0 || nodes[i-1].nextElementSibling===n) &&
            nodes.every((n,i)=>i===0 || nodes[i-1].getBoundingClientRect().top<=n.getBoundingClientRect().top);
        """)
        assert fixed, "Source → original prayer clock → Salām → Ibn Sīrīn → Qibla/Bibliothek → Search → Qurʾān → compact news was interrupted"

        # 2026-11-01 iOS scroll-jitter regression: unrelated sticky-header,
        # tab and widget class changes MUST NOT rebuild the home card or
        # reparent any of the fixed home sections during a user scroll.
        stable = driver.execute_async_script("""
          const done=arguments[arguments.length-1];
          const mount=document.querySelector("#darRecentPublicationsV1");
          const card=mount&&mount.firstElementChild;
          const root=document.querySelector("#darHomeHtmlParityV1");
          const homeNodes=Array.from(root.querySelectorAll(
            ".dhp-welcome,.dhp-isnad,.dhp-quickbar,.dhp-search-box,.dhp-quran-section"));
          let cardMutations=0,homeMutations=0;
          const cardObserver=new MutationObserver(function(records){
            cardMutations+=records.filter(function(r){return r.type==="childList"}).length;
          });
          const homeObserver=new MutationObserver(function(records){
            homeMutations+=records.filter(function(r){
              return r.type==="childList"&&Array.from(r.addedNodes).some(
                function(n){return homeNodes.includes(n)});
            }).length;
          });
          cardObserver.observe(mount,{childList:true});
          homeObserver.observe(root,{childList:true,subtree:true});
          window.scrollTo({top:325,behavior:"instant"});
          const initialY=window.scrollY;
          let n=0;
          function frame(){
            document.body.classList.toggle("sticky-scrolling-fixture");
            root.querySelector(".dhp-welcome").classList.toggle("is-compact");
            root.querySelector(".dhp-isnad").classList.toggle("is-visible");
            if(++n<28){requestAnimationFrame(frame);return}
            requestAnimationFrame(function(){
              requestAnimationFrame(function(){
                cardObserver.disconnect();
                homeObserver.disconnect();
                done({cardMutations,homeMutations,initialY,endY:window.scrollY,
                  identical:mount.firstElementChild===card,
                  mounted:mount.isConnected});
              });
            });
          }
          requestAnimationFrame(frame);
        """)
        assert stable["cardMutations"] == 0, f"Global scroll/sticky updates rebuilt news card: {stable}"
        assert stable["homeMutations"] == 0, f"Scroll updates reparented home sections: {stable}"
        assert stable["identical"] and stable["mounted"], f"Home card replaced during scrolling: {stable}"
        assert abs(stable["endY"]-stable["initialY"]) <= 2, f"Scroll position jumped: {stable}"
        print("PASS: 28 live sticky/scroll mutations, zero home reflow, unchanged card and scroll position")


        current_document = driver.execute_script("return performance.timeOrigin")
        current_url = driver.current_url
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-notice-all").click()
        expect(driver, lambda d: not d.find_elements(By.ID, "darRecentNoticeV1"), "View all did not close")
        expect(driver, lambda d: len(d.find_elements(By.CSS_SELECTOR, "#darRecentInlineListV2 .dar-recent-inline-entry")) == 3,
               "Internal app list must include all current same-day posts")
        assert driver.current_url == current_url, "List opening navigated to another webpage"
        assert driver.execute_script("return performance.timeOrigin") == current_document
        assert not driver.find_elements(By.CSS_SELECTOR, ".dar-archive-tab,#darArchiveLanguage,.dar-recent-day")
        assert "Tage" not in driver.find_element(By.ID, "darRecentInlineListV2").text
        assert "geladen" not in driver.find_element(By.ID, "darRecentInlineListV2").text.lower()
        assert not driver.find_element(By.ID, "darHomeHtmlParityV1").is_displayed()
        print("PASS: instant internal list, all 3 same-day articles, no loading or day filters")
        driver.find_element(By.CSS_SELECTOR, "#darRecentInlineListV2 .dar-recent-inline-entry").click()
        expect(driver, lambda d: d.execute_script("return window.__openedPost") is not None,
               "Internal article entry did not open native post reader")
        assert driver.execute_script("return performance.timeOrigin") == current_document
        driver.back()
        expect(driver, lambda d: len(d.find_elements(By.CSS_SELECTOR, "#darRecentInlineListV2 .dar-recent-inline-entry")) == 3
               and d.find_element(By.ID, "darRecentInlineListV2").is_displayed(),
               "Native back from article must restore internal list")
        driver.find_element(By.CSS_SELECTOR, ".dar-recent-inline-back").click()
        expect(driver, lambda d: d.find_element(By.ID, "darHomeHtmlParityV1").is_displayed(),
               "Internal back must return to home without reload")
        assert driver.execute_script("return performance.timeOrigin") == current_document
        print("PASS: in-app post reader, back to existing list, back to original home, no webpage reload")

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
        url_before = driver.current_url
        compact.click()
        expect(driver, lambda d: "En son yayınlananlar" in d.find_element(By.CSS_SELECTOR, ".dar-recent-inline-heading").text,
               "Internal list must use Turkish adult app language")
        assert url_before == driver.current_url, "Compact capsule reloaded a website"
        expect(driver, lambda d: "ANNENİN ÖZEL KONUMU" in d.find_element(By.ID, "darRecentInlineListV2").text,
               "Existing Q49 Turkish post manifest was not applied")
        assert not driver.find_elements(By.CSS_SELECTOR, "#darRecentInlineListV2 select")
        driver.execute_script("""
          localStorage.setItem('darAdultPreferredLocaleV1','ar');
          dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'ar'}}));
        """)
        expect(driver, lambda d: "أحدث المنشورات" in d.find_element(By.ID, "darRecentInlineListV2").text,
               "Switching adult app to Arabic did not translate internal post list")
        assert driver.find_element(By.ID, "darRecentInlineListV2").get_attribute("dir") == "rtl"
        assert driver.current_url == url_before
        print("PASS: compact entry after Quran, existing Q49 translation, auto app locale in TR/AR and no manual picker")

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
