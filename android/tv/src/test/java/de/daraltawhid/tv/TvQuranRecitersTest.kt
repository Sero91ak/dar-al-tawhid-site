package de.daraltawhid.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TvQuranRecitersTest {
    @Test fun exactNineteenOriginalRecitersRemainAvailableOffline() {
        assertEquals(19, TvQuranReciters.fallback.size)
        assertEquals(19, TvQuranReciters.fallback.map { it.edition }.distinct().size)
        assertTrue(TvQuranReciters.fallback.all {
            TvQuranReciters.validEdition(it.edition) && it.pickerLabel.isNotBlank()
        })
    }

    @Test fun mujawwadAndMuallimAreDifferentiated() {
        assertTrue(TvQuranReciters.fallback.first {
            it.edition == "ar.husarymujawwad"
        }.pickerLabel.contains("Muǧawwad"))
        assertTrue(TvQuranReciters.fallback.first {
            it.edition == "ar.aymanswoaid"
        }.pickerLabel.contains("Muʿallim"))
    }

    @Test fun editionIdsAreSanitizedBeforeConstructingAudioRequests() {
        assertFalse(TvQuranReciters.validEdition("../../secret"))
        assertFalse(TvQuranReciters.validEdition("ar.invalid/../../key"))
        assertFalse(TvQuranReciters.validEdition("https://host/path"))
        assertTrue(TvQuranReciters.validEdition("ar.alafasy"))
        assertTrue(TvQuranReciters.validEdition("ar.husarymujawwad"))
    }

    @Test fun fallbackBeginsWithTvOsDefault() {
        assertEquals("ar.alafasy", TvQuranReciters.fallback.first().edition)
    }
}
