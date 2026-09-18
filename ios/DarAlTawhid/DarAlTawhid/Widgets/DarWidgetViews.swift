import SwiftUI
import WidgetKit
import AppIntents
import UIKit

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
    var look: DarWidgetLook = .app
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
    var showFooter: Bool = true
    let content: Content

    init(
        palette: DarWidgetPalette,
        dest: DarDeepLink.Destination,
        showFooter: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.palette = palette
        self.dest = dest
        self.showFooter = showFooter
        self.content = content()
    }

    var body: some View {
        VStack(spacing: 0) {
            content
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            if showFooter {
                WidgetFooterBrand(palette: palette)
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 12)
        .padding(.bottom, showFooter ? 5 : 10)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .clipped()
        .widgetBackground(palette)
        .widgetURL(dest.url)
    }
}

struct WidgetFooterBrand: View {
    let palette: DarWidgetPalette
    var size: CGFloat = 9

    var body: some View {
        Text(DarWidgetTheme.brandName)
            .font(.system(size: size, weight: .semibold, design: .serif))
            .tracking(0.16)
            .foregroundStyle(palette.brandInk.opacity(0.72))
            .lineLimit(1)
            .minimumScaleFactor(0.55)
            .allowsTightening(true)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 4)
    }
}

private struct DarBrandLogo: View {
    let palette: DarWidgetPalette
    var compact: Bool = false

    private var size: CGFloat { compact ? 28 : 34 }

    var body: some View {
        ZStack {
            Circle()
                .fill(palette.panel.opacity(compact ? 0.62 : 0.55))
            Circle()
                .stroke(palette.gold.opacity(0.48), lineWidth: 1)
            Image("BrandMark")
                .resizable()
                .scaledToFit()
                .padding(compact ? 5 : 6)
        }
        .frame(width: size, height: size)
    }
}

struct BrandLine: View {
    let palette: DarWidgetPalette
    let title: String
    var compact: Bool = false

    var body: some View {
        HStack(alignment: .center, spacing: compact ? 7 : 9) {
            DarBrandLogo(palette: palette, compact: compact)
            VStack(alignment: .leading, spacing: compact ? 1 : 2) {
                Text(DarWidgetTheme.brandName)
                    .font(.system(size: compact ? 8.5 : 9.5, weight: .bold))
                    .tracking(compact ? 0.1 : 0.14)
                    .foregroundStyle(palette.brandInk)
                    .lineLimit(1)
                    .minimumScaleFactor(0.48)
                    .allowsTightening(true)
                Text(title)
                    .font(.system(size: compact ? 9 : 10, weight: .medium))
                    .foregroundStyle(palette.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                    .allowsTightening(true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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

private struct WidgetScale {
    let header: CGFloat
    let pill: CGFloat
    let label: CGFloat
    let countdown: CGFloat
    let row: CGFloat
    let footer: CGFloat

    static func forFamily(_ family: WidgetFamily) -> WidgetScale {
        switch family {
        case .systemSmall:
            return WidgetScale(header: 10, pill: 9.5, label: 10.5, countdown: 24, row: 10.5, footer: 8.5)
        case .systemMedium:
            return WidgetScale(header: 10.5, pill: 10, label: 11.5, countdown: 32, row: 11, footer: 9)
        case .systemLarge:
            return WidgetScale(header: 11, pill: 10.5, label: 12, countdown: 36, row: 11.5, footer: 9.5)
        case .systemExtraLarge:
            return WidgetScale(header: 12, pill: 11, label: 13, countdown: 42, row: 12, footer: 10)
        default:
            return WidgetScale(header: 10, pill: 10, label: 11, countdown: 24, row: 11, footer: 9)
        }
    }
}

private enum MawaqitPrayerLabel {
    static func short(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "Fajr" }
        if n.contains("dhuhr") || n.contains("zuhr") { return "Dhuhr" }
        if n.contains("asr") || n.contains("aṣr") { return "Asr" }
        if n.contains("maghrib") { return "Maghrib" }
        if n.contains("isha") || n.contains("ishā") { return "Isha" }
        return name
    }
}

private struct InfoPill: View {
    let text: String
    let palette: DarWidgetPalette
    var icon: String? = nil
    var size: CGFloat = 10

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: size - 1, weight: .semibold))
                    .foregroundStyle(palette.gold)
            }
            Text(text)
                .font(Face.ui(size).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .foregroundStyle(palette.cream)
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(palette.panel.opacity(0.5))
        .clipShape(Capsule(style: .continuous))
    }
}

private struct HijriDateBox: View {
    let text: String
    let palette: DarWidgetPalette
    var compact: Bool = false

    var body: some View {
        Text(text)
            .font(Face.text(compact ? 11 : 13))
            .foregroundStyle(palette.cream)
            .multilineTextAlignment(.leading)
            .lineLimit(compact ? 3 : 4)
            .minimumScaleFactor(0.72)
            .padding(.horizontal, compact ? 9 : 10)
            .padding(.vertical, compact ? 9 : 10)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .background(palette.panel.opacity(0.45))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(palette.line.opacity(0.28), lineWidth: 0.8)
            )
    }
}

private struct LiveCountdown: View {
    let now: Date
    let target: Date?
    let palette: DarWidgetPalette
    let size: CGFloat

    var body: some View {
        Group {
            if let target, target > now {
                Text(timerInterval: now...target, countsDown: true)
            } else {
                Text("0:00")
            }
        }
        .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
        .foregroundStyle(palette.timeInk)
        .lineLimit(1)
        .minimumScaleFactor(0.62)
        .multilineTextAlignment(.center)
    }
}

private struct MawaqitCountdownBlock: View {
    let entry: DarEntry
    let palette: DarWidgetPalette
    let scale: WidgetScale
    var centered: Bool = false
    var showTimePill: Bool = true

    var body: some View {
        let snap = entry.snapshot
        let target = DarPrayerEngine.nextTarget(from: snap.prayers, now: entry.date).target
        VStack(alignment: centered ? .center : .leading, spacing: centered ? 3 : 2) {
            Text(DarPrayerEngine.countdownHeadline(for: snap.nextPrayerName, on: entry.date))
                .font(Face.ui(scale.label))
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            LiveCountdown(now: entry.date, target: target, palette: palette, size: scale.countdown)
            if showTimePill {
                InfoPill(text: snap.nextPrayerTime, palette: palette, size: scale.pill)
            }
        }
        .frame(maxWidth: .infinity, alignment: centered ? .center : .leading)
    }
}

private struct MawaqitPrayerRow: View {
    let slot: DarPrayerSlot
    let active: Bool
    let palette: DarWidgetPalette
    var size: CGFloat = 11

    var body: some View {
        HStack(spacing: 6) {
            if active {
                RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                    .fill(palette.gold)
                    .frame(width: 2.5)
            }
            Text(MawaqitPrayerLabel.short(slot.name))
                .font(Face.ui(size))
                .lineLimit(1)
                .minimumScaleFactor(0.68)
            Spacer(minLength: 4)
            Text(slot.time)
                .font(Face.ui(size + 1).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .layoutPriority(1)
        }
        .foregroundStyle(active ? palette.timeInk : palette.cream.opacity(0.92))
        .padding(.vertical, active ? 2 : 1)
    }
}

private struct MawaqitHorizontalPrayers: View {
    let snap: DarWidgetSnapshot
    let palette: DarWidgetPalette
    let scale: WidgetScale

    var body: some View {
        let slots = snap.prayers.filter { $0.id != "sunrise" }
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                ForEach(slots) { slot in
                    let active = slot.name == snap.nextPrayerName
                    VStack(spacing: 4) {
                        Text(MawaqitPrayerLabel.short(slot.name))
                            .font(Face.ui(scale.row - 1))
                            .lineLimit(1)
                            .minimumScaleFactor(0.55)
                        Text(slot.time)
                            .font(Face.ui(scale.row).monospacedDigit())
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                    }
                    .foregroundStyle(active ? palette.timeInk : palette.cream.opacity(0.82))
                    .frame(maxWidth: .infinity)
                }
            }
            HStack(spacing: 0) {
                ForEach(slots) { slot in
                    let active = slot.name == snap.nextPrayerName
                    Rectangle()
                        .fill(active ? palette.gold : Color.clear)
                        .frame(height: 2)
                        .padding(.horizontal, 3)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.top, 2)
        }
    }
}

private struct MiniDayGrid: View {
    let snap: DarWidgetSnapshot
    let entry: DarEntry
    let palette: DarWidgetPalette

    var body: some View {
        let rows = DarPrayerEngine.dayRows(from: snap, start: entry.date, count: 2)
        VStack(spacing: 3) {
            HStack {
                Text("Tag")
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("Fajr")
                    .frame(maxWidth: .infinity)
                Text(DarPrayerEngine.hijriParts(for: entry.date).month == 9 ? "Iftar" : "Maghrib")
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            .font(Face.micro())
            .foregroundStyle(palette.muted)
            ForEach(rows) { row in
                HStack {
                    Text(row.tag)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(row.fajr)
                        .font(Face.ui(9).monospacedDigit())
                        .frame(maxWidth: .infinity)
                    Text(row.maghrib)
                        .font(Face.ui(9).monospacedDigit())
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .foregroundStyle(palette.cream.opacity(0.9))
            }
        }
        .padding(.top, 6)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(palette.line.opacity(0.32))
                .frame(height: 0.5)
        }
    }
}

private struct DayScheduleTable: View {
    let snap: DarWidgetSnapshot
    let entry: DarEntry
    let palette: DarWidgetPalette
    let scale: WidgetScale

    var body: some View {
        let rows = DarPrayerEngine.dayRows(from: snap, start: entry.date, count: 4)
        let isRamadan = DarPrayerEngine.hijriParts(for: entry.date).month == 9
        VStack(spacing: 4) {
            HStack {
                Text("Tag").frame(maxWidth: .infinity, alignment: .leading)
                Text("Fajr").frame(maxWidth: .infinity)
                Text(isRamadan ? "Iftar" : "Maghrib").frame(maxWidth: .infinity)
                Text(isRamadan ? "Dauer" : "Zeit").frame(maxWidth: .infinity, alignment: .trailing)
            }
            .font(Face.ui(scale.row - 1))
            .foregroundStyle(palette.muted)
            ForEach(rows) { row in
                HStack {
                    Text(row.tag)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(row.fajr)
                        .font(Face.ui(scale.row).monospacedDigit())
                        .frame(maxWidth: .infinity)
                    Text(row.maghrib)
                        .font(Face.ui(scale.row).monospacedDigit())
                        .frame(maxWidth: .infinity)
                    Text(row.duration)
                        .font(Face.ui(scale.row).monospacedDigit())
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .foregroundStyle(Calendar.current.isDate(row.date, inSameDayAs: entry.date) ? palette.timeInk : palette.cream)
            }
        }
    }
}

private struct PrayerChip: View {
    let slot: DarPrayerSlot
    let active: Bool
    let palette: DarWidgetPalette

    var body: some View {
        HStack(spacing: 4) {
            Text(MawaqitPrayerLabel.short(slot.name))
                .font(Face.ui(11))
                .lineLimit(1)
                .minimumScaleFactor(0.70)
                .allowsTightening(true)
            Spacer(minLength: 4)
            Text(slot.time)
                .font(Face.ui(12).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.75)
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
        let scale = WidgetScale.forFamily(family)
        if family == .accessoryCircular {
            LockCirclePrayer(snap: snap)
        } else if family == .accessoryRectangular {
            LockBarPrayer(snap: snap)
        } else if family == .accessoryInline {
            LockInlinePrayer(snap: snap)
        } else if family == .systemSmall {
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 5) {
                    BrandLine(palette: p, title: snap.cityLabel, compact: true)
                    HStack(alignment: .top, spacing: 8) {
                        HijriDateBox(
                            text: DarPrayerEngine.hijriLabel(for: entry.date),
                            palette: p,
                            compact: true
                        )
                        .frame(maxWidth: .infinity, maxHeight: 78)
                        MawaqitCountdownBlock(
                            entry: entry,
                            palette: p,
                            scale: scale,
                            showTimePill: false
                        )
                        .frame(maxWidth: .infinity)
                    }
                    MiniDayGrid(snap: snap, entry: entry, palette: p)
                }
            }
        } else {
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 7) {
                    BrandLine(palette: p, title: snap.cityLabel)
                    HStack(spacing: 6) {
                        InfoPill(
                            text: DarPrayerEngine.sunriseTime(from: snap.prayers),
                            palette: p,
                            icon: "sunrise.fill",
                            size: scale.pill
                        )
                        InfoPill(
                            text: DarPrayerEngine.hijriShort(for: entry.date),
                            palette: p,
                            size: scale.pill
                        )
                        Spacer(minLength: 0)
                    }
                    Spacer(minLength: 0)
                    MawaqitCountdownBlock(
                        entry: entry,
                        palette: p,
                        scale: scale,
                        centered: true
                    )
                    .padding(.vertical, isExtraLarge ? 6 : 2)
                    Spacer(minLength: 0)
                    MawaqitHorizontalPrayers(snap: snap, palette: p, scale: scale)
                }
            }
        }
    }

    private var isExtraLarge: Bool {
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
        let scale = WidgetScale.forFamily(family)
        let slots = snap.prayers.filter { $0.id != "sunrise" }
        if family == .accessoryRectangular {
            LockBarPrayerStrip(snap: snap)
        } else if family == .accessoryInline {
            Text(slots.prefix(3).map { "\(PrayerLock.shortName($0.name)) \($0.time)" }.joined(separator: " · "))
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else if family == .systemSmall {
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 6) {
                    BrandLine(palette: p, title: snap.cityLabel, compact: true)
                    HStack(spacing: 6) {
                        InfoPill(
                            text: DarPrayerEngine.sunriseTime(from: snap.prayers),
                            palette: p,
                            icon: "sunrise.fill",
                            size: scale.pill
                        )
                        InfoPill(
                            text: DarPrayerEngine.hijriShort(for: entry.date),
                            palette: p,
                            size: scale.pill
                        )
                    }
                    Spacer(minLength: 0)
                    MawaqitCountdownBlock(entry: entry, palette: p, scale: scale, centered: true)
                    Spacer(minLength: 0)
                    MawaqitHorizontalPrayers(snap: snap, palette: p, scale: scale)
                }
            }
        } else {
            WidgetChrome(palette: p, dest: .prayer) {
                VStack(alignment: .leading, spacing: 4) {
                    BrandLine(palette: p, title: snap.cityLabel, compact: family == .systemMedium)
                    HStack(spacing: 8) {
                        InfoPill(
                            text: DarPrayerEngine.sunriseTime(from: snap.prayers),
                            palette: p,
                            icon: "sunrise.fill",
                            size: scale.pill
                        )
                        InfoPill(
                            text: DarPrayerEngine.hijriShort(for: entry.date),
                            palette: p,
                            size: scale.pill
                        )
                    }
                    ForEach(slots) { slot in
                        MawaqitPrayerRow(
                            slot: slot,
                            active: slot.name == snap.nextPrayerName,
                            palette: p,
                            size: scale.row
                        )
                    }
                    if family != .systemMedium {
                        Spacer(minLength: 0)
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
        let scale = WidgetScale.forFamily(family)
        WidgetChrome(palette: p, dest: .prayer) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: snap.cityLabel, compact: family == .systemSmall)
                HStack(alignment: .top, spacing: 10) {
                    HijriDateBox(
                        text: DarPrayerEngine.hijriLabel(for: entry.date),
                        palette: p,
                        compact: family == .systemSmall
                    )
                    .frame(maxWidth: .infinity, maxHeight: family == .systemSmall ? 84 : 108)
                    MawaqitCountdownBlock(
                        entry: entry,
                        palette: p,
                        scale: scale,
                        centered: true
                    )
                    .frame(maxWidth: .infinity)
                }
                DayScheduleTable(snap: snap, entry: entry, palette: p, scale: scale)
                    .padding(.top, 2)
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
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(p.gold)
                                .rotationEffect(.degrees(deg))
                        }
                        .frame(width: 38, height: 38)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(String(format: "%.0f°", deg))
                                .font(Face.hero(family == .systemSmall ? 20 : 24))
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
                                .minimumScaleFactor(0.6)
                                .allowsTightening(true)
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
        WidgetChrome(palette: p, dest: .home) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Heute")
                Text(snap.postTitle.isEmpty ? "Tagesbeitrag" : snap.postTitle)
                    .font(Face.title(family == .systemSmall ? 14 : 17))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 3 : 2)
                    .minimumScaleFactor(0.82)
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
        WidgetChrome(palette: p, dest: .quran) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Āyah")
                Text(snap.ayahGerman)
                    .font(Face.text(family == .systemSmall ? 13.5 : 15.5))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 4 : 5)
                    .minimumScaleFactor(0.78)
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
        WidgetChrome(palette: p, dest: .duas) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Duʿāʾ")
                if family != .systemSmall {
                    Text(snap.duaTitle)
                        .font(Face.title(16))
                        .foregroundStyle(p.cream)
                        .lineLimit(2)
                }
                Text(snap.duaGerman)
                    .font(Face.text(family == .systemSmall ? 13.5 : 15))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 4 : 5)
                    .minimumScaleFactor(0.78)
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
