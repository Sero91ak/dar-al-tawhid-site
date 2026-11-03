import Foundation

enum DarWidgetStore {
    static var defaults: UserDefaults {
        UserDefaults(suiteName: DarWidgetKeys.appGroup) ?? .standard
    }

    static func load() -> DarWidgetSnapshot {
        guard let data = defaults.data(forKey: DarWidgetKeys.snapshot),
              let snap = try? JSONDecoder().decode(DarWidgetSnapshot.self, from: data) else {
            return DarDailyContent.refresh(DarWidgetSnapshot.empty)
        }
        return snap
    }

    static func save(_ snapshot: DarWidgetSnapshot) {
        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: DarWidgetKeys.snapshot)
        }
    }

    static func setPendingDestination(_ dest: DarDeepLink.Destination) {
        defaults.set(dest.webHash, forKey: DarWidgetKeys.pendingDestination)
    }

    static func peekPendingDestination() -> DarDeepLink.Destination? {
        guard let raw = defaults.string(forKey: DarWidgetKeys.pendingDestination), !raw.isEmpty else { return nil }
        return .hash(raw)
    }

    static func consumePendingDestination() -> DarDeepLink.Destination? {
        let dest = peekPendingDestination()
        defaults.removeObject(forKey: DarWidgetKeys.pendingDestination)
        return dest
    }
}


// The host app is the sole writer of these canonical prayer snapshots.
// Widget extensions read the App Group cache; they do not calculate solar times.
enum DarPrayerSync {
    private static let repositoryRoot =
        "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/content/prayer-times"

    static func refresh() async -> Bool {
        var snap = DarWidgetStore.load()
        guard let zone = TimeZone(identifier: snap.prayerTimeZone),
              snap.latitude.isFinite, snap.longitude.isFinite,
              abs(snap.latitude) <= 90, abs(snap.longitude) <= 180 else { return false }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = zone
        formatter.dateFormat = "yyyy-MM-dd"
        let dates = (0...2).compactMap { offset -> String? in
            guard let date = calendar.date(byAdding: .day, value: offset, to: Date()) else { return nil }
            return formatter.string(from: date)
        }
        var fetched = [DarCanonicalPrayerDay]()
        let isDefaultBerlin = snap.prayerTimeZone == "Europe/Berlin"
            && abs(snap.latitude - 52.52) < 0.0001
            && abs(snap.longitude - 13.405) < 0.0001
            && abs(snap.fajrAngle - 12) < 0.001
            && abs(snap.asrFactor - 1) < 0.001
        for date in dates {
            let urls: [URL]
            if isDefaultBerlin {
                urls = [
                    URL(string: repositoryRoot + "/" + date + ".json"),
                    date == dates.first ? URL(string: repositoryRoot + "/latest.json") : nil
                ].compactMap { $0 }
            } else {
                var parts = URLComponents(string: "https://dar-al-tawhid.de/api/prayer/times")
                parts?.queryItems = [
                    URLQueryItem(name: "format", value: "canonical"),
                    URLQueryItem(name: "date", value: date),
                    URLQueryItem(name: "lat", value: String(snap.latitude)),
                    URLQueryItem(name: "lon", value: String(snap.longitude)),
                    URLQueryItem(name: "tz", value: snap.prayerTimeZone),
                    URLQueryItem(name: "city", value: snap.cityLabel),
                    URLQueryItem(name: "angle", value: String(snap.fajrAngle)),
                    URLQueryItem(name: "asr", value: String(snap.asrFactor))
                ]
                urls = [parts?.url].compactMap { $0 }
            }
            for url in urls {
                var request = URLRequest(url: url)
                request.timeoutInterval = 8
                request.cachePolicy = .reloadIgnoringLocalCacheData
                request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
                do {
                    let (data, response) = try await URLSession.shared.data(for: request)
                    guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                          data.count < 100_000 else { continue }
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .custom { input in
                        let raw = try input.singleValueContainer().decode(String.self)
                        let fractional = ISO8601DateFormatter()
                        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                        let plain = ISO8601DateFormatter()
                        plain.formatOptions = [.withInternetDateTime]
                        guard let date = fractional.date(from: raw) ?? plain.date(from: raw) else {
                            throw DecodingError.dataCorruptedError(
                                in: try input.singleValueContainer(),
                                debugDescription: "Ungültiger absoluter Zeitstempel"
                            )
                        }
                        return date
                    }
                    let parsed = try decoder.decode(DarCanonicalPrayerDay.self, from: data)
                    guard parsed.date == date, parsed.matches(snap) else { continue }
                    fetched.append(parsed)
                    break
                } catch {
                    // Keep previously validated cache; stale days never become a new target.
                }
            }
        }
        guard !fetched.isEmpty else { return false }
        // A successful partial refresh preserves matching cached future days.
        let validCache = snap.canonicalPrayerDays.filter { $0.matches(snap) }
        let combined = fetched + validCache.filter { cached in
            !fetched.contains(where: { $0.date == cached.date })
        }
        snap.canonicalPrayerDays = combined.sorted { $0.date < $1.date }
        snap.lastPrayerSyncAt = Date()
        DarWidgetStore.save(snap)
        return true
    }
}
