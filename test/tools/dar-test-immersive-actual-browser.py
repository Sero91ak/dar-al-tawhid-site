#!/usr/bin/env python3
"""Read-only browser verification of the ACTUAL deployed DĀR Test Home.
No user data, login circumvention, production mutation or screenshots shipped.
"""
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL="https://dar-al-tawhid-test.sero91ak.workers.dev/test/?env=staging&immersive=20261106-v2#home"


def nav_snapshot(d):
    return d.execute_script("""
      const n=document.getElementById('bottomNav');
      if(!n)return null;
      const c=getComputedStyle(n),r=n.getBoundingClientRect();
      return {x:r.left,y:r.top,width:r.width,height:r.height,
        viewport:innerWidth,position:c.position,display:c.display,
        transform:c.transform,flexDirection:c.flexDirection,
        radius:parseFloat(c.borderTopLeftRadius),
        iconCount:n.querySelectorAll('.bottom-nav-btn .nav-icon img.dar3d-icon').length,
        buttonCount:n.querySelectorAll(':scope > .bottom-nav-btn').length,
        page:document.body.className};
    """)

def assert_nav_stable(n, width):
    if not n or n['display']=='none':
        raise AssertionError('Native bottom navigation absent at '+str(width)+': '+str(n))
    if n['position']!='fixed' or n['buttonCount']!=5 or n['iconCount']!=5:
        raise AssertionError('Native 5-icon navigation lost: '+str(n))
    if abs(n['x']+n['width']/2-n['viewport']/2)>3:
        raise AssertionError('Navigation shifted horizontally: '+str(n))
    if n['width']<min(260,width-45) or n['height']<62 or n['height']>75 or n['radius']<21:
        raise AssertionError('Navigation changed capsule geometry: '+str(n))

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
            nav0=nav_snapshot(d)
            print(f"NAV INITIAL {width}x{height} {nav0}",flush=True)
            assert_nav_stable(nav0,width)
            if before["height"] < (270 if width<700 else 310):
                raise AssertionError("Cinematic image too small: "+str(before))
            hero_order=d.execute_script("""
              const root=document.getElementById('darHomeHtmlParityV1'),hero=root.querySelector('.dhp-welcome');
              const prayer=root.querySelector('.dat-smart-prayer,.dhp-prayer');
              return {heroOrder:getComputedStyle(hero).order,prayerOrder:prayer?getComputedStyle(prayer).order:null};
            """)
            if int(hero_order["heroOrder"])>=int(hero_order["prayerOrder"] or 99):
                raise AssertionError("Photo does not lead the Home layout: "+str(hero_order))

            if before["display"]=="none" or before["rootVisible"]=="none" or before["height"]<185:
                raise AssertionError("No visibly sized home hero: "+str(before))
            if "hero-mobile-adobe.jpg" not in before["image"] and "hero-wide-adobe.jpg" not in before["image"]:
                raise AssertionError("Photo not rendered in visible Home layer: "+str(before))
            # Trigger the real page scroller. Some WebView shells scroll a
            # nested .app instead; report and exercise that owner explicitly.
            state=d.execute_script("""
                const doc=document.scrollingElement||document.documentElement;
                const app=document.querySelector('.app');
                const root=document.getElementById('darHomeHtmlParityV1');
                return {pageY:window.scrollY,documentHeight:doc.scrollHeight,documentClient:doc.clientHeight,
                  appHeight:app?.scrollHeight,appClient:app?.clientHeight,
                  appOverflow:app?getComputedStyle(app).overflowY:null,
                  rootHeight:root?.scrollHeight,rootClient:root?.clientHeight};
            """)
            print(f"SCROLL OWNER BEFORE {width}x{height} {state}",flush=True)
            d.execute_script("window.scrollTo(0,420)")
            d.execute_script("window.dispatchEvent(new Event('scroll'))")
            import time
            time.sleep(0.8)
            after=d.execute_script("""
              const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              const doc=document.scrollingElement||document.documentElement;
              const app=document.querySelector('.app');
              return {top:x.getBoundingClientRect().top,progress:x.style.getPropertyValue('--dar-art-progress'),
                scale:x.style.getPropertyValue('--dar-art-scale'),scrollY:window.scrollY,
                docTop:doc.scrollTop,appTop:app?.scrollTop||0};
            """)
            if after["scrollY"]<=0 and after["docTop"]<=0 and after["appTop"]<=0:
                d.execute_script("""
                  const app=document.querySelector('.app');
                  if(app&&app.scrollHeight>app.clientHeight+200){app.scrollTop=420;
                    app.dispatchEvent(new Event('scroll',{bubbles:true}));}
                """)
                time.sleep(0.8)
                after=d.execute_script("""
                  const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
                  const doc=document.scrollingElement||document.documentElement;
                  const app=document.querySelector('.app');
                  return {top:x.getBoundingClientRect().top,progress:x.style.getPropertyValue('--dar-art-progress'),
                    scale:x.style.getPropertyValue('--dar-art-scale'),scrollY:window.scrollY,
                    docTop:doc.scrollTop,appTop:app?.scrollTop||0};
                """)
            print(f"SCROLL {width}x{height} {after}",flush=True)
            nav1=nav_snapshot(d)
            print(f"NAV SCROLLED {width}x{height} {nav1}",flush=True)
            assert_nav_stable(nav1,width)
            for key in ('x','width','height','radius'):
                if abs(nav0[key]-nav1[key])>2:
                    raise AssertionError('Bottom dock changes geometry during scroll: '+str((key,nav0,nav1)))

            sticky=d.execute_script("""
              const el=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              const topRule=getComputedStyle(el).top;
              const ancestors=[];
              for(let p=el.parentElement;p;p=p.parentElement){
                const c=getComputedStyle(p);
                ancestors.push({tag:p.tagName,id:p.id,cls:String(p.className||'').slice(0,70),
                  overflowX:c.overflowX,overflowY:c.overflowY,position:c.position,
                  contain:c.contain,transform:c.transform,scrollTop:p.scrollTop,
                  scrollHeight:p.scrollHeight,clientHeight:p.clientHeight});
              }
              return {topRule:topRule,header:document.getElementById('darTestBrandHeaderV1')?.getBoundingClientRect().bottom,
                ancestors:ancestors};
            """)
            print(f"STICKY TRACE {width}x{height} {sticky}",flush=True)
            if after["scrollY"]>=350 and after["top"] < -6:
                raise AssertionError("Hero scene is not pinned under the fixed header: "+str(sticky))

            if after["progress"] in (None,"","0") or max(after["scrollY"],after["docTop"],after["appTop"])<=0:
                raise AssertionError("No actual scroll-driven depth change: "+str(after))
            d.execute_script("window.scrollTo(0,0);const a=document.querySelector('.app');if(a)a.scrollTop=0;window.dispatchEvent(new Event('scroll'))")
            d.execute_script("window.dispatchEvent(new Event('scroll'))")
            WebDriverWait(d,8).until(lambda b:b.execute_script("""
              const x=document.querySelector('#darHomeHtmlParityV1 .dhp-welcome');
              return x&&x.style.getPropertyValue('--dar-art-progress')==='0';
            """))
            # A successful scroll test is not sufficient. The original report
            # concerns nav geometry morphing during SPA route transitions.
            d.execute_script("""
              const button=document.querySelector('#bottomNav [data-bottom-nav="more"]');
              if(!button)throw new Error('More tab missing');
              // The real app intentionally ignores bare click for long-press
              // tabs. A short tap navigates only on pointerup.
              const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
              const opts={bubbles:true,cancelable:true,pointerId:8,
                pointerType:'touch',button:0,buttons:1,clientX:x,clientY:y};
              button.dispatchEvent(new PointerEvent('pointerdown',opts));
              button.dispatchEvent(new PointerEvent('pointerup',{...opts,buttons:0}));
            """)
            WebDriverWait(d,14).until(lambda b:b.execute_script("""
              return document.body.classList.contains('is-more-route');
            """))
            more_nav=nav_snapshot(d)
            print(f"NAV MORE ROUTE {width}x{height} {more_nav}",flush=True)
            assert_nav_stable(more_nav,width)
            for key in ('x','width','height','radius'):
                if abs(nav0[key]-more_nav[key])>2:
                    raise AssertionError('Bottom dock morphs on MORE route: '+str((key,nav0,more_nav)))
            d.execute_script("""
              const button=document.querySelector('#bottomNav [data-bottom-nav="home"]');
              if(!button)throw new Error('Home tab missing');
              button.click();
            """)
            WebDriverWait(d,14).until(lambda b:b.execute_script("""
              return document.body.classList.contains('is-home-route');
            """))
            home_nav_back=nav_snapshot(d)
            print(f"NAV RETURN HOME {width}x{height} {home_nav_back}",flush=True)
            assert_nav_stable(home_nav_back,width)
            for key in ('x','width','height','radius'):
                if abs(nav0[key]-home_nav_back[key])>2:
                    raise AssertionError('Bottom dock morphs after return Home: '+str((key,nav0,home_nav_back)))
            # Cross-route image integration: the topics page uses the genuine
            # SPA renderer and must contain the decorative photo on its header.
            if width==390:
                d.execute_script("""
                  if(typeof navigate==='function')navigate('topics');
                  else location.hash='#topics';
                """)
                WebDriverWait(d,18).until(lambda b:b.execute_script("""
                  return document.body.classList.contains('is-topics-route') &&
                    !!document.querySelector('#appView .topics-hub > .view-head.dar-art-hero .dar-art-layer');
                """))
                topicsNav=nav_snapshot(d)
                print(f"NAV TOPICS ROUTE {width}x{height} {topicsNav}",flush=True)
                assert_nav_stable(topicsNav,width)
                for key in ('x','width','height','radius'):
                    if abs(nav0[key]-topicsNav[key])>2:
                        raise AssertionError('Bottom dock morphs on TOPICS route: '+str((key,nav0,topicsNav)))
                d.execute_script("""
                  const el=document.querySelector('#appView .topics-hub > .view-head.dar-art-hero');
                  if(!el||!el.querySelector('.dar-art-layer'))throw new Error('Topics artwork not integrated');
                """)
        print("PASS: deployed real Home parity image visibly integrated + reversible sticky depth and stable navigation across MORE/Home route swaps",flush=True)
    finally:
        d.quit()
if __name__=="__main__":
    main()
