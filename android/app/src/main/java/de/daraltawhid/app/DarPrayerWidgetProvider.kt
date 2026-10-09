package de.daraltawhid.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.util.Locale
import kotlin.concurrent.thread

/**
 * Real native Android Home Screen widget. All prayer times come from the same
 * HTTPS prayer endpoint as the TV app. Never fabricate a location or a time.
 */
class DarPrayerWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        if (appWidgetIds.isEmpty()) return
        val pending = goAsync()
        val app = context.applicationContext
        thread(name = "dar-prayer-widget") {
            try {
                val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val latitude = prefs.getString("lat", null)?.toDoubleOrNull()
                val longitude = prefs.getString("lon", null)?.toDoubleOrNull()
                val city = prefs.getString("city", null)?.take(60).orEmpty()
                if (latitude == null || longitude == null ||
                    !latitude.isFinite() || !longitude.isFinite() ||
                    latitude !in -90.0..90.0 || longitude !in -180.0..180.0
                ) {
                    display(app, manager, appWidgetIds,
                        "Standort in der App freigeben", null)
                    return@thread
                }
                val url = "https://dar-al-tawhid.de/api/prayer/times?lat=" +
                    String.format(Locale.US, "%.5f", latitude) + "&lon=" +
                    String.format(Locale.US, "%.5f", longitude)
                var root: JSONObject? = null
                var response: HttpURLConnection? = null
                try {
                    response = URL(url).openConnection() as HttpURLConnection
                    response.connectTimeout = 8000
                    response.readTimeout = 8000
                    response.setRequestProperty("Accept", "application/json")
                    if (response.responseCode in 200..299) {
                        val raw = response.inputStream.bufferedReader().use { it.readText() }
                        if (raw.length <= 100_000) root = JSONObject(raw)
                    }
                } catch (_: Exception) {
                    // Show the latest verified source response when offline,
                    // clearly marked as saved and never claim it is live.
                } finally {
                    response?.disconnect()
                }
                // Prayer times depend on the day. A cached response from
                // yesterday can be dangerously misleading even if labelled
                // "saved". Only allow an offline cache from the same day.
                val currentDay = LocalDate.now().toString()
                val sameDayCache = prefs.getString("cached_local_date", null) == currentDay
                val settings = root ?: if (sameDayCache) runCatching {
                    JSONObject(prefs.getString("cached_response", "") ?: "")
                }.getOrNull() else null
                val saved = root == null
                if (root != null) {
                    prefs.edit()
                        .putString("cached_response", root.toString())
                        .putString("cached_local_date", currentDay)
                        .apply()
                }
                val source = settings?.optJSONObject("times")
                    ?: settings?.optJSONObject("prayers")
                    ?: settings?.optJSONObject("data")
                    ?: settings
                val data = source?.optJSONObject("times") ?: source
                val labels = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
                val times = labels.map { key ->
                    val record = data?.opt(key) ?: data?.opt(key.replaceFirstChar { it.uppercase() })
                    val raw = when (record) {
                        is JSONObject -> record.optString("time")
                        is String -> record
                        else -> ""
                    }
                    Regex("""\b(?:[01]?\d|2[0-3]):[0-5]\d\b""").find(raw)?.value ?: "—"
                }
                if (times.all { it == "—" }) {
                    display(app, manager, appWidgetIds,
                        "Gebetszeiten nicht erreichbar", null)
                } else {
                    display(app, manager, appWidgetIds,
                        (city.ifBlank { "Mein Standort" }) + if (saved) " · gespeichert" else "",
                        times)
                }
            } finally {
                pending.finish()
            }
        }
    }

    private fun display(
        context: Context,
        manager: AppWidgetManager,
        widgetIds: IntArray,
        location: String,
        times: List<String>?
    ) {
        for (id in widgetIds) {
            val view = RemoteViews(context.packageName, R.layout.widget_prayer)
            view.setTextViewText(R.id.widget_location, location)
            val values = listOf(
                R.id.widget_fajr, R.id.widget_dhuhr, R.id.widget_asr,
                R.id.widget_maghrib, R.id.widget_isha
            )
            values.forEachIndexed { index, viewId ->
                view.setTextViewText(viewId, times?.getOrNull(index) ?: "—")
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DarShell.LIVE_URL.replace("#home", "#prayer")),
                context, MainActivity::class.java)
            val action = PendingIntent.getActivity(
                context, 91, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            view.setOnClickPendingIntent(R.id.widget_root, action)
            manager.updateAppWidget(id, view)
        }
    }

    companion object {
        const val PREFS = "dar_android_prayer_widget"

        fun saveLocation(context: Context, lat: Double, lon: Double, city: String) {
            if (!lat.isFinite() || !lon.isFinite() ||
                lat !in -90.0..90.0 || lon !in -180.0..180.0) return
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val previous = prefs.getString("lat", null) to prefs.getString("lon", null)
            prefs.edit().putString("lat", lat.toString()).putString("lon", lon.toString())
                .putString("city", city.take(60)).apply()
            if (previous.first != lat.toString() || previous.second != lon.toString()) {
                prefs.edit().remove("cached_response").remove("cached_local_date").apply()
            }
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DarPrayerWidgetProvider::class.java))
            if (ids.isNotEmpty()) {
                val update = Intent(context, DarPrayerWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                }
                context.sendBroadcast(update)
            }
        }
    }
}
