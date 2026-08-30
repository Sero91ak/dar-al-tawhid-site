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
  var IDDAH_URL = "/test/data/frauen-iddah-scheidung-trauerzeit.json";
  var IDDAH_SLUG = "iddah-scheidung-trauerzeit";
  var REINIGUNG_URL = "/test/data/frauen-reinigung-gebet-fasten.json";
  var REINIGUNG_SLUG = "reinigung-gebet-fasten";
  var NIKAH_URL = "/test/data/frauen-nikah-zustimmung-mahr.json";
  var NIKAH_SLUG = "nikah-zustimmung-mahr";
  var ZINAH_URL = "/test/data/frauen-zinah-schmuck-kleidung.json";
  var ZINAH_SLUG = "zinah-schmuck-kleidung";
  var UMGANG_URL = "/test/data/frauen-umgang-nicht-maharim.json";
  var UMGANG_SLUG = "umgang-nicht-maharim";
  var REISE_URL = "/test/data/frauen-reise-mahram-schutz.json";
  var REISE_SLUG = "reise-mahram-schutz";
  var KRANKHEIT_URL = "/test/data/frauen-krankheit-pruefung-geduld.json";
  var KRANKHEIT_SLUG = "krankheit-pruefung-geduld";
  var PRIVAT_URL = "/test/data/frauen-privatsphaere-erlaubnis-haus-adab.json";
  var PRIVAT_SLUG = "privatsphaere-erlaubnis-haus-adab";
  var VERWANDT_URL = "/test/data/frauen-verwandtschaft-nachbarschaft-gastrecht.json";
  var VERWANDT_SLUG = "verwandtschaft-nachbarschaft-gastrecht";
  var TAWHID_URL = "/test/data/frauen-tawhid-iman-ibadah.json";
  var TAWHID_SLUG = "tawhid-iman-ibadah";
  var GERECHT_URL = "/test/data/frauen-gerechtigkeit-guter-umgang-schutz.json";
  var GERECHT_SLUG = "gerechtigkeit-guter-umgang-schutz";
  var DHIKR_URL = "/test/data/frauen-dhikr-dua-ibadah.json";
  var DHIKR_SLUG = "dhikr-dua-ibadah";
  var GEPRUEFT_URL = "/test/data/frauen-geprueftes-wissen-quellen-weitergabe.json";
  var GEPRUEFT_SLUG = "geprueftes-wissen-quellen-weitergabe";
  var TOD_URL = "/test/data/frauen-tod-janazah-trauer-adab.json";
  var TOD_SLUG = "tod-janazah-trauer-adab";
  var ARBEIT_URL = "/test/data/frauen-arbeit-studium-oeffentlichkeit.json";
  var ARBEIT_SLUG = "arbeit-studium-oeffentlichkeit";
  var MEDIEN_URL = "/test/data/frauen-medien-bilder-oeffentliche-darstellung.json";
  var MEDIEN_SLUG = "medien-bilder-oeffentliche-darstellung";
  var RUQYAH_URL = "/test/data/frauen-ruqyah-schutz-zuflucht.json";
  var RUQYAH_SLUG = "ruqyah-schutz-zuflucht";
  var TRAUER_URL = "/test/data/frauen-tod-janazah-trauer.json";
  var TRAUER_SLUG = "tod-janazah-trauer";
  var MAEDCHEN_URL = "/test/data/frauen-maedchen-pubertaet-pflichtwissen.json";
  var MAEDCHEN_SLUG = "maedchen-pubertaet-pflichtwissen";
  var BIDAHQ_URL = "/test/data/frauen-falsches-wissen-bidah-quellenpruefung.json";
  var BIDAHQ_SLUG = "falsches-wissen-bidah-quellenpruefung";
  var REUE_URL = "/test/data/frauen-reue-istighfar-rueckkehr.json";
  var REUE_SLUG = "reue-istighfar-rueckkehr";
  var JANAIZ_URL = "/test/data/frauen-tod-janaiz-trauer-sabr.json";
  var JANAIZ_SLUG = "tod-janaiz-trauer-sabr";
  var TAWBAH_URL = "/test/data/frauen-reue-tawbah-istighfar.json";
  var TAWBAH_SLUG = "reue-tawbah-istighfar";
  var TOECHTER_URL = "/test/data/frauen-toechter-maedchen-fuersorge.json";
  var TOECHTER_SLUG = "toechter-maedchen-fuersorge";
  var JANAZAH_URL = "/test/data/frauen-janazah-tod-trauer-adab.json";
  var JANAZAH_SLUG = "janazah-tod-trauer-adab";
  var RAMADAN_URL = "/test/data/frauen-ramadan-fasten-eid.json";
  var RAMADAN_SLUG = "ramadan-fasten-eid";
  var QIYAM_URL = "/test/data/frauen-ramadan-fasten-nachtgebet.json";
  var QIYAM_SLUG = "ramadan-fasten-nachtgebet";
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
  var IDDAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "iddah", label: "ʿIddah" },
    { id: "scheidung", label: "Scheidung" },
    { id: "trauerzeit", label: "Trauerzeit" },
    { id: "witwe", label: "Witwe" },
    { id: "eheschliessung", label: "Eheschließung" },
    { id: "adab", label: "Adab" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var IDDAH_BEREICH_LABEL = {
    iddah: "ʿIddah",
    scheidung: "Scheidung",
    trauerzeit: "Trauerzeit",
    witwe: "Witwe",
    eheschliessung: "Eheschließung",
    adab: "Adab",
    "in-pruefung": "In Prüfung"
  };
  var REINIGUNG_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "reinigung", label: "Reinigung" },
    { id: "hayd", label: "Ḥayḍ" },
    { id: "istihadah", label: "Istiḥāḍah" },
    { id: "ghusl", label: "Ghusl" },
    { id: "gebet", label: "Gebet" },
    { id: "fasten", label: "Fasten" },
    { id: "kleidung-im-gebet", label: "Kleidung im Gebet" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var REINIGUNG_BEREICH_LABEL = {
    reinigung: "Reinigung",
    hayd: "Ḥayḍ",
    istihadah: "Istiḥāḍah",
    ghusl: "Ghusl",
    gebet: "Gebet",
    fasten: "Fasten",
    "kleidung-im-gebet": "Kleidung im Gebet",
    "in-pruefung": "In Prüfung"
  };
  var NIKAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "nikah", label: "Nikāḥ" },
    { id: "zustimmung", label: "Zustimmung" },
    { id: "mahr", label: "Mahr" },
    { id: "deen", label: "Dīn" },
    { id: "kein-zwang", label: "Kein Zwang" },
    { id: "adab", label: "Adab" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var NIKAH_BEREICH_LABEL = {
    nikah: "Nikāḥ",
    zustimmung: "Zustimmung",
    mahr: "Mahr",
    deen: "Dīn",
    "kein-zwang": "Kein Zwang",
    adab: "Adab",
    "in-pruefung": "In Prüfung"
  };
  var ZINAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "hidschab", label: "Ḥidschāb" },
    { id: "kleidung", label: "Kleidung" },
    { id: "schmuck", label: "Schmuck" },
    { id: "duft", label: "Duft" },
    { id: "tabarrudsch", label: "Tabarrudsch" },
    { id: "adab", label: "Adab" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var ZINAH_BEREICH_LABEL = {
    hidschab: "Ḥidschāb",
    kleidung: "Kleidung",
    schmuck: "Schmuck",
    duft: "Duft",
    tabarrudsch: "Tabarrudsch",
    adab: "Adab",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var UMGANG_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "khalwah", label: "Khalwah" },
    { id: "blicken", label: "Blicken" },
    { id: "rede", label: "Rede" },
    { id: "haus", label: "Haus" },
    { id: "adab", label: "Adab" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var UMGANG_BEREICH_LABEL = {
    khalwah: "Khalwah",
    blicken: "Blicken",
    rede: "Rede",
    haus: "Haus",
    adab: "Adab",
    "in-pruefung": "In Prüfung"
  };
  var REISE_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "reise", label: "Reise" },
    { id: "hajj", label: "Ḥajj" },
    { id: "khalwah", label: "Khalwah" },
    { id: "mahram", label: "Maḥram" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var REISE_BEREICH_LABEL = {
    reise: "Reise",
    hajj: "Ḥajj",
    khalwah: "Khalwah",
    mahram: "Maḥram",
    "in-pruefung": "In Prüfung"
  };
  var KRANKHEIT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "pruefung", label: "Prüfung" },
    { id: "krankheit", label: "Krankheit" },
    { id: "geduld", label: "Geduld" },
    { id: "duaa", label: "Duʿāʾ" },
    { id: "suendenvergebung", label: "Sündenvergebung" },
    { id: "hoffnung", label: "Hoffnung" },
    { id: "dankbarkeit", label: "Dankbarkeit" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var KRANKHEIT_BEREICH_LABEL = {
    pruefung: "Prüfung",
    krankheit: "Krankheit",
    geduld: "Geduld",
    duaa: "Duʿāʾ",
    suendenvergebung: "Sündenvergebung",
    hoffnung: "Hoffnung",
    dankbarkeit: "Dankbarkeit",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var PRIVAT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "erlaubnis", label: "Erlaubnis" },
    { id: "salam", label: "Salām" },
    { id: "blickschutz", label: "Blickschutz" },
    { id: "haus-adab", label: "Haus-Adab" },
    { id: "privatsphaere", label: "Privatsphäre" },
    { id: "besuch", label: "Besuch" },
    { id: "rueckkehr", label: "Rückkehr" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var PRIVAT_BEREICH_LABEL = {
    erlaubnis: "Erlaubnis",
    salam: "Salām",
    blickschutz: "Blickschutz",
    "haus-adab": "Haus-Adab",
    privatsphaere: "Privatsphäre",
    besuch: "Besuch",
    rueckkehr: "Rückkehr",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var VERWANDT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "verwandtschaft", label: "Verwandtschaft" },
    { id: "nachbarn", label: "Nachbarn" },
    { id: "gaeste", label: "Gäste" },
    { id: "eltern", label: "Eltern" },
    { id: "waisen", label: "Waisen" },
    { id: "arme", label: "Arme" },
    { id: "gutes-sprechen", label: "Gutes Sprechen" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var VERWANDT_BEREICH_LABEL = {
    verwandtschaft: "Verwandtschaft",
    nachbarn: "Nachbarn",
    gaeste: "Gäste",
    eltern: "Eltern",
    waisen: "Waisen",
    arme: "Arme",
    "gutes-sprechen": "Gutes Sprechen",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var TAWHID_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "tawhid", label: "Tawḥīd" },
    { id: "iman", label: "Īmān" },
    { id: "islam", label: "Islām" },
    { id: "ihsan", label: "Iḥsān" },
    { id: "ibadah", label: "ʿIbādah" },
    { id: "ikhlas", label: "Ikhlāṣ" },
    { id: "taqwa", label: "Taqwā" },
    { id: "dhikr", label: "Dhikr" },
    { id: "rechtschaffene-tat", label: "Rechtschaffene Tat" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var TAWHID_BEREICH_LABEL = {
    tawhid: "Tawḥīd",
    iman: "Īmān",
    islam: "Islām",
    ihsan: "Iḥsān",
    ibadah: "ʿIbādah",
    ikhlas: "Ikhlāṣ",
    taqwa: "Taqwā",
    dhikr: "Dhikr",
    "rechtschaffene-tat": "Rechtschaffene Tat",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var GERECHT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "maaruf", label: "Maʿrūf" },
    { id: "guter-umgang", label: "Guter Umgang" },
    { id: "ihsan", label: "Iḥsān" },
    { id: "zulm", label: "Ẓulm" },
    { id: "familie", label: "Familie" },
    { id: "ehe-adab", label: "Ehe-Adab" },
    { id: "geduld", label: "Geduld" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var GERECHT_BEREICH_LABEL = {
    maaruf: "Maʿrūf",
    "guter-umgang": "Guter Umgang",
    ihsan: "Iḥsān",
    zulm: "Ẓulm",
    familie: "Familie",
    "ehe-adab": "Ehe-Adab",
    geduld: "Geduld",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var DHIKR_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "dhikr", label: "Dhikr" },
    { id: "dua", label: "Duʿāʾ" },
    { id: "tasbih", label: "Tasbīḥ" },
    { id: "schlaf-dhikr", label: "Schlaf-Dhikr" },
    { id: "laylatul-qadr", label: "Laylat al-Qadr" },
    { id: "taegliche-ibadah", label: "Tägliche ʿIbādah" },
    { id: "sahabiyyat", label: "Ṣaḥābiyyāt" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var DHIKR_BEREICH_LABEL = {
    dhikr: "Dhikr",
    dua: "Duʿāʾ",
    tasbih: "Tasbīḥ",
    "schlaf-dhikr": "Schlaf-Dhikr",
    "laylatul-qadr": "Laylat al-Qadr",
    "taegliche-ibadah": "Tägliche ʿIbādah",
    sahabiyyat: "Ṣaḥābiyyāt",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var GEPRUEFT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "wissen", label: "Wissen" },
    { id: "fragen", label: "Fragen" },
    { id: "weitergabe", label: "Weitergabe" },
    { id: "sunnah", label: "Sunnah" },
    { id: "bidah", label: "Bidʿah" },
    { id: "quellenpruefung", label: "Quellenprüfung" },
    { id: "luege-prophet", label: "Lüge über den Propheten ﷺ" },
    { id: "sahabiyyat", label: "Ṣaḥābiyyāt" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var GEPRUEFT_BEREICH_LABEL = {
    wissen: "Wissen",
    fragen: "Fragen",
    weitergabe: "Weitergabe",
    sunnah: "Sunnah",
    bidah: "Bidʿah",
    quellenpruefung: "Quellenprüfung",
    "luege-prophet": "Lüge über den Propheten ﷺ",
    sahabiyyat: "Ṣaḥābiyyāt",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var TOD_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "tod", label: "Tod" },
    { id: "janazah", label: "Janāzah" },
    { id: "waschen-verstorbener", label: "Waschen Verstorbener" },
    { id: "trauer", label: "Trauer" },
    { id: "ihdad", label: "Iḥdād" },
    { id: "friedhof", label: "Friedhof" },
    { id: "geduld", label: "Geduld" },
    { id: "sahabiyyat", label: "Ṣaḥābiyyāt" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var TOD_BEREICH_LABEL = {
    tod: "Tod",
    janazah: "Janāzah",
    "waschen-verstorbener": "Waschen Verstorbener",
    trauer: "Trauer",
    ihdad: "Iḥdād",
    friedhof: "Friedhof",
    geduld: "Geduld",
    sahabiyyat: "Ṣaḥābiyyāt",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var ARBEIT_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "arbeit", label: "Arbeit" },
    { id: "studium", label: "Studium" },
    { id: "lernen", label: "Lernen" },
    { id: "oeffentlichkeit", label: "Öffentlichkeit" },
    { id: "grenzen", label: "Grenzen" },
    { id: "nutzen", label: "Nutzen" },
    { id: "nicht-maharim", label: "Nicht-Maḥārim" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var ARBEIT_BEREICH_LABEL = {
    arbeit: "Arbeit",
    studium: "Studium",
    lernen: "Lernen",
    oeffentlichkeit: "Öffentlichkeit",
    grenzen: "Grenzen",
    nutzen: "Nutzen",
    "nicht-maharim": "Nicht-Maḥārim",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var MEDIEN_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "bilder", label: "Bilder" },
    { id: "stimme", label: "Stimme" },
    { id: "videos", label: "Videos" },
    { id: "schreiben", label: "Schreiben" },
    { id: "social-media", label: "Soziale Medien" },
    { id: "oeffentlichkeit", label: "Öffentlichkeit" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var MEDIEN_BEREICH_LABEL = {
    bilder: "Bilder",
    stimme: "Stimme",
    videos: "Videos",
    schreiben: "Schreiben",
    "social-media": "Soziale Medien",
    oeffentlichkeit: "Öffentlichkeit",
    schamhaftigkeit: "Schamhaftigkeit",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var RUQYAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "zuflucht", label: "Zuflucht" },
    { id: "ruqyah", label: "Ruqyah" },
    { id: "al-falaq", label: "al-Falaq" },
    { id: "an-nas", label: "an-Nās" },
    { id: "schlaf", label: "Schlaf" },
    { id: "krankheit", label: "Krankheit" },
    { id: "schutz", label: "Schutz" },
    { id: "shirk-grenze", label: "Širk-Grenze" },
    { id: "sahabiyyat", label: "Ṣaḥābiyyāt" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var RUQYAH_BEREICH_LABEL = {
    zuflucht: "Zuflucht",
    ruqyah: "Ruqyah",
    "al-falaq": "al-Falaq",
    "an-nas": "an-Nās",
    schlaf: "Schlaf",
    krankheit: "Krankheit",
    schutz: "Schutz",
    "shirk-grenze": "Širk-Grenze",
    sahabiyyat: "Ṣaḥābiyyāt",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var TRAUER_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "tod", label: "Tod" },
    { id: "janazah", label: "Janāzah" },
    { id: "trauer", label: "Trauer" },
    { id: "dua", label: "Duʿāʾ" },
    { id: "ihdad", label: "Iḥdād" },
    { id: "weinen", label: "Weinen" },
    { id: "geduld", label: "Geduld" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var TRAUER_BEREICH_LABEL = {
    tod: "Tod",
    janazah: "Janāzah",
    trauer: "Trauer",
    dua: "Duʿāʾ",
    ihdad: "Iḥdād",
    weinen: "Weinen",
    geduld: "Geduld",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var MAEDCHEN_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "pflichtwissen", label: "Pflichtwissen" },
    { id: "pubertaet", label: "Pubertät" },
    { id: "gebet", label: "Gebet" },
    { id: "hayd", label: "Ḥayḍ" },
    { id: "schamhaftigkeit", label: "Schamhaftigkeit" },
    { id: "lernen", label: "Lernen" },
    { id: "erziehung", label: "Erziehung" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var MAEDCHEN_BEREICH_LABEL = {
    pflichtwissen: "Pflichtwissen",
    pubertaet: "Pubertät",
    gebet: "Gebet",
    hayd: "Ḥayḍ",
    schamhaftigkeit: "Schamhaftigkeit",
    lernen: "Lernen",
    erziehung: "Erziehung",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var BIDAHQ_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "quellenpruefung", label: "Quellenprüfung" },
    { id: "bidah", label: "Bidʿah" },
    { id: "schwache-berichte", label: "Schwache Berichte" },
    { id: "erfundene-aussagen", label: "Erfundene Aussagen" },
    { id: "social-media", label: "Soziale Medien" },
    { id: "wissen", label: "Wissen" },
    { id: "salaf", label: "Salaf" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var BIDAHQ_BEREICH_LABEL = {
    quellenpruefung: "Quellenprüfung",
    bidah: "Bidʿah",
    "schwache-berichte": "Schwache Berichte",
    "erfundene-aussagen": "Erfundene Aussagen",
    "social-media": "Soziale Medien",
    wissen: "Wissen",
    salaf: "Salaf",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var REUE_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "reue", label: "Reue" },
    { id: "istighfar", label: "Istighfār" },
    { id: "hoffnung", label: "Hoffnung" },
    { id: "keine-verzweiflung", label: "Keine Verzweiflung" },
    { id: "tawbah-nasuh", label: "Tawbah naṣūḥ" },
    { id: "suendenvergebung", label: "Sündenvergebung" },
    { id: "rueckkehr", label: "Rückkehr zu Allah" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var REUE_BEREICH_LABEL = {
    reue: "Reue",
    istighfar: "Istighfār",
    hoffnung: "Hoffnung",
    "keine-verzweiflung": "Keine Verzweiflung",
    "tawbah-nasuh": "Tawbah naṣūḥ",
    suendenvergebung: "Sündenvergebung",
    rueckkehr: "Rückkehr zu Allah",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var JANAIZ_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "musibah", label: "Muṣībah" },
    { id: "sabr", label: "Ṣabr" },
    { id: "trauer", label: "Trauer" },
    { id: "erlaubtes-weinen", label: "Erlaubtes Weinen" },
    { id: "verbotene-klage", label: "Verbotene Klage" },
    { id: "janaiz", label: "Janāʾiz" },
    { id: "umm-atiyyah", label: "Umm ʿAṭiyyah" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var JANAIZ_BEREICH_LABEL = {
    musibah: "Muṣībah",
    sabr: "Ṣabr",
    trauer: "Trauer",
    "erlaubtes-weinen": "Erlaubtes Weinen",
    "verbotene-klage": "Verbotene Klage",
    janaiz: "Janāʾiz",
    "umm-atiyyah": "Umm ʿAṭiyyah",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var TAWBAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "tawbah", label: "Tawbah" },
    { id: "istighfar", label: "Istighfār" },
    { id: "barmherzigkeit", label: "Barmherzigkeit" },
    { id: "tawbah-nasuh", label: "Tawbah Naṣūḥ" },
    { id: "sayyid-al-istighfar", label: "Sayyid al-Istighfār" },
    { id: "hoffnung", label: "Hoffnung" },
    { id: "reue", label: "Reue" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var TAWBAH_BEREICH_LABEL = {
    tawbah: "Tawbah",
    istighfar: "Istighfār",
    barmherzigkeit: "Barmherzigkeit",
    "tawbah-nasuh": "Tawbah Naṣūḥ",
    "sayyid-al-istighfar": "Sayyid al-Istighfār",
    hoffnung: "Hoffnung",
    reue: "Reue",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var TOECHTER_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "toechter", label: "Töchter" },
    { id: "maedchen", label: "Mädchen" },
    { id: "fuersorge", label: "Fürsorge" },
    { id: "barmherzigkeit", label: "Barmherzigkeit" },
    { id: "gerechtigkeit", label: "Gerechtigkeit" },
    { id: "erziehung", label: "Erziehung" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var TOECHTER_BEREICH_LABEL = {
    toechter: "Töchter",
    maedchen: "Mädchen",
    fuersorge: "Fürsorge",
    barmherzigkeit: "Barmherzigkeit",
    gerechtigkeit: "Gerechtigkeit",
    erziehung: "Erziehung",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var JANAZAH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "tod", label: "Tod" },
    { id: "trauer", label: "Trauer" },
    { id: "janazah", label: "Janāzah" },
    { id: "ihdad", label: "Iḥdād" },
    { id: "musibah", label: "Muṣībah" },
    { id: "geduld", label: "Geduld" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var JANAZAH_BEREICH_LABEL = {
    tod: "Tod",
    trauer: "Trauer",
    janazah: "Janāzah",
    ihdad: "Iḥdād",
    musibah: "Muṣībah",
    geduld: "Geduld",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var RAMADAN_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "fasten", label: "Fasten" },
    { id: "hayd", label: "Ḥayḍ" },
    { id: "laylat-al-qadr", label: "Laylat al-Qadr" },
    { id: "eid", label: "ʿĪd" },
    { id: "sadaqah", label: "Ṣadaqah" },
    { id: "schwangerschaft", label: "Schwangerschaft" },
    { id: "stillzeit", label: "Stillzeit" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var RAMADAN_BEREICH_LABEL = {
    fasten: "Fasten",
    hayd: "Ḥayḍ",
    "laylat-al-qadr": "Laylat al-Qadr",
    eid: "ʿĪd",
    sadaqah: "Ṣadaqah",
    schwangerschaft: "Schwangerschaft",
    stillzeit: "Stillzeit",
    "sahabah-athar": "Ṣaḥābah & Āthār",
    "in-pruefung": "In Prüfung"
  };
  var QIYAM_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "ramadan", label: "Ramaḍān" },
    { id: "fasten", label: "Fasten" },
    { id: "nachholen", label: "Nachholen" },
    { id: "freiwilliges-fasten", label: "Freiwilliges Fasten" },
    { id: "qiyam", label: "Qiyām" },
    { id: "letzte-zehn-naechte", label: "Letzte zehn Nächte" },
    { id: "laylat-al-qadr", label: "Laylat al-Qadr" },
    { id: "itikaf", label: "Iʿtikāf" },
    { id: "sahabiyyat", label: "Ṣaḥābiyyāt" },
    { id: "sahabah-athar", label: "Ṣaḥābah & Āthār" },
    { id: "in-pruefung", label: "In Prüfung" }
  ];
  var QIYAM_BEREICH_LABEL = {
    ramadan: "Ramaḍān",
    fasten: "Fasten",
    nachholen: "Nachholen",
    "freiwilliges-fasten": "Freiwilliges Fasten",
    qiyam: "Qiyām",
    "letzte-zehn-naechte": "Letzte zehn Nächte",
    "laylat-al-qadr": "Laylat al-Qadr",
    itikaf: "Iʿtikāf",
    sahabiyyat: "Ṣaḥābiyyāt",
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
  var iddahCache = null;
  var reinigungCache = null;
  var nikahCache = null;
  var zinahCache = null;
  var umgangCache = null;
  var reiseCache = null;
  var krankheitCache = null;
  var privatCache = null;
  var verwandtCache = null;
  var tawhidCache = null;
  var gerechtCache = null;
  var dhikrCache = null;
  var geprueftCache = null;
  var todCache = null;
  var arbeitCache = null;
  var medienCache = null;
  var ruqyahCache = null;
  var trauerCache = null;
  var maedchenCache = null;
  var bidahqCache = null;
  var reueCache = null;
  var janaizCache = null;
  var tawbahCache = null;
  var toechterCache = null;
  var janazahCache = null;
  var ramadanCache = null;
  var qiyamCache = null;
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
  var iddahQ = "";
  var reinigungQ = "";
  var nikahQ = "";
  var zinahQ = "";
  var umgangQ = "";
  var reiseQ = "";
  var krankheitQ = "";
  var privatQ = "";
  var verwandtQ = "";
  var tawhidQ = "";
  var gerechtQ = "";
  var dhikrQ = "";
  var geprueftQ = "";
  var todQ = "";
  var arbeitQ = "";
  var medienQ = "";
  var ruqyahQ = "";
  var trauerQ = "";
  var maedchenQ = "";
  var bidahqQ = "";
  var reueQ = "";
  var janaizQ = "";
  var tawbahQ = "";
  var toechterQ = "";
  var janazahQ = "";
  var ramadanQ = "";
  var qiyamQ = "";
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
  var iddahThema = "alle";
  var reinigungThema = "alle";
  var nikahThema = "alle";
  var zinahThema = "alle";
  var umgangThema = "alle";
  var reiseThema = "alle";
  var krankheitThema = "alle";
  var privatThema = "alle";
  var verwandtThema = "alle";
  var tawhidThema = "alle";
  var gerechtThema = "alle";
  var dhikrThema = "alle";
  var geprueftThema = "alle";
  var todThema = "alle";
  var arbeitThema = "alle";
  var medienThema = "alle";
  var ruqyahThema = "alle";
  var trauerThema = "alle";
  var maedchenThema = "alle";
  var bidahqThema = "alle";
  var reueThema = "alle";
  var janaizThema = "alle";
  var tawbahThema = "alle";
  var toechterThema = "alle";
  var janazahThema = "alle";
  var ramadanThema = "alle";
  var qiyamThema = "alle";
  var hubQ = "";
  var hubThema = "alle";
  var pickSprecher = "";
  var pickBuch = "";
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
      abschnitt === DIENST_SLUG ||
      abschnitt === IDDAH_SLUG ||
      abschnitt === REINIGUNG_SLUG ||
      abschnitt === NIKAH_SLUG ||
      abschnitt === ZINAH_SLUG ||
      abschnitt === UMGANG_SLUG ||
      abschnitt === REISE_SLUG ||
      abschnitt === KRANKHEIT_SLUG ||
      abschnitt === PRIVAT_SLUG ||
      abschnitt === VERWANDT_SLUG ||
      abschnitt === TAWHID_SLUG ||
      abschnitt === GERECHT_SLUG ||
      abschnitt === DHIKR_SLUG ||
      abschnitt === GEPRUEFT_SLUG ||
      abschnitt === TOD_SLUG ||
      abschnitt === ARBEIT_SLUG ||
      abschnitt === MEDIEN_SLUG ||
      abschnitt === RUQYAH_SLUG ||
      abschnitt === TRAUER_SLUG ||
      abschnitt === MAEDCHEN_SLUG ||
      abschnitt === BIDAHQ_SLUG ||
      abschnitt === REUE_SLUG ||
      abschnitt === JANAIZ_SLUG ||
      abschnitt === TAWBAH_SLUG ||
      abschnitt === TOECHTER_SLUG ||
      abschnitt === JANAZAH_SLUG ||
      abschnitt === RAMADAN_SLUG ||
      abschnitt === QIYAM_SLUG
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
    if (String(e.quellenart || "").indexOf("in-pruefung") !== -1) return false;
    if (e.quellenstatus === "nicht-anzeigen") return false;
    if (e.atharPruefung && e.quellenart === "zuverlaessiger-athar" && e.freigabeDurchSerhat !== true) return false;
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
    if (fiqhCache && sahabCache && tabiiCache && muetterCache && eheCache && hijabCache && wissenCache && faqCache && kurzCache && salafCache && moscheeCache && hajjCache && sadaqahCache && adabCache && kinderCache && muslimahCache && nifasCache && dienstCache && iddahCache && reinigungCache && nikahCache && zinahCache && umgangCache && reiseCache && krankheitCache && privatCache && verwandtCache && tawhidCache && gerechtCache && dhikrCache && geprueftCache && todCache && arbeitCache && medienCache && ruqyahCache && trauerCache && maedchenCache && bidahqCache && reueCache)
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
      fetchJson(DIENST_URL),
      fetchJson(IDDAH_URL),
      fetchJson(REINIGUNG_URL),
      fetchJson(NIKAH_URL),
      fetchJson(ZINAH_URL),
      fetchJson(UMGANG_URL),
      fetchJson(REISE_URL),
      fetchJson(KRANKHEIT_URL),
      fetchJson(PRIVAT_URL),
      fetchJson(VERWANDT_URL),
      fetchJson(TAWHID_URL),
      fetchJson(GERECHT_URL),
      fetchJson(DHIKR_URL),
      fetchJson(GEPRUEFT_URL),
      fetchJson(TOD_URL),
      fetchJson(ARBEIT_URL),
      fetchJson(MEDIEN_URL),
      fetchJson(RUQYAH_URL),
      fetchJson(TRAUER_URL),
      fetchJson(MAEDCHEN_URL),
      fetchJson(BIDAHQ_URL),
      fetchJson(REUE_URL),
      fetchJson(JANAIZ_URL),
      fetchJson(TAWBAH_URL),
      fetchJson(TOECHTER_URL),
      fetchJson(JANAZAH_URL),
      fetchJson(RAMADAN_URL),
      fetchJson(QIYAM_URL)
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
        iddahCache = pair[18];
        reinigungCache = pair[19];
        nikahCache = pair[20];
        zinahCache = pair[21];
        umgangCache = pair[22];
        reiseCache = pair[23];
        krankheitCache = pair[24];
        privatCache = pair[25];
        verwandtCache = pair[26];
        tawhidCache = pair[27];
        gerechtCache = pair[28];
        dhikrCache = pair[29];
        geprueftCache = pair[30];
        todCache = pair[31];
        arbeitCache = pair[32];
        medienCache = pair[33];
        ruqyahCache = pair[34];
        trauerCache = pair[35];
        maedchenCache = pair[36];
        bidahqCache = pair[37];
        reueCache = pair[38];
        janaizCache = pair[39];
        tawbahCache = pair[40];
        toechterCache = pair[41];
        janazahCache = pair[42];
        ramadanCache = pair[43];
        qiyamCache = pair[44];
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
    if (v === IDDAH_SLUG) return { page: "list", abschnitt: IDDAH_SLUG, kennung: "" };
    if (v.indexOf(IDDAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: IDDAH_SLUG, kennung: v.slice(IDDAH_SLUG.length + 1) };
    }
    if (v === REINIGUNG_SLUG) return { page: "list", abschnitt: REINIGUNG_SLUG, kennung: "" };
    if (v.indexOf(REINIGUNG_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: REINIGUNG_SLUG, kennung: v.slice(REINIGUNG_SLUG.length + 1) };
    }
    if (v === NIKAH_SLUG) return { page: "list", abschnitt: NIKAH_SLUG, kennung: "" };
    if (v.indexOf(NIKAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: NIKAH_SLUG, kennung: v.slice(NIKAH_SLUG.length + 1) };
    }
    if (v === ZINAH_SLUG) return { page: "list", abschnitt: ZINAH_SLUG, kennung: "" };
    if (v.indexOf(ZINAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: ZINAH_SLUG, kennung: v.slice(ZINAH_SLUG.length + 1) };
    }
    if (v === UMGANG_SLUG) return { page: "list", abschnitt: UMGANG_SLUG, kennung: "" };
    if (v.indexOf(UMGANG_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: UMGANG_SLUG, kennung: v.slice(UMGANG_SLUG.length + 1) };
    }
    if (v === REISE_SLUG) return { page: "list", abschnitt: REISE_SLUG, kennung: "" };
    if (v.indexOf(REISE_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: REISE_SLUG, kennung: v.slice(REISE_SLUG.length + 1) };
    }
    if (v === KRANKHEIT_SLUG) return { page: "list", abschnitt: KRANKHEIT_SLUG, kennung: "" };
    if (v.indexOf(KRANKHEIT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: KRANKHEIT_SLUG, kennung: v.slice(KRANKHEIT_SLUG.length + 1) };
    }
    if (v === PRIVAT_SLUG) return { page: "list", abschnitt: PRIVAT_SLUG, kennung: "" };
    if (v.indexOf(PRIVAT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: PRIVAT_SLUG, kennung: v.slice(PRIVAT_SLUG.length + 1) };
    }
    if (v === VERWANDT_SLUG) return { page: "list", abschnitt: VERWANDT_SLUG, kennung: "" };
    if (v.indexOf(VERWANDT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: VERWANDT_SLUG, kennung: v.slice(VERWANDT_SLUG.length + 1) };
    }
    if (v === TAWHID_SLUG) return { page: "list", abschnitt: TAWHID_SLUG, kennung: "" };
    if (v.indexOf(TAWHID_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: TAWHID_SLUG, kennung: v.slice(TAWHID_SLUG.length + 1) };
    }
    if (v === GERECHT_SLUG) return { page: "list", abschnitt: GERECHT_SLUG, kennung: "" };
    if (v.indexOf(GERECHT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: GERECHT_SLUG, kennung: v.slice(GERECHT_SLUG.length + 1) };
    }
    if (v === DHIKR_SLUG) return { page: "list", abschnitt: DHIKR_SLUG, kennung: "" };
    if (v.indexOf(DHIKR_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: DHIKR_SLUG, kennung: v.slice(DHIKR_SLUG.length + 1) };
    }
    if (v === GEPRUEFT_SLUG) return { page: "list", abschnitt: GEPRUEFT_SLUG, kennung: "" };
    if (v.indexOf(GEPRUEFT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: GEPRUEFT_SLUG, kennung: v.slice(GEPRUEFT_SLUG.length + 1) };
    }
    if (v === TOD_SLUG) return { page: "list", abschnitt: TOD_SLUG, kennung: "" };
    if (v.indexOf(TOD_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: TOD_SLUG, kennung: v.slice(TOD_SLUG.length + 1) };
    }
    if (v === ARBEIT_SLUG) return { page: "list", abschnitt: ARBEIT_SLUG, kennung: "" };
    if (v.indexOf(ARBEIT_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: ARBEIT_SLUG, kennung: v.slice(ARBEIT_SLUG.length + 1) };
    }
    if (v === MEDIEN_SLUG) return { page: "list", abschnitt: MEDIEN_SLUG, kennung: "" };
    if (v.indexOf(MEDIEN_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: MEDIEN_SLUG, kennung: v.slice(MEDIEN_SLUG.length + 1) };
    }
    if (v === RUQYAH_SLUG) return { page: "list", abschnitt: RUQYAH_SLUG, kennung: "" };
    if (v.indexOf(RUQYAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: RUQYAH_SLUG, kennung: v.slice(RUQYAH_SLUG.length + 1) };
    }
    if (v === TRAUER_SLUG) return { page: "list", abschnitt: TRAUER_SLUG, kennung: "" };
    if (v.indexOf(TRAUER_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: TRAUER_SLUG, kennung: v.slice(TRAUER_SLUG.length + 1) };
    }
    if (v === MAEDCHEN_SLUG) return { page: "list", abschnitt: MAEDCHEN_SLUG, kennung: "" };
    if (v.indexOf(MAEDCHEN_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: MAEDCHEN_SLUG, kennung: v.slice(MAEDCHEN_SLUG.length + 1) };
    }
    if (v === BIDAHQ_SLUG) return { page: "list", abschnitt: BIDAHQ_SLUG, kennung: "" };
    if (v.indexOf(BIDAHQ_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: BIDAHQ_SLUG, kennung: v.slice(BIDAHQ_SLUG.length + 1) };
    }
    if (v === REUE_SLUG) return { page: "list", abschnitt: REUE_SLUG, kennung: "" };
    if (v.indexOf(REUE_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: REUE_SLUG, kennung: v.slice(REUE_SLUG.length + 1) };
    }
    if (v === JANAIZ_SLUG) return { page: "list", abschnitt: JANAIZ_SLUG, kennung: "" };
    if (v.indexOf(JANAIZ_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: JANAIZ_SLUG, kennung: v.slice(JANAIZ_SLUG.length + 1) };
    }
    if (v === TAWBAH_SLUG) return { page: "list", abschnitt: TAWBAH_SLUG, kennung: "" };
    if (v.indexOf(TAWBAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: TAWBAH_SLUG, kennung: v.slice(TAWBAH_SLUG.length + 1) };
    }
    if (v === TOECHTER_SLUG) return { page: "list", abschnitt: TOECHTER_SLUG, kennung: "" };
    if (v.indexOf(TOECHTER_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: TOECHTER_SLUG, kennung: v.slice(TOECHTER_SLUG.length + 1) };
    }
    if (v === JANAZAH_SLUG) return { page: "list", abschnitt: JANAZAH_SLUG, kennung: "" };
    if (v.indexOf(JANAZAH_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: JANAZAH_SLUG, kennung: v.slice(JANAZAH_SLUG.length + 1) };
    }
    if (v === RAMADAN_SLUG) return { page: "list", abschnitt: RAMADAN_SLUG, kennung: "" };
    if (v.indexOf(RAMADAN_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: RAMADAN_SLUG, kennung: v.slice(RAMADAN_SLUG.length + 1) };
    }
    if (v === QIYAM_SLUG) return { page: "list", abschnitt: QIYAM_SLUG, kennung: "" };
    if (v.indexOf(QIYAM_SLUG + "/") === 0) {
      return { page: "detail", abschnitt: QIYAM_SLUG, kennung: v.slice(QIYAM_SLUG.length + 1) };
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
    if (abschnitt === IDDAH_SLUG) return iddahCache;
    if (abschnitt === REINIGUNG_SLUG) return reinigungCache;
    if (abschnitt === NIKAH_SLUG) return nikahCache;
    if (abschnitt === ZINAH_SLUG) return zinahCache;
    if (abschnitt === UMGANG_SLUG) return umgangCache;
    if (abschnitt === REISE_SLUG) return reiseCache;
    if (abschnitt === KRANKHEIT_SLUG) return krankheitCache;
    if (abschnitt === PRIVAT_SLUG) return privatCache;
    if (abschnitt === VERWANDT_SLUG) return verwandtCache;
    if (abschnitt === TAWHID_SLUG) return tawhidCache;
    if (abschnitt === GERECHT_SLUG) return gerechtCache;
    if (abschnitt === DHIKR_SLUG) return dhikrCache;
    if (abschnitt === GEPRUEFT_SLUG) return geprueftCache;
    if (abschnitt === TOD_SLUG) return todCache;
    if (abschnitt === ARBEIT_SLUG) return arbeitCache;
    if (abschnitt === MEDIEN_SLUG) return medienCache;
    if (abschnitt === RUQYAH_SLUG) return ruqyahCache;
    if (abschnitt === TRAUER_SLUG) return trauerCache;
    if (abschnitt === MAEDCHEN_SLUG) return maedchenCache;
    if (abschnitt === BIDAHQ_SLUG) return bidahqCache;
    if (abschnitt === REUE_SLUG) return reueCache;
    if (abschnitt === JANAIZ_SLUG) return janaizCache;
    if (abschnitt === TAWBAH_SLUG) return tawbahCache;
    if (abschnitt === TOECHTER_SLUG) return toechterCache;
    if (abschnitt === JANAZAH_SLUG) return janazahCache;
    if (abschnitt === RAMADAN_SLUG) return ramadanCache;
    if (abschnitt === QIYAM_SLUG) return qiyamCache;
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
    if (abschnitt === IDDAH_SLUG) return iddahThema;
    if (abschnitt === REINIGUNG_SLUG) return reinigungThema;
    if (abschnitt === NIKAH_SLUG) return nikahThema;
    if (abschnitt === ZINAH_SLUG) return zinahThema;
    if (abschnitt === UMGANG_SLUG) return umgangThema;
    if (abschnitt === REISE_SLUG) return reiseThema;
    if (abschnitt === KRANKHEIT_SLUG) return krankheitThema;
    if (abschnitt === PRIVAT_SLUG) return privatThema;
    if (abschnitt === VERWANDT_SLUG) return verwandtThema;
    if (abschnitt === TAWHID_SLUG) return tawhidThema;
    if (abschnitt === GERECHT_SLUG) return gerechtThema;
    if (abschnitt === DHIKR_SLUG) return dhikrThema;
    if (abschnitt === GEPRUEFT_SLUG) return geprueftThema;
    if (abschnitt === TOD_SLUG) return todThema;
    if (abschnitt === ARBEIT_SLUG) return arbeitThema;
    if (abschnitt === MEDIEN_SLUG) return medienThema;
    if (abschnitt === RUQYAH_SLUG) return ruqyahThema;
    if (abschnitt === TRAUER_SLUG) return trauerThema;
    if (abschnitt === MAEDCHEN_SLUG) return maedchenThema;
    if (abschnitt === BIDAHQ_SLUG) return bidahqThema;
    if (abschnitt === REUE_SLUG) return reueThema;
    if (abschnitt === JANAIZ_SLUG) return janaizThema;
    if (abschnitt === TAWBAH_SLUG) return tawbahThema;
    if (abschnitt === TOECHTER_SLUG) return toechterThema;
    if (abschnitt === JANAZAH_SLUG) return janazahThema;
    if (abschnitt === RAMADAN_SLUG) return ramadanThema;
    if (abschnitt === QIYAM_SLUG) return qiyamThema;
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
    else if (abschnitt === IDDAH_SLUG) iddahThema = id;
    else if (abschnitt === REINIGUNG_SLUG) reinigungThema = id;
    else if (abschnitt === NIKAH_SLUG) nikahThema = id;
    else if (abschnitt === ZINAH_SLUG) zinahThema = id;
    else if (abschnitt === UMGANG_SLUG) umgangThema = id;
    else if (abschnitt === REISE_SLUG) reiseThema = id;
    else if (abschnitt === KRANKHEIT_SLUG) krankheitThema = id;
    else if (abschnitt === PRIVAT_SLUG) privatThema = id;
    else if (abschnitt === VERWANDT_SLUG) verwandtThema = id;
    else if (abschnitt === TAWHID_SLUG) tawhidThema = id;
    else if (abschnitt === GERECHT_SLUG) gerechtThema = id;
    else if (abschnitt === DHIKR_SLUG) dhikrThema = id;
    else if (abschnitt === GEPRUEFT_SLUG) geprueftThema = id;
    else if (abschnitt === TOD_SLUG) todThema = id;
    else if (abschnitt === ARBEIT_SLUG) arbeitThema = id;
    else if (abschnitt === MEDIEN_SLUG) medienThema = id;
    else if (abschnitt === RUQYAH_SLUG) ruqyahThema = id;
    else if (abschnitt === TRAUER_SLUG) trauerThema = id;
    else if (abschnitt === MAEDCHEN_SLUG) maedchenThema = id;
    else if (abschnitt === BIDAHQ_SLUG) bidahqThema = id;
    else if (abschnitt === REUE_SLUG) reueThema = id;
    else if (abschnitt === JANAIZ_SLUG) janaizThema = id;
    else if (abschnitt === TAWBAH_SLUG) tawbahThema = id;
    else if (abschnitt === TOECHTER_SLUG) toechterThema = id;
    else if (abschnitt === JANAZAH_SLUG) janazahThema = id;
    else if (abschnitt === RAMADAN_SLUG) ramadanThema = id;
    else if (abschnitt === QIYAM_SLUG) qiyamThema = id;
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
    if (abschnitt === IDDAH_SLUG) return iddahQ;
    if (abschnitt === REINIGUNG_SLUG) return reinigungQ;
    if (abschnitt === NIKAH_SLUG) return nikahQ;
    if (abschnitt === ZINAH_SLUG) return zinahQ;
    if (abschnitt === UMGANG_SLUG) return umgangQ;
    if (abschnitt === REISE_SLUG) return reiseQ;
    if (abschnitt === KRANKHEIT_SLUG) return krankheitQ;
    if (abschnitt === PRIVAT_SLUG) return privatQ;
    if (abschnitt === VERWANDT_SLUG) return verwandtQ;
    if (abschnitt === TAWHID_SLUG) return tawhidQ;
    if (abschnitt === GERECHT_SLUG) return gerechtQ;
    if (abschnitt === DHIKR_SLUG) return dhikrQ;
    if (abschnitt === GEPRUEFT_SLUG) return geprueftQ;
    if (abschnitt === TOD_SLUG) return todQ;
    if (abschnitt === ARBEIT_SLUG) return arbeitQ;
    if (abschnitt === MEDIEN_SLUG) return medienQ;
    if (abschnitt === RUQYAH_SLUG) return ruqyahQ;
    if (abschnitt === TRAUER_SLUG) return trauerQ;
    if (abschnitt === MAEDCHEN_SLUG) return maedchenQ;
    if (abschnitt === BIDAHQ_SLUG) return bidahqQ;
    if (abschnitt === REUE_SLUG) return reueQ;
    if (abschnitt === JANAIZ_SLUG) return janaizQ;
    if (abschnitt === TAWBAH_SLUG) return tawbahQ;
    if (abschnitt === TOECHTER_SLUG) return toechterQ;
    if (abschnitt === JANAZAH_SLUG) return janazahQ;
    if (abschnitt === RAMADAN_SLUG) return ramadanQ;
    if (abschnitt === QIYAM_SLUG) return qiyamQ;
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
    else if (abschnitt === IDDAH_SLUG) iddahQ = v;
    else if (abschnitt === REINIGUNG_SLUG) reinigungQ = v;
    else if (abschnitt === NIKAH_SLUG) nikahQ = v;
    else if (abschnitt === ZINAH_SLUG) zinahQ = v;
    else if (abschnitt === UMGANG_SLUG) umgangQ = v;
    else if (abschnitt === REISE_SLUG) reiseQ = v;
    else if (abschnitt === KRANKHEIT_SLUG) krankheitQ = v;
    else if (abschnitt === PRIVAT_SLUG) privatQ = v;
    else if (abschnitt === VERWANDT_SLUG) verwandtQ = v;
    else if (abschnitt === TAWHID_SLUG) tawhidQ = v;
    else if (abschnitt === GERECHT_SLUG) gerechtQ = v;
    else if (abschnitt === DHIKR_SLUG) dhikrQ = v;
    else if (abschnitt === GEPRUEFT_SLUG) geprueftQ = v;
    else if (abschnitt === TOD_SLUG) todQ = v;
    else if (abschnitt === ARBEIT_SLUG) arbeitQ = v;
    else if (abschnitt === MEDIEN_SLUG) medienQ = v;
    else if (abschnitt === RUQYAH_SLUG) ruqyahQ = v;
    else if (abschnitt === TRAUER_SLUG) trauerQ = v;
    else if (abschnitt === MAEDCHEN_SLUG) maedchenQ = v;
    else if (abschnitt === BIDAHQ_SLUG) bidahqQ = v;
    else if (abschnitt === REUE_SLUG) reueQ = v;
    else if (abschnitt === JANAIZ_SLUG) janaizQ = v;
    else if (abschnitt === TAWBAH_SLUG) tawbahQ = v;
    else if (abschnitt === TOECHTER_SLUG) toechterQ = v;
    else if (abschnitt === JANAZAH_SLUG) janazahQ = v;
    else if (abschnitt === RAMADAN_SLUG) ramadanQ = v;
    else if (abschnitt === QIYAM_SLUG) qiyamQ = v;
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
        abschnitt === DIENST_SLUG ||
        abschnitt === IDDAH_SLUG ||
        abschnitt === REINIGUNG_SLUG ||
        abschnitt === NIKAH_SLUG ||
        abschnitt === ZINAH_SLUG ||
        abschnitt === UMGANG_SLUG ||
        abschnitt === REISE_SLUG ||
        abschnitt === KRANKHEIT_SLUG ||
        abschnitt === PRIVAT_SLUG ||
        abschnitt === VERWANDT_SLUG ||
        abschnitt === TAWHID_SLUG ||
        abschnitt === GERECHT_SLUG ||
        abschnitt === DHIKR_SLUG ||
        abschnitt === GEPRUEFT_SLUG ||
        abschnitt === TOD_SLUG ||
        abschnitt === ARBEIT_SLUG ||
        abschnitt === MEDIEN_SLUG ||
        abschnitt === RUQYAH_SLUG ||
        abschnitt === TRAUER_SLUG ||
        abschnitt === MAEDCHEN_SLUG ||
        abschnitt === BIDAHQ_SLUG ||
        abschnitt === REUE_SLUG ||
        abschnitt === JANAIZ_SLUG ||
        abschnitt === TAWBAH_SLUG ||
        abschnitt === TOECHTER_SLUG ||
        abschnitt === JANAZAH_SLUG ||
        abschnitt === RAMADAN_SLUG ||
        abschnitt === QIYAM_SLUG
      ) {
        var extraThemen = Array.isArray(e.themen) ? e.themen : [];
        if (chip !== thema && e.thema !== thema && extraThemen.indexOf(thema) === -1) return false;
      } else if (chip !== thema) return false;
    }
    if (pickSprecher) {
      var sp = String(e.person || e.name || e.ueberliefertVon || e.sprecher || "").trim();
      if (sp !== pickSprecher) return false;
    }
    if (pickBuch) {
      var src = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "");
      if (src.toLowerCase().indexOf(pickBuch.toLowerCase()) === -1) return false;
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
      e.thema,
      hatDirektnachweis(e) ? "direktnachweis" : "",
      (e.schlagwoerter || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function offeneAbschnitte() {
    return ["fiqh", "sahabiyyat", "tabiiyyat", MUETTER_SLUG, EHE_SLUG, HIJAB_SLUG, WISSEN_SLUG, FAQ_SLUG, KURZ_SLUG, SALAF_SLUG, MOSCHEE_SLUG, HAJJ_SLUG, SADAQAH_SLUG, ADAB_SLUG, KINDER_SLUG, MUSLIMAH_SLUG, NIFAS_SLUG, DIENST_SLUG, IDDAH_SLUG, REINIGUNG_SLUG, NIKAH_SLUG, ZINAH_SLUG, UMGANG_SLUG, REISE_SLUG, KRANKHEIT_SLUG, PRIVAT_SLUG, VERWANDT_SLUG, TAWHID_SLUG, GERECHT_SLUG, DHIKR_SLUG, GEPRUEFT_SLUG, TOD_SLUG, ARBEIT_SLUG, MEDIEN_SLUG, RUQYAH_SLUG, TRAUER_SLUG, MAEDCHEN_SLUG, BIDAHQ_SLUG, REUE_SLUG, JANAIZ_SLUG, TAWBAH_SLUG, TOECHTER_SLUG, JANAZAH_SLUG, RAMADAN_SLUG, QIYAM_SLUG];
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
    if (abschnitt === IDDAH_SLUG) return "ring";
    if (abschnitt === REINIGUNG_SLUG) return "book";
    if (abschnitt === NIKAH_SLUG) return "home";
    if (abschnitt === ZINAH_SLUG) return "veil";
    if (abschnitt === UMGANG_SLUG) return "people";
    if (abschnitt === REISE_SLUG) return "ring";
    if (abschnitt === KRANKHEIT_SLUG) return "lamp";
    if (abschnitt === PRIVAT_SLUG) return "home";
    if (abschnitt === VERWANDT_SLUG) return "people";
    if (abschnitt === TAWHID_SLUG) return "book";
    if (abschnitt === GERECHT_SLUG) return "lamp";
    if (abschnitt === DHIKR_SLUG) return "ring";
    if (abschnitt === GEPRUEFT_SLUG) return "lamp";
    if (abschnitt === TOD_SLUG) return "ring";
    if (abschnitt === ARBEIT_SLUG) return "lamp";
    if (abschnitt === MEDIEN_SLUG) return "veil";
    if (abschnitt === RUQYAH_SLUG) return "book";
    if (abschnitt === TRAUER_SLUG) return "ring";
    if (abschnitt === MAEDCHEN_SLUG) return "home";
    if (abschnitt === BIDAHQ_SLUG) return "lamp";
    if (abschnitt === REUE_SLUG) return "book";
    if (abschnitt === JANAIZ_SLUG) return "ring";
    if (abschnitt === TAWBAH_SLUG) return "book";
    if (abschnitt === TOECHTER_SLUG) return "home";
    if (abschnitt === JANAZAH_SLUG) return "ring";
    if (abschnitt === RAMADAN_SLUG) return "lamp";
    if (abschnitt === QIYAM_SLUG) return "lamp";
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
      directPickPanel(isHub ? "" : abschnitt) +
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
      { nr: "18", title: "Dienst am Guten, Pflege & Hilfeleistung", id: DIENST_SLUG, mark: "lamp", lede: "Geprüfte Berichte zu Versorgung, Pflege, Wassergeben, Dienst und Hilfeleistung." },
      { nr: "19", title: "ʿIddah, Scheidung & Trauerzeit", id: IDDAH_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu ʿIddah, Scheidung, Trauerzeit und Eheschließung nach Wartezeit." },
      { nr: "20", title: "Reinigung, Gebet & Fasten", id: REINIGUNG_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Reinigung, Ḥayḍ, Ghusl, Gebet und Fasten." },
      { nr: "21", title: "Nikāḥ, Zustimmung & Mahr", id: NIKAH_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Eheschließung, Zustimmung, Mitgift und Verbot der Zwangsehe." },
      { nr: "22", title: "Zīnah, Schmuck & Kleidung", id: ZINAH_SLUG, mark: "veil", lede: "Geprüfte Grundlagen zu Ḥidschāb, Kleidung, Schmuck, Duft und Tabarrudsch." },
      { nr: "23", title: "Umgang mit Nicht-Maḥārim", id: UMGANG_SLUG, mark: "people", lede: "Geprüfte Grundlagen zu Khalwah, Blick, Rede und Abstand." },
      { nr: "24", title: "Reise, Maḥram & Schutz", id: REISE_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Reise, Maḥram und Schutz – ohne moderne Flug-Fatwas." },
      { nr: "25", title: "Krankheit, Prüfung & Geduld", id: KRANKHEIT_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Krankheit, Muṣībah, Ṣabr, Duʿāʾ und Hoffnung." },
      { nr: "26", title: "Privatsphäre, Erlaubnis & Haus-Adab", id: PRIVAT_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Erlaubnisbitten, Blickschutz, Besuch und Hausgrenzen." },
      { nr: "27", title: "Verwandtschaft, Nachbarschaft & Gastrecht", id: VERWANDT_SLUG, mark: "people", lede: "Geprüfte Grundlagen zu Familie, Nachbarn, Gästen und Verwandtschaftspflege." },
      { nr: "28", title: "Tawḥīd, Īmān & ʿIbādah", id: TAWHID_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Tawḥīd, Īmān, Taqwā, Ikhlāṣ, Dhikr und rechtschaffener Tat." },
      { nr: "29", title: "Gerechtigkeit, guter Umgang & Schutz vor Unrecht", id: GERECHT_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Maʿrūf, Iḥsān, Ẓulm, Ehe-Adab und Schutz vor Unrecht." },
      { nr: "30", title: "Dhikr, Duʿāʾ & tägliche ʿIbādah", id: DHIKR_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Dhikr, Bittgebet, Tasbīḥ, Schlaf-Dhikr und Laylat al-Qadr." },
      { nr: "31", title: "Geprüftes Wissen, Quellen & Weitergabe", id: GEPRUEFT_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Wissen, Quellen, Weitergabe, Sunnah, Bidʿah und Vorsicht im Zitieren." },
      { nr: "32", title: "Tod, Janāzah & Trauer-Adab", id: TOD_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Tod, Janāzah, Waschen Verstorbener, Trauer und Adab." },
      { nr: "33", title: "Arbeit, Studium & Öffentlichkeit", id: ARBEIT_SLUG, mark: "lamp", pending: true, lede: "Geprüfte Grundlagen zu öffentlicher Tätigkeit, Lernen, Grenzen, Nutzen und Schutz." },
      { nr: "34", title: "Medien, Bilder & öffentliche Darstellung", id: MEDIEN_SLUG, mark: "veil", pending: true, lede: "Geprüfte Grundlagen zu Darstellung, Fotos, Stimme, Schreiben, öffentlichem Auftreten und digitalen Grenzen." },
      { nr: "35", title: "Ruqyah, Schutz & Zuflucht", id: RUQYAH_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu al-Falaq, an-Nās, Muʿawwidhāt, Ruqyah und Zuflucht bei Allah." },
      { nr: "36", title: "Tod, Janāzah & Trauer", id: TRAUER_SLUG, mark: "ring", pending: true, lede: "Geprüfte Grundlagen zu Tod, Trauer, Janāzah, Duʿāʾ und Grenzen der Klage." },
      { nr: "37", title: "Mädchen, Pubertät & Pflichtwissen", id: MAEDCHEN_SLUG, mark: "home", pending: true, lede: "Geprüfte Grundlagen zu Reife, Pflichtwissen, Schamhaftigkeit, Gebet und religiöser Verantwortung." },
      { nr: "38", title: "Falsches Wissen, Bidʿah & Quellenprüfung", id: BIDAHQ_SLUG, mark: "lamp", pending: true, lede: "Geprüfte Grundlagen zum Schutz vor ungeprüften Aussagen, schwachen Quellen und erfundenen Inhalten." },
      { nr: "39", title: "Reue, Istighfār & Rückkehr zu Allah", id: REUE_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Tawbah, Istighfār, Hoffnung, Schuld und Rückkehr zu Allah." },
      { nr: "40", title: "Tod, Janāʾiz, Trauer & Ṣabr", id: JANAIZ_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Muṣībah, erlaubter Trauer, Ṣabr und Janāʾiz." },
      { nr: "41", title: "Reue, Tawbah & Istighfār", id: TAWBAH_SLUG, mark: "book", lede: "Geprüfte Grundlagen zu Reue, Vergebung, Tawbah Naṣūḥ und Sayyid al-Istighfār." },
      { nr: "42", title: "Töchter, Mädchen & Fürsorge", id: TOECHTER_SLUG, mark: "home", lede: "Geprüfte Grundlagen zu Barmherzigkeit, Fürsorge, Gerechtigkeit und Schutz von Mädchen." },
      { nr: "43", title: "Janāzah, Tod & Trauer-Adab", id: JANAZAH_SLUG, mark: "ring", lede: "Geprüfte Grundlagen zu Tod, Trauer, Janāzah, Iḥdād und Adab bei Verlust." },
      { nr: "44", title: "Ramaḍān, Fasten & ʿĪd", id: RAMADAN_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Fasten, Ḥayḍ, Laylat al-Qadr, ʿĪd und Ṣadaqah." },
      { nr: "45", title: "Ramaḍān, Fasten & Nachtgebet", id: QIYAM_SLUG, mark: "lamp", lede: "Geprüfte Grundlagen zu Ramaḍān, Fasten, Nachholen, Qiyām, Laylat al-Qadr und Iʿtikāf." }
    ];
  }

  function hubRow(area) {
    var n = area.id ? countSichtbare(area.id) : 0;
    var leer = !!area.pending || n === 0;
    var status = leer ? "In Prüfung" : "Geprüft";
    var meta = leer ? status : status + " · " + (n === 1 ? "1 Inhalt" : n + " Inhalte");
    var nav = area.id ? ' data-nav="frauen" data-value="' + esc(area.id) + '"' : "";
    return (
      '<article class="topics-theme-card dua-theme-card' +
      (area.featured && area.id ? " is-featured" : "") +
      (leer ? " is-pending" : "") +
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
      (area.lede ? '<p class="topics-theme-card__lede">' + esc(area.lede) + "</p>" : "") +
      '<p class="topics-theme-card__count dua-theme-card__count">' +
      esc(meta) +
      "</p></div>" +
      '<span class="topics-theme-card__chev dua-theme-card__chev" aria-hidden="true">›</span>' +
      "</article>"
    );
  }

  function sucheUeberall(q) {
    var out = [];
    var needle = String(q || "").toLowerCase();
    if (!needle && !pickSprecher && !pickBuch) return [];
    offeneAbschnitte().forEach(function (ab) {
      sichtbare((cacheFor(ab) || {}).eintraege).forEach(function (e) {
        if (pickSprecher) {
          var sp = String(e.person || e.name || e.ueberliefertVon || e.sprecher || "").trim();
          if (sp !== pickSprecher) return;
        }
        if (pickBuch) {
          var src = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "");
          if (src.toLowerCase().indexOf(pickBuch.toLowerCase()) === -1) return;
        }
        if (needle) {
          var hay = [
            e.name,
            e.person,
            titelVon(e),
            vorschauVon(e),
            e.vollstaendigeAussage,
            e.inhalt,
            lehreVon(e),
            e.quellenanzeige,
            e.bereich,
            e.thema,
            hatDirektnachweis(e) ? "direktnachweis" : "",
            (e.schlagwoerter || []).join(" ")
          ]
            .join(" ")
            .toLowerCase();
          if (hay.indexOf(needle) === -1) return;
        }
        out.push({ e: e, abschnitt: ab });
      });
    });
    return out;
  }

  function uniqueSprecher() {
    var seen = {};
    var list = [];
    offeneAbschnitte().forEach(function (ab) {
      sichtbare((cacheFor(ab) || {}).eintraege).forEach(function (e) {
        var sp = String(e.person || e.name || e.ueberliefertVon || e.sprecher || "").trim();
        if (!sp || seen[sp]) return;
        seen[sp] = true;
        list.push(sp);
      });
    });
    list.sort(function (a, b) {
      return a.localeCompare(b, "de");
    });
    return list;
  }

  function uniqueBuecher() {
    var seen = {};
    var list = [];
    offeneAbschnitte().forEach(function (ab) {
      sichtbare((cacheFor(ab) || {}).eintraege).forEach(function (e) {
        var src = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "").trim();
        var buch = src.split(",")[0].trim();
        if (!buch || seen[buch]) return;
        seen[buch] = true;
        list.push(buch);
      });
    });
    list.sort(function (a, b) {
      return a.localeCompare(b, "de");
    });
    return list;
  }

  function directPickPanel(activeBereich) {
    var themen = hubAreas()
      .filter(function (a) {
        return a.id;
      })
      .map(function (a) {
        return (
          '<option value="' +
          esc(a.id) +
          '"' +
          (activeBereich === a.id ? " selected" : "") +
          ">" +
          esc(a.title) +
          "</option>"
        );
      })
      .join("");
    var scholarOpts = uniqueSprecher()
      .map(function (n) {
        return (
          '<option value="' +
          esc(n) +
          '"' +
          (pickSprecher === n ? " selected" : "") +
          ">" +
          esc(n) +
          "</option>"
        );
      })
      .join("");
    var bookOpts = uniqueBuecher()
      .map(function (n) {
        return (
          '<option value="' +
          esc(n) +
          '"' +
          (pickBuch === n ? " selected" : "") +
          ">" +
          esc(n) +
          "</option>"
        );
      })
      .join("");
    return (
      '<section class="direct-pick-panel home-direct-pick premium-surface frauen-direct-pick">' +
      '<div class="direct-pick-title"><h3>Schnell auswählen</h3><span>Thema · Gelehrter · Buch</span></div>' +
      '<div class="direct-pick-grid">' +
      '<select class="direct-pick" data-frauen-pick="thema" aria-label="Thema">' +
      '<option value="">📚 Thema</option>' +
      themen +
      "</select>" +
      '<select class="direct-pick" data-frauen-pick="gelehrter" aria-label="Gelehrter">' +
      '<option value="">👤 Gelehrter</option>' +
      scholarOpts +
      "</select>" +
      '<select class="direct-pick" data-frauen-pick="buch" aria-label="Buch">' +
      '<option value="">📖 Buch</option>' +
      bookOpts +
      "</select></div></section>"
    );
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
    var treffer = q || pickSprecher || pickBuch ? sucheUeberall(q) : [];
    var liste = q || pickSprecher || pickBuch
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
      searchPanel("hub", themen, q, thema, "Suche nach Beitrag, Duʿāʾ, Thema, Gelehrten, Buch") +
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
                                      : abschnitt === IDDAH_SLUG
                                        ? IDDAH_BEREICH_LABEL
                                      : abschnitt === REINIGUNG_SLUG
                                        ? REINIGUNG_BEREICH_LABEL
                                      : abschnitt === NIKAH_SLUG
                                        ? NIKAH_BEREICH_LABEL
                                      : abschnitt === ZINAH_SLUG
                                        ? ZINAH_BEREICH_LABEL
                                      : abschnitt === UMGANG_SLUG
                                        ? UMGANG_BEREICH_LABEL
                                      : abschnitt === REISE_SLUG
                                        ? REISE_BEREICH_LABEL
                                      : abschnitt === KRANKHEIT_SLUG
                                        ? KRANKHEIT_BEREICH_LABEL
                                      : abschnitt === PRIVAT_SLUG
                                        ? PRIVAT_BEREICH_LABEL
                                      : abschnitt === VERWANDT_SLUG
                                        ? VERWANDT_BEREICH_LABEL
                                      : abschnitt === TAWHID_SLUG
                                        ? TAWHID_BEREICH_LABEL
                                      : abschnitt === GERECHT_SLUG
                                        ? GERECHT_BEREICH_LABEL
                                      : abschnitt === DHIKR_SLUG
                                        ? DHIKR_BEREICH_LABEL
                                      : abschnitt === GEPRUEFT_SLUG
                                        ? GEPRUEFT_BEREICH_LABEL
                                      : abschnitt === TOD_SLUG
                                        ? TOD_BEREICH_LABEL
                                      : abschnitt === ARBEIT_SLUG
                                        ? ARBEIT_BEREICH_LABEL
                                      : abschnitt === MEDIEN_SLUG
                                        ? MEDIEN_BEREICH_LABEL
                                      : abschnitt === RUQYAH_SLUG
                                        ? RUQYAH_BEREICH_LABEL
                                      : abschnitt === TRAUER_SLUG
                                        ? TRAUER_BEREICH_LABEL
                                      : abschnitt === MAEDCHEN_SLUG
                                        ? MAEDCHEN_BEREICH_LABEL
                                      : abschnitt === BIDAHQ_SLUG
                                        ? BIDAHQ_BEREICH_LABEL
                                      : abschnitt === REUE_SLUG
                                        ? REUE_BEREICH_LABEL
                                      : abschnitt === JANAIZ_SLUG
                                        ? JANAIZ_BEREICH_LABEL
                                      : abschnitt === TAWBAH_SLUG
                                        ? TAWBAH_BEREICH_LABEL
                                      : abschnitt === TOECHTER_SLUG
                                        ? TOECHTER_BEREICH_LABEL
                                      : abschnitt === JANAZAH_SLUG
                                        ? JANAZAH_BEREICH_LABEL
                                      : abschnitt === RAMADAN_SLUG
                                        ? RAMADAN_BEREICH_LABEL
                                      : abschnitt === QIYAM_SLUG
                                        ? QIYAM_BEREICH_LABEL
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
                                      : abschnitt === IDDAH_SLUG
                                        ? IDDAH_THEMEN
                                      : abschnitt === REINIGUNG_SLUG
                                        ? REINIGUNG_THEMEN
                                      : abschnitt === NIKAH_SLUG
                                        ? NIKAH_THEMEN
                                      : abschnitt === ZINAH_SLUG
                                        ? ZINAH_THEMEN
                                      : abschnitt === UMGANG_SLUG
                                        ? UMGANG_THEMEN
                                      : abschnitt === REISE_SLUG
                                        ? REISE_THEMEN
                                      : abschnitt === KRANKHEIT_SLUG
                                        ? KRANKHEIT_THEMEN
                                      : abschnitt === PRIVAT_SLUG
                                        ? PRIVAT_THEMEN
                                      : abschnitt === VERWANDT_SLUG
                                        ? VERWANDT_THEMEN
                                      : abschnitt === TAWHID_SLUG
                                        ? TAWHID_THEMEN
                                      : abschnitt === GERECHT_SLUG
                                        ? GERECHT_THEMEN
                                      : abschnitt === DHIKR_SLUG
                                        ? DHIKR_THEMEN
                                      : abschnitt === GEPRUEFT_SLUG
                                        ? GEPRUEFT_THEMEN
                                      : abschnitt === TOD_SLUG
                                        ? TOD_THEMEN
                                      : abschnitt === ARBEIT_SLUG
                                        ? ARBEIT_THEMEN
                                      : abschnitt === MEDIEN_SLUG
                                        ? MEDIEN_THEMEN
                                      : abschnitt === RUQYAH_SLUG
                                        ? RUQYAH_THEMEN
                                      : abschnitt === TRAUER_SLUG
                                        ? TRAUER_THEMEN
                                      : abschnitt === MAEDCHEN_SLUG
                                        ? MAEDCHEN_THEMEN
                                      : abschnitt === BIDAHQ_SLUG
                                        ? BIDAHQ_THEMEN
                                      : abschnitt === REUE_SLUG
                                        ? REUE_THEMEN
                                      : abschnitt === JANAIZ_SLUG
                                        ? JANAIZ_THEMEN
                                      : abschnitt === TAWBAH_SLUG
                                        ? TAWBAH_THEMEN
                                      : abschnitt === TOECHTER_SLUG
                                        ? TOECHTER_THEMEN
                                      : abschnitt === JANAZAH_SLUG
                                        ? JANAZAH_THEMEN
                                      : abschnitt === RAMADAN_SLUG
                                        ? RAMADAN_THEMEN
                                      : abschnitt === QIYAM_SLUG
                                        ? QIYAM_THEMEN
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
          abschnitt === DIENST_SLUG ||
          abschnitt === IDDAH_SLUG ||
          abschnitt === REINIGUNG_SLUG ||
          abschnitt === NIKAH_SLUG ||
          abschnitt === ZINAH_SLUG ||
          abschnitt === UMGANG_SLUG ||
          abschnitt === REISE_SLUG ||
          abschnitt === KRANKHEIT_SLUG ||
          abschnitt === PRIVAT_SLUG ||
          abschnitt === VERWANDT_SLUG ||
          abschnitt === TAWHID_SLUG ||
          abschnitt === GERECHT_SLUG ||
          abschnitt === DHIKR_SLUG ||
          abschnitt === GEPRUEFT_SLUG ||
          abschnitt === TOD_SLUG ||
          abschnitt === ARBEIT_SLUG ||
          abschnitt === MEDIEN_SLUG ||
          abschnitt === RUQYAH_SLUG ||
          abschnitt === TRAUER_SLUG ||
          abschnitt === MAEDCHEN_SLUG ||
          abschnitt === BIDAHQ_SLUG ||
          abschnitt === REUE_SLUG ||
          abschnitt === JANAIZ_SLUG ||
          abschnitt === TAWBAH_SLUG ||
          abschnitt === TOECHTER_SLUG ||
          abschnitt === JANAZAH_SLUG ||
          abschnitt === RAMADAN_SLUG ||
          abschnitt === QIYAM_SLUG
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
          : abschnitt === IDDAH_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Detailfragen zu Wohnung, Reise, Schwangerschaft in der ʿIddah, Unterhalt und heutiger Scheidungspraxis bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === REINIGUNG_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Intime Details, Medikamente, Sonderfälle bei Istiḥāḍah und moderne Produktfragen bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === NIKAH_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Fragen zu Walī, Standesamt, Zeugen, Mutʿah und Vertragsdetails bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === ZINAH_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Niqāb, Make-up, Fotos, Haarersatz und moderne Schmuckfragen bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === UMGANG_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Chat, Arbeit, Taxi, Arztbesuche und moderne Alltagssituationen bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === REISE_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Flug allein, Zug, Hotel, Dienstreise und Notfälle bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === KRANKHEIT_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Inhalte mit Quelle und Direktnachweis. Medizinische Fragen, psychologische Krisen, Diagnosen, Medikamente, Therapie, Schwangerschaftsrisiken und Einzelfälle bleiben verborgen, bis sie separat geprüft wurden.</p></div>'
          : abschnitt === PRIVAT_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Fragen zu Besuch bei Verwandten, Schwiegerfamilie, Kameras, Fotos, Handys, Social Media, Wohnungsschlüssel, Haustür, Chat, Videoanruf und privaten Räumen bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === VERWANDT_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Streitfälle mit Familie, Schwiegerfamilie, Nachbarn, Gästen, Besuch, Kontaktabbruch, Wohnrecht, Geld, Erbe und heutigen Konflikten bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === TAWHID_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Grundlagen mit Quelle und Direktnachweis. Moderne Gleichheitsdeutungen, Rollenbilder, Motivationssprüche und ungeprüfte Aussagen werden nicht angezeigt.</p></div>'
          : abschnitt === GERECHT_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Inhalte mit Quelle und Direktnachweis. Konkrete Ehekonflikte, Gewaltfragen, Nushūz, Scheidung, Gerichte, Schutzmaßnahmen, Unterhalt, Wohnrecht und heutige Streitfälle bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>'
          : abschnitt === DHIKR_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Persönliche Duʿāʾ-Listen, schwache Awrād, besondere Zahlen, moderne Routinen, Ruqyah-Details und ungeprüfte Tagespläne bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>'
          : abschnitt === GEPRUEFT_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Aussagen von Ṣaḥābah, Tābiʿīn und Salaf werden vorbereitet, aber erst nach strenger Endprüfung sichtbar gemacht. Social-Media-Zitate, Screenshots, unklare Sprüche und schwache Berichte bleiben verborgen.</p></div>'
          : abschnitt === TOD_SLUG
          ? '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Inhalte mit Quelle und Direktnachweis. Grabbesuch, Friedhofsregeln, Janāzah-Gebet, Waschen Verstorbener im Detail, Bestattungsabläufe, Trauerfeiern, heutige Bestattungsfragen und individuelle Todesfälle bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>'
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
    if (abschnitt === ARBEIT_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich ist in Prüfung. Fragen zu Arbeit, Studium, Ausbildung, Schule, öffentlichem Auftreten, gemischten Räumen, Einkommen, Reisen, Kleidung, Stimme und Nicht-Maḥārim werden nur angezeigt, wenn sie einzeln mit Quelle und Direktnachweis geprüft wurden.</p></div>';
    else if (abschnitt === MEDIEN_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich ist in Prüfung. Fragen zu Bildern, Profilbildern, Videos, Stimme, Sprachnachrichten, sozialen Medien, Kommentaren, öffentlichem Schreiben und digitaler Darstellung bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>';
    else if (abschnitt === RUQYAH_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Magie, ʿAyn, Ḥasad, Krankheit, Ruqyah-Behandlung, Kinder-Ruqyah, Amulette, Talismane, Wasser-Ruqyah, digitale Ruqyah und Einzelfälle bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === TRAUER_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich ist sensibel. Trauer, Tod, Janāzah, Iḥdād, Weinen, Klage, Friedhofsbesuch und Todesfälle von Kindern oder Ehemännern werden nur angezeigt, wenn Quelle und Direktnachweis streng geprüft wurden.</p></div>';
    else if (abschnitt === MAEDCHEN_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt später nur geprüfte Inhalte für Mädchen und junge Musliminnen. Pubertät, Ḥayḍ, Gebet, Kleidung, Schamhaftigkeit, Lernen, Erziehung und Verantwortung bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>';
    else if (abschnitt === BIDAHQ_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich soll Frauen vor ungeprüften religiösen Aussagen schützen. Sichtbar werden nur Inhalte mit klarer Quelle und Direktnachweis. Zitate aus sozialen Medien, schwache Berichte, erfundene Duʿāʾ und unklare Salaf-Sprüche werden nicht angezeigt.</p></div>';
    else if (abschnitt === REUE_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Inhalte mit Quelle und Direktnachweis. Konkrete Sündenfälle, Rechte anderer Menschen, Rückgabe von Unrecht, Ehebruch, große Sünden, Verzweiflung, Waswās, psychische Krisen und Einzelfragen bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === JANAIZ_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte religiöse Inhalte mit Quelle und Direktnachweis. Fragen zu Frauen und Friedhofsbesuch, Janāzah-Gebet, Waschen der Verstorbenen, Iḥdād, ʿIddah der Witwe, Bestattung, Friedhof, lauter Trauer, kulturellen Bräuchen und heutigen Einzelfällen bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === TAWBAH_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Detailfragen zu großen Sünden, Rechten anderer Menschen, Ẓulm, Rückgabe von Rechten, Wiederholung von Sünden, Waswās, Verzweiflung, Heuchelei und einzelnen Fallurteilen bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === TOECHTER_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Moderne Erziehung, Pubertät, Ḥijāb-Alter, Schule, Handy, Erbe, Gerichte und Einzelfälle bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === JANAZAH_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Friedhofsbesuch, Waschen Verstorbener, Iḥdād-Details, kulturelle Trauerbräuche und heutige Bestattungsfragen bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === RAMADAN_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Schwangerschaft, Stillzeit, Fidya, Tarāwīḥ, Iʿtikāf und moderne ʿĪd-Fragen bleiben verborgen, bis sie einzeln streng geprüft wurden.</p></div>';
    else if (abschnitt === QIYAM_SLUG)
      hint = '<div class="frauen-hint"><p>Dieser Bereich zeigt nur geprüfte Inhalte mit Quelle und Direktnachweis. Detailfragen zu Schwangerschaft, Stillzeit, Fidya, Krankheit, Reise, Ḥayḍ, Tarāwīḥ, Moschee, Iʿtikāf und individuellen Fällen bleiben verborgen, bis sie einzeln geprüft wurden.</p></div>';
    if (
      leerBereich &&
      (abschnitt === ARBEIT_SLUG ||
        abschnitt === MEDIEN_SLUG ||
        abschnitt === RUQYAH_SLUG ||
        abschnitt === TRAUER_SLUG ||
        abschnitt === MAEDCHEN_SLUG ||
        abschnitt === BIDAHQ_SLUG)
    ) {
      emptyHtml =
        '<div class="frauen-empty"><p>Noch keine geprüften Inhalte vorhanden.</p><p>Dieser Bereich wird streng geprüft. Inhalte erscheinen erst nach Quelle und Direktnachweis.</p></div>';
    }
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
        : abschnitt === IDDAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān und Sunnah zu ʿIddah, Scheidung und Trauerzeit – ohne moderne Gerichts-Fatwas.</p>'
        : abschnitt === REINIGUNG_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah zu Reinigung, Gebet und Fasten – ohne intime Details.</p>'
        : abschnitt === NIKAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah zu Zustimmung, Mitgift und Verbot der Zwangsehe.</p>'
        : abschnitt === ZINAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān und Sunnah zu Ḥidschāb, Kleidung, Schmuck und Sittsamkeit.</p>'
        : abschnitt === UMGANG_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu Abstand, Blick, Rede und Khalwah – ohne moderne Chat-Fatwas.</p>'
        : abschnitt === REISE_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus authentischer Sunnah zu Reise und Maḥram – ohne moderne Flug-Fatwas.</p>'
        : abschnitt === KRANKHEIT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne medizinische Ratschläge.</p>'
        : abschnitt === PRIVAT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Familien- oder Besuchsregeln.</p>'
        : abschnitt === VERWANDT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Familienberatung.</p>'
        : abschnitt === TAWHID_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Rollenbilder.</p>'
        : abschnitt === GERECHT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Ehe- oder Konfliktberatung.</p>'
        : abschnitt === DHIKR_SLUG
        ? '<p class="lede">Geprüfte Berichte aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Duʿāʾ-Listen.</p>'
        : abschnitt === GEPRUEFT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Zitate.</p>'
        : abschnitt === TOD_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Grab- und Trauer-Fatwas.</p>'
        : abschnitt === ARBEIT_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu öffentlicher Tätigkeit, Lernen, Grenzen, Nutzen und Schutz.</p>'
        : abschnitt === MEDIEN_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu Darstellung, Fotos, Stimme, Schreiben, öffentlichem Auftreten und digitalen Grenzen.</p>'
        : abschnitt === RUQYAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ruqyah-Listen.</p>'
        : abschnitt === TRAUER_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu Tod, Trauer, Janāzah, Duʿāʾ und Grenzen der Klage.</p>'
        : abschnitt === MAEDCHEN_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zu Reife, Pflichtwissen, Schamhaftigkeit, Gebet und religiöser Verantwortung.</p>'
        : abschnitt === BIDAHQ_SLUG
        ? '<p class="lede">Geprüfte Grundlagen zum Schutz vor ungeprüften Aussagen, schwachen Quellen und erfundenen Inhalten.</p>'
        : abschnitt === REUE_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne erfundene Trosttexte.</p>'
        : abschnitt === JANAIZ_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Trauer- oder Friedhofs-Fatwas.</p>'
        : abschnitt === TAWBAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne erfundene Trosttexte.</p>'
        : abschnitt === TOECHTER_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Erziehungstexte.</p>'
        : abschnitt === JANAZAH_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Trauer- oder Friedhofs-Fatwas.</p>'
        : abschnitt === RAMADAN_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ramaḍān-Pläne.</p>'
        : abschnitt === QIYAM_SLUG
        ? '<p class="lede">Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ramaḍān-Routinen.</p>'
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
    if (abschnitt === IDDAH_SLUG) return "ʿIddah, Scheidung & Trauerzeit";
    if (abschnitt === REINIGUNG_SLUG) return "Reinigung, Gebet & Fasten";
    if (abschnitt === NIKAH_SLUG) return "Nikāḥ, Zustimmung & Mahr";
    if (abschnitt === ZINAH_SLUG) return "Zīnah, Schmuck & Kleidung";
    if (abschnitt === UMGANG_SLUG) return "Umgang mit Nicht-Maḥārim";
    if (abschnitt === REISE_SLUG) return "Reise, Maḥram & Schutz";
    if (abschnitt === KRANKHEIT_SLUG) return "Krankheit, Prüfung & Geduld";
    if (abschnitt === PRIVAT_SLUG) return "Privatsphäre, Erlaubnis & Haus-Adab";
    if (abschnitt === VERWANDT_SLUG) return "Verwandtschaft, Nachbarschaft & Gastrecht";
    if (abschnitt === TAWHID_SLUG) return "Tawḥīd, Īmān & ʿIbādah";
    if (abschnitt === GERECHT_SLUG) return "Gerechtigkeit, guter Umgang & Schutz vor Unrecht";
    if (abschnitt === DHIKR_SLUG) return "Dhikr, Duʿāʾ & tägliche ʿIbādah";
    if (abschnitt === GEPRUEFT_SLUG) return "Geprüftes Wissen, Quellen & Weitergabe";
    if (abschnitt === TOD_SLUG) return "Tod, Janāzah & Trauer-Adab";
    if (abschnitt === ARBEIT_SLUG) return "Arbeit, Studium & Öffentlichkeit";
    if (abschnitt === MEDIEN_SLUG) return "Medien, Bilder & öffentliche Darstellung";
    if (abschnitt === RUQYAH_SLUG) return "Ruqyah, Schutz & Zuflucht";
    if (abschnitt === TRAUER_SLUG) return "Tod, Janāzah & Trauer";
    if (abschnitt === MAEDCHEN_SLUG) return "Mädchen, Pubertät & Pflichtwissen";
    if (abschnitt === BIDAHQ_SLUG) return "Falsches Wissen, Bidʿah & Quellenprüfung";
    if (abschnitt === REUE_SLUG) return "Reue, Istighfār & Rückkehr zu Allah";
    if (abschnitt === JANAIZ_SLUG) return "Tod, Janāʾiz, Trauer & Ṣabr";
    if (abschnitt === TAWBAH_SLUG) return "Reue, Tawbah & Istighfār";
    if (abschnitt === TOECHTER_SLUG) return "Töchter, Mädchen & Fürsorge";
    if (abschnitt === JANAZAH_SLUG) return "Janāzah, Tod & Trauer-Adab";
    if (abschnitt === RAMADAN_SLUG) return "Ramaḍān, Fasten & ʿĪd";
    if (abschnitt === QIYAM_SLUG) return "Ramaḍān, Fasten & Nachtgebet";
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
    if (/Qurʾān|Grundlage|Frauen der|ibn |Abū |Abu |Ibn /i.test(raw)) honorific = "";
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
    var nachBericht = istKurz(abschnitt) || abschnitt === DIENST_SLUG || abschnitt === KRANKHEIT_SLUG || abschnitt === PRIVAT_SLUG || abschnitt === VERWANDT_SLUG || abschnitt === TAWHID_SLUG || abschnitt === GERECHT_SLUG || abschnitt === DHIKR_SLUG || abschnitt === GEPRUEFT_SLUG || abschnitt === TOD_SLUG || abschnitt === ARBEIT_SLUG || abschnitt === MEDIEN_SLUG || abschnitt === RUQYAH_SLUG || abschnitt === TRAUER_SLUG || abschnitt === MAEDCHEN_SLUG || abschnitt === BIDAHQ_SLUG || abschnitt === REUE_SLUG || abschnitt === JANAIZ_SLUG || abschnitt === TAWBAH_SLUG || abschnitt === TOECHTER_SLUG || abschnitt === JANAZAH_SLUG || abschnitt === RAMADAN_SLUG || abschnitt === QIYAM_SLUG ? lehreHtml + quelleBlock : quelleBlock + lehreHtml;
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
    if (parsed.abschnitt === IDDAH_SLUG && parsed.page === "list") {
      return {
        title: "ʿIddah, Scheidung & Trauerzeit",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und Sunnah zu ʿIddah, Scheidung und Trauerzeit – ohne moderne Gerichts-Fatwas."
      };
    }
    if (parsed.abschnitt === REINIGUNG_SLUG && parsed.page === "list") {
      return {
        title: "Reinigung, Gebet & Fasten",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah zu Reinigung, Gebet und Fasten – ohne intime Details."
      };
    }
    if (parsed.abschnitt === NIKAH_SLUG && parsed.page === "list") {
      return {
        title: "Nikāḥ, Zustimmung & Mahr",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah zu Zustimmung, Mitgift und Verbot der Zwangsehe."
      };
    }
    if (parsed.abschnitt === ZINAH_SLUG && parsed.page === "list") {
      return {
        title: "Zīnah, Schmuck & Kleidung",
        subtitle: "Geprüfte Grundlagen aus Qurʾān und Sunnah zu Ḥidschāb, Kleidung, Schmuck und Sittsamkeit."
      };
    }
    if (parsed.abschnitt === UMGANG_SLUG && parsed.page === "list") {
      return {
        title: "Umgang mit Nicht-Maḥārim",
        subtitle: "Geprüfte Grundlagen zu Abstand, Blick, Rede und Khalwah – ohne moderne Chat-Fatwas."
      };
    }
    if (parsed.abschnitt === REISE_SLUG && parsed.page === "list") {
      return {
        title: "Reise, Maḥram & Schutz",
        subtitle: "Geprüfte Grundlagen aus authentischer Sunnah zu Reise und Maḥram – ohne moderne Flug-Fatwas."
      };
    }
    if (parsed.abschnitt === KRANKHEIT_SLUG && parsed.page === "list") {
      return {
        title: "Krankheit, Prüfung & Geduld",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne medizinische Ratschläge."
      };
    }
    if (parsed.abschnitt === PRIVAT_SLUG && parsed.page === "list") {
      return {
        title: "Privatsphäre, Erlaubnis & Haus-Adab",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Familien- oder Besuchsregeln."
      };
    }
    if (parsed.abschnitt === VERWANDT_SLUG && parsed.page === "list") {
      return {
        title: "Verwandtschaft, Nachbarschaft & Gastrecht",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Familienberatung."
      };
    }
    if (parsed.abschnitt === TAWHID_SLUG && parsed.page === "list") {
      return {
        title: "Tawḥīd, Īmān & ʿIbādah",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Rollenbilder."
      };
    }
    if (parsed.abschnitt === GERECHT_SLUG && parsed.page === "list") {
      return {
        title: "Gerechtigkeit, guter Umgang & Schutz vor Unrecht",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Ehe- oder Konfliktberatung."
      };
    }
    if (parsed.abschnitt === DHIKR_SLUG && parsed.page === "list") {
      return {
        title: "Dhikr, Duʿāʾ & tägliche ʿIbādah",
        subtitle: "Geprüfte Berichte aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Duʿāʾ-Listen."
      };
    }
    if (parsed.abschnitt === GEPRUEFT_SLUG && parsed.page === "list") {
      return {
        title: "Geprüftes Wissen, Quellen & Weitergabe",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Zitate."
      };
    }
    if (parsed.abschnitt === TOD_SLUG && parsed.page === "list") {
      return {
        title: "Tod, Janāzah & Trauer-Adab",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Grab- und Trauer-Fatwas."
      };
    }
    if (parsed.abschnitt === ARBEIT_SLUG && parsed.page === "list") {
      return {
        title: "Arbeit, Studium & Öffentlichkeit",
        subtitle: "Geprüfte Grundlagen zu öffentlicher Tätigkeit, Lernen, Grenzen, Nutzen und Schutz."
      };
    }
    if (parsed.abschnitt === MEDIEN_SLUG && parsed.page === "list") {
      return {
        title: "Medien, Bilder & öffentliche Darstellung",
        subtitle: "Geprüfte Grundlagen zu Darstellung, Fotos, Stimme, Schreiben, öffentlichem Auftreten und digitalen Grenzen."
      };
    }
    if (parsed.abschnitt === RUQYAH_SLUG && parsed.page === "list") {
      return {
        title: "Ruqyah, Schutz & Zuflucht",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ruqyah-Listen."
      };
    }
    if (parsed.abschnitt === TRAUER_SLUG && parsed.page === "list") {
      return {
        title: "Tod, Janāzah & Trauer",
        subtitle: "Geprüfte Grundlagen zu Tod, Trauer, Janāzah, Duʿāʾ und Grenzen der Klage."
      };
    }
    if (parsed.abschnitt === MAEDCHEN_SLUG && parsed.page === "list") {
      return {
        title: "Mädchen, Pubertät & Pflichtwissen",
        subtitle: "Geprüfte Grundlagen zu Reife, Pflichtwissen, Schamhaftigkeit, Gebet und religiöser Verantwortung."
      };
    }
    if (parsed.abschnitt === BIDAHQ_SLUG && parsed.page === "list") {
      return {
        title: "Falsches Wissen, Bidʿah & Quellenprüfung",
        subtitle: "Geprüfte Grundlagen zum Schutz vor ungeprüften Aussagen, schwachen Quellen und erfundenen Inhalten."
      };
    }
    if (parsed.abschnitt === REUE_SLUG && parsed.page === "list") {
      return {
        title: "Reue, Istighfār & Rückkehr zu Allah",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne erfundene Trosttexte."
      };
    }
    if (parsed.abschnitt === JANAIZ_SLUG && parsed.page === "list") {
      return {
        title: "Tod, Janāʾiz, Trauer & Ṣabr",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Trauer- oder Friedhofs-Fatwas."
      };
    }
    if (parsed.abschnitt === TAWBAH_SLUG && parsed.page === "list") {
      return {
        title: "Reue, Tawbah & Istighfār",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne erfundene Trosttexte."
      };
    }
    if (parsed.abschnitt === TOECHTER_SLUG && parsed.page === "list") {
      return {
        title: "Töchter, Mädchen & Fürsorge",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne moderne Erziehungstexte."
      };
    }
    if (parsed.abschnitt === JANAZAH_SLUG && parsed.page === "list") {
      return {
        title: "Janāzah, Tod & Trauer-Adab",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Trauer- oder Friedhofs-Fatwas."
      };
    }
    if (parsed.abschnitt === RAMADAN_SLUG && parsed.page === "list") {
      return {
        title: "Ramaḍān, Fasten & ʿĪd",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ramaḍān-Pläne."
      };
    }
    if (parsed.abschnitt === QIYAM_SLUG && parsed.page === "list") {
      return {
        title: "Ramaḍān, Fasten & Nachtgebet",
        subtitle: "Geprüfte Grundlagen aus Qurʾān, Sunnah und später ergänzten Āthār – ohne ungeprüfte Ramaḍān-Routinen."
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
            : parsed.abschnitt === IDDAH_SLUG
            ? "ʿIddah, Scheidung & Trauerzeit"
            : parsed.abschnitt === REINIGUNG_SLUG
            ? "Reinigung, Gebet & Fasten"
            : parsed.abschnitt === NIKAH_SLUG
            ? "Nikāḥ, Zustimmung & Mahr"
            : parsed.abschnitt === ZINAH_SLUG
            ? "Zīnah, Schmuck & Kleidung"
            : parsed.abschnitt === UMGANG_SLUG
            ? "Umgang mit Nicht-Maḥārim"
            : parsed.abschnitt === REISE_SLUG
            ? "Reise, Maḥram & Schutz"
            : parsed.abschnitt === KRANKHEIT_SLUG
            ? "Krankheit, Prüfung & Geduld"
            : parsed.abschnitt === PRIVAT_SLUG
            ? "Privatsphäre, Erlaubnis & Haus-Adab"
            : parsed.abschnitt === VERWANDT_SLUG
            ? "Verwandtschaft, Nachbarschaft & Gastrecht"
            : parsed.abschnitt === TAWHID_SLUG
            ? "Tawḥīd, Īmān & ʿIbādah"
            : parsed.abschnitt === GERECHT_SLUG
            ? "Gerechtigkeit, guter Umgang & Schutz vor Unrecht"
            : parsed.abschnitt === DHIKR_SLUG
            ? "Dhikr, Duʿāʾ & tägliche ʿIbādah"
            : parsed.abschnitt === GEPRUEFT_SLUG
            ? "Geprüftes Wissen, Quellen & Weitergabe"
            : parsed.abschnitt === TOD_SLUG
            ? "Tod, Janāzah & Trauer-Adab"
            : parsed.abschnitt === ARBEIT_SLUG
            ? "Arbeit, Studium & Öffentlichkeit"
            : parsed.abschnitt === MEDIEN_SLUG
            ? "Medien, Bilder & öffentliche Darstellung"
            : parsed.abschnitt === RUQYAH_SLUG
            ? "Ruqyah, Schutz & Zuflucht"
            : parsed.abschnitt === TRAUER_SLUG
            ? "Tod, Janāzah & Trauer"
            : parsed.abschnitt === MAEDCHEN_SLUG
            ? "Mädchen, Pubertät & Pflichtwissen"
            : parsed.abschnitt === BIDAHQ_SLUG
            ? "Falsches Wissen, Bidʿah & Quellenprüfung"
            : parsed.abschnitt === REUE_SLUG
            ? "Reue, Istighfār & Rückkehr zu Allah"
            : parsed.abschnitt === JANAIZ_SLUG
            ? "Tod, Janāʾiz, Trauer & Ṣabr"
            : parsed.abschnitt === TAWBAH_SLUG
            ? "Reue, Tawbah & Istighfār"
            : parsed.abschnitt === TOECHTER_SLUG
            ? "Töchter, Mädchen & Fürsorge"
            : parsed.abschnitt === JANAZAH_SLUG
            ? "Janāzah, Tod & Trauer-Adab"
            : parsed.abschnitt === RAMADAN_SLUG
            ? "Ramaḍān, Fasten & ʿĪd"
            : parsed.abschnitt === QIYAM_SLUG
            ? "Ramaḍān, Fasten & Nachtgebet"
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
      !dienstCache ||
      !iddahCache ||
      !reinigungCache ||
      !nikahCache ||
      !zinahCache ||
      !umgangCache ||
      !reiseCache ||
      !krankheitCache ||
      !privatCache ||
      !verwandtCache ||
      !tawhidCache ||
      !gerechtCache ||
      !dhikrCache ||
      !geprueftCache ||
      !todCache ||
      !arbeitCache ||
      !medienCache ||
      !ruqyahCache ||
      !trauerCache ||
      !maedchenCache ||
      !bidahqCache ||
      !reueCache
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
    var picks = document.querySelectorAll("[data-frauen-pick]");
    for (var i = 0; i < picks.length; i++) {
      if (picks[i].dataset.bound) continue;
      picks[i].dataset.bound = "1";
      picks[i].addEventListener("change", function (ev) {
        var el = ev.target;
        var kind = el.getAttribute("data-frauen-pick");
        var val = el.value || "";
        if (kind === "thema") {
          if (val && typeof window.navigate === "function") window.navigate("frauen", val);
          return;
        }
        if (kind === "gelehrter") pickSprecher = val;
        if (kind === "buch") pickBuch = val;
        refreshIfFrauen();
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
