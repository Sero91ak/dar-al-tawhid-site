#!/usr/bin/env python3
"""Install the 11 typographic masters as the only app icons."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image

A = Path("/Users/muwahhid91/.cursor/projects/Users-muwahhid91-Documents-dar-al-tawhid-site/assets")
WEB = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/app-icons")
IOS_ASSETS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Assets.xcassets")
IOS_PNGS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/AppIcons")
PBX = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj")
PLIST = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Info.plist")
SWIFT = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/DarAppIcons.swift")
WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_EXPORTS = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
    ".png": 60,
}
CONTENTS = """{
  "images": [
    {"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    {"appearances": [{"appearance": "luminosity", "value": "dark"}], "filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}
  ],
  "info": {"author": "xcode", "version": 1}
}
"""

# primary first
ICONS = [
    ("type-creme-ar", "AppIcon", "Creme", A / "e5126ea4-6403-4fa2-a177-c01d43d3dca5.png", True),
    ("type-creme", "AppIconTypeCreme", "Creme Name", A / "0d13e842-bd47-4898-8588-ce0eddecefc4.png", False),
    ("type-schwarz-ar", "AppIconTypeSchwarzAr", "Schwarz", A / "83da8b8a-2632-4c23-ae94-5fc4e8484438.png", False),
    ("type-schwarz", "AppIconTypeSchwarz", "Schwarz Name", A / "08a2de05-c9ca-41d2-806a-6f8a19055227.png", False),
    ("type-navy-ar", "AppIconTypeNavyAr", "Navy", A / "a8b0d38e-a7d8-4cf3-8273-658ce656ab8a.png", False),
    ("type-navy", "AppIconTypeNavy", "Navy Name", A / "fb743442-1919-48f4-bf96-496ab349df4d.png", False),
    ("type-bordeaux-ar", "AppIconTypeBordeauxAr", "Bordeaux", A / "3bd8c4b2-c682-4368-b27e-49d1713b07ad.png", False),
    ("type-bordeaux", "AppIconTypeBordeaux", "Bordeaux Name", A / "30656c22-9cbb-4d01-95b9-108a5ff01b13.png", False),
    ("type-gruen-ar", "AppIconTypeGruenAr", "Grün", A / "91d1e7ae-0328-4d7a-a405-c56fd0a0d7fc.png", False),
    ("type-gruen", "AppIconTypeGruen", "Grün Name", A / "fc9816f9-cc65-49c7-8ee2-0023ff16a1bc.png", False),
    ("type-schwarz-ar2", "AppIconTypeSchwarzAr2", "Schwarz Fein", A / "ee6d2833-bc88-43a7-a7a5-45c635bd317c.png", False),
]


def master(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    if img.size != (1024, 1024):
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    return img


def save_family(img: Image.Image, web_id: str, ios_name: str) -> None:
    dest = WEB / web_id
    dest.mkdir(parents=True, exist_ok=True)
    for side in WEB_SIZES:
        img.resize((side, side), Image.Resampling.LANCZOS).save(dest / f"icon-{side}.png", "PNG", optimize=True)
    catalog = IOS_ASSETS / f"{ios_name}.appiconset"
    if catalog.exists():
        shutil.rmtree(catalog)
    catalog.mkdir(parents=True)
    img.save(catalog / "AppIcon-1024.png", "PNG", optimize=True)
    (catalog / "Contents.json").write_text(CONTENTS, encoding="utf-8")
    IOS_PNGS.mkdir(parents=True, exist_ok=True)
    for suffix, side in IOS_EXPORTS.items():
        img.resize((side, side), Image.Resampling.LANCZOS).save(IOS_PNGS / f"{ios_name}{suffix}", "PNG", optimize=True)


def wipe() -> None:
    keep_web = {row[0] for row in ICONS}
    keep_sets = {f"{row[1]}.appiconset" for row in ICONS}
    if WEB.exists():
        for child in WEB.iterdir():
            if child.is_dir() and child.name not in keep_web:
                shutil.rmtree(child)
    for child in IOS_ASSETS.iterdir():
        if child.suffix == ".appiconset" and child.name not in keep_sets:
            shutil.rmtree(child)
    keep_ios = tuple(row[1] for row in ICONS)
    for f in list(IOS_PNGS.glob("*.png")):
        if not f.name.startswith(keep_ios):
            f.unlink()


def alt_plist_entry(name: str) -> str:
    return f"""			<key>{name}</key>
			<dict>
				<key>CFBundleIconName</key>
				<string>{name}</string>
				<key>CFBundleIconFiles</key>
				<array>
					<string>{name}</string>
					<string>{name}-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>
"""


def rewrite_plist() -> None:
    alts = "".join(alt_plist_entry(row[1]) for row in ICONS if not row[4])
    icons_block = f"""	<key>CFBundleIcons</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
			<key>CFBundleIconFiles</key>
 mar			<array>
				<string>AppIcon</string>
			</array>
		</dict>
		<key>CFBundleAlternateIcons</key>
		<dict>
{alts}		</dict>
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
{alts}		</dict>
	</dict>
"""
    icons_block = icons_block.replace(" mar\t\t\t", "\t\t\t")
    text = PLIST.read_text(encoding="utf-8")
    text = re.sub(
        r"\t<key>CFBundleIcons</key>\n\t<dict>[\s\S]*?</dict>\n\t</dict>\n\t<key>CFBundleIcons~ipad</key>\n\t<dict>[\s\S]*?</dict>\n\t</dict>\n",
        icons_block,
        text,
        count=1,
    )
    PLIST.write_text(text, encoding="utf-8")


def rewrite_swift() -> None:
    alts = [row[1] for row in ICONS if not row[4]]
    cases = []
    for web_id, ios, _label, _src, primary in ICONS:
        keys = [web_id, ios.lower()]
        if primary:
            keys += ["creme-navy", "seal-creme", "appicon", "default", "primary"]
        joined = ", ".join(f'"{k}"' for k in keys)
        ret = "nil" if primary else f'"{ios}"'
        cases.append(f"        case {joined}:\n            return {ret}")
    body = "\n".join(cases)
    names = ",\n        ".join(f'"{n}"' for n in alts)
    SWIFT.write_text(
        f"""import UIKit

enum DarAppIcons {{
    static func set(_ name: String) {{
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let mapped = resolve(trimmed)
        DispatchQueue.main.async {{
            guard UIApplication.shared.supportsAlternateIcons else {{ return }}
            if UIApplication.shared.alternateIconName == mapped {{ return }}
            UIApplication.shared.setAlternateIconName(mapped)
        }}
    }}

    private static func resolve(_ name: String) -> String? {{
        if name.isEmpty {{ return nil }}
        if alternateNames.contains(name) {{ return name }}
        switch name.lowercased() {{
{body}
        default:
            return nil
        }}
    }}

    private static let alternateNames: Set<String> = [
        {names}
    ]
}}
""",
        encoding="utf-8",
    )


def rewrite_html() -> None:
    items = []
    for web_id, ios, label, _src, primary in ICONS:
        ios_val = "" if primary else ios
        items.append(f'  {{id:"{web_id}",label:"{label}",ios:"{ios_val}"}}')
    block = (
        "const DAR_APP_ICONS=[\n"
        + ",\n".join(items)
        + "\n];\n"
        + 'function getDarAppIcon(){try{const v=localStorage.getItem(DAR_APP_ICON_KEY);if(DAR_APP_ICONS.some(x=>x.id===v))return v}catch(e){}return"type-creme-ar"}\n'
    )
    note = "Standard ist Creme. Nach links oder rechts wischen."
    for path in (
        Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/index.html"),
        Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/test/index.html"),
    ):
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"const DAR_APP_ICONS=\[[\s\S]*?\];\nfunction getDarAppIcon\(\)\{[^}]+\}", block.rstrip(), text, count=1)
        text = re.sub(r"Standard ist [^<]+Nach links oder rechts wischen\.", note, text, count=1)
        path.write_text(text, encoding="utf-8")


def rewrite_pbx() -> None:
    text = PBX.read_text(encoding="utf-8")
    text = re.sub(r"^.*ICN1[0-9].*\n", "", text, flags=re.M)
    alts = [row[1] for row in ICONS if not row[4]]
    files = []
    for name in alts:
        for suffix in ("@2x.png", "@3x.png", "@2x~ipad.png", "-83.5@2x~ipad.png"):
            files.append(f"{name}{suffix}")
    build, refs, children, resources = [], [], [], []
    for i, fname in enumerate(files, start=1):
        fid = f"ICN2{i:02d}00000000000000000001"
        bid = f"ICN2{i:02d}00000000000000000002"
        build.append(f"\t\t{bid} /* {fname} in Resources */ = {{isa = PBXBuildFile; fileRef = {fid} /* {fname} */; }};\n")
        refs.append(f"\t\t{fid} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = image.png; path = \"{fname}\"; sourceTree = \"<group>\"; }};\n")
        children.append(f"\t\t\t\t{fid} /* {fname} */,\n")
        resources.append(f"\t\t\t\t{bid} /* {fname} in Resources */,\n")
    text = text.replace(
        "\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */ = {isa = PBXBuildFile; fileRef = A90000000000000000000011 /* DarAppIcons.swift */; };\n",
        "\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */ = {isa = PBXBuildFile; fileRef = A90000000000000000000011 /* DarAppIcons.swift */; };\n"
        + "".join(build),
    )
    text = text.replace(
        "\t\tA90000000000000000000011 /* DarAppIcons.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DarAppIcons.swift; sourceTree = \"<group>\"; };\n",
        "\t\tA90000000000000000000011 /* DarAppIcons.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DarAppIcons.swift; sourceTree = \"<group>\"; };\n"
        + "".join(refs),
    )
    group = (
        "\t\tICN000000000000000000100 /* AppIcons */ = {\n"
        "\t\t\tisa = PBXGroup;\n"
        "\t\t\tchildren = (\n"
        + "".join(children)
        + "\t\t\t);\n\t\t\tpath = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t};\n"
    )
    text = re.sub(
        r"\t\tICN000000000000000000100 /\* AppIcons \*/ = \{[\s\S]*?path = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t\};\n",
        group,
        text,
        count=1,
    )
    text = re.sub(
        r"\t\t\t\tA10000000000000000000003 /\* Assets.xcassets in Resources \*/,\n(?:\t\t\t\tICN[^\n]+\n)*",
        "\t\t\t\tA10000000000000000000003 /* Assets.xcassets in Resources */,\n" + "".join(resources),
        text,
        count=1,
    )
    names = " ".join(alts)
    text = re.sub(
        r'ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = "[^"]*";',
        f'ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = "{names}";',
        text,
    )
    text = text.replace("CURRENT_PROJECT_VERSION = 33;", "CURRENT_PROJECT_VERSION = 34;")
    PBX.write_text(text, encoding="utf-8")


def main() -> None:
    for web_id, ios, _label, src, _primary in ICONS:
        save_family(master(src), web_id, ios)
    wipe()
    rewrite_plist()
    rewrite_swift()
    rewrite_html()
    rewrite_pbx()
    print("type icons installed", len(ICONS))


if __name__ == "__main__":
    main()
