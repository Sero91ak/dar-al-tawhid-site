import SwiftUI
import WidgetKit

private let ink = Color(red: 0.02, green: 0.03, blue: 0.02)
private let gold = Color(red: 0.85, green: 0.72, blue: 0.42)
private let cream = Color(red: 0.96, green: 0.94, blue: 0.86)

struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        let snap = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
        DarWidgetStore.save(snap)
        let entry = DarEntry(date: Date(), snapshot: snap)
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
}

struct PrayerWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let snap = entry.snapshot
        VStack(alignment: .leading, spacing: 6) {
            Text("DĀR AL TAWḤĪD")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(gold)
            Text(snap.nextPrayerName)
                .font(.system(size: family == .systemSmall ? 20 : 24, weight: .semibold))
                .foregroundStyle(cream)
            Text(snap.nextPrayerTime)
                .font(.system(size: family == .systemSmall ? 28 : 34, weight: .bold, design: .rounded))
                .foregroundStyle(gold)
            if family != .systemSmall {
                HStack(spacing: 8) {
                    ForEach(snap.prayers.filter { $0.id != "sunrise" }.prefix(5)) { slot in
                        VStack(spacing: 2) {
                            Text(slot.name)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundStyle(cream.opacity(0.7))
                            Text(slot.time)
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundStyle(cream)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            Text(snap.cityLabel)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(cream.opacity(0.55))
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetBackground()
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct QiblaWidgetView: View {
    let entry: DarEntry

    var body: some View {
        let deg = entry.snapshot.qiblaDegrees
        VStack(spacing: 8) {
            Text("Qibla")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(gold)
            ZStack {
                Circle()
                    .stroke(gold.opacity(0.35), lineWidth: 2)
                Image(systemName: "location.north.fill")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(gold)
                    .rotationEffect(.degrees(deg))
            }
            .frame(width: 72, height: 72)
            Text(String(format: "%.1f°", deg))
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(cream)
            Text(entry.snapshot.cityLabel)
                .font(.system(size: 10))
                .foregroundStyle(cream.opacity(0.55))
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
        .widgetURL(DarDeepLink.Destination.qibla.url)
    }
}

struct DailyWidgetView: View {
    let entry: DarEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.snapshot.recommendationTitle.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(gold)
            Text(entry.snapshot.recommendationBody)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(cream)
                .lineLimit(5)
            Spacer(minLength: 0)
            Text("Tippen öffnet den Beitrag")
                .font(.system(size: 10))
                .foregroundStyle(cream.opacity(0.5))
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetBackground()
        .widgetURL(DarDeepLink.Destination.hash(entry.snapshot.dailyOpenHash).url)
    }
}

struct AyahDuaWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Āyah · Duʿāʾ")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(gold)
            Text(entry.snapshot.ayahArabic)
                .font(.system(size: family == .systemSmall ? 16 : 20))
                .foregroundStyle(cream)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: .infinity, alignment: .trailing)
            Text(entry.snapshot.ayahRef)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(gold.opacity(0.85))
            if family != .systemSmall {
                Link(destination: DarDeepLink.Destination.hash(entry.snapshot.duaOpenHash).url) {
                    Text(entry.snapshot.duaTitle + " — " + entry.snapshot.duaText)
                        .font(.system(size: 12))
                        .foregroundStyle(cream.opacity(0.8))
                        .lineLimit(3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetBackground()
        .widgetURL(DarDeepLink.Destination.hash(entry.snapshot.ayahOpenHash).url)
    }
}

private extension View {
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { ink }
        } else {
            background(ink)
        }
    }
}

struct PrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer", provider: DarTimelineProvider()) { entry in
            PrayerWidgetView(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Nächstes Gebet und die Zeiten des Tages auf dem Home-Bildschirm.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct QiblaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.qibla", provider: DarTimelineProvider()) { entry in
            QiblaWidgetView(entry: entry)
        }
        .configurationDisplayName("Qibla")
        .description("Qibla-Richtung vom zuletzt genutzten Standort.")
        .supportedFamilies([.systemSmall])
    }
}

struct DailyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.daily", provider: DarTimelineProvider()) { entry in
            DailyWidgetView(entry: entry)
        }
        .configurationDisplayName("Heute")
        .description("Tagesempfehlung aus DĀR AL TAWḤĪD.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct AyahDuaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.ayah", provider: DarTimelineProvider()) { entry in
            AyahDuaWidgetView(entry: entry)
        }
        .configurationDisplayName("Āyah und Duʿāʾ")
        .description("Täglicher Qurʾān-Vers und ein kurzes Bittgebet.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimesWidget()
        QiblaWidget()
        DailyWidget()
        AyahDuaWidget()
    }
}
