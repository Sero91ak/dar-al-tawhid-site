import SwiftUI
import WidgetKit

struct DarWatchEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
}

struct DarWatchProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarWatchEntry {
        DarWatchEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarWatchEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarWatchEntry>) -> Void) {
        Task {
            var snap = DarWidgetStore.load()
            if let live = await DarWidgetRemote.fetchDaily() {
                snap = DarWidgetRemote.applyLive(live, to: snap)
            }
            snap = DarDailyContent.refresh(snap)
            DarWidgetStore.save(snap, reload: false)
            let now = Date()
            var entries: [DarWatchEntry] = []
            for minute in stride(from: 0, to: 60, by: 5) {
                let date = now.addingTimeInterval(Double(minute * 60))
                entries.append(DarWatchEntry(date: date, snapshot: DarDailyContent.refresh(snap, date: date)))
            }
            completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(3600))))
        }
    }
}

private struct WatchPrayerFace: View {
    let entry: DarWatchEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let snap = entry.snapshot
        let gold = Color(red: 0.86, green: 0.75, blue: 0.52)
        Group {
            if family == .accessoryCircular {
                VStack(spacing: 0) {
                    Text(shortName(snap.nextPrayerName))
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                    Text(snap.nextPrayerTime)
                        .font(.system(size: 12, weight: .semibold, design: .rounded).monospacedDigit())
                }
                .widgetAccentable()
            } else if family == .accessoryInline {
                Text("\(shortName(snap.nextPrayerName)) \(snap.nextPrayerTime)")
                    .widgetAccentable()
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    Text(snap.nextPrayerName)
                        .font(.system(size: 13, weight: .semibold, design: .serif))
                        .foregroundStyle(gold)
                    Text(snap.nextPrayerTime)
                        .font(.system(size: 16, weight: .semibold, design: .rounded).monospacedDigit())
                    Text(snap.nextPrayerRemaining)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }

    private func shortName(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "FAJR" }
        if n.contains("dhuhr") || n.contains("zuhr") { return "DHUHR" }
        if n.contains("asr") || n.contains("aṣr") { return "ASR" }
        if n.contains("maghrib") { return "MGRB" }
        if n.contains("isha") || n.contains("ishā") { return "ISHA" }
        return String(name.prefix(5)).uppercased()
    }
}

struct PrayerWatchWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.watch.prayer", provider: DarWatchProvider()) { entry in
            WatchPrayerFace(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Nächstes Gebet auf der Apple Watch.")
        .supportedFamilies(Self.families)
    }

    private static var families: [WidgetFamily] {
        #if os(watchOS)
        return [.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner]
        #else
        return [.accessoryCircular, .accessoryRectangular, .accessoryInline]
        #endif
    }
}

@main
struct DarWatchWidgets: WidgetBundle {
    var body: some Widget {
        PrayerWatchWidget()
    }
}
