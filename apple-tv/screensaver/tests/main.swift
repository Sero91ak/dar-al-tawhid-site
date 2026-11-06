import Foundation

/// Standalone regression tests without an Xcode project:
/// swiftc apple-tv/screensaver/ScreensaverRotationStore.swift \
///   apple-tv/screensaver/tests/main.swift -o /tmp/dar-rotation-test
/// /tmp/dar-rotation-test
func check(_ expression: @autoclosure () -> Bool, _ message: String) {
    precondition(expression(), message)
}

func cards(_ count: Int, start: Int = 1) -> [ScreensaverRotationStore.Card] {
    let kinds = ScreensaverRotationStore.Kind.allCases
    return (start..<(start + count)).map {
        .init(id: "CARD-\($0)", kind: kinds[($0 - 1) % 3])
    }
}

func statePath() -> URL {
    FileManager.default.temporaryDirectory
        .appendingPathComponent("rotation-test-\(UUID().uuidString).json")
}

func restartAndUniquePass() {
    let url = statePath()
    defer { try? FileManager.default.removeItem(at: url) }
    let all = cards(51)
    let initial = ScreensaverRotationStore(stateURL: url)
    initial.useVerifiedCatalog(all)
    let first = initial.currentOrNext()!
    check(initial.currentOrNext() == first, "Current card must remain stable")

    let interrupted = ScreensaverRotationStore(stateURL: url)
    interrupted.useVerifiedCatalog(all)
    check(interrupted.currentOrNext() == first, "Unfinished card must resume")
    interrupted.markCurrentAsDisplayed()

    let reopened = ScreensaverRotationStore(stateURL: url)
    reopened.useVerifiedCatalog(all)
    check(reopened.seenCount == 1, "Restart erased saved progress")
    check(reopened.currentOrNext()!.id != first.id, "Restart replayed first card")
    var unique = Set([first.id])
    var displays = 1
    while reopened.remainingCount > 0 {
        let card = reopened.currentOrNext()!
        unique.insert(card.id)
        reopened.markCurrentAsDisplayed()
        displays += 1
        check(displays <= 52, "Too many repeats before completing a cycle")
    }
    check(unique.count == 51, "Not every entry was displayed")
    check(reopened.seenCount == 51, "Pass did not count unique entries")
    check(displays == 52, "Only one optional echo is permitted per cycle")
    _ = reopened.currentOrNext()
    check(reopened.cycle == 2, "Did not start next cycle after full pass")
}

func updatesNeverRestart() {
    let url = statePath()
    defer { try? FileManager.default.removeItem(at: url) }
    let original = cards(15)
    let store = ScreensaverRotationStore(stateURL: url)
    store.useVerifiedCatalog(original)
    let first = store.currentOrNext()!
    store.markCurrentAsDisplayed()
    store.useVerifiedCatalog([])
    check(store.seenCount == 1, "Empty/failed sync reset progress")
    store.useVerifiedCatalog(original + cards(3, start: 16))
    check(store.seenCount == 1, "New entries reset progress")
    check(store.remainingCount == 17, "New entries not merged into remaining bag")
    var seen: Set<String> = [first.id]
    while store.remainingCount > 0 {
        let card = store.currentOrNext()!
        seen.insert(card.id)
        store.markCurrentAsDisplayed()
    }
    check(seen == Set(cards(18).map(\.id)), "Pass lost an entry after sync")
}

func mixAndRemoval() {
    let url = statePath()
    defer { try? FileManager.default.removeItem(at: url) }
    let original = cards(90)
    let store = ScreensaverRotationStore(stateURL: url)
    store.useVerifiedCatalog(original)
    var kinds: [ScreensaverRotationStore.Kind] = []
    for _ in 0..<15 {
        kinds.append(store.currentOrNext()!.kind)
        store.markCurrentAsDisplayed()
    }
    for kind in ScreensaverRotationStore.Kind.allCases {
        check(kinds.filter { $0 == kind }.count == 5, "5/5/5 mix changed")
    }

    let json = (try! JSONSerialization.jsonObject(with: Data(contentsOf: url))) as! [String: Any]
    let removedID = (json["remainingIDs"] as! [String]).last!
    store.useVerifiedCatalog(original.filter { $0.id != removedID })
    check(store.remainingCount == 74, "Deleted entry remained in bag")
}

restartAndUniquePass()
updatesNeverRestart()
mixAndRemoval()
print("PASS: restart, full cycle, echo, new IDs, empty sync, 5/5/5 and removal")
