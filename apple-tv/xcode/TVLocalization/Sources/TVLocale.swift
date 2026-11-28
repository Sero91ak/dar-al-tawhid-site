import SwiftUI

public struct TVLocale: Identifiable, Hashable {
    public let code: String
    public let name: String
    public let layoutDirection: LayoutDirection

    public var id: String { code }

    public static let all: [TVLocale] = [
        TVLocale(code: "de", name: "Deutsch", layoutDirection: .leftToRight),
        TVLocale(code: "tr", name: "Türkçe", layoutDirection: .leftToRight),
        TVLocale(code: "en", name: "English", layoutDirection: .leftToRight),
        TVLocale(code: "ar", name: "العربية", layoutDirection: .rightToLeft),
        TVLocale(code: "ku", name: "Kurmancî", layoutDirection: .leftToRight),
        TVLocale(code: "ckb", name: "سۆرانی", layoutDirection: .rightToLeft),
        TVLocale(code: "bs", name: "Bosanski", layoutDirection: .leftToRight),
        TVLocale(code: "fr", name: "Français", layoutDirection: .leftToRight),
        TVLocale(code: "es", name: "Español", layoutDirection: .leftToRight)
    ]

    public static func named(_ code: String) -> TVLocale? {
        all.first { $0.code == code }
    }
}

/// Same preference as the adult app. An empty choice stays German.
/// The system language is not applied on its own.
public final class TVLocaleStore: ObservableObject {
    public static let preferenceKey = "darAdultPreferredLocaleV1"
    public static let shared = TVLocaleStore()

    @Published public private(set) var code: String
    private let defaults: UserDefaults

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let stored = defaults.string(forKey: Self.preferenceKey) ?? "de"
        code = TVLocale.named(stored)?.code ?? "de"
    }

    public var locale: TVLocale {
        TVLocale.named(code) ?? TVLocale.all[0]
    }

    public var layoutDirection: LayoutDirection {
        locale.layoutDirection
    }

    public func select(_ code: String) {
        guard let next = TVLocale.named(code) else { return }
        self.code = next.code
        defaults.set(next.code, forKey: Self.preferenceKey)
    }
}
