#!/usr/bin/env python3
"""Wire final DAR app icons into test web + iOS (test branch only)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ALTS = [
    "AppIconMinimalCreme",
    "AppIconGraphitSilber",
    "AppIconSchwarzGold",
    "AppIconSteinOptik",
    "AppIconTiefesGruen",
    "AppIconBordeaux",
    "AppIconElfenbein",
    "AppIconMitternachtBlau",
]
SUFFIXES = [
    "@2x.png",
    "@3x.png",
    "@2x~ipad.png",
    "-83.5@2x~ipad.png",
]


def icon_entry_xml(name: str) -> str:
    return f"""			<key>{name}</key>
			<dict>
				<key>CFBundleIconFiles</key>
				<array>
					<string>{name}</string>
					<string>{name}-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>"""


def icons_dict() -> str:
    alts = "\n".join(icon_entry_xml(n) for n in ALTS)
    return f"""	<key>CFBundleIcons</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon</string>
			</array>
		</dict>
		<key>CFBundleAlternateIcons</key>
		<dict>
{alts}
		</dict>
	</dict>
	<key>CFBundleIcons~ipad</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon</string>
			</array>
		</dict>
		<key>CFBundleAlternateIcons</key>
		<dict>
{alts}
		</dict>
	</dict>"""


def patch_plist():
    path = ROOT / "ios/DarAlTawhid/DarAlTawhid/Info.plist"
    text = path.read_text(encoding="utf-8")
    start = text.find("	<key>CFBundleIcons</key>")
    end = text.find("	<key>ITSAppUsesNonExemptEncryption</key>")
    if start < 0 or end < 0:
        raise SystemExit("Info.plist icon block not found")
    path.write_text(text[:start] + icons_dict() + "\n" + text[end:], encoding="utf-8")


def patch_pbxproj():
    path = ROOT / "ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj"
    text = path.read_text(encoding="utf-8")
    files = [f"{name}{suf}" for name in ALTS for suf in SUFFIXES]
    build, refs, children, res = [], [], [], []
    for i, fname in enumerate(files, start=1):
        ref = f"ICN{i:03d}00000000000000000001"
        bld = f"ICN{i:03d}00000000000000000002"
        build.append(f"\t\t{bld} /* {fname} in Resources */ = {{isa = PBXBuildFile; fileRef = {ref} /* {fname} */; }};\n")
        refs.append(f"\t\t{ref} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = image.png; path = \"{fname}\"; sourceTree = \"<group>\"; }};\n")
        children.append(f"\t\t\t\t{ref} /* {fname} */,\n")
        res.append(f"\t\t\t\t{bld} /* {fname} in Resources */,\n")

    text = re.sub(
        r"\t\tICN000000000000000000201 /\* AppIconEisgold@2x.png in Resources \*/ = \{isa = PBXBuildFile;[\s\S]*?ICN000000000000000000212 /\* AppIconPergament-83.5@2x~ipad.png in Resources \*/ = \{isa = PBXBuildFile; fileRef = ICN000000000000000000012 /\* AppIconPergament-83.5@2x~ipad.png \*/; \};\n",
        "".join(build),
        text,
        count=1,
    )
    text = re.sub(
        r"\t\tICN000000000000000000001 /\* AppIconEisgold@2x.png \*/ = \{isa = PBXFileReference;[\s\S]*?ICN000000000000000000012 /\* AppIconPergament-83.5@2x~ipad.png \*/ = \{isa = PBXFileReference; lastKnownFileType = image.png; path = \"AppIconPergament-83.5@2x~ipad.png\"; sourceTree = \"<group>\"; \};\n",
        "".join(refs),
        text,
        count=1,
    )
    text = re.sub(
        r"\t\tICN000000000000000000100 /\* AppIcons \*/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n[\s\S]*?\t\t\t\);\n\t\t\tpath = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t\};",
        "\t\tICN000000000000000000100 /* AppIcons */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n"
        + "".join(children)
        + "\t\t\t);\n\t\t\tpath = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t};",
        text,
        count=1,
    )
    text = re.sub(
        r"\t\t\t\tICN000000000000000000201 /\* AppIconEisgold@2x.png in Resources \*/,[\s\S]*?ICN000000000000000000212 /\* AppIconPergament-83.5@2x~ipad.png in Resources \*/,\n",
        "".join(res),
        text,
        count=1,
    )
    text = text.replace(
        "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;\n\t\t\t\tASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = NO;",
        "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;\n\t\t\t\tASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = \""
        + " ".join(ALTS)
        + "\";\n\t\t\t\tASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = YES;",
    )
    text = text.replace("CURRENT_PROJECT_VERSION = 25;", "CURRENT_PROJECT_VERSION = 26;")
    path.write_text(text, encoding="utf-8")


def patch_swift():
    (ROOT / "ios/DarAlTawhid/DarAlTawhid/DarAppIcons.swift").write_text(
        """import UIKit

enum DarAppIcons {
    static let primaryId = "creme-navy"

    static let names: [String: String?] = [
        "creme-navy": nil,
        "appicon": nil,
        "default": nil,
        "primary": nil,
        "klassisch": nil,
        "minimal-creme": "AppIconMinimalCreme",
        "appiconminimalcreme": "AppIconMinimalCreme",
        "graphit-silber": "AppIconGraphitSilber",
        "appicongraphitsilber": "AppIconGraphitSilber",
        "schwarz-gold": "AppIconSchwarzGold",
        "appiconschwarzgold": "AppIconSchwarzGold",
        "stein-optik": "AppIconSteinOptik",
        "appiconsteinoptik": "AppIconSteinOptik",
        "tiefes-gruen": "AppIconTiefesGruen",
        "tiefes-grün": "AppIconTiefesGruen",
        "appicontiefesgruen": "AppIconTiefesGruen",
        "bordeaux": "AppIconBordeaux",
        "appiconbordeaux": "AppIconBordeaux",
        "elfenbein": "AppIconElfenbein",
        "appiconelfenbein": "AppIconElfenbein",
        "mitternacht-blau": "AppIconMitternachtBlau",
        "appiconmitternachtblau": "AppIconMitternachtBlau",
    ]

    static func set(_ name: String) {
        let key = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let mapped: String?
        if names.keys.contains(key) {
            mapped = names[key] ?? nil
        } else if key.isEmpty {
            mapped = nil
        } else if ALTS.contains(name) {
            mapped = name
        } else {
            mapped = names[key] ?? (key.hasPrefix("appicon") ? name : nil)
        }
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else { return }
            if UIApplication.shared.alternateIconName == mapped { return }
            UIApplication.shared.setAlternateIconName(mapped)
        }
    }

    private static let ALTS = [
        "AppIconMinimalCreme",
        "AppIconGraphitSilber",
        "AppIconSchwarzGold",
        "AppIconSteinOptik",
        "AppIconTiefesGruen",
        "AppIconBordeaux",
        "AppIconElfenbein",
        "AppIconMitternachtBlau",
    ]
}
""",
        encoding="utf-8",
    )

    web = ROOT / "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift"
    text = web.read_text(encoding="utf-8")
    text = text.replace(
        "private static let environment: AppEnvironment = .live",
        "private static let environment: AppEnvironment = .staging",
    )
    # Remove the old injected 4-icon picker; the test web app owns the UI.
    text = re.sub(
        r"\s*setTimeout\(function\(\)\{\s*try\{\s*var panel=document\.querySelector\(\"\.theme-switch-panel \.theme-switch-row\"\);[\s\S]*?\},900\);",
        "",
        text,
        count=1,
    )
    web.write_text(text, encoding="utf-8")


JS = r'''
const DAR_APP_ICON_KEY="darAppIconV1";
const DAR_APP_ICONS=[
  {id:"creme-navy",label:"Creme & Navy",ios:""},
  {id:"minimal-creme",label:"Minimal Creme",ios:"AppIconMinimalCreme"},
  {id:"graphit-silber",label:"Graphit Silber",ios:"AppIconGraphitSilber"},
  {id:"schwarz-gold",label:"Schwarz & Gold",ios:"AppIconSchwarzGold"},
  {id:"stein-optik",label:"Stein Optik",ios:"AppIconSteinOptik"},
  {id:"tiefes-gruen",label:"Tiefes Grün",ios:"AppIconTiefesGruen"},
  {id:"bordeaux",label:"Bordeaux",ios:"AppIconBordeaux"},
  {id:"elfenbein",label:"Elfenbein",ios:"AppIconElfenbein"},
  {id:"mitternacht-blau",label:"Mitternacht Blau",ios:"AppIconMitternachtBlau"}
];
function getDarAppIcon(){try{const v=localStorage.getItem(DAR_APP_ICON_KEY);if(DAR_APP_ICONS.some(x=>x.id===v))return v}catch(e){}return"creme-navy"}
function applyDarAppIcon(id,{save=true}={}){const icon=DAR_APP_ICONS.find(x=>x.id===id)||DAR_APP_ICONS[0];if(save){try{localStorage.setItem(DAR_APP_ICON_KEY,icon.id)}catch(e){}}document.querySelectorAll("[data-app-icon-select]").forEach(btn=>{const on=btn.getAttribute("data-app-icon-select")===icon.id;btn.classList.toggle("is-active",on);btn.setAttribute("aria-pressed",on?"true":"false")});try{if(window.webkit&&webkit.messageHandlers&&webkit.messageHandlers.darAppIcon)webkit.messageHandlers.darAppIcon.postMessage({id:icon.id,name:icon.ios||""})}catch(e){}return icon.id}
function renderAppIconPanel(){const cur=getDarAppIcon();return `<section class="app-icon-panel premium-surface" id="darAppIconPanel"><div class="theme-switch-head"><h3>App-Icon</h3><p class="theme-switch-note">Standard ist Creme &amp; Navy. Die Auswahl wird lokal als darAppIconV1 gespeichert.</p></div><div class="app-icon-grid">${DAR_APP_ICONS.map(icon=>`<button type="button" class="app-icon-choice${cur===icon.id?" is-active":""}" data-app-icon-select="${icon.id}" aria-pressed="${cur===icon.id?"true":"false"}"><img src="/test/app-icons/${icon.id}/icon-64.png" srcset="/test/app-icons/${icon.id}/icon-64.png 1x, /test/app-icons/${icon.id}/icon-192.png 2x" width="64" height="64" alt=""><span>${esc(icon.label)}</span></button>`).join("")}</div></section>`}
function bindAppIconPicker(){document.querySelectorAll("[data-app-icon-select]").forEach(btn=>{btn.onclick=()=>applyDarAppIcon(btn.getAttribute("data-app-icon-select"))});applyDarAppIcon(getDarAppIcon(),{save:false})}
'''

CSS = """
.app-icon-panel{padding:14px 15px;margin:0 0 13px;border-radius:22px}
.app-icon-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
.app-icon-choice{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 6px 9px;border-radius:16px;border:1px solid rgba(239,215,142,.18);background:transparent;color:inherit;font:inherit;cursor:pointer}
.app-icon-choice img{width:64px;height:64px;border-radius:14px;display:block}
.app-icon-choice span{font-size:11px;line-height:1.25;text-align:center}
.app-icon-choice.is-active{border-color:rgba(212,175,55,.85);box-shadow:0 0 0 1px rgba(212,175,55,.35)}
@media (max-width:420px){.app-icon-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
"""


def patch_test_html():
    path = ROOT / "test/index.html"
    text = path.read_text(encoding="utf-8")
    if "darAppIconV1" not in text:
        text = text.replace("</style>", CSS + "</style>", 1)
        text = text.replace(
            "function renderThemeSwitchPanel(){",
            JS + "function renderThemeSwitchPanel(){",
            1,
        )
        text = text.replace(
            "${renderThemeSwitchPanel()}${renderFontSettingsPanel()}",
            "${renderThemeSwitchPanel()}${renderAppIconPanel()}${renderFontSettingsPanel()}",
            1,
        )
        text = text.replace("bindThemeControls();", "bindThemeControls(); bindAppIconPicker();", 1)
    path.write_text(text, encoding="utf-8")


def patch_test_version():
    path = ROOT / "test/version.json"
    path.write_text(
        """{
  "buildId": "app-shell-v680-test-app-icons",
  "note": "Test only · App-Icon picker (Creme & Navy + 8 alternates). No production deploy.",
  "updatedAt": "2026-08-28T08:45:00.000Z",
  "appBuildId": "app-shell-v680-test-app-icons"
}
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    patch_plist()
    patch_pbxproj()
    patch_swift()
    patch_test_html()
    patch_test_version()
    print("patched")
