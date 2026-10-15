package de.daraltawhid.tv

import android.app.Activity
import android.app.AlertDialog
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import java.util.Locale
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.MediaPlayer
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.KeyEvent
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
    private val dashboardNavigation = TvDashboardNavigation()
    private lateinit var adhanController: TvAdhanController
    private val screensaverClock = TvIdleScreensaverClock()
    private lateinit var screensaver: TvScreensaverOverlay
    private var tvWindowFocused = true
    private val screensaverHandler = Handler(Looper.getMainLooper())
    private val screensaverTick = object : Runnable {
        override fun run() {
            if (isFinishing || isDestroyed || !::screensaver.isInitialized) return
            val now = SystemClock.elapsedRealtime()
            val isReciting = quranPlayerPrepared && quranPlayer?.isPlaying == true
            val suppressed = !tvWindowFocused ||
                (::adhanController.isInitialized && adhanController.presenting) ||
                isReciting
            screensaverClock.updateSuppression(suppressed, now)
            if (screensaverClock.tick(now)) screensaver.show()
            screensaverHandler.postDelayed(this, 1000L)
        }
    }
    private lateinit var nav: LinearLayout
    private lateinit var body: LinearLayout
    private lateinit var footer: TextView
    // One native player at a time; never autoplay when loading or changing verses.
    private var quranPlayer: MediaPlayer? = null
    private var quranPlayerPrepared = false
    private var audioGeneration = 0
    private var quranSurah = 1
    private var quranAyah = 1
    private var quranAutoPlay = false
    private var selectedReciter = "ar.alafasy"
    private var quranChapterLoading = false
    private val quranChapterLengths = mutableMapOf(1 to 7, 114 to 6)
    private var quranChapterNames: Array<String> = emptyArray()
    private val quranReciters = listOf(
        "ar.alafasy" to "Mišārī Rāšid al-ʿAfāsī",
        "ar.abdurrahmaansudais" to "ʿAbd ar-Raḥmān as-Sudays",
        "ar.saoodshuraym" to "Saʿūd aš-Šuraym",
        "ar.husary" to "Maḥmūd al-Ḥuṣarī",
        "ar.minshawi" to "Muḥammad al-Minšāwī",
        "ar.abdulbasitmurattal" to "ʿAbd al-Bāsiṭ",
        "ar.mahermuaiqly" to "Māhir al-Muʿayqlī"
    )

    private fun stopQuranAudio() {
        audioGeneration += 1
        val previous = quranPlayer
        quranPlayer = null
        quranPlayerPrepared = false
        try { previous?.release() } catch (_: Exception) { }
    }

    private fun isValidAyahReference(reference: String): Boolean {
        val parts = reference.split(':')
        val surah = parts.getOrNull(0)?.toIntOrNull()
        val ayah = parts.getOrNull(1)?.toIntOrNull()
        return parts.size == 2 && surah != null && ayah != null &&
            surah in 1..114 && ayah in 1..286
    }

    private fun playQuranVerse(
        reference: String,
        status: TextView,
        edition: String = "ar.alafasy",
        onComplete: (() -> Unit)? = null
    ) {
        if (!isValidAyahReference(reference)) {
            status.text = "Ungültige Versreferenz – keine Wiedergabe."
            return
        }
        if (edition !in quranReciters.map { it.first }) {
            status.text = "Dieser Rezitator ist nicht freigegeben."
            return
        }
        stopQuranAudio()
        val generation = audioGeneration
        status.text = "Rezitation für $reference wird geladen …"
        // Resolve the CDN file URL from the quran-ayah source instead of
        // assuming the text endpoint contains playable audio bytes.
        fetchJson("https://api.alquran.cloud/v1/ayah/$reference/$edition") { response ->
            if (generation != audioGeneration) return@fetchJson
            val audioUrl = response?.optJSONObject("data")?.optString("audio").orEmpty()
            if (!audioUrl.startsWith("https://")) {
                status.text = "Rezitation nicht erreichbar – bitte Verbindung prüfen."
                return@fetchJson
            }
            try {
                val player = MediaPlayer()
                quranPlayer = player
                player.setOnPreparedListener { prepared ->
                    if (generation == audioGeneration && quranPlayer === prepared) {
                        quranPlayerPrepared = true
                        prepared.start()
                        status.text = "▶ Qurʾān $reference · Rezitation läuft"
                    }
                }
                player.setOnCompletionListener {
                    if (generation == audioGeneration) {
                        status.text = "Rezitation beendet"
                        stopQuranAudio()
                        onComplete?.invoke()
                    }
                }
                player.setOnErrorListener { _, _, _ ->
                    if (generation == audioGeneration) {
                        status.text = "Wiedergabefehler – Audioquelle prüfen."
                        stopQuranAudio()
                    }
                    true
                }
                player.setDataSource(audioUrl)
                player.prepareAsync()
            } catch (_: Exception) {
                status.text = "Wiedergabe konnte nicht gestartet werden."
                stopQuranAudio()
            }
        }
    }

    private fun addQuranAudioControls(reference: String, target: LinearLayout) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(6), 0, dp(3))
        }
        val status = label("Qurʾān $reference · Audio bereit", 14f, muted, false)
        row.addView(navButton("▶ Rezitation abspielen") {
            playQuranVerse(reference, status)
        }, LinearLayout.LayoutParams(0, dp(57), 1f).apply { marginEnd = dp(9) })
        row.addView(navButton("■ Stopp") {
            stopQuranAudio()
            status.text = "Wiedergabe gestoppt"
        }, LinearLayout.LayoutParams(0, dp(57), 1f))
        target.addView(row)
        target.addView(status)
    }

    private var activeTab = "home"
    private var lastContentRefreshAt = 0L
    private val contentRefreshIntervalMs = 15L * 60L * 1000L
    private val contentRefreshHandler = Handler(Looper.getMainLooper())
    private val contentRefreshTask = object : Runnable {
        override fun run() {
            if (!isFinishing && !isDestroyed && ::body.isInitialized) {
                // Background content updates never replace native APK code.
                // Refresh the home once, not a Hadith/Tadabbur page mid-reading.
                if (activeTab == "home") show("home")
                scheduleContentRefresh()
            }
        }
    }

    private fun scheduleContentRefresh() {
        contentRefreshHandler.removeCallbacks(contentRefreshTask)
        val elapsed = (System.currentTimeMillis() - lastContentRefreshAt).coerceAtLeast(0L)
        val delay = if (activeTab == "home") {
            (contentRefreshIntervalMs - elapsed).coerceAtLeast(5_000L)
        } else {
            contentRefreshIntervalMs
        }
        contentRefreshHandler.postDelayed(contentRefreshTask, delay)
    }

    override fun onResume() {
        super.onResume()
        if (::adhanController.isInitialized) adhanController.start()
        screensaverClock.start(SystemClock.elapsedRealtime(),
            getPreferences(MODE_PRIVATE).getBoolean("dar.tv.screensaver.enabled", true))
        screensaverHandler.removeCallbacks(screensaverTick)
        screensaverHandler.postDelayed(screensaverTick, 1000L)
        if (::body.isInitialized) {
            if (System.currentTimeMillis() - lastContentRefreshAt >= contentRefreshIntervalMs
                && activeTab == "home"
            ) show("home")
            scheduleContentRefresh()
        }
    }

    override fun onPause() {
        screensaverHandler.removeCallbacks(screensaverTick)
        screensaverClock.stop()
        if (::screensaver.isInitialized) screensaver.hide()
        if (::adhanController.isInitialized) adhanController.stop()
        quranAutoPlay = false
        stopQuranAudio()
        contentRefreshHandler.removeCallbacks(contentRefreshTask)
        super.onPause()
    }
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
        screensaver = TvScreensaverOverlay(
            activity = this,
            fetchJson = { url, done -> fetchJson(url, done) },
            onClose = { screensaverClock.onInput(SystemClock.elapsedRealtime()) }
        )
        adhanController = TvAdhanController(
            activity = this,
            fetchJson = { url, done -> fetchJson(url, done) },
            getCity = { cities[cityIndex] },
            pauseQuranForOverlay = {
                val existing = quranPlayer
                val wasPlaying = quranPlayerPrepared && existing?.isPlaying == true
                if (wasPlaying) existing?.pause()
                wasPlaying
            },
            resumeQuranAfterOverlay = {
                if (quranPlayerPrepared && quranPlayer != null) {
                    runCatching { quranPlayer?.start() }
                }
            },
            onPresentationChanged = { presenting ->
                if (presenting) contentRefreshHandler.removeCallbacks(contentRefreshTask)
                else if (!isFinishing && ::body.isInitialized) scheduleContentRefresh()
            }
        )
        val shell = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(48), dp(25), dp(48), dp(22))
            // Branded static Royal-Night artwork; deliberately no video dependency.
            background = resources.getDrawable(R.drawable.tv_static_backdrop, theme)
        }
        shell.addView(label("DĀR AL TAWḤĪD", 32f, cream, true))
        shell.addView(label("WISSEN AUS QURʾĀN & SUNNAH  ·  TV", 13f, gold, false))
        val settingsRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        settingsRow.addView(navButton("Adhān · Einstellungen") {
            adhanController.showSettings()
        }, LinearLayout.LayoutParams(0, dp(48), 1f))
        settingsRow.addView(navButton("Qurʾān · Rezitation") {
            show("quran")
        }, LinearLayout.LayoutParams(0, dp(48), 1f))
        shell.addView(settingsRow)

        nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(10), 0, dp(13))
        }
        TvDashboardMode.entries.forEach { mode ->
            val id = mode.route
            val title = mode.title
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
        quranSurah = preferences.getInt("quran_surah", 1).coerceIn(1, 114)
        quranAyah = preferences.getInt("quran_ayah", 1).coerceAtLeast(1)
        selectedReciter = preferences.getString("quran_reciter", "ar.alafasy")
            ?.takeIf { id -> quranReciters.any { it.first == id } } ?: "ar.alafasy"
        val initial = preferences.getString("tab", "home") ?: "home"
        show(initial)
        nav.getChildAt(TvDashboardMode.entries.indexOf(TvDashboardMode.fromRoute(initial)))?.requestFocus()
    }

    private fun show(tab: String) {
        stopQuranAudio()
        if (tab != "quran") quranAutoPlay = false
        renderGeneration += 1
        lastContentRefreshAt = System.currentTimeMillis()
        activeTab = tab
        if (TvDashboardMode.entries.any { it.route == tab }) {
            dashboardNavigation.selectMode(TvDashboardMode.fromRoute(tab))
        }
        getPreferences(MODE_PRIVATE).edit().putString("tab", tab).apply()
        body.removeAllViews()
        for (idx in TvDashboardMode.entries.indices) {
            val button = nav.getChildAt(idx) as? Button ?: continue
            button.contentDescription = button.text.toString() +
                if (TvDashboardMode.entries[idx].route == tab) " · ausgewählt" else ""
        }
        when (tab) {
            "today" -> loadToday()
            "calendar" -> loadCalendar()
            "quran" -> loadQuranReader()
            "hadith" -> loadHadith()
            "tadabbur" -> loadTadabbur()
            else -> loadHome()
        }
    }

    private fun loadHome() {
        val generation = renderGeneration
        val (left, right) = splitDashboard(0.43f)
        left.addView(label("Gebetszeiten", 29f, gold, true))
        left.addView(label("Ort mit OK auswählen · Auswahl bleibt gespeichert.", 15f, muted, false))
        left.addView(navButton("Stadt: ${cities[cityIndex].first}  ·  nächste Stadt") {
            cityIndex = (cityIndex + 1) % cities.size
            getPreferences(MODE_PRIVATE).edit().putInt("city_index", cityIndex).apply()
            adhanController.locationChanged()
            // Clear the previous home view before loading new times.
            show("home")
            left.getChildAt(2)?.requestFocus()
        })
        // The genuine tvOS prayer screen uses five *vertical* prayer rows
        // beside the Quran/Tadabbur column, not cramped horizontal tiles.
        val prayerRow = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(10), 0, dp(9))
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
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(19), dp(5), dp(19), dp(5))
                background = prayerCardBackground()
            }
            prayerCell.addView(label(title, 20f, gold, true),
                LinearLayout.LayoutParams(0, -2, 1f))
            val value = label("--:--", 26f, cream, true).apply {
                gravity = Gravity.END
                maxLines = 1
            }
            prayerCell.addView(value)
            prayerValues.add(value)
            prayerRow.addView(prayerCell, LinearLayout.LayoutParams(-1, dp(65)).apply {
                bottomMargin = dp(7)
            })
        }
        left.addView(prayerRow)
        val prayerStatus = label("", 13f, muted, false)
        left.addView(prayerStatus)
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
        right.addView(label("Qurʾān-Vers", 25f, gold, true))
        val arabicVerse = label("Arabischer Qurʾān-Vers wird geladen …", 23f, cream, false).apply {
            gravity = Gravity.CENTER
            textDirection = View.TEXT_DIRECTION_RTL
            textAlignment = View.TEXT_ALIGNMENT_CENTER
        }
        val germanVerse = label("Deutsche Übersetzung wird geladen …", 20f, cream, false)
        right.addView(arabicVerse)
        right.addView(germanVerse)
        // Remote ayah selection updates the reference, but not an active player.
        // A dedicated row is only added once a validated daily entry is known.
        val homeAudioContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        right.addView(homeAudioContainer)
        val tadabburTitle = label("Tadabbur", 23f, gold, true)
        right.addView(tadabburTitle)
        val tadabburHome = label("Geprüfte Aussage wird geladen …", 20f, cream, false)
        right.addView(tadabburHome)

        fun displayHomeEntry(entry: JSONObject?) {
            if (generation != renderGeneration || activeTab != "home") return
            val input = entry?.optString("reference").orEmpty()
            val parts = input.split(':')
            val surah = parts.getOrNull(0)?.toIntOrNull()
            val ayah = parts.getOrNull(1)?.toIntOrNull()
            val reference = if (parts.size == 2 && surah != null && ayah != null &&
                surah in 1..114 && ayah in 1..286) "$surah:$ayah" else "2:183"
            val isExact = entry != null && input == reference
            homeAudioContainer.removeAllViews()
            addQuranAudioControls(reference, homeAudioContainer)
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
                        it.matches(Regex("""entries(?:-batch-[a-zA-Z0-9-]+)?\.json"""))
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
        right.addView(navButton("Tadabbur-Archiv öffnen") { show("tadabbur") })
    }


    private fun splitDashboard(leftWeight: Float = 0.42f): Pair<LinearLayout, LinearLayout> {
        val root = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val left = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, dp(20), 0)
        }
        val right = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), 0, 0, 0)
        }
        root.addView(left, LinearLayout.LayoutParams(0, -2, leftWeight))
        root.addView(View(this).apply { setBackgroundColor(gold) },
            LinearLayout.LayoutParams(dp(1), -1))
        root.addView(right, LinearLayout.LayoutParams(0, -2, 1f - leftWeight))
        body.addView(root)
        return left to right
    }

    private fun addRule(target: LinearLayout) {
        target.addView(View(this).apply { setBackgroundColor(Color.argb(85, 199, 160, 89)) },
            LinearLayout.LayoutParams(-1, dp(1)).apply {
                topMargin = dp(12)
                bottomMargin = dp(12)
            })
    }

    private fun addPrayerSummary(target: LinearLayout) {
        val generation = renderGeneration
        val selectedCity = cities[cityIndex]
        target.addView(label("Gebetszeiten · ${selectedCity.first}", 23f, gold, true))
        val next = label("Nächstes Gebet wird geladen …", 23f, cream, true)
        target.addView(next)
        target.addView(navButton("Ort ändern · ${selectedCity.first}") {
            cityIndex = (cityIndex + 1) % cities.size
            getPreferences(MODE_PRIVATE).edit().putInt("city_index", cityIndex).apply()
            adhanController.locationChanged()
            show(activeTab)
        })
        val url = "https://dar-al-tawhid.de/api/prayer/times?lat=${selectedCity.second}&lon=${selectedCity.third}"
        fetchJson(url) { json ->
            if (generation != renderGeneration || cities[cityIndex] != selectedCity) return@fetchJson
            val root = json?.optJSONObject("times")
                ?: json?.optJSONObject("prayers")
                ?: json?.optJSONObject("data") ?: json
            val names = listOf(
                "fajr" to "Faǧr", "dhuhr" to "Ẓuhr", "asr" to "ʿAṣr",
                "maghrib" to "Maġrib", "isha" to "ʿIšāʾ"
            )
            val now = LocalDateTime.now()
            val upcoming = names.mapNotNull { (key, name) ->
                val raw = root?.opt(key) ?: root?.opt(key.replaceFirstChar { it.uppercase() })
                val time = when (raw) {
                    is JSONObject -> raw.optString("time")
                    is String -> raw
                    else -> ""
                }
                val parsed = Regex("""(?:[01]?[0-9]|2[0-3]):[0-5][0-9]""").find(time)?.value
                    ?.let { raw ->
                        val normalized = if (raw.length == 4) "0$raw" else raw
                        runCatching { LocalTime.parse(normalized) }.getOrNull()
                    }
                parsed?.let {
                    val at = LocalDateTime.of(LocalDate.now(), it)
                    Triple(name, it.toString(), if (at.isAfter(now)) at else at.plusDays(1))
                }
            }
            val nextPrayer = upcoming.minByOrNull { it.third }
            if (upcoming.size != 5 || nextPrayer == null) {
                next.text = "Gebetszeiten momentan nicht vollständig verfügbar."
            } else {
                val minutes = ChronoUnit.MINUTES.between(now, nextPrayer.third).coerceAtLeast(0L)
                next.text = "Nächstes Gebet: ${nextPrayer.first} · ${nextPrayer.second}\n" +
                    "in ${minutes / 60} Std. ${minutes % 60} Min."
            }
        }
    }

    private fun addVerifiedDailyVerse(
        target: LinearLayout,
        title: String,
        reference: String,
        screen: String,
        generation: Int
    ) {
        target.addView(label(title, 23f, gold, true))
        val arabic = label("Arabischer Vers wird geladen …", 24f, cream, false).apply {
            textDirection = View.TEXT_DIRECTION_RTL
        }
        val german = label("Deutsche Übersetzung wird geladen …", 20f, cream, false)
        target.addView(arabic)
        target.addView(german)
        fetchJson("https://api.alquran.cloud/v1/ayah/$reference/quran-uthmani") { json ->
            if (screen == activeTab && generation == renderGeneration) {
                arabic.text = json?.optJSONObject("data")?.optString("text")
                    ?.takeIf { it.isNotBlank() } ?: "Arabischer Text nicht erreichbar."
            }
        }
        fetchJson("https://api.alquran.cloud/v1/ayah/$reference/de.bubenheim") { json ->
            if (screen == activeTab && generation == renderGeneration) {
                german.text = json?.optJSONObject("data")?.optString("text")
                    ?.takeIf { it.isNotBlank() } ?: "Deutsche Übersetzung nicht erreichbar."
            }
        }
    }

    // Original tvOS: Today's left prayer/weather block and right daily Duʿāʾ/Āyah.
    private fun loadToday() {
        val generation = renderGeneration
        body.addView(label("Heute", 30f, gold, true))
        val (left, right) = splitDashboard()
        addPrayerSummary(left)
        val city = cities[cityIndex]
        val weather = label("Wetter wird geladen …", 18f, muted, false)
        left.addView(weather)
        val url = "https://api.open-meteo.com/v1/forecast?latitude=${city.second}&longitude=${city.third}&current=temperature_2m"
        fetchJson(url) { data ->
            if (generation != renderGeneration || activeTab != "today") return@fetchJson
            val temperature = data?.optJSONObject("current")?.optDouble("temperature_2m", Double.NaN)
            weather.text = if (temperature != null && temperature.isFinite()) {
                "Wetter · ${city.first} · ${"%.0f".format(Locale.GERMANY, temperature)} °C"
            } else "Wetter vorübergehend nicht abrufbar."
        }
        right.addView(label("Duʿāʾ und Āyah des Tages", 27f, gold, true))
        addVerifiedDailyVerse(right, "Duʿāʾ · al-Kahf 18:10", "18:10", "today", generation)
        addRule(right)
        addVerifiedDailyVerse(right, "Āyah · ar-Raʿd 13:28", "13:28", "today", generation)
        right.addView(navButton("Ḥadīṯ-Bibliothek öffnen") { show("hadith") })
    }

    // Original tvOS: Islamic calendar and upcoming dates left; next prayer,
    // seven-day comparison right. The dates are Hijrah/Umm-al-Qura estimates.
    private fun loadCalendar() {
        body.addView(label("Islamischer Kalender", 30f, gold, true))
        val (left, right) = splitDashboard(0.52f)
        val today = LocalDate.now()
        left.addView(label(TvIslamicCalendar.hijriLabel(today), 29f, cream, true))
        left.addView(label(TvIslamicCalendar.gregorianLabel(today), 18f, muted, false))
        addRule(left)
        left.addView(label("Anstehende islamische Termine", 24f, gold, true))
        TvIslamicCalendar.upcoming(today, 5).forEach { event ->
            left.addView(label(
                "${event.name} · ${event.hijri}\n" +
                    "${TvIslamicCalendar.gregorianLabel(event.date)} · ${event.detail}",
                18f, cream, false
            ))
            addRule(left)
        }
        left.addView(label("Berechnete Hijrī-Daten; örtliche Mondsichtung kann abweichen.", 14f, muted, false))
        addPrayerSummary(right)
        addRule(right)
        right.addView(label("7-Tage-Vorschau", 24f, gold, true))
        for (offset in 0L..6L) {
            val day = today.plusDays(offset)
            right.addView(label(
                "${TvIslamicCalendar.gregorianLabel(day)} · ${TvIslamicCalendar.hijriLabel(day)}",
                if (offset == 0L) 20f else 18f,
                if (offset == 0L) gold else cream,
                offset == 0L
            ))
        }
    }


    private fun saveQuranPosition() {
        getPreferences(MODE_PRIVATE).edit()
            .putInt("quran_surah", quranSurah)
            .putInt("quran_ayah", quranAyah)
            .putString("quran_reciter", selectedReciter)
            .apply()
    }

    private fun loadQuranChaptersIfNecessary() {
        if (quranChapterNames.size == 114 || quranChapterLoading) return
        quranChapterLoading = true
        fetchJson("https://api.alquran.cloud/v1/surah") { catalog ->
            quranChapterLoading = false
            val rows = catalog?.optJSONArray("data")
            if (rows == null || rows.length() != 114) return@fetchJson
            val names = Array(114) { i ->
                val row = rows.optJSONObject(i)
                val number = row?.optInt("number", 0) ?: 0
                val title = row?.optString("englishName").orEmpty()
                if (number != i + 1 || title.isBlank()) return@fetchJson
                "${i + 1}. $title"
            }
            for (i in 0 until 114) {
                val count = rows.optJSONObject(i)?.optInt("numberOfAyahs", 0) ?: 0
                if (count !in 1..286) return@fetchJson
                quranChapterLengths[i + 1] = count
            }
            quranChapterNames = names
            val max = quranChapterLengths[quranSurah] ?: 1
            if (quranAyah > max) quranAyah = 1
            if (activeTab == "quran" && !quranAutoPlay) show("quran")
        }
    }

    private fun changeQuranPosition(direction: Int, continuePlaying: Boolean = false) {
        // Surah boundaries cannot be crossed without verified chapter lengths.
        val count = quranChapterLengths[quranSurah] ?: return
        if (direction > 0) {
            if (quranAyah < count) quranAyah += 1
            else if (quranSurah == 114) {
                quranSurah = 1
                quranAyah = 1
            } else {
                quranSurah += 1
                quranAyah = 1
            }
        } else if (direction < 0) {
            if (quranAyah > 1) quranAyah -= 1
            else if (quranSurah > 1) {
                val lastAyah = quranChapterLengths[quranSurah - 1] ?: return
                quranSurah -= 1
                quranAyah = lastAyah
            }
        }
        quranAutoPlay = continuePlaying
        saveQuranPosition()
        show("quran")
    }

    private fun chooseQuranSurah() {
        if (quranChapterNames.size != 114) {
            loadQuranChaptersIfNecessary()
            return
        }
        AlertDialog.Builder(this)
            .setTitle("Sūrah auswählen")
            .setItems(quranChapterNames) { _, index ->
                quranSurah = index + 1
                quranAyah = 1
                quranAutoPlay = false
                saveQuranPosition()
                show("quran")
            }
            .setNegativeButton("Zurück", null)
            .show()
    }

    private fun chooseQuranReciter() {
        AlertDialog.Builder(this)
            .setTitle("Rezitator auswählen")
            .setSingleChoiceItems(
                quranReciters.map { it.second }.toTypedArray(),
                quranReciters.indexOfFirst { it.first == selectedReciter }
            ) { dialog, index ->
                selectedReciter = quranReciters[index].first
                quranAutoPlay = false
                saveQuranPosition()
                dialog.dismiss()
                show("quran")
            }
            .setNegativeButton("Zurück", null)
            .show()
    }

    /**
     * Native reader model ported from original tvOS QuranTabView.swift.
     * Quran Arabic/German text comes only from the Quran provider, never
     * from a Tadabbur or Hadith statement.
     */
    private fun loadQuranReader() {
        val generation = renderGeneration
        loadQuranChaptersIfNecessary()
        body.addView(label("QURʾĀN · Arabisch · Deutsch · Rezitation", 29f, gold, true))
        val surahTitle = quranChapterNames.getOrNull(quranSurah - 1) ?: "Sūrah $quranSurah"
        val verseCount = quranChapterLengths[quranSurah]
        val countLabel = if (verseCount != null) " von $verseCount" else " · Kapitel wird geladen"
        body.addView(label("$surahTitle · Āyah $quranAyah$countLabel", 20f, muted, false))
        val top = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        top.addView(navButton("Sūrah auswählen") { chooseQuranSurah() },
            LinearLayout.LayoutParams(0, dp(60), 1f).apply { marginEnd = dp(12) })
        top.addView(navButton("Rezitator · " +
            quranReciters.first { it.first == selectedReciter }.second) {
            chooseQuranReciter()
        }, LinearLayout.LayoutParams(0, dp(60), 1f))
        body.addView(top)

        val reference = "$quranSurah:$quranAyah"
        val arabic = label("Arabischer Qurʾān wird geladen …", 32f, cream, false).apply {
            gravity = Gravity.CENTER
            textDirection = View.TEXT_DIRECTION_RTL
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(dp(20), dp(20), dp(20), dp(10))
        }
        val german = label("Deutsche Übersetzung wird geladen …", 24f, cream, false).apply {
            gravity = Gravity.CENTER
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(dp(28), dp(10), dp(28), dp(16))
        }
        body.addView(arabic)
        body.addView(german)
        body.addView(label("Deutsche Übersetzung: Bubenheim & Elyas", 14f, muted, false))
        val status = label("Āyah $reference · bereit", 16f, muted, false)
        body.addView(status)

        fun startReaderPlayback() {
            quranAutoPlay = true
            playQuranVerse(reference, status, selectedReciter) {
                if (activeTab == "quran" && quranAutoPlay) changeQuranPosition(1, true)
            }
        }

        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(navButton("◀ Vorherige Āyah") { changeQuranPosition(-1) },
            LinearLayout.LayoutParams(0, dp(64), 1f).apply { marginEnd = dp(8) })
        controls.addView(navButton("▶ Play / Pause") {
            val player = quranPlayer
            if (player != null && !quranPlayerPrepared) {
                status.text = "Rezitation wird vorbereitet …"
            } else if (player?.isPlaying == true) {
                player.pause()
                quranAutoPlay = false
                status.text = "Rezitation pausiert"
            } else if (player != null) {
                player.start()
                quranAutoPlay = true
                status.text = "▶ Rezitation läuft"
            } else startReaderPlayback()
        }, LinearLayout.LayoutParams(0, dp(64), 1f).apply { marginEnd = dp(8) })
        controls.addView(navButton("■ Stopp") {
            quranAutoPlay = false
            stopQuranAudio()
            status.text = "Rezitation gestoppt"
        }, LinearLayout.LayoutParams(0, dp(64), 1f).apply { marginEnd = dp(8) })
        controls.addView(navButton("Nächste Āyah ▶") { changeQuranPosition(1) },
            LinearLayout.LayoutParams(0, dp(64), 1f))
        body.addView(controls)
        if (quranAutoPlay && verseCount != null) startReaderPlayback()

        fetchJson("https://api.alquran.cloud/v1/ayah/$reference/quran-uthmani") { json ->
            if (generation == renderGeneration && activeTab == "quran") {
                arabic.text = json?.optJSONObject("data")?.optString("text")
                    ?.takeIf { it.isNotBlank() } ?: "Arabischer Qurʾān-Vers nicht erreichbar."
            }
        }
        fetchJson("https://api.alquran.cloud/v1/ayah/$reference/de.bubenheim") { json ->
            if (generation == renderGeneration && activeTab == "quran") {
                german.text = json?.optJSONObject("data")?.optString("text")
                    ?.takeIf { it.isNotBlank() } ?: "Deutsche Übersetzung nicht erreichbar."
            }
        }
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
                val reference = item.optString("reference")
                body.addView(label("Zu Qurʾān " + reference, 23f, gold, true))
                if (isValidAyahReference(reference)) {
                    val arabic = label("Qurʾān-Vers wird geladen …", 21f, cream, false).apply {
                        gravity = Gravity.CENTER
                        textDirection = View.TEXT_DIRECTION_RTL
                        textAlignment = View.TEXT_ALIGNMENT_CENTER
                    }
                    val german = label("Deutsche Übersetzung wird geladen …", 18f, cream, false)
                    body.addView(arabic)
                    body.addView(german)
                    fetchJson("https://api.alquran.cloud/v1/ayah/$reference/quran-uthmani") { verse ->
                        if (generation == renderGeneration && activeTab == "tadabbur") {
                            arabic.text = verse?.optJSONObject("data")?.optString("text")
                                ?.takeIf { it.isNotBlank() } ?: "Arabischer Text nicht erreichbar."
                        }
                    }
                    fetchJson("https://api.alquran.cloud/v1/ayah/$reference/de.bubenheim") { verse ->
                        if (generation == renderGeneration && activeTab == "tadabbur") {
                            german.text = verse?.optJSONObject("data")?.optString("text")
                                ?.takeIf { it.isNotBlank() } ?: "Deutsche Übersetzung nicht erreichbar."
                        }
                    }
                    addQuranAudioControls(reference, body)
                }
                body.addView(label("Tadabbur · geprüfte Überlieferung", 22f, gold, true))
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


    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (::screensaver.isInitialized && screensaver.visible) {
            if (event.action == KeyEvent.ACTION_DOWN) screensaver.hide()
            return true  // wake-only key: never fire a button underneath
        }
        if (event.action == KeyEvent.ACTION_DOWN) {
            screensaverClock.onInput(SystemClock.elapsedRealtime())
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        tvWindowFocused = hasFocus
        screensaverClock.updateSuppression(!hasFocus, SystemClock.elapsedRealtime())
    }

    override fun onDestroy() {
        screensaverHandler.removeCallbacks(screensaverTick)
        if (::screensaver.isInitialized) screensaver.hide()
        if (::adhanController.isInitialized) adhanController.stop()
        super.onDestroy()
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
