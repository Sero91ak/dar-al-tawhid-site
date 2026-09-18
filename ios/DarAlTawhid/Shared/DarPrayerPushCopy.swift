import Foundation

/// Gebets-Push-Texte — inhaltlich synchron mit `cloudflare/prayer-push-copy.js`
/// und der Besucher-Web-App (`index.html` → PRAYER_*_PUSH_VARIANTS).
enum DarPrayerPushCopy {
    struct EntryVariant {
        let title: String
        let body: String
    }

    private static let entryVariants: [String: [EntryVariant]] = [
        "fajr": [
            EntryVariant(
                title: "✨ Fajr-Zeit ist eingetreten",
                body: "Steh auf für Allah und verrichte dein Fajr-Gebet rechtzeitig."
            )
        ],
        "dhuhr": [
            EntryVariant(
                title: "☀️ Dhuhr-Zeit ist eingetreten",
                body: "Unterbrich deine Beschäftigung und verrichte dein Dhuhr-Gebet für Allah."
            )
        ],
        "asr": [
            EntryVariant(
                title: "🌤️ ʿAṣr-Zeit ist eingetreten",
                body: "Bewahre dein ʿAṣr-Gebet und verrichte es rechtzeitig für Allah."
            )
        ],
        "maghrib": [
            EntryVariant(
                title: "🌥️ Maghrib-Zeit ist eingetreten",
                body: "Die Sonne ist untergegangen — verrichte jetzt dein Maghrib-Gebet für Allah."
            )
        ],
        "isha": [
            EntryVariant(
                title: "🌙 ʿIshāʾ-Zeit ist eingetreten",
                body: "Beende deinen Tag mit dem ʿIshāʾ-Gebet für Allah."
            )
        ],
        "tahajjud": [
            EntryVariant(
                title: "🌙 Taḥajjud-Erinnerung",
                body: "Nutze die letzte Nachtzeit für Taḥajjud, Duʿāʾ und Istighfār."
            )
        ]
    ]

    private static let advanceTemplates: [String: String] = [
        "fajr": "In {minutes} Min · {time} Uhr. Fajr naht — bereite dich vor und verrichte das Gebet für Allah.",
        "dhuhr": "In {minutes} Min · {time} Uhr. Dhuhr naht — unterbrich deinen Tag und verrichte das Gebet für Allah.",
        "asr": "In {minutes} Min · {time} Uhr. ʿAṣr naht — bewahre dieses Gebet und verrichte es rechtzeitig für Allah.",
        "maghrib": "In {minutes} Min · {time} Uhr. Maghrib naht — verrichte das Gebet ohne Aufschub für Allah.",
        "isha": "In {minutes} Min · {time} Uhr. ʿIshāʾ naht — beende deinen Tag mit dem Gebet für Allah.",
        "tahajjud": "Das letzte Drittel der Nacht naht — Zeit für Taḥajjud, Duʿāʾ und Istighfār."
    ]

    static func clampAdvanceMinutes(_ value: Int) -> Int {
        [5, 10, 15].contains(value) ? value : 15
    }

    static func sanitize(_ raw: String) -> String {
        var text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let rules: [(String, String)] = [
            (#"(?i)(?:['‘’`]\s*)?asr\b"#, "ʿAṣr"),
            (#"(?i)ʿasr\b"#, "ʿAṣr"),
            (#"(?i)wer\s+die\s+beiden\s+kühlen\s+gebete\s+bewahrt"#, "Bewahre besonders Fajr und ʿAṣr"),
            (#"(?i)verliere\s+['‘’`ʿ]?\s*a(?:s|ṣ)r\s+nicht"#, "bewahre dein ʿAṣr-Gebet"),
            (#"(?i)\bsteh(?:e)?\s+(?:für|zum)\s+den?\s+morgen"#, "Steh auf für Allah"),
            (#"(?i)\bruft\s+dich\b"#, "ist eingetreten")
        ]
        for (pattern, replacement) in rules {
            text = text.replacingOccurrences(
                of: pattern,
                with: replacement,
                options: .regularExpression
            )
        }
        while text.contains("  ") {
            text = text.replacingOccurrences(of: "  ", with: " ")
        }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func pickEntryVariant(prayerKey: String, seedExtra: String = "") -> EntryVariant {
        let key = prayerKey.lowercased()
        let list = entryVariants[key] ?? entryVariants["fajr"] ?? []
        guard !list.isEmpty else {
            return EntryVariant(title: "Gebetszeit ist eingetreten", body: "Es ist Zeit für das Gebet.")
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        let dayKey = formatter.string(from: Date())
        var seed = 0
        let seedText = "\(dayKey)-\(key)-entry-\(seedExtra)"
        for scalar in seedText.unicodeScalars {
            seed = (seed + Int(scalar.value)) % 9973
        }
        let picked = list[seed % list.count]
        return EntryVariant(title: sanitize(picked.title), body: sanitize(picked.body))
    }

    static func buildAdvanceBody(prayerKey: String, advanceMinutes: Int, timeLabel: String) -> String {
        let key = prayerKey.lowercased()
        let minutes = clampAdvanceMinutes(advanceMinutes)
        let trimmed = timeLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        let time = trimmed.isEmpty ? "--:--" : trimmed
        let template = advanceTemplates[key] ?? advanceTemplates["fajr"] ?? "In {minutes} Min · {time} Uhr."
        let body = template
            .replacingOccurrences(of: "{minutes}", with: String(minutes))
            .replacingOccurrences(of: "{time}", with: time)
        return sanitize(body)
    }

    static func advanceTitle(prayerName: String, prayerKey: String, advanceMinutes: Int) -> String {
        let minutes = clampAdvanceMinutes(advanceMinutes)
        if prayerKey.lowercased() == "tahajjud" {
            return sanitize("Taḥajjud in \(minutes) Min")
        }
        return sanitize("\(prayerName) in \(minutes) Min")
    }

    static func entryNotification(slot: DarPrayerSlot) -> (title: String, body: String) {
        let variant = pickEntryVariant(prayerKey: slot.id, seedExtra: slot.time)
        return (variant.title, variant.body)
    }

    static func advanceNotification(slot: DarPrayerSlot, advanceMinutes: Int) -> (title: String, body: String) {
        (
            advanceTitle(prayerName: slot.name, prayerKey: slot.id, advanceMinutes: advanceMinutes),
            buildAdvanceBody(prayerKey: slot.id, advanceMinutes: advanceMinutes, timeLabel: slot.time)
        )
    }
}
