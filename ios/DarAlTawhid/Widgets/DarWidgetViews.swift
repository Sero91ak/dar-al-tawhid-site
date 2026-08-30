import SwiftUI
import WidgetKit
import AppIntents
import UIKit

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
    var look: DarWidgetLook = .eisgold
}

private enum Face {
    static func brand(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold, design: .serif) }
    static func hero(_ n: CGFloat) -> Font { .system(size: n, weight: .medium, design: .serif) }
    static func title(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold, design: .serif) }
    static func text(_ n: CGFloat) -> Font { .system(size: n, weight: .regular, design: .serif) }
    static func ui(_ n: CGFloat) -> Font { .system(size: n, weight: .medium) }
    static func micro() -> Font { .system(size: 9, weight: .semibold, design: .serif) }
}

struct WidgetChrome<Content: View>: View {
    let palette: DarWidgetPalette
    let dest: DarDeepLink.Destination
    let content: Content

    init(palette: DarWidgetPalette, dest: DarDeepLink.Destination, @ViewBuilder content: () -> Content) {
        self.palette = palette
        self.dest = dest
        self.content = content()
    }

    var body: some View {
        content
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetBackground(palette)
            .widgetURL(dest.url)
    }
}

struct BrandLine: View {
    let palette: DarWidgetPalette
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(DarWidgetTheme.brandName)
                .font(Face.brand(13))
                .tracking(0.4)
                .foregroundStyle(palette.brandInk)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
            Text(title)
                .font(.system(size: 11, weight: .semibold, design: .serif))
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
    }
}

private struct DarAura: View {
    let palette: DarWidgetPalette
    var body: some View {
        ZStack {
            palette.ink
            if palette.id == "eisgold" {
                LinearGradient(
                    colors: [
                        palette.panel.opacity(0.96),
                        palette.ink.opacity(0.92),
                        palette.ink
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                RadialGradient(
                    colors: [palette.gold.opacity(0.20), Color.clear],
                    center: .topLeading,
                    startRadius: 4,
                    endRadius: 90
                )
                Color.black.opacity(0.10)
            } else {
                LinearGradient(
                    colors: [
                        palette.panel.opacity(0.9),
                        palette.ink.opacity(0.2),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
    }
}

extension View {
    @ViewBuilder
    func widgetBackground(_ palette: DarWidgetPalette) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) {
                DarAura(palette: palette)
            }
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
            Circle().stroke(palette.gold.opacity(palette.id == "eisgold" ? 0.28 : 0.16), lineWidth: 3)
            Circle()
                .trim(from: 0, to: min(1, max(0.04, progress)))
                .stroke(palette.gold, style: StrokeStyle(lineWidth: 3, lineCap: .round))
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
        HStack(spacing: 6) {
            Text(slot.name)
                .font(Face.ui(13))
                .lineLimit(1)
                .minimumScaleFactor(0.82)
                .allowsTightening(true)
            Spacer(minLength: 6)
            Text(slot.time)
                .font(Face.ui(14).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.85)
                .layoutPriority(1)
        }
        .foregroundStyle(active ? palette.timeInk : palette.cream)
        .padding(.horizontal, active ? 6 : 0)
        .padding(.vertical, active ? 3 : 1)
        .background(active ? palette.gold.opacity(0.14) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

private enum PrayerLock {
    static func shortName(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "FJR" }
        if n.contains("dhuhr") || n.contains("zuhr") { return "ZHR" }
        if n.contains("asr") || n.contains("aṣr") { return "ASR" }
        if n.contains("maghrib") { return "MGH" }
        if n.contains("isha") || n.contains("ishā") { return "ISH" }
        if n.contains("shur") || n.contains("sunrise") || n.contains("sonne") { return "SHR" }
        return String(name.prefix(3)).uppercased()
    }
}

struct LockCirclePrayer: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        VStack(spacing: 1) {
            Text(PrayerLock.shortName(snap.nextPrayerName))
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .widgetAccentable()
            Text(snap.nextPrayerTime)
                .font(.system(size: 13, weight: .semibold, design: .rounded).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .widgetAccentable()
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayer: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(snap.nextPrayerName)
                .font(.system(size: 13, weight: .semibold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .widgetAccentable()
            Text("\(snap.nextPrayerTime)  ·  \(snap.nextPrayerRemaining)")
                .font(.system(size: 12, weight: .medium, design: .rounded).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockInlinePrayer: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        Text("\(PrayerLock.shortName(snap.nextPrayerName)) \(snap.nextPrayerTime)")
            .widgetAccentable()
            .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayerStrip: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        let slots = Array(snap.prayers.filter { $0.id != "sunrise" }.prefix(5))
        let rowA = Array(slots.prefix(3))
        let rowB = Array(slots.dropFirst(3))
        VStack(alignment: .leading, spacing: 4) {
            lockRow(rowA)
            if !rowB.isEmpty { lockRow(rowB) }
        }
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }

    private func lockRow(_ slots: [DarPrayerSlot]) -> some View {
        HStack(spacing: 8) {
            ForEach(slots) { slot in
                HStack(spacing: 4) {
                    Text(PrayerLock.shortName(slot.name))
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                    Text(slot.time)
                        .font(.system(size: 12, weight: .semibold, design: .rounded).monospacedDigit())
                }
                .lineLimit(1)
                .minimumScaleFactor(0.72)
                .allowsTightening(true)
                .opacity(slot.name == snap.nextPrayerName ? 1 : 0.58)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

struct LockDatePrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(DarPrayerEngine.gregorianShort(date))  ·  \(DarPrayerEngine.hijriShort(for: date))")
                .font(.system(size: 11, weight: .semibold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .widgetAccentable()
            Text("\(snap.nextPrayerName)  \(snap.nextPrayerTime)")
                .font(.system(size: 13, weight: .semibold, design: .rounded).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockHijriPrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(DarPrayerEngine.hijriLabel(for: date))
                .font(.system(size: 12, weight: .semibold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .widgetAccentable()
            Text("\(snap.nextPrayerName)  \(snap.nextPrayerTime)")
                .font(.system(size: 13, weight: .semibold, design: .rounded).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct PrayerTimerView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        if family == .accessoryCircular {
            LockCirclePrayer(snap: snap)
        } else if family == .accessoryRectangular {
            LockBarPrayer(snap: snap)
        } else if family == .accessoryInline {
            LockInlinePrayer(snap: snap)
        } else {
            let slots = snap.prayers.filter { $0.id != "sunrise" }
            let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: entry.date)
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 8) {
                    BrandLine(palette: p, title: DarPrayerEngine.hijriShort(for: entry.date))
                    if family == .systemSmall {
                        HStack(alignment: .center, spacing: 8) {
                            ZStack {
                                CountdownRing(progress: progress, palette: p, size: 52)
                                VStack(spacing: 0) {
                                    Text(snap.nextPrayerName)
                                        .font(.system(size: 10, weight: .semibold))
                                        .foregroundStyle(p.muted)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.7)
                                    Text(snap.nextPrayerTime)
                                        .font(Face.hero(15))
                                        .foregroundStyle(p.timeInk)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.7)
                                }
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(snap.nextPrayerRemaining)
                                    .font(Face.ui(13))
                                    .foregroundStyle(p.cream)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                                Text(snap.cityLabel)
                                    .font(.system(size: 11, weight: .medium, design: .serif))
                                    .foregroundStyle(p.muted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    } else {
                        HStack(alignment: .center, spacing: 12) {
                            ZStack {
                                CountdownRing(progress: progress, palette: p, size: extraLarge || family == .systemLarge ? 96 : 86)
                                VStack(spacing: 1) {
                                    Text(snap.nextPrayerName)
                                        .font(Face.ui(12))
                                        .foregroundStyle(p.muted)
                                        .lineLimit(1)
                                    Text(snap.nextPrayerTime)
                                        .font(Face.hero(extraLarge || family == .systemLarge ? 24 : 20))
                                        .foregroundStyle(p.timeInk)
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
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        if family == .accessoryRectangular {
            LockBarPrayerStrip(snap: snap)
        } else if family == .accessoryInline {
            let slots = snap.prayers.filter { $0.id != "sunrise" }.prefix(3)
            Text(slots.map { "\(PrayerLock.shortName($0.name)) \($0.time)" }.joined(separator: " · "))
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else {
            let slots = snap.prayers.filter { $0.id != "sunrise" }
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 3) {
                    BrandLine(palette: p, title: DarPrayerEngine.hijriShort(for: entry.date))
                    ForEach(slots) { slot in
                        PrayerChip(slot: slot, active: slot.name == snap.nextPrayerName, palette: p)
                    }
                    if family != .systemSmall {
                        Spacer(minLength: 2)
                        Text("\(snap.nextPrayerRemaining) · \(snap.cityLabel)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(p.muted)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                }
            }
        }
    }
}

struct PrayerDayView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        WidgetChrome(palette: p, dest: .prayer) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: snap.cityLabel)
                if family != .systemSmall {
                    Text("\(snap.nextPrayerName)  \(snap.nextPrayerTime)")
                        .font(Face.hero(22))
                        .foregroundStyle(p.timeInk)
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
                                .foregroundStyle(slot.name == snap.nextPrayerName ? p.timeInk : p.cream)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(p.gold.opacity(slot.name == snap.nextPrayerName ? 0.45 : 0.14), lineWidth: 0.6)
                        )
                    }
                }
            }
        }
    }
}

struct QiblaCompassView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let deg = entry.snapshot.qiblaDegrees
        if family == .accessoryCircular {
            Text(String(format: "%.0f°", deg))
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.qibla.url)
        } else {
            WidgetChrome(palette: p, dest: .qibla) {
                VStack(alignment: .leading, spacing: 6) {
                    BrandLine(palette: p, title: "Qibla")
                    HStack(alignment: .center, spacing: 8) {
                        ZStack {
                            Circle().stroke(p.gold.opacity(0.22), lineWidth: 0.8)
                            Image(systemName: "location.north.fill")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(p.gold)
                                .rotationEffect(.degrees(deg))
                        }
                        .frame(width: 42, height: 42)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(String(format: "%.0f°", deg))
                                .font(Face.hero(family == .systemSmall ? 22 : 26))
                                .foregroundStyle(p.timeInk)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            Text("Mekka")
                                .font(Face.ui(11))
                                .foregroundStyle(p.cream)
                                .lineLimit(1)
                            Text(entry.snapshot.cityLabel)
                                .font(.system(size: 10, weight: .medium, design: .serif))
                                .foregroundStyle(p.muted)
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
    }
}

struct TodayContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        WidgetChrome(palette: p, dest: .hash(snap.dailyOpenHash)) {
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
                Spacer(minLength: 0)
                Text(snap.postSourceLine.isEmpty ? snap.postCategory : snap.postSourceLine)
                    .font(.system(size: 9, weight: .medium, design: .serif))
                    .foregroundStyle(p.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

struct AyahContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        WidgetChrome(palette: p, dest: .hash(snap.ayahOpenHash)) {
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
                    .foregroundStyle(p.muted)
            }
        }
    }
}

struct DuaContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot, look: entry.look)
        let snap = entry.snapshot
        WidgetChrome(palette: p, dest: .hash(snap.duaOpenHash)) {
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
                    .lineLimit(family == .systemSmall ? 4 : 5)
                    .minimumScaleFactor(0.82)
                Spacer(minLength: 0)
                Text(snap.duaSourceLine.isEmpty ? snap.duaCategory : snap.duaSourceLine)
                    .font(.system(size: 9, weight: .medium, design: .serif))
                    .foregroundStyle(p.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

struct LockDatePrayerView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        if family == .accessoryInline {
            Text("\(DarPrayerEngine.gregorianShort(entry.date)) · \(DarPrayerEngine.hijriShort(for: entry.date))")
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else {
            LockDatePrayer(snap: entry.snapshot, date: entry.date)
        }
    }
}

struct LockHijriPrayerView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        if family == .accessoryInline {
            Text("\(DarPrayerEngine.hijriLabel(for: entry.date)) · \(entry.snapshot.nextPrayerTime)")
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else {
            LockHijriPrayer(snap: entry.snapshot, date: entry.date)
        }
    }
}
