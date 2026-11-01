#!/usr/bin/env python3
"""Real Chromium regression for adult in-app source/lesson overlay on all viewports.
No external network needed: an intentionally OLD V3 reader/dock is upgraded by V5.
"""
from pathlib import Path
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT=Path(__file__).resolve().parents[2]
RUNTIME=(ROOT/"assets/dar-reader-overlay-runtime-v5.js").read_text(encoding="utf8")
HTML="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;min-height:1700px;background:#ddd">
<div class="app" id="app"><main id="home">STARTSEITE BELOW THE READER</main></div>
<nav id="bottomNav" style="position:fixed;bottom:0;width:100%;height:85px;z-index:9999999;background:green">FIVE TABS</nav>
<section id="darInternalSourceV3" hidden style="position:fixed;inset:0 0 80px 0;z-index:1100;display:flex;flex-direction:column;background:#fff">
<div class="dar-source-toolbar" style="padding:24px 12px;min-height:80px;background:#fff">
<button class="dar-source-back">← Zurück zum Beitrag</button><span class="dar-source-label">DĀR AL TAWḤĪD · Quellen</span></div>
<iframe id="darInternalSourceFrameV3" style="height:100%;width:100%;flex:1"></iframe></section>
<script>
document.querySelector(".dar-source-back").addEventListener("click",()=>document.getElementById("darInternalSourceV3").hidden=true);
window.navigate=function(view){window.__lastNav=view};
</script>
</body></html>"""

def test():
    opts=Options()
    for arg in ["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]:
        opts.add_argument(arg)
    d=webdriver.Chrome(options=opts)
    try:
        for name,w,h in [("compact",320,568),("iPhone",390,844),("fold-open",840,910),("desktop",1440,900)]:
            d.set_window_size(w,h)
            d.get("data:text/html;charset=utf-8,"+quote(HTML))
            d.execute_script(RUNTIME)
            d.execute_script("""
              const p=document.getElementById('darInternalSourceV3');
              const f=document.getElementById('darInternalSourceFrameV3');
              f.srcdoc='<html><head></head><body class="qsource-body"><main class="qsource-page"><header class="qsource-header"><img class="qsource-logo"><h1 class="qsource-brand">DĀR AL TAWḤĪD</h1></header><article style="height:1800px">Source content</article><footer id="qend">END</footer></main></body></html>';
              p.hidden=false;
            """)
            WebDriverWait(d,8).until(lambda b:
                len(b.find_elements(By.CSS_SELECTOR,"#darInternalSourceV3 .dar-source-home"))==1
                and b.execute_script("return document.getElementById('bottomNav').offsetParent===null"))
            dims=d.execute_script("""
              const p=document.getElementById('darInternalSourceV3'),r=p.getBoundingClientRect(),
                f=document.getElementById('darInternalSourceFrameV3').getBoundingClientRect(),
                home=document.getElementById('app'),nav=document.getElementById('bottomNav');
              return {top:r.top,bottom:r.bottom,height:innerHeight,frameBottom:f.bottom,
                navHidden:getComputedStyle(nav).display==='none',
                backgroundHidden:getComputedStyle(home).visibility==='hidden',
                back:p.querySelector('.dar-source-back').textContent,
                hasHome:!!p.querySelector('.dar-source-home')};
            """)
            assert abs(dims["top"])<=2 and abs(dims["bottom"]-dims["height"])<=3, (name,dims)
            assert abs(dims["frameBottom"]-dims["height"])<=3, (name,dims)
            assert dims["navHidden"] and dims["backgroundHidden"] and dims["hasHome"],(name,dims)
            assert dims["back"]=="← Zurück",(name,dims)
            WebDriverWait(d,8).until(lambda b:b.execute_script(
                "return !!document.getElementById('darInternalSourceFrameV3').contentDocument?.getElementById('darReaderFrameV5Styles')"))
            page=d.execute_script("""
              const f=document.getElementById('darInternalSourceFrameV3'),w=f.contentWindow,doc=f.contentDocument;
              const before=w.scrollY;w.scrollTo(0,doc.documentElement.scrollHeight);
              return {before,after:w.scrollY,htmlHeight:doc.documentElement.scrollHeight,client:doc.documentElement.clientHeight};
            """)
            assert page["htmlHeight"]>page["client"]+200 and page["after"]>200,(name,page)
            # Replacing the iframe with a lesson must retain full-bleed reader and fresh content styles.
            d.execute_script("""document.getElementById('darInternalSourceFrameV3').srcdoc=
             '<html><head></head><body class="heritage-learning"><main><header>Lesson</header><section style="height:1800px" id="quiz">Quiz</section></main></body></html>'""")
            WebDriverWait(d,8).until(lambda b:b.execute_script(
                "return !!document.getElementById('darInternalSourceFrameV3').contentDocument?.getElementById('quiz')"))
            assert d.execute_script("return !!document.getElementById('darInternalSourceFrameV3').contentDocument.getElementById('darReaderFrameV5Styles')")
            d.find_element(By.CSS_SELECTOR,"#darInternalSourceV3 .dar-source-home").click()
            WebDriverWait(d,8).until(lambda b:b.execute_script("return document.getElementById('darInternalSourceV3').hidden"))
            assert d.execute_script("return getComputedStyle(document.getElementById('bottomNav')).display!=='none'")
            assert d.execute_script("return getComputedStyle(document.getElementById('app')).visibility==='visible'")
            assert d.execute_script("return window.__lastNav==='home'")
            print(f"PASS {name} {w}x{h}: full viewport, no dock or home bleed, source/lesson scroll, back/home",flush=True)
    finally:
        d.quit()
if __name__=="__main__": test()
