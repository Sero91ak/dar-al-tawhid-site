import SwiftUI

enum KidsTheme {
    static let night = Color(hex: 0x10233A)
    static let deepNight = Color(hex: 0x07131F)
    static let cream = Color(hex: 0xF7F0E3)
    static let sand = Color(hex: 0xE8D8BA)
    static let gold = Color(hex: 0xC9A967)
    static let sage = Color(hex: 0x8FAE9D)
    static let sky = Color(hex: 0x91B7D2)
    static let peach = Color(hex: 0xD9A68B)

    static let card = Color.white.opacity(0.085)
    static let line = Color.white.opacity(0.12)

    static let pageGradient = LinearGradient(
        colors: [deepNight, night, Color(hex: 0x17314A)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: alpha
        )
    }
}

struct KidsAmbientBackground: View {
    @State private var drift = false

    var body: some View {
        ZStack {
            // Top edge intentionally has no blurred ambient halo.
            KidsTheme.pageGradient

            Circle()
                .fill(KidsTheme.gold.opacity(0.10))
                .frame(width: 260, height: 260)
                .blur(radius: 55)
                .offset(x: drift ? -120 : -70, y: drift ? 310 : 250)

            VStack {
                HStack(spacing: 32) {
                    Image(systemName: "sparkles")
                    Image(systemName: "moon.stars.fill")
                    Image(systemName: "sparkle")
                }
                .font(.system(size: 14, weight: .light))
                .foregroundStyle(.white.opacity(0.14))
                .padding(.top, 60)
                Spacer()
            }
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.easeInOut(duration: 7).repeatForever(autoreverses: true)) {
                drift.toggle()
            }
        }
    }
}

struct KidsCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(KidsTheme.card)
                    .overlay(
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .stroke(KidsTheme.line, lineWidth: 1)
                    )
            )
    }
}
