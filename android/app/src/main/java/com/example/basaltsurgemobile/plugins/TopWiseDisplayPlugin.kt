package com.example.basaltsurgemobile.plugins

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import android.util.Log
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

@CapacitorPlugin(name = "TopWiseDisplay")
class TopWiseDisplayPlugin : Plugin() {

    companion object {
        const val TAG = "TopWiseDisplayPlugin"
        // T6D secondary screen dimensions
        const val SCREEN_WIDTH = 282
        const val SCREEN_HEIGHT = 240
    }

    /**
     * Generate a QR code bitmap at exact pixel dimensions using ZXing.
     * This produces a sharp QR with modules aligned to pixel boundaries —
     * no interpolation or stretching artifacts.
     */
    private fun generateQRBitmap(data: String, size: Int): Bitmap {
        val writer = QRCodeWriter()
        val hints = mapOf(
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 2  // Quiet zone in modules
        )
        val bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints)
        
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val darkBg = Color.rgb(24, 24, 27) // zinc-900 — matches the app dark theme
        for (x in 0 until size) {
            for (y in 0 until size) {
                bmp.setPixel(x, y, if (bitMatrix.get(x, y)) Color.WHITE else darkBg)
            }
        }
        return bmp
    }

    @PluginMethod
    fun displayQR(call: PluginCall) {

        val qrData = call.getString("data")
        val base64Img = call.getString("base64")

        // TopWise AIDL service binding is asynchronous — poll for it
        var screen = HardwareRegistry.topWiseManager?.smallScreenManager
        if (screen == null) {
            Log.w(TAG, "smallScreenManager is null, waiting for AIDL service binding...")
            for (attempt in 1..6) {
                Thread.sleep(500)
                screen = HardwareRegistry.topWiseManager?.smallScreenManager
                if (screen != null) {
                    Log.d(TAG, "AIDL small screen service bound after ${attempt * 500}ms")
                    break
                }
            }
        }
        if (screen == null) {
            Log.e(TAG, "AIDL small screen service did NOT bind within 3000ms")
            call.reject("TopWise Small Screen not available (AIDL binding timeout)")
            return
        }

        try {
            // Wake the screen hardware (powers on the LCD backlight and takes control from OS clock)
            screen.wakeSmallScreen()
            
            // Wait for the screen hardware to fully power on.
            // Logs proved bitmap was sent before screen was awake:
            // "serviceShowBitmapData, device is sleep, can't display anything!"
            // Brightness activation takes ~400ms per log timestamps, use 500ms for safety.
            Thread.sleep(500)
            
            // T6D Small Screen is 282x240 dots
            val bmp: Bitmap?
            
            if (qrData != null && base64Img == null) {
                // Native QR generation: Generate at exact screen height (240px) using ZXing.
                // This creates a sharp, pixel-perfect QR with modules aligned to pixel boundaries.
                // SCREEN_HEIGHT (240) is used for the QR size, leaving 21px margins on each side
                // when centered on the 282-wide screen.
                bmp = generateQRBitmap(qrData, SCREEN_HEIGHT)
                Log.d(TAG, "displayQR: Generated native ZXing QR ${bmp.width}x${bmp.height} for data length ${qrData.length}")
            } else if (base64Img != null) {
                // Legacy path: pre-rendered bitmap from JS canvas
                val decodedString = Base64.decode(base64Img.substringAfter(","), Base64.DEFAULT)
                var decoded = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
                bmp = Bitmap.createScaledBitmap(decoded, SCREEN_HEIGHT, SCREEN_HEIGHT, false)
                Log.d(TAG, "displayQR: Using pre-rendered bitmap ${bmp.width}x${bmp.height}")
            } else {
                call.reject("No QR data or bitmap provided")
                return
            }
            
            screen.displayBitmap(bmp, com.topwise.cloudpos.aidl.smallscreen.BitmapAlign.BITMAP_ALIGN_CENTER)
            
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            Log.e(TAG, "Failed setting secondary display", e)
            call.reject("Exception setting secondary display: ${e.message}")
        }
    }

    @PluginMethod
    fun clearDisplay(call: PluginCall) {
        try {
            // Return control to the OS to show the default clock
            HardwareRegistry.topWiseManager?.smallScreenManager?.stopAppControl()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed clearing secondary display", e)
        }
    }
}
