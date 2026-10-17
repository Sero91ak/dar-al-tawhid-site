plugins {
    id("com.android.application")
}

android {
    namespace = "de.daraltawhid.testapp"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.daraltawhid.testapp"
        minSdk = 26
        // Test distribution only: no Play Store target or live-signing changes.
        targetSdk = 34
        versionCode = 3
        versionName = "0.1.3"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ""
            versionNameSuffix = "-test"
        }
        release {
            isMinifyEnabled = false
            // Never publish an unsigned/unknown-key release.
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
