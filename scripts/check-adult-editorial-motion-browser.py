#!/usr/bin/env python3
"""Synthetic browser smoke for the bounded adult editorial component.
No productive app mutation. All original hero/nav/reader owners stay separate.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT=Path(__file__).resolve().parent.parent
FILE=ROOT/"__dar_editorial_smoke__.html"
SIZES=[("small",320,680),("phone",390,844),("outer",430,900),
       ("fold-narrow",600,840),("fold-open",768,1024),("tablet",1024,768),
       ("desktop",1440,900)]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def page(theme="salbei",direction="ltr"):
 return """<!doctype html><html data-theme="%s" dir="%s" lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="stylesheet" href="/assets/dar-adult-editorial-system-v1.css">
<style>
html,body{margin:0;background:#f1e9dc;color:#15251c}
body{overflow-x:clip}
#fixtureHeader{position:fixed;inset-block-start:0;inset-inline:0;z-index:30;height:68px;
 background:#234138;color:white;display:flex;align-items:center;padding-inline:18px}
#fixtureHeader button,#bottomNav button{min-width:44px;min-height:44px}
.app{padding-top:68px;min-height:1600px}
#appView{padding:0 14px}
.post-reader-main{width:min(100%%,820px);margin-inline:auto}
.statement{font:17px/1.6 Georgia,serif;overflow-wrap:anywhere}
.post-reader-speaker,.post-reader-sep{margin-block:20px;border-block-end:1px solid #b9aa95}
#bottomNav{position:fixed;inset-block-end:0;inset-inline:0;z-index:30;
 height:62px;background:#234138;display:flex;justify-content:center}
#bottomNav button{margin:4px}
.post-slide-footer{display:flex;gap:8px}
</style>
</head><body class="has-bottom-nav is-post-route">
<header id="fixtureHeader"><button type="button" id="headerAction">Menü</button>
<span>DĀR AL TAWḤĪD</span></header>
<div class="app"><main id="appView"><article class="post-reader">
<section class="post-reader-main">
<div class="post-reader-speaker">ʿAbdullāh ibn al-Mubārak</div>
<div class="statement"><h2>Wissen und Quellen – المعرفة والعلم</h2>
<p>Dies ist ein längerer prüfbarer Lesetext über Quellen, Überlieferungen und die sorgfältige Darstellung von Wissen.</p></div>
<div class="post-reader-sep">—</div>
<div style="height:1050px">Textfluss</div>
<div class="post-slide-footer"><button id="sourceBtn">Quelle ansehen</button></div>
</section></article></main></div>
<nav id="bottomNav"><button id="navBtn">Home</button></nav>
<script defer src="/assets/dar-adult-editorial-system-v1.js"></script>
</body></html>"""%(theme,direction)
def run():
 FILE.write_text(page(),encoding="utf8")
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 opts=Options()
 for arg in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
  opts.add_argument(arg)
 driver=None
 try:
  driver=webdriver.Chrome(options=opts)
  url=f"http://127.0.0.1:{server.server_address[1]}/__dar_editorial_smoke__.html"
  for theme,direction in [("salbei","ltr"),("dar-al-layl","ltr"),("salbei","rtl")]:
   for label,w,h in SIZES:
    driver.set_window_size(w,h)
    driver.get(url)
    driver.execute_script("document.documentElement.setAttribute('data-theme',arguments[0]);document.documentElement.setAttribute('dir',arguments[1]);",theme,direction)
    metrics=driver.execute_script("""
     const h=document.getElementById('fixtureHeader').getBoundingClientRect();
     const nav=document.getElementById('bottomNav').getBoundingClientRect();
     const root=document.documentElement,read=document.querySelector('.post-reader-main');
     const btn=document.getElementById('headerAction').getBoundingClientRect();
     const hit=document.elementFromPoint(btn.left+btn.width/2,btn.top+btn.height/2);
     return {active:root.classList.contains('dar-adult-editorial-v1'),
       marked:read.getAttribute('data-dar-ed-reader'),
       headerTop:h.top,headerBottom:h.bottom,navBottom:nav.bottom,
       viewHeight:innerHeight,readWidth:read.getBoundingClientRect().width,
       viewport:root.clientWidth,overflow:root.scrollWidth-root.clientWidth,
       clickable:hit?.id==='headerAction'};
    """)
    assert metrics["active"] and metrics["marked"]=="1",(label,theme,direction,metrics)
    assert metrics["headerTop"]==0 and metrics["headerBottom"]==68,(label,metrics)
    assert abs(metrics["navBottom"]-metrics["viewHeight"])<2,(label,metrics)
    assert metrics["overflow"]<=2,(label,metrics)
    assert metrics["clickable"],(label,metrics)
    driver.execute_script("window.scrollTo(0,500)")
    assert driver.execute_script("return document.getElementById('fixtureHeader').getBoundingClientRect().top")==0
   print("PASS browser widths 320–1440:",theme,direction,flush=True)
  driver.execute_cdp_cmd("Emulation.setEmulatedMedia",{"features":[{"name":"prefers-reduced-motion","value":"reduce"}]})
  driver.get(url)
  reduced=driver.execute_script("""
   const target=document.querySelector('.post-reader-speaker');
   return {activated:document.documentElement.classList.contains('dar-adult-editorial-v1'),
     animated:getComputedStyle(target).animationName,
     attr:target.getAttribute('data-dar-ed-reveal')};
  """)
  assert reduced["activated"] and reduced["animated"]=="none",reduced
  print("PASS reduced motion: no reveal animation",flush=True)
 finally:
  if driver:driver.quit()
  server.shutdown()
  FILE.unlink(missing_ok=True)
if __name__=="__main__":run()
