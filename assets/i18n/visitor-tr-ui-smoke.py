#!/usr/bin/env python3
"""Public adult app scripts, exercised in a same-origin isolated browser shell.
The gigantic root index depends on Cloudflare/Wrangler and is not bootable under
python.http.server. This checks the exact production UI modules and JSON asset,
not a claim about successful Cloudflare deploy.
"""
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

raw=Path("index.html").read_text(encoding="utf8")
print("Production root script references:",
      "dar-more-v15.js",raw.count("dar-more-v15.js"),
      "dar-more-final-v15.js",raw.count("dar-more-final-v15.js"),flush=True)

chrome=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
 chrome.add_argument(flag)
driver=webdriver.Chrome(options=chrome)
try:
 driver.set_window_size(430,930)
 # Directory index gives a same-origin DOM without running the Cloudflare-only app boot.
 driver.get("http://127.0.0.1:8765/assets/i18n/")
 w=WebDriverWait(driver,40)
 driver.execute_script("""
 document.body.innerHTML='<div id="appView" role="main"></div>';
 let s=document.createElement('script');
 s.src='/assets/dar-more-v15.js?v=tr-ui-qa';
 document.head.appendChild(s);
 """)
 w.until(lambda d:d.execute_script("return !!window.DAR_MORE_V15"))
 w.until(lambda d:d.execute_script("return !!window.DARAdultUI18n"))
 w.until(lambda d:d.execute_script("return window.DARAdultUI18n.catalogStatus==='loaded'"))
 count=driver.execute_script("return window.DARAdultUI18n.translatedKeys")
 assert count>=350,f"Shared catalog has only {count} Turkish UI entries"
 driver.execute_script("""
 const root=document.getElementById('appView');
 root.innerHTML=window.DAR_MORE_V15.render(
  [{id:'quran',nav:'quran',title:'Qurʾān',desc:'Lesen & suchen',group:'Lernen & Wissen'}],
  (title)=>'<header><h2>'+title+'</h2></header>');
 window.DAR_MORE_V15.sync();
 """)
 w.until(lambda d:d.execute_script("return !!document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]')"))
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]').click()")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='tr'"))
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('İlim'))"""))
 assert driver.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')")=="tr"
 print("PASS public modules: More controls and visible Turkish labels",flush=True)
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=de]').click()")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='de'"))
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('Wissen'))"""))
 print("PASS public modules: reversible German locale",flush=True)
 driver.execute_script("""document.getElementById('appView').innerHTML=
 '<div class="dsh-shell dsh-home"><div class="dsh-welcome">Einstellungen</div></div>'""")
 w.until(lambda d:d.execute_script("return !!document.querySelector('#darAdultLanguageControl')"))
 print("PASS public modules: Settings language chooser available",flush=True)
finally:driver.quit()
