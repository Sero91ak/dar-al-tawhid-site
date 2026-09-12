import SwiftUI
import WidgetKit

private enum DarColors {
    static let navy = Color(red: 0.025, green: 0.075, blue: 0.125)
    static let deepNavy = Color(red: 0.008, green: 0.025, blue: 0.045)
    static let gold = Color(red: 0.84, green: 0.70, blue: 0.39)
    static let paleGold = Color(red: 0.94, green: 0.84, blue: 0.60)
    static let cream = Color(red: 0.97, green: 0.94, blue: 0.84)
    static let muted = Color(red: 0.70, green: 0.72, blue: 0.68)
}

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
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())
            ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
}

private struct DarPattern: View {
    var body: some View {
        GeometryReader { proxy in
            Path { path in
                let step: CGFloat = 34
                var x: CGFloat = -step
                while x < proxy.size.width + step {
                    var y: CGFloat = -step
                    while y < proxy.size.height + step {
                        path.move(to: CGPoint(x: x, y: y + step / 2))
                        path.addLine(to: CGPoint(x: x + step / 2, y: y))
                        path.addLine(to: CGPoint(x: x + step, y: y + step / 2))
                        path.addLine(to: CGPoint(x: x + step / 2, y: y + step))
                        path.closeSubpath()
                        y += step
                    }
                    x += step
                }
            }
            .stroke(DarColors.gold.opacity(0.055), lineWidth: 0.7)
        }
    }
}

private struct DarBackdrop: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [DarColors.navy, DarColors.deepNavy],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [DarColors.gold.opacity(0.16), .clear],
                center: .topLeading,
                startRadius: 0,
                endRadius: 170
            )
            DarPattern()
        }
    }
}

private struct DarMark: View {
    let compact: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(DarColors.deepNavy.opacity(0.88))
            Circle()
                .stroke(DarColors.gold.opacity(0.85), lineWidth: compact ? 0.8 : 1.1)
            Image(systemName: "moon.stars.fill")
                .font(.system(size: compact ? 11 : 14, weight: .medium))
                .foregroundStyle(DarColors.paleGold)
        }
        .frame(width: compact ? 25 : 32, height: compact ? 25 : 32)
    }
}

private struct DarHeader: View {
    let section: String
    var compact = false

    var body: some View {
        HStack(spacing: compact ? 7 : 9) {
            DarMark(compact: compact)
            VStack(alignment: .leading, spacing: 1) {
                Text("DĀR AL TAWḤĪD")
                    .font(.system(size: compact ? 9 : 10.5, weight: .bold, design: .serif))
                    .tracking(0.7)
                    .foregroundStyle(DarColors.paleGold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text(section)
                    .font(.system(size: compact ? 8 : 9.5, weight: .medium))
                    .foregroundStyle(DarColors.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
    }
}

private struct DarCard<Content: View>: View {
    let destination: DarDeepLink.Destination
    let content: Content

    init(destination: DarDeepLink.Destination, @ViewBuilder content: () -> Content) {
        self.destination = destination
        self.content = content()
    }

    var body: some View {
        content
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetSurface()
            .widgetURL(destination.url)
    }
}

private extension View {
    @ViewBuilder
    func widgetSurface() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { DarBackdrop() }
        } else {
            background(DarBackdrop())
        }
    }
}

private struct PrayerTimeCell: View {
    let slot: DarPrayerSlot
    let active: Bool

    var body: some View {
        VStack(spacing: 3) {
            Text(slot.name)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(active ? DarColors.paleGold : DarColors.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(slot.time)
                .font(.system(size: 12, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(DarColors.cream)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(active ? DarColors.gold.opacity(0.14) : Color.white.opacity(0.025))
        .overlay(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .stroke(active ? DarColors.gold.opacity(0.50) : Color.white.opacity(0.08), lineWidth: 0.7)
        )
        .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
    }
}

struct PrayerWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    private var prayerSlots: [DarPrayerSlot] {
        entry.snapshot.prayers.filter { $0.id != "sunrise" }
    }

    var body: some View {
        DarCard(destination: .prayer) {
            VStack(alignment: .leading, spacing: family == .systemSmall ? 9 : 11) {
                DarHeader(section: entry.snapshot.hijriLabel, compact: family == .systemSmall)
                if family == .systemSmall {
                    Spacer(minLength: 0)
                    Text("NÄCHSTES GEBET")
                        .font(.system(size: 8, weight: .bold))
                        .tracking(1.2)
                        .foregroundStyle(DarColors.muted)
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text(entry.snapshot.nextPrayerName)
                            .font(.system(size: 17, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                        Spacer(minLength: 2)
                        Text(entry.snapshot.nextPrayerTime)
                            .font(.system(size: 23, weight: .bold, design: .rounded).monospacedDigit())
                            .foregroundStyle(DarColors.paleGold)
                    }
                    Text(entry.snapshot.cityLabel)
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundStyle(DarColors.muted)
                        .lineLimit(1)
                } else {
                    HStack(alignment: .center, spacing: 14) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("NÄCHSTES GEBET")
                                .font(.system(size: 8, weight: .bold))
                                .tracking(1.1)
                                .foregroundStyle(DarColors.muted)
                            Text(entry.snapshot.nextPrayerName)
                                .font(.system(size: 20, weight: .semibold, design: .serif))
                                .foregroundStyle(DarColors.cream)
                            Text(entry.snapshot.cityLabel)
                                .font(.system(size: 9.5, weight: .medium))
                                .foregroundStyle(DarColors.muted)
                                .lineLimit(1)
                        }
                        Spacer(minLength: 4)
                        Text(entry.snapshot.nextPrayerTime)
                            .font(.system(size: 31, weight: .bold, design: .rounded).monospacedDigit())
                            .foregroundStyle(DarColors.paleGold)
                    }
                    HStack(spacing: 6) {
                        ForEach(prayerSlots.prefix(5)) { slot in
                            PrayerTimeCell(slot: slot, active: slot.name == entry.snapshot.nextPrayerName)
                        }
                    }
                    if family == .systemLarge {
                        Spacer(minLength: 0)
                        HStack {
                            Text(entry.snapshot.gregorianLabel)
                            Spacer()
                            Text("Tippen für alle Gebetszeiten")
                        }
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(DarColors.muted)
                    }
                }
            }
        }
    }
}

struct QiblaWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let degrees = entry.snapshot.qiblaDegrees
        DarCard(destination: .qibla) {
            VStack(alignment: .leading, spacing: 8) {
                DarHeader(section: "Qibla", compact: family == .systemSmall)
                Spacer(minLength: 0)
                HStack(spacing: family == .systemSmall ? 9 : 18) {
                    ZStack {
                        Circle().stroke(DarColors.gold.opacity(0.24), lineWidth: 1)
                        Circle().strokeBorder(
                            DarColors.gold.opacity(0.10),
                            style: StrokeStyle(lineWidth: 5, dash: [1, 7])
                        )
                        Image(systemName: "location.north.fill")
                            .font(.system(size: family == .systemSmall ? 30 : 38, weight: .medium))
                            .foregroundStyle(DarColors.paleGold)
                            .rotationEffect(.degrees(degrees))
                    }
                    .frame(
                        width: family == .systemSmall ? 70 : 88,
                        height: family == .systemSmall ? 70 : 88
                    )
                    VStack(alignment: .leading, spacing: 3) {
                        Text(String(format: "%.1f°", degrees))
                            .font(.system(size: family == .systemSmall ? 21 : 29, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                        Text("Richtung Kaʿbah")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(DarColors.paleGold)
                        Text(entry.snapshot.cityLabel)
                            .font(.system(size: 9.5))
                            .foregroundStyle(DarColors.muted)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }
}

struct DailyWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        DarCard(destination: .hash(entry.snapshot.dailyOpenHash)) {
            VStack(alignment: .leading, spacing: 9) {
                DarHeader(section: "Tagesbeitrag", compact: family == .systemSmall)
                Text(entry.snapshot.postTitle.isEmpty
                     ? entry.snapshot.recommendationTitle
                     : entry.snapshot.postTitle)
                    .font(.system(size: family == .systemSmall ? 16 : 19, weight: .semibold, design: .serif))
                    .foregroundStyle(DarColors.cream)
                    .lineLimit(family == .systemSmall ? 3 : 2)
                    .minimumScaleFactor(0.78)
                if family != .systemSmall {
                    Text(entry.snapshot.recommendationBody)
                        .font(.system(size: 13.5, weight: .regular, design: .serif))
                        .foregroundStyle(DarColors.muted)
                        .lineLimit(3)
                }
                Spacer(minLength: 0)
                HStack {
                    Text(entry.snapshot.postCategory.isEmpty ? "Heute" : entry.snapshot.postCategory)
                        .lineLimit(1)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }
                .font(.system(size: 9.5, weight: .semibold))
                .foregroundStyle(DarColors.paleGold)
            }
        }
    }
}

private struct AyahPanel: View {
    let snapshot: DarWidgetSnapshot
    let compact: Bool

    var body: some View {
        Link(destination: DarDeepLink.Destination.hash(snapshot.ayahOpenHash).url) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("QURʾĀN")
                    Spacer()
                    Image(systemName: "book.closed.fill")
                }
                .font(.system(size: 8.5, weight: .bold))
                .tracking(0.8)
                .foregroundStyle(DarColors.paleGold)
                Text(snapshot.ayahArabic.isEmpty ? "اقْرَأْ بِاسْمِ رَبِّكَ" : snapshot.ayahArabic)
                    .font(.system(size: compact ? 17 : 20, weight: .medium, design: .serif))
                    .foregroundStyle(DarColors.cream)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .lineLimit(compact ? 2 : 3)
                Text(snapshot.ayahRef.isEmpty ? "Qurʾān öffnen" : snapshot.ayahRef)
                    .font(.system(size: 9.5, weight: .semibold))
                    .foregroundStyle(DarColors.muted)
            }
            .padding(10)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color.white.opacity(0.035))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(DarColors.gold.opacity(0.18), lineWidth: 0.7)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}

private struct DuaPanel: View {
    let snapshot: DarWidgetSnapshot
    let compact: Bool

    var body: some View {
        Link(destination: DarDeepLink.Destination.hash(snapshot.duaOpenHash).url) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("DUʿĀʾ")
                    Spacer()
                    Image(systemName: "hands.sparkles.fill")
                }
                .font(.system(size: 8.5, weight: .bold))
                .tracking(0.8)
                .foregroundStyle(DarColors.paleGold)
                Text(snapshot.duaTitle)
                    .font(.system(size: compact ? 14 : 16, weight: .semibold, design: .serif))
                    .foregroundStyle(DarColors.cream)
                    .lineLimit(1)
                Text(snapshot.duaGerman.isEmpty ? snapshot.duaText : snapshot.duaGerman)
                    .font(.system(size: compact ? 11.5 : 13, weight: .regular, design: .serif))
                    .foregroundStyle(DarColors.muted)
                    .lineLimit(compact ? 2 : 4)
                Spacer(minLength: 0)
            }
            .padding(10)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color.white.opacity(0.035))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(DarColors.gold.opacity(0.18), lineWidth: 0.7)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}

struct AyahDuaWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            DarHeader(section: "Āyah & Duʿāʾ", compact: family == .systemSmall)
            if family == .systemSmall {
                AyahPanel(snapshot: entry.snapshot, compact: true)
            } else if family == .systemLarge {
                VStack(spacing: 9) {
                    AyahPanel(snapshot: entry.snapshot, compact: false)
                    DuaPanel(snapshot: entry.snapshot, compact: false)
                }
            } else {
                HStack(spacing: 9) {
                    AyahPanel(snapshot: entry.snapshot, compact: true)
                    DuaPanel(snapshot: entry.snapshot, compact: true)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetSurface()
        .widgetURL(DarDeepLink.Destination.hash(entry.snapshot.ayahOpenHash).url)
    }
}

private struct EventRow: View {
    let event: DarIslamicEvent
    let showCountdown: Bool

    var body: some View {
        HStack(spacing: 9) {
            VStack(spacing: 0) {
                Text(event.hijriDate.components(separatedBy: ".").first ?? "")
                    .font(.system(size: 16, weight: .bold, design: .serif))
                    .foregroundStyle(DarColors.paleGold)
                Text("AH")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundStyle(DarColors.muted)
            }
            .frame(width: 30, height: 34)
            .background(DarColors.gold.opacity(0.10))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 1) {
                Text(event.title)
                    .font(.system(size: 11.5, weight: .semibold, design: .serif))
                    .foregroundStyle(DarColors.cream)
                    .lineLimit(1)
                Text(event.gregorianDate)
                    .font(.system(size: 8.5, weight: .medium))
                    .foregroundStyle(DarColors.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 2)
            if showCountdown {
                Text(event.daysUntil == 0 ? "Heute" : "in \(event.daysUntil) T.")
                    .font(.system(size: 8.5, weight: .bold))
                    .foregroundStyle(DarColors.paleGold)
                    .lineLimit(1)
            }
        }
    }
}

struct IslamicCalendarWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        DarCard(destination: .hash(entry.snapshot.calendarOpenHash)) {
            VStack(alignment: .leading, spacing: family == .systemSmall ? 8 : 10) {
                DarHeader(section: "Islamischer Kalender", compact: family == .systemSmall)
                if family == .systemSmall {
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text(entry.snapshot.hijriDay)
                            .font(.system(size: 37, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.paleGold)
                        Text(entry.snapshot.hijriMonthYear)
                            .font(.system(size: 12, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                            .lineLimit(2)
                    }
                    Text(entry.snapshot.gregorianLabel)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(DarColors.muted)
                        .lineLimit(1)
                    if let next = entry.snapshot.islamicEvents.first {
                        Divider().overlay(DarColors.gold.opacity(0.25))
                        Text(next.title)
                            .font(.system(size: 11, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                            .lineLimit(1)
                        Text(next.daysUntil == 0 ? "Heute" : "in \(next.daysUntil) Tagen")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(DarColors.paleGold)
                    }
                } else {
                    HStack(alignment: .firstTextBaseline) {
                        Text("\(entry.snapshot.hijriDay). \(entry.snapshot.hijriMonthYear)")
                            .font(.system(size: 21, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        Spacer()
                        Text(entry.snapshot.gregorianLabel)
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(DarColors.muted)
                            .lineLimit(1)
                    }
                    Divider().overlay(DarColors.gold.opacity(0.25))
                    let limit = family == .systemLarge ? 5 : 2
                    ForEach(entry.snapshot.islamicEvents.prefix(limit)) { event in
                        EventRow(event: event, showCountdown: true)
                        if event.id != entry.snapshot.islamicEvents.prefix(limit).last?.id {
                            Divider().overlay(Color.white.opacity(0.07))
                        }
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }
}

struct PrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer", provider: DarTimelineProvider()) {
            PrayerWidgetView(entry: $0)
        }
        .configurationDisplayName("DĀR Gebetszeiten")
        .description("Nächstes Gebet und die Gebetszeiten des Tages.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct QiblaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.qibla", provider: DarTimelineProvider()) {
            QiblaWidgetView(entry: $0)
        }
        .configurationDisplayName("DĀR Qibla")
        .description("Qibla-Richtung für den zuletzt verwendeten Standort.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DailyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.daily", provider: DarTimelineProvider()) {
            DailyWidgetView(entry: $0)
        }
        .configurationDisplayName("DĀR Heute")
        .description("Der aktuelle Tagesbeitrag mit direkter Verlinkung.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct AyahDuaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.ayah", provider: DarTimelineProvider()) {
            AyahDuaWidgetView(entry: $0)
        }
        .configurationDisplayName("DĀR Āyah & Duʿāʾ")
        .description("Direkt zum täglichen Qurʾān-Vers oder Duʿāʾ.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct IslamicCalendarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.calendar", provider: DarTimelineProvider()) {
            IslamicCalendarWidgetView(entry: $0)
        }
        .configurationDisplayName("DĀR Islamischer Kalender")
        .description("Islamisches Datum und die nächsten wichtigen Termine.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    var body: some Widget {
        PrayerTimesWidget()
        IslamicCalendarWidget()
        QiblaWidget()
        DailyWidget()
        AyahDuaWidget()
    }
}
