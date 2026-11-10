import Foundation

/// Native operating-surface copy (loading, offline, retry, PDF library errors,
/// widget gallery and widget labels) in all nine adult app languages:
/// de, ar, en, tr, ku, ckb, bs, fr, es.
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
        case widgetNextPrayerTitle
        case widgetNextPrayerDesc
        case widgetTimesTitle
        case widgetTimesDesc
        case widgetDayTitle
        case widgetDayDesc
        case widgetQiblaTitle
        case widgetQiblaDesc
        case widgetTodayTitle
        case widgetTodayDesc
        case widgetAyahTitle
        case widgetAyahDesc
        case widgetDuaTitle
        case widgetDuaDesc
        case widgetLockDateTitle
        case widgetLockDateDesc
        case widgetLockHijriTitle
        case widgetLockHijriDesc
        case widgetLegacyDesc
        case livePrayerTime
        case liveNow
        case widgetTodayBrand
        case widgetDayPostFallback
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
            .pdfLoadFailed: "PDF konnte nicht geladen werden.",
            .widgetNextPrayerTitle: "Nächstes Gebet",
            .widgetNextPrayerDesc: "Countdown mit Sekunden, DĀR AL TAWḤĪD Look. Farbe unter Bearbeiten wählen.",
            .widgetTimesTitle: "Gebetszeiten",
            .widgetTimesDesc: "Fajr bis ʿIshāʾ — gleiche Zeiten wie in der App.",
            .widgetDayTitle: "Tagesgebetszeiten",
            .widgetDayDesc: "Alle Gebetszeiten des Tages.",
            .widgetQiblaTitle: "Qibla",
            .widgetQiblaDesc: "Öffnet den Kompass in der App.",
            .widgetTodayTitle: "Heute empfohlen",
            .widgetTodayDesc: "Aktueller Beitrag.",
            .widgetAyahTitle: "Āyah des Tages",
            .widgetAyahDesc: "Deutscher Wortlaut.",
            .widgetDuaTitle: "Duʿāʾ des Tages",
            .widgetDuaDesc: "Aktuelles Bittgebet.",
            .widgetLockDateTitle: "Datum und Gebet",
            .widgetLockDateDesc: "Über der Uhr: Datum und nächstes Gebet.",
            .widgetLockHijriTitle: "Hidschra und Gebet",
            .widgetLockHijriDesc: "Hidschra nach Umm al-Qura und nächstes Gebet.",
            .widgetLegacyDesc: "Homescreen und Sperrbildschirm.",
            .livePrayerTime: "Gebetszeit",
            .liveNow: "Jetzt",
            .widgetTodayBrand: "Heute",
            .widgetDayPostFallback: "Tagesbeitrag"
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
            .pdfLoadFailed: "تعذّر تحميل ملف PDF.",
            .widgetNextPrayerTitle: "الصلاة القادمة",
            .widgetNextPrayerDesc: "عدّاد تنازلي بالثواني بهوية DĀR AL TAWḤĪD. اختر اللون من تحرير.",
            .widgetTimesTitle: "أوقات الصلاة",
            .widgetTimesDesc: "من الفجر إلى العشاء — نفس الأوقات كما في التطبيق.",
            .widgetDayTitle: "أوقات الصلاة اليومية",
            .widgetDayDesc: "جميع أوقات الصلاة في اليوم.",
            .widgetQiblaTitle: "القبلة",
            .widgetQiblaDesc: "يفتح البوصلة في التطبيق.",
            .widgetTodayTitle: "مقترح اليوم",
            .widgetTodayDesc: "المقال الحالي.",
            .widgetAyahTitle: "آية اليوم",
            .widgetAyahDesc: "الصياغة الألمانية.",
            .widgetDuaTitle: "دعاء اليوم",
            .widgetDuaDesc: "الدعاء الحالي.",
            .widgetLockDateTitle: "التاريخ والصلاة",
            .widgetLockDateDesc: "فوق الساعة: التاريخ والصلاة القادمة.",
            .widgetLockHijriTitle: "الهجرة والصلاة",
            .widgetLockHijriDesc: "الهجرة حسب أم القرى والصلاة القادمة.",
            .widgetLegacyDesc: "الشاشة الرئيسية وشاشة القفل.",
            .livePrayerTime: "وقت الصلاة",
            .liveNow: "الآن",
            .widgetTodayBrand: "اليوم",
            .widgetDayPostFallback: "مقال اليوم"
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
            .pdfLoadFailed: "The PDF could not be loaded.",
            .widgetNextPrayerTitle: "Next prayer",
            .widgetNextPrayerDesc: "Countdown with seconds, DĀR AL TAWḤĪD look. Choose the colour under Edit.",
            .widgetTimesTitle: "Prayer times",
            .widgetTimesDesc: "Fajr to ʿIshāʾ — the same times as in the app.",
            .widgetDayTitle: "Daily prayer times",
            .widgetDayDesc: "All prayer times of the day.",
            .widgetQiblaTitle: "Qibla",
            .widgetQiblaDesc: "Opens the compass in the app.",
            .widgetTodayTitle: "Recommended today",
            .widgetTodayDesc: "Current post.",
            .widgetAyahTitle: "Āyah of the day",
            .widgetAyahDesc: "German wording.",
            .widgetDuaTitle: "Duʿāʾ of the day",
            .widgetDuaDesc: "Current supplication.",
            .widgetLockDateTitle: "Date and prayer",
            .widgetLockDateDesc: "Above the clock: date and next prayer.",
            .widgetLockHijriTitle: "Hijra and prayer",
            .widgetLockHijriDesc: "Hijra according to Umm al-Qura and next prayer.",
            .widgetLegacyDesc: "Home screen and lock screen.",
            .livePrayerTime: "Prayer time",
            .liveNow: "Now",
            .widgetTodayBrand: "Today",
            .widgetDayPostFallback: "Post of the day"
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
            .pdfLoadFailed: "PDF yüklenemedi.",
            .widgetNextPrayerTitle: "Sonraki namaz",
            .widgetNextPrayerDesc: "Saniyeli geri sayım, DĀR AL TAWḤĪD görünümü. Rengi Düzenle bölümünden seç.",
            .widgetTimesTitle: "Namaz vakitleri",
            .widgetTimesDesc: "Fecr'den Yatsı'ya — uygulamadaki aynı vakitler.",
            .widgetDayTitle: "Günlük namaz vakitleri",
            .widgetDayDesc: "Günün tüm namaz vakitleri.",
            .widgetQiblaTitle: "Kıble",
            .widgetQiblaDesc: "Uygulamada pusulayı açar.",
            .widgetTodayTitle: "Bugün önerilen",
            .widgetTodayDesc: "Güncel yazı.",
            .widgetAyahTitle: "Günün āyeti",
            .widgetAyahDesc: "Almanca metin.",
            .widgetDuaTitle: "Günün duası",
            .widgetDuaDesc: "Güncel dua.",
            .widgetLockDateTitle: "Tarih ve namaz",
            .widgetLockDateDesc: "Saatin üstünde: tarih ve sonraki namaz.",
            .widgetLockHijriTitle: "Hicret ve namaz",
            .widgetLockHijriDesc: "Ümmü'l-Kurâ'ya göre hicret ve sonraki namaz.",
            .widgetLegacyDesc: "Ana ekran ve kilit ekranı.",
            .livePrayerTime: "Namaz vakti",
            .liveNow: "Şimdi",
            .widgetTodayBrand: "Bugün",
            .widgetDayPostFallback: "Günün yazısı"
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
            .pdfLoadFailed: "PDF nehat barkirin.",
            .widgetNextPrayerTitle: "Nimêja bê",
            .widgetNextPrayerDesc: "Jimartina bi çirkeyan, xuyabûna DĀR AL TAWḤĪD. Rengê di Guherandinê de hilbijêre.",
            .widgetTimesTitle: "Demên nimêjê",
            .widgetTimesDesc: "Ji Fecrê heta Îşayê — her wek demên di appê de.",
            .widgetDayTitle: "Demên nimêja rojê",
            .widgetDayDesc: "Hemû demên nimêjê yên rojê.",
            .widgetQiblaTitle: "Qible",
            .widgetQiblaDesc: "Kompasê di appê de vedike.",
            .widgetTodayTitle: "Îro pêşniyarkirî",
            .widgetTodayDesc: "Nivîsa niha.",
            .widgetAyahTitle: "Ayeta rojê",
            .widgetAyahDesc: "Nivîsa almanî.",
            .widgetDuaTitle: "Duaya rojê",
            .widgetDuaDesc: "Duaya niha.",
            .widgetLockDateTitle: "Dîrok û nimêj",
            .widgetLockDateDesc: "Li ser saetê: dîrok û nimêja bê.",
            .widgetLockHijriTitle: "Hicret û nimêj",
            .widgetLockHijriDesc: "Hicret li gorî Umm al-Qura û nimêja bê.",
            .widgetLegacyDesc: "Ekrana malê û ekrana qeflê.",
            .livePrayerTime: "Dema nimêjê",
            .liveNow: "Niha",
            .widgetTodayBrand: "Îro",
            .widgetDayPostFallback: "Nivîsa rojê"
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
            .pdfLoadFailed: "فایلی PDF نەتوانرا بار بکرێت.",
            .widgetNextPrayerTitle: "نوێژی داهاتوو",
            .widgetNextPrayerDesc: "ژمێرەری چرکەیی بە ڕووکاری DĀR AL TAWḤĪD. ڕەنگ لە دەستکاری هەڵبژێرە.",
            .widgetTimesTitle: "کاتەکانی نوێژ",
            .widgetTimesDesc: "لە بەیانی تا عیشا — هەمان کات وەک لە ئەپەکە.",
            .widgetDayTitle: "کاتەکانی نوێژی ڕۆژانە",
            .widgetDayDesc: "هەموو کاتەکانی نوێژی ڕۆژ.",
            .widgetQiblaTitle: "قبلە",
            .widgetQiblaDesc: "قیبلەنما لە ئەپەکە دەکاتەوە.",
            .widgetTodayTitle: "پێشنیاری ئەمڕۆ",
            .widgetTodayDesc: "بابەتی ئێستا.",
            .widgetAyahTitle: "ئایەتی ڕۆژ",
            .widgetAyahDesc: "دەقی ئەڵمانی.",
            .widgetDuaTitle: "دوعای ڕۆژ",
            .widgetDuaDesc: "دوعای ئێستا.",
            .widgetLockDateTitle: "ڕێکەوت و نوێژ",
            .widgetLockDateDesc: "لە سەرووی کاتژمێرەوە: ڕێکەوت و نوێژی داهاتوو.",
            .widgetLockHijriTitle: "هیجرەت و نوێژ",
            .widgetLockHijriDesc: "هیجرەت بەپێی ئوم القورا و نوێژی داهاتوو.",
            .widgetLegacyDesc: "شاشەی سەرەکی و شاشەی قوفڵ.",
            .livePrayerTime: "کاتی نوێژ",
            .liveNow: "ئێستا",
            .widgetTodayBrand: "ئەمڕۆ",
            .widgetDayPostFallback: "بابەتی ڕۆژ"
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
            .pdfLoadFailed: "PDF se nije mogao učitati.",
            .widgetNextPrayerTitle: "Sljedeći namaz",
            .widgetNextPrayerDesc: "Odbrojavanje sa sekundama, izgled DĀR AL TAWḤĪD. Boju odaberi pod Uredi.",
            .widgetTimesTitle: "Vremena namaza",
            .widgetTimesDesc: "Od sabaha do jacije — ista vremena kao u aplikaciji.",
            .widgetDayTitle: "Dnevna vremena namaza",
            .widgetDayDesc: "Sva vremena namaza za taj dan.",
            .widgetQiblaTitle: "Kibla",
            .widgetQiblaDesc: "Otvara kompas u aplikaciji.",
            .widgetTodayTitle: "Preporučeno danas",
            .widgetTodayDesc: "Aktualni tekst.",
            .widgetAyahTitle: "Ajet dana",
            .widgetAyahDesc: "Njemački tekst.",
            .widgetDuaTitle: "Dova dana",
            .widgetDuaDesc: "Aktualna dova.",
            .widgetLockDateTitle: "Datum i namaz",
            .widgetLockDateDesc: "Iznad sata: datum i sljedeći namaz.",
            .widgetLockHijriTitle: "Hidžra i namaz",
            .widgetLockHijriDesc: "Hidžra po Umm al-Quri i sljedeći namaz.",
            .widgetLegacyDesc: "Početni ekran i ekran zaključavanja.",
            .livePrayerTime: "Vrijeme namaza",
            .liveNow: "Sada",
            .widgetTodayBrand: "Danas",
            .widgetDayPostFallback: "Tekst dana"
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
            .pdfLoadFailed: "Le PDF n'a pas pu être chargé.",
            .widgetNextPrayerTitle: "Prochaine prière",
            .widgetNextPrayerDesc: "Compte à rebours avec secondes, style DĀR AL TAWḤĪD. Choisissez la couleur sous Modifier.",
            .widgetTimesTitle: "Horaires des prières",
            .widgetTimesDesc: "De Fajr à ʿIshāʾ — les mêmes horaires que dans l'application.",
            .widgetDayTitle: "Horaires quotidiens des prières",
            .widgetDayDesc: "Tous les horaires de prière de la journée.",
            .widgetQiblaTitle: "Qibla",
            .widgetQiblaDesc: "Ouvre la boussole dans l'application.",
            .widgetTodayTitle: "Recommandé aujourd'hui",
            .widgetTodayDesc: "Publication actuelle.",
            .widgetAyahTitle: "Āyah du jour",
            .widgetAyahDesc: "Texte allemand.",
            .widgetDuaTitle: "Duʿāʾ du jour",
            .widgetDuaDesc: "Invocation actuelle.",
            .widgetLockDateTitle: "Date et prière",
            .widgetLockDateDesc: "Au-dessus de l'horloge : date et prochaine prière.",
            .widgetLockHijriTitle: "Hégire et prière",
            .widgetLockHijriDesc: "Hégire selon Umm al-Qura et prochaine prière.",
            .widgetLegacyDesc: "Écran d'accueil et écran verrouillé.",
            .livePrayerTime: "Heure de prière",
            .liveNow: "Maintenant",
            .widgetTodayBrand: "Aujourd'hui",
            .widgetDayPostFallback: "Publication du jour"
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
            .pdfLoadFailed: "No se pudo cargar el PDF.",
            .widgetNextPrayerTitle: "Próxima oración",
            .widgetNextPrayerDesc: "Cuenta atrás con segundos, estilo DĀR AL TAWḤĪD. Elige el color en Editar.",
            .widgetTimesTitle: "Horarios de oración",
            .widgetTimesDesc: "De Fajr a ʿIshāʾ — los mismos horarios que en la app.",
            .widgetDayTitle: "Horarios diarios de oración",
            .widgetDayDesc: "Todos los horarios de oración del día.",
            .widgetQiblaTitle: "Qibla",
            .widgetQiblaDesc: "Abre la brújula en la app.",
            .widgetTodayTitle: "Recomendado hoy",
            .widgetTodayDesc: "Publicación actual.",
            .widgetAyahTitle: "Āyah del día",
            .widgetAyahDesc: "Texto alemán.",
            .widgetDuaTitle: "Duʿāʾ del día",
            .widgetDuaDesc: "Súplica actual.",
            .widgetLockDateTitle: "Fecha y oración",
            .widgetLockDateDesc: "Sobre el reloj: fecha y próxima oración.",
            .widgetLockHijriTitle: "Hégira y oración",
            .widgetLockHijriDesc: "Hégira según Umm al-Qura y próxima oración.",
            .widgetLegacyDesc: "Pantalla de inicio y pantalla bloqueada.",
            .livePrayerTime: "Hora de oración",
            .liveNow: "Ahora",
            .widgetTodayBrand: "Hoy",
            .widgetDayPostFallback: "Publicación del día"
        ]
    ]
}
