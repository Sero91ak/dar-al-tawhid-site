#!/usr/bin/env python3
"""Read-only 15-route x 9-language browser QA for adult DAR TEST.

Tests persistence, language direction, SPA navigation and safe UI-control coverage.
Untranslated control candidates are recorded for review, not auto-published.
Does NOT translate authored content, religious passages, article bodies or source quotes.
"""
import json
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROUTES = ["home", "recent", "quran", "books", "bibliothek", "scholars",
          "duas", "hadith", "frauen", "propheten", "quiz", "prayer",
          "qibla", "settings", "more"]
LANGUAGES = ["de", "tr", "en", "ar", "ku", "ckb", "bs", "fr", "es"]
RTL = {"ar", "ckb"}
KEY = "darAdultPreferredLocaleV1"
CONTROL_SNAPSHOT = r"""
const controls = [];
for (const el of document.querySelectorAll(
 'button,label,summary,[role="tab"],[role="menuitem"],input[placeholder],textarea[placeholder]')) {
 if (el.closest('[data-dar-no-translate],[data-canonical-content],'+
                '[class*="post-content"],[class*="hadith-text"],[class*="quran-arabic"]')) continue;
 const st = getComputedStyle(el);
 if (st.display === "none" || st.visibility === "hidden" || el.getClientRects().length === 0) continue;
 const texts = [el.getAttribute("aria-label"), el.getAttribute("placeholder"),
                el.getAttribute("title"), el.textContent];
 for (let s of texts) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length > 1 && s.length <= 140 && !/[\u0600-\u06ff]/.test(s)) controls.push(s);
 }
}
return [...new Set(controls)];
"""
options = Options()
for flag in ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]:
    options.add_argument(flag)
driver = webdriver.Chrome(options=options)
records = []
try:
    driver.set_window_size(430, 930)
    driver.get("http://127.0.0.1:8765/test/")
    wait = WebDriverWait(driver, 40)
    wait.until(lambda d: d.execute_script("return !!window.DarTestTurkishUI && !!window.__DarTestSevenLocalesReady"))
    with open("test/i18n/adult-ui-locales-seven.json", encoding="utf-8") as handle:
        pack = json.load(handle)
    for locale in LANGUAGES:
        driver.execute_script("""
            localStorage.setItem(arguments[0],arguments[1]);
            window.dispatchEvent(new CustomEvent("dar-adult-locale-changed",
                {detail:{locale:arguments[1]}}));
        """, KEY, locale)
        direction = "rtl" if locale in RTL else "ltr"
        wait.until(lambda d: d.execute_script(
            "return document.documentElement.lang===arguments[0] && document.documentElement.dir===arguments[1]",
            locale, direction))
        dictionary = pack["translations"].get(locale, {})
        untranslated = set(dictionary)
        translated = set(dictionary.values())
        for route in ROUTES:
            driver.execute_script(
                "if(typeof navigate==='function')navigate(arguments[0]);else location.hash='#'+arguments[0]",
                route)
            wait.until(lambda d: d.execute_script(
                "return !!document.querySelector('#appView') && "
                "document.documentElement.lang===arguments[0] && "
                "localStorage.getItem(arguments[1])===arguments[0]", locale, KEY))
            time.sleep(.15)
            values = driver.execute_script(CONTROL_SNAPSHOT)
            german_matches = [] if locale == "de" else sorted(set(values) & untranslated)
            localized_matches = [] if locale == "de" else sorted(set(values) & translated)
            records.append({"language": locale, "route": route, "direction": direction,
                            "controls": len(values), "knownGermanLabels": german_matches[:35],
                            "translatedControlCount": len(localized_matches)})
            print("SUBPAGE", locale, route, "controls", len(values),
                  "localized", len(localized_matches),
                  "known German", len(german_matches), flush=True)
        assert driver.execute_script("return localStorage.getItem(arguments[0])", KEY) == locale
    driver.execute_script("""
        localStorage.setItem(arguments[0],"de");
        window.dispatchEvent(new CustomEvent("dar-adult-locale-changed",
            {detail:{locale:"de"}}));
    """, KEY)
    wait.until(lambda d: d.execute_script(
        "return document.documentElement.lang==='de' && document.documentElement.dir==='ltr'"))
finally:
    driver.quit()

os.makedirs("test/i18n/qa", exist_ok=True)
with open("test/i18n/qa/browser-subpages-nine.json", "w", encoding="utf-8") as out:
    json.dump({"scope":"adult-test-ui-controls-only", "routes":ROUTES,
               "languages":LANGUAGES, "records":records,
               "note":"German hits are review candidates; source titles and authored content are excluded."},
              out, indent=2, ensure_ascii=False)
print("PASS 135 language-route checks, RTL, persistent preference, German reset; "
      "read-only untranslated-control report written", flush=True)
