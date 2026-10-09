package de.daraltawhid.app

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager

object DarLauncherIcons {
    private const val PREFS = "dar_launcher_icon_v1"
    private const val KEY = "selected"

    private val aliases = linkedMapOf(
        "type-creme-ar" to "LauncherTypeCremeAr",
        "emblem-creme-petrol" to "LauncherEmblemCremePetrol",
        "emblem-nachtblau" to "LauncherEmblemNachtblau",
        "emblem-schwarzgold" to "LauncherEmblemSchwarzgold",
        "type-anthrazit-ar" to "LauncherTypeAnthrazitAr",
        "type-anthrazit-fein" to "LauncherTypeAnthrazitFein",
        "type-creme" to "LauncherTypeCreme",
        "type-weiss-ar" to "LauncherTypeWeissAr",
        "type-schwarz-rund" to "LauncherTypeSchwarzRund",
        "type-schwarz-ar" to "LauncherTypeSchwarzAr",
        "type-schwarz" to "LauncherTypeSchwarz",
        "type-navy-ar" to "LauncherTypeNavyAr",
        "type-navy" to "LauncherTypeNavy",
        "type-bordeaux-ar" to "LauncherTypeBordeauxAr",
        "type-bordeaux" to "LauncherTypeBordeaux",
        "type-gruen-ar" to "LauncherTypeGruenAr",
        "type-gruen" to "LauncherTypeGruen",
        "type-schwarz-ar2" to "LauncherTypeSchwarzAr2"
    )

    fun normalize(value: String?): String? {
        val id = value.orEmpty().trim().lowercase()
        return if (aliases.containsKey(id)) id else null
    }

    fun current(context: Context): String {
        val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY, "type-creme-ar")
        return normalize(saved) ?: "type-creme-ar"
    }

    fun ensureSelected(context: Context) {
        set(context, current(context))
    }

    fun set(context: Context, requested: String): String {
        val selected = normalize(requested) ?: "type-creme-ar"
        val pm = context.packageManager

        // Enable the new alias first so there is never a moment with no launcher entry.
        aliases[selected]?.let { alias ->
            try {
                pm.setComponentEnabledSetting(
                    ComponentName(context.packageName, "${context.packageName}.$alias"),
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
            } catch (_: Exception) {
            }
        }

        aliases.forEach { (id, alias) ->
            if (id == selected) return@forEach
            try {
                pm.setComponentEnabledSetting(
                    ComponentName(context.packageName, "${context.packageName}.$alias"),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                )
            } catch (_: Exception) {
            }
        }

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY, selected)
            .apply()
        return selected
    }

    fun ids(): Set<String> = aliases.keys
}
