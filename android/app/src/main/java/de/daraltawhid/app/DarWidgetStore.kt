package de.daraltawhid.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import org.json.JSONObject
import java.util.TimeZone

object DarWidgetStore {
    private const val PREFS = "dar_native_widgets"
    private const val KEY_PRAYER_PAYLOAD = "prayer_payload"

    data class PrayerSettings(
        val city: String,
        val lat: Double,
        val lon: Double,
        val angle: Double,
        val asrFactor: Double,
        val timeZone: String
    )

    fun savePrayerSettings(context: Context, json: String) {
        try {
            val obj = JSONObject(json)
            val lat = obj.optDouble("lat", Double.NaN)
            val lon = obj.optDouble("lon", Double.NaN)
            if (!lat.isFinite() || !lon.isFinite()) return
            val tz = obj.optString(
                "timeZone",
                obj.optString("timezone", obj.optString("tz", TimeZone.getDefault().id))
            ).ifBlank { TimeZone.getDefault().id }
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("city", obj.optString("city", "Dein Standort"))
                .putLong("lat_bits", java.lang.Double.doubleToRawLongBits(lat))
                .putLong("lon_bits", java.lang.Double.doubleToRawLongBits(lon))
                .putLong("angle_bits", java.lang.Double.doubleToRawLongBits(obj.optDouble("angle", 12.0)))
                .putLong("asr_bits", java.lang.Double.doubleToRawLongBits(obj.optDouble("asrFactor", 1.0)))
                .putString("timezone", tz)
                .apply()
            PrayerTimesWidgetProvider.refreshAll(context)
        } catch (_: Throwable) {
        }
    }

    fun loadPrayerSettings(context: Context): PrayerSettings? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (!prefs.contains("lat_bits") || !prefs.contains("lon_bits")) return null
        val lat = java.lang.Double.longBitsToDouble(prefs.getLong("lat_bits", 0L))
        val lon = java.lang.Double.longBitsToDouble(prefs.getLong("lon_bits", 0L))
        if (!lat.isFinite() || !lon.isFinite()) return null
        return PrayerSettings(
            city = prefs.getString("city", "Dein Standort").orEmpty().ifBlank { "Dein Standort" },
            lat = lat,
            lon = lon,
            angle = java.lang.Double.longBitsToDouble(
                prefs.getLong("angle_bits", java.lang.Double.doubleToRawLongBits(12.0))
            ),
            asrFactor = java.lang.Double.longBitsToDouble(
                prefs.getLong("asr_bits", java.lang.Double.doubleToRawLongBits(1.0))
            ),
            timeZone = prefs.getString("timezone", TimeZone.getDefault().id)
                .orEmpty().ifBlank { TimeZone.getDefault().id }
        )
    }

    fun savePrayerPayload(context: Context, json: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_PRAYER_PAYLOAD, json).apply()
    }

    fun loadPrayerPayload(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_PRAYER_PAYLOAD, "").orEmpty()

    fun canPinWidget(context: Context, kind: String): Boolean {
        val manager = AppWidgetManager.getInstance(context)
        return manager.isRequestPinAppWidgetSupported && widgetProviderClass(kind) != null
    }

    fun requestPinWidget(context: Context, kind: String): Boolean {
        val provider = widgetProviderClass(kind) ?: return false
        val manager = AppWidgetManager.getInstance(context)
        if (!manager.isRequestPinAppWidgetSupported) return false
        return manager.requestPinAppWidget(ComponentName(context, provider), Bundle(), null)
    }

    private fun widgetProviderClass(kind: String): Class<*>? = when (kind.trim().lowercase()) {
        "prayer", "prayer-times", "gebetszeiten" -> PrayerTimesWidgetProvider::class.java
        "faith", "ayah-dua", "dua", "daily" -> DailyFaithWidgetProvider::class.java
        else -> null
    }
}
