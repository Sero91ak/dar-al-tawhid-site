import UIKit
import SwiftUI

/// Native Apple UITabBar containing the *original* visitor web app 3D icon art.
/// These are regular imagesets, deliberately not AppIcon.appiconset.
final class DarNativeTabBar: UIView, UITabBarDelegate, UIContextMenuInteractionDelegate {
    var onSelect: ((String) -> Void)?
    /// The native host resolves each quick-action ID to the existing SPA route.
    var onQuickAction: ((String) -> Void)?

    private struct Item {
        let id: String
        let title: String
        let asset: String
        let fallbackSymbol: String
    }

    private let sections: [Item] = [
        Item(id: "home", title: "Start", asset: "DarNav3DHome", fallbackSymbol: "house.fill"),
        Item(id: "quiz", title: "Quiz", asset: "DarNav3DQuiz", fallbackSymbol: "brain"),
        Item(id: "recent", title: "Beiträge", asset: "DarNav3DPosts", fallbackSymbol: "text.book.closed"),
        Item(id: "quran", title: "Koran", asset: "DarNav3DQuran", fallbackSymbol: "book.fill"),
        Item(id: "more", title: "Mehr", asset: "DarNav3DMore", fallbackSymbol: "line.3.horizontal")
    ]

    private let nativeTabBar = UITabBar()
    private var lastSelectedId = "home"

    override init(frame: CGRect) {
        super.init(frame: frame)

        backgroundColor = .clear
        nativeTabBar.translatesAutoresizingMaskIntoConstraints = false
        nativeTabBar.delegate = self
        nativeTabBar.addInteraction(UIContextMenuInteraction(delegate: self))
        nativeTabBar.itemPositioning = .fill
        nativeTabBar.itemSpacing = 0
        addSubview(nativeTabBar)
        NSLayoutConstraint.activate([
            nativeTabBar.topAnchor.constraint(equalTo: topAnchor),
            nativeTabBar.leadingAnchor.constraint(equalTo: leadingAnchor),
            nativeTabBar.trailingAnchor.constraint(equalTo: trailingAnchor),
            nativeTabBar.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])

        nativeTabBar.items = sections.enumerated().map { index, section in
            let image = Self.originalColorTabImage(
                asset: section.asset,
                fallbackSymbol: section.fallbackSymbol
            )
            let item = UITabBarItem(title: section.title, image: image, tag: index)
            item.selectedImage = image
            item.accessibilityLabel = section.title
            return item
        }
        select(id: "home")
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /// Apple normally converts UITabBarItem art to a tinted template;
    /// .alwaysOriginal retains the existing gold/green 3D shading.
    /// Rendering to 28pt prevents oversized 3D PNGs from being clipped.
    private static func originalColorTabImage(asset: String, fallbackSymbol: String) -> UIImage? {
        guard let source = UIImage(named: asset) else {
            return UIImage(systemName: fallbackSymbol)
        }
        let target = CGSize(width: 28, height: 28)
        let format = UIGraphicsImageRendererFormat()
        format.opaque = false
        format.scale = UIScreen.main.scale
        let rendered = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            let scale = min(target.width / max(1, source.size.width),
                            target.height / max(1, source.size.height))
            let actual = CGSize(width: source.size.width * scale,
                                height: source.size.height * scale)
            let rect = CGRect(x: (target.width - actual.width) / 2,
                              y: (target.height - actual.height) / 2,
                              width: actual.width, height: actual.height)
            source.draw(in: rect)
        }
        return rendered.withRenderingMode(.alwaysOriginal)
    }

    /// Keep selection synchronized with navigation state; no callback for
    /// programmatic changes (prevents recursive route updates).
    func select(id: String) {
        guard let index = sections.firstIndex(where: { $0.id == id }) else { return }
        lastSelectedId = id
        nativeTabBar.selectedItem = nativeTabBar.items?[index]
    }

    func applySurface(_ color: UIColor) {
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = color
        nativeTabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) {
            nativeTabBar.scrollEdgeAppearance = appearance
        }
        select(id: lastSelectedId)
    }


    // Native long-press shortcuts. The host routes each action to the existing
    // web SPA; no independent content, authentication or storage is created.
    // Expand only after matching the exact visitor web-app shortcut contract.
    private func shortcuts(for id: String) -> [(title: String, symbol: String, destination: String)] {
        switch id {
        case "home":
            return [
                ("Gebetszeiten", "clock", "prayer"),
                ("Qibla", "location.north.line", "qibla"),
                ("Suche", "magnifyingglass", "search")
            ]
        case "quiz":
            return [
                ("Quiz öffnen", "brain", "quiz"),
                ("Duʿāʾ öffnen", "hands.sparkles", "duas")
            ]
        case "recent":
            return [
                ("Beiträge öffnen", "text.book.closed", "recent"),
                ("Suche", "magnifyingglass", "search")
            ]
        case "quran":
            return [
                ("Koran öffnen", "book", "quran"),
                ("Duʿāʾ öffnen", "hands.sparkles", "duas")
            ]
        case "more":
            return [
                ("Gebetszeiten", "clock", "prayer"),
                ("Qibla", "location.north.line", "qibla"),
                ("Suche", "magnifyingglass", "search")
            ]
        default:
            return []
        }
    }

    func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configurationForMenuAtLocation location: CGPoint
    ) -> UIContextMenuConfiguration? {
        let width = nativeTabBar.bounds.width
        guard width > 0, location.x >= 0, location.x < width else { return nil }
        let sectionWidth = width / CGFloat(sections.count)
        let index = min(Int(location.x / sectionWidth), sections.count - 1)
        let tab = sections[index]
        return UIContextMenuConfiguration(
            identifier: tab.id as NSString,
            previewProvider: nil
        ) { [weak self] _ in
            guard let self else { return UIMenu(children: []) }
            let actions: [UIAction] = self.shortcuts(for: tab.id).map { shortcut in
                UIAction(
                    title: shortcut.title,
                    image: UIImage(systemName: shortcut.symbol)
                ) { [weak self] _ in
                    self?.onQuickAction?(shortcut.destination)
                }
            }
            return UIMenu(title: tab.title, children: actions)
        }
    }

    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard sections.indices.contains(item.tag) else { return }
        let selected = sections[item.tag].id
        lastSelectedId = selected
        onSelect?(selected)
    }
}


/// SwiftUI bridge for the two iOS targets. Each target supplies its own
/// existing web router; do not create separate WebViews for each tab.
struct DarNativeTabBarRepresentable: UIViewRepresentable {
    var selectedId: String
    var onSelect: (String) -> Void
    var onQuickAction: (String) -> Void

    func makeUIView(context: Context) -> DarNativeTabBar {
        let view = DarNativeTabBar()
        view.onSelect = onSelect
        view.onQuickAction = onQuickAction
        view.select(id: selectedId)
        return view
    }

    func updateUIView(_ uiView: DarNativeTabBar, context: Context) {
        uiView.onSelect = onSelect
        uiView.onQuickAction = onQuickAction
        uiView.select(id: selectedId)
    }
}
