package com.example.basaltsurgemobile.hardware

import android.content.Context
import android.util.Log

// Type-safe null-aware wrappers for the external SDKs
import com.topwise.cloudpos.service.DeviceServiceManager
import com.valor.valorsdk.ValorSDK
import com.valor.valorsdk.Listener.OnResult

object HardwareRegistry {
    private const val TAG = "HardwareRegistry"
    private var isInitialized = false

    // SDK Managers
    var topWiseManager: DeviceServiceManager? = null
        private set

    var valorSDKManager: ValorSDK? = null
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
            DeviceType.VALOR_VP550, DeviceType.VALOR_VP800 -> {
                initValor(context)
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

    private fun initValor(context: Context) {
        Log.d(TAG, "Initializing Valor SDK Manager...")
        val manager = ValorSDK()
        manager.SDK_Service_Int(context, object : OnResult {
            override fun Success() {
                Log.d(TAG, "Valor SDK Service initialized successfully")
                valorSDKManager = manager
                isInitialized = true
            }
            
            override fun Onprocess(progressMessage: String?) {
                Log.d(TAG, "Valor SDK Service init progress: $progressMessage")
            }

            override fun Fail(errorMessage: String?) {
                Log.e(TAG, "Failed to initialize Valor SDK Service: $errorMessage")
            }
        })
    }
}
