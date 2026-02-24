package com.example.basaltsurgemobile.plugins

import android.util.Log
import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.example.basaltsurgemobile.hardware.DeviceType
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.valor.valorsdk.BasePresentation

@CapacitorPlugin(name = "ValorDisplay")
class ValorDisplayPlugin : Plugin() {

    companion object {
        const val TAG = "ValorDisplayPlugin"
    }

    @PluginMethod
    fun displayQR(call: PluginCall) {
        if (DeviceProfile.type != DeviceType.VALOR_VP800) {
            call.reject("Valor display not supported on this device.")
            return
        }

        val qrData = call.getString("data")
        val base64Img = call.getString("base64")

        try {
            // Future implementation:
            // Custom BasePresentation subclass to draw the QR code on the VP800 customer screen.
            // For now, we stub the successful bridge execution so the frontend is fully wired.
            Log.d(TAG, "Valor VP800 displayQR invoked. Custom BasePresentation required for drawing.")
            
            val res = JSObject()
            res.put("success", true)
            res.put("message", "Triggered VP800 display (rendering requires custom BasePresentation layout)")
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Failed setting Valor secondary display", e)
            call.reject("Exception setting Valor display: ${e.message}")
        }
    }

    @PluginMethod
    fun clearDisplay(call: PluginCall) {
        if (DeviceProfile.type == DeviceType.VALOR_VP800) {
            try {
                // The Valor SDK provides a public static method to clear all active customer screen presentations
                BasePresentation.removeAllPresentations(context)
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed clearing Valor secondary display: ${e.message}")
            }
        } else {
            call.resolve()
        }
    }
}
