import UIKit

enum DarHaptics {
    enum Kind: String {
        case light
        case medium
        case success
        case selection
    }

    static func play(_ kind: Kind) {
        DispatchQueue.main.async {
            switch kind {
            case .light:
                UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.72)
            case .medium:
                UIImpactFeedbackGenerator(style: .soft).impactOccurred(intensity: 0.86)
            case .success:
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case .selection:
                UISelectionFeedbackGenerator().selectionChanged()
            }
        }
    }

    static func play(raw: String) {
        play(Kind(rawValue: raw) ?? .light)
    }
}
