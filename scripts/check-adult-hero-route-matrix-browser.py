#!/usr/bin/env python3
"""Multi-route adult Hero geometry + click test in Chromium.
Uses each lane's checked-in CSS, actual route class names and markup shapes.
Synthetic content only. No Hero source, crop, dimensions or text altered.
Native iOS double-padding regression is deliberately injected into fixture.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT=Path(__file__).resolve().parent.parent
FILES=[ROOT/"__dar_hero_routes_visitor__.html",ROOT/"test/__dar_hero_routes_test__.html"]
ROUTES=[
 "frauen","topics","topic","post","hadith","hadith-detail","dua",
 "dua-detail","settings","calendar","ramadan","notifications",
 "account","about","news","news-detail","zakat","source-library",
 "quran-topic","more","quiz","generic-sticky","generic-normal"
]
SIZES=[("phone",390,844),("duo",594,800),("fold",768,1024),("tablet",1024,768)]
class Silent(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
def fixture(test):
 rootClass="dar-test-premium-header-v2" if test else "dar-adult-global-brand-ready"
 header="darTestBrandHeaderV1" if test else "darAdultBrandHeaderV2"
 spacer="darTestBrandHeaderSpacerV1" if test else "darAdultBrandHeaderSpacerV2"
 sheets=([
  "/test/assets/test-global-edge-width-v1372.css",
  "/test/assets/area-shell-v1294.css",
  "/test/assets/primary-area-embedded-v1313.css",
  "/test/assets/quiz-overview-v1257.css",
  "/test/assets/more-v1253.css",
  "/test/assets/adult-immersive-hero-v1.css",
  "/test/assets/dar-settings-navigation-v1.css",
  "/test/assets/dar-test-premium-header-v2.css"
 ] if test else [
  "/assets/full-edge-appearance-polish.css",
  "/assets/adult-responsive-viewport-v1381.css",
  "/assets/adult-immersive-hero-v1.css",
  "/assets/dar-hero-scroll-standard-v1.css",
  "/assets/dar-settings-navigation-v1.css",
  "/assets/dar-adult-brand-header-v2.css"
 ])
 links="".join('<link rel="stylesheet" href="'+p+'">' for p in sheets)
 return (
  '<!doctype html><html lang="de" data-theme="salbei" class="'+rootClass+' dar-ios-native-app"><head>'
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  '<style>html,body{margin:0;min-height:100%;background:#eaf0e7}'
  'html{--dar-adult-brand-header-height:126px;--dar-adult-header-obscured-top:126px;'
  '--dar-test-brand-header-height:126px;--dar-test-occlusion-top:126px;--dar-native-safe-top:126px;--safe-top:126px}'
  'html.dar-ios-native-app body.is-area-route{padding-top:126px!important}'
  '#'+header+'{height:126px!important;min-height:126px!important;position:fixed!important;top:0!important;inset-inline:0!important;z-index:730!important;background:#eaf0e7!important;box-sizing:border-box!important}'
  '#'+spacer+'{height:126px!important;flex:0 0 126px!important;display:block!important}'
  '.app{width:100%;min-height:1900px}#appView{min-height:1700px}'
  '#appView .hero-fixture{min-height:205px;box-sizing:border-box;background-color:#294439}'
  '#heroTap{position:relative;z-index:8;min-height:44px;min-width:120px;background:#fff;color:#18281f;border:1px solid #777;border-radius:8px;cursor:pointer}'
  '#appView .fixture-content{height:1750px;padding:24px}</style>'+links+'</head>'
  '<body class="dar-ios-native-app is-area-route has-bottom-nav is-frauen-route">'
  '<header id="'+header+'" data-premium-header-v2="ready"><div class="dtbh-row">DĀR AL TAWḤĪD</div></header>'
  '<div class="app"><div id="'+spacer+'"></div><main id="appView" class="view"></main></div></body></html>'
 )
def markup(route):
 button='<button type="button" id="heroTap" onclick="window.__heroTap=(window.__heroTap||0)+1">Hero öffnen</button>'
 h='<div class="hero-fixture" data-qa-hero="1">'+button+'</div>'
 if route=="frauen":
  return '<section class="frauen-library-shell"><div class="dar-immersive-hero-stage frauen-library-pinned-header" data-qa-hero="1"><div class="frauen-library-hero hero-fixture">'+button+'</div><div class="frauen-library-search-wrap"><input aria-label="Suche" placeholder="Suchen"></div></div><section class="fixture-content">Inhalt</section></section>',".dar-immersive-hero-stage"
 if route in ("topics","topic","post","hadith","dua"):
  cls={"topics":"topics-hub","topic":"topic-collection-page","post":"post-reader","hadith":"hadith-hub","dua":"dua-hub"}[route]
  heading="post-reader-title" if route=="post" else "view-head"
  return '<section class="'+cls+'"><header class="'+heading+' hero-fixture" data-qa-hero="1">'+button+'</header><section class="fixture-content">Inhalt</section></section>',"."+cls+" > ."+heading
 if route in ("hadith-detail","dua-detail"):
  cls=route
  return '<section class="'+cls+'"><header class="post-reader-title hero-fixture" data-qa-hero="1">'+button+'</header><section class="fixture-content">Inhalt</section></section>',"."+cls+" > .post-reader-title"
 if route in ("generic-sticky","generic-normal"):
  kind="sticky" if route=="generic-sticky" else "normal"
  return '<section data-hero-kind="category" data-hero-scroll="'+kind+'"><div class="dar-hero-stage" data-qa-hero="1"><div class="dar-hero hero-fixture">'+button+'</div></div><section class="fixture-content">Inhalt</section></section>','[data-hero-kind] > .dar-hero-stage'
 if route=="calendar":
  return '<header class="cal-tl-head hero-fixture" data-qa-hero="1">'+button+'</header><section class="fixture-content">Inhalt</section>',".cal-tl-head"
 cls="view-head hero-fixture"+(" settings-page-head" if route=="settings" else "")
 return '<header class="'+cls+'" data-qa-hero="1">'+button+'</header><section class="fixture-content">Inhalt</section>',".view-head"
def main():
 for p,t in zip(FILES,[False,True]):p.write_text(fixture(t),encoding="utf-8")
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Silent,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 opts=Options()
 for a in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:opts.add_argument(a)
 driver=None
 counts={"visitor":0,"test":0}
 try:
  driver=webdriver.Chrome(options=opts)
  base="http://127.0.0.1:"+str(server.server_address[1])
  for lane,filename,header in [("visitor","/__dar_hero_routes_visitor__.html","darAdultBrandHeaderV2"),("test","/test/__dar_hero_routes_test__.html","darTestBrandHeaderV1")]:
   driver.get(base+filename)
   for screen,w,h in SIZES:
    driver.set_window_size(w,h)
    for route in ROUTES:
     html,selector=markup(route)
     driver.execute_script("""
      document.documentElement.classList.add("dar-ios-native-app");
      document.body.className="dar-ios-native-app is-area-route has-bottom-nav is-"+arguments[0]+"-route";
      document.getElementById("appView").innerHTML=arguments[1];
      window.scrollTo(0,0);
     """,route.replace("-detail","") if route in ("hadith-detail","dua-detail") else route,html)
     metrics=driver.execute_script("""
      const hero=document.querySelector(arguments[0]);
      const head=document.getElementById(arguments[1]).getBoundingClientRect();
      const rect=hero.getBoundingClientRect();
      const btn=document.getElementById("heroTap").getBoundingClientRect();
      const bodyPad=getComputedStyle(document.body).paddingTop;
      const computed=getComputedStyle(hero);
      return {headBottom:head.bottom,heroTop:rect.top,heroHeight:rect.height,
        bodyPad,position:computed.position,top:computed.top,
        buttonCenter:btn.top+btn.height/2,
        hit:(()=>{const el=document.elementFromPoint(btn.left+btn.width/2,btn.top+btn.height/2);return !!el&&(el.id==="heroTap"||!!el.closest("#heroTap"));})()};
     """,selector,header)
     if abs(metrics["heroTop"]-metrics["headBottom"])>2:
      raise AssertionError(f"{lane} {screen} {route}: blank gap or overlap {metrics}")
     if metrics["bodyPad"]!="0px":
      raise AssertionError(f"{lane} {screen} {route}: duplicate native safe top {metrics}")
     if metrics["heroHeight"]<44:
      raise AssertionError(f"{lane} {screen} {route}: Hero collapsed {metrics}")
     if route=="settings" and metrics["top"] not in ("auto","0px"):
      raise AssertionError(f"{lane} {screen} settings relative Hero moved by CSS top {metrics}")
     if not metrics["hit"]:
      raise AssertionError(f"{lane} {screen} {route}: Hero control cannot be tapped {metrics}")
     before=driver.execute_script("return window.__heroTap||0")
     driver.find_element("id","heroTap").click()
     after=driver.execute_script("return window.__heroTap||0")
     if after!=before+1:
      raise AssertionError(f"{lane} {screen} {route}: click not dispatched")
     driver.execute_script("window.scrollTo(0,240);window.scrollTo(0,0)")
     again=driver.execute_script("return document.querySelector(arguments[0]).getBoundingClientRect().top",selector)
     if abs(again-metrics["headBottom"])>2:
      raise AssertionError(f"{lane} {screen} {route}: returning to top leaves gap {again} vs {metrics['headBottom']}")
     counts[lane]+=1
    print(f"PASS {lane} {screen}: {len(ROUTES)} photo/heading route variants, positions and click targets",flush=True)
  print("PASS route matrix:",counts,"hero fixtures. All underlying art assets remain unchanged.",flush=True)
 finally:
  if driver:driver.quit()
  server.shutdown()
  for p in FILES:p.unlink(missing_ok=True)
if __name__=="__main__":main()
