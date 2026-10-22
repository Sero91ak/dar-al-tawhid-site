#!/usr/bin/env python3
"""Public adult app scripts, exercised in a same-origin isolated browser shell.
The gigantic root index depends on Cloudflare/Wrangler and is not bootable under
python.http.server. This checks the exact production UI modules and JSON asset,
not a claim about successful Cloudflare deploy.
"""
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

raw=Path("index.html").read_text(encoding="utf8")
print("Production root script references:",
      "dar-more-v15.js",raw.count("dar-more-v15.js"),
      "dar-more-final-v15.js",raw.count("dar-more-final-v15.js"),flush=True)

chrome=Options()
for flag in ("--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu"):
 chrome.add_argument(flag)
driver=webdriver.Chrome(options=chrome)
try:
 driver.set_window_size(430,930)
 # Directory index gives a same-origin DOM without running the Cloudflare-only app boot.
 driver.get("http://127.0.0.1:8765/assets/i18n/")
 w=WebDriverWait(driver,40)
 driver.execute_script("""
 document.body.innerHTML='<div id="appView" role="main"></div>';
 let s=document.createElement('script');
 s.src='/assets/dar-more-v15.js?v=tr-ui-qa';
 document.head.appendChild(s);
 """)
 w.until(lambda d:d.execute_script("return !!window.DAR_MORE_V15"))
 w.until(lambda d:d.execute_script("return !!window.DARAdultUI18n"))
 w.until(lambda d:d.execute_script("return window.DARAdultUI18n.catalogStatus==='loaded'"))
 count=driver.execute_script("return window.DARAdultUI18n.translatedKeys")
 assert count>=640,f"Shared catalog has only {count} Turkish UI entries"
 driver.execute_script("""
 const root=document.getElementById('appView');
 root.innerHTML=window.DAR_MORE_V15.render(
  [{id:'quran',nav:'quran',title:'Qurʾān',desc:'Lesen & suchen',group:'Lernen & Wissen'}],
  (title)=>'<header><h2>'+title+'</h2></header>');
 window.DAR_MORE_V15.sync();
 """)
 driver.execute_script("""
 const fixture=document.createElement('section');
 fixture.id='darGlobalTurkishFixture';
 fixture.innerHTML='<section class="prayer-panel"><h2>Gebetszeiten</h2><button title="Gebetszeiten anzeigen">Einstellungen</button></section>'+
 '<section class="dynamic-ui"><span data-i18n-count>114 Sūren · 6236 Āyāt</span>'+
 '<button data-i18n-open>Sūrah Al-Baqarah öffnen</button>'+
 '<span data-i18n-sources>Qurʾān · 8 Fundstellen</span>'+
 '<span data-i18n-duas>5 bekannte Duʿāʾ nach Themen.</span>'+
 '<span data-i18n-gregorian>Donnerstag, 22. Oktober 2026</span>'+
 '<span data-i18n-compact>Do., 22.10.26</span>'+
 '<span data-i18n-hijri>12. Dschumada I 1448</span>'+
 '<span data-i18n-clock>06:49 Uhr</span></section>'+
 '<section class="prophet-panel"><h3>Propheten</h3><span>Überlieferungsmaßstab</span>'+
 '<p class="prophets-quote__de" data-i18n-source>Gebetszeiten</p></section>'+
 '<article data-nav="post" data-value="fixture-post"><h3>Gebetszeiten</h3></article>'+
 '<div data-post-id="fixture-post">Einstellungen</div>'+
 '<p lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>';
 document.getElementById('appView').appendChild(fixture);
 """)
 w.until(lambda d:d.execute_script("return !!document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]')"))
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=tr]').click()")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='tr'"))
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('İlim'))"""))
 assert driver.execute_script("return localStorage.getItem('darAdultPreferredLocaleV1')")=="tr"
 w.until(lambda d:d.execute_script("""return document.querySelector('#darGlobalTurkishFixture .prayer-panel h2')?.textContent==='Namaz Vakitleri'"""))
 assert driver.execute_script("""return document.querySelector('#darGlobalTurkishFixture .prayer-panel button')?.textContent==='Ayarlar'""")
 assert driver.execute_script("""return document.querySelector('[data-i18n-count]')?.textContent==='114 sûre · 6236 âyet'"""),"Dynamic surah counts should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-open]')?.textContent==='Sûre Al-Baqarah aç'"""),"Qur'an opening action should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-sources]')?.textContent==="Kur'ân · 8 kaynak yeri" """),"Qur'an reference count should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-duas]')?.textContent==='5 konuya göre bilinen dua'"""),"Dua summary should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-gregorian]')?.textContent.includes('Ekim 2026')"""),"Gregorian calendar should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-compact]')?.textContent!=='Do., 22.10.26'"""),"Compact date should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-hijri]')?.textContent==='12 Cemâziyelevvel 1448'"""),"Hijri month should be localized"
 assert driver.execute_script("""return document.querySelector('[data-i18n-clock]')?.textContent==='saat 06:49'"""),"Clock label should be localized"
 
 assert driver.execute_script("""return document.querySelector('#darGlobalTurkishFixture article h3')?.textContent==='Gebetszeiten'"""),"Beiträge article card must not be translated"
 assert driver.execute_script("""return document.querySelector('#darGlobalTurkishFixture [data-post-id]')?.textContent==='Einstellungen'"""),"Post content must stay in German"
 assert driver.execute_script("""return document.querySelector('[data-i18n-source]')?.textContent==='Gebetszeiten'"""),"Unapproved prophetic narration must remain original"
 assert driver.execute_script("""return document.querySelector('#darGlobalTurkishFixture [lang=ar]')?.textContent==='بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'"""),"Quran Arabic must be preserved"
 driver.execute_script("""location.hash='#post/fixture-post';document.getElementById('appView').insertAdjacentHTML('beforeend','<span id="postRouteTurkishGuard">Gebetszeiten</span>');window.DARAdultUI18n.apply()""")
 assert driver.execute_script("return document.getElementById('postRouteTurkishGuard').textContent")=="Gebetszeiten","Post route must be excluded"
 driver.execute_script("""location.hash='#more';document.getElementById('postRouteTurkishGuard').remove();window.DARAdultUI18n.apply()""")

 print("PASS public modules: More controls and visible Turkish labels",flush=True)
 driver.execute_script("document.querySelector('.dar-more-v15 [data-dar-adult-locale=de]').click()")
 w.until(lambda d:d.execute_script("return document.documentElement.lang==='de'"))
 w.until(lambda d:d.execute_script("""return [...document.querySelectorAll('.dar-more-v15 [data-dm-category]')].some(el=>el.textContent.includes('Wissen'))"""))
 assert driver.execute_script("""return document.querySelector('[data-i18n-count]')?.textContent==='114 Sūren · 6236 Āyāt'"""),"German count should be restored"
 assert driver.execute_script("""return document.querySelector('[data-i18n-open]')?.textContent==='Sūrah Al-Baqarah öffnen'"""),"German Quran control should be restored"
 assert driver.execute_script("""return document.querySelector('[data-i18n-gregorian]')?.textContent==='Donnerstag, 22. Oktober 2026'"""),"Gregorian date should revert"
 assert driver.execute_script("""return document.querySelector('[data-i18n-hijri]')?.textContent==='12. Dschumada I 1448'"""),"Hijri date should revert"
 print("PASS public modules: reversible German locale",flush=True)
 driver.execute_script("""document.getElementById('appView').innerHTML=
 '<div class="dsh-shell dsh-home"><div class="dsh-welcome">Einstellungen</div></div>'""")
 w.until(lambda d:d.execute_script("return !!document.querySelector('#darAdultLanguageControl')"))
 print("PASS public modules: Settings language chooser available",flush=True)
finally:driver.quit()
