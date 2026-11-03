#!/usr/bin/env python3
"""Chromium real-CSS geometry regression: no native Safe Area double-gap.
Exercises representative original Frauen Hero (unmodified artwork/sizing).
Both Test and visitor use their ACTUAL checked-in CSS.
"""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT=Path(__file__).resolve().parent.parent
FILE1=ROOT / "__dar_hero_seam_visitor__.html"
FILE2=ROOT / "test/__dar_hero_seam_test__.html"
SIZES=[("iPhone",390,844),("DuoOuter",594,800),("FoldOpen",768,1024),("TabletWide",1024,768)]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
def html(test=False):
 cls="dar-test-premium-header-v2" if test else "dar-adult-global-brand-ready"
 hid="darTestBrandHeaderV1" if test else "darAdultBrandHeaderV2"
 spacer="darTestBrandHeaderSpacerV1" if test else "darAdultBrandHeaderSpacerV2"
 brand="/test/assets/dar-test-premium-header-v2.css" if test else "/assets/dar-adult-brand-header-v2.css"
 hero="/test/assets/adult-immersive-hero-v1.css" if test else "/assets/adult-immersive-hero-v1.css"
 authority="/test/assets/frauen/frauen-authority-v1292.css" if test else "/assets/frauen/frauen-authority-v1292.css"
 # Simulate native View.swift's original late 126px body padding; brand CSS
 # must win with correct native body class without touching Hero geometry.
 return f'''<!doctype html><html lang="de" data-theme="salbei" class="{cls} dar-ios-native-app">
 <head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
 <style>
 html,body{{margin:0;min-height:100%;background:#ebf0e7}}
 html{{--dar-native-safe-top:126px;--dar-adult-brand-header-height:196px;--dar-adult-header-obscured-top:196px;
 --dar-test-brand-header-height:196px;--dar-test-occlusion-top:196px;}}
 body.dar-ios-native-app.is-area-route{{padding-top:126px!important}}
 #appView{{margin:0;padding:0}}
 #{hid}{{height:196px!important;min-height:196px!important;top:0!important;position:fixed!important;
 width:100%!important;box-sizing:border-box!important;z-index:730;background:#ebf0e7!important}}
 #{spacer}{{height:196px!important;display:block!important;width:100%!important}}
 .app{{width:100%;min-height:1600px}}
 .frauen-library-hero{{background-color:#22382e;min-height:300px!important;}}
 </style>
 <link rel="stylesheet" href="{authority}">
 <link rel="stylesheet" href="{hero}">
 <link rel="stylesheet" href="{brand}">
 </head>
 <body class="dar-ios-native-app has-bottom-nav is-area-route is-frauen-route" data-frauen-view="hub">
 <header id="{hid}"><div class="dtbh-row"><span>DĀR AL TAWḤĪD</span></div></header>
 <div class="app"><div id="{spacer}"></div><main id="appView" class="view">
 <section class="frauen-library-shell">
  <div class="dar-immersive-hero-stage" data-has-search="1">
  <section class="frauen-library-hero"><div class="frauen-library-hero__content"><h2>Frauen im Islam</h2></div></section>
  <div class="frauen-library-search-wrap"><input placeholder="Suchen" aria-label="Suchen"></div></div>
  <section style="min-height:1600px">Inhalte bleiben scrollbar</section>
 </section></main></div></body></html>'''
def run():
 FILE1.write_text(html(False),encoding="utf8")
 FILE2.write_text(html(True),encoding="utf8")
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 options=Options()
 for opt in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
  options.add_argument(opt)
 driver=None
 try:
  driver=webdriver.Chrome(options=options)
  base=f"http://127.0.0.1:{server.server_address[1]}"
  for lane,path,hid in [
   ("visitor","/__dar_hero_seam_visitor__.html","darAdultBrandHeaderV2"),
   ("test","/test/__dar_hero_seam_test__.html","darTestBrandHeaderV1")]:
   for label,w,h in SIZES:
    driver.set_window_size(w,h)
    driver.get(base+path)
    for scroll in [0,320,0]:
     driver.execute_script("window.scrollTo(0,arguments[0])",scroll)
     value=driver.execute_script("""
       const hdr=document.getElementById(arguments[0]).getBoundingClientRect();
       const hero=document.querySelector(".frauen-library-hero").getBoundingClientRect();
       const stage=document.querySelector(".dar-immersive-hero-stage").getBoundingClientRect();
       const body=document.body,top=getComputedStyle(body).paddingTop;
       return {bottom:hdr.bottom,heroTop:hero.top,stageTop:stage.top,bodyPadding:top,
          heroHeight:hero.height,scrollY:scrollY};
     """,hid)
     if scroll==0 and (abs(value["bottom"]-value["heroTop"])>2 or abs(value["stageTop"]-value["bottom"])>2):
      raise AssertionError(f"{lane} {label} Hero should touch Header at top: {value}")
     if scroll==0 and value["bodyPadding"]!="0px":
      raise AssertionError(f"{lane} {label} duplicated native 126px: {value}")
     if scroll>0 and value["stageTop"]<value["bottom"]-2:
      raise AssertionError(f"{lane} {label} sticky Hero slipped under Header: {value}")
    print(f"PASS {lane} {label}: Hero flush to fixed Header at top and after returning; no native safe-gap",flush=True)
 finally:
  if driver:driver.quit()
  server.shutdown()
  FILE1.unlink(missing_ok=True);FILE2.unlink(missing_ok=True)
if __name__=="__main__":
 run()
