import Foundation

enum ContentImportValidator {
    static func validate(catalog: QuranCatalog) throws {
        guard catalog.surahs.count == 114 else {
            throw ContentResourceError.invalidResource("Qurʾān-Katalog enthält nicht 114 Sūren")
        }
        let ids = catalog.surahs.map(\.id)
        guard Set(ids).count == 114, ids.min() == 1, ids.max() == 114 else {
            throw ContentResourceError.invalidResource("Qurʾān-Sūren-IDs sind nicht kanonisch")
        }
    }

    static func validate(surah: QuranSurah) throws {
        guard surah.id >= 1, surah.id <= 114,
              surah.verses.count == surah.totalVerses,
              surah.verses.map(\.id) == Array(1...surah.totalVerses),
              surah.verses.allSatisfy({ !$0.arabicText.isEmpty && !$0.germanTranslation.isEmpty }) else {
            throw ContentResourceError.invalidResource("Qurʾān-Sūrah (surah.id) ist ungültig")
        }
    }
}
