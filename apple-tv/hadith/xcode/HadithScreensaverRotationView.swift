import SwiftUI

/// Autonomer Apple-TV-Bildschirmschoner.
/// Wechselt die Karte in festem Takt nach der Shuffle-Bag-Regel aus
/// `apple-tv/screensaver/rotation.json`. Ein Fehler bei einer Karte hält die
/// Rotation nie an: nach kurzer Pause wird erneut versucht, die aktuelle Karte
/// bleibt so lange sichtbar.
@MainActor
final class HadithScreensaverRotationController: ObservableObject {
    @Published private(set) var current: HadithRecord?

    static let displaySeconds: UInt64 = 60
    private static let retrySeconds: UInt64 = 5

    private var loop: Task<Void, Never>?

    func start() {
        guard loop == nil else { return }
        loop = Task { [weak self] in
            while !Task.isCancelled {
                guard let self else { return }
                let advanced = await self.advance()
                let wait = advanced ? Self.displaySeconds : Self.retrySeconds
                try? await Task.sleep(nanoseconds: wait * 1_000_000_000)
            }
        }
    }

    func stop() {
        loop?.cancel()
        loop = nil
    }

    /// Kein Zeitlimit-Abbruch um den Provider herum: eine abgebrochene Abfrage
    /// könnte eine ID verbrauchen, die nie angezeigt wird, und damit die Regel
    /// „jede Aussage einmal vor Wiederholung“ brechen. Netzwerkzugriffe sind
    /// im Provider selbst zeitbegrenzt und laufen nach dem ersten Laden im Hintergrund.
    private func advance() async -> Bool {
        guard let next = try? await HadithScreensaverProvider.shared.nextContent() else {
            return false
        }
        current = next
        return true
    }
}

struct HadithScreensaverRotationView: View {
    @StateObject private var controller = HadithScreensaverRotationController()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let record = controller.current {
                HadithScreensaverCardView(hadith: record)
                    .id(record.id)
                    .transition(.opacity)
            } else {
                ProgressView()
                    .controlSize(.large)
            }
        }
        .animation(.easeInOut(duration: 0.8), value: controller.current?.id)
        .onAppear { controller.start() }
        .onDisappear { controller.stop() }
    }
}
