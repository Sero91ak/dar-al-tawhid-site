#!/usr/bin/env python3
"""Browser smoke for the staged-only adult locale release gate.
Public website/Android PWA use German until review; DAR TEST keeps available
language packs. Static HTTP test, not a claim of Cloudflare deployment.
"""
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

root=Path("index.html").read_text(encoding="utf8")
assert "/assets/dar-more-v15.js?v=" in root, "Missing canonical adult More module"
chrome=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
    chrome.add_argument(flag)
driver=webdriver.Chrome(options=chrome)
try:
    driver.set_window_size(430,930)
    wait=WebDriverWait(driver,40)
    # Production asset context; visitor English/Turkish/etc are not released.
    driver.get("http://127.0.0.1:8765/assets/i18n/")
    driver.execute_script("""
       document.body.innerHTML='<main id="appView"></main>';
       const s=document.createElement('script');
       s.src='/assets/dar-more-v15.js?v=visitor-language-gate-qa';
       document.head.appendChild(s);
    """)
    wait.until(lambda d:d.execute_script(
        "return !!window.DAR_MORE_V15 && !!window.DARAdultUI18n && !!window.DARAdultLanguagePickerV1"))
    wait.until(lambda d:d.execute_script(
        "return window.DARAdultUI18n.catalogStatus==='unreleased'"))
    assert driver.execute_script(
        "return window.DARAdultUI18n.translatedKeys") == 0
    driver.execute_script("""
      document.getElementById('appView').innerHTML=window.DAR_MORE_V15.render(
       [{id:'quran',nav:'quran',title:'Qurʾān',desc:'Lesen & suchen',group:'Lernen & Wissen'}],
       (title)=>'<header><h2>'+title+'</h2></header>');
      window.DAR_MORE_V15.sync();
    """)
    wait.until(lambda d:d.execute_script(
        "return !!document.querySelector('.dar-more-v15 [data-dal-open=quick]')"))
    driver.execute_script(
        "document.querySelector('.dar-more-v15 [data-dal-open=quick]').click()")
    wait.until(lambda d:d.execute_script(
        "return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length===1"))
    assert driver.execute_script(
        "return !!document.querySelector('#darAdultLanguagePicker [data-dal-locale=de]')")
    assert not driver.execute_script(
        "return !!document.querySelector('#darAdultLanguagePicker [data-dal-locale=tr]')")
    driver.execute_script("""
      window.DARAdultLanguagePickerV1.close();
      localStorage.setItem('darAdultPreferredLocaleV1','tr');
      window.dispatchEvent(new Event('dar-adult-locale-changed'));
    """)
    assert driver.execute_script(
        "return window.DARAdultLanguagePickerV1.read()==='de' && window.DARAdultUI18n.locale()==='de'")
    assert not driver.execute_script(
        "return window.DARAdultUI18n.setLocale('tr')")
    print("PASS visitor: Turkish is hidden and blocked, persisted TEST preference safely ignored",flush=True)
    driver.execute_script("""
      document.getElementById('appView').innerHTML=
       '<div class="dsh-shell dsh-home"><div class="dsh-welcome">Einstellungen</div></div>';
    """)
    wait.until(lambda d:d.execute_script(
        "return !!document.querySelector('#darAdultLanguageControl [data-dal-open=settings]')"))
    driver.execute_script(
        "document.querySelector('#darAdultLanguageControl [data-dal-open=settings]').click()")
    wait.until(lambda d:d.execute_script(
        "return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length===1"))
    print("PASS visitor Settings: German only",flush=True)

    # Same shared picker on /test; static Turkish test runtime is still valid.
    driver.get("http://127.0.0.1:8765/test/assets/")
    driver.execute_script("""
      document.body.innerHTML='<main id="appView"></main>';
      for(const src of ['/test/assets/dar-test-turkish-ui.js?v=visitor-gate-qa',
                        '/assets/i18n/adult-language-picker-v1.js?v=visitor-gate-qa']){
        const script=document.createElement('script');script.src=src;document.head.appendChild(script);
      }
    """)
    wait.until(lambda d:d.execute_script(
        "return !!window.DarTestTurkishUI && !!window.DARAdultLanguagePickerV1"))
    wait.until(lambda d:d.execute_script(
        "return window.DarTestTurkishUI.translatedKeys>0"))
    assert driver.execute_script(
        "return window.DARAdultLanguagePickerV1.available('tr')")
    driver.execute_script("window.DARAdultLanguagePickerV1.open('quick')")
    wait.until(lambda d:d.execute_script(
        "return document.querySelectorAll('#darAdultLanguagePicker [data-dal-locale]').length>=2 && !document.querySelector('#darAdultLanguagePicker [data-dal-locale][disabled]')"))
    driver.execute_script(
        "document.querySelector('#darAdultLanguagePicker [data-dal-locale=tr]').click()")
    wait.until(lambda d:d.execute_script(
        "return window.DARAdultLanguagePickerV1.read()==='tr'"))
    assert driver.execute_script(
        "return localStorage.getItem('darAdultPreferredLocaleV1')==='tr'")
    print("PASS DAR TEST: Turkish remains selectable, nine-language registry intact",flush=True)
finally:
    driver.quit()
