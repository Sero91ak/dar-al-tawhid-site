(function () {
  "use strict";

  var FIQH_URL = "/test/data/frauen-fiqh.json";
  var SAHAB_URL = "/test/data/frauen-sahabiyyat.json";
  var TABII_URL = "/test/data/frauen-tabiiyyat.json";
  var MUETTER_URL = "/test/data/frauen-muetter-der-glaeubigen.json";
  var MUETTER_SLUG = "muetter-der-glaeubigen";
  var EHE_URL = "/test/data/frauen-ehe-familie.json";
  var EHE_SLUG = "ehe-familie";
  var HIJAB_URL = "/test/data/frauen-hijab-schamhaftigkeit.json";
  var HIJAB_SLUG = "hijab-schamhaftigkeit";
  var WISSEN_URL = "/test/data/frauen-wissen-lernen.json";
  var WISSEN_SLUG = "wissen-lernen";
  var ERLAUBTE_QUELLENART = {
    quran: 1,
    sahih: 1,
    hasan: 1,
    "zuverlaessiger-athar": 1
  };

  var FIQH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "grundlagen", label: "Grundlagen" },
    { id: "reinigung", label: "Reinigung" },
    { id: "gebet", label: "Gebet" },
    { id: "fasten", label: "Fasten" },
    { id: "hidschab", label: "Ḥidschāb" },
    { id: "heirat", label: "Heirat" }
  ];
  var SAHAB_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "muetter-der-glaubigen", label: "Mütter der Gläubigen" },
    { id: "wissen", label: "Wissen" },
    { id: "standhaftigkeit", label: "Standhaftigkeit" },
    { id: "geduld", label: "Geduld" },
    { id: "mut", label: "Mut" },
    { id: "ehe-familie", label: "Ehe & Familie" },
    { id: "adab", label: "Adab" },
    { id: "ueberlieferung", label: "Überlieferung" },
    { id: "fiqh-bezug", label: "Fiqh-Bezug" }
  ];
  var FIQH_BEREICH_LABEL = {
    grundlagen: "Grundlagen",
    reinigung: "Reinigung",
    gebet: "Gebet",
    fasten: "Fasten",
    "hijab-schamhaftigkeit": "Ḥidschāb",
    "ehe-familie": "Heirat",
    "moschee-gemeinschaft": "Gebet",
    "hajj-umrah": "Ḥajj",
    "fragen-antworten": "Grundlagen",
    "kleidung-im-gebet": "Gebet"
  };
  var FIQH_BEREICH_CHIP = {
    grundlagen: "grundlagen",
    reinigung: "reinigung",
    gebet: "gebet",
    fasten: "fasten",
    "hijab-schamhaftigkeit": "hidschab",
    "ehe-familie": "heirat",
    "moschee-gemeinschaft": "gebet",
    "hajj-umrah": "gebet",
    "fragen-antworten": "grundlagen",
    "kleidung-im-gebet": "gebet"
  };
  var SAHAB_BEREICH_LABEL = {
    "muetter-der-glaubigen": "Mütter der Gläubigen",
    wissen: "Wissen",
    standhaftigkeit: "Standhaftigkeit",
    geduld: "Geduld",
    "ehe-familie": "Ehe & Familie",
    mut: "Mut",
    adab: "Adab",
    ueberlieferung: "Überlieferung",
    "fiqh-bezug": "Fiqh-Bezug"
  };
  var TABII_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "wissen", label: "Wissen" },
    { id: "ibadah", label: "ʿIbādah" },
    { id: "zuhd", label: "Zuhd" },
    { id: "adab", label: "Adab" },
    { id: "geduld", label: "Geduld" },
    { id: "ueberlieferung", label: "Überlieferung" },
    { id: "familie", label: "Familie" },
    { id: "erziehung", label: "Erziehung" },
    { id: "historisch-in-pruefung", label: "Historisch in Prüfung" }
  ];
  var TABII_BEREICH_LABEL = {
    wissen: "Wissen",
    ibadah: "ʿIbādah",
    zuhd: "Zuhd",
    adab: "Adab",
    geduld: "Geduld",
    ueberlieferung: "Überlieferung",
    familie: "Familie",
    erziehung: "Erziehung",
    "historisch-in-pruefung": "Historisch in Prüfung"
  };
  var MUETTER_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "grundlage", label: "Grundlage" },
    { id: "vorzueglichkeit", label: "Vorzüglichkeit" },
    { id: "wissen", label: "Wissen" },
    { id: "beratung", label: "Beratung" },
    { id: "quran", label: "Qurʾān" },
    { id: "sadaqah", label: "Ṣadaqah" },
    { id: "adab", label: "Adab" },
    { id: "familie", label: "Familie" }
  ];
  var MUETTER_BEREICH_LABEL = {
    grundlage: "Grundlage",
    vorzueglichkeit: "Vorzüglichkeit",
    wissen: "Wissen",
    beratung: "Beratung",
    quran: "Qurʾān",
    sadaqah: "Ṣadaqah",
    adab: "Adab",
    familie: "Familie"
  };
  var EHE_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "guter-umgang", label: "Guter Umgang" },
    { id: "rechte", label: "Rechte" },
    { id: "verantwortung", label: "Verantwortung" },
    { id: "geduld", label: "Geduld" },
    { id: "familie", label: "Familie" },
    { id: "kinder", label: "Kinder" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var EHE_BEREICH_LABEL = {
    "guter-umgang": "Guter Umgang",
    rechte: "Rechte",
    verantwortung: "Verantwortung",
    geduld: "Geduld",
    familie: "Familie",
    kinder: "Kinder",
    grundlage: "Grundlage",
    "in-pruefung": "In Prüfung"
  };
  var HIJAB_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "quranische-grundlage", label: "Qurʾānische Grundlage" },
    { id: "khimar", label: "Khimār" },
    { id: "jilbab", label: "Ǧilbāb" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "adab", label: "Adab" },
    { id: "bedeckung", label: "Bedeckung" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var HIJAB_BEREICH_LABEL = {
    "quranische-grundlage": "Qurʾānische Grundlage",
    khimar: "Khimār",
    jilbab: "Ǧilbāb",
    schamhaftigkeit: "Schamhaftigkeit",
    adab: "Adab",
    bedeckung: "Bedeckung",
    "in-pruefung": "In Prüfung"
  };
  var WISSEN_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "lernen", label: "Lernen" },
    { id: "fragen-stellen", label: "Fragen stellen" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "fiqh-verstehen", label: "Fiqh verstehen" },
    { id: "wissen-weitergeben", label: "Wissen weitergeben" },
    { id: "adab", label: "Adab" },
    { id: "frauen-der-ersten-generation", label: "Frauen der ersten Generation" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var WISSEN_BEREICH_LABEL = {
    lernen: "Lernen",
    "fragen-stellen": "Fragen stellen",
    schamhaftigkeit: "Schamhaftigkeit",
    "fiqh-verstehen": "Fiqh verstehen",
    "wissen-weitergeben": "Wissen weitergeben",
    adab: "Adab",
    "frauen-der-ersten-generation": "Frauen der ersten Generation",
    "in-pruefung": "In Prüfung"
  };

  var fiqhCache = null;
  var sahabCache = null;
  var tabiiCache = null;
  var muetterCache = null;
  var eheCache = null;
  var hijabCache = null;
  var wissenCache = null;
  var loadPromise = null;
  var fiqhQ = "";
  var sahabQ = "";
  var tabiiQ = "";
  var muetterQ = "";
  var eheQ = "";
  var hijabQ = "";
  var wissenQ = "";
  var fiqhThema = "alle";
  var sahabThema = "alle";
  var tabiiThema = "alle";
  var muetterThema = "alle";
  var eheThema = "alle";
  var hijabThema = "alle";
  var wissenThema = "alle";
  var currentAbschnitt = "hub";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function titelVon(e) {
    return e.titel || e.titel_de || "";
  }

  function vorschauVon(e) {
    return e.kurzvorschau || e.kurzbeschreibung || "";
  }

  function aussageVon(e) {
    return e.vollstaendigeAussage || e.inhalt || "";
  }

  function quellenstatusSicht(e) {
    if (e.quellenart === "quran") return "Geprüft";
    if (e.quellenart === "sahih") return "Geprüft · ṣaḥīḥ";
    if (e.quellenart === "hasan") return "Geprüft · ḥasan";
    if (e.quellenart === "zuverlaessiger-athar") return "Geprüft · zuverlässiger Athar";
    if (e.quellenart === "historischer-bericht" && e.freigabeDurchSerhat)
      return "historischer Bericht – geprüft und freigegeben";
    return "Geprüft";
  }

  function lehreVon(e) {
    return e.lehre || e.nutzen || "";
  }

  function quelleKurz(e) {
    var s = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "");
    if (s.length <= 110) return s;
    return s.slice(0, 108).replace(/\s+\S*$/, "") + "…";
  }

  function hatDirektnachweis(e) {
    return /^https?:\/\//i.test(String(e && e.direktnachweisUrl ? e.direktnachweisUrl : "").trim());
  }

  function hatGenaueQuelle(e) {
    var q = String(e && e.quellenanzeige ? e.quellenanzeige : "").trim();
    if (!q || /^In Prüfung\.?$/i.test(q)) return false;
    return /Quelle:/i.test(q) || /Qur[ʾ']?ān|Ṣaḥīḥ|Sunan|Sūrah|Bukhārī|Muslim/i.test(q);
  }

  function istSichtbar(e) {
    if (!e) return false;
    if (e.quellenstatus !== "geprueft") return false;
    if (!hatGenaueQuelle(e)) return false;
    if (!hatDirektnachweis(e)) return false;
    if (!String(aussageVon(e) || "").trim()) return false;
    if (e.quellenart === "historischer-bericht") return e.freigabeDurchSerhat === true;
    if (!ERLAUBTE_QUELLENART[e.quellenart]) return false;
    return true;
  }

  function sichtbare(eintraege) {
    return (eintraege || []).filter(istSichtbar);
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function load() {
    if (fiqhCache && sahabCache && tabiiCache && muetterCache && eheCache && hijabCache && wissenCache)
      return Promise.resolve();
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([
      fetchJson(FIQH_URL),
      fetchJson(SAHAB_URL),
      fetchJson(TABII_URL),
      fetchJson(MUETTER_URL),
      fetchJson(EHE_URL),
      fetchJson(HIJAB_URL),
      fetchJson(WISSEN_URL)
    ])
      .then(function (pair) {
        fiqhCache = pair[0];
        sahabCache = pair[1];
        tabiiCache = pair[2];
        muetterCache = pair[3];
        eheCache = pair[4];
        hijabCache = pair[5];
        wissenCache = pair[6];
      })
      .catch(function (err) {
        loadPromise = null;
        throw err;
      });
    return loadPromise;
  }

  function parseValue(value) {
    var v = String(value || "").replace(/^\/+|\/+$/g, "");
    if (!v) return { page: "hub", abschnitt: "", kennung: "" };
    if (v === "fiqh") return { page: "list", abschnitt: "fiqh", kennung: "" };
    if (v.indexOf("fiqh/") === 0) return { page: "detail", abschnitt: "fiqh", kennung: v.slice(5) };
    if (v === "sahabiyyat") return { page: "list", abschnitt: "sahabiyyat", kennung: "" };
    if (v.indexOf("sahabiyyat/") === 0) {
      return { page: "detail", abschnitt: "sahabiyyat", kennung: v.slice(11) };
    }
    if (v === "tabiiyyat") return { page: "list", abschnitt: "tabiiyyat", kennung: "" };
    if (v.indexOf("tabiiyyat/") === 0) {
      return { page: "detail", abschnitt: "tabiiyyat", kennung: v.slice(10) };
    }
    if (v === MUETTER_SLUG) return { page: "list", abschnitt: MUETTER_SLUG, kennung: "" };
    if (v.indexOf(MUETTER_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: MUETTER_SLUG, kennung: v.slice(MUETTER_SLUG.length + 1) };
    }
    if (v === EHE_SLUG) return { page: "list", abschnitt: EHE_SLUG, kennung: "" };
    if (v.indexOf(EHE_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: EHE_SLUG, kennung: v.slice(EHE_SLUG.length + 1) };
    }
    if (v === HIJAB_SLUG) return { page: "list", abschnitt: HIJAB_SLUG, kennung: "" };
    if (v.indexOf(HIJAB_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: HIJAB_SLUG, kennung: v.slice(HIJAB_SLUG.length + 1) };
    }
    if (v === WISSEN_SLUG) return { page: "list", abschnitt: WISSEN_SLUG, kennung: "" };
    if (v.indexOf(WISSEN_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: WISSEN_SLUG, kennung: v.slice(WISSEN_SLUG.length + 1) };
    }
    return { page: "hub", abschnitt: "", kennung: "" };
  }

  function cacheFor(abschnitt) {
    if (abschnitt === "sahabiyyat") return sahabCache;
    if (abschnitt === "tabiiyyat") return tabiiCache;
    if (abschnitt === MUETTER_SLUG) return muetterCache;
    if (abschnitt === EHE_SLUG) return eheCache;
    if (abschnitt === HIJAB_SLUG) return hijabCache;
    if (abschnitt === WISSEN_SLUG) return wissenCache;
    return fiqhCache;
  }

  function currentThema(abschnitt) {
    if (abschnitt === "sahabiyyat") return sahabThema;
    if (abschnitt === "tabiiyyat") return tabiiThema;
    if (abschnitt === MUETTER_SLUG) return muetterThema;
    if (abschnitt === EHE_SLUG) return eheThema;
    if (abschnitt === HIJAB_SLUG) return hijabThema;
    if (abschnitt === WISSEN_SLUG) return wissenThema;
    return fiqhThema;
  }

  function setThema(abschnitt, id) {
    if (abschnitt === "sahabiyyat") sahabThema = id;
    else if (abschnitt === "tabiiyyat") tabiiThema = id;
    else if (abschnitt === MUETTER_SLUG) muetterThema = id;
    else if (abschnitt === EHE_SLUG) eheThema = id;
    else if (abschnitt === HIJAB_SLUG) hijabThema = id;
    else if (abschnitt === WISSEN_SLUG) wissenThema = id;
    else fiqhThema = id;
  }

  function currentQ(abschnitt) {
    if (abschnitt === "sahabiyyat") return sahabQ;
    if (abschnitt === "tabiiyyat") return tabiiQ;
    if (abschnitt === MUETTER_SLUG) return muetterQ;
    if (abschnitt === EHE_SLUG) return eheQ;
    if (abschnitt === HIJAB_SLUG) return hijabQ;
    if (abschnitt === WISSEN_SLUG) return wissenQ;
    return fiqhQ;
  }

  function setQ(abschnitt, v) {
    if (abschnitt === "sahabiyyat") sahabQ = v;
    else if (abschnitt === "tabiiyyat") tabiiQ = v;
    else if (abschnitt === MUETTER_SLUG) muetterQ = v;
    else if (abschnitt === EHE_SLUG) eheQ = v;
    else if (abschnitt === HIJAB_SLUG) hijabQ = v;
    else if (abschnitt === WISSEN_SLUG) wissenQ = v;
    else fiqhQ = v;
  }

  function matches(e, abschnitt) {
    var thema = currentThema(abschnitt);
    var q = currentQ(abschnitt);
    if (thema !== "alle") {
      var chip = abschnitt === "fiqh" ? FIQH_BEREICH_CHIP[e.bereich] || e.bereich : e.bereich;
      if (thema === "historisch-in-pruefung" || thema === "in-pruefung") return false;
      if (abschnitt === WISSEN_SLUG && thema === "frauen-der-ersten-generation") {
        if (
          e.thema !== "frauen-lernen-beim-propheten" &&
          e.thema !== "frauen-der-ansar" &&
          e.thema !== "sensible-fragen"
        )
          return false;
      } else if (abschnitt === HIJAB_SLUG || abschnitt === WISSEN_SLUG) {
        if (chip !== thema && e.thema !== thema) return false;
      } else if (chip !== thema) return false;
    }
    if (!q) return true;
    var hay = [
      e.name,
      titelVon(e),
      vorschauVon(e),
      e.vollstaendigeAussage,
      e.inhalt,
      lehreVon(e),
      e.quellenanzeige,
      e.bereich,
      (e.schlagwoerter || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function hubRow(nr, title, meta, value, openLabel) {
    var nav = value ? ' data-nav="frauen" data-value="' + esc(value) + '"' : "";
    return (
      '<article class="dua-theme-card' +
      (value ? "" : " is-pending") +
      '"' +
      nav +
      ">" +
      '<span class="dua-theme-card__idx" aria-hidden="true">' +
      nr +
      "</span>" +
      '<div class="dua-theme-card__icon" aria-hidden="true"><span class="emoji-emblem">✦</span></div>' +
      '<div class="dua-theme-card__body"><h3>' +
      esc(title) +
      "</h3>" +
      '<p class="dua-theme-card__count">' +
      esc(meta) +
      "</p>" +
      (openLabel ? '<span class="frauen-open-btn">' + esc(openLabel) + "</span>" : "") +
      "</div>" +
      '<span class="dua-theme-card__chev" aria-hidden="true">›</span>' +
      "</article>"
    );
  }

  function renderHub() {
    return (
      '<section class="stack">' +
      '<p class="lede">Geprüfte Aussagen. Kompakt wählen, dann die volle Aussage mit Quelle und Direktnachweis.</p>' +
      '<div class="dua-theme-grid frauen-fiqh-list">' +
      hubRow("01", "Fiqh der Frauen", "Reinigung · Gebet · Fasten · Ḥidschāb", "fiqh", "Bereich öffnen") +
      hubRow(
        "02",
        "Ṣaḥābiyyāt",
        "Geprüfte Ereignisse und Lehren aus dem Leben der Frauen der Ṣaḥābah.",
        "sahabiyyat",
        "Bereich öffnen"
      ) +
      hubRow(
        "03",
        "Tābiʿiyyāt",
        "Geprüfte Berichte und Lehren über Frauen aus der Generation nach den Ṣaḥābah.",
        "tabiiyyat",
        "Bereich öffnen"
      ) +
      hubRow(
        "04",
        "Mütter der Gläubigen",
        "Geprüfte Berichte über die Ehefrauen des Propheten ﷺ – mit Quelle und Direktnachweis.",
        MUETTER_SLUG,
        "Bereich öffnen"
      ) +
      hubRow(
        "05",
        "Ehe & Familie",
        "Geprüfte Grundlagen zu gutem Umgang, Verantwortung, Rechten und Familie.",
        EHE_SLUG,
        "Bereich öffnen"
      ) +
      hubRow(
        "06",
        "Ḥijāb & Schamhaftigkeit",
        "Geprüfte Grundlagen zu Bedeckung, Adab und Schamhaftigkeit.",
        HIJAB_SLUG,
        "Bereich öffnen"
      ) +
      hubRow(
        "07",
        "Wissen & Lernen",
        "Geprüfte Grundlagen zum Lernen der Religion, Fragenstellen und Weitergeben von Wissen.",
        WISSEN_SLUG,
        "Bereich öffnen"
      ) +
      hubRow("08", "Frauen der Salaf", "In Prüfung", "", "") +
      "</div></section>"
    );
  }

  function filterBlock(abschnitt, themen, q, thema) {
    var chips = themen
      .map(function (t) {
        return (
          '<button type="button" class="frauen-chip' +
          (thema === t.id ? " is-on" : "") +
          '" data-frauen-thema="' +
          esc(t.id) +
          '">' +
          esc(t.label) +
          "</button>"
        );
      })
      .join("");
    var suchePlatz =
      abschnitt === EHE_SLUG || abschnitt === HIJAB_SLUG || abschnitt === WISSEN_SLUG
        ? "Thema suchen"
        : abschnitt === "fiqh"
          ? "Thema oder Begriff suchen"
          : "Name oder Thema suchen";
    var sucheLabel =
      abschnitt === WISSEN_SLUG
        ? '<span class="frauen-filter__search-label">Thema suchen</span>'
        : '<span class="visually-hidden">Suchen</span>';
    return (
      '<div class="frauen-filter is-open" data-frauen-abschnitt="' +
      esc(abschnitt) +
      '">' +
      '<p class="frauen-filter__label">Themen</p>' +
      '<div class="frauen-filter__chips frauen-filter__chips--always">' +
      chips +
      "</div>" +
      '<label class="frauen-filter__search-wrap">' +
      sucheLabel +
      '<input class="frauen-filter__search" type="search" placeholder="' +
      esc(suchePlatz) +
      '" value="' +
      esc(q) +
      '" data-frauen-q autocomplete="off" spellcheck="false">' +
      "</label>" +
      "</div>"
    );
  }

  function listCard(e, abschnitt) {
    var labelMap =
      abschnitt === "sahabiyyat"
        ? SAHAB_BEREICH_LABEL
        : abschnitt === "tabiiyyat"
          ? TABII_BEREICH_LABEL
          : abschnitt === MUETTER_SLUG
            ? MUETTER_BEREICH_LABEL
            : abschnitt === EHE_SLUG
              ? EHE_BEREICH_LABEL
              : abschnitt === HIJAB_SLUG
                ? HIJAB_BEREICH_LABEL
                : abschnitt === WISSEN_SLUG
                  ? WISSEN_BEREICH_LABEL
                  : FIQH_BEREICH_LABEL;
    var bereich = labelMap[e.bereich] || e.bereich || "";
    var name =
      (abschnitt === "sahabiyyat" || abschnitt === "tabiiyyat" || abschnitt === MUETTER_SLUG) && e.name
        ? '<p class="frauen-statement-card__name">' + esc(e.name) + "</p>"
        : "";
    var hair = '<span class="frauen-hairline" aria-hidden="true"></span>';
    return (
      '<article class="frauen-statement-card" data-nav="frauen" data-value="' +
      esc(abschnitt + "/" + e.kennung) +
      '">' +
      '<div class="frauen-statement-card__titel">' +
      name +
      "<h3>" +
      esc(titelVon(e)) +
      "</h3>" +
      '<p class="frauen-statement-card__meta">' +
      esc(bereich ? bereich + " · " : "") +
      esc(quellenstatusSicht(e)) +
      "</p>" +
      "</div>" +
      hair +
      '<p class="frauen-statement-card__preview">' +
      esc(vorschauVon(e)) +
      "</p>" +
      hair +
      '<p class="frauen-statement-card__quelle">' +
      esc(quelleKurz(e)) +
      "</p>" +
      hair +
      '<span class="frauen-open-btn">Aussage öffnen</span>' +
      "</article>"
    );
  }

  function renderList(abschnitt) {
    var data = cacheFor(abschnitt);
    var themen =
      abschnitt === "sahabiyyat"
        ? SAHAB_THEMEN
        : abschnitt === "tabiiyyat"
          ? TABII_THEMEN
          : abschnitt === MUETTER_SLUG
            ? MUETTER_THEMEN
            : abschnitt === EHE_SLUG
              ? EHE_THEMEN
              : abschnitt === HIJAB_SLUG
                ? HIJAB_THEMEN
                : abschnitt === WISSEN_SLUG
                  ? WISSEN_THEMEN
                  : FIQH_THEMEN;
    var q = currentQ(abschnitt);
    var thema = currentThema(abschnitt);
    var geprueft = sichtbare(data.eintraege);
    var items = geprueft.filter(function (e) {
      return matches(e, abschnitt);
    });
    var leerBereich = !geprueft.length;
    var emptyHtml = leerBereich
      ? '<div class="frauen-empty"><p>Noch keine geprüften Inhalte vorhanden.</p><p>Dieser Bereich wird mit belastbaren Quellen Schritt für Schritt erweitert.</p></div>'
      : abschnitt === MUETTER_SLUG ||
          abschnitt === EHE_SLUG ||
          abschnitt === HIJAB_SLUG ||
          abschnitt === WISSEN_SLUG
        ? '<p class="frauen-empty">Noch keine geprüften Inhalte vorhanden.</p>'
        : '<p class="frauen-empty">Keine sichtbare Aussage zu dieser Auswahl.</p>';
    var hint =
      leerBereich
        ? ""
        : abschnitt === WISSEN_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Moderne Aussagen, ungeprüfte Motivationssprüche und schwache Berichte werden nicht angezeigt.</p></div>'
          : abschnitt === HIJAB_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Detailfragen wie Niqāb, Gesicht, Hände, Füße, Stimme, Farben und Kleidung im Einzelnen werden erst sichtbar, wenn sie separat geprüft wurden.</p></div>'
          : abschnitt === EHE_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Sensible Detailfragen werden erst sichtbar, wenn sie einzeln mit Quellen geprüft wurden.</p></div>'
          : abschnitt === MUETTER_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Berichte ohne belastbaren Nachweis werden nicht angezeigt.</p></div>'
          : abschnitt === "sahabiyyat"
            ? '<div class="frauen-hint"><p>Dieser Bereich enthält nur Berichte mit geprüfter Quelle. Schwache, ausgeschmückte oder nicht belegte Geschichten werden nicht angezeigt.</p></div>'
            : "";
    var lede =
      abschnitt === WISSEN_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah über Wissen, Fragenstellen und Lernen mit Adab.</p>'
        : abschnitt === HIJAB_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu Bedeckung, Adab und Schamhaftigkeit.</p>'
        : abschnitt === EHE_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu gutem Umgang, Verantwortung, Rechten und Familie.</p>'
        : abschnitt === MUETTER_SLUG
        ? '<p class="lede">Geprüfte Berichte über die Ehefrauen des Propheten ﷺ – mit Quelle und Direktnachweis.</p>'
        : abschnitt === "tabiiyyat"
          ? '<p class="lede">Frauen aus der Generation nach den Ṣaḥābah – mit geprüfter Quelle und Direktnachweis.</p>'
          : abschnitt === "sahabiyyat"
            ? '<p class="lede">Kurze geprüfte Berichte über Frauen der Ṣaḥābah – mit Quelle und Direktnachweis.</p>'
            : '<p class="lede">Nur geprüfte Aussagen mit Direktnachweis. Die volle Aussage öffnet sich nach dem Tippen.</p>';
    return (
      '<section class="stack">' +
      lede +
      hint +
      filterBlock(abschnitt, themen, q, thema) +
      (items.length
        ? '<div class="frauen-statement-list">' +
          items.map(function (e) {
            return listCard(e, abschnitt);
          }).join("") +
          "</div>"
        : emptyHtml) +
      "</section>"
    );
  }

  function bereichKicker(abschnitt) {
    if (abschnitt === WISSEN_SLUG) return "Wissen & Lernen";
    if (abschnitt === HIJAB_SLUG) return "Ḥijāb & Schamhaftigkeit";
    if (abschnitt === EHE_SLUG) return "Ehe & Familie";
    if (abschnitt === MUETTER_SLUG) return "Mütter der Gläubigen";
    if (abschnitt === "tabiiyyat") return "Tābiʿiyyāt";
    if (abschnitt === "sahabiyyat") return "Ṣaḥābiyyāt";
    return "Fiqh der Frauen";
  }

  function narratorLine(e, abschnitt) {
    var raw = String(e.name || e.ueberliefertVon || e.sprecher || "").trim();
    if (!raw) return "";
    if (abschnitt === MUETTER_SLUG) {
      return '<p class="frauen-oval__kicker">' + esc(raw) + "</p>";
    }
    var honorific = /رضي الله/.test(raw)
      ? ""
      : "<span class='honorific'>رضي الله عنها</span>";
    return (
      '<div class="post-reader-speaker">' +
      '<span class="post-reader-speaker__label">Überliefert von</span>' +
      '<span class="post-reader-speaker__rule" aria-hidden="true"></span>' +
      '<span class="post-reader-speaker__name">' +
      esc(raw) +
      " " +
      honorific +
      "</span></div>"
    );
  }

  function quelleText(e) {
    return String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "").trim() || "Keine Quelle hinterlegt.";
  }

  function nachweiseDirekt(e) {
    var url = String(e.direktnachweisUrl || "").trim();
    var label = e.direktnachweisText || "→ Quelle öffnen";
    return (
      '<p class="frauen-oval__kicker">Direktnachweis</p>' +
      '<a class="frauen-direktnachweis" href="' +
      esc(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(label) +
      "</a>"
    );
  }

  function renderDetail(abschnitt, kennung) {
    var data = cacheFor(abschnitt);
    var e = (data.eintraege || []).find(function (x) {
      return x.kennung === kennung && istSichtbar(x);
    });
    if (!e) {
      return '<p class="frauen-empty">Diese Aussage ist nicht sichtbar.</p>';
    }
    var lehre = lehreVon(e);
    var sep = '<div class="post-reader-sep" aria-hidden="true"><i>◆</i></div>';
    var lehreHtml = lehre
      ? sep +
        '<section class="post-key-message" data-post-fazit><h3>Lehre / Nutzen</h3><div class="post-fazit-body">' +
        esc(lehre) +
        "</div></section>"
      : "";
    return (
      '<article class="article post-reader">' +
      '<header class="post-reader-title"><div class="kicker">' +
      esc(bereichKicker(abschnitt)) +
      "</div><h2>" +
      esc(titelVon(e)) +
      "</h2></header>" +
      '<section class="post-reader-main">' +
      narratorLine(e, abschnitt) +
      '<section class="statement post-aussage"><div class="post-aussage-kicker">Aussage</div>' +
      '<div class="post-aussage-text">' +
      esc(aussageVon(e)) +
      "</div></section>" +
      sep +
      '<div class="post-source-oval post-source-module"><div class="post-reader-cite"><b>Quelle</b>' +
      '<div data-post-after-source>' +
      esc(quelleText(e)) +
      "</div></div>" +
      nachweiseDirekt(e) +
      "</div>" +
      lehreHtml +
      "</section>" +
      '<button type="button" class="frauen-open-btn" data-nav="frauen" data-value="' +
      esc(abschnitt) +
      '">Zurück zur Übersicht</button>' +
      "</article>"
    );
  }

  function refreshIfFrauen() {
    try {
      if (typeof window.render === "function") {
        var r = typeof window.readRoute === "function" ? window.readRoute() : null;
        if (!r || r.view === "frauen") window.render();
      }
    } catch (err) {}
  }

  function pageMeta(value) {
    var parsed = parseValue(value);
    if (parsed.abschnitt === WISSEN_SLUG && parsed.page === "list") {
      return {
        title: "Wissen & Lernen",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah über Wissen, Fragenstellen und Lernen mit Adab."
      };
    }
    if (parsed.abschnitt === HIJAB_SLUG && parsed.page === "list") {
      return {
        title: "Ḥijāb & Schamhaftigkeit",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah – ohne ungeprüfte Detailurteile."
      };
    }
    if (parsed.abschnitt === EHE_SLUG && parsed.page === "list") {
      return {
        title: "Ehe & Familie",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah – ohne ungeprüfte Fatwas und ohne ausgeschmückte Aussagen."
      };
    }
    if (parsed.abschnitt === MUETTER_SLUG && parsed.page === "list") {
      return {
        title: "Mütter der Gläubigen",
        subtitle: "Der Rang, die Vorzüge und ausgewählte geprüfte Berichte über die Ehefrauen des Propheten ﷺ."
      };
    }
    if (parsed.abschnitt === "tabiiyyat" && parsed.page === "list") {
      return {
        title: "Tābiʿiyyāt",
        subtitle: "Frauen aus der Generation nach den Ṣaḥābah – mit geprüfter Quelle und Direktnachweis."
      };
    }
    if (parsed.abschnitt === "sahabiyyat" && parsed.page === "list") {
      return {
        title: "Ṣaḥābiyyāt",
        subtitle: "Kurze geprüfte Berichte über Frauen der Ṣaḥābah – mit Quelle und Direktnachweis."
      };
    }
    if (parsed.abschnitt === "fiqh" && parsed.page === "list") {
      return {
        title: "Fiqh der Frauen",
        subtitle: "Suche und Filter · Aussage öffnen · Quelle und Direktnachweis"
      };
    }
    if (parsed.page === "detail") {
      return {
        title:
          parsed.abschnitt === WISSEN_SLUG
            ? "Wissen & Lernen"
            : parsed.abschnitt === HIJAB_SLUG
            ? "Ḥijāb & Schamhaftigkeit"
            : parsed.abschnitt === EHE_SLUG
            ? "Ehe & Familie"
            : parsed.abschnitt === MUETTER_SLUG
            ? "Mütter der Gläubigen"
            : parsed.abschnitt === "tabiiyyat"
              ? "Tābiʿiyyāt"
              : parsed.abschnitt === "sahabiyyat"
                ? "Ṣaḥābiyyāt"
                : "Fiqh der Frauen",
        subtitle: "Aussage · Quelle und Direktnachweis"
      };
    }
    return {
      title: "Frauen im Islam",
      subtitle: "Geprüfte Aussagen. Kompakt wählen, dann nachprüfen."
    };
  }

  function render(value) {
    var parsed = parseValue(value);
    currentAbschnitt = parsed.abschnitt || "hub";
    if (
      !fiqhCache ||
      !sahabCache ||
      !tabiiCache ||
      !muetterCache ||
      !eheCache ||
      !hijabCache ||
      !wissenCache
    ) {
      load().then(refreshIfFrauen).catch(refreshIfFrauen);
      return '<p class="frauen-empty">Bereich wird geladen…</p>';
    }
    if (parsed.page === "hub") {
      fiqhQ = "";
      sahabQ = "";
      tabiiQ = "";
      muetterQ = "";
      eheQ = "";
      hijabQ = "";
      wissenQ = "";
      fiqhThema = "alle";
      sahabThema = "alle";
      tabiiThema = "alle";
      muetterThema = "alle";
      eheThema = "alle";
      hijabThema = "alle";
      wissenThema = "alle";
      return renderHub();
    }
    if (parsed.page === "detail") return renderDetail(parsed.abschnitt, parsed.kennung);
    return renderList(parsed.abschnitt);
  }

  function bind() {
    var input = document.querySelector("[data-frauen-q]");
    if (input && !input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", function () {
        var v = (input.value || "").trim().toLowerCase();
        setQ(currentAbschnitt, v);
        refreshIfFrauen();
        requestAnimationFrame(function () {
          var again = document.querySelector("[data-frauen-q]");
          if (!again) return;
          again.focus();
          try {
            again.setSelectionRange(again.value.length, again.value.length);
          } catch (err) {}
        });
      });
    }
  }

  document.addEventListener("click", function (ev) {
    var chip = ev.target && ev.target.closest ? ev.target.closest("[data-frauen-thema]") : null;
    if (!chip) return;
    ev.preventDefault();
    var id = chip.getAttribute("data-frauen-thema") || "alle";
    setThema(currentAbschnitt, id);
    refreshIfFrauen();
  });

  window.DARFrauenFiqh = {
    render: render,
    parseValue: parseValue,
    pageMeta: pageMeta,
    bind: bind
  };
})();
