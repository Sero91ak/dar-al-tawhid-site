import SwiftUI

struct DARNavigationIcon: View {
    let systemImage: String
    let isSelected: Bool

    @Environment(\.darTheme) private var theme

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            theme.goldLight.opacity(isSelected ? 0.98 : 0.72),
                            theme.gold.opacity(isSelected ? 0.92 : 0.58),
                            theme.deepNavy
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [.white.opacity(0.62), .clear, .black.opacity(0.45)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                }
                .shadow(
                    color: isSelected ? theme.gold.opacity(0.42) : .black.opacity(0.35),
                    radius: isSelected ? 7 : 4,
                    y: 3
                )

            Circle()
                .trim(from: 0.08, to: 0.78)
                .stroke(theme.deepNavy.opacity(0.92), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                .rotationEffect(.degrees(-38))
                .frame(width: 21, height: 21)

            Image(systemName: systemImage)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(theme.cream)
                .shadow(color: .black.opacity(0.7), radius: 2)
        }
        .frame(width: 30, height: 30)
        .accessibilityHidden(true)
    }
}

struct DARNavigationTabLabel: View {
    let title: String
    let systemImage: String
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 2) {
            DARNavigationIcon(systemImage: systemImage, isSelected: isSelected)
            Text(title)
                .font(.caption2.weight(.semibold))
        }
    }
}
