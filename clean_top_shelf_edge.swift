import AppKit

let files: [(String, Int)] = [
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset/TopShelfLogo.png", 72),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset/TopShelfLogo@2x.png", 144),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image 1.imageset/TopShelfLogo.png", 72),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image 1.imageset/TopShelfLogo@2x.png", 144)
]

for (path, inset) in files {
    guard let image = NSImage(contentsOfFile: path),
          let representation = image.representations.first,
          let canvas = NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: representation.pixelsWide,
            pixelsHigh: representation.pixelsHigh,
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .deviceRGB,
            bytesPerRow: 0,
            bitsPerPixel: 0
          ) else { fatalError("Could not load \(path)") }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: canvas)
    image.draw(in: NSRect(x: 0, y: 0, width: representation.pixelsWide, height: representation.pixelsHigh))
    NSColor(calibratedRed: 0.985, green: 0.955, blue: 0.895, alpha: 1).setFill()
    NSRect(x: 0, y: 0, width: inset, height: representation.pixelsHigh).fill()
    NSGraphicsContext.restoreGraphicsState()

    guard let png = canvas.representation(using: .png, properties: [:]) else { fatalError("Could not encode \(path)") }
    try png.write(to: URL(fileURLWithPath: path))
}
