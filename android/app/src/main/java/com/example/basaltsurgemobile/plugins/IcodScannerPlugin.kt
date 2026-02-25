package com.example.basaltsurgemobile.plugins

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "IcodScanner")
class IcodScannerPlugin : Plugin() {

    companion object {
        const val TAG = "IcodScannerPlugin"
    }

    override fun load() {
        super.load()
    }

    @PluginMethod
    fun startScan(call: PluginCall) {
        // ICOD kiosk scanner usually functions via a USB wedge keyboard fallback,
        // meaning the scanner simply acts as a keyboard and types out the scanned text.
        call.reject("Use keyboard wedge listener for ICOD hardware scanner")
    }

    @PluginMethod
    fun stopScan(call: PluginCall) {
        call.resolve()
    }
}
