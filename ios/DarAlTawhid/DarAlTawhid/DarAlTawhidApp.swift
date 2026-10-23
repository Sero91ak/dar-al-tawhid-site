import SwiftUI
import Combine
import UIKit
import WidgetKit

enum DarAppLanguage: String, CaseIterable, Identifiable, Codable, Equatable {
    case de, en, ar, tr, ku, ckb, bs, fr, es

    static let storageKey = "darAdultPreferredLocaleV1"
    var id: String { rawValue }
    var localeIdentifier: String { rawValue }
    var isRightToLeft: Bool { self == .ar || self == .ckb }

    static func fromSystemPreferredLanguages(_ languages: [String] = Locale.preferredLanguages) -> Self {
        for language in languages {
            let base = language.replacingOccurrences(of: "_", with: "-").split(separator: "-").first.map(String.init)?.lowercased() ?? ""
            if let match = allCases.first(where: { $0.rawValue == base }) { return match }
        }
        return .de
    }

    static func supported(from rawValue: String) -> Self? {
        let base = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "_", with: "-").split(separator: "-").first.map(String.init)?.lowercased() ?? ""
        return allCases.first(where: { $0.rawValue == base })
    }
}

@MainActor
final class DarLanguageStore: ObservableObject {
    private let defaults: UserDefaults
    @Published private(set) var hasManualSelection: Bool
    @Published var selectedLanguage: DarAppLanguage

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        if let stored = defaults.string(forKey: DarAppLanguage.storageKey), let language = DarAppLanguage.supported(from: stored) {
            selectedLanguage = language
            hasManualSelection = true
        } else {
            selectedLanguage = DarAppLanguage.fromSystemPreferredLanguages()
            hasManualSelection = false
        }
    }

    var locale: Locale { Locale(identifier: selectedLanguage.localeIdentifier) }
    var localeIdentifier: String { selectedLanguage.localeIdentifier }

    func select(_ language: DarAppLanguage) {
        guard selectedLanguage != language || !hasManualSelection else { return }
        selectedLanguage = language
        hasManualSelection = true
        defaults.set(language.rawValue, forKey: DarAppLanguage.storageKey)
    }

    func acceptWebLocale(_ rawValue: String) {
        guard let language = DarAppLanguage.supported(from: rawValue) else { return }
        select(language)
    }
}

final class DarAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        DarInAppOpenGuard.install()
        DarPushNotifications.bootstrap(launchOptions: launchOptions)
        if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem,
           let destination = shortcutDestination(for: shortcut.type) {
            DarQuickActions.set(destination)
            return false
        }
        return true
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard let destination = shortcutDestination(for: shortcutItem.type) else {
            completionHandler(false)
            return
        }
        DarQuickActions.set(destination)
        NotificationCenter.default.post(
            name: .darOpenShortcut,
            object: nil,
            userInfo: ["destination": destination.rawValue]
        )
        completionHandler(true)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        DarPushNotifications.didRegister(deviceToken: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    private func shortcutDestination(for type: String) -> DarDeepLink.Destination? {
        switch type.lowercased().split(separator: ".").last.map(String.init) {
        case "prayer": return .prayer
        case "qibla": return .qibla
        case "quran": return .quran
        case "duas", "dua": return .duas
        default: return nil
        }
    }
}

extension Notification.Name {
    static let darOpenShortcut = Notification.Name("darOpenShortcut")
}

@main
struct DarAlTawhidApp: App {
    @UIApplicationDelegateAdaptor(DarAppDelegate.self) private var appDelegate
    @StateObject private var router = DarAppRouter()
    @StateObject private var languageStore = DarLanguageStore()

    init() {
        let ink = DarWidgetStore.load().inkHex.trimmingCharacters(in: .whitespacesAndNewlines)
        let bootInk: UIColor
        if ink.hasPrefix("#"), ink.count == 7, let value = Int(ink.dropFirst(), radix: 16) {
            bootInk = UIColor(
                red: CGFloat((value >> 16) & 0xFF) / 255.0,
                green: CGFloat((value >> 8) & 0xFF) / 255.0,
                blue: CGFloat(value & 0xFF) / 255.0,
                alpha: 1.0
            )
        } else {
            bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        }
        UIWindow.appearance().backgroundColor = bootInk
        let snap = DarDailyContent.refresh(DarWidgetStore.load())
        DarWidgetStore.save(snap)
        Task.detached {
            let live = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
            DarWidgetStore.save(live)
            await MainActor.run {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            WebAppView(
                destination: router.destination,
                openURL: router.webURL,
                openNonce: router.openNonce,
                preferredLocale: languageStore.localeIdentifier,
                hasManualLocale: languageStore.hasManualSelection,
                onWebLocaleChange: { languageStore.acceptWebLocale($0) }
            )
                .ignoresSafeArea()
                .environmentObject(languageStore)
                .environment(\.locale, languageStore.locale)
                .environment(\.layoutDirection, languageStore.selectedLanguage.isRightToLeft ? .rightToLeft : .leftToRight)
                .background(Color(uiColor: WebAppView.Coordinator.storedSurfaceColor()))
                .onOpenURL { url in
                    router.open(url)
                }
                .onAppear {
                    router.openPendingQuickAction()
                }
                .onReceive(NotificationCenter.default.publisher(for: .darOpenShortcut)) { note in
                    guard let raw = note.userInfo?["destination"] as? String,
                          let destination = DarDeepLink.Destination(rawValue: raw) else { return }
                    router.openShortcut(destination)
                }
                .onReceive(NotificationCenter.default.publisher(for: .darOpenPush)) { note in
                    let info = note.userInfo ?? [:]
                    router.openPush(
                        type: String(describing: info["type"] ?? ""),
                        postId: String(describing: info["postId"] ?? ""),
                        url: String(describing: info["url"] ?? "")
                    )
                }
        }
        #if os(macOS) || targetEnvironment(macCatalyst)
        .defaultSize(width: 1100, height: 780)
        #endif
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}
