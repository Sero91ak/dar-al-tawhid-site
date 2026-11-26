/* DAR_HADITH_OPEN_CORPUS_V1
 * Arabic: data/hadith/open/sahih-al-bukhari/ (see SOURCE.md and hadith-open-corpus-source.md).
 * One kitāb file is fetched when that kitāb is opened. The 8 MB edition is not one bundle.
 */
(function (w) {
  "use strict";
  var BASE = "/data/hadith/open/sahih-al-bukhari";
  var WORK = "sahih-al-buhari";
  var LANGS = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
  var toc = null;
  var numbers = null;
  var tocWait = null;
  var kits = {};
  var kitWait = {};
  var shellById = {};
  var shellByNumber = {};
  var PENDING = {
    de: "Eine geprüfte Übersetzung dieses Ḥadīṯ ist noch nicht hinterlegt. Angezeigt wird der arabische Wortlaut.",
    ar: "الترجمة المفحوصة لهذا الحديث غير مودعة بعد. المعروض هو اللفظ العربي.",
    en: "A checked translation of this ḥadīth is not stored yet. The Arabic wording is shown.",
    tr: "Bu hadisin incelenmiş çevirisi henüz kayıtlı değil. Arapça lafız gösterilir.",
    ku: "Wergera kontrolkirî ya vê hedîsê hîn nehatiye tomarkirin. Gotina erebî tê nîşandan.",
    ckb: "وەرگێڕانی پشکنراوی ئەم حەدیسە هێشتا تۆمار نەکراوە. دەقی عەرەبی پیشان دەدرێت.",
    bs: "Provjerena prijevod ovog hadisa još nije pohranjen. Prikazan je arapski tekst.",
    fr: "Une traduction vérifiée de ce ḥadīth n’est pas encore déposée. Le texte arabe est affiché.",
    es: "Una traducción revisada de este ḥadīṯ aún no está guardada. Se muestra el texto árabe."
  };
  var FALLBACK = {
    de: "KI-Übersetzung.",
    ar: "ترجمة بالذكاء الاصطناعي.",
    en: "AI translation.",
    tr: "Yapay zekâ çevirisi.",
    ku: "Wergera jîrekê çêkirî.",
    ckb: "وەرگێڕانی زیرەکی دەستکرد.",
    bs: "Prijevod umjetne inteligencije.",
    fr: "Traduction par IA.",
    es: "Traducción de IA."
  };
  var SHOWN_DE = {
    de: "KI-Übersetzung.",
    ar: "الترجمة الألمانية بالذكاء الاصطناعي، لأن هذه اللغة لم تُودَع بعد.",
    en: "AI translation. German is shown because this language is not stored yet.",
    tr: "Yapay zekâ çevirisi. Bu dil henüz kayıtlı olmadığı için Almanca gösterilir.",
    ku: "Wergera jîrekê çêkirî. Ji ber ku ev ziman hîn nehatiye tomarkirin, Almanî tê nîşandan.",
    ckb: "وەرگێڕانی زیرەکی دەستکرد. چونکە ئەم زمانە هێشتا تۆمار نەکراوە، ئەڵمانی پیشان دەدرێت.",
    bs: "Prijevod umjetne inteligencije. Njemački se prikazuje jer ovaj jezik još nije pohranjen.",
    fr: "Traduction par IA. L’allemand est affiché, car cette langue n’est pas encore déposée.",
    es: "Traducción de IA. Se muestra el alemán porque este idioma aún no está guardado."
  };

  function lang(loc) {
    return LANGS.indexOf(loc) >= 0 ? loc : "de";
  }
  function loadJson(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    });
  }
  function ensureToc() {
    if (toc) return Promise.resolve(toc);
    if (tocWait) return tocWait;
    tocWait = Promise.all([
      loadJson(BASE + "/toc.json"),
      loadJson(BASE + "/numbers.json")
    ]).then(function (pair) {
      toc = pair[0];
      numbers = pair[1] || {};
      tocWait = null;
      return toc;
    }, function (err) {
      tocWait = null;
      throw err;
    });
    return tocWait;
  }
  function rememberShell(collection) {
    if (collection.__openRemembered) return;
    function take(h) {
      if (!h || !h.id) return;
      shellById[String(h.id)] = h;
      var n = String(h.hadithNumber || "").trim();
      if (n && !shellByNumber[n]) shellByNumber[n] = h;
    }
    (collection.chapters || []).forEach(function (chapter) {
      if (chapter.corpusNo != null) return;
      (chapter.hadiths || []).forEach(take);
      (chapter.babs || []).forEach(function (bab) { (bab.hadiths || []).forEach(take); });
    });
    collection.__openRemembered = true;
  }
  function rowRecord(kitab, row, loc) {
    var code = lang(loc);
    var bag = (row.i18n && (row.i18n[code] || null)) || null;
    var german = bag && bag.matn ? bag.matn : "";
    var sharh = bag && bag.sharh ? bag.sharh : "";
    var mark = "";
    var pending = false;
    if (!german && code !== "ar") {
      var deBag = row.i18n && row.i18n.de;
      if (deBag && deBag.matn) {
        german = deBag.matn;
        sharh = sharh || deBag.sharh || "";
        mark = SHOWN_DE[code] || SHOWN_DE.de;
      } else {
        german = PENDING[code] || PENDING.de;
        pending = true;
      }
    } else if (german) {
      mark = FALLBACK[code] || FALLBACK.de;
    }
    var titles = kitab.titles || {};
    var chapterTitle = titles[code] || titles.de || "";
    return {
      id: "OBK-" + row.n,
      corpus: true,
      shellNumber: row.n,
      bookId: WORK,
      bookTitle: "Ṣaḥīḥ al-Buḫārī",
      chapterId: kitab.id,
      chapterTitle: chapterTitle,
      babId: "",
      babTitle: "",
      hadithNumber: String(row.n),
      arabic: row.ar || "",
      german: german,
      germanHtml: "",
      narrator: "",
      speakerLabel: "",
      source: "Ṣaḥīḥ al-Buḫārī, Nr. " + row.n + ". Arabisch: ara-bukhari, fawazahmed0/hadith-api.",
      grade: "",
      sharhStatus: "",
      sharhText: "",
      sharhScholar: "",
      sharhBook: "",
      sharhReference: "",
      kiSharh: pending ? "" : sharh,
      kiMark: mark,
      kiPending: pending,
      textNote: row.textNote || ""
    };
  }
  function materialize(kitab, loc) {
    return (kitab.hadiths || []).map(function (row) {
      return rowRecord(kitab, row, loc);
    });
  }
  function apply(book, collection, loc) {
    if (!book || String(book.id) !== WORK || !collection) return;
    if (!toc) {
      ensureToc().then(function () {
        if (typeof w.render === "function") w.render();
      }, function () {});
      return;
    }
    rememberShell(collection);
    var code = lang(loc);
    book.hadithCount = toc.hadithCount || book.hadithCount;
    collection.chapters = (toc.kitab || []).map(function (k) {
      var cached = kits[k.no];
      var titles = k.titles || {};
      return {
        id: k.id,
        title: titles[code] || titles.de || k.sourceTitle || "",
        faceArabic: titles.ar || "",
        corpusNo: k.no,
        corpusCount: k.count,
        corpusOrder: k.loose ? 100000 : k.no,
        corpusLoose: !!k.loose,
        hadiths: cached ? materialize(cached, code) : []
      };
    });
    collection.__corpusLoc = code;
  }
  function ensure(no) {
    var key = String(no);
    if (kits[key] || kits[Number(key)]) return Promise.resolve(kits[key] || kits[Number(key)]);
    if (kitWait[key]) return kitWait[key];
    var id = "k-" + (Number(key) < 10 ? "0" + Number(key) : String(Number(key)));
    kitWait[key] = loadJson(BASE + "/kitab/" + id + ".json").then(function (data) {
      kits[Number(key)] = data;
      delete kitWait[key];
      return data;
    }, function (err) {
      delete kitWait[key];
      throw err;
    });
    return kitWait[key];
  }
  function recordById(id, loc) {
    var want = String(id || "");
    var keys = Object.keys(kits);
    var i, rows, j, rec, shell;
    for (i = 0; i < keys.length; i++) {
      rows = materialize(kits[keys[i]], lang(loc));
      for (j = 0; j < rows.length; j++) {
        rec = rows[j];
        if (rec.id === want || "OBK-" + rec.hadithNumber === want) return rec;
      }
    }
    return null;
  }
  function kitabNoForNumber(n) {
    if (!numbers) return null;
    var book = numbers[String(n)];
    return book === undefined ? null : book;
  }
  w.DARHadithOpenCorpus = {
    workId: WORK,
    apply: apply,
    ensure: ensure,
    ensureToc: ensureToc,
    recordById: recordById,
    shellRecord: function (id) { return shellById[String(id || "")] || null; },
    shellForNumber: function (n) { return shellByNumber[String(n || "")] || null; },
    kitabNoForNumber: kitabNoForNumber
  };
})(window);
