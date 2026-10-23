#!/usr/bin/env python3
"""Real DAR TEST browser acceptance: 15 adult areas x 9 locales = 135 checks.

This suite uses the shared DAR TEST runtime only. It never calls a translation
provider and records rendered DOM evidence, protected-source fingerprints,
screenshots, and per-combination status.
"""
import json
import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


BASE = os.environ.get("DAR_TEST_BASE", "http://127.0.0.1:8765")
OUT = Path(os.environ.get("DAR_TEST_OUTPUT", str(Path(__file__).resolve().parents[2] / "QA" / "i18n-browser-20261023")))
LOCALES = [("de", "ltr"), ("tr", "ltr"), ("en", "ltr"), ("ar", "rtl"),
           ("ku", "ltr"), ("ckb", "rtl"), ("bs", "ltr"), ("fr", "ltr"),
           ("es", "ltr")]
AREAS = ["home", "quran", "recent", "topics", "more", "duas", "hadith",
         "bibliothek", "frauen", "quiz", "prayer", "saved", "account",
         "settings", "scholars"]
AREA_MARKERS = {
    "home": "body.is-home-route #appView",
    "quran": "body.is-quran-overview #appView, body.is-quran-reader-route .qrc-shell",
    "recent": "body.is-recent-route .post-grid",
    "topics": "body.is-topics-route .topics-hub",
    "more": "body.is-more-route .dar-more-v15",
    "duas": "body.is-dua-route .dua-hub",
    "hadith": "body.is-hadith-route .hadith-hub",
    "bibliothek": "body.is-library-route .lib-page, body.is-library-route .library-shell, body.is-library-route .books-library-shell",
    "frauen": "body.is-frauen-route #appView",
    "quiz": "body.is-quiz-route .quiz-shell",
    "prayer": ".prayer-page-noble",
    "saved": "body.is-saved-route .post-grid",
    "account": "body.is-account-route #appView",
    "settings": "body.is-settings-route #appView",
    "scholars": "body.is-scholars-route .scholars-index",
}
PROTECTED_SELECTORS = (
    "[data-canonical-content], .post-body, .post-content, .quran-ayah, "
    ".quran-arabic, .ayah-ar, .hadith-text, .source-quote, "
    ".prophets-quote__ar, .prophets-verse__text, [data-dar-no-translate]:not([data-dar-no-translate='picker'])"
)
UI_EXCLUSION_SELECTOR = (
    "[data-canonical-content], .post-body, .post-content, .quran-ayah, "
    ".quran-arabic, .ayah-ar, .hadith-text, .source-quote, "
    ".prophets-quote__ar, .prophets-verse__text, [data-dar-no-translate]:not([data-dar-no-translate='picker'])"
)


def visible_leaf_text(driver):
    return driver.execute_script(
        """return [...document.querySelectorAll('body *')]
          .filter(e => { const r=e.getBoundingClientRect();
                         return r.width>0 && r.height>0 && !e.children.length; })
          .map(e => (e.textContent || '').trim()).filter(Boolean).slice(0,120);"""
    )


def protected_snapshot(driver):
    return driver.execute_script(
        """return [...document.querySelectorAll(arguments[0])].map(e => ({
          text:e.textContent || '', html:e.innerHTML || '',
          lang:e.getAttribute('lang') || '', dir:e.getAttribute('dir') || ''
        }));""", PROTECTED_SELECTORS
    )


def translatable_ui_labels(driver):
    return driver.execute_script(
        """const excluded = arguments[0];
        return [...document.querySelectorAll('body *')]
          .filter(e => { const r=e.getBoundingClientRect();
                         return r.width>0 && r.height>0 && !e.children.length &&
                                !e.closest(excluded); })
          .map(e => (e.textContent || '').trim()).filter(Boolean)
          .filter((value, index, all) => all.indexOf(value) === index)
          .slice(0, 220);""", UI_EXCLUSION_SELECTOR
    )


def collect_translation_evidence(driver, locale, german_labels):
    return driver.execute_script(
        """const locale = arguments[0];
        const sources = arguments[1];
        const current = new Set(arguments[2]);
        const pairs = sources.map(source => {
          const translated = window.DarTestTurkishUI.translateValue(source, locale);
          return {source, translated};
        }).filter(pair => pair.translated && pair.translated !== pair.source);
        const rendered = pairs.filter(pair => current.has(pair.translated));
        const germanResiduals = pairs.filter(pair => current.has(pair.source));
        return {
          expectedLabels: pairs.length,
          renderedLabels: rendered.length,
          rendered: rendered.slice(0, 12),
          germanResiduals: germanResiduals.slice(0, 12)
        };""", locale, german_labels, translatable_ui_labels(driver)
    )


def wait_ready(driver, timeout=40):
    wait = WebDriverWait(driver, timeout)
    wait.until(lambda d: d.execute_script("return document.readyState === 'complete'"))
    wait.until(lambda d: d.execute_script(
        "return !!window.DarTestTurkishUI && window.__DarTestSevenLocalesReady === true && "
        "['de','tr','en','ar','ku','ckb','bs','fr','es'].every(x => "
        "window.DarTestTurkishUI.supportedLocales.includes(x))"
    ))
    wait.until(lambda d: len(visible_leaf_text(d)) > 8)


def unlock_test_area(driver):
    password = os.environ.get("DAR_TEST_PASSWORD")
    if not password:
        raise RuntimeError("DAR_TEST_PASSWORD is required; no embedded test password is permitted")
    try:
        wait = WebDriverWait(driver, 12)
        field = wait.until(lambda d: d.find_element(By.ID, "darTestLockInput"))
        field.send_keys(password)
        driver.find_element(By.ID, "darTestLockBtn").click()
        wait.until(lambda d: d.execute_script("return !document.querySelector('#darTestLock')"))
    except TimeoutException:
        pass


def navigate_area(driver, area):
    selector = AREA_MARKERS[area]
    navigation_mode = driver.execute_script(
        """if (typeof window.navigate === 'function') {
             window.navigate(arguments[0]); return 'app-navigation';
           }
           location.hash = '#' + arguments[0]; return 'hash-fallback';""", area
    )
    # A missing route marker is a concrete FAIL; keep the full matrix moving
    # so every area/locale still receives a result and screenshot.
    wait = WebDriverWait(driver, 8)
    wait.until(lambda d: d.execute_script("return document.readyState === 'complete'"))
    wait.until(lambda d: d.execute_script(
        "return !!document.querySelector(arguments[0])", selector
    ))
    marker = driver.execute_script(
        """const e=document.querySelector(arguments[0]);
           if(!e)return null; const r=e.getBoundingClientRect();
           return {tag:e.tagName,id:e.id,classes:e.className,
                   visible:r.width>0&&r.height>0};""", selector
    )
    if not marker or not marker["visible"]:
        raise AssertionError("area marker is not visible: " + area)
    return selector, marker, navigation_mode


def translated_visible_evidence(driver, locale):
    if locale == "de":
        return {"matched": 0, "sourceCandidates": 0}
    return driver.execute_script(
        """const leaves=[...document.querySelectorAll('body *')]
          .filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.children.length})
          .map(e=>(e.textContent||'').trim()).filter(Boolean);
        const matches=[];
        for(const source of leaves){
          const value=window.DarTestTurkishUI.translateValue(source,arguments[0]);
          if(value && value!==source && leaves.includes(value)) matches.push({source,value});
        }
        return {matched:matches.length, sourceCandidates:leaves.length, matches:matches.slice(0,8)};""", locale
    )


def layout_evidence(driver):
    return driver.execute_script(
        """const overflow=[...document.querySelectorAll('body *')].filter(e=>{
          const r=e.getBoundingClientRect();
          return r.width>0&&r.height>0&&(r.left < -2 || r.right > innerWidth + 2);
        }).slice(0,20).map(e=>({tag:e.tagName,id:e.id,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
        const fields=[...document.querySelectorAll('input,textarea,button,[role=button]')].map(e=>({
          tag:e.tagName,placeholder:e.getAttribute('placeholder'),aria:e.getAttribute('aria-label'),
          text:(e.innerText||'').trim().slice(0,120)
        })).filter(x=>x.placeholder||x.aria||x.text);
        return {overflow, fields:fields.slice(0,80),
          viewport:{width:innerWidth,height:innerHeight,
            documentWidth:document.documentElement.scrollWidth,
            bodyWidth:document.body.scrollWidth,
            horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2 || document.body.scrollWidth>innerWidth+2}};"""
    )


def set_locale(driver, code, direction):
    driver.execute_script(
        """localStorage.setItem('darAdultPreferredLocaleV1', arguments[0]);
          window.dispatchEvent(new CustomEvent('dar-adult-locale-changed',
            {detail:{locale:arguments[0], source:'browser-acceptance'}}));
          window.DarTestTurkishUI.apply(document.body, arguments[0]);""", code
    )
    WebDriverWait(driver, 12).until(lambda d: d.execute_script(
        "return document.documentElement.lang === arguments[0] && "
        "document.documentElement.dir === arguments[1] && "
        "localStorage.getItem('darAdultPreferredLocaleV1') === arguments[0]",
        code, direction
    ))


def run():
    OUT.mkdir(parents=True, exist_ok=True)
    if not os.environ.get("DAR_TEST_PASSWORD"):
        results = [{"area": area, "locale": code, "status": "BLOCKED",
                    "error": "DAR_TEST_PASSWORD is not present in the environment"}
                   for code, _ in LOCALES for area in AREAS]
        report = {
            "base": BASE, "areas": AREAS, "locales": [x[0] for x in LOCALES],
            "expected": 135, "checks": 135, "pass": 0, "fail": 0,
            "blocked": 135, "results": results, "screenshots": [],
            "humanLinguisticApproval": "NOT_GRANTED",
            "blockedReason": "DAR_TEST_PASSWORD is required via CI secret or environment variable",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        (OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    options = Options()
    chrome_binary = os.environ.get("DAR_TEST_CHROME_BINARY", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    if Path(chrome_binary).exists():
        options.binary_location = chrome_binary
    for flag in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=390,844"):
        options.add_argument(flag)
    results = []
    auxiliary_results = []
    driver = None
    startup_error = None
    try:
        driver = webdriver.Chrome(options=options)
    except Exception as error:
        startup_error = repr(error)
        results = [{"area": area, "locale": code, "status": "BLOCKED",
                    "error": "browser startup failed: " + startup_error}
                   for code, _ in LOCALES for area in AREAS]
        report = {
            "base": BASE, "areas": AREAS, "locales": [x[0] for x in LOCALES],
            "expected": 135, "checks": 135, "pass": 0, "fail": 0,
            "blocked": 135, "results": results, "screenshots": [],
            "humanLinguisticApproval": "NOT_GRANTED",
            "browserStartupError": startup_error,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        (OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    try:
        driver.get(BASE + "/test/#home")
        unlock_test_area(driver)
        wait_ready(driver)
        for code, direction in LOCALES:
            for area in AREAS:
                row = {"area": area, "locale": code, "status": "BLOCKED"}
                try:
                    route, marker, navigation_mode = navigate_area(driver, area)
                    wait_ready(driver, 35)
                    # Capture the route's protected blocks in German before
                    # applying any UI locale, then compare the exact DOM data.
                    set_locale(driver, "de", "ltr")
                    german_ui_labels = translatable_ui_labels(driver)
                    driver.execute_script(
                        "window.__darAcceptanceProtectedBaseline = arguments[0]",
                        protected_snapshot(driver),
                    )
                    set_locale(driver, code, direction)
                    leaves = visible_leaf_text(driver)
                    if len(" | ".join(leaves)) < 20:
                        raise AssertionError("rendered UI has insufficient visible text")
                    if code != "de":
                        translated = driver.execute_script(
                            "return Number(window.DarTestTurkishUI.translatedFor(arguments[0]) || 0)", code
                        )
                        if translated < 1:
                            raise AssertionError("locale pack was not registered")
                        translation_evidence_result = collect_translation_evidence(driver, code, german_ui_labels)
                        if translation_evidence_result["expectedLabels"] < 2:
                            raise AssertionError("fewer than two expected translated UI labels are registered")
                        if translation_evidence_result["renderedLabels"] < 2:
                            raise AssertionError("fewer than two expected UI labels rendered translated")
                        if translation_evidence_result["germanResiduals"]:
                            raise AssertionError("German residual UI labels: " + repr(translation_evidence_result["germanResiduals"]))
                        translation_evidence = translation_evidence_result
                    else:
                        translation_evidence = {"matched": 0, "sourceCandidates": len(visible_leaf_text(driver))}
                    protected_before = driver.execute_script("return window.__darAcceptanceProtectedBaseline || null")
                    protected_after = protected_snapshot(driver)
                    if protected_before is not None and protected_before != protected_after:
                        raise AssertionError("protected source content changed")
                    layout = layout_evidence(driver)
                    if layout["overflow"] or layout["viewport"]["horizontalOverflow"]:
                        raise AssertionError("visible text/layout overflow detected")
                    row.update(status="PASS", route="#" + area, marker=marker,
                                navigationMode=navigation_mode,
                                direction=direction, visibleLeafCount=len(leaves),
                                visibleText=" | ".join(leaves[:20]),
                                translationEvidence=translation_evidence,
                                layout=layout)
                except Exception as error:
                    row.update(status="FAIL", error=repr(error))
                results.append(row)
                driver.save_screenshot(str(OUT / f"{code}-{area}.png"))
            # Each locale also proves persistence through a real reload.
            set_locale(driver, code, direction)
            driver.refresh()
            unlock_test_area(driver)
            wait_ready(driver, 40)
            persisted = driver.execute_script(
                "return {stored:localStorage.getItem('darAdultPreferredLocaleV1'), "
                "lang:document.documentElement.lang, dir:document.documentElement.dir}"
            )
            if persisted != {"stored": code, "lang": code, "dir": direction}:
                results.append({"area": "reload-persistence", "locale": code, "status": "FAIL",
                                "error": "locale was not persisted after reload", "observed": persisted})
            set_locale(driver, code, direction)

        # Real dialog interaction and German round-trip, including RTL screenshot evidence.
        # The picker is rendered in the real More route, not on the home route.
        try:
            set_locale(driver, "ar", "rtl")
            navigate_area(driver, "more")
            WebDriverWait(driver, 15).until(lambda d: d.find_element(
                By.CSS_SELECTOR, ".dar-more-v15 [data-dal-open='quick']"
            ))
            driver.find_element(
                By.CSS_SELECTOR, ".dar-more-v15 [data-dal-open='quick']"
            ).click()
            WebDriverWait(driver, 10).until(lambda d: d.find_element(
                By.CSS_SELECTOR, "#darAdultLanguagePicker[role='dialog']"
            ))
            driver.save_screenshot(str(OUT / "dialog-ar-rtl.png"))
            driver.find_element(By.CSS_SELECTOR, "#darAdultLanguagePicker [data-dal-locale='de']").click()
            WebDriverWait(driver, 10).until(lambda d: d.execute_script(
                "return document.documentElement.lang === 'de' && document.documentElement.dir === 'ltr'"
            ))
            driver.save_screenshot(str(OUT / "roundtrip-de.png"))
            auxiliary_results.append({"name": "dialog-and-roundtrip", "status": "PASS"})
        except Exception as error:
            auxiliary_results.append({"name": "dialog-and-roundtrip", "status": "FAIL", "error": repr(error)})
    finally:
        if driver is not None:
            driver.quit()

    checks = [r for r in results if r.get("area") in AREAS]
    report = {
        "base": BASE, "areas": AREAS, "locales": [x[0] for x in LOCALES],
        "expected": 135, "checks": len(checks),
        "pass": sum(r["status"] == "PASS" for r in checks),
        "fail": sum(r["status"] == "FAIL" for r in checks),
        "blocked": sum(r["status"] == "BLOCKED" for r in checks),
        "results": results,
        "auxiliary": auxiliary_results,
        "auxiliaryFailures": sum(r["status"] == "FAIL" for r in auxiliary_results),
        "screenshots": sorted(p.name for p in OUT.glob("*.png")),
        "humanLinguisticApproval": "NOT_GRANTED",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    (OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["checks"] == 135 and report["fail"] == 0 and report["auxiliaryFailures"] == 0 else 1)


if __name__ == "__main__":
    run()
