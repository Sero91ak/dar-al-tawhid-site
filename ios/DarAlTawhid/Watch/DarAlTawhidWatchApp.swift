import SwiftUI
import WidgetKit

@main
struct DarAlTawhidWatchApp: App {
    var body: some Scene {
        WindowGroup {
            PrayerWatchView()
        }
    }
}

struct PrayerWatchView: View {
    @State private var snap = DarDailyContent.refresh(DarWidgetStore.load())

    var body: some View {
        let gold = Color(red: 0.86, green: 0.75, blue: 0.52)
        let ink = Color(red: 0.03, green: 0.04, blue: 0.05)
        TimelineView(.periodic(from: .now, by: 30)) { context in
            let live = DarDailyContent.refresh(snap, date: context.date)
            ScrollView {
                VStack(alignment: .leading, spacing: 6) {
                    Text("DAR AL TAWḤĪD")
                        .font(.system(size: 11, weight: .semibold, design: .serif))
                        .foregroundStyle(gold)
                    Text(live.nextPrayerName)
                        .font(.system(size: 18, weight: .medium, design: .serif))
                    Text(live.nextPrayerTime)
                        .font(.system(size: 28, weight: .semibold, design: .serif).monospacedDigit())
                        .foregroundStyle(gold)
                    Text(live.nextPrayerRemaining)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                    Text(live.cityLabel)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                    Divider().overlay(gold.opacity(0.35))
                    ForEach(live.prayers.filter { $0.id != "sunrise" }) { slot in
                        HStack {
                            Text(slot.name)
                            Spacer()
                            Text(slot.time)
                                .monospacedDigit()
                        }
                        .font(.system(size: 13, weight: slot.name == live.nextPrayerName ? .semibold : .regular))
                        .foregroundStyle(slot.name == live.nextPrayerName ? gold : .primary)
                    }
                }
                .padding(.horizontal, 4)
            }
            .background(ink.ignoresSafeArea())
        }
        .task {
            snap = DarDailyContent.refresh(DarWidgetStore.load())
            if let live = await DarWidgetRemote.fetchDaily() {
                snap = DarDailyContent.refresh(DarWidgetRemote.applyLive(live, to: snap))
                DarWidgetStore.save(snap, reload: true)
            }
        }
        .onAppear {
            snap = DarDailyContent.refresh(DarWidgetStore.load())
        }
    }
}
