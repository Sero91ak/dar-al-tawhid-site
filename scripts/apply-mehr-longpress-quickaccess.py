#!/usr/bin/env python3
"""Replace floating Schnellzugriff with Mehr long-press context menu."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

QUICK_ACCESS_HTML = """<div id="quickAccessLayer" class="quick-access-layer" hidden>
  <button type="button" id="quickAccessScrim" class="quick-access-scrim" aria-label="Schnellzugriff schließen"></button>
  <div id="quickAccessHint" class="quick-access-hint" hidden>Mehr gedrückt halten für Schnellzugriff</div>
  <div id="quickAccessMenu" class="quick-access-menu" role="menu" aria-label="Schnellzugriff" hidden>
    <button id="quickAccessOrientBtn" class="quick-access-item" type="button" role="menuitem" aria-label="Orientierung öffnen" title="Orientierung">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 4.8v2.2M12 17v2.2M4.8 12h2.2M17 12h2.2"/><path d="M12 8.2 14.6 12 12 15.8 9.4 12Z"/></svg>
      <span class="quick-access-item-copy"><span class="quick-access-item-label">Orientierung</span></span>
      <span class="quick-access-item-chevron" aria-hidden="true">›</span>
    </button>
    <button id="quickAccessSavedBtn" class="quick-access-item" type="button" role="menuitem" aria-label="Merkliste öffnen" title="Merkliste">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.4L6 20V5.5a1 1 0 0 1 1-1Z"/></svg>
      <span class="quick-access-item-copy"><span class="quick-access-item-label">Merkliste</span></span>
      <span id="quickAccessSavedBadge" class="quick-access-item-meta" hidden>0</span>
      <span class="quick-access-item-chevron" aria-hidden="true">›</span>
    </button>
    <button id="quickAccessRemindBtn" class="quick-access-item" type="button" role="menuitem" aria-label="Erinnerungen öffnen" title="Erinnerungen">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a4 4 0 0 0-4 4v1.2c0 .9-.3 1.78-.86 2.48L5.8 13.5A1.5 1.5 0 0 0 7 16h10a1.5 1.5 0 0 0 1.2-2.5l-1.34-1.82A4 4 0 0 1 16 9.2V8a4 4 0 0 0-4-4"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
      <span class="quick-access-item-copy"><span class="quick-access-item-label">Erinnerungen</span></span>
      <span id="quickAccessRemindStatus" class="quick-access-item-status" hidden></span>
      <span class="quick-access-item-chevron" aria-hidden="true">›</span>
    </button>
  </div>
</div>
"""

EXTRA_CSS = """
.float-actions,.float-touch-handle,.float-actions-panel,.float-item,.float-btn,.float-tip{display:none!important}
.quick-access-layer{position:fixed;inset:0;pointer-events:none;z-index:41}
.quick-access-layer[hidden]{display:none!important}
.quick-access-scrim{position:absolute;inset:0;background:transparent;border:0;padding:0;margin:0;pointer-events:auto}
.quick-access-menu{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:calc(var(--bottom-navigation-height,64px) + env(safe-area-inset-bottom) + 10px);width:min(248px,calc(100vw - 24px - env(safe-area-inset-left) - env(safe-area-inset-right)));border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--bg) 84%,var(--panel,rgba(255,255,255,.08)) 16%);box-shadow:0 10px 26px color-mix(in srgb,var(--text) 14%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.04);backdrop-filter:blur(12px) saturate(1.04);overflow:hidden;pointer-events:auto;transform-origin:calc(100% - 28px) calc(100% + 18px);opacity:0;transform:translateY(10px) scale(.97);transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .18s cubic-bezier(.22,1,.36,1)}
.quick-access-layer.is-open .quick-access-menu{opacity:1;transform:translateY(0) scale(1)}
.quick-access-item{appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 15px;border:0;background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.quick-access-item + .quick-access-item{border-top:1px solid var(--line2,var(--line))}
.quick-access-item:hover,.quick-access-item:active{background:color-mix(in srgb,var(--text) 6%,transparent)}
.quick-access-item:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--gold2,var(--gold)) 28%,transparent) inset}
.quick-access-item svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto;color:var(--gold2,var(--gold))}
.quick-access-item-copy{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.quick-access-item-label{font-size:14px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.quick-access-item-meta{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--gold2,var(--gold));color:var(--bg);font-size:10px;font-weight:900;line-height:1}
.quick-access-item-status{margin-left:auto;width:8px;height:8px;border-radius:999px;background:var(--gold2,var(--gold));box-shadow:0 0 0 1px color-mix(in srgb,var(--text) 12%,transparent)}
.quick-access-item-chevron{margin-left:auto;color:var(--muted);font-size:16px;font-weight:700;line-height:1}
.quick-access-hint{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:calc(var(--bottom-navigation-height,64px) + env(safe-area-inset-bottom) + 14px);max-width:min(240px,calc(100vw - 24px));padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--bg) 84%,var(--panel,rgba(255,255,255,.08)) 16%);color:var(--text);font-size:12px;font-weight:700;line-height:1.35;box-shadow:0 8px 20px color-mix(in srgb,var(--text) 12%,transparent);pointer-events:none;opacity:0;transform:translateY(8px);transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .18s cubic-bezier(.22,1,.36,1)}
.quick-access-hint.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.quick-access-menu,.quick-access-hint{transition:none!important}}
.more-quick-access{margin:0 0 14px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--bg) 88%,var(--panel,rgba(255,255,255,.06)) 12%);overflow:hidden}
.more-quick-access__head{padding:12px 14px 6px}
.more-quick-access__head h3{margin:0;font-size:15px;font-weight:850;color:var(--text)}
.more-quick-access__head p{margin:4px 0 0;font-size:12px;line-height:1.35;color:var(--muted)}
.more-quick-access__list{display:grid}
.more-quick-access__btn{appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 14px;border:0;border-top:1px solid var(--line2,var(--line));background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.more-quick-access__btn:hover,.more-quick-access__btn:active{background:color-mix(in srgb,var(--text) 6%,transparent)}
.more-quick-access__btn svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;color:var(--gold2,var(--gold));flex:0 0 auto}
.more-quick-access__label{flex:1;font-size:14px;font-weight:800}
.more-quick-access__chevron{color:var(--muted);font-size:16px;font-weight:700}
.bottom-nav-btn[data-bottom-nav="more"]{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
"""

MORE_QUICK_SECTION_FN = r'''
function renderMoreQuickAccessSection(){
  const compass='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 4.8v2.2M12 17v2.2M4.8 12h2.2M17 12h2.2"/><path d="M12 8.2 14.6 12 12 15.8 9.4 12Z"/></svg>';
  const bookmark='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.4L6 20V5.5a1 1 0 0 1 1-1Z"/></svg>';
  const bell='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a4 4 0 0 0-4 4v1.2c0 .9-.3 1.78-.86 2.48L5.8 13.5A1.5 1.5 0 0 0 7 16h10a1.5 1.5 0 0 0 1.2-2.5l-1.34-1.82A4 4 0 0 1 16 9.2V8a4 4 0 0 0-4-4"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>';
  return `<section class="more-quick-access" aria-label="Schnellzugriff"><div class="more-quick-access__head"><h3>Schnellzugriff</h3><p>Orientierung, Merkliste und Erinnerungen.</p></div><div class="more-quick-access__list"><button type="button" class="more-quick-access__btn" data-more-quick="orient">${compass}<span class="more-quick-access__label">Orientierung</span><span class="more-quick-access__chevron" aria-hidden="true">›</span></button><button type="button" class="more-quick-access__btn" data-more-quick="saved">${bookmark}<span class="more-quick-access__label">Merkliste</span><span class="more-quick-access__chevron" aria-hidden="true">›</span></button><button type="button" class="more-quick-access__btn" data-more-quick="remind">${bell}<span class="more-quick-access__label">Erinnerungen</span><span class="more-quick-access__chevron" aria-hidden="true">›</span></button></div></section>`;
}
'''


def replace_float_and_quick_html(html: str) -> str:
    html = re.sub(
        r'<div class="float-actions[\s\S]*?</div>\s*(?=(?:<div id="quickAccessLayer")|<script src="/assets/slide-post-parser)',
        "",
        html,
        count=1,
    )
    if 'id="quickAccessLayer"' in html:
        html = re.sub(
            r'<div id="quickAccessLayer"[\s\S]*?</div>\s*(?=<script src="/assets/slide-post-parser)',
            QUICK_ACCESS_HTML + "\n",
            html,
            count=1,
        )
    else:
        html = html.replace(
            '<script src="/assets/slide-post-parser.js',
            QUICK_ACCESS_HTML + '\n<script src="/assets/slide-post-parser.js',
            1,
        )
    return html


def ensure_mehr_aria(html: str) -> str:
    html = re.sub(
        r'(data-bottom-nav="more")([^>]*)(aria-label=")[^"]*(")',
        r'\1\2\3Mehr öffnen. Gedrückt halten für Schnellzugriff.\4',
        html,
        count=1,
    )
    if "Gedrückt halten für Schnellzugriff" not in html:
        html = html.replace(
            'data-bottom-nav="more"',
            'data-bottom-nav="more" aria-label="Mehr öffnen. Gedrückt halten für Schnellzugriff."',
            1,
        )
    return html


def inject_css(html: str) -> str:
    marker = "/* MEHR_LONGPRESS_QUICKACCESS_CSS */"
    if marker in html:
        html = re.sub(
            r"/\* MEHR_LONGPRESS_QUICKACCESS_CSS \*/[\s\S]*?/\* MEHR_LONGPRESS_QUICKACCESS_CSS_END \*/",
            marker + "\n" + EXTRA_CSS + "\n/* MEHR_LONGPRESS_QUICKACCESS_CSS_END */",
            html,
            count=1,
        )
    else:
        html = html.replace(
            "</style>",
            marker + "\n" + EXTRA_CSS + "\n/* MEHR_LONGPRESS_QUICKACCESS_CSS_END */\n</style>",
            1,
        )
    return html


def patch_bind_bottom_nav(html: str) -> str:
    html = html.replace(
        'if(tab==="more"&&isTestAppPath()){bindMoreQuickAccessTrigger(btn);return}',
        'if(tab==="more"){bindMoreQuickAccessTrigger(btn);return}',
    )
    return html


def patch_close_transient(html: str) -> str:
    marker = "function closeTransientNavOverlays(){"
    idx = html.find(marker)
    if idx < 0:
        return html
    window = html[idx : idx + 500]
    if "closeQuickAccessMenu" in window:
        return html
    return html.replace(
        marker,
        "function closeTransientNavOverlays(){try{if(typeof closeQuickAccessMenu==='function')closeQuickAccessMenu()}catch(e){}",
        1,
    )


def patch_render_more(html: str) -> str:
    if "function renderMoreQuickAccessSection" not in html:
        html = html.replace(
            "function renderMore(){",
            MORE_QUICK_SECTION_FN + "\nfunction renderMore(){",
            1,
        )
    html = re.sub(
        r"function renderMore\(\)\{const groups=\[\"Lernen & Wissen\".*?\}\}",
        'function renderMore(){const groups=["Lernen & Wissen","Alltag & Gebet","Werkzeuge & Assistenten","Persönlich","App"];const items=featureCatalog();return `${setPageHeader("Mehr","Funktionen geordnet nach Lernen, Alltag, Werkzeugen und Einstellungen","Mehr")}${renderMoreQuickAccessSection()}${renderZakatMoreFocus()}<section class="feature-section"><div class="feature-head"><div><h3>Funktion suchen</h3><span>Tippe z. B. Qibla, Rechner oder Qurʾān.</span></div></div><input id="moreFeatureSearch" class="more-search" type="search" placeholder="Funktion suchen…" autocomplete="off"></section>${groups.map(group=>renderMoreGroup(group,items.filter(item=>item.group===group))).join("")}`}',
        html,
        count=1,
        flags=re.S,
    )
    return html


def patch_quick_access_js(html: str) -> str:
    # Enable for all paths
    html = html.replace(
        "function initQuickAccessMenu(){\n  if(window.__darQuickAccessMenuBound||!isTestAppPath())return;",
        "function initQuickAccessMenu(){\n  if(window.__darQuickAccessMenuBound)return;",
    )
    html = html.replace(
        "if(window.__darQuickAccessMenuBound||!isTestAppPath())return;",
        "if(window.__darQuickAccessMenuBound)return;",
    )
    html = html.replace(
        'if(!isTestAppPath())return;\n    ev.preventDefault();\n    longPressTriggered=true;\n    openQuickAccessMenu(btn);',
        "ev.preventDefault();\n    longPressTriggered=true;\n    openQuickAccessMenu(btn);",
    )
    # Disable float touchbar init
    html = re.sub(
        r"function initFloatTouchbar\(\)\{[\s\S]*?\n\}\nwindow\.addEventListener\(\"DOMContentLoaded\"",
        'function initFloatTouchbar(){/* removed: floating Schnellzugriff */}\n'
        "function showFloatTipsOnce(){/* removed */}\n"
        "function collapseFloatTouchbar(){}\n"
        "function expandFloatTouchbar(){}\n"
        "function markFloatTouchbarActivated(){}\n"
        'window.addEventListener("DOMContentLoaded"',
        html,
        count=1,
    )
    # Update indicator IDs
    html = html.replace('const savedBadge=$("savedFloatBadge");', 'const savedBadge=$("quickAccessSavedBadge");')
    html = html.replace('const pushStatus=$("pushFloatStatus");', 'const pushStatus=$("quickAccessRemindStatus");')
    # Update menu handlers
    html = html.replace(
        'const qiblaFloatBtn=$("qiblaFloat");\n  if(qiblaFloatBtn)qiblaFloatBtn.onclick=()=>{closeQuickAccessMenu();openQiblaFromFloat()};\n  const savedFloatBtn=$("savedFloat");\n  if(savedFloatBtn)savedFloatBtn.onclick=()=>{closeQuickAccessMenu();navigate("saved")};\n  const pushFloatBtn=$("pushFloat");\n  if(pushFloatBtn)pushFloatBtn.onclick=()=>{closeQuickAccessMenu();navigate("more");setTimeout(()=>{try{document.getElementById("prayerPushAccordionToggle")?.click()}catch(e){}},180)};',
        'const orientBtn=$("quickAccessOrientBtn");\n  if(orientBtn)orientBtn.onclick=()=>{closeQuickAccessMenu();openQiblaFromFloat()};\n  const savedBtn=$("quickAccessSavedBtn");\n  if(savedBtn)savedBtn.onclick=()=>{closeQuickAccessMenu();navigate("saved")};\n  const remindBtn=$("quickAccessRemindBtn");\n  if(remindBtn)remindBtn.onclick=()=>{closeQuickAccessMenu();navigate("more");setTimeout(()=>{try{document.getElementById("prayerPushAccordionToggle")?.click()}catch(e){}},180)};',
    )
    # Remove DOMContentLoaded float button wiring
    html = re.sub(
        r"\n\s*const qiblaFloatBtn=\$\(\"qiblaFloat\"\);\n\s*if\(qiblaFloatBtn\)qiblaFloatBtn\.onclick=.*?\n\s*const savedFloatBtn=\$\(\"savedFloat\"\);\n\s*if\(savedFloatBtn\)savedFloatBtn\.onclick=.*?;\n\s*setTimeout\(showFloatTipsOnce,900\);",
        "\n    setTimeout(()=>{try{const moreBtn=document.querySelector('[data-bottom-nav=\"more\"]');if(moreBtn)showQuickAccessHint(moreBtn)}catch(e){}},900);",
        html,
        count=1,
        flags=re.S,
    )
    # Neutralize legacy pushFloat OneSignal click IIFE target if float gone
    html = html.replace(
        '(function(){const pushBtn=document.getElementById("pushFloat");if(!pushBtn)return;',
        '(function(){const pushBtn=document.getElementById("pushFloatLegacyRemoved");if(!pushBtn)return;',
    )
    # Bind more-page quick access buttons after render
    if "bindMoreQuickAccessPageButtons" not in html:
        binder = (
            "function bindMoreQuickAccessPageButtons(){"
            "document.querySelectorAll('[data-more-quick]').forEach(btn=>{"
            "if(btn.dataset.bound==='1')return;btn.dataset.bound='1';"
            "btn.addEventListener('click',()=>{"
            "const kind=btn.getAttribute('data-more-quick');"
            "if(kind==='orient'){openQiblaFromFloat();return}"
            "if(kind==='saved'){navigate('saved');return}"
            "if(kind==='remind'){navigate('more');setTimeout(()=>{try{document.getElementById('prayerPushAccordionToggle')?.click()}catch(e){}},180)}"
            "})"
            "})}"
        )
        html = html.replace(
            "function initQuickAccessMenu(){",
            binder + "\nfunction initQuickAccessMenu(){",
            1,
        )
    # Call binder near filterMoreFeatures usage / after render path - inject into updateQuickAccessIndicators end
    if "bindMoreQuickAccessPageButtons()" not in html:
        html = html.replace(
            "function updateQuickAccessIndicators(){",
            "function updateQuickAccessIndicators(){try{bindMoreQuickAccessPageButtons()}catch(e){}",
            1,
        )
    # Ensure bottom gap uses 10px
    html = html.replace(
        "const bottomGap=12+keyboardLift;",
        "const bottomGap=10+keyboardLift;",
    )
    return html


def ensure_quick_access_js_block(html: str) -> str:
    """If test/index lacks quick-access JS, inject a compact block before DOMContentLoaded."""
    if "function initQuickAccessMenu" in html:
        return html
    block = r'''
const QUICK_ACCESS_HINT_KEY="quickAccessLongPressHintSeen";
const LONG_PRESS_DELAY=500;
const MOVE_TOLERANCE=8;
let isQuickMenuOpen=false;
let longPressTriggered=false;
let quickMenuAnchorRect=null;
function closeQuickAccessMenu({restoreFocus=false,hideHint=false}={}){
  const layer=$("quickAccessLayer");
  const menu=$("quickAccessMenu");
  const hint=$("quickAccessHint");
  const moreBtn=document.querySelector('[data-bottom-nav="more"]');
  if(hideHint&&hint){hint.hidden=true;hint.classList.remove("is-visible")}
  if(layer)layer.classList.remove("is-open");
  if(menu)menu.hidden=true;
  isQuickMenuOpen=false;quickMenuAnchorRect=null;
  if(layer&&menu&&hint&&menu.hidden&&hint.hidden)layer.hidden=true;
  if(restoreFocus&&moreBtn&&typeof moreBtn.focus==="function"){try{moreBtn.focus({preventScroll:true})}catch(e){try{moreBtn.focus()}catch(_){}}}
}
function positionQuickAccessUi(anchorRect){
  const menu=$("quickAccessMenu");const hint=$("quickAccessHint");if(!anchorRect)return;
  const menuRight=Math.max(12,window.innerWidth-anchorRect.right);
  const keyboardLift=window.visualViewport?Math.max(0,window.innerHeight-window.visualViewport.height):0;
  const bottomGap=10+keyboardLift;
  if(menu){menu.style.right=`${menuRight}px`;menu.style.bottom=`calc(var(--bottom-navigation-height,64px) + env(safe-area-inset-bottom) + ${bottomGap}px)`}
  if(hint){hint.style.right=`${menuRight}px`;hint.style.bottom=`calc(var(--bottom-navigation-height,64px) + env(safe-area-inset-bottom) + ${bottomGap+4}px)`}
}
function openQuickAccessMenu(anchorBtn){
  const layer=$("quickAccessLayer");const menu=$("quickAccessMenu");const hint=$("quickAccessHint");
  if(!layer||!menu||!anchorBtn)return;
  quickMenuAnchorRect=anchorBtn.getBoundingClientRect();positionQuickAccessUi(quickMenuAnchorRect);
  layer.hidden=false;menu.hidden=false;layer.classList.add("is-open");isQuickMenuOpen=true;
  if(hint){hint.hidden=true;hint.classList.remove("is-visible")}
  try{localStorage.setItem(QUICK_ACCESS_HINT_KEY,"1")}catch(e){}
  try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
  updateQuickAccessIndicators();
}
function showQuickAccessHint(anchorBtn){
  const layer=$("quickAccessLayer");const hint=$("quickAccessHint");const menu=$("quickAccessMenu");
  if(!layer||!hint||!anchorBtn||isQuickMenuOpen)return;
  let seen=false;try{seen=localStorage.getItem(QUICK_ACCESS_HINT_KEY)==="1"}catch(e){}
  if(seen)return;
  quickMenuAnchorRect=anchorBtn.getBoundingClientRect();positionQuickAccessUi(quickMenuAnchorRect);
  layer.hidden=false;if(menu)menu.hidden=true;hint.hidden=false;
  requestAnimationFrame(()=>hint.classList.add("is-visible"));
  clearTimeout(window.__quickAccessHintTimer);
  window.__quickAccessHintTimer=setTimeout(()=>{hint.classList.remove("is-visible");setTimeout(()=>{hint.hidden=true;if(!isQuickMenuOpen)layer.hidden=true},160)},5000);
  try{localStorage.setItem(QUICK_ACCESS_HINT_KEY,"1")}catch(e){}
}
function updateQuickAccessIndicators(){
  try{bindMoreQuickAccessPageButtons()}catch(e){}
  const savedBadge=$("quickAccessSavedBadge");const pushStatus=$("quickAccessRemindStatus");
  if(savedBadge){const count=(typeof savedIds==="function"?savedIds():[]).length;savedBadge.hidden=!count;if(count)savedBadge.textContent=String(Math.min(count,99))}
  if(pushStatus){const active=Boolean(window.OneSignal?.User?.PushSubscription?.optedIn)&&!!String(window.OneSignal?.User?.PushSubscription?.id||"").trim();pushStatus.hidden=!active}
}
function bindMoreQuickAccessTrigger(btn){
  if(!btn||btn.dataset.quickMenuBound==="1")return;btn.dataset.quickMenuBound="1";
  let longPressTimer=null;let suppressClickUntil=0;let pointerStartX=0;let pointerStartY=0;
  const clearPress=(resetTrigger=false)=>{if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null}btn.classList.remove("is-pressed");if(resetTrigger)longPressTriggered=false};
  btn.addEventListener("pointerdown",ev=>{if(ev.pointerType==="mouse"&&ev.button!==0)return;longPressTriggered=false;pointerStartX=ev.clientX;pointerStartY=ev.clientY;btn.classList.add("is-pressed");longPressTimer=setTimeout(()=>{longPressTriggered=true;suppressClickUntil=Date.now()+700;openQuickAccessMenu(btn)},LONG_PRESS_DELAY)});
  btn.addEventListener("pointermove",ev=>{if(!longPressTimer)return;if(Math.abs(ev.clientX-pointerStartX)>MOVE_TOLERANCE||Math.abs(ev.clientY-pointerStartY)>MOVE_TOLERANCE)clearPress(true)},{passive:true});
  ["pointerup","pointercancel","pointerleave"].forEach(type=>btn.addEventListener(type,()=>clearPress(false),{passive:true}));
  btn.addEventListener("click",ev=>{clearPress(false);if(longPressTriggered||Date.now()<suppressClickUntil){ev.preventDefault();ev.stopPropagation();longPressTriggered=false;return}try{btn.blur&&btn.blur()}catch(e){}navigateBottomNavTab("more")});
  btn.addEventListener("contextmenu",ev=>{ev.preventDefault();longPressTriggered=true;openQuickAccessMenu(btn)});
  btn.addEventListener("keydown",ev=>{if((ev.shiftKey&&ev.key==="F10")||ev.key==="ContextMenu"){ev.preventDefault();openQuickAccessMenu(btn)}});
}
function bindMoreQuickAccessPageButtons(){
  document.querySelectorAll("[data-more-quick]").forEach(btn=>{
    if(btn.dataset.bound==="1")return;btn.dataset.bound="1";
    btn.addEventListener("click",()=>{
      const kind=btn.getAttribute("data-more-quick");
      if(kind==="orient"){openQiblaFromFloat();return}
      if(kind==="saved"){navigate("saved");return}
      if(kind==="remind"){navigate("more");setTimeout(()=>{try{document.getElementById("prayerPushAccordionToggle")?.click()}catch(e){}},180)}
    });
  });
}
function initQuickAccessMenu(){
  if(window.__darQuickAccessMenuBound)return;window.__darQuickAccessMenuBound=true;
  const layer=$("quickAccessLayer");const scrim=$("quickAccessScrim");const menu=$("quickAccessMenu");
  const moreBtn=document.querySelector('[data-bottom-nav="more"]');
  if(!layer||!scrim||!menu||!moreBtn)return;
  scrim.addEventListener("click",()=>closeQuickAccessMenu({restoreFocus:true}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isQuickMenuOpen){e.preventDefault();closeQuickAccessMenu({restoreFocus:true})}});
  document.addEventListener("scroll",()=>{if(isQuickMenuOpen)closeQuickAccessMenu()},{passive:true});
  document.addEventListener("focusin",e=>{if(e.target?.closest?.("input,textarea,[contenteditable='true']"))closeQuickAccessMenu()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)closeQuickAccessMenu()});
  window.addEventListener("hashchange",()=>closeQuickAccessMenu(),{passive:true});
  window.addEventListener("pagehide",()=>closeQuickAccessMenu(),{passive:true});
  window.addEventListener("resize",()=>{if(isQuickMenuOpen&&moreBtn)positionQuickAccessUi(moreBtn.getBoundingClientRect())},{passive:true});
  window.visualViewport?.addEventListener?.("resize",()=>{if(isQuickMenuOpen&&moreBtn)positionQuickAccessUi(moreBtn.getBoundingClientRect());else closeQuickAccessMenu()},{passive:true});
  const orientBtn=$("quickAccessOrientBtn");if(orientBtn)orientBtn.onclick=()=>{closeQuickAccessMenu();openQiblaFromFloat()};
  const savedBtn=$("quickAccessSavedBtn");if(savedBtn)savedBtn.onclick=()=>{closeQuickAccessMenu();navigate("saved")};
  const remindBtn=$("quickAccessRemindBtn");if(remindBtn)remindBtn.onclick=()=>{closeQuickAccessMenu();navigate("more");setTimeout(()=>{try{document.getElementById("prayerPushAccordionToggle")?.click()}catch(e){}},180)};
  updateQuickAccessIndicators();setTimeout(()=>showQuickAccessHint(moreBtn),900);
}
function initFloatTouchbar(){}
function showFloatTipsOnce(){}
function collapseFloatTouchbar(){}
function expandFloatTouchbar(){}
function markFloatTouchbarActivated(){}
'''
    html = html.replace(
        'window.addEventListener("DOMContentLoaded"',
        block + '\nwindow.addEventListener("DOMContentLoaded"',
        1,
    )
    # Ensure initQuickAccessMenu is called
    if "initQuickAccessMenu()" not in html:
        html = html.replace(
            "initFloatTouchbar();",
            "initQuickAccessMenu();\n    initFloatTouchbar();",
            1,
        )
    return html


def process(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = replace_float_and_quick_html(html)
    html = ensure_mehr_aria(html)
    html = inject_css(html)
    html = patch_bind_bottom_nav(html)
    html = patch_close_transient(html)
    html = patch_render_more(html)
    html = ensure_quick_access_js_block(html)
    html = patch_quick_access_js(html)
    path.write_text(html, encoding="utf-8")
    print(f"updated {path}")


def main() -> None:
    for rel in ("index.html", "test/index.html"):
        process(ROOT / rel)


if __name__ == "__main__":
    main()
