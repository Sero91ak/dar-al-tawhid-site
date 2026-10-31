#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const inventory=require(path.join(__dirname,"adult-ui-web-inventory.cjs"));
const code=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const expected=["de","tr","en","ar","ku","ckb","bs","fr","es"];
const translated=["tr","en","ar","ku","ckb","bs","fr","es"];
const baselineUiTextCount=421+inventory.expandedWebKeys.length+inventory.readerChromeKeys.length;
const referenceUiKeys=Object.keys(locales.translations.en);
const expectedUiTextCount=referenceUiKeys.length;
assert.deepEqual(locales.availableLocales,expected);
assert.deepEqual(locales.translatedLocales,["de",...translated]);
assert.deepEqual(locales.pendingLocales,[]);
assert.equal(locales.noPaidProvider,true);
assert.deepEqual(Object.keys(locales.translations).sort(),expected.filter(x=>x!=="de").sort());
const countByLocale={};
for(const locale of translated){
 const dict=locales.translations[locale];
 const values=Object.keys(dict);
 assert(referenceUiKeys.length>=baselineUiTextCount,"UI catalog shrank below the reviewed baseline");
 assert.equal(values.length,expectedUiTextCount,locale+" UI inventory count");
 assert.deepEqual(values.slice().sort(),referenceUiKeys.slice().sort(),locale+" UI keys diverged");
 assert(values.every(x=>x.trim()&&typeof dict[x]==="string"&&dict[x].trim()));
 for(const key of inventory.expandedWebKeys)assert(dict[key]?.trim(),locale+" missing expanded web UI key "+key);
 for(const key of inventory.readerChromeKeys)assert(dict[key]?.trim(),locale+" missing reader chrome key "+key);
 for(const label of ["Startseite","Mehr","Gebetszeiten","Einstellungen","Suche","Konto","Suchen","Heute","Qurʾān","Duʿāʾ"]){
  assert(dict[label],locale+" missing "+label);
 }
 countByLocale[locale]=values.length;
}
const events={},storage={locale:"de"};
const nodes=[
 {nodeType:3,nodeValue:"Startseite",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"Gebetszeiten",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"Originalquellen bleiben unverändert",parentElement:{closest:()=>({immutable:true})}},
 {nodeType:3,nodeValue:"الْقُرْآنُ",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"← Zurück",parentElement:{closest:()=>null}}
];
const doc={
 documentElement:{lang:"de",dir:"ltr"},body:{nodeType:1,closest:()=>null,getAttribute:()=>null},
 createTreeWalker(){let i=-1;return{nextNode:()=>nodes[++i]||null}},
 readyState:"loading",addEventListener:(name,fn)=>events[name]=fn
};
const w={document:doc,location:{pathname:"/test/"},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>storage.locale},addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(code,{window:w,Map,Set,WeakMap,Promise,Uint8Array});
assert.deepEqual(Array.from(w.DarTestTurkishUI.supportedLocales),expected);
assert.equal(w.DarTestTurkishUI.registerLocaleData(locales),true);
for(const locale of expected){
 storage.locale=locale;w.DarTestTurkishUI.apply();
 const homepage=locale==="de"?"Startseite":locale==="tr"?"Ana Sayfa":locales.translations[locale]?.Startseite||"Startseite";
 const prayer=locale==="de"?"Gebetszeiten":locale==="tr"?"Namaz Vakitleri":locales.translations[locale]?.Gebetszeiten||"Gebetszeiten";
 assert.equal(nodes[0].nodeValue,homepage,locale+" homepage");
 assert.equal(nodes[1].nodeValue,prayer,locale+" prayer");
 assert.equal(nodes[2].nodeValue,"Originalquellen bleiben unverändert","canonical content MUST remain unchanged");
 assert.equal(nodes[3].nodeValue,"الْقُرْآنُ","Arabic original must remain unchanged");
 const back=locale==="de"?"Zurück":locale==="tr"?"Geri":locales.translations[locale].Zurück;
 assert.equal(nodes[4].nodeValue,"← "+back,locale+" composed back label");
 assert.equal(doc.documentElement.lang,locale);
 assert.equal(doc.documentElement.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
}
assert.equal(w.DarTestTurkishUI.translatedFor("fr"),expectedUiTextCount);
assert.equal(w.DarTestTurkishUI.translatedFor("es"),expectedUiTextCount);
assert.equal(w.DarTestTurkishUI.translateValue("3 Treffer","ku"),"3 "+locales.translations.ku.Treffer);
assert.equal(w.DarTestTurkishUI.translateValue("Wetter für Berlin wird geladen …","ku"),locales.translations.ku["Wetter für"]+" Berlin "+locales.translations.ku["wird geladen"]+" …");
assert.equal(w.DarTestTurkishUI.translateValue("Wetter · Berlin: derzeit nicht verfügbar","es"),locales.translations.es.Wetter+" · Berlin: "+locales.translations.es["derzeit nicht verfügbar"]);
assert.equal(w.DarTestTurkishUI.translateValue("Wetter · Köln: 12 °C · Klar","ku"),locales.translations.ku.Wetter+" · Köln: 12 °C · "+locales.translations.ku.Klar);
assert.equal(locales.translations.es["Inhalt wird vorbereitet…"],"Preparando el contenido…");
assert.equal(locales.translations.ku["Wissen durchsuchen"],"Li zanînê bigere");
assert.equal(w.DarTestTurkishUI.translateValue("Norden","ku"),"Bakur");
assert.equal(w.DarTestTurkishUI.translateValue("Live-Kompass nicht verfügbar. Qibla: ca. 42° (Norden). Öffne die Kompass-App deines Handys und richte dich auf 42° aus. Bitte Richtung prüfen.","ku"),"Qitibnîşana zindî ne amade ye. Qible: nêzîkî 42° (Bakur). Qitibnîşana telefonê veke û ber bi 42° ve bizivire. Ji kerema xwe alî kontrol bike.");
assert.equal(w.DarTestTurkishUI.translateValue("Offline fortsetzen 3/114","es"),locales.translations.es["Offline fortsetzen"]+" 3/114");
assert.equal(locales.translations.ckb["DĀR AL TAWḤĪD – Ḥadīṯ-Bibliothek"],"DĀR AL TAWḤĪD – کتێبخانەی حەدیث");
assert.equal(w.DarTestTurkishUI.translateValue("Frage 2 von 10","fr"),"Question 2 sur 10");
assert.equal(w.DarTestTurkishUI.translateValue("4 Aussagen mit Quellen.","en"),"4 "+locales.translations.en["Aussagen mit Quellen."]);
assert.equal(w.DarTestTurkishUI.translateValue("3 / 10 richtig","es"),"3 / 10 "+locales.translations.es.richtig);
assert.equal(w.DarTestTurkishUI.translateValue("Fajr ist eingetreten","en"),"Fajr has begun");
assert.equal(w.DarTestTurkishUI.translateValue("Weitere Treffer anzeigen · 40 von 120","ku"),"Encamên zêdetir nîşan bide · 40 ji 120");
assert.equal(locales.translations.ar["Laylat al-Qadr"],"ليلة القدر");
assert.equal(w.DarTestTurkishUI.translateValue("15 Min vorher","en"),"15 minutes before");
assert.equal(w.DarTestTurkishUI.translateValue("Taḥajjud · 30 Min vor Fajr","tr"),"Teheccüd · Fecir’den 30 dk önce");
assert.equal(locales.translations.ar["Botschaft aller Gesandten"],"رسالة جميع الرسل");
assert.equal(locales.translations.ckb["Klassisches Ḥadīṯ-Werk"],"بەرهەمی کلاسیکی حەدیث");
assert.equal(locales.translations.en["LESBAR"],"READABLE");
assert.equal(w.DarTestTurkishUI.translateValue("Gebete deaktiviert · Duʿāʾ 09:00","en"),locales.translations.en["Gebete deaktiviert"]+" · "+locales.translations.en["Duʿāʾ 09:00"]);
assert.equal(locales.translations.fr["Bildschirm darf ausgehen"],"L’écran peut s’éteindre");
assert.equal(w.DarTestTurkishUI.translateValue("3 Titel","en"),"3 titles");
assert.equal(w.DarTestTurkishUI.translateValue("Bildbeitrag zu: Beitrag","fr"),locales.translations.fr["Bildbeitrag zu:"]+" "+locales.translations.fr.Beitrag);
assert.equal(locales.translations.ar["Tawḥīd & ʿAqīdah"],"التوحيد ثم العقيدة");
assert.equal(w.DarTestTurkishUI.translateValue("Wird geöffnet…","en"),"Opening…");
assert.equal(w.DarTestTurkishUI.translateValue("Rezitator suchen","fr"),"Chercher un récitateur");
assert.equal(w.DarTestTurkishUI.translateValue("Suḥūr · Fajr","tr"),"Sahur · Fecir");
assert.equal(locales.translations.ckb["Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen"].includes("حەدیث"),true);
assert.equal(w.DarTestTurkishUI.translateValue("Direkte Antwort","en"),"Direct answer");
assert.equal(w.DarTestTurkishUI.translateValue("Belegte Aussagen · 4","fr"),"Propos établis · 4");
assert.equal(w.DarTestTurkishUI.translateValue("3 Quellen · Quellen anzeigen","es"),"3 fuentes · "+locales.translations.es["Quellen anzeigen"]);
assert.equal(w.DarTestTurkishUI.translateValue("Geprüfte Beziehungen","ar"),"علاقات تم فحصها");
assert.equal(w.DarTestTurkishUI.translateValue("Diese Antwort ist nicht sichtbar.","en"),"This answer is not visible.");
assert.equal(w.DarTestTurkishUI.translateValue("Links","ku"),"Çep");
assert.equal(w.DarTestTurkishUI.translateValue("1 Inhalt","fr"),"1 contenu");
assert.equal(w.DarTestTurkishUI.translateValue("4 geprüfte Berichte","es"),"4 informes revisados");
assert.equal(w.DarTestTurkishUI.translateValue("Gespeichert: links · Auf schmalen Displays bleibt die Leiste automatisch unten.","ar"),"محفوظ: اليسار · على الشاشات الضيقة يبقى الشريط تلقائيًا في الأسفل.");
assert.equal(w.DarTestTurkishUI.translateValue("Dieser Bereich ist sensibel. Trauer, Tod, Janāzah, Iḥdād, Weinen, Klage, Friedhofsbesuch und Todesfälle von Kindern oder Ehemännern werden nur angezeigt, wenn Quelle und Direktnachweis streng geprüft wurden.","en"),"This section is sensitive. Grief, death, janāzah, iḥdād, weeping, lamentation, visiting the cemetery and the deaths of children or husbands are shown only when the Source and the direct evidence have been checked strictly.");
assert.equal(w.DarTestTurkishUI.translateValue("PDF wird aufgebaut…","en"),"The PDF is being prepared…");
assert.equal(w.DarTestTurkishUI.translateValue("Im Qurʾān öffnen · al-Baqara","fr"),locales.translations.fr["Im Qurʾān öffnen"]+" · al-Baqara");
assert.equal(w.DarTestTurkishUI.translateValue("Der Prophet Muḥammad ﷺ über ihn · 3","ar"),locales.translations.ar["Der Prophet Muḥammad ﷺ über ihn"]+" · 3");
assert.equal(w.DarTestTurkishUI.translateValue("Mūsā (Vorschau · nicht freigegeben)","en"),"Mūsā "+locales.translations.en["(Vorschau · nicht freigegeben)"]);
assert.equal(w.DarTestTurkishUI.translateValue("Verstanden","fr"),"Compris");
assert.equal(w.DarTestTurkishUI.translateValue("Serien","en"),"Series");
assert.equal(w.DarTestTurkishUI.translateValue("Vorlauf","fr"),"Avance");
assert.equal(w.DarTestTurkishUI.translateValue("Im Qurʾān genannt","ar"),"مذكور في القرآن");
assert.equal(w.DarTestTurkishUI.translateValue("Qāriʾ wechseln","es"),"Cambiar recitador");
assert.equal(w.DarTestTurkishUI.translateValue("114 Suren","en"),"114 sūrahs");
assert.equal(w.DarTestTurkishUI.translateValue("Übersetzung: Bubenheim & Elyas","fr"),"Traduction: Bubenheim & Elyas");
assert.equal(w.DarTestTurkishUI.translateValue("Fast fertig · 3/10 Dateien · Download fortsetzen","es"),"Casi listo · 3/10 archivos · Continuar la descarga");
assert.equal(w.DarTestTurkishUI.translateValue("Thema · Gelehrter · Buch","en"),"Topic · Scholar · Book");
assert.equal(w.DarTestTurkishUI.translateValue("Tawḥīd im Mittelpunkt.","ar"),"التوحيد في الوسط.");
assert.equal(w.DarTestTurkishUI.translateValue("Lesung beginnen →","ku"),"Xwendinê dest pê bike →");
assert.equal(w.DarTestTurkishUI.translateValue("Aktuell · zuletzt synchronisiert um 31.10.2026, 19:05","tr"),"Güncel · son eşitleme 31.10.2026, 19:05");
assert.equal(w.DarTestTurkishUI.translateValue("DĀR AL TAWḤĪD · WISSENSBIBLIOTHEK","ckb"),"DĀR AL TAWḤĪD · کتێبخانەی زانست");
assert.equal(w.DarTestTurkishUI.translateValue("5 Min","tr"),"5 dk");
assert.equal(w.DarTestTurkishUI.translateValue("Sleep-Timer · 3:05","en"),"Sleep-timer · 3:05");
assert.equal(w.DarTestTurkishUI.translateValue("Lernen · Āyah 12","fr"),"Apprentissage · āyah 12");
assert.equal(w.DarTestTurkishUI.translateValue("Beleg 2 öffnen","en"),"Open evidence 2");
assert.equal(w.DarTestTurkishUI.translateValue("Zufall · Sūrah + Rezitator","en"),"Random · Sūrah + reciter");
assert.equal(w.DarTestTurkishUI.translateValue("SPRECHEN","ar"),"تكلم");
assert.equal(w.DarTestTurkishUI.translateValue("Vorige Āyah","es"),"Āyah anterior");
assert.equal(w.DarTestTurkishUI.translateValue("Ich höre: Bismillāh","ku"),"Ez dibihîzim: Bismillāh");
assert.equal(w.DarTestTurkishUI.translateValue("Āyah 2 / 7 · gelernt 1/7","es"),"aleya 2 / 7 · aprendido 1/7");
assert.equal(w.DarTestTurkishUI.translateValue("Gespeichert: Links · Auf diesem schmalen Display bleibt die Leiste automatisch unten.","en"),"Saved: Left · On this narrow screen the bar stays at the bottom.");
const coverage=JSON.parse(fs.readFileSync(path.join(__dirname,"locale-coverage-report.json"),"utf8"));
assert.equal(coverage.ui.keys,expectedUiTextCount);
assert.equal(coverage.acceptance.contentComplete,false);
assert.equal(coverage.content.quranMeanings.reviewedEightLanguagePack,false);
assert.equal(coverage.push.liveSend,false);
storage.locale="de";w.DarTestTurkishUI.apply();
assert.equal(nodes[0].nodeValue,"Startseite","German return must be lossless");
const here=fs.readFileSync(path.join(__dirname,"../assets/dar-test-seven-languages-loader.js"),"utf8");
assert(!here.includes("api.openai.com"),"Client must never use paid translation API");
assert(here.includes("/test/i18n/adult-ui-locales-seven.json"),"Require fixed static same-origin locale pack");
for(const file of inventory.sourceFiles){
 const source=fs.readFileSync(path.join(__dirname,"..","..",file),"utf8");
 for(const key of inventory.expandedWebKeys){
  const marker=inventory.sourceMarkers[key]||key;
  assert(inventory.sourceFiles.some(candidate=>fs.readFileSync(path.join(__dirname,"..","..",candidate),"utf8").includes(marker)),"Expanded UI key is not present in approved source files: "+key);
 }
}
console.log("PASS: 9 registered locales (9 translated) in 3 language selectors, "+JSON.stringify(countByLocale)+", DE restoration, source protection and RTL");
