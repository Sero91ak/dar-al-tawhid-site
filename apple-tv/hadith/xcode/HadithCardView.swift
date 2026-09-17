import SwiftUI

struct HadithCardView: View {
    let hadith: HadithRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(hadith.narratorLine)
                .font(.system(size: 31, weight: .semibold, design: .rounded))
                .foregroundStyle(.primary)

            Spacer().frame(height: 12)

            Text(bodyText)
                .lineSpacing(10)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 1280, alignment: .leading)

            Spacer().frame(height: 14)

            sourceView
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .multilineTextAlignment(.leading)
        .accessibilityElement(children: .combine)
    }

    private var bodyText: AttributedString {
        var result = AttributedString(hadith.speakerLabel + " ")
        result.font = .system(size: 38, weight: .semibold, design: .rounded)

        var text = hadith.attributedHadith
        result.append(text)
        return result
    }

    private var sourceView: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("Quelle:")
                .font(.system(size: 22, weight: .semibold, design: .rounded))

            Text(hadith.source)
                .font(.system(size: 22, weight: .regular, design: .default))
        }
        .foregroundStyle(.secondary)
    }
}
