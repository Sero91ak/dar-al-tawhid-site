import SwiftUI

struct QiblaView: View {
    @Environment(\.darTheme) private var theme
    @State private var snapshot = DARNextWidgetSnapshot.empty

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                VStack(spacing: 8) {
                    Text("Qibla")
                        .font(.system(.largeTitle, design: .serif).weight(.bold))
                        .foregroundStyle(theme.cream)
                    Text(snapshot.cityLabel.isEmpty ? "Richtung zur Kaʿba" : snapshot.cityLabel)
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                }
                compass
                DARGlassCard {
                    Label("Ausrichtung", systemImage: "location.north.fill")
                        .font(.headline)
                        .foregroundStyle(theme.cream)
                    Text("\(snapshot.qiblaDegrees, specifier: "%.0f")° von Norden")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(theme.goldLight)
                    Text("Die genaue Ausrichtung wird aus dem Standort und den vorhandenen DAR-Daten berechnet.")
                        .font(.footnote)
                        .foregroundStyle(theme.secondaryText)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 24)
            .padding(.bottom, 110)
        }
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Qibla")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { snapshot = DARNextWidgetStore.load() }
    }

    private var compass: some View {
        ZStack {
            Circle()
                .fill(.white.opacity(0.06))
                .frame(width: 250, height: 250)
                .overlay { Circle().strokeBorder(theme.gold.opacity(0.4), lineWidth: 2) }
            ForEach(0..<4, id: \.self) { index in
                Rectangle()
                    .fill(theme.secondaryText.opacity(0.35))
                    .frame(width: 1, height: 220)
                    .rotationEffect(.degrees(Double(index) * 45))
            }
            Image(systemName: "location.north.fill")
                .font(.system(size: 74, weight: .medium))
                .foregroundStyle(theme.royalGradient)
                .rotationEffect(.degrees(snapshot.qiblaDegrees))
            Text("N")
                .font(.caption.weight(.bold))
                .foregroundStyle(theme.cream)
                .offset(y: -105)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Qibla-Richtung")
        .accessibilityValue("\(snapshot.qiblaDegrees, specifier: "%.0f") Grad von Norden")
    }
}
