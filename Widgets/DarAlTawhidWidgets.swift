import SwiftUI
import WidgetKit

struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        Task {
            var snap = DarWidgetStore.load()
            if let live = await DarWidgetRemote.fetchDaily() {
                snap = DarWidgetRemote.applyLive(live, to: snap)
            }
            snap = DarDailyContent.refresh(snap)
            DarWidgetStore.save(snap, reload: false)
            let now = Date()
            var entries: [DarEntry] = []
            for minute in 0..<30 {
                let date = now.addingTimeInterval(Double(minute * 60))
                let liveSnap = DarDailyContent.refresh(snap, date: date)
                entries.append(DarEntry(date: date, snapshot: liveSnap))
            }
            let next = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
            completion(Timeline(entries: entries, policy: .after(next)))
        }
    }
}

struct PrayerTimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.timer", provider: DarTimelineProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName("Nächstes Gebet")
        .description("Homescreen, über der Uhr, kleine Kreise und breite Leiste auf dem Sperrbildschirm.")
        .supportedFamilies(Self.timerFamilies)
    }

    private static var timerFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct PrayerListWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.list", provider: DarTimelineProvider()) { entry in
            PrayerListView(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Fajr bis Isha als Liste — mittel, groß, iPad und Sperrbildschirm-Leiste.")
        .supportedFamilies(Self.listFamilies)
    }

    private static var listFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct PrayerDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.day", provider: DarTimelineProvider()) { entry in
            PrayerDayView(entry: entry)
        }
        .configurationDisplayName("Tagesgebetszeiten")
        .description("Alle Gebetszeiten des Tages als Kacheln.")
        .supportedFamilies(Self.dayFamilies)
    }

    private static var dayFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemLarge]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct QiblaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.qibla", provider: DarTimelineProvider()) { entry in
            QiblaCompassView(entry: entry)
        }
        .configurationDisplayName("Qibla")
        .description("Richtung nach Mekka vom letzten Standort. Live-Kompass nur in der App, ohne Dauermessung.")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.today", provider: DarTimelineProvider()) { entry in
            TodayContentView(entry: entry)
        }
        .configurationDisplayName("Heute empfohlen")
        .description("Aktueller Beitrag.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct AyahWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.ayah", provider: DarTimelineProvider()) { entry in
            AyahContentView(entry: entry)
        }
        .configurationDisplayName("Āyah des Tages")
        .description("Deutscher Wortlaut und Lautschrift.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DuaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.dua", provider: DarTimelineProvider()) { entry in
            DuaContentView(entry: entry)
        }
        .configurationDisplayName("Duʿāʾ des Tages")
        .description("Aktuelles Bittgebet auf Deutsch.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimerWidget()
        PrayerListWidget()
        PrayerDayWidget()
        QiblaWidget()
        TodayWidget()
        AyahWidget()
        DuaWidget()
    }
}
