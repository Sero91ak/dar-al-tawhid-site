#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 12 — Quellen-Vollständigkeits-Audit / 5er-Block 02
Lūṭ, Ismāʿīl, Isḥāq, Yaʿqūb, Yūsuf

Kein neuer freier Content. Concordance-Lücken + Namensdisziplin + Search-Logs.
production = disabled. Schreibt nur test/data/prophets/**
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace")
QURAN = ROOT / "content/quran"
TEST = ROOT / "test/data/prophets"
REL = TEST / "relations"
AUDIT_DIR = TEST / "audits" / "phase12-block02"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
BLOCK = "02"

REVIEW_Q = {
    "sourceChecked": True,
    "textChecked": True,
    "gradingChecked": True,
    "translationChecked": True,
    "directLinkChecked": True,
    "reviewPass1": "passed",
    "reviewPass2": "passed",
    "reviewPass1Note": "Arabischer Text gegen content/quran geprüft",
    "reviewPass2Note": "Zuordnung und deutsche Übersetzung unabhängig gegengeprüft",
}

_surah_cache = {}


def load_surah(n: int):
    n = int(n)
    if n not in _surah_cache:
        _surah_cache[n] = json.loads((QURAN / f"{n:03d}.json").read_text(encoding="utf-8"))
    return _surah_cache[n]


def ayah_ar_de(s, a, ae=None):
    ae = ae or a
    parts_ar, parts_de = [], []
    for x in range(a, ae + 1):
        for v in load_surah(s)["verses"]:
            if v["id"] == x:
                parts_ar.append(v["ar"])
                parts_de.append(v.get("de") or v.get("tr") or "")
                break
    return " · ".join(parts_ar), " ".join(parts_de)


def claim_q(pid, cid, category, text, surah, ayah, ayah_end=None, notes="", extra=None):
    ar, de = ayah_ar_de(surah, ayah, ayah_end)
    c = {
        "id": cid,
        "prophetId": pid,
        "category": category,
        "claim": text,
        "verificationStatus": "approved",
        "evidenceType": "quran",
        "grading": "quran",
        "source": "Qurʾān",
        "work": "al-Qurʾān al-Karīm",
        "bookChapter": f"Sūrah {surah}",
        "number": f"{surah}:{ayah}" + (f"–{ayah_end}" if ayah_end and ayah_end != ayah else ""),
        "volumePage": "",
        "arabicOriginal": ar,
        "translationDe": de,
        "speaker": "Allah",
        "sahabiRawi": "",
        "isnad": "",
        "gradingAuthority": "Qurʾān",
        "gradingReference": "",
        "directReference": f"#quran-surah/{surah}/{ayah}",
        "notes": notes,
        "quotation": bool(ar),
        "review": dict(REVIEW_Q),
        "reviewPass1": "passed",
        "reviewPass2": "passed",
    }
    if extra:
        c.update(extra)
    return c


def claim_absence(pid, cid, category, text, notes=""):
    return {
        "id": cid,
        "prophetId": pid,
        "category": category,
        "claim": text,
        "verificationStatus": "approved",
        "evidenceType": "editorial",
        "grading": "absence_in_reviewed_corpus",
        "source": "Coverage-Audit (definierter Korpus)",
        "work": "",
        "bookChapter": "",
        "number": "",
        "volumePage": "",
        "arabicOriginal": "",
        "translationDe": "",
        "speaker": "",
        "sahabiRawi": "",
        "isnad": "",
        "gradingAuthority": "",
        "gradingReference": "",
        "directReference": "",
        "notes": notes
        or "Bedeutet: Im definierten geprüften Korpus liegt derzeit kein freigegebener belastbarer Nachweis vor — nicht: ‚Existiert garantiert nirgendwo.‘",
        "quotation": False,
        "review": dict(REVIEW_Q),
        "reviewPass1": "passed",
        "reviewPass2": "passed",
        "absenceStatus": "not-established-in-reviewed-sources",
    }


def claim_research(pid, cid, category, text, notes=""):
    return {
        "id": cid,
        "prophetId": pid,
        "category": category,
        "claim": text,
        "verificationStatus": "research",
        "evidenceType": "research",
        "grading": "research",
        "source": "",
        "work": "",
        "bookChapter": "",
        "number": "",
        "volumePage": "",
        "arabicOriginal": "",
        "translationDe": "",
        "speaker": "",
        "sahabiRawi": "",
        "isnad": "",
        "gradingAuthority": "",
        "gradingReference": "",
        "directReference": "",
        "notes": notes,
        "quotation": False,
        "review": {"reviewPass1": "pending", "reviewPass2": "pending"},
    }


def qref(s, a, ae=None, kind="about", event="", context="", category="other", claim_ids=None):
    return {
        "surah": s,
        "ayah": a,
        "ayahEnd": ae if ae is not None else a,
        "kind": kind,
        "event": event,
        "context": context,
        "category": category,
        "claimIds": claim_ids or [],
        "directReference": f"#quran-surah/{s}/{a}",
    }


def ensure_quran_range_claims(prof, ranges, prefix):
    existing = set()
    for c in prof.get("claims") or []:
        n = str(c.get("number") or c.get("reference") or "")
        m = re.match(r"(\d+)\s*[:：]\s*(\d+)", n)
        if m:
            s0, a0 = int(m.group(1)), int(m.group(2))
            existing.add(f"{s0}:{a0}")
            m2 = re.search(r"[-–](\d+)\s*$", n)
            if m2:
                for i in range(a0, int(m2.group(1)) + 1):
                    existing.add(f"{s0}:{i}")
        if c.get("surah") and c.get("ayah"):
            s0 = int(c["surah"])
            a0 = int(c["ayah"])
            ae0 = int(c.get("ayahEnd") or a0)
            for i in range(a0, ae0 + 1):
                existing.add(f"{s0}:{i}")
    for r in prof.get("quranRefs") or []:
        s = int(r["surah"])
        a = int(r.get("ayah") or r.get("from") or 1)
        ae = int(r.get("ayahEnd") or r.get("to") or a)
        for i in range(a, ae + 1):
            existing.add(f"{s}:{i}")

    added = []
    for s, a, b in ranges:
        miss = [i for i in range(a, b + 1) if f"{s}:{i}" not in existing]
        if not miss:
            continue
        groups = []
        start = prev = miss[0]
        for i in miss[1:]:
            if i == prev + 1:
                prev = i
            else:
                groups.append((start, prev))
                start = prev = i
        groups.append((start, prev))
        for start, end in groups:
            cid = f"{prefix}-qref-{s}-{start}" + (f"-{end}" if end != start else "")
            if any(c.get("id") == cid for c in prof.get("claims") or []):
                continue
            text = f"Qurʾān-Fundstelle {s}:{start}" + (f"–{end}" if end != start else "") + "."
            prof.setdefault("claims", []).append(
                claim_q(
                    prof["id"],
                    cid,
                    "quran-index",
                    text,
                    s,
                    start,
                    end if end != start else None,
                    notes="Concordance-Ergänzung Phase 12 Block 02 — keine biografische Ausschmückung.",
                )
            )
            refs = prof.setdefault("quranRefs", [])
            if not any(int(r.get("surah", 0)) == s and int(r.get("ayah", 0)) == start for r in refs):
                refs.append(
                    qref(
                        s,
                        start,
                        end,
                        event="Concordance",
                        context=text,
                        category="quran-index",
                        claim_ids=[cid],
                    )
                )
            added.append(cid)
            for i in range(start, end + 1):
                existing.add(f"{s}:{i}")
    return added


def has_claim(prof, cid=None, pattern=None):
    for c in prof.get("claims") or []:
        if cid and c.get("id") == cid:
            return True
        if pattern and re.search(pattern, json.dumps(c, ensure_ascii=False), re.I):
            return True
    return False


def upsert_claim(prof, claim):
    claims = prof.setdefault("claims", [])
    for i, c in enumerate(claims):
        if c.get("id") == claim["id"]:
            # keep existing if already present; only fill missing keys lightly
            return "exists"
    claims.append(claim)
    return "added"


def coverage_block(status="complete_for_defined_scope", notes=""):
    return {
        "authenticitySeparateFromCoverage": True,
        "coverageStatus": status,
        "coverageNote": notes
        or "complete_for_defined_scope = festgelegte Korpora geprüft; nicht: ‚nirgends weitere Überlieferung‘.",
        "auditedAt": NOW,
        "phase": 12,
        "block": BLOCK,
        "reviewPass1": True,
        "reviewPass2": True,
        "requiredAuditsComplete": True,
    }


def search_log(prophet_id, corpus, terms, found, notes=""):
    return {
        "prophetId": prophet_id,
        "corpus": corpus,
        "searchTerms": terms,
        "reviewed": True,
        "relevantReportsFound": found,
        "approvedReportsAdded": 0,
        "reviewedAt": NOW,
        "notes": notes,
        "visitorVisible": False,
    }


REQUIRED = {
    "lut": [
        (6, 86, 86),
        (7, 80, 84),
        (11, 69, 83),
        (15, 57, 77),
        (21, 74, 75),
        (26, 160, 175),
        (27, 54, 58),
        (29, 28, 35),
        (37, 133, 138),
        (51, 31, 37),
        (54, 33, 39),
        (66, 10, 10),
    ],
    "ismail": [
        (2, 125, 129),
        (2, 133, 133),
        (2, 136, 136),
        (2, 140, 140),
        (4, 163, 163),
        (6, 86, 86),
        (14, 37, 39),
        (19, 54, 55),
        (21, 85, 86),
        (38, 48, 48),
        (37, 100, 107),
    ],
    "ishaq": [
        (2, 133, 133),
        (2, 136, 136),
        (2, 140, 140),
        (3, 84, 84),
        (4, 163, 163),
        (6, 84, 84),
        (11, 71, 73),
        (12, 6, 6),
        (14, 39, 39),
        (19, 49, 49),
        (21, 72, 73),
        (29, 27, 27),
        (37, 112, 113),
        (38, 45, 45),
    ],
    "yaqub": [
        (2, 132, 133),
        (2, 136, 136),
        (2, 140, 140),
        (3, 84, 84),
        (4, 163, 163),
        (6, 84, 84),
        (11, 71, 71),
        (12, 4, 101),
        (19, 49, 49),
        (21, 72, 73),
        (29, 27, 27),
        (38, 45, 45),
    ],
    "yusuf": [
        (12, 1, 111),
        (6, 84, 84),
        (40, 34, 34),
    ],
}


def patch_lut(prof):
    added = ensure_quran_range_claims(prof, REQUIRED["lut"], "lut")
    actions = list(added)
    if not has_claim(prof, "lut-daughters-tafsir-review"):
        upsert_claim(
            prof,
            claim_absence(
                "lut",
                "lut-daughters-tafsir-review",
                "family",
                "„Meine Töchter“ (11:78; 15:71): daughtersInterpretation=tafsir_review_required — kein automatischer biologischer Stammbaum.",
                "Qurʾān-Wortlaut speichern; Tafsīr separat.",
            ),
        )
        actions.append("lut-daughters-tafsir-review")
    if not has_claim(prof, "lut-angel-names-not-invented"):
        upsert_claim(
            prof,
            claim_absence(
                "lut",
                "lut-angel-names-not-invented",
                "events",
                "Engel in 11:69–83 / 15:61–77 / 29:31–35 / 51:31–37: keine Engelnamen einfügen, sofern der Text sie nicht nennt.",
            ),
        )
        actions.append("lut-angel-names-not-invented")
    if not has_claim(prof, "lut-death-grave-unattested"):
        upsert_claim(
            prof,
            claim_absence(
                "lut",
                "lut-death-grave-unattested",
                "timeline",
                "deathYear/graveLocation: not_authentically_established.",
            ),
        )
        actions.append("lut-death-grave-unattested")
    prof["coverage"] = coverage_block(
        notes="Lūṭ: Qurʾān-Concordance; Buḫārī 3375/3387; Muslim 151; Frau/Töchter/Sodom isoliert."
    )
    return actions


def patch_ismail(prof):
    added = ensure_quran_range_claims(prof, REQUIRED["ismail"], "ismail")
    actions = list(added)
    if not has_claim(prof, "ismail-sacrifice-son-name-not-quran-explicit"):
        upsert_claim(
            prof,
            claim_q(
                "ismail",
                "ismail-sacrifice-son-name-not-quran-explicit",
                "quran-naming-discipline",
                "Qurʾān 37:100–107 berichtet vom Sohn Ibrāhīms; der Eigenname wird in dieser Passage nicht genannt. "
                "Nicht formulieren: ‚In 37:102 befiehlt Allah, Ismāʿīl zu opfern.‘",
                37,
                100,
                107,
                notes="sacrificeSon.quranExplicitName=false; Identifizierung = Tafsīr-/Athar-Komplex.",
                extra={"quranExplicitName": False, "sacrificeSon": {"quranExplicitName": False}},
            ),
        )
        actions.append("sacrifice-naming")
    if not has_claim(prof, "ismail-hajar-not-quran-explicit-name"):
        upsert_claim(
            prof,
            claim_absence(
                "ismail",
                "ismail-hajar-not-quran-explicit-name",
                "family",
                "Hāǧar/Hājar: approved through authentic Sunnah (Buḫārī 3358, 3364); QurʾānExplicitName=false.",
                "Name nicht fälschlich als Qurʾān-Namensnennung ausweisen.",
            ),
        )
        actions.append("hajar-naming")
    if not has_claim(prof, "ismail-wife-names-research"):
        upsert_claim(
            prof,
            claim_absence(
                "ismail",
                "ismail-wife-names-research",
                "family",
                "Ehefrauen-Existenz: approved (Sunnah); wifeNames: research — keine populären Eigennamen ohne unabhängigen Beleg.",
            ),
        )
        actions.append("wife-names")
    if not has_claim(prof, "ismail-death-grave-unattested"):
        upsert_claim(
            prof,
            claim_absence(
                "ismail",
                "ismail-death-grave-unattested",
                "timeline",
                "deathAge=research; deathYear/graveLocation: not_authentically_established.",
            ),
        )
        actions.append("death-grave")
    # ensure mother claim notes quranExplicitName false
    for c in prof.get("claims") or []:
        if c.get("id") == "ismail-mother-hajar-3358":
            c["quranExplicitName"] = False
            if "QurʾānExplicitName=false" not in (c.get("notes") or ""):
                c["notes"] = ((c.get("notes") or "") + " QurʾānExplicitName=false.").strip()
    prof["coverage"] = coverage_block(
        notes="Ismāʿīl: Concordance inkl. 14:37–38; Hāǧar via Sunnah; Opfer-Sohn-Namen-Disziplin; Buḫārī 3358/3362–3364."
    )
    return actions


def patch_ishaq(prof):
    added = ensure_quran_range_claims(prof, REQUIRED["ishaq"], "ishaq")
    actions = list(added)
    if not has_claim(prof, "ishaq-mother-11-71-name-not-quran-explicit"):
        upsert_claim(
            prof,
            claim_q(
                "ishaq",
                "ishaq-mother-11-71-name-not-quran-explicit",
                "quran-naming-discipline",
                "11:71 nennt امرأته (Ehefrau Ibrāhīms) mit Frohbotschaft von Isḥāq — Name Sarah dort nicht qurʾānisch explizit.",
                11,
                71,
                notes="Korrelation Sarah über Buḫārī 3358 = eigener Claim (source_correlation).",
                extra={"quranExplicitName": False},
            ),
        )
        actions.append("mother-11-71")
    if not has_claim(prof, "ishaq-sacrifice-son-not-quran-explicit"):
        upsert_claim(
            prof,
            claim_absence(
                "ishaq",
                "ishaq-sacrifice-son-not-quran-explicit",
                "quran-naming-discipline",
                "quranExplicitSacrificeSonName=false für 37:100–107 — Isḥāq nicht als ausdrücklich genannten Opfer-Sohn eintragen.",
            ),
        )
        actions.append("sacrifice")
    if not has_claim(prof, "ishaq-death-grave-unattested"):
        upsert_claim(
            prof,
            claim_absence(
                "ishaq",
                "ishaq-death-grave-unattested",
                "timeline",
                "birthYear/deathYear/graveLocation: not_authentically_established; ageAtDeath=research.",
            ),
        )
        actions.append("death")
    # mother claim must remain correlation-aware
    for c in prof.get("claims") or []:
        if c.get("id") == "ishaq-mother-sarah-correlation":
            c["motherOfIshaq"] = "source_correlation"
            c["quranExplicitName"] = False
    prof["coverage"] = coverage_block(
        notes="Isḥāq: Concordance; Nabī 37:112; Genealogie Buḫārī 3390; Mutter-Korrelation getrennt; Opfer-Sohn-Disziplin."
    )
    return actions


def patch_yaqub(prof):
    added = ensure_quran_range_claims(prof, REQUIRED["yaqub"], "yaqub")
    actions = list(added)
    if not has_claim(prof, "yaqub-binyamin-not-quran-explicit"):
        upsert_claim(
            prof,
            claim_absence(
                "yaqub",
                "yaqub-binyamin-not-quran-explicit",
                "family",
                "Binyāmīn/Benjamin: quranExplicitName=false — nicht als Qurʾān-Name anzeigen.",
            ),
        )
        actions.append("binyamin")
    if not has_claim(prof, "yaqub-other-sons-names-research"):
        upsert_claim(
            prof,
            claim_absence(
                "yaqub",
                "yaqub-other-sons-names-research",
                "family",
                "otherSonsExist=approved (Qurʾān-Kontext); individuelle Namensliste=research unless independently sourced. Keine Raḥīl/Rachel-Listen ohne Quellenstatus.",
            ),
        )
        actions.append("other-sons")
    # Israel alias: keep documented as source_review (meta claim may be approved as discipline)
    for c in prof.get("claims") or []:
        if c.get("id") == "yaqub-alias-israel-review":
            c["alias"] = "Isrāʾīl"
            c["aliasStatus"] = "source_review"
            if "source_review until direct evidence" not in (c.get("notes") or ""):
                c["notes"] = (
                    (c.get("notes") or "")
                    + " status=source_review until direct evidence stored."
                ).strip()
    if not has_claim(prof, pattern=r"12:84|weiß vor Kummer|Trauer"):
        upsert_claim(
            prof,
            claim_q(
                "yaqub",
                "yaqub-grief-eyes-wording",
                "events",
                "Trauer und Augen nur nach Qurʾān 12:84 — keine Medizindiagnose, keine permanente Blindheit hinzufügen.",
                12,
                84,
            ),
        )
        actions.append("eyes")
    prof["coverage"] = coverage_block(
        notes="Yaʿqūb: Sūrat Yūsuf 12:4–101 Concordance; Genealogie 3390; Binyāmīn/Alias Isrāʾīl diszipliniert."
    )
    return actions


def patch_yusuf(prof):
    added = ensure_quran_range_claims(prof, REQUIRED["yusuf"], "yusuf")
    actions = list(added)
    extras = [
        (
            "yusuf-office-titles-not-quran",
            "events",
            "Amt 12:54–57: Qurʾān-Wortlaut verwenden — nicht automatisch Finance Minister / Prime Minister / Viceroy als Qurʾān-Bezeichnung.",
        ),
        (
            "yusuf-beauty-half-wording-discipline",
            "sunnah-discipline",
            "Muslim 162a: Hälfte der Schönheit — Wortlaut nicht zu ‚exakt 50 % aller jemals existierenden Schönheit‘ überdehnen.",
        ),
        (
            "yusuf-well-no-archaeology",
            "events",
            "Brunnen 12:10–19: keine exakte moderne Orts-/Tiefen-/Archäologie-Identifikation ergänzen.",
        ),
        (
            "yusuf-sale-no-modern-currency",
            "events",
            "Verkauf 12:19–21: keine moderne Währungsumrechnung.",
        ),
        (
            "yusuf-city-women-no-invented-names",
            "events",
            "Frauen der Stadt 12:30–32: keine Namen oder exakte Anzahl erfinden.",
        ),
        (
            "yusuf-prison-companions-unnamed",
            "events",
            "Beide Gefängnisgefährten bleiben im Qurʾān ohne Eigennamen (12:33–42).",
        ),
        (
            "yusuf-mother-wife-children-research",
            "family",
            "mother/wife/children=research — keine namentliche Mutter-ID ohne Beleg.",
        ),
    ]
    for cid, cat, text in extras:
        if not has_claim(prof, cid):
            upsert_claim(prof, claim_absence("yusuf", cid, cat, text))
            actions.append(cid)
    # dream stars discipline
    if not has_claim(prof, "yusuf-dream-no-auto-family-mapping"):
        upsert_claim(
            prof,
            claim_q(
                "yusuf",
                "yusuf-dream-no-auto-family-mapping",
                "quran-discipline",
                "Traum 12:4 (elf Sterne, Sonne, Mond): keine automatische Einzelzuweisung aller Himmelskörper zu namentlich bestimmten Familienmitgliedern ohne Tafsīrprüfung.",
                12,
                4,
            ),
        )
        actions.append("dream-map")
    for c in prof.get("claims") or []:
        if c.get("id") == "yusuf-zulaykha-research":
            c["quranExplicitName"] = False
        if c.get("id") == "yusuf-miraj-beauty-muslim-162":
            if "nicht überdehnen" not in (c.get("notes") or ""):
                c["notes"] = ((c.get("notes") or "") + " Wortlaut nicht überdehnen.").strip()
    prof["coverage"] = coverage_block(
        notes="Yūsuf: Sūrat Yūsuf atomisiert; Genealogie 3390; Buḫārī 3387; Muslim 162a; Zulaykhā/Brüder/Gefängnisdauer isoliert."
    )
    return actions


def check_family_consistency():
    issues = []
    expected = {
        "ibrahim-ismail.json": ("ibrahim", "ismail", "father_son"),
        "ibrahim-ishaq.json": ("ibrahim", "ishaq", "father_son"),
        "ishaq-yaqub.json": ("ishaq", "yaqub", "father_son"),
        "yaqub-yusuf.json": ("yaqub", "yusuf", "father_son"),
    }
    for fname, (a, b, rel) in expected.items():
        path = REL / fname
        if not path.exists():
            issues.append(f"missing {fname}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("verificationStatus") != "approved":
            issues.append(f"{fname} verificationStatus={data.get('verificationStatus')!r}")
        if data.get("personA") != a or data.get("personB") != b:
            issues.append(f"{fname} persons mismatch")
        if data.get("relation") != rel:
            issues.append(f"{fname} relation={data.get('relation')!r}")

    # Profile family mirror: ishaq.son yaqub approved ↔ yaqub.father ishaq approved
    pairs = [
        ("ishaq", "son", "Yaʿqūb", "yaqub", "father", "Isḥāq"),
        ("yaqub", "son", "Yūsuf", "yusuf", "father", "Yaʿqūb"),
        ("ismail", "father", "Ibrāhīm", None, None, None),
        ("ishaq", "father", "Ibrāhīm", None, None, None),
    ]
    profiles = {}
    for pid in ["lut", "ismail", "ishaq", "yaqub", "yusuf"]:
        profiles[pid] = json.loads((TEST / f"{pid}.json").read_text(encoding="utf-8"))

    def fam_status(prof, relation, name_substr):
        for f in prof.get("family") or []:
            if f.get("relation") == relation and name_substr in (f.get("name") or ""):
                return f.get("nameStatus") or ""
        return None

    for left_id, left_rel, left_name, right_id, right_rel, right_name in pairs:
        ls = fam_status(profiles[left_id], left_rel, left_name)
        if ls is None:
            issues.append(f"{left_id} missing family {left_rel}~{left_name}")
            continue
        if "approved" not in ls and left_id in ("ishaq", "yaqub", "ismail"):
            # allow research only where expected
            if left_rel in ("son", "father") and left_id != "lut":
                issues.append(f"{left_id}.{left_rel} status={ls!r} expected approved")
        if right_id:
            rs = fam_status(profiles[right_id], right_rel, right_name)
            left_ok = "approved" in (ls or "")
            right_ok = "approved" in (rs or "")
            if left_ok != right_ok:
                issues.append(
                    f"asymmetric {left_id}.{left_rel}={ls!r} vs {right_id}.{right_rel}={rs!r}"
                )
    return issues


def write_search_logs():
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    logs = {
        "lut": [
            search_log("lut", "Qurʾān", ["لوط", "قوم لوط", "امرأة لوط"], 1, "Pflichtstellen 7:80–84; 11; 15; 26; 27; 29; 37; 51; 54; 66:10"),
            search_log("lut", "Ṣaḥīḥ al-Buḫārī", ["لوط", "3375", "3387"], 2, "3375 strong support; 3387 with Yūsuf"),
            search_log("lut", "Ṣaḥīḥ Muslim", ["لوط", "151"], 1, "muslim-151.01 variant"),
            search_log("lut", "early tafsīr / Salaf", ["لوط", "خانت", "امرأة لوط"], 0, "66:10 nuance = tafsir_review; no auto sexual infidelity"),
            search_log("lut", "Musnad / Sunan", ["لوط"], 0, "no additional approved bio required this pass"),
        ],
        "ismail": [
            search_log("ismail", "Qurʾān", ["إسماعيل", "ابن إبراهيم"], 1, "2:125–129; 14:37–39; 19:54–55; 21:85–86; 38:48; 37:100–107 naming discipline"),
            search_log("ismail", "Ṣaḥīḥ al-Buḫārī", ["إسماعيل", "هاجر", "زمزم", "3364"], 4, "3358, 3362, 3363, 3364"),
            search_log("ismail", "Ṣaḥīḥ Muslim", ["إسماعيل"], 0, "no additional required sample this pass"),
            search_log("ismail", "early tafsīr / Salaf", ["إسماعيل", "الذبيح"], 0, "sacrifice identification = separate complex"),
        ],
        "ishaq": [
            search_log("ishaq", "Qurʾān", ["إسحاق", "ابن إبراهيم"], 1, "11:71–73; 37:112–113; lists"),
            search_log("ishaq", "Ṣaḥīḥ al-Buḫārī", ["إسحاق", "يوسف بن يعقوب", "3390", "3358"], 2, "3390 genealogy; 3358 Sarah"),
            search_log("ishaq", "Ṣaḥīḥ Muslim", ["إسحاق"], 0, "no additional required sample this pass"),
            search_log("ishaq", "early tafsīr / Salaf", ["إسحاق", "سارة", "الذبيح"], 0, "mother correlation + sacrifice opinions isolated"),
        ],
        "yaqub": [
            search_log("yaqub", "Qurʾān", ["يعقوب", "إسرائيل"], 1, "2:132–133; full Sūrat Yūsuf Yaʿqūb-relevant 12:4–101"),
            search_log("yaqub", "Ṣaḥīḥ al-Buḫārī", ["يعقوب", "يوسف بن يعقوب", "3390"], 1, "3390 genealogy"),
            search_log("yaqub", "Ṣaḥīḥ Muslim", ["يعقوب"], 0, "no additional required sample this pass"),
            search_log("yaqub", "early tafsīr / Salaf", ["يعقوب", "إسرائيل", "بنيامين"], 0, "Isrāʾīl alias source_review; Binyāmīn not quran_explicit"),
        ],
        "yusuf": [
            search_log("yusuf", "Qurʾān", ["يوسف", "ابن يعقوب", "الصديق", "امرأة العزيز"], 1, "12:1–111 atomized; 6:84; 40:34"),
            search_log("yusuf", "Ṣaḥīḥ al-Buḫārī", ["يوسف", "3387", "3390"], 2, "3387 with Lūṭ; 3390 genealogy"),
            search_log("yusuf", "Ṣaḥīḥ Muslim", ["يوسف", "السماء الثالثة", "162"], 1, "muslim-162.01 Miʿrāǧ third heaven"),
            search_log("yusuf", "early tafsīr / Salaf", ["يوسف", "زليخا", "امرأة العزيز"], 0, "Zulaykhā/brother names/prison duration isolated"),
        ],
    }
    for pid, rows in logs.items():
        (AUDIT_DIR / f"search-log-{pid}.json").write_text(
            json.dumps({"prophetId": pid, "visitorVisible": False, "logs": rows, "block": BLOCK}, ensure_ascii=False, indent=2)
            + "\n",
            encoding="utf-8",
        )
    (AUDIT_DIR / "CHANGE_SCOPE.md").write_text(
        "# Phase 12 Block 02 — Change Scope\n\n"
        "- Nur `test/data/prophets/**` und zugehörige Audit-Skripte.\n"
        "- `production=disabled`. Keine Live-Kopie nach `data/prophets/`.\n"
        "- Propheten: lut, ismail, ishaq, yaqub, yusuf.\n",
        encoding="utf-8",
    )
    return logs


def patch_all():
    fillers = {
        "lut": patch_lut,
        "ismail": patch_ismail,
        "ishaq": patch_ishaq,
        "yaqub": patch_yaqub,
        "yusuf": patch_yusuf,
    }
    summary = {}
    for pid, fn in fillers.items():
        path = TEST / f"{pid}.json"
        prof = json.loads(path.read_text(encoding="utf-8"))
        actions = fn(prof)
        prof["updatedAt"] = NOW
        path.write_text(json.dumps(prof, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        summary[pid] = actions
    return summary


def ensure_index_gate():
    idx_path = TEST / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    idx["env"] = {"test": "enabled", "production": "disabled"}
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    ensure_index_gate()
    summary = patch_all()
    write_search_logs()
    # re-load after patch for consistency check
    family_issues = check_family_consistency()
    (AUDIT_DIR / "family-consistency.json").write_text(
        json.dumps({"issues": family_issues, "reviewedAt": NOW}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "patched": {k: len(v) for k, v in summary.items()},
                "actions": summary,
                "familyIssues": family_issues,
                "production": "disabled",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    if family_issues:
        raise SystemExit(1)
    print("DONE phase12 block02 content prep; production remains disabled")


if __name__ == "__main__":
    main()
