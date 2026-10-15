package de.daraltawhid.tv

/**
 * Source-verified top-level tvOS dashboard contract.
 *
 * Reference (original owner's Xcode project):
 * DarAlTawhidTV/ContentView.swift :: TVDashboardMode / TVDashboardFocus.
 * These modes replace the former independently invented three-tab Android shell
 * only after each Android TV screen and its remote actions are implemented.
 */
internal enum class TvDashboardMode(val route: String, val title: String) {
    PRAYER("home", "Gebetszeiten"),
    TODAY("today", "Heute"),
    CALENDAR("calendar", "Kalender"),
    QURAN("quran", "Qurʾān");

    companion object {
        fun fromRoute(route: String?): TvDashboardMode =
            entries.firstOrNull { it.route == route } ?: PRAYER
    }
}

/** The tvOS project uses dedicated full-screen focusable overlays. */
internal enum class TvDashboardDialog {
    ADHAN,
    SURAH,
    RECITER,
    SCENE,
    LOCATION,
    SETTINGS
}

/**
 * Focus identifiers must be stable, not derived from visible button texts;
 * the same control can have a different label in play / pause states.
 */
internal enum class TvDashboardControl {
    MODE,
    CONTENT_PRIMARY,
    ADHAN,
    QURAN_PLAY,
    QURAN_PREVIOUS,
    QURAN_PLAY_CONTROL,
    QURAN_STOP,
    QURAN_NEXT,
    QURAN_TRANSLITERATION,
    QURAN_PRAYER_TICKER,
    SURAH_PICKER,
    RECITER_PICKER,
    HELP
}

internal data class TvDashboardFocus(
    val screen: TvDashboardMode,
    val control: TvDashboardControl
)

internal data class TvDashboardNavigationSnapshot(
    val mode: TvDashboardMode,
    val dialog: TvDashboardDialog?,
    val focus: TvDashboardFocus
)

/**
 * Pure navigation state machine for Android TV. The native UI drives this with
 * DPAD/OK/Back key events; it does not start or stop audio, and is independent
 * of network work. Media/Adhan and idle logic must be owned by separate
 * controllers so opening a picker cannot accidentally restart a player.
 */
internal class TvDashboardNavigation(
    initialMode: TvDashboardMode = TvDashboardMode.PRAYER
) {
    private var currentMode = initialMode
    private var currentDialog: TvDashboardDialog? = null
    private var currentFocus = TvDashboardFocus(initialMode, TvDashboardControl.MODE)
    private var restoreFocus = currentFocus

    fun snapshot() = TvDashboardNavigationSnapshot(
        mode = currentMode,
        dialog = currentDialog,
        focus = currentFocus
    )

    /** Background navigation is disabled while a modal is open on tvOS. */
    fun selectMode(mode: TvDashboardMode): TvDashboardNavigationSnapshot {
        if (currentDialog == null) {
            currentMode = mode
            currentFocus = TvDashboardFocus(mode, TvDashboardControl.MODE)
        }
        return snapshot()
    }

    fun focus(control: TvDashboardControl): TvDashboardNavigationSnapshot {
        if (currentDialog == null) {
            currentFocus = TvDashboardFocus(currentMode, control)
        }
        return snapshot()
    }

    /**
     * Replace an existing overlay without a synthetic return to the dashboard.
     * Example: Settings -> Reciter Picker, keeping the previous restore target.
     */
    fun openDialog(dialog: TvDashboardDialog): TvDashboardNavigationSnapshot {
        if (currentDialog == null) restoreFocus = currentFocus
        currentDialog = dialog
        return snapshot()
    }

    fun closeDialog(): TvDashboardNavigationSnapshot {
        if (currentDialog != null) {
            currentDialog = null
            currentMode = restoreFocus.screen
            currentFocus = restoreFocus
        }
        return snapshot()
    }

    /**
     * Mirrors the top-level TV Back contract. Caller must stop/dismiss an
     * active screensaver or media modal before invoking this dashboard action.
     */
    fun back(): TvDashboardNavigationSnapshot = if (currentDialog != null) {
        closeDialog()
    } else {
        selectMode(TvDashboardMode.PRAYER)
    }
}
