#!/usr/bin/env python3
"""Ensure sharePanel v13: row1 IG|WA|TG, row2 Teilen|Copy|extraAction."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TG = r'<a class="share-btn tg" href="https://t.me/share/url\?url=\$\{shareUrl\}&text=\$\{shareText\}" target="_blank" rel="noopener">.*?</a>'
WA = r'<a class="share-btn wa" href="https://wa.me/\?text=\$\{shareText\}" target="_blank" rel="noopener">.*?</a>'


def patch(path: Path) -> None:
    s = path.read_text(encoding="utf-8")
    m = re.search(
        r'(function sharePanel\(.*?\n  return `)(<section class="share-panel.*?</section>)(`;\n\})',
        s,
        re.S,
    )
    if not m:
        raise SystemExit(f"sharePanel not found in {path}")

    html = m.group(2)
    html = html.replace("share-layout-v12", "share-layout-v13")

    tg_m = re.search(TG, html, re.S)
    wa_m = re.search(WA, html, re.S)
    if not tg_m or not wa_m:
        raise SystemExit(f"tg/wa blocks not found in {path}")

    tg_block, wa_block = tg_m.group(0), wa_m.group(0)
    html = re.sub(
        r'(<span>Instagram</span></button>).*?(</div><div class="share-row share-row-v11 share-row-secondary">)',
        r"\1" + wa_block + tg_block + r"\2",
        html,
        count=1,
        flags=re.S,
    )

    html = re.sub(
        r'(<span>Teilen</span></button>)\$\{extraAction\}(<button class="share-btn link")',
        r"\1\2",
        html,
    )
    html = re.sub(
        r'(<span>\$\{esc\(copyLabel\)\}</span></button>)(</div></div>)',
        r"\1${extraAction}\2",
        html,
    )

    path.write_text(s[: m.start(2)] + html + s[m.end(2) :], encoding="utf-8")
    print(f"Patched {path}")


for rel in ("test/index.html", "index.html"):
    patch(ROOT / rel)
