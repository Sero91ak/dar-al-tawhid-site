package de.daraltawhid.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Calendar
import java.util.TimeZone
import java.util.concurrent.Executors

class PrayerTimesWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val pending = goAsync()
        EXECUTOR.execute {
            try {
                refresh(context, appWidgetManager, appWidgetIds)
            } finally {
                pending.finish()
            }
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: android.os.Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        EXECUTOR.execute { refresh(context, appWidgetManager, intArrayOf(appWidgetId)) }
    }

    companion object {
        private val EXECUTOR = Executors.newSingleThreadExecutor()
        private val ORDER = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
        private val LABELS = mapOf(
            "fajr" to "Fajr",
            "dhuhr" to "Ẓuhr",
            "asr" to "ʿAṣr",
            "maghrib" to "Maghrib",
            "isha" to "ʿIshāʾ"
        )

        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, PrayerTimesWidgetProvider::class.java))
            if (ids.isNotEmpty()) EXECUTOR.execute { refresh(context, manager, ids) }
        }

        private fun refresh(context: Context, manager: AppWidgetManager, ids: IntArray) {
            val settings = DarWidgetStore.loadPrayerSettings(context)
            val payload = if (settings != null) {
                fetchPayload(settings)?.also { DarWidgetStore.savePrayerPayload(context, it) }
                    ?: DarWidgetStore.loadPrayerPayload(context).takeIf { it.isNotBlank() }
            } else null
            ids.forEach { id ->
                manager.updateAppWidget(id, buildViews(context, manager, id, settings, payload))
            }
        }

        private fun fetchPayload(settings: DarWidgetStore.PrayerSettings): String? {
            var connection: HttpURLConnection? = null
            return try {
                fun enc(value: Any): String =
                    URLEncoder.encode(value.toString(), StandardCharsets.UTF_8.name())
                val urlText = "https://dar-al-tawhid.de/api/prayer/times" +
                    "?lat=" + enc(settings.lat) +
                    "&lon=" + enc(settings.lon) +
                    "&tz=" + enc(settings.timeZone) +
                    "&angle=" + enc(settings.angle) +
                    "&asr=" + enc(settings.asrFactor)
                connection = (URL(urlText).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 5500
                    readTimeout = 5500
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("User-Agent", "DarAlTawhidAndroidWidget/1.0")
                }
                if (connection.responseCode !in 200..299) return null
                val text = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                val root = JSONObject(text)
                if (!root.optBoolean("ok", false)) null else text
            } catch (_: Throwable) {
                null
            } finally {
                connection?.disconnect()
            }
        }

        private fun buildViews(
            context: Context,
            manager: AppWidgetManager,
            widgetId: Int,
            settings: DarWidgetStore.PrayerSettings?,
            payload: String?
        ): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)
            views.setOnClickPendingIntent(
                R.id.widget_prayer_root,
                openIntent(context, "daraltawhid://prayer", widgetId)
            )

            if (settings == null) {
                views.setTextViewText(R.id.widget_prayer_name, "Gebetszeiten")
                views.setTextViewText(R.id.widget_prayer_time, "--:--")
                views.setTextViewText(R.id.widget_prayer_city, "Standort zuerst in der App wählen")
                views.setViewVisibility(R.id.widget_prayer_list, View.GONE)
                return views
            }

            val parsed = try { payload?.let(::JSONObject) } catch (_: Throwable) { null }
            val times = parsed?.optJSONObject("times")
            if (times == null) {
                views.setTextViewText(R.id.widget_prayer_name, "Gebetszeiten")
                views.setTextViewText(R.id.widget_prayer_time, "offline")
                views.setTextViewText(R.id.widget_prayer_city, settings.city)
                views.setViewVisibility(R.id.widget_prayer_list, View.GONE)
                return views
            }

            val current = currentMinutes(settings.timeZone)
            var nextKey = ORDER.firstOrNull {
                val minutes = parseMinutes(times.optJSONObject(it)?.optString("time"))
                minutes >= 0 && minutes > current
            }
            var tomorrow = false
            if (nextKey == null) {
                nextKey = "fajr"
                tomorrow = true
            }
            val nextTime = times.optJSONObject(nextKey)?.optString("time").orEmpty().ifBlank { "--:--" }
            views.setTextViewText(
                R.id.widget_prayer_name,
                (LABELS[nextKey] ?: "Gebet") + if (tomorrow) " · morgen" else ""
            )
            views.setTextViewText(R.id.widget_prayer_time, nextTime)
            views.setTextViewText(R.id.widget_prayer_city, settings.city)

            val rows = listOf(
                Triple(R.id.widget_row_fajr_name, R.id.widget_row_fajr_time, "fajr"),
                Triple(R.id.widget_row_dhuhr_name, R.id.widget_row_dhuhr_time, "dhuhr"),
                Triple(R.id.widget_row_asr_name, R.id.widget_row_asr_time, "asr"),
                Triple(R.id.widget_row_maghrib_name, R.id.widget_row_maghrib_time, "maghrib"),
                Triple(R.id.widget_row_isha_name, R.id.widget_row_isha_time, "isha")
            )
            rows.forEach { (nameId, timeId, key) ->
                views.setTextViewText(nameId, LABELS[key] ?: key)
                views.setTextViewText(
                    timeId,
                    times.optJSONObject(key)?.optString("time").orEmpty().ifBlank { "--:--" }
                )
            }

            val minHeight = manager.getAppWidgetOptions(widgetId)
                .getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110)
            views.setViewVisibility(
                R.id.widget_prayer_list,
                if (minHeight >= 150) View.VISIBLE else View.GONE
            )
            return views
        }

        private fun parseMinutes(value: String?): Int {
            val parts = value.orEmpty().split(":")
            if (parts.size != 2) return -1
            val h = parts[0].toIntOrNull() ?: return -1
            val m = parts[1].toIntOrNull() ?: return -1
            return h * 60 + m
        }

        private fun currentMinutes(timeZone: String): Int {
            val cal = Calendar.getInstance(TimeZone.getTimeZone(timeZone))
            return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        }

        private fun openIntent(context: Context, uri: String, requestCode: Int): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse(uri)
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
