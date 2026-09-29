import AppKit

let files: [(String, CGFloat)] = [
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset/TopShelfLogo.png", 72),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image Wide.imageset/TopShelfLogo@2x.png", 144),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image 1.imageset/TopShelfLogo.png", 72),
    ("DarAlTawhidTV/Assets.xcassets/App Icon & Top Shelf Image.brandassets/Top Shelf Image 1.imageset/TopShelfLogo@2x.png", 144)
]

for (path, offset) in files {
    guard let source = NSImage(contentsOfFile: path),
          let sourceRepresentation = source.representations.first else {
        fatalError("Could not load \(path)")
    }

    let width = sourceRepresentation.pixelsWide
    let height = sourceRepresentation.pixelsHigh
    guard let canvas = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else {
        fatalError("Could not create canvas for \(path)")
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: canvas)
    source.draw(
        in: NSRect(x: offset, y: 0, width: CGFloat(width), height: CGFloat(height)),
        from: NSRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)),
        operation: .copy,
        fraction: 1
    )
    source.draw(
        in: NSRect(x: 0, y: 0, width: offset + 1, height: CGFloat(height)),
        from: NSRect(x: 0, y: 0, width: 1, height: CGFloat(height)),
        operation: .copy,
        fraction: 1
    )
    NSGraphicsContext.restoreGraphicsState()

    guard let png = canvas.representation(using: .png, properties: [:]) else {
        fatalError("Could not encode \(path)")
    }
    try png.write(to: URL(fileURLWithPath: path))
}
