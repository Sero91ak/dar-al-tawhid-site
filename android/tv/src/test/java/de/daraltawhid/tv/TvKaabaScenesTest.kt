package de.daraltawhid.tv

import java.time.ZoneId
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TvKaabaScenesTest {
    private val zone = ZoneId.of("Europe/Berlin")
    private fun at(month: Int, hour: Int): ZonedDateTime =
        ZonedDateTime.of(2026, month, 15, hour, 0, 0, 0, zone)

    @Test fun hasExactlyTwelveOriginalAppleTvBackgroundChoices() {
        assertEquals(12, TvKaabaBackgroundChoice.entries.size)
        assertEquals("tv_kaaba_night", TvKaabaBackgroundChoice.DEFAULT_NIGHT.drawable)
        assertEquals("tv_kaaba_night", TvKaabaBackgroundChoice.READABILITY_NIGHT.drawable)
        assertEquals("tv_kaaba_night", TvKaabaBackgroundChoice.MECCA_DARK.drawable)
        assertEquals("tv_kaaba_day", TvKaabaBackgroundChoice.MECCA_LIGHT.drawable)
        assertEquals("tv_kaaba_mekka_new1", TvKaabaBackgroundChoice.MECCA_NEW_1.drawable)
        assertEquals("tv_kaaba_mekka_new2", TvKaabaBackgroundChoice.MECCA_NEW_2.drawable)
    }

    @Test fun automaticWeatherDoesNotChangeManualBackground() {
        val selected = TvKaabaBackgroundChoice.SUNRISE
        val storm = TvKaabaSceneResolver.resolve(
            TvKaabaWeatherContext(at(10, 14), weatherCode = 96)
        )
        assertEquals(TvKaabaWeatherScene.THUNDERSTORM, storm)
        assertEquals("tv_kaaba_sunrise", selected.drawable)
    }

    @Test fun thunderstormOverridesSnowRainAndTime() {
        assertEquals(
            TvKaabaWeatherScene.THUNDERSTORM,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(at(1, 23),
                "Gewitter und Schnee", -2.0, 8.0, 1.0, 96))
        )
    }

    @Test fun rainAndSnowPriorityMatchesSwift() {
        assertEquals(TvKaabaWeatherScene.HEAVY_RAIN,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(
                at(6, 10), "Regen", 11.0, 6.0)))
        assertEquals(TvKaabaWeatherScene.SNOW_NIGHT,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(
                at(1, 23), "Schnee", -1.0, 2.0, 2.0)))
        assertEquals(TvKaabaWeatherScene.RAIN,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(
                at(6, 10), "leichter Regen", 11.0, 1.0)))
    }

    @Test fun sunriseSunsetAutumnAndClearNightAreDistinct() {
        assertEquals(TvKaabaWeatherScene.SUNRISE,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(at(4, 6))))
        assertEquals(TvKaabaWeatherScene.SUNSET,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(at(4, 18))))
        assertEquals(TvKaabaWeatherScene.AUTUMN,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(at(10, 18))))
        assertEquals(TvKaabaWeatherScene.CLEAR_NIGHT,
            TvKaabaSceneResolver.resolve(TvKaabaWeatherContext(at(7, 23))))
    }

    @Test fun allBackgroundNamesAreDistinctExceptIntentionalSharedVariants() {
        val all = TvKaabaBackgroundChoice.entries.map { it.drawable }
        assertEquals(9, all.distinct().size)
        assertTrue(TvKaabaBackgroundChoice.DEFAULT_NIGHT.readabilityMode)
        assertTrue(TvKaabaBackgroundChoice.READABILITY_NIGHT.readabilityMode)
        assertNotEquals(TvKaabaBackgroundChoice.DEFAULT_NIGHT.key,
            TvKaabaBackgroundChoice.READABILITY_NIGHT.key)
    }
}
