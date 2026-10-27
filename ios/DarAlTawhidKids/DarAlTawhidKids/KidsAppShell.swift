import Foundation

/// Independent native development flavor, never shipped in the App Store build.
/// Separate bundle ID + workers.dev origin keep cookies, child profiles and
/// local lesson progress separate from the visitor app.
enum KidsAppShell {
#if KIDS_CREATOR_TEST
    static let isCreatorTest = true
    private static let canonicalHost = "dar-al-tawhid-kids-creator.sero91ak.workers.dev"
    static let launchURL = URL(string: "https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/start.html")!
    // A second exact, host-isolated QA destination is allowed ONLY in KIDS TEST.
    // It serves genuine, explicitly unapproved V4 Fuṣḥā listening previews.
    static let v4AuditionHost = "dar-al-tawhid-test.sero91ak.workers.dev"
    static let v4AuditionURL = URL(string: "https://dar-al-tawhid-test.sero91ak.workers.dev/kids/start")!
    static let hosts: Set<String> = [canonicalHost, v4AuditionHost]
#else
    static let isCreatorTest = false
    private static let canonicalHost = "dar-al-tawhid.de"
    static let launchURL = URL(string: "https://dar-al-tawhid.de/kids/start")!
    static let hosts: Set<String> = ["dar-al-tawhid.de", "www.dar-al-tawhid.de"]
#endif

    static func isOwnHost(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return hosts.contains(host)
    }

    static func isKidsURL(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
#if KIDS_CREATOR_TEST
        if scheme == "daraltawhidkidstest" { return true }
#else
        if scheme == "daraltawhidkids" { return true }
#endif
        // Explicitly remap KIDS-only absolute links from the live domain to
        // the separate test origin. Adult and unrelated URLs stay external.
#if KIDS_CREATOR_TEST
        let host = url.host?.lowercased() ?? ""
        guard hosts.contains(host) || host == "dar-al-tawhid.de" || host == "www.dar-al-tawhid.de" else { return false }
#else
        guard isOwnHost(url) else { return false }
#endif
        let path = url.path.lowercased()
        return path == "/kids" || path.hasPrefix("/kids/")
            || path == "/test/kids" || path.hasPrefix("/test/kids/")
    }

    static func inAppURL(from incoming: URL) -> URL {
        let scheme = incoming.scheme?.lowercased() ?? ""
        if scheme == "daraltawhidkids" || scheme == "daraltawhidkidstest" {
            return launchURL
        }
        if isKidsURL(incoming) {
#if KIDS_CREATOR_TEST
            // Keep the dedicated test-audio origin when its own /kids links
            // open a new WebKit window. Never redirect V4 QA to Creator staging.
            if incoming.host?.lowercased() == v4AuditionHost { return incoming }
#endif
            var components = URLComponents(url: incoming, resolvingAgainstBaseURL: false) ?? URLComponents()
            components.scheme = "https"
            components.host = canonicalHost
            let path = components.path
            if path.hasPrefix("/test/kids") {
                components.path = "/kids" + String(path.dropFirst("/test/kids".count))
            }
            return components.url ?? launchURL
        }
        return launchURL
    }
}
