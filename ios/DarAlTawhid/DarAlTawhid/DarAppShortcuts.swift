import AppIntents

struct DarAppShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenPrayerIntent(),
            phrases: [
                "Öffne Gebetszeiten in \(.applicationName)",
                "Wann ist Gebet in \(.applicationName)"
            ],
            shortTitle: "Gebetszeiten",
            systemImageName: "moon.stars.fill"
        )
        AppShortcut(
            intent: OpenQiblaIntent(),
            phrases: ["Öffne Qibla in \(.applicationName)"],
            shortTitle: "Qibla",
            systemImageName: "location.north.line.fill"
        )
        AppShortcut(
            intent: OpenQuranIntent(),
            phrases: ["Öffne Quran in \(.applicationName)"],
            shortTitle: "Qurʾān",
            systemImageName: "book.fill"
        )
        AppShortcut(
            intent: OpenDuasIntent(),
            phrases: ["Öffne Bittgebet in \(.applicationName)"],
            shortTitle: "Duʿāʾ",
            systemImageName: "hands.sparkles.fill"
        )
    }
}
