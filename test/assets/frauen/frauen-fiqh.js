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
  var FAQ_URL = "/test/data/frauen-fragen-antworten.json";
  var FAQ_SLUG = "fragen-antworten";
  var KURZ_URL = "/test/data/frauen-gepruefte-kurzberichte.json";
  var KURZ_SLUG = "gepruefte-kurzberichte";
  var SALAF_URL = "/test/data/frauen-der-salaf.json";
  var SALAF_SLUG = "frauen-der-salaf";
  var MOSCHEE_URL = "/test/data/frauen-moschee-gemeinschaft.json";
  var MOSCHEE_SLUG = "moschee-gemeinschaft";
  var HAJJ_URL = "/test/data/frauen-hajj-umrah.json";
  var HAJJ_SLUG = "hajj-umrah";
  var SADAQAH_URL = "/test/data/frauen-sadaqah-wohltatigkeit.json";
  var SADAQAH_SLUG = "sadaqah-wohltatigkeit";
  var ADAB_URL = "/test/data/frauen-adab-charakter.json";
  var ADAB_SLUG = "adab-charakter";
  var KINDER_URL = "/test/data/frauen-kinder-erziehung.json";
  var KINDER_SLUG = "kinder-erziehung";
  var MUSLIMAH_URL = "/test/data/frauen-rechtschaffene-muslimah.json";
  var MUSLIMAH_SLUG = "rechtschaffene-muslimah";
  var NIFAS_URL = "/test/data/frauen-schwangerschaft-stillzeit-nifas.json";
  var NIFAS_SLUG = "schwangerschaft-stillzeit-nifas";
  var DIENST_URL = "/test/data/frauen-dienst-pflege-hilfeleistung.json";
  var DIENST_SLUG = "dienst-pflege-hilfeleistung";
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
  var FAQ_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "reinigung", label: "Reinigung" },
    { id: "gebet", label: "Gebet" },
    { id: "fasten", label: "Fasten" },
    { id: "wissen", label: "Wissen" },
    { id: "moschee", label: "Moschee" },
    { id: "eid", label: "Eid" },
    { id: "kleidung-im-gebet", label: "Kleidung im Gebet" },
    { id: "hijab-schamhaftigkeit", label: "Ḥijāb & Schamhaftigkeit" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var FAQ_BEREICH_LABEL = {
    reinigung: "Reinigung",
    gebet: "Gebet",
    fasten: "Fasten",
    wissen: "Wissen",
    moschee: "Moschee",
    eid: "Eid",
    "kleidung-im-gebet": "Kleidung im Gebet",
    "hijab-schamhaftigkeit": "Ḥijāb & Schamhaftigkeit",
    "in-pruefung": "In Prüfung"
  };
  var KURZ_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "wissen", label: "Wissen" },
    { id: "standhaftigkeit", label: "Standhaftigkeit" },
    { id: "geduld", label: "Geduld" },
    { id: "beratung", label: "Beratung" },
    { id: "quran", label: "Qurʾān" },
    { id: "sadaqah", label: "Ṣadaqah" },
    { id: "adab", label: "Adab" },
    { id: "familie", label: "Familie" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var KURZ_BEREICH_LABEL = {
    wissen: "Wissen",
    standhaftigkeit: "Standhaftigkeit",
    geduld: "Geduld",
    beratung: "Beratung",
    quran: "Qurʾān",
    sadaqah: "Ṣadaqah",
    adab: "Adab",
    familie: "Familie",
    "in-pruefung": "In Prüfung"
  };
  var SALAF_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "wissen", label: "Wissen" },
    { id: "fiqh", label: "Fiqh" },
    { id: "ibadah", label: "ʿIbādah" },
    { id: "zuhd", label: "Zuhd" },
    { id: "adab", label: "Adab" },
    { id: "geduld", label: "Geduld" },
    { id: "ueberlieferung", label: "Überlieferung" },
    { id: "familie", label: "Familie" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var SALAF_BEREICH_LABEL = {
    wissen: "Wissen",
    fiqh: "Fiqh",
    ibadah: "ʿIbādah",
    zuhd: "Zuhd",
    adab: "Adab",
    geduld: "Geduld",
    ueberlieferung: "Überlieferung",
    familie: "Familie",
    "in-pruefung": "In Prüfung"
  };
  var MOSCHEE_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "moschee", label: "Moschee" },
    { id: "eid", label: "Eid" },
    { id: "adab", label: "Adab" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "gemeinschaft", label: "Gemeinschaft" },
    { id: "lernen", label: "Lernen" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var MOSCHEE_BEREICH_LABEL = {
    moschee: "Moschee",
    eid: "Eid",
    adab: "Adab",
    schamhaftigkeit: "Schamhaftigkeit",
    gemeinschaft: "Gemeinschaft",
    lernen: "Lernen",
    "in-pruefung": "In Prüfung"
  };
  var HAJJ_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "vorzueglichkeit", label: "Vorzüglichkeit" },
    { id: "ihram", label: "Iḥrām" },
    { id: "hayd", label: "Ḥayḍ" },
    { id: "tawaf", label: "Ṭawāf" },
    { id: "umrah", label: "ʿUmrah" },
    { id: "kleidung-im-ihram", label: "Kleidung im Iḥrām" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var HAJJ_BEREICH_LABEL = {
    vorzueglichkeit: "Vorzüglichkeit",
    ihram: "Iḥrām",
    hayd: "Ḥayḍ",
    tawaf: "Ṭawāf",
    umrah: "ʿUmrah",
    "kleidung-im-ihram": "Kleidung im Iḥrām",
    "in-pruefung": "In Prüfung"
  };
  var SADAQAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "sadaqah", label: "Ṣadaqah" },
    { id: "familie", label: "Familie" },
    { id: "waisen", label: "Waisen" },
    { id: "toechter", label: "Töchter" },
    { id: "eid", label: "Eid" },
    { id: "grosszuegigkeit", label: "Großzügigkeit" },
    { id: "adab", label: "Adab" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var SADAQAH_BEREICH_LABEL = {
    sadaqah: "Ṣadaqah",
    familie: "Familie",
    waisen: "Waisen",
    toechter: "Töchter",
    eid: "Eid",
    grosszuegigkeit: "Großzügigkeit",
    adab: "Adab",
    "in-pruefung": "In Prüfung"
  };
  var ADAB_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "guter-charakter", label: "Guter Charakter" },
    { id: "sprache", label: "Sprache" },
    { id: "sanftmut", label: "Sanftmut" },
    { id: "geduld", label: "Geduld" },
    { id: "wut-beherrschen", label: "Wut beherrschen" },
    { id: "familie", label: "Familie" },
    { id: "adab", label: "Adab" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var ADAB_BEREICH_LABEL = {
    "guter-charakter": "Guter Charakter",
    sprache: "Sprache",
    sanftmut: "Sanftmut",
    geduld: "Geduld",
    "wut-beherrschen": "Wut beherrschen",
    familie: "Familie",
    adab: "Adab",
    "in-pruefung": "In Prüfung"
  };
  var KINDER_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "verantwortung", label: "Verantwortung" },
    { id: "barmherzigkeit", label: "Barmherzigkeit" },
    { id: "toechter", label: "Töchter" },
    { id: "gerechtigkeit", label: "Gerechtigkeit" },
    { id: "adab", label: "Adab" },
    { id: "familie", label: "Familie" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var KINDER_BEREICH_LABEL = {
    verantwortung: "Verantwortung",
    barmherzigkeit: "Barmherzigkeit",
    toechter: "Töchter",
    gerechtigkeit: "Gerechtigkeit",
    adab: "Adab",
    familie: "Familie",
    "in-pruefung": "In Prüfung"
  };
  var MUSLIMAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "din", label: "Dīn" },
    { id: "rechtschaffenheit", label: "Rechtschaffenheit" },
    { id: "ehe", label: "Ehe" },
    { id: "verantwortung", label: "Verantwortung" },
    { id: "gehorsam-im-guten", label: "Gehorsam im Guten" },
    { id: "charakter", label: "Charakter" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var MUSLIMAH_BEREICH_LABEL = {
    din: "Dīn",
    rechtschaffenheit: "Rechtschaffenheit",
    ehe: "Ehe",
    verantwortung: "Verantwortung",
    "gehorsam-im-guten": "Gehorsam im Guten",
    charakter: "Charakter",
    schamhaftigkeit: "Schamhaftigkeit",
    "in-pruefung": "In Prüfung"
  };
  var NIFAS_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "stillzeit", label: "Stillzeit" },
    { id: "schwangerschaft", label: "Schwangerschaft" },
    { id: "nifas", label: "Nifās" },
    { id: "fasten", label: "Fasten" },
    { id: "reinigung", label: "Reinigung" },
    { id: "familie", label: "Familie" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var NIFAS_BEREICH_LABEL = {
    stillzeit: "Stillzeit",
    schwangerschaft: "Schwangerschaft",
    nifas: "Nifās",
    fasten: "Fasten",
    reinigung: "Reinigung",
    familie: "Familie",
    "in-pruefung": "In Prüfung"
  };
  var DIENST_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "pflege", label: "Pflege" },
    { id: "wassergeben", label: "Wassergeben" },
    { id: "versorgung", label: "Versorgung" },
    { id: "dienst", label: "Dienst" },
    { id: "kranke", label: "Kranke" },
    { id: "verwundete", label: "Verwundete" },
    { id: "adab", label: "Adab" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var DIENST_BEREICH_LABEL = {
    pflege: "Pflege",
    wassergeben: "Wassergeben",
    versorgung: "Versorgung",
    dienst: "Dienst",
    kranke: "Kranke",
    verwundete: "Verwundete",
    adab: "Adab",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var fiqhCache = null;
  var sahabCache = null;
  var tabiiCache = null;
  var muetterCache = null;
  var eheCache = null;
  var hijabCache = null;
  var wissenCache = null;
  var faqCache = null;
  var kurzCache = null;
  var salafCache = null;
  var moscheeCache = null;
  var hajjCache = null;
  var sadaqahCache = null;
  var adabCache = null;
  var kinderCache = null;
  var muslimahCache = null;
  var nifasCache = null;
  var dienstCache = null;
  var loadPromise = null;
  var fiqhQ = "";
  var sahabQ = "";
  var tabiiQ = "";
  var muetterQ = "";
  var eheQ = "";
  var hijabQ = "";
  var wissenQ = "";
  var faqQ = "";
  var kurzQ = "";
  var salafQ = "";
  var moscheeQ = "";
  var hajjQ = "";
  var sadaqahQ = "";
  var adabQ = "";
  var kinderQ = "";
  var muslimahQ = "";
  var nifasQ = "";
  var dienstQ = "";
  var fiqhThema = "alle";
  var sahabThema = "alle";
  var tabiiThema = "alle";
  var muetterThema = "alle";
  var eheThema = "alle";
  var hijabThema = "alle";
  var wissenThema = "alle";
  var faqThema = "alle";
  var kurzThema = "alle";
  var salafThema = "alle";
  var moscheeThema = "alle";
  var hajjThema = "alle";
  var sadaqahThema = "alle";
  var adabThema = "alle";
  var kinderThema = "alle";
  var muslimahThema = "alle";
  var nifasThema = "alle";
  var dienstThema = "alle";
  var hubQ = "";
  var hubThema = "alle";
  var filterOpen = true;
  var currentAbschnitt = "hub";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function filterOben(abschnitt) {
    return (
      abschnitt === MOSCHEE_SLUG ||
      abschnitt === HAJJ_SLUG ||
      abschnitt === SADAQAH_SLUG ||
      abschnitt === ADAB_SLUG ||
      abschnitt === KINDER_SLUG ||
      abschnitt === MUSLIMAH_SLUG ||
      abschnitt === NIFAS_SLUG ||
      abschnitt === DIENST_SLUG
    );
  }

  function istFaq(abschnitt) {
    return abschnitt === FAQ_SLUG;
  }

  function istKurz(abschnitt) {
    return abschnitt === KURZ_SLUG;
  }

  function oeffnenLabel(abschnitt) {
    if (istFaq(abschnitt)) return "Antwort öffnen";
    if (istKurz(abschnitt)) return "Bericht öffnen";
    return "Aussage öffnen";
  }

  function aussageKicker(abschnitt) {
    if (istFaq(abschnitt)) return "Antwort";
    if (istKurz(abschnitt)) return "Bericht";
    return "Aussage";
  }

  function titelVon(e) {
    return e.frage || e.titel || e.titel_de || "";
  }

  function vorschauVon(e) {
    return e.kurzantwort || e.kurzvorschau || e.kurzbeschreibung || "";
  }

  function aussageVon(e) {
    return e.vollstaendigerBericht || e.vollstaendigeAntwort || e.vollstaendigeAussage || e.inhalt || "";
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
    if (e.quellenart === "zuverlaessiger-athar" && e.freigabeDurchSerhat !== true) return false;
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
    if (fiqhCache && sahabCache && tabiiCache && muetterCache && eheCache && hijabCache && wissenCache && faqCache && kurzCache && salafCache && moscheeCache && hajjCache && sadaqahCache && adabCache && kinderCache && muslimahCache && nifasCache && dienstCache)
      return Promise.resolve();
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([
      fetchJson(FIQH_URL),
      fetchJson(SAHAB_URL),
      fetchJson(TABII_URL),
      fetchJson(MUETTER_URL),
      fetchJson(EHE_URL),
      fetchJson(HIJAB_URL),
      fetchJson(WISSEN_URL),
      fetchJson(FAQ_URL),
      fetchJson(KURZ_URL),
      fetchJson(SALAF_URL),
      fetchJson(MOSCHEE_URL),
      fetchJson(HAJJ_URL),
      fetchJson(SADAQAH_URL),
      fetchJson(ADAB_URL),
      fetchJson(KINDER_URL),
      fetchJson(MUSLIMAH_URL),
      fetchJson(NIFAS_URL),
      fetchJson(DIENST_URL)
    ])
      .then(function (pair) {
        fiqhCache = pair[0];
        sahabCache = pair[1];
        tabiiCache = pair[2];
        muetterCache = pair[3];
        eheCache = pair[4];
        hijabCache = pair[5];
        wissenCache = pair[6];
        faqCache = pair[7];
        kurzCache = pair[8];
        salafCache = pair[9];
        moscheeCache = pair[10];
        hajjCache = pair[11];
        sadaqahCache = pair[12];
        adabCache = pair[13];
        kinderCache = pair[14];
        muslimahCache = pair[15];
        nifasCache = pair[16];
        dienstCache = pair[17];
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
    if (v === FAQ_SLUG) return { page: "list", abschnitt: FAQ_SLUG, kennung: "" };
    if (v.indexOf(FAQ_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: FAQ_SLUG, kennung: v.slice(FAQ_SLUG.length + 1) };
    }
    if (v === KURZ_SLUG) return { page: "list", abschnitt: KURZ_SLUG, kennung: "" };
    if (v.indexOf(KURZ_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: KURZ_SLUG, kennung: v.slice(KURZ_SLUG.length + 1) };
    }
    if (v === SALAF_SLUG) return { page: "list", abschnitt: SALAF_SLUG, kennung: "" };
    if (v.indexOf(SALAF_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: SALAF_SLUG, kennung: v.slice(SALAF_SLUG.length + 1) };
    }
    if (v === MOSCHEE_SLUG) return { page: "list", abschnitt: MOSCHEE_SLUG, kennung: "" };
    if (v.indexOf(MOSCHEE_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: MOSCHEE_SLUG, kennung: v.slice(MOSCHEE_SLUG.length + 1) };
    }
    if (v === HAJJ_SLUG) return { page: "list", abschnitt: HAJJ_SLUG, kennung: "" };
    if (v.indexOf(HAJJ_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: HAJJ_SLUG, kennung: v.slice(HAJJ_SLUG.length + 1) };
    }
    if (v === SADAQAH_SLUG) return { page: "list", abschnitt: SADAQAH_SLUG, kennung: "" };
    if (v.indexOf(SADAQAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: SADAQAH_SLUG, kennung: v.slice(SADAQAH_SLUG.length + 1) };
    }
    if (v === ADAB_SLUG) return { page: "list", abschnitt: ADAB_SLUG, kennung: "" };
    if (v.indexOf(ADAB_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: ADAB_SLUG, kennung: v.slice(ADAB_SLUG.length + 1) };
    }
    if (v === KINDER_SLUG) return { page: "list", abschnitt: KINDER_SLUG, kennung: "" };
    if (v.indexOf(KINDER_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: KINDER_SLUG, kennung: v.slice(KINDER_SLUG.length + 1) };
    }
    if (v === MUSLIMAH_SLUG) return { page: "list", abschnitt: MUSLIMAH_SLUG, kennung: "" };
    if (v.indexOf(MUSLIMAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: MUSLIMAH_SLUG, kennung: v.slice(MUSLIMAH_SLUG.length + 1) };
    }
    if (v === NIFAS_SLUG) return { page: "list", abschnitt: NIFAS_SLUG, kennung: "" };
    if (v.indexOf(NIFAS_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: NIFAS_SLUG, kennung: v.slice(NIFAS_SLUG.length + 1) };
    }
    if (v === DIENST_SLUG) return { page: "list", abschnitt: DIENST_SLUG, kennung: "" };
    if (v.indexOf(DIENST_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: DIENST_SLUG, kennung: v.slice(DIENST_SLUG.length + 1) };
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
    if (abschnitt === FAQ_SLUG) return faqCache;
    if (abschnitt === KURZ_SLUG) return kurzCache;
    if (abschnitt === SALAF_SLUG) return salafCache;
    if (abschnitt === MOSCHEE_SLUG) return moscheeCache;
    if (abschnitt === HAJJ_SLUG) return hajjCache;
    if (abschnitt === SADAQAH_SLUG) return sadaqahCache;
    if (abschnitt === ADAB_SLUG) return adabCache;
    if (abschnitt === KINDER_SLUG) return kinderCache;
    if (abschnitt === MUSLIMAH_SLUG) return muslimahCache;
    if (abschnitt === NIFAS_SLUG) return nifasCache;
    if (abschnitt === DIENST_SLUG) return dienstCache;
    return fiqhCache;
  }

  function currentThema(abschnitt) {
    if (abschnitt === "hub" || !abschnitt) return hubThema;
    if (abschnitt === "sahabiyyat") return sahabThema;
    if (abschnitt === "tabiiyyat") return tabiiThema;
    if (abschnitt === MUETTER_SLUG) return muetterThema;
    if (abschnitt === EHE_SLUG) return eheThema;
    if (abschnitt === HIJAB_SLUG) return hijabThema;
    if (abschnitt === WISSEN_SLUG) return wissenThema;
    if (abschnitt === FAQ_SLUG) return faqThema;
    if (abschnitt === KURZ_SLUG) return kurzThema;
    if (abschnitt === SALAF_SLUG) return salafThema;
    if (abschnitt === MOSCHEE_SLUG) return moscheeThema;
    if (abschnitt === HAJJ_SLUG) return hajjThema;
    if (abschnitt === SADAQAH_SLUG) return sadaqahThema;
    if (abschnitt === ADAB_SLUG) return adabThema;
    if (abschnitt === KINDER_SLUG) return kinderThema;
    if (abschnitt === MUSLIMAH_SLUG) return muslimahThema;
    if (abschnitt === NIFAS_SLUG) return nifasThema;
    if (abschnitt === DIENST_SLUG) return dienstThema;
    return fiqhThema;
  }

  function setThema(abschnitt, id) {
    if (abschnitt === "hub" || !abschnitt) hubThema = id;
    else if (abschnitt === "sahabiyyat") sahabThema = id;
    else if (abschnitt === "tabiiyyat") tabiiThema = id;
    else if (abschnitt === MUETTER_SLUG) muetterThema = id;
    else if (abschnitt === EHE_SLUG) eheThema = id;
    else if (abschnitt === HIJAB_SLUG) hijabThema = id;
    else if (abschnitt === WISSEN_SLUG) wissenThema = id;
    else if (abschnitt === FAQ_SLUG) faqThema = id;
    else if (abschnitt === KURZ_SLUG) kurzThema = id;
    else if (abschnitt === SALAF_SLUG) salafThema = id;
    else if (abschnitt === MOSCHEE_SLUG) moscheeThema = id;
    else if (abschnitt === HAJJ_SLUG) hajjThema = id;
    else if (abschnitt === SADAQAH_SLUG) sadaqahThema = id;
    else if (abschnitt === ADAB_SLUG) adabThema = id;
    else if (abschnitt === KINDER_SLUG) kinderThema = id;
    else if (abschnitt === MUSLIMAH_SLUG) muslimahThema = id;
    else if (abschnitt === NIFAS_SLUG) nifasThema = id;
    else if (abschnitt === DIENST_SLUG) dienstThema = id;
    else fiqhThema = id;
  }

  function currentQ(abschnitt) {
    if (abschnitt === "hub" || !abschnitt) return hubQ;
    if (abschnitt === "sahabiyyat") return sahabQ;
    if (abschnitt === "tabiiyyat") return tabiiQ;
    if (abschnitt === MUETTER_SLUG) return muetterQ;
    if (abschnitt === EHE_SLUG) return eheQ;
    if (abschnitt === HIJAB_SLUG) return hijabQ;
    if (abschnitt === WISSEN_SLUG) return wissenQ;
    if (abschnitt === FAQ_SLUG) return faqQ;
    if (abschnitt === KURZ_SLUG) return kurzQ;
    if (abschnitt === SALAF_SLUG) return salafQ;
    if (abschnitt === MOSCHEE_SLUG) return moscheeQ;
    if (abschnitt === HAJJ_SLUG) return hajjQ;
    if (abschnitt === SADAQAH_SLUG) return sadaqahQ;
    if (abschnitt === ADAB_SLUG) return adabQ;
    if (abschnitt === KINDER_SLUG) return kinderQ;
    if (abschnitt === MUSLIMAH_SLUG) return muslimahQ;
    if (abschnitt === NIFAS_SLUG) return nifasQ;
    if (abschnitt === DIENST_SLUG) return dienstQ;
    return fiqhQ;
  }

  function setQ(abschnitt, v) {
    if (abschnitt === "hub" || !abschnitt) hubQ = v;
    else if (abschnitt === "sahabiyyat") sahabQ = v;
    else if (abschnitt === "tabiiyyat") tabiiQ = v;
    else if (abschnitt === MUETTER_SLUG) muetterQ = v;
    else if (abschnitt === EHE_SLUG) eheQ = v;
    else if (abschnitt === HIJAB_SLUG) hijabQ = v;
    else if (abschnitt === WISSEN_SLUG) wissenQ = v;
    else if (abschnitt === FAQ_SLUG) faqQ = v;
    else if (abschnitt === KURZ_SLUG) kurzQ = v;
    else if (abschnitt === SALAF_SLUG) salafQ = v;
    else if (abschnitt === MOSCHEE_SLUG) moscheeQ = v;
    else if (abschnitt === HAJJ_SLUG) hajjQ = v;
    else if (abschnitt === SADAQAH_SLUG) sadaqahQ = v;
    else if (abschnitt === ADAB_SLUG) adabQ = v;
    else if (abschnitt === KINDER_SLUG) kinderQ = v;
    else if (abschnitt === MUSLIMAH_SLUG) muslimahQ = v;
    else if (abschnitt === NIFAS_SLUG) nifasQ = v;
    else if (abschnitt === DIENST_SLUG) dienstQ = v;
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
      } else if (
        abschnitt === HIJAB_SLUG ||
        abschnitt === WISSEN_SLUG ||
        abschnitt === FAQ_SLUG ||
        abschnitt === KURZ_SLUG ||
        abschnitt === SALAF_SLUG ||
        abschnitt === MOSCHEE_SLUG ||
        abschnitt === HAJJ_SLUG ||
        abschnitt === SADAQAH_SLUG ||
        abschnitt === ADAB_SLUG ||
        abschnitt === KINDER_SLUG ||
        abschnitt === MUSLIMAH_SLUG ||
        abschnitt === NIFAS_SLUG ||
        abschnitt === DIENST_SLUG
      ) {
        if (chip !== thema && e.thema !== thema) return false;
      } else if (chip !== thema) return false;
    }
    if (!q) return true;
    var hay = [
      e.name,
      e.person,
      titelVon(e),
      vorschauVon(e),
      e.frage,
      e.kurzantwort,
      e.vollstaendigerBericht,
      e.vollstaendigeAntwort,
      e.vollstaendigeAussage,
      e.inhalt,
      lehreVon(e),
      e.quellenanzeige,
      e.bereich,
      hatDirektnachweis(e) ? "direktnachweis" : "",
      (e.schlagwoerter || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function offeneAbschnitte() {
    return ["fiqh", "sahabiyyat", "tabiiyyat", MUETTER_SLUG, EHE_SLUG, HIJAB_SLUG, WISSEN_SLUG, FAQ_SLUG, KURZ_SLUG, SALAF_SLUG, MOSCHEE_SLUG, HAJJ_SLUG, SADAQAH_SLUG, ADAB_SLUG, KINDER_SLUG, MUSLIMAH_SLUG, NIFAS_SLUG, DIENST_SLUG];
  }

  function countSichtbare(abschnitt) {
    var data = cacheFor(abschnitt);
    return sichtbare(data && data.eintraege).length;
  }

  function markSvg(kind) {
    var glyph = "📚";
    if (kind === "book") glyph = "📖";
    else if (kind === "person" || kind === "veil") glyph = "🧕";
    else if (kind === "people") glyph = "🌙";
    else if (kind === "home") glyph = "🏠";
    else if (kind === "ring") glyph = "💫";
    else if (kind === "lamp") glyph = "🪔";
    return '<span class="emoji-emblem frauen-emblem" aria-hidden="true">' + glyph + "</span>";
  }

  function markForAbschnitt(abschnitt) {
    if (abschnitt === "sahabiyyat") return "person";
    if (abschnitt === "tabiiyyat") return "people";
    if (abschnitt === MUETTER_SLUG) return "ring";
    if (abschnitt === EHE_SLUG) return "home";
    if (abschnitt === HIJAB_SLUG) return "veil";
    if (abschnitt === WISSEN_SLUG || abschnitt === FAQ_SLUG) return "lamp";
    if (abschnitt === KURZ_SLUG || abschnitt === SALAF_SLUG) return "people";
    if (abschnitt === MOSCHEE_SLUG) return "home";
    if (abschnitt === HAJJ_SLUG) return "ring";
    if (abschnitt === SADAQAH_SLUG) return "lamp";
    if (abschnitt === ADAB_SLUG) return "book";
    if (abschnitt === KINDER_SLUG) return "home";
    if (abschnitt === MUSLIMAH_SLUG) return "book";
    if (abschnitt === NIFAS_SLUG) return "home";
    if (abschnitt === DIENST_SLUG) return "lamp";
    return "book";
  }

  function areaJumpChips(activeId) {
    return hubAreas()
      .filter(function (a) {
        return a.id;
      })
      .map(function (a) {
        return (
          '<button type="button" class="theme-chip frauen-chip' +
          (activeId === a.id ? " is-on is-active" : "") +
          '" data-nav="frauen" data-value="' +
          esc(a.id) +
          '">' +
          esc(a.title) +
          "</button>"
        );
      })
      .join("");
  }

  function searchPanel(abschnitt, themen, q, thema, placeholder) {
    var isHub = abschnitt === "hub" || !abschnitt;
    var chips = (themen || [])
      .map(function (t) {
        return (
          '<button type="button" class="theme-chip frauen-chip' +
          (thema === t.id ? " is-on is-active" : "") +
          '" data-frauen-thema="' +
          esc(t.id) +
          '">' +
          esc(t.label) +
          "</button>"
        );
      })
      .join("");
    return (
      '<section class="search-pro-panel frauen-search-pro">' +
      '<div class="search-line">' +
      '<div class="search-input-shell">' +
      '<span class="search-input-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></span>' +
      '<input class="search search-input-field" type="search" placeholder="' +
      esc(placeholder) +
      '" value="' +
      esc(q) +
      '" data-frauen-q autocomplete="off" spellcheck="false" enterkeyhint="search">' +
      "</div>" +
      '<button type="button" class="advanced-toggle' +
      (filterOpen || filterOben(abschnitt) ? " active" : "") +
      '" data-frauen-filter-toggle>' +
      (filterOpen || filterOben(abschnitt) ? "Filter ausblenden" : "Filter anzeigen") +
      "</button></div>" +
      '<div class="frauen-filter-panel' +
      (filterOpen || filterOben(abschnitt) ? " is-open" : "") +
      '"' +
      (filterOpen || filterOben(abschnitt) ? "" : " hidden") +
      ">" +
      '<p class="frauen-filter-panel__label">Bereiche</p>' +
      '<div class="frauen-filter-grid">' +
      areaJumpChips(isHub ? "" : abschnitt) +
      "</div>" +
      (isHub
        ? ""
        : '<p class="frauen-filter-panel__label frauen-filter-panel__label--sub">Themen in diesem Bereich</p>' +
          '<div class="frauen-filter-grid">' +
          chips +
          "</div>") +
      "</div></section>"
    );
  }

  function hubAreas() {
    return [
      { nr: "01", title: "Fiqh der Frauen", id: "fiqh", mark: "book", featured: true },
      { nr: "02", title: "Ṣaḥābiyyāt", id: "sahabiyyat", mark: "person" },
      { nr: "03", title: "Tābiʿiyyāt", id: "tabiiyyat", mark: "people" },
      { nr: "04", title: "Mütter der Gläubigen", id: MUETTER_SLUG, mark: "ring" },
      { nr: "05", title: "Ehe & Familie", id: EHE_SLUG, mark: "home" },
      { nr: "06", title: "Ḥijāb & Schamhaftigkeit", id: HIJAB_SLUG, mark: "veil" },
      { nr: "07", title: "Wissen & Lernen", id: WISSEN_SLUG, mark: "lamp" },
      { nr: "08", title: "Fragen & Antworten", id: FAQ_SLUG, mark: "book" },
      { nr: "09", title: "Geprüfte Kurzberichte", id: KURZ_SLUG, mark: "people" },
      { nr: "10", title: "Frauen der Salaf", id: SALAF_SLUG, mark: "ring" },
      { nr: "11", title: "Moschee & Gemeinschaft", id: MOSCHEE_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Moschee, Eid, Adab und Teilnahme am Guten." },
      { nr: "12", title: "Ḥajj & ʿUmrah", id: HAJJ_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Iḥrām, Ḥayḍ, Ṭawāf und Pilgerreise." },
      { nr: "13", title: "Ṣadaqah & Wohltätigkeit", id: SADAQAH_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Spenden, Fürsorge, Familie und Wohltätigkeit." },
      { nr: "14", title: "Adab & Charakter", id: ADAB_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Benehmen, Sprache, Sanftmut, Geduld und gutem Umgang." },
      { nr: "15", title: "Kinder & Erziehung", id: KINDER_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Verantwortung, Barmherzigkeit, Gerechtigkeit und Fürsorge." },
      { nr: "16", title: "Rechtschaffene Muslimah", id: MUSLIMAH_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Dīn, Charakter, Verantwortung und Grenzen des Gehorsams." },
      { nr: "17", title: "Schwangerschaft, Stillzeit & Nifās", id: NIFAS_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Stillzeit, Nifās, Fasten-Erleichterung und sensiblen Fragen." },
      { nr: "18", title: "Dienst am Guten, Pflege & Hilfeleistung", id: DIENST_SLUG, mark: "lamp", lede: "Geprüfte Berichte zu Versorgung, Pflege, Wassergeben, Dienst und Hilfeleistung." }
    ];
  }

  function hubRow(area) {
    var n = area.id ? countSichtbare(area.id) : 0;
    var meta = area.pending ? "In Prüfung" : n === 1 ? "1 Aussage" : n + " Aussagen";
    var nav = area.id ? ' data-nav="frauen" data-value="' + esc(area.id) + '"' : "";
    return (
      '<article class="topics-theme-card dua-theme-card' +
      (area.featured && area.id ? " is-featured" : "") +
      (area.pending ? " is-pending" : "") +
      '"' +
      nav +
      ">" +
      '<span class="topics-theme-card__idx dua-theme-card__idx" aria-hidden="true">' +
      area.nr +
      "</span>" +
      '<div class="topics-theme-card__icon dua-theme-card__icon" aria-hidden="true">' +
      markSvg(area.mark) +
      "</div>" +
      '<div class="topics-theme-card__body dua-theme-card__body"><h3>' +
      esc(area.title) +
      "</h3>" +
      '<p class="topics-theme-card__count dua-theme-card__count">' +
      esc(meta) +
      "</p></div>" +
      '<span class="topics-theme-card__chev dua-theme-card__chev" aria-hidden="true">›</span>' +
      "</article>"
    );
  }

  function sucheUeberall(q) {
    if (!q) return [];
    var out = [];
    offeneAbschnitte().forEach(function (ab) {
      sichtbare((cacheFor(ab) || {}).eintraege).forEach(function (e) {
        var hay = [
          e.name,
          titelVon(e),
          vorschauVon(e),
          e.vollstaendigeAussage,
          e.inhalt,
          lehreVon(e),
          e.quellenanzeige,
          e.bereich,
          hatDirektnachweis(e) ? "direktnachweis" : "",
          (e.schlagwoerter || []).join(" ")
        ]
          .join(" ")
          .toLowerCase();
        if (hay.indexOf(q) !== -1) out.push({ e: e, abschnitt: ab });
      });
    });
    return out;
  }

  function renderHub() {
    var areas = hubAreas();
    var themen = [{ id: "alle", label: "Alle" }].concat(
      areas
        .filter(function (a) {
          return a.id;
        })
        .map(function (a) {
          return { id: a.id, label: a.title };
        })
    );
    var q = currentQ("hub");
    var thema = currentThema("hub");
    var treffer = q ? sucheUeberall(q) : [];
    var liste = q
      ? treffer.length
        ? '<div class="topics-hub__label"><b>Treffer</b><span>' +
          treffer.length +
          "</span></div>" +
          '<section class="post-grid topic-collection frauen-post-list">' +
          treffer
            .map(function (t) {
              return listCard(t.e, t.abschnitt);
            })
            .join("") +
          "</section>"
        : '<p class="frauen-empty">Keine passende Aussage.</p>'
      : '<div class="topics-hub__label"><b>Themen</b><span>' +
        areas.length +
        " Bereiche</span></div>" +
        '<section class="category-cluster"><h3>Hauptbereiche</h3>' +
        '<div class="topics-theme-grid grid-list frauen-fiqh-list" aria-label="Hauptbereiche">' +
        areas
          .map(function (a) {
            return hubRow(a);
          })
          .join("") +
        "</div></section>";
    return (
      '<div class="topics-hub frauen-hub">' +
      searchPanel("hub", themen, q, thema, "Suche nach Aussage, Thema oder Quelle…") +
      liste +
      "</div>"
    );
  }

  function filterBlock(abschnitt, themen, q, thema) {
    var suchePlatz =
      abschnitt === FAQ_SLUG
        ? "Frage oder Thema suchen"
        : filterOben(abschnitt)
        ? "Thema suchen"
        : abschnitt === KURZ_SLUG || abschnitt === SALAF_SLUG
        ? "Name oder Thema suchen"
        : abschnitt === EHE_SLUG || abschnitt === HIJAB_SLUG || abschnitt === WISSEN_SLUG
        ? "Thema suchen"
        : abschnitt === "fiqh"
          ? "Thema oder Begriff suchen"
          : "Name oder Thema suchen";
    return searchPanel(abschnitt, themen, q, thema, suchePlatz);
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
                  : abschnitt === FAQ_SLUG
                    ? FAQ_BEREICH_LABEL
                    : abschnitt === KURZ_SLUG
                      ? KURZ_BEREICH_LABEL
                      : abschnitt === SALAF_SLUG
                        ? SALAF_BEREICH_LABEL
                        : abschnitt === MOSCHEE_SLUG
                          ? MOSCHEE_BEREICH_LABEL
                          : abschnitt === HAJJ_SLUG
                            ? HAJJ_BEREICH_LABEL
                            : abschnitt === SADAQAH_SLUG
                              ? SADAQAH_BEREICH_LABEL
                              : abschnitt === ADAB_SLUG
                                ? ADAB_BEREICH_LABEL
                                : abschnitt === KINDER_SLUG
                                  ? KINDER_BEREICH_LABEL
                                  : abschnitt === MUSLIMAH_SLUG
                                    ? MUSLIMAH_BEREICH_LABEL
                                    : abschnitt === NIFAS_SLUG
                                      ? NIFAS_BEREICH_LABEL
                                      : abschnitt === DIENST_SLUG
                                        ? DIENST_BEREICH_LABEL
                  : FIQH_BEREICH_LABEL;
    var bereich = labelMap[e.bereich] || e.bereich || "";
    var person = e.person || e.name;
    var aussageText = vorschauVon(e) || String(aussageVon(e) || "").replace(/\s+/g, " ").trim();
    if (aussageText.length > 140) aussageText = aussageText.slice(0, 138).replace(/\s+\S*$/, "") + "…";
    return (
      '<article class="post-row dua-row frauen-post-row" data-nav="frauen" data-value="' +
      esc(abschnitt + "/" + e.kennung) +
      '">' +
      '<div class="post-row__icon dua-row__icon" aria-hidden="true">' +
      markSvg(markForAbschnitt(abschnitt)) +
      "</div>" +
      '<div class="post-row__body dua-row__body">' +
      "<h3>" +
      esc(titelVon(e)) +
      "</h3>" +
      (person
        ? '<p class="frauen-row__sprecher">' + esc(person) + (abschnitt === SALAF_SLUG || abschnitt === KURZ_SLUG || abschnitt === MUETTER_SLUG || filterOben(abschnitt) ? "" : " sagte:") + "</p>"
        : "") +
      (aussageText
        ? '<p class="frauen-row__aussage">' + esc(aussageText) + "</p>"
        : "") +
      (quelleKurz(e)
        ? '<p class="frauen-row__quelle">' + esc(quelleKurz(e)) + "</p>"
        : "") +
      '<div class="post-row__meta dua-row__meta">' +
      (bereich ? "<span>" + esc(bereich) + "</span>" : "") +
      "<span>" +
      esc(quellenstatusSicht(e)) +
      "</span></div></div></article>"
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
                  : abschnitt === FAQ_SLUG
                    ? FAQ_THEMEN
                    : abschnitt === KURZ_SLUG
                      ? KURZ_THEMEN
                      : abschnitt === SALAF_SLUG
                        ? SALAF_THEMEN
                        : abschnitt === MOSCHEE_SLUG
                          ? MOSCHEE_THEMEN
                          : abschnitt === HAJJ_SLUG
                            ? HAJJ_THEMEN
                            : abschnitt === SADAQAH_SLUG
                              ? SADAQAH_THEMEN
                              : abschnitt === ADAB_SLUG
                                ? ADAB_THEMEN
                                : abschnitt === KINDER_SLUG
                                  ? KINDER_THEMEN
                                  : abschnitt === MUSLIMAH_SLUG
                                    ? MUSLIMAH_THEMEN
                                    : abschnitt === NIFAS_SLUG
                                      ? NIFAS_THEMEN
                                      : abschnitt === DIENST_SLUG
                                        ? DIENST_THEMEN
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
          abschnitt === WISSEN_SLUG ||
          abschnitt === FAQ_SLUG ||
          abschnitt === KURZ_SLUG ||
          abschnitt === SALAF_SLUG ||
          abschnitt === MOSCHEE_SLUG ||
          abschnitt === HAJJ_SLUG ||
          abschnitt === SADAQAH_SLUG ||
          abschnitt === ADAB_SLUG ||
          abschnitt === KINDER_SLUG ||
          abschnitt === MUSLIMAH_SLUG ||
          abschnitt === NIFAS_SLUG ||
          abschnitt === DIENST_SLUG
        ? '<p class="frauen-empty">Noch keine geprüften Inhalte vorhanden.</p>'
        : '<p class="frauen-empty">Keine sichtbare Aussage zu dieser Auswahl.</p>';
    var hint =
      leerBereich
        ? ""
        : abschnitt === SALAF_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte. Historische und biografische Berichte bleiben verborgen, bis sie einzeln geprüft und freigegeben wurden.</p></div>'
          : abschnitt === MOSCHEE_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Fragen zu gemischten Orten, Reisen, Veranstaltungen, Arbeit, Studium und moderner Öffentlichkeit werden erst sichtbar, wenn sie einzeln geprüft wurden.</p></div>'
          : abschnitt === HAJJ_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Sensible Detailfragen wie Reise ohne Maḥram, heutige Gruppenreisen, Medikamente, Sonderfälle bei Ṭawāf und individuelle Ḥayḍ-Fragen werden erst sichtbar, wenn sie einzeln geprüft wurden.</p></div>'
          : abschnitt === SADAQAH_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Emotionale Geschichten, moderne Spendenaufrufe und ungeprüfte Berichte werden nicht angezeigt.</p></div>'
          : abschnitt === ADAB_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Moderne Motivationssprüche, persönliche Meinungen und ungeprüfte Zitate werden nicht angezeigt.</p></div>'
          : abschnitt === KINDER_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Moderne Erziehungsmodelle, psychologische Ratschläge und ungeprüfte Aussagen werden nicht angezeigt.</p></div>'
          : abschnitt === MUSLIMAH_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Moderne Frauenbilder, ungeprüfte Ratschläge und schwache Berichte werden nicht angezeigt.</p></div>'
          : abschnitt === NIFAS_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Medizinische Fragen, Einzelfälle, Fasten-Details, Fidya und Sonderfälle bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === DIENST_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Fragen zu heutigen Pflegeberufen, Krankenhäusern, Rettungsdienst, Arbeit mit Männern, Vereinen, Unterricht, Krieg, Politik und öffentlicher Tätigkeit bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === KURZ_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich enthält keine ausgeschmückten Geschichten. Sichtbar sind nur Kurzberichte mit geprüfter Quelle und Direktnachweis. Alles Unsichere bleibt verborgen.</p></div>'
          : abschnitt === FAQ_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Antworten. Sensible Detailfragen bleiben verborgen, bis sie einzeln mit Quellen und Meinungsunterschieden geprüft wurden.</p></div>'
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
      abschnitt === SALAF_SLUG
        ? '<p class="lede">Geprüfte Aussagen, Berichte und Lehren über rechtschaffene Frauen der frühen Generationen – mit Quelle und Direktnachweis.</p>'
        : abschnitt === MOSCHEE_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah über Moschee, Eid und Adab.</p>'
        : abschnitt === HAJJ_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah über Frauen bei Ḥajj und ʿUmrah.</p>'
        : abschnitt === SADAQAH_SLUG
        ? '<p class="lede">Geprüfte Berichte aus authentischer Sunnah über Ṣadaqah, Fürsorge und wohltätiges Handeln.</p>'
        : abschnitt === ADAB_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah über gutes Benehmen, Sprache, Sanftmut und Selbstbeherrschung.</p>'
        : abschnitt === KINDER_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah über Verantwortung, Fürsorge und gerechten Umgang mit Kindern.</p>'
        : abschnitt === MUSLIMAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah über Dīn, Verantwortung, Charakter und rechtschaffenen Umgang.</p>'
        : abschnitt === NIFAS_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān und Sunnah – ohne medizinische Ratschläge und ohne ungeprüfte Detail-Fatwas.</p>'
        : abschnitt === DIENST_SLUG
        ? '<p class="lede">Geprüfte Berichte aus authentischer Sunnah und später ergänzten Āthār – ohne moderne Berufsurteile.</p>'
        : abschnitt === KURZ_SLUG
        ? '<p class="lede">Kurze belegte Ereignisse aus dem Leben rechtschaffener Frauen – mit Quelle und Direktnachweis.</p>'
        : abschnitt === FAQ_SLUG
        ? '<p class="lede">Kurze geprüfte Antworten zu Reinigung, Gebet, Fasten, Wissen und Alltag – mit Quelle und Direktnachweis.</p>'
        : abschnitt === WISSEN_SLUG
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
      '<div class="topic-collection-page frauen-list-page">' +
      hint +
      filterBlock(abschnitt, themen, q, thema) +
      (items.length
        ? '<section class="post-grid topic-collection frauen-post-list" aria-label="Aussagen">' +
          items.map(function (e) {
            return listCard(e, abschnitt);
          }).join("") +
          "</section>"
        : emptyHtml) +
      "</div>"
    );
  }

  function bereichKicker(abschnitt) {
    if (abschnitt === SALAF_SLUG) return "Frauen der Salaf";
    if (abschnitt === MOSCHEE_SLUG) return "Moschee & Gemeinschaft";
    if (abschnitt === HAJJ_SLUG) return "Ḥajj & ʿUmrah";
    if (abschnitt === SADAQAH_SLUG) return "Ṣadaqah & Wohltätigkeit";
    if (abschnitt === ADAB_SLUG) return "Adab & Charakter";
    if (abschnitt === KINDER_SLUG) return "Kinder & Erziehung";
    if (abschnitt === MUSLIMAH_SLUG) return "Rechtschaffene Muslimah";
    if (abschnitt === NIFAS_SLUG) return "Schwangerschaft, Stillzeit & Nifās";
    if (abschnitt === DIENST_SLUG) return "Dienst am Guten, Pflege & Hilfeleistung";
    if (abschnitt === KURZ_SLUG) return "Geprüfte Kurzberichte";
    if (abschnitt === FAQ_SLUG) return "Fragen & Antworten";
    if (abschnitt === WISSEN_SLUG) return "Wissen & Lernen";
    if (abschnitt === HIJAB_SLUG) return "Ḥijāb & Schamhaftigkeit";
    if (abschnitt === EHE_SLUG) return "Ehe & Familie";
    if (abschnitt === MUETTER_SLUG) return "Mütter der Gläubigen";
    if (abschnitt === "tabiiyyat") return "Tābiʿiyyāt";
    if (abschnitt === "sahabiyyat") return "Ṣaḥābiyyāt";
    return "Fiqh der Frauen";
  }

  function narratorLine(e, abschnitt) {
    var raw = String(e.person || e.name || e.ueberliefertVon || e.sprecher || "").trim();
    if (!raw) return "";
    if (abschnitt === MUETTER_SLUG || abschnitt === KURZ_SLUG || abschnitt === SALAF_SLUG) {
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
      if (istFaq(abschnitt)) return '<p class="frauen-empty">Diese Antwort ist nicht sichtbar.</p>';
      if (istKurz(abschnitt)) return '<p class="frauen-empty">Dieser Bericht ist nicht sichtbar.</p>';
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
    var quelleBlock =
      sep +
      '<div class="post-source-oval post-source-module"><div class="post-reader-cite"><b>Quelle</b>' +
      '<div data-post-after-source>' +
      esc(quelleText(e)) +
      "</div></div>" +
      nachweiseDirekt(e) +
      "</div>";
    var nachBericht = istKurz(abschnitt) || abschnitt === DIENST_SLUG ? lehreHtml + quelleBlock : quelleBlock + lehreHtml;
    return (
      '<article class="article post-reader">' +
      '<header class="post-reader-title"><div class="kicker">' +
      esc(bereichKicker(abschnitt)) +
      "</div><h2>" +
      esc(titelVon(e)) +
      "</h2></header>" +
      '<section class="post-reader-main">' +
      narratorLine(e, abschnitt) +
      '<section class="statement post-aussage"><div class="post-aussage-kicker">' +
      esc(aussageKicker(abschnitt)) +
      "</div>" +
      '<div class="post-aussage-text">' +
      esc(aussageVon(e)) +
      "</div></section>" +
      nachBericht +
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
    if (parsed.abschnitt === SALAF_SLUG && parsed.page === "list") {
      return {
        title: "Frauen der Salaf",
        subtitle: "Geprüfte Aussagen, Berichte und Lehren über rechtschaffene Frauen der frühen Generationen – mit Quelle und Direktnachweis."
      };
    }
    if (parsed.abschnitt === MOSCHEE_SLUG && parsed.page === "list") {
      return {
        title: "Moschee & Gemeinschaft",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah über Moschee, Eid und Adab."
      };
    }
    if (parsed.abschnitt === HAJJ_SLUG && parsed.page === "list") {
      return {
        title: "Ḥajj & ʿUmrah",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah über Frauen bei Ḥajj und ʿUmrah."
      };
    }
    if (parsed.abschnitt === SADAQAH_SLUG && parsed.page === "list") {
      return {
        title: "Ṣadaqah & Wohltätigkeit",
        subtitle: "Geprüfte Berichte aus authentischer Sunnah über Ṣadaqah, Fürsorge und wohltätiges Handeln."
      };
    }
    if (parsed.abschnitt === ADAB_SLUG && parsed.page === "list") {
      return {
        title: "Adab & Charakter",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah über gutes Benehmen, Sprache, Sanftmut und Selbstbeherrschung."
      };
    }
    if (parsed.abschnitt === KINDER_SLUG && parsed.page === "list") {
      return {
        title: "Kinder & Erziehung",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah über Verantwortung, Fürsorge und gerechten Umgang mit Kindern."
      };
    }
    if (parsed.abschnitt === MUSLIMAH_SLUG && parsed.page === "list") {
      return {
        title: "Rechtschaffene Muslimah",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und authentischer Sunnah über Dīn, Verantwortung, Charakter und rechtschaffenen Umgang."
      };
    }
    if (parsed.abschnitt === NIFAS_SLUG && parsed.page === "list") {
      return {
        title: "Schwangerschaft, Stillzeit & Nifās",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und Sunnah – ohne medizinische Ratschläge und ohne ungeprüfte Detail-Fatwas."
      };
    }
    if (parsed.abschnitt === DIENST_SLUG && parsed.page === "list") {
      return {
        title: "Dienst am Guten, Pflege & Hilfeleistung",
        subtitle: "Geprüfte Berichte aus authentischer Sunnah und später ergänzten Āthār – ohne moderne Berufsurteile."
      };
    }
    if (parsed.abschnitt === KURZ_SLUG && parsed.page === "list") {
      return {
        title: "Geprüfte Kurzberichte",
        subtitle: "Kurze belegte Ereignisse aus dem Leben rechtschaffener Frauen – mit Quelle und Direktnachweis."
      };
    }
    if (parsed.abschnitt === FAQ_SLUG && parsed.page === "list") {
      return {
        title: "Fragen & Antworten",
        subtitle: "Kurze geprüfte Antworten zu Reinigung, Gebet, Fasten, Wissen und Alltag – mit Quelle und Direktnachweis."
      };
    }
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
          parsed.abschnitt === SALAF_SLUG
            ? "Frauen der Salaf"
            : parsed.abschnitt === MOSCHEE_SLUG
            ? "Moschee & Gemeinschaft"
            : parsed.abschnitt === HAJJ_SLUG
            ? "Ḥajj & ʿUmrah"
            : parsed.abschnitt === SADAQAH_SLUG
            ? "Ṣadaqah & Wohltätigkeit"
            : parsed.abschnitt === ADAB_SLUG
            ? "Adab & Charakter"
            : parsed.abschnitt === KINDER_SLUG
            ? "Kinder & Erziehung"
            : parsed.abschnitt === MUSLIMAH_SLUG
            ? "Rechtschaffene Muslimah"
            : parsed.abschnitt === NIFAS_SLUG
            ? "Schwangerschaft, Stillzeit & Nifās"
            : parsed.abschnitt === DIENST_SLUG
            ? "Dienst am Guten, Pflege & Hilfeleistung"
            : parsed.abschnitt === KURZ_SLUG
            ? "Geprüfte Kurzberichte"
            : parsed.abschnitt === FAQ_SLUG
            ? "Fragen & Antworten"
            : parsed.abschnitt === WISSEN_SLUG
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
        subtitle: parsed.abschnitt === FAQ_SLUG
          ? "Antwort · Quelle und Direktnachweis"
          : parsed.abschnitt === KURZ_SLUG
          ? "Bericht · Quelle und Direktnachweis"
          : "Aussage · Quelle und Direktnachweis"
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
      !wissenCache ||
      !faqCache ||
      !kurzCache ||
      !salafCache ||
      !moscheeCache ||
      !hajjCache ||
      !sadaqahCache ||
      !adabCache ||
      !kinderCache ||
      !muslimahCache ||
      !nifasCache ||
      !dienstCache
    ) {
      load().then(refreshIfFrauen).catch(refreshIfFrauen);
      return '<p class="frauen-empty">Bereich wird geladen…</p>';
    }
    if (parsed.page === "hub") {
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
    var toggle = ev.target && ev.target.closest ? ev.target.closest("[data-frauen-filter-toggle]") : null;
    if (toggle) {
      ev.preventDefault();
      filterOpen = !filterOpen;
      refreshIfFrauen();
      return;
    }
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
