package com.example.basaltsurgemobile.plugins

import android.util.Log
import com.example.basaltsurgemobile.hardware.DeviceProfile
import com.example.basaltsurgemobile.hardware.DeviceType
import com.example.basaltsurgemobile.hardware.HardwareRegistry
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.topwise.cloudpos.aidl.pinpad.AidlPinpad
import com.topwise.cloudpos.aidl.pinpad.GetPinListener

@CapacitorPlugin(name = "PinPad")
class PinPadPlugin : Plugin() {

    companion object {
        const val TAG = "PinPadPlugin"
    }

    private var activeCall: PluginCall? = null

    @PluginMethod
    fun requestPin(call: PluginCall) {
        if (DeviceProfile.type != DeviceType.TOPWISE_T6D) {
            call.reject("PIN Pad not supported on this device.")
            return
        }

        val pinpad = HardwareRegistry.topWiseManager?.getPinpadManager(0)
        if (pinpad == null) {
            call.reject("TopWise PIN Pad not available")
            return
        }

        activeCall = call
        val amount = call.getString("amount") ?: "0.00"
        val pan = call.getString("pan") ?: ("0000000000000000")
        
        try {
            val bundle = android.os.Bundle()
            
            // 0: Master Key Index, 1: PIN Key Index 
            pinpad.getPin(bundle, object : GetPinListener.Stub() {
                override fun onInputKey(len: Int, keyMsg: String?) {
                    // Update UI with asterisk count
                    Log.d(TAG, "PIN input length: $len")
                    val res = JSObject()
                    res.put("event", "keyPress")
                    res.put("length", len)
                    notifyListeners("pinPadEvent", res)
                }

                override fun onConfirmInput(pinBlock: ByteArray?) {
                    val res = JSObject()
                    res.put("success", true)
                    res.put("pinBlock", bytesToHex(pinBlock))
                    activeCall?.resolve(res)
                    activeCall = null
                }

                override fun onCancelKeyPress() {
                    activeCall?.reject("PIN entry cancelled")
                    activeCall = null
                }

                override fun onTimeout() {
                    activeCall?.reject("PIN entry timed out")
                    activeCall = null
                }

                override fun onStopGetPin() {
                    activeCall?.reject("PIN entry stopped")
                    activeCall = null
                }

                override fun onError(errorCode: Int) {
                    activeCall?.reject("PIN Pad error: $errorCode")
                    activeCall = null
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Failed requesting PIN", e)
            activeCall?.reject("Exception requesting PIN: ${e.message}")
            activeCall = null
        }
    }
    
    @PluginMethod
    fun cancelPin(call: PluginCall) {
        if (DeviceProfile.type == DeviceType.TOPWISE_T6D) {
            try {
                HardwareRegistry.topWiseManager?.getPinpadManager(0)?.stopGetPin()
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to stop PIN Pad")
            }
        } else {
            call.resolve()
        }
    }

    private fun getPanBlock(pan: String): ByteArray {
        // Simple PAN block formatting for standard PIN block (ISO 9564-1 Format 0)
        // Take rightmost 12 digits excluding check digit
        val cleanPan = pan.replace(Regex("[^0-9]"), "")
        if (cleanPan.length < 13) return ByteArray(8)
        
        val panBlockStr = "0000" + cleanPan.substring(cleanPan.length - 13, cleanPan.length - 1)
        return hexToBytes(panBlockStr)
    }

    private fun bytesToHex(bytes: ByteArray?): String {
        if (bytes == null) return ""
        val hexChars = CharArray(bytes.size * 2)
        for (j in bytes.indices) {
            val v = bytes[j].toInt() and 0xFF
            hexChars[j * 2] = "0123456789ABCDEF"[v ushr 4]
            hexChars[j * 2 + 1] = "0123456789ABCDEF"[v and 0x0F]
        }
        return String(hexChars)
    }
    
    private fun hexToBytes(s: String): ByteArray {
        val len = s.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(s[i], 16) shl 4) + Character.digit(s[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }
}
