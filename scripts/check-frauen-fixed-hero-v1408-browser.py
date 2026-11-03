#!/usr/bin/env python3
"""Browser regression: women's real historical Hero stays below fixed brand;
chapter heading never precedes or jumps over it, and rows scroll beneath it.
Run under Chrome/Selenium as part of the Frauen contract CI.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT=Path(__file__).resolve().parent.parent
FIX=ROOT/"__dar_frauen_fixed_v1408__.html"
SIZES=[("iPhone",390,844),("Duo",594,800),("Fold",768,1024)]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass

HTML='''<!doctype html><html lang="de" data-theme="salbei" class="dar-adult-global-brand-ready">
<head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
html,body{margin:0;background:#eef2e9;color:#15241e;overflow-x:hidden}
body{padding:0!important}
#darAdultBrandHeaderV2{position:fixed!important;top:0;left:0;width:100%;height:120px!important;
  box-sizing:border-box;background:#eef2e9;z-index:730!important}
#darAdultBrandHeaderSpacerV2{display:block;width:100%;height:120px!important}
#appView.view{padding:0!important;margin:0!important;overflow:visible!important}
.frauen-library-shell{width:100%;max-width:900px;margin:0 auto;box-sizing:border-box;padding:0 14px 130px}
.frauen-library-hero{background:#22372a;min-height:280px!important;box-sizing:border-box}
.frauen-library-search-wrap{height:76px!important;background:#eee;border-radius:18px}
.frauen-library-section-head{padding:22px 0 14px;background:#eef2e9}
.frauen-library-area-grid{display:flex;flex-direction:column;gap:14px}
.frauen-library-area-card{min-height:210px!important;box-sizing:border-box;border-radius:20px;background:#d6dfd4;border:1px solid #b4b9af;padding:20px}
.filler{height:300px}
</style>
<link rel="stylesheet" href="/assets/adult-immersive-hero-v1.css">
<link rel="stylesheet" href="/assets/frauen/frauen-authority-v1292.css">
<link rel="stylesheet" href="/assets/frauen/frauen-original-v1224-header-seam-v1405.css">
<link rel="stylesheet" href="/assets/frauen/frauen-fixed-hero-v1408.css">
</head>
<body class="is-frauen-route has-bottom-nav" data-frauen-view="group">
<header id="darAdultBrandHeaderV2"><strong> DĀR AL TAWḤĪD </strong></header>
<div class="app"><div id="darAdultBrandHeaderSpacerV2"></div><main id="appView" class="view">
<section class="frauen-library-shell frauen-library-group">
<div class="dar-immersive-hero-stage" data-has-search="1">
 <section class="frauen-library-hero"><div class="frauen-library-hero__content"><h2>Fiqh der Frauen</h2></div></section>
 <div class="frauen-library-search-wrap"><input id="search" placeholder="Suchen"></div>
</div>
<div class="frauen-library-section-head" id="chapterHead"><small>KAPITEL</small><h3>Wähle deinen Bereich</h3></div>
<section class="frauen-library-area-grid" id="chapters">
<article class="frauen-library-area-card has-visual">Erstes Kapitel</article>
<article class="frauen-library-area-card has-visual">Zweites Kapitel</article>
<article class="frauen-library-area-card has-visual">Drittes Kapitel</article>
<article class="frauen-library-area-card has-visual">Viertes Kapitel</article>
<article class="frauen-library-area-card has-visual">Fünftes Kapitel</article>
</section><div class="filler"></div>
</section></main></div>
<script defer src="/assets/frauen/frauen-fixed-hero-runtime-v1408.js"></script>
</body></html>'''
def metrics(driver):
 return driver.execute_script("""
 const rect=sel=>document.querySelector(sel).getBoundingClientRect();
 const h=rect('#darAdultBrandHeaderV2'), hero=rect('.dar-immersive-hero-stage');
 const head=rect('#chapterHead'), spacer=rect('.dar-frauen-hero-space-v1408');
 const card=rect('.frauen-library-area-card');
 const style=getComputedStyle(document.querySelector('.dar-immersive-hero-stage'));
 return {headerBottom:h.bottom,heroTop:hero.top,heroBottom:hero.bottom,
  headTop:head.top,cardTop:card.top,spacerHeight:spacer.height,
  position:style.position,scrollY:window.scrollY,
  column:getComputedStyle(document.querySelector('#chapters')).flexDirection,
  cardWidth:card.width,gridWidth:rect('#chapters').width};
 """)
def test():
 FIX.write_text(HTML,encoding="utf8")
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 options=Options()
 for opt in ["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage"]:
  options.add_argument(opt)
 driver=None
 try:
  driver=webdriver.Chrome(options=options)
  url=f"http://127.0.0.1:{server.server_address[1]}/{FIX.name}"
  for label,w,h in SIZES:
   driver.set_window_size(w,h)
   driver.get(url)
   WebDriverWait(driver,8).until(lambda d: d.execute_script(
     "return !!document.querySelector('.dar-frauen-hero-space-v1408') && parseFloat(getComputedStyle(document.body).getPropertyValue('--frauen-v1408-rail-height'))>50;"))
   a=metrics(driver)
   if abs(a["heroTop"]-a["headerBottom"])>2: raise AssertionError(f"{label}: initial hero/header gap: {a}")
   if a["headTop"]<a["heroBottom"]-2: raise AssertionError(f"{label}: chapter heading ABOVE fixed hero: {a}")
   if a["position"]!="fixed" or a["spacerHeight"]<150: raise AssertionError(f"{label}: fixed hero or placeholder missing: {a}")
   if a["column"]!="column" or a["cardWidth"]<a["gridWidth"]-2: raise AssertionError(f"{label}: chapters not full width: {a}")
   for y in [180,450]:
    driver.execute_script("window.scrollTo(0,arguments[0])",y)
    b=metrics(driver)
    if abs(b["heroTop"]-b["headerBottom"])>2: raise AssertionError(f"{label} scroll={y} hero moved away: {b}")
    if b["headTop"]>a["headTop"]-min(y,150): raise AssertionError(f"{label} scroll={y} chapter heading did not scroll under hero: {b}")
   driver.execute_script("window.scrollTo(0,0)")
   c=metrics(driver)
   if abs(c["heroTop"]-c["headerBottom"])>2 or c["headTop"]<c["heroBottom"]-2:
    raise AssertionError(f"{label}: return to top detached: {c}")
   print(f"PASS {label}: fixed hero glued to header, chapter heading below, cards scroll beneath, full-width.")
 finally:
  if driver:driver.quit()
  server.shutdown()
  FIX.unlink(missing_ok=True)
if __name__=="__main__":
 test()
