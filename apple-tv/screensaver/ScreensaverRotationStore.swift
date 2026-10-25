import Foundation

/// Persistent, non-repeating card order for the DĀR AL TAWḤĪD tvOS screensaver.
/// This component only selects IDs. It does not alter card layout or hold times.
public final class ScreensaverRotationStore {
    public enum Kind: String, Codable, CaseIterable {
        case hadith, athar, quranTad
    }

    public struct Card: Hashable {
        public let id: String
        public let kind: Kind
        public init(id: String, kind: Kind) {
            self.id = id
            self.kind = kind
        }
    }

    private struct State: Codable {
        var schemaVersion = 1
        var cycle = 0
        var initialized = false
        var remainingIDs: [String] = []
        var seenIDs: [String] = []
        var recentIDs: [String] = []
        var currentID: String? = nil
        var currentIsEcho = false
        var echoUsed = false
    }

    private let stateURL: URL
    private var state: State
    private var cardsByID: [String: Card] = [:]
    private let echoCooldown = 20
    private let crossCycleCooldown = 20

    /// Pass an App Support URL when embedding this in a tvOS app target.
    /// Do not use temporaryDirectory or an in-memory @State for this file.
    public init(stateURL: URL? = nil) {
        if let stateURL {
            self.stateURL = stateURL
        } else {
            let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            self.stateURL = support.appendingPathComponent("dar-screensaver-rotation-v1.json")
        }
        if let data = try? Data(contentsOf: self.stateURL),
           let saved = try? JSONDecoder().decode(State.self, from: data),
           saved.schemaVersion == 1 {
            self.state = saved
        } else {
            self.state = State()
        }
    }

    /// Only call this after a COMPLETE, validated catalog (or a complete offline cache).
    /// A failed or partial network response must not replace the current catalog.
    public func useVerifiedCatalog(_ cards: [Card]) {
        guard !cards.isEmpty else { return }
        var unique: [String: Card] = [:]
        for card in cards where !card.id.isEmpty && unique[card.id] == nil {
            unique[card.id] = card
        }
        guard !unique.isEmpty else { return }
        cardsByID = unique
        let validIDs = Set(unique.keys)

        if !state.initialized {
            state.initialized = true
            state.cycle = 1
            state.remainingIDs = mixedOrder(Array(unique.values), avoiding: [])
            save()
            return
        }

        let oldRemaining = state.remainingIDs
        state.seenIDs = state.seenIDs.filter { validIDs.contains($0) }
        state.recentIDs = state.recentIDs.filter { validIDs.contains($0) }
        state.remainingIDs = oldRemaining.filter { validIDs.contains($0) }
        if let current = state.currentID, !validIDs.contains(current) {
            state.currentID = nil
            state.currentIsEcho = false
        }

        let accountedFor = Set(state.seenIDs).union(state.remainingIDs)
        let newcomers = unique.values.filter { !accountedFor.contains($0.id) && $0.id != state.currentID }
        if !newcomers.isEmpty {
            // Keep already completed entries completed; new IDs join the remaining bag.
            // Preserve the currently visible card, so a foreground sync can't jump.
            let pending = state.remainingIDs.compactMap { unique[$0] } + newcomers
            state.remainingIDs = mixedOrder(pending, avoiding: [])
        }
        save()
    }

    /// Returns the same card until markCurrentAsDisplayed() confirms that its FULL
    /// seconds-based hold has elapsed. Pausing/closing must not consume a card.
    public func currentOrNext() -> Card? {
        guard !cardsByID.isEmpty else { return nil }
        if let current = state.currentID, let card = cardsByID[current] { return card }
        if state.remainingIDs.isEmpty { startNextCycle() }
        guard let nextID = state.remainingIDs.first else { return nil }

        // A single optional echo per pass, only once >=20 distinct cards were seen.
        // It never removes, skips or replaces an unseen card in the remaining bag.
        if !state.echoUsed && state.seenIDs.count >= echoCooldown {
            let forbidden = Set(state.recentIDs.suffix(echoCooldown))
            let candidates = state.seenIDs.filter { !forbidden.contains($0) && cardsByID[$0] != nil }
            if let echo = candidates.randomElement() {
                state.currentID = echo
                state.currentIsEcho = true
                save()
                return cardsByID[echo]
            }
        }
        state.currentID = nextID
        state.currentIsEcho = false
        save()
        return cardsByID[nextID]
    }

    /// Call exactly once AFTER a card has remained visible for its full hold time.
    /// Never call this from view init, onAppear, onDisappear or a catalog refresh.
    public func markCurrentAsDisplayed() {
        guard let id = state.currentID, cardsByID[id] != nil else { return }
        if state.currentIsEcho {
            state.echoUsed = true
        } else {
            state.remainingIDs.removeAll { $0 == id }
            if !state.seenIDs.contains(id) { state.seenIDs.append(id) }
        }
        state.recentIDs.append(id)
        state.recentIDs = Array(state.recentIDs.suffix(crossCycleCooldown))
        state.currentID = nil
        state.currentIsEcho = false
        save()
    }

    public var cycle: Int { state.cycle }
    public var seenCount: Int { state.seenIDs.count }
    public var remainingCount: Int { state.remainingIDs.count }

    private func startNextCycle() {
        guard !cardsByID.isEmpty else { return }
        let last = state.recentIDs
        state.cycle += 1
        state.seenIDs = []
        state.echoUsed = false
        state.remainingIDs = mixedOrder(Array(cardsByID.values), avoiding: last)
        save()
    }

    private func mixedOrder(_ cards: [Card], avoiding: [String]) -> [String] {
        let recent = Set(avoiding)
        var queues: [Kind: [String]] = [:]
        for kind in Kind.allCases {
            let group = cards.filter { $0.kind == kind }.map(\.id).shuffled()
            // Keep recent end-of-cycle entries near the back of the following cycle.
            queues[kind] = group.filter { !recent.contains($0) } + group.filter { recent.contains($0) }
        }
        var result: [String] = []
        // Five of each kind in every 15-card block, interleaved H / A / Q.
        // If a kind runs out, continue with the remaining kinds.
        while queues.values.contains(where: { !$0.isEmpty }) {
            for _ in 0..<5 {
                for kind in Kind.allCases {
                    if let next = queues[kind]?.first {
                        result.append(next)
                        queues[kind]?.removeFirst()
                    }
                }
            }
        }
        return result
    }

    private func save() {
        do {
            try FileManager.default.createDirectory(at: stateURL.deletingLastPathComponent(),
                                                    withIntermediateDirectories: true)
            let data = try JSONEncoder().encode(state)
            try data.write(to: stateURL, options: .atomic)
        } catch {
            // Keep RAM state, but make a persistence failure visible during tvOS QA.
            NSLog("[ScreensaverRotationStore] Unable to persist rotation: %@", String(describing: error))
        }
    }
}
