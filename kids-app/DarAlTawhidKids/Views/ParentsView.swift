import SwiftUI

struct ParentsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 5) {
                            Label("Elternbereich", systemImage: "lock.shield.fill")
                                .font(.system(size: 29, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.cream)
                            Text("In V0.1 noch ohne PIN. Die Sperre folgt im nächsten Schritt.")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.58))
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("Altersstufe")
                                    .font(.headline)
                                    .foregroundStyle(KidsTheme.cream)

                                Picker("Altersstufe", selection: $appState.ageBand) {
                                    ForEach(AgeBand.allCases) { age in
                                        Text(age.rawValue).tag(age)
                                    }
                                }
                                .pickerStyle(.segmented)

                                Text(appState.ageBand.subtitle)
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.58))
                            }
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Text("Tägliche Lernzeit")
                                        .font(.headline)
                                        .foregroundStyle(KidsTheme.cream)
                                    Spacer()
                                    Text("(appState.dailyMinutes) Min.")
                                        .font(.headline)
                                        .foregroundStyle(KidsTheme.gold)
                                }

                                Slider(
                                    value: Binding(
                                        get: { Double(appState.dailyMinutes) },
                                        set: { appState.dailyMinutes = Int($0.rounded()) }
                                    ),
                                    in: 5...20,
                                    step: 1
                                )
                                .tint(KidsTheme.gold)

                                Text("Die App soll ein klares Ende haben und nicht möglichst lange Aufmerksamkeit binden.")
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.58))
                            }
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Geplant")
                                    .font(.headline)
                                    .foregroundStyle(KidsTheme.cream)
                                Text("Eltern-PIN · Kinderprofile · Offline-Pakete · Lernfortschritt · Inhaltsfreigaben · Schlafenszeit-Modus")
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                        }
                    }
                    .padding(18)
                    .padding(.bottom, 28)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}
