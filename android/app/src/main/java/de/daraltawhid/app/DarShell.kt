package de.daraltawhid.app

import android.net.Uri

object DarShell {
    const val HOST = "dar-al-tawhid.de"
    const val WWW_HOST = "www.dar-al-tawhid.de"
    const val LIVE_URL = "https://dar-al-tawhid.de/#home"
    const val ONE_SIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e"
    const val CUSTOM_SCHEME = "daraltawhid"

    fun isOwnHost(uri: Uri?): Boolean {
        if (uri == null) return false
        val scheme = uri.scheme?.lowercase().orEmpty()
        if (scheme == CUSTOM_SCHEME) return true
        val host = uri.host?.lowercase().orEmpty()
        return (scheme == "https" || scheme == "http") &&
            (host == HOST || host == WWW_HOST)
    }

    fun inAppUrl(incoming: Uri?): String {
        val source = incoming ?: return LIVE_URL
        if (source.scheme.equals(CUSTOM_SCHEME, ignoreCase = true)) {
            val hash = source.getQueryParameter("hash")
                ?: source.host
                ?: "home"
            return "https://$HOST/#${hash.trimStart('#')}"
        }
        if (!isOwnHost(source)) return LIVE_URL
        val builder = source.buildUpon().scheme("https").authority(HOST)
        var path = source.path.orEmpty()
        when {
            path.startsWith("/test/") -> path = path.removePrefix("/test")
            path == "/test" -> path = "/"
        }
        if (path.isEmpty()) path = "/"
        builder.path(path)
        return builder.build().toString()
    }

    fun shouldOpenExternally(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        return scheme in setOf("mailto", "tel", "sms", "geo", "market", "intent")
    }
}
