package com.example.basaltsurgemobile.plugins

import android.content.Context
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.szsicod.print.escpos.BellPrinterAPI

@CapacitorPlugin(name = "IcodFeedback")
class IcodFeedbackPlugin : Plugin() {

    companion object {
        const val TAG = "IcodFeedbackPlugin"
    }

    @PluginMethod
    fun successFeedback(call: PluginCall) {
        try {
            // KDS uses BellPrinterAPI for buzzing order alerts
            val bell = BellPrinterAPI.getInstance(context)
            bell.init()
            Thread {
                // Quick buzz
                bell.sendOrder(byteArrayOf(0x1B, 0x42, 0x02, 0x01))
                Thread.sleep(500)
            }.start()
            call.resolve()
        } catch (e: Exception) {
            call.reject("KDS buzz failed: ${e.message}")
        }
    }

    @PluginMethod
    fun errorFeedback(call: PluginCall) {
        try {
            val bell = BellPrinterAPI.getInstance(context)
            bell.init()
            Thread {
                // Longer buzz
                bell.sendOrder(byteArrayOf(0x1B, 0x42, 0x04, 0x01))
                Thread.sleep(1500)
            }.start()
            call.resolve()
        } catch (e: Exception) {
            call.reject("KDS error buzz failed: ${e.message}")
        }
    }
}
