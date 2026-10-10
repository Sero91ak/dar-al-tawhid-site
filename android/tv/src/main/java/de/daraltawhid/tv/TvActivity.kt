package de.daraltawhid.tv

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Native Android TV starting point, separate from phone WebView.
 * D-pad navigable 10-foot UI, verified shared content feeds, HTTPS/cache fallback.
 * The TV app must not confuse a Hadith/library statement with the home Tadabbur slot.
 */
class TvActivity : Activity() {
    private val dark = Color.rgb(5, 7, 17)
    private val panel = Color.rgb(13, 19, 34)
    private val gold = Color.rgb(199, 160, 89)
    private val cream = Color.rgb(239, 226, 197)
    private val muted = Color.rgb(185, 171, 150)
    private val base = "https://dar-al-tawhid.de/apple-tv/"
    private lateinit var body: LinearLayout
    private lateinit var footer: TextView
    private var activeTab = "home"
    private var renderGeneration = 0
    private var hadithNumber = 1
    private var hadithTotal = 3350
    private var tadabburNumber = 0
    private var tadabburTotal = 0
    private var cityIndex = 0
    private val cities = listOf(
        Triple("Rheinbach", 50.6256, 6.9491),
        Triple("Meckenheim", 50.6235, 7.0294),
        Triple("Bonn", 50.7374, 7.0982),
        Triple("Köln", 50.9383, 6.9603),
        Triple("Düsseldorf", 51.2277, 6.7735),
        Triple("Berlin", 52.5200, 13.4050),
        Triple("Hamburg", 53.5511, 9.9937),
        Triple("Frankfurt am Main", 50.1109, 8.6821),
        Triple("München", 48.1351, 11.5820),
        Triple("Stuttgart", 48.7758, 9.1829)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val shell = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(48), dp(25), dp(48), dp(22))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(dark, Color.rgb(11, 13, 26), Color.rgb(2, 5, 12))
            )
        }
        shell.addView(label("DĀR AL TAWḤĪD", 32f, cream, true))
        shell.addView(label("WISSEN AUS QURʾĀN & SUNNAH  ·  TV", 13f, gold, false))

        val nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(10), 0, dp(13))
        }
        listOf(
            "home" to "Startseite",
            "hadith" to "Ḥadīṯe & Āṯār",
            "tadabbur" to "Qurʾān & Tadabbur"
        ).forEach { (id, title) ->
            nav.addView(navButton(title) { show(id) },
                LinearLayout.LayoutParams(0, dp(50), 1f).apply {
                    marginEnd = dp(13)
                })
        }
        shell.addView(nav)

        val scroll = ScrollView(this).apply {
            isFillViewport = true
            isFocusable = false
            clipToPadding = false
        }
        body = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(29), dp(19), dp(29), dp(24))
            background = panelBackground()
        }
        scroll.addView(body)
        shell.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        footer = label(
            "Inhalte: gemeinsamer DĀR-AL-TAWḤĪD-Katalog · Fernbedienung: ◀ ▶ ▲ ▼ und OK",
            13f,
            muted,
            false
        )
        footer.setPadding(0, dp(15), 0, 0)
        shell.addView(footer)
        setContentView(shell)

        val preferences = getPreferences(MODE_PRIVATE)
        cityIndex = preferences.getInt("city_index", 0).coerceIn(0, cities.lastIndex)
        val initial = preferences.getString("tab", "home") ?: "home"
        show(initial)
        nav.getChildAt(0)?.requestFocus()
    }

    private fun show(tab: String) {
        renderGeneration += 1
        activeTab = tab
        getPreferences(MODE_PRIVATE).edit().putString("tab", tab).apply()
        body.removeAllViews()
        when (tab) {
            "hadith" -> loadHadith()
            "tadabbur" -> loadTadabbur()
            else -> loadHome()
        }
    }

    private fun loadHome() {
        val generation = renderGeneration
        body.addView(label("Gebetszeiten", 29f, gold, true))
        body.addView(label(
            "TV-Geräte haben häufig keinen GPS-Empfänger. Stadt mit OK auswählen – die Wahl bleibt gespeichert.",
            16f, muted, false
        ))
        body.addView(navButton("Stadt: ${cities[cityIndex].first}  ·  nächste Stadt") {
            cityIndex = (cityIndex + 1) % cities.size
            getPreferences(MODE_PRIVATE).edit().putInt("city_index", cityIndex).apply()
            // Clear the previous home view before loading new times.
            show("home")
            body.getChildAt(2)?.requestFocus()
        })
        // Five independent prayer tiles: never concatenate names/times into one
        // wrapping TextView (the bug shown in the owner's TV screenshot).
        val prayerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            weightSum = 5f
            setPadding(0, dp(11), 0, dp(9))
        }
        val prayerNames = listOf(
            "fajr" to "Faǧr",
            "dhuhr" to "Ẓuhr",
            "asr" to "ʿAṣr",
            "maghrib" to "Maġrib",
            "isha" to "ʿIšāʾ"
        )
        val prayerValues = mutableListOf<TextView>()
        prayerNames.forEach { (_, title) ->
            val prayerCell = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(dp(7), dp(13), dp(7), dp(13))
                background = prayerCardBackground()
            }
            prayerCell.addView(label(title, 16f, gold, true).apply {
                gravity = Gravity.CENTER
                maxLines = 1
                setPadding(0, 0, 0, dp(5))
            })
            val value = label("--:--", 22f, cream, true).apply {
                gravity = Gravity.CENTER
                maxLines = 1
                setPadding(0, 0, 0, 0)
            }
            prayerCell.addView(value)
            prayerValues.add(value)
            prayerRow.addView(prayerCell, LinearLayout.LayoutParams(0, dp(93), 1f).apply {
                marginEnd = dp(7)
            })
        }
        body.addView(prayerRow)
        val prayerStatus = label("", 13f, muted, false)
        body.addView(prayerStatus)
        val city = cities[cityIndex]
        val url = "https://dar-al-tawhid.de/api/prayer/times?lat=${city.second}&lon=${city.third}"
        fetchJson(url) { data ->
            if (generation != renderGeneration || activeTab != "home" || cities[cityIndex] != city) return@fetchJson
            val root = data?.optJSONObject("times")
                ?: data?.optJSONObject("prayers")
                ?: data?.optJSONObject("data")
                ?: data
            if (root == null) {
                prayerStatus.text = "Zeiten vorübergehend nicht abrufbar. Bitte Internetverbindung prüfen."
                return@fetchJson
            }
            prayerNames.forEachIndexed { index, (key, _) ->
                val record = root.opt(key) ?: root.opt(key.replaceFirstChar { it.uppercase() })
                val raw = when (record) {
                    is JSONObject -> record.optString("time")
                    is String -> record
                    else -> ""
                }
                val value = Regex("""\b(?:[01]?\d|2[0-3]):[0-5]\d\b""").find(raw)?.value
                prayerValues[index].text = value ?: "--:--"
            }
            prayerStatus.text = "Ort: ${city.first}  ·  Zeiten aus der DĀR-Gebetszeitenquelle"
        }
        // Apple TV home contract: prayer times -> Qur'an verse -> verified Tadabbur
        // referring to exactly that verse. The shared Apple-TV index is updated
        // globally; do not hard-code the first entry (2:183) forever.
        body.addView(label("Qurʾān-Vers", 25f, gold, true))
        val arabicVerse = label("Arabischer Qurʾān-Vers wird geladen …", 19f, cream, false).apply {
            gravity = Gravity.CENTER
            textDirection = View.TEXT_DIRECTION_RTL
            textAlignment = View.TEXT_ALIGNMENT_CENTER
        }
        val germanVerse = label("Deutsche Übersetzung wird geladen …", 17f, cream, false)
        body.addView(arabicVerse)
        body.addView(germanVerse)
        val tadabburTitle = label("Tadabbur", 23f, gold, true)
        body.addView(tadabburTitle)
        val tadabburHome = label("Geprüfte Aussage wird geladen …", 17f, cream, false)
        body.addView(tadabburHome)

        fun displayHomeEntry(entry: JSONObject?) {
            if (generation != renderGeneration || activeTab != "home") return
            val input = entry?.optString("reference").orEmpty()
            val parts = input.split(':')
            val surah = parts.getOrNull(0)?.toIntOrNull()
            val ayah = parts.getOrNull(1)?.toIntOrNull()
            val reference = if (parts.size == 2 && surah != null && ayah != null &&
                surah in 1..114 && ayah in 1..286) "$surah:$ayah" else "2:183"
            val isExact = entry != null && input == reference
            tadabburTitle.text = "Tadabbur zu $reference"
            tadabburHome.text = if (isExact && !entry!!.optString("text").isNullOrBlank()) {
                entry.optString("text") + "\n" +
                    entry.optString("narrator") + " · " + entry.optString("source")
            } else {
                "Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor."
            }
            // These two requests load Qur'an wording exclusively from the reader;
            // a Tadabbur statement is never displayed as Qur'an text.
            fetchJson("https://api.alquran.cloud/v1/ayah/$reference/quran-uthmani") { verse ->
                if (generation == renderGeneration && activeTab == "home") {
                    arabicVerse.text = verse?.optJSONObject("data")?.optString("text")
                        ?.takeIf { it.isNotBlank() }
                        ?: "Arabischer Qurʾān-Vers momentan nicht erreichbar"
                }
            }
            fetchJson("https://api.alquran.cloud/v1/ayah/$reference/de.bubenheim") { verse ->
                if (generation == renderGeneration && activeTab == "home") {
                    germanVerse.text = verse?.optJSONObject("data")?.optString("text")
                        ?.takeIf { it.isNotBlank() }
                        ?: "Deutsche Qurʾān-Übersetzung momentan nicht erreichbar"
                }
            }
        }

        fetchJson(base + "quran/tadabbur/entries-index.json") { index ->
            if (generation != renderGeneration || activeTab != "home") return@fetchJson
            val files = index?.optJSONArray("files")
            val total = (0 until (files?.length() ?: 0)).sumOf {
                files?.optJSONObject(it)?.optInt("count", 0)?.coerceAtLeast(0) ?: 0
            }
            if (total == 0 || files == null) {
                displayHomeEntry(null)
                return@fetchJson
            }
            // Stable for a UTC day, but refreshed from the published content index.
            var position = ((System.currentTimeMillis() / 86_400_000L) % total).toInt()
            var chosenPath: String? = null
            for (i in 0 until files.length()) {
                val file = files.optJSONObject(i) ?: continue
                val count = file.optInt("count", 0).coerceAtLeast(0)
                if (position < count) {
                    chosenPath = file.optString("path").takeIf {
                        it.matches(Regex("""entries(?:-batch-[a-zA-Z0-9-]+)?\\.json"""))
                    }
                    break
                }
                position -= count
            }
            val batchPath = chosenPath
            if (batchPath == null) {
                displayHomeEntry(null)
                return@fetchJson
            }
            val entryPosition = position
            fetchJson(base + "quran/tadabbur/" + batchPath) { batch ->
                if (generation != renderGeneration || activeTab != "home") return@fetchJson
                displayHomeEntry(batch?.optJSONArray("entries")?.optJSONObject(entryPosition))
            }
        }
        body.addView(label("Mehr entdecken", 22f, gold, true))
        body.addView(navButton("Qurʾān & Tadabbur öffnen") { show("tadabbur") })
        body.addView(label("Ḥadīṯ-Sammlung", 29f, gold, true))
        body.addView(navButton("Überlieferungen lesen") { show("hadith") })
    }

    private fun loadHadith() {
        val generation = renderGeneration
        body.addView(label("Ḥadīṯe & Āṯār", 29f, gold, true))
        val line = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        line.addView(navButton("◀ Vorheriger") {
            hadithNumber = (hadithNumber - 1).coerceAtLeast(1)
            show("hadith")
        }, LinearLayout.LayoutParams(0, dp(62), 1f))
        line.addView(navButton("Nächster ▶") {
            hadithNumber = (hadithNumber + 1).coerceAtMost(hadithTotal)
            show("hadith")
        }, LinearLayout.LayoutParams(0, dp(62), 1f))
        body.addView(line)
        body.addView(label("Lade Überlieferung HAD-${hadithNumber.toString().padStart(4, '0')} …", 18f, muted, false))
        fetchJson(base + "hadith/catalog.json") { catalog ->
            if (generation != renderGeneration || activeTab != "hadith") return@fetchJson
            hadithTotal = catalog?.optInt("publishedCount", 3350) ?: 3350
            val series = catalog?.optJSONArray("series")
            val id = "HAD-${hadithNumber.toString().padStart(4, '0')}"
            var dir: String? = null
            if (series != null) {
                for (i in 0 until series.length()) {
                    val row = series.optJSONObject(i) ?: continue
                    if (id >= row.optString("firstId") && id <= row.optString("lastId")) {
                        dir = row.optString("indexPath").removeSuffix("index.json")
                        break
                    }
                }
            }
            if (dir == null) {
                body.addView(label("Zu dieser Nummer wurde kein freigegebener Datensatz gefunden.", 18f, muted, false))
                return@fetchJson
            }
            fetchJson(base + "hadith/" + dir + id + ".json") { hadith ->
                if (generation != renderGeneration || activeTab != "hadith") return@fetchJson
                if (hadith == null) {
                    body.addView(label("Die Überlieferung ist momentan nicht abrufbar.", 19f, muted, false))
                    return@fetchJson
                }
                body.addView(label(hadith.optString("narratorLine"), 18f, muted, false))
                body.addView(label(hadith.optString("speakerLabel"), 20f, gold, true))
                body.addView(label(cleanMarkdown(hadith.optString("textMarkdown")), 26f, cream, false))
                body.addView(label(hadith.optString("source") + " · " + hadith.optString("grade"), 17f, gold, false))
                if (hadith.optString("sharhText").isNotBlank()) {
                    body.addView(label("Erläuterung", 21f, gold, true))
                    body.addView(label(hadith.optString("sharhText"), 19f, cream, false))
                    body.addView(label(hadith.optString("sharhReference"), 14f, muted, false))
                }
            }
        }
    }

    private fun loadTadabbur() {
        val generation = renderGeneration
        body.addView(label("Qurʾān & Tadabbur", 29f, gold, true))
        body.addView(label(
            "Hier wird Tadabbur zum jeweils angegebenen Vers angezeigt – nicht als Qurʾān-Wortlaut.",
            16f, muted, false
        ))
        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(navButton("◀ Vorheriger") {
            tadabburNumber = (tadabburNumber - 1).coerceAtLeast(0)
            show("tadabbur")
        }, LinearLayout.LayoutParams(0, dp(62), 1f))
        controls.addView(navButton("Nächster ▶") {
            tadabburNumber = (tadabburNumber + 1).coerceAtMost((tadabburTotal - 1).coerceAtLeast(0))
            show("tadabbur")
        }, LinearLayout.LayoutParams(0, dp(62), 1f))
        body.addView(controls)
        body.addView(label("Lade geprüfte Tadabbur-Aussage …", 19f, cream, false))
        fetchJson(base + "quran/tadabbur/entries-index.json") { index ->
            if (generation != renderGeneration || activeTab != "tadabbur") return@fetchJson
            tadabburTotal = index?.optInt("totalVerifiedEntries", 0) ?: 0
            val files = index?.optJSONArray("files")
            var position = tadabburNumber
            var chosenFile: String? = null
            if (files != null) {
                for (i in 0 until files.length()) {
                    val row = files.optJSONObject(i) ?: continue
                    val count = row.optInt("count", 0)
                    if (count <= 0) continue
                    if (position < count) {
                        chosenFile = row.optString("path")
                        break
                    }
                    position -= count
                }
            }
            val file = chosenFile ?: run {
                body.addView(label("Noch keine passende Aussage gefunden.", 18f, muted, false))
                return@fetchJson
            }
            val entryPosition = position
            fetchJson(base + "quran/tadabbur/" + file) { batch ->
                if (generation != renderGeneration || activeTab != "tadabbur") return@fetchJson
                val item = batch?.optJSONArray("entries")?.optJSONObject(entryPosition)
                if (item == null) {
                    body.addView(label("Dieser Datensatz ist derzeit nicht verfügbar.", 18f, muted, false))
                    return@fetchJson
                }
                body.addView(label("Zu Qurʾān " + item.optString("reference"), 23f, gold, true))
                body.addView(label(item.optString("text"), 27f, cream, false))
                body.addView(label(item.optString("narrator") + " · " + item.optString("generation"), 18f, muted, false))
                body.addView(label(item.optString("source") + " · " + item.optString("grading"), 16f, gold, false))
            }
        }
    }

    private fun fetchJson(url: String, done: (JSONObject?) -> Unit) {
        val prefs = getPreferences(MODE_PRIVATE)
        thread(name = "dar-tv-json-fetch") {
            var value: JSONObject? = null
            try {
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.setRequestProperty("Accept", "application/json")
                try {
                    if (conn.responseCode in 200..299) {
                        val raw = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                        value = JSONObject(raw)
                        if (raw.length < 800000) prefs.edit().putString("cache:$url", raw).apply()
                    }
                } finally {
                    conn.disconnect()
                }
            } catch (_: Exception) {
                // Fall back to the last successfully fetched JSON (per URL).
            }
            if (value == null) {
                value = runCatching { JSONObject(prefs.getString("cache:$url", "{}") ?: "{}") }.getOrNull()
                if (value?.length() == 0) value = null
            }
            val result = value
            runOnUiThread { if (!isFinishing && !isDestroyed) done(result) }
        }
    }

    private fun cleanMarkdown(raw: String): String =
        raw.replace("**", "").replace("__", "").replace("`", "")

    private fun navButton(title: String, action: () -> Unit): Button =
        Button(this).apply {
            text = title
            textSize = 16f
            typeface = Typeface.create("serif", Typeface.NORMAL)
            isAllCaps = false
            isFocusable = true
            setTextColor(cream)
            background = buttonBackground(false)
            setPadding(dp(12), 0, dp(12), 0)
            setOnClickListener { action() }
            onFocusChangeListener = View.OnFocusChangeListener { view, hasFocus ->
                (view as Button).background = buttonBackground(hasFocus)
                view.setTextColor(if (hasFocus) dark else cream)
                view.animate().scaleX(if (hasFocus) 1.04f else 1f)
                    .scaleY(if (hasFocus) 1.04f else 1f).setDuration(150).start()
            }
        }

    private fun label(text: String, size: Float, color: Int, bold: Boolean): TextView =
        TextView(this).apply {
            this.text = text
            textSize = size
            setTextColor(color)
            typeface = Typeface.create("serif", if (bold) Typeface.BOLD else Typeface.NORMAL)
            setLineSpacing(dp(2).toFloat(), 1.04f)
            setPadding(0, dp(9), 0, dp(9))
            gravity = Gravity.START
        }

    private fun panelBackground(): GradientDrawable =
        GradientDrawable().apply {
            setColor(panel)
            cornerRadius = dp(26).toFloat()
            setStroke(dp(1), Color.rgb(86, 70, 43))
        }

    private fun buttonBackground(focused: Boolean): GradientDrawable =
        GradientDrawable().apply {
            setColor(if (focused) gold else Color.rgb(25, 26, 42))
            cornerRadius = dp(18).toFloat()
            setStroke(dp(1), if (focused) cream else Color.rgb(107, 85, 49))
        }

    private fun prayerCardBackground(): GradientDrawable =
        GradientDrawable().apply {
            setColor(Color.rgb(10, 14, 29))
            cornerRadius = dp(15).toFloat()
            setStroke(dp(1), Color.rgb(95, 75, 44))
        }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (activeTab != "home") show("home") else super.onBackPressed()
    }
}
