#!/usr/bin/env python3
"""Read-only actual desktop Chromium smoke on the combined editorial preview.
Runs only on the integration QA branch through the existing header E2E job.
No production workflow changes, no app output updates, no screenshot artifacts.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT=Path(__file__).resolve().parents[1]
ROUTES=["start","quran","beitraege","hadith","dua","wissen","bibliothek","frauen","gebetszeiten","mehr","suche","quiz"]
VIEWPORTS=[("phone",390,844),("fold",840,900),("tablet",1024,768),("desktop",1440,900)]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def run():
 server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(ROOT)))
 Thread(target=server.serve_forever,daemon=True).start()
 opts=Options()
 for arg in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
  opts.add_argument(arg)
 driver=None
 try:
  driver=webdriver.Chrome(options=opts)
  base=f"http://127.0.0.1:{server.server_address[1]}/desktop-preview/index.html?page="
  for label,width,height in VIEWPORTS:
   driver.set_window_size(width,height)
   for page in ROUTES:
    driver.get(base+page)
    WebDriverWait(driver,25).until(lambda d:d.execute_script(
     'return document.body?.dataset?.darV8Route===arguments[0] && document.getElementById("pageRoot")?.innerHTML?.length>30',page))
    result=driver.execute_script("""
      const root=document.documentElement, page=document.getElementById('pageRoot');
      const dock=document.getElementById('darV8MobileDock'),sidebar=document.getElementById('darV8Sidebar');
      const props=getComputedStyle(root);
      const nav=window.innerWidth>=960?sidebar:dock;
      return {route:document.body.dataset.darV8Route,
       overflow:root.scrollWidth-root.clientWidth,
       token:props.getPropertyValue('--dar-ed-flow-md').trim(),
       editorial:root.classList.contains('dar-adult-editorial-v1'),
       content:page.innerText.length,
       navVisible:!!nav&&getComputedStyle(nav).display!=='none',
       hasReader:!!page.querySelector('h1,h2,h3,p,article,.section,.post-browser'),
       hiddenReveal:[...page.querySelectorAll('.reveal')].filter(el=>getComputedStyle(el).opacity==='0').length};
    """)
    assert result["route"]==page,(label,page,result)
    assert result["overflow"]<=4,(label,page,"overflow",result)
    assert result["editorial"] and result["token"],(label,page,"tokens",result)
    assert result["navVisible"] and result["hasReader"] and result["content"]>20,(label,page,result)
    assert result["hiddenReveal"]==0,(label,page,"initial hidden reader",result)
   print("PASS desktop adapter",label,width,height,len(ROUTES),"routes",flush=True)
  driver.execute_cdp_cmd("Emulation.setEmulatedMedia",{"features":[{"name":"prefers-reduced-motion","value":"reduce"}]})
  driver.get(base+"beitraege")
  WebDriverWait(driver,20).until(lambda d:d.execute_script('return document.body?.dataset?.darV8Route==="beitraege"'))
  result=driver.execute_script("return {anim:getComputedStyle(document.querySelector('.reveal')||document.body).animationName,disabled:matchMedia('(prefers-reduced-motion:reduce)').matches}")
  assert result["disabled"],result
  print("PASS desktop reduced motion",flush=True)
 finally:
  if driver:driver.quit()
  server.shutdown()
if __name__=="__main__":run()
