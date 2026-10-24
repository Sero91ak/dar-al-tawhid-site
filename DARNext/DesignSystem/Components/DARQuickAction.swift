import SwiftUI

struct DARQuickAction: View {
    let title: String
    let systemImage: String
    let tint: Color
    let mediaURL: URL?

    init(
        title: String,
        systemImage: String,
        tint: Color,
        mediaURL: URL? = nil
    ) {
        self.title = title
        self.systemImage = systemImage
        self.tint = tint
        self.mediaURL = mediaURL
    }

    var body: some View {
        VStack(spacing: 9) {
            Group {
                if let mediaURL {
                    DARNextRemoteImage(
                        url: mediaURL,
                        fallbackSystemImage: systemImage
                    )
                } else {
                    Image(systemName: systemImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(12)
                }
            }
            .frame(width: 58, height: 58)
            .background {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [tint.opacity(0.95), tint.opacity(0.45)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay {
                        Circle().strokeBorder(.white.opacity(0.2), lineWidth: 1)
                    }
            }
            .foregroundStyle(.white)
            .shadow(color: tint.opacity(0.3), radius: 10, y: 5)

            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white.opacity(0.9))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, minHeight: 86)
        .contentShape(Rectangle())
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel(title)
    }
}
