package com.example.basaltsurgemobile.plugins

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.*
import android.os.Build
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "UsbPrinter")
class UsbPrinterPlugin : Plugin() {

    companion object {
        const val TAG = "UsbPrinterPlugin"
        const val ACTION_USB_PERMISSION = "com.example.basaltsurgemobile.USB_PERMISSION"
    }

    private var usbManager: UsbManager? = null
    private var printerConnection: UsbDeviceConnection? = null
    private var printerEndpoint: UsbEndpoint? = null
    private var printerInterface: UsbInterface? = null

    override fun load() {
        usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager?
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        val text = call.getString("text") ?: return call.reject("Missing text")
        printBytes(text.toByteArray(), call)
    }

    @PluginMethod
    fun printDocument(call: PluginCall) {
         val text = call.getString("text") ?: ""
         printBytes(text.toByteArray(), call)
    }

    private fun printBytes(bytes: ByteArray, call: PluginCall) {
        if (usbManager == null) {
            call.reject("USB Manager not available")
            return
        }

        if (!configurePrinter()) {
            call.reject("No USB printer found, or permission not granted. Please ensure printer is connected and permission dialogue accepted.")
            return
        }

        Thread {
            try {
                // Initialize printer ESC/POS
                val initBytes = byteArrayOf(0x1B, 0x40)
                printerConnection?.bulkTransfer(printerEndpoint, initBytes, initBytes.size, 3000)

                // Chunk transfer for long receipts to avoid buffer overflows (usually 4096 or 16384 bytes)
                val chunkSize = 4096
                var offset = 0
                while (offset < bytes.size) {
                    val length = Math.min(chunkSize, bytes.size - offset)
                    val chunk = bytes.copyOfRange(offset, offset + length)
                    val result = printerConnection?.bulkTransfer(printerEndpoint, chunk, chunk.size, 3000)
                    if (result != null && result < 0) {
                        Log.e(TAG, "Bulk transfer failed at offset $offset")
                        call.reject("USB bulk transfer failed")
                        return@Thread
                    }
                    offset += length
                }

                // Append feed blanks to clear cutter head before cutting
                val feedBytes = "\n\n\n\n\n".toByteArray()
                printerConnection?.bulkTransfer(printerEndpoint, feedBytes, feedBytes.size, 3000)

                // Append cut paper command
                val cutBytes = byteArrayOf(0x1D, 0x56, 0x41, 0x10)
                printerConnection?.bulkTransfer(printerEndpoint, cutBytes, cutBytes.size, 3000)

                val res = JSObject()
                res.put("success", true)
                call.resolve(res)

            } catch (e: Exception) {
                Log.e(TAG, "Print failed", e)
                call.reject("USB print failed: ${e.message}")
            }
        }.start()
    }

    private fun configurePrinter(): Boolean {
        // If already connected successfully previously, return true
        if (printerConnection != null && printerEndpoint != null) return true 

        val deviceList = usbManager?.deviceList ?: return false
        
        // Find generic ESC/POS printer (class 7 or vendor specific 255)
        for (device in deviceList.values) {
            val interfaceCount = device.interfaceCount
            for (i in 0 until interfaceCount) {
                val usbInterface = device.getInterface(i)
                if (usbInterface.interfaceClass == UsbConstants.USB_CLASS_PRINTER || usbInterface.interfaceClass == 255) {
                    Log.d(TAG, "Found candidate USB Printer: ${device.productName} (VID:${device.vendorId} PID:${device.productId})")
                    
                    if (usbManager?.hasPermission(device) == true) {
                        return connectDevice(device, usbInterface)
                    } else {
                        Log.d(TAG, "No permission for USB printer. Requesting now via system dialog popup...")
                        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                        } else {
                            PendingIntent.FLAG_UPDATE_CURRENT
                        }
                        
                        val mPermissionIntent = PendingIntent.getBroadcast(
                            context, 0, Intent(ACTION_USB_PERMISSION), flags
                        )
                        usbManager?.requestPermission(device, mPermissionIntent)
                        return false // Abort print until user accepts the dialogue for the next try
                    }
                }
            }
        }
        Log.d(TAG, "No valid USB_CLASS_PRINTER detected on the bus.")
        return false
    }

    private fun connectDevice(device: UsbDevice, usbInterface: UsbInterface): Boolean {
        // Look for OUT endpoint
        for (i in 0 until usbInterface.endpointCount) {
            val ep = usbInterface.getEndpoint(i)
            if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.direction == UsbConstants.USB_DIR_OUT) {
                val connection = usbManager?.openDevice(device)
                if (connection != null) {
                    // Try to claim interface
                    if (connection.claimInterface(usbInterface, true)) {
                        printerInterface = usbInterface
                        printerEndpoint = ep
                        printerConnection = connection
                        Log.d(TAG, "Successfully claimed generic USB printer!")
                        return true
                    } else {
                        Log.e(TAG, "Failed to claim USB interface")
                        connection.close()
                    }
                }
            }
        }
        return false
    }
}
