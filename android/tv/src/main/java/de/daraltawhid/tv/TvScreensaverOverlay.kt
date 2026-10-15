package de.daraltawhid.tv

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject
import java.util.Locale

/**
 * Port of DarAlTawhidTV/IdleScreensaverController +
 * HadithScreensaverRotationView. Not the Android system-wide screensaver:
 * this overlay appears only while the TV app is in the foreground.
 */
internal class TvScreensaverOverlay(
    private val activity: Activity,
    private val fetchJson: (String, (JSONObject?) -> Unit) -> Unit,
    private val onClose: () -> Unit
) {
    private val handler = Handler(Looper.getMainLooper())
    private var dialog: Dialog? = null
    private var generation = 0
    private var currentIndex = 0
    private var totalHadith = 3350
    private var message: TextView? = null
    private var attribution: TextView? = null
    private var reference: TextView? = null
    private val rotation = object : Runnable {
        override fun run() {
            if (dialog?.isShowing != true) return
            currentIndex = (currentIndex + 1) % totalHadith.coerceAtLeast(1)
            loadRecord()
        }
    }

    val visible: Boolean get() = dialog?.isShowing == true

    fun show() {
        if (visible || activity.isFinishing) return
        generation += 1
        val window = Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        val root = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(66, 45, 66, 45)
            background = activity.getDrawable(R.drawable.tv_static_backdrop)
        }
        val brand = text("DĀR AL TAWḤĪD", 35f, Color.rgb(239, 226, 197), true)
        brand.gravity = Gravity.CENTER
        root.addView(brand)
        val gold = text("ḤADĪṮ · WISSEN AUS QURʾĀN & SUNNAH", 18f,
            Color.rgb(199, 160, 89), true)
        gold.gravity = Gravity.CENTER
        root.addView(gold)
        message = text("Überlieferung wird geladen …", 31f,
            Color.rgb(239, 226, 197), false).apply {
            gravity = Gravity.CENTER
        }
        root.addView(message, LinearLayout.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT, 0, 1f))
        attribution = text("", 21f, Color.rgb(239, 226, 197), false).apply {
            gravity = Gravity.CENTER
        }
        reference = text("", 18f, Color.rgb(199, 160, 89), false).apply {
            gravity = Gravity.CENTER
        }
        root.addView(attribution)
        root.addView(reference)
        root.addView(text("Beliebige Fernbedienungstaste: zurück zur App", 15f,
            Color.rgb(185, 171, 150), false).apply { gravity = Gravity.CENTER })
        window.setContentView(root)
        window.setCancelable(true)
        window.setOnKeyListener { _, _, event ->
            if (event.action == KeyEvent.ACTION_DOWN) {
                hide()
                true
            } else true
        }
        window.setOnDismissListener {
            if (dialog === window) {
                dialog = null
                stopRotation()
                onClose()
            }
        }
        dialog = window
        window.show()
        window.window?.setLayout(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT
        )
        loadRecord()
    }

    fun hide() {
        if (dialog == null) return
        val old = dialog
        dialog = null
        stopRotation()
        old?.dismiss()
        onClose()
    }

    private fun stopRotation() {
        handler.removeCallbacks(rotation)
        generation += 1
        message = null
        attribution = null
        reference = null
    }

    private fun loadRecord() {
        val screenGeneration = generation
        message?.text = "Überlieferung wird geladen …"
        val number = currentIndex + 1
        val id = "HAD-" + number.toString().padStart(4, '0')
        fetchJson("https://dar-al-tawhid.de/apple-tv/hadith/catalog.json") { catalog ->
            if (screenGeneration != generation || !visible) return@fetchJson
            totalHadith = catalog?.optInt("publishedCount", totalHadith)
                ?.coerceAtLeast(1) ?: totalHadith
            val series = catalog?.optJSONArray("series")
            var dir: String? = null
            for (i in 0 until (series?.length() ?: 0)) {
                val item = series?.optJSONObject(i) ?: continue
                if (id >= item.optString("firstId") && id <= item.optString("lastId")) {
                    dir = item.optString("indexPath").removeSuffix("index.json")
                    break
                }
            }
            if (dir == null || !dir.matches(Regex("""[a-zA-Z0-9_/-]+/"""))) {
                message?.text = "Derzeit ist keine geprüfte Überlieferung abrufbar."
                scheduleNext(18_000L)
                return@fetchJson
            }
            fetchJson("https://dar-al-tawhid.de/apple-tv/hadith/" + dir + id + ".json") { record ->
                if (screenGeneration != generation || !visible) return@fetchJson
                val statement = record?.optString("textMarkdown")
                    ?.replace("**", "")?.replace("__", "")?.trim().orEmpty()
                val narrator = record?.optString("narratorLine").orEmpty()
                val source = record?.optString("source").orEmpty()
                if (statement.isBlank() || source.isBlank()) {
                    message?.text = "Überlieferung aktuell nicht verfügbar."
                    attribution?.text = ""
                    reference?.text = ""
                    scheduleNext(18_000L)
                    return@fetchJson
                }
                message?.text = statement
                attribution?.text = narrator
                reference?.text = source
                val wordCount = statement.split(Regex("""\s+""")).size
                val hold = (16_000L + 350L * wordCount + if (record.optString("sharhText").isNotBlank()) 6_000L else 0L)
                    .coerceIn(18_000L, 40_000L)
                scheduleNext(hold)
            }
        }
    }

    private fun scheduleNext(delay: Long) {
        handler.removeCallbacks(rotation)
        handler.postDelayed(rotation, delay)
    }

    private fun text(body: String, size: Float, color: Int, bold: Boolean): TextView =
        TextView(activity).apply {
            text = body
            textSize = size
            setTextColor(color)
            typeface = Typeface.create("serif", if (bold) Typeface.BOLD else Typeface.NORMAL)
            setLineSpacing(7f, 1.07f)
            setPadding(14, 17, 14, 17)
            textAlignment = View.TEXT_ALIGNMENT_CENTER
        }
}
