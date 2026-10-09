package de.daraltawhid.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.util.Calendar

class DailyFaithWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { id -> render(context, manager, id) }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
        val entries = listOf(
            "Dhikr" to "SubḥānAllāh · al-ḥamdu lillāh · Allāhu akbar.",
            "Qurʾān" to "Lies heute bewusst einige Āyāt mit Bedeutung.",
            "Duʿāʾ" to "Nimm dir heute bewusst Zeit für Duʿāʾ.",
            "Wissen" to "Öffne DĀR AL TAWḤĪD für Qurʾān, Sunnah und Āṯār."
        )
        val day = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        val entry = entries[(day - 1).mod(entries.size)]
        val views = RemoteViews(context.packageName, R.layout.widget_daily_faith)
        views.setTextViewText(R.id.widget_daily_title, entry.first)
        views.setTextViewText(R.id.widget_daily_body, entry.second)

        val open = Intent(Intent.ACTION_VIEW, Uri.parse("daraltawhid://home"), context, MainActivity::class.java)
        val pending = PendingIntent.getActivity(
            context,
            3000 + appWidgetId,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_daily_root, pending)
        manager.updateAppWidget(appWidgetId, views)
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, DailyFaithWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isNotEmpty()) DailyFaithWidgetProvider().onUpdate(context, manager, ids)
        }
    }
}
