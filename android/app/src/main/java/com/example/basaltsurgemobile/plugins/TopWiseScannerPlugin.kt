package com.example.basaltsurgemobile.plugins

import android.util.Log
import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.example.basaltsurgemobile.hardware.DeviceType
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.topwise.cloudpos.aidl.camera.AidlCameraScanCodeListener

@CapacitorPlugin(name = "TopWiseScanner")
class TopWiseScannerPlugin : Plugin() {

    companion object {
        const val TAG = "TopWiseScannerPlugin"
    }

    private var activeCall: PluginCall? = null

    override fun load() {
        super.load()
    }

    @PluginMethod
    fun startScan(call: PluginCall) {
        this.activeCall = call
        try {
            val cameraManager = HardwareRegistry.topWiseManager?.cameraManager
            if (cameraManager == null) {
                call.reject("TopWise hardware manager not initialized")
                return
            }

            val bundle = android.os.Bundle()
            // Using back camera by default (0: front, 1: back, 2: top depending on model)
            bundle.putInt("cameraId", 1) 
            
            cameraManager.scanCode(bundle, object : com.topwise.cloudpos.aidl.camera.AidlCameraScanCodeListener.Stub() {
                override fun onResult(result: String) {
                    val ret = JSObject()
                    ret.put("value", result)
                    activeCall?.resolve(ret)
                    activeCall = null
                }

                override fun onError(error: Int) {
                    activeCall?.reject("Scanner error code: $error")
                    activeCall = null
                }

                override fun onCancel() {
                    activeCall?.reject("Scanner cancelled")
                    activeCall = null
                }
                
                override fun onTimeout() {
                    activeCall?.reject("Scanner timed out")
                    activeCall = null
                }
                
                override fun onPreview(p0: ByteArray?, p1: Int, p2: Int) {
                    // Ignore preview payloads requested by SDK
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Exception starting scanner: ${e.message}")
            call.reject("Scanner exception", e)
            activeCall = null
        }
    }

    @PluginMethod
    fun stopScan(call: PluginCall) {
       try {
           HardwareRegistry.topWiseManager?.cameraManager?.stopScan()
           activeCall = null
           call.resolve()
       } catch (e: Exception) {
           call.reject("Failed to stop TopWise scanner", e)
       }
    }


}
