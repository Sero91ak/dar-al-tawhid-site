package de.daraltawhid.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DarPushTagMapperTest {
    @Test fun allAdultReminderCategoriesAreMapped() {
        val tags = DarPushTagMapper.fromJson(
            """{"reminder":true,"locationGranted":true,"lat":50.62945,"lon":6.94935,
              "angle":15,"asrFactor":2,"prayerFajr":true,"prayerAsr":false,
              "dailyDua":true,"dailyRecommendation":false,
              "jummahNotifications":true,"jummahUseManualTime":true,
              "jummahManualTime":"13:30","jummahAdvanceMinutes":45}""",
            "Europe/Berlin"
        )
        assertEquals("native_android", tags["dar_client"])
        assertEquals("android", tags["platform"])
        assertEquals("true", tags["prayer_notifications"])
        assertEquals("50.62945", tags["prayer_lat"])
        assertEquals("6.94935", tags["prayer_lon"])
        assertEquals("false", tags["prayer_asr_notifications"])
        assertEquals("true", tags["prayer_fajr_notifications"])
        assertEquals("false", tags["daily_recommendation_notifications"])
        assertEquals("true", tags["jummah_notifications"])
        assertEquals("45", tags["jummah_advance_minutes"])
        assertEquals("Europe/Berlin", tags["prayer_timezone"])
    }

    @Test fun invalidLocationNeverEnablesPrayerScheduler() {
        val tags = DarPushTagMapper.fromJson(
            """{"reminder":true,"lat":null,"lon":null,"dailyDua":false,"dailyRecommendation":false}"""
        )
        assertEquals("false", tags["prayer_notifications"])
        assertFalse(tags.containsKey("prayer_lat"))
        assertFalse(tags.containsKey("prayer_lon"))
        assertEquals("false", tags["reminders_enabled"])
    }

    @Test fun arbitraryKeysAndInvalidTimesAreNotForwarded() {
        val tags = DarPushTagMapper.fromJson(
            """{"dar_client":"native_ios","admin":"true","dailyDuaTime":"99:99",
              "jummahManualTime":"-1:70","prayerAsr":false,"dailyDua":false}"""
        )
        assertEquals("native_android", tags["dar_client"])
        assertFalse(tags.containsKey("admin"))
        assertEquals("09:00", tags["daily_dua_time"])
        assertEquals("13:30", tags["jummah_manual_time"])
        assertEquals("false", tags["daily_dua_enabled"])
        assertEquals("false", tags["prayer_asr_notifications"])
    }
}
