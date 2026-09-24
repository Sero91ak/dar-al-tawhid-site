import SwiftUI

struct ParentsView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore

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
                                    Text("\(appState.dailyMinutes) Min.")
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
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Text("Lernfortschritt")
                                        .font(.headline)
                                        .foregroundStyle(KidsTheme.cream)
                                    Spacer()
                                    Text("LOKAL")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(KidsTheme.sage)
                                }

                                LazyVGrid(
                                    columns: [
                                        GridItem(.flexible()),
                                        GridItem(.flexible())
                                    ],
                                    spacing: 10
                                ) {
                                    progressStat(
                                        value: "\(progress.completedStoryIDs.count)",
                                        label: "Geschichten verstanden"
                                    )
                                    progressStat(
                                        value: "\(progress.completedDuaIDs.count)",
                                        label: "Duʿāʾ gelernt"
                                    )
                                    progressStat(
                                        value: "\(progress.quizCorrectTotal)",
                                        label: "Quizfragen richtig"
                                    )
                                    progressStat(
                                        value: "\(progress.dailyCompletedSteps.count)/\(dailyStepCount)",
                                        label: "Heute geschafft"
                                    )
                                }

                                Text("Der Fortschritt bleibt auf diesem Gerät. Keine Rangliste und kein Vergleich mit anderen Kindern.")
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.54))
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

    private var dailyStepCount: Int {
        switch appState.ageBand {
        case .age4to5: return 2
        case .age6to8, .age9to10: return 3
        }
    }

    private func progressStat(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 23, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.gold)

            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(.white.opacity(0.5))
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
        .padding(12)
        .background(.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}
