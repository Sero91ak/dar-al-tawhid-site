package de.daraltawhid.app

import android.content.Context
import org.json.JSONObject
import java.util.TimeZone

data class DarPrayerSettings(
    val city: String,
    val lat: Double,
    val lon: Double,
    val angle: Double,
    val asrFactor: Double,
    val timeZone: String
)

data class DarPrayerDay(
    val date: String,
    val fajr: String,
    val dhuhr: String,
    val asr: String,
    val maghrib: String,
    val isha: String
)

object DarWidgetStore {
    private const val PREFS = "dar_native_widgets_v1"
    private const val KEY_PRAYER_SETTINGS = "prayer_settings"
    private const val KEY_PRAYER_DAY = "prayer_day"

    fun savePrayerSettings(context: Context, json: String): Boolean {
        return try {
            val input = JSONObject(json)
            val lat = input.optDouble("lat", Double.NaN)
            val lon = input.optDouble("lon", Double.NaN)
            if (!lat.isFinite() || !lon.isFinite()) return false
            val city = input.optString("city", "").trim().ifBlank { "Standort" }
            val angle = input.optDouble("angle", 12.0).takeIf { it.isFinite() && it > 0 } ?: 12.0
            val rawAsr = when {
                input.has("asrFactor") -> input.optDouble("asrFactor", 1.0)
                input.has("asr") -> input.optDouble("asr", 1.0)
                else -> 1.0
            }
            val asr = rawAsr.takeIf { it.isFinite() && it > 0 } ?: 1.0
            val tz = input.optString("timezone", input.optString("timeZone", TimeZone.getDefault().id))
                .trim()
                .ifBlank { TimeZone.getDefault().id }

            val normalized = JSONObject()
                .put("city", city)
                .put("lat", lat)
                .put("lon", lon)
                .put("angle", angle)
                .put("asrFactor", asr)
                .put("timeZone", tz)
            prefs(context).edit().putString(KEY_PRAYER_SETTINGS, normalized.toString()).apply()
            true
        } catch (_: Exception) {
            false
        }
    }

    fun prayerSettings(context: Context): DarPrayerSettings? {
        val raw = prefs(context).getString(KEY_PRAYER_SETTINGS, null) ?: return null
        return try {
            val input = JSONObject(raw)
            val lat = input.optDouble("lat", Double.NaN)
            val lon = input.optDouble("lon", Double.NaN)
            if (!lat.isFinite() || !lon.isFinite()) return null
            DarPrayerSettings(
                city = input.optString("city", "Standort"),
                lat = lat,
                lon = lon,
                angle = input.optDouble("angle", 12.0),
                asrFactor = input.optDouble("asrFactor", 1.0),
                timeZone = input.optString("timeZone", TimeZone.getDefault().id)
            )
        } catch (_: Exception) {
            null
        }
    }

    fun savePrayerDay(context: Context, day: DarPrayerDay) {
        val data = JSONObject()
            .put("date", day.date)
            .put("fajr", day.fajr)
            .put("dhuhr", day.dhuhr)
            .put("asr", day.asr)
            .put("maghrib", day.maghrib)
            .put("isha", day.isha)
        prefs(context).edit().putString(KEY_PRAYER_DAY, data.toString()).apply()
    }

    fun prayerDay(context: Context): DarPrayerDay? {
        val raw = prefs(context).getString(KEY_PRAYER_DAY, null) ?: return null
        return try {
            val data = JSONObject(raw)
            DarPrayerDay(
                date = data.optString("date", ""),
                fajr = data.optString("fajr", "--:--"),
                dhuhr = data.optString("dhuhr", "--:--"),
                asr = data.optString("asr", "--:--"),
                maghrib = data.optString("maghrib", "--:--"),
                isha = data.optString("isha", "--:--")
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
