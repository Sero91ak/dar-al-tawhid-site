package de.daraltawhid.tv

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TvIslamicCalendarTest {
    @Test fun hijriDateContainsDayMonthAndYear() {
        val label = TvIslamicCalendar.hijriLabel(LocalDate.of(2026, 10, 15))
        assertTrue(label.contains("AH"))
        assertTrue(label.matches(Regex("^[0-9]{1,2}\\. .+ [0-9]{4} AH$")))
    }

    @Test fun sevenDayPreviewDatesAreContinuousAndReadable() {
        val day = LocalDate.of(2026, 10, 15)
        val rows = (0L..6L).map { day.plusDays(it) }
        assertEquals(7, rows.distinct().size)
        assertTrue(rows.all { TvIslamicCalendar.hijriLabel(it).isNotBlank() })
        assertFalse(TvIslamicCalendar.gregorianLabel(day).isBlank())
    }

    @Test fun upcomingOccasionsAreSortedNotPastAndWithinLimit() {
        val today = LocalDate.of(2026, 10, 15)
        val next = TvIslamicCalendar.upcoming(today, 4)
        assertTrue(next.isNotEmpty())
        assertTrue(next.size <= 4)
        assertTrue(next.all { !it.date.isBefore(today) && it.name.isNotBlank() })
        assertEquals(next.map { it.date }.sorted(), next.map { it.date })
    }

    @Test fun zeroUpcomingEventsIsAllowed() {
        assertTrue(TvIslamicCalendar.upcoming(LocalDate.of(2026, 10, 15), 0).isEmpty())
    }
}
