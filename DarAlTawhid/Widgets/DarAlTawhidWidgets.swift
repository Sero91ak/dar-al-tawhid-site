import SwiftUI
import WidgetKit
import AppIntents

struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        Task {
            completion(await Self.makeTimeline(look: .eisgold))
        }
    }

    static func makeTimeline(look: DarWidgetLook) async -> Timeline<DarEntry> {
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
            entries.append(DarEntry(date: date, snapshot: liveSnap, look: look))
        }
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
        return Timeline(entries: entries, policy: .after(next))
    }
}

struct DarIntentProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()), look: .eisgold)
    }

    func snapshot(for configuration: DarWidgetColorIntent, in context: Context) async -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()), look: configuration.look)
    }

    func timeline(for configuration: DarWidgetColorIntent, in context: Context) async -> Timeline<DarEntry> {
        await DarTimelineProvider.makeTimeline(look: configuration.look)
    }
}

struct PrayerTimerWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer.timer", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName("Nächstes Gebet")
        .description("Homescreen und Sperrbildschirm. Farbe unter Bearbeiten wählen.")
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
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer.list", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerListView(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Fajr bis ʿIshāʾ — gleiche Zeiten wie in der App.")
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
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer.day", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerDayView(entry: entry)
        }
        .configurationDisplayName("Tagesgebetszeiten")
        .description("Alle Gebetszeiten des Tages.")
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
        AppIntentConfiguration(kind: "de.daraltawhid.widget.qibla", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            QiblaCompassView(entry: entry)
        }
        .configurationDisplayName("Qibla")
        .description("Öffnet den Kompass in der App.")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.today", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            TodayContentView(entry: entry)
        }
        .configurationDisplayName("Heute empfohlen")
        .description("Aktueller Beitrag.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct AyahWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.ayah", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            AyahContentView(entry: entry)
        }
        .configurationDisplayName("Āyah des Tages")
        .description("Deutscher Wortlaut.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DuaWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.dua", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            DuaContentView(entry: entry)
        }
        .configurationDisplayName("Duʿāʾ des Tages")
        .description("Aktuelles Bittgebet.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LockDatePrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.date", provider: DarTimelineProvider()) { entry in
            LockDatePrayerView(entry: entry)
        }
        .configurationDisplayName("Datum und Gebet")
        .description("Über der Uhr: Datum und nächstes Gebet.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

struct LockHijriPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.hijri", provider: DarTimelineProvider()) { entry in
            LockHijriPrayerView(entry: entry)
        }
        .configurationDisplayName("Hidschra und Gebet")
        .description("Hidschra nach Umm al-Qura und nächstes Gebet.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimerWidget()
        PrayerListWidget()
        PrayerDayWidget()
        LockDatePrayerWidget()
        LockHijriPrayerWidget()
        QiblaWidget()
        TodayWidget()
        AyahWidget()
        DuaWidget()
    }
}
