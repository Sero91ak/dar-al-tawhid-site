#!/usr/bin/env python3
"""Q50 real Chrome: nine selected locales, bilingual source text, question logic,
theme/RTL and source→lesson transitions without a second app boot.
"""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/"assets/q50-locales.json").read_text())
LOCALES=["de","ar","en","tr","ku","ckb","bs","fr","es"]

def run():
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f"http://127.0.0.1:{server.server_port}"
    options=Options()
    for x in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
        options.add_argument(x)
    browser=webdriver.Chrome(options=options)
    try:
        for width,height in ((390,844),(1024,768)):
            browser.set_window_size(width,height)
            for code in LOCALES:
                p=DATA["locales"][code]
                browser.get(f"{base}/q/50/?lang={code}")
                WebDriverWait(browser,18).until(lambda b:
                    b.find_element(By.ID,"q50Title").text.strip()==p["title"].strip())
                assert browser.find_element(By.ID,"q50Language").get_attribute("value")==code
                assert browser.find_element(By.ID,"q50Statement1").text.find(p["statement1"])>=0
                assert browser.find_element(By.ID,"q50Statement2").text.find(p["statement2"])>=0
                assert browser.find_element(By.TAG_NAME,"html").get_attribute("dir")==p["dir"]
                assert len(browser.find_elements(By.CSS_SELECTOR,".qsource-link.web"))==6
                assert len(browser.find_elements(By.CSS_SELECTOR,".q50-ar[lang='ar'][dir='rtl']"))==2
                assert browser.execute_script("return document.documentElement.scrollWidth<=window.innerWidth+4"),(width,code,"source overflows")
                assert browser.find_element(By.ID,"q50Learning").get_attribute("href").endswith(f"/lernen/wissen-ist-religion/?lang={code}")
                browser.get(f"{base}/lernen/wissen-ist-religion/?lang={code}")
                WebDriverWait(browser,18).until(lambda b:
                    b.find_element(By.ID,"qlQuestion").text.strip()==p["questions"][0]["q"].strip())
                assert browser.find_element(By.TAG_NAME,"html").get_attribute("dir")==p["dir"]
                assert len(browser.find_elements(By.CSS_SELECTOR,".ql-option"))==4
                assert browser.find_element(By.ID,"qlNext").get_attribute("disabled")
                browser.find_elements(By.CSS_SELECTOR,".ql-option")[1].click()
                assert not browser.find_element(By.ID,"qlNext").get_attribute("disabled")
                assert p["questions"][0]["why"] in browser.find_element(By.ID,"qlFeedback").text
                browser.find_element(By.ID,"qlNext").click()
                WebDriverWait(browser,5).until(lambda b:
                    b.find_element(By.ID,"qlQuestion").text.strip()==p["questions"][1]["q"].strip())
                assert browser.execute_script("return document.documentElement.scrollWidth<=window.innerWidth+4"),(width,code,"quiz overflows")
                print(f"PASS Q50 {code} at {width}px: correct source, RTL, no overflow, 4 choices, quiz advances",flush=True)
            browser.get(f"{base}/q/50/")
            Select(browser.find_element(By.ID,"q50Language")).select_by_value("tr")
            WebDriverWait(browser,5).until(lambda b:b.find_element(By.ID,"q50Title").text==DATA["locales"]["tr"]["title"])
            assert browser.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')")=="tr"
            browser.get(f"{base}/lernen/wissen-ist-religion/")
            WebDriverWait(browser,5).until(lambda b:b.find_element(By.ID,"qlQuestion").text==DATA["locales"]["tr"]["questions"][0]["q"])
            print(f"PASS app-preferred language continuity at {width}px",flush=True)
    finally:
        browser.quit()
        server.shutdown()

if __name__=="__main__":
    run()
