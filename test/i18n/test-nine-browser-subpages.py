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
const rows = [], attrs = [], seen = new Set();
const excluded = '[data-dar-no-translate],[data-canonical-content],'+
                 '[class*="post-content"],[class*="post-body"],'+
                 '[class*="hadith-text"],[class*="quran-arabic"],'+
                 '[class*="source-quote"],[class*="verse-translation"],'+
                 '[class*="dua-meaning"],[lang="ar"]';
function visible(el) {
 const forbidden=el.closest(excluded+', [hidden], [aria-hidden="true"]');
 // <html lang="ar"> is the UI locale, not a Quran/Arabic content block.
 if (forbidden && forbidden !== document.documentElement) return false;
 const s = getComputedStyle(el);
 return s.display !== 'none' && s.visibility !== 'hidden' &&
        el.getClientRects().length > 0;
}
function add(value, kind) {
 const s=String(value||'').replace(/\s+/g,' ').trim();
 if (s.length < 2 || s.length > 140 || /[<>]/.test(s)) return;
 const hash=kind+'\t'+s;
 if (seen.has(hash)) return;
 seen.add(hash);rows.push({kind:kind,text:s});
}
for (const el of document.querySelectorAll(
 'button,label,summary,[role="tab"],[role="menuitem"],input[placeholder],textarea[placeholder],[aria-label],[title]')) {
 if (!visible(el)) continue;
 for (const prop of ['placeholder','aria-label','title']) {
  const value=el.getAttribute(prop);
  if (value) { add(value,prop); attrs.push(value.replace(/\s+/g,' ').trim()); }
 }
 if (el.matches('button,label,summary,[role="tab"],[role="menuitem"]')) {
  // Include only short leaf label nodes; never swallow a full article/card body.
  for (const child of el.childNodes)
   if (child.nodeType === Node.TEXT_NODE) add(child.nodeValue,'text');
 }
}
return {rows:rows, attributes:[...new Set(attrs)],
        visibleCharacters:(document.querySelector('#appView')?.innerText||'').trim().length};
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
            time.sleep(.15)
            snapshot = driver.execute_script(CONTROL_SNAPSHOT)
            values = {x["text"] for x in snapshot["rows"]}
            attributes = set(snapshot["attributes"])
            # Only genuinely translated interface labels count as a known-German leak.
            # Identical words/proper names and religious-source titles are excluded.
            translatable = {k for k,v in dictionary.items() if v != k}
            german_matches = [] if locale == "de" else sorted(values & translatable)
            german_attributes = [] if locale == "de" else sorted(attributes & translatable)
            localized_matches = [] if locale == "de" else sorted(values & translated)
            records.append({"language": locale, "route": route, "direction": direction,
                            "controls": len(snapshot["rows"]),
                            "visibleCharacters": snapshot["visibleCharacters"],
                            "knownGermanLabels": german_matches,
                            "knownGermanAttributes": german_attributes,
                            "translatedControlCount": len(localized_matches)})
            print("SUBPAGE", locale, route, "controls", len(snapshot["rows"]),
                  "localized", len(localized_matches), "German UI", len(german_matches),
                  "German attributes", len(german_attributes), flush=True)
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
failed_attributes = [item for item in records if item["knownGermanAttributes"]]
blank_routes = [item for item in records if item["visibleCharacters"] < 10]
empty_control_locales = [code for code in LANGUAGES
                         if not any(item["controls"] > 0 for item in records
                                    if item["language"] == code)]
assert len(records) == len(ROUTES) * len(LANGUAGES), "Incomplete route-language scan"
assert not failed_attributes, "German UI attribute fallbacks: " + str(failed_attributes[:15])
assert not blank_routes, "Blank subpage routes: " + str(blank_routes[:15])
assert not empty_control_locales, "Locale UI controls were not captured: " + str(empty_control_locales)
print("PASS 135 language-route checks, RTL, persistent preference, German reset, "
      "no known German UI attribute fallbacks and no blank routes; "
      "untranslated-control report written", flush=True)
