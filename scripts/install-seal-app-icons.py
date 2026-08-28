#!/usr/bin/env python3
"""Install Serhat's three seal icons as the only app icons. Delete the rest."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image

SRC = {
    "seal-creme": Path("/Users/muwahhid91/.cursor/projects/Users-muwahhid91-Documents-dar-al-tawhid-site/assets/88034dca-dfd3-423e-8470-ccfa1f6f2e6d.png"),
    "seal-navy": Path("/Users/muwahhid91/.cursor/projects/Users-muwahhid91-Documents-dar-al-tawhid-site/assets/74613b08-8747-49ea-893b-60146d658aee.png"),
    "seal-schwarz": Path("/Users/muwahhid91/.cursor/projects/Users-muwahhid91-Documents-dar-al-tawhid-site/assets/b1dbaa67-f609-4df3-bda5-46f5cff3ebf2.png"),
}
WEB = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/app-icons")
IOS_ASSETS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Assets.xcassets")
IOS_PNGS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/AppIcons")
MASTERS = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/brand/seals")
WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_EXPORTS = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
    ".png": 60,
}
MAP = {
    "seal-creme": "AppIcon",
    "seal-navy": "AppIconSealNavy",
    "seal-schwarz": "AppIconSealSchwarz",
}
CONTENTS = """{
  "images": [
    {"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    {"appearances": [{"appearance": "luminosity", "value": "dark"}], "filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}
  ],
  "info": {"author": "xcode", "version": 1}
}
"""
KEEP_SETS = {"AppIcon.appiconset", "AppIconSealNavy.appiconset", "AppIconSealSchwarz.appiconset"}


def to_master(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    if img.size != (1024, 1024):
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    return img


def save_family(master: Image.Image, web_id: str, ios_name: str) -> None:
    dest = WEB / web_id
    dest.mkdir(parents=True, exist_ok=True)
    for side in WEB_SIZES:
        master.resize((side, side), Image.Resampling.LANCZOS).save(dest / f"icon-{side}.png", "PNG", optimize=True)
    catalog = IOS_ASSETS / f"{ios_name}.appiconset"
    if catalog.exists():
        shutil.rmtree(catalog)
    catalog.mkdir(parents=True)
    master.save(catalog / "AppIcon-1024.png", "PNG", optimize=True)
    (catalog / "Contents.json").write_text(CONTENTS, encoding="utf-8")
    IOS_PNGS.mkdir(parents=True, exist_ok=True)
    for suffix, side in IOS_EXPORTS.items():
        master.resize((side, side), Image.Resampling.LANCZOS).save(IOS_PNGS / f"{ios_name}{suffix}", "PNG", optimize=True)


def wipe_old() -> None:
    for child in IOS_ASSETS.iterdir():
        if child.suffix == ".appiconset" and child.name not in KEEP_SETS:
            shutil.rmtree(child)
    if WEB.exists():
        for child in WEB.iterdir():
            if child.is_dir() and child.name not in SRC:
                shutil.rmtree(child)
    if IOS_PNGS.exists():
        for child in IOS_PNGS.iterdir():
            if child.suffix.lower() == ".png" and not any(
                child.name.startswith(name) for name in MAP.values()
            ):
                child.unlink()


def rewrite_plist() -> None:
    path = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Info.plist")
    text = path.read_text(encoding="utf-8")
    block = r"""	<key>CFBundleIcons</key>
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
			<key>AppIconSealNavy</key>
			<dict>
				<key>CFBundleIconName</key>
				<string>AppIconSealNavy</string>
				<key>CFBundleIconFiles</key>
				<array>
					<string>AppIconSealNavy</string>
					<string>AppIconSealNavy-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>
			<key>AppIconSealSchwarz</key>
			<dict>
				<key>CFBundleIconName</key>
				<string>AppIconSealSchwarz</string>
				<key>CFBundleIconFiles</key>
				<array>
					<string>AppIconSealSchwarz</string>
					<string>AppIconSealSchwarz-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>
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
			<key>AppIconSealNavy</key>
			<dict>
				<key>CFBundleIconName</key>
				<string>AppIconSealNavy</string>
				<key>CFBundleIconFiles</key>
				<array>
					<string>AppIconSealNavy</string>
					<string>AppIconSealNavy-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>
			<key>AppIconSealSchwarz</key>
			<dict>
				<key>CFBundleIconName</key>
				<string>AppIconSealSchwarz</string>
				<key>CFBundleIconFiles</key>
				<array>
					<string>AppIconSealSchwarz</string>
					<string>AppIconSealSchwarz-83.5</string>
				</array>
				<key>UIPrerenderedIcon</key>
				<false/>
			</dict>
		</dict>
	</dict>
"""
    text = re.sub(
        r"\t<key>CFBundleIcons</key>\n\t<dict>[\s\S]*?</dict>\n\t</dict>\n\t<key>CFBundleIcons~ipad</key>\n\t<dict>[\s\S]*?</dict>\n\t</dict>\n",
        block,
        text,
        count=1,
    )
    path.write_text(text, encoding="utf-8")


def rewrite_pbxproj() -> None:
    path = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj")
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"^.*ICN0[0-9].*\n", "", text, flags=re.M)
    files = []
    for name in ("AppIconSealNavy", "AppIconSealSchwarz"):
        for suffix in ("@2x.png", "@3x.png", "@2x~ipad.png", "-83.5@2x~ipad.png"):
            files.append(f"{name}{suffix}")
    build, refs, children, resources = [], [], [], []
    for i, fname in enumerate(files, start=1):
        fid = f"ICN1{i:02d}00000000000000000001"
        bid = f"ICN1{i:02d}00000000000000000002"
        build.append(f"\t\t{bid} /* {fname} in Resources */ = {{isa = PBXBuildFile; fileRef = {fid} /* {fname} */; }};\n")
        refs.append(f"\t\t{fid} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = image.png; path = \"{fname}\"; sourceTree = \"<group>\"; }};\n")
        children.append(f"\t\t\t\t{fid} /* {fname} */,\n")
        resources.append(f"\t\t\t\t{bid} /* {fname} in Resources */,\n")
    text = text.replace(
        "\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */ = {isa = PBXBuildFile; fileRef = A90000000000000000000011 /* DarAppIcons.swift */; };\n",
        "\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */ = {isa = PBXBuildFile; fileRef = A90000000000000000000011 /* DarAppIcons.swift */; };\n" + "".join(build),
    )
    text = text.replace(
        "\t\tA90000000000000000000011 /* DarAppIcons.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DarAppIcons.swift; sourceTree = \"<group>\"; };\n",
        "\t\tA90000000000000000000011 /* DarAppIcons.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = DarAppIcons.swift; sourceTree = \"<group>\"; };\n" + "".join(refs),
    )
    group = "\t\tICN000000000000000000100 /* AppIcons */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n" + "".join(children) + "\t\t\t);\n\t\t\tpath = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t};\n"
    text = re.sub(
        r"\t\tICN000000000000000000100 /\* AppIcons \*/ = \{[\s\S]*?path = AppIcons;\n\t\t\tsourceTree = \"<group>\";\n\t\t\};\n",
        group,
        text,
        count=1,
    )
    # Insert resource build files after the opening of DarAlTawhid resources if old ICN resources were stripped.
    # Find first remaining marker after Begin PBXResourcesBuildPhase
    if "ICN101" not in text.split("PBXResourcesBuildPhase")[1][:4000]:
        text = text.replace(
            "\t\t\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */,\n",
            "\t\t\t\tA90000000000000000000001 /* DarAppIcons.swift in Sources */,\n",
            1,
        )
        # resources phase uses different IDs; inject after Assets
        text = re.sub(
            r"(A10000000000000000000016 /\* Assets.xcassets in Resources \*/,\n)",
            r"\1" + "".join(resources),
            text,
            count=1,
        )
    text = text.replace(
        'ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = "AppIconMinimalCreme AppIconGraphitSilber AppIconSchwarzGold AppIconSteinOptik AppIconTiefesGruen AppIconBordeaux AppIconElfenbein AppIconMitternachtBlau AppIconModernNameFocusDark AppIconModernNameFocusLight AppIconModernElegantNeutral AppIconModernPremiumGoldDark";',
        'ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = "AppIconSealNavy AppIconSealSchwarz";',
    )
    text = text.replace("CURRENT_PROJECT_VERSION = 32;", "CURRENT_PROJECT_VERSION = 33;")
    path.write_text(text, encoding="utf-8")


def main() -> None:
    MASTERS.mkdir(parents=True, exist_ok=True)
    for web_id, src in SRC.items():
        master = to_master(src)
        master.save(MASTERS / f"{web_id}-1024.png", "PNG", optimize=True)
        save_family(master, web_id, MAP[web_id])
    wipe_old()
    rewrite_plist()
    rewrite_pbxproj()
    print("seal icons installed")


if __name__ == "__main__":
    main()
