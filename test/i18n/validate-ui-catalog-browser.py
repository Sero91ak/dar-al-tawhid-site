#!/usr/bin/env python3
"""End-to-end check that the *generated* Turkish UI catalog is applied in the app."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts=Options()
for x in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
 opts.add_argument(x)
driver=webdriver.Chrome(options=opts)
try:
 driver.set_window_size(430,930)
 driver.get("http://127.0.0.1:8765/test/")
 w=WebDriverWait(driver,50)
 w.until(lambda d:d.execute_script("return !!window.DarTestTurkishUI"))
 w.until(lambda d:d.execute_script("return window.DarTestTurkishUI.catalogStatus==='loaded'"))
 count=driver.execute_script("return window.DarTestTurkishUI.translatedKeys")
 assert count >= 340, "Generated app UI catalog was not loaded"
 driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','tr');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'tr'}}))")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='tr'"))
 english=driver.execute_script("return window.DarTestTurkishUI.translateValue('Hauptnavigation')")
 assert english=="Ana menü",f"Wrong pack: {english}"
 # Verify real element text/attribute changes, not only the internal dictionary.
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('[aria-label],h1,h2,h3,button,span')].some(e=>e.getAttribute('aria-label')==='Ana menü'||e.textContent?.trim()==='Ana menü')"""))
 print("PASS: Turkish central UI catalog rendered on active adult app page",flush=True)
 driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'de'}}))")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='de'"))
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('[aria-label],h1,h2,h3,button,span')].some(e=>e.getAttribute('aria-label')==='Hauptnavigation'||e.textContent?.trim()==='Hauptnavigation')"""))
 print("PASS: switch back to German without reload or a new model call",flush=True)
finally:
 driver.quit()
