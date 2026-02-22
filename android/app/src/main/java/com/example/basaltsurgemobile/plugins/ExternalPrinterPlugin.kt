package com.example.basaltsurgemobile.plugins

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.OutputStream
import java.net.Socket

@CapacitorPlugin(name = "ExternalPrinter")
class ExternalPrinterPlugin : Plugin() {
    companion object {
        const val TAG = "ExternalPrinterPlugin"
    }

    @PluginMethod
    fun printReceipt(call: PluginCall) {
        val ipAddress = call.getString("ipAddress")
        val port = call.getInt("port", 9100)
        val text = call.getString("text")

        if (ipAddress == null || text == null) {
            call.reject("Missing ipAddress or text")
            return
        }

        Thread {
            try {
                Log.d(TAG, "Connecting to external printer at $ipAddress:$port")
                val socket = Socket(ipAddress, port)
                val out: OutputStream = socket.getOutputStream()

                // Basic ESC/POS Initialization
                out.write(byteArrayOf(0x1B, 0x40)) 
                
                // Print text
                out.write(text.toByteArray())
                
                // Cut paper
                out.write(byteArrayOf(0x1D, 0x56, 0x41, 0x10))
                
                out.flush()
                socket.close()

                val result = JSObject()
                result.put("success", true)
                call.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "External printing failed: ${e.message}", e)
                call.reject("Failed to print: ${e.message}", e)
            }
        }.start()
    }
}
