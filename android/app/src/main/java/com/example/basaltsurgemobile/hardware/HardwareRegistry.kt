package com.example.basaltsurgemobile.hardware

import android.content.Context
import android.util.Log

// Type-safe null-aware wrappers for the external SDKs
import com.topwise.cloudpos.aidl.AidlDeviceServiceManager

object HardwareRegistry {
    private const val TAG = "HardwareRegistry"
    private var isInitialized = false

    // SDK Managers
    var topWiseManager: AidlDeviceServiceManager? = null
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
        Log.d(TAG, "Binding TopWise AidlDeviceServiceManager...")
        val manager = AidlDeviceServiceManager.getInstance()
        manager.bindDeviceService(context, object : AidlDeviceServiceManager.DeviceServiceManagerListener {
            override fun onConnected() {
                Log.i(TAG, "TopWise DeviceService bound successfully.")
                topWiseManager = manager
                isInitialized = true
            }

            override fun onDisconnected() {
                Log.w(TAG, "TopWise DeviceService disconnected.")
                topWiseManager = null
                isInitialized = false
            }
        })
    }

    private fun initIcod(context: Context) {
        // ICOD usually initializes components on-demand (e.g., PrinterAPI.getInstance().init())
        // but we can place global ICOD initialization here if required.
        Log.d(TAG, "ICOD Device - Ready for on-demand component initialization.")
        isInitialized = true
    }
}
