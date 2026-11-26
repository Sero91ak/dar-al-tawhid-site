/* DĀR AL TAWḤĪD · Ḥadīṯ library shelves v2
   Navigation only. The page calls DARHadithShelvesV2.render; this file does not replace renderHadith.
   Badges come from the precomputed map. The full search list is never walked on a shelf render.
   Chapter titles and numbers are indexed one work at a time, after idle.
   Imam names and Hijri years only from the fixed maps below. No living beings. */
(function (w) {
  "use strict";
  if (w.__DAR_HADITH_SHELVES_V2) return;
  var BADGES = {};
  var COLS = new Map();
  var COLS_WAIT = {};
  var libraryWait = false;
  var libraryFailed = false;
  var refreshQueued = false;
  var HERO_LIST = "/test/assets/ilm/hadith-library-overview-v1267.webp";
  var HERO_WORK = "/test/assets/ilm/hadith-library-study-v1267.webp";
  var LANGS = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
  var COPY = {
    de: { library: "Ḥadīṯ-Bibliothek", works: "Werke", byScholar: "nach Imām", byKind: "Ḥadīṯ und Āṯār", continueKicker: "Zuletzt gelesen", continueGo: "Weiterlesen", search: "Werk, Autor, Kitāb, Bāb oder Nummer", searching: "Die Kapitel werden noch geordnet…", hitKitab: "Kitāb", hitNumber: "Nummer", jump: "Nummer", jumpGo: "Öffnen", jumpMiss: "Diese Nummer ist in diesem Bereich nicht vorhanden.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} Ḥadīṯe", noHits: "Keine Treffer in diesem Bereich.", unavailable: "Die Bibliothek ist gerade nicht erreichbar.", opening: "Die Bibliothek wird geöffnet…", crumbHome: "Bibliothek", openKitab: "Abwāb anzeigen", closeKitab: "Abwāb schließen", allInKitab: "Ḥadīṯe dieses Kitāb", sahihayn: "aṣ-Ṣaḥīḥān", sunan: "as-Sunan", musnad: "al-Musnad", muwatta: "al-Muwaṭṭaʾ", musannaf: "al-Muṣannafāt", masanid: "Masānīd und Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āṯār der Salaf", hadithWorks: "Ḥadīṯ-Werke", atharWorks: "Āṯār und ʿAqīdah", otherWorks: "Weitere Werke", entries: "Einträge", sixBooks: "Die sechs Bücher", sixShort: ["Buḫārī", "Muslim", "Abū Dāwūd", "Tirmiḏī", "Nasāʾī", "Ibn Māǧah"], bySahihayn: "al-Buḫārī, Muslim", bySunan: "Abū Dāwūd, at-Tirmiḏī, an-Nasāʾī, Ibn Māǧah, ad-Dārimī", byMusnad: "Imām Aḥmad", byMuwatta: "Imām Mālik", byMusannaf: "Ibn Abī Šaybah, ʿAbd ar-Razzāq", byWeitere: "weitere Gelehrte" },
    ar: { library: "مكتبة الحديث", works: "الكتب", byScholar: "حسب الإمام", byKind: "الحديث والآثار", continueKicker: "آخر قراءة", continueGo: "متابعة", search: "كتاب أو إمام أو باب أو رقم", searching: "يجري ترتيب الأبواب…", hitKitab: "كتاب", hitNumber: "رقم", jump: "الرقم", jumpGo: "فتح", jumpMiss: "هذا الرقم غير موجود في هذا القسم.", kitab: "كتاب", bab: "باب", hadithCount: "{n} حديثًا", noHits: "لا توجد نتائج في هذا القسم.", unavailable: "المكتبة غير متاحة الآن.", opening: "جارٍ فتح المكتبة…", crumbHome: "المكتبة", openKitab: "عرض الأبواب", closeKitab: "إخفاء الأبواب", allInKitab: "أحاديث هذا الكتاب", sahihayn: "الصحيحان", sunan: "السنن", musnad: "المسند", muwatta: "الموطأ", musannaf: "المصنفات", masanid: "المسانيد والموطأ", aqidah: "العقيدة", athar: "آثار السلف", hadithWorks: "كتب الحديث", atharWorks: "الآثار والعقيدة", otherWorks: "كتب أخرى", entries: "مداخل", sixBooks: "الكتب الستة", sixShort: ["البخاري", "مسلم", "أبو داود", "الترمذي", "النسائي", "ابن ماجه"], bySahihayn: "البخاري، مسلم", bySunan: "أبو داود، الترمذي، النسائي، ابن ماجه، الدارمي", byMusnad: "الإمام أحمد", byMuwatta: "الإمام مالك", byMusannaf: "ابن أبي شيبة، عبد الرزاق", byWeitere: "علماء آخرون" },
    en: { library: "Ḥadīth library", works: "Works", byScholar: "By imam", byKind: "Ḥadīth and āthār", continueKicker: "Last read", continueGo: "Continue", search: "Work, author, kitāb, bāb or number", searching: "The chapters are still being ordered…", hitKitab: "Kitāb", hitNumber: "Number", jump: "Number", jumpGo: "Open", jumpMiss: "This number is not in this section.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīths", noHits: "No matches in this section.", unavailable: "The library cannot be reached just now.", opening: "Opening the library…", crumbHome: "Library", openKitab: "Show the abwāb", closeKitab: "Hide the abwāb", allInKitab: "Ḥadīths of this kitāb", sahihayn: "The two Ṣaḥīḥs", sunan: "The Sunan", musnad: "al-Musnad", muwatta: "al-Muwaṭṭaʾ", musannaf: "The Muṣannafs", masanid: "Masānīd and Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āthār of the Salaf", hadithWorks: "Ḥadīth works", atharWorks: "Āthār and ʿaqīdah", otherWorks: "Further works", entries: "Entries", sixBooks: "The six books", sixShort: ["al-Buḫārī", "Muslim", "Abū Dāwūd", "at-Tirmiḏī", "an-Nasāʾī", "Ibn Māǧah"], bySahihayn: "al-Buḫārī, Muslim", bySunan: "Abū Dāwūd, at-Tirmiḏī, an-Nasāʾī, Ibn Māǧah, ad-Dārimī", byMusnad: "Imām Aḥmad", byMuwatta: "Imām Mālik", byMusannaf: "Ibn Abī Šaybah, ʿAbd ar-Razzāq", byWeitere: "further scholars" },
    tr: { library: "Hadis kitaplığı", works: "Eserler", byScholar: "İmama göre", byKind: "Hadis ve âsâr", continueKicker: "Son okunan", continueGo: "Sürdür", search: "Eser, müellif, kitâb, bâb veya numara", searching: "Bâblar henüz sıralanıyor…", hitKitab: "Kitâb", hitNumber: "Numara", jump: "Numara", jumpGo: "Aç", jumpMiss: "Bu numara bu bölümde yok.", kitab: "Kitâb", bab: "Bâb", hadithCount: "{n} hadis", noHits: "Bu bölümde sonuç yok.", unavailable: "Kitaplığa şu an ulaşılamıyor.", opening: "Kitaplık açılıyor…", crumbHome: "Kitaplık", openKitab: "Bâbları göster", closeKitab: "Bâbları gizle", allInKitab: "Bu kitâbın hadisleri", sahihayn: "İki Sahîh", sunan: "Sünen", musnad: "Müsned", muwatta: "Muvatta", musannaf: "Musannefler", masanid: "Mesânîd ve Muvatta", aqidah: "Akîde", athar: "Selef âsârı", hadithWorks: "Hadis eserleri", atharWorks: "Âsâr ve akîde", otherWorks: "Diğer eserler", entries: "Kayıtlar", sixBooks: "Altı kitap", sixShort: ["Buhârî", "Müslim", "Ebû Dâvûd", "Tirmizî", "Nesâî", "İbn Mâce"], bySahihayn: "Buhârî, Müslim", bySunan: "Ebû Dâvûd, Tirmizî, Nesâî, İbn Mâce, Dârimî", byMusnad: "İmam Ahmed", byMuwatta: "İmam Mâlik", byMusannaf: "İbn Ebî Şeybe, Abdürrezzâk", byWeitere: "diğer âlimler" },
    ku: { library: "Pirtûkxaneya hedîsê", works: "Berhem", byScholar: "Li gorî îmam", byKind: "Hedîs û asar", continueKicker: "Dawî xwendin", continueGo: "Bidomîne", search: "Berhem, nivîskar, kitāb, bāb an hejmar", searching: "Bāb hîn tên rêzkirin…", hitKitab: "Kitāb", hitNumber: "Hejmar", jump: "Hejmar", jumpGo: "Veke", jumpMiss: "Ev hejmar di vê beşê de nîne.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} hedîs", noHits: "Di vê beşê de encam tune.", unavailable: "Pirtûkxane niha nayê vekirin.", opening: "Pirtûkxane tê vekirin…", crumbHome: "Pirtûkxane", openKitab: "Bāb nîşan bide", closeKitab: "Bāb veşêre", allInKitab: "Hedîsên vî kitābî", sahihayn: "Du Sahîh", sunan: "Sunen", musnad: "Musned", muwatta: "Muwetta", musannaf: "Musannef", masanid: "Mesânîd û Muwatta", aqidah: "Aqîde", athar: "Asarên selef", hadithWorks: "Berhemên hedîsê", atharWorks: "Asar û aqîde", otherWorks: "Berhemên din", entries: "Tomar", sixBooks: "Şeş pirtûk", sixShort: ["Buxarî", "Muslim", "Ebû Dawûd", "Tirmizî", "Nesâî", "Ibn Mace"], bySahihayn: "Buxarî, Muslim", bySunan: "Ebû Dawûd, Tirmizî, Nesâî, Ibn Mace, Darimî", byMusnad: "Îmam Ehmed", byMuwatta: "Îmam Malik", byMusannaf: "Ibn Ebî Şeybe, Ebdurezzaq", byWeitere: "alimên din" },
    ckb: { library: "کتێبخانەی حەدیس", works: "بەرهەمەکان", byScholar: "بەپێی ئیمام", byKind: "حەدیس و ئاسار", continueKicker: "دوایین خوێندنەوە", continueGo: "بەردەوامبە", search: "بەرهەم، نووسەر، کتاب، باب یان ژمارە", searching: "بابەکان هێشتا ڕێکدەخرێن…", hitKitab: "کتاب", hitNumber: "ژمارە", jump: "ژمارە", jumpGo: "بیکەرەوە", jumpMiss: "ئەم ژمارەیە لەم بەشەدا نییە.", kitab: "کتاب", bab: "باب", hadithCount: "{n} حەدیس", noHits: "لەم بەشەدا ئەنجام نییە.", unavailable: "کتێبخانە ئێستا بەردەست نییە.", opening: "کتێبخانە دەکرێتەوە…", crumbHome: "کتێبخانە", openKitab: "بابەکان پیشان بدە", closeKitab: "بابەکان بشارەوە", allInKitab: "حەدیسەکانی ئەم کتابە", sahihayn: "دوو سەحیح", sunan: "سونەن", musnad: "موسنەد", muwatta: "موطأ", musannaf: "موسەننەفەکان", masanid: "مەسانید و موطأ", aqidah: "عەقیدە", athar: "ئاساری سەلەف", hadithWorks: "بەرهەمی حەدیس", atharWorks: "ئاسار و عەقیدە", otherWorks: "بەرهەمی تر", entries: "تۆمار", sixBooks: "شەش کتێب", sixShort: ["بوخاری", "موسلیم", "ئەبو داود", "تیرمیزی", "نەسائی", "ئیبن ماجە"], bySahihayn: "بوخاری، موسلیم", bySunan: "ئەبو داود، تیرمیزی، نەسائی، ئیبن ماجە، دارمی", byMusnad: "ئیمام ئەحمەد", byMuwatta: "ئیمام مالیک", byMusannaf: "ئیبن ئەبی شەیبە، عەبدولڕەزاق", byWeitere: "زانایانی تر" },
    bs: { library: "Biblioteka hadisa", works: "Djela", byScholar: "Po imamu", byKind: "Hadis i asari", continueKicker: "Zadnje čitano", continueGo: "Nastavi", search: "Djelo, autor, kitab, bab ili broj", searching: "Poglavlja se još slažu…", hitKitab: "Kitab", hitNumber: "Broj", jump: "Broj", jumpGo: "Otvori", jumpMiss: "Ovaj broj nije u ovom dijelu.", kitab: "Kitab", bab: "Bab", hadithCount: "{n} hadisa", noHits: "Nema rezultata u ovom dijelu.", unavailable: "Biblioteka trenutno nije dostupna.", opening: "Biblioteka se otvara…", crumbHome: "Biblioteka", openKitab: "Prikaži babove", closeKitab: "Sakrij babove", allInKitab: "Hadisi ovog kitaba", sahihayn: "Dva Sahiha", sunan: "Sunen", musnad: "Musned", muwatta: "Muvetta", musannaf: "Musannefi", masanid: "Mesanidi i Muvetta", aqidah: "Akaid", athar: "Asari selefa", hadithWorks: "Hadiska djela", atharWorks: "Asari i akaid", otherWorks: "Ostala djela", entries: "Unosi", sixBooks: "Šest knjiga", sixShort: ["Buharija", "Muslim", "Ebu Davud", "Tirmizi", "Nesai", "Ibn Madže"], bySahihayn: "Buharija, Muslim", bySunan: "Ebu Davud, Tirmizi, Nesai, Ibn Madže, Darimi", byMusnad: "imam Ahmed", byMuwatta: "imam Malik", byMusannaf: "Ibn Ebi Šejbe, Abdurrezak", byWeitere: "ostali učenjaci" },
    fr: { library: "Bibliothèque du ḥadīth", works: "Ouvrages", byScholar: "Par imam", byKind: "Ḥadīth et āthār", continueKicker: "Dernière lecture", continueGo: "Continuer", search: "Ouvrage, auteur, kitāb, bāb ou numéro", searching: "Les chapitres sont encore classés…", hitKitab: "Kitāb", hitNumber: "Numéro", jump: "Numéro", jumpGo: "Ouvrir", jumpMiss: "Ce numéro n’est pas dans cette section.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīths", noHits: "Aucun résultat dans cette section.", unavailable: "La bibliothèque est indisponible pour le moment.", opening: "Ouverture de la bibliothèque…", crumbHome: "Bibliothèque", openKitab: "Afficher les abwāb", closeKitab: "Masquer les abwāb", allInKitab: "Ḥadīths de ce kitāb", sahihayn: "Les deux Ṣaḥīḥ", sunan: "Les Sunan", musnad: "al-Musnad", muwatta: "al-Muwaṭṭaʾ", musannaf: "Les Muṣannaf", masanid: "Masānīd et Muwaṭṭaʾ", aqidah: "ʿAqīda", athar: "Āthār des Salaf", hadithWorks: "Ouvrages de ḥadīth", atharWorks: "Āthār et ʿaqīda", otherWorks: "Autres ouvrages", entries: "Entrées", sixBooks: "Les six livres", sixShort: ["al-Buḫārī", "Muslim", "Abū Dāwūd", "at-Tirmiḏī", "an-Nasāʾī", "Ibn Māǧah"], bySahihayn: "al-Buḫārī, Muslim", bySunan: "Abū Dāwūd, at-Tirmiḏī, an-Nasāʾī, Ibn Māǧah, ad-Dārimī", byMusnad: "l’imām Aḥmad", byMuwatta: "l’imām Mālik", byMusannaf: "Ibn Abī Šaybah, ʿAbd ar-Razzāq", byWeitere: "d’autres savants" },
    es: { library: "Biblioteca del ḥadīṯ", works: "Obras", byScholar: "Por imām", byKind: "Ḥadīṯ y āṯār", continueKicker: "Última lectura", continueGo: "Continuar", search: "Obra, autor, kitāb, bāb o número", searching: "Los capítulos aún se ordenan…", hitKitab: "Kitāb", hitNumber: "Número", jump: "Número", jumpGo: "Abrir", jumpMiss: "Este número no está en esta sección.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīṯes", noHits: "No hay resultados en esta sección.", unavailable: "La biblioteca no está disponible ahora.", opening: "Abriendo la biblioteca…", crumbHome: "Biblioteca", openKitab: "Mostrar los abwāb", closeKitab: "Ocultar los abwāb", allInKitab: "Ḥadīṯes de este kitāb", sahihayn: "Los dos Ṣaḥīḥ", sunan: "Las Sunan", musnad: "al-Musnad", muwatta: "al-Muwaṭṭaʾ", musannaf: "Los Muṣannaf", masanid: "Masānīd y Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āṯār de los Salaf", hadithWorks: "Obras de ḥadīṯ", atharWorks: "Āṯār y ʿaqīdah", otherWorks: "Otras obras", entries: "Entradas", sixBooks: "Los seis libros", sixShort: ["al-Buḫārī", "Muslim", "Abū Dāwūd", "at-Tirmiḏī", "an-Nasāʾī", "Ibn Māǧah"], bySahihayn: "al-Buḫārī, Muslim", bySunan: "Abū Dāwūd, at-Tirmiḏī, an-Nasāʾī, Ibn Māǧah, ad-Dārimī", byMusnad: "imām Aḥmad", byMuwatta: "imām Mālik", byMusannaf: "Ibn Abī Šaybah, ʿAbd ar-Razzāq", byWeitere: "otros sabios" }
  };
  var IMAMS = {
    "sahih al buhari": "Imām al-Buḫārī",
    "sahih muslim": "Imām Muslim",
    "sunan abi dawud": "Imām Abū Dāwūd",
    "gami at tirmidi": "Imām at-Tirmiḏī",
    "sunan an nasai": "Imām an-Nasāʾī",
    "sunan ibn magah": "Imām Ibn Māǧah",
    "al muwatta": "Imām Mālik",
    "musnad ahmad": "Imām Aḥmad",
    "sunan ad darimi": "Imām ad-Dārimī",
    "musannaf ibn abi saybah": "Ibn Abī Šaybah",
    "abd ar razzaq al musannaf": "ʿAbd ar-Razzāq",
    "hilyat al awliya": "Abū Nuʿaym",
    "suab al iman": "al-Bayhaqī",
    "al mustadrak": "al-Ḥākim",
    "al bayhaqi as sunan al kubra": "al-Bayhaqī",
    "as sunan al kubra": "al-Bayhaqī",
    "al bayhaqi al asma wa s sifat": "al-Bayhaqī",
    "ibn al qayyim ilam al muwaqqiin": "Ibn al-Qayyim",
    "ibn al gawzi manaqib al imam ahmad": "Ibn al-Ǧawzī",
    "gami bayan al ilm": "Ibn ʿAbd al-Barr",
    "ibn sad at tabaqat": "Ibn Saʿd",
    "ibn sad at tabaqat al kubra": "Ibn Saʿd",
    "as sariah": "al-Āǧurrī",
    "sarh as sunnah": "al-Barbahārī"
  };
  var YEARS = {
    "sahih al buhari": "194–256",
    "sahih muslim": "204–261",
    "sunan abi dawud": "202–275",
    "gami at tirmidi": "209–279",
    "sunan an nasai": "215–303",
    "sunan ibn magah": "209–273",
    "ibn magah": "209–273",
    "al muwatta": "93–179",
    "musnad ahmad": "164–241",
    "sunan ad darimi": "181–255",
    "musannaf ibn abi saybah": "159–235",
    "abd ar razzaq al musannaf": "126–211",
    "hilyat al awliya": "336–430",
    "suab al iman": "384–458",
    "al mustadrak": "321–405",
    "al bayhaqi as sunan al kubra": "384–458",
    "as sunan al kubra": "384–458",
    "al bayhaqi al asma wa s sifat": "384–458",
    "ibn al qayyim ilam al muwaqqiin": "691–751",
    "ibn al gawzi manaqib al imam ahmad": "510–597",
    "gami bayan al ilm": "368–463",
    "ibn sad at tabaqat": "168–230",
    "ibn sad at tabaqat al kubra": "168–230",
    "as sariah": "d. 360",
    "sarh as sunnah": "d. 329"
  };
  var ARABIC = {
    "sahih al buhari": "صحيح البخاري",
    "sahih muslim": "صحيح مسلم",
    "sunan abi dawud": "سنن أبي داود",
    "gami at tirmidi": "جامع الترمذي",
    "sunan an nasai": "سنن النسائي",
    "sunan ibn magah": "سنن ابن ماجه",
    "sunan ad darimi": "سنن الدارمي",
    "al muwatta": "الموطأ",
    "musnad ahmad": "مسند أحمد",
    "musannaf ibn abi saybah": "مصنف ابن أبي شيبة",
    "sarh usul itiqad ahl as sunnah": "شرح أصول اعتقاد أهل السنة",
    "al ibanah al kubra": "الإبانة الكبرى",
    "as sariah": "الشريعة",
    "usul as sunnah": "أصول السنة",
    "hilyat al awliya": "حلية الأولياء",
    "gami bayan al ilm": "جامع بيان العلم",
    "sunan ad daraqutni": "سنن الدارقطني",
    "hilyat al awliya": "حلية الأولياء",
    "suab al iman": "شعب الإيمان",
    "abd ar razzaq al musannaf": "مصنف عبد الرزاق",
    "al mustadrak": "المستدرك",
    "al bayhaqi al asma wa s sifat": "الأسماء والصفات",
    "sarh usul itiqad ahl as sunnah": "شرح أصول اعتقاد أهل السنة"
  };
  var COVER_BASE = "/test/assets/hadith-covers/";
  var COVERS = {
    "sahih al buhari": "sahih-al-buhari.webp",
    "sahih muslim": "sahih-muslim.webp",
    "sunan abi dawud": "sunan-abi-dawud.webp",
    "sunan an nasai": "sunan-an-nasai.webp",
    "sunan ibn magah": "sunan-ibn-magah.webp",
    "ibn magah": "sunan-ibn-magah.webp",
    "sunan ad darimi": "sunan-ad-darimi.webp",
    "al muwatta": "al-muwatta.webp",
    "musnad ahmad": "musnad-ahmad.webp",
    "musannaf ibn abi saybah": "musannaf-ibn-abi-saybah.webp",
    "al mustadrak": "al-mustadrak.webp",
    "ibn sad at tabaqat": "ibn-sad-tabaqat.webp",
    "ibn sad at tabaqat al kubra": "ibn-sad-tabaqat.webp",
    "al bayhaqi al asma wa s sifat": "asma-wa-sifat.webp",
    "ibn al qayyim ilam al muwaqqiin": "ilam-al-muwaqqiin.webp",
    "ibn al gawzi manaqib al imam ahmad": "manaqib-ahmad.webp",
    "al bayhaqi as sunan al kubra": "sunan-al-kubra.webp",
    "as sunan al kubra": "sunan-al-kubra.webp",
    "as sariah": "ash-shariah.webp",
    "sarh as sunnah": "sharh-as-sunnah.webp",
    "gami bayan al ilm": "jami-bayan-al-ilm.webp",
    "hilyat al awliya": "hilyat-al-awliya.webp",
    "suab al iman": "shuab-al-iman.webp",
    "abd ar razzaq al musannaf": "musannaf-abd-al-razzaq.webp",
    "sunan ad daraqutni": "sunan-ad-daraqutni.webp",
    "ad dahabi siyar alam an nubala": "siyar-alam-an-nubala.webp",
    "as safii ar risalah": "ar-risalah-shafii.webp",
    "sarh usul itiqad ahl as sunnah": "sharh-usul-itiqad.webp",
    "ahmad az zuhd": "ahmad-az-zuhd.webp",
    "at tabari tarih ar rusul wa l muluk": "tarikh-tabari.webp"
  };
  var KITAB = {
    "Kitāb al-Īmān": ["الإيمان", "Der Glaube", "Faith", "İman", "Îman", "ئیمان", "Iman", "La foi", "La fe"],
    "Kitāb al-ʿIlm": ["العلم", "Das Wissen", "Knowledge", "İlim", "Zanîn", "زانست", "Znanje", "La science", "El conocimiento"],
    "Kitāb aṣ-Ṣalāh": ["الصلاة", "Das Gebet", "Prayer", "Namaz", "Nimêj", "نوێژ", "Namaz", "La prière", "La oración"],
    "Kitāb az-Zakāh": ["الزكاة", "Die Zakāh", "Zakāh", "Zekât", "Zakat", "زەکات", "Zekat", "La zakāt", "El zakāt"],
    "Kitāb aṣ-Ṣawm": ["الصوم", "Das Fasten", "Fasting", "Oruç", "Rojî", "ڕۆژوو", "Post", "Le jeûne", "El ayuno"],
    "Kitāb aṣ-Ṣiyām": ["الصيام", "Das Fasten", "Fasting", "Oruç", "Rojî", "ڕۆژوو", "Post", "Le jeûne", "El ayuno"],
    "Kitāb al-Adab": ["الأدب", "Der Adab", "Conduct", "Edep", "Adab", "ئەدەب", "Adab", "La conduite", "La conducta"],
    "Kitāb ar-Riqāq": ["الرقاق", "Die Herzensgüte", "Heart-softeners", "Kalp inceliği", "Nermiya dil", "نەرمیی دڵ", "Mekošta srca", "L’attendrissement", "El enternecimiento"],
    "Kitāb al-Aḏān": ["الأذان", "Der Gebetsruf", "The call to prayer", "Ezan", "Bang", "بانگ", "Ezan", "L’appel à la prière", "El llamado a la oración"],
    "Kitāb Faḍāʾil al-Qurʾān": ["فضائل القرآن", "Die Vorzüge des Qurʾān", "The virtues of the Qurʾān", "Kur’an’ın faziletleri", "Fezîletên Qurʾānê", "فەزڵەکانی قورئان", "Vrijednosti Kur’ana", "Les mérites du Qurʾān", "Las virtudes del Corán"],
    "Kitāb al-Buyūʿ": ["البيوع", "Die Geschäfte", "Sales", "Alışveriş", "Kirîn û firotin", "کڕین و فرۆشتن", "Kupoprodaja", "Les ventes", "Las compraventas"],
    "Kitāb aṭ-Ṭibb": ["الطب", "Die Heilkunde", "Medicine", "Tıp", "Bijîşkî", "پزیشکی", "Medicina", "La médecine", "La medicina"],
    "Kitāb at-Tawḥīd": ["التوحيد", "Der Tawḥīd", "Tawḥīd", "Tevhid", "Tewhîd", "تەوحید", "Tevhid", "Le tawḥīd", "El tawḥīd"],
    "Kitāb al-Fitan wa-Ašrāṭ as-Sāʿah": ["الفتن وأشراط الساعة", "Prüfungen und Zeichen der Stunde", "Trials and signs of the Hour", "Fitneler ve kıyamet alametleri", "Fitne û nîşanên saetê", "فیتنە و نیشانەکانی کاتژمێر", "Kušnje i znaci Časa", "Épreuves et signes de l’Heure", "Pruebas y signos de la Hora"],
    "Kitāb at-Tawbah": ["التوبة", "Die Umkehr", "Repentance", "Tövbe", "Tewbe", "تەوبە", "Tevba", "Le repentir", "El arrepentimiento"],
    "Kitāb aṭ-Ṭahārah": ["الطهارة", "Die Reinheit", "Purification", "Temizlik", "Paqijî", "پاکی", "Čistoća", "La purification", "La purificación"],
    "Kitāb Badʾ al-Waḥy": ["بدء الوحي", "Der Beginn der Offenbarung", "The beginning of revelation", "Vahyin başlangıcı", "Destpêka wehyê", "دەستپێکی وەحی", "Početak objave", "Le début de la révélation", "El inicio de la revelación"],
    "Kitāb al-Ǧihād wa-s-Siyar": ["الجهاد والسير", "Ǧihād und Feldzüge", "Ǧihād and campaigns", "Cihad ve siyer", "Cihad û siyer", "جیهاد و سیر", "Džihad i pohodi", "Ǧihād et campagnes", "Ŷihād y campañas"],
    "Kitāb az-Zuhd wa-r-Raqāʾiq": ["الزهد والرقائق", "Askese und Herzensgüte", "Asceticism and heart-softeners", "Zühd ve rikak", "Zuhd û riqaq", "زوهد و ڕیقاق", "Zuhd i nježnost", "Ascèse et attendrissement", "Ascetismo y enternecimiento"],
    "Kitāb al-Birr wa-ṣ-Ṣilah wa-l-Ādāb": ["البر والصلة والآداب", "Güte, Verwandtschaft und Adab", "Goodness, kinship and conduct", "İyilik, sıla ve edep", "Qencî, sila û adab", "چاکە، سیلە و ئەدەب", "Dobrota, rodbina i adab", "Bienfaisance, liens et conduite", "Bondad, parentesco y conducta"]
  };
  var GLOSS_LOC = { de: 1, en: 2, tr: 3, ku: 4, ckb: 5, bs: 6, fr: 7, es: 8 };
  var ORDER = ["sahihayn", "sunan", "musnad", "muwatta", "musannaf", "weitere"];
  var SECTION_KEY = { sahihayn: "sahihayn", sunan: "sunan", musnad: "musnad", muwatta: "muwatta", musannaf: "musannaf", weitere: "otherWorks" };
  var SECTION_AR = { sahihayn: "الصحيحان", sunan: "السنن", musnad: "المسند", muwatta: "الموطأ", musannaf: "المصنفات", weitere: "كتب أخرى" };
  var SECTION_LATIN = { sahihayn: "aṣ-Ṣaḥīḥān", sunan: "as-Sunan", musnad: "al-Musnad", muwatta: "al-Muwaṭṭaʾ", musannaf: "al-Muṣannafāt", weitere: "Weitere Werke" };
  var SPINE = ["green", "bordeaux", "navy"];
  var CATALOG = new Map();
  var catalogCursor = 0;
  var catalogBusy = false;
  var catalogStarted = false;
  var catalogPaint = 0;

  function norm(v) {
    return String(v || "").toLowerCase()
      .replace(/ā/g, "a").replace(/ī/g, "i").replace(/ū/g, "u")
      .replace(/ḥ/g, "h").replace(/ṣ/g, "s").replace(/ṭ/g, "t").replace(/ḍ/g, "d").replace(/ẓ/g, "z")
      .replace(/ḏ/g, "d").replace(/ḫ/g, "h").replace(/ǧ/g, "g").replace(/š/g, "s").replace(/č/g, "c")
      .replace(/[ʿʾ'`´]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function fold(v) {
    return String(v || "").toLowerCase().replace(/[ʿʾ'`´]/g, "").replace(/\s+/g, " ").trim();
  }
  function locale() {
    try {
      var code = String(w.localStorage.getItem("darAdultPreferredLocaleV1") || "de").toLowerCase().split("-")[0];
      return LANGS.indexOf(code) >= 0 ? code : "de";
    } catch (e) { return "de"; }
  }
  function rtl(loc) { return loc === "ar" || loc === "ckb"; }
  function t(key, loc) {
    var l = loc || locale();
    var row = COPY[l] && COPY[l][key] ? COPY[l][key] : COPY.de[key];
    return row || "";
  }
  function hadithWord(n, loc) {
    if (loc === "ar") {
      if (n === 2) return "حديثان";
      if (n >= 3 && n <= 10) return "أحاديث";
      if (n > 10) return "حديثًا";
      return "حديث";
    }
    if (loc === "bs") return (n % 10 === 1 && n % 100 !== 11) ? "hadis" : "hadisa";
    var one = { de: "Ḥadīṯ", en: "ḥadīth", tr: "hadis", ku: "hedîs", ckb: "حەدیس", fr: "ḥadīth", es: "ḥadīṯ" };
    var many = { de: "Ḥadīṯe", en: "ḥadīths", tr: "hadis", ku: "hedîs", ckb: "حەدیس", fr: "ḥadīths", es: "ḥadīṯes" };
    return (n === 1 ? one : many)[loc] || (n === 1 ? one.de : many.de);
  }
  function kitabWord(n, loc) {
    if (loc === "ar") {
      if (n === 2) return "كتابان";
      if (n >= 3 && n <= 10) return "كتب";
      if (n > 10) return "كتابًا";
      return "كتاب";
    }
    if (loc === "ckb") return n === 1 ? "کتاب" : "کتێب";
    var one = { de: "Kitāb", en: "kitāb", tr: "kitâb", ku: "kitāb", bs: "kitab", fr: "kitāb", es: "kitāb" };
    var many = { de: "Kutub", en: "kutub", tr: "kütüb", ku: "kutub", bs: "kutub", fr: "kutub", es: "kutub" };
    return (n === 1 ? one : many)[loc] || (n === 1 ? one.de : many.de);
  }
  function countLabel(n, loc) { var num = Number(n) || 0; return ornament(num, loc) + " " + hadithWord(num, loc); }
  function kitabLabel(n, loc) { var num = Number(n) || 0; return ornament(num, loc) + " " + kitabWord(num, loc); }
  function worksLabel(n, loc) {
    var num = Number(n) || 0;
    if (loc === "ar") return ornament(num, loc) + " " + kitabWord(num, loc);
    if (loc === "bs") return ornament(num, loc) + " " + ((num % 10 === 1 && num % 100 !== 11) ? "djelo" : "djela");
    var one = { de: "Werk", en: "work", tr: "eser", ku: "berhem", ckb: "بەرهەم", fr: "ouvrage", es: "obra" };
    var many = { de: "Werke", en: "works", tr: "eser", ku: "berhem", ckb: "بەرهەم", fr: "ouvrages", es: "obras" };
    return ornament(num, loc) + " " + ((num === 1 ? one : many)[loc] || (num === 1 ? one.de : many.de));
  }
  function ornament(n, loc) {
    var s = String(n);
    if (loc === "ar" || loc === "ckb") s = s.replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; });
    return s;
  }
  function esc(v) {
    if (typeof w.esc === "function") return w.esc(v);
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
  }
  function publicText(v) { return String(v == null ? "" : v).replace(/\bHAD-\d{4,6}\b/gi, "").replace(/[ \t]{2,}/g, " ").trim(); }
  function publicNum(v) { var n = String(v || "").trim(); return /\bHAD-\d{4,6}\b/i.test(n) ? "" : n; }
  function sectionFor(title) {
    var n = norm(title);
    if (n === "sahih al buhari" || n === "sahih muslim") return "sahihayn";
    if (n === "sunan abi dawud" || n === "gami at tirmidi" || n === "sunan an nasai" || n === "sunan ibn magah" || n === "ibn magah") return "sunan";
    if (n === "sunan ad darimi" || n === "sunan ad daraqutni" || n === "as sunan al kubra" || n === "al bayhaqi as sunan al kubra") return "sunan";
    if (/^sunan /.test(n) && n.indexOf("zuhd") < 0) return "sunan";
    if (n === "musnad ahmad" || n.indexOf("musnad") === 0) return "musnad";
    if (n === "al muwatta") return "muwatta";
    if (n.indexOf("musannaf") >= 0) return "musannaf";
    return "weitere";
  }
  function coverOf(title) {
    var file = COVERS[norm(title)];
    return file ? COVER_BASE + file : "";
  }
  function yearsOf(title) { return YEARS[norm(title)] || ""; }
  function authorLine(title) {
    var name = imamOf(title);
    var years = yearsOf(title);
    if (name && years) return name + " · " + years;
    return name || years;
  }
  function imamOf(title) {
    var n = norm(title);
    if (IMAMS[n]) return IMAMS[n];
    var raw = String(title || "");
    var comma = raw.indexOf(", ");
    if (comma > 3 && comma < 42) {
      var left = raw.slice(0, comma).trim();
      if (!/kitāb|sunan|ṣaḥīḥ|muṣannaf|musnad|muwaṭṭa/i.test(left)) return left;
    }
    return "";
  }
  function arabicOf(title) { return ARABIC[norm(title)] || ""; }
  function cleanKitab(title) { return String(title || "Kitāb").replace(/^Kitāb\s+/i, "").trim() || "Kitāb"; }
  function cleanBab(title) { return String(title || "Bāb").replace(/^Bāb[:\s-]*/i, "").trim() || "Bāb"; }
  function kitabFace(title, loc) {
    var row = KITAB[title];
    var stored = cleanKitab(title);
    if (!row) return { primary: stored, arabic: "", gloss: "" };
    if (loc === "ar") return { primary: row[0], arabic: "", gloss: stored };
    var gloss = row[GLOSS_LOC[loc] || 0] || "";
    if (loc === "ckb") return { primary: row[0], arabic: "", gloss: gloss };
    return { primary: stored, arabic: row[0], gloss: gloss };
  }
  function storeGet(key) { try { return w.sessionStorage.getItem(key) || ""; } catch (e) { return ""; } }
  function storeSet(key, value) { try { if (value) w.sessionStorage.setItem(key, value); else w.sessionStorage.removeItem(key); } catch (e) {} }
  function mode() { var m = storeGet("darHadithShelfModeV1"); return m === "imam" || m === "kind" ? m : "works"; }
  function searchQuery() {
    try {
      var raw = w.localStorage.getItem("darHadithSearchQueryV1");
      if (!raw) return "";
      if (raw.charAt(0) === '"') { try { return String(JSON.parse(raw) || ""); } catch (e) {} }
      return raw;
    } catch (e) { return ""; }
  }
  function lastRead() {
    try { var raw = w.localStorage.getItem("darHadithLastReadV1"); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function remember(route) {
    if (!route || !route.hadithId || typeof w.findHadithById !== "function") return;
    var h = w.findHadithById(route.hadithId);
    if (!h || typeof w.hadithPath !== "function") return;
    var preview = publicText(h.german || h.babTitle || h.chapterTitle || "").slice(0, 96);
    try {
      w.localStorage.setItem("darHadithLastReadV1", JSON.stringify({
        path: w.hadithPath(h),
        book: publicText(h.bookTitle || ""),
        num: publicNum(h.hadithNumber),
        preview: preview
      }));
    } catch (e) {}
  }
  function badgeFor(book) {
    return BADGES[norm(book && book.title)] || "";
  }
  function go(value) {
    if (typeof w.navigate === "function") w.navigate("hadith", value || "");
    else if (w.location) w.location.hash = "#/hadith" + (value ? "/" + value : "");
  }
  function crumbs(book, chapter, section, loc) {
    var rows = [{ label: t("crumbHome", loc), value: "" }];
    if (book) rows.push({ label: book.title || t("works", loc), value: String(book.id) });
    if (book && chapter) rows.push({ label: cleanKitab(chapter.title || t("kitab", loc)), value: book.id + "/" + chapter.id });
    if (book && chapter && section) rows.push({ label: cleanBab(section.title || t("bab", loc)), value: book.id + "/" + chapter.id + "/" + section.id });
    return '<nav class="hls-crumbs" aria-label="' + esc(t("library", loc)) + '">' + rows.map(function (row, i) {
      var last = i === rows.length - 1;
      var sep = i ? '<span class="hls-crumb-sep" aria-hidden="true">›</span>' : "";
      var node = last
        ? '<span class="hls-crumb-current">' + esc(publicText(row.label)) + "</span>"
        : '<button type="button" class="hls-crumb" data-nav="hadith" data-value="' + esc(row.value) + '">' + esc(publicText(row.label)) + "</button>";
      return sep + node;
    }).join("") + "</nav>";
  }
  function tools(q, loc) {
    return '<section class="main-search"><label class="hls-sr">' + esc(t("search", loc)) + '</label><input id="hadithSearchInput" class="search" type="search" enterkeyhint="search" autocomplete="off" value="' + esc(q) + '" placeholder="' + esc(t("search", loc)) + '"></section>';
  }
  function continueStrip(loc) {
    var item = lastRead();
    if (!item || !item.path) return "";
    var bits = [item.book, item.num, item.preview].filter(Boolean).join(" · ");
    return '<button type="button" class="hls-continue" data-nav="hadith" data-value="' + esc(item.path) + '"><span class="hls-continue-kicker">' + esc(t("continueKicker", loc)) + '</span><strong>' + esc(t("continueGo", loc)) + '</strong><span class="hls-continue-text">' + esc(publicText(bits)) + "</span></button>";
  }
  function hero(title, sub, loc, src, extra) {
    var quiet = !title;
    var copy = quiet ? "" : '<div class="hls-hero-copy"><h1>' + esc(title) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>";
    return '<header class="hls-hero' + (quiet ? " hls-hero--quiet" : "") + (extra ? " " + extra : "") + '"><img class="hls-hero-img" alt="" width="1600" height="900" decoding="async" src="' + (src || HERO_LIST) + '">' + copy + "</header>";
  }
  function modes(loc) {
    var current = mode();
    return '<div class="hls-modes" role="tablist">' + ["works", "imam", "kind"].map(function (id) {
      var key = id === "works" ? "works" : id === "imam" ? "byScholar" : "byKind";
      return '<button type="button" role="tab" aria-selected="' + (current === id ? "true" : "false") + '" data-hls-mode="' + id + '">' + esc(t(key, loc)) + "</button>";
    }).join("") + "</div>";
  }
  function faceHtml(book) {
    var cover = coverOf(book.title);
    if (cover) return '<span class="hls-face"><img class="hls-cover" alt="" width="150" height="200" loading="lazy" decoding="async" src="' + esc(cover) + '"></span>';
    var arabic = arabicOf(book.title);
    return '<span class="hls-face hls-face--binding"><span class="hls-binding"><span class="hls-binding-rule" aria-hidden="true"></span>' + (arabic ? '<span class="hls-binding-ar" lang="ar" dir="rtl">' + esc(arabic) + "</span>" : "") + '<span class="hls-binding-title">' + esc(book.title || "") + '</span><span class="hls-binding-rule" aria-hidden="true"></span></span></span>';
  }
  function spine(book, index, loc, hint) {
    var author = authorLine(book.title);
    var badge = badgeFor(book);
    var blurb = typeof book.verifiedDescription === "string" ? book.verifiedDescription.trim() : "";
    var why = "";
    var value = book.id;
    if (hint && hint.kind === "num" && hint.path) {
      why = '<span class="hls-book-why">' + esc(t("hitNumber", loc) + " " + hint.label) + "</span>";
      value = hint.path;
    } else if (hint && hint.kind === "kitab" && hint.label) {
      why = '<span class="hls-book-why">' + esc(t("hitKitab", loc) + " · " + hint.label) + "</span>";
    }
    return '<li class="hls-slot"><button type="button" class="hls-book" data-nav="hadith" data-value="' + esc(value) + '">' + faceHtml(book) + '<span class="hls-book-title">' + esc(book.title || "") + "</span>" + (author ? '<span class="hls-book-author">' + esc(author) + "</span>" : "") + '<span class="hls-book-count">' + esc(countLabel(book.hadithCount || 0, loc)) + "</span>" + why + (badge ? '<span class="hls-badge">' + esc(badge) + "</span>" : "") + (blurb ? '<span class="hls-sr">' + esc(blurb) + "</span>" : "") + "</button></li>";
  }
  var SIX = ["sahih al buhari", "sahih muslim", "sunan abi dawud", "gami at tirmidi", "sunan an nasai", "sunan ibn magah"];
  function isSix(title, key) {
    var n = norm(title);
    return n === key || (key === "sunan ibn magah" && n === "ibn magah");
  }
  function thumbHtml(book) {
    var cover = coverOf(book.title);
    if (cover) return '<span class="hls-thumb"><img alt="" width="44" height="58" loading="lazy" decoding="async" src="' + esc(cover) + '"></span>';
    return '<span class="hls-thumb hls-thumb--plain" aria-hidden="true"></span>';
  }
  function compactRow(book, loc, hint) {
    var author = authorLine(book.title);
    var why = "";
    var value = book.id;
    if (hint && hint.kind === "num" && hint.path) {
      why = "<small>" + esc(t("hitNumber", loc) + " " + hint.label) + "</small>";
      value = hint.path;
    } else if (hint && hint.kind === "kitab" && hint.label) {
      why = "<small>" + esc(t("hitKitab", loc) + " · " + hint.label) + "</small>";
    }
    return '<li><button type="button" class="hls-compact" data-nav="hadith" data-value="' + esc(value) + '">' + thumbHtml(book) + '<span class="hls-compact-copy"><strong>' + esc(book.title || "") + "</strong>" + (author ? "<small>" + esc(author) + "</small>" : "") + why + "</span>" + chevron() + "</button></li>";
  }
  function compactList(rows, loc) {
    return '<ul class="hls-compact-list">' + rows.map(function (row) { return compactRow(row.book, loc, row.hint); }).join("") + "</ul>";
  }
  function belongsToSix(title) {
    return SIX.some(function (key) { return isSix(title, key); });
  }
  function cardHtml(book, loc) {
    var author = authorLine(book.title);
    return '<li><button type="button" class="hls-card" data-nav="hadith" data-value="' + esc(book.id) + '">' + thumbHtml(book) + '<span class="hls-card-copy"><strong>' + esc(book.title || "") + "</strong>" + (author ? "<small>" + esc(author) + "</small>" : "") + "</span></button></li>";
  }
  function cardGrid(rows, loc, extra) {
    return '<ul class="hls-grid' + (extra ? " " + extra : "") + '">' + rows.map(function (row) { return cardHtml(row.book || row, loc); }).join("") + "</ul>";
  }
  function sixGrid(books, loc) {
    var cards = SIX.map(function (key) {
      var book = null;
      books.some(function (item) { if (isSix(item.title, key)) { book = item; return true; } return false; });
      return book ? cardHtml(book, loc) : "";
    }).join("");
    if (!cards) return "";
    return '<section class="hls-six"><h3 class="hls-six-label">' + esc(t("sixBooks", loc)) + '</h3><ul class="hls-grid hls-grid--six">' + cards + "</ul></section>";
  }
  function indexRow(group, loc, open) {
    var latin = (loc === "ar" || loc === "ckb") ? SECTION_LATIN[group.key] : t(SECTION_KEY[group.key], loc);
    return '<li class="hls-index-item' + (open ? " is-open" : "") + '"><button type="button" class="hls-index-row" data-hls-section="' + esc(group.key) + '" aria-expanded="' + (open ? "true" : "false") + '"><span class="hls-index-ar" lang="ar" dir="rtl">' + esc(SECTION_AR[group.key]) + '</span><span class="hls-index-name">' + esc(latin) + '</span><span class="hls-index-count">' + esc(worksLabel(group.rows.length, loc)) + "</span>" + chevron() + "</button>" + (open ? compactList(group.rows, loc) : "") + "</li>";
  }
  function groupBooks(books, loc) {
    var current = mode();
    if (current === "imam") {
      var map = {};
      books.forEach(function (book) {
        var name = imamOf(book.title) || t("otherWorks", loc);
        (map[name] || (map[name] = [])).push(book);
      });
      return Object.keys(map).sort(function (a, b) { return a.localeCompare(b); }).map(function (name) {
        return { key: name, title: name, books: map[name] };
      });
    }
    if (current === "kind") {
      var hadith = [], athar = [];
      books.forEach(function (book) {
        var section = sectionFor(book.title);
        if (section === "weitere") athar.push(book);
        else hadith.push(book);
      });
      return [
        { key: "hadithWorks", title: t("hadithWorks", loc), books: hadith },
        { key: "atharWorks", title: t("atharWorks", loc), books: athar }
      ].filter(function (group) { return group.books.length; });
    }
    return ORDER.map(function (key) {
      return { key: key, title: t(SECTION_KEY[key], loc), books: books.filter(function (book) { return sectionFor(book.title) === key; }) };
    }).filter(function (group) { return group.books.length; });
  }
  var BY_KEY = { sahihayn: "bySahihayn", sunan: "bySunan", musnad: "byMusnad", muwatta: "byMuwatta", musannaf: "byMusannaf", weitere: "byWeitere" };
  function page(title, sub, search, body, loc, nested) {
    var head = '<div class="view-head"><h2>' + esc(title || "") + "</h2>" + (sub ? '<div class="view-desc">' + esc(sub) + "</div>" : "") + "</div>";
    return '<div class="dua-hub hadith-hub' + (nested ? " hadith-hub--nested" : "") + '" lang="' + esc(loc) + '" dir="' + (rtl(loc) ? "rtl" : "ltr") + '">' +
      head + (search || "") + '<div class="hls">' + (body || "") + "</div></div>";
  }
  function workMatch(book, q) {
    var n = norm(q);
    if (!n) return false;
    var parts = [book.title, imamOf(book.title), arabicOf(book.title), yearsOf(book.title)].join(" ");
    return (" " + norm(parts) + " ").indexOf(" " + n + " ") >= 0;
  }
  function bookHint(book, q) {
    var n = norm(q);
    var f = fold(q);
    if (!n && !f) return { hit: true };
    var parts = [book.title, imamOf(book.title), arabicOf(book.title), yearsOf(book.title)].join(" ");
    if ((n && norm(parts).indexOf(n) >= 0) || (f && fold(parts).indexOf(f) >= 0)) return { hit: true, kind: "work" };
    var cat = CATALOG.get(String(book.id));
    if (!cat) return { hit: false, pending: catalogBusy || catalogCursor < booksNow().length };
    var digits = String(q).replace(/[^\d]/g, "");
    if (digits && cat.nums[digits]) return { hit: true, kind: "num", label: digits, path: cat.nums[digits] };
    var i;
    for (i = 0; i < cat.kits.length; i++) {
      if ((n && cat.kits[i].n.indexOf(n) >= 0) || (f && cat.kits[i].raw && cat.kits[i].raw.indexOf(f) >= 0)) return { hit: true, kind: "kitab", label: cat.kits[i].title };
    }
    return { hit: false };
  }
  function home(books, q, loc) {
    var pending = false;
    var picked = [];
    var workOnly = q ? books.filter(function (book) { return workMatch(book, q); }) : [];
    books.forEach(function (book) {
      if (!q) { picked.push({ book: book, hint: null }); return; }
      if (workOnly.length) {
        if (workMatch(book, q)) picked.push({ book: book, hint: { hit: true, kind: "work" } });
        return;
      }
      var hint = bookHint(book, q);
      if (hint.pending) pending = true;
      if (hint.hit) picked.push({ book: book, hint: hint });
    });
    var groups = ORDER.map(function (key) {
      return { key: key, rows: picked.filter(function (row) { return sectionFor(row.book.title) === key; }) };
    }).filter(function (group) { return group.rows.length; });
    function latinOf(key) {
      return (loc === "ar" || loc === "ckb") ? SECTION_LATIN[key] : t(SECTION_KEY[key], loc);
    }
    function sectionHead(group, count) {
      return '<div class="hls-section-head"><div><p class="hls-section-ar" lang="ar" dir="rtl">' + esc(SECTION_AR[group.key]) + "</p><h3>" + esc(latinOf(group.key)) + '</h3><p class="hls-section-by">' + esc(t(BY_KEY[group.key] || "byWeitere", loc)) + '</p></div><span class="hls-section-count">' + esc(worksLabel(count, loc)) + "</span></div>";
    }
    var body;
    if (q) {
      body = groups.map(function (group) {
        return '<section class="hls-section">' + sectionHead(group, group.rows.length) + compactList(group.rows, loc) + "</section>";
      }).join("") || '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>";
    } else {
      var open = storeGet("darHadithShelfSectionV1") === "weitere";
      body = sixGrid(books, loc) + groups.map(function (group) {
        if (group.key === "weitere") {
          return '<section class="hls-section hls-section--fold"><button type="button" class="hls-fold" data-hls-section="weitere" aria-expanded="' + (open ? "true" : "false") + '"><span class="hls-fold-copy"><span class="hls-section-ar" lang="ar" dir="rtl">' + esc(SECTION_AR.weitere) + '</span><span class="hls-fold-name">' + esc(latinOf("weitere")) + '</span><span class="hls-section-by">' + esc(t("byWeitere", loc)) + '</span></span><span class="hls-section-count">' + esc(worksLabel(group.rows.length, loc)) + "</span>" + chevron() + "</button>" + (open ? compactList(group.rows, loc) : "") + "</section>";
        }
        var rest = group.rows.filter(function (row) { return !belongsToSix(row.book.title); });
        if (!rest.length) return "";
        return '<section class="hls-section">' + sectionHead(group, rest.length) + cardGrid(rest, loc) + "</section>";
      }).join("");
    }
    var note = q && pending ? '<p class="hls-searching" role="status">' + esc(t("searching", loc)) + "</p>" : "";
    var total = books.reduce(function (n, book) { return n + Number(book.hadithCount || 0); }, 0);
    return page(t("library", loc), countLabel(total, loc), tools(q, loc), note + continueStrip(loc) + body, loc, false);
  }
  function babsOf(chapter) {
    return ((chapter && chapter.babs) || []).filter(function (bab) { return bab && (bab.hadiths || []).length; });
  }
  function findNumber(collection, digits) {
    var found = null;
    ((collection && collection.chapters) || []).some(function (chapter) {
      var lists = babsOf(chapter);
      var pools = lists.length ? lists : [{ id: "", hadiths: chapter.hadiths || [] }];
      return pools.some(function (bab) {
        return (bab.hadiths || []).some(function (h) {
          if (publicNum(h.hadithNumber) !== digits) return false;
          found = { chapter: chapter, hadith: h };
          return true;
        });
      });
    });
    return found;
  }
  function chevron() { return '<span class="hls-chevron" aria-hidden="true"></span>'; }
  function babWord(n, loc) {
    if (loc === "ar") {
      if (n === 2) return "بابان";
      if (n >= 3 && n <= 10) return "أبواب";
      if (n > 10) return "بابًا";
      return "باب";
    }
    var one = { de: "Bāb", en: "bāb", tr: "bâb", ku: "bāb", ckb: "باب", bs: "bab", fr: "bāb", es: "bāb" };
    var many = { de: "Abwāb", en: "abwāb", tr: "bâb", ku: "bāb", ckb: "بابەکان", bs: "babova", fr: "abwāb", es: "abwāb" };
    return (n === 1 ? one : many)[loc] || (n === 1 ? one.de : many.de);
  }
  function babLabel(n, loc) { var num = Number(n) || 0; return ornament(num, loc) + " " + babWord(num, loc); }
  function displayKitab(chapter, loc) {
    var face = kitabFace((chapter && chapter.title) || "", loc);
    var primary = String(face.primary || "").trim();
    var arabic = (loc === "ar" || loc === "ckb") ? "" : (face.arabic || "");
    if (primary && norm(primary) !== "kitab") return { name: primary, arabic: arabic };
    var babs = babsOf(chapter);
    var i;
    for (i = 0; i < babs.length; i++) {
      var bab = cleanBab(babs[i].title || "");
      if (bab && norm(bab) !== "bab") return { name: bab, arabic: face.arabic || "" };
    }
    if (face.arabic) return { name: face.arabic, arabic: "" };
    if (face.gloss && norm(face.gloss) !== "kitab") return { name: face.gloss, arabic: "" };
    return { name: "", arabic: "" };
  }
  function workSub(book, meta) {
    return [authorLine(book.title), meta].filter(Boolean).join(" · ");
  }
  function workFrame(book, loc) {
    var arabic = arabicOf(book.title);
    return crumbs(book, null, null, loc) +
      '<figure class="hls-work">' + faceHtml(book) +
      (arabic ? '<figcaption class="hls-work-ar" lang="ar" dir="rtl">' + esc(arabic) + "</figcaption>" : "") +
      "</figure>";
  }
  function navRow(value, name, arabic, meta) {
    return '<li class="hls-group-item"><button type="button" class="hls-row" data-nav="hadith" data-value="' + esc(value) + '"><span class="hls-row-main">' +
      (arabic ? '<span class="hls-row-ar" lang="ar" dir="rtl">' + esc(arabic) + "</span>" : "") +
      "<strong>" + esc(name) + '</strong></span><span class="hls-row-count">' + esc(meta) + "</span>" + chevron() + "</button></li>";
  }
  function matchesQuery(blob, q) {
    var nq = norm(q);
    var fq = fold(q);
    if (!nq && !fq) return true;
    return (nq && norm(blob).indexOf(nq) >= 0) || (fq && fold(blob).indexOf(fq) >= 0);
  }
  function fihris(book, collection, route, q, loc) {
    var chapters = (collection.chapters || []).slice();
    var digits = /^\d+$/.test(String(q || "").trim()) ? String(q).trim() : "";
    var numbered = digits ? findNumber(collection, digits) : null;
    var openId = (numbered && numbered.chapter && numbered.chapter.id) || route.chapterId || storeGet("darHadithShelfOpenKitabV1");
    var items = chapters.map(function (chapter) {
      var shown = displayKitab(chapter, loc);
      var babs = babsOf(chapter);
      var count = (chapter.hadiths || []).length;
      var blob = (chapter.title || "") + " " + shown.name + " " + shown.arabic + " " + babs.map(function (bab) { return bab.title; }).join(" ");
      if (!matchesQuery(blob, q) && String(openId) !== String(chapter.id)) return "";
      var name = shown.name;
      if (!name) name = babs.length ? cleanBab(babs[0].title || "") : "";
      if (!name || norm(name) === "bab" || norm(name) === "kitab") name = countLabel(count, loc);
      if (babs.length <= 1) return navRow(book.id + "/" + chapter.id, name, shown.arabic, countLabel(count, loc));
      var open = String(openId) === String(chapter.id);
      var inner = open ? '<ul class="hls-group hls-group--inner">' + babs.map(function (bab) {
        var babName = cleanBab(bab.title || "");
        if (!babName || norm(babName) === "bab") babName = countLabel((bab.hadiths || []).length, loc);
        return navRow(book.id + "/" + chapter.id + "/" + bab.id, babName, "", countLabel((bab.hadiths || []).length, loc));
      }).join("") + "</ul>" : "";
      return '<li class="hls-group-item' + (open ? " is-open" : "") + '"><button type="button" class="hls-row" data-hls-kitab="' + esc(chapter.id) + '" aria-expanded="' + (open ? "true" : "false") + '"><span class="hls-row-main">' +
        (shown.arabic ? '<span class="hls-row-ar" lang="ar" dir="rtl">' + esc(shown.arabic) + "</span>" : "") +
        "<strong>" + esc(name) + '</strong></span><span class="hls-row-count">' + esc(countLabel(count, loc)) + "</span>" + chevron() + "</button>" + inner + "</li>";
    }).join("");
    var numberGo = "";
    if (numbered && numbered.hadith && typeof w.hadithPath === "function") {
      numberGo = navRow(w.hadithPath(numbered.hadith), t("hitNumber", loc) + " " + digits, "", "");
      numberGo = '<ul class="hls-group">' + numberGo + "</ul>";
    }
    var meta = kitabLabel(chapters.length, loc) + " · " + countLabel(book.hadithCount || 0, loc);
    return page(book.title || "", workSub(book, meta), tools(q, loc), workFrame(book, loc) + numberGo + (items ? '<ul class="hls-group">' + items + "</ul>" : '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>"), loc, true);
  }
  function babBoard(book, chapter, babs, q, loc) {
    var items = babs.map(function (bab) {
      var name = cleanBab(bab.title || "");
      if (!matchesQuery((chapter.title || "") + " " + name, q)) return "";
      if (!name || norm(name) === "bab") name = countLabel((bab.hadiths || []).length, loc);
      return navRow(book.id + "/" + chapter.id + "/" + bab.id, name, "", countLabel((bab.hadiths || []).length, loc));
    }).join("");
    var meta = babLabel(babs.length, loc) + " · " + countLabel(book.hadithCount || 0, loc);
    return page(book.title || "", workSub(book, meta), tools(q, loc), workFrame(book, loc) + (items ? '<ul class="hls-group">' + items + "</ul>" : '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>"), loc, true);
  }
  function leaf(book, chapter, section, q, loc, bare) {
    var pool = section ? (section.hadiths || []) : ((chapter && chapter.hadiths) || []);
    var rows = typeof w.filterHadithList === "function" ? w.filterHadithList(pool, q) : pool;
    var title = section ? cleanBab(section.title) : cleanKitab((chapter && chapter.title) || "");
    if (!title || norm(title) === "kitab" || norm(title) === "bab") title = book.title || "";
    var list = rows.map(function (h, i) {
      var num = publicNum(h.hadithNumber);
      var preview = publicText(h.german || h.babTitle || "").replace(/\s+/g, " ").slice(0, 180);
      var who = publicText(h.narrator || h.narratorLine || "");
      var grade = publicText(h.grade || "");
      if (grade.length > 32) grade = "";
      grade = grade ? '<em class="hls-grade">' + esc(grade) + "</em>" : "";
      var value = typeof w.hadithPath === "function" ? w.hadithPath(h) : [book.id, chapter && chapter.id, section && section.id, h.id].filter(Boolean).join("/");
      return '<li class="hls-group-item"><button type="button" class="hls-row hls-leaf" data-nav="hadith" data-value="' + esc(value) + '"><span class="hls-row-main"><strong>' + esc(preview || title) + "</strong>" + (who ? "<small>" + esc(who) + "</small>" : "") + grade + '</span><span class="hls-row-count">' + esc(ornament(num || (i + 1), loc)) + "</span>" + chevron() + "</button></li>";
    }).join("");
    var group = '<ul class="hls-group">' + (list || '<li class="hls-empty">' + esc(t("noHits", loc)) + "</li>") + "</ul>";
    if (bare) return page(book.title || "", workSub(book, countLabel(rows.length, loc)), tools(q, loc), workFrame(book, loc) + group, loc, true);
    return page(title, [book.title, countLabel(rows.length, loc)].filter(Boolean).join(" · "), tools(q, loc), crumbs(book, chapter, section, loc) + group, loc, true);
  }
  function onHadith() {
    try { return !!(w.readRoute && w.readRoute().view === "hadith"); } catch (e) { return false; }
  }
  function refreshOnce() {
    if (refreshQueued || !onHadith() || typeof w.render !== "function") return;
    refreshQueued = true;
    var run = function () {
      refreshQueued = false;
      if (onHadith()) w.render();
    };
    if (typeof w.requestAnimationFrame === "function") w.requestAnimationFrame(run);
    else w.setTimeout(run, 16);
  }
  function booksNow() {
    try { if (typeof w.hydrateHadithLibraryCache === "function") w.hydrateHadithLibraryCache(); } catch (e) {}
    if (typeof w.hadithVisibleBooks !== "function") return [];
    try { return w.hadithVisibleBooks().slice(); } catch (e) { return []; }
  }
  function poolFor(route) {
    var collection = route && route.bookId ? COLS.get(String(route.bookId)) : null;
    if (!collection) return [];
    var rows = [];
    (collection.chapters || []).forEach(function (chapter) {
      if (route.chapterId && String(chapter.id) !== String(route.chapterId)) return;
      var babs = babsOf(chapter);
      if (route.babId) {
        babs.forEach(function (bab) {
          if (String(bab.id) === String(route.babId)) rows = rows.concat(bab.hadiths || []);
        });
        return;
      }
      if (babs.length) babs.forEach(function (bab) { rows = rows.concat(bab.hadiths || []); });
      else rows = rows.concat(chapter.hadiths || []);
    });
    return rows;
  }
  function renderShelves() {
    w.__SHELF_RENDER = (w.__SHELF_RENDER || 0) + 1;
    var loc = locale();
    if (typeof w.readHadithFilters === "function") { try { w.readHadithFilters(); } catch (e) {} }
    var books = booksNow();
    if (!books.length) {
      if (libraryFailed) return page(t("library", loc), "", "", '<p class="hls-empty">' + esc(t("unavailable", loc)) + "</p>", loc, false);
      if (!libraryWait && typeof w.ensureHadithLibrary === "function") {
        libraryWait = true;
        Promise.resolve(w.ensureHadithLibrary()).then(function () {
          libraryWait = false;
          if (!booksNow().length) libraryFailed = true;
          refreshOnce();
        }, function () {
          libraryWait = false;
          libraryFailed = true;
          refreshOnce();
        });
      }
      return page(t("library", loc), "", "", '<p class="hls-empty">' + esc(t("opening", loc)) + "</p>", loc, false);
    }
    var route = typeof w.parseHadithRoute === "function" ? w.parseHadithRoute() : { bookId: "", chapterId: "", babId: "", hadithId: "" };
    var book = route.bookId ? books.filter(function (item) { return String(item.id) === String(route.bookId); })[0] : null;
    var collection = book ? COLS.get(String(book.id)) : null;
    if (book && !collection && typeof w.ensureHadithCollection === "function" && !COLS_WAIT[book.id]) {
      COLS_WAIT[book.id] = true;
      Promise.resolve(w.ensureHadithCollection(book.id)).then(function (col) {
        delete COLS_WAIT[book.id];
        if (col) COLS.set(String(book.id), col);
        refreshOnce();
      }, function () { delete COLS_WAIT[book.id]; });
    }
    if (route.hadithId && typeof w.renderHadithBookPanel === "function") {
      remember(route);
      return w.renderHadithBookPanel(book, route);
    }
    var q = searchQuery();
    if (!book) {
      scheduleCatalog();
      return home(books, q, loc);
    }
    if (!collection) return page(book.title || t("library", loc), "", "", '<p class="hls-empty">' + esc(t("opening", loc)) + "</p>", loc, true);
    var chapter = route.chapterId ? (collection.chapters || []).filter(function (item) { return String(item.id) === String(route.chapterId); })[0] : null;
    var babs = babsOf(chapter);
    var section = route.babId ? babs.filter(function (item) { return String(item.id) === String(route.babId); })[0] : null;
    if (!route.chapterId && (collection.chapters || []).length <= 1) {
      var only = (collection.chapters || [])[0] || null;
      var onlyBabs = babsOf(only);
      if (only && onlyBabs.length > 1) return babBoard(book, only, onlyBabs, q, loc);
      return leaf(book, only, (onlyBabs[0] || null), q, loc, true);
    }
    if (route.babId && chapter) return leaf(book, chapter, section || babs[0] || null, q, loc);
    if (chapter && babs.length <= 1) return leaf(book, chapter, babs[0] || null, q, loc);
    return fihris(book, collection, route, q, loc);
  }
  function writeSearch(v) {
    try {
      if (v) w.localStorage.setItem("darHadithSearchQueryV1", v);
      else w.localStorage.removeItem("darHadithSearchQueryV1");
    } catch (e) {}
  }
  function brandBottom() {
    var nodes = w.document.querySelectorAll("header");
    var i, cs, rect;
    for (i = 0; i < nodes.length; i++) {
      cs = w.getComputedStyle(nodes[i]);
      if (cs.position !== "fixed" && cs.position !== "sticky") continue;
      rect = nodes[i].getBoundingClientRect();
      if (rect.height > 20 && rect.top < 40) return Math.round(rect.bottom);
    }
    return 0;
  }
  function pinHero() {
    if (!w.document || !onHadith()) return;
    var app = w.document.getElementById("appView");
    var head = w.document.querySelector("#appView .hadith-hub > .view-head");
    if (!app || !head) return;
    var box = app.getBoundingClientRect();
    var top = brandBottom();
    function place(prop, value) { head.style.setProperty(prop, value, "important"); }
    place("position", "fixed");
    place("top", top + "px");
    place("left", Math.round(box.left) + "px");
    place("width", Math.round(box.width) + "px");
    place("max-width", "none");
    place("margin", "0");
    place("right", "auto");
    place("z-index", "64");
    place("border-radius", "0");
    if (!head.dataset.pinned) {
      head.dataset.pinned = "1";
      w.requestAnimationFrame(pinHero);
    }
    var h = Math.round(head.getBoundingClientRect().height);
    var hub = head.parentElement;
    if (h > 40 && hub) {
      var pad = Math.max(0, Math.round(top + h - hub.getBoundingClientRect().top));
      hub.style.paddingTop = pad + "px";
      w.document.documentElement.style.setProperty("--dar-immersive-hero-height", (top + h) + "px");
    }
  }
  function bindShelves() {
    if (!w.document || !onHadith()) return;
    pinHero();
    if (!w.__hlsHeroPin) {
      w.__hlsHeroPin = true;
      if (typeof w.ResizeObserver === "function") {
        var app = w.document.getElementById("appView");
        if (app) new w.ResizeObserver(function () { pinHero(); }).observe(app);
      }
      w.addEventListener("resize", pinHero, { passive: true });
    }
    var search = w.document.getElementById("hadithSearchInput");
    if (search) {
      search.oninput = function () {
        w.__hadithSearchKeepUntil = Date.now() + 800;
        writeSearch(search.value || "");
        w.clearTimeout(w.__hadithSearchRenderTimer);
        w.__hadithSearchRenderTimer = w.setTimeout(function () {
          if (typeof w.render === "function") w.render();
        }, 140);
      };
      if (w.__hadithSearchKeepUntil > Date.now()) {
        try { search.focus({ preventScroll: true }); } catch (e) { try { search.focus(); } catch (e2) {} }
        try { var pos = search.value.length; search.setSelectionRange(pos, pos); } catch (e3) {}
      }
    }
    w.document.querySelectorAll(".hls-book, .hls-compact, .hls-card").forEach(function (btn) {
      btn.addEventListener("click", function () { writeSearch(""); });
    });
    w.document.querySelectorAll("[data-hls-section]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var id = btn.getAttribute("data-hls-section") || "";
        var open = storeGet("darHadithShelfSectionV1");
        storeSet("darHadithShelfSectionV1", open === id ? "" : id);
        if (typeof w.render === "function") w.render();
      });
    });
    w.document.querySelectorAll("[data-hls-mode]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        storeSet("darHadithShelfModeV1", btn.getAttribute("data-hls-mode") || "works");
        if (typeof w.render === "function") w.render();
      });
    });
    w.document.querySelectorAll("[data-hls-kitab]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var id = btn.getAttribute("data-hls-kitab") || "";
        var route = typeof w.parseHadithRoute === "function" ? w.parseHadithRoute() : {};
        if (route.chapterId && String(route.chapterId) === id && route.bookId) {
          storeSet("darHadithShelfOpenKitabV1", "");
          go(String(route.bookId));
          return;
        }
        var open = storeGet("darHadithShelfOpenKitabV1");
        storeSet("darHadithShelfOpenKitabV1", open === id ? "" : id);
        if (typeof w.render === "function") w.render();
      });
    });
  }
  function compactCatalog(col) {
    var kits = [];
    var nums = {};
    ((col && col.chapters) || []).forEach(function (chapter) {
      var face = kitabFace(chapter.title || "", "de");
      var babs = babsOf(chapter);
      var blob = (chapter.title || "") + " " + face.arabic + " " + face.gloss + " " + babs.map(function (bab) { return bab.title || ""; }).join(" ");
      kits.push({ n: norm(blob), raw: fold(blob), title: cleanKitab(chapter.title || "") });
      var pools = babs.length ? babs : [{ hadiths: chapter.hadiths || [] }];
      pools.forEach(function (bab) {
        (bab.hadiths || []).forEach(function (h) {
          var num = publicNum(h.hadithNumber);
          if (!num || nums[num] || typeof w.hadithPath !== "function") return;
          nums[num] = w.hadithPath(h);
        });
      });
    });
    return { kits: kits, nums: nums };
  }
  function paintCatalog() {
    if (catalogPaint) return;
    catalogPaint = w.setTimeout(function () {
      catalogPaint = 0;
      if (searchQuery() && onHadith()) refreshOnce();
    }, 480);
  }
  function scheduleCatalog() {
    var q = searchQuery();
    if (catalogStarted || !q) return;
    if (booksNow().some(function (book) { return workMatch(book, q); })) return;
    catalogStarted = true;
    var idle = w.requestIdleCallback || function (fn) { w.setTimeout(fn, 80); };
    idle(function () { stepCatalog(); });
  }
  function stepCatalog() {
    if (!searchQuery()) { catalogStarted = false; return; }
    var books = booksNow();
    if (!books.length) { catalogStarted = false; return; }
    if (catalogCursor >= books.length) return;
    var book = books[catalogCursor];
    if (CATALOG.has(String(book.id))) { catalogCursor++; stepCatalog(); return; }
    if (typeof w.ensureHadithCollection !== "function") return;
    catalogBusy = true;
    Promise.resolve(w.ensureHadithCollection(book.id)).then(function (col) {
      catalogBusy = false;
      CATALOG.set(String(book.id), compactCatalog(col));
      catalogCursor++;
      var q = searchQuery();
      if (q && onHadith() && (catalogCursor >= books.length || bookHint(book, q).hit)) paintCatalog();
      var idle = w.requestIdleCallback || function (fn) { w.setTimeout(fn, 70); };
      idle(function () { stepCatalog(); });
    }, function () {
      catalogBusy = false;
      CATALOG.set(String(book.id), { kits: [], nums: {} });
      catalogCursor++;
      var idle = w.requestIdleCallback || function (fn) { w.setTimeout(fn, 70); };
      idle(function () { stepCatalog(); });
    });
  }
  function loadBadges() {
    if (!w.fetch || w.__DAR_HADITH_SHELF_BADGES_V2) return;
    w.__DAR_HADITH_SHELF_BADGES_V2 = true;
    var idle = w.requestIdleCallback || function (fn) { w.setTimeout(fn, 40); };
    idle(function () {
      w.fetch("/test/assets/hadith-shelf-badges-v1.json", { cache: "force-cache" }).then(function (r) {
        return r.ok ? r.json() : null;
      }).then(function (data) {
        var map = data && data.byNormTitle;
        if (!map) return;
        BADGES = map;
        var route = typeof w.parseHadithRoute === "function" ? w.parseHadithRoute() : {};
        if (route.hadithId) return;
        if (onHadith()) refreshOnce();
      }).catch(function () {});
    });
  }
  w.__DAR_HADITH_SHELVES_V2 = true;
  w.DARHadithShelvesV2 = {
    copy: COPY,
    langs: LANGS,
    sectionFor: sectionFor,
    imamOf: imamOf,
    arabicOf: arabicOf,
    norm: norm,
    publicText: publicText,
    publicNum: publicNum,
    render: renderShelves,
    bind: bindShelves
  };
  loadBadges();
})(typeof window !== "undefined" ? window : globalThis);
