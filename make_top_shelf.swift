import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import Foundation

guard CommandLine.arguments.count == 4,
      let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    exit(1)
}

let width = Int(CommandLine.arguments[2])!
let height = Int(CommandLine.arguments[3])!
let colorSpace = CGColorSpaceCreateDeviceRGB()
let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                        bytesPerRow: width * 4, space: colorSpace,
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
context.setFillColor(red: 0.96, green: 0.91, blue: 0.80, alpha: 1)
context.fill(CGRect(x: 0, y: 0, width: width, height: height))

let scale = min(Double(width) * 0.66 / Double(image.width), Double(height) * 0.66 / Double(image.height))
let drawWidth = Double(image.width) * scale
let drawHeight = Double(image.height) * scale
let drawRect = CGRect(x: (Double(width) - drawWidth) / 2,
                      y: (Double(height) - drawHeight) / 2,
                      width: drawWidth, height: drawHeight)
context.interpolationQuality = .high
context.draw(image, in: drawRect)

let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: CommandLine.arguments[1] + ".safe.png") as CFURL,
                                                   UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
CGImageDestinationFinalize(destination)
