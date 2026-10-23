#!/usr/bin/env python3
"""DAR TEST browser acceptance: 15 adult areas x 9 locales = 135 checks."""
import json, os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get("DAR_TEST_BASE", "http://127.0.0.1:8765")
PASSWORD = os.environ.get("DAR_TEST_PASSWORD", "")
OUT = Path(__file__).resolve().parents[2] / "QA" / "i18n-browser-20261023"
OUT.mkdir(parents=True, exist_ok=True)
LOCALES = [("de", "ltr"), ("tr", "ltr"), ("en", "ltr"), ("ar", "rtl"), ("ku", "ltr"), ("ckb", "rtl"), ("bs", "ltr"), ("fr", "ltr"), ("es", "ltr")]
AREAS = ["home", "quran", "recent", "topics", "more", "duas", "hadith", "bibliothek", "frauen", "quiz", "prayer", "saved", "account", "settings", "scholars"]

def main():
    options = Options()
    for flag in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"):
        options.add_argument(flag)
    driver = webdriver.Chrome(options=options)
    results, failures = [], []

    def js(code, *args):
        return driver.execute_script(code, *args)

    def wait_ready():
        wait = WebDriverWait(driver, 35)
        wait.until(lambda d: d.execute_script("return document.readyState === 'complete'"))
        wait.until(lambda d: d.execute_script("return !!window.DarTestTurkishUI && window.__DarTestSevenLocalesReady === true"))
        wait.until(lambda d: len((d.execute_script("return document.body.innerText || ''") or "").strip()) > 80)

    def select_locale(code, direction):
        js("localStorage.setItem('darAdultPreferredLocaleV1', arguments[0]); window.dispatchEvent(new CustomEvent('dar-adult-locale-changed', {detail:{locale:arguments[0]}})); window.DarTestTurkishUI.apply()", code)
        WebDriverWait(driver, 8).until(lambda d: js("return document.documentElement.lang === arguments[0] && document.documentElement.dir === arguments[1]", code, direction))

    try:
        driver.set_window_size(390, 844)
        driver.get(BASE + "/test/#home")
        if driver.find_elements("id", "darTestLock"):
            if not PASSWORD:
                raise RuntimeError("DAR_TEST_PASSWORD is required because the isolated DAR TEST page presents its login gate")
            driver.find_element("id", "darTestLockInput").send_keys(PASSWORD)
            driver.find_element("id", "darTestLockBtn").click()
            WebDriverWait(driver, 10).until(lambda d: not d.find_elements("id", "darTestLock"))
        wait_ready()
        source = js("return [...document.querySelectorAll('[data-canonical-content],.post-body,.quran-ayah,[dir=rtl]')].slice(0,20).map(x=>x.textContent).join('\\n')")
        for code, direction in LOCALES:
            for area in AREAS:
                try:
                    js("location.hash = '#' + arguments[0]", area)
                    wait_ready()
                    select_locale(code, direction)
                    visible = js("return [...document.querySelectorAll('body *')].filter(x=>{let r=x.getBoundingClientRect();return r.width>0&&r.height>0&&!x.children.length}).map(x=>x.textContent.trim()).filter(Boolean).slice(0,80).join('|')")
                    if len(visible) < 20:
                        raise AssertionError("insufficient rendered leaf text")
                    if js("return localStorage.getItem('darAdultPreferredLocaleV1')") != code:
                        raise AssertionError("locale not persisted")
                    if js("return [...document.querySelectorAll('[data-canonical-content],.post-body,.quran-ayah,[dir=rtl]')].slice(0,20).map(x=>x.textContent).join('\\n')") != source:
                        raise AssertionError("canonical/source text changed")
                    results.append({"area": area, "locale": code, "status": "PASS", "visibleChars": len(visible)})
                except Exception as error:
                    failures.append({"area": area, "locale": code, "status": "FAIL", "error": str(error)})
                if area == "home":
                    driver.save_screenshot(str(OUT / (code + "-home.png")))
        for code, direction in LOCALES[1:]:
            select_locale(code, direction)
            driver.refresh()
            wait_ready()
            if js("return document.documentElement.lang") != code:
                failures.append({"area": "reload-persistence", "locale": code, "status": "FAIL", "error": "locale lost"})
        js("location.hash = '#home'")
        WebDriverWait(driver, 15).until(lambda d: js("return !!document.querySelector('[data-v8-action=language]')"))
        js("document.querySelector('[data-v8-action=language]').click()")
        WebDriverWait(driver, 10).until(lambda d: js("return !!document.querySelector('#darAdultLanguagePicker[role=dialog]')"))
        driver.save_screenshot(str(OUT / "dialog-rtl.png"))
        js("document.querySelector('#darAdultLanguagePicker [data-dal-locale=de]').click()")
        report = {"base": BASE, "areas": AREAS, "locales": [x[0] for x in LOCALES], "expected": 135, "checks": len(results), "passed": len(results) - len(failures), "failed": failures, "screenshots": sorted(x.name for x in OUT.glob("*.png")), "humanLinguisticApproval": "NOT_GRANTED"}
        (OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
        raise SystemExit(1 if failures or len(results) != 135 else 0)
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
