import SwiftUI

struct PrayerView: View {
    @Environment(\.darTheme) private var theme
    @State private var snapshot = DARNextWidgetSnapshot.empty
    @State private var permissions = DARNextPermissionCoordinator()

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                header
                nextPrayerCard
                prayerGrid
                setupCard
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Gebetszeiten")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            snapshot = DARNextWidgetStore.load()
            await permissions.refreshNotificationStatus()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(snapshot.cityLabel.isEmpty ? "Dein Standort" : snapshot.cityLabel)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(theme.goldLight)
            Text("Gebetszeiten mit Ruhe und Klarheit")
                .font(.system(.largeTitle, design: .serif).weight(.bold))
                .foregroundStyle(theme.cream)
            Text("Die Zeiten werden über den gemeinsamen DAR-Widget-Datensatz aktuell gehalten.")
                .font(.subheadline)
                .foregroundStyle(theme.secondaryText)
        }
    }

    private var nextPrayerCard: some View {
        DARGlassCard(emphasized: true) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nächstes Gebet")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                    Text(snapshot.nextPrayerName)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(theme.cream)
                    Text(snapshot.nextPrayerTime)
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.goldLight)
                }
                Spacer()
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(theme.royalGradient)
            }
        }
    }

    private var prayerGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Heute", systemImage: "clock.fill")
                .font(.headline)
                .foregroundStyle(theme.cream)
            if snapshot.prayers.isEmpty {
                DARGlassCard {
                    Text("Noch keine Gebetszeiten im App-Group-Datensatz. Gib den Standort frei und öffne danach DARNext erneut.")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                }
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(snapshot.prayers) { prayer in
                        DARGlassCard {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(prayer.name)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(theme.secondaryText)
                                Text(prayer.time)
                                    .font(.title3.weight(.bold))
                                    .foregroundStyle(theme.cream)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
            }
        }
    }

    private var setupCard: some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Berechtigungen", systemImage: "checkmark.shield.fill")
                    .font(.headline)
                    .foregroundStyle(theme.cream)
                permissionRow("Standort", value: permissions.locationDescription, enabled: permissions.locationStatus == .authorizedWhenInUse || permissions.locationStatus == .authorizedAlways) {
                    permissions.requestLocation()
                }
                permissionRow("Gebetserinnerungen", value: permissions.notificationsEnabled ? "Freigegeben" : "Noch nicht freigegeben", enabled: permissions.notificationsEnabled) {
                    Task { await permissions.requestNotifications() }
                }
                if permissions.locationStatus == .denied || permissions.locationStatus == .restricted {
                    Button("Einstellungen öffnen", action: permissions.openSettings)
                        .buttonStyle(.borderedProminent)
                        .tint(theme.gold)
                }
            }
        }
    }

    private func permissionRow(_ title: String, value: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: enabled ? "checkmark.circle.fill" : "circle.dashed")
                    .foregroundStyle(enabled ? theme.emerald : theme.goldLight)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(theme.cream)
                    Text(value)
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(theme.secondaryText)
            }
        }
        .buttonStyle(.plain)
    }
}
