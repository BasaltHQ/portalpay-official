package com.example.basaltsurgemobile.plugins

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.example.basaltsurgemobile.hardware.DeviceType
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "TopWiseDisplay")
class TopWiseDisplayPlugin : Plugin() {

    companion object {
        const val TAG = "TopWiseDisplayPlugin"
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
            // Step 1: Take control from the OS clock so it doesn't reclaim the screen
            screen.startAppControl()
            
            // Step 2: Wake the screen hardware (powers on the LCD backlight)
            screen.wakeSmallScreen()
            
            // Step 3: Wait for the screen hardware to fully power on.
            // Logs showed bitmap sent before screen was awake at 13:04:50:
            // "serviceShowBitmapData, device is sleep, can't display anything!"
            Thread.sleep(300)
            
            // T6D Small Screen is 282x240 dots
            if (base64Img != null) {
                val decodedString = Base64.decode(base64Img.substringAfter(","), Base64.DEFAULT)
                var bmp = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
                
                // Scale QR to fit within the 240px height with 20px margin on each side = 200px
                // 200px on a 282-wide display leaves 41px margin on each side, plenty for scanning
                bmp = Bitmap.createScaledBitmap(bmp, 200, 200, false)
                
                Log.d(TAG, "displayQR: Sending bitmap ${bmp.width}x${bmp.height} to secondary screen")
                screen.displayBitmap(bmp, com.topwise.cloudpos.aidl.smallscreen.BitmapAlign.BITMAP_ALIGN_CENTER)
            } else if (qrData != null) {
                screen.displayText("", com.topwise.cloudpos.aidl.smallscreen.SmallScreenTextSize.TEXT_SIZE_NORMAL, com.topwise.cloudpos.aidl.smallscreen.SmallScreenDisplayMode.TEXT_DISPLAY_MODE_UP_NORMAL)
            }
            
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
