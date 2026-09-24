import SwiftUI
import WidgetKit

/// Single WidgetKit entry point. Timeline completes synchronously.
/// No AppIntent color editor, no remote fetch, no duplicate kinds.
struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        makeEntry(Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(makeEntry(Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        let now = Date()
        var snap = DarDailyContent.refresh(DarWidgetStore.load(), date: now)
        DarWidgetStore.save(snap, reload: false)
        let entry = DarEntry(date: now, snapshot: snap, look: .app)
        let nextPrayer = DarPrayerEngine.nextTarget(from: snap.prayers, now: now).target
        let fallback = Calendar.current.date(byAdding: .minute, value: 15, to: now) ?? now.addingTimeInterval(900)
        let next = min(nextPrayer ?? fallback, fallback)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func makeEntry(_ date: Date) -> DarEntry {
        let snap = DarDailyContent.refresh(DarWidgetStore.load(), date: date)
        return DarEntry(date: date, snapshot: snap, look: .app)
    }
}

struct PrayerTimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.timer", provider: DarTimelineProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName("Nächstes Gebet")
        .description("Countdown und nächste Gebetszeit.")
        .supportedFamilies(Self.timerFamilies)
    }

    fileprivate static var timerFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

/// Preserves homescreen widgets that still use the pre-timer kind.
struct LegacyPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer", provider: DarTimelineProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Nächstes Gebet auf dem Home-Bildschirm.")
        .supportedFamilies(PrayerTimerWidget.timerFamilies)
    }
}

struct PrayerListWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.list", provider: DarTimelineProvider()) { entry in
            PrayerListView(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten-Liste")
        .description("Fajr bis Isha, gleiche Zeiten wie in der App.")
        .supportedFamilies(Self.listFamilies)
    }

    private static var listFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline]
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
        StaticConfiguration(kind: "de.daraltawhid.widget.qibla", provider: DarTimelineProvider()) { entry in
            QiblaCompassView(entry: entry)
        }
        .configurationDisplayName("Qibla")
        .description("Öffnet den Kompass in der App.")
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
        .configurationDisplayName("Ayah des Tages")
        .description("Deutscher Wortlaut.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DuaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.dua", provider: DarTimelineProvider()) { entry in
            DuaContentView(entry: entry)
        }
        .configurationDisplayName("Dua des Tages")
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
        .description("Hidschra und nächstes Gebet.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimerWidget()
        LegacyPrayerWidget()
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
