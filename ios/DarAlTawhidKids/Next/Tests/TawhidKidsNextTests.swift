import XCTest
@testable import TawhidKidsNext

final class TawhidKidsNextTests: XCTestCase {
    func testDistinctSimulatorFlavor() {
        XCTAssertTrue(KidsAppShell.isCreatorTest)
        XCTAssertEqual(
            Bundle.main.bundleIdentifier,
            "de.daraltawhid.kids.next.dev",
            "The simulator target must never reuse the public KIDS bundle."
        )
    }

    func testCreatorStagingOnly() {
        XCTAssertEqual(
            KidsAppShell.launchURL.host,
            "dar-al-tawhid-kids-creator.sero91ak.workers.dev"
        )
        XCTAssertTrue(KidsAppShell.launchURL.path.hasPrefix("/kids/"))
        XCTAssertFalse(KidsAppShell.isOwnHost(
            URL(string: "https://dar-al-tawhid.de/kids/start")!
        ))
    }

    func testNoAdultNavigation() {
        XCTAssertFalse(KidsAppShell.isKidsURL(
            URL(string: "https://dar-al-tawhid.de/?page=start")!
        ))
        XCTAssertFalse(KidsAppShell.isKidsURL(
            URL(string: "https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/admin")!
        ))
    }

    func testPublicKidsLinksStayOnStaging() {
        let result = KidsAppShell.inAppURL(
            from: URL(string: "https://dar-al-tawhid.de/kids/start")!
        )
        XCTAssertEqual(result.host, KidsAppShell.launchURL.host)
        XCTAssertEqual(result.path, "/kids/start")
    }
}
