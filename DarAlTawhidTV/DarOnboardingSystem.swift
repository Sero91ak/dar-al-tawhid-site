import SwiftUI
import Observation

nonisolated struct DarOnboardingCatalog: Codable, Equatable {
    let onboardingVersion: Int
    let pages: [DarOnboardingPage]
    let releases: [DarReleaseNote]
}

nonisolated struct DarOnboardingPage: Codable, Equatable, Identifiable {
    let id: String
    let title: String
    let symbol: String
    let text: String
    let bullets: [String]
    let content: String?
}

nonisolated struct DarReleaseNote: Codable, Equatable, Identifiable {
    var id: String { version }
    let version: String
    let title: String
    let changes: [String]
    let coachMarks: [String]
}

nonisolated enum DarOnboardingPresentation: Equatable {
    case none
    case onboarding
    case whatsNew
    case coachMarks
    case help
}

nonisolated struct DarCoachMark: Equatable, Identifiable {
    let id: String
    let title: String
    let text: String
    let target: DarCoachTarget
}

nonisolated enum DarCoachTarget: Equatable {
    case quranPlayer
    case reciter
    case navigation
    case prayerTimes
    case help
}

actor DarOnboardingCatalogService {
    static let shared = DarOnboardingCatalogService()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func load() async -> DarOnboardingCatalog {
        do {
            let url = AppleTVContentEnvironment.rootURL
                .appendingPathComponent("onboarding")
                .appendingPathComponent("catalog.json")
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadRevalidatingCacheData
            request.timeoutInterval = 12
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  (200...299).contains(http.statusCode) else {
                throw URLError(.badServerResponse)
            }
            let catalog = try decoder.decode(DarOnboardingCatalog.self, from: data)
            guard !catalog.pages.isEmpty else { throw URLError(.cannotParseResponse) }
            try encoder.encode(catalog).write(to: cacheURL(), options: .atomic)
            return catalog
        } catch {
            guard let data = try? Data(contentsOf: cacheURL()),
                  let cached = try? decoder.decode(DarOnboardingCatalog.self, from: data) else {
                return .fallback
            }
            return cached
        }
    }

    private func cacheURL() throws -> URL {
        let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidOnboarding", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("catalog.json")
    }
}

extension DarOnboardingCatalog {
    static let fallback = DarOnboardingCatalog(
        onboardingVersion: 1,
        pages: [
            .init(id: "welcome", title: "Willkommen bei DĀR AL TAWḤĪD", symbol: "moon.stars.fill", text: "Eine ruhige Begleitung für Gebet, Qurʾān und tägliche islamische Inhalte auf deinem Apple TV.", bullets: ["Gebetszeiten und Tagesinformationen", "Qurʾān-Rezitation mit deutscher Übersetzung", "Geprüfte Inhalte mit automatischen Aktualisierungen"], content: nil),
            .init(id: "quran", title: "Qurʾān-Player", symbol: "play.circle.fill", text: "Der kompakte Player befindet sich oben. Im Qurʾān-Bereich liest du die aktuelle Āyah auf Arabisch und Deutsch mit.", bullets: ["Starten, pausieren und stoppen", "Vorherige oder nächste Āyah wählen", "Während des Lesens bleibt der Bildschirmschoner aus"], content: nil),
            .init(id: "reciters", title: "Rezitatoren", symbol: "waveform", text: "Öffne die Rezitator-Auswahl im oberen Player. Die verfügbare Liste wird aktuell geladen und erweitert sich automatisch.", bullets: [], content: "reciters"),
            .init(id: "random", title: "Zufällige Wiedergabe", symbol: "shuffle", text: "Die Inhaltsrotation wählt abwechslungsreiche Beiträge aus und vermeidet unmittelbare Wiederholungen.", bullets: ["Sūrah und Wiedergabe bleiben manuell steuerbar", "Wechselnde Inhalte laufen nach einem vollständigen Zyklus erneut", "Neue Inhalte werden automatisch in die Rotation aufgenommen"], content: nil),
            .init(id: "navigation", title: "Navigation", symbol: "arrow.left.arrow.right", text: "Bewege den Fokus mit der Siri Remote. Ein Bereich öffnet sich erst, wenn du Select drückst.", bullets: ["Gebetszeiten", "Heute", "Kalender", "Qurʾān"], content: nil),
            .init(id: "prayer", title: "Gebetszeiten", symbol: "clock.badge.checkmark", text: "Die Zeiten werden anhand deines Standorts berechnet und laufend aktualisiert.", bullets: ["Das nächste Gebet wird hervorgehoben", "Der Countdown läuft live", "Adhān und Standortinformationen sind direkt erreichbar"], content: nil),
            .init(id: "today", title: "Heute & Kalender", symbol: "calendar", text: "Die Tagesansicht verbindet Wetter, Duʿāʾ und wechselnde Inhalte. Der Kalender zeigt Datum, islamische Hinweise und die Vorschau der nächsten Tage.", bullets: ["Datumsabhängige Tagesinformationen", "Täglich wechselnde Inhalte", "Automatische Gebetszeit-Vorschau"], content: nil),
            .init(id: "live", title: "Live-TV", symbol: "dot.radiowaves.left.and.right", text: "Live-Übertragungen erscheinen, sobald ein Stream bereitgestellt wird. Ist nichts aktiv, zeigt die App klar: „Aktuell keine Live-Übertragung verfügbar.“", bullets: ["Keine Fehlermeldung bei inaktivem Stream", "Verfügbarkeit wird aktuell geladen", "Live-Inhalte können durch Updates hinzukommen"], content: nil),
            .init(id: "automatic", title: "Was passiert automatisch?", symbol: "arrow.triangle.2.circlepath", text: "Zeit, Datum, Standort und verfügbare Inhalte halten zentrale Bereiche aktuell. Du steuerst Wiedergabe, Rezitator, Sūrah und Navigation selbst.", bullets: ["Automatisch: Zeiten, Wetter, Tages- und Rotationsinhalte", "Manuell: Player, Rezitator, Sūrah und Bereiche", "Dauerhaft verfügbar: Qurʾān, Gebetszeiten und Offline-Fallbacks"], content: nil),
            .init(id: "finish", title: "Bereit", symbol: "checkmark.seal.fill", text: "Nach dem Öffnen markieren kurze Hinweise die wichtigsten Bedienelemente direkt auf der Startseite.", bullets: ["Die Einführung bleibt über „Hilfe“ erreichbar", "Hinweise können jederzeit erneut gestartet werden"], content: nil)
        ],
        releases: [
            .init(version: "1.0", title: "Neu in DĀR AL TAWḤĪD", changes: ["Qurʾān-Player mit synchronisierten Āyāt", "Dynamische Rezitator-Auswahl", "Gebetszeiten, Heute und Kalender", "Ruhige tvOS-Navigation", "Live-TV-Bereitschaft und automatische Inhalte"], coachMarks: ["quranPlayer", "reciter", "navigation"])
        ]
    )
}

@MainActor
@Observable
final class DarOnboardingCoordinator {
    private enum Keys {
        static let completed = "hasCompletedOnboarding"
        static let lastVersion = "lastSeenAppVersion"
        static let hints = "hasSeenFeatureHints"
        static let onboardingVersion = "lastSeenOnboardingVersion"
    }

    var presentation: DarOnboardingPresentation = .none
    var pageIndex = 0
    var coachIndex = 0
    var catalog: DarOnboardingCatalog = .fallback
    var reciterNames: [String] = []

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var currentVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    }

    var currentRelease: DarReleaseNote? {
        catalog.releases.first { $0.version == currentVersion }
    }

    var currentCoachMark: DarCoachMark? {
        guard coachMarks.indices.contains(coachIndex) else { return nil }
        return coachMarks[coachIndex]
    }

    private var coachMarks: [DarCoachMark] {
        [
            .init(id: "quranPlayer", title: "Qurʾān-Player", text: "Hier steuerst du die Wiedergabe und öffnest die Sūrah-Auswahl.", target: .quranPlayer),
            .init(id: "reciter", title: "Rezitator auswählen", text: "Hier wechselst du zwischen den aktuell verfügbaren Qurrāʾ.", target: .reciter),
            .init(id: "navigation", title: "Bereiche wechseln", text: "Navigiere links oder rechts und bestätige den gewünschten Bereich mit Select.", target: .navigation),
            .init(id: "prayerTimes", title: "Aktuelle Gebetszeiten", text: "Countdown und Zeiten aktualisieren sich automatisch für deinen Standort.", target: .prayerTimes),
            .init(id: "help", title: "Hilfe jederzeit öffnen", text: "Hier findest du die Einführung und kannst diese Hinweise erneut starten.", target: .help)
        ]
    }

    func prepare() async {
        async let loadedCatalog = DarOnboardingCatalogService.shared.load()
        async let reciters = QuranReciterService.shared.loadReciters()
        catalog = await loadedCatalog
        reciterNames = await reciters.map(\.displayName)
        chooseInitialPresentation()
    }

    func nextPage() {
        guard pageIndex + 1 < catalog.pages.count else {
            completeOnboarding()
            return
        }
        pageIndex += 1
    }

    func previousPage() {
        pageIndex = max(0, pageIndex - 1)
    }

    func completeOnboarding() {
        defaults.set(true, forKey: Keys.completed)
        defaults.set(catalog.onboardingVersion, forKey: Keys.onboardingVersion)
        defaults.set(currentVersion, forKey: Keys.lastVersion)
        pageIndex = 0
        if !defaults.bool(forKey: Keys.hints) {
            coachIndex = 0
            presentation = .coachMarks
        } else {
            presentation = .none
        }
    }

    func showOnboarding() {
        pageIndex = 0
        presentation = .onboarding
    }

    func showHelp() {
        presentation = .help
    }

    func replayHints() {
        coachIndex = 0
        presentation = .coachMarks
    }

    func nextCoachMark() {
        guard coachIndex + 1 < coachMarks.count else {
            finishCoachMarks()
            return
        }
        coachIndex += 1
    }

    func finishCoachMarks() {
        defaults.set(true, forKey: Keys.hints)
        defaults.set(currentVersion, forKey: Keys.lastVersion)
        presentation = .none
    }

    func dismissWhatsNew() {
        defaults.set(currentVersion, forKey: Keys.lastVersion)
        presentation = .none
    }

    private func chooseInitialPresentation() {
        let completed = defaults.bool(forKey: Keys.completed)
        let seenOnboardingVersion = defaults.integer(forKey: Keys.onboardingVersion)
        if !completed || seenOnboardingVersion < catalog.onboardingVersion {
            presentation = .onboarding
            return
        }

        let lastVersion = defaults.string(forKey: Keys.lastVersion)
        if lastVersion != currentVersion, currentRelease != nil {
            presentation = .whatsNew
        } else {
            presentation = .none
        }
    }
}

struct DarOnboardingView: View {
    let coordinator: DarOnboardingCoordinator
    @FocusState private var focusedAction: Action?

    private enum Action: Hashable { case back, next }

    private var page: DarOnboardingPage {
        coordinator.catalog.pages[coordinator.pageIndex]
    }

    var body: some View {
        ZStack {
            TVStyle.background(date: .now)
            TVAmanahPattern(date: .now).opacity(0.32)
            TVAmbientSky(intensity: .subtle)

            HStack(spacing: 70) {
                DarOnboardingProgress(pages: coordinator.catalog.pages, currentIndex: coordinator.pageIndex)
                    .frame(width: 300)

                DarOnboardingPageContent(page: page, reciterNames: coordinator.reciterNames)
                    .id(page.id)
                    .transition(.opacity.combined(with: .move(edge: .trailing)))

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 110)
            .padding(.vertical, 80)

            VStack {
                Spacer()
                HStack(spacing: 22) {
                    if coordinator.pageIndex > 0 {
                        onboardingButton("Zurück", symbol: "chevron.left", action: .back) {
                            withAnimation(.easeInOut(duration: 0.24)) { coordinator.previousPage() }
                        }
                    }
                    onboardingButton(
                        coordinator.pageIndex == coordinator.catalog.pages.count - 1 ? "DĀR AL TAWḤĪD öffnen" : "Weiter",
                        symbol: coordinator.pageIndex == coordinator.catalog.pages.count - 1 ? "checkmark" : "chevron.right",
                        action: .next
                    ) {
                        withAnimation(.easeInOut(duration: 0.24)) { coordinator.nextPage() }
                    }
                }
                .padding(.bottom, 68)
            }
        }
        .focusScope(UUID())
        .onAppear { focusedAction = .next }
        .onMoveCommand { direction in
            if direction == .right { coordinator.nextPage() }
            if direction == .left { coordinator.previousPage() }
        }
        .onExitCommand {
            if coordinator.pageIndex > 0 { coordinator.previousPage() }
        }
        .ignoresSafeArea()
    }

    private func onboardingButton(
        _ title: String,
        symbol: String,
        action: Action,
        perform: @escaping () -> Void
    ) -> some View {
        Button(action: perform) {
            Label(title, systemImage: symbol)
                .font(TVFace.ui(22, weight: .bold))
                .foregroundStyle(focusedAction == action ? TVStyle.ink : TVStyle.whiteCream)
                .padding(.horizontal, 28)
                .frame(minWidth: 190, minHeight: 58)
                .background(Capsule().fill(focusedAction == action ? TVStyle.iceGold : Color.black.opacity(0.45)))
                .overlay(Capsule().stroke(TVStyle.iceGold.opacity(0.7), lineWidth: 1.4))
        }
        .buttonStyle(DarTVButtonStyle())
        .focused($focusedAction, equals: action)
        .focusEffectDisabled(true)
    }
}

private struct DarOnboardingProgress: View {
    let pages: [DarOnboardingPage]
    let currentIndex: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("EINFÜHRUNG")
                .font(TVFace.ui(18, weight: .heavy))
                .tracking(2.2)
                .foregroundStyle(TVStyle.iceGold)

            ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                HStack(spacing: 13) {
                    Circle()
                        .fill(index == currentIndex ? TVStyle.gold : TVStyle.cream.opacity(index < currentIndex ? 0.48 : 0.16))
                        .frame(width: index == currentIndex ? 13 : 9, height: index == currentIndex ? 13 : 9)
                    Text(page.title)
                        .font(TVFace.ui(16, weight: index == currentIndex ? .bold : .medium))
                        .foregroundStyle(index == currentIndex ? TVStyle.whiteCream : TVStyle.cream.opacity(0.52))
                        .lineLimit(1)
                }
                .animation(.easeInOut(duration: 0.2), value: currentIndex)
            }
        }
    }
}

private struct DarOnboardingPageContent: View {
    let page: DarOnboardingPage
    let reciterNames: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Image(systemName: page.symbol)
                .font(.system(size: 58, weight: .semibold))
                .foregroundStyle(TVStyle.iceGold)
                .shadow(color: TVStyle.gold.opacity(0.25), radius: 16)

            Text(page.title)
                .font(TVFace.title(48, weight: .bold))
                .foregroundStyle(TVStyle.whiteCream)

            Text(page.text)
                .font(TVFace.ui(27, weight: .medium))
                .foregroundStyle(TVStyle.cream.opacity(0.88))
                .lineSpacing(6)
                .frame(maxWidth: 1050, alignment: .leading)

            if page.content == "reciters" {
                DarReciterOverview(names: reciterNames)
            } else {
                VStack(alignment: .leading, spacing: 13) {
                    ForEach(page.bullets, id: \.self) { bullet in
                        Label(bullet, systemImage: "diamond.fill")
                            .font(TVFace.ui(21, weight: .semibold))
                            .foregroundStyle(TVStyle.cream.opacity(0.82))
                            .symbolRenderingMode(.monochrome)
                    }
                }
            }

            Spacer(minLength: 80)
        }
        .frame(maxWidth: 1120, maxHeight: .infinity, alignment: .topLeading)
    }
}

private struct DarReciterOverview: View {
    let names: [String]

    private var visibleNames: [String] { Array(names.prefix(10)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if visibleNames.isEmpty {
                Label("Rezitatoren werden geladen …", systemImage: "arrow.triangle.2.circlepath")
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], alignment: .leading, spacing: 12) {
                    ForEach(visibleNames, id: \.self) { name in
                        Label(name, systemImage: "waveform")
                            .lineLimit(1)
                    }
                }
                if names.count > visibleNames.count {
                    Text("und \(names.count - visibleNames.count) weitere Rezitatoren")
                        .foregroundStyle(TVStyle.iceGold)
                }
            }
        }
        .font(TVFace.ui(19, weight: .semibold))
        .foregroundStyle(TVStyle.cream.opacity(0.86))
        .frame(maxWidth: 1000, alignment: .leading)
    }
}

struct DarWhatsNewView: View {
    let release: DarReleaseNote
    let onDismiss: () -> Void
    let onShowFeatures: () -> Void
    @FocusState private var focusedButton: Int?

    var body: some View {
        ZStack {
            Color.black.opacity(0.78).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 28) {
                Label("NEU IN DĀR AL TAWḤĪD", systemImage: "sparkles")
                    .font(TVFace.ui(19, weight: .heavy))
                    .tracking(2)
                    .foregroundStyle(TVStyle.iceGold)
                Text("Version \(release.version)")
                    .font(TVFace.title(46, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                VStack(alignment: .leading, spacing: 15) {
                    ForEach(release.changes, id: \.self) { change in
                        Label(change, systemImage: "checkmark.circle.fill")
                            .font(TVFace.ui(23, weight: .semibold))
                            .foregroundStyle(TVStyle.cream.opacity(0.88))
                    }
                }
                HStack(spacing: 20) {
                    updateButton("Verstanden", index: 0, action: onDismiss)
                    updateButton("Neue Funktionen zeigen", index: 1, action: onShowFeatures)
                }
            }
            .padding(55)
            .frame(width: 1050, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 38).fill(Color.black.opacity(0.92)))
            .overlay(RoundedRectangle(cornerRadius: 38).stroke(TVStyle.iceGold.opacity(0.45), lineWidth: 1.5))
        }
        .onAppear { focusedButton = 0 }
    }

    private func updateButton(_ title: String, index: Int, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(TVFace.ui(20, weight: .bold))
            .foregroundStyle(focusedButton == index ? TVStyle.ink : TVStyle.whiteCream)
            .padding(.horizontal, 25)
            .frame(minHeight: 56)
            .background(Capsule().fill(focusedButton == index ? TVStyle.iceGold : Color.white.opacity(0.08)))
            .focused($focusedButton, equals: index)
            .focusEffectDisabled(true)
    }
}

struct DarHelpMenuView: View {
    let onOnboarding: () -> Void
    let onHints: () -> Void
    let onClose: () -> Void
    @FocusState private var focusedItem: Int?

    var body: some View {
        ZStack {
            Color.black.opacity(0.78).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 26) {
                Text("So funktioniert die App")
                    .font(TVFace.title(42, weight: .bold))
                    .foregroundStyle(TVStyle.whiteCream)
                helpButton("App-Einführung", symbol: "rectangle.stack.fill", index: 0, action: onOnboarding)
                helpButton("Hinweise erneut anzeigen", symbol: "lightbulb.fill", index: 1, action: onHints)
                helpButton("Schließen", symbol: "xmark", index: 2, action: onClose)
            }
            .padding(50)
            .frame(width: 760, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 36).fill(Color.black.opacity(0.94)))
            .overlay(RoundedRectangle(cornerRadius: 36).stroke(TVStyle.iceGold.opacity(0.42), lineWidth: 1.5))
        }
        .onAppear { focusedItem = 0 }
        .onExitCommand(perform: onClose)
    }

    private func helpButton(_ title: String, symbol: String, index: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(TVFace.ui(22, weight: .bold))
                .foregroundStyle(focusedItem == index ? TVStyle.ink : TVStyle.whiteCream)
                .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
                .padding(.horizontal, 22)
                .background(RoundedRectangle(cornerRadius: 18).fill(focusedItem == index ? TVStyle.iceGold : Color.white.opacity(0.07)))
        }
        .focused($focusedItem, equals: index)
        .focusEffectDisabled(true)
    }
}

struct DarCoachMarksOverlay: View {
    let mark: DarCoachMark
    let isLast: Bool
    let onNext: () -> Void
    let onClose: () -> Void
    @FocusState private var isButtonFocused: Bool
    @State private var pulse = false

    var body: some View {
        GeometryReader { geometry in
            let target = targetRect(for: mark.target, size: geometry.size)
            ZStack {
                CoachDimmer(hole: target)
                    .fill(Color.black.opacity(0.70), style: FillStyle(eoFill: true))
                    .ignoresSafeArea()

                RoundedRectangle(cornerRadius: 28)
                    .stroke(TVStyle.iceGold.opacity(pulse ? 0.95 : 0.45), lineWidth: pulse ? 4 : 2)
                    .shadow(color: TVStyle.gold.opacity(pulse ? 0.55 : 0.20), radius: pulse ? 22 : 10)
                    .frame(width: target.width, height: target.height)
                    .position(x: target.midX, y: target.midY)
                    .scaleEffect(pulse ? 1.012 : 1)

                VStack(alignment: .leading, spacing: 16) {
                    Text(mark.title)
                        .font(TVFace.title(30, weight: .bold))
                        .foregroundStyle(TVStyle.iceGold)
                    Text(mark.text)
                        .font(TVFace.ui(21, weight: .semibold))
                        .foregroundStyle(TVStyle.whiteCream)
                        .lineSpacing(4)
                    Button(isLast ? "Hinweise abschließen" : "Weiter", action: onNext)
                        .font(TVFace.ui(19, weight: .bold))
                        .foregroundStyle(TVStyle.ink)
                        .padding(.horizontal, 24)
                        .frame(minHeight: 52)
                        .background(Capsule().fill(TVStyle.iceGold))
                        .focused($isButtonFocused)
                        .focusEffectDisabled(true)
                }
                .padding(28)
                .frame(width: 520, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 26).fill(Color.black.opacity(0.95)))
                .overlay(RoundedRectangle(cornerRadius: 26).stroke(TVStyle.iceGold.opacity(0.55), lineWidth: 1.4))
                .position(x: tooltipX(for: target, size: geometry.size), y: min(geometry.size.height - 170, target.maxY + 145))
            }
        }
        .onAppear {
            isButtonFocused = true
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) { pulse = true }
        }
        .onExitCommand(perform: onClose)
        .transition(.opacity)
    }

    private func targetRect(for target: DarCoachTarget, size: CGSize) -> CGRect {
        switch target {
        case .quranPlayer: return CGRect(x: size.width * 0.39, y: size.height * 0.045, width: size.width * 0.34, height: size.height * 0.105)
        case .reciter: return CGRect(x: size.width * 0.56, y: size.height * 0.045, width: size.width * 0.18, height: size.height * 0.105)
        case .navigation: return CGRect(x: size.width * 0.19, y: size.height * 0.15, width: size.width * 0.62, height: size.height * 0.105)
        case .prayerTimes: return CGRect(x: size.width * 0.10, y: size.height * 0.31, width: size.width * 0.39, height: size.height * 0.53)
        case .help: return CGRect(x: size.width * 0.77, y: size.height * 0.89, width: size.width * 0.15, height: size.height * 0.075)
        }
    }

    private func tooltipX(for target: CGRect, size: CGSize) -> CGFloat {
        min(max(300, target.midX), size.width - 300)
    }
}

private struct CoachDimmer: Shape {
    let hole: CGRect

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.addRect(rect)
        path.addRoundedRect(in: hole, cornerSize: CGSize(width: 28, height: 28))
        return path
    }
}
