import SwiftUI

struct DARGlassCard<Content: View>: View {
    private let content: Content
    private let emphasized: Bool

    init(emphasized: Bool = false, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.emphasized = emphasized
    }

    var body: some View {
        content
            .padding(18)
            .background {
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(emphasized ? Color.white.opacity(0.11) : Color.white.opacity(0.065))
                    .overlay {
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [.white.opacity(0.24), .white.opacity(0.05)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    }
            }
            .shadow(color: .black.opacity(0.24), radius: 20, y: 10)
    }
}
