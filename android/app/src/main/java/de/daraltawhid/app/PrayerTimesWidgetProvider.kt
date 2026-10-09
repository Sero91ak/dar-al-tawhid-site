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
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class PrayerTimesWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { id ->
            render(context, manager, id, DarWidgetStore.prayerDay(context))
            refreshAsync(context.applicationContext, id)
        }
    }

    private fun refreshAsync(context: Context, appWidgetId: Int) {
        val settings = DarWidgetStore.prayerSettings(context)
        if (settings == null) {
            render(context, AppWidgetManager.getInstance(context), appWidgetId, null)
            return
        }
        Thread {
            val fresh = fetchDay(settings)
            if (fresh != null) DarWidgetStore.savePrayerDay(context, fresh)
            render(context, AppWidgetManager.getInstance(context), appWidgetId, fresh ?: DarWidgetStore.prayerDay(context))
        }.start()
    }

    private fun fetchDay(settings: DarPrayerSettings): DarPrayerDay? {
        return try {
            val tz = TimeZone.getTimeZone(settings.timeZone)
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = tz }
            val date = dateFormat.format(Date())
            fun enc(value: String) = URLEncoder.encode(value, "UTF-8")
            val url = URL(
                "https://dar-al-tawhid.de/api/prayer/times" +
                    "?lat=${enc(settings.lat.toString())}" +
                    "&lon=${enc(settings.lon.toString())}" +
                    "&tz=${enc(settings.timeZone)}" +
                    "&angle=${enc(settings.angle.toString())}" +
                    "&asr=${enc(settings.asrFactor.toString())}" +
                    "&date=${enc(date)}"
            )
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 7000
                readTimeout = 7000
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "DarAlTawhidAndroidWidget/1.0")
            }
            try {
                if (connection.responseCode !in 200..299) return null
                val body = connection.inputStream.bufferedReader().use { it.readText() }
                val root = JSONObject(body)
                if (!root.optBoolean("ok", false)) return null
                val times = root.getJSONObject("times")
                fun time(key: String) = times.optJSONObject(key)?.optString("time", "--:--") ?: "--:--"
                DarPrayerDay(
                    date = root.optString("date", date),
                    fajr = time("fajr"),
                    dhuhr = time("dhuhr"),
                    asr = time("asr"),
                    maghrib = time("maghrib"),
                    isha = time("isha")
                )
            } finally {
                connection.disconnect()
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int, day: DarPrayerDay?) {
        val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)
        val settings = DarWidgetStore.prayerSettings(context)
        val next = if (day != null) resolveNext(day, settings?.timeZone) else null
        views.setTextViewText(R.id.widget_city, settings?.city ?: "Standort in der App setzen")
        views.setTextViewText(R.id.widget_prayer_name, next?.first ?: "Gebetszeiten")
        views.setTextViewText(R.id.widget_prayer_time, next?.second ?: "--:--")
        views.setTextViewText(
            R.id.widget_all_times,
            if (day == null) {
                "Öffne die App und synchronisiere deinen Standort."
            } else {
                "Fajr ${day.fajr} · Ẓuhr ${day.dhuhr} · ʿAṣr ${day.asr} · Maghrib ${day.maghrib} · ʿIshāʾ ${day.isha}"
            }
        )

        val open = Intent(Intent.ACTION_VIEW, Uri.parse("daraltawhid://prayer"), context, MainActivity::class.java)
        val pending = PendingIntent.getActivity(
            context,
            appWidgetId,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pending)
        manager.updateAppWidget(appWidgetId, views)
    }

    private fun resolveNext(day: DarPrayerDay, timeZone: String?): Pair<String, String> {
        val order = listOf(
            "Fajr" to day.fajr,
            "Ẓuhr" to day.dhuhr,
            "ʿAṣr" to day.asr,
            "Maghrib" to day.maghrib,
            "ʿIshāʾ" to day.isha
        )
        val cal = Calendar.getInstance(TimeZone.getTimeZone(timeZone ?: TimeZone.getDefault().id))
        val nowMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        for ((name, value) in order) {
            val minute = parseMinutes(value)
            if (minute != null && minute > nowMinutes) return name to value
        }
        return "Fajr · morgen" to day.fajr
    }

    private fun parseMinutes(value: String): Int? {
        val parts = value.split(":")
        if (parts.size != 2) return null
        val h = parts[0].toIntOrNull() ?: return null
        val m = parts[1].toIntOrNull() ?: return null
        return h * 60 + m
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, PrayerTimesWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isNotEmpty()) PrayerTimesWidgetProvider().onUpdate(context, manager, ids)
        }
    }
}
