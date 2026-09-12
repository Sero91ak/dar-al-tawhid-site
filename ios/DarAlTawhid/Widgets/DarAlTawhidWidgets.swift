import SwiftUI
import WidgetKit
import AppIntents

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
                    .font(.system(size: compact ? 10 : 12, weight: .bold, design: .serif))
                    .tracking(0.45)
                    .foregroundStyle(DarColors.paleGold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.86)
                    .allowsTightening(true)
                Text(section)
                    .font(.system(size: compact ? 9 : 10.5, weight: .medium))
                    .foregroundStyle(DarColors.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.86)
                    .allowsTightening(true)
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
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetSurface()
            .widgetURL(destination.url)
    }
}

private extension View {
    @ViewBuilder
    func widgetSurface() -> some View {
        if #available(iOS 17.0, *) {
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
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(DarColors.muted)
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text(entry.snapshot.nextPrayerName)
                            .font(.system(size: 19, weight: .semibold, design: .serif))
                            .foregroundStyle(DarColors.cream)
                            .lineLimit(1)
                            .minimumScaleFactor(0.84)
                            .allowsTightening(true)
                        Spacer(minLength: 2)
                        Text(entry.snapshot.nextPrayerTime)
                            .font(.system(size: 25, weight: .bold, design: .rounded).monospacedDigit())
                            .foregroundStyle(DarColors.paleGold)
                            .lineLimit(1)
                            .minimumScaleFactor(0.88)
                    }
                    Text(entry.snapshot.cityLabel)
                        .font(.system(size: 10.5, weight: .medium))
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
                        width: family == .systemSmall ? 60 : 82,
                        height: family == .systemSmall ? 60 : 82
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
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
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

@available(iOS 17.0, *)
private enum DarWidgetAppearance: String, AppEnum {
    case app
    case creme
    case navy
    case green
    case bordeaux
    case black

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Farbbereich")
    static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .app: "Wie in der App",
        .creme: "Creme & Gold",
        .navy: "Nachtblau & Gold",
        .green: "Dunkelgrün & Creme",
        .bordeaux: "Bordeaux & Gold",
        .black: "Schwarz & Creme"
    ]
}

@available(iOS 17.0, *)
private struct DarWidgetSettingsIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Widget gestalten"
    static var description = IntentDescription("Wähle den Farbbereich passend zu deinem Erscheinungsbild.")

    @Parameter(title: "Erscheinungsbild", default: .app)
    var appearance: DarWidgetAppearance
}

@available(iOS 17.0, *)
private struct DarConfiguredEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
    let appearance: DarWidgetAppearance
}

@available(iOS 17.0, *)
private struct DarConfiguredProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DarConfiguredEntry {
        DarConfiguredEntry(
            date: Date(),
            snapshot: DarDailyContent.refresh(DarWidgetStore.load()),
            appearance: .navy
        )
    }

    func snapshot(for configuration: DarWidgetSettingsIntent, in context: Context) async -> DarConfiguredEntry {
        DarConfiguredEntry(
            date: Date(),
            snapshot: DarDailyContent.refresh(DarWidgetStore.load()),
            appearance: configuration.appearance
        )
    }

    func timeline(for configuration: DarWidgetSettingsIntent, in context: Context) async -> Timeline<DarConfiguredEntry> {
        let snapshot = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
        DarWidgetStore.save(snapshot)
        let now = Date()
        let entry = DarConfiguredEntry(date: now, snapshot: snapshot, appearance: configuration.appearance)
        let next = Calendar.current.date(byAdding: .minute, value: 10, to: now)
            ?? now.addingTimeInterval(600)
        return Timeline(entries: [entry], policy: .after(next))
    }
}

@available(iOS 17.0, *)
private struct DarPremiumPalette {
    let background: Color
    let glow: Color
    let panel: Color
    let accent: Color
    let primary: Color
    let secondary: Color

    static func resolve(_ appearance: DarWidgetAppearance, snapshot: DarWidgetSnapshot) -> Self {
        let selected: DarWidgetAppearance
        if appearance == .app {
            switch snapshot.themeId {
            case "light", "eisgold": selected = .creme
            case "royal": selected = .navy
            case "aurora", "dar-al-layl": selected = .green
            case "bordeaux", "soft": selected = .bordeaux
            default: selected = .black
            }
        } else {
            selected = appearance
        }
        switch selected {
        case .creme:
            return Self(background: Color(red: 0.94, green: 0.88, blue: 0.72), glow: .white, panel: .white.opacity(0.22), accent: Color(red: 0.43, green: 0.31, blue: 0.13), primary: Color(red: 0.16, green: 0.12, blue: 0.07), secondary: Color(red: 0.35, green: 0.29, blue: 0.20))
        case .navy:
            return Self(background: Color(red: 0.025, green: 0.075, blue: 0.13), glow: Color(red: 0.16, green: 0.30, blue: 0.48), panel: .white.opacity(0.09), accent: Color(red: 0.94, green: 0.82, blue: 0.52), primary: Color(red: 0.98, green: 0.95, blue: 0.86), secondary: Color(red: 0.73, green: 0.75, blue: 0.72))
        case .green:
            return Self(background: Color(red: 0.025, green: 0.12, blue: 0.09), glow: Color(red: 0.12, green: 0.31, blue: 0.22), panel: .white.opacity(0.08), accent: Color(red: 0.91, green: 0.82, blue: 0.59), primary: Color(red: 0.97, green: 0.94, blue: 0.84), secondary: Color(red: 0.70, green: 0.76, blue: 0.68))
        case .bordeaux:
            return Self(background: Color(red: 0.19, green: 0.035, blue: 0.065), glow: Color(red: 0.40, green: 0.10, blue: 0.16), panel: .white.opacity(0.09), accent: Color(red: 0.93, green: 0.78, blue: 0.48), primary: Color(red: 1.0, green: 0.94, blue: 0.82), secondary: Color(red: 0.80, green: 0.70, blue: 0.64))
        case .black, .app:
            return Self(background: Color(red: 0.025, green: 0.025, blue: 0.022), glow: Color(red: 0.18, green: 0.15, blue: 0.09), panel: .white.opacity(0.07), accent: Color(red: 0.88, green: 0.76, blue: 0.49), primary: Color(red: 0.97, green: 0.94, blue: 0.84), secondary: Color(red: 0.70, green: 0.67, blue: 0.59))
        }
    }
}

@available(iOS 17.0, *)
private struct DarPremiumBackground: View {
    let palette: DarPremiumPalette

    var body: some View {
        ZStack {
            palette.background
            LinearGradient(
                colors: [palette.glow.opacity(0.72), .clear, palette.background.opacity(0.92)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [palette.accent.opacity(0.13), .clear],
                center: .topTrailing,
                startRadius: 2,
                endRadius: 150
            )
        }
    }
}

@available(iOS 17.0, *)
private struct DarPremiumLogo: View {
    let palette: DarPremiumPalette
    var showName = true

    var body: some View {
        HStack(spacing: 7) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(palette.panel)
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(palette.accent.opacity(0.55), lineWidth: 0.8)
                Text("DĀR")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundStyle(palette.primary)
            }
            .frame(width: 29, height: 29)
            if showName {
                Text("DĀR AL TAWḤĪD")
                    .font(.system(size: 12, weight: .bold, design: .serif))
                    .tracking(0.25)
                    .foregroundStyle(palette.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
            }
        }
    }
}

private func darPrayerDate(time: String, after now: Date) -> Date {
    let parts = time.split(separator: ":").compactMap { Int($0) }
    guard parts.count == 2 else { return now.addingTimeInterval(3600) }
    var calendar = Calendar.current
    calendar.timeZone = .current
    var components = calendar.dateComponents([.year, .month, .day], from: now)
    components.hour = parts[0]
    components.minute = parts[1]
    components.second = 0
    let today = calendar.date(from: components) ?? now.addingTimeInterval(3600)
    return today > now ? today : (calendar.date(byAdding: .day, value: 1, to: today) ?? today.addingTimeInterval(86_400))
}

@available(iOS 17.0, *)
private struct DarLivePrayerTimer: View {
    let now: Date
    let target: Date
    let palette: DarPremiumPalette
    let size: CGFloat

    var body: some View {
        Text(timerInterval: now...target, countsDown: true, showsHours: true)
            .font(.system(size: size, weight: .bold, design: .rounded).monospacedDigit())
            .foregroundStyle(palette.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.72)
            .allowsTightening(true)
    }
}

@available(iOS 17.0, *)
private struct DarPrayerCountdownPremiumView: View {
    let entry: DarConfiguredEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let palette = DarPremiumPalette.resolve(entry.appearance, snapshot: entry.snapshot)
        let target = darPrayerDate(time: entry.snapshot.nextPrayerTime, after: entry.date)
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                DarPremiumLogo(palette: palette, showName: family != .systemSmall)
                Spacer(minLength: 5)
                VStack(alignment: .trailing, spacing: 0) {
                    Text(entry.snapshot.nextPrayerName)
                        .font(.system(size: 13, weight: .semibold, design: .serif))
                    Text("als Nächstes")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(palette.secondary)
                }
                .foregroundStyle(palette.primary)
            }
            HStack(spacing: 6) {
                Label(entry.snapshot.cityLabel, systemImage: "location.fill")
                Spacer(minLength: 3)
                Text(entry.snapshot.hijriLabel)
            }
            .font(.system(size: 9.5, weight: .medium, design: .serif))
            .foregroundStyle(palette.secondary)
            .lineLimit(1)
            .minimumScaleFactor(0.78)
            Spacer(minLength: 0)
            DarLivePrayerTimer(now: entry.date, target: target, palette: palette, size: family == .systemSmall ? 26 : 34)
                .frame(maxWidth: .infinity, alignment: family == .systemSmall ? .center : .trailing)
            HStack {
                Text(entry.snapshot.nextPrayerTime)
                    .font(.system(size: 14, weight: .bold, design: .rounded).monospacedDigit())
                Spacer()
                Text("Gebetszeiten öffnen  ↗")
                    .font(.system(size: 9, weight: .semibold))
            }
            .foregroundStyle(palette.accent)
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 10)
        .containerBackground(for: .widget) { DarPremiumBackground(palette: palette) }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

@available(iOS 17.0, *)
private struct DarPrayerOverviewPremiumView: View {
    let entry: DarConfiguredEntry

    var body: some View {
        let palette = DarPremiumPalette.resolve(entry.appearance, snapshot: entry.snapshot)
        let slots = entry.snapshot.prayers.filter { $0.id != "sunrise" }
        let target = darPrayerDate(time: entry.snapshot.nextPrayerTime, after: entry.date)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                DarPremiumLogo(palette: palette)
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text("\(entry.snapshot.nextPrayerName) in")
                        .font(.system(size: 10.5, weight: .medium, design: .serif))
                        .foregroundStyle(palette.secondary)
                    DarLivePrayerTimer(now: entry.date, target: target, palette: palette, size: 22)
                }
            }
            HStack(spacing: 5) {
                Label(entry.snapshot.cityLabel, systemImage: "location.fill")
                Spacer(minLength: 4)
                Text(entry.snapshot.hijriLabel)
            }
            .font(.system(size: 9.5, weight: .medium, design: .serif))
            .foregroundStyle(palette.secondary)
            .lineLimit(1)
            HStack(spacing: 5) {
                ForEach(slots.prefix(5)) { slot in
                    VStack(spacing: 2) {
                        Text(slot.name)
                            .font(.system(size: 9.5, weight: .semibold, design: .serif))
                        Text(slot.time)
                            .font(.system(size: 12.5, weight: .bold, design: .rounded).monospacedDigit())
                    }
                    .foregroundStyle(slot.name == entry.snapshot.nextPrayerName ? palette.accent : palette.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(slot.name == entry.snapshot.nextPrayerName ? palette.panel : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .containerBackground(for: .widget) { DarPremiumBackground(palette: palette) }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

@available(iOS 17.0, *)
private struct DarIslamicDayPremiumView: View {
    let entry: DarConfiguredEntry

    var body: some View {
        let palette = DarPremiumPalette.resolve(entry.appearance, snapshot: entry.snapshot)
        let events = Array(entry.snapshot.islamicEvents.prefix(3))
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                DarPremiumLogo(palette: palette)
                Spacer()
                Text("ISLAMISCHER TAG")
                    .font(.system(size: 8.5, weight: .bold))
                    .tracking(0.8)
                    .foregroundStyle(palette.accent)
            }
            HStack(spacing: 10) {
                VStack(spacing: 0) {
                    Text(entry.snapshot.hijriDay)
                        .font(.system(size: 33, weight: .bold, design: .serif))
                    Text(entry.snapshot.hijriMonthYear)
                        .font(.system(size: 9.5, weight: .semibold, design: .serif))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                .foregroundStyle(palette.primary)
                .frame(width: 76)
                .padding(.vertical, 7)
                .background(palette.panel)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 5) {
                    if events.isEmpty {
                        Text(entry.snapshot.hijriLabel)
                            .font(.system(size: 15, weight: .semibold, design: .serif))
                            .foregroundStyle(palette.primary)
                        Text(entry.snapshot.gregorianLabel)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(palette.secondary)
                    } else {
                        ForEach(events) { event in
                            HStack(spacing: 5) {
                                Text(event.title)
                                    .lineLimit(1)
                                Spacer(minLength: 4)
                                Text(event.daysUntil == 0 ? "Heute" : "\(event.daysUntil) T.")
                            }
                            .font(.system(size: 10.5, weight: .semibold, design: .serif))
                            .foregroundStyle(palette.primary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .containerBackground(for: .widget) { DarPremiumBackground(palette: palette) }
        .widgetURL(DarDeepLink.Destination.hash(entry.snapshot.calendarOpenHash).url)
    }
}

private struct PrayerLockWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .accessoryCircular {
                VStack(spacing: 0) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 11, weight: .semibold))
                    Text(entry.snapshot.nextPrayerTime)
                        .font(.system(size: 14, weight: .bold, design: .rounded).monospacedDigit())
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)
                }
            } else if family == .accessoryInline {
                Text("\(entry.snapshot.nextPrayerName) \(entry.snapshot.nextPrayerTime)")
                    .font(.system(size: 13, weight: .semibold, design: .rounded).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.88)
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text(entry.snapshot.nextPrayerName)
                            .font(.system(size: 15, weight: .semibold, design: .serif))
                            .lineLimit(1)
                            .minimumScaleFactor(0.86)
                        Spacer(minLength: 4)
                        Text(entry.snapshot.nextPrayerTime)
                            .font(.system(size: 16, weight: .bold, design: .rounded).monospacedDigit())
                            .lineLimit(1)
                    }
                    Text(entry.snapshot.nextPrayerRemaining)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(1)
                        .minimumScaleFactor(0.86)
                }
            }
        }
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

private struct CalendarLockWidgetView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .accessoryInline {
                Text(entry.snapshot.hijriLabel)
                    .font(.system(size: 13, weight: .semibold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.88)
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.snapshot.hijriLabel)
                        .font(.system(size: 14, weight: .semibold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.86)
                    Text(entry.snapshot.gregorianLabel)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(1)
                        .minimumScaleFactor(0.86)
                }
            }
        }
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.hash(entry.snapshot.calendarOpenHash).url)
    }
}

private struct QiblaLockWidgetView: View {
    let entry: DarEntry

    var body: some View {
        ZStack {
            Circle().stroke(.primary.opacity(0.35), lineWidth: 1)
            Image(systemName: "location.north.fill")
                .font(.system(size: 25, weight: .semibold))
                .rotationEffect(.degrees(entry.snapshot.qiblaDegrees))
        }
        .padding(4)
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.qibla.url)
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

struct PrayerLockWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.prayer", provider: DarTimelineProvider()) {
            PrayerLockWidgetView(entry: $0)
        }
        .configurationDisplayName("Gebet am Sperrbildschirm")
        .description("Nächstes Gebet direkt bei der Uhrzeit.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct CalendarLockWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.calendar", provider: DarTimelineProvider()) {
            CalendarLockWidgetView(entry: $0)
        }
        .configurationDisplayName("Islamisches Datum")
        .description("Islamisches Datum über oder unter der Uhrzeit.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

struct QiblaLockWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.lock.qibla", provider: DarTimelineProvider()) {
            QiblaLockWidgetView(entry: $0)
        }
        .configurationDisplayName("Qibla am Sperrbildschirm")
        .description("Qibla-Richtung direkt am Sperrbildschirm.")
        .supportedFamilies([.accessoryCircular])
    }
}

@available(iOS 17.0, *)
struct DarPrayerCountdownPremiumWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: "de.daraltawhid.widget.premium.countdown",
            intent: DarWidgetSettingsIntent.self,
            provider: DarConfiguredProvider()
        ) {
            DarPrayerCountdownPremiumView(entry: $0)
        }
        .configurationDisplayName("DĀR Gebets-Countdown")
        .description("Sekundengenauer Countdown zum nächsten Gebet.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

@available(iOS 17.0, *)
struct DarPrayerOverviewPremiumWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: "de.daraltawhid.widget.premium.overview",
            intent: DarWidgetSettingsIntent.self,
            provider: DarConfiguredProvider()
        ) {
            DarPrayerOverviewPremiumView(entry: $0)
        }
        .configurationDisplayName("DĀR Gebetsübersicht")
        .description("Countdown und alle Gebetszeiten in einer breiten Übersicht.")
        .supportedFamilies([.systemMedium])
        .contentMarginsDisabled()
    }
}

@available(iOS 17.0, *)
struct DarIslamicDayPremiumWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: "de.daraltawhid.widget.premium.islamicday",
            intent: DarWidgetSettingsIntent.self,
            provider: DarConfiguredProvider()
        ) {
            DarIslamicDayPremiumView(entry: $0)
        }
        .configurationDisplayName("DĀR Islamischer Tag")
        .description("Islamisches Datum und bevorstehende Termine.")
        .supportedFamilies([.systemMedium])
        .contentMarginsDisabled()
    }
}

@main
struct DarAlTawhidWidgets: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        PrayerTimesWidget()
        IslamicCalendarWidget()
        QiblaWidget()
        DailyWidget()
        AyahDuaWidget()
        PrayerLockWidget()
        CalendarLockWidget()
        QiblaLockWidget()
        if #available(iOS 17.0, *) {
            DarPrayerCountdownPremiumWidget()
            DarPrayerOverviewPremiumWidget()
            DarIslamicDayPremiumWidget()
        }
    }
}
