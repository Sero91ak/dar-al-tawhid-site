package de.daraltawhid.app

import android.app.Application
import android.content.Context
import android.os.Build
import android.provider.Settings
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import org.json.JSONObject
import java.util.UUID

object DarPush {
    private const val PREFS = "dar.android.push"
    private const val DEVICE_ID_KEY = "device.id"

    fun deviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = prefs.getString(DEVICE_ID_KEY, null)
        if (!existing.isNullOrBlank()) return existing
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        val created = if (!androidId.isNullOrBlank() && androidId != "9774d56d682e549c") {
            "android-$androidId"
        } else {
            "android-${UUID.randomUUID()}"
        }
        prefs.edit().putString(DEVICE_ID_KEY, created).apply()
        return created
    }

    fun bootstrap(app: Application) {
        OneSignal.Debug.logLevel = LogLevel.WARN
        OneSignal.initWithContext(app, DarShell.ONE_SIGNAL_APP_ID)
        OneSignal.login(deviceId(app))
        OneSignal.User.addTags(
            mapOf(
                "dar_push" to "true",
                "post_notifications" to "true",
                "platform" to "android",
                "dar_client" to "native_android",
                "dar_env" to "live",
                "os_version" to Build.VERSION.RELEASE.orEmpty()
            )
        )
        OneSignal.User.pushSubscription.optIn()
    }

    fun subscriptionId(): String = OneSignal.User.pushSubscription.id.orEmpty()

    fun pushToken(): String = OneSignal.User.pushSubscription.token.orEmpty()

    fun applyWebSettings(json: String) {
        runCatching {
            val obj = JSONObject(json)
            val tags = mutableMapOf<String, String>()
            obj.keys().forEach { key ->
                val value = obj.opt(key) ?: return@forEach
                tags[key] = value.toString()
            }
            if (tags.isNotEmpty()) OneSignal.User.addTags(tags)
        }
    }
}
