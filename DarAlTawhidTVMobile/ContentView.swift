//
//  ContentView.swift
//  DarAlTawhidTV
//
//  Created by Serhat Abu Malik on 16.09.26.
//

import SwiftUI
import Foundation
import Observation
import UIKit

struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var snapshot = TVSnapshotStore.load()
    @State private var selectedMode: TVDashboardMode = .prayer
    @ObservedObject var quranPlaybackStore: QuranPlaybackStore
    @StateObject private var quranReciterStore = QuranReciterSelectionStore()
    let quranAudio: TVQuranAudioController
    let adhanController: TVAdhanController
    @State private var isShowingAdhanPicker = false
    @State private var isShowingSurahPicker = false
    @State private var isShowingReciterPicker = false
    @State private var lastInteraction = Date()
    let onQuranModeChanged: (Bool) -> Void
    let onOpenHelp: () -> Void

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let live = TVSnapshotStore.refresh(snapshot, date: context.date)
            TVPrayerDashboard(
                snapshot: live,
                date: context.date,
                selectedMode: $selectedMode,
                isShowingAdhanPicker: $isShowingAdhanPicker,
                isShowingSurahPicker: $isShowingSurahPicker,
                isShowingReciterPicker: $isShowingReciterPicker,
                quranAudio: quranAudio,
                quranPlaybackStore: quranPlaybackStore,
                quranReciterStore: quranReciterStore,
                adhanController: adhanController,
                lastInteraction: $lastInteraction,
                onOpenHelp: onOpenHelp
            )
        }
        .focusEffectDisabled(true)
        .environment(\.isFocusEffectEnabled, false)
        .animation(.easeInOut(duration: 0.25), value: adhanController.isPresenting)
        .simultaneousGesture(
            TapGesture().onEnded {
                lastInteraction = Date()
            }
        )
        .task {
            snapshot = TVSnapshotStore.load()
            await quranReciterStore.load()
            await quranPlaybackStore.load(
                surah: quranPlaybackStore.savedSurahNumber,
                reciterIdentifier: quranReciterStore.selectedIdentifier,
                restoreSavedAyah: true,
                autoPlay: true
            )
        }
        .task {
            await adhanController.loadLibrary()
        }
        .task(id: scenePhase) {
            guard scenePhase == .active else { return }
            await refreshCurrentLocation()
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(900))
                guard !Task.isCancelled, scenePhase == .active else { continue }
                await refreshCurrentLocation()
            }
        }
        .task {
            while !Task.isCancelled {
                if scenePhase == .active {
                    let now = Date()
                    let liveSnapshot = TVSnapshotStore.refresh(snapshot, date: now)
                    adhanController.check(
                        now: now,
                        snapshot: liveSnapshot,
                        quranAudio: quranAudio,
                        quranPlaybackStore: quranPlaybackStore
                    )
                }
                try? await Task.sleep(for: .seconds(1))
            }
        }
        .task {
            await AppleTVContentRoot.shared.refresh()
            await AppleTVContentRegistry.shared.refreshLatestContent()
            _ = try? await HadithRemoteService.shared.loadHadithIndex(forceRefresh: true)
        }
        .onChange(of: quranReciterStore.selectedIdentifier) { _, newIdentifier in
            // During startup, the main load task still has to load the first
            // synchronized verse and start autoplay. A reciter-list update must
            // not launch a competing second load before that finishes.
            guard quranReciterStore.loadFinished,
                  quranPlaybackStore.surah != nil else { return }
            Task { await quranPlaybackStore.changeReciter(to: newIdentifier) }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                lastInteraction = Date()
            }
        }
        .onChange(of: selectedMode, initial: true) { _, mode in
            onQuranModeChanged(mode == .quran)
        }
    }

    @MainActor
    private func refreshCurrentLocation() async {
        guard let local = await TVWeatherService.localContext() else { return }

        var updated = snapshot
        updated.cityLabel = local.place
        updated.latitude = local.latitude
        updated.longitude = local.longitude
        updated.fajrAngle = 12
        updated.prayers = TVPrayerEngine.times(
            for: Date(),
            lat: local.latitude,
            lng: local.longitude,
            angle: 12,
            asrFactor: updated.asrFactor
        )
        updated.updatedAt = Date()
        snapshot = TVSnapshotStore.refresh(updated)
        TVSnapshotStore.save(snapshot)
    }
}

enum TVDashboardMode: String, CaseIterable, Identifiable {
    case prayer = "Gebetszeiten"
    case today = "Heute"
    case calendar = "Kalender"
    case quran = "Qurʾān"

    var id: String { rawValue }

    var symbol: String {
        switch self {
        case .prayer: return "clock.badge.checkmark"
        case .today: return "sparkles"
        case .calendar: return "calendar"
        case .quran: return "book.closed.fill"
        }
    }
}

enum TVDashboardFocus: Hashable {
    case mode(TVDashboardMode)
    case contentPrimary
    case quranPlay
    case quranPrevious
    case quranPlayControl
    case quranStop
    case quranNext
    case quranTransliteration
    case quranPrayerTicker
    case adhanPicker
    case screensaver
    case quranPicker
    case reciterPicker
    case help
}

private struct TVPrayerDashboard: View {
    let snapshot: TVSnapshot
    let date: Date
    @Binding var selectedMode: TVDashboardMode
    @Binding var isShowingAdhanPicker: Bool
    @Binding var isShowingSurahPicker: Bool
    @Binding var isShowingReciterPicker: Bool
    let quranAudio: TVQuranAudioController
    let quranPlaybackStore: QuranPlaybackStore
    @ObservedObject var quranReciterStore: QuranReciterSelectionStore
    let adhanController: TVAdhanController
    @Binding var lastInteraction: Date
    let onOpenHelp: () -> Void
    @FocusState private var focusedItem: TVDashboardFocus?
    @State private var didSetInitialFocus = false
    @State private var shouldRestoreQuranAfterReciterPicker = false
    @State private var weather: [TVWeatherSnapshot] = TVWeatherService.initialSnapshots
    @Environment(\.verticalSizeClass) private var verticalSizeClass

    private var nextTarget: TVPrayerTarget {
        TVPrayerEngine.nextTarget(from: snapshot.prayers, now: date)
    }

    private var isOverlayPresented: Bool {
        isShowingAdhanPicker || isShowingSurahPicker || isShowingReciterPicker
    }

    var body: some View {
        ZStack {
            TVStyle.background(date: date)
            TVAmanahPattern(date: date)
            TVAmbientSky(intensity: .subtle)
            TVAtmosphericEffects(weatherCondition: nil, intensity: .subtle)

            GeometryReader { geo in
                if geo.size.height > geo.size.width {
                    mobileLayout(width: min(geo.size.width, UIScreen.main.bounds.width))
                } else if geo.size.width < 1_200 {
                    compactLandscapeLayout(size: geo.size)
                } else {
                    let safeWidth = min(geo.size.width - 180, 1740)
                    let designScale = min(
                        geo.size.width / 1_920,
                        geo.size.height / 1_080
                    )
                    VStack(spacing: 16) {
                        header
                        modeSelector
                            .frame(width: min(safeWidth, 1_200))
                            .padding(.top, 8)
                            .offset(y: -52)
                            .zIndex(2)

                        selectedContent(safeWidth: safeWidth)
                            .frame(maxHeight: .infinity, alignment: .center)
                            .offset(y: -42)
                    }
                    .frame(width: safeWidth)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .scaleEffect(max(0.35, designScale))
                }
            }
            .disabled(isOverlayPresented)
            .overlay(alignment: .bottom) {
                footer
                    .disabled(isOverlayPresented)
                    .padding(.leading, 70)
                    .padding(.trailing, 48)
                    .padding(.bottom, 28)
            }
            .overlay(alignment: .top) {
                if verticalSizeClass == .compact {
                    compactTopOverlay
                }
            }

            if isShowingSurahPicker {
                TVSurahPicker(
                    quranPlaybackStore: quranPlaybackStore,
                    isPresented: $isShowingSurahPicker
                )
                .transition(.opacity.combined(with: .scale(scale: 0.94)))
            }

            if isShowingAdhanPicker {
                TVAdhanPicker(
                    adhanController: adhanController,
                    quranAudio: quranAudio,
                    quranPlaybackStore: quranPlaybackStore,
                    isPresented: $isShowingAdhanPicker
                )
                .transition(.opacity.combined(with: .scale(scale: 0.94)))
            }

            if isShowingReciterPicker {
                TVReciterPicker(
                    quranPlaybackStore: quranPlaybackStore,
                    isPresented: $isShowingReciterPicker,
                    reciterStore: quranReciterStore
                )
                .transition(.opacity.combined(with: .scale(scale: 0.94)))
            }
        }
        .focusEffectDisabled(true)
        .onAppear {
            guard !didSetInitialFocus else { return }
            didSetInitialFocus = true
            focusedItem = .mode(selectedMode)
        }
        .animation(.easeInOut(duration: 0.24), value: isShowingAdhanPicker)
        .animation(.easeInOut(duration: 0.24), value: isShowingSurahPicker)
        .animation(.easeInOut(duration: 0.24), value: isShowingReciterPicker)
        .onChange(of: isShowingReciterPicker) { _, isPresented in
            if isPresented {
                shouldRestoreQuranAfterReciterPicker = true
                selectedMode = .quran
            } else if shouldRestoreQuranAfterReciterPicker {
                selectedMode = .quran
                Task { @MainActor in
                    await Task.yield()
                    guard !isShowingReciterPicker else { return }
                    selectedMode = .quran
                    focusedItem = .reciterPicker
                    shouldRestoreQuranAfterReciterPicker = false
                }
            }
        }
        #if os(tvOS)
        .onPlayPauseCommand {
            lastInteraction = Date()
            guard !isShowingAdhanPicker else { return }
            quranPlaybackStore.togglePlayPause()
        }
        .onMoveCommand { direction in
            guard direction == .down,
                  focusedItem == .mode(.quran) else { return }
            focusedItem = .quranTransliteration
        }
        #endif
        .ignoresSafeArea()
        .task {
            weather = await TVWeatherService.load()
        }
    }

    private var compactTopOverlay: some View {
        VStack(spacing: 6) {
            HStack(spacing: 12) {
                Text("DĀR AL TAWḤĪD")
                    .font(TVFace.brand(22))
                    .foregroundStyle(TVStyle.whiteCream)
                Spacer(minLength: 8)
                Button {
                    quranPlaybackStore.togglePlayPause()
                } label: {
                    Label(
                        quranPlaybackStore.isPlaying ? "Qurʾān läuft" : "Qurʾān",
                        systemImage: quranPlaybackStore.isPlaying ? "pause.fill" : "play.fill"
                    )
                    .font(TVFace.ui(12, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                    .padding(.horizontal, 10)
                    .frame(height: 28)
                    .background(TVStyle.softPanel, in: Capsule())
                }
                .buttonStyle(.plain)
            }
            compactModeSelector
                .frame(maxWidth: 620)
        }
        .padding(.horizontal, 26)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.76), Color.black.opacity(0.20), .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .zIndex(100)
    }

    private func compactLandscapeLayout(size: CGSize) -> some View {
        let contentWidth = max(1, size.width - 52)
        let contentHeight = max(1, size.height - 106)

        return ZStack(alignment: .top) {
            compactLandscapeContent(size: size)
                .frame(width: contentWidth, height: contentHeight, alignment: .top)
                .offset(y: 98)

            compactTopOverlay
                .frame(width: size.width, alignment: .top)
        }
        .frame(width: size.width, height: size.height, alignment: .top)
    }

    private var compactModeSelector: some View {
        HStack(spacing: 0) {
            ForEach(TVDashboardMode.allCases) { mode in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedMode = mode
                        lastInteraction = Date()
                    }
                } label: {
                    Label(mode.rawValue, systemImage: mode.symbol)
                        .font(TVFace.ui(15, weight: .bold))
                        .foregroundStyle(selectedMode == mode ? TVStyle.ink : TVStyle.whiteCream)
                        .padding(.horizontal, 15)
                        .frame(minHeight: 38)
                        .background(
                            Capsule()
                                .fill(selectedMode == mode ? TVStyle.iceGold : Color.clear)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Color.black.opacity(0.42), in: Capsule())
        .overlay(Capsule().stroke(TVStyle.iceGold.opacity(0.34), lineWidth: 1))
    }

    @ViewBuilder
    private func compactLandscapeContent(size: CGSize) -> some View {
        switch selectedMode {
        case .prayer:
            HStack(alignment: .top, spacing: 16) {
                compactPrayerCard
                    .frame(maxWidth: .infinity)
                compactDailyCard
                    .frame(maxWidth: .infinity)
            }
        case .today:
            mobileTodayContent
                .frame(maxWidth: 760)
        case .calendar:
            mobileCalendarContent
                .frame(maxWidth: 760)
        case .quran:
            QuranTabView(
                quranAudio: quranAudio,
                playbackStore: quranPlaybackStore,
                reciterStore: quranReciterStore,
                snapshot: snapshot,
                date: date,
                dashboardFocus: $focusedItem
            )
            .frame(maxWidth: 1_100, maxHeight: .infinity)
        }
    }

    private var compactPrayerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(TVPrayerEngine.cleanName(nextTarget.name)) in")
                .font(TVFace.ui(21, weight: .semibold))
                .foregroundStyle(TVStyle.cream)
            Text(nextTarget.target ?? date, style: .timer)
                .font(TVFace.number(43, weight: .heavy))
                .foregroundStyle(TVStyle.whiteCream)
            HStack {
                Text("Nächstes Gebet")
                Spacer()
                Text(nextTarget.time)
                    .foregroundStyle(TVStyle.gold)
            }
            .font(TVFace.ui(15, weight: .bold))

            Divider().overlay(TVStyle.iceGold.opacity(0.22))

            ForEach(snapshot.prayers.filter { $0.id != "sunrise" }) { prayer in
                HStack {
                    Text(TVPrayerEngine.cleanName(prayer.name))
                    Spacer()
                    Text(prayer.time)
                        .monospacedDigit()
                }
                .font(TVFace.ui(14, weight: prayer.id == nextTarget.id ? .bold : .medium))
                .foregroundStyle(prayer.id == nextTarget.id ? TVStyle.iceGold : TVStyle.whiteCream.opacity(0.88))
            }
        }
        .padding(18)
        .background(TVStyle.softPanel, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(TVStyle.iceGold.opacity(0.20), lineWidth: 1)
        )
    }

    private var compactDailyCard: some View {
        let item = TVDailyRotator.item(snapshot: snapshot, date: date)
        return VStack(alignment: .leading, spacing: 10) {
            Label(item.label, systemImage: item.symbol)
                .font(TVFace.ui(17, weight: .bold))
                .foregroundStyle(TVStyle.iceGold)
            Text(item.title)
                .font(TVFace.title(25, weight: .bold))
                .foregroundStyle(TVStyle.whiteCream)
                .lineLimit(2)
            Text(item.body)
                .font(TVFace.ui(17, weight: .medium))
                .foregroundStyle(TVStyle.cream.opacity(0.88))
                .lineLimit(5)
                .fixedSize(horizontal: false, vertical: true)
            if !item.footer.isEmpty {
                Text(item.footer)
                    .font(TVFace.ui(13, weight: .medium))
                    .foregroundStyle(TVStyle.cream.opacity(0.65))
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(TVStyle.softPanel, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(TVStyle.iceGold.opacity(0.20), lineWidth: 1)
        )
    }

    private func mobileLayout(width: CGFloat) -> some View {
        let horizontalPadding = max(16, min(32, width * 0.06))
        return ScrollView(.vertical) {
            VStack(alignment: .leading, spacing: 18) {
                mobileHeader
                mobileModeSelector
                mobileSelectedContent
            }
            .frame(width: max(1, width - (horizontalPadding * 2)))
            .padding(.vertical, 24)
        }
        .frame(width: width)
        .scrollIndicators(.hidden)
    }

    private var mobileHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("DĀR AL TAWḤĪD")
                .font(TVFace.brand(30))
                .foregroundStyle(TVStyle.whiteCream)
            Text("Dār Al Tawḥīd TV")
                .font(TVFace.ui(16, weight: .semibold))
                .foregroundStyle(TVStyle.cream.opacity(0.72))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var mobileModeSelector: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(TVDashboardMode.allCases) { mode in
                    Button {
                        withAnimation(.easeInOut(duration: 0.22)) {
                            selectedMode = mode
                            lastInteraction = Date()
                        }
                    } label: {
                        Label(mode.rawValue, systemImage: mode.symbol)
                            .font(TVFace.ui(14, weight: .bold))
                            .foregroundStyle(selectedMode == mode ? TVStyle.ink : TVStyle.whiteCream)
                            .padding(.horizontal, 14)
                            .frame(minHeight: 42)
                            .background(
                                Capsule()
                                    .fill(selectedMode == mode ? TVStyle.iceGold : Color.white.opacity(0.08))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .scrollIndicators(.hidden)
    }

    @ViewBuilder
    private var mobileSelectedContent: some View {
        switch selectedMode {
        case .prayer:
            mobilePrayerContent
        case .today:
            mobileTodayContent
        case .calendar:
            mobileCalendarContent
        case .quran:
            QuranTabView(
                quranAudio: quranAudio,
                playbackStore: quranPlaybackStore,
                reciterStore: quranReciterStore,
                snapshot: snapshot,
                date: date,
                dashboardFocus: $focusedItem
            )
            .frame(minHeight: 560)
        }
    }

    private var mobilePrayerContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("\(TVPrayerEngine.cleanName(nextTarget.name)) in")
                    .font(TVFace.ui(25, weight: .semibold))
                    .foregroundStyle(TVStyle.cream)
                Text(nextTarget.target ?? date, style: .timer)
                    .font(TVFace.number(48, weight: .heavy))
                    .foregroundStyle(TVStyle.whiteCream)
                Text("Nächstes Gebet: \(nextTarget.time)")
                    .font(TVFace.ui(17, weight: .bold))
                    .foregroundStyle(TVStyle.gold)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(TVStyle.softPanel, in: RoundedRectangle(cornerRadius: 22, style: .continuous))

            if let localWeather = weather.first {
                TVWeatherCompactCard(snapshot: localWeather)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            VStack(alignment: .leading, spacing: 0) {
                Text("Gebetszeiten heute")
                    .font(TVFace.ui(23, weight: .heavy))
                    .foregroundStyle(TVStyle.iceGold)
                    .padding(.bottom, 8)
                ForEach(snapshot.prayers.filter { $0.id != "sunrise" }) { prayer in
                    TVPrayerRow(prayer: prayer, isActive: prayer.id == nextTarget.id)
                }
            }
            .padding(18)
            .background(Color.black.opacity(0.24), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
    }

    private var mobileTodayContent: some View {
        let item = TVDailyRotator.item(snapshot: snapshot, date: date)
        return VStack(alignment: .leading, spacing: 14) {
            Label(item.label, systemImage: item.symbol)
                .font(TVFace.ui(19, weight: .heavy))
                .foregroundStyle(TVStyle.iceGold)
            Text(item.title)
                .font(TVFace.title(27, weight: .bold))
                .foregroundStyle(TVStyle.whiteCream)
            Text(item.body)
                .font(TVFace.ui(18, weight: .medium))
                .foregroundStyle(TVStyle.cream.opacity(0.88))
                .fixedSize(horizontal: false, vertical: true)
            if !item.footer.isEmpty {
                Text(item.footer)
                    .font(TVFace.ui(14, weight: .medium))
                    .foregroundStyle(TVStyle.cream.opacity(0.66))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(TVStyle.softPanel, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private var mobileCalendarContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Kalender")
                .font(TVFace.ui(23, weight: .heavy))
                .foregroundStyle(TVStyle.iceGold)
            ForEach(0..<7, id: \.self) { offset in
                let rowDate = Calendar.current.date(byAdding: .day, value: offset, to: date) ?? date
                HStack {
                    Text(TVPrayerEngine.mediumDateLabel(for: rowDate))
                    Spacer()
                    Text(TVPrayerEngine.hijriLabel(for: rowDate))
                        .foregroundStyle(TVStyle.iceGold)
                }
                .font(TVFace.ui(16, weight: offset == 0 ? .bold : .medium))
                .foregroundStyle(TVStyle.whiteCream)
                .padding(.vertical, 9)
                Divider().overlay(TVStyle.iceGold.opacity(0.14))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(TVStyle.softPanel, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    @ViewBuilder
    private func selectedContent(safeWidth: CGFloat) -> some View {
        switch selectedMode {
        case .prayer:
            prayerMode(safeWidth: safeWidth)
        case .today:
            todayMode(safeWidth: safeWidth)
        case .calendar:
            calendarMode(safeWidth: safeWidth)
        case .quran:
            QuranTabView(
                quranAudio: quranAudio,
                playbackStore: quranPlaybackStore,
                reciterStore: quranReciterStore,
                snapshot: snapshot,
                date: date,
                dashboardFocus: $focusedItem
            )
        }
    }

    private var modeSelector: some View {
        HStack(spacing: 0) {
            ForEach(TVDashboardMode.allCases) { mode in
                Button {
                    lastInteraction = Date()
                    withAnimation(.easeInOut(duration: 0.28)) {
                        selectedMode = mode
                        focusedItem = .mode(mode)
                    }
                } label: {
                    TVModeChip(
                        mode: mode,
                        selected: selectedMode == mode,
                        focused: focusedItem == .mode(mode),
                        showsDivider: mode != TVDashboardMode.allCases.last
                    )
                }
                .buttonStyle(DarTVButtonStyle())
                .focused($focusedItem, equals: .mode(mode))
                #if os(tvOS)
                .onMoveCommand { direction in
                    guard mode == .quran, direction == .down else { return }
                    focusedItem = .quranTransliteration
                }
                #endif
                .focusEffectDisabled(true)
            }
        }
        .padding(4)
        .background {
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [Color.black.opacity(0.56), Color.black.opacity(0.34)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        }
        .overlay(Capsule().stroke(TVStyle.iceGold.opacity(0.34), lineWidth: 1))
        .clipShape(Capsule())
        #if os(tvOS)
        .focusSection()
        #endif
        .focusEffectDisabled(true)
        .darCoachTarget(.navigation)
        .onAppear {
            if focusedItem == nil {
                focusedItem = .mode(selectedMode)
            }
        }
    }

    private func prayerMode(safeWidth: CGFloat) -> some View {
        HStack(alignment: .top, spacing: 0) {
            VStack(alignment: .leading, spacing: 16) {
                mainCountdown
                prayerList
            }
            .frame(width: safeWidth * 0.40, alignment: .leading)
            .padding(.top, 0)
            .darCoachTarget(.prayerTimes)

            TVVerticalHairline()
                .frame(height: 660)
                .padding(.top, 18)
                .padding(.trailing, 20)

            VStack(alignment: .leading, spacing: 10) {
                TVVerseOfTheMoment(date: date)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(width: safeWidth * 0.48, alignment: .leading)
            .padding(.top, 18)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .offset(x: 100)
        .transition(.opacity.combined(with: .scale(scale: 0.985)))
    }

    private func todayMode(safeWidth: CGFloat) -> some View {
        HStack(alignment: .top, spacing: 30) {
            VStack(alignment: .leading, spacing: 34) {
                mainCountdown
                TVHairline()
                    .frame(width: 620)

                TVWeatherPanel(snapshots: weather)
            }
            .frame(width: safeWidth * 0.40, alignment: .leading)
            .padding(.top, 26)

            TVTodayStack(snapshot: snapshot, date: date)
                .frame(width: safeWidth * 0.46, alignment: .leading)
                .frame(minHeight: 720, alignment: .top)
                .padding(.top, 0)
        }
        .transition(.opacity.combined(with: .move(edge: .trailing)))
    }

    
    
    private func calendarMode(safeWidth: CGFloat) -> some View {
        HStack(alignment: .top, spacing: 36) {
            // LEFT SIDE (52%): Large Featured Islamic Holidays & Header
            VStack(alignment: .leading, spacing: 16) {
                TVCalendarHeaderCard(date: date)
                TVIslamicHolidaysLargeCard(date: date)
            }
            .frame(width: safeWidth * 0.52, alignment: .leading)
            .padding(.top, 10)

            TVVerticalHairline()
                .frame(height: 680)
                .padding(.top, 14)

            // RIGHT SIDE (44%): Compact Next Prayer & Full 7-Day Preview
            VStack(alignment: .leading, spacing: 16) {
                TVCompactPrayerAndDuaCard(snapshot: snapshot, date: date)
                TV7DayPreviewCard(date: date)
            }
            .frame(width: safeWidth * 0.50, alignment: .leading)
            .padding(.top, 10)
        }
        .transition(.opacity.combined(with: .move(edge: .leading)))
    }


    private var header: some View {
        HStack(alignment: .center, spacing: 22) {
            HStack(alignment: .center, spacing: 28) {
                TVBrandMark()
                    .frame(width: 124, height: 124)

                VStack(alignment: .leading, spacing: 7) {
                    Text("DĀR AL TAWḤĪD")
                        .font(TVFace.brand(50))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                        .frame(width: 390, alignment: .leading)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [TVStyle.whiteCream, TVStyle.gold, TVStyle.cream],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    Text(snapshot.cityLabel)
                        .font(TVFace.ui(25, weight: .semibold))
                        .foregroundStyle(TVStyle.cream.opacity(0.76))
                }
            }

            HStack(spacing: 9) {
                Image(systemName: "waveform.circle.fill")
                Text("Adhan")
            }
            .font(TVFace.ui(16, weight: .bold))
            .foregroundStyle(focusedItem == .adhanPicker ? TVStyle.ink : TVStyle.whiteCream)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background {
                Capsule()
                    .fill(
                        focusedItem == .adhanPicker
                        ? TVStyle.gold.opacity(0.92)
                        : Color.black.opacity(0.24)
                    )
                    .overlay {
                        Capsule()
                            .stroke(
                                focusedItem == .adhanPicker
                                ? TVStyle.gold
                                : TVStyle.iceGold.opacity(0.26),
                                lineWidth: focusedItem == .adhanPicker ? 1.5 : 1
                            )
                    }
            }
            .contentShape(Capsule())
            .focusable(true)
            .focused($focusedItem, equals: .adhanPicker)
            .focusEffectDisabled(true)
            .accessibilityAddTraits(.isButton)
            .onTapGesture {
                lastInteraction = Date()
                isShowingAdhanPicker = true
            }

            TVQuranMiniPlayer(
                quranPlaybackStore: quranPlaybackStore,
                reciterStore: quranReciterStore,
                showSurahPicker: $isShowingSurahPicker,
                showReciterPicker: $isShowingReciterPicker,
                selectedMode: selectedMode,
                focusedItem: $focusedItem,
                lastInteraction: $lastInteraction
            )
            // 38 + 235 + 330 points plus the two 12-point gaps.
            // Reserving the real control width prevents SwiftUI from compressing
            // the play button into the neighbouring Adhan focus region.
            .frame(width: 629, alignment: .leading)
            .layoutPriority(2)

            Spacer(minLength: 24)

            VStack(alignment: .trailing, spacing: 6) {
                Text(date, format: .dateTime.hour().minute())
                    .font(TVFace.number(70, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                    .contentTransition(.numericText())
                Text(TVPrayerEngine.fullDateLabel(for: date))
                    .font(TVFace.ui(24, weight: .semibold))
                    .foregroundStyle(TVStyle.cream.opacity(0.72))

                Group {
                    if let localWeather = weather.first {
                        TVWeatherCompactCard(snapshot: localWeather)
                    } else {
                        Color.clear
                    }
                }
                .frame(height: 52, alignment: .trailing)
            }
        }
        #if os(tvOS)
        .focusSection()
        #endif
        .padding(.top, 22)
    }

    private var mainCountdown: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 18) {
                TVPill(text: TVPrayerEngine.hijriLabel(for: date), symbol: "moon.stars.fill")
                TVPill(text: "live", symbol: "dot.radiowaves.left.and.right")
            }
            .padding(.bottom, 10)

            HStack(alignment: .center, spacing: 24) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(TVPrayerEngine.cleanName(nextTarget.name)) in")
                        .font(TVFace.ui(38, weight: .semibold))
                        .foregroundStyle(TVStyle.cream.opacity(0.84))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)

                    Text(nextTarget.target ?? date, style: .timer)
                        .font(TVFace.number(88, weight: .heavy))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [TVStyle.deepGold, TVStyle.gold, TVStyle.whiteCream],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .lineLimit(1)
                        .minimumScaleFactor(0.50)
                        .shadow(color: TVStyle.gold.opacity(0.14), radius: 16, x: 0, y: 5)
                }

                TVVerticalHairline()
                    .frame(height: 92)

                VStack(alignment: .leading, spacing: 2) {
                    Text(nextTarget.time)
                        .font(TVFace.number(58, weight: .bold))
                        .foregroundStyle(TVStyle.whiteCream)
                        .lineLimit(1)
                    Text(TVPrayerEngine.cleanName(nextTarget.name))
                        .font(TVFace.ui(30, weight: .bold))
                        .foregroundStyle(TVStyle.gold)
                        .lineLimit(1)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var prayerList: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Gebetszeiten heute")
                .font(TVFace.ui(32, weight: .heavy))
                .foregroundStyle(TVStyle.iceGold)

            VStack(spacing: 0) {
                ForEach(snapshot.prayers.filter { $0.id != "sunrise" }) { prayer in
                    TVPrayerRow(
                        prayer: prayer,
                        isActive: prayer.id == nextTarget.id
                    )
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
        .padding(.horizontal, 4)
        .padding(.vertical, 8)
    }

    private var dailyFeature: some View {
        let item = TVDailyRotator.item(snapshot: snapshot, date: date)
        return VStack(alignment: .leading, spacing: 34) {
            HStack(spacing: 18) {
                Image(systemName: item.symbol)
                    .font(TVFace.ui(38, weight: .bold))
                    .foregroundStyle(TVStyle.iceGold)
                    .shadow(color: TVStyle.iceGold.opacity(0.32), radius: 16, x: 0, y: 0)
                    .frame(width: 58, height: 58)

                VStack(alignment: .leading, spacing: 5) {
                    Text(item.label)
                    .font(TVFace.ui(27, weight: .heavy))
                        .foregroundStyle(TVStyle.iceGold)
                        .lineLimit(1)

                }

                Spacer(minLength: 0)

                TVMinuteRing(date: date)
                    .frame(width: 54, height: 54)
            }

            VStack(alignment: .leading, spacing: 20) {
                Text(item.title)
                    .font(TVFace.title(45, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                    .lineLimit(4)
                    .minimumScaleFactor(0.45)

                Text(item.body)
                    .font(TVFace.ui(28, weight: .semibold))
                    .foregroundStyle(TVStyle.cream.opacity(0.88))
                    .lineLimit(9)
                    .minimumScaleFactor(0.42)
                    .fixedSize(horizontal: false, vertical: true)

                if !item.footer.isEmpty {
                    Text(item.footer)
                        .font(TVFace.title(20, weight: .semibold))
                        .foregroundStyle(TVStyle.cream.opacity(0.82))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }
            }

        }
        .padding(.top, 12)
        .padding(.leading, 10)
        .padding(.bottom, 18)
        .overlay(alignment: .bottom) {
            TVHairline()
        }
        .id(item.label)
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }

    private var footer: some View {
        HStack(spacing: 14) {
            Text("DĀR AL TAWḤĪD")
                .font(TVFace.brand(20))
                .foregroundStyle(TVStyle.cream.opacity(0.78))

            Circle()
                .fill(TVStyle.gold)
                .frame(width: 7, height: 7)

            Label("LIVE TV", systemImage: "dot.radiowaves.left.and.right")
                .font(TVFace.ui(18, weight: .semibold))
                .foregroundStyle(TVStyle.cream.opacity(0.64))

            Spacer()

            Button(action: onOpenHelp) {
                Label("So funktioniert die App", systemImage: "questionmark.circle.fill")
                    .font(TVFace.ui(18, weight: .semibold))
                    .foregroundStyle(focusedItem == .help ? TVStyle.ink : TVStyle.cream.opacity(0.82))
                    .padding(.horizontal, 18)
                    .frame(minHeight: 44)
                    .background(Capsule().fill(focusedItem == .help ? TVStyle.iceGold : Color.white.opacity(0.06)))
            }
            .buttonStyle(DarTVButtonStyle())
            .focused($focusedItem, equals: .help)
            .focusEffectDisabled(true)
            .darCoachTarget(.help)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 58, alignment: .center)
        .contentShape(Rectangle())
        #if os(tvOS)
        .focusSection()
        #endif
    }
}
