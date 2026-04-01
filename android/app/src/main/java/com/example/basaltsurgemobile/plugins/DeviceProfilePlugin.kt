package com.example.basaltsurgemobile.plugins

import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DeviceProfile")
class DeviceProfilePlugin : Plugin() {

    @PluginMethod
    fun getProfile(call: PluginCall) {
        val result = JSObject()
        result.put("type", DeviceProfile.type.name)
        result.put("hasSecondaryDisplay", DeviceProfile.hasSecondaryDisplay)
        result.put("hasBuiltInPrinter", DeviceProfile.hasBuiltInPrinter)
        result.put("hasAutoCutter", DeviceProfile.hasAutoCutter)
        result.put("hasPINPad", DeviceProfile.hasPINPad)
        result.put("hasCardReader", DeviceProfile.hasCardReader)
        result.put("hardwareScannerType", DeviceProfile.hardwareScannerType)
        
        call.resolve(result)
    }

    @PluginMethod
    fun setSystemRotation(call: PluginCall) {
        val rotation = call.getInt("rotation") ?: 0
        val context = bridge.context
        
        // 1. Try to modify settings via shell (su)
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "settings put system accelerometer_rotation 0 && settings put system user_rotation $rotation"))
            process.waitFor()
            android.util.Log.d("DeviceProfilePlugin", "Successfully executed root orientation command: $rotation")
        } catch (e: Exception) {
            android.util.Log.w("DeviceProfilePlugin", "Root command failed, attempting fallback.", e)
            try {
                android.provider.Settings.System.putInt(
                    context.contentResolver,
                    android.provider.Settings.System.ACCELEROMETER_ROTATION,
                    0
                )
                android.provider.Settings.System.putInt(
                    context.contentResolver,
                    android.provider.Settings.System.USER_ROTATION,
                    rotation
                )
            } catch (secEx: SecurityException) {
                android.util.Log.e("DeviceProfilePlugin", "Lacking WRITE_SETTINGS permission to fallback.")
                call.reject("Permission denied to write system settings.")
                return
            }
        }
        
        // 2. Reboot device via Device Owner privileges
        try {
            val dpm = context.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val componentName = android.content.ComponentName(context, com.example.basaltsurgemobile.AppDeviceAdminReceiver::class.java)
            
            if (dpm.isDeviceOwnerApp(context.packageName)) {
                android.util.Log.d("DeviceProfilePlugin", "Rebooting via DPM...")
                dpm.reboot(componentName)
                call.resolve()
            } else {
                android.util.Log.d("DeviceProfilePlugin", "Not Device Owner. Attempting root reboot fallback...")
                Runtime.getRuntime().exec(arrayOf("su", "-c", "reboot"))
                call.resolve()
            }
        } catch (e: Exception) {
            android.util.Log.e("DeviceProfilePlugin", "Failed to reboot device", e)
            call.reject("Failed to reboot device: " + e.localizedMessage)
        }
    }
}
