/* DAR_HADITH_OPEN_CORPUS_V1
 * Arabic: data/hadith/open/sahih-al-bukhari/ (see SOURCE.md and hadith-open-corpus-source.md).
 * Kitāb → Bāb → Ḥadīṯ. One kitāb file is fetched when that kitāb is opened, and only the
 * translation package of the current language (i18n/k-NN/<lang>.json, plus German as fallback).
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
  var packs = {};
  var packWait = {};
  var lastLoc = "de";
  var OPENING = {
    de: "Zu Beginn des Kitāb", ar: "", en: "Opening of the kitāb", tr: "Kitabın başı",
    ku: "Destpêka kitêbê", ckb: "سەرەتای کتێب", bs: "Početak kitaba", fr: "Ouverture du kitāb", es: "Apertura del kitāb"
  };
  var UNTITLED = {
    de: "Ohne Überschrift", ar: "باب", en: "Untitled", tr: "Başlıksız",
    ku: "Bê sernav", ckb: "بێ ناونیشان", bs: "Bez naslova", fr: "Sans titre", es: "Sin título"
  };
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
  function packOf(kitab, code) {
    var p = packs[String(kitab.kitabNo) + ":" + code];
    return p || null;
  }
  function rowBag(kitab, row, code) {
    var p = packOf(kitab, code);
    return (p && p.hadiths && p.hadiths[String(row.n)]) || null;
  }
  function babTitle(kitab, bab, code) {
    var p = packOf(kitab, code);
    var own = p && p.babs && p.babs[String(bab.n)];
    if (own) return own;
    if (bab.opening) return code === "ar" ? (kitab.sourceTitle || "") : (OPENING[code] || OPENING.de);
    var ar = String(bab.ar || "").trim();
    if (!ar || /^باب\s*:?$/.test(ar)) return UNTITLED[code] || UNTITLED.de;
    return ar;
  }
  function rowRecord(kitab, row, loc, bab) {
    var code = lang(loc);
    var bag = rowBag(kitab, row, code);
    var german = bag && bag.matn ? bag.matn : "";
    var sharh = bag && bag.sharh ? bag.sharh : "";
    var mark = "";
    var pending = false;
    if (!german && code !== "ar") {
      var deBag = rowBag(kitab, row, "de");
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
      babId: bab ? bab.id : "",
      babTitle: bab ? babTitle(kitab, bab, code) : "",
      babArabic: bab && !bab.opening ? String(bab.ar || "") : "",
      hadithNumber: String(row.n),
      arabic: row.ar || "",
      german: german,
      germanHtml: "",
      narrator: "",
      speakerLabel: "",
      source: "Ṣaḥīḥ al-Buḫārī, Nr. " + row.n + (row.crossCheck ? ". Arabisch: ara-bukhari, fawazahmed0/hadith-api (Gegenquelle)." : ". Arabisch: open-hadith-data (samt-qa), CC BY 4.0, Sulṭāniyya-Ausgabe."),
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
    var out = [];
    (kitab.babs || []).forEach(function (bab) {
      (bab.hadiths || []).forEach(function (row) { out.push(rowRecord(kitab, row, loc, bab)); });
    });
    return out;
  }
  function materializeBabs(kitab, loc) {
    var code = lang(loc);
    return (kitab.babs || []).map(function (bab) {
      return {
        id: bab.id,
        title: babTitle(kitab, bab, code),
        faceArabic: bab.opening ? "" : String(bab.ar || ""),
        hadiths: (bab.hadiths || []).map(function (row) { return rowRecord(kitab, row, code, bab); })
      };
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
    lastLoc = code;
    book.hadithCount = toc.hadithCount || book.hadithCount;
    collection.chapters = (toc.kitab || []).map(function (k) {
      var cached = kits[k.no];
      var titles = k.titles || {};
      var babs = cached ? materializeBabs(cached, code) : [];
      if (cached && !packs[String(k.no) + ":" + code] && !packWait[String(k.no) + ":" + code]) {
        ensurePack(k.no, code).then(function () { if (typeof w.render === "function") w.render(); }, function () {});
      }
      return {
        id: k.id,
        title: titles[code] || titles.de || k.sourceTitle || "",
        faceArabic: titles.ar || "",
        corpusNo: k.no,
        corpusCount: k.count,
        corpusOrder: k.loose ? 100000 : k.no,
        corpusLoose: !!k.loose,
        corpusBabCount: k.babCount || 0,
        babs: babs,
        hadiths: babs.reduce(function (all, bab) { return all.concat(bab.hadiths); }, [])
      };
    });
    collection.__corpusLoc = code;
  }
  function kid(no) {
    return "k-" + (Number(no) < 10 ? "0" + Number(no) : String(Number(no)));
  }
  function ensurePack(no, code) {
    var key = String(Number(no)) + ":" + code;
    if (packs[key]) return Promise.resolve(packs[key]);
    if (code === "ar") { packs[key] = {}; return Promise.resolve(packs[key]); }
    if (packWait[key]) return packWait[key];
    packWait[key] = loadJson(BASE + "/i18n/" + kid(no) + "/" + code + ".json").then(function (data) {
      packs[key] = data || {};
      delete packWait[key];
      return packs[key];
    }, function () {
      packs[key] = {};
      delete packWait[key];
      return packs[key];
    });
    return packWait[key];
  }
  function ensure(no) {
    var key = String(Number(no));
    var code = lang(lastLoc);
    var langs = code === "de" ? ["de"] : [code, "de"];
    if (kits[key] && langs.every(function (c) { return packs[key + ":" + c]; })) return Promise.resolve(kits[key]);
    if (kitWait[key]) return kitWait[key];
    kitWait[key] = Promise.all([loadJson(BASE + "/kitab/" + kid(key) + ".json")].concat(langs.map(function (c) { return ensurePack(key, c); }))).then(function (all) {
      kits[key] = all[0];
      delete kitWait[key];
      return all[0];
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
