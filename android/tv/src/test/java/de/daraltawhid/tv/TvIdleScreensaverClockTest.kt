package de.daraltawhid.tv

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TvIdleScreensaverClockTest {
    @Test fun exactlySixtySecondsTriggers() {
        val clock = TvIdleScreensaverClock()
        clock.start(10_000)
        assertFalse(clock.tick(69_999))
        assertTrue(clock.tick(70_000))
        assertTrue(clock.visible)
    }

    @Test fun dpadWakesWithoutActivatingBackgroundButton() {
        val clock = TvIdleScreensaverClock()
        clock.start(0)
        clock.tick(60_000)
        assertTrue(clock.onInput(60_050))
        assertFalse(clock.visible)
        assertFalse(clock.tick(100_000))
        assertTrue(clock.tick(120_050))
        assertTrue(clock.onInput(120_100))
        assertFalse(clock.onInput(120_200))
    }

    @Test fun prayerAudioAndQuranSuppressIdle() {
        val clock = TvIdleScreensaverClock()
        clock.start(0)
        clock.updateSuppression(true, 30_000)
        assertFalse(clock.tick(190_000))
        clock.updateSuppression(false, 190_000)
        assertFalse(clock.tick(249_999))
        assertTrue(clock.tick(250_000))
    }

    @Test fun activityPauseCancelsScreensaver() {
        val clock = TvIdleScreensaverClock()
        clock.start(0)
        clock.stop()
        assertFalse(clock.tick(80_000))
        assertFalse(clock.onInput(81_000))
    }

    @Test fun disabledScreensaverNeverAppears() {
        val clock = TvIdleScreensaverClock()
        clock.start(0, false)
        assertFalse(clock.tick(300_000))
    }
}
