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

                            Text("Hier stellst du ein, wie die Kinder-App Geschichten zeigt und vorliest.")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.58))
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Text("Altersgerecht")
                                        .font(.headline)
                                        .foregroundStyle(KidsTheme.cream)
                                    Spacer()
                                    Text(appState.ageBand.rawValue)
                                        .font(.headline)
                                        .foregroundStyle(KidsTheme.gold)
                                }

                                Picker("Altersstufe", selection: $appState.ageBand) {
                                    ForEach(AgeBand.allCases) { age in
                                        Text(age.rawValue).tag(age)
                                    }
                                }
                                .pickerStyle(.segmented)

                                Text(appState.ageBand.subtitle)
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.62))
                            }
                        }

                        KidsCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Was ändert sich?")
                                    .font(.headline)
                                    .foregroundStyle(KidsTheme.cream)

                                ageRule("4–5", "Nur Audio", "Große Bilder. Kein Lesetext in der Geschichte.", active: appState.ageBand == .age4to5)
                                ageRule("6–7", "Audio + kurz lesen", "Kurze, einfache Absätze zum Mitlesen.", active: appState.ageBand == .age6to7)
                                ageRule("8–10", "Audio + lesen + Quellen", "Vollständiger Lesetext und Qurʾān-Quellen.", active: appState.ageBand == .age8to10)
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
                                Text("Geschichten-Regel")
                                    .font(.headline)
                                    .foregroundStyle(KidsTheme.cream)

                                Text("Propheten- und Glaubensgeschichten werden auf Qurʾān, authentischer Sunnah und geprüften Āṯār aufgebaut. Erfundenes wird nicht als überlieferte Geschichte ausgegeben.")
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

    private func ageRule(_ age: String, _ title: String, _ detail: String, active: Bool) -> some View {
        HStack(alignment: .top, spacing: 11) {
            ZStack {
                Circle()
                    .fill(active ? KidsTheme.gold.opacity(0.2) : Color.white.opacity(0.05))
                    .frame(width: 38, height: 38)

                Text(age)
                    .font(.caption2.weight(.heavy))
                    .foregroundStyle(active ? KidsTheme.gold : .white.opacity(0.55))
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)
                Text(detail)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.56))
            }

            Spacer()
        }
    }
}
