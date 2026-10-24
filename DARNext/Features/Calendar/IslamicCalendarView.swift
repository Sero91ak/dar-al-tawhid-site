import SwiftUI

struct IslamicCalendarView: View {
    @Environment(\.darTheme) private var theme
    @State private var snapshot = DARNextWidgetSnapshot.empty

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(snapshot.hijriLabel.isEmpty ? "Islamischer Kalender" : snapshot.hijriLabel)
                        .font(.system(.title, design: .serif).weight(.bold))
                    Text("Tagesübersicht nach Hijri- und gregorianischem Datum")
                        .font(.subheadline)
                }
                .foregroundStyle(theme.cream)
                .listRowBackground(Color.clear)
            }
            Section("Nächste Tage") {
                if snapshot.calendarRows.isEmpty {
                    Text("Kalenderdaten werden über den DAR-Widget-Datensatz bereitgestellt.")
                } else {
                    ForEach(snapshot.calendarRows) { row in
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.weekday)
                                    .font(.headline)
                                Text(row.gregorianDate)
                                    .font(.caption)
                            }
                            Spacer()
                            Text(row.hijriDate)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(theme.goldLight)
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Kalender")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { snapshot = DARNextWidgetStore.load() }
    }
}
