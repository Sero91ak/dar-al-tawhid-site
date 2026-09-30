#!/usr/bin/env python3
"""Verify DĀR AL TAWḤĪD Qurʾān Tadabbur catalog/index/batches.

This script is intentionally strict:
- no invented fallback entries
- no duplicate verse references
- every registered file must exist
- every file count must match entries-index.json
- total entries must match catalog.json and entries-index.json
- required attribution fields must be present
- every reference must be inside the 114-sūrah Qurʾān coverage map

Run from repo root:
    python3 apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "catalog.json"
INDEX_PATH = ROOT / "entries-index.json"
COVERAGE_PATH = ROOT / "coverage.json"
REFERENCE_RE = re.compile(r"^[0-9]{1,3}:[0-9]{1,3}$")
REQUIRED_ENTRY_FIELDS = (
    "reference",
    "text",
    "narrator",
    "generation",
    "source",
    "grading",
)


def read_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path}: {exc}") from exc


def fail(message: str) -> None:
    raise SystemExit(f"TADABBUR VERIFY FAILED: {message}")


def load_verse_counts(catalog: dict[str, Any]) -> list[int]:
    coverage_path = catalog.get("coveragePath", "coverage.json")
    coverage = read_json(ROOT / coverage_path)
    verse_counts = coverage.get("verseCounts")

    if not isinstance(verse_counts, list) or len(verse_counts) != 114:
        fail("coverage.verseCounts must contain exactly 114 entries")

    if any(not isinstance(count, int) or count <= 0 for count in verse_counts):
        fail("coverage.verseCounts contains invalid verse counts")

    total_surahs = coverage.get("totalSurahs")
    total_verses = coverage.get("totalVerses")

    if total_surahs != 114:
        fail(f"coverage.totalSurahs must be 114, got {total_surahs}")

    actual_total_verses = sum(verse_counts)
    if total_verses != actual_total_verses:
        fail(f"coverage.totalVerses {total_verses} != sum(verseCounts) {actual_total_verses}")

    if actual_total_verses != 6236:
        fail(f"coverage verse total must be 6236, got {actual_total_verses}")

    return verse_counts


def parse_reference(reference: str) -> tuple[int, int]:
    if not REFERENCE_RE.match(reference):
        fail(f"invalid reference format {reference}")

    surah_text, ayah_text = reference.split(":", maxsplit=1)
    return int(surah_text), int(ayah_text)


def validate_reference_bounds(reference: str, verse_counts: list[int], relative_path: str) -> None:
    surah, ayah = parse_reference(reference)

    if surah < 1 or surah > len(verse_counts):
        fail(f"{relative_path}: reference {reference} has invalid sūrah number")

    max_ayah = verse_counts[surah - 1]
    if ayah < 1 or ayah > max_ayah:
        fail(f"{relative_path}: reference {reference} exceeds sūrah {surah} verse count {max_ayah}")


def main() -> int:
    catalog = read_json(CATALOG_PATH)
    index = read_json(INDEX_PATH)
    verse_counts = load_verse_counts(catalog)

    catalog_count = catalog.get("entriesCount")
    index_count = index.get("totalVerifiedEntries")
    catalog_paths = catalog.get("entriesPaths", [])
    index_files = index.get("files", [])

    if not isinstance(catalog_count, int) or catalog_count <= 0:
        fail("catalog.entriesCount must be a positive integer")

    if catalog_count != index_count:
        fail(f"catalog.entriesCount {catalog_count} != index.totalVerifiedEntries {index_count}")

    if not catalog_paths:
        fail("catalog.entriesPaths is empty")

    index_file_map: dict[str, int] = {}
    for item in index_files:
        path = item.get("path")
        count = item.get("count")
        if not isinstance(path, str) or not path:
            fail("entries-index.json contains a file without path")
        if not isinstance(count, int) or count < 0:
            fail(f"entries-index.json has invalid count for {path}")
        index_file_map[path] = count

    missing_from_index = [path for path in catalog_paths if path not in index_file_map]
    if missing_from_index:
        fail(f"catalog paths missing from index: {missing_from_index[:10]}")

    missing_from_catalog = [path for path in index_file_map if path not in catalog_paths]
    if missing_from_catalog:
        fail(f"index paths missing from catalog: {missing_from_catalog[:10]}")

    references: set[str] = set()
    total = 0
    last_reference = ""

    for relative_path in catalog_paths:
        file_path = ROOT / relative_path
        payload = read_json(file_path)
        entries = payload.get("entries")
        if not isinstance(entries, list):
            fail(f"{relative_path} has no entries list")

        expected = index_file_map[relative_path]
        if len(entries) != expected:
            fail(f"{relative_path}: entries count {len(entries)} != index count {expected}")

        for entry in entries:
            if not isinstance(entry, dict):
                fail(f"{relative_path}: entry is not an object")

            for field in REQUIRED_ENTRY_FIELDS:
                value = entry.get(field)
                if not isinstance(value, str) or not value.strip():
                    fail(f"{relative_path}: missing/empty field {field} in {entry!r}")

            reference = entry["reference"]
            validate_reference_bounds(reference, verse_counts, relative_path)

            if reference in references:
                fail(f"duplicate reference {reference}")

            references.add(reference)
            last_reference = reference

        total += len(entries)

    if total != catalog_count:
        fail(f"actual total {total} != catalog.entriesCount {catalog_count}")

    if total != len(references):
        fail("reference set size differs from total entries")

    print("TADABBUR VERIFY OK")
    print(f"entries: {total}")
    print(f"files: {len(catalog_paths)}")
    print(f"last_reference: {last_reference}")
    print(f"coverage_verses: {sum(verse_counts)}")
    print(f"catalog: {CATALOG_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
