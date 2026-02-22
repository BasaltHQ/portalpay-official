package com.example.basaltsurgemobile.plugins

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.topwise.cloudpos.aidl.printer.AidlPrinter
import com.topwise.cloudpos.aidl.printer.AidlPrinterListener
import com.topwise.cloudpos.aidl.printer.PrintTemplate

@CapacitorPlugin(name = "TopWisePrinter")
class TopWisePrinterPlugin : Plugin() {

    companion object {
        const val TAG = "TopWisePrinterPlugin"
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        val text = call.getString("text")
        if (text == null) {
            call.reject("Missing text")
            return
        }

        val printer = getPrinter()
        if (printer == null) {
            call.reject("TopWise Printer not available")
            return
        }

        try {
            printer.addText(0, 0, 0, text)
            
            printer.start(object : AidlPrinterListener.Stub() {
                override fun onError(error: Int) {
                    call.reject("Print error: $error")
                }
                override fun onPrintFinish() {
                    val res = JSObject()
                    res.put("success", true)
                    call.resolve(res)
                }
            })
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

        val printer = getPrinter()
        if (printer == null) {
            call.reject("TopWise Printer not available")
            return
        }

        try {
            val decodedString = Base64.decode(base64Data.substringAfter(","), Base64.DEFAULT)
            var bmp = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
            
            // T6D uses 384px width for 58mm paper
            bmp = resizeBitmap(bmp, 384)
            printer.addImage(0, bmp)
            
            printer.start(object : AidlPrinterListener.Stub() {
                override fun onError(error: Int) {
                    call.reject("Image print error: $error")
                }
                override fun onPrintFinish() {
                    val res = JSObject()
                    res.put("success", true)
                    call.resolve(res)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Image print failed", e)
            call.reject("Image print failed: ${e.message}")
        }
    }

    private fun getPrinter(): AidlPrinter? {
        val manager = HardwareRegistry.topWiseManager
        return manager?.printer
    }
    
    private fun resizeBitmap(bitmap: Bitmap, targetWidth: Int): Bitmap {
        val aspectRatio = bitmap.height.toDouble() / bitmap.width.toDouble()
        val targetHeight = (targetWidth * aspectRatio).toInt()
        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, false)
    }
}
