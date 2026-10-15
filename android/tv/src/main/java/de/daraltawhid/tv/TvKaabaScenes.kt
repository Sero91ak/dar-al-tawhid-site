package de.daraltawhid.tv

import java.time.ZonedDateTime

/**
 * Exact choice/order/asset mapping from owner's current tvOS
 * DarAlTawhidTV/TVSceneManager.swift (15 October 2026).
 *
 * IMPORTANT tvOS contract: `activeBackgroundAssetName` is always chosen from
 * `selectedBackground.assetName`, NOT from the weather scene. Automatic
 * weather/time states are a separate scene concept and must never overwrite
 * the user-selected still background or produce unsolicited video playback.
 */
internal enum class TvKaabaBackgroundChoice(
    val key: String, val title: String, val drawable: String,
    val readabilityMode: Boolean = false
) {
    DEFAULT_NIGHT("defaultNight", "Standard Nacht", "tv_kaaba_night", true),
    READABILITY_NIGHT("readabilityNight", "Standard Nacht · Lesemodus", "tv_kaaba_night", true),
    MECCA_DARK("meccaDark", "Mekka Dunkel", "tv_kaaba_night"),
    MECCA_LIGHT("meccaLight", "Mekka Hell", "tv_kaaba_day"),
    MECCA_NEW_1("meccaNew1", "Mekka Neu 1", "tv_kaaba_mekka_new1"),
    MECCA_NEW_2("meccaNew2", "Mekka Neu 2", "tv_kaaba_mekka_new2"),
    SUNRISE("sunrise", "Sonnenaufgang", "tv_kaaba_sunrise"),
    SUNSET("sunset", "Sonnenuntergang", "tv_kaaba_sunset"),
    THUNDERSTORM("thunderstorm", "Gewitter", "tv_kaaba_thunderstorm"),
    DAY("day", "Klarer Tag", "tv_kaaba_day"),
    RAIN("rain", "Regen", "tv_kaaba_rain"),
    AUTUMN("autumn", "Herbst", "tv_kaaba_autumn");

    companion object {
        fun restore(key: String?) =
            entries.firstOrNull { it.key == key } ?: DEFAULT_NIGHT
    }
}

internal enum class TvKaabaWeatherScene {
    SUNRISE, CLEAR_DAY, SPRING, SUNSET, AUTUMN, CLOUDY,
    RAIN, HEAVY_RAIN, THUNDERSTORM, STORM,
    SNOW_DAY, SNOW_NIGHT, CLEAR_NIGHT
}

internal data class TvKaabaWeatherContext(
    val localTime: ZonedDateTime,
    val condition: String? = null,
    val temperatureCelsius: Double? = null,
    val precipitationMm: Double? = null,
    val snowfallCm: Double? = null,
    val weatherCode: Int? = null,
    val sunrise: ZonedDateTime? = null,
    val sunset: ZonedDateTime? = null
)

/**
 * Port of TVKaabaSceneManager.scene(for:).
 * This resolves scene metadata only; still-image choice remains MANUAL.
 */
internal object TvKaabaSceneResolver {
    fun resolve(context: TvKaabaWeatherContext): TvKaabaWeatherScene {
        val weather = context.condition.orEmpty().lowercase()
        val hour = context.localTime.hour
        val month = context.localTime.monthValue
        val autumn = month in 9..11
        val isNight = if (context.sunrise != null && context.sunset != null) {
            context.localTime.isBefore(context.sunrise) ||
                !context.localTime.isBefore(context.sunset)
        } else hour >= 22 || hour < 6
        val sunriseWindow = context.sunrise?.let {
            kotlin.math.abs(java.time.Duration.between(it, context.localTime).toMinutes()) <= 45
        } ?: (hour == 6)
        val sunsetWindow = context.sunset?.let {
            kotlin.math.abs(java.time.Duration.between(it, context.localTime).toMinutes()) <= 60
        } ?: (hour in 17..19)

        val thunderstorm = "gewitter" in weather ||
            (context.weatherCode?.let { it in 95..99 } == true)
        val snow = "schnee" in weather || (context.snowfallCm ?: 0.0) > 0 ||
            ((context.temperatureCelsius ?: 10.0) <= 0 &&
                (context.precipitationMm ?: 0.0) > 0)
        val heavyRain = "stark" in weather || (context.precipitationMm ?: 0.0) >= 5
        val rain = "regen" in weather || "niesel" in weather ||
            (context.precipitationMm ?: 0.0) > 0
        val clouds = listOf("bewölkt", "wolke", "nebel", "bedeckt").any { it in weather }
        return when {
            thunderstorm -> TvKaabaWeatherScene.THUNDERSTORM
            snow -> if (isNight) TvKaabaWeatherScene.SNOW_NIGHT else TvKaabaWeatherScene.SNOW_DAY
            heavyRain -> TvKaabaWeatherScene.HEAVY_RAIN
            rain -> TvKaabaWeatherScene.RAIN
            "sturm" in weather -> TvKaabaWeatherScene.STORM
            clouds -> TvKaabaWeatherScene.CLOUDY
            sunriseWindow -> TvKaabaWeatherScene.SUNRISE
            sunsetWindow -> if (autumn) TvKaabaWeatherScene.AUTUMN else TvKaabaWeatherScene.SUNSET
            isNight -> TvKaabaWeatherScene.CLEAR_NIGHT
            month in 3..5 -> TvKaabaWeatherScene.SPRING
            else -> TvKaabaWeatherScene.CLEAR_DAY
        }
    }
}
