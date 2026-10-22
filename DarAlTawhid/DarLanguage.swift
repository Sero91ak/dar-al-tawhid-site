import Observation
import SwiftUI

enum DarAppLanguage: String, CaseIterable, Identifiable, Codable, Equatable {
    case de
    case en
    case ar
    case tr
    case ku
    case ckb
    case bs
    case fr
    case es

    static let storageKey = "darAdultPreferredLocaleV1"

    var id: String { rawValue }

    var localeIdentifier: String { rawValue }

    var displayName: String {
        switch self {
        case .de: return "Deutsch"
        case .en: return "English"
        case .ar: return "العربية الفصحى"
        case .tr: return "Türkçe"
        case .ku: return "Kurmancî"
        case .ckb: return "سۆرانی"
        case .bs: return "Bosanski"
        case .fr: return "Français"
        case .es: return "Español"
        }
    }

    var isRightToLeft: Bool {
        self == .ar || self == .ckb
    }

    static func fromSystemPreferredLanguages(_ languages: [String] = Locale.preferredLanguages) -> Self {
        for language in languages {
            let base = language.split(separator: "-").first.map(String.init)?.lowercased() ?? ""
            if let match = allCases.first(where: { $0.rawValue == base }) {
                return match
            }
        }
        return .de
    }

    static func supported(from rawValue: String) -> Self? {
        let normalized = rawValue
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "_", with: "-")
            .split(separator: "-")
            .first
            .map(String.init)?
            .lowercased() ?? ""
        return allCases.first(where: { $0.rawValue == normalized })
    }
}

@MainActor
@Observable
final class DarLanguageStore {
    private let defaults: UserDefaults
    private(set) var hasManualSelection: Bool
    var selectedLanguage: DarAppLanguage

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        if let stored = defaults.string(forKey: DarAppLanguage.storageKey),
           let language = DarAppLanguage.supported(from: stored) {
            selectedLanguage = language
            hasManualSelection = true
        } else {
            selectedLanguage = DarAppLanguage.fromSystemPreferredLanguages()
            hasManualSelection = false
        }
    }

    var locale: Locale {
        Locale(identifier: selectedLanguage.localeIdentifier)
    }

    var localeIdentifier: String {
        selectedLanguage.localeIdentifier
    }

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

struct DarLanguageSettingsView: View {
    @Environment(DarLanguageStore.self) private var languageStore
    @State private var showsLanguageList = false

    var body: some View {
        Button {
            showsLanguageList = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "globe")
                    .font(.body.weight(.medium))
                    .foregroundStyle(.secondary)
                Text("Sprache")
                    .foregroundStyle(.primary)
                Spacer(minLength: 12)
                Text(verbatim: languageStore.selectedLanguage.displayName)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.trailing)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Sprache")
        .accessibilityValue(languageStore.selectedLanguage.displayName)
        .sheet(isPresented: $showsLanguageList) {
            DarLanguageListView()
        }
    }
}

private struct DarLanguageListView: View {
    @Environment(DarLanguageStore.self) private var languageStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List(DarAppLanguage.allCases) { language in
                Button {
                    languageStore.select(language)
                    dismiss()
                } label: {
                    HStack {
                        Text(verbatim: language.displayName)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        if language == languageStore.selectedLanguage {
                            Image(systemName: "checkmark")
                                .foregroundStyle(.tint)
                                .accessibilityHidden(true)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .environment(\.layoutDirection, language.isRightToLeft ? .rightToLeft : .leftToRight)
                .accessibilityAddTraits(language == languageStore.selectedLanguage ? .isSelected : [])
            }
            .navigationTitle("Sprache")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}
