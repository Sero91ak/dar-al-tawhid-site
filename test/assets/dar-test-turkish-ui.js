/* DĀR AL TAWḤĪD · Turkish UI localization, adult DAR TEST ONLY (V1).
 * Static editorial interface dictionary — not a translator for religious source content.
 * Scoped to /test/, excludes /test/kids/, never touches source articles, Arabic,
 * editable controls, Qur'an āyāt, ḥadīṯ quotations or user-authored content.
 */
(function(global){
"use strict";
if(!/^\/test(?:\/|$)/.test(global.location?.pathname||"")||/^\/test\/kids(?:\/|$)/.test(global.location?.pathname||""))return;
if(global.DarTestTurkishUI)return;
const KEY="darAdultPreferredLocaleV1";
const ENTRIES=[
["Start","Ana Sayfa"],["Startseite","Ana Sayfa"],["Mehr","Diğer"],["Beiträge","Yazılar"],
["Neueste Beiträge","Son Yazılar"],["Alle Beiträge","Tüm Yazılar"],["Alle lesen","Tümünü oku"],
["Alle lesen →","Tümünü oku →"],["Alle Veröffentlichungen ansehen →","Tüm yayınları görüntüle →"],
["Alle Bereiche →","Tüm bölümler →"],["Weitere Bereiche direkt öffnen","Diğer bölümleri aç"],
["Schnellzugriff","Hızlı Erişim"],["Quellenbibliothek","Kaynak Kütüphanesi"],
["Bibliothek","Kütüphane"],["PDF-Bibliothek","PDF Kütüphanesi"],
["Originalwerke","Orijinal Eserler"],["Gelehrte","Âlimler"],["Imāme & Salaf","İmamlar ve Selef"],
["Frauenbereich","Kadınlar Bölümü"],["Propheten","Peygamberler"],
["Geschichten und Lehren","Kıssalar ve Dersler"],["Wissen","İlim"],
["Lernen & Wissen","Öğrenme ve İlim"],["Alltag","Günlük Yaşam"],
["Alltag & Gebet","Günlük Yaşam ve Namaz"],["Werkzeuge","Araçlar"],
["Werkzeuge & Assistenten","Araçlar ve Yardımcılar"],["Persönlich","Kişisel"],
["App","Uygulama"],["Einstellungen","Ayarlar"],["Konto","Hesap"],
["Konto / Registrieren","Hesap / Kayıt"],["Konto und Synchronisierung öffnen","Hesabı ve eşitlemeyi aç"],
["Konto öffnen oder registrieren","Hesaba gir veya kaydol"],
["Sprache","Dil"],["Sprache / Dil","Dil / Sprache"],["Sprache · Dil","Dil · Sprache"],
["Sprache wählen / Dil seçimi","Dil seçimi"],["App-Sprache","Uygulama dili"],
["Sprache auswählen","Dil seçin"],["Türkisch und Deutsch auswählen. Fachtexte nur in geprüften Fassungen.","Türkçe veya Almanca seçin. İlmî metinler yalnızca onaylandığında Türkçe görünür."],
["Türkisch und Deutsch. Fachbeiträge erscheinen erst nach Prüfung in der gewählten Sprache.","Türkçe veya Almanca. İlmî yazılar yalnızca onaylandıktan sonra seçilen dilde gösterilir."],
["Türkische Inhalte werden nach Quellen- und Sprachprüfung freigegeben.","Türkçe içerikler kaynak ve dil incelemesinden sonra yayımlanır."],
["Funktionen geordnet nach Lernen, Alltag, Werkzeugen und Einstellungen","Öğrenme, günlük yaşam, araçlar ve ayarlar"],
["Funktion suchen","İşlev ara"],["Funktion suchen…","İşlev ara…"],
["Suche schließen","Aramayı kapat"],["Suche löschen","Aramayı temizle"],
["Suchen","Ara"],["Suche","Arama"],
["Suche Wissen, Beiträge, Bücher, Gelehrte …","İlim, yazı, kitap ve âlim ara …"],
["Beiträge, Gelehrte und Bücher suchen","Yazıları, âlimleri ve kitapları ara"],
["Ergebnisse","Sonuçlar"],["Keine Ergebnisse","Sonuç bulunamadı"],
["Zurück","Geri"],["Weiter","İleri"],["Öffnen","Aç"],["Schließen","Kapat"],
["Fertig","Bitti"],["Abbrechen","İptal"],["Speichern","Kaydet"],
["Aktualisieren","Yenile"],["Teilen","Paylaş"],["Kopieren","Kopyala"],
["Mehr anzeigen","Daha fazla göster"],["Alle anzeigen","Tümünü göster"],
["Heute","Bugün"],["Gestern","Dün"],["Morgen","Yarın"],
["Gebetszeiten","Namaz Vakitleri"],["Gebet","Namaz"],["Nächstes Gebet","Sıradaki Namaz"],
["Aktuelles Gebet","Şimdiki Namaz"],["Gebetszeiten anzeigen","Namaz vakitlerini göster"],
["Qibla","Kıble"],["Qiblah","Kıble"],["Qibla öffnen","Kıbleyi aç"],
["Kalender","Takvim"],["Kalender & Hijrī-Datum","Takvim ve Hicrî Tarih"],
["Kalender & Hijrī-Datum →","Takvim ve Hicrî Tarih →"],
["Wetter","Hava Durumu"],["Wetterdaten werden geladen …","Hava durumu yükleniyor …"],
["Standort","Konum"],["Standort auswählen","Konum seç"],["Standort erlauben","Konuma izin ver"],
["Ort suchen","Şehir ara"],["Stadt","Şehir"],["Erscheinungsbild","Görünüm"],
["Erscheinungsbild wählen","Görünümü seç"],
["Erscheinungsbild in Einstellungen öffnen","Ayarlar'da görünümü aç"],
["Darstellung","Görünüm"],["Kompakt","Kompakt"],["Komfort","Rahat"],
["Hell","Açık"],["Dunkel","Koyu"],["Klassisch Dunkel","Klasik Koyu"],
["Klassisch Hell","Klasik Açık"],["Sanft Elegant","Zarif Yumuşak"],
["Salbei Elfenbein","Adaçayı ve Fildişi"],["Royal Nachtblau","Kraliyet Laciverti"],
["Bordeaux Royal","Bordo Royal"],["Farbwelt wählen – die Inhalte bleiben unverändert.","Renk temasını seçin; içerikler değişmez."],
["WILLKOMMEN IM DĀR","DĀR'A HOŞ GELDİNİZ"],
["Willkommen bei DĀR AL TAWḤĪD","DĀR AL TAWḤĪD'E HOŞ GELDİNİZ"],
["GRUNDLAGEN DES GLAUBENS","İMAN ESASLARI"],
["HEUTE FÜR DICH","BUGÜN SENİN İÇİN"],["Dein Qurʾān","Kur'ân'ın"],
["Duʿāʾ","Dua"],["Bittgebete","Dualar"],["Authentische Bittgebete","Sahih Dualar"],
["Duʿāʾ & Empfehlung","Dua ve Tavsiye"],
["Dein täglicher Wissensimpuls und aktuelle Bittgebete.","Günlük ilim notun ve dualar."],
["Duʿāʾ des Tages öffnen →","Günün duasını aç →"],
["Wissen prüfen","Bilgini sına"],["Dīn-Quiz","Din Bilgisi Testi"],
["Quiz","Test"],["Dīn lernen","Dini Öğren"],
["Neue Beiträge","Yeni Yazılar"],["Beiträge werden geladen …","Yazılar yükleniyor …"],
["AKTUELLE VERÖFFENTLICHUNG","SON YAYIN"],["WEITERER BEITRAG","DİĞER YAZI"],
["Alle Funktionen","Tüm İşlevler"],["Funktionen","İşlevler"],
["Alle Kategorien","Tüm Kategoriler"],["Kategorien","Kategoriler"],
["Lesezeichen","Yer İmleri"],["Gespeichert","Kaydedilenler"],
["Favoriten","Favoriler"],["Verlauf","Geçmiş"],
["Neu","Yeni"],["Zuletzt erschienen","Son Yayınlananlar"],
["Zuletzt gelesen","Son Okunanlar"],
["Wissen aus Qurʾān, Sunnah und Āṯār","Kur'ân, Sünnet ve Āṯār'dan İlim"],
["Beiträge nach Qurʾān, Sunnah und Āṯār","Kur'ân, Sünnet ve Āṯār'a Göre Yazılar"],
["Sunnah und Überlieferungen","Sünnet ve Rivayetler"],
["Tagesvers","Günün Âyeti"],["Vers des Tages","Günün Âyeti"],
["Duʿāʾ des Tages","Günün Duası"],["Beitrag des Tages","Günün Yazısı"],
["Suche im Qurʾān","Kur'ân'da ara"],["Qurʾān lesen","Kur'ân oku"],
["Lesen & suchen","Oku ve Ara"],["Wiedergabe","Oynatma"],
["Abspielen","Oynat"],["Pause","Duraklat"],["Fortsetzen","Devam et"],
["Audio","Ses"],["Alle Suren","Tüm Sûreler"],["Sūrah","Sûre"],
["Rezitator","Kâri"],["Wiederholen","Tekrarla"],["Geschwindigkeit","Hız"],
["Herunterladen","İndir"],["Downloads","İndirilenler"],
["Benachrichtigungen","Bildirimler"],["Benachrichtigung","Bildirim"],
["Datenschutz","Gizlilik"],["Hilfe","Yardım"],["Kontakt","İletişim"],
["Über uns","Hakkımızda"],["Informationen","Bilgiler"],
["Weiterlesen","Devamını oku"],["Mehr erfahren","Ayrıntılı bilgi"],
["Anmelden","Giriş yap"],["Registrieren","Kaydol"],["Abmelden","Çıkış yap"],
["Passwort","Şifre"],["E-Mail","E-posta"],["Benutzername","Kullanıcı adı"],
["Schriftgröße","Yazı boyutu"],["Sprache ändern","Dili değiştir"]
];
const dictionary=new Map(ENTRIES),backward=new Map(),ambiguous=new Set();
for(const [de,tr] of ENTRIES){if(backward.has(tr)&&backward.get(tr)!==de)ambiguous.add(tr);else backward.set(tr,de)}
const EXCLUDE="script,style,noscript,textarea,pre,code,[contenteditable],[data-dar-no-translate],[lang='ar'],[dir='rtl'],[class*='quran-arabic'],[class*='ayah-ar'],[class*='arabic-text'],[class*='post-body'],[class*='post-content'],[class*='hadith-text'],[class*='qsource-statement'],[class*='source-quote'],[data-canonical-content]";
const originals=new WeakMap(),attributeOriginals=new WeakMap();
const ATTRS=["placeholder","aria-label","title"];
function currentLocale(){try{return global.localStorage?.getItem(KEY)==="tr"?"tr":"de"}catch(_){return"de"}}
function shouldSkip(element){
 if(!element||typeof element.closest!=="function")return false;
 return !!element.closest(EXCLUDE);
}
function transformText(node,locale){
 const parent=node.parentElement;if(!parent||shouldSkip(parent))return;
 const current=String(node.nodeValue||"");
 let state=originals.get(node);
 if(state&&current!==state.source&&current!==state.rendered){state=null;originals.delete(node)}
 if(!state){
  const match=current.match(/^(\s*)(.*?)(\s*)$/s);
  if(!match||!dictionary.has(match[2]))return;
  state={source:current,rendered:current};originals.set(node,state);
 }
 const value=state.source.match(/^(\s*)(.*?)(\s*)$/s),translated=dictionary.get(value[2]);
 const desired=locale==="tr"?value[1]+translated+value[3]:state.source;
 if(node.nodeValue!==desired)node.nodeValue=desired;
 state.rendered=desired;
}
function transformAttributes(element,locale){
 if(shouldSkip(element))return;
 let state=attributeOriginals.get(element);
 if(!state){state=Object.create(null);attributeOriginals.set(element,state)}
 for(const attr of ATTRS){
  const actual=element.getAttribute?.(attr);
  if(actual===null||actual===undefined)continue;
  let prior=state[attr];
  if(prior&&actual!==prior.source&&actual!==prior.rendered){delete state[attr];prior=null}
  if(!prior){
   if(!dictionary.has(actual))continue;
   prior={source:actual,rendered:actual};state[attr]=prior;
  }
  const desired=locale==="tr"?dictionary.get(prior.source):prior.source;
  if(actual!==desired)element.setAttribute(attr,desired);
  prior.rendered=desired;
 }
}
function apply(root=global.document?.body,locale=currentLocale()){
 if(!root)return 0;
 const doc=global.document;
 if(root.nodeType===1&&!shouldSkip(root))transformAttributes(root,locale);
 const walker=doc.createTreeWalker(root,global.NodeFilter.SHOW_ELEMENT|global.NodeFilter.SHOW_TEXT);
 let node,seen=0;
 while((node=walker.nextNode())!==null){
  if(node.nodeType===1){transformAttributes(node,locale);continue}
  if(node.nodeType===3){transformText(node,locale);seen++}
 }
 if(doc.documentElement)doc.documentElement.lang=locale;
 return seen;
}
let queued=false;
function schedule(){
 if(queued)return;
 queued=true;
 const run=()=>{queued=false;apply()};
 if(typeof global.requestAnimationFrame==="function")global.requestAnimationFrame(run);
 else Promise.resolve().then(run);
}
function boot(){
 schedule();
 if(!global.MutationObserver||!global.document?.body)return;
 new global.MutationObserver(changes=>{
  if(changes.some(x=>x.type==="childList"||x.type==="characterData"||x.type==="attributes"))schedule();
 }).observe(global.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}
global.addEventListener("dar-adult-locale-changed",schedule);
global.addEventListener("storage",e=>{if(e.key===KEY)schedule()});
global.document.addEventListener("dar:view-rendered",schedule);
if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
// Load the same reviewed-content consumer used by future adult Web/PWA/WKWebView.
// This loader is TEST-only; it makes no paid translation/API request.
if(typeof global.document?.createElement==="function"&&global.document.head&&
   !global.document.getElementById("dar-test-central-content-runtime")){
 const tag=global.document.createElement("script");
 tag.id="dar-test-central-content-runtime";
 tag.src="/test/assets/dar-adult-central-content.js?v=1";
 tag.defer=true;
 global.document.head.appendChild(tag);
}
global.DarTestTurkishUI={apply,schedule,locale:currentLocale,translatedKeys:dictionary.size,
  contentStore:()=>global.DarAdultCentralContent?.create()||null,scope:"adult-test-only"};
})(window);
