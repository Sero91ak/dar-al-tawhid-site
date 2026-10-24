import SwiftUI

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

struct DARNextRemoteImage: View {
    let url: URL
    let fallbackSystemImage: String
    let contentMode: ContentMode

    init(
        url: URL,
        fallbackSystemImage: String = "photo",
        contentMode: ContentMode = .fit
    ) {
        self.url = url
        self.fallbackSystemImage = fallbackSystemImage
        self.contentMode = contentMode
    }

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            case .failure:
                Image(systemName: fallbackSystemImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .padding(12)
            case .empty:
                ProgressView()
            @unknown default:
                Image(systemName: fallbackSystemImage)
            }
        }
        .accessibilityHidden(true)
    }
}
