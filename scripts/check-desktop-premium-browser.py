#!/usr/bin/env python3
"""Desktop-only acceptance: real Chromium on canonical website route and generated data."""
from __future__ import annotations
import json
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE = "http://127.0.0.1:8765/desktop-preview/index.html?page=start"
DATA = Path(__file__).resolve().parents[1] / "data" / "desktop-posts-index.json"

def check() -> None:
    if not DATA.exists():
        raise RuntimeError("Canonical desktop post index missing; run node scripts/build-desktop-posts-index.js")
    rows = json.loads(DATA.read_text(encoding="utf-8")).get("posts", [])
    if not rows:
        raise RuntimeError("No published post fixtures; cannot verify home carousel")
    opt = Options()
    for flag in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"):
        opt.add_argument(flag)
    browser = webdriver.Chrome(options=opt)
    try:
        for name, width, height in (("phone", 390, 844), ("fold", 840, 900), ("tablet", 1024, 768), ("desktop", 1440, 900)):
            browser.set_window_size(width, height)
            browser.get(BASE)
            WebDriverWait(browser, 25).until(
                lambda d: len(d.find_elements(By.CSS_SELECTOR, ".dar-desktop-premium-recent .dar-desktop-recent-slide")) > 0
            )
            capsule = browser.find_element(By.CSS_SELECTOR, "#pageRoot .dar-desktop-premium-recent")
            slides = browser.find_elements(By.CSS_SELECTOR, ".dar-desktop-recent-slide")
            assert capsule.is_displayed(), f"{name}: premium capsule missing"
            assert len(slides) >= 1, f"{name}: no displayed posts"
            assert browser.execute_script("return document.querySelectorAll('#pageRoot .dar-desktop-premium-recent').length") == 1, f"{name}: duplicate capsule"
            v = browser.execute_script("""
                const c=document.querySelector('.dar-desktop-premium-recent');
                const doc=document.documentElement;
                const m=document.querySelector('meta[name="viewport"]');
                const track=c.querySelector('.dar-desktop-recent-track');
                return {overflow:doc.scrollWidth-innerWidth,
                    cardOverflow:c.scrollWidth-c.clientWidth,
                    snap:getComputedStyle(track).scrollSnapType,
                    maxWidth:c.getBoundingClientRect().width,
                    viewport:m&&m.content,
                    title:!!c.querySelector('.dar-desktop-recent-title'),
                    source:!!c.querySelector('.dar-desktop-recent-read[href*="page=beitrag"]')};
            """)
            assert v["overflow"] < 5, f"{name}: horizontal document overflow {v}"
            assert v["cardOverflow"] < 5, f"{name}: card overflow {v}"
            assert v["maxWidth"] <= width+2 and v["title"] and v["source"], f"{name}: content constraints {v}"
            assert "mandatory" in v["snap"], f"{name}: CSS Scroll Snap missing"
            assert "user-scalable=no" not in (v["viewport"] or ""), f"{name}: browser zoom disabled"
            toggle = capsule.find_element(By.CSS_SELECTOR, ".dar-desktop-recent-toggle")
            # The legacy website sets scroll-behavior:smooth globally. Browser
            # automation (and keyboard activation) must reach this deeply placed
            # control before trying to click it.
            browser.execute_script("""
                document.documentElement.style.scrollBehavior='auto';
                arguments[0].scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
            """, toggle)
            hit = browser.execute_script("""
                const b=arguments[0],r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
                const target=document.elementFromPoint(cx,cy);
                return {top:r.top,bottom:r.bottom,height:innerHeight,scrollY:scrollY,
                    hit:target&&target.tagName+' '+target.className,
                    clickable:!!(target&&(target===b||b.contains(target)))};
            """, toggle)
            assert hit["clickable"], f"{name}: toggle obstructed or out of viewport {hit}"
            toggle.click()
            assert toggle.get_attribute("aria-expanded") == "true", f"{name}: disclosure not expanded"
            assert capsule.find_element(By.ID, "darDesktopRecentFlatList").is_displayed(), f"{name}: flat list hidden"
            assert len(capsule.find_elements(By.CSS_SELECTOR, ".dar-desktop-recent-list-row")) == len(slides), f"{name}: list and slide counts differ"
            toggle.click()
            assert toggle.get_attribute("aria-expanded") == "false", f"{name}: disclosure did not close"
            if len(slides)>1:
                button = capsule.find_element(By.CSS_SELECTOR, ".dar-desktop-recent-next")
                button.click()
                WebDriverWait(browser, 5).until(lambda d:
                    d.find_element(By.CSS_SELECTOR, ".dar-desktop-recent-count").text.startswith("02 /"))
            print(f"PASS desktop home: {name} {width}×{height}, {len(slides)} posts, no overflow", flush=True)
    except Exception:
        browser.save_screenshot("/tmp/dar-desktop-premium-failure.png")
        raise
    finally:
        browser.quit()

if __name__ == "__main__":
    check()
