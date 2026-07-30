#!/usr/bin/env python3
"""Integrate premium 3D feature icons + UI icon system."""
from pathlib import Path
import re

ROOT = Path('/workspace')

FEATURE_CSS = """
/* Premium 3D Feature Icons */
.feature-icon-img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none}
.feature-icon-emblem,.feature-icon-emblem.emoji-emblem{display:inline-flex;align-items:center;justify-content:center;line-height:0;width:auto;height:auto;background:none!important;border:none!important;box-shadow:none!important}
.feature-icon-emblem .feature-icon-img,.more-feature-row__icon .feature-icon-img,.feature-card__icon .feature-icon-img,.current-focus-icon .feature-icon-img{filter:drop-shadow(0 10px 18px rgba(0,0,0,.22))}
.more-feature-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;grid-template-columns:none!important}
.more-feature-row__copy{min-width:0;flex:1 1 auto;text-align:left}
.more-feature-row__icon{flex:0 0 auto;width:56px;height:56px;display:flex;align-items:center;justify-content:center}
.feature-card--premium{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.feature-card--premium .feature-card__copy{min-width:0;flex:1 1 auto}
.feature-card--premium .feature-card__icon{width:58px;height:58px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;background:none!important;border:none!important;box-shadow:none!important}
.feature-card--premium .feature-card-actions{grid-column:1/-1}
.folder-icon .feature-icon-emblem{width:44px;height:44px}
.folder-icon .feature-icon-img{width:44px;height:44px}
.current-focus-icon .feature-icon-img{width:40px;height:40px}
.zakat-home-teaser-icon,.quiz-home-teaser-icon{display:inline-flex;width:28px;height:28px;vertical-align:-4px;margin-right:6px}
@media(max-width:370px){.more-feature-row__icon{width:48px;height:48px}.feature-card--premium .feature-card__icon{width:50px;height:50px}}
/* UI icons – warm duotone, not flat blue */
.ui-icon{color:var(--gold2)}
.bottom-nav-btn .ui-icon,.bottom-nav-btn .app-icon{color:var(--gold2)}
html[data-theme="light"] .bottom-nav-btn .ui-icon,html[data-theme="light"] .bottom-nav-btn .app-icon{color:#7a5c28}
html[data-theme="soft"] .bottom-nav-btn .ui-icon,html[data-theme="soft"] .bottom-nav-btn .app-icon{color:#8a6540}
"""

SCRIPT_BLOCK = '''<script src="/assets/feature-icon-system.js?v=1"></script>
<script src="/assets/ui-icon-system.js?v=1"></script>'''

def patch_html(path: Path):
    text = path.read_text(encoding='utf-8')

    # Replace script includes
    text = text.replace('<script src="/assets/app-icon-system.js?v=1"></script>', SCRIPT_BLOCK)
    if 'feature-icon-system.js' not in text:
        text = text.replace(
            '<script src="/assets/slide-post-parser.js?v=2"></script>',
            '<script src="/assets/slide-post-parser.js?v=2"></script>\n' + SCRIPT_BLOCK,
        )

    if '.feature-icon-img{display:block' not in text:
        text = text.replace('</style>', FEATURE_CSS + '\n</style>', 1)

    # iconMarkup -> feature icons
    text = re.sub(
        r'function iconMarkup\(type="",value="",fallback=""\)\{return appIconEmblem\(iconNameFromMarkup\(type,value,fallback\),"lg"\)\}',
        'function iconMarkup(type="",value="",fallback=""){return featureIconEmblem(featureIconFromMarkup(type,value,fallback),"md")}',
        text, count=1,
    )

    # topicEmblem
    text = re.sub(
        r'return appIconEmblem\(iconNameFromTopic\(title\),"lg"\);',
        'return featureIconEmblem(featureIconFromTopic(title),"md");',
        text, count=1,
    )

    # currentUpdateIcon
    text = re.sub(
        r'function currentUpdateIcon\(item\)\{return appIconEmblem\(iconNameFromUpdate\(item\),"md"\)\}',
        'function currentUpdateIcon(item){return featureIconEmblem(featureIconFromUpdate(item),"sm")}',
        text, count=1,
    )

    # renderFeatureCard - new layout
    old_card = 'function renderFeatureCard(item){const pinned=isFeaturePinned(item.id);return `<article class="feature-card" data-feature-card="${esc(item.id)}"><div class="feature-card-top"><div class="feature-icon">${appIcon(item.iconName||item.icon||"sparkle","lg")}</div><div><h4>${esc(item.title)} ${item.badge?`<span class="feature-badge">${esc(item.badge)}</span>`:""}</h4><p>${esc(item.desc||"")}</p></div></div><div class="feature-card-actions">'
    new_card = 'function renderFeatureCard(item){const pinned=isFeaturePinned(item.id);const fk=item.id||item.iconName||"fallback";return `<article class="feature-card feature-card--premium" data-feature-card="${esc(item.id)}"><div class="feature-card__copy"><h4>${esc(item.title)} ${item.badge?`<span class="feature-badge">${esc(item.badge)}</span>`:""}</h4><p>${esc(item.desc||"")}</p></div><div class="feature-card__icon" aria-hidden="true">${featureIcon(fk,"lg",item.title)}</div><div class="feature-card-actions">'
    text = text.replace(old_card, new_card)

    # renderMoreFeatureRow - icon right
    old_row = 'return `<button class="more-feature-row" type="button" data-nav="${esc(item.nav)}" ${item.value?`data-value="${esc(item.value)}"`:""} data-feature-search="${esc(search)}"><span class="feature-icon">${appIcon(item.iconName||item.icon||"sparkle","lg")}</span><span><h4>${esc(item.title)} ${item.badge?`<span class="feature-badge">${esc(item.badge)}</span>`:""}</h4><p>${esc(item.desc||"")}</p></span></button>`'
    new_row = 'return `<button class="more-feature-row" type="button" data-nav="${esc(item.nav)}" ${item.value?`data-value="${esc(item.value)}"`:""} data-feature-search="${esc(search)}"><span class="more-feature-row__copy"><h4>${esc(item.title)} ${item.badge?`<span class="feature-badge">${esc(item.badge)}</span>`:""}</h4><p>${esc(item.desc||"")}</p></span><span class="more-feature-row__icon" aria-hidden="true">${featureIcon(item.id||item.iconName||"fallback","md",item.title)}</span></button>`'
    text = text.replace(old_row, new_row)

    # Home folder emblems - replace appIconEmblem with featureIconEmblem
    replacements = [
        ('${appIconEmblem("ramadan","lg")}', '${featureIconEmblem("ramadan","md")}'),
        ('${appIconEmblem("quran","lg")}', '${featureIconEmblem("quran","md")}'),
        ('${appIconEmblem("prayer","lg")}', '${featureIconEmblem("prayer-times","md")}'),
        ('${appIconEmblem("wasiyyah","lg")}', '${featureIconEmblem("wasiyyah","md")}'),
        ('${appIconEmblem("calendar","lg")}', '${featureIconEmblem("islamic-calendar","md")}'),
        ('${appIconEmblem("newBadge","lg")}', '${featureIconEmblem("news","md")}'),
        ('${appIconEmblem("dua","lg")}', '${featureIconEmblem("dua","md")}'),
        ('${appIconEmblem("scholars","lg")}', '${featureIconEmblem("scholars","md")}'),
        ('${appIconEmblem("posts","lg")}', '${featureIconEmblem("posts","md")}'),
    ]
    for a, b in replacements:
        text = text.replace(a, b)

    # Teaser icons
    text = text.replace(
        '<span class="zakat-home-teaser-icon" aria-hidden="true">${appIcon("zakat","md")}</span>',
        '<span class="zakat-home-teaser-icon" aria-hidden="true">${featureIcon("zakat","sm","Zakāt")}</span>',
    )
    text = text.replace(
        '<span class="zakat-home-teaser-icon" aria-hidden="true">${appIcon("quiz","md")}</span>',
        '<span class="zakat-home-teaser-icon" aria-hidden="true">${featureIcon("din-quiz","sm","Quiz")}</span>',
    )

    # Ilm welcome - use feature icon
    text = text.replace(
        '<div class="ilm-welcome-logo" aria-hidden="true">${appIcon("ilm","hero")}</div>',
        '<div class="ilm-welcome-logo" aria-hidden="true">${featureIcon("ilm","lg","ʿIlm")}</div>',
    )

    # Dua/saved page headers
    text = text.replace(
        '${appIconEmblem("dua","hero")}',
        '${featureIconEmblem("dua","lg")}',
    )
    text = text.replace(
        '${appIconEmblem("saved","hero")}',
        '${featureIconEmblem("saved","lg")}',
    )

    # hydrate - also ui icons
    if 'hydrateUiIcons' not in text:
        text = text.replace(
            'bindEvents();hydrateAppIcons($("appView")||document);',
            'bindEvents();hydrateUiIcons($("appView")||document);',
        )

    path.write_text(text, encoding='utf-8')
    print('patched', path)


def main():
    # Copy app-icon-system to ui-icon-system with aliases
    src = (ROOT / 'assets/app-icon-system.js').read_text(encoding='utf-8')
    ui = src.replace('Premium App Icon System', 'Premium UI Icon System (Navigation & Controls)')
    ui = ui.replace('global.appIcon = appIcon;', 'global.uiIcon = appIcon;\n  global.appIcon = appIcon;')
    ui = ui.replace('global.hydrateAppIcons = hydrateAppIcons;', 'global.hydrateUiIcons = hydrateAppIcons;\n  global.hydrateAppIcons = hydrateAppIcons;')
    ui = ui.replace("el.innerHTML = appIcon(name, size", "el.innerHTML = uiIcon(name, size")
    ui = ui.replace('class="app-icon', 'class="ui-icon app-icon')
    (ROOT / 'assets/ui-icon-system.js').write_text(ui, encoding='utf-8')

    patch_html(ROOT / 'index.html')
    patch_html(ROOT / 'test' / 'index.html')

    vpath = ROOT / 'test' / 'version.json'
    vpath.write_text('''{
  "buildId": "app-shell-v281",
  "note": "Premium 3D Feature-Icons + UI-Duotone-System (Test v281)",
  "updatedAt": "2026-07-19T17:30:00.000Z"
}
''', encoding='utf-8')

    for fp in [ROOT / 'test/index.html']:
        t = fp.read_text(encoding='utf-8')
        t = t.replace('app-shell-v280', 'app-shell-v281')
        fp.write_text(t, encoding='utf-8')


if __name__ == '__main__':
    main()
