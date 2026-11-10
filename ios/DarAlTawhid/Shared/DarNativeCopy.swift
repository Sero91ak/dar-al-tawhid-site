import Foundation

/// Native operating-surface copy (loading, offline, retry, PDF library errors)
/// in all nine adult app languages: de, ar, en, tr, ku, ckb, bs, fr, es.
///
/// Scope rules:
/// - This file contains **operating UI text only**. Religious statements,
///   quotations, sources and Isnād are never translated here; they stay in the
///   canonical source-bound web content.
/// - Arabic and Sorani are right-to-left (`isRightToLeft`).
/// - The language is the adult app language, not the OS language: the web app
///   stores it under `darAdultPreferredLocaleV1`, and this module caches it in
///   the shared app group so widgets and native overlays resolve it without a
///   running web view.
/// - If no language has been reported yet, the German original is used
///   (same fallback direction as the app's content rule).
enum DarNativeCopy {

    /// All registered adult app languages. New languages extend this list and
    /// every dictionary below together.
    static let supportedLocales: [String] = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"]

    /// Languages that must render right-to-left.
    static let rightToLeftLocales: Set<String> = ["ar", "ckb"]

    /// Fallback language. Never empty.
    static let fallbackLocale = "de"

    enum Key: String, CaseIterable {
        case loading
        case retry
        case offlineBody
        case pdfNotFoundTitle
        case pdfNotFoundBody
        case pdfOpenFailedTitle
        case pdfOpenFailedBody
        case pdfInvalidTitle
        case pdfInvalidBody
        case pdfLoadFailed
    }

    private static let storeKey = "darNativeLocaleV1"

    /// Shared app-group storage (same suite the widgets already use).
    private static var defaults: UserDefaults {
        DarWidgetStore.defaults
    }

    /// Currently active native language code.
    static var locale: String {
        let stored = defaults.string(forKey: storeKey) ?? ""
        return normalized(stored) ?? fallbackLocale
    }

    /// Caches the adult app language reported by the web app.
    /// Invalid or empty values fall back to German.
    static func setLocale(_ raw: String) {
        guard let code = normalized(raw) else { return }
        defaults.set(code, forKey: storeKey)
    }

    static var isRightToLeft: Bool {
        rightToLeftLocales.contains(locale)
    }

    /// Text for the active language, with a German fallback so a missing entry
    /// can never render an empty label.
    static func text(_ key: Key) -> String {
        text(key, locale: locale)
    }

    static func text(_ key: Key, locale code: String) -> String {
        let resolved = normalized(code) ?? fallbackLocale
        if let value = dictionaries[resolved]?[key], !value.isEmpty { return value }
        if let value = dictionaries[fallbackLocale]?[key], !value.isEmpty { return value }
        return key.rawValue
    }

    /// Normalizes `de-DE`, `DE`, `ar_SA`, `ckb-IQ` etc. to a registered code.
    static func normalized(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty else { return nil }
        let head = trimmed
            .replacingOccurrences(of: "_", with: "-")
            .split(separator: "-")
            .first
            .map(String.init) ?? trimmed
        return supportedLocales.contains(head) ? head : nil
    }

    /// True when every registered language carries every key.
    /// Used by `ios/DarAlTawhid/Tests/ios-native-copy-locales-v1.cjs`.
    static var isComplete: Bool {
        supportedLocales.allSatisfy { code in
            guard let entries = dictionaries[code] else { return false }
            return Key.allCases.allSatisfy { key in
                let value = entries[key] ?? ""
                return !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            }
        }
    }

    private static let dictionaries: [String: [Key: String]] = [
        "de": [
            .loading: "App wird geladen",
            .retry: "Erneut laden",
            .offlineBody: "Die App konnte gerade nicht geladen werden. Bitte prüfe deine Internetverbindung und öffne die App erneut.",
            .pdfNotFoundTitle: "PDF nicht gefunden",
            .pdfNotFoundBody: "Diese Veröffentlichung konnte in der Bibliothek nicht geladen werden.",
            .pdfOpenFailedTitle: "PDF konnte nicht geöffnet werden",
            .pdfOpenFailedBody: "Bitte versuche es erneut oder öffne die PDF später.",
            .pdfInvalidTitle: "PDF ungültig",
            .pdfInvalidBody: "Die PDF-Adresse konnte nicht aufgebaut werden.",
            .pdfLoadFailed: "PDF konnte nicht geladen werden."
        ],
        "ar": [
            .loading: "جارٍ تحميل التطبيق",
            .retry: "إعادة المحاولة",
            .offlineBody: "تعذّر تحميل التطبيق الآن. يرجى التحقق من اتصالك بالإنترنت ثم إعادة فتح التطبيق.",
            .pdfNotFoundTitle: "لم يتم العثور على ملف PDF",
            .pdfNotFoundBody: "تعذّر تحميل هذا الإصدار من المكتبة.",
            .pdfOpenFailedTitle: "تعذّر فتح ملف PDF",
            .pdfOpenFailedBody: "يرجى المحاولة مرة أخرى أو فتح ملف PDF لاحقًا.",
            .pdfInvalidTitle: "ملف PDF غير صالح",
            .pdfInvalidBody: "تعذّر إنشاء رابط ملف PDF.",
            .pdfLoadFailed: "تعذّر تحميل ملف PDF."
        ],
        "en": [
            .loading: "Loading app",
            .retry: "Reload",
            .offlineBody: "The app could not be loaded right now. Please check your internet connection and open the app again.",
            .pdfNotFoundTitle: "PDF not found",
            .pdfNotFoundBody: "This publication could not be loaded from the library.",
            .pdfOpenFailedTitle: "PDF could not be opened",
            .pdfOpenFailedBody: "Please try again or open the PDF later.",
            .pdfInvalidTitle: "Invalid PDF",
            .pdfInvalidBody: "The PDF address could not be built.",
            .pdfLoadFailed: "The PDF could not be loaded."
        ],
        "tr": [
            .loading: "Uygulama yükleniyor",
            .retry: "Yeniden dene",
            .offlineBody: "Uygulama şu anda yüklenemedi. Lütfen internet bağlantını kontrol et ve uygulamayı yeniden aç.",
            .pdfNotFoundTitle: "PDF bulunamadı",
            .pdfNotFoundBody: "Bu yayın kitaplıktan yüklenemedi.",
            .pdfOpenFailedTitle: "PDF açılamadı",
            .pdfOpenFailedBody: "Lütfen tekrar dene veya PDF'yi daha sonra aç.",
            .pdfInvalidTitle: "PDF geçersiz",
            .pdfInvalidBody: "PDF adresi oluşturulamadı.",
            .pdfLoadFailed: "PDF yüklenemedi."
        ],
        "ku": [
            .loading: "App tê barkirin",
            .retry: "Ji nû ve biceribîne",
            .offlineBody: "App niha nehat barkirin. Ji kerema xwe girêdana înternetê kontrol bike û appê dîsa veke.",
            .pdfNotFoundTitle: "PDF nehat dîtin",
            .pdfNotFoundBody: "Ev weşan ji pirtûkxaneyê nehat barkirin.",
            .pdfOpenFailedTitle: "PDF nehat vekirin",
            .pdfOpenFailedBody: "Ji kerema xwe dîsa biceribîne an PDF paşê veke.",
            .pdfInvalidTitle: "PDF nederbasdar e",
            .pdfInvalidBody: "Navnîşana PDF nehat avakirin.",
            .pdfLoadFailed: "PDF nehat barkirin."
        ],
        "ckb": [
            .loading: "ئەپەکە بار دەکرێت",
            .retry: "دووبارە هەوڵ بدەرەوە",
            .offlineBody: "ئەپەکە ئێستا نەتوانرا بار بکرێت. تکایە پەیوەندی ئینتەرنێتەکەت بپشکنە و ئەپەکە دووبارە بکەرەوە.",
            .pdfNotFoundTitle: "فایلی PDF نەدۆزرایەوە",
            .pdfNotFoundBody: "ئەم بڵاوکراوەیە لە کتێبخانەکە نەتوانرا بار بکرێت.",
            .pdfOpenFailedTitle: "نەتوانرا فایلی PDF بکرێتەوە",
            .pdfOpenFailedBody: "تکایە دووبارە هەوڵ بدەرەوە یان دواتر PDF بکەرەوە.",
            .pdfInvalidTitle: "فایلی PDF نادروستە",
            .pdfInvalidBody: "ناونیشانی PDF نەتوانرا دروست بکرێت.",
            .pdfLoadFailed: "فایلی PDF نەتوانرا بار بکرێت."
        ],
        "bs": [
            .loading: "Aplikacija se učitava",
            .retry: "Pokušaj ponovo",
            .offlineBody: "Aplikacija se trenutno nije mogla učitati. Provjeri internet vezu i ponovo otvori aplikaciju.",
            .pdfNotFoundTitle: "PDF nije pronađen",
            .pdfNotFoundBody: "Ova publikacija nije mogla biti učitana iz biblioteke.",
            .pdfOpenFailedTitle: "PDF se nije mogao otvoriti",
            .pdfOpenFailedBody: "Pokušaj ponovo ili otvori PDF kasnije.",
            .pdfInvalidTitle: "PDF nije valjan",
            .pdfInvalidBody: "Adresa PDF-a nije se mogla sastaviti.",
            .pdfLoadFailed: "PDF se nije mogao učitati."
        ],
        "fr": [
            .loading: "Chargement de l'application",
            .retry: "Réessayer",
            .offlineBody: "L'application n'a pas pu être chargée. Vérifiez votre connexion Internet et rouvrez l'application.",
            .pdfNotFoundTitle: "PDF introuvable",
            .pdfNotFoundBody: "Cette publication n'a pas pu être chargée depuis la bibliothèque.",
            .pdfOpenFailedTitle: "Impossible d'ouvrir le PDF",
            .pdfOpenFailedBody: "Réessayez ou ouvrez le PDF plus tard.",
            .pdfInvalidTitle: "PDF invalide",
            .pdfInvalidBody: "L'adresse du PDF n'a pas pu être construite.",
            .pdfLoadFailed: "Le PDF n'a pas pu être chargé."
        ],
        "es": [
            .loading: "La aplicación se está cargando",
            .retry: "Reintentar",
            .offlineBody: "No se pudo cargar la aplicación. Comprueba tu conexión a Internet y vuelve a abrir la aplicación.",
            .pdfNotFoundTitle: "PDF no encontrado",
            .pdfNotFoundBody: "Esta publicación no se pudo cargar desde la biblioteca.",
            .pdfOpenFailedTitle: "No se pudo abrir el PDF",
            .pdfOpenFailedBody: "Inténtalo de nuevo o abre el PDF más tarde.",
            .pdfInvalidTitle: "PDF no válido",
            .pdfInvalidBody: "No se pudo construir la dirección del PDF.",
            .pdfLoadFailed: "No se pudo cargar el PDF."
        ]
    ]
}
