#!/usr/bin/env python3
"""Visitor Website/PWA Chrome regression for reuse of one Turkish adult UI pack."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

chrome=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
 chrome.add_argument(flag)
driver=webdriver.Chrome(options=chrome)
try:
 driver.set_window_size(430,930)
 driver.get("http://127.0.0.1:8765/")
 wait=WebDriverWait(driver,40)
 wait.until(lambda d:d.execute_script("return !!document.getElementById('appView')"))
 wait.until(lambda d:d.execute_script("return !!window.DAR_MORE_V15"))
 wait.until(lambda d:d.execute_script("return !!window.DARAdultUI18n"))
 wait.until(lambda d:d.execute_script("return window.DARAdultUI18n.catalogStatus==='loaded'"))
 expected=driver.execute_script("return window.DARAdultUI18n.translatedKeys")
 assert expected>=350, "Shared canonical UI catalog unavailable"
 driver.execute_script("if(typeof navigate==='function')navigate('more');else location.hash='#more'")
 wait.until(lambda d:d.execute_script("return !!document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]')"))
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]').click()")
 wait.until(lambda d:d.execute_script("return document.documentElement.lang==='tr'"))
 wait.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('İlim'))"""))
 assert driver.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')")=="tr"
 print("PASS visitor: One Turkish UI pack powers live-layout More, not just button state",flush=True)
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=de]').click()")
 wait.until(lambda d:d.execute_script("return document.documentElement.lang==='de'"))
 wait.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('Wissen'))"""))
 print("PASS visitor: Turkish reverses immediately back to German",flush=True)
 driver.execute_script("if(typeof navigate==='function')navigate('settings');else location.hash='#settings'")
 wait.until(lambda d:d.execute_script("return !!document.querySelector('#darAdultLanguageControl')"))
 print("PASS visitor: Settings also exposes German/Turkish control",flush=True)
finally:driver.quit()
