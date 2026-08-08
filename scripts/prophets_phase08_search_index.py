#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 08 — search index + index UI metadata (no new Islamic facts)."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace")
TEST = ROOT / "test/data/prophets"
LIVE = ROOT / "data/prophets"

# Traditional Arab-messenger grouping only when profile already has rasūl + Arabian people/region in data.
ARAB_MESSENGER_IDS = {"hud", "salih", "shuayb", "muhammad", "ismail"}
# Move to „Weitere … Personen“ in UI (status remains scholarly_disputed in core file).
FURTHER_PERSON_IDS = {"dhul-kifl", "al-khidr", "luqman", "dhul-qarnayn", "uzayr", "yusha-ibn-nun"}


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def write(p: Path, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def profile_path(pid: str, meta: dict | None = None) -> Path:
    if meta and meta.get("profileFile"):
        return TEST / meta["profileFile"]
    if (TEST / "research" / f"{pid}.json").exists():
        return TEST / "research" / f"{pid}.json"
    return TEST / f"{pid}.json"


def is_banu_israel(people: str) -> bool:
    s = (people or "").lower()
    return "isrā" in s or "isra" in s or "banū isr" in s or "banu isr" in s


def build_entry(meta: dict, prof: dict) -> dict:
    pid = meta["id"]
    claims = [c for c in (prof.get("claims") or []) if c.get("verificationStatus") == "approved"]
    topics = []
    events = []
    family = []
    qrefs = []
    hadith_meta = []

    for c in claims:
        cat = c.get("category") or ""
        if cat and cat not in topics:
            topics.append(cat)
        if c.get("evidenceType") == "quran":
            num = str(c.get("number") or "")
            if num:
                qrefs.append(num)
            if c.get("surah"):
                qrefs.append(f"{c.get('surah')}:{c.get('ayah') or ''}")
        if c.get("evidenceType") == "sunnah":
            hadith_meta.append(
                " ".join(
                    str(x)
                    for x in (
                        c.get("source"),
                        c.get("number"),
                        c.get("hadithId"),
                        c.get("rawi"),
                        c.get("sahabiRawi"),
                    )
                    if x
                )
            )
        if cat == "family" or (c.get("id") or "").find("father") >= 0 or (c.get("id") or "").find("brother") >= 0:
            family.append(c.get("claim") or c.get("id") or "")

    for st in prof.get("timeline") or []:
        ids = st.get("claimIds") or []
        if not ids:
            continue
        ok = all(
            any(c.get("id") == cid and c.get("verificationStatus") == "approved" for c in (prof.get("claims") or []))
            for cid in ids
        )
        if ok:
            events.append(st.get("title") or st.get("id") or "")
            for qr in st.get("quran") or st.get("quranRefs") or []:
                if isinstance(qr, dict) and qr.get("surah"):
                    qrefs.append(f"{qr['surah']}:{qr.get('ayah') or ''}{('-' + str(qr['ayahEnd'])) if qr.get('ayahEnd') else ''}")

    for f in prof.get("family") or []:
        ids = f.get("claimIds") or []
        if ids and all(
            any(c.get("id") == cid and c.get("verificationStatus") == "approved" for c in (prof.get("claims") or []))
            for cid in ids
        ):
            family.append(f"{f.get('label') or ''} {f.get('name') or ''}".strip())

    names = []
    for n in [
        prof.get("name"),
        prof.get("nameAr"),
        meta.get("name"),
        meta.get("nameAr"),
        pid,
    ]:
        if n and n not in names:
            names.append(n)
    for n in (prof.get("nameVariants") or []) + (meta.get("searchTerms") or []) + (prof.get("searchTerms") or []):
        if n and n not in names:
            names.append(n)

    sunnah_n = sum(1 for c in claims if c.get("evidenceType") == "sunnah")
    about_n = sum(1 for a in (prof.get("prophetAbout") or []) if a.get("verificationStatus") == "approved")
    has_sunnah = sunnah_n + about_n > 0

    people = meta.get("people") or prof.get("people") or ""
    classifications = {
        "uluAlAzm": bool(meta.get("uluAlAzm") or prof.get("uluAlAzm")),
        "quranExplicit": meta.get("prophetStatus") == "quran_explicit",
        "hasSunnah": has_sunnah,
        "banuIsrail": is_banu_israel(people),
        "arabicMessenger": pid in ARAB_MESSENGER_IDS and ("rasūl" in (meta.get("roles") or prof.get("roles") or [])),
        "furtherPerson": pid in FURTHER_PERSON_IDS or is_disputed(meta.get("prophetStatus")),
    }

    return {
        "prophetId": pid,
        "names": names,
        "aliases": [n for n in names if n != prof.get("name")],
        "approvedTopics": topics[:40],
        "approvedEvents": events[:40],
        "approvedFamilyRelations": family[:40],
        "approvedQuranRefs": sorted(set(qrefs))[:80],
        "approvedHadithMetadata": hadith_meta[:40],
        "people": people,
        "roles": meta.get("roles") or prof.get("roles") or [],
        "classifications": classifications,
        "profileFile": meta.get("profileFile") or f"{pid}.json",
        "prophetStatus": meta.get("prophetStatus") or prof.get("prophetStatus"),
        "honorific": meta.get("honorific") or prof.get("honorific") or "",
        "name": meta.get("name") or prof.get("name"),
        "nameAr": meta.get("nameAr") or prof.get("nameAr"),
        "searchBlob": " ".join(
            str(x)
            for x in (
                names
                + topics
                + events
                + family
                + qrefs
                + hadith_meta
                + [people, pid]
            )
            if x
        ).lower(),
    }


def is_disputed(status: str | None) -> bool:
    s = str(status or "")
    return s in {
        "disputed",
        "scholarly_disputed",
        "scholarly_disputed_or_inferred",
        "scholarly_source_correlation",
        "quran_named_status_under_review",
    }


def main():
    idx = load(TEST / "index.json")
    idx["intro"] = (
        "Was Qurʾān, authentische Sunnah und gesicherte frühe Überlieferungen über die Propheten berichten."
    )
    idx["title"] = "Die Propheten"
    idx["titleAr"] = "الأنبياء"
    idx["contentVersion"] = "prophets-phase08-v610"
    idx["schemaVersion"] = 4
    idx["updatedAt"] = now_iso()
    idx.setdefault("env", {})
    idx["env"]["test"] = "enabled"
    idx["env"]["production"] = "disabled"

    entries = []
    filter_flags = {"sunnah": False, "banuIsrail": False, "arabicMessenger": False, "ulu": False}

    all_meta = list(idx.get("prophets") or []) + list(idx.get("disputed") or [])
    by_id = {m["id"]: m for m in all_meta}

    for meta in all_meta:
        path = profile_path(meta["id"], meta)
        if not path.exists():
            continue
        # Normal search index: only approved profile payloads contribute searchable claim text.
        # Research stubs (profileStatus != approved) get name-only search, no research claim leak.
        prof = load(path)
        if prof.get("profileStatus") != "approved":
            entry = {
                "prophetId": meta["id"],
                "names": [meta.get("name"), meta.get("nameAr"), meta["id"]] + list(meta.get("searchTerms") or []),
                "aliases": list(meta.get("searchTerms") or []),
                "approvedTopics": [],
                "approvedEvents": [],
                "approvedFamilyRelations": [],
                "approvedQuranRefs": [],
                "approvedHadithMetadata": [],
                "people": meta.get("people") or "",
                "roles": meta.get("roles") or [],
                "classifications": {
                    "uluAlAzm": bool(meta.get("uluAlAzm")),
                    "quranExplicit": meta.get("prophetStatus") == "quran_explicit",
                    "hasSunnah": False,
                    "banuIsrail": is_banu_israel(meta.get("people") or ""),
                    "arabicMessenger": False,
                    "furtherPerson": True,
                },
                "profileFile": meta.get("profileFile") or f"{meta['id']}.json",
                "prophetStatus": meta.get("prophetStatus"),
                "honorific": meta.get("honorific") or "",
                "name": meta.get("name"),
                "nameAr": meta.get("nameAr"),
                "searchBlob": " ".join(
                    str(x) for x in [meta.get("name"), meta.get("nameAr"), meta["id"]] + list(meta.get("searchTerms") or []) if x
                ).lower(),
                "nameOnlySearch": True,
            }
        else:
            entry = build_entry(meta, prof)

        # enrich meta for UI filters
        cls = entry["classifications"]
        meta["classifications"] = cls
        meta["hasSunnah"] = cls["hasSunnah"]
        meta["banuIsrail"] = cls["banuIsrail"]
        meta["arabicMessenger"] = cls["arabicMessenger"]
        meta["furtherPerson"] = cls["furtherPerson"] or meta["id"] in FURTHER_PERSON_IDS
        if meta["id"] == "dhul-kifl":
            meta["furtherPerson"] = True
            meta["listSection"] = "further"
            meta["uiLabel"] = "Im Qurʾān genannt · Prophetenstatus unterschiedlich beurteilt"

        if cls["hasSunnah"]:
            filter_flags["sunnah"] = True
        if cls["banuIsrail"]:
            filter_flags["banuIsrail"] = True
        if cls["arabicMessenger"]:
            filter_flags["arabicMessenger"] = True
        if cls["uluAlAzm"]:
            filter_flags["ulu"] = True

        entries.append(entry)

    # further list for UI: dhul-kifl + disputed research
    further = []
    for pid in ["dhul-kifl", "al-khidr", "luqman", "dhul-qarnayn", "uzayr", "yusha-ibn-nun"]:
        m = by_id.get(pid)
        if m:
            further.append(m)
    idx["furtherPersons"] = further
    idx["availableFilters"] = {
        "all": True,
        "quran": True,
        "sunnah": filter_flags["sunnah"],
        "ulu": filter_flags["ulu"],
        "banuIsrail": filter_flags["banuIsrail"],
        "arabicMessenger": filter_flags["arabicMessenger"],
        "further": True,
    }
    idx["phase08"] = True
    idx["audit"] = {
        "updatedAt": now_iso(),
        "scope": "test-only",
        "production": "disabled",
        "phase08": True,
        "notes": "UI-Nutzbarkeit · search-index approved-only · production=disabled",
    }

    write(TEST / "index.json", idx)
    write(TEST / "search-index.json", {
        "schemaVersion": 4,
        "contentVersion": idx["contentVersion"],
        "updatedAt": now_iso(),
        "entries": entries,
        "note": "Normal search uses approved claim-derived fields only; research stubs are name-only.",
    })

    # mirror
    for name in ("index.json", "search-index.json"):
        write(LIVE / name, load(TEST / name))

    # phase08 usability report skeleton (filled by node QA later)
    report = {
        "prophetIndexLoaded": True,
        "profilesReachable": len([p for p in idx.get("prophets") or [] if p.get("profileStatus") == "approved" or p.get("id")]),
        "researchProfilesReachableSeparately": len(idx.get("disputed") or []),
        "searchIndexEntries": len(entries),
        "availableFilters": idx["availableFilters"],
        "productionEnabled": False,
        "contentVersion": idx["contentVersion"],
        "generatedAt": now_iso(),
    }
    write(TEST / "phase08-ui-report.json", report)
    write(LIVE / "phase08-ui-report.json", report)
    print("Phase 08 search-index:", len(entries), "filters", idx["availableFilters"])


if __name__ == "__main__":
    main()
