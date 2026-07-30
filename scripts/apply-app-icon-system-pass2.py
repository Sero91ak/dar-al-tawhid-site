#!/usr/bin/env python3
"""Second pass: replace remaining UI emojis with appIcon system."""
from pathlib import Path
import re

ROOT = Path('/workspace')

REPLACEMENTS = [
    # Static header
    ('<button id="hijriHeaderDate" class="hijri-header-pill" type="button" data-hijri-today data-nav="calendar" aria-label="Islamischer Kalender">🗓️ Islamisches Datum</button>',
     '<button id="hijriHeaderDate" class="hijri-header-pill" type="button" data-hijri-today data-nav="calendar" aria-label="Islamischer Kalender"><span data-app-icon="calendar" data-app-icon-size="sm"></span> Islamisches Datum</button>'),
    ('<span class="isnad-speaker">🖋️ Ibn Sīrīn sagte:</span>',
     '<span class="isnad-speaker">${appIcon("pen","sm")} Ibn Sīrīn sagte:</span>'),
    ('<div class="isnad-source" title="Muslim, Ṣaḥīḥ Muslim, Muqaddimah, Bāb: al-Isnād min ad-Dīn, Band 1, S. 14.">📝 Muslim,',
     '<div class="isnad-source" title="Muslim, Ṣaḥīḥ Muslim, Muqaddimah, Bāb: al-Isnād min ad-Dīn, Band 1, S. 14.">${appIcon("document","sm")} Muslim,'),
    ('<button id="backBtn" class="back-btn" type="button">← Zurück</button><button id="homeBtn" class="home-btn" type="button">⌂ Startseite</button>',
     '<button id="backBtn" class="back-btn" type="button">${appIcon("back","sm")} Zurück</button><button id="homeBtn" class="home-btn" type="button">${appIcon("home","sm")} Startseite</button>'),
    # Quran
    ('<option value="">📖 Sure</option>', '<option value="">Sure</option>'),
    ('>📖 Tafsīr & Erklärung</button>', '>${appIcon("tafsir","sm")} Tafsīr & Erklärung</button>'),
    ('introTitle:String(fm.introTitle||"🧭 Einordnung").trim()||"🧭 Einordnung"',
     'introTitle:String(fm.introTitle||"Einordnung").trim()||"Einordnung"'),
    # Direct pick
    ('<option value="">📚 Thema</option>', '<option value="">Thema</option>'),
    ('<option value="">👤 Gelehrter</option>', '<option value="">Gelehrter</option>'),
    ('<option value="">📖 Buch</option>', '<option value="">Buch</option>'),
    # Stats
    ('<span class="stats-metric-pill">👁 ${views} gelesen</span>', '<span class="stats-metric-pill">${appIcon("eye","xs")} ${views} gelesen</span>'),
    ('<span class="stats-metric-pill">↗ ${shares} geteilt</span>', '<span class="stats-metric-pill">${appIcon("arrow-up-right","xs")} ${shares} geteilt</span>'),
    ('<span class="stats-metric-pill">♡ ${saves} gespeichert</span>', '<span class="stats-metric-pill">${appIcon("heart","xs")} ${saves} gespeichert</span>'),
    # Prayer
    ('locationLabel="📍 Standort freigeben"', 'locationLabel="${appIcon(\\"location\\",\\"sm\\")} Standort freigeben"'),
    ('const label=active?"✓ Erinnerung aktiv":"🔔 Erinnerung aktivieren"', 'const label=active?`${appIcon("check","sm")} Erinnerung aktiv`:`${appIcon("bell","sm")} Erinnerung aktivieren`'),
    ('type="button">🔔 Test senden</button>', 'type="button">${appIcon("bell","sm")} Test senden</button>'),
    ('btn.textContent=active?"✓ Erinnerung aktiv":"🔔 Erinnerung aktivieren"',
     'btn.textContent=active?`${appIcon("check","sm")} Erinnerung aktiv`:`${appIcon("bell","sm")} Erinnerung aktivieren`'),
    ('btn.textContent=oldText||"🔔 Test senden"', 'btn.textContent=oldText||`${appIcon("bell","sm")} Test senden`'),
    ('reminder.textContent=old||"🔔 Erinnerung aktivieren"', 'reminder.textContent=old||`${appIcon("bell","sm")} Erinnerung aktivieren`'),
    ('>📍 Standort freigeben</button>', '>${appIcon("location","sm")} Standort freigeben</button>'),
    ('data-nav="prayer">🕌 Ordner öffnen</button>', 'data-nav="prayer">${appIcon("prayer","sm")} Ordner öffnen</button>'),
    ('<strong>🔔 Gebets-Push auf dem Sperrbildschirm</strong>', '<strong>${appIcon("bell","sm")} Gebets-Push auf dem Sperrbildschirm</strong>'),
    ('data-nav="prayer">🕌 Gebetszeiten öffnen</button>', 'data-nav="prayer">${appIcon("prayer","sm")} Gebetszeiten öffnen</button>'),
    # Qibla
    ('id="qiblaProTitle">🕋 Kompass</h3>', 'id="qiblaProTitle">${appIcon("kaaba","sm")} Kompass</h3>'),
    ('startBtn.textContent="🧭 Kompass starten"', 'startBtn.textContent=`${appIcon("compass","sm")} Kompass starten`'),
    # Home teasers
    ('<span class="zakat-home-teaser-icon" aria-hidden="true">🕌</span>', '<span class="zakat-home-teaser-icon" aria-hidden="true">${appIcon("zakat","md")}</span>'),
    ('<span class="zakat-home-teaser-icon" aria-hidden="true">🧠</span>', '<span class="zakat-home-teaser-icon" aria-hidden="true">${appIcon("quiz","md")}</span>'),
    # Topics hub
    ('<span class="emoji-emblem">🆕</span>', '${appIconEmblem("newBadge","lg")}'),
    ('<span class="emoji-emblem">🤲</span>', '${appIconEmblem("dua","lg")}'),
    # CSS post-card icon
    ('content:"📖"', 'content:""'),
    # Quran star bookmark - use icon names in JS
    ('const icon=isManual?"★":"☆";', 'const icon=isManual?appIcon("star","sm"):appIcon("star-outline","sm");'),
    # Screen wake toggle
    ('>☀️</button>', '>${appIcon("sun","sm")}</button>'),
    ('>🌙</button>', '>${appIcon("moon","sm")}</button>'),
]

def patch(path: Path):
    text = path.read_text(encoding='utf-8')
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    # renderTopicsHubSection partial fix for scholars emoji
    text = text.replace('<span class="emoji-emblem">👤</span>', '${appIconEmblem("scholars","lg")}')
    text = text.replace('<span class="emoji-emblem">📚</span>', '${appIconEmblem("posts","lg")}')
    # Dua list header if exists
    text = text.replace(
        'return `${setPageHeader("Duʿāʾ","Bittgebete aus Qurʾān und Sunnah","Duʿāʾ")}<div class="emoji-emblem" style="font-size:42px;margin-bottom:12px">🤲</div>',
        'return `${setPageHeader("Duʿāʾ","Bittgebete aus Qurʾān und Sunnah","Duʿāʾ")}<div style="margin-bottom:12px">${appIconEmblem("dua","hero")}</div>',
    )
    # renderDuas if different pattern
    text = re.sub(
        r'<div class="emoji-emblem" style="font-size:42px;margin-bottom:12px">🤲</div>',
        '<div style="margin-bottom:12px">${appIconEmblem("dua","hero")}</div>',
        text,
    )
    text = re.sub(
        r'<div class="emoji-emblem" style="font-size:42px;margin-bottom:12px">♡</div>',
        '<div style="margin-bottom:12px">${appIconEmblem("saved","hero")}</div>',
        text,
    )
    # Ilm welcome
    text = text.replace(
        '<div class="ilm-welcome-logo" aria-hidden="true">📘</div>',
        '<div class="ilm-welcome-logo" aria-hidden="true">${appIcon("ilm","hero")}</div>',
    )
    path.write_text(text, encoding='utf-8')
    print('pass2', path)

if __name__ == '__main__':
    patch(ROOT / 'index.html')
    patch(ROOT / 'test' / 'index.html')
