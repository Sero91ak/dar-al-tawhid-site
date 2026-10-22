#!/usr/bin/env python3
"""Desktop adult picker: nine registered, only released navigation UI selectable."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options=Options()
for arg in ('--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu'):
    options.add_argument(arg)
driver=webdriver.Chrome(options=options)
try:
    driver.set_window_size(393,852)
    driver.get('http://127.0.0.1:8765/desktop-preview/index.html?page=einstellungen')
    wait=WebDriverWait(driver,35)
    wait.until(lambda d:d.execute_script("return document.querySelectorAll('#darV8LanguageSelect option').length===9"))
    wait.until(lambda d:d.execute_script("return document.querySelectorAll('#darV8LangMenu button[data-lang]').length===9"))
    state=driver.execute_script("""
    const s=document.getElementById('darV8LanguageSelect');
    const opts=[...s.options].map(o=>({code:o.value,disabled:o.disabled}));
    const menu=[...document.querySelectorAll('#darV8LangMenu button[data-lang]')].map(o=>({code:o.dataset.lang,disabled:o.disabled}));
    return {opts,menu}
    """)
    assert [o['code'] for o in state['opts']]==['de','ar','en','tr','ku','ckb','bs','fr','es'],state
    assert len([o for o in state['opts'] if not o['disabled']])==7,state
    assert len([o for o in state['menu'] if not o['disabled']])==7,state
    assert all(next(o for o in state['opts'] if o['code']==code)['disabled'] for code in ('fr','es')),state
    assert driver.execute_script("return !!window.DARV8Portal")
    driver.execute_script("window.DARV8Portal.selectLanguage('fr')")
    assert driver.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')")!='fr'
    driver.execute_script("window.DARV8Portal.selectLanguage('tr')")
    wait.until(lambda d:d.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')==='tr'"))
    assert driver.execute_script("return document.getElementById('darV8LanguageSelect').value")=='tr'
    driver.execute_script("window.DARV8Portal.selectLanguage('de')")
    wait.until(lambda d:d.execute_script("return document.getElementById('darV8LanguageSelect').value==='de'"))
    assert driver.execute_script("return document.querySelector('#darV8LangMenu [data-lang=de]').getAttribute('aria-pressed')")=='true'
    print('PASS 9 registered languages, 7 preview-ready, 2 coming soon; persisted selector',flush=True)
finally:
    driver.quit()
