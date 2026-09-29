from pathlib import Path

from PIL import Image

asset_directory = Path("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset")
background_color = (240, 218, 183)
scale = 0.95

for image_path in asset_directory.glob("*.png"):
    image = Image.open(image_path).convert("RGB")
    scaled_size = (round(image.width * scale), round(image.height * scale))
    scaled = image.resize(scaled_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", image.size, background_color)
    offset = ((image.width - scaled.width) // 2, (image.height - scaled.height) // 2)
    canvas.paste(scaled, offset)
    canvas.save(image_path, format="PNG", optimize=True)
