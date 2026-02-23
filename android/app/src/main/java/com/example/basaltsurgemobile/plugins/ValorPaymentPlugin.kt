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
import com.valor.valorsdk.Listener.OnPerformTxnListener
import com.valor.valorsdk.Listener.OnAdditionlListener
import com.valor.valorsdk.Vo.TranInputVo
import com.valor.valorsdk.Vo.TranOutputVo
import com.valor.valorsdk.ValorSDK

@CapacitorPlugin(name = "ValorPayment")
class ValorPaymentPlugin : Plugin() {

    companion object {
        const val TAG = "ValorPaymentPlugin"
    }

    private val isValorDevice: Boolean
        get() = DeviceProfile.type == DeviceType.VALOR_VP550 || DeviceProfile.type == DeviceType.VALOR_VP800

    @PluginMethod
    fun initializePayment(call: PluginCall) {
        if (!isValorDevice) {
            call.reject("Not a Valor device")
            return
        }

        val manager = HardwareRegistry.valorSDKManager ?: run {
            call.reject("ValorSDKManager is not initialized")
            return
        }

        try {
            manager.Payment_SDK_Init(context, 0, object : OnResult {
                override fun Success() {
                    Log.d(TAG, "Payment_SDK_Init Success")
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
            call.reject("Exception invoking Valor SDK Payment Init: ${e.message}", e)
        }
    }

    @PluginMethod
    fun performTransaction(call: PluginCall) {
        if (!isValorDevice) {
            call.reject("Not a Valor device")
            return
        }

        val amountStr = call.getString("amount", "0.00") ?: "0.00"
        val cleanAmount = amountStr.replace(".", "").replace(",", "")
        val amountInt = cleanAmount.toIntOrNull() ?: 0

        val manager = HardwareRegistry.valorSDKManager ?: run {
            call.reject("ValorSDKManager is not initialized")
            return
        }

        try {
            val inputVo = TranInputVo()
            inputVo.amount = amountInt
            inputVo.tranMode = 0 // Assuming 0 is default sale mode

            manager.PerformTxn(context, inputVo, object : OnPerformTxnListener {
                override fun onSuccess(result: Any?) {
                    Log.d(TAG, "Transaction Success: $result")
                    val jsResult = JSObject()
                    jsResult.put("success", true)
                    
                    if (result is TranOutputVo) {
                        try {
                            jsResult.put("authCode", result.authcode)
                            jsResult.put("responseCode", result.responseCode)
                            jsResult.put("rrn", result.RRN)
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed capturing output VO properties")
                        }
                    }
                    
                    call.resolve(jsResult)
                }

                override fun onProgress(progressMessage: String?) {
                    val data = JSObject()
                    data.put("message", progressMessage ?: "Processing...")
                    notifyListeners("valorPaymentProgress", data)
                }

                override fun onFailure(errorMessage: String?, outputVo: Any?, status: Int) {
                    call.reject("Transaction failed: $errorMessage")
                }
            }, object : OnAdditionlListener {
                override fun onStanNo(stanNum: Int?) {
                    Log.d(TAG, "STAN received: $stanNum")
                }
            })

        } catch (e: Exception) {
            call.reject("Exception invoking PerformTxn: ${e.message}", e)
        }
    }
}
