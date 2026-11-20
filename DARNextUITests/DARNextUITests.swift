//
//  DARNextUITests.swift
//  DARNextUITests
//
//  Created by Serhat Abu Malik on 23.10.26.
//

import XCTest

final class DARNextUITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    @MainActor
    func testPrimaryTabsAndQuizNavigation() throws {
        let app = XCUIApplication()
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10))
        XCTAssertEqual(
            tabBar.buttons.allElementsBoundByIndex.map(\.label),
            ["Start", "Quiz", "Beiträge", "Qurʾān", "Mehr"]
        )

        tabBar.buttons["Quiz"].tap()
        XCTAssertTrue(app.navigationBars["Wissensquiz"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Lernrunde starten"].waitForExistence(timeout: 10))
    }

    @MainActor
    func testPostOpensItsExactTopicQuizAndReturnsToPosts() throws {
        let app = XCUIApplication()
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10))
        tabBar.buttons["Beiträge"].tap()

        let postID = "post-card-liebe-fuer-deinen-bruder-was-du-fuer-dich-liebst-179"
        let postCard = app.descendants(matching: .any).matching(identifier: postID).firstMatch
        for _ in 0..<30 where !postCard.isHittable {
            app.swipeUp()
        }
        XCTAssertTrue(postCard.waitForExistence(timeout: 10))
        postCard.tap()

        let topicQuizLink = app.descendants(matching: .any).matching(identifier: "post-detail-context-quiz").firstMatch
        XCTAssertTrue(topicQuizLink.waitForExistence(timeout: 10))
        topicQuizLink.tap()

        let topicFilter = app.descendants(matching: .any)["quiz-topic-filter"]
        XCTAssertTrue(topicFilter.waitForExistence(timeout: 10))
        XCTAssertTrue((topicFilter.value as? String ?? "").contains("Brüderlichkeit"))
        XCTAssertTrue(app.buttons["Lernrunde starten"].exists)

        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.navigationBars["Beitrag"].waitForExistence(timeout: 10))
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(postCard.waitForExistence(timeout: 10))
        XCTAssertTrue(postCard.isHittable)
    }

    @MainActor
    func testAssistantPrototypeIsNotExposedInPublicNavigation() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["Schnellzugriff"].waitForExistence(timeout: 10))
        let dashboardAssistant = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "Assistant")
        ).firstMatch
        XCTAssertFalse(dashboardAssistant.exists)
        XCTAssertFalse(app.staticTexts["Assistant"].exists)

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10))
        tabBar.buttons["Mehr"].tap()

        let hubLink = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "Islamische Bereiche")
        ).firstMatch
        XCTAssertTrue(hubLink.waitForExistence(timeout: 10))
        hubLink.tap()
        XCTAssertTrue(app.navigationBars["Wissen"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["ʿIbādah"].waitForExistence(timeout: 10))
        let hubAssistant = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "AI Assistant")
        ).firstMatch
        XCTAssertFalse(hubAssistant.exists)
        XCTAssertFalse(app.staticTexts["AI Assistant"].exists)
    }

    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
