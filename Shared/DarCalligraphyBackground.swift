import SwiftUI

enum DarCalligraphyVariant: Hashable {
    case app
    case widgetSmall
    case widgetMedium
    case widgetLarge
    case watchCircular
    case watchRectangular
    case watchCorner
    case watchSmartStack
}

enum DarCalligraphyTheme: Hashable {
    case parchment
    case royal
    case green
    case bordeaux
    case layl

    var color: Color {
        switch self {
        case .parchment:
            Color(red: 0.55, green: 0.42, blue: 0.25)
        case .royal:
            Color(red: 0.92, green: 0.82, blue: 0.60)
        case .green:
            Color(red: 0.92, green: 0.84, blue: 0.66)
        case .bordeaux:
            Color(red: 0.93, green: 0.81, blue: 0.60)
        case .layl:
            Color(red: 0.82, green: 0.78, blue: 0.68)
        }
    }

    var baseOpacity: Double {
        switch self {
        case .parchment: 0.032
        case .royal, .green: 0.022
        case .bordeaux: 0.021
        case .layl: 0.017
        }
    }
}

private struct DarCalligraphyLayer: Identifiable, Hashable {
    let id: String
    let text: String
    let x: CGFloat
    let y: CGFloat
    let scale: CGFloat
    let rotation: Double
    let opacityFactor: Double
    let fontFactor: CGFloat
}

struct DarCalligraphyBackground: View {
    let theme: DarCalligraphyTheme
    let variant: DarCalligraphyVariant

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                ForEach(Self.layers[variant, default: []]) { layer in
                    DarCalligraphyTextLayer(
                        layer: layer,
                        availableSize: geometry.size,
                        color: theme.color,
                        baseOpacity: theme.baseOpacity
                    )
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private static let layers: [DarCalligraphyVariant: [DarCalligraphyLayer]] = [
        .app: [
            layer("app-tawhid-1", "التوحيد", 0.68, 0.12, 1.25, -10, 1.00, 0.19),
            layer("app-tahlil-1", "لا إله إلا الله", 0.28, 0.24, 1.10, 7, 0.85, 0.15),
            layer("app-allah-1", "الله", 0.86, 0.37, 1.35, -5, 0.92, 0.20),
            layer("app-iman-1", "الإيمان", 0.22, 0.48, 0.92, 8, 0.72, 0.13),
            layer("app-sunnah-1", "السنة", 0.70, 0.56, 0.88, -7, 0.68, 0.12),
            layer("app-ikhlas-1", "الإخلاص", 0.37, 0.67, 0.92, 6, 0.72, 0.13),
            layer("app-tawhid-2", "التوحيد", 0.78, 0.78, 1.15, 9, 0.82, 0.17),
            layer("app-tahlil-2", "لا إله إلا الله", 0.27, 0.88, 1.05, -6, 0.75, 0.14),
            layer("app-allah-2", "الله", 0.88, 0.96, 1.20, 4, 0.78, 0.18)
        ],
        .widgetSmall: [
            layer("small-tawhid", "التوحيد", 0.68, 0.20, 1.18, -9, 1.00, 0.23),
            layer("small-allah", "الله", 0.22, 0.54, 1.20, 6, 0.72, 0.22),
            layer("small-sunnah", "السنة", 0.78, 0.77, 0.90, -6, 0.65, 0.17)
        ],
        .widgetMedium: [
            layer("medium-tawhid", "التوحيد", 0.27, 0.35, 1.15, -8, 0.95, 0.21),
            layer("medium-tahlil", "لا إله إلا الله", 0.70, 0.28, 1.02, 7, 0.78, 0.17),
            layer("medium-allah", "الله", 0.82, 0.72, 1.12, -4, 0.72, 0.20),
            layer("medium-iman", "الإيمان", 0.25, 0.82, 0.82, 6, 0.62, 0.14)
        ],
        .widgetLarge: [
            layer("large-tawhid-1", "التوحيد", 0.73, 0.13, 1.25, -10, 1.00, 0.18),
            layer("large-tahlil", "لا إله إلا الله", 0.29, 0.27, 1.08, 7, 0.82, 0.15),
            layer("large-allah", "الله", 0.82, 0.43, 1.28, -5, 0.88, 0.20),
            layer("large-iman", "الإيمان", 0.24, 0.56, 0.90, 8, 0.68, 0.13),
            layer("large-sunnah", "السنة", 0.72, 0.65, 0.86, -6, 0.64, 0.12),
            layer("large-ikhlas", "الإخلاص", 0.35, 0.77, 0.92, 6, 0.70, 0.13),
            layer("large-tawhid-2", "التوحيد", 0.78, 0.89, 1.10, 8, 0.76, 0.17)
        ],
        .watchCircular: [
            layer("circular-tawhid", "التوحيد", 0.58, 0.38, 1.10, -7, 0.90, 0.27),
            layer("circular-allah", "الله", 0.32, 0.70, 0.90, 5, 0.62, 0.23)
        ],
        .watchRectangular: [
            layer("rectangular-tawhid", "التوحيد", 0.28, 0.47, 1.00, -8, 0.90, 0.22),
            layer("rectangular-tahlil", "لا إله إلا الله", 0.73, 0.44, 0.88, 6, 0.72, 0.17),
            layer("rectangular-allah", "الله", 0.86, 0.80, 0.74, -4, 0.58, 0.17)
        ],
        .watchCorner: [
            layer("corner-tawhid", "التوحيد", 0.66, 0.36, 1.08, -10, 0.88, 0.27),
            layer("corner-sunnah", "السنة", 0.32, 0.72, 0.78, 7, 0.58, 0.20)
        ],
        .watchSmartStack: [
            layer("stack-tawhid", "التوحيد", 0.29, 0.40, 1.04, -8, 0.90, 0.22),
            layer("stack-tahlil", "لا إله إلا الله", 0.72, 0.40, 0.90, 6, 0.72, 0.17),
            layer("stack-ikhlas", "الإخلاص", 0.50, 0.80, 0.76, -5, 0.56, 0.15)
        ]
    ]

    private static func layer(
        _ id: String,
        _ text: String,
        _ x: CGFloat,
        _ y: CGFloat,
        _ scale: CGFloat,
        _ rotation: Double,
        _ opacityFactor: Double,
        _ fontFactor: CGFloat
    ) -> DarCalligraphyLayer {
        DarCalligraphyLayer(
            id: id,
            text: text,
            x: x,
            y: y,
            scale: scale,
            rotation: rotation,
            opacityFactor: opacityFactor,
            fontFactor: fontFactor
        )
    }
}

private struct DarCalligraphyTextLayer: View {
    let layer: DarCalligraphyLayer
    let availableSize: CGSize
    let color: Color
    let baseOpacity: Double

    var body: some View {
        let baseSize = min(availableSize.width, availableSize.height)

        Text(layer.text)
            .font(.custom("Amiri", fixedSize: baseSize * layer.fontFactor))
            .foregroundStyle(color.opacity(baseOpacity * layer.opacityFactor))
            .fixedSize()
            .scaleEffect(layer.scale)
            .rotationEffect(.degrees(layer.rotation))
            .position(
                x: availableSize.width * layer.x,
                y: availableSize.height * layer.y
            )
            .environment(\.layoutDirection, .rightToLeft)
            .accessibilityHidden(true)
    }
}
