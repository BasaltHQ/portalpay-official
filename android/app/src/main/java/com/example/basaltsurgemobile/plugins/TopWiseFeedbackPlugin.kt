package com.example.basaltsurgemobile.plugins

import android.content.Context
import android.util.Log
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "TopWiseFeedback")
class TopWiseFeedbackPlugin : Plugin() {

    companion object {
        const val TAG = "TopWiseFeedbackPlugin"
    }

    @PluginMethod
    fun successFeedback(call: PluginCall) {
        val led = HardwareRegistry.topWiseManager?.led
        val buzzer = HardwareRegistry.topWiseManager?.buzzer
        
        try {
            // Turn on Green LED (1: Blue, 2: Yellow, 3: Green, 4: Red)
            led?.setLed(3, true)
            buzzer?.beep(1, 200)
            
            // Turn off after 1 second natively, or just leave it on for 1 long beep.
            Thread {
                Thread.sleep(1000)
                led?.setLed(3, false)
            }.start()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Topwise success feedback failed: ${e.message}")
        }
    }

    @PluginMethod
    fun errorFeedback(call: PluginCall) {
        val led = HardwareRegistry.topWiseManager?.led
        val buzzer = HardwareRegistry.topWiseManager?.buzzer
        
        try {
            // Turn on Red LED (4) and long beep 
            led?.setLed(4, true)
            buzzer?.beep(3, 150) // 3 quick beeps
            
            Thread {
                Thread.sleep(1000)
                led?.setLed(4, false)
            }.start()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Topwise error feedback failed: ${e.message}")
        }
    }
}
