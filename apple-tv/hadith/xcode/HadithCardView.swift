import SwiftUI

struct HadithCardView: View {
    let hadith: HadithRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(hadith.narratorLine)
                .font(.title3.weight(.semibold))

            Spacer().frame(height: 14)

            (Text(hadith.speakerLabel + " ").fontWeight(.semibold) + Text(hadith.attributedHadith))
                .font(.title2)
                .lineSpacing(8)
                .fixedSize(horizontal: false, vertical: true)

            Spacer().frame(height: 14)

            Text("Quelle: \(hadith.source)")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .multilineTextAlignment(.leading)
    }
}