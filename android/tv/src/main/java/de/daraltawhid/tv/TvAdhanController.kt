package de.daraltawhid.tv

import android.app.Activity
import android.app.AlertDialog
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.Locale

/**
 * The original tvOS TVAdhanController / TVAdhanLibrary, adapted to Android TV.
 *
 * Foreground-only by design: a normal third-party sideloaded Android TV APK
 * cannot guarantee sub-minute background execution through Doze or power-off.
 * This engine never promises automatic alarms while the app is closed.
 */
internal class TvAdhanController(
    private val activity: Activity,
    private val fetchJson: (String, (JSONObject?) -> Unit) -> Unit,
    private val getCity: () -> Triple<String, Double, Double>,
    private val pauseQuranForOverlay: () -> Boolean,
    private val resumeQuranAfterOverlay: () -> Unit,
    private val onPresentationChanged: (Boolean) -> Unit
) {
    private val prefs = activity.getPreferences(Activity.MODE_PRIVATE)
    private val handler = Handler(Looper.getMainLooper())
    private val catalogUrl = "https://dar-al-tawhid.de/apple-tv/prayer/adhan.json"
    private var isRunning = false
    private var activeDialog: AlertDialog? = null
    private var player: MediaPlayer? = null
    private var playbackGeneration = 0
    private var shouldResumeQuran = false
    private var prayerTimes = emptyMap<String, java.time.LocalTime>()
    private var timesLocalDate: LocalDate? = null
    private var loadedCity: String? = null
    private var lastRefreshMillis = 0L
    private var recordings = emptyList<Recording>()
    private var catalogRequested = false
    private val ticker = object : Runnable {
        override fun run() {
            if (!isRunning) return
            checkPrayer()
            val stale = System.currentTimeMillis() - lastRefreshMillis >= 15L * 60 * 1000
            if (stale || timesLocalDate != LocalDate.now(TvAdhanSchedule.germanZone)) {
                refreshPrayerTimes()
            }
            handler.postDelayed(this, 1000L)
        }
    }

    internal data class Recording(
        val id: String, val name: String, val location: String,
        val isFajr: Boolean, val url: String
    )

    private var enabled: Boolean
        get() = prefs.getBoolean("dar.tv.adhan.enabled", true)
        set(value) { prefs.edit().putBoolean("dar.tv.adhan.enabled", value).apply() }

    val presenting: Boolean get() = activeDialog != null

    fun start() {
        if (isRunning) return
        isRunning = true
        fetchCatalog()
        refreshPrayerTimes()
        handler.removeCallbacks(ticker)
        handler.post(ticker)
    }

    fun stop() {
        isRunning = false
        handler.removeCallbacks(ticker)
        finishPlayback()
        activeDialog?.dismiss()
        activeDialog = null
        onPresentationChanged(false)
    }

    /** Called whenever the user changes the prayer city on any screen. */
    fun locationChanged() {
        prayerTimes = emptyMap()
        timesLocalDate = null
        loadedCity = null
        refreshPrayerTimes()
    }

    private fun refreshPrayerTimes() {
        if (!isRunning) return
        val city = getCity()
        lastRefreshMillis = System.currentTimeMillis()
        val url = "https://dar-al-tawhid.de/api/prayer/times?lat=${city.second}&lon=${city.third}" +
            "&tz=Europe/Berlin&angle=12&asr=1"
        fetchJson(url) { json ->
            if (!isRunning || getCity() != city) return@fetchJson
            val date = LocalDate.now(TvAdhanSchedule.germanZone)
            if (json?.optBoolean("ok", false) != true || json.optString("date") != date.toString()) {
                // Refuse stale offline cache or API failures for time-critical Adhan.
                prayerTimes = emptyMap()
                timesLocalDate = null
                return@fetchJson
            }
            val times = json.optJSONObject("times") ?: return@fetchJson
            val raw = TvAdhanSchedule.prayerKeys.associateWith { key ->
                times.optJSONObject(key)?.optString("time").orEmpty()
            }
            val parsed = TvAdhanSchedule.parsedTimes(raw)
            prayerTimes = if (parsed.size == 5) parsed else emptyMap()
            timesLocalDate = date
            loadedCity = city.first
        }
    }

    private fun checkPrayer() {
        if (!enabled || presenting || !isRunning) return
        if (loadedCity != getCity().first) return
        val now = LocalDateTime.now(TvAdhanSchedule.germanZone)
        if (timesLocalDate != now.toLocalDate()) return
        val stamp = now.toLocalDate().toString()
        val oldStamp = prefs.getString("dar.tv.adhan.handled-date", null)
        val handled = if (oldStamp == stamp) {
            prefs.getString("dar.tv.adhan.handled-list", "").orEmpty()
                .split(',').filter { it.isNotBlank() }.toSet()
        } else emptySet()
        val due = TvAdhanSchedule.due(now, prayerTimes, handled) ?: return
        // If the catalog failed, do not consume a due prayer without playback.
        if (chosen(due.key == "fajr") == null) return
        // Save before playing to stop double Adhan on Activity restart.
        prefs.edit().putString("dar.tv.adhan.handled-date", stamp)
            .putString("dar.tv.adhan.handled-list",
                (handled + due.triggerKey).joinToString(","))
            .apply()
        play(due.title, due.time, due.key == "fajr")
    }

    private fun fetchCatalog() {
        if (catalogRequested) return
        catalogRequested = true
        fetchJson(catalogUrl) { json ->
            val rows = json?.optJSONArray("recordings")
            val valid = (0 until (rows?.length() ?: 0)).mapNotNull { index ->
                val row = rows?.optJSONObject(index) ?: return@mapNotNull null
                val id = row.optString("id").trim()
                val name = row.optString("name").trim()
                val url = row.optString("url").trim()
                if (id.isBlank() || name.isBlank() ||
                    !url.startsWith("https://dar-al-tawhid.de/adhan/")) return@mapNotNull null
                Recording(id, name, row.optString("location"),
                    row.optBoolean("isFajr", false), url)
            }
            if (valid.isNotEmpty()) recordings = valid
        }
    }

    private fun chosen(isFajr: Boolean): Recording? {
        val matching = recordings.filter { it.isFajr == isFajr }
        val key = if (isFajr) "dar.tv.adhan.fajr" else "dar.tv.adhan.regular"
        val selected = prefs.getString(key, null)
        return matching.firstOrNull { it.id == selected } ?: matching.firstOrNull()
    }

    fun showSettings() {
        fetchCatalog()
        val options = arrayOf(
            if (enabled) "Adhān: EIN · Ausschalten" else "Adhān: AUS · Einschalten",
            "Adhān-Stimme auswählen",
            "Faǧr-Adhān auswählen",
            "Adhān anhören",
            "Schließen"
        )
        val dialog = AlertDialog.Builder(activity)
            .setTitle("Adhān · Einstellungen")
            .setItems(options) { _, selected ->
                when (selected) {
                    0 -> { enabled = !enabled; if (!enabled) finishPlayback(); showSettings() }
                    1 -> pickRecording(false)
                    2 -> pickRecording(true)
                    3 -> if (enabled) play("Adhān-Hörprobe", "--:--", false) else showSettings()
                    else -> Unit
                }
            }.create()
        dialog.show()
    }

    private fun pickRecording(isFajr: Boolean) {
        val list = recordings.filter { it.isFajr == isFajr }
        if (list.isEmpty()) {
            AlertDialog.Builder(activity)
                .setTitle("Adhān-Bibliothek")
                .setMessage("Stimmen momentan nicht verfügbar. Bitte Verbindung prüfen.")
                .setPositiveButton("OK", null)
                .show()
            return
        }
        val titles = list.map { it.name + " · " + it.location }.toTypedArray()
        val key = if (isFajr) "dar.tv.adhan.fajr" else "dar.tv.adhan.regular"
        AlertDialog.Builder(activity)
            .setTitle(if (isFajr) "Faǧr-Adhān wählen" else "Adhān wählen")
            .setSingleChoiceItems(titles, list.indexOfFirst { it.id == chosen(isFajr)?.id }) { dialog, index ->
                prefs.edit().putString(key, list[index].id).apply()
                dialog.dismiss()
            }
            .setNegativeButton("Zurück", null)
            .show()
    }

    private fun play(title: String, time: String, isFajr: Boolean) {
        if (!enabled || presenting || !isRunning) return
        val reciter = chosen(isFajr) ?: return
        shouldResumeQuran = pauseQuranForOverlay()
        onPresentationChanged(true)
        playbackGeneration += 1
        val generation = playbackGeneration
        val dialog = AlertDialog.Builder(activity)
            .setTitle("الله أكبر · Adhān")
            .setMessage("$title · $time\n${reciter.name}\n${reciter.location}")
            .setNegativeButton("Adhān beenden") { _, _ -> finishPlayback() }
            .create()
        activeDialog = dialog
        dialog.setOnDismissListener {
            if (activeDialog === dialog) {
                activeDialog = null
                finishPlayback()
            }
        }
        dialog.show()
        try {
            val instance = MediaPlayer()
            player = instance
            instance.setAudioAttributes(AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            instance.setOnPreparedListener {
                if (generation == playbackGeneration && player === it) it.start()
            }
            instance.setOnCompletionListener {
                if (generation == playbackGeneration) finishPlayback()
            }
            instance.setOnErrorListener { _, _, _ ->
                if (generation == playbackGeneration) finishPlayback()
                true
            }
            instance.setDataSource(reciter.url)
            instance.prepareAsync()
        } catch (_: Exception) {
            finishPlayback()
        }
    }

    private fun finishPlayback() {
        playbackGeneration += 1
        val old = player
        player = null
        try { old?.release() } catch (_: Exception) { }
        val overlay = activeDialog
        activeDialog = null
        overlay?.dismiss()
        onPresentationChanged(false)
        if (shouldResumeQuran) {
            shouldResumeQuran = false
            resumeQuranAfterOverlay()
        }
    }
}
