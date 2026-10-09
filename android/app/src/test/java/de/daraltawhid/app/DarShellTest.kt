package de.daraltawhid.app

import android.net.Uri
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * JVM-level checks for Android APK URL routing and deep links.
 * Device permission and widget tests are tracked separately.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class DarShellTest {

    @Test
    fun canonicalAndWwwSiteAreTrusted() {
        assertTrue(DarShell.isOwnHost(Uri.parse("https://dar-al-tawhid.de/#home")))
        assertTrue(DarShell.isOwnHost(Uri.parse("https://www.dar-al-tawhid.de/quran")))
    }

    @Test
    fun externalOrImpersonatingHostsAreNotTrusted() {
        assertFalse(DarShell.isOwnHost(Uri.parse("https://dar-al-tawhid.de.evil.invalid/")))
        assertFalse(DarShell.isOwnHost(Uri.parse("https://example.org/")))
        assertFalse(DarShell.isOwnHost(Uri.parse("javascript:alert(1)")))
    }

    @Test
    fun homeAndCustomDeepLinkOpenInsideNativeApk() {
        assertEquals("https://dar-al-tawhid.de/#home", DarShell.inAppUrl(null))
        assertEquals(
            "https://dar-al-tawhid.de/#quran",
            DarShell.inAppUrl(Uri.parse("daraltawhid://quran"))
        )
    }

    @Test
    fun externalDeepLinkCannotRedirectNativeShellToOtherOrigin() {
        assertEquals(
            DarShell.LIVE_URL,
            DarShell.inAppUrl(Uri.parse("https://untrusted.invalid/#home"))
        )
    }

    @Test
    fun systemIntentsOpenOutsideTheWebView() {
        assertTrue(DarShell.shouldOpenExternally(Uri.parse("mailto:help@example.org")))
        assertTrue(DarShell.shouldOpenExternally(Uri.parse("tel:+4912345")))
        assertFalse(DarShell.shouldOpenExternally(Uri.parse("https://dar-al-tawhid.de/")))
    }
}
