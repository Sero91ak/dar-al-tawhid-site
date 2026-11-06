#!/usr/bin/env python3
"""Read-only browser verification of the ACTUAL deployed DĀR Test Home.
No user data, login circumvention, production mutation or screenshots shipped.
"""
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL="https://dar-al-tawhid-test.sero91ak.workers.dev/test/?env=staging&immersive=20261106-v2#home"

def main():
    opt=Options()
    for arg in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
        opt.add_argument(arg)
    d=webdriver.Chrome(options=opt)
    try:
        for width,height in ((390,844),(768,1024)):
            d.set_window_size(width,height)
            d.get(URL)
            WebDriverWait(d,35).until(lambda b:b.execute_script("""
              return !!document.body&&document.body.classList.contains('is-home-route')
                &&!!document.getElementById('darHomeHtmlParityV1')
                &&!!document.querySelector('#darHomeHtmlParityV1 .dhp-welcome.dar-art-hero .dar-art-layer');
            """))
            before=d.execute_script("""
                const e=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome.dar-art-hero');
                const l=e.querySelector('.dar-art-layer');
                const r=e.getBoundingClientRect(),s=getComputedStyle(e),m=getComputedStyle(l,'::before');
                return {width:r.width,height:r.height,top:r.top,display:s.display,position:s.position,
                  image:m.backgroundImage,layerDisplay:getComputedStyle(l).display,
                  oldHidden:getComputedStyle(document.querySelector('.top-shell')).display,
                  rootVisible:getComputedStyle(document.getElementById('darHomeHtmlParityV1')).display,
                  imageAssets:performance.getEntriesByType('resource').filter(x=>x.name.includes('hero-mobile-adobe')||x.name.includes('hero-wide-adobe')).map(x=>x.name),
                  scale:e.style.getPropertyValue('--dar-art-scale')
                };
            """)
            print(f"HOME {width}x{height} {before}",flush=True)
            if before["display"]=="none" or before["rootVisible"]=="none" or before["height"]<185:
                raise AssertionError("No visibly sized home hero: "+str(before))
            if "hero-mobile-adobe.jpg" not in before["image"] and "hero-wide-adobe.jpg" not in before["image"]:
                raise AssertionError("Photo not rendered in visible Home layer: "+str(before))
            d.execute_script("window.scrollTo(0,420)")
            d.execute_script("window.dispatchEvent(new Event('scroll'))")
            WebDriverWait(d,8).until(lambda b:b.execute_script("""
              const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              return x&&x.style.getPropertyValue('--dar-art-progress')!=='0';
            """))
            after=d.execute_script("""
              const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              return {top:x.getBoundingClientRect().top,progress:x.style.getPropertyValue('--dar-art-progress'),
                scale:x.style.getPropertyValue('--dar-art-scale'),scrollY:window.scrollY};
            """)
            print(f"SCROLL {width}x{height} {after}",flush=True)
            if after["scrollY"]<=0:
                raise AssertionError("Document scroll did not move: "+str(after))
            d.execute_script("window.scrollTo(0,0)")
            d.execute_script("window.dispatchEvent(new Event('scroll'))")
            WebDriverWait(d,8).until(lambda b:b.execute_script("""
              const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              return x&&x.style.getPropertyValue('--dar-art-progress')==='0';
            """))
        print("PASS: deployed real Home parity image visibly integrated + reversible sticky depth",flush=True)
    finally:
        d.quit()
if __name__=="__main__":
    main()
