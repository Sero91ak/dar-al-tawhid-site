package de.daraltawhid.tv

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Pure Kotlin clock contract ported from the original
 * DarAlTawhidTV/TVAdhan.swift:
 * - 5 obligatory prayers only (sunrise/tahajjud excluded)
 * - play only during the exact published minute, never in advance or as catch-up
 * - once per prayer/local day, including after reopening the app
 * - location and API version are handled by the Activity, not this clock
 */
internal object TvAdhanSchedule {
    val prayerKeys = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
    val titles = mapOf(
        "fajr" to "Faǧr", "dhuhr" to "Ẓuhr", "asr" to "ʿAṣr",
        "maghrib" to "Maġrib", "isha" to "ʿIšāʾ"
    )

    data class DuePrayer(val key: String, val title: String, val time: String, val triggerKey: String)

    fun parsedTimes(times: Map<String, String>): Map<String, LocalTime> {
        return prayerKeys.mapNotNull { prayer ->
            val raw = times[prayer]?.trim() ?: return@mapNotNull null
            val valid = Regex("""^(?:[01]?[0-9]|2[0-3]):[0-5][0-9]$""")
            if (!valid.matches(raw)) return@mapNotNull null
            val normalized = if (raw.length == 4) "0$raw" else raw
            val local = runCatching { LocalTime.parse(normalized) }.getOrNull()
                ?: return@mapNotNull null
            prayer to local
        }.toMap()
    }

    fun due(
        now: LocalDateTime,
        times: Map<String, LocalTime>,
        handledKeys: Set<String> = emptySet()
    ): DuePrayer? {
        for (key in prayerKeys) {
            val at = times[key] ?: continue
            if (now.hour != at.hour || now.minute != at.minute) continue
            val triggerKey = key + "-" + now.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
            if (triggerKey in handledKeys) continue
            return DuePrayer(key, titles.getValue(key), at.toString(), triggerKey)
        }
        return null
    }

    fun dateKey(now: LocalDateTime): String = now.toLocalDate().toString()
    val germanZone: ZoneId = ZoneId.of("Europe/Berlin")
}
