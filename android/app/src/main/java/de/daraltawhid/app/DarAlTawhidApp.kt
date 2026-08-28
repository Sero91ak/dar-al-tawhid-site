package de.daraltawhid.app

import android.app.Application

class DarAlTawhidApp : Application() {
    override fun onCreate() {
        super.onCreate()
        DarPush.bootstrap(this)
    }
}
