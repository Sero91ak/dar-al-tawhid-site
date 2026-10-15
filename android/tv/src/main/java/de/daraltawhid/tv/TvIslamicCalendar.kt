package de.daraltawhid.tv

import java.time.LocalDate
import java.time.chrono.HijrahDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoField
import java.util.Locale

/**
 * Source: DarAlTawhidTV/TVPrayer.swift (hijriLabel/upcomingIslamicEvents)
 * Uses the Android JVM's Umm al-Qura Hijrah calendar. Local dates can differ
 * by observation or local moon sighting; never market these as certain dates.
 */
internal object TvIslamicCalendar {
    private val months = listOf(
        "Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ aṯ-Ṯānī",
        "Ǧumādā al-Ūlā", "Ǧumādā aṯ-Ṯāniyah", "Raǧab",
        "Šaʿbān", "Ramaḍān", "Šawwāl", "Ḏū l-Qaʿdah", "Ḏū l-Ḥiǧǧah"
    )
    private val germanDate = DateTimeFormatter.ofPattern("EEE, dd. MMM yyyy", Locale.GERMANY)

    internal data class Occasion(val date: LocalDate, val hijri: String, val name: String, val detail: String)
    private data class Definition(val month: Int, val day: Int, val name: String, val detail: String)
    private val occasions = listOf(
        Definition(1, 1, "Islamisches Neujahr", "Beginn des Hijrī-Jahres"),
        Definition(1, 10, "ʿĀšūrāʾ", "Empfohlenes freiwilliges Fasten"),
        Definition(8, 15, "Mitte Šaʿbān", "Mitte des Monats Šaʿbān"),
        Definition(9, 1, "Beginn Ramaḍān", "Beginn des Fastenmonats"),
        Definition(10, 1, "ʿĪd al-Fiṭr", "Fest des Fastenbrechens"),
        Definition(12, 1, "Erste zehn Tage Ḏū l-Ḥiǧǧah", "Die ersten zehn Tage"),
        Definition(12, 9, "Tag von ʿArafah", "Empfohlenes freiwilliges Fasten"),
        Definition(12, 10, "ʿĪd al-Aḍḥā", "Opferfest")
    )

    fun hijriLabel(day: LocalDate): String {
        val hijri = HijrahDate.from(day)
        return "${hijri.get(ChronoField.DAY_OF_MONTH)}. " +
            "${months[hijri.get(ChronoField.MONTH_OF_YEAR) - 1]} " +
            "${hijri.get(ChronoField.YEAR)} AH"
    }

    fun gregorianLabel(day: LocalDate): String = day.format(germanDate)

    fun upcoming(reference: LocalDate, count: Int = 4): List<Occasion> {
        val year = HijrahDate.from(reference).get(ChronoField.YEAR)
        return (year..year + 1).flatMap { y ->
            occasions.mapNotNull { d ->
                runCatching {
                    val day = LocalDate.from(HijrahDate.of(y, d.month, d.day))
                    Occasion(day, hijriLabel(day), d.name, d.detail)
                }.getOrNull()
            }
        }.filter { !it.date.isBefore(reference) }
            .sortedWith(compareBy({ it.date }, { it.name }))
            .take(count.coerceIn(0, 16))
    }
}
