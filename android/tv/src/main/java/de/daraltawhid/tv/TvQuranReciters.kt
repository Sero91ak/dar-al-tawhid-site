package de.daraltawhid.tv

import org.json.JSONObject

/**
 * Source of truth: DarAlTawhidTV/QuranReciterService.swift plus
 * https://dar-al-tawhid.de/data/quran-reciters.json
 *
 * All 19 original tvOS qurrāʾ are available offline as named fallback
 * choices. A valid newer catalog may add editions without another APK.
 * A catalog entry here is not a proof that the remote audio is reachable;
 * playback has independent error handling.
 */
internal object TvQuranReciters {
    data class Reciter(val edition: String, val title: String, val style: String = "murattal") {
        val pickerLabel: String get() = when (style.lowercase()) {
            "mujawwad" -> "$title · Muǧawwad"
            "muallim" -> "$title · Muʿallim"
            else -> title
        }
    }

    val fallback = listOf(
        Reciter("ar.alafasy", "Mišārī Rāšid al-ʿAfāsī"),
        Reciter("ar.abdurrahmaansudais", "ʿAbd ar-Raḥmān as-Sudays"),
        Reciter("ar.saoodshuraym", "Saʿūd aš-Šuraym"),
        Reciter("ar.husary", "Maḥmūd Ḫalīl al-Ḥuṣarī"),
        Reciter("ar.husarymujawwad", "Maḥmūd Ḫalīl al-Ḥuṣarī", "mujawwad"),
        Reciter("ar.minshawi", "Muḥammad Ṣiddīq al-Minšāwī"),
        Reciter("ar.minshawimujawwad", "Muḥammad Ṣiddīq al-Minšāwī", "mujawwad"),
        Reciter("ar.abdulbasitmurattal", "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad"),
        Reciter("ar.abdulbasitmujawwad", "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", "mujawwad"),
        Reciter("ar.abdullahbasfar", "ʿAbdullāh Baṣfar"),
        Reciter("ar.ahmedajamy", "Aḥmad ibn ʿAlī al-ʿAǧamī"),
        Reciter("ar.hanirifai", "Hānī ar-Rifāʿī"),
        Reciter("ar.muhammadayyoub", "Muḥammad Ayyūb"),
        Reciter("ar.hudhaify", "ʿAlī al-Ḥuḏayfī"),
        Reciter("ar.mahermuaiqly", "Māhir al-Muʿayqlī"),
        Reciter("ar.muhammadjibreel", "Muḥammad Ǧibrīl"),
        Reciter("ar.shaatree", "Abū Bakr aš-Šāṭirī"),
        Reciter("ar.yasseraldossari", "Yāsir ad-Dawsarī"),
        Reciter("ar.aymanswoaid", "Ayman Suwayd", "muallim")
    )

    private val allowedEdition = Regex("""^ar\.[a-z0-9]+(?:[.-][a-z0-9]+)*$""")

    fun validEdition(edition: String): Boolean =
        edition.length in 5..75 && allowedEdition.matches(edition)

    fun fromCatalog(catalog: JSONObject?): List<Reciter> {
        val array = catalog?.optJSONArray("reciters") ?: return fallback
        val found = ArrayList<Reciter>()
        val seen = HashSet<String>()
        for (i in 0 until array.length().coerceAtMost(100)) {
            val row = array.optJSONObject(i) ?: continue
            val edition = row.optString("edition").trim()
            val name = row.optString("name").trim()
            val style = row.optString("style", "murattal").trim().lowercase()
            if (!validEdition(edition) || name.length !in 2..90 || !seen.add(edition)) continue
            if (style !in setOf("murattal", "mujawwad", "muallim", "versebyverse")) continue
            found.add(Reciter(edition, name, style))
        }
        // Source-backed tvOS list should not shrink because of transient
        // malformed/incomplete remote responses.
        val existing = found.map { it.edition }.toHashSet()
        for (base in fallback) {
            if (existing.add(base.edition)) found.add(base)
        }
        return found
    }
}
