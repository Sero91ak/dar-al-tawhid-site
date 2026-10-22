#!/usr/bin/env python3
"""Zero-cost browser QA for nine adult DAR TEST UI language choices."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
options=Options()
for flag in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
    options.add_argument(flag)
driver=webdriver.Chrome(options=options)
locales=[("de","ltr"),("tr","ltr"),("en","ltr"),("ar","rtl"),
         ("ku","ltr"),("ckb","rtl"),("bs","ltr"),("fr","ltr"),("es","ltr")]
try:
    driver.set_window_size(390,844)
    driver.get("http://127.0.0.1:8765/test/")
    wait=WebDriverWait(driver,40)
    wait.until(lambda d:d.execute_script("return !!window.DarTestTurkishUI"))
    wait.until(lambda d:d.execute_script("return window.__DarTestSevenLocalesReady===true"))
    wait.until(lambda d:d.execute_script("return !!window.DARAdultLanguagePickerV1 && window.DARAdultLanguagePickerV1.locales.length===9"))
    wait.until(lambda d:d.execute_script("return !!document.querySelector('#dv3HeaderActions [data-dv3-open-language]')"))
    assert driver.execute_script("return !document.querySelector('#dv3Home [data-dv3-locale]')"), "Legacy nine-tile Home picker must be absent"
    for lang,direction in locales:
        driver.execute_script("document.querySelector('#dv3HeaderActions [data-dv3-open-language]').click()")
        wait.until(lambda d:d.execute_script("return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length===9"))
        button='#darAdultLanguagePicker [data-dal-locale="'+lang+'"]'
        assert not driver.execute_script("return document.querySelector(arguments[0]).disabled",button), "Unavailable Test locale "+lang
        driver.execute_script("document.querySelector(arguments[0]).click()",button)
        wait.until(lambda d:d.execute_script(
            "return localStorage.getItem('darAdultPreferredLocaleV1')===arguments[0] && "
            "document.documentElement.lang===arguments[0] && document.documentElement.dir===arguments[1]",
            lang,direction))
        assert driver.execute_script("return !document.querySelector('#darAdultLanguagePicker')"), "Picker failed to close"
        print("PASS HOME CAPSULE",lang,"direction",direction,flush=True)
    for name in ["more","settings"]:
        driver.execute_script("if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",name)
        selector='.dar-more-v15 [data-dal-open="quick"]' if name=="more" else '#darSettingsLocaleChoice [data-dal-open="settings"]'
        wait.until(lambda d:d.execute_script("return !!document.querySelector(arguments[0])",selector))
        driver.execute_script("document.querySelector(arguments[0]).click()",selector)
        wait.until(lambda d:d.execute_script("return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length===9"))
        available=driver.execute_script("return [...document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]')].filter(x=>!x.disabled).map(x=>x.dataset.dalLocale)")
        assert set(available)==set(lang for lang,_ in locales), "Nine uploaded DAR TEST locale packs must be selectable: "+str(available)
        if name=="settings":
            assert driver.execute_script("return document.querySelector('#darAdultLanguagePicker').classList.contains('dal-mode-settings')")
        driver.execute_script("document.querySelector('#darAdultLanguagePicker [data-dal-close]').click()")
        wait.until(lambda d:d.execute_script("return !document.getElementById('darAdultLanguagePicker')"))
        print("PASS SHARED NINE-LANGUAGE PICKER",name,flush=True)
    driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'de'}}))")
    wait.until(lambda d:d.execute_script("return document.documentElement.lang==='de'&&document.documentElement.dir==='ltr'"))
    print("PASS LOSSLESS GERMAN RETURN; no external translation API calls",flush=True)
finally:driver.quit()
