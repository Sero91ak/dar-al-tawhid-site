import SwiftUI

struct DARQuickAction: View {
    let title: String
    let systemImage: String
    let tint: Color

    var body: some View {
        Label(title, systemImage: systemImage)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(tint.opacity(0.82), in: Capsule())
            .accessibilityLabel(title)
    }
}
