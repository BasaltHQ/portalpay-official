package com.example.basaltsurgemobile.plugins

import android.os.VibrationEffect
import android.os.Vibrator
import android.content.Context
import android.util.Log
import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.example.basaltsurgemobile.hardware.DeviceType
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.szsicod.print.escpos.BellPrinterAPI

@CapacitorPlugin(name = "DeviceFeedback")
class DeviceFeedbackPlugin : Plugin() {

    companion object {
        const val TAG = "DeviceFeedbackPlugin"
    }

    @PluginMethod
    fun successFeedback(call: PluginCall) {
        when (DeviceProfile.type) {
            DeviceType.TOPWISE_T6D -> {
                val led = HardwareRegistry.topWiseManager?.led
                val buzzer = HardwareRegistry.topWiseManager?.buzzer
                
                try {
                    // Turn on Green LED (1: Blue, 2: Yellow, 3: Green, 4: Red)
                    led?.turnOn(3)
                    buzzer?.beep(1, 200)
                    
                    // Turn off after 1 second natively, or just leave it on for 1 long beep.
                    Thread {
                        Thread.sleep(1000)
                        led?.turnOff(3)
                    }.start()
                    call.resolve()
                } catch (e: Exception) {
                    call.reject("Topwise success feedback failed: ${e.message}")
                }
            }
            DeviceType.KDS_21_5 -> {
                try {
                    // KDS uses BellPrinterAPI for buzzing order alerts
                    val bell = BellPrinterAPI.getInstance()
                    bell.init()
                    bell.open()
                    Thread {
                        // Quick buzz
                        Thread.sleep(500)
                        bell.close()
                    }.start()
                    call.resolve()
                } catch (e: Exception) {
                    call.reject("KDS buzz failed: ${e.message}")
                }
            }
            else -> {
                // Generic phone/tablet haptic feedback
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (vibrator.hasVibrator()) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        vibrator.vibrate(150)
                    }
                }
                call.resolve()
            }
        }
    }

    @PluginMethod
    fun errorFeedback(call: PluginCall) {
        when (DeviceProfile.type) {
            DeviceType.TOPWISE_T6D -> {
                val led = HardwareRegistry.topWiseManager?.led
                val buzzer = HardwareRegistry.topWiseManager?.buzzer
                
                try {
                    // Turn on Red LED (4) and long beep 
                    led?.turnOn(4)
                    buzzer?.beep(3, 150) // 3 quick beeps
                    
                    Thread {
                        Thread.sleep(1000)
                        led?.turnOff(4)
                    }.start()
                    call.resolve()
                } catch (e: Exception) {
                    call.reject("Topwise error feedback failed: ${e.message}")
                }
            }
            DeviceType.KDS_21_5 -> {
                try {
                    val bell = BellPrinterAPI.getInstance()
                    bell.init()
                    bell.open()
                    Thread {
                        // Longer buzz
                        Thread.sleep(1500)
                        bell.close()
                    }.start()
                    call.resolve()
                } catch (e: Exception) {
                    call.reject("KDS error buzz failed: ${e.message}")
                }
            }
            else -> {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (vibrator.hasVibrator()) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 100, 50, 100, 50, 100), -1))
                    } else {
                        vibrator.vibrate(longArrayOf(0, 100, 50, 100, 50, 100), -1)
                    }
                }
                call.resolve()
            }
        }
    }
}
