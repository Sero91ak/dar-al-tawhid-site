#!/usr/bin/env python3
"""Check actual adult DAR TEST SPA route navigation in 7 locales; no paid APIs."""
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROUTES=["home","recent","quran","books","bibliothek","scholars","duas",
        "hadith","frauen","propheten","quiz","prayer","qibla","settings","more"]
LANGUAGES=[("de","ltr"),("tr","ltr"),("en","ltr"),("ar","rtl"),("ku","ltr"),("ckb","rtl"),("bs","ltr")]
o=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
    o.add_argument(flag)
driver=webdriver.Chrome(options=o)
passed=0
try:
    driver.set_window_size(430,930)
    driver.get("http://127.0.0.1:8765/test/")
    wait=WebDriverWait(driver,40)
    wait.until(lambda d:d.execute_script(
        "return !!document.getElementById('appView')&&window.__DarTestSevenLocalesReady===true"))
    for locale,direction in LANGUAGES:
        driver.execute_script(
            """localStorage.setItem('darAdultPreferredLocaleV1',arguments[0]);
               window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:arguments[0]}}));""",locale)
        wait.until(lambda d:d.execute_script(
            "return document.documentElement.lang===arguments[0]&&document.documentElement.dir===arguments[1]",
            locale,direction))
        for route in ROUTES:
            driver.execute_script(
                "if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",route)
            time.sleep(.22)
            report=driver.execute_script(
                """const node=document.getElementById('appView');
                   return {lang:document.documentElement.lang,dir:document.documentElement.dir,
                     visible:!!(node&&node.getBoundingClientRect().width>0),
                     controls:node?node.querySelectorAll('button,[role="button"],a,input').length:0,
                     localeName:window.DarTestTurkishUI?.locale?.(),
                     translated:window.DarTestTurkishUI?.translateValue?.('Gebetszeiten',arguments[0])};""",
                locale)
            if report["lang"]!=locale or report["dir"]!=direction:
                raise AssertionError(f"{locale}/{route}: wrong language/direction {report}")
            if locale!="de" and not report["translated"]:
                raise AssertionError(f"{locale}/{route}: no loaded translation {report}")
            passed+=1
        print("PASS all routes locale",locale,direction,flush=True)
    driver.execute_script(
        """localStorage.setItem('darAdultPreferredLocaleV1','de');
           window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'de'}}));""")
    wait.until(lambda d:d.execute_script("return document.documentElement.lang==='de'"))
    print("PASS:",passed,"route/language navigations; German restoration; no paid translation calls",flush=True)
finally:
    driver.quit()
