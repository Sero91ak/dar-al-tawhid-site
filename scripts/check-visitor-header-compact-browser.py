#!/usr/bin/env python3
"""Chrome acceptance: compact one-row visitor brand + a single safe-area owner.
Synthetic native WebView inset reproduces the 2026-11-07 uploaded recording:
host exposes status bar area, while --dar-native-safe-top is nonzero.
Check BOTH native and PWA classes, portrait/landscape, sticky sections and taps.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"__dar_visitor_compact_header_check__.html"
SIZES=[("small",320,640),("iphone",390,844),("cover",430,900),
       ("landscape",844,390),("fold",768,1024),("ipad",1024,768)]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def html():
 return '''<!doctype html><html lang="de" class="dar-ios-native-app" data-theme="dar-al-layl"><head>
 <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
 <style>html,body{margin:0;min-height:100%;background:#0b110e;color:#eee3cb}
 html{--dar-native-safe-top:126px;--dar-adult-brand-header-height:126px;--dar-adult-header-obscured-top:126px}
 html.dar-ios-native-app body.dar-ios-native-app.is-area-route{padding-top:126px!important}
 body>.app{min-height:2600px;width:100%}
 #appView{min-height:2300px}
 #appView .fixture-content{height:2000px}
 #appView .hero-btn{min-width:90px;min-height:44px}
 </style>
 <link rel="stylesheet" href="/assets/adult-responsive-viewport-v1381.css">
 <link rel="stylesheet" href="/assets/adult-immersive-hero-v1.css">
 <link rel="stylesheet" href="/assets/dar-adult-brand-header-v2.css">
 <link rel="stylesheet" href="/assets/dar-visitor-profile-picker-v1.css">
 </head><body class="dar-ios-native-app has-bottom-nav is-area-route is-topics-route">
 <div class="app"><main id="appView" class="view"><section class="topics-hub">
 <header class="view-head"><button id="heroAction" class="hero-btn">Thema öffnen</button>
 <h2>Wissen nach Qurʾān und Sunnah</h2></header>
 <div class="fixture-content">Lesetext</div></section></main></div>
 <script src="/assets/dar-adult-brand-header-v2.js"></script>
 </body></html>'''
def run():
 FILE.write_text(html(),encoding="utf-8")
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 opt=Options()
 for flag in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:opt.add_argument(flag)
 browser=None
 try:
  browser=webdriver.Chrome(options=opt)
  base=f"http://127.0.0.1:{server.server_address[1]}/{FILE.name}"
  for theme in ("salbei","dar-al-layl"):
   for native in (True,False):
    for label,width,height in SIZES:
     browser.set_window_size(width,height)
     browser.get(base)
     browser.execute_script("""
       const native=arguments[0];
       document.documentElement.classList.toggle('dar-ios-native-app',native);
       document.body.classList.toggle('dar-ios-native-app',native);
       document.documentElement.setAttribute('data-theme',arguments[1]);
     """,native,theme)
     WebDriverWait(browser,10).until(lambda d:d.execute_script(
       'return !!document.querySelector("#darAdultBrandHeaderV2") && !!document.querySelector("#darAdultBrandHeaderSpacerV2") && getComputedStyle(document.querySelector("#darAdultBrandHeaderV2")).height!=="0px"'))
     browser.execute_script("""
       const row=document.querySelector('#darAdultBrandHeaderV2 .dtbh-row');
       const toggle=row.querySelector('.dtbh-toggle');
       if(!document.getElementById('darVisitorProfileButtonV1')){
         const b=document.createElement('button');b.id='darVisitorProfileButtonV1';b.type='button';b.textContent='Profil';
         row.insertBefore(b,toggle);
       }
     """)
     WebDriverWait(browser,10).until(lambda d:d.execute_script(
       'return Math.abs(document.getElementById("darAdultBrandHeaderV2").getBoundingClientRect().height - parseFloat(getComputedStyle(document.getElementById("darAdultBrandHeaderSpacerV2")).height))<2'))
     metrics=browser.execute_script("""
       const h=document.getElementById('darAdultBrandHeaderV2');
       const sp=document.getElementById('darAdultBrandHeaderSpacerV2');
       const rect=h.getBoundingClientRect(),action=h.querySelector('.dtbh-toggle');
       const a=action.getBoundingClientRect();
       const hit=document.elementFromPoint(a.left+a.width/2,a.top+a.height/2);
       return {header:rect.height,headerBottom:rect.bottom,spacer:sp.getBoundingClientRect().height,
        padding:getComputedStyle(h).paddingTop,bodyPadding:getComputedStyle(document.body).paddingTop,
        heroTop:document.querySelector('.topics-hub > .view-head').getBoundingClientRect().top,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        hit:hit===action||action.contains(hit),actionHeight:a.height,
        nativeInset:getComputedStyle(document.documentElement).getPropertyValue('--dar-native-safe-top').trim()};
     """)
     assert metrics["nativeInset"]=="126px",metrics
     assert metrics["header"]<=64,(theme,native,label,"double top safe-area",metrics)
     assert metrics["header"]>=43,(theme,native,label,"header collapsed",metrics)
     assert abs(metrics["spacer"]-metrics["header"])<=2,(theme,native,label,"double spacer",metrics)
     assert abs(metrics["heroTop"]-metrics["headerBottom"])<=2,(theme,native,label,"first content occluded",metrics)
     assert metrics["bodyPadding"]=="0px" or not native,(theme,native,label,"native body double gap",metrics)
     assert metrics["overflow"]<=2,(theme,native,label,"horizontal overflow",metrics)
     assert metrics["hit"] and metrics["actionHeight"]>=40,(theme,native,label,"action hit",metrics)
     browser.execute_script("window.scrollTo(0,320)")
     sticky=browser.execute_script("""
       const h=document.getElementById('darAdultBrandHeaderV2').getBoundingClientRect();
       const r=document.querySelector('.topics-hub > .view-head').getBoundingClientRect();
       return {bottom:h.bottom,top:r.top,position:getComputedStyle(document.querySelector('.topics-hub > .view-head')).position};
     """)
     assert sticky["position"]=="sticky" and sticky["top"]>=sticky["bottom"]-2,(theme,native,label,"hero under brand",sticky)
    print("PASS compact visitor header",theme,"native" if native else "pwa",len(SIZES),"viewports",flush=True)
 finally:
  if browser:browser.quit()
  server.shutdown()
  FILE.unlink(missing_ok=True)
if __name__=="__main__":run()
