import SwiftUI
import WidgetKit

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
}

private enum Face {
    static func brand(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold) }
    static func hero(_ n: CGFloat) -> Font { .system(size: n, weight: .medium, design: .rounded) }
    static func title(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold, design: .serif) }
    static func text(_ n: CGFloat) -> Font { .system(size: n, weight: .regular, design: .serif) }
    static func ui(_ n: CGFloat) -> Font { .system(size: n, weight: .medium) }
    static func micro() -> Font { .system(size: 9, weight: .semibold) }
}

struct WidgetChrome<Content: View>: View {
    let palette: DarWidgetPalette
    let content: Content

    init(palette: DarWidgetPalette, @ViewBuilder content: () -> Content) {
        self.palette = palette
        self.content = content()
    }

    var body: some View {
        content
            .padding(familyPadding)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetBackground(palette)
    }

    private var familyPadding: CGFloat { 10 }
}

struct BrandLine: View {
    let palette: DarWidgetPalette
    let title: String

    var body: some View {
        HStack(spacing: 6) {
            Text("DAR AL TAWḤID")
                .font(Face.brand(10))
                .tracking(0.4)
                .foregroundStyle(palette.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(title)
                .font(Face.micro())
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(palette.gold.opacity(0.12))
                .clipShape(Capsule())
            Spacer(minLength: 0)
        }
    }
}

private struct DarAura: View {
    let palette: DarWidgetPalette
    var body: some View {
        ZStack {
            palette.ink
            LinearGradient(
                colors: [palette.gold.opacity(0.14), Color.clear],
                startPoint: .topLeading,
                endPoint: .center
            )
            LinearGradient(
                colors: [Color.clear, palette.panel.opacity(0.55)],
                startPoint: .center,
                endPoint: .bottom
            )
        }
    }
}

extension View {
    @ViewBuilder
    func widgetBackground(_ palette: DarWidgetPalette) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { DarAura(palette: palette) }
        } else {
            background(DarAura(palette: palette))
        }
    }
}

private struct CountdownRing: View {
    let progress: Double
    let palette: DarWidgetPalette
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(palette.gold.opacity(0.14), lineWidth: 4)
            Circle()
                .trim(from: 0, to: min(1, max(0.04, progress)))
                .stroke(
                    palette.gold,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

private struct PrayerChip: View {
    let slot: DarPrayerSlot
    let active: Bool
    let palette: DarWidgetPalette

    var body: some View {
        HStack {
            Text(slot.name)
                .font(Face.ui(12.5))
            Spacer()
            Text(slot.time)
                .font(Face.ui(12.5))
        }
        .foregroundStyle(active ? palette.gold : palette.cream.opacity(0.78))
        .padding(.horizontal, active ? 8 : 0)
        .padding(.vertical, active ? 5 : 2)
        .background(active ? palette.gold.opacity(0.14) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

private enum PrayerLock {
    static func shortName(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "FAJR" }
        if n.contains("dhuhr") || n.contains("zuhr") { return "DHUHR" }
        if n.contains("asr") { return "ASR" }
        if n.contains("maghrib") { return "MGRB" }
        if n.contains("isha") { return "ISHA" }
        if n.contains("shur") || n.contains("sunrise") || n.contains("sonne") { return "SHUR" }
        return String(name.prefix(5)).uppercased()
    }

    static func symbol(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "sunrise.fill" }
        if n.contains("dhuhr") { return "sun.max.fill" }
        if n.contains("asr") { return "sun.haze.fill" }
        if n.contains("maghrib") { return "sunset.fill" }
        if n.contains("isha") { return "moon.stars.fill" }
        return "moon.stars.fill"
    }
}

struct LockCirclePrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: date)
        ZStack {
            AccessoryWidgetBackground()
            Gauge(value: min(1, max(0.04, progress))) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .widgetAccentable()
            VStack(spacing: 0) {
                Image(systemName: PrayerLock.symbol(snap.nextPrayerName))
                    .font(.system(size: 9, weight: .semibold))
                    .widgetAccentable()
                Text(PrayerLock.shortName(snap.nextPrayerName))
                    .font(.system(size: 9, weight: .heavy, design: .rounded))
                    .tracking(0.4)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .widgetAccentable()
                Text(snap.nextPrayerTime)
                    .font(.system(size: 11, weight: .bold, design: .rounded).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .offset(y: 1)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: date)
        HStack(spacing: 8) {
            Gauge(value: min(1, max(0.04, progress))) {
                Image(systemName: PrayerLock.symbol(snap.nextPrayerName))
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .frame(width: 36, height: 36)
            .widgetAccentable()
            VStack(alignment: .leading, spacing: 1) {
                Text(snap.nextPrayerName)
                    .font(.system(size: 13, weight: .semibold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .widgetAccentable()
                Text("\(snap.nextPrayerTime)  ·  \(snap.nextPrayerRemaining)")
                    .font(.system(size: 11, weight: .medium, design: .rounded).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            Spacer(minLength: 0)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockInlinePrayer: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        ViewThatFits(in: .horizontal) {
            Label("\(snap.nextPrayerName)  \(snap.nextPrayerTime)  ·  \(snap.nextPrayerRemaining)", systemImage: PrayerLock.symbol(snap.nextPrayerName))
            Label("\(snap.nextPrayerName)  \(snap.nextPrayerTime)", systemImage: PrayerLock.symbol(snap.nextPrayerName))
            Text("\(PrayerLock.shortName(snap.nextPrayerName)) \(snap.nextPrayerTime)")
        }
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayerStrip: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        let slots = snap.prayers.filter { $0.id != "sunrise" }.prefix(5)
        HStack(spacing: 5) {
            ForEach(Array(slots)) { slot in
                VStack(spacing: 1) {
                    Text(PrayerLock.shortName(slot.name))
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .opacity(slot.name == snap.nextPrayerName ? 1 : 0.55)
                    Text(slot.time)
                        .font(.system(size: 10, weight: .semibold, design: .rounded).monospacedDigit())
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                        .opacity(slot.name == snap.nextPrayerName ? 1 : 0.55)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct PrayerTimerView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        if family == .accessoryCircular {
            LockCirclePrayer(snap: snap, date: entry.date)
        } else if family == .accessoryRectangular {
            LockBarPrayer(snap: snap, date: entry.date)
        } else if family == .accessoryInline {
            LockInlinePrayer(snap: snap)
        } else {
        let slots = snap.prayers.filter { $0.id != "sunrise" }
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: entry.date)
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: "Gebet")
                if family == .systemSmall {
                    HStack(spacing: 8) {
                        ZStack {
                            CountdownRing(progress: progress, palette: p, size: 64)
                            VStack(spacing: 0) {
                                Text(snap.nextPrayerName)
                                    .font(Face.micro())
                                    .foregroundStyle(p.muted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                                Text(snap.nextPrayerTime)
                                    .font(Face.hero(15))
                                    .foregroundStyle(p.gold)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(snap.nextPrayerRemaining)
                                .font(Face.ui(12))
                                .foregroundStyle(p.cream)
                                .lineLimit(2)
                                .minimumScaleFactor(0.75)
                            Text(snap.cityLabel)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                        }
                    }
                } else {
                    HStack(alignment: .center, spacing: 14) {
                        ZStack {
                            CountdownRing(progress: progress, palette: p, size: family == .systemLarge || extraLarge ? 96 : 84)
                            VStack(spacing: 1) {
                                Text(snap.nextPrayerName)
                                    .font(Face.ui(11))
                                    .foregroundStyle(p.muted)
                                    .lineLimit(1)
                                Text(snap.nextPrayerTime)
                                    .font(Face.hero(extraLarge || family == .systemLarge ? 22 : 18))
                                    .foregroundStyle(p.gold)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.75)
                            }
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            ForEach(family == .systemMedium ? slots : snap.prayers) { slot in
                                PrayerChip(slot: slot, active: slot.name == snap.nextPrayerName, palette: p)
                            }
                        }
                    }
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
        }
    }

    private var extraLarge: Bool {
        if #available(iOSApplicationExtension 17.0, *) {
            return family == .systemExtraLarge
        }
        return false
    }
}

struct PrayerListView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        if family == .accessoryRectangular {
            LockBarPrayerStrip(snap: snap)
        } else if family == .accessoryInline {
            let slots = snap.prayers.filter { $0.id != "sunrise" }.prefix(3)
            let line = slots.map { "\(PrayerLock.shortName($0.name)) \($0.time)" }.joined(separator: " · ")
            Text(line)
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else {
        let slots = family == .systemSmall ? snap.prayers.filter { $0.id != "sunrise" } : snap.prayers
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 6) {
                BrandLine(palette: p, title: "Zeiten")
                ForEach(slots) { slot in
                    PrayerChip(slot: slot, active: slot.name == snap.nextPrayerName, palette: p)
                }
                if family != .systemSmall {
                    Text("\(snap.nextPrayerRemaining)  ·  \(snap.cityLabel)")
                        .font(Face.ui(11))
                        .foregroundStyle(p.muted)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
        }
    }
}

struct PrayerDayView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: snap.cityLabel)
                if family != .systemSmall {
                    Text("\(snap.nextPrayerName)  \(snap.nextPrayerTime)")
                        .font(Face.hero(20))
                        .foregroundStyle(p.gold)
                    Text(snap.nextPrayerRemaining)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                }
                let columns = family == .systemSmall ? 2 : 3
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: columns), spacing: 8) {
                    ForEach(snap.prayers) { slot in
                        VStack(alignment: .leading, spacing: 1) {
                            Text(slot.name)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                            Text(slot.time)
                                .font(Face.hero(family == .systemSmall ? 17 : 19))
                                .foregroundStyle(slot.name == snap.nextPrayerName ? p.gold : p.cream)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .background(slot.name == snap.nextPrayerName ? p.gold.opacity(0.12) : p.gold.opacity(0.04))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct QiblaCompassView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let deg = entry.snapshot.qiblaDegrees
        if family == .accessoryCircular {
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "location.north.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.primary)
                    .rotationEffect(.degrees(deg))
            }
            .widgetURL(DarDeepLink.Destination.qibla.url)
        } else {
            WidgetChrome(palette: p) {
                VStack(alignment: .leading, spacing: 8) {
                    BrandLine(palette: p, title: "Qibla")
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().stroke(p.gold.opacity(0.12), lineWidth: 8)
                            Image(systemName: "location.north.fill")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(p.gold)
                                .rotationEffect(.degrees(deg))
                        }
                        .frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(String(format: "%.0f°", deg))
                                .font(Face.hero(26))
                                .foregroundStyle(p.gold)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            Text("Mekka")
                                .font(Face.ui(13))
                                .foregroundStyle(p.cream)
                            Text(entry.snapshot.cityLabel)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                        }
                    }
                }
            }
            .widgetURL(DarDeepLink.Destination.qibla.url)
        }
    }
}

struct TodayContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Heute")
                Text(snap.postTitle.isEmpty ? "Tagesbeitrag" : snap.postTitle)
                    .font(Face.title(family == .systemSmall ? 15 : 18))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 3 : 2)
                if family != .systemSmall {
                    Text(snap.recommendationBody)
                        .font(Face.text(14))
                        .foregroundStyle(p.muted)
                        .lineLimit(family == .systemLarge ? 5 : 3)
                }
                if family == .systemLarge {
                    Text(snap.duaGerman)
                        .font(Face.text(14))
                        .foregroundStyle(p.cream.opacity(0.9))
                        .lineLimit(3)
                }
                Spacer(minLength: 0)
                if !snap.postCategory.isEmpty {
                    Text(snap.postCategory)
                        .font(Face.micro())
                        .foregroundStyle(p.gold)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.home.url)
    }
}

struct AyahContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Āyah")
                Text(snap.ayahGerman)
                    .font(Face.text(family == .systemSmall ? 14.5 : 16.5))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 4 : 5)
                    .minimumScaleFactor(0.82)
                if family != .systemSmall, !snap.ayahTranslit.isEmpty {
                    Text(snap.ayahTranslit)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
                Text(snap.ayahRef)
                    .font(Face.micro())
                    .foregroundStyle(p.gold)
            }
        }
        .widgetURL(DarDeepLink.Destination.quran.url)
    }
}

struct DuaContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Duʿāʾ")
                if family != .systemSmall {
                    Text(snap.duaTitle)
                        .font(Face.title(16))
                        .foregroundStyle(p.cream)
                        .lineLimit(2)
                }
                Text(snap.duaGerman)
                    .font(Face.text(family == .systemSmall ? 14.5 : 15.5))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 5 : 6)
                    .minimumScaleFactor(0.82)
                if family != .systemSmall, !snap.duaTranslit.isEmpty {
                    Text(snap.duaTranslit)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                        .lineLimit(2)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.duas.url)
    }
}
