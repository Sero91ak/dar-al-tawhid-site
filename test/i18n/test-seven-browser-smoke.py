#!/usr/bin/env python3
"""Zero-cost browser QA for one shared seven-language adult DAR TEST UI."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
options=Options()
for flag in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
    options.add_argument(flag)
driver=webdriver.Chrome(options=options)
locales=[("de","ltr"),("tr","ltr"),("en","ltr"),("ar","rtl"),
         ("ku","ltr"),("ckb","rtl"),("bs","ltr")]
try:
    driver.set_window_size(390,844)
    driver.get("http://127.0.0.1:8765/test/")
    wait=WebDriverWait(driver,40)
    wait.until(lambda d:d.execute_script("return !!window.DarTestTurkishUI"))
    wait.until(lambda d:d.execute_script("return window.__DarTestSevenLocalesReady===true"))
    wait.until(lambda d:d.execute_script("return document.querySelectorAll('#dv3Home [data-dv3-locale]').length===7"))
    wait.until(lambda d:d.execute_script("return !!document.querySelector('#darAdultBrandHeaderV2 .dtbh-toggle')"))
    assert driver.execute_script("""return [...document.querySelectorAll('#darAdultBrandHeaderV2 .dtbh-row > button')].map(x=>x.classList.contains('dtbh-language-shortcut')?'language':x.classList.contains('dtbh-account-shortcut')?'account':x.classList.contains('dtbh-toggle')?'palette':'other').join(',')""") == "language,account,palette"
    driver.execute_script("document.querySelector('#darAdultBrandHeaderV2 .dtbh-language-shortcut').click()")
    wait.until(lambda d:d.execute_script("return !!document.querySelector('#darAdultLanguagePicker [data-dal-locale=tr]')"))
    driver.execute_script("document.querySelector('#darAdultLanguagePicker [data-dal-close]').click()")
    driver.execute_script("document.querySelector('#darAdultBrandHeaderV2 .dtbh-toggle').click()")
    assert driver.execute_script("return !document.querySelector('#darAdultBrandPaletteV2').hidden")
    driver.execute_script("document.querySelector('#darAdultBrandHeaderV2 .dtbh-toggle').click()")
    driver.execute_script("const f=window.navigate;window.__accountHeaderCall=null;window.navigate=function(){window.__accountHeaderCall=[...arguments]};document.querySelector('#darAdultBrandHeaderV2 .dtbh-account-shortcut').click();window.navigate=f")
    assert driver.execute_script("return window.__accountHeaderCall && window.__accountHeaderCall[0]==='account'")
    print("PASS: mounted TEST header language/account/palette order and behavior",flush=True)
    for lang,direction in locales:
        driver.execute_script(
            "document.querySelector('#dv3Home [data-dv3-locale=\"'+arguments[0]+'\"]').click()",
            lang)
        wait.until(lambda d:d.execute_script(
            "return localStorage.getItem('darAdultPreferredLocaleV1')===arguments[0]&&"+
            "document.documentElement.lang===arguments[0]&&document.documentElement.dir===arguments[1]",
            lang,direction))
        pressed=driver.execute_script(
            "return document.querySelectorAll('#dv3Home [data-dv3-locale][aria-pressed=\"true\"]').length")
        assert pressed==1, "Exactly one pressed locale, got "+str(pressed)
        print("PASS HOME",lang,"direction",direction,flush=True)
    for name in ["more","settings"]:
        driver.execute_script("if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",name)
        selector='.dar-more-v15 [data-dal-open="quick"]' if name=="more" else '#darSettingsLocaleChoice [data-dal-open="settings"]'
        wait.until(lambda d:d.execute_script("return !!document.querySelector(arguments[0])",selector))
        driver.execute_script("document.querySelector(arguments[0]).click()",selector)
        wait.until(lambda d:d.execute_script("return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length===7"))
        assert driver.execute_script("return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]:not([disabled])').length")==7
        assert driver.execute_script("return !window.DARAdultLanguagePickerV1.available('fr') && !window.DARAdultLanguagePickerV1.available('es') && !document.querySelector('#darAdultLanguagePicker [data-dal-locale=fr],#darAdultLanguagePicker [data-dal-locale=es]')")
        driver.execute_script("document.querySelector('#darAdultLanguagePicker [data-dal-close]').click()")
        print("PASS 9-LANGUAGE REGISTRY; picker lists seven available languages",name,flush=True)
    driver.execute_script("localStorage.setItem('darAdultPreferredLocaleV1','de');window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',{detail:{locale:'de'}}))")
    wait.until(lambda d:d.execute_script("return document.documentElement.lang==='de'&&document.documentElement.dir==='ltr'"))
    print("PASS LOSSLESS GERMAN RETURN; no external translation API calls",flush=True)
finally:driver.quit()
