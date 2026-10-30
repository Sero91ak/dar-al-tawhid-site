#!/usr/bin/env python3
"""Real Chromium hit-testing of fixed DĀR brand vs. sticky route controls.
Synthetic DOM uses the ACTUAL production/Test CSS+JS files from the checkout.
No external services, push APIs or production user data are exercised.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    ROOT / "__dar_header_occlusion_visitor_fixture__.html",
    ROOT / "test/__dar_header_occlusion_test_fixture__.html",
]
SIZES = [
    ("phone-small", 320, 640),
    ("phone", 390, 844),
    ("fold-open", 768, 1024),
    ("tablet-landscape", 1024, 768),
    ("phone-landscape", 844, 390),
]
CONTENT = """
<main id="appView" class="view">
 <section class="ilm-chat-shell" aria-label="ʿIlm">
  <header class="ilm-chat-header">
   <div class="ilm-header-title"><b>ʿIlm · DĀR AL TAWḤĪD</b></div>
   <button type="button" id="underButton" onclick="window.__headerTap=(window.__headerTap||0)+1">Fragen anzeigen</button>
  </header>
  <section style="height:1700px;padding:24px">
   <button type="button" id="pageButton" onclick="window.__pageTap=(window.__pageTap||0)+1">Beitrag öffnen</button>
  </section>
 </section>
</main>
"""
BASE = """<!doctype html><html lang="de" data-theme="soft"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
html,body{margin:0;min-height:100%;background:#f4f6f0;color:#273128}
body>.app{width:100%;min-height:2000px}
#appView{min-height:2100px}
.ilm-chat-header{position:sticky;top:0;z-index:48;background:#edf1e9;border-bottom:1px solid #bbc8ba;min-height:70px;display:flex;align-items:center;justify-content:space-between;padding:6px 13px}
#underButton,#pageButton{min-height:44px;padding:9px 12px;cursor:pointer;background:#fff;color:#16271f;border:1px solid #9cae9d;border-radius:8px}
</style>
"""
TEST = BASE + """<link rel="stylesheet" href="/test/assets/dar-test-premium-header-v2.css">
<style>
#darTestBrandHeaderV1{position:fixed;top:0;inset-inline:0;z-index:730;box-sizing:border-box;background:#f4f0e8;padding:7px 12px}
</style></head><body class="is-ilm-chat-route has-bottom-nav">
<header id="darTestBrandHeaderV1"><div class="dtbh-row">
<img class="dtbh-logo" src="/app-logo-original.png" alt="">
<div class="dtbh-copy"><b class="dtbh-name">DĀR AL TAWḤĪD</b><small class="dtbh-tagline">Qurʾān & Sunnah</small></div>
<button type="button" class="dtbh-toggle" aria-label="Farbauswahl">Design</button>
</div></header>
<div class="app" style="padding-top:78px">""" + CONTENT + """</div>
<script src="/test/assets/dar-test-premium-header-v2.js"></script></body></html>"""
VISITOR = BASE + """<link rel="stylesheet" href="/assets/dar-adult-brand-header-v2.css">
</head><body class="is-ilm-chat-route has-bottom-nav"><div class="app">""" + CONTENT + """</div>
<script src="/assets/dar-adult-brand-header-v2.js"></script></body></html>"""

class Silent(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def run():
    FILES[0].write_text(VISITOR, encoding="utf-8")
    FILES[1].write_text(TEST, encoding="utf-8")
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Silent, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    opt = Options()
    for flag in ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]:
        opt.add_argument(flag)
    browser = None
    try:
        browser = webdriver.Chrome(options=opt)
        base = f"http://127.0.0.1:{server.server_address[1]}"
        for lane, route, brand in [
            ("visitor", "/__dar_header_occlusion_visitor_fixture__.html", "darAdultBrandHeaderV2"),
            ("test", "/test/__dar_header_occlusion_test_fixture__.html", "darTestBrandHeaderV1"),
        ]:
            for label, width, height in SIZES:
                browser.set_window_size(width, height)
                browser.get(base + route)
                WebDriverWait(browser, 12).until(lambda d: d.execute_script(
                    "const b=document.getElementById(arguments[0]);return !!b && b.getBoundingClientRect().height>0 &&"
                    " !!document.getElementById('underButton') && !!document.documentElement.style.getPropertyValue(arguments[1]);",
                    brand, "--dar-adult-header-obscured-top" if lane == "visitor" else "--dar-test-occlusion-top"
                ))
                browser.execute_script("window.scrollTo({top:420,behavior:'instant'})")
                geometry = browser.execute_script("""
                    const brand=document.getElementById(arguments[0]);
                    const btn=document.getElementById("underButton");
                    const h=document.querySelector(".ilm-chat-header");
                    const a=brand.getBoundingClientRect(),b=btn.getBoundingClientRect(),r=h.getBoundingClientRect();
                    const x=b.left+b.width/2,y=b.top+b.height/2;
                    return {brandBottom:a.bottom,stickyTop:r.top,buttonTop:b.top,
                        buttonBottom:b.bottom,topRule:getComputedStyle(h).top,
                        hit:document.elementFromPoint(x,y)===btn,
                        viewportHeight:innerHeight,scrollY:scrollY};
                """, brand)
                if geometry["stickyTop"] < geometry["brandBottom"] - 2:
                    raise AssertionError(f"{lane} {label}: sticky subheader under fixed brand {geometry}")
                if geometry["buttonTop"] < geometry["brandBottom"] - 2:
                    raise AssertionError(f"{lane} {label}: button covered by brand {geometry}")
                if not geometry["hit"] or geometry["buttonBottom"] > geometry["viewportHeight"] + 2:
                    raise AssertionError(f"{lane} {label}: button inaccessible {geometry}")
                before = browser.execute_script("return window.__headerTap||0")
                browser.find_element(By.ID, "underButton").click()
                after = browser.execute_script("return window.__headerTap||0")
                if after != before + 1:
                    raise AssertionError(f"{lane} {label}: visual button did not receive touch/click")
                print(f"PASS {lane} {label}: headerBottom={geometry['brandBottom']:.1f} "
                      f"stickyTop={geometry['stickyTop']:.1f} click={after}", flush=True)
    finally:
        if browser is not None:
            browser.quit()
        server.shutdown()
        for p in FILES:
            p.unlink(missing_ok=True)

if __name__ == "__main__":
    run()
