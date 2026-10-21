#!/usr/bin/env python3
"""Read-only coverage inventory of adult DAR TEST UI routes in German and Turkish.
Does not inspect, translate or overwrite sourced religious content.
"""
import json, os, time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROUTES = ["home","recent","quran","books","bibliothek","scholars","duas",
          "hadith","frauen","propheten","quiz","prayer","qibla","settings","more"]
opts=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
    opts.add_argument(flag)

SNAPSHOT = r"""
const elements=[...document.querySelectorAll(
 'button,nav a,header a,[role="tab"],[role="menuitem"],label,summary,input[placeholder],textarea[placeholder],select[aria-label],h1,h2,h3')];
return elements.filter(e=>{
 if(e.closest('[lang="ar"],[dir="rtl"],[data-canonical-content],.post-body,.hadith-text,.quran-arabic,[contenteditable]'))return false;
 if(e.closest('[hidden],[aria-hidden="true"]'))return false;
 const s=getComputedStyle(e);
 if(s.display==='none'||s.visibility==='hidden')return false;
 return e.getClientRects().length>0;
}).slice(0,500).map((e,i)=>{
 const value=(e.getAttribute('placeholder')||e.innerText||e.getAttribute('aria-label')||'')
  .replace(/\s+/g,' ').trim();
 return {i,tag:e.tagName,locator:e.id||e.getAttribute('data-nav')||e.getAttribute('data-dv3-nav')||
  e.getAttribute('data-dm-item')||e.className?.toString().slice(0,70)||'',value:value.slice(0,110)};
}).filter(x=>x.value&&!/[\u0600-\u06ff]/.test(x.value)&&!/^[\d\s:.,/%+\-→×]+$/.test(x.value));
"""

driver=webdriver.Chrome(options=opts)
report={"schemaVersion":1,"kind":"adult-test-turkish-visible-interface-coverage",
        "disclaimer":"Read-only UI inventory, not evidence of translated religious content.",
        "routes":[]}
try:
 driver.set_window_size(393,852)
 driver.get("http://127.0.0.1:8765/test/")
 WebDriverWait(driver,45).until(lambda d:d.execute_script("return !!document.getElementById('appView')"))
 for name in ROUTES:
  route={"route":name}
  try:
   driver.execute_script("if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",name)
   time.sleep(0.7)
   driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'de'}}))")
   time.sleep(0.35)
   de=driver.execute_script(SNAPSHOT)
   driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','tr');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'tr'}}))")
   time.sleep(0.55)
   tr=driver.execute_script(SNAPSHOT)
   matches=[]
   for a,b in zip(de,tr):
    if a["tag"]!=b["tag"]:
     continue
    if a["value"]==b["value"]:
     matches.append(a["value"])
   route.update({"germanElementCount":len(de),"turkishElementCount":len(tr),
     "untranslatedCandidates":list(dict.fromkeys(matches))[:80],
     "unchangedCandidatesCount":len(matches),
     "changedAtSamePosition":sum(1 for a,b in zip(de,tr) if a["tag"]==b["tag"] and a["value"]!=b["value"])})
   print(name,":",route["changedAtSamePosition"],"changed,",len(matches),"unchanged UI candidates",flush=True)
  except Exception as ex:
   route["error"]=str(ex)[:500]
   print("AUDIT ROUTE FAILED",name,route["error"],flush=True)
  report["routes"].append(route)
 finally_message="scan complete"
 os.makedirs("test/i18n/qa",exist_ok=True)
 with open("test/i18n/qa/turkish-ui-coverage.json","w",encoding="utf-8") as f:
  json.dump(report,f,ensure_ascii=False,indent=2)
 print("Saved UI candidate inventory; no religious translation published.",flush=True)
finally:
 driver.quit()
