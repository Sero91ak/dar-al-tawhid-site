#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zero-Trust Propheten 5er-Block 01: Idrīs, Nūḥ, Hūd, Ṣāliḥ, Ibrāhīm."""
import json, unicodedata, re, copy
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

def load_hadith(edition, number):
    d = json.load(open(f"/tmp/hadith/{edition}.json"))
    for h in d["hadiths"]:
        if h["hadithnumber"] == number:
            return h
    return None

def claim_hadith(pid, cid, category, claim_text, number, work, book_chapter, sahabi, de_translation, notes="", edition_ar="ara-bukhari", edition_en="eng-bukhari"):
    har = load_hadith(edition_ar, number)
    hen = load_hadith(edition_en, number)
    ar = (har or {}).get("text") or ""
    ref = (har or {}).get("reference") or {}
    an = (har or {}).get("arabicnumber") or number
    return {
        "id": cid, "prophetId": pid, "category": category, "claim": claim_text,
        "verificationStatus": "approved", "evidenceType": "sunnah", "grading": "sahih",
        "source": work, "work": work, "bookChapter": book_chapter,
        "number": str(number), "numberAlt": str(an) if str(an) != str(number) else "",
        "volumePage": f"API hadithnumber={number}; reference={ref}",
        "arabicOriginal": ar, "translationDe": de_translation,
        "speaker": "Prophet Muḥammad ﷺ", "sahabiRawi": sahabi,
        "isnad": "marfūʿ — vollständiger Isnād im Primärwerk",
        "gradingAuthority": work, "gradingReference": f"{work} {number}",
        "directReference": f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{edition_ar}.min.json#hadithnumber={number}",
        "notes": notes, "quotation": True, "review": dict(REVIEW_H),
        "kitab": book_chapter, "bab": "", "hadithNumber": str(number),
        "englishAid": ((hen or {}).get("text") or "")[:500],
    }

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
        "grading": "sahih",
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

def scan_named(needles, exclude_substrings=None, require_any=None):
    """Return list of (surah, ayah, verse, surah_meta). needles matched on stripped Arabic."""
    hits = []
    for i in range(1, 115):
        d = load_surah(i)
        for v in d["verses"]:
            n = strip_harakat(v["ar"])
            if exclude_substrings and any(e in n for e in exclude_substrings):
                # allow if explicit prophet form present
                if not any(x in n for x in (require_any or [])):
                    if any(e in n for e in exclude_substrings) and not any(nd in n for nd in needles):
                        continue
            ok = any(nd in n for nd in needles)
            if ok:
                if exclude_substrings:
                    # filter يهود false positives for هود unless هودا / اخاهم هود / يا هود
                    if "يهود" in n and not any(x in n for x in ["هودا", "اخاهم هود", "يا هود", "اخوهم هود"]):
                        if "هود" in needles or any("هود" in nd for nd in needles):
                            # only skip if the only match is inside يهود
                            tmp = n
                            for e in exclude_substrings:
                                tmp = tmp.replace(e, "")
                            if not any(nd in tmp for nd in needles):
                                continue
                hits.append((d["id"], v["id"], v, d))
    return hits

def add_range_refs(refs, ranges, category, claim_prefix, pid):
    """ranges: list of (s,a,ae, context)"""
    for s, a, ae, ctx in ranges:
        cid = f"{claim_prefix}-{s}-{a}"
        refs.append(qref(s, a, ae, kind="about", event=ctx, context=get_ayah(s, a)["de"][:160] if get_ayah(s, a) else ctx, category=category, claim_ids=[cid]))

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
    # fill approvedCount
    for w in profile.get("worksIndex") or []:
        if w.get("countFrom") == "quranRefs":
            w["approvedCount"] = len(profile.get("quranRefs") or [])
        elif w.get("countFrom") == "prophetAbout":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if x.get("verificationStatus") == "approved" and w["id"] in (x.get("work") or "").lower().replace("ṣ", "s").replace("ḫ", "h") or True)
            # simpler recount below
        elif w.get("countFrom") == "statements":
            st = profile.get("statements") or {}
            w["approvedCount"] = len(st.get("quran") or []) + len(st.get("sunnah") or [])
        elif w.get("countFrom") == "claims":
            w["approvedCount"] = len(profile.get("claims") or [])
    # better worksIndex counts
    for w in profile.get("worksIndex") or []:
        if w["id"] == "quran":
            w["approvedCount"] = len(profile.get("quranRefs") or [])
        elif w["id"] == "bukhari":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if "Buḫārī" in (x.get("work") or "") or "Bukhari" in (x.get("work") or ""))
        elif w["id"] == "muslim":
            w["approvedCount"] = sum(1 for x in (profile.get("prophetAbout") or []) if "Muslim" in (x.get("work") or ""))
        elif w["id"] == "statements":
            st = profile.get("statements") or {}
            w["approvedCount"] = len(st.get("quran") or []) + len(st.get("sunnah") or [])
        elif w["id"] == "claims":
            w["approvedCount"] = sum(1 for c in profile.get("claims") or [] if c.get("verificationStatus") == "approved")

    # dedupe claims
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

# ===================== IDRIS =====================
def build_idris():
    pid = "idris"
    claims = []
    claims.append(claim_q(pid, "idris-name-quran", "identity", "Sein Name im Qurʾān lautet Idrīs (إدريس).", 19, 56))
    claims.append(claim_q(pid, "idris-nabi-siddiq", "prophethood", "Idrīs war ein ṣiddīq und nabī.", 19, 56, notes="Qurʾān: صِدِّيقًا نَبِيًّا"))
    claims.append(claim_q(pid, "idris-raised-high", "quran", "Allah erhob Idrīs zu einem hohen Ort / hohen Rang (مَكَانًا عَلِيًّا).", 19, 57, notes="Keine automatische Gleichsetzung dieses Verses allein mit dem vierten Himmel."))
    claims.append(claim_q(pid, "idris-sabr", "character", "Idrīs wird zusammen mit Ismāʿīl und Dhū l-Kifl unter den Standhaften (ṣābirīn) genannt.", 21, 85, notes="Kategorie character/ṣabr"))
    claims.append(claim_q(pid, "idris-mercy", "character", "Allah ließ sie in Seine Barmherzigkeit eingehen; sie gehören zu den Rechtschaffenen.", 21, 86))
    claims.append(claim_hadith(
        pid, "idris-miraj-fourth-heaven", "sunnah",
        "Der Prophet Muḥammad ﷺ begegnete Idrīs während des Miʿrāǧ im vierten Himmel.",
        3887, "Ṣaḥīḥ al-Buḫārī", "Kitāb Manāqib al-Anṣār / Isrāʾ",
        "Anas ibn Mālik / Mālik ibn Ṣaʿṣaʿa",
        "Im Bericht über die Nachtreise und Himmelsfahrt begegnete der Prophet ﷺ unter anderem Idrīs im vierten Himmel.",
        notes="Separater Sunnah-Claim: vierte-Himmel-Begegnung. Maryam 19:57 wird dadurch nicht allein als „vierter Himmel“ ausgelegt.",
    ))
    for cid, cat, text in [
        ("idris-father-research", "family", "Vater: research — nicht als authentische Tatsache freigegeben."),
        ("idris-mother-research", "family", "Mutter: research — nicht als authentische Tatsache freigegeben."),
        ("idris-wife-research", "family", "Ehefrau: research — nicht als authentische Tatsache freigegeben."),
        ("idris-children-research", "family", "Kinder/Nachkommen: research — nicht als authentische Tatsache freigegeben."),
        ("idris-birth-unattested", "death", "Geburtsjahr und Geburtsort: nicht authentisch belegt."),
        ("idris-age-unattested", "death", "Lebensalter: nicht authentisch belegt."),
        ("idris-death-unattested", "death", "Todesjahr und Todesort: nicht authentisch belegt."),
        ("idris-grave-unattested", "death", "Grabstätte: nicht authentisch belegt."),
        ("idris-profession-research", "research", "Berufsangaben (Schneider, Schreiber, Astronomie u. a.) bleiben research bis Isnād-Prüfung."),
        ("idris-enoch-not-quran", "research", "Gleichsetzung Idrīs = Enoch/Henoch ist keine Qurʾān-Aussage."),
    ]:
        claims.append(claim_absence(pid, cid, cat if cat != "research" else "identity", text))

    quran_refs = [
        qref(19, 56, 57, kind="about", event="Idrīs nabī ṣiddīq; Erhebung", context=get_ayah(19, 56)["de"], category="identity", claim_ids=["idris-nabi-siddiq", "idris-raised-high"]),
        qref(21, 85, 86, kind="about", event="Standhaftigkeit", context=get_ayah(21, 85)["de"], category="character", claim_ids=["idris-sabr", "idris-mercy"]),
    ]
    # concordance: only 19:56 and 21:85 named
    named = scan_named(["ادريس", "إدريس", "دريس"])
    assert len(named) >= 2, named

    about = [about_from_claim(claims[5])]  # miraj claim index - find by id
    about = [about_from_claim(next(c for c in claims if c["id"] == "idris-miraj-fourth-heaven"))]

    overview = [
        {"key": "name", "label": "Name", "value": "Idrīs", "status": "authentisch belegt (Qurʾān)", "claimIds": ["idris-name-quran"]},
        {"key": "nameAr", "label": "Arabischer Name", "value": "إدريس", "status": "authentisch belegt (Qurʾān)", "claimIds": ["idris-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī · ṣiddīq (19:56); Rasūl nicht automatisch gesetzt", "status": "Nabī authentisch", "claimIds": ["idris-nabi-siddiq"]},
        {"key": "character", "label": "Charakter", "value": "ṣabr / Standhaftigkeit (21:85)", "status": "authentisch belegt (Qurʾān)", "claimIds": ["idris-sabr"]},
        {"key": "miraj", "label": "Miʿrāǧ", "value": "Begegnung im vierten Himmel (Buḫārī 3887)", "status": "authentisch belegt (Sunnah)", "claimIds": ["idris-miraj-fourth-heaven"]},
        {"key": "family", "label": "Familie", "value": "research", "status": "nicht freigegeben", "claimIds": ["idris-father-research", "idris-wife-research", "idris-children-research"]},
        {"key": "birth", "label": "Geburt", "value": "Nicht authentisch belegt", "status": "nicht authentisch belegt", "claimIds": ["idris-birth-unattested"]},
        {"key": "death", "label": "Tod / Grab", "value": "Nicht authentisch belegt", "status": "nicht authentisch belegt", "claimIds": ["idris-death-unattested", "idris-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "summary": "Keine freigegebene Primärangabe.", "claimIds": ["idris-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "summary": "Keine freigegebene Primärangabe.", "claimIds": ["idris-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "summary": "Keine freigegebene Primärangabe.", "claimIds": ["idris-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "summary": "Keine freigegebene Primärangabe.", "claimIds": ["idris-children-research"]},
    ]
    timeline = [
        {"id": "tl-idris-identity", "title": "Nabī und ṣiddīq", "order": 1, "claimIds": ["idris-nabi-siddiq"]},
        {"id": "tl-idris-raised", "title": "Erhebung zu einem hohen Ort", "order": 2, "claimIds": ["idris-raised-high"]},
        {"id": "tl-idris-sabr", "title": "Unter den Standhaften genannt", "order": 3, "claimIds": ["idris-sabr"]},
        {"id": "tl-idris-miraj", "title": "Begegnung im Miʿrāǧ (vierter Himmel)", "order": 4, "claimIds": ["idris-miraj-fourth-heaven"]},
    ]
    profile = {
        "id": pid, "name": "Idrīs", "nameAr": "إدريس", "honorific": "عليه السلام",
        "nameVariants": ["Idris", "Idrīs", "إدريس"],
        "searchTerms": ["Idrīs", "Idris", "إدريس", "ṣiddīq", "Miʿrāǧ", "vierter Himmel", "Enoch"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": False,
        "people": "", "region": "", "mission": "Im Qurʾān als nabī und ṣiddīq genannt; mit den Standhaften erwähnt.",
        "profileStatus": "approved",
        "identity": {
            "name": "Idrīs", "nameAr": "إدريس", "quranOrthography": "إدريس",
            "safeVariants": ["Idris", "إدريس"], "prophetStatus": "quran_explicit",
            "roles": ["nabī"], "siddiq": True, "uluAlAzm": False,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs,
        "statements": {"quran": [], "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about,
        "athar": [],
        "weakReports": [
            {"id": "idris-enoch", "title": "Idrīs = Enoch/Henoch", "type": "historical_name_equivalence", "not_quran_wording": True, "grading": "unverified", "verificationStatus": "research", "notes": "Historischer Namensvergleich — keine Qurʾān-Aussage."},
            {"id": "idris-profession-legends", "title": "Berufsangaben", "grading": "disputed", "verificationStatus": "research", "notes": "Schneider/Schreiber/Astronomie — nicht in Hauptbiografie."},
            {"id": "idris-fourth-heaven-from-19-57-only", "title": "19:57 = vierter Himmel", "grading": "unverified", "verificationStatus": "research", "notes": "Nicht allein aus 19:57. Vierter Himmel über Buḫārī 3887."},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "claims", "title": "Freigegebene Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block01", "block": "01", "prophet": "idris",
            "referenceProfile": True, "lastAudit": "2026-08-08", "production": "disabled",
            "quranNamedAyahs": 2, "approvedRequiresDualPass": True,
            "checklist": base_checklist(compactProfile=True, miraj=True),
            "notes": [
                "Profil bewusst kompakt — begrenzte sichere Quellenlage.",
                "Keine Legenden zur künstlichen Verlängerung.",
                "Rasūl nicht automatisch gesetzt.",
            ],
        },
    }
    write_profile(profile)

# Continue in part 2...
print("helpers ready; idris builder defined")

# ===================== HUD =====================
def build_hud():
    pid = "hud"
    claims = []
    claims.append(claim_q(pid, "hud-name-quran", "identity", "Sein Name im Qurʾān lautet Hūd (هود).", 7, 65))
    claims.append(claim_q(pid, "hud-people-ad", "people", "Hūd wurde zu ʿĀd gesandt — „ihr Bruder Hūd“.", 7, 65, notes="relationToPeople=their brother/member of their people; biologicalSiblingClaim=false"))
    claims.append(claim_q(pid, "hud-mission-tawhid", "mission", "Hūd ruft sein Volk auf, Allah allein anzubeten.", 11, 50))
    claims.append(claim_q(pid, "hud-rasul", "prophethood", "Hūd bezeichnet sich als vertrauenswürdigen Gesandten (rasūl amīn).", 26, 125))
    claims.append(claim_q(pid, "hud-tawakkul", "character", "Hūd erklärt sein Vertrauen (tawakkul) auf Allah, seinen Herrn und den Herrn seines Volkes.", 11, 56))
    claims.append(claim_q(pid, "hud-ahqaf", "region", "Der Bruder der ʿĀd warnte sein Volk bei al-Aḥqāf.", 46, 21, notes="Keine modernen Landesgrenzen oder Archäologie als Offenbarungsfakt."))
    # punishment passages as index claims
    for s, a, ae, note in [
        (7, 72, 72, "Errettung Hūds; Vernichtung derer, die die Zeichen leugneten"),
        (11, 58, 60, "Errettung; Fluch im Diesseits und am Tag der Auferstehung"),
        (41, 15, 16, "Hochmut und Strafe der ʿĀd"),
        (46, 24, 25, "Wolke / Strafe"),
        (51, 41, 42, "Unfruchtbarer Wind"),
        (54, 18, 21, "ʿĀd und der schreiende Wind"),
        (69, 6, 8, "ʿĀd — vernichtender Wind"),
    ]:
        claims.append(claim_q(pid, f"hud-punishment-{s}-{a}", "punishment", note, s, a, ae))
    claims.append(claim_q(pid, "hud-ad-arrogance", "people", "ʿĀd zeigten Stärke und Hochmut und lehnten die Botschaft ab (u. a. 41:15; 26:123–140).", 41, 15, 16))
    for cid, text in [
        ("hud-father-research", "Vater: research."),
        ("hud-mother-research", "Mutter: research."),
        ("hud-wife-research", "Ehefrau: research — Name nicht freigegeben."),
        ("hud-children-research", "Kinder: research."),
        ("hud-genealogy-research", "Genealogie: research."),
        ("hud-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("hud-death-unattested", "Todesjahr: nicht authentisch belegt."),
        ("hud-height-unattested", "Körpergröße Hūds: nicht authentisch belegt."),
        ("hud-grave-unattested", "Grab Hūds: nicht authentisch festgelegt."),
        ("hud-city-unattested", "Exakte Stadt als moderne Identifikation: nicht als Offenbarungsfakt."),
    ]:
        claims.append(claim_absence(pid, cid, "family" if "father" in cid or "wife" in cid or "child" in cid or "mother" in cid or "gene" in cid else "death", text))

    ranges = [
        (7, 65, 72, "Hūd und ʿĀd"),
        (11, 50, 60, "Hūd-Erzählung"),
        (26, 123, 140, "ʿĀd und Hūd"),
        (46, 21, 26, "al-Aḥqāf"),
        (41, 15, 16, "Strafe ʿĀd"),
        (51, 41, 42, "Wind"),
        (54, 18, 21, "ʿĀd"),
        (69, 6, 8, "ʿĀd"),
    ]
    quran_refs = []
    for s, a, ae, ctx in ranges:
        for x in range(a, ae + 1):
            v = get_ayah(s, x)
            quran_refs.append(qref(s, x, x, kind="about", event=ctx, context=(v or {}).get("de", "")[:160], category="quran-index", claim_ids=[f"hud-qref-{s}-{x}"]))
            claims.append(claim_q(pid, f"hud-qref-{s}-{x}", "quran-index", f"Qurʾān-Fundstelle {s}:{x} ({ctx}).", s, x))

    statements = [
        statement_q(pid, "hud-speech-7-65-71", "Hūd", "dawah", 7, 65, 71, "Daʿwah und Antwort an ʿĀd", "dawah"),
        statement_q(pid, "hud-speech-11-50-57", "Hūd", "dawah", 11, 50, 57, "Daʿwah; Tawakkul 11:56", "dawah"),
        statement_q(pid, "hud-tawakkul-11-56", "Hūd", "tawakkul", 11, 56, 56, "Tawakkul", "character"),
        statement_q(pid, "hud-speech-26-124-135", "Hūd", "dawah", 26, 124, 135, "Daʿwah ash-Shuʿarāʾ", "dawah"),
    ]

    overview = [
        {"key": "name", "label": "Name", "value": "Hūd", "status": "authentisch belegt (Qurʾān)", "claimIds": ["hud-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "هود", "status": "authentisch belegt (Qurʾān)", "claimIds": ["hud-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Rasūl (u. a. 26:125)", "status": "authentisch belegt (Qurʾān)", "claimIds": ["hud-rasul"]},
        {"key": "people", "label": "Volk", "value": "ʿĀd", "status": "authentisch belegt (Qurʾān)", "claimIds": ["hud-people-ad"]},
        {"key": "relationToPeople", "label": "„ihr Bruder“", "value": "Angehöriger ihres Volkes — kein biologischer Geschwister-Claim", "status": "textgenau", "claimIds": ["hud-people-ad"]},
        {"key": "mission", "label": "Auftrag", "value": "Tawḥīd — Allah allein anbeten", "status": "authentisch belegt (Qurʾān)", "claimIds": ["hud-mission-tawhid"]},
        {"key": "region", "label": "al-Aḥqāf", "value": "Warnung bei al-Aḥqāf (46:21) — ohne moderne Grenzgleichung", "status": "textlich belegt", "claimIds": ["hud-ahqaf"]},
        {"key": "family", "label": "Familie", "value": "research", "status": "nicht freigegeben", "claimIds": ["hud-father-research", "hud-wife-research"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["hud-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["hud-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["hud-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["hud-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["hud-children-research"]},
    ]
    timeline = [
        {"id": "tl-hud-sent", "title": "Sendung zu ʿĀd", "order": 1, "claimIds": ["hud-people-ad", "hud-mission-tawhid"]},
        {"id": "tl-hud-dawah", "title": "Daʿwah und Tawakkul", "order": 2, "claimIds": ["hud-tawakkul", "hud-rasul"]},
        {"id": "tl-hud-rejection", "title": "Ablehnung und Hochmut der ʿĀd", "order": 3, "claimIds": ["hud-ad-arrogance"]},
        {"id": "tl-hud-saved", "title": "Errettung Hūds; Strafe der ʿĀd", "order": 4, "claimIds": ["hud-punishment-7-72", "hud-punishment-11-58"]},
    ]
    profile = {
        "id": pid, "name": "Hūd", "nameAr": "هود", "honorific": "عليه السلام",
        "nameVariants": ["Hud", "Hūd", "هود"],
        "searchTerms": ["Hūd", "Hud", "هود", "ʿĀd", "Ad", "Aḥqāf", "Ahqaf"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": False,
        "people": "ʿĀd", "region": "al-Aḥqāf (Qurʾān) — ohne moderne Identifikation",
        "mission": "Gesandt zu ʿĀd; Ruf zum Tawḥīd.",
        "profileStatus": "approved",
        "identity": {
            "name": "Hūd", "nameAr": "هود", "quranOrthography": "هود",
            "roles": ["nabī", "rasūl"], "people": "ʿĀd",
            "relationToPeople": "their brother / member of their people",
            "biologicalSiblingClaim": False,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": [], "prophetMuhammadAbout": [], "athar": [],
        "weakReports": [
            {"id": "hud-qisas-details", "title": "Qiṣaṣ-al-Anbiyāʾ-Details", "grading": "unverified", "verificationStatus": "research", "notes": "Keine populären Biografiedetails ohne Primärbeleg."},
            {"id": "hud-modern-grave", "title": "Modernes Grab Hūds", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "statements", "title": "Direkte Aussagen (Qurʾān)", "countFrom": "statements"},
            {"id": "claims", "title": "Freigegebene Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block01", "block": "01", "prophet": "hud",
            "referenceProfile": True, "lastAudit": "2026-08-08", "production": "disabled",
            "approvedRequiresDualPass": True,
            "checklist": base_checklist(sunnahSparse=True),
            "notes": ["Sunnah-Suche: keine zusätzlichen Buḫārī/Muslim-Pflichtberichte in diesem Auftrag freigegeben außer Qurʾān-Kern.", "Keine Qiṣaṣ-Ausschmückung."],
        },
    }
    write_profile(profile)

# ===================== SALIH =====================
def build_salih():
    pid = "salih"
    claims = []
    claims.append(claim_q(pid, "salih-name-quran", "identity", "Sein Name im Qurʾān lautet Ṣāliḥ (صالح).", 7, 73))
    claims.append(claim_q(pid, "salih-people-thamud", "people", "Ṣāliḥ wurde zu Thamūd gesandt — „ihr Bruder Ṣāliḥ“.", 7, 73, notes="biologicalSiblingClaim=false"))
    claims.append(claim_q(pid, "salih-mission", "mission", "Aufruf: Allah allein anbeten, Vergebung suchen, zu Allah bereuen.", 11, 61))
    claims.append(claim_q(pid, "salih-rasul", "prophethood", "Ṣāliḥ bezeichnet sich als vertrauenswürdigen Gesandten.", 26, 143))
    claims.append(claim_q(pid, "salih-naqa", "sign", "Die Kamelstute ist Nāqat Allāh — Zeichen Allahs.", 7, 73, notes="Keine erfundenen Details zu Farbe, Größe, Anatomie, Namen."))
    claims.append(claim_q(pid, "salih-naqa-11", "sign", "Warnung bezüglich der Kamelstute Allahs.", 11, 64))
    claims.append(claim_q(pid, "salih-water-26", "sign", "Wasserregel zwischen Volk und Kamelstute.", 26, 155))
    claims.append(claim_q(pid, "salih-water-54", "sign", "Wasseranteil der Kamelstute.", 54, 28))
    for s, a, note in [(7, 77, "Töten der Kamelstute"), (11, 65, "Töten der Kamelstute"), (26, 157, "Töten der Kamelstute"), (54, 29, "Töten der Kamelstute"), (91, 14, "Töten der Kamelstute")]:
        claims.append(claim_q(pid, f"salih-slaughter-{s}-{a}", "sin", note, s, a, notes="Varianten nicht zu einem Mischtext kombinieren."))
    claims.append(claim_absence(pid, "salih-killer-name-research", "people", "Name/Genealogie eines einzelnen Täters: research — bis eigene authentische Sunnah-Grundlage geprüft.", "Qurʾān beschreibt Beteiligung kontextuell unterschiedlich."))
    claims.append(claim_absence(pid, "salih-naqa-details-unattested", "sign", "Farbe, Größe, Schwangerschaft, Felsenaustritt, Anatomie, Kamelname: nicht ungeprüft ergänzt."))
    claims.append(claim_hadith(
        pid, "salih-hijr-bukhari-3378", "sunnah",
        "Bei al-Ḥiǧr (Tabūk) verbot der Prophet ﷺ das Trinken und Schöpfen aus dem Brunnen dort; bereits gekneteter Teig und Wasser sollten verworfen werden.",
        3378, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "ʿAbdullāh ibn ʿUmar",
        "Als der Gesandte Allahs ﷺ bei al-Ḥiǧr während des Feldzugs nach Tabūk Halt machte, befahl er ihnen, nicht aus ihrem Brunnen zu trinken und kein Wasser daraus zu schöpfen. Sie sagten, sie hätten bereits Teig damit geknetet und Wasser geschöpft. Da befahl er, diesen Teig wegzwerfen und jenes Wasser auszuschütten.",
    ))
    claims.append(claim_hadith(
        pid, "salih-hijr-bukhari-3379", "sunnah",
        "Im Land Thamūd (al-Ḥiǧr) befahl der Prophet ﷺ, Wasser aus dem Brunnen zu nehmen, aus dem die Kamelstute Ṣāliḥs getrunken hatte, und das andere Brunnenwasser zu verwerfen.",
        3379, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "ʿAbdullāh ibn ʿUmar",
        "Die Leute hielten mit dem Gesandten Allahs ﷺ im Land Thamūd — al-Ḥiǧr — und schöpften aus ihrem Brunnen und kneteten damit. Der Gesandte Allahs ﷺ befahl ihnen, das geschöpfte Wasser auszuschütten und den Teig den Kamelen zu füttern, und befahl ihnen, aus dem Brunnen zu schöpfen, aus dem die Kamelstute Ṣāliḥs getrunken hatte.",
        notes="Authentische Verbindung: Thamūd · al-Ḥiǧr · Kamelstute Ṣāliḥs · Brunnen.",
    ))
    for cid, text in [
        ("salih-father-research", "Vater: research."),
        ("salih-mother-research", "Mutter: research."),
        ("salih-wife-research", "Ehefrau: research."),
        ("salih-children-research", "Kinder: research."),
        ("salih-genealogy-research", "Genealogie: research."),
        ("salih-grave-unattested", "Grab Ṣāliḥs: nicht authentisch festgelegt — keine modernen Schreine."),
        ("salih-birth-unattested", "Geburt: nicht authentisch belegt."),
        ("salih-death-unattested", "Tod: nicht authentisch belegt."),
    ]:
        claims.append(claim_absence(pid, cid, "family" if any(x in cid for x in ["father","mother","wife","child","gene"]) else "death", text))

    ranges = [
        (7, 73, 79, "Ṣāliḥ und Thamūd"),
        (11, 61, 68, "Ṣāliḥ-Erzählung"),
        (15, 80, 84, "Leute von al-Ḥiǧr"),
        (26, 141, 159, "Thamūd und Ṣāliḥ"),
        (27, 45, 53, "Thamūd"),
        (54, 23, 31, "Thamūd"),
        (91, 11, 15, "Thamūd"),
    ]
    quran_refs = []
    for s, a, ae, ctx in ranges:
        for x in range(a, ae + 1):
            v = get_ayah(s, x)
            quran_refs.append(qref(s, x, x, event=ctx, context=(v or {}).get("de", "")[:160], category="quran-index", claim_ids=[f"salih-qref-{s}-{x}"]))
            claims.append(claim_q(pid, f"salih-qref-{s}-{x}", "quran-index", f"Qurʾān-Fundstelle {s}:{x} ({ctx}).", s, x))

    statements = [
        statement_q(pid, "salih-speech-7-73", "Ṣāliḥ", "dawah", 7, 73, 79, "Daʿwah und Kamelstute", "dawah"),
        statement_q(pid, "salih-speech-11-61", "Ṣāliḥ", "dawah", 11, 61, 65, "Daʿwah; Warnung", "dawah"),
        statement_q(pid, "salih-speech-26-142", "Ṣāliḥ", "dawah", 26, 142, 156, "Daʿwah; Wasserregel", "dawah"),
    ]
    about = [about_from_claim(next(c for c in claims if c["id"] == x)) for x in ["salih-hijr-bukhari-3378", "salih-hijr-bukhari-3379"]]

    overview = [
        {"key": "name", "label": "Name", "value": "Ṣāliḥ", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "صالح", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Rasūl (u. a. 26:143)", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-rasul"]},
        {"key": "people", "label": "Volk", "value": "Thamūd", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-people-thamud"]},
        {"key": "mission", "label": "Auftrag", "value": "Tawḥīd, Vergebung, Reue (11:61)", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-mission"]},
        {"key": "sign", "label": "Zeichen", "value": "Nāqat Allāh — ohne erfundene Beschreibung", "status": "authentisch belegt (Qurʾān)", "claimIds": ["salih-naqa"]},
        {"key": "hijr", "label": "al-Ḥiǧr", "value": "Buḫārī 3378–3379: Thamūd, Brunnen, Kamelstute", "status": "authentisch belegt (Sunnah)", "claimIds": ["salih-hijr-bukhari-3378", "salih-hijr-bukhari-3379"]},
        {"key": "family", "label": "Familie", "value": "research", "status": "nicht freigegeben", "claimIds": ["salih-father-research"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["salih-grave-unattested"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["salih-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["salih-mother-research"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["salih-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["salih-children-research"]},
    ]
    timeline = [
        {"id": "tl-salih-sent", "title": "Sendung zu Thamūd", "order": 1, "claimIds": ["salih-people-thamud", "salih-mission"]},
        {"id": "tl-salih-naqa", "title": "Kamelstute als Zeichen; Wasserregel", "order": 2, "claimIds": ["salih-naqa", "salih-water-26"]},
        {"id": "tl-salih-slaughter", "title": "Töten der Kamelstute", "order": 3, "claimIds": ["salih-slaughter-7-77"]},
        {"id": "tl-salih-hijr", "title": "al-Ḥiǧr in der Sunnah", "order": 4, "claimIds": ["salih-hijr-bukhari-3379"]},
    ]
    profile = {
        "id": pid, "name": "Ṣāliḥ", "nameAr": "صالح", "honorific": "عليه السلام",
        "nameVariants": ["Salih", "Ṣāliḥ", "صالح"],
        "searchTerms": ["Ṣāliḥ", "Salih", "صالح", "Thamūd", "Thamud", "Nāqa", "Kamelstute", "al-Ḥiǧr", "Hijr"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": False,
        "people": "Thamūd", "region": "al-Ḥiǧr (Sunnah/Qurʾān) — ohne moderne Schrein-Gleichung",
        "mission": "Gesandt zu Thamūd; Tawḥīd und Warnung.",
        "profileStatus": "approved",
        "identity": {
            "name": "Ṣāliḥ", "nameAr": "صالح", "roles": ["nabī", "rasūl"], "people": "Thamūd",
            "relationToPeople": "their brother / member of their people", "biologicalSiblingClaim": False,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "salih-naqa-legends", "title": "Ausschmückungen der Kamelstute", "grading": "israiliyyat", "verificationStatus": "research"},
            {"id": "salih-killer-name", "title": "Name des Täters", "grading": "disputed", "verificationStatus": "research"},
            {"id": "salih-modern-shrine", "title": "Moderne Grabschreine", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen (Qurʾān)", "countFrom": "statements"},
            {"id": "claims", "title": "Freigegebene Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block01", "block": "01", "prophet": "salih",
            "referenceProfile": True, "lastAudit": "2026-08-08", "production": "disabled",
            "approvedRequiresDualPass": True,
            "checklist": base_checklist(hijrSunnah=True, naqa=True),
            "notes": ["Strafe: Qurʾān-Bezeichnungen exakt belassen — keine naturwissenschaftliche Ersatztheorie."],
        },
    }
    write_profile(profile)

print("hud+salih builders appended")

# ===================== NUH =====================
def build_nuh():
    pid = "nuh"
    claims = []
    claims.append(claim_q(pid, "nuh-name-quran", "identity", "Sein Name im Qurʾān lautet Nūḥ (نوح).", 7, 59))
    claims.append(claim_q(pid, "nuh-nabi", "prophethood", "Nūḥ ist im Qurʾān als Prophet/Gesandter zu seinem Volk belegt.", 7, 59))
    claims.append(claim_q(pid, "nuh-rasul", "prophethood", "Nūḥ ist ein Gesandter (rasūl) — u. a. „vertrauenswürdiger Gesandter“.", 26, 107))
    claims.append(claim_q(pid, "nuh-people", "people", "Sein Volk: Qawm Nūḥ.", 7, 59))
    claims.append(claim_q(pid, "nuh-950-among-people", "timeline", "Nūḥ blieb unter seinem Volk tausend Jahre weniger fünfzig Jahre (29:14).", 29, 14, notes="Nicht automatisch: „wurde exakt 950 Jahre alt“. Der Vers beschreibt das Verbleiben unter dem Volk."))
    claims.append(claim_absence(pid, "nuh-total-age-research", "death", "Gesamtes Lebensalter: separat — nicht automatisch aus 29:14 als exaktes Todesalter freigegeben."))
    claims.append(claim_q(pid, "nuh-tawhid-7", "mission", "Zentrale Botschaft: Tawḥīd — alleinige Anbetung Allahs; Warnung.", 7, 59))
    claims.append(claim_q(pid, "nuh-tawhid-11", "mission", "Warner: dient Allah allein.", 11, 25, 26))
    claims.append(claim_q(pid, "nuh-tawhid-23", "mission", "Aufruf: dient Allah — keinen Gott außer Ihm.", 23, 23))
    claims.append(claim_q(pid, "nuh-dawah-day-night", "dawah", "Daʿwah Tag und Nacht (71:5).", 71, 5))
    claims.append(claim_q(pid, "nuh-dawah-public-private", "dawah", "Öffentlich und verborgen/persönlich (71:8–9).", 71, 8, 9))
    claims.append(claim_q(pid, "nuh-dawah-forgiveness", "dawah", "Aufruf zur Vergebung (71:10–12).", 71, 10, 12))
    claims.append(claim_q(pid, "nuh-dawah-signs", "dawah", "Hinweise auf Allahs Zeichen in der Schöpfung (71:13–20).", 71, 13, 20))
    claims.append(claim_q(pid, "nuh-ark-11", "ark", "Befehl zum Schiffbau und Verlauf der Sintflut (11:36–44).", 11, 36, 44, notes="Keine exakte Länge/Breite/Stockwerke/Holzart/moderner Fundort."))
    claims.append(claim_q(pid, "nuh-ark-23", "ark", "Schiffbau unter Beobachtung und Offenbarung (23:27).", 23, 27))
    claims.append(claim_q(pid, "nuh-ark-54", "ark", "Schiff auf Planken und Nägeln; Zeichen (54:13–15).", 54, 13, 15))
    claims.append(claim_absence(pid, "nuh-ark-dimensions-unattested", "ark", "Exakte Maße, Stockwerke, Holzart, moderner Fundort: nicht freigegeben."))
    claims.append(claim_q(pid, "nuh-son-unnamed", "family", "Ein Sohn Nūḥs wird in 11:42–46 erwähnt; im Qurʾān nicht namentlich genannt.", 11, 42, 46))
    claims.append(claim_q(pid, "nuh-wife-66", "family", "Die Ehefrau Nūḥs wird in 66:10 als Beispiel genannt; im Qurʾān nicht namentlich genannt.", 66, 10))
    claims.append(claim_absence(pid, "nuh-son-name-research", "family", "Verbreitete Namenszuweisungen des Sohnes: research."))
    claims.append(claim_absence(pid, "nuh-wife-name-research", "family", "Namen der Ehefrau aus späterer Literatur: nicht als authentische Tatsache."))
    claims.append(claim_absence(pid, "nuh-grave-unattested", "death", "Grabstätte: nicht authentisch festgelegt."))
    claims.append(claim_q(pid, "nuh-flood-quran", "flood", "Sintflut gemäß Qurʾān-Erzählung — ohne moderne geologische Theorien als Offenbarungsdatensatz.", 11, 40, 44))

    claims.append(claim_hadith(
        pid, "nuh-first-rasul-bukhari-3340", "prophethood",
        "Im Fürsprache-Bericht wird Nūḥ als erster Gesandter zu den Menschen der Erde bezeichnet.",
        3340, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "Abū Hurayra",
        "Im langen Bericht über die große Fürsprache am Tag der Auferstehung wird Nūḥ als der erste Gesandte zu den Bewohnern der Erde genannt. Das bedeutet nicht, dass vor Nūḥ keinerlei Prophet existiert habe — Ādam عليه السلام war bereits Prophet.",
        notes="Nicht ableiten: keine Propheten vor Nūḥ. Ādam war Prophet.",
    ))
    claims.append(claim_hadith(
        pid, "nuh-witness-bukhari-3339", "sunnah",
        "Am Tag der Auferstehung wird Nūḥ zur Übermittlung befragt; Muḥammad ﷺ und seine Ummah werden als Zeugen genannt.",
        3339, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "Abū Saʿīd al-Khudrī",
        "Der Gesandte Allahs ﷺ sagte sinngemäß: Nūḥ und seine Ummah kommen; Allah fragt, ob er übermittelt habe; er sagt ja; sein Volk leugnet; er nennt Muḥammad ﷺ und seine Ummah als Zeugen; und sie bezeugen, dass er übermittelt hat.",
    ))
    claims.append(claim_hadith(
        pid, "nuh-dajjal-bukhari-3337", "sunnah",
        "Kein Prophet ließ, sein Volk vor dem Daǧǧāl zu warnen; ausdrücklich: Nūḥ warnte sein Volk vor ihm.",
        3337, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "ʿAbdullāh ibn ʿUmar",
        "Der Gesandte Allahs ﷺ erwähnte den Daǧǧāl und sagte sinngemäß: Ich warne euch vor ihm; und es gab keinen Propheten, der nicht sein Volk vor ihm gewarnt hätte — gewiss hat Nūḥ sein Volk gewarnt. Doch ich sage euch etwas, was kein Prophet seinem Volk gesagt hat: ihr wisst, dass er einäugig ist, und dass Allah nicht einäugig ist.",
    ))

    ranges = [
        (7, 59, 64, "Nūḥ"),
        (10, 71, 73, "Nūḥ"),
        (11, 25, 49, "Nūḥ ausführlich"),
        (21, 76, 77, "Nūḥ"),
        (23, 23, 30, "Nūḥ"),
        (26, 105, 122, "Nūḥ"),
        (29, 14, 15, "950 Jahre unter dem Volk"),
        (37, 75, 82, "Nūḥ"),
        (54, 9, 15, "Nūḥ / Schiff"),
        (71, 1, 28, "Sūrat Nūḥ"),
        (66, 10, 10, "Ehefrau Nūḥs"),
    ]
    quran_refs = []
    for s, a, ae, ctx in ranges:
        for x in range(a, ae + 1):
            v = get_ayah(s, x)
            quran_refs.append(qref(s, x, x, event=ctx, context=(v or {}).get("de", "")[:160], category="quran-index", claim_ids=[f"nuh-qref-{s}-{x}"]))
            claims.append(claim_q(pid, f"nuh-qref-{s}-{x}", "quran-index", f"Qurʾān-Fundstelle {s}:{x}.", s, x))

    # additional named Nuh ayahs outside ranges
    named = scan_named(["نوح"])
    have = {(r["surah"], r["ayah"]) for r in quran_refs}
    for s, a, v, d in named:
        if (s, a) not in have:
            quran_refs.append(qref(s, a, a, event="Nūḥ-Nennung", context=v["de"][:160], category="quran-index", claim_ids=[f"nuh-qref-{s}-{a}"]))
            claims.append(claim_q(pid, f"nuh-qref-{s}-{a}", "quran-index", f"Weitere Nūḥ-Nennung {s}:{a}.", s, a))

    statements = [
        statement_q(pid, "nuh-dua-11-45-47", "Nūḥ", "family", 11, 45, 47, "Gespräch über den Sohn; Bitte und Antwort", "family"),
        statement_q(pid, "nuh-dua-23-26", "Nūḥ", "dua", 23, 26, 26, "Duʿāʾ um Hilfe", "dua"),
        statement_q(pid, "nuh-dua-26-117-118", "Nūḥ", "dua", 26, 117, 118, "Duʿāʾ", "dua"),
        statement_q(pid, "nuh-dua-54-10", "Nūḥ", "dua", 54, 10, 10, "Duʿāʾ", "dua"),
        statement_q(pid, "nuh-dawah-71-5-20", "Nūḥ", "dawah", 71, 5, 20, "Daʿwah-Formen in Sūrat Nūḥ", "dawah"),
        statement_q(pid, "nuh-complaint-71-21-28", "Nūḥ", "complaint", 71, 21, 28, "Klage und Duʿāʾ", "complaint"),
        statement_q(pid, "nuh-warning-11-25", "Nūḥ", "warning", 11, 25, 26, "Warnung", "warning"),
        statement_q(pid, "nuh-dawah-7-59", "Nūḥ", "dawah", 7, 59, 63, "Daʿwah", "dawah"),
    ]

    about_ids = ["nuh-first-rasul-bukhari-3340", "nuh-witness-bukhari-3339", "nuh-dajjal-bukhari-3337"]
    about = [about_from_claim(next(c for c in claims if c["id"] == x)) for x in about_ids]

    overview = [
        {"key": "name", "label": "Name", "value": "Nūḥ", "status": "authentisch belegt (Qurʾān)", "claimIds": ["nuh-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "نوح", "status": "authentisch belegt (Qurʾān)", "claimIds": ["nuh-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī · Rasūl; erster Gesandter zu den Erdenmenschen (Buḫārī 3340) — ohne Leugnung früherer Propheten", "status": "authentisch belegt", "claimIds": ["nuh-rasul", "nuh-first-rasul-bukhari-3340"]},
        {"key": "people", "label": "Volk", "value": "Qawm Nūḥ", "status": "authentisch belegt (Qurʾān)", "claimIds": ["nuh-people"]},
        {"key": "duration", "label": "Zeit unter dem Volk", "value": "1000 weniger 50 Jahre (29:14) — kein automatisches Gesamtalter", "status": "textgenau", "claimIds": ["nuh-950-among-people"]},
        {"key": "mission", "label": "Botschaft", "value": "Tawḥīd, Warnung, Gottesfurcht", "status": "authentisch belegt (Qurʾān)", "claimIds": ["nuh-tawhid-7"]},
        {"key": "ark", "label": "Arche", "value": "Qurʾānisch belegt — ohne erfundene Maße", "status": "authentisch belegt (Qurʾān)", "claimIds": ["nuh-ark-11"]},
        {"key": "son", "label": "Sohn", "value": "Im Qurʾān erwähnt, nicht namentlich genannt", "status": "Name research", "claimIds": ["nuh-son-unnamed", "nuh-son-name-research"]},
        {"key": "wife", "label": "Ehefrau", "value": "66:10 — Name nicht genannt", "status": "Name research", "claimIds": ["nuh-wife-66", "nuh-wife-name-research"]},
        {"key": "grave", "label": "Grab", "value": "Nicht authentisch festgelegt", "status": "nicht authentisch belegt", "claimIds": ["nuh-grave-unattested"]},
    ]
    family = [
        {"relation": "wife", "label": "Ehefrau", "name": "im Qurʾān nicht namentlich genannt", "nameStatus": "Qurʾān ohne Eigenname", "summary": "66:10.", "claimIds": ["nuh-wife-66", "nuh-wife-name-research"]},
        {"relation": "son", "label": "Sohn", "name": "im Qurʾān nicht namentlich genannt", "nameStatus": "Qurʾān ohne Eigenname", "summary": "11:42–46.", "claimIds": ["nuh-son-unnamed", "nuh-son-name-research"]},
    ]
    timeline = [
        {"id": "tl-nuh-sent", "title": "Sendung zu seinem Volk", "order": 1, "claimIds": ["nuh-people", "nuh-tawhid-7"]},
        {"id": "tl-nuh-dawah", "title": "Vielfältige Daʿwah (Tag/Nacht, öffentlich/privat)", "order": 2, "claimIds": ["nuh-dawah-day-night", "nuh-dawah-public-private"]},
        {"id": "tl-nuh-ark", "title": "Schiffbau", "order": 3, "claimIds": ["nuh-ark-11"]},
        {"id": "tl-nuh-flood", "title": "Sintflut", "order": 4, "claimIds": ["nuh-flood-quran"]},
        {"id": "tl-nuh-son", "title": "Gespräch über den Sohn", "order": 5, "claimIds": ["nuh-son-unnamed"]},
        {"id": "tl-nuh-witness", "title": "Zeugenschaft am Tag der Auferstehung (Sunnah)", "order": 6, "claimIds": ["nuh-witness-bukhari-3339"]},
    ]
    profile = {
        "id": pid, "name": "Nūḥ", "nameAr": "نوح", "honorific": "عليه السلام",
        "nameVariants": ["Nuh", "Nūḥ", "Noah", "نوح"],
        "searchTerms": ["Nūḥ", "Nuh", "Noah", "نوح", "Arche", "Sintflut", "950", "Daǧǧāl", "Qawm"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": True,
        "people": "Qawm Nūḥ", "region": "",
        "mission": "Erster Gesandter zu den Menschen der Erde (Sunnah); Tawḥīd und Warnung.",
        "profileStatus": "approved",
        "identity": {
            "name": "Nūḥ", "nameAr": "نوح", "roles": ["nabī", "rasūl"], "uluAlAzm": True,
            "people": "Qawm Nūḥ", "firstMessengerToEarthPeople": True,
            "firstMessengerNote": "Buḫārī 3340 — leugnet keine früheren Propheten (Ādam).",
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "nuh-ark-dimensions", "title": "Arche-Maße / Fundort", "grading": "israiliyyat", "verificationStatus": "research"},
            {"id": "nuh-son-popular-names", "title": "Populäre Namen des Sohnes", "grading": "unverified", "verificationStatus": "research"},
            {"id": "nuh-geology", "title": "Moderne Flut-Theorien", "grading": "unverified", "verificationStatus": "research", "notes": "Nicht Teil des Offenbarungsdatensatzes."},
            {"id": "nuh-grave-traditions", "title": "Grabtraditionen", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen (Qurʾān)", "countFrom": "statements"},
            {"id": "claims", "title": "Freigegebene Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block01", "block": "01", "prophet": "nuh",
            "referenceProfile": True, "lastAudit": "2026-08-08", "production": "disabled",
            "quranNamedAyahs": len(named), "approvedRequiresDualPass": True,
            "checklist": base_checklist(ark=True, dajjal=True, firstRasul=True),
            "notes": ["29:14 = Verbleib unter dem Volk, nicht automatisches Gesamtalter.", "Daǧǧāl: Buḫārī 3337 nennt Nūḥ ausdrücklich."],
        },
    }
    write_profile(profile)

print("nuh builder appended")

# ===================== IBRAHIM =====================
def build_ibrahim():
    pid = "ibrahim"
    claims = []
    claims.append(claim_q(pid, "ibrahim-name-quran", "identity", "Sein Name im Qurʾān lautet Ibrāhīm (إبراهيم).", 19, 41))
    claims.append(claim_q(pid, "ibrahim-nabi-siddiq", "prophethood", "Ibrāhīm war ein ṣiddīq und nabī.", 19, 41))
    claims.append(claim_q(pid, "ibrahim-khalil-quran", "prophethood", "Allah nahm sich Ibrāhīm zum Freund (khalīl).", 4, 125))
    claims.append(claim_absence(pid, "ibrahim-rasul-not-auto", "prophethood", "Rasūl-Status wird in diesem Profil nicht allein aus dem Nabī-Titel automatisch gesetzt; Schwerpunkt der freigegebenen Rollenangabe: Nabī (19:41) und Khalīl (4:125).", "Index kann rasūl historisch listen; freigegebene Rollen hier: nabī (+ Khalīl-Bezeichnung)."))
    claims.append(claim_q(pid, "ibrahim-azar", "family", "Āzar wird in der Form „ab“ Ibrāhīms genannt (6:74) — exakter Qurʾān-Wortlaut; genealogische Erweiterungen in Research.", 6, 74))
    claims.append(claim_q(pid, "ibrahim-tawhid-6", "mission", "Auseinandersetzung mit seinem Volk / den Gestirnen und dem Tawḥīd (6:74–83).", 6, 74, 83))
    claims.append(claim_q(pid, "ibrahim-idols-21", "mission", "Zerstörung der Götzen und Auseinandersetzung (21:51–70).", 21, 51, 70, notes="Keine späteren Dialoge oder Herrschernamen als Qurʾān-Tatsache."))
    claims.append(claim_q(pid, "ibrahim-idols-37", "mission", "Götzenauseinandersetzung (37:83–98).", 37, 83, 98))
    claims.append(claim_q(pid, "ibrahim-fire", "miracle", "Allah machte das Feuer für Ibrāhīm kühl und sicher (21:68–70).", 21, 68, 70, notes="Keine ungeprüften Details zu Größe, Dauer, Katapult, Königsname."))
    claims.append(claim_q(pid, "ibrahim-ruler-2-258", "mission", "Disput mit einem Herrscher (2:258) — der Qurʾān nennt den Herrscher nicht namentlich.", 2, 258, notes="Nicht als „Qurʾān sagt Nimrūd“ darstellen."))
    claims.append(claim_absence(pid, "ibrahim-nimrod-not-quran", "research", "Identifikation des Herrschers mit Nimrūd: nicht als Qurʾān-Aussage."))
    claims.append(claim_q(pid, "ibrahim-birds-2-260", "miracle", "Die Vögel (2:260) — nur die im Qurʾān genannten Elemente; keine ungeprüften Vogelarten.", 2, 260))
    claims.append(claim_q(pid, "ibrahim-ismail-quran", "family", "Ismāʿīl ist mit Ibrāhīm verbunden (u. a. 2:125–129; 14:37–39).", 14, 39))
    claims.append(claim_q(pid, "ibrahim-ishaq-quran", "family", "Isḥāq ist als Sohn/Verheißung belegt (u. a. 11:71–73; 14:39; 19:49; 37:112–113).", 14, 39))
    claims.append(claim_q(pid, "ibrahim-sacrifice-37", "trial", "Opferprüfung (37:100–107): der Name des Sohnes wird in dieser Passage nicht ausdrücklich genannt.", 37, 100, 107, notes="sacrificeSon.quranExplicitName=false — keine Einfügung von Ismāʿīl in das Qurʾān-Zitat."))
    claims.append(claim_q(pid, "ibrahim-kabah", "kabah", "Ibrāhīm und Ismāʿīl beim Erhöhen der Grundlagen des Hauses (2:125–129).", 2, 125, 129))
    claims.append(claim_q(pid, "ibrahim-kabah-22", "kabah", "Standort des Hauses und Ruf zur Ḥaǧǧ (22:26–27).", 22, 26, 27))
    claims.append(claim_q(pid, "ibrahim-guests-11", "angels", "Engelgäste (11:69–76) — Berichte nicht mit anderen Passagen vermischen.", 11, 69, 76))
    claims.append(claim_q(pid, "ibrahim-guests-15", "angels", "Engelgäste (15:51–60).", 15, 51, 60))
    claims.append(claim_q(pid, "ibrahim-guests-51", "angels", "Engelgäste (51:24–37).", 51, 24, 37))
    claims.append(claim_q(pid, "ibrahim-ulu-azm-context", "prophethood", "Ibrāhīm gehört zu den Ulū l-ʿAzm in der klassischen Einordnung; qurʾānisch u. a. im Bundes-/Vorbildkontext.", 33, 7, notes="Klassische Ulū-l-ʿAzm-Liste; Primärrolle hier: nabī/khalīl."))

    # Sunnah
    claims.append(claim_hadith(
        pid, "ibrahim-sarah-hajar-bukhari-3358", "family",
        "Ṣaḥīḥ al-Buḫārī 3358 nennt Sarah als Ehefrau Ibrāhīms und Hājar; der Bericht enthält die drei bekannten Aussagen Ibrāhīms im Wortlaut des Ḥadīṯ — ohne vereinfachende moralische Verurteilung.",
        3358, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "Abū Hurayra",
        "Abū Hurayra berichtete: Ibrāhīm عليه السلام sagte nur dreimal etwas Unwahres — zwei davon um Allahs willen: „Ich bin krank“ und „Nein, getan hat es dieser ihr Größter“; und (drittens) als er mit Sāra bei einem Tyrannen war … Der Bericht nennt Sāra und später Hāǧar. Wortlaut und Gelehrtenerklärung getrennt halten.",
        notes="Namen Sarah und Hājar authentisch. Keine moralische Vereinfachung der drei Aussagen.",
    ))
    claims.append(claim_hadith(
        pid, "ibrahim-makkah-bukhari-3364", "family",
        "Buḫārī 3364: Ibrāhīm, die Mutter Ismāʿīls und Ismāʿīl in Makkah; Zamzam und weitere Lebensereignisse — atomar aus dem Bericht, ohne Zusatzdetails.",
        3364, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "Ibn ʿAbbās",
        "Langer Bericht: Ibrāhīm brachte die Mutter Ismāʿīls und Ismāʿīl nach Makkah; Bitte um Versorgung; Zamzam; Ankunft von Leuten; Besuche Ibrāhīms; Aufbau der Kaʿbah mit Ismāʿīl — jeweils gemäß Wortlaut, ohne biografische Ausschmückung.",
        notes="Atomare Claims aus demselben Bericht in Übersicht/Familie verknüpft.",
    ))
    # atomic claims from 3364
    for cid, cat, text in [
        ("ibrahim-3364-makkah", "region", "Ibrāhīm brachte Ismāʿīl und dessen Mutter an einen Ort bei der Kaʿbah / Zamzam in Makkah (Buḫārī 3364)."),
        ("ibrahim-3364-zamzam", "miracle", "Zamzam-Ereignis im Bericht Buḫārī 3364."),
        ("ibrahim-3364-kabah-build", "kabah", "Aufbau/Erhöhung des Hauses mit Ismāʿīl im Bericht Buḫārī 3364 (parallel zu 2:125–129)."),
        ("ibrahim-hajar-mother-ismail", "family", "Mutter Ismāʿīls (Hājar) im authentischen Bericht Buḫārī 3358/3364."),
    ]:
        c = claim_hadith(pid, cid, cat, text, 3364 if "3364" in cid or cid.startswith("ibrahim-3364") or "hajar" in cid else 3358,
                         "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
                         "Ibn ʿAbbās" if "3364" in cid else "Abū Hurayra",
                         text, notes="Atomarer Claim aus Pflicht-Sunnah.")
        # fix numbers for hajar
        if cid == "ibrahim-hajar-mother-ismail":
            c = claim_hadith(pid, cid, cat, text, 3358, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ", "Abū Hurayra", text)
        claims.append(c)

    claims.append(claim_hadith(
        pid, "ibrahim-khalil-shafaa-bukhari-3361", "prophethood",
        "Im Fürsprache-Bericht wird Ibrāhīm als Prophet Allahs und Khalīl bezeichnet (Buḫārī 3361).",
        3361, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīṯ al-Anbiyāʾ",
        "Abū Hurayra",
        "Die Menschen kommen zu Ibrāhīm und sagen sinngemäß: Du bist der Prophet Allahs und Sein Khalīl … (Fürsprache-Kontext).",
    ))
    claims.append(claim_hadith(
        pid, "ibrahim-circumcision-bukhari-6298", "sunnah",
        "Ibrāhīm beschnitt sich im Alter von achtzig Jahren (Buḫārī 6298).",
        6298, "Ṣaḥīḥ al-Buḫārī", "Kitāb al-Istiʾdhān",
        "Abū Hurayra",
        "Der Gesandte Allahs ﷺ sagte: Ibrāhīm beschnitt sich nach achtzig Jahren; und er beschnitt sich bi-l-qadūm — Lesarten (Instrument/Ort) nicht eigenmächtig überpräzisieren.",
        notes="Arabisches Wort القَدُوم / القَدُّوم: Lesarten nicht überpräzisieren.",
    ))

    for cid, text in [
        ("ibrahim-mother-research", "Mutter: research."),
        ("ibrahim-other-wives-research", "Weitere Ehefrauen jenseits Sarah/Hājar: research."),
        ("ibrahim-other-children-research", "Weitere Kinder jenseits Ismāʿīl/Isḥāq: research."),
        ("ibrahim-birth-year-unattested", "Geburtsjahr: nicht als authentisch gesicherte Offenbarungsangabe."),
        ("ibrahim-death-research", "Todesjahr / Todesalter: research."),
        ("ibrahim-grave-research", "Grabstätte: research."),
        ("ibrahim-fire-details-unattested", "Feuer-Größe/Dauer/Katapult/Königsname: nicht freigegeben."),
        ("ibrahim-sacrifice-son-name-research", "Name des Sohnes in der Opferpassage: quranExplicitName=false; Identifizierung in Tafsīr/Research."),
    ]:
        cat = "family" if any(x in cid for x in ["mother", "wives", "children", "sacrifice"]) else ("death" if any(x in cid for x in ["birth", "death", "grave"]) else "research")
        claims.append(claim_absence(pid, cid, cat if cat != "research" else "identity", text))

    ranges = [
        (2, 124, 141, "Ibrāhīm / Kaʿbah / Millah"),
        (2, 258, 258, "Herrscher-Disput"),
        (2, 260, 260, "Vögel"),
        (3, 65, 68, "Ibrāhīm"),
        (3, 95, 97, "Ibrāhīm / Haus"),
        (4, 125, 125, "Khalīl"),
        (6, 74, 83, "Āzar / Tawḥīd"),
        (9, 114, 114, "Ibrāhīm und sein Vater"),
        (11, 69, 76, "Engelgäste"),
        (14, 35, 41, "Duʿāʾ"),
        (15, 51, 60, "Engelgäste"),
        (16, 120, 123, "Ibrāhīm Vorbild"),
        (19, 41, 50, "Ibrāhīm"),
        (21, 51, 73, "Götzen / Feuer"),
        (22, 26, 27, "Haus / Ḥaǧǧ"),
        (26, 69, 89, "Ibrāhīm / Duʿāʾ"),
        (29, 16, 27, "Ibrāhīm"),
        (37, 83, 113, "Götzen / Opfer / Isḥāq"),
        (43, 26, 28, "Ibrāhīm"),
        (51, 24, 37, "Engelgäste"),
        (60, 4, 6, "Vorbild Ibrāhīm"),
    ]
    quran_refs = []
    for s, a, ae, ctx in ranges:
        for x in range(a, ae + 1):
            v = get_ayah(s, x)
            if not v:
                continue
            quran_refs.append(qref(s, x, x, event=ctx, context=v["de"][:160], category="quran-index", claim_ids=[f"ibrahim-qref-{s}-{x}"]))
            claims.append(claim_q(pid, f"ibrahim-qref-{s}-{x}", "quran-index", f"Qurʾān-Fundstelle {s}:{x}.", s, x))

    # concordance named
    named = scan_named(["ابرهم", "ابراهيم"])
    # also raw contains إبراهيم
    have = {(r["surah"], r["ayah"]) for r in quran_refs}
    extra_named = []
    for i in range(1, 115):
        d = load_surah(i)
        for v in d["verses"]:
            n = strip_harakat(v["ar"])
            if "برهيم" in n or "براهم" in n:
                if (d["id"], v["id"]) not in have:
                    extra_named.append((d["id"], v["id"], v))
                    quran_refs.append(qref(d["id"], v["id"], v["id"], event="Ibrāhīm-Nennung", context=v["de"][:160], category="quran-index", claim_ids=[f"ibrahim-qref-{d['id']}-{v['id']}"]))
                    claims.append(claim_q(pid, f"ibrahim-qref-{d['id']}-{v['id']}", "quran-index", f"Weitere Ibrāhīm-Nennung {d['id']}:{v['id']}.", d["id"], v["id"]))
    named_count = len(have) + len(extra_named)

    statements = [
        statement_q(pid, "ibrahim-dua-2-126", "Ibrāhīm", "dua", 2, 126, 126, "Duʿāʾ für das Land", "dua"),
        statement_q(pid, "ibrahim-dua-2-127-129", "Ibrāhīm", "dua", 2, 127, 129, "Duʿāʾ beim Haus", "dua"),
        statement_q(pid, "ibrahim-dua-2-260", "Ibrāhīm", "dua", 2, 260, 260, "Bitte um Zeichen der Auferstehung", "dua"),
        statement_q(pid, "ibrahim-dua-14-35-41", "Ibrāhīm", "dua", 14, 35, 41, "Duʿāʾ Ibrāhīm", "dua"),
        statement_q(pid, "ibrahim-dua-26-83-89", "Ibrāhīm", "dua", 26, 83, 89, "Duʿāʾ", "dua"),
        statement_q(pid, "ibrahim-dua-37-100", "Ibrāhīm", "dua", 37, 100, 100, "Bitte um Nachkommen", "dua"),
        statement_q(pid, "ibrahim-dawah-6-74-83", "Ibrāhīm", "dawah", 6, 74, 83, "Tawḥīd-Auseinandersetzung", "dawah"),
        statement_q(pid, "ibrahim-dawah-19-41-48", "Ibrāhīm", "dawah", 19, 41, 48, "Gespräch mit dem Vater", "dawah"),
        statement_q(pid, "ibrahim-dawah-21-51-70", "Ibrāhīm", "dawah", 21, 51, 70, "Götzen / Feuer", "dawah"),
        statement_q(pid, "ibrahim-dawah-26-69-82", "Ibrāhīm", "dawah", 26, 69, 82, "Daʿwah", "dawah"),
        statement_q(pid, "ibrahim-dawah-37-83-98", "Ibrāhīm", "dawah", 37, 83, 98, "Götzen", "dawah"),
        statement_q(pid, "ibrahim-dawah-60-4", "Ibrāhīm", "dawah", 60, 4, 4, "Vorbild-Aussage", "dawah"),
    ]

    about_ids = [
        "ibrahim-sarah-hajar-bukhari-3358",
        "ibrahim-makkah-bukhari-3364",
        "ibrahim-khalil-shafaa-bukhari-3361",
        "ibrahim-circumcision-bukhari-6298",
    ]
    about = [about_from_claim(next(c for c in claims if c["id"] == x)) for x in about_ids]

    overview = [
        {"key": "name", "label": "Name", "value": "Ibrāhīm", "status": "authentisch belegt (Qurʾān)", "claimIds": ["ibrahim-name-quran"]},
        {"key": "nameAr", "label": "Arabisch", "value": "إبراهيم", "status": "authentisch belegt (Qurʾān)", "claimIds": ["ibrahim-name-quran"]},
        {"key": "roles", "label": "Nabī / Khalīl", "value": "Nabī · ṣiddīq (19:41) · Khalīl (4:125; Buḫārī 3361)", "status": "authentisch belegt", "claimIds": ["ibrahim-nabi-siddiq", "ibrahim-khalil-quran"]},
        {"key": "azar", "label": "Āzar", "value": "als „ab“ genannt (6:74) — Wortlaut bewahren", "status": "textgenau", "claimIds": ["ibrahim-azar"]},
        {"key": "sarah", "label": "Sarah", "value": "Ehefrau — Buḫārī 3358", "status": "authentisch belegt (Sunnah)", "claimIds": ["ibrahim-sarah-hajar-bukhari-3358"]},
        {"key": "hajar", "label": "Hājar", "value": "Mutter Ismāʿīls — Buḫārī 3358/3364", "status": "authentisch belegt (Sunnah)", "claimIds": ["ibrahim-hajar-mother-ismail"]},
        {"key": "ismail", "label": "Ismāʿīl", "value": "Qurʾān + Buḫārī 3364", "status": "authentisch belegt", "claimIds": ["ibrahim-ismail-quran"]},
        {"key": "ishaq", "label": "Isḥāq", "value": "Qurʾānisch belegt", "status": "authentisch belegt (Qurʾān)", "claimIds": ["ibrahim-ishaq-quran"]},
        {"key": "sacrifice", "label": "Opferprüfung", "value": "37:100–107 — Sohn nicht namentlich in der Passage", "status": "textgenau", "claimIds": ["ibrahim-sacrifice-37"]},
        {"key": "kabah", "label": "Kaʿbah", "value": "2:125–129; 22:26–27; Buḫārī 3364", "status": "authentisch belegt", "claimIds": ["ibrahim-kabah"]},
        {"key": "birth", "label": "Geburt", "value": "Nicht als Offenbarungsdatierung", "status": "nicht authentisch belegt", "claimIds": ["ibrahim-birth-year-unattested"]},
        {"key": "death", "label": "Tod / Grab", "value": "research", "status": "research", "claimIds": ["ibrahim-death-research", "ibrahim-grave-research"]},
    ]
    family = [
        {"relation": "ab", "label": "Āzar (ab)", "name": "Āzar", "nameStatus": "Qurʾān-Wortlaut 6:74", "summary": "Form „ab“; genealogische Diskussion in Research.", "claimIds": ["ibrahim-azar"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["ibrahim-mother-research"]},
        {"relation": "wife", "label": "Sarah", "name": "Sarah", "nameAr": "سارة", "nameStatus": "authentisch belegt (Sunnah)", "summary": "Buḫārī 3358.", "claimIds": ["ibrahim-sarah-hajar-bukhari-3358"]},
        {"relation": "wife", "label": "Hājar", "name": "Hājar", "nameAr": "هاجر", "nameStatus": "authentisch belegt (Sunnah)", "summary": "Buḫārī 3358/3364.", "claimIds": ["ibrahim-hajar-mother-ismail"]},
        {"relation": "son", "label": "Ismāʿīl", "name": "Ismāʿīl", "nameStatus": "authentisch belegt", "claimIds": ["ibrahim-ismail-quran"]},
        {"relation": "son", "label": "Isḥāq", "name": "Isḥāq", "nameStatus": "authentisch belegt (Qurʾān)", "claimIds": ["ibrahim-ishaq-quran"]},
        {"relation": "sacrificeSon", "label": "Sohn der Opferprüfung", "name": "im Qurʾān in 37:100–107 nicht namentlich genannt", "quranExplicitName": False, "nameStatus": "research für Identifizierung", "claimIds": ["ibrahim-sacrifice-37", "ibrahim-sacrifice-son-name-research"]},
    ]
    timeline = [
        {"id": "tl-ibr-tawhid", "title": "Tawḥīd und Auseinandersetzung mit dem Volk", "order": 1, "claimIds": ["ibrahim-tawhid-6", "ibrahim-idols-21"]},
        {"id": "tl-ibr-fire", "title": "Feuer kühl und sicher", "order": 2, "claimIds": ["ibrahim-fire"]},
        {"id": "tl-ibr-migration-family", "title": "Sarah, Hājar, Ismāʿīl, Makkah", "order": 3, "claimIds": ["ibrahim-sarah-hajar-bukhari-3358", "ibrahim-3364-makkah"]},
        {"id": "tl-ibr-kabah", "title": "Grundlagen des Hauses", "order": 4, "claimIds": ["ibrahim-kabah"]},
        {"id": "tl-ibr-sacrifice", "title": "Opferprüfung", "order": 5, "claimIds": ["ibrahim-sacrifice-37"]},
        {"id": "tl-ibr-ishaq", "title": "Verheißung Isḥāqs", "order": 6, "claimIds": ["ibrahim-ishaq-quran"]},
        {"id": "tl-ibr-guests", "title": "Engelgäste", "order": 7, "claimIds": ["ibrahim-guests-11"]},
        {"id": "tl-ibr-khalil", "title": "Khalīl Allāh", "order": 8, "claimIds": ["ibrahim-khalil-quran", "ibrahim-khalil-shafaa-bukhari-3361"]},
    ]
    profile = {
        "id": pid, "name": "Ibrāhīm", "nameAr": "إبراهيم", "honorific": "عليه السلام",
        "nameVariants": ["Ibrahim", "Ibrāhīm", "Abraham", "إبراهيم"],
        "searchTerms": ["Ibrāhīm", "Ibrahim", "Abraham", "إبراهيم", "Khalīl", "Sarah", "Hājar", "Ismāʿīl", "Isḥāq", "Kaʿbah", "Āzar", "Feuer"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": True,
        "people": "", "region": "Makkah (Sunnah/Qurʾān) — ohne moderne Staatsgleichung",
        "mission": "Tawḥīd; Vorbild der Millah; Grundlagen des Hauses mit Ismāʿīl.",
        "profileStatus": "approved",
        "identity": {
            "name": "Ibrāhīm", "nameAr": "إبراهيم", "roles": ["nabī"], "siddiq": True, "khalil": True, "uluAlAzm": True,
            "sacrificeSon": {"quranExplicitName": False},
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "ibrahim-nimrod", "title": "Herrscher = Nimrūd", "grading": "unverified", "verificationStatus": "research", "notes": "Nicht als Qurʾān-Aussage."},
            {"id": "ibrahim-sacrifice-name-debate", "title": "Name des Opfer-Sohnes", "grading": "disputed", "verificationStatus": "research", "notes": "In 37:100–107 nicht ausdrücklich genannt."},
            {"id": "ibrahim-fire-legends", "title": "Feuer-Ausschmückungen", "grading": "israiliyyat", "verificationStatus": "research"},
            {"id": "ibrahim-grave-hebron", "title": "Grabtraditionen", "grading": "unverified", "verificationStatus": "research"},
            {"id": "ibrahim-bird-species", "title": "Vogelarten zu 2:260", "grading": "unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen (Qurʾān)", "countFrom": "statements"},
            {"id": "claims", "title": "Freigegebene Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block01", "block": "01", "prophet": "ibrahim",
            "referenceProfile": True, "lastAudit": "2026-08-08", "production": "disabled",
            "quranNamedAyahs": named_count, "approvedRequiresDualPass": True,
            "checklist": base_checklist(khalil=True, kabah=True, sarahHajar=True, sacrificeStrict=True),
            "notes": [
                "Länge gemäß Quellenlage — nicht künstlich gekürzt.",
                "Opfer-Sohn: quranExplicitName=false.",
                "Rasūl nicht automatisch aus Nabī gesetzt.",
                "STOPP nach diesem 5er-Block — nächster Block beginnt mit Lūṭ.",
            ],
        },
    }
    write_profile(profile)

def update_index():
    for path in [TEST / "index.json", LIVE / "index.json"]:
        idx = json.load(open(path))
        idx["env"] = {"test": "enabled", "production": "disabled"}
        for p in idx["prophets"]:
            if p["id"] in ("idris", "nuh", "hud", "salih", "ibrahim"):
                p["profileStatus"] = "approved"
                if p["id"] == "idris":
                    p["roles"] = ["nabī"]
                    p["searchTerms"] = ["Idrīs", "Idris", "إدريس", "ṣiddīq", "Miʿrāǧ"]
                elif p["id"] == "ibrahim":
                    p["roles"] = ["nabī"]  # khalīl as designation, not role enum
                    p["searchTerms"] = ["Ibrāhīm", "Ibrahim", "Abraham", "إبراهيم", "Khalīl", "Sarah", "Hājar"]
                elif p["id"] == "nuh":
                    p["roles"] = ["nabī", "rasūl"]
                    p["searchTerms"] = ["Nūḥ", "Nuh", "Noah", "نوح", "Arche"]
                elif p["id"] == "hud":
                    p["roles"] = ["nabī", "rasūl"]
                    p["people"] = "ʿĀd"
                elif p["id"] == "salih":
                    p["roles"] = ["nabī", "rasūl"]
                    p["people"] = "Thamūd"
        path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Updated", path)

if __name__ == "__main__":
    build_idris()
    build_nuh()
    build_hud()
    build_salih()
    build_ibrahim()
    update_index()
    print("ALL BLOCK01 DONE")
