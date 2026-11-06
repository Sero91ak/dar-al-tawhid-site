import SwiftUI
import UIKit

/// Native Apple UITabBar for the existing Kids 3D navigation artwork.
/// Staged for deliberate host integration; not a replacement for the
/// currently active web bottom navigation until routing is proven.
final class KidsNativeAppleTabBar: UIView, UITabBarDelegate {
    var onSelect: ((String) -> Void)?
    private struct Section {
        let id: String
        let title: String
        let asset: String
        let fallback: String
    }

    private let sections: [Section] = [
        .init(id: "today", title: "Heute", asset: "KidsNative3DToday", fallback: "sun.max.fill"),
        .init(id: "stories", title: "Hören", asset: "KidsNative3DListening", fallback: "headphones"),
        .init(id: "academy", title: "Lernen", asset: "KidsNative3DLearning", fallback: "books.vertical.fill"),
        .init(id: "dua", title: "Duʿāʾ", asset: "KidsNative3DDua", fallback: "heart.fill"),
        .init(id: "parents", title: "Eltern", asset: "KidsNative3DParents", fallback: "person.2.fill")
    ]

    private let bar = UITabBar()
    private var currentID = "today"

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        bar.translatesAutoresizingMaskIntoConstraints = false
        bar.delegate = self
        bar.itemPositioning = .fill
        bar.items = sections.enumerated().map { index, section in
            let image = Self.originalArtwork(name: section.asset, fallback: section.fallback)
            let item = UITabBarItem(title: section.title, image: image, tag: index)
            item.selectedImage = image
            item.accessibilityLabel = section.title
            return item
        }
        addSubview(bar)
        NSLayoutConstraint.activate([
            bar.leadingAnchor.constraint(equalTo: leadingAnchor),
            bar.trailingAnchor.constraint(equalTo: trailingAnchor),
            bar.topAnchor.constraint(equalTo: topAnchor),
            bar.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
        configurePalette(isGirl: false)
        select(id: "today")
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private static func originalArtwork(name: String, fallback: String) -> UIImage? {
        guard let image = UIImage(named: name) else {
            return UIImage(systemName: fallback)
        }
        // The original colored Kids artwork is rasterized into a tab-sized
        // square while maintaining aspect ratio and alpha channel.
        let size = CGSize(width: 28, height: 28)
        let format = UIGraphicsImageRendererFormat()
        format.scale = UIScreen.main.scale
        format.opaque = false
        let rendered = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            let scale = min(size.width / max(image.size.width, 1),
                            size.height / max(image.size.height, 1))
            let width = image.size.width * scale
            let height = image.size.height * scale
            image.draw(in: CGRect(x: (size.width - width) / 2,
                                  y: (size.height - height) / 2,
                                  width: width, height: height))
        }
        return rendered.withRenderingMode(.alwaysOriginal)
    }

    func configurePalette(isGirl: Bool) {
        // Retain Apple's native material and selection behavior, while using
        // the existing Kids gender-theme accent for labels only.
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = isGirl
            ? UIColor(red: 0.20, green: 0.14, blue: 0.24, alpha: 1)
            : UIColor(red: 0.02, green: 0.10, blue: 0.16, alpha: 1)
        bar.tintColor = isGirl
            ? UIColor(red: 1, green: 0.80, blue: 0.90, alpha: 1)
            : UIColor(red: 1, green: 0.89, blue: 0.57, alpha: 1)
        bar.unselectedItemTintColor = UIColor(white: 0.84, alpha: 1)
        bar.standardAppearance = appearance
        if #available(iOS 15.0, *) { bar.scrollEdgeAppearance = appearance }
    }

    func select(id: String) {
        guard let index = sections.firstIndex(where: { $0.id == id }) else { return }
        currentID = id
        bar.selectedItem = bar.items?[index]
    }

    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard sections.indices.contains(item.tag) else { return }
        let id = sections[item.tag].id
        currentID = id
        onSelect?(id)
    }
}

/// Use only inside a host owning ONE existing KidsWebAppView; UI selection
/// must be synchronized with the actual active Kids SPA route.
struct KidsNativeAppleTabBarView: UIViewRepresentable {
    let selectedID: String
    let isGirl: Bool
    let onSelect: (String) -> Void

    func makeUIView(context: Context) -> KidsNativeAppleTabBar {
        let bar = KidsNativeAppleTabBar()
        bar.onSelect = onSelect
        bar.configurePalette(isGirl: isGirl)
        bar.select(id: selectedID)
        return bar
    }

    func updateUIView(_ uiView: KidsNativeAppleTabBar, context: Context) {
        uiView.onSelect = onSelect
        uiView.configurePalette(isGirl: isGirl)
        uiView.select(id: selectedID)
    }
}
