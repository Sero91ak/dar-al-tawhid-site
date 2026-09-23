import SwiftUI

private enum DarAlLaylHadithCardStyle {
    static let cornerRadius: CGFloat = 34
    static let primaryText = Color(red: 0.94, green: 0.89, blue: 0.78)
    static let secondaryText = Color(red: 0.72, green: 0.66, blue: 0.54)
    static let mutedText = Color(red: 0.58, green: 0.55, blue: 0.48)
    static let goldLine = Color(red: 0.76, green: 0.60, blue: 0.32)
    static let cardTop = Color(red: 0.055, green: 0.075, blue: 0.13)
    static let cardBottom = Color(red: 0.025, green: 0.035, blue: 0.07)
    static let cardStroke = Color(red: 0.70, green: 0.56, blue: 0.30)
}

struct HadithCardView: View {
    let hadith: HadithRecord
    let showsSharh: Bool

    init(hadith: HadithRecord, showsSharh: Bool = false) {
        self.hadith = hadith
        self.showsSharh = showsSharh
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(hadith.narratorLine)
                .font(.system(size: 32, weight: .semibold, design: .serif))
                .tracking(0.5)
                .foregroundStyle(DarAlLaylHadithCardStyle.secondaryText)

            Spacer().frame(height: 14)

            Text(bodyText)
                .lineSpacing(11)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 1280, alignment: .leading)
                .foregroundStyle(DarAlLaylHadithCardStyle.primaryText)

            Spacer().frame(height: 18)

            sourceView

            if showsSharh, hadith.hasVerifiedSharh, let sharh = hadith.attributedSharh {
                Spacer().frame(height: 26)
                sharhDivider
                Spacer().frame(height: 20)
                sharhView(sharh)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .multilineTextAlignment(.leading)
        .padding(.horizontal, 52)
        .padding(.vertical, 44)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: .black.opacity(0.38), radius: 28, x: 0, y: 18)
        .accessibilityElement(children: .combine)
    }

    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: DarAlLaylHadithCardStyle.cornerRadius, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        DarAlLaylHadithCardStyle.cardTop,
                        DarAlLaylHadithCardStyle.cardBottom
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: DarAlLaylHadithCardStyle.cornerRadius, style: .continuous)
            .stroke(
                LinearGradient(
                    colors: [
                        DarAlLaylHadithCardStyle.cardStroke.opacity(0.52),
                        DarAlLaylHadithCardStyle.cardStroke.opacity(0.16)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1.2
            )
    }

    private var bodyText: AttributedString {
        var result = AttributedString(hadith.speakerLabel + " ")
        result.font = .system(size: 39, weight: .semibold, design: .serif)

        let text = hadith.attributedHadith
        result.append(text)
        return result
    }

    private var sourceView: some View {
        HStack(alignment: .firstTextBaseline, spacing: 7) {
            Text("Quelle:")
                .font(.system(size: 21, weight: .semibold, design: .serif))

            Text(hadith.displayedSource)
                .font(.system(size: 21, weight: .regular, design: .serif))
        }
        .foregroundStyle(DarAlLaylHadithCardStyle.mutedText)
    }

    private var sharhDivider: some View {
        Rectangle()
            .fill(DarAlLaylHadithCardStyle.goldLine.opacity(0.42))
            .frame(width: 560, height: 1)
            .accessibilityHidden(true)
    }

    private func sharhView(_ sharh: AttributedString) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ŠARḤ")
                .font(.system(size: 23, weight: .semibold, design: .serif))
                .tracking(1.6)
                .foregroundStyle(DarAlLaylHadithCardStyle.goldLine.opacity(0.88))

            Text(sharh)
                .font(.system(size: 29, weight: .regular, design: .serif))
                .lineSpacing(8)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 1180, alignment: .leading)
                .foregroundStyle(DarAlLaylHadithCardStyle.primaryText.opacity(0.92))

            if let source = hadith.displayedSharhSource {
                HStack(alignment: .firstTextBaseline, spacing: 7) {
                    Text("Quelle des Šarḥs:")
                        .font(.system(size: 19, weight: .semibold, design: .serif))

                    Text(source)
                        .font(.system(size: 19, weight: .regular, design: .serif))
                }
                .foregroundStyle(DarAlLaylHadithCardStyle.mutedText)
                .padding(.top, 2)
            }
        }
    }
}

/// Apple-TV-Bildschirmschoner: Ḥadīṯ/Āṯar, Quelle und geprüfter Šarḥ.
/// Keine Logos in der Karte; Gestaltung nur über Farbe, Schrift, Linie und Fläche.
struct HadithScreensaverCardView: View {
    let hadith: HadithRecord

    var body: some View {
        HadithCardView(hadith: hadith, showsSharh: true)
    }
}

/// Hadith-Bibliothek in Test-App/iOS: gleicher Datensatz, ebenfalls mit geprüftem Šarḥ.
/// Keine Logos in der Karte; Gestaltung nur über Farbe, Schrift, Linie und Fläche.
struct HadithLibraryCardView: View {
    let hadith: HadithRecord

    var body: some View {
        HadithCardView(hadith: hadith, showsSharh: true)
    }
}
