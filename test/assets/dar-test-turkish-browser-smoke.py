#!/usr/bin/env python3
"""DAR TEST only: exercise real De/Tr DOM, avoiding fake localization via toggle state alone."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

chrome = Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
    chrome.add_argument(flag)

driver = webdriver.Chrome(options=chrome)
try:
    driver.set_window_size(390,844)
    driver.get("http://127.0.0.1:8765/test/")
    driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de')")
    driver.refresh()
    w = WebDriverWait(driver,35)
    w.until(lambda d: d.execute_script("return !!document.querySelector('#dv3Home [data-dv3-locale=tr]')"))
    w.until(lambda d: d.execute_script("return document.querySelector('#dv3LatestTitle')?.textContent==='Neueste Beiträge'"))
    driver.execute_script("document.querySelector('#dv3Home [data-dv3-locale=tr]').click()")
    w.until(lambda d: d.execute_script("return document.querySelector('#dv3LatestTitle')?.textContent==='Son Yazılar'"))
    assert driver.execute_script("return document.documentElement.lang") == "tr"
    assert driver.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')") == "tr"
    print("PASS Turkish: Home content localized (not just language selector)",flush=True)
    driver.execute_script("document.querySelector('#dv3Home [data-dv3-locale=de]').click()")
    w.until(lambda d: d.execute_script("return document.querySelector('#dv3LatestTitle')?.textContent==='Neueste Beiträge'"))
    assert driver.execute_script("return document.documentElement.lang") == "de"
    print("PASS German: reverse switch restores original labels",flush=True)
    driver.execute_script("document.querySelector('#dv3Home [data-dv3-locale=tr]').click()")
    driver.execute_script("if(typeof navigate==='function')navigate('more');else location.hash='#more'")
    w.until(lambda d: d.execute_script("return !!document.querySelector('.dar-more-v15 [data-dm-locale=tr]')"))
    w.until(lambda d: d.execute_script("return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(x=>x.textContent.includes('İlim'))"))
    print("PASS Turkish: More category localized",flush=True)
finally:
    driver.quit()
