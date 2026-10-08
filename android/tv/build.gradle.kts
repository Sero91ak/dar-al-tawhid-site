plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "de.daraltawhid.tv"
    compileSdk = 36

    defaultConfig {
        applicationId = "de.daraltawhid.tv"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
        resourceConfigurations += listOf("de")
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}
