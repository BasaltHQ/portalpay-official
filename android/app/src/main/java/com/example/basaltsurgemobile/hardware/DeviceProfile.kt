package com.example.basaltsurgemobile.hardware

import android.content.Context
import android.os.Build
import android.util.Log

enum class DeviceType {
    TOPWISE_T6D,
    KIOSK_H2150B,
    KDS_21_5,
    GENERIC_PHONE,
    GENERIC_TABLET
}

object DeviceProfile {
    private const val TAG = "DeviceProfile"

    val type: DeviceType by lazy { detectDeviceType() }

    private fun detectDeviceType(): DeviceType {
        val model = Build.MODEL.uppercase()
        val manufacturer = Build.MANUFACTURER.uppercase()
        val product = Build.PRODUCT.uppercase()
        val device = Build.DEVICE.uppercase()

        Log.d(TAG, "Detecting device profile. Model: $model, Mfr: $manufacturer, Prod: $product")

        return when {
            // TopWise T6D Terminal
            model.contains("T6D") || product.contains("T6D") || manufacturer.contains("TOPWISE") -> {
                Log.d(TAG, "Detected TopWise T6D Terminal")
                DeviceType.TOPWISE_T6D
            }
            // Kiosk H2150B (ICOD)
            model.contains("H2150B") || product.contains("H2150") || manufacturer.contains("ICOD") && !model.contains("KDS") -> {
                Log.d(TAG, "Detected Kiosk H2150B")
                DeviceType.KIOSK_H2150B
            }
            // KDS 21.5" display (ICOD)
            model.contains("KDS") || product.contains("KDS") || device.contains("KDS") -> {
                Log.d(TAG, "Detected KDS Display")
                DeviceType.KDS_21_5
            }
            // Generic 
            isTablet(model, device) -> {
                Log.d(TAG, "Detected Generic Tablet")
                DeviceType.GENERIC_TABLET
            }
            else -> {
                Log.d(TAG, "Detected Generic Phone")
                DeviceType.GENERIC_PHONE
            }
        }
    }

    private fun isTablet(model: String, device: String): Boolean {
        return model.contains("TABLET") || device.contains("TABLET") || model.contains("PAD")
    }

    // Hardware Capabilities
    val hasSecondaryDisplay: Boolean get() = type == DeviceType.TOPWISE_T6D
    val hasBuiltInPrinter: Boolean get() = type == DeviceType.TOPWISE_T6D || type == DeviceType.KIOSK_H2150B
    val hasAutoCutter: Boolean get() = type == DeviceType.KIOSK_H2150B
    val hasPINPad: Boolean get() = type == DeviceType.TOPWISE_T6D
    val hasCardReader: Boolean get() = type == DeviceType.TOPWISE_T6D
    val hardwareScannerType: String get() = when (type) {
        DeviceType.TOPWISE_T6D -> "TOPWISE_CAMERA"
        DeviceType.KIOSK_H2150B -> "ICOD_2D_SCANNER"
        else -> "SOFTWARE_ML_KIT"
    }
}
