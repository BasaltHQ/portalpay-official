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
}
