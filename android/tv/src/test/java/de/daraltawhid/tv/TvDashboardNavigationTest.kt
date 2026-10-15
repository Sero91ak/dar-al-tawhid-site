package de.daraltawhid.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TvDashboardNavigationTest {
    @Test
    fun originalTvOSDashboardHasExactlyFourModesInOriginalOrder() {
        assertEquals(
            listOf("Gebetszeiten", "Heute", "Kalender", "Qurʾān"),
            TvDashboardMode.entries.map { it.title }
        )
        assertEquals(
            listOf("home", "today", "calendar", "quran"),
            TvDashboardMode.entries.map { it.route }
        )
    }

    @Test
    fun originalModeCanBeRestoredFromSavedRoute() {
        assertEquals(TvDashboardMode.QURAN, TvDashboardMode.fromRoute("quran"))
        assertEquals(TvDashboardMode.PRAYER, TvDashboardMode.fromRoute("unknown"))
    }

    @Test
    fun modalBlocksDashboardChangesAndRestoresPriorFocus() {
        val nav = TvDashboardNavigation()
        nav.selectMode(TvDashboardMode.QURAN)
        nav.focus(TvDashboardControl.RECITER_PICKER)
        nav.openDialog(TvDashboardDialog.RECITER)
        nav.selectMode(TvDashboardMode.TODAY)
        assertEquals(TvDashboardMode.QURAN, nav.snapshot().mode)
        nav.closeDialog()
        assertEquals(TvDashboardMode.QURAN, nav.snapshot().mode)
        assertEquals(TvDashboardControl.RECITER_PICKER, nav.snapshot().focus.control)
        assertNull(nav.snapshot().dialog)
    }

    @Test
    fun replacingSettingsDialogDoesNotLoseRestoreFocus() {
        val nav = TvDashboardNavigation(TvDashboardMode.CALENDAR)
        nav.focus(TvDashboardControl.CONTENT_PRIMARY)
        nav.openDialog(TvDashboardDialog.SETTINGS)
        nav.openDialog(TvDashboardDialog.LOCATION)
        nav.closeDialog()
        assertEquals(TvDashboardMode.CALENDAR, nav.snapshot().mode)
        assertEquals(TvDashboardControl.CONTENT_PRIMARY, nav.snapshot().focus.control)
    }

    @Test
    fun backClosesModalBeforeReturningToPrayerHome() {
        val nav = TvDashboardNavigation(TvDashboardMode.TODAY)
        nav.openDialog(TvDashboardDialog.ADHAN)
        assertEquals(TvDashboardMode.TODAY, nav.back().mode)
        assertNull(nav.snapshot().dialog)
        assertEquals(TvDashboardMode.PRAYER, nav.back().mode)
    }
}
