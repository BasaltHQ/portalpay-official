package com.example.basaltsurgemobile.plugins

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

// ICOD SDK namespace
import com.szsicod.print.escpos.PrinterAPI

@CapacitorPlugin(name = "KioskPrinter")
class KioskPrinterPlugin : Plugin() {

    companion object {
        const val TAG = "KioskPrinterPlugin"
    }

    private var api: PrinterAPI? = null

    override fun load() {
        super.load()
        try {
            api = PrinterAPI.getInstance()
            val ret = api?.init()
            Log.d(TAG, "ICOD Printer Init: $ret")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize ICOD PrinterAPI: ${e.message}")
        }
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        val text = call.getString("text")
        if (text == null) {
            call.reject("Missing text")
            return
        }

        if (api == null) {
            call.reject("ICOD PrinterAPI not initialized")
            return
        }

        try {
            api?.printString(text)
            // ESC/POS command to cut paper
            api?.cutPaper() 
            
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Print failed", e)
            call.reject("Print failed: ${e.message}")
        }
    }

    @PluginMethod
    fun printImage(call: PluginCall) {
        val base64Data = call.getString("base64")
        if (base64Data == null) {
            call.reject("Missing image base64 data")
            return
        }

        if (api == null) {
            call.reject("ICOD PrinterAPI not initialized")
            return
        }

        try {
            val decodedString = Base64.decode(base64Data.substringAfter(","), Base64.DEFAULT)
            val bmp = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)

            api?.printTwoImage(bmp)
            api?.cutPaper()
            
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Image print failed", e)
            call.reject("Image print failed: ${e.message}")
        }
    }
}
