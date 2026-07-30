#!/usr/bin/env python3
"""Apply premium SVG icon system across visitor and test HTML apps."""
from pathlib import Path
import re

ROOT = Path('/workspace')

ICON_CSS = """
.app-icon{display:block;flex-shrink:0;color:inherit;vertical-align:middle}
.app-icon-emblem,.app-icon-emblem.emoji-emblem{display:inline-flex;align-items:center;justify-content:center;line-height:0;width:auto;height:auto;font-size:inherit}
.app-icon-emblem .app-icon,.nav-icon .app-icon,.feature-icon .app-icon,.float-btn .app-icon,.current-focus-icon .app-icon{display:block}
.feature-icon .app-icon,.more-feature-row .feature-icon .app-icon{margin:0 auto}
.float-handle-icons .app-icon{display:inline-block;vertical-align:middle}
.home-refresh-copy .app-icon,.quran-home-teaser-label .app-icon,.ramadan-teaser-label .app-icon,.hijri-header-pill .app-icon,.home-hijri-day-btn .app-icon{display:inline-block;vertical-align:-2px;margin-right:4px}
.book-author .app-icon{display:inline-block;vertical-align:-2px;margin-right:4px}
.prayer-action-btn .app-icon{display:inline-block;vertical-align:-2px;margin-right:5px}
"""

FEATURE_MAP = {
    'feed': 'feed',
    'quiz': 'quiz',
    'ilm': 'ilm',
    'hadith': 'hadith',
    'topics': 'posts',
    'quran': 'quran',
    'duas': 'dua',
    'scholars': 'scholars',
    'books': 'books',
    'prayer': 'prayer',
    'jummah': 'jummah',
    'qibla': 'qibla',
    'calendar': 'calendar',
    'zakat': 'zakat',
    'wasiyyah': 'wasiyyah',
    'widgets': 'widgets',
    'image-editor': 'image',
    'saved': 'saved',
    'account': 'account',
    'news': 'news',
    'settings': 'settings',
    'about': 'about',
    'ramadan': 'ramadan',
}

FEATURE_ICON_RE = re.compile(r'\{id:"([^"]+)",title:"[^"]*",icon:"[^"]*"')
FEATURE_ICON_REPL = lambda m: f'{{id:"{m.group(1)}",title:"'  # placeholder - we'll do line by line

ICON_MARKUP_OLD = r'''function iconMarkup\(type="",value="",fallback=""\)\{const key=String\(type\+\" \"\+value\+\" \"\+fallback\)\.toLowerCase\(\);let emoji=\"📁\";if\(key\.includes\(\"hadith\"\).*?return`<span class=\"emoji-emblem\" aria-hidden=\"true\">\$\{emoji\}</span>`\}'''

ICON_MARKUP_NEW = '''function iconMarkup(type="",value="",fallback=""){return appIconEmblem(iconNameFromMarkup(type,value,fallback),"lg")}'''

TOPIC_EMBLEM_OLD_START = 'function topicEmblem(title){'
TOPIC_EMBLEM_NEW = '''function topicEmblem(title){
  const k=String(title||"").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");
  if(/sifat|sifa allah/.test(k))return `<span class="emoji-emblem" aria-hidden="true">ﷲ</span>`;
  return appIconEmblem(iconNameFromTopic(title),"lg");
}'''

CURRENT_UPDATE_OLD = r'function currentUpdateIcon\(item\)\{const key=String\(\[item\.type,item\.title,item\.badge,item\.nav,item\.value\]\.filter\(Boolean\)\.join\(" "\)\)\.toLowerCase\(\);if\(/quiz/.test\(key\)\)return"🧠";if\(/zakat\|zakāt/.test\(key\)\)return"🕌";if\(/dua\|duʿā\|bitt/.test\(key\)\)return"🤲";if\(/serie\|hukm\|muhakamah\|muḥākamah/.test\(key\)\)return"⚖️";if\(/qur\|tafsir/.test\(key\)\)return"📖";if\(/post\|beitrag/.test\(key\)\)return"📚";return"✨"\}'''

CURRENT_UPDATE_NEW = 'function currentUpdateIcon(item){return appIconEmblem(iconNameFromUpdate(item),"md")}'

RENDER_FEATURE_CARD_OLD = 'function renderFeatureCard(item){const pinned=isFeaturePinned(item.id);return `<article class="feature-card" data-feature-card="${esc(item.id)}"><div class="feature-card-top"><div class="feature-icon">${esc(item.icon||"✨")}</div>'
RENDER_FEATURE_CARD_NEW = 'function renderFeatureCard(item){const pinned=isFeaturePinned(item.id);return `<article class="feature-card" data-feature-card="${esc(item.id)}"><div class="feature-card-top"><div class="feature-icon">${appIcon(item.iconName||item.icon||"sparkle","lg")}</div>'

RENDER_MORE_ROW_OLD = 'return `<button class="more-feature-row" type="button" data-nav="${esc(item.nav)}" ${item.value?`data-value="${esc(item.value)}"`:""} data-feature-search="${esc(search)}"><span class="feature-icon">${esc(item.icon||"✨")}</span>'
RENDER_MORE_ROW_NEW = 'return `<button class="more-feature-row" type="button" data-nav="${esc(item.nav)}" ${item.value?`data-value="${esc(item.value)}"`:""} data-feature-search="${esc(search)}"><span class="feature-icon">${appIcon(item.iconName||item.icon||"sparkle","lg")}</span>'

PIN_BTN_OLD = '${pinned?"★":"☆"}'
PIN_BTN_NEW = '${pinned?appIcon("pin","sm"):appIcon("pin-outline","sm")}'


def patch_file(path: Path, is_test: bool):
    text = path.read_text(encoding='utf-8')

    if 'app-icon-system.js' not in text:
        text = text.replace(
            '<script src="/assets/slide-post-parser.js?v=2"></script>',
            '<script src="/assets/slide-post-parser.js?v=2"></script>\n<script src="/assets/app-icon-system.js?v=1"></script>',
            1,
        )

    if '.app-icon{display:block' not in text:
        text = text.replace('</style>', ICON_CSS + '\n</style>', 1)

    # Bottom nav
    if is_test:
        text = text.replace(
            '<button class="bottom-nav-btn" type="button" data-bottom-nav="home" aria-label="Startseite"><span class="nav-icon" aria-hidden="true">⌂</span><span>Start</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="ilm" aria-label="ʿIlm"><span class="nav-icon" aria-hidden="true">📘</span><span>ʿIlm</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true">✦</span><span>Feed</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true">📖</span><span>Qurʾān</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="more" aria-label="Weitere Bereiche"><span class="nav-icon" aria-hidden="true">☰</span><span>Mehr</span></button>',
            '<button class="bottom-nav-btn" type="button" data-bottom-nav="home" aria-label="Startseite"><span class="nav-icon" aria-hidden="true" data-app-icon="home" data-app-icon-size="lg"></span><span>Start</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="ilm" aria-label="ʿIlm"><span class="nav-icon" aria-hidden="true" data-app-icon="ilm" data-app-icon-size="lg"></span><span>ʿIlm</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true" data-app-icon="feed" data-app-icon-size="lg"></span><span>Feed</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true" data-app-icon="quran" data-app-icon-size="lg"></span><span>Qurʾān</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="more" aria-label="Weitere Bereiche"><span class="nav-icon" aria-hidden="true" data-app-icon="more" data-app-icon-size="lg"></span><span>Mehr</span></button>',
        )
    else:
        text = text.replace(
            '<button class="bottom-nav-btn" type="button" data-bottom-nav="home" aria-label="Startseite"><span class="nav-icon" aria-hidden="true">⌂</span><span>Start</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quiz" aria-label="Din-Quiz"><span class="nav-icon" aria-hidden="true">🧠</span><span>Quiz</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true">✦</span><span>Feed</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true">📖</span><span>Qurʾān</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="more" aria-label="Weitere Bereiche"><span class="nav-icon" aria-hidden="true">☰</span><span>Mehr</span></button>',
            '<button class="bottom-nav-btn" type="button" data-bottom-nav="home" aria-label="Startseite"><span class="nav-icon" aria-hidden="true" data-app-icon="home" data-app-icon-size="lg"></span><span>Start</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quiz" aria-label="Din-Quiz"><span class="nav-icon" aria-hidden="true" data-app-icon="quiz" data-app-icon-size="lg"></span><span>Quiz</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="feed" aria-label="Feed"><span class="nav-icon" aria-hidden="true" data-app-icon="feed" data-app-icon-size="lg"></span><span>Feed</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="quran" aria-label="Qurʾān"><span class="nav-icon" aria-hidden="true" data-app-icon="quran" data-app-icon-size="lg"></span><span>Qurʾān</span></button>\n  <button class="bottom-nav-btn" type="button" data-bottom-nav="more" aria-label="Weitere Bereiche"><span class="nav-icon" aria-hidden="true" data-app-icon="more" data-app-icon-size="lg"></span><span>Mehr</span></button>',
        )

    # Float actions
    text = text.replace(
        '<span class="float-handle-icons" aria-hidden="true"><span>🧭</span><span>♡</span><span>🔔</span></span>',
        '<span class="float-handle-icons" aria-hidden="true"><span data-app-icon="compass" data-app-icon-size="sm"></span><span data-app-icon="heart" data-app-icon-size="sm"></span><span data-app-icon="bell" data-app-icon-size="sm"></span></span>',
    )
    text = text.replace(
        '<button id="qiblaFloat" class="float-btn qibla-float" type="button" aria-label="Qibla-Kompass öffnen" title="Qibla-Kompass">🧭</button>',
        '<button id="qiblaFloat" class="float-btn qibla-float" type="button" aria-label="Qibla-Kompass öffnen" title="Qibla-Kompass" data-app-icon="compass" data-app-icon-size="lg"></button>',
    )
    text = text.replace(
        '<button id="savedFloat" class="float-btn saved-float" type="button" aria-label="Favoriten" title="Favoriten">♡</button>',
        '<button id="savedFloat" class="float-btn saved-float" type="button" aria-label="Favoriten" title="Favoriten" data-app-icon="heart" data-app-icon-size="lg"></button>',
    )
    text = text.replace(
        '<button id="pushFloat" class="float-btn" type="button" aria-label="Benachrichtigungen" title="Benachrichtigungen">🔔</button>',
        '<button id="pushFloat" class="float-btn" type="button" aria-label="Benachrichtigungen" title="Benachrichtigungen" data-app-icon="bell" data-app-icon-size="lg"></button>',
    )

    # iconMarkup
    text = re.sub(
        r'function iconMarkup\(type="",value="",fallback=""\)\{const key=String\(type\+\" \"\+value\+\" \"\+fallback\)\.toLowerCase\(\);let emoji=.*?return`<span class=\"emoji-emblem\" aria-hidden=\"true\">\$\{emoji\}</span>`\}',
        ICON_MARKUP_NEW,
        text,
        count=1,
        flags=re.S,
    )

    # topicEmblem
    start = text.find('function topicEmblem(title){')
    if start != -1:
        end = text.find('function renderSeriesBox()', start)
        if end != -1:
            text = text[:start] + TOPIC_EMBLEM_NEW + '\n' + text[end:]

    # currentUpdateIcon
    text = re.sub(CURRENT_UPDATE_OLD, CURRENT_UPDATE_NEW, text, count=1)

    # feature catalog icons -> iconName
    for fid, iname in FEATURE_MAP.items():
        text = re.sub(
            rf'(\{{id:"{fid}",title:"[^"]*",)icon:"[^"]*"',
            rf'\1iconName:"{iname}"',
            text,
            count=1,
        )

    # renderFeatureCard / renderMoreFeatureRow / pin
    text = text.replace(RENDER_FEATURE_CARD_OLD, RENDER_FEATURE_CARD_NEW)
    text = text.replace(RENDER_MORE_ROW_OLD, RENDER_MORE_ROW_NEW)
    text = text.replace(PIN_BTN_OLD, PIN_BTN_NEW)

    # book author pen
    text = text.replace(
        '<div class="book-author">🖋️ ${esc(author)}</div>',
        '<div class="book-author">${appIcon("pen","sm")} ${esc(author)}</div>',
    )

    # Home refresh
    text = text.replace(
        '<b>🔄 Aktualisieren</b>',
        '<b>${appIcon("refresh","sm")} Aktualisieren</b>',
    )

    # Hijri header in setHeader
    text = text.replace(
        'data-nav="calendar" aria-label="Islamischen Kalender öffnen">🗓️ Islamisches Datum</button>',
        'data-nav="calendar" aria-label="Islamischen Kalender öffnen"><span data-app-icon="calendar" data-app-icon-size="sm"></span> Islamisches Datum</button>',
    )

    # updateHijriHeaderDate
    text = text.replace(
        'el.textContent=`🗓️ ${h.day}. ${h.month} ${h.year} AH`;',
        'el.innerHTML=`${appIcon("calendar","sm")} ${h.day}. ${h.month} ${h.year} AH`;',
    )
    text = text.replace(
        'el.textContent="🗓️ Islamisches Datum"',
        'el.innerHTML=`${appIcon("calendar","sm")} Islamisches Datum`',
    )

    # Quran home teaser labels
    text = text.replace(
        '<span class="quran-home-teaser-label">📖 114 Suren</span>',
        '<span class="quran-home-teaser-label">${appIcon("quran","sm")} 114 Suren</span>',
    )
    text = text.replace(
        '<span class="quran-home-teaser-label">📖 Weiterlesen</span>',
        '<span class="quran-home-teaser-label">${appIcon("quran","sm")} Weiterlesen</span>',
    )

    # Ramadan teaser
    text = text.replace(
        '${ctx.phase==="ramadan"?"🌙 Ramaḍān":"✨ Saisonaler Bereich"}',
        '${ctx.phase==="ramadan"?`${appIcon("ramadan","sm")} Ramaḍān`:`${appIcon("sparkle","sm")} Saisonaler Bereich`}',
    )

    # Home folder emblems
    folder_icons = {
        '🌙': 'ramadan',
        '📖': 'quran',
        '🕌': 'prayer',
        '📜': 'wasiyyah',
        '🗓️': 'calendar',
    }
    for emoji, name in folder_icons.items():
        text = text.replace(
            f'<span class="emoji-emblem">{emoji}</span>',
            f'${{appIconEmblem("{name}","lg")}}',
        )

    # Ramadan panel buttons
    text = text.replace(
        'data-nav="prayer">🕌 Gebetszeiten & Standort</button>',
        'data-nav="prayer">${appIcon("prayer","sm")} Gebetszeiten & Standort</button>',
    )
    text = text.replace(
        'data-nav="calendar">🗓️ Kalender</button>',
        'data-nav="calendar">${appIcon("calendar","sm")} Kalender</button>',
    )

    # News detail title - remove emoji prefix from title, use icon separately would need bigger refactor
    text = text.replace(
        '<h2>${esc(icon+" "+item.title||"Neue Inhalte")}</h2>',
        '<h2>${icon} ${esc(item.title||"Neue Inhalte")}</h2>',
    )

    # Ilm welcome logo
    text = text.replace(
        '<div class="ilm-welcome-logo" aria-hidden="true">📘</div>',
        '<div class="ilm-welcome-logo" aria-hidden="true">${appIcon("ilm","hero")}</div>',
    )

    # Ilm chat controls
    ilm_repls = [
        ('aria-label="Zurück">←</button>', 'aria-label="Zurück">${appIcon("back","md")}</button>'),
        ('id="ilmHistoryBtn" type="button" aria-label="Verlauf">◷</button>', 'id="ilmHistoryBtn" type="button" aria-label="Verlauf">${appIcon("history","md")}</button>'),
        ('id="ilmMenuBtn" type="button" aria-label="Menü">⋯</button>', 'id="ilmMenuBtn" type="button" aria-label="Menü">${appIcon("dots","md")}</button>'),
        ('id="ilmSendBtn" type="button" aria-label="Senden">↑</button>', 'id="ilmSendBtn" type="button" aria-label="Senden">${appIcon("send","md")}</button>'),
        ('id="ilmStopBtn" type="button" aria-label="Stoppen">■</button>', 'id="ilmStopBtn" type="button" aria-label="Stoppen">${appIcon("stop","md")}</button>'),
    ]
    for old, new in ilm_repls:
        text = text.replace(old, new)

    # Dua page header
    text = text.replace(
        'return `${setPageHeader("Duʿāʾ","Bittgebete aus Qurʾān und Sunnah","Duʿāʾ")}<div class="emoji-emblem" style="font-size:42px;margin-bottom:12px">🤲</div>',
        'return `${setPageHeader("Duʿāʾ","Bittgebete aus Qurʾān und Sunnah","Duʿāʾ")}<div style="margin-bottom:12px">${appIconEmblem("dua","hero")}</div>',
    )

    # Saved page
    text = text.replace(
        'return `${setPageHeader("Favoriten","Gespeicherte Beiträge und Duʿāʾ","Favoriten")}<div class="emoji-emblem" style="font-size:42px;margin-bottom:12px">♡</div>',
        'return `${setPageHeader("Favoriten","Gespeicherte Beiträge und Duʿāʾ","Favoriten")}<div style="margin-bottom:12px">${appIconEmblem("saved","hero")}</div>',
    )

    # Stats header
    text = text.replace('🔒 Statistik', '${appIcon("lock","sm")} Statistik')
    text = text.replace('📊 Statistik-Dashboard', '${appIcon("document","sm")} Statistik-Dashboard')

    # Qibla panel
    text = text.replace('>🕋 Qibla-Kompass</', '>${appIcon("kaaba","sm")} Qibla-Kompass</')
    text = text.replace('>🧭 Qibla starten</', '>${appIcon("compass","sm")} Qibla starten</')
    text = text.replace('>⏹ Stoppen</', '>${appIcon("stop","sm")} Stoppen</')

    # Prayer quick card location buttons - if emoji in template
    text = text.replace('>📍 Standort</', '>${appIcon("location","sm")} Standort</')
    text = text.replace('>🕌 Gebetszeiten</', '>${appIcon("prayer","sm")} Gebetszeiten</')

    # Hydrate after render
    if 'hydrateAppIcons(appView)' not in text:
        text = text.replace(
            'function render(){',
            'function render(){const __appViewBefore=Date.now();',
            1,
        )
        # Add hydrate call at end of render - find a reliable spot
        text = text.replace(
            'bindEvents();',
            'bindEvents();hydrateAppIcons($("appView")||document);',
            1,
        )

    path.write_text(text, encoding='utf-8')
    print('patched', path)


def main():
    patch_file(ROOT / 'index.html', is_test=False)
    patch_file(ROOT / 'test' / 'index.html', is_test=True)

    # version bump test
    vpath = ROOT / 'test' / 'version.json'
    vpath.write_text('''{
  "buildId": "app-shell-v280",
  "note": "Premium SVG Icon-System appweit (Test v280)",
  "updatedAt": "2026-07-19T17:00:00.000Z"
}
''', encoding='utf-8')

    for fp in [ROOT / 'test' / 'index.html']:
        t = fp.read_text(encoding='utf-8')
        t = t.replace('app-shell-v279', 'app-shell-v280')
        fp.write_text(t, encoding='utf-8')


if __name__ == '__main__':
    main()
