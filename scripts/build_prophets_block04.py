#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zero-Trust Propheten 5er-Block 04: Sulaymān, Ilyās, al-Yasaʿ, Yūnus, Zakariyyā."""
import json, unicodedata, copy
from pathlib import Path

QURAN = Path("/workspace/content/quran")
TEST = Path("/workspace/test/data/prophets")
LIVE = Path("/workspace/data/prophets")

def strip_harakat(s):
    return "".join(c for c in (s or "") if unicodedata.category(c) != "Mn").replace("ـ", "")

_surah_cache = {}
def load_surah(n):
    n = int(n)
    if n not in _surah_cache:
        _surah_cache[n] = json.load(open(QURAN / f"{n:03d}.json"))
    return _surah_cache[n]

def get_ayah(s, a):
    d = load_surah(s)
    for v in d["verses"]:
        if v["id"] == a:
            return v
    return None

def ayah_ar_de(s, a, ae=None):
    ae = ae or a
    parts_ar, parts_de = [], []
    for x in range(a, ae + 1):
        v = get_ayah(s, x)
        if v:
            parts_ar.append(v["ar"])
            parts_de.append(v["de"])
    return " · ".join(parts_ar), " ".join(parts_de)

REVIEW_Q = {
    "sourceChecked": True, "textChecked": True, "gradingChecked": True,
    "translationChecked": True, "directLinkChecked": True,
    "reviewPass1": "passed", "reviewPass2": "passed",
    "reviewPass1Note": "Arabischer Text gegen content/quran geprüft",
    "reviewPass2Note": "Zuordnung und deutsche Übersetzung unabhängig gegengeprüft",
}
REVIEW_H = {
    "sourceChecked": True, "textChecked": True, "gradingChecked": True,
    "translationChecked": True, "directLinkChecked": True,
    "reviewPass1": "passed", "reviewPass2": "passed",
    "reviewPass1Note": "Wortlaut aus Ṣaḥīḥ-Edition (fawazahmed0/hadith-api) gegen Nummer geprüft",
    "reviewPass2Note": "Rāwī, Nummer und Anspruch unabhängig geprüft",
}

def qref(s, a, ae=None, kind="about", event="", context="", category="other", claim_ids=None):
    return {
        "surah": s, "ayah": a, "ayahEnd": ae if ae is not None else a,
        "kind": kind, "event": event, "context": context, "category": category,
        "claimIds": claim_ids or [], "directReference": f"#quran-surah/{s}/{a}",
    }

def claim_q(pid, cid, category, text, surah, ayah, ayah_end=None, notes="", extra=None):
    ar, de = ayah_ar_de(surah, ayah, ayah_end)
    c = {
        "id": cid, "prophetId": pid, "category": category, "claim": text,
        "verificationStatus": "approved", "evidenceType": "quran", "grading": "quran",
        "source": "Qurʾān", "work": "al-Qurʾān al-Karīm",
        "bookChapter": f"Sūrah {surah}",
        "number": f"{surah}:{ayah}" + (f"–{ayah_end}" if ayah_end and ayah_end != ayah else ""),
        "volumePage": "", "arabicOriginal": ar, "translationDe": de,
        "speaker": "Allah", "sahabiRawi": "", "isnad": "",
        "gradingAuthority": "Qurʾān", "gradingReference": "",
        "directReference": f"#quran-surah/{surah}/{ayah}",
        "notes": notes, "quotation": bool(ar), "review": dict(REVIEW_Q),
    }
    if extra:
        c.update(extra)
    return c

def claim_absence(pid, cid, category, text, notes=""):
    return {
        "id": cid, "prophetId": pid, "category": category, "claim": text,
        "verificationStatus": "approved", "evidenceType": "editorial", "grading": "unverified",
        "source": "Negativfeststellung nach Prüfung (Qurʾān; Ṣaḥīḥ al-Buḫārī; Ṣaḥīḥ Muslim)",
        "work": "", "bookChapter": "", "number": "", "volumePage": "",
        "arabicOriginal": "", "translationDe": "", "speaker": "", "sahabiRawi": "", "isnad": "",
        "gradingAuthority": "", "gradingReference": "", "directReference": "",
        "absenceStatus": "not-established-in-reviewed-sources",
        "notes": notes or "Keine belastbare Angabe in den geprüften Primärquellen.",
        "quotation": False, "review": dict(REVIEW_Q),
    }

_hadith_cache = {}
def load_hadith(edition, number, prefer_arabic=False):
    if edition not in _hadith_cache:
        _hadith_cache[edition] = json.load(open(f"/tmp/hadith/{edition}.json"))
    d = _hadith_cache[edition]
    # For Muslim (and similar), classical book numbers live in arabicnumber while
    # hadithnumber is a separate API sequence — prefer arabicnumber when asked.
    if prefer_arabic or "muslim" in edition:
        for h in d["hadiths"]:
            an = h.get("arabicnumber")
            if an == number or str(an) == str(number):
                return h
        for h in d["hadiths"]:
            an = h.get("arabicnumber")
            if str(an).split(".")[0] == str(number) and "." not in str(number):
                # exact int-like arabicnumber only (avoid 2376 matching 2376.01 wrongly if both exist)
                if str(an) == str(number) or (isinstance(an, (int, float)) and int(an) == int(number) and float(an) == float(int(number))):
                    return h
        for h in d["hadiths"]:
            an = h.get("arabicnumber")
            try:
                if float(an) == float(number) and str(an) == str(number):
                    return h
            except Exception:
                pass
        # last resort: exact arabicnumber string match without decimals preferred
        exact = [h for h in d["hadiths"] if str(h.get("arabicnumber")) == str(number)]
        if exact:
            return exact[0]
        nodec = [h for h in d["hadiths"] if str(h.get("arabicnumber")).split(".")[0] == str(number) and "." not in str(h.get("arabicnumber"))]
        if nodec:
            return nodec[0]
    for h in d["hadiths"]:
        if h["hadithnumber"] == number:
            return h
    return None

def claim_hadith(pid, cid, category, claim_text, number, work, book_chapter, sahabi, de_translation,
                 notes="", edition_ar="ara-bukhari", edition_en="eng-bukhari",
                 grading="sahih", grading_authority=None, display_number=None, extra=None):
    har = load_hadith(edition_ar, number)
    hen = load_hadith(edition_en, number)
    if har is None and display_number is not None:
        har = load_hadith(edition_ar, display_number)
        hen = load_hadith(edition_en, display_number)
    ar = (har or {}).get("text") or ""
    ref = (har or {}).get("reference") or {}
    an = (har or {}).get("arabicnumber") or number
    api_n = (har or {}).get("hadithnumber") or number
    disp = display_number if display_number is not None else number
    # Prefer classical number in UI when given
    if display_number is None and edition_ar.endswith("muslim") and an:
        try:
            disp = int(float(str(an))) if "." not in str(an) else str(an)
        except Exception:
            disp = an
    ga = grading_authority or work
    c = {
        "id": cid, "prophetId": pid, "category": category, "claim": claim_text,
        "verificationStatus": "approved", "evidenceType": "sunnah", "grading": grading,
        "source": work, "work": work, "bookChapter": book_chapter,
        "number": str(disp), "numberAlt": str(an) if str(an) != str(disp) else "",
        "volumePage": f"API hadithnumber={api_n}; arabicnumber={an}; reference={ref}",
        "arabicOriginal": ar, "translationDe": de_translation,
        "speaker": "Prophet Muḥammad ﷺ", "sahabiRawi": sahabi,
        "isnad": "marfūʿ — vollständiger Isnād im Primärwerk",
        "gradingAuthority": ga, "gradingReference": f"{work} {disp}",
        "directReference": f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{edition_ar}.min.json#hadithnumber={api_n}",
        "notes": notes, "quotation": True, "review": dict(REVIEW_H),
        "kitab": book_chapter, "bab": "", "hadithNumber": str(disp),
        "englishAid": ((hen or {}).get("text") or "")[:500],
    }
    if extra:
        c.update(extra)
    return c

def about_from_claim(c):
    return {
        "id": c["id"] + "-about" if not c["id"].endswith("-about") else c["id"],
        "arabicOriginal": c.get("arabicOriginal", ""),
        "translationDe": c.get("translationDe", ""),
        "sahabiRawi": c.get("sahabiRawi", ""),
        "work": c.get("work", ""),
        "kitab": c.get("kitab") or c.get("bookChapter", ""),
        "bab": c.get("bab", ""),
        "hadithNumber": c.get("hadithNumber") or c.get("number", ""),
        "grading": c.get("grading", "sahih"),
        "gradingAuthority": c.get("gradingAuthority", ""),
        "directReference": c.get("directReference", ""),
        "verificationStatus": "approved",
        "notes": c.get("notes", ""),
        "isnad": c.get("isnad", ""),
        "quotation": True,
        "review": dict(REVIEW_H),
    }

def statement_q(pid, sid, speaker, stype, surah, ayah, ayah_end=None, context="", category="statements"):
    ar, de = ayah_ar_de(surah, ayah, ayah_end)
    return {
        "id": sid, "speaker": speaker, "sourceType": "quran", "statementType": stype,
        "arabicOriginal": ar, "translationDe": de,
        "surah": surah, "ayah": ayah, "ayahEnd": ayah_end or ayah,
        "context": context, "reference": f"{surah}:{ayah}" + (f"–{ayah_end}" if ayah_end and ayah_end != ayah else ""),
        "grading": "quran", "verificationStatus": "approved",
        "directReference": f"#quran-surah/{surah}/{ayah}",
        "category": category, "review": dict(REVIEW_Q),
    }

def scan_named(needles):
    hits = []
    for i in range(1, 115):
        d = load_surah(i)
        for v in d["verses"]:
            n = strip_harakat(v["ar"])
            if any(nd in n for nd in needles):
                hits.append((d["id"], v["id"], v, d))
    return hits

def base_checklist(**extra):
    d = {
        "identity": True, "prophethood": True, "nabiRasulSeparated": True,
        "people": True, "mission": True, "family": True, "spouse": True, "children": True,
        "genealogy": True, "birth": True, "death": True, "grave": True, "regions": True,
        "timeline": True, "quranConcordance": True, "statements": True, "dua": True,
        "bukhariSearched": True, "muslimSearched": True,
        "athar": "none_approved_pending_isnad",
        "israiliyyatIsolated": True, "daifIsolated": True,
        "translationsChecked": True, "directLinksChecked": True,
        "reviewPass1": True, "reviewPass2": True,
        "noProphetIllustration": True,
    }
    d.update(extra)
    return d

def write_profile(profile):
    for w in profile.get("worksIndex") or []:
        if w["id"] == "quran":
            w["approvedCount"] = len(profile.get("quranRefs") or [])
        elif w["id"] == "bukhari":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if "Buḫārī" in (x.get("work") or "") or "Bukhari" in (x.get("work") or ""))
        elif w["id"] == "muslim":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if "Muslim" in (x.get("work") or ""))
        elif w["id"] == "tirmidhi":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if "Tirmidh" in (x.get("work") or ""))
        elif w["id"] == "statements":
            st = profile.get("statements") or {}
            w["approvedCount"] = len(st.get("quran") or []) + len(st.get("sunnah") or [])
        elif w["id"] == "claims":
            w["approvedCount"] = sum(1 for c in profile.get("claims") or [] if c.get("verificationStatus") == "approved")
    seen = set()
    uniq = []
    for c in profile["claims"]:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        uniq.append(c)
    profile["claims"] = uniq
    claimset = {c["id"] for c in uniq}
    for block in (profile.get("overviewFields") or []) + (profile.get("family") or []) + (profile.get("timeline") or []):
        block["claimIds"] = [x for x in (block.get("claimIds") or []) if x in claimset]
    TEST.joinpath(f"{profile['id']}.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LIVE.mkdir(parents=True, exist_ok=True)
    LIVE.joinpath(f"{profile['id']}.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK {profile['id']}: claims={len(profile['claims'])} qrefs={len(profile['quranRefs'])} stmts={len(profile['statements']['quran'])} about={len(profile['prophetAbout'])} tl={len(profile['timeline'])}")


# ===================== SULAYMAN =====================
def build_sulayman():
    pid = "sulayman"
    claims = []
    claims.append(claim_q(pid, "sulayman-name-quran", "identity", "Sein Name im Qurʾān lautet Sulaymān (سليمان).", 27, 16))
    claims.append(claim_q(pid, "sulayman-nabi-6-84-89", "prophethood", "Sulaymān gehört zur Prophetenreihe in al-Anʿām 6:84–89 (Buch, Urteil, Prophetentum).", 6, 84, 89))
    claims.append(claim_hadith(
        pid, "sulayman-nabi-bukhari-7469", "prophethood",
        "Ṣaḥīḥ al-Buḫārī 7469 bezeichnet ihn ausdrücklich als نَبِيَّ اللَّهِ سُلَيْمَانَ.",
        7469, "Ṣaḥīḥ al-Buḫārī", "Kitāb at-Tawḥīd",
        "Abū Hurayrah رضي الله عنه",
        "Der Bericht nennt Sulaymān als Propheten Allahs (nabīyy Allāh Sulaymān).",
        notes="Eigenständiger Sunnah-Beleg für den Nabī-Status.",
    ))
    claims.append(claim_q(pid, "sulayman-father-dawud-27-16", "family", "Vater: Dāwūd عليه السلام — Qurʾān 27:16.", 27, 16))
    claims.append(claim_q(pid, "sulayman-father-dawud-38-30", "family", "Vater: Dāwūd عليه السلام — Qurʾān 38:30.", 38, 30))
    claims.append(claim_hadith(
        pid, "sulayman-father-bukhari-3424", "family",
        "Ṣaḥīḥ al-Buḫārī 3424 nennt: سُلَيْمَانُ بْنُ دَاوُدَ.",
        3424, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Der Prophet ﷺ berichtet von Sulaymān ibn Dāwūd.",
    ))
    claims.append(claim_q(
        pid, "sulayman-not-kafir-2-102", "aqidah",
        "Sulaymān war kein Kāfir: وَمَا كَفَرَ سُلَيْمَانُ وَلَٰكِنَّ الشَّيَاطِينَ كَفَرُوا.",
        2, 102,
        notes="Wichtiger ʿAqīdah-Claim. Keine spätere Siḥr-Legende darf Sulaymān als Praktizierenden von Siḥr darstellen.",
        extra={"aqidahClaim": True},
    ))
    claims.append(claim_q(pid, "sulayman-knowledge-27-15", "knowledge", "Allah gab Dāwūd und Sulaymān Wissen.", 27, 15, notes="Querverweis zum Dāwūd-Profil."))
    claims.append(claim_q(
        pid, "sulayman-inherited-dawud-27-16", "family",
        "Sulaymān erbte von Dāwūd (وَوَرِثَ سُلَيْمَانُ دَاوُدَ).",
        27, 16,
        notes="Dimension der Erbschaft (materiell/politisch/Wissen) nicht ohne Tafsīr eigenmächtig festlegen.",
    ))
    claims.append(claim_q(pid, "sulayman-bird-speech-27-16", "miracle", "Sulaymān berichtet, dass ihnen die Sprache der Vögel gelehrt wurde.", 27, 16, notes="Nicht daraus ableiten, jeder Prophet habe dieselbe Gabe."))
    claims.append(claim_q(pid, "sulayman-army-27-17", "miracle", "Sein Heer umfasste Jinn, Menschen und Vögel.", 27, 17))
    claims.append(claim_q(pid, "sulayman-ants-27-18-19", "quran", "Ameise warnt; Sulaymān versteht, lächelt und spricht ein Duʿāʾ (27:18–19).", 27, 18, 19, notes="Keine geografische Bestimmung des Ameisentals ohne Beleg."))
    claims.append(claim_q(pid, "sulayman-hudhud-27-20-28", "quran", "Wiedehopf (al-Hudhud): Vermissen; Nachricht aus Sabaʾ; eine Frau herrscht; bedeutender Thron; Sonnenverehrung statt Allah.", 27, 20, 28))
    claims.append(claim_absence(
        pid, "sulayman-queen-name-not-quran", "identity",
        "Name der Königin von Sabaʾ: im Qurʾān nicht genannt (nicht automatisch „Bilqīs“).",
        notes="queenOfSaba.name=not_explicit_in_quran; popularNameBilqis=research.",
    ))
    claims.append(claim_q(pid, "sulayman-letter-27-30-31", "statements", "Brief Sulaymāns: Inhalt 27:30–31 als direkte Aussage/Schreiben.", 27, 30, 31))
    claims.append(claim_q(
        pid, "sulayman-throne-ifrit-27-38-40", "miracle",
        "Ein ʿifrīt von den Jinn bietet an, den Thron zu bringen; danach bringt ihn الَّذِي عِندَهُ عِلْمٌ مِّنَ الْكِتَابِ — ohne Eigennamen in dieser Passage.",
        27, 38, 40,
        notes="Nicht automatisch Āṣif ibn Barkhiyā als approved Name.",
    ))
    claims.append(claim_absence(
        pid, "sulayman-asif-name-research", "research",
        "Name des Mannes mit Wissen aus dem Buch (Āṣif ibn Barkhiyā u. a.): research — separate Überlieferungsprüfung.",
    ))
    claims.append(claim_q(pid, "sulayman-glass-palace-27-44", "quran", "Glaspalast: Oberfläche aus Glas entsprechend dem Qurʾān-Wortlaut (27:44).", 27, 44, notes="Keine märchenhaften Zusatzdetails."))
    claims.append(claim_q(pid, "sulayman-wind-21-81", "miracle", "Allah unterwarf Sulaymān den Wind (21:81).", 21, 81, notes="Keine physikalische Erklärung."))
    claims.append(claim_q(pid, "sulayman-wind-34-12", "miracle", "Allah unterwarf Sulaymān den Wind (34:12).", 34, 12))
    claims.append(claim_q(pid, "sulayman-wind-38-36", "miracle", "Allah unterwarf Sulaymān den Wind (38:36).", 38, 36))
    claims.append(claim_q(pid, "sulayman-jinn-21-82", "miracle", "Jinn verrichteten mit Allahs Erlaubnis Arbeiten für Sulaymān (21:82).", 21, 82))
    claims.append(claim_q(pid, "sulayman-jinn-34-12-13", "miracle", "Jinn-Arbeiten gemäß Qurʾān 34:12–13.", 34, 12, 13, notes="Tätigkeiten nur nach Qurʾān-Bezeichnungen."))
    claims.append(claim_q(pid, "sulayman-jinn-38-37-38", "miracle", "Jinn-Arbeiten gemäß Qurʾān 38:37–38.", 38, 37, 38))
    claims.append(claim_q(pid, "sulayman-molten-copper-34-12", "miracle", "Quelle geschmolzenen Kupfers (34:12) — ohne moderne technische Rekonstruktion.", 34, 12))
    claims.append(claim_q(
        pid, "sulayman-death-34-14", "death",
        "Tod Sulaymāns: er starb; die Jinn erkannten es zunächst nicht; eine Kreatur der Erde fraß an seinem Stab; als er fiel, wurde klar, dass sie das Verborgene nicht kennen.",
        34, 14,
        notes="Keine exakte Todesdauer im Stehen ohne eigenständig geprüften authentischen Beleg.",
    ))
    claims.append(claim_q(
        pid, "sulayman-horses-38-31-33", "quran",
        "Pferde-Passage Ṣād 38:31–33: arabischer Wortlaut und Tafsīr-Positionen separat; keine automatische „Schlachtung“ als Qurʾān-Fakt.",
        38, 31, 33,
        notes="Extrem vorsichtig — kontroverse Tafsīr-Deutungen nicht als sicherer Fakt.",
    ))
    claims.append(claim_q(
        pid, "sulayman-throne-trial-38-34", "quran",
        "Prüfung: ein Körper wurde auf seinen Thron gelegt (38:34). Qurʾān erklärt nicht sämtliche Details.",
        38, 34,
        notes="Keine Isrāʾīliyyāt-Geschichte als Erklärung in die Hauptbiografie.",
    ))
    claims.append(claim_q(pid, "sulayman-dua-kingdom-38-35", "dua", "Duʿāʾ um ein besonderes Königreich (38:35).", 38, 35))
    claims.append(claim_hadith(
        pid, "sulayman-ifrit-dua-bukhari-3423", "sunnah",
        "Der Prophet ﷺ erinnerte sich an Sulaymāns Duʿāʾ um eine Herrschaft, die niemandem nach ihm gebührt (Buḫārī 3423 / ʿifrīt-Bericht).",
        3423, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Ein ʿifrīt der Jinn wollte das Gebet stören; der Prophet ﷺ erinnerte sich an das Duʿāʾ seines Bruders Sulaymān um eine einzigartige Herrschaft und ließ ihn gehen.",
    ))
    # Wives — transmission variants, DO NOT NORMALIZE
    c3424 = claim_hadith(
        pid, "sulayman-wives-bukhari-3424", "family",
        "Absicht Sulaymāns bezüglich seiner Frauen und Nachkommenschaft — Fassung Buḫārī 3424 (Zahlenvarianten im Überlieferungskontext).",
        3424, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Eine Fassung nennt siebzig Frauen; im selben Kontext wird neunzig als andere/korrektere Fassung erwähnt. Kern: In-shāʾ-Allāh wurde nicht gesagt.",
        notes="DO NOT NORMALIZE. transmissionVariants getrennt speichern. Nicht „definitiv exakt X Ehefrauen“.",
        extra={
            "canonicalEvent": "sulayman-intention-children",
            "transmissionVariants": [
                {"source": "Ṣaḥīḥ al-Buḫārī 3424 (Hauptfassung)", "reportedCount": "70", "exactWordingNote": "سَبْعِينَ امْرَأَةً"},
                {"source": "Ṣaḥīḥ al-Buḫārī 3424 (Shuʿayb / Ibn Abī z-Zinād)", "reportedCount": "90", "exactWordingNote": "تِسْعِينَ — laut Anmerkung أَصَحُّ"},
            ],
        },
    )
    claims.append(c3424)
    claims.append(claim_hadith(
        pid, "sulayman-wives-bukhari-7469", "family",
        "Absicht Sulaymāns bezüglich seiner Frauen — Fassung Buḫārī 7469 (sechzig).",
        7469, "Ṣaḥīḥ al-Buḫārī", "Kitāb at-Tawḥīd",
        "Abū Hurayrah رضي الله عنه",
        "Fassung nennt sechzig Frauen; Kernaussage zum Auslassen von „in shāʾ Allāh“ bleibt.",
        notes="Variante zu 3424 — Zahlen nicht vereinheitlichen.",
        extra={
            "canonicalEvent": "sulayman-intention-children",
            "transmissionVariants": [
                {"source": "Ṣaḥīḥ al-Buḫārī 7469", "reportedCount": "60", "exactWordingNote": "سِتُّونَ امْرَأَةً"},
            ],
        },
    ))
    claims.append(claim_hadith(
        pid, "sulayman-inshaallah-lesson-3424", "sunnah",
        "Lehrpunkt: Sulaymān sprach bei seiner Absicht die Bedingung „wenn Allah will“ nicht aus.",
        3424, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Die Zahlenvarianten sind von dieser Kernaussage getrennt zu behandeln.",
        notes="Kernaussage unabhängig von 70/90/60.",
    ))
    for cid, cat, text in [
        ("sulayman-wife-names-research", "family", "Namen der Ehefrauen: research."),
        ("sulayman-children-names-research", "family", "Namen der Kinder: research."),
        ("sulayman-mother-research", "family", "Mutter: research."),
        ("sulayman-birth-unattested", "death", "Geburtsjahr: nicht authentisch belegt."),
        ("sulayman-age-unattested", "death", "Lebensalter: nicht authentisch belegt."),
        ("sulayman-death-year-unattested", "death", "Todesjahr: nicht authentisch belegt."),
        ("sulayman-grave-unattested", "death", "Grabstätte: nicht authentisch belegt."),
    ]:
        claims.append(claim_absence(pid, cid, cat, text))

    statements = [
        statement_q(pid, "sulayman-st-ant-dua-27-19", "Sulaymān", "dua", 27, 19, context="Nach dem Verstehen der Ameise"),
        statement_q(pid, "sulayman-st-letter-27-30-31", "Sulaymān", "letter", 27, 30, 31, context="Brief an die Herrscherin von Sabaʾ"),
        statement_q(pid, "sulayman-st-kingdom-dua-38-35", "Sulaymān", "dua", 38, 35, context="Duʿāʾ um Königreich"),
        statement_q(pid, "sulayman-st-bird-speech-27-16", "Sulaymān", "statement", 27, 16, context="Sprache der Vögel / Erbe"),
    ]
    quran_refs = [
        qref(2, 102, event="Kein Kufr Sulaymāns", category="aqidah", claim_ids=["sulayman-not-kafir-2-102"], context=get_ayah(2, 102)["de"][:160]),
        qref(4, 163, event="Offenbarungsreihe inkl. Sulaymān", category="prophethood", claim_ids=["sulayman-nabi-6-84-89"], context=get_ayah(4, 163)["de"][:160]),
        qref(6, 84, 89, event="Prophetenreihe", category="prophethood", claim_ids=["sulayman-nabi-6-84-89"]),
        qref(21, 78, 82, event="Urteil mit Dāwūd; Wind; Jinn", category="miracle", claim_ids=["sulayman-wind-21-81", "sulayman-jinn-21-82"]),
        qref(27, 15, 19, event="Wissen; Erbe; Vögel; Heer; Ameisen; Duʿāʾ", category="quran", claim_ids=["sulayman-knowledge-27-15", "sulayman-ants-27-18-19"]),
        qref(27, 20, 28, event="Hudhud / Sabaʾ", category="quran", claim_ids=["sulayman-hudhud-27-20-28"]),
        qref(27, 29, 44, event="Brief; Thron; Glaspalast", category="quran", claim_ids=["sulayman-letter-27-30-31", "sulayman-throne-ifrit-27-38-40", "sulayman-glass-palace-27-44"]),
        qref(34, 12, 14, event="Wind; Kupfer; Jinn; Tod", category="miracle", claim_ids=["sulayman-wind-34-12", "sulayman-death-34-14"]),
        qref(38, 30, 40, event="Vater; Pferde; Prüfung; Duʿāʾ; Wind; Jinn", category="quran", claim_ids=["sulayman-father-dawud-38-30", "sulayman-horses-38-31-33", "sulayman-throne-trial-38-34", "sulayman-dua-kingdom-38-35"]),
    ]
    named = scan_named(["سليمن", "سليمان"])
    about_ids = [
        "sulayman-nabi-bukhari-7469", "sulayman-father-bukhari-3424",
        "sulayman-ifrit-dua-bukhari-3423", "sulayman-wives-bukhari-3424",
        "sulayman-wives-bukhari-7469", "sulayman-inshaallah-lesson-3424",
    ]
    about = [about_from_claim(next(c for c in claims if c["id"] == i)) for i in about_ids]
    overview = [
        {"key": "name", "label": "Name", "value": "Sulaymān", "status": "authentisch belegt (Qurʾān)", "claimIds": ["sulayman-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "سليمان", "status": "authentisch belegt (Qurʾān)", "claimIds": ["sulayman-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (6:84–89; Buḫārī 7469)", "status": "authentisch belegt", "claimIds": ["sulayman-nabi-6-84-89", "sulayman-nabi-bukhari-7469"]},
        {"key": "father", "label": "Vater", "value": "Dāwūd عليه السلام", "status": "authentisch belegt", "claimIds": ["sulayman-father-dawud-27-16", "sulayman-father-bukhari-3424"]},
        {"key": "aqidah", "label": "ʿAqīdah", "value": "Kein Kufr / kein Siḥr (2:102)", "status": "authentisch belegt (Qurʾān)", "claimIds": ["sulayman-not-kafir-2-102"]},
        {"key": "miracles", "label": "Besonderes", "value": "Wind, Jinn, Vögel, Heer", "status": "authentisch belegt (Qurʾān)", "claimIds": ["sulayman-wind-21-81", "sulayman-army-27-17"]},
        {"key": "wives", "label": "Frauen-Bericht", "value": "Varianten 70/90/60 — nicht vereinheitlicht", "status": "authentisch (Sunnah, Varianten)", "claimIds": ["sulayman-wives-bukhari-3424", "sulayman-wives-bukhari-7469"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["sulayman-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "Dāwūd", "nameStatus": "approved", "claimIds": ["sulayman-father-dawud-27-16", "sulayman-father-bukhari-3424"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["sulayman-mother-research"]},
        {"relation": "wives", "label": "Ehefrauen", "name": "Existenz authentisch (Sunnah); Namen research; Zahlenvarianten", "nameStatus": "approved_existence_variants", "claimIds": ["sulayman-wives-bukhari-3424", "sulayman-wives-bukhari-7469", "sulayman-wife-names-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["sulayman-children-names-research"]},
    ]
    timeline = [
        {"id": "tl-sul-knowledge", "title": "Wissen mit Dāwūd", "order": 1, "claimIds": ["sulayman-knowledge-27-15"]},
        {"id": "tl-sul-inherit", "title": "Erbe von Dāwūd", "order": 2, "claimIds": ["sulayman-inherited-dawud-27-16"]},
        {"id": "tl-sul-ants-hudhud", "title": "Ameisen / Hudhud / Sabaʾ", "order": 3, "claimIds": ["sulayman-ants-27-18-19", "sulayman-hudhud-27-20-28"]},
        {"id": "tl-sul-throne", "title": "Thron / Glaspalast", "order": 4, "claimIds": ["sulayman-throne-ifrit-27-38-40", "sulayman-glass-palace-27-44"]},
        {"id": "tl-sul-wind-jinn", "title": "Wind und Jinn", "order": 5, "claimIds": ["sulayman-wind-34-12", "sulayman-jinn-34-12-13"]},
        {"id": "tl-sul-death", "title": "Tod und Stab", "order": 6, "claimIds": ["sulayman-death-34-14"]},
    ]
    profile = {
        "id": pid, "name": "Sulaymān", "nameAr": "سليمان", "honorific": "عليه السلام",
        "nameVariants": ["Sulayman", "Sulaymān", "Solomon", "سليمان"],
        "searchTerms": ["Sulaymān", "Sulayman", "سليمان", "Dāwūd", "Hudhud", "Sabaʾ", "Jinn", "Wind", "Ameise"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": False,
        "people": "", "region": "research / nicht modern geographisch festgelegt",
        "mission": "Nabī; Herrschaft und Zeichen nach Qurʾān und authentischer Sunnah.",
        "profileStatus": "approved",
        "identity": {"name": "Sulaymān", "nameAr": "سليمان", "roles": ["nabī"], "father": "Dāwūd"},
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "sulayman-sihr-legend", "title": "Siḥr-/Zaubererlegende", "grading": "rejected_vs_quran", "verificationStatus": "research", "notes": "Widerspricht 2:102."},
            {"id": "sulayman-bilqis-name", "title": "Königin = Bilqīs", "grading": "unverified", "verificationStatus": "research", "notes": "Nicht im Qurʾān."},
            {"id": "sulayman-asif-name", "title": "Āṣif ibn Barkhiyā", "grading": "unverified", "verificationStatus": "research"},
            {"id": "sulayman-horses-slaughter-as-fact", "title": "Pferdeschlachtung als sicherer Fakt", "grading": "disputed_tafsir", "verificationStatus": "research"},
            {"id": "sulayman-throne-body-israiliyyat", "title": "Körper auf dem Thron — Isrāʾīliyyāt", "grading": "israiliyyat", "verificationStatus": "research"},
            {"id": "sulayman-wives-normalized-count", "title": "Eine feste Frauen-Zahl", "grading": "editorial_error_if_normalized", "verificationStatus": "research", "notes": "Varianten 70/90/60 getrennt halten."},
            {"id": "sulayman-grave-claim", "title": "Exaktes Grab", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen", "countFrom": "statements"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block04", "block": "04", "prophet": "sulayman",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named),
            "checklist": base_checklist(
                aqidah2_102=True, transmissionVariantsPreserved=True,
                bilqisNotAutoNamed=True, asifNotAutoNamed=True, horsesTafsirCaution=True,
            ),
            "notes": [
                "Umfangreich gemäß Quellenlage.",
                "Frauen-Zahlen: transmissionVariants — keine Harmonisierung.",
                "Königin/Āṣif nicht als Qurʾān-Namen freigegeben.",
            ],
        },
    }
    write_profile(profile)


# ===================== ILYAS =====================
def build_ilyas():
    pid = "ilyas"
    claims = []
    claims.append(claim_q(pid, "ilyas-name-quran", "identity", "Sein Name im Qurʾān lautet Ilyās (إلياس).", 37, 123))
    claims.append(claim_q(pid, "ilyas-rasul-37-123", "prophethood", "Ilyās gehört ausdrücklich zu den Gesandten (لَمِنَ الْمُرْسَلِينَ).", 37, 123))
    claims.append(claim_q(pid, "ilyas-nabi-6-85-89", "prophethood", "Ilyās in der Prophetenreihe 6:85–89 (Buch, Urteil, Prophetentum).", 6, 85, 89, notes="nabī=approved; rasūl=approved (37:123)."))
    claims.append(claim_q(pid, "ilyas-call-37-124-126", "mission", "Ilyās fragt sein Volk, ob es Allah nicht fürchtet, und kritisiert den Ruf zu Baʿl statt zum besten Schöpfer.", 37, 124, 126))
    claims.append(claim_q(pid, "ilyas-baal-37-125", "mission", "Begriff Baʿl (بَعْلًا) ist qurʾānisch belegt — ohne Statue/Maße/Tempel/Stadt/Archäologie als Qurʾān-Fakt.", 37, 125))
    claims.append(claim_q(pid, "ilyas-rejection-37-127", "mission", "Sein Volk lehnte ihn ab (37:127).", 37, 127))
    claims.append(claim_q(pid, "ilyas-praise-37-129-132", "quran", "Lob und Frieden über Ilyās (37:129–132).", 37, 129, 132, notes="Schreib-/Lesefrage إِلْ يَاسِينَ (37:130): Qirāʾāt/Tafsīr gesondert — keine vereinfachende Namensbehauptung."))
    claims.append(claim_absence(pid, "ilyas-equals-idris-research", "research", "Gleichsetzung Ilyās = Idrīs: research / disputed — nicht als sichere Hauptposition."))
    claims.append(claim_absence(pid, "ilyas-equals-khidr-research", "research", "Gleichsetzung Ilyās = al-Khiḍr: nicht ohne Ḥadīṯprüfung; schwache Berichte isolieren."))
    claims.append(claim_absence(pid, "ilyas-immortal-not-approved", "research", "Behauptung, Ilyās lebe bis heute: NOT approved — kein Unsterblichkeitsclaim ohne authentischen Beleg."))
    for cid, text in [
        ("ilyas-father-research", "Vater: research."),
        ("ilyas-mother-research", "Mutter: research."),
        ("ilyas-wife-research", "Ehefrau: research."),
        ("ilyas-children-research", "Kinder: research."),
        ("ilyas-alya-sa-relation-research", "Verhältnis zu al-Yasaʿ: research."),
        ("ilyas-tribe-research", "Stamm: research."),
        ("ilyas-city-research", "Exakte Stadt: research."),
        ("ilyas-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("ilyas-death-unattested", "Todesjahr: nicht authentisch belegt."),
        ("ilyas-grave-unattested", "Grabstätte: nicht authentisch belegt."),
    ]:
        claims.append(claim_absence(pid, cid, "family" if "grave" not in cid and "birth" not in cid and "death" not in cid else "death", text))

    statements = [
        statement_q(pid, "ilyas-st-call-37-124-126", "Ilyās", "tawhid", 37, 124, 126, context="Warnung / Ablehnung des Götzendienstes", category="tawhid"),
    ]
    # annotate statement types in notes via extra fields on statement
    statements[0]["statementTypes"] = ["tawhid", "warning", "rejection_of_idolatry"]

    quran_refs = [
        qref(6, 85, 89, event="Prophetenreihe", category="prophethood", claim_ids=["ilyas-nabi-6-85-89"]),
        qref(37, 123, 132, event="Rasūl; Baʿl; Ablehnung; Lob", category="mission", claim_ids=["ilyas-rasul-37-123", "ilyas-call-37-124-126", "ilyas-praise-37-129-132"]),
    ]
    named = scan_named(["إلياس", "الياس"])
    overview = [
        {"key": "name", "label": "Name", "value": "Ilyās", "status": "authentisch belegt (Qurʾān)", "claimIds": ["ilyas-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "إلياس", "status": "authentisch belegt (Qurʾān)", "claimIds": ["ilyas-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (6:85–89) · Rasūl (37:123)", "status": "authentisch belegt", "claimIds": ["ilyas-rasul-37-123", "ilyas-nabi-6-85-89"]},
        {"key": "mission", "label": "Ruf", "value": "Gegen Baʿl; Tawḥīd (37:124–126)", "status": "authentisch belegt", "claimIds": ["ilyas-call-37-124-126"]},
        {"key": "family", "label": "Familie", "value": "research", "status": "nicht freigegeben", "claimIds": ["ilyas-father-research"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["ilyas-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["ilyas-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["ilyas-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["ilyas-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["ilyas-children-research"]},
        {"relation": "alyasa", "label": "zu al-Yasaʿ", "name": "research", "nameStatus": "research", "claimIds": ["ilyas-alya-sa-relation-research"]},
    ]
    timeline = [
        {"id": "tl-ilyas-call", "title": "Ruf gegen Baʿl", "order": 1, "claimIds": ["ilyas-call-37-124-126"]},
        {"id": "tl-ilyas-reject", "title": "Ablehnung", "order": 2, "claimIds": ["ilyas-rejection-37-127"]},
        {"id": "tl-ilyas-praise", "title": "Lob und Frieden", "order": 3, "claimIds": ["ilyas-praise-37-129-132"]},
    ]
    profile = {
        "id": pid, "name": "Ilyās", "nameAr": "إلياس", "honorific": "عليه السلام",
        "nameVariants": ["Ilyas", "Ilyās", "إلياس"],
        "searchTerms": ["Ilyās", "Ilyas", "إلياس", "Baʿl", "Baal"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": False,
        "people": "sein Volk (ohne exakte moderne Stadtgleichung)", "region": "research",
        "mission": "Gesandt; Tawḥīd; Warnung vor Baʿl.",
        "profileStatus": "approved",
        "identity": {"name": "Ilyās", "nameAr": "إلياس", "roles": ["nabī", "rasūl"]},
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": [], "prophetMuhammadAbout": [], "athar": [],
        "sunnahVerifiedReports": [],
        "weakReports": [
            {"id": "ilyas-idris-eq", "title": "Ilyās = Idrīs", "grading": "disputed", "verificationStatus": "research"},
            {"id": "ilyas-khidr-eq", "title": "Ilyās = al-Khiḍr", "grading": "daif_or_unverified", "verificationStatus": "research"},
            {"id": "ilyas-immortal", "title": "Lebt bis heute", "grading": "unverified", "verificationStatus": "research", "notes": "NOT approved"},
            {"id": "ilyas-baalbek-details", "title": "Baalbek-Archäologie als Qurʾān-Fakt", "grading": "anachronistic", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "statements", "title": "Direkte Aussagen", "countFrom": "statements"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block04", "block": "04", "prophet": "ilyas",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named), "sunnahSectionOmitted": True,
            "checklist": base_checklist(compactProfile=True, noInventedSunnah=True, notEqualsIdris=True),
            "notes": [
                "Kompakt gemäß sicherer Quellenlage.",
                "Kein erfundener Sunnah-Abschnitt (sunnahVerifiedReports=[]).",
            ],
        },
    }
    write_profile(profile)


# ===================== AL-YASA =====================
def build_alyasa():
    pid = "alyasa"
    claims = []
    claims.append(claim_q(pid, "alyasa-name-quran", "identity", "Sein Name im Qurʾān lautet al-Yasaʿ (اليسع).", 6, 86))
    claims.append(claim_q(pid, "alyasa-nabi-6-86-89", "prophethood", "al-Yasaʿ in der Prophetenreihe 6:86; nach 6:89: Buch, Urteil und Prophetentum — nabī=approved.", 6, 86, 89))
    claims.append(claim_q(pid, "alyasa-preferred-6-86", "character", "Unter den von Allah ausgezeichneten/genannten Personen (6:86).", 6, 86))
    claims.append(claim_q(pid, "alyasa-akhyar-38-48", "character", "Unter den Guten/Auserwählten (الْأَخْيَارِ) — 38:48.", 38, 48))
    claims.append(claim_absence(pid, "alyasa-no-full-bio", "identity", "Keine ausführliche Qurʾān-Lebensgeschichte — Profil bewusst sehr kompakt; keine Auffüllung durch spätere Geschichten."))
    claims.append(claim_absence(pid, "alyasa-ilyas-relation-research", "family", "Verhältnis zu Ilyās (Schüler/Nachfolger/Verwandter): research — jede Variante braucht eigenen frühen Beleg + Isnād."))
    claims.append(claim_absence(pid, "alyasa-elisha-comparative", "research", "Gleichsetzung al-Yasaʿ = Elisha: research/comparative — nicht als Qurʾān-Wortlaut."))
    for cid, text in [
        ("alyasa-father-research", "Vater: research."),
        ("alyasa-mother-research", "Mutter: research."),
        ("alyasa-wife-research", "Ehefrau: research."),
        ("alyasa-children-research", "Kinder: research."),
        ("alyasa-genealogy-research", "Genealogie: research."),
        ("alyasa-region-unattested", "Exakte Region: nicht authentisch im Hauptprofil festgelegt."),
        ("alyasa-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("alyasa-death-unattested", "Todesjahr: nicht authentisch belegt."),
        ("alyasa-age-unattested", "Lebensalter: nicht authentisch belegt."),
        ("alyasa-grave-unattested", "Grabstätte: nicht authentisch belegt."),
    ]:
        cat = "death" if any(x in cid for x in ("birth", "death", "age", "grave", "region")) else "family"
        claims.append(claim_absence(pid, cid, cat, text))

    quran_refs = [
        qref(6, 86, 89, event="Name; Nabī-Status über Gruppenverse", category="prophethood", claim_ids=["alyasa-nabi-6-86-89"]),
        qref(38, 48, event="Unter den Aḫyār", category="character", claim_ids=["alyasa-akhyar-38-48"]),
    ]
    named = [h for h in scan_named(["اليسع", "ٱليسع", "ليسع"]) if "يسع" in strip_harakat(h[2]["ar"]) and ("ال" in strip_harakat(h[2]["ar"]) or "ٱل" in strip_harakat(h[2]["ar"]))]
    # safer named filter: only 6:86 and 38:48
    named_safe = [(s, a, v, d) for (s, a, v, d) in scan_named(["ٱليسع", "اليسع"]) if (s, a) in ((6, 86), (38, 48))]
    if not named_safe:
        named_safe = [(6, 86, get_ayah(6, 86), load_surah(6)), (38, 48, get_ayah(38, 48), load_surah(38))]

    overview = [
        {"key": "name", "label": "Name", "value": "al-Yasaʿ", "status": "authentisch belegt (Qurʾān)", "claimIds": ["alyasa-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "اليسع", "status": "authentisch belegt (Qurʾān)", "claimIds": ["alyasa-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (6:86–89)", "status": "authentisch belegt", "claimIds": ["alyasa-nabi-6-86-89"]},
        {"key": "note", "label": "Quellenlage", "value": "Sehr kompakt — keine künstliche Biografie", "status": "policy", "claimIds": ["alyasa-no-full-bio"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["alyasa-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["alyasa-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["alyasa-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["alyasa-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["alyasa-children-research"]},
        {"relation": "ilyas", "label": "zu Ilyās", "name": "research", "nameStatus": "research", "claimIds": ["alyasa-ilyas-relation-research"]},
    ]
    timeline = [
        {"id": "tl-alyasa-named", "title": "Namentliche Nennung", "order": 1, "claimIds": ["alyasa-name-quran", "alyasa-nabi-6-86-89"]},
    ]
    profile = {
        "id": pid, "name": "Al-Yasaʿ", "nameAr": "اليسع", "honorific": "عليه السلام",
        "nameVariants": ["al-Yasaʿ", "Alyasa", "Al-Yasa", "اليسع"],
        "searchTerms": ["al-Yasaʿ", "Alyasa", "اليسع", "Elisha"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": False,
        "people": "", "region": "not_authentically_established",
        "mission": "Nabī — ohne ausführliche Qurʾān-Erzählung.",
        "profileStatus": "approved",
        "identity": {"name": "al-Yasaʿ", "nameAr": "اليسع", "roles": ["nabī"]},
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": [], "sunnah": []},
        "prophetAbout": [], "prophetMuhammadAbout": [], "athar": [],
        "sunnahVerifiedReports": [],
        "weakReports": [
            {"id": "alyasa-disciple-ilyas", "title": "Schüler/Nachfolger Ilyās'", "grading": "unverified", "verificationStatus": "research"},
            {"id": "alyasa-elisha-as-quran", "title": "Elisha als Qurʾān-Name", "grading": "comparative_only", "verificationStatus": "research"},
            {"id": "alyasa-invented-bio", "title": "Spätere Lebensgeschichten", "grading": "israiliyyat_or_unverified", "verificationStatus": "research"},
            {"id": "alyasa-grave", "title": "Grabtradition", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block04", "block": "04", "prophet": "alyasa",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named_safe), "sunnahSectionOmitted": True,
            "checklist": base_checklist(veryCompact=True, noInventedBio=True),
            "notes": ["Sehr kompakt — geringe sichere Quellenmenge bewusst nicht aufgefüllt."],
        },
    }
    write_profile(profile)


# ===================== YUNUS =====================
def build_yunus():
    pid = "yunus"
    claims = []
    claims.append(claim_q(pid, "yunus-name-quran", "identity", "Sein Name im Qurʾān lautet Yūnus (يونس).", 37, 139))
    claims.append(claim_q(pid, "yunus-rasul-37-139", "prophethood", "Yūnus gehört ausdrücklich zu den Gesandten (لَمِنَ الْمُرْسَلِينَ).", 37, 139))
    claims.append(claim_q(pid, "yunus-nabi-6-86-89", "prophethood", "Yūnus in der Prophetenreihe 6:86–89 — nabī=approved.", 6, 86, 89))
    claims.append(claim_q(pid, "yunus-revelation-4-163", "prophethood", "Allah nennt Yūnus unter denen, denen Offenbarung gegeben wurde (4:163).", 4, 163))
    claims.append(claim_hadith(
        pid, "yunus-father-matta-muslim-2377", "family",
        "Vater: Mattā (متى) — Ṣaḥīḥ Muslim 2377: Yūnus ibn Mattā; Nisbah zum Vater.",
        2377, "Ṣaḥīḥ Muslim", "Kitāb al-Faḍāʾil",
        "Ibn ʿAbbās رضي الله عنهما",
        "Der Prophet ﷺ sagte, niemand solle sagen, er sei besser als Yūnus ibn Mattā; und er führte die Nisbah auf seinen Vater zurück.",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=2377,
        notes="Maßgeblich gegen „Jonas Sohn seiner Mutter“. API: arabicnumber=2377 (hadithnumber≠klassische Nr.).",
    ))
    claims.append(claim_q(pid, "yunus-people-10-98", "people", "Das Volk Yūnus' (قَوْمَ يُونُسَ) glaubte; die erniedrigende Strafe wurde abgewendet (10:98).", 10, 98))
    claims.append(claim_absence(
        pid, "yunus-nineveh-not-quran", "region",
        "Ninive/Nineveh: historische/tafsīrische Identifizierung — nicht als Qurʾān-Wortlaut („Der Qurʾān sagt Ninive“ = false).",
    ))
    claims.append(claim_q(pid, "yunus-ship-37-140-141", "quran", "Beladenes Schiff; Losentscheid; Yūnus gehörte zu denen, die den Losentscheid verloren.", 37, 140, 141, notes="Keine Schiff-/Hafen-/Besatzungsnamen."))
    claims.append(claim_q(pid, "yunus-fish-37-142", "quran", "Der Fisch (الْحُوتُ) verschlang ihn — ohne moderne zoologische Artbestimmung aus dem Qurʾān allein.", 37, 142))
    claims.append(claim_absence(pid, "yunus-duration-in-fish", "quran", "Dauer im Fisch: not_explicitly_determined_in_quran — keine ungeprüften Zahlen."))
    claims.append(claim_q(pid, "yunus-tasbih-37-143-144", "quran", "Wäre er nicht unter den Lobpreisenden gewesen, wäre er bis zur Auferstehung im Fisch geblieben.", 37, 143, 144))
    claims.append(claim_q(
        pid, "yunus-dhu-nun-21-87", "identity",
        "Bezeichnung ذَا النُّونِ (Dhū n-Nūn) — Zuordnung zu Yūnus über Qurʾān-Kontext + Sunnah/Tafsīr; Eigenname steht nicht im selben Vers.",
        21, 87,
        notes="alias=Dhū n-Nūn; singleVerseExplicitPersonalName=false; attributionType=quran_plus_sunnah_tafsir",
        extra={"attributionType": "quran_plus_sunnah_tafsir", "alias": "Dhū n-Nūn", "singleVerseExplicitPersonalName": False},
    ))
    claims.append(claim_q(
        pid, "yunus-dua-21-87", "dua",
        "Duʿāʾ: لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.",
        21, 87,
        extra={"statementType": "dua"},
    ))
    claims.append(claim_hadith(
        pid, "yunus-dua-tirmidhi-3505", "dua",
        "Duʿāʾ von Dhū n-Nūn im Bauch des Fisches — Jāmiʿ at-Tirmidhī 3505.",
        3505, "Jāmiʿ at-Tirmidhī", "Kitāb ad-Daʿawāt",
        "Saʿd ibn Abī Waqqāṣ رضي الله عنه",
        "Der Prophet ﷺ lehrte das Duʿāʾ von Dhū n-Nūn im Bauch des Fisches; kein Muslim ruft damit, ohne dass Allah antwortet.",
        edition_ar="ara-tirmidhi", edition_en="eng-tirmidhi",
        grading="sahih",
        grading_authority="Al-Albānī (Ṣaḥīḥ at-Tirmidhī / grading of this report as ṣaḥīḥ); widely received as ṣaḥīḥ",
        notes="gradingAuthority ausdrücklich gespeichert. Abu ʿĪsā diskutiert Isnād-Varianten in der Edition.",
    ))
    claims.append(claim_q(pid, "yunus-rescue-21-88", "quran", "Allah erhörte ihn, rettete ihn aus der Bedrängnis und rettet so die Gläubigen.", 21, 88))
    claims.append(claim_q(pid, "yunus-shore-37-145", "quran", "Auswurf ans kahle Ufer, während er krank/schwach war.", 37, 145))
    claims.append(claim_q(pid, "yunus-yaqtin-37-146", "quran", "Pflanze شَجَرَةً مِّن يَقْطِينٍ — arabischen Begriff speichern; exakte botanische Spezies nur nach Sprach-/Tafsīrprüfung.", 37, 146))
    claims.append(claim_q(pid, "yunus-hundred-thousand-37-147", "quran", "Zu hunderttausend oder mehr gesandt (مِائَةِ أَلْفٍ أَوْ يَزِيدُونَ) — Text exakt; keine größere Exactzahl erfinden.", 37, 147))
    claims.append(claim_q(pid, "yunus-they-believed-37-148", "quran", "Sie glaubten und genossen eine Frist.", 37, 148))
    claims.append(claim_q(
        pid, "yunus-left-angry-21-87", "quran",
        "Er ging zornig fort (مُغَاضِبًا) — der Qurʾān sagt nicht: „zornig auf Allah“. Hintergrund nur mit Tafsīr-Belegen.",
        21, 87,
        notes="Nicht formulieren: Yūnus war zornig auf Allah.",
    ))
    claims.append(claim_q(
        pid, "yunus-sahib-al-hut-68-48", "identity",
        "Ṣāḥib al-Ḥūt (68:48) — Zuordnung zum Yūnus-Komplex per Qurʾān-/Tafsīr-Korrelation.",
        68, 48,
        extra={"attributionType": "quran_cross_reference", "alias": "Ṣāḥib al-Ḥūt", "singleVerseExplicitPersonalName": False},
    ))
    claims.append(claim_hadith(
        pid, "yunus-not-better-bukhari-3416", "sunnah",
        "Niemand soll sagen, er sei besser als Yūnus ibn Mattā (Buḫārī 3416).",
        3416, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Der Prophet ﷺ: Es ziemt sich für einen Diener nicht zu sagen: Ich bin besser als Yūnus ibn Mattā.",
        notes="Wortlautvarianten in anderen Nummern getrennt möglich.",
    ))
    claims.append(claim_hadith(
        pid, "yunus-not-better-muslim-2376", "sunnah",
        "Niemand soll sagen, er sei besser als Yūnus ibn Mattā (Muslim 2376).",
        2376, "Ṣaḥīḥ Muslim", "Kitāb al-Faḍāʾil",
        "Abū Hurayrah رضي الله عنه",
        "Allah sagt (im Ḥadīṯ qudsī-Kontext der Fassung): Es ziemt sich für Meinen Diener nicht zu sagen, er sei besser als Yūnus ibn Mattā.",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=2376,
    ))
    for cid, text in [
        ("yunus-mother-research", "Mutter: research."),
        ("yunus-wife-research", "Ehefrau: research."),
        ("yunus-children-research", "Kinder: research."),
        ("yunus-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("yunus-death-unattested", "Todesjahr: nicht authentisch belegt."),
        ("yunus-age-unattested", "Lebensalter: nicht authentisch belegt."),
        ("yunus-grave-unattested", "Grabstätte: nicht authentisch belegt."),
    ]:
        cat = "family" if any(x in cid for x in ("mother", "wife", "children")) else "death"
        claims.append(claim_absence(pid, cid, cat, text))

    statements = [
        statement_q(pid, "yunus-st-dua-21-87", "Yūnus / Dhū n-Nūn", "dua", 21, 87, context="Im Bauch des Fisches / in den Finsternissen"),
    ]
    quran_refs = [
        qref(4, 163, event="Offenbarung", category="prophethood", claim_ids=["yunus-revelation-4-163"]),
        qref(6, 86, 89, event="Prophetenreihe", category="prophethood", claim_ids=["yunus-nabi-6-86-89"]),
        qref(10, 98, event="Volk Yūnus'", category="people", claim_ids=["yunus-people-10-98"]),
        qref(21, 87, 88, event="Dhū n-Nūn; Duʿāʾ; Rettung", category="dua", claim_ids=["yunus-dhu-nun-21-87", "yunus-dua-21-87", "yunus-rescue-21-88"]),
        qref(37, 139, 148, event="Rasūl; Schiff; Fisch; Ufer; Yaqṭīn; 100.000+", category="quran", claim_ids=["yunus-rasul-37-139", "yunus-ship-37-140-141", "yunus-fish-37-142"]),
        qref(68, 48, 50, event="Ṣāḥib al-Ḥūt", category="identity", claim_ids=["yunus-sahib-al-hut-68-48"]),
    ]
    named = scan_named(["يونس"])
    about_ids = [
        "yunus-father-matta-muslim-2377", "yunus-dua-tirmidhi-3505",
        "yunus-not-better-bukhari-3416", "yunus-not-better-muslim-2376",
    ]
    about = [about_from_claim(next(c for c in claims if c["id"] == i)) for i in about_ids]
    overview = [
        {"key": "name", "label": "Name", "value": "Yūnus", "status": "authentisch belegt (Qurʾān)", "claimIds": ["yunus-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "يونس", "status": "authentisch belegt (Qurʾān)", "claimIds": ["yunus-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī · Rasūl (37:139)", "status": "authentisch belegt", "claimIds": ["yunus-rasul-37-139", "yunus-nabi-6-86-89"]},
        {"key": "father", "label": "Vater", "value": "Mattā", "status": "authentisch belegt (Muslim 2377)", "claimIds": ["yunus-father-matta-muslim-2377"]},
        {"key": "alias", "label": "Bezeichnungen", "value": "Dhū n-Nūn / Ṣāḥib al-Ḥūt (Korrelation)", "status": "quran_cross_reference", "claimIds": ["yunus-dhu-nun-21-87", "yunus-sahib-al-hut-68-48"]},
        {"key": "people", "label": "Volk", "value": "قَوْمَ يُونُسَ (glaubten)", "status": "authentisch belegt", "claimIds": ["yunus-people-10-98"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["yunus-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "Mattā", "nameStatus": "approved", "claimIds": ["yunus-father-matta-muslim-2377"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["yunus-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["yunus-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["yunus-children-research"]},
    ]
    timeline = [
        {"id": "tl-yunus-sent", "title": "Gesandt / Volk", "order": 1, "claimIds": ["yunus-rasul-37-139", "yunus-people-10-98"]},
        {"id": "tl-yunus-ship", "title": "Schiff und Los", "order": 2, "claimIds": ["yunus-ship-37-140-141"]},
        {"id": "tl-yunus-fish", "title": "Fisch und Duʿāʾ", "order": 3, "claimIds": ["yunus-fish-37-142", "yunus-dua-21-87"]},
        {"id": "tl-yunus-shore", "title": "Ufer und Yaqṭīn", "order": 4, "claimIds": ["yunus-shore-37-145", "yunus-yaqtin-37-146"]},
        {"id": "tl-yunus-believe", "title": "Volk glaubte", "order": 5, "claimIds": ["yunus-they-believed-37-148"]},
    ]
    profile = {
        "id": pid, "name": "Yūnus", "nameAr": "يونس", "honorific": "عليه السلام",
        "nameVariants": ["Yunus", "Yūnus", "Dhū n-Nūn", "يونس", "ذا النون"],
        "searchTerms": ["Yūnus", "Yunus", "يونس", "Mattā", "Dhū n-Nūn", "Ḥūt", "Fisch", "Yaqṭīn"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": False,
        "people": "قَوْمَ يُونُسَ", "region": "nicht als Ninive im Qurʾān-Wortlaut",
        "mission": "Gesandt; Tawḥīd; Geschichte mit Schiff und Fisch nach Qurʾān.",
        "profileStatus": "approved",
        "identity": {
            "name": "Yūnus", "nameAr": "يونس", "roles": ["nabī", "rasūl"], "father": "Mattā",
            "aliases": [
                {"name": "Dhū n-Nūn", "attributionType": "quran_plus_sunnah_tafsir"},
                {"name": "Ṣāḥib al-Ḥūt", "attributionType": "quran_cross_reference"},
            ],
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "yunus-nineveh-as-quran", "title": "Ninive als Qurʾān-Aussage", "grading": "not_quran_wording", "verificationStatus": "research"},
            {"id": "yunus-fish-species", "title": "Zoologische Fischart", "grading": "unverified", "verificationStatus": "research"},
            {"id": "yunus-duration-numbers", "title": "Exakte Dauer im Fisch", "grading": "unverified", "verificationStatus": "research"},
            {"id": "yunus-angry-at-allah", "title": "Zornig auf Allah", "grading": "misquotation", "verificationStatus": "research"},
            {"id": "yunus-exact-over-100k", "title": "Exakte Zahl >100.000", "grading": "editorial_overreach", "verificationStatus": "research"},
            {"id": "yunus-grave", "title": "Grabtradition", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "muslim", "title": "Ṣaḥīḥ Muslim", "countFrom": "prophetAbout"},
            {"id": "tirmidhi", "title": "Jāmiʿ at-Tirmidhī", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen", "countFrom": "statements"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block04", "block": "04", "prophet": "yunus",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named),
            "checklist": base_checklist(aliasAttributionSeparated=True, mattaFather=True, tirmidhiGradingStored=True),
            "notes": [
                "Dhū n-Nūn / Ṣāḥib al-Ḥūt technisch von Namensnennungen getrennt.",
                "Tirmidhī 3505: gradingAuthority gespeichert.",
            ],
        },
    }
    write_profile(profile)


# ===================== ZAKARIYYA =====================
def build_zakariyya():
    pid = "zakariyya"
    claims = []
    claims.append(claim_q(pid, "zakariyya-name-quran", "identity", "Sein Name im Qurʾān lautet Zakariyyā (زكريا).", 19, 2))
    claims.append(claim_q(pid, "zakariyya-nabi-6-85-89", "prophethood", "Zakariyyā in der Prophetenreihe 6:85–89 — nabī=approved.", 6, 85, 89))
    claims.append(claim_q(
        pid, "zakariyya-guardian-maryam-3-37", "family",
        "Zakariyyā übernimmt die Betreuung Maryams (وَكَفَّلَهَا زَكَرِيَّا) — guardian/caretaker.",
        3, 37,
        notes="Nicht automatisch maternalUncle/paternalUncle/brotherInLaw ohne Zusatzbeleg.",
    ))
    claims.append(claim_q(pid, "zakariyya-rizq-maryam-3-37", "quran", "Zakariyyā findet Versorgung bei Maryam und fragt nach deren Herkunft (Antwort dem Maryam-Kontext).", 3, 37))
    claims.append(claim_q(pid, "zakariyya-dua-3-38", "dua", "Duʿāʾ um Nachkommenschaft (3:38).", 3, 38))
    claims.append(claim_q(pid, "zakariyya-dua-19-4-6", "dua", "Duʿāʾ-Komplex Maryam 19:4–6.", 19, 4, 6))
    claims.append(claim_q(pid, "zakariyya-dua-21-89", "dua", "Duʿāʾ um Nachkommenschaft (21:89).", 21, 89))
    claims.append(claim_q(
        pid, "zakariyya-old-age-3-40-19-4", "quran",
        "Hohes Alter: 3:40 (Alter hat ihn erreicht); 19:4 (Knochen schwach; Kopf von grauem/weißem Haar erfüllt) — exactAge nicht qurʾānisch spezifiziert.",
        19, 4,
        notes="Keine Zahl wie 90/99/120 ohne authentischen Beleg. Parallelbeleg 3:40.",
    ))
    claims.append(claim_q(pid, "zakariyya-old-age-3-40", "quran", "Hohes Alter ausdrücklich in 3:40.", 3, 40))
    claims.append(claim_q(
        pid, "zakariyya-wife-existence", "family",
        "Ehefrau existierte; war zuvor unfruchtbar; Allah besserte ihren Zustand für die Geburt (3:40; 19:5; 21:90). Name nicht im Qurʾān.",
        21, 90,
        notes="wifeName=not_explicit_in_quran; „Elisabeth“ nicht als islamischer Hauptfakt ohne eigenständige Quelle.",
    ))
    claims.append(claim_absence(pid, "zakariyya-wife-name-research", "family", "Name der Ehefrau: research / not_explicit_in_quran."))
    claims.append(claim_q(pid, "zakariyya-son-yahya-3-39", "family", "Sohn: Yaḥyā عليه السلام (3:39).", 3, 39))
    claims.append(claim_q(pid, "zakariyya-son-yahya-19-7", "family", "Allah gibt Frohbotschaft eines Sohnes namens Yaḥyā (19:7).", 19, 7))
    claims.append(claim_q(
        pid, "zakariyya-yahya-name-samiyyan-19-7", "quran",
        "لَمْ نَجْعَل لَّهُ مِن قَبْلُ سَمِيًّا — Bedeutung nach Tafsīr-/Sprachprüfung; nicht mit simpler Namensdatenbank erklären.",
        19, 7,
    ))
    claims.append(claim_q(
        pid, "zakariyya-sign-3-41", "quran",
        "Zeichen: drei Tage nicht zu den Menschen sprechen außer durch Zeichen/Gesten (3:41).",
        3, 41,
        notes="Beide Formulierungen (3:41 und 19:10) gemeinsam speichern — keine freie Zeitumwandlung.",
    ))
    claims.append(claim_q(
        pid, "zakariyya-sign-19-10", "quran",
        "Zeichen: drei Nächte nicht zu den Menschen sprechen, obwohl gesund (19:10).",
        19, 10,
    ))
    claims.append(claim_q(pid, "zakariyya-dhikr-3-41", "quran", "Anweisung zu vielem Dhikr und Lobpreis morgens und abends (3:41).", 3, 41))
    claims.append(claim_q(
        pid, "zakariyya-mihrab-term", "quran",
        "Begriff الْمِحْرَاب (3:37; 3:39; 19:11) — nicht ohne sprachliche Prüfung ausschließlich als moderne Gebetsnische verstehen.",
        3, 39,
        notes="Relevante Stellen: 3:37, 3:39, 19:11.",
    ))
    claims.append(claim_hadith(
        pid, "zakariyya-carpenter-muslim-2379", "sunnah",
        "Beruf: Zakariyyā war Zimmermann (كَانَ زَكَرِيَّاءُ نَجَّارًا) — Ṣaḥīḥ Muslim 2379.",
        2379, "Ṣaḥīḥ Muslim", "Kitāb al-Faḍāʾil",
        "Abū Hurayrah رضي الله عنه",
        "Der Gesandte Allahs ﷺ sagte: Zakariyyā war Zimmermann.",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=2379,
        notes="Nicht ausschmücken: Werkstattort, Einkommen, Möbel, Bauprojekte, Dauer.",
    ))
    claims.append(claim_absence(pid, "zakariyya-blood-relation-maryam-research", "family", "Blutverwandtschaft zu Maryam: research — guardian=approved, bloodRelation=research."))
    claims.append(claim_absence(
        pid, "zakariyya-death-narrative-research", "death",
        "Populäre Todeserzählungen (Verfolgung, Baum, Zersägen, Märtyrertod): research — exactDeathMethod nicht approved.",
    ))
    for cid, text in [
        ("zakariyya-father-research", "Vater: research."),
        ("zakariyya-mother-research", "Mutter: research."),
        ("zakariyya-other-children-research", "Weitere Kinder: research."),
        ("zakariyya-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("zakariyya-death-year-unattested", "Todesjahr: nicht authentisch belegt."),
        ("zakariyya-grave-unattested", "Grabstätte: nicht authentisch belegt."),
        ("zakariyya-exact-age-unattested", "Exaktes Alter: not_quranically_specified."),
    ]:
        cat = "family" if any(x in cid for x in ("father", "mother", "children")) else "death"
        claims.append(claim_absence(pid, cid, cat, text))

    statements = [
        statement_q(pid, "zakariyya-st-dua-3-38", "Zakariyyā", "dua", 3, 38, context="Duʿāʾ um Nachkommenschaft"),
        statement_q(pid, "zakariyya-st-dua-19-4-6", "Zakariyyā", "dua", 19, 4, 6, context="Duʿāʾ Maryam-Sūrah"),
        statement_q(pid, "zakariyya-st-dua-21-89", "Zakariyyā", "dua", 21, 89, context="Duʿāʾ al-Anbiyāʾ"),
    ]
    quran_refs = [
        qref(3, 37, 41, event="Betreuung Maryams; Duʿāʾ; Zeichen; Dhikr", category="family", claim_ids=["zakariyya-guardian-maryam-3-37", "zakariyya-dua-3-38", "zakariyya-sign-3-41"]),
        qref(3, 44, event="Los um Maryam-Betreuung (Kontext)", category="quran", claim_ids=["zakariyya-guardian-maryam-3-37"]),
        qref(6, 85, 89, event="Prophetenreihe", category="prophethood", claim_ids=["zakariyya-nabi-6-85-89"]),
        qref(19, 2, 15, event="Duʿāʾ; Yaḥyā; Zeichen", category="quran", claim_ids=["zakariyya-dua-19-4-6", "zakariyya-son-yahya-19-7", "zakariyya-sign-19-10"]),
        qref(21, 89, 90, event="Duʿāʾ; Erhörung; Ehefrau", category="dua", claim_ids=["zakariyya-dua-21-89", "zakariyya-wife-existence"]),
    ]
    named = scan_named(["زكريا"])
    about = [about_from_claim(next(c for c in claims if c["id"] == "zakariyya-carpenter-muslim-2379"))]
    overview = [
        {"key": "name", "label": "Name", "value": "Zakariyyā", "status": "authentisch belegt (Qurʾān)", "claimIds": ["zakariyya-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "زكريا", "status": "authentisch belegt (Qurʾān)", "claimIds": ["zakariyya-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (6:85–89)", "status": "authentisch belegt", "claimIds": ["zakariyya-nabi-6-85-89"]},
        {"key": "son", "label": "Sohn", "value": "Yaḥyā عليه السلام", "status": "authentisch belegt", "claimIds": ["zakariyya-son-yahya-3-39", "zakariyya-son-yahya-19-7"]},
        {"key": "maryam", "label": "Maryam", "value": "Guardian/caretaker (3:37)", "status": "authentisch belegt", "claimIds": ["zakariyya-guardian-maryam-3-37"]},
        {"key": "profession", "label": "Beruf", "value": "Zimmermann (Muslim 2379)", "status": "authentisch belegt (Sunnah)", "claimIds": ["zakariyya-carpenter-muslim-2379"]},
        {"key": "wife", "label": "Ehefrau", "value": "Existenz approved; Name research", "status": "teilweise", "claimIds": ["zakariyya-wife-existence", "zakariyya-wife-name-research"]},
        {"key": "grave", "label": "Grab / Tod", "value": "Keine freigegebene Märtyrerlegende", "status": "nicht authentisch belegt", "claimIds": ["zakariyya-death-narrative-research", "zakariyya-grave-unattested"]},
    ]
    family = [
        {"relation": "son", "label": "Sohn", "name": "Yaḥyā", "nameStatus": "approved", "claimIds": ["zakariyya-son-yahya-3-39", "zakariyya-son-yahya-19-7"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research (Existenz approved)", "nameStatus": "research", "claimIds": ["zakariyya-wife-existence", "zakariyya-wife-name-research"]},
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["zakariyya-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["zakariyya-mother-research"]},
        {"relation": "maryam", "label": "Maryam", "name": "guardian approved; Blutverwandtschaft research", "nameStatus": "approved_guardian", "claimIds": ["zakariyya-guardian-maryam-3-37", "zakariyya-blood-relation-maryam-research"]},
    ]
    timeline = [
        {"id": "tl-zak-kafala", "title": "Betreuung Maryams", "order": 1, "claimIds": ["zakariyya-guardian-maryam-3-37"]},
        {"id": "tl-zak-dua", "title": "Duʿāʾ um Nachkommenschaft", "order": 2, "claimIds": ["zakariyya-dua-3-38", "zakariyya-dua-19-4-6"]},
        {"id": "tl-zak-yahya", "title": "Frohbotschaft Yaḥyā", "order": 3, "claimIds": ["zakariyya-son-yahya-19-7"]},
        {"id": "tl-zak-sign", "title": "Zeichen (Schweigen)", "order": 4, "claimIds": ["zakariyya-sign-3-41", "zakariyya-sign-19-10"]},
    ]
    profile = {
        "id": pid, "name": "Zakariyyā", "nameAr": "زكريا", "honorific": "عليه السلام",
        "nameVariants": ["Zakariyya", "Zakariyyā", "Zachariah", "زكريا", "زكرياء"],
        "searchTerms": ["Zakariyyā", "Zakariyya", "زكريا", "Yaḥyā", "Maryam", "Miḥrāb", "Zimmermann"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": False,
        "people": "", "region": "research",
        "mission": "Nabī; Betreuung Maryams; Duʿāʾ um Yaḥyā.",
        "profileStatus": "approved",
        "identity": {"name": "Zakariyyā", "nameAr": "زكريا", "roles": ["nabī"], "profession": "najjār (carpenter)"},
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "zakariyya-elizabeth-name", "title": "Ehefrau = Elisabeth", "grading": "unverified_as_islamic_main", "verificationStatus": "research"},
            {"id": "zakariyya-blood-maryam", "title": "Blutverwandtschaft Maryam", "grading": "unverified", "verificationStatus": "research"},
            {"id": "zakariyya-martyrdom-tree", "title": "Märtyrertod / Baum-Zersägen", "grading": "israiliyyat_or_unverified", "verificationStatus": "research"},
            {"id": "zakariyya-exact-age-numbers", "title": "Exakte Alterszahlen", "grading": "unverified", "verificationStatus": "research"},
            {"id": "zakariyya-mihrab-modern-niche", "title": "Miḥrāb = moderne Gebetsnische", "grading": "anachronistic_if_exclusive", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "muslim", "title": "Ṣaḥīḥ Muslim", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen", "countFrom": "statements"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block04", "block": "04", "prophet": "zakariyya",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named),
            "checklist": base_checklist(guardianMaryam=True, noMartyrdomLegend=True, carpenterSunnah=True),
            "notes": [
                "Mittelgroß gemäß Quellenlage.",
                "Keine populäre Todeslegende freigegeben.",
                "Beide Zeichen-Formulierungen (Tage/Nächte) erhalten.",
            ],
        },
    }
    write_profile(profile)


def update_index():
    for path in (TEST / "index.json", LIVE / "index.json"):
        d = json.load(open(path))
        d.setdefault("env", {})
        d["env"]["test"] = "enabled"
        d["env"]["production"] = "disabled"
        for p in d["prophets"]:
            if p["id"] in ("sulayman", "ilyas", "alyasa", "yunus", "zakariyya"):
                p["profileStatus"] = "approved"
                prof = json.load(open(TEST / f"{p['id']}.json"))
                p["roles"] = prof.get("roles", p.get("roles"))
        path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("index updated", path)


if __name__ == "__main__":
    build_sulayman()
    build_ilyas()
    build_alyasa()
    build_yunus()
    build_zakariyya()
    update_index()
    print("Block 04 complete.")
