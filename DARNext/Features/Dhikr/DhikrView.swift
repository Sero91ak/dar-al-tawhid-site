import SwiftUI

struct DhikrView: View {
    @Environment(\.darTheme) private var theme
    @State private var count = 0
    @State private var target = 33

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Dhikr")
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                    .foregroundStyle(theme.cream)
                Text("Ein ruhiger Zähler für dein tägliches Gedenken.")
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
                    .multilineTextAlignment(.center)
            }
            Spacer()
            Text("\(count)")
                .font(.system(size: 88, weight: .bold, design: .rounded))
                .foregroundStyle(theme.goldLight)
            Text("von \(target)")
                .font(.headline)
                .foregroundStyle(theme.secondaryText)
            Button {
                if count < target { count += 1 }
            } label: {
                Image(systemName: "hand.tap.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.white)
                    .frame(width: 150, height: 150)
                    .background(theme.emerald, in: Circle())
                    .overlay { Circle().strokeBorder(theme.gold.opacity(0.65), lineWidth: 3) }
            }
            .buttonStyle(.plain)
            HStack {
                Picker("Ziel", selection: $target) {
                    Text("33").tag(33)
                    Text("99").tag(99)
                    Text("100").tag(100)
                }
                .pickerStyle(.segmented)
                Button("Zurücksetzen") { count = 0 }
                    .buttonStyle(.bordered)
                    .tint(theme.gold)
            }
            Spacer()
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Dhikr")
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}
