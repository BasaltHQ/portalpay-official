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
import com.topwise.cloudpos.aidl.card.AidlCheckCardListener
import com.topwise.cloudpos.aidl.magcard.TrackData

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

        val checkCard = HardwareRegistry.topWiseManager?.checkCard

        if (checkCard == null) {
            call.reject("TopWise Card Readers not available")
            return
        }

        activeCall = call
        
        try {
            // Enable all 3 readers simultaneously: MAG, IC, RF
            checkCard.checkCard(true, true, true, 30000, object : AidlCheckCardListener.Stub() {
                
                override fun onFindMagCard(trackData: TrackData?) {
                    val res = JSObject()
                    res.put("type", "MAGSTRIPE")
                    res.put("track1", trackData?.track1)
                    res.put("track2", trackData?.track2)
                    res.put("track3", trackData?.track3)
                    activeCall?.resolve(res)
                    activeCall = null
                }

                override fun onSwipeCardFail() {
                    activeCall?.reject("Card swipe failed")
                    activeCall = null
                }

                override fun onFindICCard() {
                    val res = JSObject()
                    res.put("type", "IC")
                    activeCall?.resolve(res)
                    activeCall = null
                }

                override fun onFindRFCard() {
                    val res = JSObject()
                    res.put("type", "NFC")
                    activeCall?.resolve(res)
                    activeCall = null
                }

                override fun onTimeout() {
                    activeCall?.reject("Card detect timeout")
                    activeCall = null
                }

                override fun onCanceled() {
                    activeCall?.reject("Card detect cancelled")
                    activeCall = null
                }

                override fun onError(error: Int) {
                    activeCall?.reject("Card detect error: $error")
                    activeCall = null
                }
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
            HardwareRegistry.topWiseManager?.checkCard?.cancelCheckCard()
            activeCall?.reject("Cancelled by user")
            activeCall = null
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to stop check: ${e.message}")
        }
    }
}
}
