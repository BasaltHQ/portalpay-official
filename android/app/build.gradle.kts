plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.example.basaltsurgemobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.basaltsurgemobile"
        minSdk = 24
        targetSdk = 35
        // Read version from project properties (passed from CI/CD)
        // Use toString() to ensure safe conversion regardless of type
        val vCode = project.findProperty("VERSION_CODE")?.toString()?.toIntOrNull() ?: 1
        val vName = project.findProperty("VERSION_NAME")?.toString() ?: "1.0"
        
        // Print for build log verification
        println("AppConfig: Building with VersionCode: $vCode, VersionName: $vName")
        
        versionCode = vCode
        versionName = vName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildFeatures.buildConfig = true

        // Dynamic URL
        val baseDomain = project.findProperty("BASE_DOMAIN") as? String ?: "https://surge.basalthq.com"
        buildConfigField("String", "BASE_DOMAIN", "\"$baseDomain\"")

        // Dynamic App Name
        val appName = project.findProperty("APP_NAME") as? String ?: "BasaltSurge"
        resValue("string", "app_name", appName)
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        resValues = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    // Capacitor and local SDKs
    implementation(project(":capacitor-android"))
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar", "*.aar"))))
    
    // Capacitor requires AppCompat and CoordinatorLayout
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    implementation("androidx.core:core-splashscreen:1.0.0")
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}