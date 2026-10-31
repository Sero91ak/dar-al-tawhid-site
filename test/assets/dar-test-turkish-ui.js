/* DĀR AL TAWḤĪD · adult UI localization, adult DAR TEST ONLY (V1).
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
// The registry stays extensible; pending locales use German fallback only.
const SUPPORTED=new Set(["de","tr","en","ar","ku","ckb","bs","fr","es"]);
const rtl=new Set(["ar","ckb"]),languagePacks=new Map();

const specialBlocks=new Map(),welcomeOriginals=new WeakMap();
function renderHomeWelcome(locale){
 const document=global.document;
 const intro=document?.querySelector?.("#darHomeHtmlParityV1 .dhp-intro");
 if(!intro||!document.createTextNode||!document.createElement)return;
 let state=welcomeOriginals.get(intro);
 if(!state){state={original:intro.innerHTML,last:null};welcomeOriginals.set(intro,state)}
 const translation=locale==="de"?null:specialBlocks.get(locale);
 if(state.last===locale&&(!translation||intro.textContent===translation))return;
 state.last=locale;
 if(!translation){
  intro.removeAttribute("data-dar-no-translate");
  if(intro.innerHTML!==state.original)intro.innerHTML=state.original;
  return;
 }
 intro.setAttribute("data-dar-no-translate","home-intro");
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
     Object.keys(record.translations||{}).sort().join("|")!=="ar|bs|ckb|en|es|fr|ku|tr")return false;
  // Editorial title drafts may cover only locales explicitly present in the
  // draft pack. Registered-but-pending locales must remain German fallback.
  if(Object.keys(record.translations||{}).some(k=>typeof record.translations[k]!=="string"||!record.translations[k].trim()))
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
   if(typeof de==="string"&&de.trim()&&de.length<=420&&
      typeof tr==="string"&&tr.trim()&&tr.length<=800&&
      !/[<>]/.test(de+tr))dict.set(de,tr);
  }
  prepared.set(code,dict);
 }
 for(const [key,value] of prepared)languagePacks.set(key,value);
 rebuildReversePacks();
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
const reversePacks=new Map();
function rebuildReversePacks(){
 reversePacks.clear();
 const add=(code,de,translated)=>{
  if(!code||!de||!translated||translated===de)return;
  let rev=reversePacks.get(code);
  if(!rev){rev=new Map();reversePacks.set(code,rev)}
  if(rev.has(translated)&&rev.get(translated)!==de)rev.set(translated,null);
  else if(!rev.has(translated))rev.set(translated,de);
 };
 for(const [de,translated] of dictionary)add("tr",de,translated);
 for(const [code,dict] of languagePacks)for(const [de,translated] of dict)add(code,de,translated);
}
function isDynamicGermanUi(value){
 return /^Qurʾān · \d+ Fundstellen$/.test(value)||
  /^(Aussagen im Qurʾān|Aussagen in authentischer Sunnah) · \d+$/.test(value)||
  /^Belegte Aussagen · \d+$/.test(value)||
  /^\d+ Quellen · Quellen anzeigen$/.test(value)||
  /^\d+ (?:Inhalt|Inhalte)$/.test(value)||
  /^\d+ geprüfte Berichte$/.test(value)||
  /^Im Qurʾān öffnen · .+$/.test(value)||
  /^.+ \(Vorschau · nicht freigegeben\)$/.test(value)||
  /^Der Prophet Muḥammad ﷺ über ihn · \d+$/.test(value)||
  /^\d+ Suren$/.test(value)||
  /^\d+\s+Ayāt\s*·\s*(Mekkanisch|Medinensisch)$/.test(value)||
  /^Übersetzung: .+$/.test(value)||
  /^Aktuell · zuletzt synchronisiert um .+$/.test(value)||
  /^Offline · Stand vom .+$/.test(value)||
  /^Fast fertig · \d+\/\d+ Dateien · Download fortsetzen$/.test(value)||
  /^\d+ Min$/.test(value)||
  /^Sleep-Timer · \d+:\d{2}$/.test(value)||
  /^Lernen · Āyah \d+$/.test(value)||
  /^Āyah \d+ \/ \d+ · gelernt \d+\/\d+$/.test(value)||
  /^Gespeichert: (?:Links|Rechts) · Auf diesem schmalen Display bleibt die Leiste automatisch unten\.$/.test(value)||
  /^Beleg \d+ öffnen$/.test(value)||
  /^Auswertung: \d+ korrekt, \d+ ähnlich, \d+ offen\.$/.test(value)||
  /^Ich höre: .+$/.test(value)||
  value==="Qiblah"||
  value==="Eid"||
  value==="Ehe"||
  value==="Sūren filtern"||
  value==="MEISTE BEITRÄGE"||
  value==="WENIGSTE BEITRÄGE"||
  value==="ZULETZT ANGESEHEN"||
  value==="Sync"||
  /^Nächster Termin: \d{4}-\d{2}-\d{2}(?: · \d+ Tage)?$/.test(value)||
  /^Preisabruf: .+$/.test(value)||
  /^Aktuell: Folge \d+ \/ \d+$/.test(value)||
  /^Verbleibend: \d+$/.test(value)||
  /^Nächster Wechsel: Freitag .+$/.test(value)||
  /^Serienende: .+$/.test(value)||
  /^Noch: \d+ Tage$/.test(value)||
  /^Noch 7 Tage bis zum Ende der aktuell vorbereiteten Serie\. \d+ \/ \d+ Folgen vorbereitet\. Neue Freitagsimpulse vorbereiten\.$/.test(value)||
  /^\d+\. (?:Muḥarram|Ṣafar|Rabīʿ al-Awwal|Rabīʿ ath-Thānī|Jumādā al-Ūlā|Jumādā ath-Thāniyah|Rajab|Shaʿbān|Ramaḍān|Shawwāl|Dhū al-Qaʿdah|Dhū al-Ḥijjah) \d{3,4}$/.test(value)||
  /^\d+\. (?:Muḥarram|Ṣafar|Rabīʿ al-Awwal|Rabīʿ ath-Thānī|Jumādā al-Ūlā|Jumādā ath-Thāniyah|Rajab|Shaʿbān|Ramaḍān|Shawwāl|Dhū al-Qaʿdah|Dhū al-Ḥijjah) \d{3,4} · .+$/.test(value)||
  /^Tag \d+ · (?:Muḥarram|Ṣafar|Rabīʿ al-Awwal|Rabīʿ ath-Thānī|Jumādā al-Ūlā|Jumādā ath-Thāniyah|Rajab|Shaʿbān|Ramaḍān|Shawwāl|Dhū al-Qaʿdah|Dhū al-Ḥijjah) \d{3,4}$/.test(value)||
  /^\d+\. Tag · Hajj-Saison$/.test(value)||
  /^Angemeldet als .+\. Neue gespeicherte Beiträge werden automatisch synchronisiert\.$/.test(value)||
  /^\d+ Zeilen? · Speichern übernimmt den Text direkt in die Vorschau\.$/.test(value)||
  /^\d+ passende Beiträge öffnen$/.test(value)||
  /^\d+ Beiträge in dieser Serie\.$/.test(value)||
  /^Cloud-Sync nicht bereit \(.+\)\. Bitte später erneut testen\.$/.test(value)||
  /^\d+ für Wiederholung bereit$/.test(value)||
  /^\d+ neue Beiträge verfügbar · Aktualisieren$/.test(value)||
  /^Sure \d+ wird geladen…$/.test(value)||
  /^Wenig freier Speicher: .+ verfügbar\. Vorbereitung läuft trotzdem\.$/.test(value)||
  /^Gebetszeiten öffnen\. Aktuell .+, nächstes Gebet .+ um .+\.$/.test(value)||
  /^Push-Erinnerungen öffnen\. .+\.$/.test(value)||
  /^\d+ Beiträge in diesem Ordner\. Über den Zurückbutton kommst du zur vorherigen Übersicht\.$/.test(value)||
  /^\d+ Beiträge aus diesem Werk$/.test(value)||
  /^\d+ Beiträge auf DĀR AL TAWḤĪD$/.test(value)||
  /^\d+ Überlieferungen · \d+ Ḥadīṯe · \d+ Āṯār$/.test(value)||
  /^\d+ Ḥadīṯe · \d+ Hauptwerke$/.test(value)||
  /^Veröffentlichungen im Bereich .+$/.test(value)||
  /^\d+ Veröffentlichungen? in diesem Themenregal\.$/.test(value)||
  /^Dieses Themenregal bündelt die vorhandenen Veröffentlichungen zu .+\.$/.test(value)||
  /^Aktualisiert: .+ · Auto-Refresh alle 30 Sekunden$/.test(value)||
  /^Statistik konnte nicht geladen werden \(.+\)\.$/.test(value)||
  /^\d+ Zeilen? · Änderungen erscheinen nach dem Speichern in der Vorschau\.$/.test(value)||
  /^Ohne Bewegungssensor: Nutze die Kompass-App deines Handys und suche .+° .+\. Vergleiche mit einer verlässlichen Quelle, bevor du betest\.$/.test(value)||
  /^\d+ Einträge$/.test(value)||
  /^\d+ Beitrag$/.test(value)||
  /^Zuletzt synchronisiert: .+$/.test(value)||
  /^Zuletzt: .+$/.test(value)||
  /^Favoriten auf diesem Gerät: \d+\. Bei Anmeldung werden lokale und Kontodaten standardmäßig zusammengeführt\.$/.test(value)||
  /^Angemeldet als .+\. Unterstützte Daten werden auf allen Geräten synchronisiert\.$/.test(value)||
  /^Ich kann derzeit \d+ überprüfte Fundstellen? zeigen\. Weitere verlangte Belege sind bislang nicht ausreichend überprüft\. Unten findest du die vorhandenen Fundstellen mit ihrem Prüfstatus\.$/.test(value)||
  /^Diese Āyah ist bei diesem Qāriʾ nicht verfügbar\. Es wird vorübergehend .+ abgespielt\.$/.test(value)||
  /^Ausgangsfrage: .+\. Nachfrage dazu: .+$/.test(value)||
  /^Inhalte aktuell · zuletzt .+$/.test(value)||
  /^Inhalte aktuell\. Zuletzt synchronisiert um .+\.$/.test(value)||
  /^\d Stern$/.test(value)||
  /^\d Sterne$/.test(value)||
  /^Slide \d+ von \d+$/.test(value)||
  value==="Bei rotem Status: Startseite → ↻ Sync in der Statusleiste, dann erneut testen."||
  /^\d+\s+(Veröffentlichungen|Beiträge|Seiten|Themenbereiche|Aussagen|gemerkt|Funktionen|Ergebnisse)$/.test(value)||
  /^\d+\s+Āyāt\s*·\s*(Mekkanisch|Medinensisch)$/.test(value)||
  /^\d+\s*·\s*\d+\s+Ayāt\s*·\s*(Mekkanisch|Medinensisch)$/.test(value)||
  /^\d+\s+Sūren\s*·\s*\d+\s+Āyāt$/.test(value)||
  /^Āyah\s+\d+\/\d+$/.test(value)||
  /^Juzʾ\s+\d+$/.test(value)||
  /^Sūrenbereich wechseln(?:\s+.+)?$/.test(value)||
  /^Alle 114 Sūren anzeigen/.test(value)||
  /^\d+\s+Min vor Fajr$/.test(value)||
  /^\d+\s+Minuten vorher$/.test(value)||
  /^\d+ von 5 ausgewählt · \d+ Minuten vorher$/.test(value)||
  /^\d+ Dateien konnten nicht geladen werden\. Der Rest ist offline verfügbar\.$/.test(value)||
  /^\d+ Dateien konnten nicht geladen werden\. Tippe unten auf „Download fortsetzen“\.$/.test(value)||
  /^\d+ weitere Beiträge in dieser Kategorie – nutze die Suche zum Eingrenzen\.$/.test(value)||
  /^Lokaler Inhalt: .+\. Lesestand, Favoriten, Einstellungen und Quiz-Fortschritt bleiben lokal aktiv\.$/.test(value)||
  /^Geschätzter Beginn: .+\. Lokale Mondsichtung kann abweichen\.$/.test(value)||
  /^.+ · Suḥūr, Iftār, Duʿāʾ & Beiträge$/.test(value)||
  /^.+ · Möge Allah dein Fasten annehmen\.$/.test(value)||
  /^Bereich: .+$/.test(value)||
  /^Fehler: .+$/.test(value)||
  /^.+\. Dann siehst du „Nächstes Gebet“ 15 Min vorher und zur Gebetszeit eine Push-Meldung\.$/.test(value)||
  /^Favoriten: \d+\. Beim Einloggen werden lokale und gespeicherte Favoriten zusammengeführt\.$/.test(value)||
  /^Tag \d+ im Fastenmonat$/.test(value)||
  /^Tag \d+$/.test(value)||
  /^Noch ca\. \d+ Tage bis Ramaḍān$/.test(value)||
  /^Noch ca\. \d+ Tage$/.test(value)||
  /^Beleg \d+$/.test(value)||
  /^\d+ Aufrufe$/.test(value)||
  /^\d+ Aufrufe · .+$/.test(value)||
  /^\d+ Tage$/.test(value)||
  /^\d+ Std\.$/.test(value)||
  /^\d+ neu$/.test(value)||
  /^\d+\/\d+ Dateien · \d+%(?: · .+)?$/.test(value)||
  /^Meist gelesen Platz \d+: .+$/.test(value)||
  /^\d+ Ḥadīṯe – nach Werken geordnet\.$/.test(value)||
  /^\d+ von \d+ (?:Bücher|Gelehrte|Werke)$/.test(value)||
  /^\d+ (?:Bücher|Gelehrte|Werke)$/.test(value)||
  /^\d+ Werke · Gesamtkatalog$/.test(value)||
  /^\d+ Beiträge, \d+ Duʿāʾ$/.test(value)||
  /^Seite \d+ von \d+$/.test(value)||
  /^Seite \d+$/.test(value)||
  /^0 von \d+$/.test(value)||
  /^Herausgegeben von .+$/.test(value)||
  /^Weiterlesen · S\. \d+$/.test(value)||
  /^Version .+$/.test(value)||
  /^PDF-Leser: .+$/.test(value)||
  /^Noch \d+ Tage$/.test(value)||
  /^Noch \d+ Tage im Fokus$/.test(value)||
  /^Noch ca\. \d+ Std\. im Fokus$/.test(value)||
  /^\d\/5 gewählt$/.test(value)||
  /^In \d+ Min · .+ Uhr\. (?:Fajr|Dhuhr|ʿAṣr|Maghrib|ʿIshāʾ) naht — /.test(value)||
  /^\d+(?:[.,]\d+)?%\s+Trefferquote$/.test(value)||
  /^\d+\/\d+\s+gewählt$/.test(value)||
  /^Sūrenbereich wechseln, aktuell \d+[–-]\d+$/.test(value)||
  /^.{2,90}, \d+ Veröffentlichungen$/.test(value)||
  /^.{2,90} · \d+ Seiten$/.test(value)||
  /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag), \d{1,2}\. (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) /.test(value)||
  (/^.{2,160} öffnen$/.test(value)&&!/[\u0600-\u06ff<>]/.test(value))||
  /^(?:←|→|↗|‹|›)\s+\S/.test(value)||
  /^Alle\s+\S/.test(value)||
  /\swird geladen/.test(value)||
  /^\d+\s+Duʿāʾ$/.test(value)||
  /^Wetter für .+ wird geladen …$/.test(value)||
  /^Wetter · .+: derzeit nicht verfügbar$/.test(value)||
  /^Wetter · .+: \d+ °C · .+$/.test(value)||
  /^\d+ Treffer$/.test(value)||
  /^Live-Kompass nicht verfügbar\. Qibla: ca\. \d+(?:[.,]\d+)?° \([^)]+\)\. Öffne die Kompass-App deines Handys und richte dich auf \d+(?:[.,]\d+)?° aus\. Bitte Richtung prüfen\.$/.test(value)||
  /^Offline fortsetzen \d+\/\d+$/.test(value)||
  /^\d+\s+(?:Aussagen mit Quellen\.|bekannte Duʿāʾ nach Themen\.|Namen und Zuordnungen\.|gespeichert\.|Meldungen und Hinweise\.|geprüfte Werke und zitierte Gelehrte\.|Gebete aktiv)$/.test(value)||
  /^Frage \d+(?: von |\/)\d+$/.test(value)||
  /^\d+ \/ \d+ richtig$/.test(value)||
  /^\d+ Runden · \d+ Fragen beantwortet$/.test(value)||
  /^.+ · Sync aktiv$/.test(value)||
  /^.{1,48} ist eingetreten$/.test(value)||
  /^Passend: .+$/.test(value)||
  /^Weitere Treffer anzeigen · \d+ von \d+$/.test(value)||
  /^\d+ Min vorher$/.test(value)||
  /^Taḥajjud · \d+ Min vor Fajr$/.test(value)||
  /^Wiederholen · .+$/.test(value)||
  /^ḤADĪṮ-WERK · .+$/.test(value)||
  /^\d+ Titel$/.test(value)||
  /^Bildbeitrag zu: .+$/.test(value)||
  compoundKnown(value);
}
function compoundKnown(value){
 if(!value.includes(" · "))return false;
 if(dictionary.has(value))return false;
 for(const dict of languagePacks.values())if(dict.has(value))return false;
 const bits=value.split(" · ").map(part=>part.trim());
 if(bits.length<2||bits.length>6)return false;
 return bits.every(part=>part&&part.length<=80&&(dictionary.has(part)||[...languagePacks.values()].some(dict=>dict.has(part))||isDynamicGermanUi(part)));
}
function lookupPack(value,language){
 if(language==="tr"){
  if(dictionary.has(value))return dictionary.get(value);
  const extra=languagePacks.get("tr")?.get(value);
  if(extra!==undefined)return extra;
  return undefined;
 }
 return languagePacks.get(language)?.get(value);
}
function translateComposed(value,language){
 const direct=lookupPack(value,language);
 if(direct!==undefined)return direct;
 if(value.includes(" · ")){
  const bits=value.split(" · ").map(part=>part.trim());
  if(bits.length>=2&&bits.length<=6&&bits.every(part=>part&&part.length<=80)){
   const mapped=bits.map(part=>{
    const known=lookupPack(part,language);
    return known!==undefined?known:translateSharedPatterns(part,language);
   });
   if(mapped.every(part=>part!==undefined&&part!==null))return mapped.join(" · ");
  }
 }
 const wrapped=value.match(/^(\s*(?:←|→|↗|‹|›)\s*)(.+?)(\s*(?:→|↗|›))?\s*$/);
 if(wrapped){
  const inner=lookupPack(wrapped[2].trim(),language);
  if(inner!==undefined)return wrapped[1]+inner+(wrapped[3]||"");
 }
 const alle=value.match(/^Alle\s+(.+?)(\s*[→↗›])?$/);
 if(alle){
  const all=lookupPack("Alle",language);
  const rest=lookupPack(alle[1].trim(),language);
  if(all!==undefined&&rest!==undefined)return all+" "+rest+(alle[2]||"");
 }
 const loading=value.match(/^(.+?)\s+wird geladen(\s*[….]+)?\s*$/);
 if(loading){
  const noun=lookupPack(loading[1].trim(),language);
  const verb=lookupPack("wird geladen",language);
  if(verb!==undefined)return (noun!==undefined?noun:loading[1].trim())+" "+verb+(loading[2]||"");
 }
 const duas=value.match(/^(\d+)\s+Duʿāʾ$/);
 if(duas){
  const word=lookupPack("Duʿāʾ",language);
  if(word!==undefined)return duas[1]+" "+word;
 }
 return null;
}
function germanSourceOf(text){
 const value=String(text||"");
 if(!value)return null;
 if(dictionary.has(value))return value;
 for(const dict of languagePacks.values())if(dict.has(value))return value;
 if(isDynamicGermanUi(value))return value;
 for(const rev of reversePacks.values()){
  if(!rev.has(value))continue;
  const de=rev.get(value);
  if(de)return de;
 }
 return null;
}
rebuildReversePacks();
const UI_WORDS={
 "Sūren":{ar:"سور",en:"sūrahs",tr:"sûre",ku:"sûre",ckb:"سوورە",bs:"sure",fr:"sourates",es:"suras"},
 "Āyāt":{ar:"آيات",en:"āyāt",tr:"âyet",ku:"âyet",ckb:"ئایەت",bs:"ajeta",fr:"āyāt",es:"aleyas"},
 "Ayāt":{ar:"آيات",en:"āyāt",tr:"âyet",ku:"âyet",ckb:"ئایەت",bs:"ajeta",fr:"āyāt",es:"aleyas"},
 "Āyah":{ar:"آية",en:"āyah",tr:"âyet",ku:"ayet",ckb:"ئایە",bs:"ajet",fr:"āyah",es:"aleya"},
 "Juzʾ":{ar:"الجزء",en:"juzʾ",tr:"cüz",ku:"cüz",ckb:"جوزء",bs:"džuz",fr:"juzʾ",es:"juzʾ"},
 "Mekkanisch":{ar:"مكي",en:"Meccan",tr:"Mekkî",ku:"Mekkî",ckb:"مەککی",bs:"mekkanska",fr:"mecquoise",es:"mequí"},
 "Medinensisch":{ar:"مدني",en:"Medinan",tr:"Medenî",ku:"Medînî",ckb:"مەدەنی",bs:"medinska",fr:"médinoise",es:"mediní"},
 "öffnen":{ar:"فتح",en:"Open",tr:"aç",ku:"veke",ckb:"کردنەوە",bs:"otvori",fr:"ouvrir",es:"abrir"},
 "wird geladen":{ar:"جارٍ التحميل",en:"is loading",tr:"yükleniyor",ku:"tê barkirin",ckb:"باردەکرێت",bs:"se učitava",fr:"est en cours de chargement",es:"se está cargando"}
};
function uiWord(language,de){
 const known=lookupPack(de,language);
 if(known!==undefined)return known;
 const row=UI_WORDS[de];
 return row?.[language]||null;
}
function translateSharedPatterns(value,language){
 if(value==="Qiblah"){
  const qibla=lookupPack("Qibla",language);
  if(qibla)return qibla;
 }
 if(value==="Sūren filtern"){
  const surahFilter=lookupPack("Suren filtern",language);
  if(surahFilter)return surahFilter;
 }
 if(value==="Eid"){
  const eid=lookupPack("ʿĪd",language);
  if(eid)return eid;
 }
 if(value==="Ehe"){
  const marriage=lookupPack("Heirat",language);
  if(marriage)return marriage;
 }
 if(value==="MEISTE BEITRÄGE"){
  const most=lookupPack("Meiste Beiträge",language);
  if(most)return most;
 }
 if(value==="WENIGSTE BEITRÄGE"){
  const least=lookupPack("Wenigste Beiträge",language);
  if(least)return least;
 }
 if(value==="ZULETZT ANGESEHEN"){
  const recent=lookupPack("Zuletzt angesehen",language);
  if(recent)return recent;
 }
 if(value==="Sync"){
  const sync=lookupPack("Synchronisieren",language);
  if(sync)return sync;
 }
 const nextDue=value.match(/^Nächster Termin: (\d{4}-\d{2}-\d{2})(?: · (\d+) Tage)?$/);
 if(nextDue){
  const date=nextDue[1],days=nextDue[2];
  const head={
   ar:"الموعد التالي: ",
   en:"Next date: ",
   tr:"Sonraki tarih: ",
   ku:"Dema paşîn: ",
   ckb:"وادەی داهاتوو: ",
   bs:"Sljedeći datum: ",
   fr:"Prochaine date : ",
   es:"Próxima fecha: "
  }[language];
  const dayWord={
   ar:days==="1"?"يوم":"أيام",
   en:days==="1"?"day":"days",
   tr:"gün",
   ku:"roj",
   ckb:"ڕۆژ",
   bs:days==="1"?"dan":"dana",
   fr:days==="1"?"jour":"jours",
   es:days==="1"?"día":"días"
  }[language];
  if(head)return head+date+(days?" · "+days+" "+dayWord:"");
 }
 const priceFetch=value.match(/^Preisabruf: (.+)$/);
 if(priceFetch){
  const head={
   ar:"طلب السعر: ",
   en:"Price request: ",
   tr:"Fiyat sorgusu: ",
   ku:"Daxwaza bihayê: ",
   ckb:"داواکاری نرخ: ",
   bs:"Upit cijene: ",
   fr:"Demande de prix : ",
   es:"Consulta de precio: "
  }[language];
  if(head)return head+priceFetch[1];
 }
 const episodeNow=value.match(/^Aktuell: Folge (\d+) \/ (\d+)$/);
 if(episodeNow){
  const head={
   ar:"الآن: الحلقة ",
   en:"Now: episode ",
   tr:"Şimdi: bölüm ",
   ku:"Niha: beş ",
   ckb:"ئێستا: بەشی ",
   bs:"Sada: nastavak ",
   fr:"Actuellement : épisode ",
   es:"Ahora: episodio "
  }[language];
  if(head)return head+episodeNow[1]+" / "+episodeNow[2];
 }
 const remainingEp=value.match(/^Verbleibend: (\d+)$/);
 if(remainingEp){
  const head={
   ar:"المتبقي: ",
   en:"Remaining: ",
   tr:"Kalan: ",
   ku:"Mayî: ",
   ckb:"ماوە: ",
   bs:"Preostalo: ",
   fr:"Restant : ",
   es:"Restante: "
  }[language];
  if(head)return head+remainingEp[1];
 }
 const nextSwitch=value.match(/^Nächster Wechsel: Freitag (.+)$/);
 if(nextSwitch){
  const head={
   ar:"التبديل التالي: الجمعة ",
   en:"Next change: Friday ",
   tr:"Sonraki değişim: ",
   ku:"Guhertina paşîn: ",
   ckb:"گۆڕینی داهاتوو: ",
   bs:"Sljedeća izmjena: ",
   fr:"Prochain changement : ",
   es:"Próximo cambio: "
  }[language];
  if(head)return head+nextSwitch[1];
 }
 const seriesEnd=value.match(/^Serienende: (.+)$/);
 if(seriesEnd){
  const head={
   ar:"نهاية السلسلة: ",
   en:"Series end: ",
   tr:"Seri sonu: ",
   ku:"Dawiya rêzê: ",
   ckb:"کۆتایی زنجیرە: ",
   bs:"Kraj serije: ",
   fr:"Fin de la série : ",
   es:"Fin de la serie: "
  }[language];
  if(head)return head+seriesEnd[1];
 }
 const daysStill=value.match(/^Noch: (\d+) Tage$/);
 if(daysStill){
  const n=daysStill[1];
  const head={
   ar:"بقي: ",
   en:"Left: ",
   tr:"Kaldı: ",
   ku:"Ma: ",
   ckb:"ماوەتەوە: ",
   bs:"Još: ",
   fr:"Encore : ",
   es:"Quedan: "
  }[language];
  const dayWord={
   ar:n==="1"?"يوم":"أيام",
   en:n==="1"?"day":"days",
   tr:"gün",
   ku:"roj",
   ckb:"ڕۆژ",
   bs:n==="1"?"dan":"dana",
   fr:n==="1"?"jour":"jours",
   es:n==="1"?"día":"días"
  }[language];
  if(head)return head+n+" "+dayWord;
 }
 const weekWarn=value.match(/^Noch 7 Tage bis zum Ende der aktuell vorbereiteten Serie\. (\d+) \/ (\d+) Folgen vorbereitet\. Neue Freitagsimpulse vorbereiten\.$/);
 if(weekWarn){
  const line={
   ar:"تبقّى 7 أيام حتى نهاية السلسلة المُعدّة حالياً. أُعدّت "+weekWarn[1]+" / "+weekWarn[2]+" حلقات. جهّز خواطر جمعة جديدة.",
   en:"7 days remain until the end of the series prepared now. "+weekWarn[1]+" / "+weekWarn[2]+" episodes are prepared. Prepare new Friday reminders.",
   tr:"Şu an hazırlanan serinin bitmesine 7 gün kaldı. "+weekWarn[1]+" / "+weekWarn[2]+" bölüm hazır. Yeni cuma hatırlatmaları hazırla.",
   ku:"Heta dawiya rêza niha amadekirî 7 roj mane. "+weekWarn[1]+" / "+weekWarn[2]+" beş amade ne. Bîranînên înê yên nû amade bike.",
   ckb:"7 ڕۆژ ماوە تا کۆتایی زنجیرەی ئێستا ئامادەکراو. "+weekWarn[1]+" / "+weekWarn[2]+" بەش ئامادەیە. بیرخستنەوەی هەینیی نوێ ئامادە بکە.",
   bs:"Ostaje 7 dana do kraja trenutno pripremljene serije. Pripremljeno je "+weekWarn[1]+" / "+weekWarn[2]+" nastavaka. Pripremi nove petkovne podsjetnike.",
   fr:"Il reste 7 jours avant la fin de la série actuellement préparée. "+weekWarn[1]+" / "+weekWarn[2]+" épisodes sont prêts. Prépare de nouveaux rappels du vendredi.",
   es:"Quedan 7 días hasta el fin de la serie preparada ahora. Hay "+weekWarn[1]+" / "+weekWarn[2]+" episodios listos. Prepara nuevos recordatorios del viernes."
  }[language];
  if(line)return line;
 }
 const hijriMonth="Muḥarram|Ṣafar|Rabīʿ al-Awwal|Rabīʿ ath-Thānī|Jumādā al-Ūlā|Jumādā ath-Thāniyah|Rajab|Shaʿbān|Ramaḍān|Shawwāl|Dhū al-Qaʿdah|Dhū al-Ḥijjah";
 const hijriDated=value.match(new RegExp("^(\\\d+)\\\. ("+hijriMonth+") (\\\d{3,4}) · (.+)$"));
 if(hijriDated){
  const month=lookupPack(hijriDated[2],language)||hijriDated[2];
  const rawTail=hijriDated[4];
  const greg=localizeGermanCalendarLabel(rawTail,language);
  const tail=(greg&&greg!==rawTail)?greg:(lookupPack(rawTail,language)||translateSharedPatterns(rawTail,language)||rawTail);
  return hijriDated[1]+". "+month+" "+hijriDated[3]+" · "+tail;
 }
 const hijriOnly=value.match(new RegExp("^(\\\d+)\\\. ("+hijriMonth+") (\\\d{3,4})$"));
 if(hijriOnly){
  const month=lookupPack(hijriOnly[2],language)||hijriOnly[2];
  return hijriOnly[1]+". "+month+" "+hijriOnly[3];
 }
 const hijriTag=value.match(new RegExp("^Tag (\\\d+) · ("+hijriMonth+") (\\\d{3,4})$"));
 if(hijriTag){
  const month=lookupPack(hijriTag[2],language)||hijriTag[2];
  const n=hijriTag[1];
  const forms={
   ar:"اليوم "+n+" · "+month+" "+hijriTag[3],
   en:"Day "+n+" · "+month+" "+hijriTag[3],
   tr:n+". gün · "+month+" "+hijriTag[3],
   ku:"Roja "+n+" · "+month+" "+hijriTag[3],
   ckb:"ڕۆژی "+n+" · "+month+" "+hijriTag[3],
   bs:"Dan "+n+" · "+month+" "+hijriTag[3],
   fr:"Jour "+n+" · "+month+" "+hijriTag[3],
   es:"Día "+n+" · "+month+" "+hijriTag[3]
  };
  return forms[language]||null;
 }
 const hajjDay=value.match(/^(\d+)\. Tag · Hajj-Saison$/);
 if(hajjDay){
  const season=lookupPack("Hajj-Saison",language)||"Hajj-Saison";
  const n=hajjDay[1];
  const forms={
   ar:"اليوم "+n+" · "+season,
   en:"Day "+n+" · "+season,
   tr:n+". gün · "+season,
   ku:"Roja "+n+" · "+season,
   ckb:"ڕۆژی "+n+" · "+season,
   bs:"Dan "+n+" · "+season,
   fr:"Jour "+n+" · "+season,
   es:"Día "+n+" · "+season
  };
  return forms[language]||null;
 }
 const signedSaved=value.match(/^Angemeldet als (.+)\. Neue gespeicherte Beiträge werden automatisch synchronisiert\.$/);
 if(signedSaved){
  const name=signedSaved[1];
  const forms={
   ar:"تم تسجيل الدخول باسم "+name+". تُزامن المقالات المحفوظة الجديدة تلقائياً.",
   en:"Signed in as "+name+". Newly saved articles are synced automatically.",
   tr:name+" olarak giriş yapıldı. Yeni kaydedilen yazılar otomatik eşitlenir.",
   ku:"Wekî "+name+" têketî ye. Nivîsên nû yên tomarkirî bixweber tên hevdengkirin.",
   ckb:"چوویتە ژوورەوە وەک "+name+". بابەتە هەڵگیراوە نوێیەکان خۆکارانە هاوکات دەکرێن.",
   bs:"Prijavljen kao "+name+". Novi sačuvani tekstovi se automatski usklađuju.",
   fr:"Connecté en tant que "+name+". Les nouveaux articles enregistrés sont synchronisés automatiquement.",
   es:"Sesión iniciada como "+name+". Los artículos guardados nuevos se sincronizan solos."
  };
  return forms[language]||null;
 }
 const editorLines=value.match(/^(\d+) Zeilen? · Speichern übernimmt den Text direkt in die Vorschau\.$/);
 if(editorLines){
  const n=editorLines[1];
  const forms={
   ar:n+" سطر · الحفظ ينقل النص مباشرة إلى المعاينة.",
   en:n+" "+(n==="1"?"line":"lines")+" · Save applies the text directly in the preview.",
   tr:n+" satır · Kaydet metni doğrudan önizlemeye alır.",
   ku:n+" rêzik · Tomarkirin nivîsê rasterast di pêşdîtina de digire.",
   ckb:n+" دێڕ · پاشەکەوتکردن دەقەکە ڕاستەوخۆ دەخاتە پێشبینین.",
   bs:n+" "+(n==="1"?"red":"reda")+" · Spremanje preuzima tekst izravno u pregled.",
   fr:n+" "+(n==="1"?"ligne":"lignes")+" · Enregistrer reprend le texte directement dans l’aperçu.",
   es:n+" "+(n==="1"?"línea":"líneas")+" · Guardar aplica el texto directamente en la vista previa."
  };
  return forms[language]||null;
 }
 const matchingPosts=value.match(/^(\d+) passende Beiträge öffnen$/);
 if(matchingPosts){
  const n=matchingPosts[1];
  const forms={
   ar:"افتح "+n+" مقالات مناسبة",
   en:"Open "+n+" matching articles",
   tr:n+" uygun yazıyı aç",
   ku:n+" nivîsên guncaw veke",
   ckb:n+" بابەتی گونجاو بکەرەوە",
   bs:"Otvori "+n+" odgovarajućih tekstova",
   fr:"Ouvrir "+n+" articles correspondants",
   es:"Abrir "+n+" artículos coincidentes"
  };
  return forms[language]||null;
 }
 const seriesCount=value.match(/^(\d+) Beiträge in dieser Serie\.$/);
 if(seriesCount){
  const n=seriesCount[1];
  const forms={
   ar:n+" مقالات في هذه السلسلة.",
   en:n+" articles in this series.",
   tr:"Bu dizide "+n+" yazı.",
   ku:n+" nivîs di vê rêzê de.",
   ckb:n+" بابەت لەم زنجیرەیەدا.",
   bs:n+" tekstova u ovoj seriji.",
   fr:n+" articles dans cette série.",
   es:n+" artículos en esta serie."
  };
  return forms[language]||null;
 }
 const cloudWait=value.match(/^Cloud-Sync nicht bereit \((.+)\)\. Bitte später erneut testen\.$/);
 if(cloudWait){
  const status=cloudWait[1];
  const forms={
   ar:"مزامنة السحابة غير جاهزة ("+status+"). يُرجى المحاولة لاحقاً.",
   en:"Cloud sync is not ready ("+status+"). Please try again later.",
   tr:"Bulut eşitlemesi hazır değil ("+status+"). Lütfen daha sonra yeniden dene.",
   ku:"Hevdengkirina ewr ne amade ye ("+status+"). Ji kerema xwe paşê dîsa biceribîne.",
   ckb:"هاوکاتکردنی هەور ئامادە نییە ("+status+"). تکایە دواتر دووبارە تاقی بکەرەوە.",
   bs:"Sinkronizacija u oblaku nije spremna ("+status+"). Pokušaj kasnije ponovo.",
   fr:"La synchronisation cloud n’est pas prête ("+status+"). Réessaie plus tard.",
   es:"La sincronización en la nube no está lista ("+status+"). Prueba de nuevo más tarde."
  };
  return forms[language]||null;
 }
 const repeatReady=value.match(/^(\d+) für Wiederholung bereit$/);
 if(repeatReady){
  const n=repeatReady[1];
  const forms={
   ar:n+" جاهزة للإعادة",
   en:n+" ready to review",
   tr:n+" tekrar için hazır",
   ku:n+" ji bo dubarekirinê amade ne",
   ckb:n+" ئامادەیە بۆ دووبارەکردنەوە",
   bs:n+" spremno za ponavljanje",
   fr:n+" prêt à répéter",
   es:n+" listo para repetir"
  };
  return forms[language]||null;
 }
 const freshPosts=value.match(/^(\d+) neue Beiträge verfügbar · Aktualisieren$/);
 if(freshPosts){
  const n=freshPosts[1];
  const refresh=lookupPack("Aktualisieren",language)||"Aktualisieren";
  const forms={
   ar:n+" مقالات جديدة متاحة · "+refresh,
   en:n+" new articles available · "+refresh,
   tr:n+" yeni yazı hazır · "+refresh,
   ku:n+" nivîsên nû amade ne · "+refresh,
   ckb:n+" بابەتی نوێ ئامادەیە · "+refresh,
   bs:n+" novih tekstova dostupno · "+refresh,
   fr:n+" nouveaux articles disponibles · "+refresh,
   es:n+" artículos nuevos disponibles · "+refresh
  };
  return forms[language]||null;
 }
 const surahLoad=value.match(/^Sure (\d+) wird geladen…$/);
 if(surahLoad){
  const n=surahLoad[1];
  const forms={
   ar:"تُحمَّل السورة "+n+"…",
   en:"Surah "+n+" is loading…",
   tr:n+". sure yükleniyor…",
   ku:"Sûreya "+n+" tê barkirin…",
   ckb:"سوورەی "+n+" باردەکرێت…",
   bs:"Sura "+n+" se učitava…",
   fr:"La sourate "+n+" se charge…",
   es:"La sura "+n+" se está cargando…"
  };
  return forms[language]||null;
 }
 const lowStorage=value.match(/^Wenig freier Speicher: (.+) verfügbar\. Vorbereitung läuft trotzdem\.$/);
 if(lowStorage){
  const free=lowStorage[1];
  const forms={
   ar:"مساحة حرة قليلة: "+free+" متاحة. التحضير يستمر رغم ذلك.",
   en:"Little free storage: "+free+" available. Preparation continues anyway.",
   tr:"Az boş alan: "+free+" kullanılabilir. Hazırlık yine de sürüyor.",
   ku:"Cihê vala kêm e: "+free+" berdest e. Amadekirin dîsa didome.",
   ckb:"شوێنی بەتاڵ کەمە: "+free+" بەردەستە. ئامادەکردن هەر بەردەوامە.",
   bs:"Malo slobodnog prostora: "+free+" dostupno. Priprema ipak traje.",
   fr:"Peu d’espace libre : "+free+" disponible. La préparation continue quand même.",
   es:"Poco espacio libre: "+free+" disponible. La preparación sigue de todos modos."
  };
  return forms[language]||null;
 }
 const prayerAria=value.match(/^Gebetszeiten öffnen\. Aktuell (.+), nächstes Gebet (.+) um (.+)\.$/);
 if(prayerAria){
  const open=lookupPack("Gebetszeiten öffnen",language)||"Gebetszeiten öffnen";
  const nowName=lookupPack(prayerAria[1],language)||prayerAria[1];
  const nextName=lookupPack(prayerAria[2],language)||prayerAria[2];
  const clock=prayerAria[3];
  const forms={
   ar:open+". الآن "+nowName+"، الصلاة التالية "+nextName+" عند "+clock+".",
   en:open+". Now "+nowName+", next prayer "+nextName+" at "+clock+".",
   tr:open+". Şu an "+nowName+", sonraki namaz "+nextName+" saat "+clock+".",
   ku:open+". Niha "+nowName+", nimêja pêş "+nextName+" di "+clock+" de.",
   ckb:open+". ئێستا "+nowName+"، نوێژی داهاتوو "+nextName+" لە "+clock+".",
   bs:open+". Sada "+nowName+", sljedeći namaz "+nextName+" u "+clock+".",
   fr:open+". Maintenant "+nowName+", prière suivante "+nextName+" à "+clock+".",
   es:open+". Ahora "+nowName+", oración siguiente "+nextName+" a las "+clock+"."
  };
  return forms[language]||null;
 }
 const pushAria=value.match(/^Push-Erinnerungen öffnen\. (.+)\.$/);
 if(pushAria){
  const parts=pushAria[1].split(", ").map(part=>lookupPack(part,language)||part);
  const body=parts.join(", ");
  const forms={
   ar:"افتح تذكيرات Push. "+body+".",
   en:"Open Push reminders. "+body+".",
   tr:"Push hatırlatmalarını aç. "+body+".",
   ku:"Bîranînên Push veke. "+body+".",
   ckb:"بیرخستنەوەکانی Push بکەرەوە. "+body+".",
   bs:"Otvori Push podsjetnike. "+body+".",
   fr:"Ouvrir les rappels Push. "+body+".",
   es:"Abrir los recordatorios Push. "+body+"."
  };
  return forms[language]||null;
 }
 const folderBack=value.match(/^(\d+) Beiträge in diesem Ordner\. Über den Zurückbutton kommst du zur vorherigen Übersicht\.$/);
 if(folderBack){
  const n=folderBack[1];
  const forms={
   ar:n+" مقالات في هذا المجلد. عبر زر الرجوع تعود إلى العرض السابق.",
   en:n+" articles in this folder. The back button returns to the previous overview.",
   tr:"Bu klasörde "+n+" yazı. Geri düğmesi önceki özete götürür.",
   ku:n+" nivîs di vê peldankê de. Bişkoka vegerê vedigere kurteya berê.",
   ckb:n+" بابەت لەم بوخچەیەدا. دوگمەی گەڕانەوە دەگەڕێتەوە بۆ پوختەی پێشوو.",
   bs:n+" tekstova u ovoj fascikli. Dugme nazad vraća na prethodni pregled.",
   fr:n+" articles dans ce dossier. Le bouton retour ramène à l’aperçu précédent.",
   es:n+" artículos en esta carpeta. El botón atrás vuelve al resumen anterior."
  };
  return forms[language]||null;
 }
 const fromWork=value.match(/^(\d+) Beiträge aus diesem Werk$/);
 if(fromWork){
  const n=fromWork[1];
  const forms={
   ar:n+" مقالات من هذا العمل",
   en:n+" articles from this work",
   tr:"Bu eserden "+n+" yazı",
   ku:n+" nivîs ji vê berhemê",
   ckb:n+" بابەت لەم بەرهەمە",
   bs:n+" tekstova iz ovog djela",
   fr:n+" articles de cet ouvrage",
   es:n+" artículos de esta obra"
  };
  return forms[language]||null;
 }
 const onDar=value.match(/^(\d+) Beiträge auf DĀR AL TAWḤĪD$/);
 if(onDar){
  const n=onDar[1];
  const forms={
   ar:n+" مقالات على DĀR AL TAWḤĪD",
   en:n+" articles on DĀR AL TAWḤĪD",
   tr:"DĀR AL TAWḤĪD üzerinde "+n+" yazı",
   ku:n+" nivîs li ser DĀR AL TAWḤĪD",
   ckb:n+" بابەت لە DĀR AL TAWḤĪD",
   bs:n+" tekstova na DĀR AL TAWḤĪD",
   fr:n+" articles sur DĀR AL TAWḤĪD",
   es:n+" artículos en DĀR AL TAWḤĪD"
  };
  return forms[language]||null;
 }
 const mixCounts=value.match(/^(\d+) Überlieferungen · (\d+) Ḥadīṯe · (\d+) Āṯār$/);
 if(mixCounts){
  const reports=lookupPack("Überlieferungen",language)||"Überlieferungen";
  const hadiths=lookupPack("Ḥadīṯe",language)||"Ḥadīṯe";
  const athar=lookupPack("Āthār",language)||"Āthār";
  return mixCounts[1]+" "+reports+" · "+mixCounts[2]+" "+hadiths+" · "+mixCounts[3]+" "+athar;
 }
 const mainWorks=value.match(/^(\d+) Ḥadīṯe · (\d+) Hauptwerke$/);
 if(mainWorks){
  const hadiths=lookupPack("Ḥadīṯe",language)||"Ḥadīṯe";
  const works=lookupPack("Hauptwerke",language)||"Hauptwerke";
  return mainWorks[1]+" "+hadiths+" · "+mainWorks[2]+" "+works;
 }
 const shelfArea=value.match(/^Veröffentlichungen im Bereich (.+)$/);
 if(shelfArea){
  const name=lookupPack(shelfArea[1],language)||shelfArea[1];
  const forms={
   ar:"إصدارات في مجال "+name,
   en:"Publications in "+name,
   tr:name+" alanında yayınlar",
   ku:"Weşan di qada "+name+" de",
   ckb:"بڵاوکراوەکان لە بواری "+name,
   bs:"Publikacije u oblasti "+name,
   fr:"Publications dans "+name,
   es:"Publicaciones en "+name
  };
  return forms[language]||null;
 }
 const shelfCount=value.match(/^(\d+) (Veröffentlichung|Veröffentlichungen) in diesem Themenregal\.$/);
 if(shelfCount){
  const n=shelfCount[1];
  const forms={
   ar:n+" إصدارات في هذا الرف.",
   en:n+" "+(n==="1"?"publication":"publications")+" on this shelf.",
   tr:"Bu konu rafında "+n+" yayın.",
   ku:n+" weşan di vê refika mijarê de.",
   ckb:n+" بڵاوکراوە لەم رفەی بابەتەدا.",
   bs:n+" publikacija na ovoj tematskoj polici.",
   fr:n+" "+(n==="1"?"publication":"publications")+" dans ce rayon.",
   es:n+" "+(n==="1"?"publicación":"publicaciones")+" en este estante."
  };
  return forms[language]||null;
 }
 const shelfAbout=value.match(/^Dieses Themenregal bündelt die vorhandenen Veröffentlichungen zu (.+)\.$/);
 if(shelfAbout){
  const name=lookupPack(shelfAbout[1],language)||shelfAbout[1];
  const forms={
   ar:"يجمع هذا الرف الإصدارات الموجودة حول "+name+".",
   en:"This shelf gathers the publications on "+name+".",
   tr:"Bu konu rafı "+name+" hakkındaki yayınları bir araya getirir.",
   ku:"Ev refika mijarê weşanên heyî yên "+name+" dicivîne.",
   ckb:"ئەم رفەی بابەتە بڵاوکراوەکانی "+name+" کۆدەکاتەوە.",
   bs:"Ova tematska polica okuplja publikacije o "+name+".",
   fr:"Ce rayon rassemble les publications sur "+name+".",
   es:"Este estante reúne las publicaciones sobre "+name+"."
  };
  return forms[language]||null;
 }
 const statsStamp=value.match(/^Aktualisiert: (.+) · Auto-Refresh alle 30 Sekunden$/);
 if(statsStamp){
  const when=localizeGermanCalendarLabel(statsStamp[1],language)||statsStamp[1];
  const forms={
   ar:"آخر تحديث: "+when+" · تحديث تلقائي كل 30 ثانية",
   en:"Updated: "+when+" · auto-refresh every 30 seconds",
   tr:"Güncellendi: "+when+" · her 30 saniyede otomatik yenileme",
   ku:"Hat nûkirin: "+when+" · her 30 çirkeyan nûkirina xweber",
   ckb:"نوێکرایەوە: "+when+" · نوێکردنەوەی خۆکار هەر 30 چرکە",
   bs:"Ažurirano: "+when+" · automatsko osvježavanje svakih 30 sekundi",
   fr:"Mis à jour : "+when+" · actualisation automatique toutes les 30 secondes",
   es:"Actualizado: "+when+" · actualización automática cada 30 segundos"
  };
  return forms[language]||null;
 }
 const statsFail=value.match(/^Statistik konnte nicht geladen werden \((.+)\)\.$/);
 if(statsFail){
  const msg=statsFail[1];
  const forms={
   ar:"تعذّر تحميل الإحصاءات ("+msg+").",
   en:"Statistics could not be loaded ("+msg+").",
   tr:"İstatistik yüklenemedi ("+msg+").",
   ku:"Amar nehatin barkirin ("+msg+").",
   ckb:"ئامارەکان نەتوانرا باربکرێن ("+msg+").",
   bs:"Statistika nije učitana ("+msg+").",
   fr:"Les statistiques n’ont pas pu être chargées ("+msg+").",
   es:"No se pudieron cargar las estadísticas ("+msg+")."
  };
  return forms[language]||null;
 }
 const previewLines=value.match(/^(\d+) Zeilen? · Änderungen erscheinen nach dem Speichern in der Vorschau\.$/);
 if(previewLines){
  const n=previewLines[1];
  const forms={
   ar:n+" سطر · تظهر التغييرات في المعاينة بعد الحفظ.",
   en:n+" "+(n==="1"?"line":"lines")+" · Changes appear in the preview after saving.",
   tr:n+" satır · Değişiklikler kayıttan sonra önizlemede görünür.",
   ku:n+" rêzik · Guhertin piştî tomarkirinê di pêşdîtina de xuya dibin.",
   ckb:n+" دێڕ · گۆڕانکارییەکان دوای پاشەکەوتکردن لە پێشبینین دەردەکەون.",
   bs:n+" "+(n==="1"?"red":"reda")+" · Promjene se nakon spremanja vide u pregledu.",
   fr:n+" "+(n==="1"?"ligne":"lignes")+" · Les changements apparaissent dans l’aperçu après l’enregistrement.",
   es:n+" "+(n==="1"?"línea":"líneas")+" · Los cambios aparecen en la vista previa después de guardar."
  };
  return forms[language]||null;
 }
 const noSensor=value.match(/^Ohne Bewegungssensor: Nutze die Kompass-App deines Handys und suche (.+)° (.+)\. Vergleiche mit einer verlässlichen Quelle, bevor du betest\.$/);
 if(noSensor){
  const deg=noSensor[1];
  const dir=lookupPack(noSensor[2],language)||noSensor[2];
  const app=lookupPack("Kompass-App",language)||"Kompass-App";
  const forms={
   ar:"بدون مستشعر حركة: استخدم "+app+" في هاتفك وابحث عن "+deg+"° "+dir+". قارن بمصدر موثوق قبل أن تصلي.",
   en:"Without a motion sensor: use your phone’s "+app+" and look for "+deg+"° "+dir+". Compare with a reliable source before you pray.",
   tr:"Hareket sensörü yok: telefonundaki "+app+" ile "+deg+"° "+dir+" yönünü ara. Namazdan önce güvenilir bir kaynakla karşılaştır.",
   ku:"Bê senzora tevgerê: "+app+" a telefonê bikar bîne û "+deg+"° "+dir+" bigere. Berî nimêjê bi çavkaniyeke pêbawer re bide ber hev.",
   ckb:"بێ هەستەوەری جووڵە: "+app+"ی مۆبایلەکەت بەکاربهێنە و "+deg+"° "+dir+" بگەڕێ. پێش نوێژ لەگەڵ سەرچاوەیەکی متمانەپێکراو بەراوردی بکە.",
   bs:"Bez senzora pokreta: koristi "+app+" telefona i traži "+deg+"° "+dir+". Prije namaza uporedi s pouzdanim izvorom.",
   fr:"Sans capteur de mouvement : utilise "+app+" du téléphone et cherche "+deg+"° "+dir+". Compare avec une source fiable avant de prier.",
   es:"Sin sensor de movimiento: usa la "+app+" del teléfono y busca "+deg+"° "+dir+". Compara con una fuente fiable antes de orar."
  };
  return forms[language]||null;
 }
 const entries=value.match(/^(\d+) Einträge$/);
 if(entries){
  const word=lookupPack("Einträge",language);
  if(word)return entries[1]+" "+word;
 }
 const surahs=value.match(/^(\d+)\s+Sūren\s*·\s*(\d+)\s+Āyāt$/);
 if(surahs){
  const a=uiWord(language,"Sūren"),b=uiWord(language,"Āyāt");
  if(a&&b)return surahs[1]+" "+a+" · "+surahs[2]+" "+b;
 }
 const verses=value.match(/^(\d+)\s+(Āyāt|Ayāt)\s*·\s*(Mekkanisch|Medinensisch)$/);
 if(verses){
  const a=uiWord(language,verses[2]),b=uiWord(language,verses[3]);
  if(a&&b)return verses[1]+" "+a+" · "+b;
 }
 const reader=value.match(/^(\d+)\s*·\s*(\d+)\s+Ayāt\s*·\s*(Mekkanisch|Medinensisch)$/);
 if(reader){
  const a=uiWord(language,"Ayāt"),b=uiWord(language,reader[3]);
  if(a&&b)return reader[1]+" · "+reader[2]+" "+a+" · "+b;
 }
 const ayah=value.match(/^Āyah\s+(\d+)\/(\d+)$/);
 if(ayah){
  const word=uiWord(language,"Āyah");
  if(word)return word+" "+ayah[1]+"/"+ayah[2];
 }
 const juz=value.match(/^Juzʾ\s+(\d+)$/);
 if(juz){
  const word=uiWord(language,"Juzʾ");
  if(word)return word+" "+juz[1];
 }
 const surenCount=value.match(/^(\d+) Suren$/);
 if(surenCount){
  const word=uiWord(language,"Sūren");
  if(word)return surenCount[1]+" "+word;
 }
 const ayahKind=value.match(/^(\d+)\s+Ayāt\s*·\s*(Mekkanisch|Medinensisch)$/);
 if(ayahKind){
  const a=uiWord(language,"Ayāt"),b=uiWord(language,ayahKind[2]);
  if(a&&b)return ayahKind[1]+" "+a+" · "+b;
 }
 const translationCredit=value.match(/^Übersetzung: (.+)$/);
 if(translationCredit){
  const head=lookupPack("Übersetzung",language);
  if(head)return head+": "+translationCredit[1];
 }
 const syncedAt=value.match(/^Aktuell · zuletzt synchronisiert um (.+)$/);
 if(syncedAt){
  const forms={
   ar:"الحالي · آخر مزامنة في ",
   en:"Current · last synced at ",
   tr:"Güncel · son eşitleme ",
   ku:"Niha · hevdengkirina dawî ",
   ckb:"ئێستا · دوایین هاوکاتکردن ",
   bs:"Trenutno · zadnja sinhronizacija ",
   fr:"Actuel · dernière synchronisation à ",
   es:"Actual · última sincronización a las "
  };
  if(forms[language])return forms[language]+syncedAt[1];
 }
 const offlineStamp=value.match(/^Offline · Stand vom (.+)$/);
 if(offlineStamp){
  const forms={
   ar:"دون اتصال · الحالة من ",
   en:"Offline · state from ",
   tr:"Çevrimdışı · durum ",
   ku:"Negirêdayî · rewş ji ",
   ckb:"ئۆفلاین · بار لە ",
   bs:"Izvan mreže · stanje od ",
   fr:"Hors ligne · état du ",
   es:"Sin conexión · estado del "
  };
  if(forms[language])return forms[language]+offlineStamp[1];
 }
 const almost=value.match(/^Fast fertig · (\d+)\/(\d+) Dateien · Download fortsetzen$/);
 if(almost){
  const cont=lookupPack("Download fortsetzen",language);
  const n=almost[1]+"/"+almost[2];
  const forms={
   ar:"أوشك على الانتهاء · "+n+" ملفات",
   en:"Almost done · "+n+" files",
   tr:"Neredeyse bitti · "+n+" dosya",
   ku:"Hema qediya · "+n+" pel",
   ckb:"نزیکە تەواو بێت · "+n+" پەڕگە",
   bs:"Skoro gotovo · "+n+" datoteka",
   fr:"Presque terminé · "+n+" fichiers",
   es:"Casi listo · "+n+" archivos"
  };
  if(forms[language]&&cont)return forms[language]+" · "+cont;
 }
 const shortMin=value.match(/^(\d+) Min$/);
 if(shortMin){
  const unit={ar:"د",en:"min",tr:"dk",ku:"deq",ckb:"دق",bs:"min",fr:"min",es:"min"}[language];
  if(unit)return shortMin[1]+" "+unit;
 }
 const sleepLeft=value.match(/^Sleep-Timer · (\d+:\d{2})$/);
 if(sleepLeft){
  const head=lookupPack("Sleep-Timer",language);
  if(head)return head+" · "+sleepLeft[1];
 }
 const learnAyah=value.match(/^Lernen · Āyah (\d+)$/);
 if(learnAyah){
  const head=lookupPack("Lernen",language);
  const word=uiWord(language,"Āyah");
  if(head&&word)return head+" · "+word+" "+learnAyah[1];
 }
 const learned=value.match(/^Āyah (\d+) \/ (\d+) · gelernt (\d+)\/(\d+)$/);
 if(learned){
  const word=uiWord(language,"Āyah");
  const done={ar:"تُعلّم",en:"learned",tr:"öğrenildi",ku:"hatiye fêrkirin",ckb:"فێرکرا",bs:"naučeno",fr:"appris",es:"aprendido"}[language];
  if(word&&done)return word+" "+learned[1]+" / "+learned[2]+" · "+done+" "+learned[3]+"/"+learned[4];
 }
 const narrowBar=value.match(/^Gespeichert: (Links|Rechts) · Auf diesem schmalen Display bleibt die Leiste automatisch unten\.$/);
 if(narrowBar){
  const side=lookupPack(narrowBar[1],language);
  const head={ar:"حُفظ: ",en:"Saved: ",tr:"Kaydedildi: ",ku:"Tomar bû: ",ckb:"پاشەکەوت کرا: ",bs:"Sačuvano: ",fr:"Enregistré : ",es:"Guardado: "}[language];
  const tail={
   ar:" · على هذه الشاشة الضيقة يبقى الشريط تلقائيًا في الأسفل.",
   en:" · On this narrow screen the bar stays at the bottom.",
   tr:" · Bu dar ekranda çubuk kendiliğinden altta kalır.",
   ku:" · Li vî ekranê teng şiv bi xwe dikeve jêr.",
   ckb:" · لەم شاشە تەسکەدا شریت خۆکارانە لە خوارەوە دەمێنێتەوە.",
   bs:" · Na ovom uskom ekranu traka sama ostaje dolje.",
   fr:" · Sur cet écran étroit, la barre reste en bas d’elle-même.",
   es:" · En esta pantalla estrecha la barra permanece abajo por sí sola."
  }[language];
  if(head&&side&&tail)return head+side+tail;
 }
 const openProof=value.match(/^Beleg (\d+) öffnen$/);
 if(openProof){
  const n=openProof[1];
  const forms={
   ar:"افتح الدليل "+n,
   en:"Open evidence "+n,
   tr:n+". delili aç",
   ku:"Delîl "+n+" veke",
   ckb:"بەڵگەی "+n+" بکەرەوە",
   bs:"Otvori dokaz "+n,
   fr:"Ouvrir le justificatif "+n,
   es:"Abrir la prueba "+n
  };
  if(forms[language])return forms[language];
 }
 const scoreLine=value.match(/^Auswertung: (\d+) korrekt, (\d+) ähnlich, (\d+) offen\.$/);
 if(scoreLine){
  const a=scoreLine[1],b=scoreLine[2],c=scoreLine[3];
  const forms={
   ar:"النتيجة: "+a+" صحيح، "+b+" قريب، "+c+" مفتوح.",
   en:"Result: "+a+" correct, "+b+" close, "+c+" open.",
   tr:"Sonuç: "+a+" doğru, "+b+" yakın, "+c+" açık.",
   ku:"Encam: "+a+" durust, "+b+" nêzîk, "+c+" vekirî.",
   ckb:"ئەنجام: "+a+" ڕاست، "+b+" نزیک، "+c+" کراوە.",
   bs:"Rezultat: "+a+" tačno, "+b+" blisko, "+c+" otvoreno.",
   fr:"Résultat : "+a+" correct, "+b+" proche, "+c+" ouvert.",
   es:"Resultado: "+a+" correcto, "+b+" cercano, "+c+" abierto."
  };
  if(forms[language])return forms[language];
 }
 const heard=value.match(/^Ich höre: (.+)$/);
 if(heard){
  const head={ar:"أسمع: ",en:"I hear: ",tr:"Duyuyorum: ",ku:"Ez dibihîzim: ",ckb:"دەبیستم: ",bs:"Čujem: ",fr:"J’entends : ",es:"Oigo: "}[language];
  if(head)return head+heard[1];
 }
 const freshLine=value.match(/^Inhalte aktuell · zuletzt (.+)$/);
 if(freshLine){
  const head=lookupPack("Inhalte aktuell",language);
  const tail={
   ar:" · آخر تحديث ",
   en:" · last updated ",
   tr:" · son güncelleme ",
   ku:" · nûkirina dawî ",
   ckb:" · دوایین نوێکردنەوە ",
   bs:" · zadnje ažuriranje ",
   fr:" · dernière mise à jour ",
   es:" · última actualización "
  }[language];
  if(head&&tail)return head+tail+freshLine[1];
 }
 const freshSentence=value.match(/^Inhalte aktuell\. Zuletzt synchronisiert um (.+)\.$/);
 if(freshSentence){
  const stamp=freshSentence[1];
  const forms={
   ar:"المحتوى محدّث. آخر مزامنة في "+stamp+".",
   en:"Content is current. Last synced at "+stamp+".",
   tr:"İçerik güncel. Son eşitleme "+stamp+".",
   ku:"Naverok nûjen e. Hevdengkirina dawî "+stamp+".",
   ckb:"ناوەڕۆک نوێیە. دوایین هاوکاتکردن "+stamp+".",
   bs:"Sadržaj je ažuran. Zadnja sinhronizacija "+stamp+".",
   fr:"Contenu à jour. Dernière synchronisation à "+stamp+".",
   es:"Contenido actualizado. Última sincronización a las "+stamp+"."
  };
  if(forms[language])return forms[language];
 }
 const oneStar=value.match(/^(\d) Stern$/);
 if(oneStar){
  const n=oneStar[1];
  const forms={ar:n+" نجمة",en:n+" star",tr:n+" yıldız",ku:n+" stêrk",ckb:n+" ئەستێرە",bs:n+" zvijezda",fr:n+" étoile",es:n+" estrella"};
  if(forms[language])return forms[language];
 }
 const manyStars=value.match(/^(\d) Sterne$/);
 if(manyStars){
  const n=manyStars[1];
  const forms={ar:n+" نجوم",en:n+" stars",tr:n+" yıldız",ku:n+" stêrk",ckb:n+" ئەستێرە",bs:n+" zvijezde",fr:n+" étoiles",es:n+" estrellas"};
  if(forms[language])return forms[language];
 }
 const slideCount=value.match(/^Slide (\d+) von (\d+)$/);
 if(slideCount){
  const n=slideCount[1],m=slideCount[2];
  const forms={
   ar:"الشريحة "+n+" من "+m,
   en:"Slide "+n+" of "+m,
   tr:"Slayt "+n+" / "+m,
   ku:"Slayt "+n+" ji "+m,
   ckb:"سلاید "+n+" لە "+m,
   bs:"Slajd "+n+" od "+m,
   fr:"Diapositive "+n+" sur "+m,
   es:"Diapositiva "+n+" de "+m
  };
  if(forms[language])return forms[language];
 }
 if(value==="Bei rotem Status: Startseite → ↻ Sync in der Statusleiste, dann erneut testen."){
  const tail=lookupPack("Startseite → ↻ Sync in der Statusleiste, dann erneut testen.",language);
  const head={
   ar:"عند الحالة الحمراء: ",
   en:"When the status is red: ",
   tr:"Kırmızı durumda: ",
   ku:"Dema rewş sor be: ",
   ckb:"کاتێک دۆخ سوورە: ",
   bs:"Kad je status crven: ",
   fr:"Si le statut est rouge : ",
   es:"Si el estado está en rojo: "
  }[language];
  if(tail&&head)return head+tail;
 }
 const missingAyah=value.match(/^Diese Āyah ist bei diesem Qāriʾ nicht verfügbar\. Es wird vorübergehend (.+) abgespielt\.$/);
 if(missingAyah){
  const name=missingAyah[1];
  const forms={
   ar:"هذه الآية غير متاحة عند هذا القارئ. يُشغَّل "+name+" مؤقتًا.",
   en:"This āyah is not available for this reciter. "+name+" is played for now.",
   tr:"Bu âyet bu kâride yok. Geçici olarak "+name+" çalınıyor.",
   ku:"Ev aye li ba vî qârî tune ye. Demkî "+name+" tê lêdan.",
   ckb:"ئەم ئایەتە لەم قورئانخوێنەدا بەردەست نییە. بۆ ماوەیەک "+name+" دەخرێتە کار.",
   bs:"Ovaj ajet nije dostupan kod ovog učača. Privremeno se pušta "+name+".",
   fr:"Cette āyah n’est pas disponible chez ce récitateur. "+name+" est lu pour le moment.",
   es:"Esta aleya no está disponible con este recitador. Mientras tanto se reproduce "+name+"."
  };
  if(forms[language])return forms[language];
 }
 const followUp=value.match(/^Ausgangsfrage: (.+)\. Nachfrage dazu: (.+)$/);
 if(followUp){
  const subject=followUp[1],current=followUp[2];
  const forms={
   ar:"السؤال الأصلي: "+subject+". سؤال لاحق عنه: "+current,
   en:"Opening question: "+subject+". Follow-up on it: "+current,
   tr:"Başlangıç sorusu: "+subject+". Buna dair ek soru: "+current,
   ku:"Pirsa destpêkê: "+subject+". Pirs li ser wê: "+current,
   ckb:"پرسیاری سەرەتایی: "+subject+". پرسیاری دوایی لەسەر ئەوە: "+current,
   bs:"Početno pitanje: "+subject+". Naknadno pitanje o tome: "+current,
   fr:"Question de départ : "+subject+". Question de suivi : "+current,
   es:"Pregunta inicial: "+subject+". Pregunta de seguimiento: "+current
  };
  if(forms[language])return forms[language];
 }
 const oneBeitrag=value.match(/^(\d+) Beitrag$/);
 if(oneBeitrag){
  const word=lookupPack("Beitrag",language);
  if(word)return oneBeitrag[1]+" "+word;
 }
 const lastSync=value.match(/^Zuletzt synchronisiert: (.+)$/);
 if(lastSync){
  const head={
   ar:"آخر مزامنة: ",
   en:"Last synchronized: ",
   tr:"Son eşitleme: ",
   ku:"Hevahengiya dawî: ",
   ckb:"دوایین هاوتاکردن: ",
   bs:"Zadnja sinhronizacija: ",
   fr:"Dernière synchronisation : ",
   es:"Última sincronización: "
  }[language];
  if(head)return head+lastSync[1];
 }
 const lastSeen=value.match(/^Zuletzt: (.+)$/);
 if(lastSeen){
  const head={
   ar:"آخر مرة: ",
   en:"Last: ",
   tr:"Son: ",
   ku:"Dawî: ",
   ckb:"دوایین: ",
   bs:"Zadnje: ",
   fr:"Dernière fois : ",
   es:"Última vez: "
  }[language];
  if(head)return head+lastSeen[1];
 }
 const localFavorites=value.match(/^Favoriten auf diesem Gerät: (\d+)\. Bei Anmeldung werden lokale und Kontodaten standardmäßig zusammengeführt\.$/);
 if(localFavorites){
  const n=localFavorites[1];
  const forms={
   ar:"المفضلة على هذا الجهاز: "+n+". عند تسجيل الدخول تُدمج البيانات المحلية وبيانات الحساب افتراضيًا.",
   en:"Favorites on this device: "+n+". On sign-in, local data and account data are merged by default.",
   tr:"Bu cihazdaki favoriler: "+n+". Girişte yerel veriler ve hesap verileri varsayılan olarak birleştirilir.",
   ku:"Bijarteyên li ser vî cîhazî: "+n+". Di têketinê de daneyên herêmî û yên hesabê bi awayê standard tên yekkirin.",
   ckb:"دڵخوازەکانی ئەم ئامێرە: "+n+". لە کاتی چوونەژوورەوەدا زانیاری ناوخۆیی و زانیاری هەژمار بە شێوەی بنەڕەت تێکەڵ دەکرێن.",
   bs:"Omiljeno na ovom uređaju: "+n+". Pri prijavi lokalni podaci i podaci računa se uobičajeno spajaju.",
   fr:"Favoris sur cet appareil : "+n+". À la connexion, les données locales et celles du compte sont fusionnées par défaut.",
   es:"Favoritos en este dispositivo: "+n+". Al iniciar sesión, los datos locales y los de la cuenta se combinan de forma predeterminada."
  };
  if(forms[language])return forms[language];
 }
 const signedInAs=value.match(/^Angemeldet als (.+)\. Unterstützte Daten werden auf allen Geräten synchronisiert\.$/);
 if(signedInAs){
  const name=signedInAs[1];
  const forms={
   ar:"تم تسجيل الدخول باسم "+name+". البيانات المدعومة تُزامَن على جميع الأجهزة.",
   en:"Signed in as "+name+". Supported data is synchronized on all devices.",
   tr:name+" olarak giriş yapıldı. Desteklenen veriler tüm cihazlarda eşitlenir.",
   ku:"Wekî "+name+" têketî ye. Daneyên piştgirîkirî li ser hemû cîhazan tên hevahengkirin.",
   ckb:"وەک "+name+" چوویتە ژوورەوە. زانیاری پاڵپشتیکراو لەسەر هەموو ئامێرەکان هاوتا دەکرێت.",
   bs:"Prijavljen kao "+name+". Podržani podaci se sinhronizuju na svim uređajima.",
   fr:"Connecté en tant que "+name+". Les données prises en charge sont synchronisées sur tous les appareils.",
   es:"Sesión iniciada como "+name+". Los datos compatibles se sincronizan en todos los dispositivos."
  };
  if(forms[language])return forms[language];
 }
 const shownRefs=value.match(/^Ich kann derzeit (\d+) überprüfte (Fundstelle|Fundstellen) zeigen\. Weitere verlangte Belege sind bislang nicht ausreichend überprüft\. Unten findest du die vorhandenen Fundstellen mit ihrem Prüfstatus\.$/);
 if(shownRefs){
  const n=shownRefs[1];
  const forms={
   ar:"يمكنني حاليًا إظهار "+n+" "+(n==="1"?"موضع استشهاد مراجع":"مواضع استشهاد مراجعة")+". الأدلة الأخرى المطلوبة لم تُراجع بعد بما يكفي. في الأسفل تجد المواضع الموجودة مع حالة فحصها.",
   en:"I can currently show "+n+" reviewed "+(n==="1"?"reference":"references")+". Further requested evidence has not yet been reviewed sufficiently. Below you will find the available references with their review status.",
   tr:"Şu anda "+n+" incelenmiş kaynak yeri gösterebiliyorum. İstenen diğer deliller henüz yeterince incelenmedi. Aşağıda mevcut kaynak yerlerini inceleme durumlarıyla bulursun.",
   ku:"Niha ez dikarim "+n+" cihên çavkaniyê yên kontrolkirî nîşan bidim. Delîlên din ên xwestî hê bi têra xwe nehatine kontrolkirin. Li jêr cihên heyî bi rewşa kontrolê dibînî.",
   ckb:"ئێستا دەتوانم "+n+" شوێنی سەرچاوەی پشکنراو پیشان بدەم. بەڵگە داواکراوەکانی تر هێشتا بە پێی پێویست نەپشکنراون. لە خوارەوە شوێنە بەردەستەکان لەگەڵ دۆخی پشکنینەکەیان دەبینیت.",
   bs:"Trenutno mogu pokazati "+n+" "+(n==="1"?"provjerenu referencu":"provjerene reference")+". Ostali traženi dokazi još nisu dovoljno provjereni. Ispod su dostupne reference s njihovim statusom provjere.",
   fr:"Je peux actuellement montrer "+n+" "+(n==="1"?"référence vérifiée":"références vérifiées")+". Les autres preuves demandées ne sont pas encore suffisamment vérifiées. Plus bas se trouvent les références disponibles avec leur état de contrôle.",
   es:"Ahora puedo mostrar "+n+" "+(n==="1"?"referencia revisada":"referencias revisadas")+". Las demás pruebas solicitadas aún no están suficientemente revisadas. Abajo están las referencias disponibles con su estado de revisión."
  };
  if(forms[language])return forms[language];
 }
 const range=value.match(/^Sūrenbereich wechseln(?:, aktuell|\s+)(.+?)(?:\s*[⌄])?$/);
 if(range){
  const head=lookupPack("Sūrenbereich wechseln",language)||uiWord(language,"Sūrenbereich wechseln");
  const tail=lookupPack(range[1].trim(),language)||range[1].trim();
  if(head)return head+" · "+tail;
 }
 const allSurahs=value.match(/^Alle 114 Sūren anzeigen(\s*[↗→])?$/);
 if(allSurahs){
  const line=lookupPack("Alle 114 Sūren anzeigen ↗",language);
  if(line)return line;
 }
 const beforeFajr=value.match(/^(\d+)\s+Min vor Fajr$/);
 if(beforeFajr){
  const line=lookupPack(beforeFajr[1]+" Min vor Fajr",language);
  if(line)return line;
 }
 const picked=value.match(/^(\d)\/5 gewählt$/);
 if(picked){
  const chosen={ar:"تم اختيار",en:"selected",tr:"seçildi",ku:"hat hilbijartin",ckb:"هەڵبژێردرا",bs:"odabrano",fr:"sélectionné",es:"seleccionado"};
  const word=chosen[language];
  if(word)return language==="ar"||language==="ckb"?word+" "+picked[1]+"/5":picked[1]+"/5 "+word;
 }
 const soon=value.match(/^In (\d+) Min · (.+?) Uhr\. (Fajr|Dhuhr|ʿAṣr|Maghrib|ʿIshāʾ) naht — /);
 if(soon){
  const prayer={
   Fajr:{ar:"الفجر",en:"Fajr",tr:"Fecir",ku:"Fecr",ckb:"فەجر",bs:"Fajr",fr:"Fajr",es:"Fajr"},
   Dhuhr:{ar:"الظهر",en:"Ẓuhr",tr:"Öğle",ku:"Zohr",ckb:"زوهر",bs:"zuhr",fr:"Ẓuhr",es:"ẓuhr"},
   "ʿAṣr":{ar:"العصر",en:"ʿAṣr",tr:"İkindi",ku:"Esr",ckb:"عەسر",bs:"ikindija",fr:"ʿAṣr",es:"ʿaṣr"},
   Maghrib:{ar:"المغرب",en:"Maghrib",tr:"Akşam",ku:"Mexrib",ckb:"مەغریب",bs:"akšam",fr:"Maghrib",es:"magrib"},
   "ʿIshāʾ":{ar:"العشاء",en:"ʿIshāʾ",tr:"Yatsı",ku:"Îşa",ckb:"عیشا",bs:"jacija",fr:"ʿIshāʾ",es:"ʿishāʾ"}
  }[soon[3]];
  const name=prayer?.[language];
  if(!name)return null;
  const minute=soon[1],clock=soon[2];
  if(language==="ar")return "بعد "+minute+" دقيقة · "+clock+". اقتربت صلاة "+name+" — أدِّها لله.";
  if(language==="ckb")return "دوای "+minute+" خولەک · "+clock+". نوێژی "+name+" نزیکە — بۆ الله ئەنجامی بدە.";
  if(language==="tr")return minute+" dk sonra · "+clock+". "+name+" yaklaşıyor — namazı Allah için kıl.";
  if(language==="ku")return "Di "+minute+" deqeyan de · "+clock+". "+name+" nêzîk e — nimêjê ji bo Allah bike.";
  if(language==="bs")return "Za "+minute+" min · "+clock+". "+name+" se primiče — klanjaj namaz Allahu.";
  if(language==="fr")return "Dans "+minute+" min · "+clock+". "+name+" approche — accomplis la prière pour Allah.";
  if(language==="es")return "En "+minute+" min · "+clock+". Se acerca "+name+" — haz la oración por Allah.";
  return "In "+minute+" min · "+clock+". "+name+" is near — pray it for Allah.";
 }
 const minutesBefore=value.match(/^(\d+)\s+Minuten vorher$/);
 if(minutesBefore){
  const n=minutesBefore[1];
  const forms={
   ar:"قبل "+n+" دقيقة",
   en:n+" minutes before",
   tr:n+" dakika önce",
   ku:n+" deqe berê",
   ckb:n+" خولەک پێشتر",
   bs:n+" minuta prije",
   fr:n+" minutes avant",
   es:n+" minutos antes"
  };
  return forms[language]||null;
 }
 const selected=value.match(/^(\d+) von 5 ausgewählt · (\d+) Minuten vorher$/);
 if(selected){
  const head={
   ar:"تم اختيار "+selected[1]+" من 5",
   en:selected[1]+" of 5 selected",
   tr:"5 içinden "+selected[1]+" seçildi",
   ku:selected[1]+" ji 5 hat hilbijartin",
   ckb:selected[1]+" لە 5 هەڵبژێردرا",
   bs:selected[1]+" od 5 odabrano",
   fr:selected[1]+" sur 5 sélectionné",
   es:selected[1]+" de 5 seleccionado"
  }[language];
  const tail=translateSharedPatterns(selected[2]+" Minuten vorher",language);
  if(head&&tail)return head+" · "+tail;
 }
 const filesRest=value.match(/^(\d+) Dateien konnten nicht geladen werden\. Der Rest ist offline verfügbar\.$/);
 if(filesRest){
  const n=filesRest[1];
  const forms={
   ar:"تعذّر تحميل "+n+" ملفات. الباقي متاح دون اتصال.",
   en:n+" files could not be loaded. The rest is available offline.",
   tr:n+" dosya yüklenemedi. Geri kalanı çevrimdışı kullanılabilir.",
   ku:n+" pel nehatin barkirin. Yê mayî negirêdayî amade ye.",
   ckb:n+" پەڕگە نەتوانرا باربکرێت. ئەوەی ماوە بێ هێڵ بەردەستە.",
   bs:"Nije učitano "+n+" datoteka. Ostatak je dostupan van mreže.",
   fr:n+" fichiers n’ont pas pu être chargés. Le reste est disponible hors ligne.",
   es:"No se pudieron cargar "+n+" archivos. El resto está disponible sin conexión."
  };
  return forms[language]||null;
 }
 const filesTap=value.match(/^(\d+) Dateien konnten nicht geladen werden\. Tippe unten auf „Download fortsetzen“\.$/);
 if(filesTap){
  const n=filesTap[1];
  const resume=lookupPack("Download fortsetzen",language)||"Download fortsetzen";
  const forms={
   ar:"تعذّر تحميل "+n+" ملفات. اضغط أدناه على „"+resume+"“.",
   en:n+" files could not be loaded. Tap „"+resume+"“ below.",
   tr:n+" dosya yüklenemedi. Aşağıda „"+resume+"“ üzerine dokun.",
   ku:n+" pel nehatin barkirin. Li jêr „"+resume+"“ bitikîne.",
   ckb:n+" پەڕگە نەتوانرا باربکرێت. لە خوارەوە „"+resume+"“ دابگرە.",
   bs:"Nije učitano "+n+" datoteka. Dodirni ispod „"+resume+"“.",
   fr:n+" fichiers n’ont pas pu être chargés. Touche ci-dessous « "+resume+" ».",
   es:"No se pudieron cargar "+n+" archivos. Toca abajo « "+resume+" »."
  };
  return forms[language]||null;
 }
 const morePosts=value.match(/^(\d+) weitere Beiträge in dieser Kategorie – nutze die Suche zum Eingrenzen\.$/);
 if(morePosts){
  const n=morePosts[1];
  const forms={
   ar:n+" مقالات أخرى في هذا القسم — استخدم البحث للتضييق.",
   en:n+" more articles in this category — use search to narrow them.",
   tr:"Bu kategoride "+n+" yazı daha — daraltmak için aramayı kullan.",
   ku:n+" nivîsên din di vê kategoriyê de — ji bo tengkirinê lêgerînê bikar bîne.",
   ckb:n+" بابەتی تر لەم پۆلەدا — بۆ سنووردارکردن گەڕان بەکاربهێنە.",
   bs:"Još "+n+" tekstova u ovoj kategoriji — suzi pretragu.",
   fr:n+" articles de plus dans cette catégorie — utilise la recherche pour affiner.",
   es:n+" artículos más en esta categoría — usa la búsqueda para acotar."
  };
  return forms[language]||null;
 }
 const localContent=value.match(/^Lokaler Inhalt: (.+)\. Lesestand, Favoriten, Einstellungen und Quiz-Fortschritt bleiben lokal aktiv\.$/);
 if(localContent){
  const tail=lookupPack("Lesestand, Favoriten, Einstellungen und Quiz-Fortschritt bleiben lokal aktiv.",language);
  const head={ar:"محتوى محلي:",en:"Local content:",tr:"Yerel içerik:",ku:"Naveroka herêmî:",ckb:"ناوەڕۆکی ناوخۆیی:",bs:"Lokalni sadržaj:",fr:"Contenu local :",es:"Contenido local:"}[language];
  const middle=translateExact(localContent[1].trim(),language)||localContent[1].trim();
  if(tail&&head)return head+" "+middle+". "+tail;
 }
 const moon=value.match(/^Geschätzter Beginn: (.+)\. Lokale Mondsichtung kann abweichen\.$/);
 if(moon){
  const tail=lookupPack("Lokale Mondsichtung kann abweichen.",language);
  const date=localizeGermanCalendarLabel(moon[1],language)||moon[1];
  const head={ar:"البداية التقديرية:",en:"Estimated start:",tr:"Tahmini başlangıç:",ku:"Destpêka texmînî:",ckb:"دەستپێکی خەمڵێنراو:",bs:"Procijenjeni početak:",fr:"Début estimé :",es:"Inicio estimado:"}[language];
  if(tail&&head)return head+" "+date+". "+tail;
 }
 const season=value.match(/^(.+) · Suḥūr, Iftār, Duʿāʾ & Beiträge$/);
 if(season){
  const tail=lookupPack("Suḥūr, Iftār, Duʿāʾ & Beiträge",language);
  const raw=season[1].trim();
  const head=lookupPack(raw,language)||translateSharedPatterns(raw,language)||raw;
  if(tail)return head+" · "+tail;
 }
 const fast=value.match(/^(.+) · Möge Allah dein Fasten annehmen\.$/);
 if(fast){
  const tail=lookupPack("Möge Allah dein Fasten annehmen.",language);
  const raw=fast[1].trim();
  const head=lookupPack(raw,language)||translateSharedPatterns(raw,language)||raw;
  if(tail)return head+" · "+tail;
 }
 const area=value.match(/^Bereich: (.+)$/);
 if(area){
  const label=lookupPack("Bereich:",language);
  const rest=lookupPack(area[1].trim(),language)||area[1].trim();
  if(label)return label+" "+rest;
 }
 const fault=value.match(/^Fehler: (.+)$/);
 if(fault){
  const label=lookupPack("Fehler:",language);
  const rest=lookupPack(fault[1].trim(),language)||fault[1].trim();
  if(label)return label+" "+rest;
 }
 const hint=value.match(/^(.+)\. Dann siehst du „Nächstes Gebet“ 15 Min vorher und zur Gebetszeit eine Push-Meldung\.$/);
 if(hint){
  const step=lookupPack(hint[1].trim(),language)||hint[1].trim();
  const tails={
   ar:"ثم ترى «الصلاة التالية» قبل 15 دقيقة، وعند الوقت إشعار Push.",
   en:"Then you see “Next prayer” 15 min before, and a Push notice at the prayer time.",
   tr:"Sonra “Sonraki namaz”ı 15 dk önce ve vaktinde bir Push bildirimi görürsün.",
   ku:"Paşê “Nimêja pêş” 15 deqe berê û di dema nimêjê de agahdariya Push dibînî.",
   ckb:"دواتر «نوێژی داهاتوو» 15 خولەک پێشتر و لە کاتی نوێژدا ئاگاداریی Push دەبینیت.",
   bs:"Zatim vidiš „Sljedeći namaz“ 15 min prije i Push obavijest u vrijeme namaza.",
   fr:"Ensuite tu vois « Prière suivante » 15 min avant, et une notification Push à l’heure.",
   es:"Luego ves «Oración siguiente» 15 min antes y un aviso Push a la hora."
  };
  if(tails[language])return step+". "+tails[language];
 }
 const favorites=value.match(/^Favoriten: (\d+)\. Beim Einloggen werden lokale und gespeicherte Favoriten zusammengeführt\.$/);
 if(favorites){
  const n=favorites[1];
  const forms={
   ar:"المفضلة: "+n+". عند تسجيل الدخول تُدمج المفضلة المحلية مع المحفوظة في الحساب.",
   en:"Favorites: "+n+". When you sign in, local and saved favorites are merged.",
   tr:"Favoriler: "+n+". Girişte yerel ve kayıtlı favoriler birleştirilir.",
   ku:"Bijarte: "+n+". Di têketinê de bijarteyên herêmî û yên tomarkirî tên yekkirin.",
   ckb:"دڵخوازەکان: "+n+". لە کاتی چوونەژوورەوە دڵخوازە ناوخۆییەکان و هەڵگیراوەکان پێکەوە دەبەسترێن.",
   bs:"Omiljeno: "+n+". Pri prijavi se lokalno i sačuvano omiljeno spajaju.",
   fr:"Favoris : "+n+". À la connexion, les favoris locaux et enregistrés sont réunis.",
   es:"Favoritos: "+n+". Al entrar, se unen los favoritos locales y los guardados."
  };
  return forms[language]||null;
 }
 const fastDay=value.match(/^Tag (\d+) im Fastenmonat$/);
 if(fastDay){
  const n=fastDay[1];
  const forms={ar:"اليوم "+n+" من شهر الصيام",en:"Day "+n+" of the fasting month",tr:"Oruç ayının "+n+". günü",ku:"Roja "+n+" a meha rojiyê",ckb:"ڕۆژی "+n+"ی مانگی ڕۆژوو",bs:"Dan "+n+" mjeseca posta",fr:"Jour "+n+" du mois de jeûne",es:"Día "+n+" del mes de ayuno"};
  return forms[language]||null;
 }
 const dayOnly=value.match(/^Tag (\d+)$/);
 if(dayOnly){
  const n=dayOnly[1];
  const forms={ar:"اليوم "+n,en:"Day "+n,tr:n+". gün",ku:"Roja "+n,ckb:"ڕۆژی "+n,bs:"Dan "+n,fr:"Jour "+n,es:"Día "+n};
  return forms[language]||null;
 }
 const aboutDays=value.match(/^Noch ca\. (\d+) Tage$/);
 if(aboutDays){
  const n=aboutDays[1];
  const forms={ar:"بقي نحو "+n+" أيام",en:"About "+n+" days left",tr:"Yaklaşık "+n+" gün kaldı",ku:"Nêzîkî "+n+" roj man",ckb:"نزیکەی "+n+" ڕۆژ ماوە",bs:"Još oko "+n+" dana",fr:"Encore environ "+n+" jours",es:"Faltan unos "+n+" días"};
  return forms[language]||null;
 }
 const proofLabel=value.match(/^Beleg (\d+)$/);
 if(proofLabel){
  const word=lookupPack("Beleg",language)||"Beleg";
  return proofLabel[1]+" "+word;
 }
 const viewsOnly=value.match(/^(\d+) Aufrufe$/);
 if(viewsOnly){
  const n=viewsOnly[1];
  const forms={ar:n+" مشاهدات",en:n+" views",tr:n+" görüntüleme",ku:n+" dîtin",ckb:n+" بینین",bs:n+" pregleda",fr:n+" vues",es:n+" vistas"};
  return forms[language]||null;
 }
 const viewsOf=value.match(/^(\d+) Aufrufe · (.+)$/);
 if(viewsOf){
  const views=translateSharedPatterns(viewsOf[1]+" Aufrufe",language);
  const name=lookupPack(viewsOf[2],language)||viewsOf[2];
  if(views)return views+" · "+name;
 }
 const dayCount=value.match(/^(\d+) Tage$/);
 if(dayCount){
  const n=dayCount[1];
  const forms={ar:n+" أيام",en:n+" days",tr:n+" gün",ku:n+" roj",ckb:n+" ڕۆژ",bs:n+" dana",fr:n+" jours",es:n+" días"};
  return forms[language]||null;
 }
 const hourCount=value.match(/^(\d+) Std\.$/);
 if(hourCount){
  const n=hourCount[1];
  const forms={ar:n+" س",en:n+" h",tr:n+" sa",ku:n+" saet",ckb:n+" کاتژمێر",bs:n+" h",fr:n+" h",es:n+" h"};
  return forms[language]||null;
 }
 const freshCount=value.match(/^(\d+) neu$/);
 if(freshCount){
  const n=freshCount[1];
  const forms={ar:n+" جديد",en:n+" new",tr:n+" yeni",ku:n+" nû",ckb:n+" نوێ",bs:n+" novo",fr:n+" nouveau",es:n+" nuevo"};
  return forms[language]||null;
 }
 const filePct=value.match(/^(\d+)\/(\d+) Dateien · (\d+)%(?: · (.+))?$/);
 if(filePct){
  const word=lookupPack("Dateien",language)||"Dateien";
  const size=filePct[4]?" · "+filePct[4]:"";
  return filePct[1]+"/"+filePct[2]+" "+word+" · "+filePct[3]+"%"+size;
 }
 const popularPlace=value.match(/^Meist gelesen Platz (\d+): (.+)$/);
 if(popularPlace){
  const head=lookupPack("Meist gelesen",language)||"Meist gelesen";
  const place={ar:"المرتبة",en:"place",tr:"sıra",ku:"cih",ckb:"پلە",bs:"mjesto",fr:"place",es:"puesto"}[language];
  if(place)return head+" "+place+" "+popularPlace[1]+": "+popularPlace[2];
 }
 const orderedHadith=value.match(/^(\d+) Ḥadīṯe – nach Werken geordnet\.$/);
 if(orderedHadith){
  const n=orderedHadith[1],word=lookupPack("Ḥadīṯe",language)||"Ḥadīṯe";
  const forms={
   ar:n+" "+word+" — مرتبة حسب المصنفات.",
   en:n+" "+word+" — ordered by works.",
   tr:"Eserlere göre sıralı "+n+" "+word+".",
   ku:n+" "+word+" — li gorî berheman rêzkirî.",
   ckb:n+" "+word+" — بەپێی بەرهەمەکان ڕیزکراو.",
   bs:n+" "+word+" — poredano po djelima.",
   fr:n+" "+word+" — classés par ouvrages.",
   es:n+" "+word+" — ordenados por obras."
  };
  return forms[language]||null;
 }
 const countedOf=value.match(/^(\d+) von (\d+) (Bücher|Gelehrte|Werke)$/);
 if(countedOf){
  const n=countedOf[1],m=countedOf[2],word=lookupPack(countedOf[3],language)||countedOf[3];
  const forms={
   ar:n+" من "+m+" "+word,
   en:n+" of "+m+" "+word,
   tr:m+" "+word+" içinden "+n,
   ku:n+" ji "+m+" "+word,
   ckb:n+" لە "+m+" "+word,
   bs:n+" od "+m+" "+word,
   fr:n+" sur "+m+" "+word,
   es:n+" de "+m+" "+word
  };
  return forms[language]||null;
 }
 const countedNoun=value.match(/^(\d+) (Bücher|Gelehrte|Werke)$/);
 if(countedNoun){
  const word=lookupPack(countedNoun[2],language)||countedNoun[2];
  return countedNoun[1]+" "+word;
 }
 const fullCatalog=value.match(/^(\d+) Werke · Gesamtkatalog$/);
 if(fullCatalog){
  const works=translateSharedPatterns(fullCatalog[1]+" Werke",language);
  const cat=lookupPack("Gesamtkatalog",language);
  if(works&&cat)return works+" · "+cat;
 }
 const postDua=value.match(/^(\d+) Beiträge, (\d+) Duʿāʾ$/);
 if(postDua){
  const posts=lookupPack("Beiträge",language)||"Beiträge";
  const duas=lookupPack("Duʿāʾ",language)||"Duʿāʾ";
  return postDua[1]+" "+posts+", "+postDua[2]+" "+duas;
 }
 const pageOf=value.match(/^Seite (\d+) von (\d+)$/);
 if(pageOf){
  const page=lookupPack("Seite",language)||"Seite";
  const n=pageOf[1],m=pageOf[2];
  const forms={
   ar:page+" "+n+" من "+m,
   en:page+" "+n+" of "+m,
   tr:page+" "+n+" / "+m,
   ku:page+" "+n+" ji "+m,
   ckb:page+" "+n+" لە "+m,
   bs:page+" "+n+" od "+m,
   fr:page+" "+n+" sur "+m,
   es:page+" "+n+" de "+m
  };
  return forms[language]||null;
 }
 const pageOnly=value.match(/^Seite (\d+)$/);
 if(pageOnly){
  const page=lookupPack("Seite",language)||"Seite";
  return page+" "+pageOnly[1];
 }
 const zeroOf=value.match(/^0 von (\d+)$/);
 if(zeroOf){
  const n=zeroOf[1];
  const forms={ar:"0 من "+n,en:"0 of "+n,tr:"0 / "+n,ku:"0 ji "+n,ckb:"0 لە "+n,bs:"0 od "+n,fr:"0 sur "+n,es:"0 de "+n};
  return forms[language]||null;
 }
 const editedBy=value.match(/^Herausgegeben von (.+)$/);
 if(editedBy){
  const name=editedBy[1];
  const forms={
   ar:"بإشراف "+name,
   en:"Edited by "+name,
   tr:name+" yayına hazırladı",
   ku:"Ji aliyê "+name+" ve hatiye amadekirin",
   ckb:"ئامادەکراوی "+name,
   bs:"Priredio "+name,
   fr:"Édité par "+name,
   es:"Editado por "+name
  };
  return forms[language]||null;
 }
 const continuePage=value.match(/^Weiterlesen · S\. (\d+)$/);
 if(continuePage){
  const head=lookupPack("Weiterlesen",language)||"Weiterlesen";
  const n=continuePage[1];
  const mark={ar:"ص",en:"p.",tr:"s.",ku:"r.",ckb:"لا",bs:"str.",fr:"p.",es:"p."}[language];
  if(mark)return head+" · "+mark+" "+n;
 }
 const versionLine=value.match(/^Version (.+)$/);
 if(versionLine){
  const head=lookupPack("Version",language)||"Version";
  return head+" "+versionLine[1];
 }
 const pdfReader=value.match(/^PDF-Leser: (.+)$/);
 if(pdfReader){
  const head=lookupPack("PDF-Leser",language)||"PDF-Leser";
  return head+": "+pdfReader[1];
 }
 const untilRamadan=value.match(/^Noch ca\. (\d+) Tage bis Ramaḍān$/);
 if(untilRamadan){
  const n=untilRamadan[1],name=lookupPack("Ramaḍān",language)||"Ramaḍān";
  const forms={ar:"بقي نحو "+n+" يوماً حتى "+name,en:"About "+n+" days until "+name,tr:name+" için yaklaşık "+n+" gün kaldı",ku:"Nêzîkî "+n+" roj heta "+name,ckb:"نزیکەی "+n+" ڕۆژ ماوە تا "+name,bs:"Još oko "+n+" dana do "+name,fr:"Encore environ "+n+" jours avant "+name,es:"Faltan unos "+n+" días para "+name};
  return forms[language]||null;
 }
 const daysLeft=value.match(/^Noch (\d+) Tage$/);
 if(daysLeft){
  const n=daysLeft[1];
  const forms={ar:"بقي "+n+" أيام",en:n+" days left",tr:n+" gün kaldı",ku:n+" roj man",ckb:n+" ڕۆژ ماوە",bs:"Još "+n+" dana",fr:"Encore "+n+" jours",es:"Faltan "+n+" días"};
  return forms[language]||null;
 }
 const focusDays=value.match(/^Noch (\d+) Tage im Fokus$/);
 if(focusDays){
  const n=focusDays[1];
  const forms={ar:"بقي "+n+" أيام في الواجهة",en:n+" days left in focus",tr:"Odakta "+n+" gün kaldı",ku:n+" roj di berçavê de man",ckb:n+" ڕۆژ لە پێشەوە ماوە",bs:"Još "+n+" dana u fokusu",fr:"Encore "+n+" jours en avant",es:"Faltan "+n+" días en destacado"};
  return forms[language]||null;
 }
 const focusHours=value.match(/^Noch ca\. (\d+) Std\. im Fokus$/);
 if(focusHours){
  const n=focusHours[1];
  const forms={ar:"بقي نحو "+n+" ساعة في الواجهة",en:"About "+n+" hours left in focus",tr:"Odakta yaklaşık "+n+" saat kaldı",ku:"Nêzîkî "+n+" saet di berçavê de man",ckb:"نزیکەی "+n+" کاتژمێر لە پێشەوە ماوە",bs:"Još oko "+n+" sati u fokusu",fr:"Encore environ "+n+" h en avant",es:"Faltan unas "+n+" horas en destacado"};
  return forms[language]||null;
 }
 const weatherLoad=value.match(/^Wetter für (.+) wird geladen …$/);
 if(weatherLoad){
  const head=lookupPack("Wetter für",language);
  const verb=uiWord(language,"wird geladen");
  if(head&&verb)return head+" "+weatherLoad[1]+" "+verb+" …";
 }
 const weatherDown=value.match(/^Wetter · (.+): derzeit nicht verfügbar$/);
 if(weatherDown){
  const wetter=lookupPack("Wetter",language);
  const tail=lookupPack("derzeit nicht verfügbar",language);
  if(wetter&&tail)return wetter+" · "+weatherDown[1]+": "+tail;
 }
 const weatherNow=value.match(/^Wetter · (.+): (\d+) °C · (.+)$/);
 if(weatherNow){
  const wetter=lookupPack("Wetter",language);
  const desc=lookupPack(weatherNow[3],language);
  if(wetter&&desc)return wetter+" · "+weatherNow[1]+": "+weatherNow[2]+" °C · "+desc;
 }
 const hits=value.match(/^(\d+) Treffer$/);
 if(hits){
  const word=lookupPack("Treffer",language);
  if(word)return hits[1]+" "+word;
 }
 const compass=value.match(/^Live-Kompass nicht verfügbar\. Qibla: ca\. (\d+(?:[.,]\d+)?)° \(([^)]+)\)\. Öffne die Kompass-App deines Handys und richte dich auf (\d+(?:[.,]\d+)?)° aus\. Bitte Richtung prüfen\.$/);
 if(compass){
  const dir=lookupPack(compass[2],language)||compass[2];
  const deg=compass[1];
  const forms={
   ar:"البوصلة الحية غير متاحة. القبلة: نحو "+deg+"° ("+dir+"). افتح بوصلة هاتفك واتجه نحو "+deg+"°. يُرجى التحقق من الاتجاه.",
   en:"Live compass is unavailable. Qibla: about "+deg+"° ("+dir+"). Open your phone’s compass and face "+deg+"°. Please check the direction.",
   tr:"Canlı pusula kullanılamıyor. Kıble: yaklaşık "+deg+"° ("+dir+"). Telefonunun pusulasını aç ve "+deg+"° yönüne dön. Lütfen yönü kontrol et.",
   ku:"Qitibnîşana zindî ne amade ye. Qible: nêzîkî "+deg+"° ("+dir+"). Qitibnîşana telefonê veke û ber bi "+deg+"° ve bizivire. Ji kerema xwe alî kontrol bike.",
   ckb:"کۆمپاسی ڕاستەوخۆ بەردەست نییە. قیبلە: نزیکەی "+deg+"° ("+dir+"). کۆمپاسی مۆبایلەکەت بکەرەوە و ڕوو لە "+deg+"° بکە. تکایە ئاڕاستەکە بپشکنە.",
   bs:"Kompas uživo nije dostupan. Kibla: oko "+deg+"° ("+dir+"). Otvori kompas telefona i okreni se prema "+deg+"°. Provjeri smjer.",
   fr:"La boussole en direct n’est pas disponible. Qibla : environ "+deg+"° ("+dir+"). Ouvre la boussole du téléphone et oriente-toi vers "+deg+"°. Vérifie la direction.",
   es:"La brújula en vivo no está disponible. Qibla: unos "+deg+"° ("+dir+"). Abre la brújula del teléfono y oriéntate hacia "+deg+"°. Comprueba la dirección."
  };
  return forms[language]||null;
 }
 const offlineResume=value.match(/^Offline fortsetzen (\d+)\/(\d+)$/);
 if(offlineResume){
  const head=lookupPack("Offline fortsetzen",language);
  if(head)return head+" "+offlineResume[1]+"/"+offlineResume[2];
 }
 const countedTail=value.match(/^(\d+)\s+(Aussagen mit Quellen\.|bekannte Duʿāʾ nach Themen\.|Namen und Zuordnungen\.|gespeichert\.|Meldungen und Hinweise\.|geprüfte Werke und zitierte Gelehrte\.|Gebete aktiv)$/);
 if(countedTail){
  const tail=lookupPack(countedTail[2],language);
  if(tail)return countedTail[1]+" "+tail;
 }
 const questionOf=value.match(/^Frage (\d+) von (\d+)$/);
 if(questionOf){
  const forms={
   ar:"السؤال "+questionOf[1]+" من "+questionOf[2],
   en:"Question "+questionOf[1]+" of "+questionOf[2],
   tr:"Soru "+questionOf[1]+" / "+questionOf[2],
   ku:"Pirs "+questionOf[1]+" ji "+questionOf[2],
   ckb:"پرسیاری "+questionOf[1]+" لە "+questionOf[2],
   bs:"Pitanje "+questionOf[1]+" od "+questionOf[2],
   fr:"Question "+questionOf[1]+" sur "+questionOf[2],
   es:"Pregunta "+questionOf[1]+" de "+questionOf[2]
  };
  return forms[language]||null;
 }
 const questionSlash=value.match(/^Frage (\d+)\/(\d+)$/);
 if(questionSlash){
  const word=lookupPack("Frage",language)||"Frage";
  return word+" "+questionSlash[1]+"/"+questionSlash[2];
 }
 const score=value.match(/^(\d+) \/ (\d+) richtig$/);
 if(score){
  const word=lookupPack("richtig",language);
  if(word)return score[1]+" / "+score[2]+" "+word;
 }
 const rounds=value.match(/^(\d+) Runden · (\d+) Fragen beantwortet$/);
 if(rounds){
  const a=lookupPack("Runden",language),b=lookupPack("Fragen beantwortet",language);
  if(a&&b)return rounds[1]+" "+a+" · "+rounds[2]+" "+b;
 }
 const syncLine=value.match(/^(.+) · Sync aktiv$/);
 if(syncLine){
  const tail=lookupPack("Sync aktiv",language);
  if(tail)return syncLine[1]+" · "+tail;
 }
 const entered=value.match(/^(.{1,48}) ist eingetreten$/);
 if(entered){
  const name=lookupPack(entered[1],language)||entered[1];
  const forms={
   ar:"دخل وقت "+name,
   en:name+" has begun",
   tr:name+" vakti girdi",
   ku:"Dema "+name+" dest pê kir",
   ckb:"کاتی "+name+" هات",
   bs:name+" je nastupio",
   fr:name+" a commencé",
   es:name+" ha comenzado"
  };
  return forms[language]||null;
 }
 const fitting=value.match(/^Passend: (.+)$/);
 if(fitting){
  const head=lookupPack("Passend:",language);
  const rest=lookupPack(fitting[1],language)||fitting[1];
  if(head)return head+" "+rest;
 }
 const moreHits=value.match(/^Weitere Treffer anzeigen · (\d+) von (\d+)$/);
 if(moreHits){
  const forms={
   ar:"عرض المزيد من النتائج · "+moreHits[1]+" من "+moreHits[2],
   en:"Show more results · "+moreHits[1]+" of "+moreHits[2],
   tr:"Daha fazla sonuç göster · "+moreHits[1]+" / "+moreHits[2],
   ku:"Encamên zêdetir nîşan bide · "+moreHits[1]+" ji "+moreHits[2],
   ckb:"ئەنجامی زیاتر پیشان بدە · "+moreHits[1]+" لە "+moreHits[2],
   bs:"Prikaži više rezultata · "+moreHits[1]+" od "+moreHits[2],
   fr:"Afficher plus de résultats · "+moreHits[1]+" sur "+moreHits[2],
   es:"Mostrar más resultados · "+moreHits[1]+" de "+moreHits[2]
  };
  return forms[language]||null;
 }
 const minShort=value.match(/^(\d+) Min vorher$/);
 if(minShort)return translateSharedPatterns(minShort[1]+" Minuten vorher",language);
 const tahajjud=value.match(/^Taḥajjud · (\d+) Min vor Fajr$/);
 if(tahajjud){
  const n=tahajjud[1];
  const fajr={ar:"الفجر",en:"Fajr",tr:"Fecir",ku:"Fecr",ckb:"فەجر",bs:"Fajr",fr:"Fajr",es:"Fajr"}[language]||"Fajr";
  const forms={
   ar:"تهجد · قبل "+n+" د من "+fajr,
   en:"Tahajjud · "+n+" min before "+fajr,
   tr:"Teheccüd · "+fajr+"’den "+n+" dk önce",
   ku:"Teheccud · "+n+" deqe beriya "+fajr,
   ckb:"تەهەججود · "+n+" خولەک پێش "+fajr,
   bs:"Tehedždžud · "+n+" min prije "+fajr,
   fr:"Tahajjud · "+n+" min avant "+fajr,
   es:"Tahajjud · "+n+" min antes de "+fajr
  };
  return forms[language]||null;
 }
 const repeatLine=value.match(/^Wiederholen · (.+)$/);
 if(repeatLine){
  const head=lookupPack("Wiederholen",language);
  const tail=lookupPack(repeatLine[1],language)||repeatLine[1];
  if(head)return head+" · "+tail;
 }
 const hadithWork=value.match(/^ḤADĪṮ-WERK · (.+)$/);
 if(hadithWork){
  const head=lookupPack("ḤADĪṮ-WERK",language);
  if(head)return head+" · "+hadithWork[1];
 }
 const titleCount=value.match(/^(\d+) Titel$/);
 if(titleCount){
  const n=titleCount[1];
  const forms={
   ar:n==="1"?"عنوان واحد":n+" عناوين",
   en:n==="1"?"1 title":n+" titles",
   tr:n+" başlık",
   ku:n+" sernav",
   ckb:n==="1"?"ناونیشانێک":n+" ناونیشان",
   bs:n==="1"?"1 naslov":n+" naslova",
   fr:n==="1"?"1 titre":n+" titres",
   es:n==="1"?"1 título":n+" títulos"
  };
  return forms[language]||null;
 }
 const picture=value.match(/^Bildbeitrag zu: (.+)$/);
 if(picture){
  const head=lookupPack("Bildbeitrag zu:",language);
  const rest=lookupPack(picture[1],language)||picture[1];
  if(head)return head+" "+rest;
 }
 return null;
}
function translateExact(value,language="tr"){
 if(language==="de")return null;
 const shared=translateSharedPatterns(value,language);
 if(shared)return shared;
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
 const attested=value.match(/^Belegte Aussagen · (\d+)$/);
 if(attested){
  const forms={
   ar:"أقوال ثابتة",
   en:"Established reports",
   tr:"Sabit sözler",
   ku:"Gotinên sabit",
   ckb:"وتە سەلمێنراوەکان",
   bs:"Utvrđene izjave",
   fr:"Propos établis",
   es:"Dichos establecidos"
  };
  return forms[language]?forms[language]+" · "+attested[1]:null;
 }
 const sourceButton=value.match(/^(\d+) Quellen · Quellen anzeigen$/);
 if(sourceButton){
  const show=lookupPack("Quellen anzeigen",language);
  const forms={
   ar:sourceButton[1]==="1"?"مصدر واحد":sourceButton[1]+" مصادر",
   en:sourceButton[1]==="1"?"1 source":sourceButton[1]+" sources",
   tr:sourceButton[1]+" kaynak",
   ku:sourceButton[1]+" çavkanî",
   ckb:sourceButton[1]==="1"?"سەرچاوەیەک":sourceButton[1]+" سەرچاوە",
   bs:sourceButton[1]==="1"?"1 izvor":sourceButton[1]+" izvora",
   fr:sourceButton[1]==="1"?"1 source":sourceButton[1]+" sources",
   es:sourceButton[1]==="1"?"1 fuente":sourceButton[1]+" fuentes"
  };
  return forms[language]&&show?forms[language]+" · "+show:null;
 }
 const contentCount=value.match(/^(\d+) (Inhalt|Inhalte)$/);
 if(contentCount){
  const n=contentCount[1];
  const forms={
   ar:n==="1"?"محتوى واحد":n+" محتويات",
   en:n==="1"?"1 item":n+" items",
   tr:n+" içerik",
   ku:n+" naverok",
   ckb:n==="1"?"ناوەرۆکێک":n+" ناوەرۆک",
   bs:n==="1"?"1 sadržaj":n+" sadržaja",
   fr:n==="1"?"1 contenu":n+" contenus",
   es:n==="1"?"1 contenido":n+" contenidos"
  };
  return forms[language]||null;
 }
 const reviewedReports=value.match(/^(\d+) geprüfte Berichte$/);
 if(reviewedReports){
  const n=reviewedReports[1];
  const forms={
   ar:n==="1"?"تقرير مفحوص واحد":n+" تقارير مفحوصة",
   en:n==="1"?"1 reviewed report":n+" reviewed reports",
   tr:n+" incelenmiş rapor",
   ku:n+" raporên kontrolkirî",
   ckb:n==="1"?"ڕاپۆرتێکی پشکنراو":n+" ڕاپۆرتی پشکنراو",
   bs:n==="1"?"1 provjeren izvještaj":n+" provjerena izvještaja",
   fr:n==="1"?"1 rapport vérifié":n+" rapports vérifiés",
   es:n==="1"?"1 informe revisado":n+" informes revisados"
  };
  return forms[language]||null;
 }
 const quranOpen=value.match(/^Im Qurʾān öffnen · (.+)$/);
 if(quranOpen){
  const head=lookupPack("Im Qurʾān öffnen",language);
  const rest=lookupPack(quranOpen[1],language)||quranOpen[1];
  return head?head+" · "+rest:null;
 }
 const previewWrap=value.match(/^(.+) \(Vorschau · nicht freigegeben\)$/);
 if(previewWrap){
  const tail=lookupPack("(Vorschau · nicht freigegeben)",language);
  const name=lookupPack(previewWrap[1],language)||previewWrap[1];
  return tail?name+" "+tail:null;
 }
 const aboutHim=value.match(/^Der Prophet Muḥammad ﷺ über ihn · (\d+)$/);
 if(aboutHim){
  const head=lookupPack("Der Prophet Muḥammad ﷺ über ihn",language);
  return head?head+" · "+aboutHim[1]:null;
 }
 const dynamicLabels={
  Veröffentlichungen:{ar:"منشورات",ku:"weşan",ckb:"بڵاوکراوە",bs:"publikacija",fr:"publications",es:"publicaciones"},
  Beiträge:{ar:"مقالات",ku:"nivîs",ckb:"بابەت",bs:"tekstova",fr:"articles",es:"artículos"},
  Seiten:{ar:"صفحات",ku:"rûpel",ckb:"لاپەڕە",bs:"stranice",fr:"pages",es:"páginas"},
  Themenbereiche:{ar:"مجالات",ku:"qadên mijaran",ckb:"بوارەکانی بابەت",bs:"tematske oblasti",fr:"thèmes",es:"áreas temáticas"},
  Aussagen:{ar:"أقوال",ku:"gotin",ckb:"وتەکان",bs:"izjave",fr:"paroles",es:"afirmaciones"},
  gemerkt:{ar:"محفوظ",ku:"tomarkirî",ckb:"هەڵگیراو",bs:"sačuvano",fr:"enregistré",es:"guardado"},
  Funktionen:{ar:"وظائف",ku:"fonksiyon",ckb:"کارەکان",bs:"funkcija",fr:"fonctions",es:"funciones"},
  Ergebnisse:{ar:"نتائج",ku:"encam",ckb:"ئەنجام",bs:"rezultata",fr:"résultats",es:"resultados"}
 };
 const dynamic=value.match(/^(\d+)\s+(Veröffentlichungen|Beiträge|Seiten|Themenbereiche|Aussagen|gemerkt|Funktionen|Ergebnisse)$/);
 if(dynamic&&dynamicLabels[dynamic[2]]?.[language])return dynamic[1]+" "+dynamicLabels[dynamic[2]][language];
 const editorialLabels={
  "AKTUELLE VERÖFFENTLICHUNG":{tr:"GÜNCEL YAYIN",en:"CURRENT PUBLICATION",ar:"المنشور الحالي",ku:"WEŞANA NIHAÎ",ckb:"بڵاوکراوەی ئێستا",bs:"TRENUTNA PUBLIKACIJA",fr:"PUBLICATION ACTUELLE",es:"PUBLICACIÓN ACTUAL"},
  "WEITERER BEITRAG":{tr:"DİĞER YAZI",en:"ANOTHER ARTICLE",ar:"مقال آخر",ku:"NIVÎSEKE DIN",ckb:"بابەتێکی تر",bs:"DRUGI TEKST",fr:"AUTRE ARTICLE",es:"OTRO ARTÍCULO"},
  "NEUESTER BEITRAG":{tr:"EN YENİ YAZI",en:"LATEST ARTICLE",ar:"أحدث مقال",ku:"NIVÎSA HERÎ NÛ",ckb:"نوێترین بابەت",bs:"NAJNOVIJI TEKST",fr:"ARTICLE LE PLUS RÉCENT",es:"ARTÍCULO MÁS RECIENTE"}
 };
 if(editorialLabels[value]?.[language])return editorialLabels[value][language];
 const composed=translateComposed(value,language);
 if(composed!==null&&composed!==undefined)return composed;
 if(language!=="tr"){
  const exact=languagePacks.get(language)?.get(value);
  if(exact!==undefined)return exact;
  const openLabel=value.match(/^(.{2,160}) öffnen$/);
  if(openLabel&&!/[<>\u0600-\u06ff]/.test(openLabel[1])){
   const verb=languagePacks.get(language)?.get("öffnen");
   const head=languagePacks.get(language)?.get(openLabel[1]);
   if(verb)return (head||openLabel[1])+" "+verb;
  }
  return localizeGermanCalendarLabel(value,language);
 }
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
 // These two labels are interface chrome rendered inside editorial cards. They
 // are not the card's source content and must remain localizable in the test.
 if(element.matches?.('[data-dar-ui-label]'))return false;
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
  const german=match&&germanSourceOf(match[2]);
  if(!match||!german){
   if(locale!=="de"&&match&&/[äöüÄÖÜß]/.test(match[2])&&!/[\u0600-\u06ff<>]/.test(match[2]))noteGap(match[2]);
   return;
  }
  state={source:match[1]+german+match[3],rendered:current};originals.set(node,state);
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
   const german=germanSourceOf(actual);
   if(!german)continue;
   prior={source:german,rendered:actual};state[attr]=prior;
  }
  const desired=translateExact(prior.source,locale)??prior.source;
  if(actual!==desired)element.setAttribute(attr,desired);
  prior.rendered=desired;
 }
}
function translateFragmented(root,locale){
 if(!root?.querySelectorAll||locale==="de")return;
 const inline=/^(STRONG|EM|B|I|SPAN|SMALL|BR|WBR)$/;
 root.querySelectorAll("p,div,small,li,h2,h3,span,a,button,label").forEach(element=>{
  if(shouldSkip(element)||!element.children?.length)return;
  if([...element.children].some(child=>!inline.test(child.tagName)||child.children?.length))return;
  const text=String(element.textContent||"").replace(/\s+/g," ").trim();
  if(text.length<8||text.length>420)return;
  const translated=translateExact(text,locale);
  if(!translated||translated===text)return;
  element.textContent=translated;
 });
}
const PINNED_CHROME={
 ".dtbh-tagline,.dhp-home-source-v55":{
  ar:"مقالات وفق القرآن والسنة والآثار",
  en:"Articles according to the Qurʾān, the Sunnah and the Āthār",
  tr:"Kur'an, Sünnet ve eserlere göre yazılar",
  ku:"Nivîs li gor Qur'an, Sunnah û eserên pêşiyan",
  ckb:"بابەتەکان بەپێی قورئان و سوننەت و ئاسار",
  bs:"Tekstovi prema Kur'anu, sunnetu i predajama",
  fr:"Articles selon le Qurʾān, la Sunnah et les Āthār",
  es:"Artículos según el Qurʾān, la Sunnah y los Āthār"
 },
 "#darBootKicker,.brand-kicker-row small,.dar-library-brandbar__meta,#darHomeV47Leadin,.dar-v47-leadin":{
  ar:"مشاركات وفق القرآن والسنة والآثار",
  en:"CONTRIBUTIONS FROM THE QURʾĀN, SUNNAH & ĀTHĀR",
  tr:"KUR'AN, SÜNNET VE ÂSÂRA GÖRE YAZILAR",
  ku:"NIVÎS LI GOR QUR'AN, SUNNAH Û ESERAN",
  ckb:"بەشدارییەکان بەپێی قورئان، سوننەت و ئاسار",
  bs:"TEKSTOVI PREMA KUR'ANU, SUNNETU I PREDAJAMA",
  fr:"ARTICLES SELON LE QURʾĀN, LA SUNNAH ET LES ĀTHĀR",
  es:"ARTÍCULOS SEGÚN EL QURʾĀN, LA SUNNAH Y LOS ĀTHĀR"
 },
 "#darBootLoading":{
  ar:"جارٍ تحميل التطبيق…",
  en:"App is loading…",
  tr:"Uygulama yükleniyor…",
  ku:"Sepan tê barkirin…",
  ckb:"ئەپ باردەکرێت…",
  bs:"Aplikacija se učitava…",
  fr:"Chargement de l'application…",
  es:"La aplicación se está cargando…"
 },
 ".dar-library-brandbar__sub":{
  ar:"علم من القرآن والسنة",
  en:"Knowledge from the Qurʾān and the Sunnah",
  tr:"Kur'an ve Sünnet'ten ilim",
  ku:"Zanîn ji Qur'an û Sunnah",
  ckb:"زانست لە قورئان و سوننەت",
  bs:"Znanje iz Kur'ana i sunneta",
  fr:"Savoir tiré du Qurʾān et de la Sunnah",
  es:"Conocimiento del Qurʾān y de la Sunnah"
 }
};
function localizeCompassRose(locale){
 const doc=global.document;
 if(!doc?.querySelector)return;
 const rose=locale==="ar"||locale==="ckb"
  ?{n:"ش",e:"ق",s:"ج",w:"غ"}
  :locale==="de"?{n:"N",e:"O",s:"S",w:"W"}:{n:"N",e:"E",s:"S",w:"W"};
 for(const [key,text] of Object.entries(rose)){
  doc.querySelectorAll(".qibla-"+key).forEach(element=>{
   if(element.childElementCount)return;
   const label=String(element.textContent||"");
   if(label.length>3)return;
   if(label!==text)element.textContent=text;
  });
 }
}
function localizePinnedChrome(locale){
 const doc=global.document;
 if(!doc?.querySelectorAll||locale==="de")return;
 for(const [selector,pack] of Object.entries(PINNED_CHROME)){
  const text=pack[locale];
  if(!text)continue;
  doc.querySelectorAll(selector).forEach(element=>{
   if(element.closest?.("[data-dar-no-translate]"))return;
   if(element.id==="darBootLoading"&&!element.isConnected)return;
   if(element.textContent!==text)element.textContent=text;
  });
 }
}
const MEANING_PENDING="Geprüfte Bedeutungsübersetzung in dieser Sprache folgt. Angezeigt bleibt die deutsche Fassung.";
const gapLog=[];
function noteGap(text){
 const value=String(text||"").replace(/\s+/g," ").trim();
 if(!value||value.length>180||gapLog.includes(value)||gapLog.length>=80)return;
 gapLog.push(value);
}
function markPendingMeanings(locale){
 const doc=global.document;
 if(typeof doc?.querySelectorAll!=="function"||typeof doc.createElement!=="function")return;
 if(typeof doc.getElementById==="function"&&doc.head&&!doc.getElementById("dar-meaning-pending-style")){
  const style=doc.createElement("style");
  style.id="dar-meaning-pending-style";
  style.textContent=".dar-meaning-pending{margin:0 0 8px;padding:8px 10px;border-radius:12px;font-size:12px;line-height:1.45;text-align:start}";
  doc.head.appendChild(style);
 }
 let bodies=[];
 try{bodies=doc.querySelectorAll(".qrc-body")}catch(_){return}
 bodies.forEach(body=>{
  if(typeof body?.querySelector!=="function"||typeof body.prepend!=="function")return;
  if(!body.querySelector(".quran-ayah-de"))return;
  const note=body.querySelector(":scope > .dar-meaning-pending");
  if(locale==="de"){if(note)note.remove();return}
  if(note)return;
  const el=doc.createElement("p");
  el.className="dar-meaning-pending";
  el.setAttribute("data-dar-ui-label","meaning-pending");
  el.textContent=MEANING_PENDING;
  body.prepend(el);
 });
}
function apply(root=global.document?.body,locale=currentLocale()){
 if(!root)return 0;
 const doc=global.document;
 if(root.nodeType===1&&!shouldSkip(root))transformAttributes(root,locale);
 localizePinnedChrome(locale);
 localizeCompassRose(locale);
 renderHomeWelcome(locale);
 markPendingMeanings(locale);
 translateFragmented(root,locale);
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
    !global.document.getElementById("dar-test-nine-languages-loader")){
  const script=global.document.createElement("script");
  script.id="dar-test-nine-languages-loader";
  script.src="/test/assets/dar-test-seven-languages-loader.js?v=20261024-ui-more-41";
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
if(typeof global.document?.createElement==="function"&&global.document.head&&
   !global.document.getElementById("dar-test-machine-drafts")){
 const draftTag=global.document.createElement("script");
 draftTag.id="dar-test-machine-drafts";
 draftTag.src="/test/assets/dar-test-machine-drafts.js?v=20261024-quran-ui";
 draftTag.defer=true;
 global.document.head.appendChild(draftTag);
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
  gaps:()=>gapLog.slice(),
  contentStore:()=>global.DarAdultCentralContent?.create()||null,scope:"adult-test-only"};
})(window);
