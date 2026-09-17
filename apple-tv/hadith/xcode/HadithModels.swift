import Foundation

struct HadithRecord: Codable, Identifiable {
    let id: String
    let language: String
    let narratorLine: String
    let speakerLabel: String
    let textMarkdown: String
    let source: String
    let grade: String
    let verificationNote: String?
}

extension HadithRecord {
    var attributedHadith: AttributedString {
        (try? AttributedString(markdown: textMarkdown)) ?? AttributedString(textMarkdown)
    }
}