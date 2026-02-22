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
import com.topwise.cloudpos.aidl.camera.AidlCameraScanCode

@CapacitorPlugin(name = "HardwareScanner")
class ScannerPlugin : Plugin() {

    companion object {
        const val TAG = "ScannerPlugin"
    }

    private var activeCall: PluginCall? = null

    override fun load() {
        super.load()
    }

    @PluginMethod
    fun startScan(call: PluginCall) {
        this.activeCall = call

        when (DeviceProfile.type) {
            DeviceType.TOPWISE_T6D -> startTopWiseScan()
            DeviceType.KIOSK_H2150B -> {
                // ICOD kiosk scanner usually functions via a USB wedge keyboard fallback,
                // meaning the scanner simply acts as a keyboard and types out the scanned text.
                call.reject("Use keyboard wedge listener for ICOD hardware scanner")
            }
            else -> {
                call.reject("Hardware scanner not supported on this device.")
            }
        }
    }

    @PluginMethod
    fun stopScan(call: PluginCall) {
        when (DeviceProfile.type) {
            DeviceType.TOPWISE_T6D -> {
               try {
                   HardwareRegistry.topWiseManager?.cameraManager?.stopScan()
                   activeCall = null
                   call.resolve()
               } catch (e: Exception) {
                   call.reject("Failed to stop TopWise scanner", e)
               }
            }
            else -> call.resolve()
        }
    }

    private fun startTopWiseScan() {
        val camera = HardwareRegistry.topWiseManager?.cameraManager
        if (camera == null) {
            activeCall?.reject("TopWise camera scanner not available")
            return
        }

        try {
            val bundle = android.os.Bundle()
            // Using back camera by default (0: front, 1: back, 2: top depending on model)
            bundle.putInt("cameraId", 1) 
            
            camera.scanCode(bundle, object : com.topwise.cloudpos.aidl.camera.AidlCameraScanCodeListener.Stub() {
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
            Log.e(TAG, "Failed to start TopWise scanner", e)
            activeCall?.reject("Exception starting scanner: ${e.message}")
        }
    }


}
