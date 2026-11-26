/* Visitor Qurʾān meanings from the build-time QuranEnc import.
   App locale ( ?lang= then darAdultPreferredLocaleV1 ) selects the default.
   An explicit pick is stored in darQuranMeaningLocaleV1. */
(function (global) {
  "use strict";
  var LOCALES = ["de", "en", "tr", "ku", "ckb", "bs", "fr", "es", "ar"];
  var APP_KEY = "darAdultPreferredLocaleV1";
  var PICK_KEY = "darQuranMeaningLocaleV1";
  var UI = {
    de: { showMeaning: "Bedeutung anzeigen", choose: "Bedeutung wählen", source: "Quelle", version: "Version", mokhtasar: "Al-Muḫtaṣar fi at-Tafsīr", loading: "Bedeutung wird geladen", missing: "Keine Bedeutung geladen", meccan: "Mekkanisch", medinan: "Medinensisch", notes: "Anmerkungen" },
    en: { showMeaning: "Show meaning", choose: "Choose meaning", source: "Source", version: "Version", mokhtasar: "Al-Mukhtasar fi at-Tafsir", loading: "Loading the meaning", missing: "Meaning not loaded", meccan: "Meccan", medinan: "Medinan", notes: "Notes" },
    tr: { showMeaning: "Anlamı göster", choose: "Anlam seç", source: "Kaynak", version: "Sürüm", mokhtasar: "el-Muhtasar fi't-Tefsir", loading: "Anlam yükleniyor", missing: "Anlam yüklenmedi", meccan: "Mekkî", medinan: "Medenî", notes: "Notlar" },
    ku: { showMeaning: "Wateyê nîşan bide", choose: "Wateyê hilbijêre", source: "Çavkanî", version: "Guherto", mokhtasar: "el-Muxtesar fi't-Tefsîr", loading: "Wate tê barkirin", missing: "Wate nehat barkirin", meccan: "Mekkî", medinan: "Medenî", notes: "Têbînî" },
    ckb: { showMeaning: "واتەکە پیشان بدە", choose: "واتە هەڵبژێرە", source: "سەرچاوە", version: "وەشان", mokhtasar: "المختصر في التفسير", loading: "واتەکە دادەبەزێت", missing: "واتە بارنەکرا", meccan: "مەککی", medinan: "مەدەنی", notes: "تێبینی" },
    bs: { showMeaning: "Prikaži značenje", choose: "Odaberi značenje", source: "Izvor", version: "Verzija", mokhtasar: "al-Muhtasar fi t-Tefsiru", loading: "Značenje se učitava", missing: "Značenje nije učitano", meccan: "Mekkanska", medinan: "Medinska", notes: "Napomene" },
    fr: { showMeaning: "Afficher le sens", choose: "Choisir le sens", source: "Source", version: "Version", mokhtasar: "Al-Mukhtasar fi at-Tafsir", loading: "Chargement du sens", missing: "Sens non chargé", meccan: "mecquoise", medinan: "médinoise", notes: "Notes" },
    es: { showMeaning: "Mostrar el sentido", choose: "Elegir el sentido", source: "Fuente", version: "Versión", mokhtasar: "Al-Mujtasar fi at-Tafsir", loading: "Cargando el sentido", missing: "Sentido no cargado", meccan: "mequí", medinan: "mediní", notes: "Notas" },
    ar: { showMeaning: "إظهار المعنى", choose: "اختيار المعنى", source: "المصدر", version: "الإصدار", mokhtasar: "المختصر في التفسير", loading: "جارٍ تحميل المعنى", missing: "لم يُحمَّل المعنى", meccan: "مكية", medinan: "مدنية", notes: "الحواشي" }
  };
  var NAMES = { de: "Deutsch", en: "English", tr: "Türkçe", ku: "Kurmancî", ckb: "سۆرانی", bs: "Bosanski", fr: "Français", es: "Español", ar: "العربية" };
  var BOOK = {
    de: { kicker: "QURʾĀN", bookTitle: "Lesen wie in einem aufgeschlagenen Buch.", bookLead: "Arabischer Text und die Bedeutung liegen direkt vor dir.", listen: "Qurʾān anhören", openPlayer: "Player öffnen", bookView: "Buchansicht", withMeaning: "Arabisch und Bedeutung", translit: "Lautschrift", chooseSurah: "Sūrah auswählen", loadingList: "Sūrah-Verzeichnis wird geladen", opening: "Qurʾān wird geöffnet", pages: "Seiten", back: "Zurück", forward: "Weiter", endSurah: "Ende der Sūrah", loadFailed: "Der Qurʾān konnte gerade nicht geladen werden.", searchHint: "Sūrah, Āyah, zum Beispiel 2:255, oder ein Wort" },
    en: { kicker: "QURʾĀN", bookTitle: "Read it like an open book.", bookLead: "The Arabic text and its meaning are in front of you.", listen: "Listen to the Qurʾān", openPlayer: "Open player", bookView: "Book view", withMeaning: "Arabic and meaning", translit: "Transliteration", chooseSurah: "Choose a surah", loadingList: "Loading the surah list", opening: "Opening the Qurʾān", pages: "Pages", back: "Back", forward: "Next", endSurah: "End of the surah", loadFailed: "The Qurʾān could not be loaded just now.", searchHint: "Surah, ayah, for example 2:255, or a word" },
    tr: { kicker: "QURʾĀN", bookTitle: "Açık bir kitap gibi oku.", bookLead: "Arapça metin ve anlamı önündedir.", listen: "Kur'an'ı dinle", openPlayer: "Oynatıcıyı aç", bookView: "Kitap görünümü", withMeaning: "Arapça ve anlam", translit: "Okunuş", chooseSurah: "Sure seç", loadingList: "Sure listesi yükleniyor", opening: "Kur'an açılıyor", pages: "Sayfalar", back: "Geri", forward: "İleri", endSurah: "Surenin sonu", loadFailed: "Kur'an şu anda yüklenemedi.", searchHint: "Sure, ayet, örneğin 2:255, veya bir kelime" },
    ku: { kicker: "QURʾĀN", bookTitle: "Wekî pirtûkeke vekirî bixwîne.", bookLead: "Nivîsa erebî û wateya wê li ber te ne.", listen: "Qurʾānê guhdarî bike", openPlayer: "Lêderê veke", bookView: "Dîtina pirtûkê", withMeaning: "Erebî û wate", translit: "Dengnivîs", chooseSurah: "Sûre hilbijêre", loadingList: "Lîsteya sûreyan tê barkirin", opening: "Qurʾān tê vekirin", pages: "Rûpel", back: "Vegere", forward: "Pêş", endSurah: "Dawiya sûreyê", loadFailed: "Qurʾān niha nehat barkirin.", searchHint: "Sûre, ayet, mînak 2:255, an peyvek" },
    ckb: { kicker: "QURʾĀN", bookTitle: "وەک کتێبێکی کراوە بیخوێنەوە.", bookLead: "دەقی عەرەبی و واتەکەی لەبەردەم تۆدان.", listen: "گوێ لە قورئان بگرە", openPlayer: "لێدەر بکەرەوە", bookView: "دیمەنی کتێب", withMeaning: "عەرەبی و واتە", translit: "خۆێندنەوە", chooseSurah: "سورەت هەڵبژێرە", loadingList: "لیستی سورەتەکان دادەبەزێت", opening: "قورئان دەکرێتەوە", pages: "لاپەڕە", back: "گەڕانەوە", forward: "دواتر", endSurah: "کۆتایی سورەت", loadFailed: "قورئان ئێستا بارنەکرا.", searchHint: "سورەت، ئایەت، بۆ نموونە 2:255، یان وشەیەک" },
    bs: { kicker: "QURʾĀN", bookTitle: "Čitaj kao otvorenu knjigu.", bookLead: "Arapski tekst i njegovo značenje su pred tobom.", listen: "Slušaj Kur'an", openPlayer: "Otvori plejer", bookView: "Prikaz knjige", withMeaning: "Arapski i značenje", translit: "Transkripcija", chooseSurah: "Odaberi suru", loadingList: "Spisak sura se učitava", opening: "Kur'an se otvara", pages: "Stranice", back: "Nazad", forward: "Dalje", endSurah: "Kraj sure", loadFailed: "Kur'an se sada nije mogao učitati.", searchHint: "Sura, ajet, na primjer 2:255, ili riječ" },
    fr: { kicker: "QURʾĀN", bookTitle: "Lire comme un livre ouvert.", bookLead: "Le texte arabe et son sens sont devant toi.", listen: "Écouter le Qurʾān", openPlayer: "Ouvrir le lecteur", bookView: "Vue livre", withMeaning: "Arabe et sens", translit: "Translittération", chooseSurah: "Choisir une sourate", loadingList: "Chargement de la liste", opening: "Ouverture du Qurʾān", pages: "Pages", back: "Retour", forward: "Suivant", endSurah: "Fin de la sourate", loadFailed: "Le Qurʾān n’a pas pu être chargé.", searchHint: "Sourate, verset, par exemple 2:255, ou un mot" },
    es: { kicker: "QURʾĀN", bookTitle: "Léelo como un libro abierto.", bookLead: "El texto árabe y su sentido están delante de ti.", listen: "Escuchar el Qurʾān", openPlayer: "Abrir el reproductor", bookView: "Vista de libro", withMeaning: "Árabe y sentido", translit: "Transliteración", chooseSurah: "Elegir una sura", loadingList: "Cargando la lista", opening: "Abriendo el Qurʾān", pages: "Páginas", back: "Atrás", forward: "Siguiente", endSurah: "Fin de la sura", loadFailed: "El Qurʾān no se pudo cargar ahora.", searchHint: "Sura, aleya, por ejemplo 2:255, o una palabra" },
    ar: { kicker: "QURʾĀN", bookTitle: "اقرأها ككتاب مفتوح.", bookLead: "النص العربي ومعناه أمامك.", listen: "استماع القرآن", openPlayer: "فتح المشغّل", bookView: "عرض الكتاب", withMeaning: "العربية والمعنى", translit: "النقحرة", chooseSurah: "اختيار السورة", loadingList: "جارٍ تحميل الفهرس", opening: "جارٍ فتح القرآن", pages: "الصفحات", back: "رجوع", forward: "التالي", endSurah: "نهاية السورة", loadFailed: "تعذّر تحميل القرآن الآن.", searchHint: "سورة، آية، مثل 2:255، أو كلمة" }
  };
  var catalog = null;
  var catalogJob = null;
  var packs = new Object(null);
  var jobs = new Object(null);
  var searchRefresh = new Object(null);

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function known(code) {
    return LOCALES.indexOf(code) >= 0 ? code : "";
  }
  function appLocale() {
    try {
      var params = new URLSearchParams(global.location.search || "");
      var query = known(String(params.get("lang") || params.get("locale") || "").toLowerCase());
      if (query) return query;
    } catch (error) {}
    try {
      var stored = known(String(global.localStorage.getItem(APP_KEY) || "").toLowerCase());
      if (stored) return stored;
    } catch (error2) {}
    return "de";
  }
  function meaningLocale() {
    try {
      var pick = known(String(global.localStorage.getItem(PICK_KEY) || "").toLowerCase());
      if (pick) return pick;
    } catch (error) {}
    return appLocale();
  }
  function ui(key) {
    var code = appLocale();
    var pack = UI[code] || UI.de;
    var book = BOOK[code] || BOOK.en;
    return pack[key] || book[key] || UI.en[key] || BOOK.en[key] || "";
  }
  function pad(id) {
    var n = Number(id);
    return (n < 10 ? "00" : n < 100 ? "0" : "") + n;
  }
  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    if (catalogJob) return catalogJob;
    catalogJob = fetch("/content/quran-i18n/catalog.json", { cache: "force-cache" })
      .then(function (response) { if (!response.ok) throw new Error("catalog"); return response.json(); })
      .then(function (json) { catalog = json; return json; })
      .catch(function (error) { catalogJob = null; throw error; });
    return catalogJob;
  }
  function cacheKey(locale, layer, surah) {
    return locale + ":" + layer + ":" + Number(surah);
  }
  function fetchPack(locale, layer, surah) {
    var key = cacheKey(locale, layer, surah);
    if (packs[key]) return Promise.resolve(packs[key]);
    if (jobs[key]) return jobs[key];
    var url = "/content/quran-i18n/" + locale + (layer === "mokhtasar" ? "/mokhtasar/" : "/") + pad(surah) + ".json";
    jobs[key] = fetch(url, { cache: "force-cache" })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (json) { packs[key] = json; return json; })
      .catch(function () { return null; })
      .finally(function () { delete jobs[key]; });
    return jobs[key];
  }
  function ensure(surah) {
    var locale = meaningLocale();
    return loadCatalog().then(function (book) {
      var entry = book && book.locales && book.locales[locale];
      if (!entry) return null;
      var primary = fetchPack(locale, "primary", surah);
      var second = entry.mokhtasar ? fetchPack(locale, "mokhtasar", surah) : Promise.resolve(null);
      return Promise.all([primary, second]);
    }).catch(function () { return null; });
  }
  function packFor(locale, layer, surah) {
    return packs[cacheKey(locale, layer, surah)] || null;
  }
  function verseRow(doc, aya) {
    if (!doc || !Array.isArray(doc.verses)) return null;
    var n = Number(aya);
    for (var i = 0; i < doc.verses.length; i += 1) {
      if (Number(doc.verses[i].aya) === n) return doc.verses[i];
    }
    return null;
  }
  function entry() {
    if (!catalog || !catalog.locales) return null;
    return catalog.locales[meaningLocale()] || null;
  }
  function attribution(meta) {
    if (!meta) return "";
    var line = meta.title + " · " + meta.publisher + " · " + ui("source") + ": QuranEnc.com";
    if (meta.version) line += " · " + ui("version") + " " + meta.version;
    return line;
  }
  function block(row, direction) {
    if (!row) return "";
    var notes = typeof row.footnotes === "string" && row.footnotes ? '<div class="quran-meaning-notes">' + esc(row.footnotes) + "</div>" : "";
    return '<div class="quran-meaning" dir="' + (direction === "rtl" ? "rtl" : "ltr") + '" data-dar-no-translate="quran-meaning">' + esc(row.text) + notes + "</div>";
  }
  function verseHtml(surahId, verse) {
    var locale = meaningLocale();
    var meta = entry();
    var aya = verse && (verse.id || verse.aya);
    var primary = verseRow(packFor(locale, "primary", surahId), aya);
    if (!primary) {
      ensure(surahId);
      return '<span class="quran-meaning-pending">' + esc(ui("loading")) + "</span>";
    }
    var html = block(primary, meta && meta.direction);
    var secondMeta = meta && meta.mokhtasar;
    var second = secondMeta ? verseRow(packFor(locale, "mokhtasar", surahId), aya) : null;
    if (second) {
      html += '<details class="quran-mokhtasar"><summary>' + esc(ui("mokhtasar")) + '</summary>' + block(second, secondMeta.direction) + '<p class="quran-meaning-credit">' + esc(attribution(secondMeta)) + "</p></details>";
    }
    return html;
  }
  function pickerHtml() {
    var current = meaningLocale();
    var explicit = "";
    try { explicit = known(String(global.localStorage.getItem(PICK_KEY) || "").toLowerCase()); } catch (error) {}
    var options = LOCALES.map(function (code) {
      return '<option value="' + code + '"' + (code === current ? " selected" : "") + ">" + esc(NAMES[code]) + "</option>";
    }).join("");
    return '<label class="quran-meaning-picker"><span>' + esc(ui("choose")) + '</span><select data-quran-meaning-locale aria-label="' + esc(ui("choose")) + '">' + options + "</select></label>" +
      '<p class="quran-meaning-credit" data-quran-meaning-credit>' + esc(attribution(entry())) + "</p>" +
      (explicit ? "" : "");
  }
  function bannerHtml() {
    var meta = entry();
    if (!meta) return "";
    return '<p class="quran-meaning-banner" data-dar-no-translate="quran-meaning">' + esc(attribution(meta)) + "</p>";
  }
  function searchText(result) {
    var locale = meaningLocale();
    var surah = result && result.surahId;
    var row = verseRow(packFor(locale, "primary", surah), result && result.ayah);
    if (row) return row.text;
    var stamp = locale + ":" + surah;
    if (surah && !searchRefresh[stamp]) {
      searchRefresh[stamp] = true;
      ensure(surah).then(function () {
        if (typeof global.render === "function") global.render();
      }).catch(function () {});
    }
    return ui("loading");
  }
  function currentSurah() {
    try {
      var hash = String(global.location.hash || "").replace(/^#/, "");
      var parts = hash.split("/").filter(Boolean);
      if (parts[0] === "quran" && parts[1]) return Number(parts[1]);
    } catch (error) {}
    return 0;
  }
  function rerender() {
    var surah = currentSurah();
    var job = surah ? ensure(surah) : Promise.resolve();
    job.then(function () {
      if (typeof global.render === "function") global.render();
    }).catch(function () {});
  }
  function bind() {
    if (!global.document || global.document.__darQuranMeaningBound) return;
    global.document.__darQuranMeaningBound = true;
    global.document.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || !target.getAttribute || target.getAttribute("data-quran-meaning-locale") == null) return;
      var next = known(String(target.value || "").toLowerCase());
      try {
        if (!next || next === appLocale()) global.localStorage.removeItem(PICK_KEY);
        else global.localStorage.setItem(PICK_KEY, next);
      } catch (error) {}
      rerender();
    });
    global.addEventListener("dar-adult-locale-changed", function () {
      try {
        if (known(String(global.localStorage.getItem(PICK_KEY) || ""))) return;
      } catch (error) {}
      rerender();
    });
  }
  function installStyle() {
    if (!global.document || global.document.getElementById("quran-meaning-i18n-style")) return;
    var style = global.document.createElement("style");
    style.id = "quran-meaning-i18n-style";
    style.textContent = ".quran-meaning{margin-top:6px;line-height:1.65}.quran-meaning[dir=rtl]{text-align:right;font-family:\"Noto Naskh Arabic\",\"Scheherazade New\",serif}.quran-meaning-notes{margin-top:4px;font-size:.86em;opacity:.82}.quran-meaning-banner,.quran-meaning-credit{margin:6px 0 10px;font-size:12px;line-height:1.45;opacity:.84}.quran-meaning-picker{display:flex;flex-direction:column;gap:6px;margin:4px 0 8px}.quran-meaning-picker select{min-height:40px;border-radius:12px;padding:6px 8px}.quran-mokhtasar{margin-top:8px}.quran-mokhtasar summary{cursor:pointer;font-weight:700}";
    global.document.head.appendChild(style);
  }

  global.darQuranUi = ui;
  global.darQuranMeaningLocale = meaningLocale;
  global.darQuranAppLocale = appLocale;
  global.darQuranMeaningEnsure = ensure;
  global.darQuranMeaningVerseHtml = verseHtml;
  global.darQuranMeaningPickerHtml = pickerHtml;
  global.darQuranMeaningAttributionHtml = function () { return esc(attribution(entry())); };
  global.darQuranMeaningBannerHtml = bannerHtml;
  global.darQuranMeaningSearchText = searchText;
  global.DARQuranMeaning = {
    ui: UI,
    locales: LOCALES,
    attribution: attribution,
    verseRow: verseRow,
    loadCatalog: loadCatalog,
    packFor: packFor,
    setCatalogForTest: function (value) { catalog = value; }
  };
  if (global.document) {
    if (global.document.readyState === "loading") global.document.addEventListener("DOMContentLoaded", function () { installStyle(); bind(); loadCatalog().catch(function () {}); });
    else { installStyle(); bind(); loadCatalog().catch(function () {}); }
  }
})(typeof window !== "undefined" ? window : globalThis);
