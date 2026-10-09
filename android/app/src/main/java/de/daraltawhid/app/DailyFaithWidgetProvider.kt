package de.daraltawhid.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.util.Calendar

class DailyFaithWidgetProvider : AppWidgetProvider() {
    data class Entry(val arabic: String, val reference: String, val german: String)

    private val entries = listOf(
        Entry("رَبِّ زِدْنِي عِلْمًا", "Qurʾān 20:114", "Mein Herr, mehre mein Wissen."),
        Entry("رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", "Qurʾān 3:8", "Unser Herr, lasse unsere Herzen nicht abschweifen, nachdem Du uns rechtgeleitet hast."),
        Entry("لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", "Qurʾān 21:87", "Es gibt keinen Gott außer Dir. Preis sei Dir! Ich gehörte wahrlich zu den Ungerechten."),
        Entry("رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا", "Qurʾān 60:4", "Unser Herr, auf Dich vertrauen wir, und zu Dir wenden wir uns reuig."),
        Entry("رَبِّ اشْرَحْ لِي صَدْرِي", "Qurʾān 20:25", "Mein Herr, weite mir meine Brust."),
        Entry("رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ", "Qurʾān 59:10", "Unser Herr, vergib uns und unseren Brüdern, die uns im Glauben vorausgingen."),
        Entry("حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", "Qurʾān 3:173", "Allah genügt uns, und Er ist der beste Sachwalter.")
    )

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val day = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        val item = entries[Math.floorMod(day, entries.size)]
        appWidgetIds.forEach { id ->
            val views = RemoteViews(context.packageName, R.layout.widget_daily_faith)
            views.setTextViewText(R.id.widget_faith_arabic, item.arabic)
            views.setTextViewText(R.id.widget_faith_ref, item.reference)
            views.setTextViewText(R.id.widget_faith_german, item.german)
            views.setOnClickPendingIntent(R.id.widget_faith_root, openIntent(context, id))
            appWidgetManager.updateAppWidget(id, views)
        }
    }

    private fun openIntent(context: Context, requestCode: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("daraltawhid://dua")
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        return PendingIntent.getActivity(
            context,
            10_000 + requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
