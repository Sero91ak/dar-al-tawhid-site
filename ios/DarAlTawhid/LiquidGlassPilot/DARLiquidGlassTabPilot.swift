// DĀR AL TAWḤĪD – iOS Liquid Glass pilot
// ISOLATED EXPERIMENT: not part of any production Xcode target.
// Requires UIKit + WebKit; iOS 26 renders the native system glass appearance.
// Do not activate until all quick-menu and WKWebView regression tests pass.
import UIKit
import WebKit

@MainActor
final class DARLiquidGlassTabPilot: UITabBarController, UITabBarControllerDelegate {

    enum Destination: Int, CaseIterable {
        case home, discovery, posts, quran, more

        var label: String {
            switch self {
            case .home: return "Start"
            case .discovery: return "Entdecken"
            case .posts: return "Beiträge"
            case .quran: return "Qurʾān"
            case .more: return "Mehr"
            }
        }

        func iconName(woman: Bool) -> String {
            switch self {
            case .home: return "home"
            case .discovery: return woman ? "frauen" : "topics"
            case .posts: return "posts"
            case .quran: return "quran"
            case .more: return "more"
            }
        }

        func webRoute(woman: Bool) -> String {
            switch self {
            case .home: return "home"
            case .discovery: return woman ? "frauen" : "topics"
            case .posts: return "feed" // Existing web route; the user-facing title is Beiträge
            case .quran: return "quran"
            case .more: return "more"
            }
        }
    }

    // Pass a UIHostingController wrapping the EXISTING WebAppView.
    // It must NOT create five WKWebViews, reload the Qurʾān, or replace native bridges.
    private let contentHost: UIViewController
    private var pages: [UIViewController] = []
    private var lastSelectedIndex = 0
    private var isWoman = false

    init(existingWebAppHost: UIViewController) {
        contentHost = existingWebAppHost
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("Use init(existingWebAppHost:)")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        delegate = self

        if #available(iOS 18.0, *) {
            mode = .tabSidebar // iPhone bottom; iPad tab bar or sidebar.
        }
        pages = Destination.allCases.map { tab in
            let page = UIViewController()
            page.view.backgroundColor = .clear
            page.tabBarItem = UITabBarItem(title: tab.label, image: nil, tag: tab.rawValue)
            return page
        }
        setViewControllers(pages, animated: false)
        selectedIndex = Destination.home.rawValue
        attachSingleWebApp(to: pages[0])
        refreshOriginal3DIcons()
        refreshGenderFromExistingWebProfile()
    }

    // Reparent the SAME existing host when changing tabs. The WKWebView,
    // its WKWebsiteDataStore, audio and native WebKit message handlers survive.
    private func attachSingleWebApp(to page: UIViewController) {
        if contentHost.parent === page { return }
        contentHost.willMove(toParent: nil)
        contentHost.view.removeFromSuperview()
        contentHost.removeFromParent()

        page.addChild(contentHost)
        let view = contentHost.view!
        view.translatesAutoresizingMaskIntoConstraints = false
        page.view.addSubview(view)
        NSLayoutConstraint.activate([
            view.leadingAnchor.constraint(equalTo: page.view.leadingAnchor),
            view.trailingAnchor.constraint(equalTo: page.view.trailingAnchor),
            view.topAnchor.constraint(equalTo: page.view.topAnchor),
            view.bottomAnchor.constraint(equalTo: page.view.bottomAnchor)
        ])
        contentHost.didMove(toParent: page)
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        guard let index = pages.firstIndex(of: viewController),
              let tab = Destination(rawValue: index) else { return }
        if index != lastSelectedIndex {
            attachSingleWebApp(to: viewController)
            lastSelectedIndex = index
        }
        // Repeated taps are forwarded as well: existing web navigation decides
        // whether to open Qurʾān/Mehr quick actions instead of reimplementing them.
        forwardOriginalWebNavigation(tab)
    }

    private func findWebView(in root: UIView) -> WKWebView? {
        if let web = root as? WKWebView { return web }
        for child in root.subviews {
            if let web = findWebView(in: child) { return web }
        }
        return nil
    }

    private func forwardOriginalWebNavigation(_ tab: Destination) {
        guard let web = findWebView(in: contentHost.view) else { return }
        // All routes are static enum strings, never interpolated user input.
        let route = tab.webRoute(woman: isWoman)
        let script = """
        (function(){
          var route="\(route)";
          var nav=document.getElementById("bottomNav");
          var btn=nav&&nav.querySelector('[data-bottom-nav="'+route+'"]');
          if(btn){btn.click();return "existing-button";}
          if(typeof window.navigate==="function"){window.navigate(route,"");return "existing-router";}
          location.hash="#"+route;return "hash-fallback";
        })()
        """
        web.evaluateJavaScript(script, completionHandler: nil)
    }

    func refreshGenderFromExistingWebProfile() {
        guard let web = findWebView(in: contentHost.view) else { return }
        web.evaluateJavaScript(
            "window.DAR_VISITOR_SMART_PROFILE_V1?.get?.()?.gender || 'neutral'"
        ) { [weak self] result, _ in
            DispatchQueue.main.async {
                self?.setGender(woman: (result as? String) == "woman")
            }
        }
    }

    func setGender(woman: Bool) {
        guard isWoman != woman else { return }
        isWoman = woman
        let tab = Destination.discovery
        let item = pages[tab.rawValue].tabBarItem
        item.title = woman ? "Frauen" : "Entdecken"
        refreshOriginal3DIcons(for: tab)
    }

    private func refreshOriginal3DIcons() {
        for tab in Destination.allCases { refreshOriginal3DIcons(for: tab) }
    }

    private func refreshOriginal3DIcons(for tab: Destination) {
        let name = tab.iconName(woman: isWoman)
        let item = pages[tab.rawValue].tabBarItem
        // First choice: a byte-for-byte approved image imported into Assets.xcassets.
        if let original = UIImage(named: name) {
            setOriginalIcon(original, on: item)
            return
        }
        // Pilot only: retrieve the SAME public, existing project PNG if not bundled.
        // Production must bundle and audit these images before releasing.
        guard let url = URL(string: "https://dar-al-tawhid.de/assets/dar-3d-icons/\(name).png") else { return }
        Task { [weak self, weak item] in
            do {
                let (data, response) = try await URLSession.shared.data(from: url)
                guard (response as? HTTPURLResponse)?.statusCode == 200,
                      let image = UIImage(data: data),
                      let self, let item else { return }
                // Prevent a late asynchronous response overwriting a newer gender icon.
                guard tab.iconName(woman: self.isWoman) == name else { return }
                self.setOriginalIcon(image, on: item)
            } catch {
                // Missing icon is an explicit pilot failure, not an invitation
                // to silently replace a 3D original with an SF Symbol.
                NSLog("DAR Liquid Glass pilot: missing 3D asset %@ (%@)", name, String(describing: error))
            }
        }
    }

    private func setOriginalIcon(_ source: UIImage, on item: UITabBarItem) {
        let size = CGSize(width: 28, height: 28)
        let image = UIGraphicsImageRenderer(size: size).image { _ in
            source.draw(in: CGRect(origin: .zero, size: size))
        }.withRenderingMode(.alwaysOriginal)
        item.image = image
        item.selectedImage = image
    }
}
