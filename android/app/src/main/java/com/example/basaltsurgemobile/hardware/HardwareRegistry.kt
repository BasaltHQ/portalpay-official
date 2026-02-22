package com.example.basaltsurgemobile.hardware

import android.content.Context
import android.util.Log

// Type-safe null-aware wrappers for the external SDKs
import com.topwise.cloudpos.service.DeviceServiceManager

object HardwareRegistry {
    private const val TAG = "HardwareRegistry"
    private var isInitialized = false

    // SDK Managers
    var topWiseManager: DeviceServiceManager? = null
        private set

    fun initialize(context: Context) {
        if (isInitialized) return
        Log.d(TAG, "Initializing hardware layer for device: ${DeviceProfile.type}")

        when (DeviceProfile.type) {
            DeviceType.TOPWISE_T6D -> {
                initTopWise(context)
            }
            DeviceType.KIOSK_H2150B, DeviceType.KDS_21_5 -> {
                initIcod(context)
            }
            else -> {
                Log.d(TAG, "Generic device. Hardware SDK initialization skipped.")
                isInitialized = true
            }
        }
    }

    private fun initTopWise(context: Context) {
        Log.d(TAG, "Initializing TopWise DeviceServiceManager...")
        val manager = DeviceServiceManager.getInstance()
        manager.init(context)
        topWiseManager = manager
        isInitialized = true
    }

    private fun initIcod(context: Context) {
        // ICOD usually initializes components on-demand (e.g., PrinterAPI.getInstance().init())
        // but we can place global ICOD initialization here if required.
        Log.d(TAG, "ICOD Device - Ready for on-demand component initialization.")
        isInitialized = true
    }
}
