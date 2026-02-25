package com.example.basaltsurgemobile.plugins

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "GenericFeedback")
class GenericFeedbackPlugin : Plugin() {

    companion object {
        const val TAG = "GenericFeedbackPlugin"
    }

    @PluginMethod
    fun successFeedback(call: PluginCall) {
        // Generic phone/tablet haptic feedback
        val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        if (vibrator.hasVibrator()) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(150)
            }
        }
        call.resolve()
    }

    @PluginMethod
    fun errorFeedback(call: PluginCall) {
        val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        if (vibrator.hasVibrator()) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 100, 50, 100, 50, 100), -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(longArrayOf(0, 100, 50, 100, 50, 100), -1)
            }
        }
        call.resolve()
    }
}
