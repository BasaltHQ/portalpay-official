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
import com.topwise.cloudpos.aidl.emv.level2.AidlAmex
import com.topwise.cloudpos.aidl.emv.level2.AidlPaypass
import com.topwise.cloudpos.aidl.emv.level2.AidlPaywave
import com.topwise.cloudpos.aidl.emv.level2.EmvTerminalInfo
import com.topwise.cloudpos.aidl.emv.level2.AidlEmvL2
import com.topwise.cloudpos.aidl.emv.level2.EmvL2Listener

@CapacitorPlugin(name = "CardReader")
class CardReaderPlugin : Plugin() {

    companion object {
        const val TAG = "CardReaderPlugin"
    }

    private var activeCall: PluginCall? = null

    @PluginMethod
    fun startCardDetection(call: PluginCall) {
        if (DeviceProfile.type != DeviceType.TOPWISE_T6D) {
            call.reject("Card reader not supported on this device.")
            return
        }

        val emv = HardwareRegistry.topWiseManager?.emvL2
        val ic = HardwareRegistry.topWiseManager?.icCard
        val rf = HardwareRegistry.topWiseManager?.rfCard
        val mag = HardwareRegistry.topWiseManager?.magCard

        if (emv == null || ic == null || rf == null || mag == null) {
            call.reject("TopWise Card Readers not available")
            return
        }

        activeCall = call
        
        try {
            // Enable all 3 readers simultaneously
            // 1: MAG, 2: IC, 4: RF.  1 | 2 | 4 = 7
            emv.checkCard(true, true, true, 30, object : EmvL2Listener.Stub() {
                
                override fun onFindCard(cardType: Int, track2: String?, pan: String?, expireDate: String?) {
                    val res = JSObject()
                    res.put("type", when (cardType) {
                        1 -> "MAGSTRIPE"
                        2 -> "IC"
                        4 -> "NFC"
                        else -> "UNKNOWN"
                    })
                    res.put("pan", pan)
                    res.put("expireDate", expireDate)
                    res.put("track2", track2)
                    
                    activeCall?.resolve(res)
                    activeCall = null
                }

                override fun onError(error: Int, message: String?) {
                    activeCall?.reject("Card detect error $error: $message")
                    activeCall = null
                }

                override fun onTimeout() {
                    activeCall?.reject("Card detect timeout")
                    activeCall = null
                }
                
                // EmvL2 requires implementing many empty callbacks for standard EMV flow
                // We just need basic card detection for this phase
                override fun onRequestAmount() {}
                override fun onRequestPin(isOnline: Boolean, retryCount: Int) {}
                override fun onRequestSelectApplication(apps: List<String>?) {}
                override fun onRequestFinalConfirm() {}
                override fun onRequestOnlineProcess(tlv: String?) {}
                override fun onVerifyOfflinePinResult(isVerifyPass: Boolean, retryCount: Int) {}
                override fun onTransactionResult(result: Int, tlv: String?) {}
            })
        } catch (e: Exception) {
            Log.e(TAG, "Failed card detect", e)
            activeCall?.reject("Exception in card detect: ${e.message}")
            activeCall = null
        }
    }

    @PluginMethod
    fun stopCardDetection(call: PluginCall) {
        if (DeviceProfile.type != DeviceType.TOPWISE_T6D) {
            call.resolve()
            return
        }
        
        try {
            HardwareRegistry.topWiseManager?.emvL2?.stopCheckCard()
            activeCall?.reject("Cancelled by user")
            activeCall = null
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to stop check: ${e.message}")
        }
    }
}
