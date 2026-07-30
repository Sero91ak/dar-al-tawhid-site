#!/usr/bin/env python3
"""Sync Quran overview v360 changes from index.html to test/index.html."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "index.html"
DST = ROOT / "test" / "index.html"


def extract_between(text: str, start: str, end: str) -> str:
    i = text.find(start)
    if i < 0:
        raise ValueError(f"start marker not found: {start[:80]}")
    j = text.find(end, i + len(start))
    if j < 0:
        raise ValueError(f"end marker not found after {start[:80]}")
    return text[i:j]


def replace_between(text: str, start: str, end: str, replacement: str) -> str:
    i = text.find(start)
    if i < 0:
        raise ValueError(f"start marker not found: {start[:80]}")
    j = text.find(end, i + len(start))
    if j < 0:
        raise ValueError(f"end marker not found after {start[:80]}")
    return text[:i] + replacement + text[j:]


def main() -> None:
    src = SRC.read_text(encoding="utf-8")
    dst = DST.read_text(encoding="utf-8")

    css_end = "@media(min-width:760px){.qov-page{padding-left:8px;padding-right:8px}}\n\n"
    css_block = extract_between(src, "/* QURAN_OVERVIEW_V360:", css_end) + css_end
    if "/* QURAN_OVERVIEW_V360:" in dst:
        dst = replace_between(dst, "/* QURAN_OVERVIEW_V360:", css_end + "</style>", css_block)
    else:
        anchor = "@media(max-width:700px){body.is-calendar-route .calendar-premium-page,.calendar-premium-page{padding:14px 12px var(--cal-nav-pad)}body.is-calendar-route .calendar-premium-page .cal-tl-filters-wrap,.calendar-premium-page .cal-tl-filters-wrap{margin:0 -12px 14px;padding:0 12px}}\n\n</style>"
        if anchor not in dst:
            raise ValueError("CSS anchor not found in test/index.html")
        dst = dst.replace(anchor, anchor.replace("</style>", "\n" + css_block + "</style>"), 1)

    js_insert = extract_between(
        src,
        "/* Inserted into index.html — Quran overview v360 */",
        "function quranModeTabs(active)",
    )
    dst = replace_between(
        dst,
        "function clearQuranAllProgress(){const state=getQuranReadingState();state.manual=null;state.automatic=null;setQuranReadingState(state)}",
        "function quranModeTabs(active)",
        "function clearQuranAllProgress(){const state=getQuranReadingState();state.manual=null;state.automatic=null;setQuranReadingState(state)}\n"
        + js_insert,
    )

    search_block = extract_between(src, "function renderQuranSearchResult(result,query)", "function quranTopicVisibleList()")
    dst = replace_between(dst, "function renderQuranSearchResult(result,query)", "function quranTopicVisibleList()", search_block)

    overview_ui = extract_between(src, "function bindQuranOverviewUi()", "function quranWakeSupported()")
    dst = replace_between(dst, "function initQuranProgressObserver()", "function quranWakeSupported()", overview_ui)

    dst = re.sub(
        r"function openQuranSurah\(surahId,ayah,opts\)\{const id=Number\(surahId\);",
        "function openQuranSurah(surahId,ayah,opts){const id=Number(surahId);touchQuranSurahOpened(id);",
        dst,
        count=1,
    )

    if 'is-quran-overview' not in dst:
        dst = dst.replace(
            '  document.body.classList.toggle("is-hadith-route",route.view==="hadith");\n',
            '  document.body.classList.toggle("is-hadith-route",route.view==="hadith");\n'
            '  document.body.classList.toggle("is-quran-overview",route.view==="quran");\n',
            1,
        )

    quran_chrome = extract_between(src, '  if(route.view==="quran"){\n', "  if(isHome){")
    if 'if(route.view==="quran")' not in dst:
        dst = dst.replace("  if(isHome){\n", quran_chrome + "  if(isHome){\n", 1)

    if "bindQuranOverviewUi" not in dst:
        dst = dst.replace(
            "  bindQuranQuickPick();\n",
            "  bindQuranQuickPick();\n  if(currentRoute.view===\"quran\")bindQuranOverviewUi();\n",
            1,
        )

    DST.write_text(dst, encoding="utf-8")
    print("Synced Quran overview v360 to test/index.html")


if __name__ == "__main__":
    main()
