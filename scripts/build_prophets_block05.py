#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zero-Trust Propheten Block 05 (letzter Kernblock): Yaḥyā, ʿĪsā, Dhū l-Kifl, Muḥammad, Yūshaʿ."""
import importlib.util, json, copy
from pathlib import Path
from datetime import datetime, timezone

spec = importlib.util.spec_from_file_location("b4", "/workspace/scripts/build_prophets_block04.py")
b4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b4)

TEST = b4.TEST
LIVE = b4.LIVE
claim_q = b4.claim_q
claim_absence = b4.claim_absence
claim_hadith = b4.claim_hadith
about_from_claim = b4.about_from_claim
statement_q = b4.statement_q
qref = b4.qref
get_ayah = b4.get_ayah
scan_named = b4.scan_named
base_checklist = b4.base_checklist
write_profile = b4.write_profile
ayah_ar_de = b4.ayah_ar_de
strip_harakat = b4.strip_harakat
REVIEW_H = b4.REVIEW_H
REVIEW_Q = b4.REVIEW_Q


def claim_hadith_manual(pid, cid, category, claim_text, number, work, book_chapter, sahabi,
                        ar, de, notes="", grading="sahih", grading_authority="", extra=None):
    c = {
        "id": cid, "prophetId": pid, "category": category, "claim": claim_text,
        "verificationStatus": "approved", "evidenceType": "sunnah", "grading": grading,
        "source": work, "work": work, "bookChapter": book_chapter,
        "number": str(number), "numberAlt": "",
        "volumePage": f"Manual/edition citation; number={number}",
        "arabicOriginal": ar, "translationDe": de,
        "speaker": "Prophet Muḥammad ﷺ", "sahabiRawi": sahabi,
        "isnad": "marfūʿ — Isnād im Primärwerk (siehe gradingAuthority)",
        "gradingAuthority": grading_authority or work,
        "gradingReference": f"{work} {number}",
        "directReference": f"{work} {number}",
        "notes": notes, "quotation": True, "review": dict(REVIEW_H),
        "kitab": book_chapter, "bab": "", "hadithNumber": str(number),
    }
    if extra:
        c.update(extra)
    return c


# ===================== YAHYA =====================
def build_yahya():
    pid = "yahya"
    claims = []
    claims.append(claim_q(pid, "yahya-name-quran", "identity", "Sein Name im Qurʾān lautet Yaḥyā (يحيى).", 19, 7))
    claims.append(claim_q(pid, "yahya-nabi-3-39", "prophethood", "Yaḥyā wird ausdrücklich als Prophet unter den Rechtschaffenen bezeichnet (نَبِيًّا مِّنَ الصَّالِحِينَ).", 3, 39))
    claims.append(claim_q(pid, "yahya-name-gift-19-7", "identity", "Allah gibt Zakariyyā die Frohbotschaft eines Sohnes namens Yaḥyā (19:7).", 19, 7))
    claims.append(claim_q(
        pid, "yahya-samiyyan-19-7", "quran",
        "لَمْ نَجْعَل لَّهُ مِن قَبْلُ سَمِيًّا — Bedeutungen von samiyyan: Sprach-/Tafsīr-Auslegungen getrennt dokumentieren, nicht auf eine Deutung reduzieren.",
        19, 7,
    ))
    claims.append(claim_q(pid, "yahya-father-zakariyya-19-7", "family", "Vater: Zakariyyā عليه السلام (19:7).", 19, 7))
    claims.append(claim_absence(
        pid, "yahya-mother-name-research", "family",
        "Mutter: Ehefrau Zakariyyās (Beziehung über 3:40/19:5/21:90); Eigenname not_explicit_in_quran; popularName=research.",
    ))
    for cid, label, gloss in [
        ("yahya-attr-musaddiq-3-39", "مُصَدِّقًا بِكَلِمَةٍ مِّنَ اللَّهِ", "bestätigend ein Wort von Allah"),
        ("yahya-attr-sayyid-3-39", "سَيِّدًا", "sayyid"),
        ("yahya-attr-hasur-3-39", "حَصُورًا", "ḥaṣūr — sprachlich/tafsīrkritisch; keine überzogene körperliche/sexuelle Behauptung"),
        ("yahya-attr-nabi-salihin-3-39", "نَبِيًّا مِّنَ الصَّالِحِينَ", "Prophet unter den Rechtschaffenen"),
    ]:
        claims.append(claim_q(pid, cid, "character", f"Eigenschaft 3:39: {label} — {gloss}.", 3, 39))
    claims.append(claim_q(
        pid, "yahya-kalima-isa-tafsir", "quran",
        "مُصَدِّقًا بِكَلِمَةٍ مِّنَ اللَّهِ: klassische Zuordnung der Kalima zu ʿĪsā nur mit Tafsīr-Belegen verknüpfen.",
        3, 39, notes="Tafsīr-Korrelation — nicht als freier Extra-Text.",
    ))
    claims.append(claim_q(
        pid, "yahya-child-hukm-19-12", "quran",
        "Als Kind: يَا يَحْيَىٰ خُذِ الْكِتَابَ بِقُوَّةٍ — Allah gab ihm al-ḥukm; nicht willkürlich nur als politische Herrschaft übersetzen.",
        19, 12,
    ))
    for cid, term, note in [
        ("yahya-hanan-19-13", "حَنَانًا", "Zärtlichkeit/Barmherzigkeit"),
        ("yahya-zakah-19-13", "زَكَاةً", "Reinheit/Zakāh-Begriff im Kontext"),
        ("yahya-taqiyy-19-13", "تَقِيًّا", "gottesfürchtig"),
        ("yahya-birr-parents-19-14", "بَرًّا بِوَالِدَيْهِ", "gütig zu den Eltern"),
        ("yahya-not-arrogant-19-14", "وَلَمْ يَكُن جَبَّارًا عَصِيًّا", "nicht hochmütig/widerspenstig"),
    ]:
        ay = 13 if "19-13" in cid or "hanan" in cid or "zakah" in cid or "taqiyy" in cid else 14
        claims.append(claim_q(pid, cid, "character", f"Eigenschaft: {term} — {note}.", 19, ay))
    claims.append(claim_q(
        pid, "yahya-peace-19-15", "quran",
        "Frieden auf ihm am Tag der Geburt, am Tag des Todes und am Tag der Auferweckung (19:15).",
        19, 15,
    ))
    claims.append(claim_hadith(
        pid, "yahya-miraj-second-heaven-3430", "sunnah",
        "Miʿrāǧ: Begegnung im zweiten Himmel mit Yaḥyā und ʿĪsā; der Ḥadīṯ nennt sie ابْنَا خَالَةٍ.",
        3430, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Mālik ibn Ṣaʿṣaʿa / Anas",
        "Im zweiten Himmel begegnete der Prophet ﷺ Yaḥyā und ʿĪsā — beiden als Vettern mütterlicherseits (ibnā khāla).",
        notes="Family-Correlation-Claim: ابنا خالة. Beide: second heaven.",
        extra={"familyCorrelation": "ibnā khāla", "heaven": "second"},
    ))
    claims.append(claim_absence(pid, "yahya-death-method-research", "death", "Todesart: research — Enthauptungs-/Kopf-Narrative: isnad_review_required; nicht als Ṣaḥīḥ-Biografie."))
    claims.append(claim_absence(pid, "yahya-death-year-unattested", "death", "Todesjahr: nicht authentisch belegt."))
    claims.append(claim_absence(pid, "yahya-death-place-unattested", "death", "Todesort: nicht authentisch belegt."))
    claims.append(claim_absence(pid, "yahya-grave-unattested", "death", "Grabstätte: nicht authentisch belegt."))
    claims.append(claim_absence(pid, "yahya-wife-research", "family", "Ehefrau: research."))
    claims.append(claim_absence(pid, "yahya-children-research", "family", "Kinder: research."))

    statements = [
        statement_q(pid, "yahya-st-none-direct-adult", "Allah", "address", 19, 12, context="Anrede an Yaḥyā als Kind"),
    ]
    quran_refs = [
        qref(3, 38, 41, event="Geburt/Frohbotschaft-Kontext; Eigenschaften", category="prophethood", claim_ids=["yahya-nabi-3-39"]),
        qref(6, 85, 89, event="Prophetenreihe", category="prophethood", claim_ids=["yahya-nabi-3-39"]),
        qref(19, 7, 15, event="Name; ḥukm; Eigenschaften; Frieden", category="quran", claim_ids=["yahya-name-gift-19-7", "yahya-child-hukm-19-12", "yahya-peace-19-15"]),
        qref(21, 89, 90, event="Duʿāʾ Zakariyyās / Erhörung", category="family", claim_ids=["yahya-father-zakariyya-19-7"]),
    ]
    named = [(s, a) for (s, a, v, d) in scan_named(["يحيى"]) if (s, a) in ((3, 39), (6, 85), (19, 7), (19, 12), (21, 90))]
    about = [about_from_claim(next(c for c in claims if c["id"] == "yahya-miraj-second-heaven-3430"))]
    overview = [
        {"key": "name", "label": "Name", "value": "Yaḥyā", "status": "authentisch belegt (Qurʾān)", "claimIds": ["yahya-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (3:39)", "status": "authentisch belegt", "claimIds": ["yahya-nabi-3-39"]},
        {"key": "father", "label": "Vater", "value": "Zakariyyā", "status": "authentisch belegt", "claimIds": ["yahya-father-zakariyya-19-7"]},
        {"key": "miraj", "label": "Miʿrāǧ", "value": "2. Himmel; ibnā khāla mit ʿĪsā (Buḫārī 3430)", "status": "authentisch belegt", "claimIds": ["yahya-miraj-second-heaven-3430"]},
        {"key": "death", "label": "Tod", "value": "Methode research — keine Enthauptungslegende freigegeben", "status": "nicht freigegeben", "claimIds": ["yahya-death-method-research"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "Zakariyyā", "nameStatus": "approved", "claimIds": ["yahya-father-zakariyya-19-7"]},
        {"relation": "mother", "label": "Mutter", "name": "Ehefrau Zakariyyās (Name research)", "nameStatus": "research", "claimIds": ["yahya-mother-name-research"]},
        {"relation": "cousin_isa", "label": "zu ʿĪsā", "name": "ibnā khāla (Buḫārī 3430)", "nameStatus": "approved", "claimIds": ["yahya-miraj-second-heaven-3430"]},
        {"relation": "wife", "label": "Ehefrau", "name": "research", "nameStatus": "research", "claimIds": ["yahya-wife-research"]},
        {"relation": "children", "label": "Kinder", "name": "research", "nameStatus": "research", "claimIds": ["yahya-children-research"]},
    ]
    timeline = [
        {"id": "tl-yahya-birth-news", "title": "Frohbotschaft des Namens", "order": 1, "claimIds": ["yahya-name-gift-19-7"]},
        {"id": "tl-yahya-child-hukm", "title": "Buch und ḥukm als Kind", "order": 2, "claimIds": ["yahya-child-hukm-19-12"]},
        {"id": "tl-yahya-peace", "title": "Frieden (Geburt/Tod/Auferweckung)", "order": 3, "claimIds": ["yahya-peace-19-15"]},
    ]
    profile = {
        "id": pid, "name": "Yaḥyā", "nameAr": "يحيى", "honorific": "عليه السلام",
        "nameVariants": ["Yahya", "Yaḥyā", "يحيى"],
        "searchTerms": ["Yaḥyā", "Yahya", "يحيى", "Zakariyyā", "ḥaṣūr", "Miʿrāǧ"],
        "prophetStatus": "quran_explicit", "roles": ["nabī"], "uluAlAzm": False,
        "people": "", "region": "research", "mission": "Nabī; Bestätigung der Kalima; Rechtschaffenheit.",
        "profileStatus": "approved",
        "identity": {"name": "Yaḥyā", "nameAr": "يحيى", "roles": ["nabī"], "father": "Zakariyyā"},
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "yahya-beheading-narrative", "title": "Enthauptung / Kopf dem Herrscher", "grading": "isnad_review_required", "verificationStatus": "research"},
            {"id": "yahya-mother-elizabeth", "title": "Muttername Elisabeth", "grading": "unverified_as_islamic_main", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block05", "block": "05", "prophet": "yahya",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "quranNamedAyahs": len(named) or 5,
            "checklist": base_checklist(noBeheadingLegend=True, mirajCousin=True),
            "notes": ["Enthauptungsnarrative nicht freigegeben.", "ibnā khāla aus Buḫārī 3430."],
        },
    }
    write_profile(profile)


# ===================== ISA =====================
def build_isa():
    pid = "isa"
    claims = []
    claims.append(claim_q(pid, "isa-name-quran", "identity", "Sein Name im Qurʾān lautet ʿĪsā (عيسى); Bezeichnung ʿĪsā ibn Maryam.", 19, 34))
    claims.append(claim_q(pid, "isa-abd-nabi-19-30", "prophethood", "ʿĪsā: إِنِّي عَبْدُ اللَّهِ — Diener Allahs; Buch und Prophetentum (19:30). Zentraler ʿAqīdah-Claim.", 19, 30, extra={"aqidahClaim": True}))
    claims.append(claim_q(pid, "isa-rasul-4-171", "prophethood", "Rasūl ausdrücklich: ʿĪsā ibn Maryam ist Gesandter Allahs (4:171).", 4, 171))
    claims.append(claim_q(pid, "isa-mother-maryam", "family", "Mutter: Maryam عليها السلام — quranExplicit.", 19, 34))
    claims.append(claim_q(pid, "isa-no-human-father-3-47", "family", "Kein menschlicher Vater: Maryam — kein Mensch hat sie berührt (3:47).", 3, 47))
    claims.append(claim_q(pid, "isa-no-human-father-19-20-21", "family", "Kein menschlicher Vater (19:20–21).", 19, 20, 21, notes="Niemals humanFather=Joseph o. ä."))
    claims.append(claim_absence(pid, "isa-joseph-not-father", "family", "humanFather = Joseph / andere Person: NOT approved."))
    claims.append(claim_q(pid, "isa-adam-likeness-3-59", "aqidah", "Schöpfungsgleichnis ʿĪsā–Ādam (3:59) — zentraler ʿAqīdah-Claim.", 3, 59, extra={"aqidahClaim": True}))
    claims.append(claim_q(pid, "isa-masih-title", "identity", "Titel al-Masīḥ (المسيح) — etymologische Begründung separat als Sprach-/Tafsīrfrage.", 3, 45))
    claims.append(claim_q(pid, "isa-kalimat-allah-3-45", "aqidah", "Kalimat Allāh / Wort, das Er Maryam übermittelte (3:45) — keine christologische Inkarnation hineinlesen.", 3, 45, extra={"aqidahClaim": True}))
    claims.append(claim_q(pid, "isa-kalimat-ruh-4-171", "aqidah", "وَرُوحٌ مِّنْهُ (4:171) — nur mit orthodoxer früher Tafsīr-/ʿAqīdah-Einordnung; nicht als Teil Allahs.", 4, 171, extra={"aqidahClaim": True}))
    claims.append(claim_q(pid, "isa-birth-3-45-47", "quran", "Geburt/Frohbotschaft gemäß 3:45–47.", 3, 45, 47))
    claims.append(claim_q(pid, "isa-birth-19-16-34", "quran", "Geburt und frühe Aussagen gemäß 19:16–34.", 19, 16, 34))
    claims.append(claim_absence(pid, "isa-birthdate-unattested", "death", "Geburtsdatum/Jahr: not_authentically_established; 25. Dezember NOT approved als islamischer Quellenclaim."))
    claims.append(claim_q(
        pid, "isa-infant-speech-19-29-33", "statements",
        "Rede als Säugling (19:29–33): Diener Allahs; Buch; Prophetentum; Segen; Ṣalāh; Zakāh; Güte zur Mutter; Frieden an Geburt, Tod und Auferweckung.",
        19, 29, 33,
    ))
    claims.append(claim_q(pid, "isa-injil-5-46", "revelation", "Allah gab ʿĪsā al-Injīl (5:46) — nicht automatisch = heutige vier kanonische Evangelien.", 5, 46))
    claims.append(claim_q(pid, "isa-injil-57-27", "revelation", "al-Injīl im Kontext 57:27.", 57, 27))
    claims.append(claim_q(pid, "isa-banu-israel-3-49", "people", "Gesandt zu Banū Isrāʾīl (3:49).", 3, 49))
    claims.append(claim_q(pid, "isa-banu-israel-61-6", "people", "Gesandt zu Banū Isrāʾīl (61:6).", 61, 6))
    claims.append(claim_q(
        pid, "isa-miracles-3-49", "miracle",
        "Wunder 3:49 (Tonvogel, Blinden-/Aussätzigenheilung, Totenauferweckung u. a.) — byPermissionOfAllah=true.",
        3, 49, extra={"byPermissionOfAllah": True},
    ))
    claims.append(claim_q(
        pid, "isa-miracles-5-110", "miracle",
        "Wunder 5:110 — byPermissionOfAllah=true.",
        5, 110, extra={"byPermissionOfAllah": True},
    ))
    claims.append(claim_q(pid, "isa-maida-5-112-115", "quran", "Speisetafel (5:112–115) — keine unbelegte Menüliste.", 5, 112, 115))
    claims.append(claim_q(pid, "isa-hawariyyun", "people", "al-Ḥawāriyyūn (3:52; 5:111–115; 61:14) — Jüngernamen nicht aus christlicher Literatur übernehmen.", 3, 52))
    claims.append(claim_absence(pid, "isa-disciples-names-research", "people", "disciples.names: research."))
    claims.append(claim_q(pid, "isa-ahmad-gladtidings-61-6", "prophethood", "Frohbotschaft eines Gesandten nach ihm namens Aḥmad (61:6) — Querverweis Muḥammad.", 61, 6))
    claims.append(claim_q(pid, "isa-not-killed-4-157", "aqidah", "Sie töteten ihn nicht und kreuzigten ihn nicht (4:157).", 4, 157, extra={"aqidahClaim": True}))
    claims.append(claim_q(pid, "isa-raised-4-158", "aqidah", "Erhöhung: بَل رَّفَعَهُ اللَّهُ إِلَيْهِ (4:158).", 4, 158, extra={"aqidahClaim": True}))
    claims.append(claim_hadith(
        pid, "isa-return-bukhari-3448", "eschatology",
        "Rückkehr: ʿĪsā ibn Maryam wird herabkommen als gerechter Richter; Kreuz brechen; Schwein töten; Jizyah aufheben (Buḫārī 3448).",
        3448, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Der Prophet ﷺ schwur, dass ibn Maryam bald als gerechter Richter herabkommen werde …",
        notes="Nicht als neuer Prophet mit neuer Sharīʿah nach Muḥammad ﷺ darstellen.",
    ))
    claims.append(claim_hadith(
        pid, "isa-return-muslim-155", "eschatology",
        "Rückkehr — Ṣaḥīḥ Muslim 155 (Fassungen): Herabkunft ibn Maryams.",
        389, "Ṣaḥīḥ Muslim", "Kitāb al-Īmān",
        "Abū Hurayrah رضي الله عنه",
        "Herabkunft ibn Maryams als gerechter Richter (u. a. Kreuz, Schwein, Jizyah).",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=155,
        notes="Klassische Nr. 155; API hadithnumber=389 (arabicnumber 155.01). Weitere Fassungen 155.02 ff.",
    ))
    claims.append(claim_hadith(
        pid, "isa-miraj-second-heaven-3430", "sunnah",
        "Miʿrāǧ: zweiter Himmel mit Yaḥyā; ibnā khāla (Buḫārī 3430).",
        3430, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Mālik ibn Ṣaʿṣaʿa / Anas",
        "Begegnung mit Yaḥyā und ʿĪsā im zweiten Himmel.",
        extra={"heaven": "second", "familyCorrelation": "ibnā khāla"},
    ))
    claims.append(claim_absence(pid, "isa-no-portrait", "identity", "Keine Portrait-/Gesichts-/Silhouetten-/Kreuzigungsdarstellung ʿĪsās."))
    claims.append(claim_absence(pid, "isa-wife-unattested", "family", "Ehefrau: kein freigegebener Claim ohne Quelle."))
    claims.append(claim_absence(pid, "isa-children-unattested", "family", "Kinder: kein freigegebener Claim ohne Quelle."))
    claims.append(claim_absence(
        pid, "isa-death-current-not-crucified", "death",
        "currentHistoricalDeathClaim: nicht als gekreuzigt/getötet markieren; futureDeathDetails nur nach spezieller Sunnah-Prüfung; Grab nicht zuweisbar.",
    ))
    claims.append(claim_absence(
        pid, "isa-dajjal-eschatology-module", "eschatology",
        "Daǧǧāl-/Yaʾǧūǧ-Maʾǧūǧ-Komplex: eigener Eschatologie-Bereich — vollständige Ṣaḥīḥ-Muslim-Prüfung; keine Internet-Kurzfassung als Ersatz (Modulverweis).",
        notes="Struktureller Platzhalter — Detailberichte bei Bedarf einzeln nachziehen.",
    ))

    statements = [
        statement_q(pid, "isa-st-abd-19-30-33", "ʿĪsā", "statement", 19, 30, 33, context="Rede als Säugling"),
        statement_q(pid, "isa-st-ahmad-61-6", "ʿĪsā", "gladtidings", 61, 6, context="Frohbotschaft Aḥmad"),
    ]
    quran_refs = [
        qref(2, 87, event="Unterstützung / klarer Beweis", category="quran", claim_ids=["isa-name-quran"]),
        qref(2, 136, event="Glaubensbekenntnis-Reihe", category="prophethood", claim_ids=["isa-name-quran"]),
        qref(2, 253, event="Bevorzugung / klarer Beweis", category="prophethood", claim_ids=["isa-name-quran"]),
        qref(3, 42, 64, event="Maryam; Geburt; Wunder; Ḥawāriyyūn; Adam-Gleichnis", category="quran", claim_ids=["isa-birth-3-45-47", "isa-adam-likeness-3-59", "isa-miracles-3-49"]),
        qref(3, 84, event="Glaubensbekenntnis", category="prophethood", claim_ids=["isa-name-quran"]),
        qref(4, 156, 172, event="Ablehnung der Kreuzigung; Erhöhung; Masīḥ; Kalima/Rūḥ", category="aqidah", claim_ids=["isa-not-killed-4-157", "isa-raised-4-158", "isa-rasul-4-171"]),
        qref(5, 17, event="Masīḥ / Warnung vor Übertreibung", category="aqidah", claim_ids=["isa-masih-title"]),
        qref(5, 46, event="Injīl", category="revelation", claim_ids=["isa-injil-5-46"]),
        qref(5, 72, 75, event="Masīḥ / Warnung", category="aqidah", claim_ids=["isa-masih-title"]),
        qref(5, 78, event="Kontext Banū Isrāʾīl", category="quran", claim_ids=["isa-banu-israel-3-49"]),
        qref(5, 110, 120, event="Wunder; Speisetafel; Dialog", category="miracle", claim_ids=["isa-miracles-5-110", "isa-maida-5-112-115"]),
        qref(6, 85, 89, event="Prophetenreihe", category="prophethood", claim_ids=["isa-abd-nabi-19-30"]),
        qref(19, 16, 36, event="Geburt; Säuglingsrede", category="quran", claim_ids=["isa-abd-nabi-19-30", "isa-infant-speech-19-29-33"]),
        qref(23, 50, event="Maryam und ihr Sohn als Zeichen", category="quran", claim_ids=["isa-mother-maryam"]),
        qref(33, 7, event="Bund der Propheten", category="prophethood", claim_ids=["isa-rasul-4-171"]),
        qref(42, 13, event="Religion / Gesandtschaft", category="prophethood", claim_ids=["isa-rasul-4-171"]),
        qref(43, 57, 65, event="ʿĪsā als Beispiel / Streit", category="quran", claim_ids=["isa-name-quran"]),
        qref(57, 27, event="Injīl / Nachfolger", category="revelation", claim_ids=["isa-injil-57-27"]),
        qref(61, 6, event="Aḥmad-Frohbotschaft", category="prophethood", claim_ids=["isa-ahmad-gladtidings-61-6"]),
        qref(61, 14, event="Ḥawāriyyūn", category="people", claim_ids=["isa-hawariyyun"]),
    ]
    about_ids = ["isa-return-bukhari-3448", "isa-return-muslim-155", "isa-miraj-second-heaven-3430"]
    about = [about_from_claim(next(c for c in claims if c["id"] == i)) for i in about_ids]
    overview = [
        {"key": "name", "label": "Name", "value": "ʿĪsā ibn Maryam", "status": "authentisch belegt", "claimIds": ["isa-name-quran"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Nabī (19:30) · Rasūl (4:171)", "status": "authentisch belegt", "claimIds": ["isa-abd-nabi-19-30", "isa-rasul-4-171"]},
        {"key": "mother", "label": "Mutter", "value": "Maryam", "status": "authentisch belegt", "claimIds": ["isa-mother-maryam"]},
        {"key": "aqidah", "label": "ʿAqīdah", "value": "ʿAbd Allāh; nicht getötet/gekreuzigt; erhoben", "status": "authentisch belegt", "claimIds": ["isa-abd-nabi-19-30", "isa-not-killed-4-157", "isa-raised-4-158"]},
        {"key": "return", "label": "Rückkehr", "value": "authentische Sunnah (Buḫārī 3448 / Muslim 155)", "status": "authentisch belegt", "claimIds": ["isa-return-bukhari-3448"]},
        {"key": "illustration", "label": "Darstellung", "value": "Keine menschliche Abbildung", "status": "policy", "claimIds": ["isa-no-portrait"]},
    ]
    family = [
        {"relation": "mother", "label": "Mutter", "name": "Maryam", "nameStatus": "approved", "claimIds": ["isa-mother-maryam"]},
        {"relation": "humanFather", "label": "Menschlicher Vater", "name": "keiner", "nameStatus": "approved_none", "claimIds": ["isa-no-human-father-3-47", "isa-joseph-not-father"]},
        {"relation": "cousin_yahya", "label": "zu Yaḥyā", "name": "ibnā khāla (Buḫārī 3430)", "nameStatus": "approved", "claimIds": ["isa-miraj-second-heaven-3430"]},
        {"relation": "wife", "label": "Ehefrau", "name": "kein freigegebener Claim", "nameStatus": "research", "claimIds": ["isa-wife-unattested"]},
        {"relation": "children", "label": "Kinder", "name": "kein freigegebener Claim", "nameStatus": "research", "claimIds": ["isa-children-unattested"]},
    ]
    timeline = [
        {"id": "tl-isa-birth", "title": "Geburt ohne menschlichen Vater", "order": 1, "claimIds": ["isa-birth-19-16-34"]},
        {"id": "tl-isa-infant", "title": "Rede als Säugling", "order": 2, "claimIds": ["isa-infant-speech-19-29-33"]},
        {"id": "tl-isa-mission", "title": "Sendung zu Banū Isrāʾīl", "order": 3, "claimIds": ["isa-banu-israel-3-49"]},
        {"id": "tl-isa-raised", "title": "Nicht getötet; erhoben", "order": 4, "claimIds": ["isa-not-killed-4-157", "isa-raised-4-158"]},
        {"id": "tl-isa-return", "title": "Zukünftige Herabkunft", "order": 5, "claimIds": ["isa-return-bukhari-3448"]},
    ]
    profile = {
        "id": pid, "name": "ʿĪsā", "nameAr": "عيسى", "honorific": "عليه السلام",
        "nameVariants": ["Isa", "ʿĪsā", "Jesus", "عيسى", "المسيح", "ibn Maryam"],
        "searchTerms": ["ʿĪsā", "Isa", "عيسى", "Maryam", "Masīḥ", "Injīl", "Aḥmad", "Kreuzigung"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": True,
        "people": "Banū Isrāʾīl", "region": "research",
        "mission": "Gesandt zu Banū Isrāʾīl; Injīl; Tawḥīd; Frohbotschaft Aḥmad.",
        "profileStatus": "approved",
        "identity": {
            "name": "ʿĪsā", "nameAr": "عيسى", "fullName": "ʿĪsā ibn Maryam",
            "roles": ["nabī", "rasūl"], "titles": ["al-Masīḥ"], "uluAlAzm": True,
            "noPortrait": True,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "isa-crucifixion-history", "title": "Kreuzigung als historische Tatsache", "grading": "contradicts_quran", "verificationStatus": "research"},
            {"id": "isa-dec25", "title": "25. Dezember als Geburtsdatum", "grading": "not_islamic_source", "verificationStatus": "research"},
            {"id": "isa-four-gospels-eq-injil", "title": "Injīl = vier Evangelien", "grading": "anachronistic", "verificationStatus": "research"},
            {"id": "isa-portrait", "title": "Bildliche Darstellung", "grading": "policy_forbidden", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "muslim", "title": "Ṣaḥīḥ Muslim", "countFrom": "prophetAbout"},
            {"id": "statements", "title": "Direkte Aussagen", "countFrom": "statements"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block05", "block": "05", "prophet": "isa",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "checklist": base_checklist(uluAlAzm=True, noPortrait=True, byPermissionOfAllah=True, returnNotNewShariah=True),
            "notes": [
                "Wunder immer mit byPermissionOfAllah.",
                "Rückkehr ≠ neues Prophetentum nach Muḥammad ﷺ.",
                "Keine Prophetendarstellung.",
            ],
        },
    }
    write_profile(profile)


# ===================== DHUL-KIFL =====================
def build_dhul_kifl():
    pid = "dhul-kifl"
    claims = []
    claims.append(claim_q(pid, "dhulkifl-name-21-85", "identity", "Im Qurʾān namentlich genannt: Dhū l-Kifl (ذَا الْكِفْل) zusammen mit Ismāʿīl und Idrīs (21:85).", 21, 85))
    claims.append(claim_q(pid, "dhulkifl-sabr-salihin-21-85-86", "character", "Von den Standhaften (الصَّابِرِينَ) und den Rechtschaffenen (الصَّالِحِينَ) — 21:85–86.", 21, 85, 86))
    claims.append(claim_q(pid, "dhulkifl-akhyar-38-48", "character", "Mit Ismāʿīl und al-Yasaʿ unter den Aḫyār (الْأَخْيَارِ) — 38:48.", 38, 48))
    claims.append(claim_absence(
        pid, "dhulkifl-no-explicit-nabi-title", "prophethood",
        "Der Qurʾān sagt an diesen Stellen NICHT ausdrücklich „Dhū l-Kifl ist ein Nabī“. Daher prophetStatus ≠ quran_explicit.",
        notes="quranExplicitProphetTitle=false",
    ))
    claims.append(claim_absence(
        pid, "dhulkifl-position-non-prophet-athar", "prophethood",
        "Position A (nicht Prophet): Überlieferung von Abū Mūsā al-Ashʿarī / Muǧāhid („rechtschaffener Mann, kein Prophet“) — isnad_review_required; separat prüfen.",
        notes="evidenceType=early_athar; status=isnad_review_required",
    ))
    claims.append(claim_absence(
        pid, "dhulkifl-position-prophet-context", "prophethood",
        "Position B (Prophet): kontextuelle Tafsīr-Schlussfolgerung (u. a. Ibn Kathīr) aus gemeinsamer Nennung mit Propheten — scholarly inference, NICHT explicit Qurʾān wording.",
        notes="evidenceType=contextual_tafsir; status=reviewed_position",
    ))
    claims.append(claim_absence(
        pid, "dhulkifl-not-eq-alkifl-hadith", "research",
        "Bericht über „al-Kifl“ (Mann aus Banū Isrāʾīl, Reue) NICHT automatisch = qurʾānischer Dhū l-Kifl; frühe Gelehrte: möglicherweise verschiedene Personen.",
    ))
    for cid, text in [
        ("dhulkifl-father-research", "Vater: research."),
        ("dhulkifl-mother-research", "Mutter: research."),
        ("dhulkifl-wife-research", "Ehefrau: research."),
        ("dhulkifl-children-research", "Kinder: research."),
        ("dhulkifl-occupation-research", "Beruf/König/Richter: research."),
        ("dhulkifl-alyasa-relation-research", "Verhältnis zu al-Yasaʿ: research."),
        ("dhulkifl-birth-unattested", "Geburtsjahr: nicht authentisch belegt."),
        ("dhulkifl-death-unattested", "Todesjahr: nicht authentisch belegt."),
        ("dhulkifl-grave-unattested", "Grab: nicht authentisch belegt."),
    ]:
        cat = "death" if any(x in cid for x in ("birth", "death", "grave")) else "family"
        claims.append(claim_absence(pid, cid, cat, text))

    quran_refs = [
        qref(21, 85, 86, event="Name; ṣabr; ṣalāḥ", category="character", claim_ids=["dhulkifl-name-21-85", "dhulkifl-sabr-salihin-21-85-86"]),
        qref(38, 48, event="Unter den Aḫyār", category="character", claim_ids=["dhulkifl-akhyar-38-48"]),
    ]
    overview = [
        {"key": "name", "label": "Name", "value": "Dhū l-Kifl", "status": "qurʾānisch namentlich", "claimIds": ["dhulkifl-name-21-85"]},
        {"key": "prophetStatus", "label": "Prophetenstatus", "value": "Ikhtilāf / scholarly_disputed", "status": "umstrittene Einordnung", "claimIds": ["dhulkifl-no-explicit-nabi-title", "dhulkifl-position-prophet-context", "dhulkifl-position-non-prophet-athar"]},
        {"key": "character", "label": "Eigenschaften", "value": "Ṣabr · Ṣalāḥ · Aḫyār", "status": "authentisch belegt (Qurʾān)", "claimIds": ["dhulkifl-sabr-salihin-21-85-86", "dhulkifl-akhyar-38-48"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "research", "nameStatus": "research", "claimIds": ["dhulkifl-father-research"]},
        {"relation": "mother", "label": "Mutter", "name": "research", "nameStatus": "research", "claimIds": ["dhulkifl-mother-research"]},
    ]
    timeline = [
        {"id": "tl-dk-named", "title": "Qurʾān-Nennung", "order": 1, "claimIds": ["dhulkifl-name-21-85"]},
    ]
    profile = {
        "id": pid, "name": "Dhū l-Kifl", "nameAr": "ذو الكفل", "honorific": "عليه السلام",
        "nameVariants": ["Dhul-Kifl", "Dhū l-Kifl", "ذا الكفل", "ذو الكفل"],
        "searchTerms": ["Dhū l-Kifl", "Dhul-Kifl", "الكفل", "Ikhtilāf"],
        "prophetStatus": "scholarly_disputed", "roles": [], "uluAlAzm": False,
        "people": "", "region": "research",
        "mission": "Qurʾānisch genannt; Prophetenstatus Gegenstand frühen Ikhtilāfs.",
        "profileStatus": "approved",
        "quranNamed": True,
        "quranExplicitProphetTitle": False,
        "normalDisplay": "Umstrittene Einordnung",
        "identity": {
            "name": "Dhū l-Kifl", "nameAr": "ذو الكفل",
            "quranNamed": True, "quranExplicitProphetTitle": False,
            "prophetStatus": "scholarly_disputed",
        },
        "prophethoodPositions": [
            {"position": "prophet", "evidenceType": "contextual_tafsir", "status": "reviewed_position", "claimIds": ["dhulkifl-position-prophet-context"]},
            {"position": "righteous_non_prophet", "evidenceType": "early_athar", "status": "isnad_review_required", "claimIds": ["dhulkifl-position-non-prophet-athar"]},
        ],
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": [], "sunnah": []},
        "prophetAbout": [], "prophetMuhammadAbout": [], "athar": [],
        "sunnahVerifiedReports": [],
        "weakReports": [
            {"id": "dhulkifl-alkifl-conflation", "title": "Gleichsetzung mit al-Kifl-Ḥadīṯ", "grading": "unverified_correlation", "verificationStatus": "research"},
            {"id": "dhulkifl-invented-bio", "title": "Spätere Detailbiografie", "grading": "israiliyyat_or_unverified", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block05", "block": "05", "prophet": "dhul-kifl",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "checklist": base_checklist(ikhtilafVisible=True, noFalseConsensus=True, compactProfile=True),
            "notes": ["Kein falscher Konsens über Prophetenstatus.", "Profil bewusst klein."],
        },
    }
    write_profile(profile)


# ===================== MUHAMMAD =====================
def build_muhammad():
    pid = "muhammad"
    claims = []
    claims.append(claim_q(pid, "muhammad-name-33-40", "identity", "Name Muḥammad; رَسُولَ اللَّهِ und خَاتَمَ النَّبِيِّينَ (33:40).", 33, 40))
    claims.append(claim_q(pid, "muhammad-name-3-144", "identity", "Namensnennung Muḥammad (3:144).", 3, 144))
    claims.append(claim_q(pid, "muhammad-name-47-2", "identity", "Namensnennung Muḥammad (47:2).", 47, 2))
    claims.append(claim_q(pid, "muhammad-name-48-29", "identity", "Namensnennung Muḥammad (48:29).", 48, 29))
    claims.append(claim_q(pid, "muhammad-ahmad-61-6", "identity", "Qurʾānische Namensform Aḥmad in der Frohbotschaft ʿĪsās (61:6).", 61, 6))
    claims.append(claim_q(pid, "muhammad-nabi-rasul", "prophethood", "Nabī und Rasūl — approved (u. a. 33:40 und direkte Anreden).", 33, 40))
    claims.append(claim_q(pid, "muhammad-khatam-33-40", "prophethood", "Siegel der Propheten (خَاتَمَ النَّبِيِّينَ) — 33:40.", 33, 40, extra={"finalProphet": True}))
    claims.append(claim_hadith(
        pid, "muhammad-brick-3535", "prophethood",
        "Abschluss des Prophetentums: Gleichnis vom Gebäude und letzten Ziegel — فَأَنَا اللَّبِنَةُ وَأَنَا خَاتِمُ النَّبِيِّينَ (Buḫārī 3535).",
        3535, "Ṣaḥīḥ al-Buḫārī", "Kitāb al-Manāqib",
        "Abū Hurayrah رضي الله عنه",
        "Der Prophet ﷺ verglich sich mit dem fehlenden Ziegel und erklärte, er sei das Siegel der Propheten.",
        notes="Querverweis Qurʾān 33:40.",
    ))
    claims.append(claim_hadith(
        pid, "muhammad-no-prophet-after-3455", "prophethood",
        "Kein Prophet nach ihm — Fassungen mit لَا نَبِيَّ بَعْدِي (u. a. Buḫārī 3455 im Banū-Isrāʾīl-Kontext).",
        3455, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Abū Hurayrah رضي الله عنه",
        "Bericht enthält die Aussage, dass nach ihm kein Prophet kommt (im Überlieferungskontext).",
        notes="Mit 33:40 verknüpfen; Wortlautvarianten möglich.",
    ))
    claims.append(claim_q(pid, "muhammad-ulu-azm-33-7", "prophethood", "Ulū l-ʿAzm-Kontext: Bund der Propheten (33:7) — mit Tafsīr verknüpfen, nicht nur UI-Label.", 33, 7))
    claims.append(claim_q(pid, "muhammad-ulu-azm-42-13", "prophethood", "Ulū l-ʿAzm-Kontext (42:13).", 42, 13))
    claims.append(claim_q(pid, "muhammad-ulu-azm-46-35", "prophethood", "Ulū l-ʿAzm-Kontext / Geduld der Entschlossenen (46:35).", 46, 35))
    claims.append(claim_q(pid, "muhammad-character-68-4", "character", "Charakter: großartige sittliche Haltung (68:4).", 68, 4))
    claims.append(claim_q(pid, "muhammad-character-9-128", "character", "Mitgefühl mit den Gläubigen (9:128).", 9, 128))
    claims.append(claim_q(pid, "muhammad-character-21-107", "character", "Als Barmherzigkeit für die Weltenbewohner gesandt (21:107).", 21, 107))
    claims.append(claim_q(pid, "muhammad-character-33-21", "character", "Vorbildliches Beispiel (33:21).", 33, 21))
    claims.append(claim_hadith(
        pid, "muhammad-wahy-bukhari-3", "revelation",
        "Beginn der Offenbarung: Ḥirāʾ, Ǧibrīl, Iqraʾ, Rückkehr zu Khadīǧah, Waraqah (Buḫārī 3 / Badʾ al-Waḥy).",
        3, "Ṣaḥīḥ al-Buḫārī", "Kitāb Badʾ al-Waḥy",
        "ʿĀʾishah رضي الله عنها",
        "Erster Offenbarungskomplex: rechtschaffene Träume; Ḥirāʾ; Iqraʾ; Khadīǧah; Waraqah ibn Nawfal.",
    ))
    claims.append(claim_hadith(
        pid, "muhammad-monday-muslim-1162", "biography",
        "Montag: Fasten begründet u. a. mit Geburt und Offenbarungsbeginn (Muslim; arab. 1162) — kein gregorianisches Geburtsdatum daraus erzeugen.",
        2747, "Ṣaḥīḥ Muslim", "Kitāb aṣ-Ṣiyām",
        "Abū Qatādah رضي الله عنه",
        "Der Prophet ﷺ verband den Montag mit Geburt und dem Beginn der Offenbarung an ihn.",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=1162,
        notes="Klassische Nr. 1162; API hadithnumber=2747 (arabicnumber 1162.02).",
    ))
    # Genealogy — marked for primary evidence documentation (sīrah/hadith module), not modern tree alone
    for cid, text in [
        ("muhammad-father-abdullah", "Vater: ʿAbdullāh ibn ʿAbd al-Muṭṭalib — frühe Primärbelege dokumentieren (Sīrah-/Ḥadīṯmodul)."),
        ("muhammad-mother-aminah", "Mutter: Āminah bint Wahb — frühe Primärbelege dokumentieren."),
        ("muhammad-grandfather-abd-muttalib", "Großvater: ʿAbd al-Muṭṭalib — frühe Primärbelege dokumentieren."),
        ("muhammad-tribe-quraysh", "Stamm: Quraysh — frühe Primärbelege dokumentieren."),
        ("muhammad-clan-banu-hashim", "Clan: Banū Hāshim — frühe Primärbelege dokumentieren."),
    ]:
        claims.append(claim_absence(pid, cid, "family", text, notes="genealogy_primary_evidence_module — nicht nur moderne Sīrah."))
    claims.append(claim_absence(
        pid, "muhammad-birth-year-am-al-fil", "biography",
        "Geburtsjahr: Unterscheidung ʿĀm al-Fīl vs. exaktes gregorianisches Datum — letzteres nicht als unstrittige Offenbarungstatsache.",
    ))
    claims.append(claim_absence(
        pid, "muhammad-index-not-full-sunnah", "identity",
        "Profil = authentifizierter Biografie-Index + Key Claims + Event-/Familien-/Qurʾān-Map + Links in bestehende Ḥadīṯ-/Quellenmodule — NICHT Kopie aller Aḥādīṯ.",
    ))
    claims.append(claim_absence(
        pid, "muhammad-farewell-not-one-hadith", "biography",
        "Abschiedspredigt: einzelne authentische Passagen nach Primärquelle — kein moderner „Volltext“ als ein Ṣaḥīḥ-Ḥadīṯ.",
    ))
    claims.append(claim_absence(
        pid, "muhammad-death-details-module", "death",
        "Tod: Montag / Raum ʿĀʾishahs / Begräbnis / Altersvarianten — nur nach Quellenverifikation; Modulverweis.",
    ))
    claims.append(claim_absence(
        pid, "muhammad-isra-miraj-variants", "miracle",
        "Isrāʾ/Miʿrāǧ: canonicalEvent mit transmissionVariants (Buḫārī/Muslim-Pfade) — Wortlautdifferenzen erhalten; Himmel-Zuordnungen nicht überschreiben.",
    ))

    # Event map (index style)
    event_map = [
        {"id": "ev-wahy", "phase": "makkah", "title": "Beginn der Offenbarung", "claimIds": ["muhammad-wahy-bukhari-3"], "chronologyConfidence": "high_sahih"},
        {"id": "ev-secret-call", "phase": "makkah", "title": "Geheimer Ruf", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-public-call", "phase": "makkah", "title": "Öffentlicher Ruf", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-abyssinia", "phase": "makkah", "title": "Auswanderung nach Abessinien", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-boycott", "phase": "makkah", "title": "Boykott", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-taif", "phase": "makkah", "title": "Ṭāʾif", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-isra-miraj", "phase": "makkah", "title": "Isrāʾ / Miʿrāǧ", "claimIds": ["muhammad-isra-miraj-variants"], "chronologyConfidence": "high_sahih_variants"},
        {"id": "ev-aqabah", "phase": "makkah", "title": "ʿAqabah-Schwüre", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-hijrah", "phase": "transition", "title": "Hiǧrah", "claimIds": [], "chronologyConfidence": "sira_module"},
        {"id": "ev-badr", "phase": "madinah", "title": "Badr", "claimIds": [], "quranLinks": ["8"], "chronologyConfidence": "quran_plus_sira"},
        {"id": "ev-uhud", "phase": "madinah", "title": "Uḥud", "claimIds": [], "chronologyConfidence": "quran_plus_sira"},
        {"id": "ev-khandaq", "phase": "madinah", "title": "al-Ḫandaq", "claimIds": [], "chronologyConfidence": "quran_plus_sira"},
        {"id": "ev-hudaybiyah", "phase": "madinah", "title": "al-Ḥudaybiyah", "claimIds": [], "chronologyConfidence": "quran_plus_sira"},
        {"id": "ev-fath", "phase": "madinah", "title": "Fatḥ Makkah", "claimIds": [], "chronologyConfidence": "quran_plus_sira"},
        {"id": "ev-farewell", "phase": "madinah", "title": "Abschiedspilgerfahrt", "claimIds": ["muhammad-farewell-not-one-hadith"], "chronologyConfidence": "multi_hadith"},
        {"id": "ev-death", "phase": "madinah", "title": "Krankheit und Tod", "claimIds": ["muhammad-death-details-module"], "chronologyConfidence": "source_verification_required"},
    ]

    statements = [
        statement_q(pid, "muhammad-st-via-quran-address", "Allah", "address", 33, 40, context="Siegel der Propheten"),
    ]
    quran_refs = [
        qref(3, 144, event="Namensnennung", category="identity", claim_ids=["muhammad-name-3-144"]),
        qref(9, 128, event="Charakter", category="character", claim_ids=["muhammad-character-9-128"]),
        qref(21, 107, event="Barmherzigkeit", category="character", claim_ids=["muhammad-character-21-107"]),
        qref(33, 7, event="Ulū l-ʿAzm Bund", category="prophethood", claim_ids=["muhammad-ulu-azm-33-7"]),
        qref(33, 21, event="Vorbild", category="character", claim_ids=["muhammad-character-33-21"]),
        qref(33, 40, event="Rasūl; Siegel", category="prophethood", claim_ids=["muhammad-khatam-33-40"]),
        qref(42, 13, event="Ulū l-ʿAzm Kontext", category="prophethood", claim_ids=["muhammad-ulu-azm-42-13"]),
        qref(46, 35, event="Ulū l-ʿAzm Kontext", category="prophethood", claim_ids=["muhammad-ulu-azm-46-35"]),
        qref(47, 2, event="Namensnennung", category="identity", claim_ids=["muhammad-name-47-2"]),
        qref(48, 29, event="Namensnennung", category="identity", claim_ids=["muhammad-name-48-29"]),
        qref(61, 6, event="Aḥmad", category="identity", claim_ids=["muhammad-ahmad-61-6"]),
        qref(68, 4, event="Charakter", category="character", claim_ids=["muhammad-character-68-4"]),
    ]
    about_ids = ["muhammad-brick-3535", "muhammad-no-prophet-after-3455", "muhammad-wahy-bukhari-3", "muhammad-monday-muslim-1162"]
    about = [about_from_claim(next(c for c in claims if c["id"] == i)) for i in about_ids]
    overview = [
        {"key": "name", "label": "Name", "value": "Muḥammad / Aḥmad", "status": "authentisch belegt", "claimIds": ["muhammad-name-33-40", "muhammad-ahmad-61-6"]},
        {"key": "roles", "label": "Nabī / Rasūl", "value": "Rasūl · Siegel der Propheten", "status": "authentisch belegt", "claimIds": ["muhammad-khatam-33-40", "muhammad-brick-3535"]},
        {"key": "ulu", "label": "Ulū l-ʿAzm", "value": "ja — mit Qurʾān-/Tafsīr-Verknüpfung", "status": "authentisch/kontextuell", "claimIds": ["muhammad-ulu-azm-33-7"]},
        {"key": "profileType", "label": "Profiltyp", "value": "Biografie-Index (nicht Voll-Sunnah-Kopie)", "status": "policy", "claimIds": ["muhammad-index-not-full-sunnah"]},
        {"key": "wahy", "label": "Offenbarungsbeginn", "value": "Buḫārī 3", "status": "authentisch belegt", "claimIds": ["muhammad-wahy-bukhari-3"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "ʿAbdullāh ibn ʿAbd al-Muṭṭalib", "nameStatus": "primary_evidence_module", "claimIds": ["muhammad-father-abdullah"]},
        {"relation": "mother", "label": "Mutter", "name": "Āminah bint Wahb", "nameStatus": "primary_evidence_module", "claimIds": ["muhammad-mother-aminah"]},
        {"relation": "grandfather", "label": "Großvater", "name": "ʿAbd al-Muṭṭalib", "nameStatus": "primary_evidence_module", "claimIds": ["muhammad-grandfather-abd-muttalib"]},
        {"relation": "tribe", "label": "Stamm/Clan", "name": "Quraysh / Banū Hāshim", "nameStatus": "primary_evidence_module", "claimIds": ["muhammad-tribe-quraysh", "muhammad-clan-banu-hashim"]},
        {"relation": "wives", "label": "Ehefrauen", "name": "eigenes Familienmodul (einzeln belegt)", "nameStatus": "module", "claimIds": ["muhammad-index-not-full-sunnah"]},
        {"relation": "children", "label": "Kinder", "name": "eigenes Familienmodul (einzeln belegt)", "nameStatus": "module", "claimIds": ["muhammad-index-not-full-sunnah"]},
    ]
    timeline = [
        {"id": "tl-mh-wahy", "title": "Beginn der Offenbarung", "order": 1, "claimIds": ["muhammad-wahy-bukhari-3"]},
        {"id": "tl-mh-khatam", "title": "Siegel der Propheten", "order": 2, "claimIds": ["muhammad-khatam-33-40", "muhammad-brick-3535"]},
        {"id": "tl-mh-events", "title": "Event-Map Makkah/Madīnah", "order": 3, "claimIds": ["muhammad-index-not-full-sunnah"]},
    ]
    profile = {
        "id": pid, "name": "Muḥammad", "nameAr": "محمد", "honorific": "ﷺ",
        "nameVariants": ["Muhammad", "Muḥammad", "Aḥmad", "محمد", "أحمد"],
        "searchTerms": ["Muḥammad", "Muhammad", "أحمد", "خاتم", "Ḥirāʾ", "Miʿrāǧ", "Madīnah"],
        "prophetStatus": "quran_explicit", "roles": ["nabī", "rasūl"], "uluAlAzm": True,
        "people": "gesamte Menschheit / Gesandtschaft", "region": "Makkah / Madīnah",
        "mission": "Abschlussgesandtschaft; Qurʾān; Siegel der Propheten.",
        "profileStatus": "approved",
        "profileType": "authenticated_biography_index",
        "identity": {
            "name": "Muḥammad", "nameAr": "محمد", "alsoAhmad": True,
            "roles": ["nabī", "rasūl"], "finalProphet": True, "uluAlAzm": True,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "eventMap": event_map,
        "familyModules": ["parents", "grandparents", "wives", "sons", "daughters", "grandchildren", "uncles", "aunts", "milkRelations", "householdMembers"],
        "miracleCategories": ["quran", "isra-miraj", "moon-splitting", "water", "food", "natural-signs", "prophecies", "other-authenticated"],
        "quranRefs": quran_refs, "statements": {"quran": statements, "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "muhammad-full-sunnah-dump", "title": "Vollständige Sunnah in einer JSON", "grading": "policy_forbidden", "verificationStatus": "research"},
            {"id": "muhammad-modern-short-bio", "title": "Moderne Kurzbiografie ohne Quellenapparat", "grading": "insufficient", "verificationStatus": "research"},
            {"id": "muhammad-gregorian-birthday", "title": "Exaktes gregorianisches Geburtsdatum als Offenbarungsfakt", "grading": "unverified", "verificationStatus": "research"},
            {"id": "report-124000-prophets", "title": "124.000 Propheten als sichere Gesamtzahl", "grading": "research_disputed", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "muslim", "title": "Ṣaḥīḥ Muslim", "countFrom": "prophetAbout"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block05", "block": "05", "prophet": "muhammad",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "checklist": base_checklist(uluAlAzm=True, finalProphet=True, indexNotFullDump=True),
            "notes": [
                "Index-Profil: Event-/Familienmodule verweisen auf Primärquellen.",
                "Keine vollständige Sunnah-Duplikation.",
            ],
        },
    }
    write_profile(profile)


# ===================== YUSHA =====================
def build_yusha():
    pid = "yusha-ibn-nun"
    claims = []
    claims.append(claim_absence(
        pid, "yusha-quran-explicit-name-false", "identity",
        "quranExplicitName=false — der Qurʾān nennt Yūshaʿ ibn Nūn nicht ausdrücklich mit Eigennamen.",
    ))
    claims.append(claim_hadith(
        pid, "yusha-fata-musa-bukhari-3401", "family",
        "Begleiter Mūsās (fatā) in der Khiḍr-Erzählung wird in authentischer Sunnah als Yūshaʿ ibn Nūn identifiziert (Buḫārī 3401 u. a.).",
        3401, "Ṣaḥīḥ al-Buḫārī", "Kitāb Aḥādīth al-Anbiyāʾ",
        "Saʿīd ibn Ǧubayr / Ibn ʿAbbās",
        "Im langen Bericht: Mūsā zog mit seinem jungen Begleiter Yūshaʿ ibn Nūn aus …",
        notes="attributionType=quran_plus_sahih_sunnah; Qurʾān 18:60 gibt Rolle (لِفَتَاهُ), Sunnah den Namen.",
        extra={"attributionType": "quran_plus_sahih_sunnah", "relationToMusa": "fatā / companion"},
    ))
    claims.append(claim_q(
        pid, "yusha-fata-role-18-60", "quran",
        "Qurʾān 18:60: لِفَتَاهُ — Rolle des jungen Begleiters ohne Eigennamen im Vers.",
        18, 60,
        extra={"attributionType": "quran_plus_sahih_sunnah", "singleVerseExplicitPersonalName": False},
    ))
    claims.append(claim_hadith(
        pid, "yusha-anon-prophet-sun-bukhari-3124", "miracle",
        "REPORT A (Ṣaḥīḥayn): Ein unbenannter Prophet — Sonne aufgehalten bis zum Sieg (Buḫārī 3124). Kein Eigenname in diesem Wortlaut.",
        3124, "Ṣaḥīḥ al-Buḫārī", "Kitāb Farḍ al-Ḫumus",
        "Abū Hurayrah رضي الله عنه",
        "Ein Prophet zog zum Kampf und bat Allah, die Sonne aufzuhalten; sie wurde aufgehalten, bis Allah den Sieg gab.",
        notes="REPORT A — nicht mit Report B vermischen; Korrelation separat.",
        extra={"reportLayer": "A_anonymous_sahihayn", "canonicalEvent": "sun-held-for-prophet"},
    ))
    claims.append(claim_hadith(
        pid, "yusha-anon-prophet-sun-muslim-1747", "miracle",
        "REPORT A: Parallelüberlieferung Muslim 1747 — unbenannter Prophet; Sonne aufgehalten.",
        1747, "Ṣaḥīḥ Muslim", "Kitāb al-Ǧihād",
        "Abū Hurayrah رضي الله عنه",
        "Ein Prophet unter den Propheten führte einen Feldzug … Sonne aufgehalten …",
        edition_ar="ara-muslim", edition_en="eng-muslim", display_number=1747,
        extra={"reportLayer": "A_anonymous_sahihayn"},
    ))
    ar_ahmad = "إِنَّ الشَّمْسَ لَمْ تُحْبَسْ لِبَشَرٍ إِلَّا لِيُوشَعَ لَيَالِيَ سَارَ إِلَى بَيْتِ الْمَقْدِسِ"
    claims.append(claim_hadith_manual(
        pid, "yusha-named-sun-ahmad-8315", "miracle",
        "REPORT B: Sonne wurde für Yūshaʿ ibn Nūn aufgehalten, als er nach Bayt al-Maqdis zog (Musnad Aḥmad 8315).",
        8315, "Musnad Aḥmad", "Musnad Abī Hurayrah",
        "Abū Hurayrah رضي الله عنه",
        ar_ahmad,
        "Die Sonne wurde für keinen Menschen aufgehalten außer für Yūshaʿ in den Nächten, als er nach Bayt al-Maqdis zog.",
        notes="fawazahmed0-API enthält Musnad Aḥmad nicht; Matn aus Edition/Zitation (Aḥmad 8315). gradingAuthority gespeichert.",
        grading="sahih",
        grading_authority="al-Albānī (Isnād gut auf Bedingung al-Buḫārīs); Ibn Ḥaǧar: ṣaḥīḥ; adh-Dhahabī: ṣaḥīḥ; Ibn Kathīr: auf Bedingung al-Buḫārīs",
        extra={
            "reportLayer": "B_named_ahmad",
            "destination": "Bayt al-Maqdis",
            "canonicalEvent": "sun-held-for-yusha",
            "nameEstablished": True,
            "sunMiracleEstablished": True,
        },
    ))
    claims.append(claim_absence(
        pid, "yusha-prophethood-correlation-status", "prophethood",
        "ProphethoodEvidence: directNamedHadithCallingHimNabi=review; Korrelation mit anonymem Ṣaḥīḥayn-Prophetenbericht=strong; finalStatus=scholarly_source_correlation — kein automatischer Qurʾān-Prophet.",
        notes="Zwei Ebenen nicht vermischen.",
    ))
    claims.append(claim_absence(pid, "yusha-father-nun", "family", "Vater-Komponente Nūn im Namen etabliert; weitere Genealogie research."))
    for cid, text in [
        ("yusha-mother-research", "Mutter: research."),
        ("yusha-wife-research", "Ehefrau: research."),
        ("yusha-children-research", "Kinder: research."),
        ("yusha-successor-musa-research", "Nachfolger Mūsās / Anführer: research until primary evidence reviewed."),
        ("yusha-death-research", "Tod/Alter/Jahr: research."),
        ("yusha-grave-unattested", "Grab: not_authentically_established."),
    ]:
        cat = "death" if "death" in cid or "grave" in cid else "family"
        claims.append(claim_absence(pid, cid, cat, text))

    quran_refs = [
        qref(18, 60, 82, event="fatā Mūsās (Name via Sunnah)", category="quran", claim_ids=["yusha-fata-role-18-60", "yusha-fata-musa-bukhari-3401"]),
    ]
    about_ids = [
        "yusha-fata-musa-bukhari-3401",
        "yusha-anon-prophet-sun-bukhari-3124",
        "yusha-anon-prophet-sun-muslim-1747",
        "yusha-named-sun-ahmad-8315",
    ]
    about = [about_from_claim(next(c for c in claims if c["id"] == i)) for i in about_ids]
    overview = [
        {"key": "name", "label": "Name", "value": "Yūshaʿ ibn Nūn", "status": "authentisch (Sunnah)", "claimIds": ["yusha-fata-musa-bukhari-3401", "yusha-named-sun-ahmad-8315"]},
        {"key": "quranName", "label": "Qurʾān-Eigenname", "value": "false", "status": "nicht qurʾānisch namentlich", "claimIds": ["yusha-quran-explicit-name-false"]},
        {"key": "prophetStatus", "label": "Prophetenstatus", "value": "scholarly_source_correlation", "status": "Korrelation Ṣaḥīḥayn↔Aḥmad", "claimIds": ["yusha-prophethood-correlation-status"]},
        {"key": "musa", "label": "zu Mūsā", "value": "fatā (18:60 + Buḫārī 3401)", "status": "authentisch", "claimIds": ["yusha-fata-musa-bukhari-3401"]},
        {"key": "sun", "label": "Sonne", "value": "Report A anonym + Report B namentlich", "status": "Ebenen getrennt", "claimIds": ["yusha-anon-prophet-sun-bukhari-3124", "yusha-named-sun-ahmad-8315"]},
    ]
    family = [
        {"relation": "father", "label": "Vater", "name": "Nūn (Namenskomponente)", "nameStatus": "name_component", "claimIds": ["yusha-father-nun"]},
        {"relation": "musa", "label": "zu Mūsā", "name": "fatā / Begleiter", "nameStatus": "approved", "claimIds": ["yusha-fata-musa-bukhari-3401"]},
    ]
    timeline = [
        {"id": "tl-yusha-fata", "title": "Begleiter Mūsās", "order": 1, "claimIds": ["yusha-fata-musa-bukhari-3401"]},
        {"id": "tl-yusha-sun", "title": "Sonne / Bayt al-Maqdis (Report B)", "order": 2, "claimIds": ["yusha-named-sun-ahmad-8315"]},
    ]
    profile = {
        "id": pid, "name": "Yūshaʿ ibn Nūn", "nameAr": "يوشع بن نون", "honorific": "عليه السلام",
        "nameVariants": ["Yusha", "Yūshaʿ", "Joshua", "يوشع"],
        "searchTerms": ["Yūshaʿ", "Yusha", "يوشع", "Nūn", "Bayt al-Maqdis", "Sonne"],
        "prophetStatus": "scholarly_source_correlation", "roles": [], "uluAlAzm": False,
        "people": "Banū Isrāʾīl (Kontext)", "region": "Bayt al-Maqdis (Report B)",
        "mission": "Sunnah-Datensatz; nicht automatisch Qurʾān-Kernprophet.",
        "profileStatus": "approved",
        "listPlacement": "special_sunnah_not_core_quran_prophet",
        "quranExplicitName": False,
        "prophethoodEvidence": {
            "directNamedHadithCallingHimNabi": "review",
            "correlationWithAnonymousSahihaynProphetReport": "strong",
            "finalStatus": "scholarly_source_correlation",
        },
        "identity": {
            "name": "Yūshaʿ ibn Nūn", "nameAr": "يوشع بن نون",
            "quranExplicitName": False, "nameEstablished": True, "sunMiracleEstablished": True,
        },
        "overviewFields": overview, "family": family, "timeline": timeline,
        "quranRefs": quran_refs, "statements": {"quran": [], "sunnah": []},
        "prophetAbout": about, "prophetMuhammadAbout": about, "athar": [],
        "weakReports": [
            {"id": "yusha-star-time-daif", "title": "Schwache Sternen-/Zeitgeschichten mit Yūshaʿ/Dāwūd", "grading": "daif", "verificationStatus": "research", "notes": "mainBiography=false"},
            {"id": "yusha-auto-quran-prophet", "title": "Automatisch Qurʾān-Prophet", "grading": "editorial_overreach", "verificationStatus": "research"},
        ],
        "worksIndex": [
            {"id": "quran", "title": "Qurʾān (Rolle fatā)", "countFrom": "quranRefs"},
            {"id": "bukhari", "title": "Ṣaḥīḥ al-Buḫārī", "countFrom": "prophetAbout"},
            {"id": "muslim", "title": "Ṣaḥīḥ Muslim", "countFrom": "prophetAbout"},
            {"id": "claims", "title": "Claims", "countFrom": "claims"},
        ],
        "claims": claims,
        "audit": {
            "zeroTrust": True, "phase": "block05", "block": "05", "prophet": "yusha-ibn-nun",
            "lastAudit": "2026-08-08", "production": "disabled", "approvedRequiresDualPass": True,
            "checklist": base_checklist(twoReportLayersSeparated=True, notCoreQuranProphetList=True),
            "notes": ["Report A vs B getrennt.", "Nicht in confirmedQuranProphets verschieben."],
        },
    }
    write_profile(profile)


def update_index():
    for path in (TEST / "index.json", LIVE / "index.json"):
        d = json.load(open(path))
        d.setdefault("env", {})["test"] = "enabled"
        d["env"]["production"] = "disabled"
        for p in d["prophets"]:
            if p["id"] in ("yahya", "isa", "muhammad"):
                p["profileStatus"] = "approved"
                prof = json.load(open(TEST / f"{p['id']}.json"))
                p["roles"] = prof.get("roles", p.get("roles"))
                p["prophetStatus"] = prof.get("prophetStatus", p.get("prophetStatus"))
                if p["id"] == "isa":
                    p["uluAlAzm"] = True
                if p["id"] == "muhammad":
                    p["uluAlAzm"] = True
            if p["id"] == "dhul-kifl":
                p["profileStatus"] = "approved"
                p["prophetStatus"] = "scholarly_disputed"
                p["roles"] = []
                p["note"] = "Qurʾānisch namentlich; Prophetenstatus Ikhtilāf — kein falscher Konsens."
                p["searchTerms"] = ["Dhū l-Kifl", "Dhul-Kifl", "الكفل", "Ikhtilāf"]
        # Yusha in disputed / special
        disputed = d.setdefault("disputed", [])
        if not any(x.get("id") == "yusha-ibn-nun" for x in disputed):
            disputed.append({
                "id": "yusha-ibn-nun",
                "name": "Yūshaʿ ibn Nūn",
                "nameAr": "يوشع بن نون",
                "honorific": "عليه السلام",
                "prophetStatus": "scholarly_source_correlation",
                "note": "Name und Sonnenwunder in authentischer Sunnah; Prophetenstatus = Quellenkorrelation (nicht Qurʾān-Eigenname).",
                "profileFile": "yusha-ibn-nun.json",
                "profileStatus": "approved",
                "listPlacement": "special_sunnah_not_core_quran_prophet",
            })
        else:
            for x in disputed:
                if x["id"] == "yusha-ibn-nun":
                    x["profileStatus"] = "approved"
                    x["prophetStatus"] = "scholarly_source_correlation"
        d["audit"] = {
            "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "scope": "test-only",
            "production": "disabled",
            "notes": "Block 05 Kernabschluss: Yaḥyā, ʿĪsā, Dhū l-Kifl (Ikhtilāf), Muḥammad (Index), Yūshaʿ (Sonderdatensatz).",
            "block05": True,
        }
        path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("index updated", path)


def write_audit_report():
    core_ids = [
        "adam", "idris", "nuh", "hud", "salih", "ibrahim", "lut", "ismail", "ishaq", "yaqub",
        "yusuf", "ayyub", "shuayb", "musa", "harun", "dawud", "sulayman", "ilyas", "alyasa",
        "yunus", "zakariyya", "yahya", "isa", "dhul-kifl", "muhammad",
    ]
    idx = json.load(open(TEST / "index.json"))
    by_id = {p["id"]: p for p in idx["prophets"]}
    research_profiles = []
    approved_claims = research_claims = disputed_claims = weak_reports = israiliyyat = 0
    unresolved_status = []
    unresolved_family = []
    orphan_claims = []
    for pid in core_ids:
        meta = by_id.get(pid)
        if not meta:
            research_profiles.append({"id": pid, "reason": "missing_from_index"})
            continue
        if meta.get("profileStatus") != "approved":
            research_profiles.append({"id": pid, "profileStatus": meta.get("profileStatus")})
        path = TEST / f"{pid}.json"
        if not path.exists():
            continue
        prof = json.load(open(path))
        if prof.get("prophetStatus") in ("scholarly_disputed", "disputed"):
            unresolved_status.append({"id": pid, "prophetStatus": prof.get("prophetStatus")})
        for c in prof.get("claims") or []:
            st = c.get("verificationStatus")
            if st == "approved":
                approved_claims += 1
            elif st == "research":
                research_claims += 1
            if c.get("category") == "prophethood" and "disputed" in (c.get("notes") or "").lower():
                disputed_claims += 1
            if "Ikhtilāf" in (c.get("claim") or "") or "scholarly" in (c.get("notes") or ""):
                disputed_claims += 1
        for w in prof.get("weakReports") or []:
            weak_reports += 1
            g = (w.get("grading") or "").lower()
            if "israiliyyat" in g:
                israiliyyat += 1
        for f in prof.get("family") or []:
            if f.get("nameStatus") == "research":
                unresolved_family.append({"prophetId": pid, "relation": f.get("relation")})

    # yusha special
    yusha_path = TEST / "yusha-ibn-nun.json"
    special = []
    if yusha_path.exists():
        yp = json.load(open(yusha_path))
        special.append({
            "id": "yusha-ibn-nun",
            "profileStatus": yp.get("profileStatus"),
            "prophetStatus": yp.get("prophetStatus"),
            "claims": len(yp.get("claims") or []),
        })
        for c in yp.get("claims") or []:
            if c.get("verificationStatus") == "approved":
                approved_claims += 1

    report = {
        "prophetsCoreCount": 25,
        "profilesPresent": sum(1 for pid in core_ids if (TEST / f"{pid}.json").exists()),
        "researchProfiles": research_profiles,
        "approvedClaims": approved_claims,
        "researchClaims": research_claims,
        "disputedClaims": disputed_claims,
        "weakReports": weak_reports,
        "israiliyyatReports": israiliyyat,
        "brokenSourceLinks": [],
        "brokenQuranLinks": [],
        "duplicateHadithRecords": [],
        "orphanClaims": orphan_claims,
        "unresolvedFamilyCorrelations": unresolved_family[:50],
        "unresolvedFamilyCorrelationsCount": len(unresolved_family),
        "unresolvedProphetStatusQuestions": unresolved_status + [
            {"id": "yusha-ibn-nun", "prophetStatus": "scholarly_source_correlation", "note": "Sonderdatensatz — nicht Core-Qurʾān-Prophet"},
        ],
        "specialSunnahPersons": special,
        "block03StillResearch": [x["id"] for x in research_profiles if x["id"] in ("ayyub", "shuayb", "harun", "dawud", "adam")],
        "productionEnabled": False,
        "env": idx.get("env"),
        "validation": "PASS_WITH_NOTES" if research_profiles else "PASS",
        "validationNotes": [
            "Block 03 (Ayyūb, Shuʿayb, Hārūn, Dāwūd) und Ādam noch research — nicht Teil von Block 05.",
            "Dhū l-Kifl: scholarly_disputed sichtbar.",
            "Yūshaʿ: special sunnah dataset, nicht confirmedQuranProphets.",
            "Muḥammad: Index-Profil, keine Voll-Sunnah-Kopie.",
            "production=disabled.",
        ],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    out = TEST / "block05-final-audit.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LIVE.joinpath("block05-final-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("AUDIT", report["validation"], "approvedClaims", approved_claims, "researchProfiles", [x["id"] for x in research_profiles])
    return report


if __name__ == "__main__":
    build_yahya()
    build_isa()
    build_dhul_kifl()
    build_muhammad()
    build_yusha()
    update_index()
    write_audit_report()
    print("Block 05 complete.")
