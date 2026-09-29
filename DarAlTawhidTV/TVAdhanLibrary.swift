import Foundation

struct TVAdhanRecording: Identifiable, Sendable, Hashable {
    let id: String
    let name: String
    let fileName: String
    let url: URL
    let isFajr: Bool

    var categoryLabel: String {
        isFajr ? "Faǧr-Adhān" : "Adhān"
    }
}

enum TVAdhanLibrary {
    private static let apiURL = URL(string: "https://api.github.com/repos/Kiwifu/adhan-mp3/contents/")

    // These are exact filenames present in Kiwifu/adhan-mp3. The remaining
    // repository recordings stay available in the source but are not shown.
    private static let regularDefinitions: [(file: String, name: String, location: String)] = [
        ("Ali_Ibn_Ahmad_Mala_-_HQ_(علي_بن_أحمد_ملا).mp3", "ʿAlī ibn Aḥmad Mullā", "al-Masǧid al-Ḥarām · Makkah"),
        ("Mishary_Al_Afasy_-_HQ_(مشاري_العفاسي).mp3", "Mišārī Rāšid al-ʿAfāsī", "Kuwait"),
        ("Abdulbasit_Abdusamad_1_-_Egypt_(عبد_الباسط_عبد_الصمد_-_مصر).mp3", "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", "Ägypten"),
        ("Mohamed_Siddiq_El-Minshawi_-_Egypt_1_(محمد_صديق_المنشاوي_-_مصر).mp3", "Muḥammad Ṣiddīq al-Minšāwī", "Ägypten"),
        ("Mahmoud_Khalil_Al_Hussary_-_Cairo_(محمود_خليل_الحصري_-_القاهرة).mp3", "Maḥmūd Ḫalīl al-Ḥuṣarī", "Kairo"),
        ("Muhammad_Refaat_-_Cairo_(محمد_رفعت_-_القاهرة).mp3", "Muḥammad Rifʿat", "Kairo"),
        ("Mahmoud_Ali_Al_Banna_-_Cairo_(محمود_علي_البنا_-_القاهرة).mp3", "Maḥmūd ʿAlī al-Bannāʾ", "Kairo"),
        ("Mustafa_Ismail_-_Egypt_(مصطفى_إسماعيل_-_مصر).mp3", "Muṣṭafā Ismāʿīl", "Ägypten"),
        ("Yasser_Al-Dosari_-_Saudi_Arabia_(ياسر_الدوسري_-_المملكة_العربية_السعودية).mp3", "Yāsir ad-Dawsarī", "Saudi-Arabien"),
        ("Nasser_Al_Qatami_-_HQ_(ناصر_القطامي).mp3", "Nāṣir al-Qaṭāmī", "Saudi-Arabien"),
        ("Muhammad_Khaleel_Raml_-_Al_Haram_Al_Maki_(محمد_خليل_رمل_-_الحرم_المكي).mp3", "Muḥammad Ḫalīl Raml", "al-Masǧid al-Ḥarām · Makkah"),
        ("Faruq_Abdul_Rahman_Hadrawe_-_Al_Haram_Al_Maki_(فاروق_عبدالرحمن_حضراوي_-_الحرم_المكي).mp3", "Fārūq ʿAbd ar-Raḥmān Ḥaḍrāwī", "al-Masǧid al-Ḥarām · Makkah"),
        ("Assem_Bukhrare_-_Al_Haram_Al_Maki_(عاصم_بخراري_-_الحرم_المكي).mp3", "ʿĀṣim Buḫrārī", "al-Masǧid al-Ḥarām · Makkah"),
        ("Nayf_Fedah_-_Al_Haram_Al_Maki_(نايف_فداح_-_الحرم_المكي).mp3", "Nāyif Faddāḥ", "al-Masǧid al-Ḥarām · Makkah"),
        ("Najee_Qazaz_-_Al_Aqsa_Jerusalem_(ناجي_قزاز_-_المسجد_الأقصى_القدس).mp3", "Nāǧī Qazzāz", "al-Masǧid al-Aqṣā · al-Quds"),
        ("NurDin_Hamza_Al_Maghriby_-_Al_Aqsa_Jerusalem_(نور_الدين_حمزة_المغربي_-_المسجد_الأقصى_القدس).mp3", "Nūr ad-Dīn Ḥamza al-Maġribī", "al-Masǧid al-Aqṣā · al-Quds"),
        ("Ahmd_At-Trablsy_1_(أحمد_الطرابلسي).mp3", "Aḥmad aṭ-Ṭarābulusī", "Kuwait"),
        ("Taha_Al_Junayd_(طه_الجنيد).mp3", "Ṭāhā al-Ǧunayd", "Bahrain"),
        ("Wadi_Al_Yamani_(وديع_اليمني).mp3", "Wadīʿ al-Yamanī", "Jemen"),
        ("Ahmad_Al_Amade_1_-_Qatar_(أحمد_العمادي_-_قطر).mp3", "Aḥmad al-ʿImādī", "Katar")
    ]

    private static let fajrDefinitions: [(file: String, name: String, location: String)] = [
        ("Adhan_Fajr_Al_Haram_Al_Maki_(أذان_الفجر_الحرم_المكي).mp3", "al-Ḥaram al-Makkī · Faǧr", "al-Masǧid al-Ḥarām · Makkah"),
        ("Adhan_Fajr_Al_Haram_Al_Madani_(أذان_الفجر_الحرم_المدني).mp3", "al-Ḥaram al-Madanī · Faǧr", "al-Masǧid an-Nabawī · Madīnah"),
        ("Abdulbasit_Abdusamad_6_-_Fajr_Egypt_(عبد_الباسط_عبد_الصمد_-_فجر_مصر).mp3", "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad · Faǧr", "Ägypten"),
        ("Ahmad_Nawaf_Al_Mejlad_2_-_Fajr_(أحمد_نواف_المجلد_-_الفجر).mp3", "Aḥmad Nawāf al-Maǧlad · Faǧr", "Saudi-Arabien"),
        ("Ahmd_At-Trablsy_-_Fajr_Kuwait_(أحمد_الطرابلسي_-_فجر_الكويت).mp3", "Aḥmad aṭ-Ṭarābulusī · Faǧr", "Kuwait"),
        ("Mishary_Rashid_Alafasy_3_-_Fajr_Kuwait_(مشاري_راشد_العفاسي_-_فجر_الكويت).mp3", "Mišārī Rāšid al-ʿAfāsī · Faǧr", "Kuwait"),
        ("Yaseen_Al_Aassaf_2_-_Fajr_Iraq_(ياسين_الأسف_-_فجر_العراق).mp3", "Yāsīn al-ʿAṣṣāf · Faǧr", "Irak"),
        ("Fajr_Adhan_by_Nasreddine_Toubar_(اذان_الفجر_بصوت_نصر_الدين_طوبار).mp3", "Naṣr ad-Dīn Ṭūbār · Faǧr", "Ägypten")
    ]

    private static func makeRecording(
        file: String,
        name: String,
        location: String,
        isFajr: Bool
    ) -> TVAdhanRecording? {
        guard let url = rawURL(for: file) else { return nil }
        return TVAdhanRecording(id: file, name: name, fileName: location, url: url, isFajr: isFajr)
    }

    static let fallback: [TVAdhanRecording] = {
        let regular = regularDefinitions.compactMap {
            makeRecording(file: $0.file, name: $0.name, location: $0.location, isFajr: false)
        }
        let fajr = fajrDefinitions.compactMap {
            makeRecording(file: $0.file, name: $0.name, location: $0.location, isFajr: true)
        }
        return regular + fajr
    }()

    static func load() async -> [TVAdhanRecording] {
        guard let apiURL else { return fallback }

        do {
            var request = URLRequest(url: apiURL)
            request.timeoutInterval = 8
            request.setValue("DarAlTawhidTV", forHTTPHeaderField: "User-Agent")
            let (data, _) = try await URLSession.shared.data(for: request)
            let entries = try JSONDecoder().decode([GitHubEntry].self, from: data)
            let available = Set(entries.filter { $0.type == "file" }.map(\.name))

            let regular = regularDefinitions.compactMap { definition -> TVAdhanRecording? in
                guard available.contains(definition.file) else { return nil }
                return makeRecording(file: definition.file, name: definition.name, location: definition.location, isFajr: false)
            }
            let fajr = fajrDefinitions.compactMap { definition -> TVAdhanRecording? in
                guard available.contains(definition.file) else { return nil }
                return makeRecording(file: definition.file, name: definition.name, location: definition.location, isFajr: true)
            }

            let recordings = regular + fajr
            return recordings.isEmpty ? fallback : recordings
        } catch {
            return fallback
        }
    }

    private static func rawURL(for fileName: String) -> URL? {
        guard let escapedName = fileName.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            return nil
        }
        return URL(string: "https://dar-al-tawhid.de/adhan/\(escapedName)")
    }

    private struct GitHubEntry: Decodable {
        let name: String
        let type: String
    }
}
