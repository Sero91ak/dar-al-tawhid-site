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
const EXTRA_ENTRIES=[
["Qurʾān durchsuchen","Kur'ân'da ara"],
["Sūrah, Āyah oder Begriff suchen","Sûre, âyet veya kavram ara"],
["Ǧuzʾ · Sūrah · Āyah Öffnen ⌄","Cüz · Sûre · Âyet Aç ⌄"],
["☀ Bildschirm an","☀ Ekranı açık tut"],
["▶ Lernen mit Wiedergabe","▶ Dinleyerek öğren"],
["Qurʾān lesen · Sūrah auswählen","Kur'ân oku · Sûre seç"],
["Surenverzeichnis","Sûre Listesi"],["Alle","Tümü"],
["Mekkanisch","Mekkî"],["Medinensisch","Medenî"],
["Sūrenbereich wechseln 01–20 ⌄","Sûre aralığını değiştir 01–20 ⌄"],
["Bücher","Kitaplar"],["Werk, Autor oder Kategorie suchen…","Eser, yazar veya kategori ara…"],
["Bücher und Themen durchsuchen","Kitap ve konuları ara"],
["Bibliothek durchsuchen","Kütüphanede ara"],
["Thema: Alle Kategorien ▾","Konu: Tüm Kategoriler ▾"],
["Neu im Regal","Yeni Eklenenler"],["Themenregale","Konu Rafları"],
["Alle Veröffentlichungen","Tüm Yayınlar"],
["Name, Kuniyah oder Schreibweise","İsim, künye veya yazılış ara"],
["Schnellauswahl","Hızlı Seçim"],
["Historische Generation","Tarihî Nesil"],["Alphabetisch","Alfabetik"],
["Meiste Beiträge","En Fazla Yazı"],["Wenigste Beiträge","En Az Yazı"],
["Zuletzt angesehen","Son Görüntülenenler"],
["Keine Person gefunden","Kişi bulunamadı"],["Zurücksetzen","Sıfırla"],
["Duʿāʾ suchen nach Anlass, Thema, Arabisch, Deutsch oder Quelle…",
 "Duruma, konuya, Arapçaya, Almancaya veya kaynağa göre dua ara…"],
["Vergebung & Reue","Bağışlanma ve Tövbe"],
["Wissen, Urteil & Īmān","İlim, Hüküm ve İman"],
["Familie & Nachkommen","Aile ve Nesil"],
["Qurʾān & Rechtleitung","Kur'ân ve Hidayet"],
["Ḥadīṯ-Bibliothek","Hadis Kütüphanesi"],
["Ḥadīṯ suchen nach Werk, Kitāb, Bāb, Nummer oder Šarḥ…",
 "Eser, kitap, bâb, numara veya şerhe göre hadis ara…"],
["Weitere Werke","Diğer Eserler"],
["Frauen im Islam","İslam'da Kadınlar"],
["Thema, Aussage, Person oder Werk suchen","Konu, söz, kişi veya eser ara"],
["Wissen geordnet nach Lebensbereichen","Hayat Alanlarına Göre İlim"],
["Grundlagen des Dīn","Dinin Temelleri"],
["Fiqh der Frauen","Kadın Fıkhı"],
["Frauen der ersten Generationen","İlk Nesillerdeki Kadınlar"],
["Ehe, Familie & Erziehung","Evlilik, Aile ve Eğitim"],
["Wissen, Adab & Daʿwah","İlim, Edep ve Davet"],
["Besondere Zeiten & Lebensabschnitte","Özel Zamanlar ve Hayat Dönemleri"],
["Die Propheten","Peygamberler"],
["Name, Volk, Ereignis, Sūrah …","İsim, kavim, olay, sûre …"],
["Din-Quiz","Din Bilgisi Testi"],["Auswahl","Seçim"],
["THEMA","KONU"],["FRAGENANZAHL","SORU SAYISI"],["MODUS","MOD"],
["Quiz starten","Testi başlat"],["Schnellrunde","Hızlı Tur"],
["AUSWERTUNG","DEĞERLENDİRME"],["Statistik","İstatistik"],
["Trefferquote","Doğru Yanıt Oranı"],["Ort","Konum"],
["Kompass","Pusula"],
["Live Activities ein- oder ausschalten","Canlı Etkinlikleri aç veya kapat"],
["Dein App-Erlebnis","Uygulama Deneyimin"],
["Schrift & Lesbarkeit","Yazı ve Okunabilirlik"],
["App-Icon","Uygulama Simgesi"],["Symbol für den Startbildschirm","Ana ekran simgesi"],
["Über diese App","Bu Uygulama Hakkında"],
["Version, Inhalte und Informationen","Sürüm, İçerikler ve Bilgiler"],
["Qurʾān Player","Kur'ân Oynatıcı"],
["Hadith-Bibliothek","Hadis Kütüphanesi"],
["PDFs, Bücher und Themenhefte von DĀR AL TAWḤĪD.",
 "DĀR AL TAWḤĪD PDF'leri, kitapları ve konu kitapçıkları."],
["Neue Bildbeiträge und ruhige Empfehlungen.","Yeni görsel yazılar ve özenli tavsiyeler."],
["Strukturierte Wissensprüfung nach Themen und Stufen.",
 "Konu ve seviyelere göre düzenli bilgi sınaması."],
["114 Suren mit Arabisch und Lautschrift.","Arapçası ve okunuşuyla 114 sûre."],
["Hören, mitlesen, Āyah für Āyah.","Âyet âyet dinle ve takip et."],
["Hadith-Werke mit Büchern, Kapiteln und Filterung.",
 "Kitap, bölüm ve filtrelemelerle hadis eserleri."],
["Wissensassistent mit belegten Antworten aus DĀR AL TAWḤĪD.",
 "DĀR AL TAWḤĪD kaynaklarına dayalı yanıtlar sunan ilim asistanı."],
["Qurʾān · Sunnah · authentische Überlieferungen","Kur'ân · Sünnet · Sahih Rivayetler"],
["Benachrichtigungen einstellen","Bildirimleri ayarla"],
["Einstellungen öffnen","Ayarları aç"],["Qurʾān weiterlesen","Kur'ân okumaya devam et"],
["Einstellungen →","Ayarlar →"],["📲 App speichern","📲 Uygulamayı kaydet"],
["App, Qurʾān, Duʿāʾ und Beiträge","Uygulama, Kur'ân, dua ve yazılar"]
];
const dictionary=new Map([...ENTRIES,...EXTRA_ENTRIES]),backward=new Map(),ambiguous=new Set();
const SUPPORTED=new Set(["de","tr","en","ar","ku","ckb","bs","fr","es"]);
const rtl=new Set(["ar","ckb"]),languagePacks=new Map();

const specialBlocks=new Map(),welcomeOriginals=new WeakMap();
function renderHomeWelcome(locale){
 const document=global.document;
 const intro=document?.querySelector?.("#darHomeHtmlParityV1 .dhp-intro");
 if(!intro||!document.createTextNode||!document.createElement)return;
 let state=welcomeOriginals.get(intro);
 if(!state){state={original:intro.innerHTML,last:null};welcomeOriginals.set(intro,state)}
 intro.setAttribute("data-dar-no-translate","home-intro");
 if(state.last===locale)return;
 state.last=locale;
 const translation=locale==="de"?null:specialBlocks.get(locale);
 if(!translation){if(intro.innerHTML!==state.original)intro.innerHTML=state.original;return}
 const branded="DĀR AL TAWḤĪD",pos=translation.indexOf(branded);
 if(pos<0){intro.textContent=translation;return}
 const brand=document.createElement("strong");
 brand.textContent=branded;
 intro.replaceChildren(document.createTextNode(translation.slice(0,pos)),brand,
                      document.createTextNode(translation.slice(pos+branded.length)));
}
const titleByGerman=new Map();
const originalTitles=new WeakMap();
const HEADLINE_SELECTORS=[
 "#dv3Latest .dv3-post-body b","#dhpPosts .dhp-post-capsule h3","#dhpTodayName",
 ".dua-card h3",".dua-card .dua-title",".duas-card h3",".duas-card .dua-title",
 "[data-dua-id] .dua-title","[data-post-id] .post-title"
].join(",");
function registerTitleData(data){
 if(data?.schemaVersion!==1||data.scope!=="adult-test-visible-titles-only"||
    data.mode!=="editorial-title-draft"||data.paidApiCalls!==0||
    !data.records||typeof data.records!=="object")return false;
 const prepared=new Map();
 for(const [key,record] of Object.entries(data.records)){
  if(key!==(record.kind+":"+record.id)||!["post","dua"].includes(record.kind)||
     typeof record.sourceTitle!=="string"||record.sourceTitle.length>220||
     Object.keys(record.translations||{}).sort().join("|")!=="ar|bs|ckb|en|ku|tr")return false;
  if(["ar","bs","ckb","en","ku","tr"].some(k=>typeof record.translations[k]!=="string"||!record.translations[k].trim()))
    return false;
  if(prepared.has(record.sourceTitle))return false;
  prepared.set(record.sourceTitle,record);
 }
 titleByGerman.clear();for(const [key,val] of prepared)titleByGerman.set(key,val);
 schedule();return true;
}
function updateKnownTitles(locale){
 const nodes=global.document?.querySelectorAll?.(HEADLINE_SELECTORS);
 if(!nodes)return;
 nodes.forEach(element=>{
  // Deliberately only title-only leaf nodes, never the article or du'a body.
  if(element.children?.length)return;
  const current=String(element.textContent||"");
  let old=originalTitles.get(element);
  if(old&&current!==old.source&&current!==old.rendered)old=null;
  if(!old){
   if(!titleByGerman.has(current))return;
   old={source:current,rendered:current};originalTitles.set(element,old);
  }
  const record=titleByGerman.get(old.source);
  const id=element.closest?.("[data-dv3-value],[data-dhp-value],[data-post-id],[data-dua-id]");
  const boundId=id?.getAttribute?.("data-dv3-value")||
                id?.getAttribute?.("data-dhp-value")||
                id?.getAttribute?.("data-post-id")||
                id?.getAttribute?.("data-dua-id");
  if(boundId&&boundId!==record?.id)return;
  const desired=locale==="de"?old.source:record?.translations?.[locale]||old.source;
  if(element.textContent!==desired)element.textContent=desired;
  old.rendered=desired;
 });
}

function registerLocaleData(pack){
 if(pack?.schemaVersion!==1||pack.sourceLocale!=="de"||
    pack.scope!=="adult-interface-only"||pack.noPaidProvider!==true||!pack.translations)return false;
 const prepared=new Map();
 for(const code of SUPPORTED){
  if(code==="de")continue;
  const value=pack.translations[code];
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const dict=new Map();
  for(const [de,tr] of Object.entries(value)){
   if(typeof de==="string"&&de.trim()&&de.length<=240&&
      typeof tr==="string"&&tr.trim()&&tr.length<=400&&
      !/[<>]/.test(de+tr))dict.set(de,tr);
  }
  prepared.set(code,dict);
 }
 for(const [key,value] of prepared)languagePacks.set(key,value);
 specialBlocks.clear();
 for(const code of SUPPORTED){
  if(code==="de")continue;
  const welcome=pack.specialBlocks?.homeWelcome?.[code];
  if(typeof welcome==="string"&&welcome.length>30&&welcome.length<800&&
     welcome.includes("DĀR AL TAWḤĪD")&&!/[<>]/.test(welcome))specialBlocks.set(code,welcome);
 }
 schedule();return true;
}
/* Optional central interface catalog: one static asset, no client AI or paid calls.
   Existing reviewed manual phrases take precedence; Arabic/source text excluded below. */
const manualKeys=new Set(dictionary.keys());
let remoteCatalogState="not-loaded";
const CATALOG_PATH="/test/i18n/ui-tr.generated.json";
function catalogSafe(de,tr){
 if(typeof de!=="string"||typeof tr!=="string")return false;
 if(de.trim()!==de||tr.trim()!==tr||de.length<2||de.length>180||tr.length<1||tr.length>220)return false;
 if(/[\u0600-\u06ff]/.test(de)||/[<>]/.test(de+tr))return false;
 if(/https?:\/\/|[\r\n]/.test(de+tr))return false;
 return true;
}
async function loadCatalog(fetcher=global.fetch?.bind(global)){
 if(remoteCatalogState==="loaded")return dictionary.size;
 if(typeof fetcher!=="function"){remoteCatalogState="unavailable";return dictionary.size}
 remoteCatalogState="loading";
 try{
  const response=await fetcher(CATALOG_PATH,{credentials:"same-origin",cache:"no-store"});
  if(!response?.ok)throw Error("Catalog unavailable");
  const data=await response.json();
  if(data?.schemaVersion!==1||data.locale!=="tr"||data.sourceLocale!=="de"||
     data.scope!=="adult-test-ui-only"||!data.entries||typeof data.entries!=="object"||
     Array.isArray(data.entries))throw Error("Invalid UI catalog");
  let added=0;
  for(const [de,tr] of Object.entries(data.entries)){
   if(!catalogSafe(de,tr)||manualKeys.has(de))continue;
   dictionary.set(de,tr);added++;
  }
  remoteCatalogState="loaded";
  schedule();
  return dictionary.size;
 }catch(_){remoteCatalogState="unavailable";return dictionary.size}
}

const INTL_LOCALE={de:"de-DE",tr:"tr-TR",en:"en-GB",ar:"ar-EG-u-ca-gregory",ku:"ku-TR",ckb:"ckb-IQ-u-ca-gregory",bs:"bs-BA",fr:"fr-FR",es:"es-ES"};
const DE_MONTHS=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DE_WEEKDAYS=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
function formatCalendarDate(date,language=currentLocale(),options={weekday:"long",day:"numeric",month:"long",year:"numeric"}){
 const d=date instanceof Date?date:new Date(date);
 if(!Number.isFinite(d.getTime()))return "";
 try{return new Intl.DateTimeFormat(INTL_LOCALE[language]||"de-DE",options).format(d)}
 catch(_){return new Intl.DateTimeFormat("de-DE",options).format(d)}
}
function localizeGermanCalendarLabel(value,language){
 if(!language||language==="de"||value.length>90||!/[A-Za-zäöüß]/.test(value))return null;
 let changed=false,result=value;
 const locale=INTL_LOCALE[language]||"de-DE";
 for(let month=0;month<12;month++){
  const pattern=new RegExp("(^|[\\s,])"+DE_MONTHS[month]+"(?=$|[\\s,0-9.])","g");
  if(!pattern.test(result))continue;
  let m=DE_MONTHS[month];
  try{m=new Intl.DateTimeFormat(locale,{month:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,month,15)))}catch(_){}
  result=result.replace(pattern,(_,before)=>before+m);changed=true;
 }
 for(let day=0;day<7;day++){
  const pattern=new RegExp("(^|[\\s,])"+DE_WEEKDAYS[day]+"(?=$|[\\s,0-9.])","g");
  if(!pattern.test(result))continue;
  let d=DE_WEEKDAYS[day];
  try{d=new Intl.DateTimeFormat(locale,{weekday:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,0,5+day)))}catch(_){}
  result=result.replace(pattern,(_,before)=>before+d);changed=true;
 }
 return changed?result:null;
}
function translateExact(value,language="tr"){
 if(language==="de")return null;
 // Localize the numeric *UI heading* generated by the Prophets profile, never
 // the linked verse text, sūrah title, Arabic original or its German explanation.
 const references=value.match(/^Qurʾān · (\d+) Fundstellen$/);
 if(references){
  const text=language==="tr"?"Kur'an":languagePacks.get(language)?.get("Qurʾān");
  const places=languagePacks.get(language)?.get("Fundstellen")||
    (language==="tr"?"Kaynak yerleri":null);
  return text&&places?text+" · "+references[1]+" "+places:null;
 }
 const statements=value.match(/^(Aussagen im Qurʾān|Aussagen in authentischer Sunnah) · (\d+)$/);
 if(statements){
  const head=language==="tr"?(dictionary.get(statements[1])||languagePacks.get("tr")?.get(statements[1])):
    languagePacks.get(language)?.get(statements[1]);
  return head?head+" · "+statements[2]:null;
 }
 if(language!=="tr")return languagePacks.get(language)?.get(value)??localizeGermanCalendarLabel(value,language);
 const known=dictionary.get(value);
 if(known!==undefined)return known;
 const extraTurkish=languagePacks.get("tr")?.get(value);
 if(extraTurkish!==undefined)return extraTurkish;
 const count=value.match(/^(\d+)\s+Funktionen$/);
 if(count)return count[1]+" işlev";
 const results=value.match(/^(\d+)\s+Ergebnisse$/);
 if(results)return results[1]+" sonuç";
 // Parameterized UI messages are rendered with changing dates/counts/titles.
 // Translate only their action/count labels; never translate the underlying source title.
 const quantity=value.match(/^(\d+)\s+(Veröffentlichungen|Beiträge|Seiten|Themenbereiche|Aussagen|gemerkt)$/);
 const amounts={Veröffentlichungen:"yayın",Beiträge:"yazı",Seiten:"sayfa",
    Themenbereiche:"konu alanı",Aussagen:"söz",gemerkt:"kaydedildi"};
 if(quantity)return quantity[1]+" "+amounts[quantity[2]];
 const ayat=value.match(/^(\d+)\s+Āyāt\s*·\s*(Mekkanisch|Medinensisch)$/);
 if(ayat)return ayat[1]+" âyet · "+(ayat[2]==="Mekkanisch"?"Mekkî":"Medenî");
 const surahs=value.match(/^(\d+)\s+Sūren\s*·\s*(\d+)\s+Āyāt$/);
 if(surahs)return surahs[1]+" sûre · "+surahs[2]+" âyet";
 const rate=value.match(/^(\d+(?:[.,]\d+)?)%\s+Trefferquote$/);
 if(rate)return rate[1]+"% başarı oranı";
 const choice=value.match(/^(\d+)\/(\d+)\s+gewählt$/);
 if(choice)return choice[1]+"/"+choice[2]+" seçildi";
 const listCount=value.match(/^(.{2,90}),\s*(\d+)\s+Veröffentlichungen$/);
 if(listCount)return listCount[1]+", "+listCount[2]+" yayın";
 const pageCount=value.match(/^(.{2,90})\s*·\s*(\d+)\s+Seiten$/);
 if(pageCount)return (dictionary.get(pageCount[1])||pageCount[1])+" · "+pageCount[2]+" sayfa";
 const range=value.match(/^Sūrenbereich wechseln, aktuell (\d+)[–-](\d+)$/);
 if(range)return "Sûre aralığını değiştir, şu an "+range[1]+"–"+range[2];
 const action=value.match(/^(.{2,160}) öffnen$/);
 if(action&&!/[<>\u0600-\u06ff]/.test(action[1]))
   return action[1]+" aç";
 return localizeGermanCalendarLabel(value,language);
}

for(const [de,tr] of ENTRIES){if(backward.has(tr)&&backward.get(tr)!==de)ambiguous.add(tr);else backward.set(tr,de)}
const EXCLUDE="script,style,noscript,textarea,pre,code,[contenteditable],[data-dar-no-translate],[lang='ar'],[dir='rtl'],[class*='quran-arabic'],[class*='ayah-ar'],[class*='arabic-text'],[class*='post-body'],[class*='post-content'],[class*='hadith-text'],[class*='qsource-statement'],[class*='source-quote'],[class*='prophets-quote__de'],[class*='verse-translation'],[class*='dua-meaning'],[data-canonical-content],.prophets-quote__de,.prophets-quote__ar,.prophets-quote__meta,.prophets-quote__title,.prophets-detail__sub,.prophets-verse__text,.prophets-verse__arabic";
const originals=new WeakMap(),attributeOriginals=new WeakMap();
const ATTRS=["placeholder","aria-label","title"];
function currentLocale(){try{const v=global.localStorage?.getItem(KEY);return SUPPORTED.has(v)?v:"de"}catch(_){return"de"}}
function shouldSkip(element){
 if(!element||typeof element.closest!=="function")return false;
 const excluded=element.closest(EXCLUDE);
 if(excluded&&excluded===global.document?.documentElement&&rtl.has(currentLocale()))return false;
 return !!excluded;
}
function transformText(node,locale){
 const parent=node.parentElement;if(!parent||shouldSkip(parent))return;
 const current=String(node.nodeValue||"");
 let state=originals.get(node);
 if(state&&current!==state.source&&current!==state.rendered){state=null;originals.delete(node)}
 if(!state){
  const match=current.match(/^(\s*)(.*?)(\s*)$/s);
  if(!match||translateExact(match[2],locale)===null)return;
  state={source:current,rendered:current};originals.set(node,state);
 }
 const value=state.source.match(/^(\s*)(.*?)(\s*)$/s),translated=translateExact(value[2],locale);
 const desired=translated!==null?value[1]+translated+value[3]:state.source;
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
   if(translateExact(actual,locale)===null)continue;
   prior={source:actual,rendered:actual};state[attr]=prior;
  }
  const desired=translateExact(prior.source,locale)??prior.source;
  if(actual!==desired)element.setAttribute(attr,desired);
  prior.rendered=desired;
 }
}
function apply(root=global.document?.body,locale=currentLocale()){
 if(!root)return 0;
 const doc=global.document;
 if(root.nodeType===1&&!shouldSkip(root))transformAttributes(root,locale);
 renderHomeWelcome(locale);
 const walker=doc.createTreeWalker(root,global.NodeFilter.SHOW_ELEMENT|global.NodeFilter.SHOW_TEXT);
 let node,seen=0;
 while((node=walker.nextNode())!==null){
  if(node.nodeType===1){transformAttributes(node,locale);continue}
  if(node.nodeType===3){transformText(node,locale);seen++}
 }
 if(doc.documentElement){doc.documentElement.lang=locale;doc.documentElement.dir=rtl.has(locale)?"rtl":"ltr"}
 updateKnownTitles(locale);
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
 if(global.document?.createElement&&global.document.head&&
    !global.document.getElementById("dar-test-seven-languages-loader")){
  const script=global.document.createElement("script");
  script.id="dar-test-nine-languages-loader";
  script.src="/test/assets/dar-test-seven-languages-loader.js?v=20261022-v8nine";
  script.async=true;global.document.head.appendChild(script);
 }
 loadCatalog();
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
global.DarTestTurkishUI={apply,schedule,locale:currentLocale,loadCatalog,
  get translatedKeys(){return dictionary.size},
  get catalogStatus(){return remoteCatalogState},
  hasTranslation:(de)=>dictionary.has(de),
  translateValue:translateExact,
  registerLocaleData,registerTitleData,supportedLocales:[...SUPPORTED],formatCalendarDate,
  get localizedDraftTitleCount(){return titleByGerman.size},
  translatePrayerName:(source,locale=currentLocale())=>translateExact(source,locale)||source,
  translatedFor:code=>code==="tr"?dictionary.size:(languagePacks.get(code)?.size||0),
  contentStore:()=>global.DarAdultCentralContent?.create()||null,scope:"adult-test-only"};
})(window);
