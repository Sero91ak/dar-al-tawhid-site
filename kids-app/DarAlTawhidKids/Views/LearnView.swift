import SwiftUI

struct LearnView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Lernen")
                                .font(.system(size: 30, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.cream)
                            Text("Hören · verstehen · wiederholen")
                                .font(.system(size: 15, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.62))
                        }

                        ForEach(SampleContent.learnCards) { card in
                            KidsCard {
                                HStack(spacing: 16) {
                                    ZStack {
                                        Circle()
                                            .fill(tint(for: card.tintName).opacity(0.16))
                                            .frame(width: 58, height: 58)
                                        Image(systemName: card.symbol)
                                            .font(.system(size: 24))
                                            .foregroundStyle(tint(for: card.tintName))
                                    }

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(card.title)
                                            .font(.system(size: 20, weight: .bold, design: .rounded))
                                            .foregroundStyle(KidsTheme.cream)
                                        Text(card.subtitle)
                                            .font(.system(size: 14, weight: .medium, design: .rounded))
                                            .foregroundStyle(.white.opacity(0.58))
                                    }

                                    Spacer()

                                    Text("bald")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(.white.opacity(0.42))
                                }
                            }
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Qurʾān-Regel", systemImage: "waveform")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(KidsTheme.gold)
                                Text("Rezitation wird später ausschließlich mit echten, sauber lizenzierten Audioaufnahmen eingebunden. Die synthetische Stimme ist nur für Erklärungen und Geschichten vorgesehen.")
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.64))
                            }
                        }
                    }
                    .padding(18)
                    .padding(.bottom, 28)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private func tint(for name: String) -> Color {
        switch name {
        case "gold": return KidsTheme.gold
        case "sky": return KidsTheme.sky
        case "sage": return KidsTheme.sage
        case "peach": return KidsTheme.peach
        default: return KidsTheme.cream
        }
    }
}
