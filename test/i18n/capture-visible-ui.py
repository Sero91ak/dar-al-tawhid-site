#!/usr/bin/env python3
"""Extract visible adult DAR TEST control labels across 15 real SPA sections.

Capture only app chrome/UI candidates, not source material. All client translation
remains in German until the reviewed UI dictionary is loaded. No interactions
that change user data, quiz answers or content.
"""
import collections, json, os, re, time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROUTES=["home","recent","quran","books","bibliothek","scholars","duas",
        "hadith","frauen","propheten","quiz","prayer","qibla","settings","more"]
SNAPSHOT=r"""
const isHidden=e=>{if(e.closest('[hidden],[aria-hidden="true"]'))return true;
 const style=getComputedStyle(e);return style.display==='none'||style.visibility==='hidden'||e.getClientRects().length===0};
const excluded='script,style,noscript,textarea,pre,code,[contenteditable],[lang="ar"],[dir="rtl"],[data-canonical-content],'+
 '[class*="post-body"],[class*="post-content"],[class*="hadith-text"],[class*="quran-arabic"],'+
 '[class*="source-quote"],[class*="qsource-statement"],[class*="ayah-text"],'+
 '[class*="scholar-quote"],[class*="translation-body"]';
const uiParts='button,label,summary,nav,header,footer,aside,[role="tab"],[role="menuitem"],'+
 '[role="dialog"],[role="button"],.settings-one-page,.dsh-shell,.dar-more-v15,'+
 '.dv3-home,.dar-setup-hub,.dm-group,.dar-quran-player,.dar-quran-controls,'+
 '.quran-player,.quran-controls,.quran-toolbar,.quran-search';
const result=[];
const add=(text,kind)=>{
 if(typeof text!=='string')return;
 let value=text.replace(/[\s\u00a0]+/g,' ').trim();
 if(value.length<2||value.length>180||/[<>]/.test(value)||/[\u0600-\u06ff]/.test(value)||/https?:\/\//.test(value))return;
 if(/^[\d\s.,:;\/\\\-+()%→×▤✒♥◐☀▶]+$/.test(value))return;
 if(/^(DĀR AL TAWḤĪD|Türkçe|Deutsch|Qurʾān|ʿIlm)$/.test(value))return;
 result.push({text:value,kind});
};
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
let node;
while((node=walker.nextNode())){
 let el=node.parentElement;
 if(!el||el.closest(excluded)||isHidden(el)||!el.closest(uiParts))continue;
 if(el.closest('button,[role="button"]')?.matches('[data-dv3-nav="post"],[data-nav="post"]'))continue;
 if(el.closest('.dv3-posts,.book-catalog-card,.ilm-post-body,.hadith-narration,.dua-arabic,.quran-ayah'))continue;
 add(node.nodeValue,'text');
}
const attrSelectors=['input[placeholder]','textarea[placeholder]','[aria-label]','[aria-description]','[title]','img[alt]'];
for(const selector of attrSelectors)for(const el of document.querySelectorAll(selector)){
 if(el.closest(excluded)||isHidden(el))continue;
 for(const attr of ['placeholder','aria-label','aria-description','title','alt'])add(el.getAttribute(attr),'attribute');
}
return result;
"""
options=Options()
for arg in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
 options.add_argument(arg)
driver=webdriver.Chrome(options=options)
seen=collections.defaultdict(lambda:{"count":0,"routes":set(),"kinds":set()})
error=[]
try:
 driver.set_window_size(430,930)
 driver.get("http://127.0.0.1:8765/test/")
 WebDriverWait(driver,45).until(lambda d:d.execute_script("return !!document.getElementById('appView')"))
 driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de')")
 driver.refresh()
 WebDriverWait(driver,45).until(lambda d:d.execute_script("return !!document.getElementById('appView')"))
 for route in ROUTES:
  try:
   driver.execute_script("if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",route)
   time.sleep(.8)
   for row in driver.execute_script(SNAPSHOT):
    v=row["text"]
    obj=seen[v]
    obj["count"]+=1;obj["routes"].add(route);obj["kinds"].add(row["kind"])
   print("UI-CAPTURE",route,"unique labels",len(seen),flush=True)
  except Exception as ex:error.append({"route":route,"error":str(ex)[:220]})
finally:driver.quit()
items=[{"de":k,"count":v["count"],"routes":sorted(v["routes"]),"kinds":sorted(v["kinds"])}
       for k,v in seen.items()]
items.sort(key=lambda x:(-len(x["routes"]),-x["count"],x["de"]))
os.makedirs("test/i18n/qa",exist_ok=True)
output={"schemaVersion":1,"scope":"adult-test-ui-only","sourceLocale":"de",
        "targetLocale":"tr","routes":ROUTES,"errors":error,"candidates":items}
with open("test/i18n/qa/ui-candidates.json","w",encoding="utf8") as f:
 json.dump(output,f,ensure_ascii=False,indent=2)
print("UI-CAPTURE COMPLETE:",len(items),"unique candidate strings; errors:",len(error),flush=True)
if len(items)<50 or len(error)>3:raise SystemExit("Incomplete interface inventory")
