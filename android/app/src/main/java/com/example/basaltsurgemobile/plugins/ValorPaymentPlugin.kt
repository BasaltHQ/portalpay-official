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
import com.valor.valorsdk.Listener.OnResult
import com.valor.valorsdk.ValorSDK

@CapacitorPlugin(name = "ValorPayment")
class ValorPaymentPlugin : Plugin() {

    companion object {
        const val TAG = "ValorPaymentPlugin"
    }

    private val isValorDevice: Boolean
        get() = DeviceProfile.type == DeviceType.VALOR_VP550 || DeviceProfile.type == DeviceType.VALOR_VP800

    @PluginMethod
    fun performTransaction(call: PluginCall) {
        if (!isValorDevice) {
            call.reject("Not a Valor device")
            return
        }

        val amount = call.getString("amount") ?: "0.00"
        val manager = HardwareRegistry.valorSDKManager

        if (manager == null) {
            call.reject("ValorSDKManager is not initialized")
            return
        }

        try {
            // Provide context, 0 for first arg (often meaning standard/default payment mode index in Valor SDKs), and listener
            manager.Payment_SDK_Init(context, 0, object : OnResult {
                override fun Success() {
                    Log.d(TAG, "Payment_SDK_Init Success, ready for Card Present API or Transaction")
                    call.resolve(JSObject().put("success", true).put("message", "Payment SDK initialized"))
                }

                override fun Onprocess(progress: String?) {
                    Log.d(TAG, "Payment_SDK_Init Process: $progress")
                }

                override fun Fail(error: String?) {
                    call.reject("Payment_SDK_Init Failed: $error")
                }
            })
        } catch (e: Exception) {
            call.reject("Exception invoking Valor SDK: ${e.message}", e)
        }
    }
}
