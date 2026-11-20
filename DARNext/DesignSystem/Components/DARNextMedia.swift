import SwiftUI
import UIKit
import ImageIO

enum DARNextMedia {
    private static let rawBase = "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/assets"

    static let quran = url("dar-3d-icons/quran.png")
    static let dua = url("dar-3d-icons/dua.png")
    static let qibla = url("dar-3d-icons/qibla.png")
    static let posts = url("dar-3d-icons/posts.png")
    static let hadith = url("dar-3d-icons/hadith.png")
    static let frauen = url("dar-3d-icons/frauen.png")
    static let library = url("dar-3d-icons/library.png")
    static let prayer = url("dar-3d-icons/prayer.png")
    static let calendar = url("dar-3d-icons/calendar.png")
    static let audio = url("dar-3d-icons/audio.png")
    static let heroMobile = url("home-v1194/hero-mobile-adobe.jpg")
    static let heroWide = url("home-v1194/hero-wide-adobe.jpg")
    static let study = url("home-v1194/study-runway.jpg")

    private static func url(_ path: String) -> URL {
        URL(string: "\(rawBase)/\(path)") ?? URL(fileURLWithPath: "/")
    }
}

private struct DARNextDecodedRemoteImage: @unchecked Sendable {
    let image: UIImage?
}

private actor DARNextRemoteImageCache {
    private struct PendingLoad {
        let id: UUID
        let task: Task<DARNextDecodedRemoteImage, Never>
    }

    static let shared = DARNextRemoteImageCache()

    private let images = NSCache<NSString, UIImage>()
    private var pending: [NSString: PendingLoad] = [:]

    private init() {
        images.totalCostLimit = 48 * 1024 * 1024
    }

    func image(for url: URL, maxPixelSize: Int) async -> UIImage? {
        let boundedPixelSize = max(1, maxPixelSize)
        let key = "\(url.absoluteString)#\(boundedPixelSize)" as NSString
        if let cached = images.object(forKey: key) {
            return cached
        }

        let request: PendingLoad
        if let existing = pending[key] {
            request = existing
        } else {
            let id = UUID()
            let task = Task.detached(priority: .utility) {
                await Self.load(url: url, maxPixelSize: boundedPixelSize)
            }
            request = PendingLoad(id: id, task: task)
            pending[key] = request
        }

        let result = await request.task.value
        if pending[key]?.id == request.id {
            if let image = result.image {
                let cost = image.cgImage.map { $0.bytesPerRow * $0.height }
                    ?? Int(image.size.width * image.size.height * 4)
                images.setObject(image, forKey: key, cost: cost)
            }
            pending[key] = nil
        }
        return result.image
    }

    private nonisolated static func load(url: URL, maxPixelSize: Int) async -> DARNextDecodedRemoteImage {
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let response = response as? HTTPURLResponse,
                  (200..<300).contains(response.statusCode),
                  let source = CGImageSourceCreateWithData(data as CFData, nil),
                  let thumbnail = CGImageSourceCreateThumbnailAtIndex(
                    source,
                    0,
                    [
                        kCGImageSourceCreateThumbnailFromImageAlways: true,
                        kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
                        kCGImageSourceCreateThumbnailWithTransform: true,
                        kCGImageSourceShouldCacheImmediately: true
                    ] as CFDictionary
                  ) else {
                return DARNextDecodedRemoteImage(image: nil)
            }

            let decoded = UIImage(cgImage: thumbnail)
            return DARNextDecodedRemoteImage(image: decoded.preparingForDisplay() ?? decoded)
        } catch {
            return DARNextDecodedRemoteImage(image: nil)
        }
    }
}

struct DARNextRemoteImage: View {
    let url: URL
    let fallbackSystemImage: String
    let contentMode: ContentMode
    let maxPixelSize: Int

    @State private var loadedImage: UIImage?
    @State private var didFail = false

    init(
        url: URL,
        fallbackSystemImage: String = "photo",
        contentMode: ContentMode = .fit,
        maxPixelSize: Int = 512
    ) {
        self.url = url
        self.fallbackSystemImage = fallbackSystemImage
        self.contentMode = contentMode
        self.maxPixelSize = maxPixelSize
    }

    var body: some View {
        Group {
            if let loadedImage {
                Image(uiImage: loadedImage)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else if didFail {
                Image(systemName: fallbackSystemImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .padding(12)
            } else {
                ProgressView()
            }
        }
        .task(id: url) {
            loadedImage = nil
            didFail = false
            let image = await DARNextRemoteImageCache.shared.image(
                for: url,
                maxPixelSize: maxPixelSize
            )
            guard !Task.isCancelled else { return }
            loadedImage = image
            didFail = image == nil
        }
        .accessibilityHidden(true)
    }
}
