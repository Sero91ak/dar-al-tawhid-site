package de.daraltawhid.app

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import java.util.Locale

/**
 * Native Android launcher-icon switching. Matches the same icon IDs as the
 * existing iOS darAppIcon web picker. The user-supplied navy/cream logo is the
 * immutable install default; changing icon never changes app identity/data.
 */
object DarAppIcons {
    private const val PREFS = "dar_android_launcher_icon"
    private const val SELECTED = "selected"
    private val classes = linkedMapOf(
        "default" to "de.daraltawhid.app.LauncherDefault",
        "emblem-creme-petrol" to "de.daraltawhid.app.LauncherEmblemCremePetrol",
        "emblem-nachtblau" to "de.daraltawhid.app.LauncherEmblemNachtblau",
        "emblem-schwarzgold" to "de.daraltawhid.app.LauncherEmblemSchwarzgold",
        "type-anthrazit-ar" to "de.daraltawhid.app.LauncherTypeAnthrazitAr",
        "type-anthrazit-fein" to "de.daraltawhid.app.LauncherTypeAnthrazitFein",
        "type-bordeaux-ar" to "de.daraltawhid.app.LauncherTypeBordeauxAr",
        "type-bordeaux" to "de.daraltawhid.app.LauncherTypeBordeaux",
        "type-creme-ar" to "de.daraltawhid.app.LauncherTypeCremeAr",
        "type-creme" to "de.daraltawhid.app.LauncherTypeCreme",
        "type-gruen-ar" to "de.daraltawhid.app.LauncherTypeGruenAr",
        "type-gruen" to "de.daraltawhid.app.LauncherTypeGruen",
        "type-navy-ar" to "de.daraltawhid.app.LauncherTypeNavyAr",
        "type-navy" to "de.daraltawhid.app.LauncherTypeNavy",
        "type-schwarz-ar" to "de.daraltawhid.app.LauncherTypeSchwarzAr",
        "type-schwarz-ar2" to "de.daraltawhid.app.LauncherTypeSchwarzAr2",
        "type-schwarz-rund" to "de.daraltawhid.app.LauncherTypeSchwarzRund",
        "type-schwarz" to "de.daraltawhid.app.LauncherTypeSchwarz",
        "type-weiss-ar" to "de.daraltawhid.app.LauncherTypeWeissAr"
    )
    fun current(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(SELECTED, "default") ?: "default"

    private fun resolve(raw: String): String? {
        val id = raw.trim().lowercase(Locale.ROOT)
        if (id.isEmpty() || id == "primary" || id == "appicon") return "default"
        return when (id) {
            "default" -> "default"
            "emblem-creme-petrol", "appiconemblemcremepetrol" -> "emblem-creme-petrol"
            "emblem-nachtblau", "appiconemblemnachtblau" -> "emblem-nachtblau"
            "emblem-schwarzgold", "appiconemblemschwarzgold" -> "emblem-schwarzgold"
            "type-anthrazit-ar", "appicontypeanthrazitar" -> "type-anthrazit-ar"
            "type-anthrazit-fein", "appicontypeanthrazitfein" -> "type-anthrazit-fein"
            "type-bordeaux-ar", "appicontypebordeauxar" -> "type-bordeaux-ar"
            "type-bordeaux", "appicontypebordeaux" -> "type-bordeaux"
            "type-creme-ar", "appicontypecremear" -> "type-creme-ar"
            "type-creme", "appicontypecreme" -> "type-creme"
            "type-gruen-ar", "appicontypegruenar" -> "type-gruen-ar"
            "type-gruen", "appicontypegruen" -> "type-gruen"
            "type-navy-ar", "appicontypenavyar" -> "type-navy-ar"
            "type-navy", "appicontypenavy" -> "type-navy"
            "type-schwarz-ar", "appicontypeschwarzar" -> "type-schwarz-ar"
            "type-schwarz-ar2", "appicontypeschwarzar2" -> "type-schwarz-ar2"
            "type-schwarz-rund", "appicontypeschwarzrund" -> "type-schwarz-rund"
            "type-schwarz", "appicontypeschwarz" -> "type-schwarz"
            "type-weiss-ar", "appicontypeweissar" -> "type-weiss-ar"
            else -> null // Unsupported names must not change the active icon.
        }
    }

    fun set(context: Context, raw: String): Boolean {
        val selected = resolve(raw) ?: return false
        if (current(context) == selected) return true
        val manager = context.packageManager
        try {
            // Enable replacement before disabling the previous launcher alias:
            // there must always be at least one launcher entry.
            val choice = ComponentName(context, classes.getValue(selected))
            manager.setComponentEnabledSetting(
                choice, PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            for ((name, className) in classes) {
                if (name == selected) continue
                val alias = ComponentName(context, className)
                manager.setComponentEnabledSetting(
                    alias, PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                )
            }
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(SELECTED, selected).apply()
            return true
        } catch (_: RuntimeException) {
            // Icon switching is cosmetic; never interrupt the running app.
            return false
        }
    }
}
