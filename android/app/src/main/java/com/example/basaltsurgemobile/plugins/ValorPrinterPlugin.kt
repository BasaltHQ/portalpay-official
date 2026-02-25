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
import com.valor.valorsdk.Util.ValorPrint

@CapacitorPlugin(name = "ValorPrinter")
class ValorPrinterPlugin : Plugin() {

    companion object {
        const val TAG = "ValorPrinterPlugin"
    }

    private var printer: ValorPrint? = null

    override fun load() {
        super.load()
        try {
            printer = ValorPrint()
            Log.d(TAG, "Initialized Valor SDK Printer successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Valor SDK Printer: ${e.message}")
        }
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        val text = call.getString("text")
        if (text == null) {
            call.reject("Missing text")
            return
        }

        if (printer == null) {
            call.reject("Valor Printer API not initialized")
            return
        }

        try {
            printer?.initPrinter()
            
            val lines = text.split("\n")
            for (line in lines) {
                if (line.trim() == "") {
                    printer?.feedPaper(20)
                } else if (line.contains("RECEIPT") || line.contains("TOTAL") || line.contains("STATUS")) {
                    printer?.drawtext(line, 24, true, "CENTER")
                } else {
                    printer?.drawtext(line, 20, false, "LEFT")
                }
            }
            
            printer?.feedPaper(50)
            printer?.print()
            
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Print failed", e)
            call.reject("Print failed: ${e.message}")
        }
    }

    @PluginMethod
    fun printDocument(call: PluginCall) {
        // printDocument accepts both text and base64, but ValorPrint JS only historically used text.
        val text = call.getString("text")
        val base64Data = call.getString("base64")

        if (printer == null) {
            call.reject("Valor Printer API not initialized")
            return
        }

        try {
            printer?.initPrinter()
            
            if (!text.isNullOrEmpty()) {
                val lines = text.split("\n")
                for (line in lines) {
                    if (line.trim() == "") {
                        printer?.feedPaper(20)
                    } else if (line.contains("RECEIPT") || line.contains("TOTAL") || line.contains("STATUS") || line.contains("Tip:") || line.contains("Tax:") || line.contains("Total:")) {
                        // Small formatting heuristic
                        printer?.drawtext(line, 24, true, "CENTER")
                    } else {
                        printer?.drawtext(line, 20, false, "LEFT")
                    }
                }
            }
            
            // If the SDK supports setBitmap or something we could add it here, 
            // but the legacy bridge didn't support QR codes natively for Valor printing anyway.
            
            printer?.feedPaper(50)
            printer?.print()
            
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Document print failed", e)
            call.reject("Document print failed: ${e.message}")
        }
    }

    @PluginMethod
    fun printImage(call: PluginCall) {
        // The legacy app never used this method for Valor, but just in case:
        call.reject("Image printing is not actively supported for the VP550/VP800 via this bridge method. Use Secondary Display instead.")
    }
}
