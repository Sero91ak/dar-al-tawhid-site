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

            if hadith.hasVerifiedSharh, let sharh = hadith.attributedSharh {
                Spacer().frame(height: 22)
                sharhDivider
                Spacer().frame(height: 18)
                sharhView(sharh)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .multilineTextAlignment(.leading)
        .accessibilityElement(children: .combine)
    }

    private var bodyText: AttributedString {
        var result = AttributedString(hadith.speakerLabel + " ")
        result.font = .system(size: 38, weight: .semibold, design: .rounded)

        let text = hadith.attributedHadith
        result.append(text)
        return result
    }

    private var sourceView: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("Quelle:")
                .font(.system(size: 22, weight: .semibold, design: .rounded))

            Text(hadith.displayedSource)
                .font(.system(size: 22, weight: .regular, design: .default))
        }
        .foregroundStyle(.secondary)
    }

    private var sharhDivider: some View {
        Rectangle()
            .fill(.secondary.opacity(0.28))
            .frame(width: 520, height: 1)
            .accessibilityHidden(true)
    }

    private func sharhView(_ sharh: AttributedString) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("SHARḤ")
                .font(.system(size: 24, weight: .semibold, design: .serif))
                .tracking(1.4)
                .foregroundStyle(.secondary)

            Text(sharh)
                .font(.system(size: 29, weight: .regular, design: .serif))
                .lineSpacing(7)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 1180, alignment: .leading)
                .foregroundStyle(.primary.opacity(0.92))

            if let source = hadith.displayedSharhSource {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text("Quelle des Sharḥs:")
                        .font(.system(size: 19, weight: .semibold, design: .rounded))

                    Text(source)
                        .font(.system(size: 19, weight: .regular, design: .default))
                }
                .foregroundStyle(.secondary)
                .padding(.top, 2)
            }
        }
    }
}
