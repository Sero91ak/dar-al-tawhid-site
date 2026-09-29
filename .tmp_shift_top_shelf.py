from pathlib import Path

from PIL import Image

asset_directory = Path("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset")
background_color = (240, 218, 183)

for image_path in asset_directory.glob("*.png"):
    image = Image.open(image_path).convert("RGB")
    shift_x = image.width // 22
    shifted = Image.new("RGB", image.size, background_color)
    shifted.paste(image, (shift_x, 0))
    shifted.save(image_path, format="PNG", optimize=True)
