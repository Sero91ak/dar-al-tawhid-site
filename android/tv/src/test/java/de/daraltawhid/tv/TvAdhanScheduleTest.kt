package de.daraltawhid.tv

import java.time.LocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TvAdhanScheduleTest {
    private val sample = TvAdhanSchedule.parsedTimes(
        mapOf("fajr" to "05:45", "dhuhr" to "13:10",
            "asr" to "16:21", "maghrib" to "18:26", "isha" to "19:51")
    )

    @Test fun acceptsFiveValidPrayerTimes() {
        assertEquals(5, sample.size)
        assertEquals(5, TvAdhanSchedule.prayerKeys.size)
    }

    @Test fun rejectsInvalidHoursAndFakePrayers() {
        val parsed = TvAdhanSchedule.parsedTimes(mapOf(
            "fajr" to "25:90", "dhuhr" to "1:07", "sunrise" to "06:30",
            "isha" to "19:51:59"
        ))
        assertEquals(1, parsed.size)
        assertEquals(1, parsed["dhuhr"]?.hour)
    }

    @Test fun dueExactlyAtPrayerMinuteNotBeforeOrAfter() {
        val moment = LocalDateTime.of(2026, 10, 15, 13, 10, 38)
        assertEquals("dhuhr", TvAdhanSchedule.due(moment, sample)?.key)
        assertNull(TvAdhanSchedule.due(moment.minusMinutes(1), sample))
        assertNull(TvAdhanSchedule.due(moment.plusMinutes(1), sample))
    }

    @Test fun handledPrayerDoesNotPlayTwiceButOtherPrayerCanPlay() {
        val midday = LocalDateTime.of(2026, 10, 15, 13, 10)
        val triggered = TvAdhanSchedule.due(midday, sample)!!
        assertNull(TvAdhanSchedule.due(midday, sample, setOf(triggered.triggerKey)))
        assertEquals("asr",
            TvAdhanSchedule.due(LocalDateTime.of(2026, 10, 15, 16, 21),
                sample, setOf(triggered.triggerKey))?.key)
    }

    @Test fun tomorrowUsesDifferentTriggerKey() {
        val first = TvAdhanSchedule.due(
            LocalDateTime.of(2026, 10, 15, 5, 45), sample
        )!!
        val next = TvAdhanSchedule.due(
            LocalDateTime.of(2026, 10, 16, 5, 45), sample,
            setOf(first.triggerKey)
        )!!
        assertTrue(first.triggerKey != next.triggerKey)
    }
}
