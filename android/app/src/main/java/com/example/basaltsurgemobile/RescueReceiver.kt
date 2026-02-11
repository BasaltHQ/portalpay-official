package com.example.basaltsurgemobile

import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

/**
 * RescueReceiver - Handles emergency commands via ADB to recover devices
 * that are stuck in Device Owner mode or detached from the API.
 * 
 * Command:
 * adb shell am broadcast -a com.example.basaltsurgemobile.RESCUE_REMOVE_OWNER
 */
class RescueReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "RescueReceiver"
        const val ACTION_REMOVE_OWNER = "com.example.basaltsurgemobile.RESCUE_REMOVE_OWNER"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_REMOVE_OWNER) {
            Log.w(TAG, "Received RESCUE_REMOVE_OWNER command")
            
            try {
                val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                val packageName = context.packageName
                
                if (dpm.isDeviceOwnerApp(packageName)) {
                    Log.i(TAG, "Removing Device Owner status...")
                    Toast.makeText(context, "RESCUE: Removing Device Owner...", Toast.LENGTH_LONG).show()
                    
                    dpm.clearDeviceOwnerApp(packageName)
                    
                    Log.i(TAG, "Device Owner removed successfully")
                    Toast.makeText(context, "RESCUE: Success! Device Owner removed.", Toast.LENGTH_LONG).show()
                } else {
                    Log.i(TAG, "App is not Device Owner, nothing tcdo")
                    Toast.makeText(context, "RESCUE: App is not Device Owner", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to remove Device Owner: ${e.message}", e)
                Toast.makeText(context, "RESCUE FAILED: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
