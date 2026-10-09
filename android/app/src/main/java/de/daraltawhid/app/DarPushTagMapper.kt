package de.daraltawhid.app

import org.json.JSONObject
import java.util.Locale
import java.util.TimeZone

/**
 * Translates the shared adult-app preference schema into the exact tags expected by
 * the production prayer, Jumuʿah and daily-push schedulers.
 * Never forwards arbitrary WebView-originated JSON keys to OneSignal.
 */
object DarPushTagMapper {
    private fun enabled(settings: JSONObject, name: String, default: Boolean = false): Boolean =
        if (settings.has(name) && !settings.isNull(name)) settings.optBoolean(name, default) else default

    private fun coordinate(settings: JSONObject, key: String, bound: Double): Double? {
        if (settings.isNull(key) || !settings.has(key)) return null
        val value = settings.optDouble(key, Double.NaN)
        return value.takeIf { it.isFinite() && it >= -bound && it <= bound }
    }

    private fun time(settings: JSONObject, key: String, fallback: String): String {
        val value = settings.optString(key, fallback)
        val match = Regex("^(\\d{1,2}):(\\d{2})$").matchEntire(value) ?: return fallback
        val hour = match.groupValues[1].toIntOrNull() ?: return fallback
        val minute = match.groupValues[2].toIntOrNull() ?: return fallback
        return if (hour in 0..23 && minute in 0..59) "%02d:%02d".format(Locale.US, hour, minute) else fallback
    }

    fun fromJson(json: String, timezone: String = TimeZone.getDefault().id): Map<String, String> {
        require(json.length <= 32_768) { "Push settings payload too large" }
        val settings = JSONObject(json)
        val latitude = coordinate(settings, "lat", 90.0)
        val longitude = coordinate(settings, "lon", 180.0)
        val locationAvailable = latitude != null && longitude != null &&
            enabled(settings, "locationGranted")
        val prayerOn = enabled(settings, "reminder") && locationAvailable
        val duaOn = enabled(settings, "dailyDua", true)
        val recOn = enabled(settings, "dailyRecommendation", true)
        val jummahOn = enabled(settings, "jummahNotifications")
        val jummahManual = enabled(settings, "jummahUseManualTime")
        val angle = settings.optDouble("angle", 12.0)
            .takeIf { it.isFinite() && it in 0.0..30.0 } ?: 12.0
        val asrFactor = settings.optInt("asrFactor", 1).takeIf { it in 1..2 } ?: 1
        val advance = settings.optInt("advanceMinutes", 15).takeIf { it in listOf(5, 10, 15) } ?: 15
        val jummahAdvance = settings.optInt("jummahAdvanceMinutes", 30)
            .takeIf { it in listOf(15, 30, 45, 60) } ?: 30
        val tahajjud = settings.optString("tahajjudMode", "off")
            .takeIf { it in setOf("off", "before30", "before60", "before90", "lastThird") } ?: "off"

        val tags = mutableMapOf(
            "platform" to "android",
            "dar_client" to "native_android",
            "dar_env" to "live",
            "dar_surface" to "native",
            "dar_app" to "true",
            "dar_push" to "true",
            "post_notifications" to "true",
            "push_site" to "dar-al-tawhid",
            "push_version" to "9",
            "prayer_notifications" to prayerOn.toString(),
            "prayer_reminders_enabled" to prayerOn.toString(),
            "prayer_timezone" to timezone,
            "push_timezone" to timezone,
            "prayer_method" to angle.toString(),
            "prayer_asr_factor" to asrFactor.toString(),
            "prayer_advance_minutes" to advance.toString(),
            "prayer_tahajjud_mode" to tahajjud,
            "daily_dua_notifications" to duaOn.toString(),
            "daily_recommendation_notifications" to recOn.toString(),
            "daily_dua_enabled" to duaOn.toString(),
            "daily_recommended_enabled" to recOn.toString(),
            "daily_dua_time" to time(settings, "dailyDuaTime", "09:00"),
            "daily_recommendation_time" to time(settings, "dailyRecommendationTime", "12:00"),
            "reminders_enabled" to (prayerOn || duaOn || recOn || jummahOn).toString(),
            "jummah_notifications" to jummahOn.toString(),
            "jummah_use_manual_time" to jummahManual.toString(),
            "jummah_manual_time" to time(settings, "jummahManualTime", "13:30"),
            "jummah_morning_time" to time(settings, "jummahMorningTime", "09:00"),
            "jummah_advance_minutes" to jummahAdvance.toString()
        )
        if (locationAvailable) {
            tags["prayer_lat"] = "%.5f".format(Locale.US, latitude)
            tags["prayer_lon"] = "%.5f".format(Locale.US, longitude)
        }
        listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha").forEach { prayer ->
            tags["prayer_${prayer.lowercase(Locale.US)}_notifications"] =
                enabled(settings, "prayer$prayer", true).toString()
        }
        return tags
    }
}
