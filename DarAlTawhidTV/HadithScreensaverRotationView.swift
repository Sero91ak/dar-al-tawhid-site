import SwiftUI
import Combine

@MainActor
final class HadithScreensaverRotationController: ObservableObject {
    @Published private(set) var current: HadithRecord?
    @Published private(set) var isPaused = false
    @Published private(set) var showsQuran = false
    @Published private(set) var quranRotationIndex = 0
    @Published private(set) var quranDisplayHold: TimeInterval = 30
    @Published private(set) var quranDisplayDate = Date()

    private static let retrySeconds: TimeInterval = 5
    private static let hadithsBeforeQuran = 5
    private static let routineHadithCountKey = "dar.tv.screensaver.routine.hadithsSinceQuran.v1"
    private static let routineQuranIndexKey = "dar.tv.screensaver.routine.quranRotationIndex.v1"
    private var loop: Task<Void, Never>?
    private var loopGeneration = 0
    private var hadithsSinceQuran = 0

    func start() {
        guard loop == nil else { return }

        loopGeneration += 1
        let generation = loopGeneration
        restoreRoutineProgress()
        showsQuran = false

        loop = Task { [weak self] in
            guard let self else { return }

            // Continue the persisted item first. This prevents an app restart from
            // silently skipping the statement that was on screen.
            if let resumed = await HadithScreensaverProvider.shared.resumePersistedContent() {
                guard !Task.isCancelled, self.loopGeneration == generation, !self.isPaused else { return }
                self.current = resumed.record
                try? await Task.sleep(for: .seconds(resumed.remainingSeconds))
                guard !Task.isCancelled, self.loopGeneration == generation else { return }
            }

            while !Task.isCancelled, self.loopGeneration == generation {
                if self.isPaused {
                    try? await Task.sleep(for: .milliseconds(250))
                    guard !Task.isCancelled, self.loopGeneration == generation else { return }
                    continue
                }

                // Keep the established Hadith/Salaf rotation intact. Qurʾān is
                // inserted as its own recurring slot after a small group of
                // statements instead of simply alternating every item.
                guard let wait = await self.advance(generation: generation) else {
                    try? await Task.sleep(for: .seconds(Self.retrySeconds))
                    guard !Task.isCancelled, self.loopGeneration == generation else { return }
                    continue
                }
                guard !Task.isCancelled, self.loopGeneration == generation else { return }

                hadithsSinceQuran += 1
                if hadithsSinceQuran >= Self.hadithsBeforeQuran {
                    hadithsSinceQuran = 0
                    quranRotationIndex += 1
                    quranDisplayDate = Date()
                    persistRoutineProgress()
                    showsQuran = true
                } else {
                    persistRoutineProgress()
                }

                if showsQuran {
                    // Let the dedicated Qurʾān zone publish its measured text
                    // duration before starting this slot's countdown.
                    try? await Task.sleep(for: .milliseconds(250))
                    guard !Task.isCancelled, self.loopGeneration == generation else { return }
                    try? await Task.sleep(for: .seconds(quranDisplayHold))
                    guard !Task.isCancelled, self.loopGeneration == generation else { return }
                    showsQuran = false
                } else {
                    try? await Task.sleep(for: .seconds(wait))
                    guard !Task.isCancelled, self.loopGeneration == generation else { return }
                }
            }
        }
    }

    private func restoreRoutineProgress() {
        let defaults = UserDefaults.standard
        hadithsSinceQuran = min(
            Self.hadithsBeforeQuran - 1,
            max(0, defaults.integer(forKey: Self.routineHadithCountKey))
        )
        quranRotationIndex = max(0, defaults.integer(forKey: Self.routineQuranIndexKey))
    }

    private func persistRoutineProgress() {
        let defaults = UserDefaults.standard
        defaults.set(hadithsSinceQuran, forKey: Self.routineHadithCountKey)
        defaults.set(quranRotationIndex, forKey: Self.routineQuranIndexKey)
    }

    func stop() {
        loopGeneration += 1
        loop?.cancel()
        loop = nil
    }

    func togglePause() {
        isPaused.toggle()
    }

    func updateQuranDisplayDuration(_ duration: TimeInterval) {
        quranDisplayHold = min(90, max(20, duration))
    }

    private func advance(generation: Int) async -> TimeInterval? {
        guard !isPaused,
              !Task.isCancelled,
              loopGeneration == generation,
              let next = try? await HadithScreensaverProvider.shared.nextContent() else {
            return nil
        }
        guard !isPaused, !Task.isCancelled, loopGeneration == generation else { return nil }
        current = next

        return displayDuration(for: next)
    }

    private func displayDuration(for record: HadithRecord) -> TimeInterval {
        let visibleText = [
            record.narratorLine,
            record.speakerLabel,
            record.textMarkdown,
            record.sourceCitation,
            record.grade,
            record.verifiedSharhText ?? "",
            record.sharhCitation ?? ""
        ].joined(separator: " ")
        let words = visibleText.split(whereSeparator: { $0.isWhitespace }).count
        let hasSharh = record.verifiedSharhText != nil
        let seconds = 16.0 + Double(words) * 0.35 + (hasSharh ? 6.0 : 0.0)
        return min(40, max(18, seconds))
    }
}

private struct HadithScreensaverLiveStatusView: View {
    let snapshot: TVSnapshot
    let weather: TVWeatherSnapshot?

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let liveSnapshot = TVSnapshotStore.refresh(snapshot, date: context.date)
            let nextPrayer = TVPrayerEngine.nextTarget(from: liveSnapshot.prayers, now: context.date)

            HStack(spacing: 0) {
                statusCell(
                    symbol: "clock.badge.checkmark.fill",
                    title: "Nächstes Gebet",
                    primary: nextPrayer.id.isEmpty ? "Standort erforderlich" : "\(nextPrayer.name) · \(nextPrayer.time)",
                    secondary: countdown(to: nextPrayer.target, from: context.date)
                )
                divider
                statusCell(
                    symbol: "calendar",
                    title: "Heute",
                    primary: TVPrayerEngine.fullDateLabel(for: context.date),
                    secondary: TVPrayerEngine.hijriLabel(for: context.date)
                )
                divider
                statusCell(
                    symbol: weather?.symbol ?? "location.fill",
                    title: weather?.place ?? liveSnapshot.cityLabel,
                    primary: weatherPrimaryText,
                    secondary: weatherSecondaryText
                )
            }
            .padding(.vertical, 4)
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(TVStyle.iceGold.opacity(0.30))
            .frame(width: 1, height: 52)
            .padding(.horizontal, 30)
    }

    private func statusCell(symbol: String, title: String, primary: String, secondary: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 23, weight: .semibold))
                .foregroundStyle(TVStyle.iceGold)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(TVFace.ui(16, weight: .semibold))
                    .foregroundStyle(TVStyle.cream.opacity(0.62))
                    .lineLimit(1)
                Text(primary)
                    .font(TVFace.ui(22, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                Text(secondary)
                    .font(TVFace.ui(16, weight: .medium))
                    .foregroundStyle(TVStyle.cream.opacity(0.78))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func countdown(to target: Date?, from date: Date) -> String {
        guard let target else { return "Gebetszeiten werden geladen" }
        let total = max(0, Int(target.timeIntervalSince(date)))
        return String(format: "in %02d:%02d:%02d", total / 3600, (total % 3600) / 60, total % 60)
    }

    private var weatherPrimaryText: String {
        guard let weather, weather.place != "Standortzugriff erforderlich" else {
            return "Standortfreigabe erforderlich"
        }
        return "\(weather.temperature)° · \(weather.condition)"
    }

    private var weatherSecondaryText: String {
        guard let weather, weather.place != "Standortzugriff erforderlich" else {
            return "Wetter wird nach Freigabe geladen"
        }
        return "H \(weather.high)° · T \(weather.low)°"
    }
}

struct HadithScreensaverRotationView: View {
    // One global content width for both Hadith/Salaf and Qurʾān/Tadabbur.
    // Zone 1 and Zone 2 must end at the same right boundary.
    private let zoneWidth: CGFloat = 1240
    @StateObject private var controller = HadithScreensaverRotationController()
    @State private var prayerSnapshot = TVSnapshotStore.load()
    @State private var localWeather: TVWeatherSnapshot?
    @State private var loadingProgress = 0.02
    @State private var isStartupFallbackVisible = false
    @State private var startupFallbackText: String?
    @FocusState private var isPauseButtonFocused: Bool
    @Namespace private var screensaverFocusScope

    private var readingCharacterCount: Int {
        controller.current?.textMarkdown.count ?? 0
    }

    private var readingFontSize: CGFloat {
        switch readingCharacterCount {
        case 0..<180: return 38
        case 180..<320: return 35
        default: return 32
        }
    }

    var body: some View {
        GeometryReader { geometry in
            let canvasSize = CGSize(width: 1920, height: 1080)
            let canvasScale = min(
                geometry.size.width / canvasSize.width,
                geometry.size.height / canvasSize.height
            )

            ZStack {
            Color.black.ignoresSafeArea()
            Image("TVKaabaBackground")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black)
                .clipped()
                .opacity(0.96)

            // Die frühere schwarze Lesestimmung: große, weiche Verläufe
            // statt eines sichtbaren Panels oder einer geraden Maske.
            RadialGradient(
                colors: [
                    Color.black.opacity(0.70),
                    Color.black.opacity(0.46),
                    Color.black.opacity(0.20),
                    .clear
                ],
                center: UnitPoint(x: 0.18, y: 0.48),
                startRadius: 50,
                endRadius: 980
            )
            .blur(radius: 115)
            .blendMode(.multiply)

            LinearGradient(
                colors: [
                    Color.black.opacity(0.24),
                    Color.black.opacity(0.12),
                    .clear
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
            .blur(radius: 80)
            .blendMode(.multiply)

            TVAmanahPattern(date: .now).opacity(0.24)
            TVAmbientSky(intensity: .screensaver)

            if controller.showsQuran {
                quranScreensaverContent
            } else if let record = controller.current {
                VStack(alignment: .leading, spacing: 24) {
                    HadithScreensaverLiveStatusView(snapshot: prayerSnapshot, weather: localWeather)
                        .frame(height: 78, alignment: .topLeading)

                    Rectangle()
                        .fill(LinearGradient(colors: [TVStyle.iceGold.opacity(0.52), TVStyle.iceGold.opacity(0.18), .clear], startPoint: .leading, endPoint: .trailing))
                        .frame(height: 1)
                        .padding(.bottom, 4)

                    // Zone 2 is a fixed rectangle. Zone 1 above is intentionally untouched.
                    // The text region and the control footer have independent fixed rectangles,
                    // so long source/sharh text can never push or clip the pause button.
                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .center, spacing: 26) {
                                Text("DĀR AL TAWḤĪD")
                                    .font(TVFace.title(42, weight: .semibold))
                                    .tracking(1.8)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.72)
                                    .foregroundStyle(LinearGradient(colors: [TVStyle.iceGold, TVStyle.cream, TVStyle.iceGold], startPoint: .leading, endPoint: .trailing))

                                Rectangle()
                                    .fill(TVStyle.iceGold.opacity(0.42))
                                    .frame(width: 1, height: 30)

                                Text(record.displayTypeLabel)
                                    .font(TVFace.title(24, weight: .semibold))
                                    .tracking(1.2)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.72)
                                    .foregroundStyle(TVStyle.iceGold)

                                Spacer(minLength: 0)
                            }
                            .frame(height: 54, alignment: .leading)

                            Rectangle()
                                .fill(LinearGradient(colors: [TVStyle.iceGold.opacity(0.72), TVStyle.iceGold.opacity(0.34), TVStyle.iceGold.opacity(0.08), .clear], startPoint: .leading, endPoint: .trailing))
                                .frame(height: 1)

                            Text(record.narratorLine)
                                .font(TVFace.transcription(readingCharacterCount > 320 ? 23 : 27, weight: .semibold))
                                .foregroundStyle(TVStyle.cream.opacity(0.80))
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                                .allowsTightening(true)
                                .frame(height: 54, alignment: .leading)

                            (Text(record.speakerLabel + " ").fontWeight(.semibold) + Text(record.attributedHadith))
                                .font(TVFace.title(readingFontSize, weight: .regular))
                                .foregroundStyle(TVStyle.whiteCream)
                                .lineSpacing(readingCharacterCount < 420 ? 7 : 5)
                                .lineLimit(6)
                                .minimumScaleFactor(0.58)
                                .allowsTightening(true)
                                .frame(height: 178, alignment: .topLeading)

                            Text("Quelle: \(record.sourceCitation)")
                                .font(TVFace.transcription(20, weight: .regular))
                                .foregroundStyle(TVStyle.cream.opacity(0.62))
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                                .allowsTightening(true)
                                .frame(height: 44, alignment: .topLeading)

                            if let sharhText = record.verifiedSharhText {
                                Rectangle()
                                    .fill(TVStyle.iceGold.opacity(0.22))
                                    .frame(height: 1)
                                    .padding(.vertical, 8)

                                Text("SHARḤ")
                                    .font(TVFace.title(25, weight: .semibold))
                                    .tracking(1.6)
                                    .foregroundStyle(TVStyle.iceGold.opacity(0.94))
                                    .frame(height: 34, alignment: .leading)

                                Text(HadithInlineFormatter.attributed(sharhText))
                                    .font(TVFace.title(28, weight: .regular))
                                    .foregroundStyle(TVStyle.whiteCream.opacity(0.94))
                                    .lineSpacing(5)
                                    .lineLimit(7)
                                    .minimumScaleFactor(0.64)
                                    .allowsTightening(true)
                                    .frame(height: 205, alignment: .topLeading)

                                if let sharhCitation = record.sharhCitation {
                                    Text("Quelle des Sharḥs: \(sharhCitation)")
                                        .font(TVFace.title(17, weight: .regular))
                                        .foregroundStyle(TVStyle.cream.opacity(0.52))
                                        .lineLimit(2)
                                        .minimumScaleFactor(0.62)
                                        .allowsTightening(true)
                                        .frame(height: 42, alignment: .topLeading)
                                }
                            }
                        }
                        .frame(width: zoneWidth, height: 700, alignment: .center)
                        .clipped()

                        pauseFooter
                    }
                    .frame(width: zoneWidth, height: 820, alignment: .topLeading)
                    .clipped()
                }
                // This outer frame contains Zone 1 and Zone 2 together. It must
                // be larger than Zone 2; otherwise SwiftUI clips the status zone
                // and can recenter it when the Hadith text changes.
                .frame(width: zoneWidth, height: 1000, alignment: .topLeading)
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .padding(.top, 38)
                .padding(.horizontal, 80)
                .padding(.bottom, 28)
            } else if isStartupFallbackVisible {
                screensaverFallbackView
            } else {
                screensaverLoadingView
            }
        }
        // Keep focus and controls stable when only the statement text changes.
        .task {
            await prepareScreensaver()
        }
        .onDisappear { controller.stop() }
        // Exit is handled by the parent app so Menu/Back hides the screensaver
        // and returns to the dashboard instead of only stopping its timer.
        .onMoveCommand { _ in isPauseButtonFocused = true }
        .onPlayPauseCommand {
            controller.togglePause()
            isPauseButtonFocused = true
        }
        .focusScope(screensaverFocusScope)
        .focusSection()
        .focusEffectDisabled(true)
        .onAppear { isPauseButtonFocused = true }
        .frame(width: canvasSize.width, height: canvasSize.height)
        .scaleEffect(canvasScale, anchor: .center)
        .frame(width: geometry.size.width, height: geometry.size.height)
        .ignoresSafeArea()
        }
        .ignoresSafeArea()
    }

    private var quranScreensaverContent: some View {
        // Qurʾān/Tadabbur uses the same global geometry as Hadith/Salaf:
        // Zone 1 is fixed above one fixed Zone 2 rectangle. Only the content
        // inside Zone 2 changes.
        VStack(alignment: .leading, spacing: 0) {
            HadithScreensaverLiveStatusView(snapshot: prayerSnapshot, weather: localWeather)
                .frame(height: 78, alignment: .topLeading)

            quranSectionDivider
                .padding(.top, 1)

            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .center, spacing: 26) {
                        Text("DĀR AL TAWḤĪD")
                            .font(TVFace.title(42, weight: .semibold))
                            .tracking(1.8)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [TVStyle.iceGold, TVStyle.cream, TVStyle.iceGold],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )

                        Rectangle()
                            .fill(TVStyle.iceGold.opacity(0.42))
                            .frame(width: 1, height: 30)

                        Text("QURʾĀN · TADABBUR")
                            .font(TVFace.title(24, weight: .semibold))
                            .tracking(1.2)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                            .foregroundStyle(TVStyle.iceGold)

                        Spacer(minLength: 0)
                    }
                    .frame(height: 54, alignment: .leading)

                    quranSectionDivider

                    // The verse and Tadabbur share the same fixed content
                    // rectangle as Hadith/Āṯār. Short blocks are centered in it;
                    // long blocks remain inside the rectangle and never move Zone 1
                    // or the pause footer.
                    TVVerseOfTheMoment(
                        date: controller.quranDisplayDate,
                        rotationIndex: controller.quranRotationIndex,
                        onDurationChange: { duration in
                            controller.updateQuranDisplayDuration(duration)
                        },
                        showsArabic: false,
                        contentAlignment: .center
                    )
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(width: zoneWidth, height: 600, alignment: .center)
                    .clipped()
                }
                .frame(width: zoneWidth, height: 700, alignment: .center)
                .clipped()

                pauseFooter
            }
            .frame(width: zoneWidth, height: 820, alignment: .topLeading)
            .clipped()
        }
        .frame(width: zoneWidth, height: 1000, alignment: .topLeading)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .padding(.top, 38)
        .padding(.horizontal, 80)
        .padding(.bottom, 28)
    }

    private var quranSectionDivider: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [TVStyle.iceGold.opacity(0.72), TVStyle.iceGold.opacity(0.34), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(height: 1)
    }

    private var screensaverFallbackView: some View {
        ZStack {
            TVKaabaBackgroundCrossfade(
                assetName: "TVKaabaBackground",
                readabilityMode: false
            )

            Color.black.opacity(0.12)
                .ignoresSafeArea()

            // Keep the existing Kaaba image visible while the first remote
            // statement finishes loading. The live catalog fallback is shown
            // instead of leaving a blank screen.
            if let startupFallbackText, !startupFallbackText.isEmpty {
                Text(startupFallbackText)
                    .font(TVFace.title(30, weight: .semibold))
                    .foregroundStyle(TVStyle.whiteCream.opacity(0.90))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 900)
                    .padding(.horizontal, 80)
            }
        }
        .ignoresSafeArea()
    }

    private var screensaverLoadingView: some View {
        VStack(spacing: 22) {
            Text("Bildschirmschoner wird vorbereitet")
                .font(TVFace.title(30, weight: .semibold))
                .foregroundStyle(TVStyle.whiteCream)

            VStack(spacing: 10) {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(TVStyle.whiteCream.opacity(0.16))
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [TVStyle.iceGold, TVStyle.cream],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * loadingProgress)
                    }
                }
                .frame(width: 820, height: 6)

                Text("Wird geladen · \(Int(loadingProgress * 100)) %")
                    .font(TVFace.ui(18, weight: .semibold))
                    .foregroundStyle(TVStyle.cream.opacity(0.80))
            }
        }
    }

    @MainActor
    private func prepareScreensaver() async {
        let progressTask = Task { @MainActor in
            while !Task.isCancelled && loadingProgress < 1 {
                try? await Task.sleep(for: .milliseconds(55))
                withAnimation(.easeOut(duration: 0.14)) {
                    loadingProgress = min(loadingProgress + 0.035, 1)
                }
            }
        }

        // Der lokale Cache liefert den ersten Datensatz sofort. Netzwerkaktualisierung
        // darf den sichtbaren Start nicht blockieren.
        await HadithScreensaverProvider.shared.loadCachedContent()
        startupFallbackText = "Der Bildschirmschoner-Inhalt ist derzeit nicht verfügbar."

        // Erst den lokalen Inhalt anzeigen. Der Netzwerk-Refresh startet erst,
        // nachdem der erste Screensaver-Datensatz sichtbar ist.
        controller.start()

        // Gebetszeiten und Wetter werden parallel aktualisiert. Sie dürfen den
        // ersten Screensaver-Datensatz und den Ladebalken nicht blockieren.
        Task { @MainActor in
            await refreshLiveStatus()
        }

        var attempts = 0
        while controller.current == nil && !Task.isCancelled && attempts < 36 {
            try? await Task.sleep(for: .milliseconds(60))
            attempts += 1
        }

        progressTask.cancel()
        withAnimation(.easeOut(duration: 0.22)) {
            loadingProgress = 1
        }
        if controller.current == nil {
            withAnimation(.easeInOut(duration: 0.25)) {
                isStartupFallbackVisible = true
            }
        }
        Task {
            await HadithScreensaverProvider.shared.forceRefresh()
        }
        try? await Task.sleep(for: .milliseconds(220))
    }

    private var pauseFooter: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [TVStyle.iceGold.opacity(0.46), TVStyle.iceGold.opacity(0.16), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: zoneWidth, height: 1)

            HStack {
                pauseButton
                    .frame(width: 240, height: 62, alignment: .leading)
                Spacer(minLength: 0)
            }
            .padding(.leading, 12)
            .frame(width: zoneWidth, height: 92, alignment: .bottomLeading)
        }
        .padding(.bottom, 4)
        .background(Color.black.opacity(0.16))
        .frame(width: zoneWidth, height: 120, alignment: .bottomLeading)
    }

    private var pauseButton: some View {
        Button { controller.togglePause() } label: {
            HStack(spacing: 14) {
                Image(systemName: controller.isPaused ? "play.fill" : "pause.fill")
                    .font(.system(size: 18, weight: .bold))
                Text(controller.isPaused ? "Fortsetzen" : "Pause")
                    .font(TVFace.ui(21, weight: .bold))
            }
            .foregroundStyle(TVStyle.whiteCream)
            .padding(.horizontal, 24)
            .frame(minWidth: 180, minHeight: 54)
            .background(Capsule().fill(isPauseButtonFocused ? TVStyle.iceGold.opacity(0.16) : Color.black.opacity(0.38)))
            .overlay(Capsule().stroke(TVStyle.iceGold.opacity(isPauseButtonFocused ? 0.92 : 0.52), lineWidth: isPauseButtonFocused ? 2 : 1))
            .scaleEffect(isPauseButtonFocused ? 1.018 : 1)
        }
        .buttonStyle(DarTVButtonStyle())
        .focused($isPauseButtonFocused)
        .prefersDefaultFocus(in: screensaverFocusScope)
        .focusEffectDisabled(true)
    }

    @MainActor
    private func refreshLiveStatus() async {
        if let local = await TVWeatherService.localContext() {
            var updated = prayerSnapshot
            updated.cityLabel = local.place
            updated.latitude = local.latitude
            updated.longitude = local.longitude
            updated.fajrAngle = 12
            updated.prayers = TVPrayerEngine.times(for: Date(), lat: local.latitude, lng: local.longitude, angle: 12, asrFactor: updated.asrFactor)
            updated.updatedAt = Date()
            prayerSnapshot = TVSnapshotStore.refresh(updated)
            TVSnapshotStore.save(prayerSnapshot)
        } else {
            prayerSnapshot = TVSnapshotStore.load()
        }

        let weather = await TVWeatherService.load()
        localWeather = weather.first(where: { $0.place == prayerSnapshot.cityLabel }) ?? weather.first
    }
}
