package com.example.basaltsurgemobile

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/**
 * DeviceAdminReceiver - Required for Device Owner mode lockdown.
 * 
 * This receiver is needed to enable:
 * - Lock Task Mode whitelisting
 * - Disabling keyguard
 * - Restricting user actions
 * 
 * To enable Device Owner mode, the device must be factory reset and
 * provisioned via QR code with this component set as device owner.
 */
class AppDeviceAdminReceiver : DeviceAdminReceiver() {
    
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        // Device admin enabled
    }
    
    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        // Device admin disabled
    }
    
    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        // Entered Lock Task Mode
    }
    
    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        // Exited Lock Task Mode
    }
}
