/* DĀR AL TAWḤĪD · Ḥadīṯ library shelves v2
   Navigation only. The page calls DARHadithShelvesV2.render; this file does not replace renderHadith.
   Badges come from the precomputed map. The full search list is never walked here.
   No living beings. Imam names only when the work title or the existing library map already names them. No years. */
(function (w) {
  "use strict";
  if (w.__DAR_HADITH_SHELVES_V2) return;
  var BADGES = {};
  var COLS = new Map();
  var COLS_WAIT = {};
  var libraryWait = false;
  var libraryFailed = false;
  var refreshQueued = false;
  var ARCH = "/assets/feed-backgrounds/auto/mosque/bg-auto-mosque-unsplash-JF3o8Ajk.webp";
  var LANGS = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
  var COPY = {
    de: { library: "Ḥadīṯ-Bibliothek", works: "Werke", byScholar: "nach Imām", byKind: "Ḥadīṯ und Āṯār", continueKicker: "Zuletzt gelesen", continueGo: "Weiterlesen", search: "Werk, Kitāb oder Bāb suchen", jump: "Nummer", jumpGo: "Öffnen", jumpMiss: "Diese Nummer ist in diesem Bereich nicht vorhanden.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} Ḥadīṯe", noHits: "Keine Treffer in diesem Bereich.", unavailable: "Die Bibliothek ist gerade nicht erreichbar.", opening: "Die Bibliothek wird geöffnet…", crumbHome: "Bibliothek", openKitab: "Abwāb anzeigen", closeKitab: "Abwāb schließen", allInKitab: "Ḥadīṯe dieses Kitāb", sahihayn: "aṣ-Ṣaḥīḥān", sunan: "Sunan · al-Arbaʿah", masanid: "Masānīd und Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āṯār der Salaf", hadithWorks: "Ḥadīṯ-Werke", atharWorks: "Āṯār und ʿAqīdah", otherWorks: "Weitere Werke", entries: "Einträge" },
    ar: { library: "مكتبة الحديث", works: "الكتب", byScholar: "حسب الإمام", byKind: "الحديث والآثار", continueKicker: "آخر قراءة", continueGo: "متابعة", search: "ابحث عن كتاب أو باب", jump: "الرقم", jumpGo: "فتح", jumpMiss: "هذا الرقم غير موجود في هذا القسم.", kitab: "كتاب", bab: "باب", hadithCount: "{n} حديثًا", noHits: "لا توجد نتائج في هذا القسم.", unavailable: "المكتبة غير متاحة الآن.", opening: "جارٍ فتح المكتبة…", crumbHome: "المكتبة", openKitab: "عرض الأبواب", closeKitab: "إخفاء الأبواب", allInKitab: "أحاديث هذا الكتاب", sahihayn: "الصحيحان", sunan: "السنن الأربعة", masanid: "المسانيد والموطأ", aqidah: "العقيدة", athar: "آثار السلف", hadithWorks: "كتب الحديث", atharWorks: "الآثار والعقيدة", otherWorks: "كتب أخرى", entries: "مداخل" },
    en: { library: "Ḥadīth library", works: "Works", byScholar: "By imam", byKind: "Ḥadīth and āthār", continueKicker: "Last read", continueGo: "Continue", search: "Search a work, kitāb or bāb", jump: "Number", jumpGo: "Open", jumpMiss: "This number is not in this section.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīths", noHits: "No matches in this section.", unavailable: "The library cannot be reached just now.", opening: "Opening the library…", crumbHome: "Library", openKitab: "Show the abwāb", closeKitab: "Hide the abwāb", allInKitab: "Ḥadīths of this kitāb", sahihayn: "The two Ṣaḥīḥs", sunan: "Sunan · the four", masanid: "Masānīd and Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āthār of the Salaf", hadithWorks: "Ḥadīth works", atharWorks: "Āthār and ʿaqīdah", otherWorks: "Further works", entries: "Entries" },
    tr: { library: "Hadis kitaplığı", works: "Eserler", byScholar: "İmama göre", byKind: "Hadis ve âsâr", continueKicker: "Son okunan", continueGo: "Sürdür", search: "Eser, kitâb veya bâb ara", jump: "Numara", jumpGo: "Aç", jumpMiss: "Bu numara bu bölümde yok.", kitab: "Kitâb", bab: "Bâb", hadithCount: "{n} hadis", noHits: "Bu bölümde sonuç yok.", unavailable: "Kitaplığa şu an ulaşılamıyor.", opening: "Kitaplık açılıyor…", crumbHome: "Kitaplık", openKitab: "Bâbları göster", closeKitab: "Bâbları gizle", allInKitab: "Bu kitâbın hadisleri", sahihayn: "İki Sahîh", sunan: "Sünen · dört kitap", masanid: "Mesânîd ve Muvatta", aqidah: "Akîde", athar: "Selef âsârı", hadithWorks: "Hadis eserleri", atharWorks: "Âsâr ve akîde", otherWorks: "Diğer eserler", entries: "Kayıtlar" },
    ku: { library: "Pirtûkxaneya hedîsê", works: "Berhem", byScholar: "Li gorî îmam", byKind: "Hedîs û asar", continueKicker: "Dawî xwendin", continueGo: "Bidomîne", search: "Berhem, kitāb an bāb bigere", jump: "Hejmar", jumpGo: "Veke", jumpMiss: "Ev hejmar di vê beşê de nîne.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} hedîs", noHits: "Di vê beşê de encam tune.", unavailable: "Pirtûkxane niha nayê vekirin.", opening: "Pirtûkxane tê vekirin…", crumbHome: "Pirtûkxane", openKitab: "Bāb nîşan bide", closeKitab: "Bāb veşêre", allInKitab: "Hedîsên vî kitābî", sahihayn: "Du Sahîh", sunan: "Sunen · çar pirtûk", masanid: "Mesânîd û Muwatta", aqidah: "Aqîde", athar: "Asarên selef", hadithWorks: "Berhemên hedîsê", atharWorks: "Asar û aqîde", otherWorks: "Berhemên din", entries: "Tomar" },
    ckb: { library: "کتێبخانەی حەدیس", works: "بەرهەمەکان", byScholar: "بەپێی ئیمام", byKind: "حەدیس و ئاسار", continueKicker: "دوایین خوێندنەوە", continueGo: "بەردەوامبە", search: "بەرهەم، کتاب یان باب بگەڕێ", jump: "ژمارە", jumpGo: "بیکەرەوە", jumpMiss: "ئەم ژمارەیە لەم بەشەدا نییە.", kitab: "کتاب", bab: "باب", hadithCount: "{n} حەدیس", noHits: "لەم بەشەدا ئەنجام نییە.", unavailable: "کتێبخانە ئێستا بەردەست نییە.", opening: "کتێبخانە دەکرێتەوە…", crumbHome: "کتێبخانە", openKitab: "بابەکان پیشان بدە", closeKitab: "بابەکان بشارەوە", allInKitab: "حەدیسەکانی ئەم کتابە", sahihayn: "دوو سەحیح", sunan: "سونەن · چوار پەرتووک", masanid: "مەسانید و موطأ", aqidah: "عەقیدە", athar: "ئاساری سەلەف", hadithWorks: "بەرهەمی حەدیس", atharWorks: "ئاسار و عەقیدە", otherWorks: "بەرهەمی تر", entries: "تۆمار" },
    bs: { library: "Biblioteka hadisa", works: "Djela", byScholar: "Po imamu", byKind: "Hadis i asari", continueKicker: "Zadnje čitano", continueGo: "Nastavi", search: "Traži djelo, kitab ili bab", jump: "Broj", jumpGo: "Otvori", jumpMiss: "Ovaj broj nije u ovom dijelu.", kitab: "Kitab", bab: "Bab", hadithCount: "{n} hadisa", noHits: "Nema rezultata u ovom dijelu.", unavailable: "Biblioteka trenutno nije dostupna.", opening: "Biblioteka se otvara…", crumbHome: "Biblioteka", openKitab: "Prikaži babove", closeKitab: "Sakrij babove", allInKitab: "Hadisi ovog kitaba", sahihayn: "Dva Sahiha", sunan: "Sunen · četiri djela", masanid: "Mesanidi i Muvetta", aqidah: "Akaid", athar: "Asari selefa", hadithWorks: "Hadiska djela", atharWorks: "Asari i akaid", otherWorks: "Ostala djela", entries: "Unosi" },
    fr: { library: "Bibliothèque du ḥadīth", works: "Ouvrages", byScholar: "Par imam", byKind: "Ḥadīth et āthār", continueKicker: "Dernière lecture", continueGo: "Continuer", search: "Chercher un ouvrage, un kitāb ou un bāb", jump: "Numéro", jumpGo: "Ouvrir", jumpMiss: "Ce numéro n’est pas dans cette section.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīths", noHits: "Aucun résultat dans cette section.", unavailable: "La bibliothèque est indisponible pour le moment.", opening: "Ouverture de la bibliothèque…", crumbHome: "Bibliothèque", openKitab: "Afficher les abwāb", closeKitab: "Masquer les abwāb", allInKitab: "Ḥadīths de ce kitāb", sahihayn: "Les deux Ṣaḥīḥ", sunan: "Sunan · les quatre", masanid: "Masānīd et Muwaṭṭaʾ", aqidah: "ʿAqīda", athar: "Āthār des Salaf", hadithWorks: "Ouvrages de ḥadīth", atharWorks: "Āthār et ʿaqīda", otherWorks: "Autres ouvrages", entries: "Entrées" },
    es: { library: "Biblioteca del ḥadīṯ", works: "Obras", byScholar: "Por imām", byKind: "Ḥadīṯ y āṯār", continueKicker: "Última lectura", continueGo: "Continuar", search: "Buscar obra, kitāb o bāb", jump: "Número", jumpGo: "Abrir", jumpMiss: "Este número no está en esta sección.", kitab: "Kitāb", bab: "Bāb", hadithCount: "{n} ḥadīṯes", noHits: "No hay resultados en esta sección.", unavailable: "La biblioteca no está disponible ahora.", opening: "Abriendo la biblioteca…", crumbHome: "Biblioteca", openKitab: "Mostrar los abwāb", closeKitab: "Ocultar los abwāb", allInKitab: "Ḥadīṯes de este kitāb", sahihayn: "Los dos Ṣaḥīḥ", sunan: "Sunan · los cuatro", masanid: "Masānīd y Muwaṭṭaʾ", aqidah: "ʿAqīdah", athar: "Āṯār de los Salaf", hadithWorks: "Obras de ḥadīṯ", atharWorks: "Āṯār y ʿaqīdah", otherWorks: "Otras obras", entries: "Entradas" }
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
    "sunan ad darimi": "Imām ad-Dārimī"
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
    "sunan ad daraqutni": "سنن الدارقطني"
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
  var ORDER = ["sahihayn", "sunan", "masanid", "aqidah", "athar", "other"];
  var SECTION_KEY = { sahihayn: "sahihayn", sunan: "sunan", masanid: "masanid", aqidah: "aqidah", athar: "athar", other: "otherWorks" };
  var SPINE = ["green", "bordeaux", "navy"];
  var jumpMiss = "";

  function norm(v) {
    return String(v || "").toLowerCase()
      .replace(/ā/g, "a").replace(/ī/g, "i").replace(/ū/g, "u")
      .replace(/ḥ/g, "h").replace(/ṣ/g, "s").replace(/ṭ/g, "t").replace(/ḍ/g, "d").replace(/ẓ/g, "z")
      .replace(/ḏ/g, "d").replace(/ḫ/g, "h").replace(/ǧ/g, "g").replace(/š/g, "s").replace(/č/g, "c")
      .replace(/[ʿʾ'`´]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
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
  function countLabel(n, loc) { return t("hadithCount", loc).replace("{n}", ornament(n, loc)); }
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
    if (n === "sunan ad darimi" || n === "sunan ad daraqutni" || n === "as sunan al kubra") return "sunan";
    if (/^sunan /.test(n) && n.indexOf("zuhd") < 0) return "sunan";
    if (n === "al muwatta" || n === "musnad ahmad" || n.indexOf("musannaf") >= 0) return "masanid";
    if (/itiqad|usul as sunnah|sarh as sunnah|ibanah|sariah|asma wa s sifat|itisam|\bbida\b|hujjah|tabshir|\bal iman\b/.test(n)) return "aqidah";
    if (/zuhd|hilyat|dunya|safwah|tabaqat|manaqib|iqtid|akhlaq|bayan al ilm|\badab\b|sirah|sira\b/.test(n)) return "athar";
    return "other";
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
    var miss = jumpMiss ? '<p class="hls-miss" role="status">' + esc(t("jumpMiss", loc)) + "</p>" : "";
    return '<div class="hls-tools"><label class="hls-search"><span class="hls-sr">' + esc(t("search", loc)) + '</span><input id="hadithSearchInput" class="hls-search-input" type="search" enterkeyhint="search" autocomplete="off" value="' + esc(q) + '" placeholder="' + esc(t("search", loc)) + '"></label><form class="hls-jump" data-hls-jump><label>' + esc(t("jump", loc)) + '<input name="n" inputmode="numeric" autocomplete="off" maxlength="12"></label><button type="submit">' + esc(t("jumpGo", loc)) + "</button></form>" + miss + "</div>";
  }
  function continueStrip(loc) {
    var item = lastRead();
    if (!item || !item.path) return "";
    var bits = [item.book, item.num, item.preview].filter(Boolean).join(" · ");
    return '<button type="button" class="hls-continue" data-nav="hadith" data-value="' + esc(item.path) + '"><span class="hls-continue-kicker">' + esc(t("continueKicker", loc)) + '</span><strong>' + esc(t("continueGo", loc)) + '</strong><span class="hls-continue-text">' + esc(publicText(bits)) + "</span></button>";
  }
  function hero(title, sub, loc) {
    return '<header class="hls-hero"><img class="hls-hero-img" alt="" width="1600" height="900" decoding="async" fetchpriority="low" src="' + ARCH + '"><div class="hls-hero-copy"><p class="hls-kicker">' + esc(t("library", loc)) + "</p><h1>" + esc(title) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div></header>";
  }
  function modes(loc) {
    var current = mode();
    return '<div class="hls-modes" role="tablist">' + ["works", "imam", "kind"].map(function (id) {
      var key = id === "works" ? "works" : id === "imam" ? "byScholar" : "byKind";
      return '<button type="button" role="tab" aria-selected="' + (current === id ? "true" : "false") + '" data-hls-mode="' + id + '">' + esc(t(key, loc)) + "</button>";
    }).join("") + "</div>";
  }
  function spine(book, index, loc) {
    var section = sectionFor(book.title);
    var tone = SPINE[(ORDER.indexOf(section) + index) % SPINE.length];
    var imam = imamOf(book.title);
    var arabic = arabicOf(book.title);
    var badge = badgeFor(book);
    var blurb = typeof book.verifiedDescription === "string" ? book.verifiedDescription.trim() : "";
    return '<li class="hls-spine-slot"><button type="button" class="hls-spine hls-spine--' + tone + '" data-nav="hadith" data-value="' + esc(book.id) + '"><span class="hls-spine-ornament" aria-hidden="true"></span><span class="hls-spine-index" aria-hidden="true">' + esc(ornament(index + 1, loc)) + "</span>" + (arabic ? '<span class="hls-spine-ar" lang="ar" dir="rtl">' + esc(arabic) + "</span>" : "") + '<span class="hls-spine-title">' + esc(book.title || "") + "</span>" + (imam ? '<span class="hls-spine-imam">' + esc(imam) + "</span>" : "") + '<span class="hls-spine-count">' + esc(countLabel(book.hadithCount || 0, loc)) + "</span>" + (badge ? '<span class="hls-badge">' + esc(badge) + "</span>" : "") + (blurb ? '<span class="hls-sr">' + esc(blurb) + "</span>" : "") + "</button></li>";
  }
  function shelf(books, loc) {
    if (!books.length) return '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>";
    return '<ul class="hls-shelf">' + books.map(function (book, i) { return spine(book, i, loc); }).join("") + "</ul>";
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
        if (section === "athar" || section === "aqidah") athar.push(book);
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
  function shell(inner, loc) {
    return '<div class="hls" lang="' + esc(loc) + '" dir="' + (rtl(loc) ? "rtl" : "ltr") + '">' + inner + "</div>";
  }
  function home(books, q, loc) {
    var filtered = books.filter(function (book) {
      if (!q) return true;
      return norm(book.title + " " + imamOf(book.title) + " " + arabicOf(book.title)).indexOf(norm(q)) >= 0;
    });
    var groups = groupBooks(filtered, loc);
    var body = groups.map(function (group) {
      return '<section class="hls-section"><div class="hls-section-head"><h2>' + esc(group.title) + '</h2><span>' + esc(ornament(group.books.length, loc)) + "</span></div>" + shelf(group.books, loc) + "</section>";
    }).join("") || '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>";
    var total = books.reduce(function (n, book) { return n + Number(book.hadithCount || 0); }, 0);
    return shell(hero(t("library", loc), countLabel(total, loc), loc) + modes(loc) + tools(q, loc) + continueStrip(loc) + body, loc);
  }
  function babsOf(chapter) {
    return ((chapter && chapter.babs) || []).filter(function (bab) { return bab && (bab.hadiths || []).length; });
  }
  function fihris(book, collection, route, q, loc) {
    var chapters = (collection.chapters || []).slice();
    var openId = route.chapterId || storeGet("darHadithShelfOpenKitabV1");
    var nq = norm(q);
    var blocks = chapters.map(function (chapter, index) {
      var face = kitabFace(chapter.title || "", loc);
      var babs = babsOf(chapter);
      var count = (chapter.hadiths || []).length;
      var hay = norm((chapter.title || "") + " " + face.arabic + " " + face.gloss + " " + babs.map(function (bab) { return bab.title; }).join(" "));
      if (nq && hay.indexOf(nq) < 0 && String(openId) !== String(chapter.id)) return "";
      var open = String(openId) === String(chapter.id);
      var rows = "";
      if (open) {
        if (babs.length > 1) {
          rows = '<ol class="hls-abwab">' + babs.map(function (bab, i) {
            return '<li><button type="button" data-nav="hadith" data-value="' + esc(book.id + "/" + chapter.id + "/" + bab.id) + '"><span class="hls-num">' + esc(ornament(i + 1, loc)) + '</span><span><b>' + esc(cleanBab(bab.title || t("bab", loc))) + "</b><small>" + esc(countLabel((bab.hadiths || []).length, loc)) + "</small></span></button></li>";
          }).join("") + "</ol>";
        } else {
          rows = '<p class="hls-direct"><button type="button" data-nav="hadith" data-value="' + esc(book.id + "/" + chapter.id) + '">' + esc(t("allInKitab", loc)) + " · " + esc(countLabel(count, loc)) + "</button></p>";
        }
      }
      return '<article class="hls-kitab' + (open ? " is-open" : "") + '"><button type="button" class="hls-kitab-toggle" data-hls-kitab="' + esc(chapter.id) + '" aria-expanded="' + (open ? "true" : "false") + '"><span class="hls-num">' + esc(ornament(index + 1, loc)) + '</span><span class="hls-kitab-copy">' + (face.arabic ? '<span class="hls-kitab-ar" lang="ar" dir="rtl">' + esc(face.arabic) + "</span>" : "") + "<strong>" + esc(face.primary) + "</strong>" + (face.gloss ? "<small>" + esc(face.gloss) + "</small>" : "") + "<small>" + esc(countLabel(count, loc)) + '</small></span><span class="hls-kitab-action">' + esc(open ? t("closeKitab", loc) : t("openKitab", loc)) + "</span></button>" + rows + "</article>";
    }).join("");
    var imam = imamOf(book.title);
    var arabic = arabicOf(book.title);
    var blurb = typeof book.verifiedDescription === "string" ? book.verifiedDescription.trim() : "";
    var head = '<header class="hls-work-head">' + (arabic ? '<p class="hls-work-ar" lang="ar" dir="rtl">' + esc(arabic) + "</p>" : "") + "<h1>" + esc(book.title || "") + "</h1>" + (imam ? '<p class="hls-work-imam">' + esc(imam) + "</p>" : "") + (blurb ? '<p class="hls-work-blurb">' + esc(blurb) + "</p>" : "") + "<p>" + esc(ornament(chapters.length, loc) + " " + t("kitab", loc) + " · " + countLabel(book.hadithCount || 0, loc)) + "</p></header>";
    return shell(hero(book.title || t("library", loc), imam, loc) + crumbs(book, null, null, loc) + tools(q, loc) + continueStrip(loc) + head + '<div class="hls-fihris">' + (blocks || '<p class="hls-empty">' + esc(t("noHits", loc)) + "</p>") + "</div>", loc);
  }
  function leaf(book, chapter, section, q, loc) {
    var pool = section ? (section.hadiths || []) : ((chapter && chapter.hadiths) || []);
    var rows = typeof w.filterHadithList === "function" ? w.filterHadithList(pool, q) : pool;
    var title = section ? cleanBab(section.title) : cleanKitab((chapter && chapter.title) || "");
    var list = rows.map(function (h, i) {
      var num = publicNum(h.hadithNumber);
      var preview = publicText(h.german || h.babTitle || "").replace(/\s+/g, " ").slice(0, 180);
      var who = publicText(h.narrator || h.narratorLine || "");
      var grade = publicText(h.grade || "");
      if (grade.length > 32) grade = "";
      var value = typeof w.hadithPath === "function" ? w.hadithPath(h) : [book.id, chapter && chapter.id, section && section.id, h.id].filter(Boolean).join("/");
      return '<li><button type="button" class="hls-leaf" data-nav="hadith" data-value="' + esc(value) + '"><span class="hls-num">' + esc(ornament(num || (i + 1), loc)) + '</span><span><strong>' + esc(preview || title) + "</strong>" + (who ? "<small>" + esc(who) + "</small>" : "") + (grade ? '<em class="hls-badge">' + esc(grade) + "</em>" : "") + "</span></button></li>";
    }).join("");
    return shell(crumbs(book, chapter, section, loc) + '<header class="hls-work-head"><h1>' + esc(title) + "</h1><p>" + esc(countLabel(rows.length, loc)) + "</p></header>" + tools(q, loc) + '<ol class="hls-leaves">' + (list || '<li class="hls-empty">' + esc(t("noHits", loc)) + "</li>") + "</ol>", loc);
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
    jumpMiss = "";
    if (typeof w.readHadithFilters === "function") { try { w.readHadithFilters(); } catch (e) {} }
    var books = booksNow();
    if (!books.length) {
      if (libraryFailed) return shell('<p class="hls-empty">' + esc(t("unavailable", loc)) + "</p>", loc);
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
      return shell(hero(t("library", loc), "", loc) + '<p class="hls-empty">' + esc(t("opening", loc)) + "</p>", loc);
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
    if (!book) return home(books, q, loc);
    if (!collection) return shell(hero(book.title || "", "", loc) + '<p class="hls-empty">' + esc(t("opening", loc)) + "</p>", loc);
    var chapter = route.chapterId ? (collection.chapters || []).filter(function (item) { return String(item.id) === String(route.chapterId); })[0] : null;
    var babs = babsOf(chapter);
    var section = route.babId ? babs.filter(function (item) { return String(item.id) === String(route.babId); })[0] : null;
    if (route.babId && chapter) return leaf(book, chapter, section || babs[0] || null, q, loc);
    if (chapter && babs.length <= 1) return leaf(book, chapter, babs[0] || null, q, loc);
    return fihris(book, collection, route, q, loc);
  }
  function bindShelves() {
    if (!w.document || !onHadith()) return;
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
    w.document.querySelectorAll("[data-hls-jump]").forEach(function (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var input = form.querySelector("input");
        var num = String(input && input.value || "").trim();
        var route = typeof w.parseHadithRoute === "function" ? w.parseHadithRoute() : {};
        var hit = poolFor(route).filter(function (h) { return publicNum(h.hadithNumber) === num; })[0];
        if (!hit || typeof w.hadithPath !== "function") {
          jumpMiss = num || "1";
          if (typeof w.render === "function") w.render();
          return;
        }
        jumpMiss = "";
        go(w.hadithPath(hit));
      });
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
