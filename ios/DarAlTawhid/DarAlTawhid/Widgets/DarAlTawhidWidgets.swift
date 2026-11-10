import SwiftUI
import WidgetKit
import AppIntents
import ActivityKit

struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        Task {
            completion(await Self.makeTimeline(look: .app))
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
        for second in stride(from: 0, through: 120, by: 30) {
            let date = now.addingTimeInterval(Double(second))
            entries.append(DarEntry(date: date, snapshot: DarDailyContent.refresh(snap, date: date), look: look))
        }
        for minute in stride(from: 3, through: 30, by: 3) {
            let date = now.addingTimeInterval(Double(minute * 60))
            entries.append(DarEntry(date: date, snapshot: DarDailyContent.refresh(snap, date: date), look: look))
        }
        let nextPrayer = DarPrayerEngine.nextTarget(from: snap.prayers, now: now).target
        let fallback = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
        let next = nextPrayer ?? fallback
        return Timeline(entries: entries, policy: .after(min(next, fallback)))
    }
}

struct DarIntentProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()), look: .app)
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
        .configurationDisplayName(DarNativeCopy.text(.widgetNextPrayerTitle))
        .description(Text(DarNativeCopy.text(.widgetNextPrayerDesc)))
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

struct PrayerListWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer.list", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerListView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetTimesTitle))
        .description(Text(DarNativeCopy.text(.widgetTimesDesc)))
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
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer.day", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerDayView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetDayTitle))
        .description(Text(DarNativeCopy.text(.widgetDayDesc)))
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
        .configurationDisplayName(DarNativeCopy.text(.widgetQiblaTitle))
        .description(Text(DarNativeCopy.text(.widgetQiblaDesc)))
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.today", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            TodayContentView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetTodayTitle))
        .description(Text(DarNativeCopy.text(.widgetTodayDesc)))
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct AyahWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.ayah", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            AyahContentView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetAyahTitle))
        .description(Text(DarNativeCopy.text(.widgetAyahDesc)))
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DuaWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.dua", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            DuaContentView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetDuaTitle))
        .description(Text(DarNativeCopy.text(.widgetDuaDesc)))
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LockDatePrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.date", provider: DarTimelineProvider()) { entry in
            LockDatePrayerView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetLockDateTitle))
        .description(Text(DarNativeCopy.text(.widgetLockDateDesc)))
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

struct LockHijriPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.hijri", provider: DarTimelineProvider()) { entry in
            LockHijriPrayerView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetLockHijriTitle))
        .description(Text(DarNativeCopy.text(.widgetLockHijriDesc)))
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

/// Prayer countdown on the Lock Screen and Dynamic Island.
/// iOS owns the dimensions; we keep the presentation compact and theme-neutral.
@available(iOSApplicationExtension 16.1, *)
struct DarPrayerLiveWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DarPrayerLiveAttributes.self) { context in
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("DĀR AL TAWḤĪD").font(.caption2).tracking(1.1)
                    Text(context.state.prayerName).font(.headline)
                    Text(context.state.city).font(.caption).lineLimit(1)
                }
                Spacer(minLength: 4)
                if context.state.targetDate > Date() {
                    Text(timerInterval: Date()...context.state.targetDate, countsDown: true)
                        .monospacedDigit().font(.title3.bold())
                } else {
                    Text(DarNativeCopy.text(.livePrayerTime)).font(.caption.bold())
                }
            }
            .padding(16)
            .foregroundStyle(Color(red: 0.92, green: 0.85, blue: 0.68))
            .activityBackgroundTint(Color(red: 0.05, green: 0.09, blue: 0.08))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("DĀR AL TAWḤĪD").font(.caption2)
                        Text(context.state.prayerName).font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.targetDate > Date() {
                        Text(timerInterval: Date()...context.state.targetDate, countsDown: true)
                            .monospacedDigit().font(.headline)
                    } else {
                        Text(DarNativeCopy.text(.livePrayerTime)).font(.caption2)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.city).font(.caption).lineLimit(1)
                }
            } compactLeading: {
                Text(context.state.prayerName.prefix(3)).font(.caption2.bold())
            } compactTrailing: {
                if context.state.targetDate > Date() {
                    Text(timerInterval: Date()...context.state.targetDate, countsDown: true)
                        .monospacedDigit().font(.caption2)
                        .frame(maxWidth: 55)
                } else {
                    Text(DarNativeCopy.text(.liveNow)).font(.caption2)
                }
            } minimal: {
                Image(systemName: "moon.stars.fill")
            }
            .keylineTint(Color(red: 0.84, green: 0.72, blue: 0.48))
        }
    }
}

/// Legacy kind from older builds — keeps existing home-screen widgets working after upgrades.
struct LegacyPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "de.daraltawhid.widget.prayer", intent: DarWidgetColorIntent.self, provider: DarIntentProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName(DarNativeCopy.text(.widgetNextPrayerTitle))
        .description(Text(DarNativeCopy.text(.widgetLegacyDesc)))
        .supportedFamilies(PrayerTimerWidget.timerFamilies)
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimerWidget()
        if #available(iOSApplicationExtension 16.1, *) {
            DarPrayerLiveWidget()
        }
        LegacyPrayerWidget()
        PrayerListWidget()
        PrayerDayWidget()
        LockDatePrayerWidget()
        LockHijriPrayerWidget()
        QiblaWidget()
        TodayWidget()
        AyahWidget()
        DuaWidget()
        if #available(iOSApplicationExtension 18.0, *) {
            DarPrayerControlWidget()
            DarQiblaControlWidget()
        }
    }
}
