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
                if #available(iOS 13.0, *) {
                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: 1.0)
                } else {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                }
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
