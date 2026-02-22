package com.example.basaltsurgemobile

import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.example.basaltsurgemobile.ui.theme.BasaltSurgeMobileTheme
import com.getcapacitor.BridgeActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * Kiosk lockdown configuration received from the web app
 */
data class LockdownConfig(
    val lockdownMode: String = "none", // "none", "standard", "device_owner"
    val unlockCodeHash: String? = null
)

class MainActivity : BridgeActivity() {
    private var lockdownConfig = mutableStateOf(LockdownConfig())
    private var showUnlockOverlay = mutableStateOf(false)
    private var showUpdateDialog = mutableStateOf(false)
    private var updateInfo = mutableStateOf<OtaUpdateManager.UpdateInfo?>(null)
    private lateinit var otaUpdateManager: OtaUpdateManager

    companion object {
        private const val TAG = "MainActivity"
        private const val UNLOCK_SALT = "touchpoint_unlock_v1:"
        private const val CONFIG_POLL_INTERVAL_MS = 60_000L  // 60 seconds
        private const val PREFS_NAME = "touchpoint_prefs"
        private const val PREF_INSTALLATION_ID = "installation_id"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Hardware Abstraction Layer
        com.example.basaltsurgemobile.hardware.HardwareRegistry.initialize(this)
        
        // Initialize OTA Update Manager
        otaUpdateManager = OtaUpdateManager(this)
        
        // Register Custom Native Capacitor Plugins for Hardware Abstraction
        registerPlugin(com.example.basaltsurgemobile.plugins.DeviceProfilePlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.ExternalPrinterPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.TopWisePrinterPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.KioskPrinterPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.ScannerPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.DeviceFeedbackPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.CardReaderPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.PinPadPlugin::class.java)
        registerPlugin(com.example.basaltsurgemobile.plugins.SecondaryDisplayPlugin::class.java)
        
        // Check for overlay permission (required for auto-boot on Android 10+)
        checkOverlayPermission()
        checkInstallPermission()
        
        // Setup back button handler for lockdown mode
        setupBackPressedHandler()
        
        // Setup Compose Overlays on top of Capacitor's WebView
        val composeView = ComposeView(this).apply {
            setContent {
                BasaltSurgeMobileTheme {
                    Box(modifier = Modifier.fillMaxSize()) {
                        // Unlock overlay shown when user tries to exit in lockdown mode
                        if (showUnlockOverlay.value) {
                            UnlockOverlay(
                                onDismiss = { showUnlockOverlay.value = false },
                                onUnlock = { code ->
                                    if (validateUnlockCode(code)) {
                                        showUnlockOverlay.value = false
                                        exitLockdownTemporarily()
                                    } else {
                                        val config = lockdownConfig.value
                                        val msg = when {
                                            config.unlockCodeHash == null -> "Config not loaded (Hash is null)"
                                            else -> "Invalid code (Hash mismatch)"
                                        }
                                        Toast.makeText(this@MainActivity, msg, Toast.LENGTH_LONG).show()
                                    }
                                }
                            )
                        }
                        
                        // Update available dialog
                        if (showUpdateDialog.value && updateInfo.value != null) {
                            UpdateAvailableDialog(
                                info = updateInfo.value!!,
                                onDismiss = { showUpdateDialog.value = false },
                                onUpdate = {
                                    updateInfo.value?.downloadUrl?.let { url ->
                                        otaUpdateManager.downloadAndInstall(
                                            downloadUrl = url,
                                            onComplete = {
                                                // Exit lockdown so the system installer can show
                                                try {
                                                    val mode = lockdownConfig.value.lockdownMode
                                                    if (mode == "standard") {
                                                        stopLockTask()
                                                        Log.d(TAG, "Exited lock task mode for update installation")
                                                    }
                                                } catch (e: Exception) {
                                                    Log.e(TAG, "Failed to stop lock task", e)
                                                }
                                            }
                                        )
                                        Toast.makeText(this@MainActivity, "Downloading update...", Toast.LENGTH_LONG).show()
                                    }
                                    showUpdateDialog.value = false
                                }
                            )
                        }
                    }
                }
            }
        }
        
        // Add ComposeView to the root layout so it overlays the WebView
        addContentView(composeView, ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
        
        startUpdatePolling()
        startConfigPolling()
    }

    override fun onStart() {
        super.onStart()
        // Load the live environment dynamically 
        // We do this in onStart so the Bridge is fully initialized
        val setupUrl = "${BuildConfig.BASE_DOMAIN}/touchpoint/setup?scale=0.75"
        bridge.webView.loadUrl(setupUrl)
        
        // Capacitor doesn't provide a direct location change observer that matches GeckoView's NavigationDelegate
        // easily from Kotlin, so we poll the URL. This is lightweight and catches programmatic #hash changes.
        pollLockdownurl()
    }

    private fun pollLockdownurl() {
        lifecycleScope.launch {
            while (true) {
                delay(1000) // check every 1 second
                try {
                    val currentUrl = bridge.webView.url
                    if (currentUrl != null) {
                        checkUrlForConfig(currentUrl)
                    }
                } catch (e: Exception) {
                    // Ignore errors if webview isn't ready
                }
            }
        }
    }

    private fun checkUrlForConfig(currentUrl: String) {
        // Monitor URL changes to detect lockdown configuration
        // format: #lockdown:mode:hash
        if (currentUrl.contains("#lockdown:")) {
            try {
                val hash = currentUrl.substringAfter("#lockdown:")
                val parts = hash.split(":")
                if (parts.isNotEmpty()) {
                    val mode = parts[0]
                    val hashValue = if (parts.size > 1 && parts[1] != "null" && parts[1].isNotEmpty()) parts[1] else null
                    
                    val newConfig = LockdownConfig(mode, hashValue)
                    if (newConfig != lockdownConfig.value) {
                        Log.d(TAG, "Lockdown config updated: $newConfig")
                        lockdownConfig.value = newConfig
                        
                        if (mode == "standard" || mode == "device_owner") {
                            enableLockTaskMode()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing lockdown config from URL: ${e.message}")
            }
        }
        
        // Also check for lockdown mode in query parameters (alternative method)
        // Format: ?lockdownMode=standard&unlockHash=abc123
        if (currentUrl.contains("lockdownMode=")) {
            try {
                val uri = Uri.parse(currentUrl)
                val mode = uri.getQueryParameter("lockdownMode") ?: "none"
                val hashValue = uri.getQueryParameter("unlockHash")
                
                val newConfig = LockdownConfig(mode, hashValue)
                if (newConfig != lockdownConfig.value && mode != "none") {
                    Log.d(TAG, "Lockdown config from query params: $newConfig")
                    lockdownConfig.value = newConfig
                    
                    if (mode == "standard" || mode == "device_owner") {
                        enableLockTaskMode()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing lockdown config from query: ${e.message}")
            }
        }
        
        // Capture installation ID for config polling
        try {
            val uri = Uri.parse(currentUrl)
            val installId = uri.getQueryParameter("installationId") 
                ?: uri.getQueryParameter("installId")
            if (!installId.isNullOrBlank()) {
                val currentStored = getInstallationId()
                if (currentStored != installId) {
                    storeInstallationId(installId)
                    Log.d(TAG, "Stored installation ID: $installId")
                }
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun checkForUpdates() {
        if (!otaUpdateManager.shouldCheckForUpdate()) return
        
        lifecycleScope.launch {
            val info = otaUpdateManager.checkForUpdate()
            
            if (info != null) {
                // Only record check time if we successfully reached the server
                otaUpdateManager.recordUpdateCheck()
                
                if (info.hasUpdate) {
                    Log.d(TAG, "Update available: ${info.latestVersion}")
                    updateInfo.value = info
                    showUpdateDialog.value = true
                    
                    // For Device Owner mode, auto-install if mandatory
                    val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                    if (dpm.isDeviceOwnerApp(packageName) && info.mandatory && info.downloadUrl != null) {
                        Log.d(TAG, "Auto-installing mandatory update (Device Owner mode)")
                        otaUpdateManager.downloadAndInstall(info.downloadUrl)
                    }
                }
            }
        }
    }

    private fun checkInstallPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            if (!packageManager.canRequestPackageInstalls()) {
                val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                if (!dpm.isDeviceOwnerApp(packageName)) {
                    val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                    intent.data = Uri.parse("package:$packageName")
                    startActivity(intent)
                    Toast.makeText(this, "Please allow 'Install unknown apps' for updates", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun startConfigPolling() {
        lifecycleScope.launch {
            while (true) {
                delay(CONFIG_POLL_INTERVAL_MS)
                
                try {
                    val installationId = getInstallationId() ?: continue
                    val config = fetchRemoteConfig(installationId) ?: continue
                    
                    val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                    
                    // Command: wipeDevice (factory reset)
                    if (config.optBoolean("wipeDevice", false) && dpm.isDeviceOwnerApp(packageName)) {
                        Log.w(TAG, "Remote wipeDevice command received - initiating factory reset")
                        Toast.makeText(this@MainActivity, "Remote wipe initiated...", Toast.LENGTH_LONG).show()
                        dpm.wipeDevice(0)
                        return@launch 
                    }
                    
                    // Command: clearDeviceOwner
                    if (config.optBoolean("clearDeviceOwner", false) && dpm.isDeviceOwnerApp(packageName)) {
                        Log.w(TAG, "Remote clearDeviceOwner command received - removing device owner")
                        Toast.makeText(this@MainActivity, "Removing device owner mode...", Toast.LENGTH_LONG).show()
                        dpm.clearDeviceOwnerApp(packageName)
                        lockdownConfig.value = LockdownConfig(lockdownMode = "none", unlockCodeHash = null)
                        try { stopLockTask() } catch (e: Exception) { Log.e(TAG, "Failed to stop lock task", e) }
                        continue
                    }
                    
                    // Dynamic unlock code update
                    val remoteUnlockHash = config.optString("unlockCodeHash", null)
                    val remoteLockdownMode = config.optString("lockdownMode", "none")
                    val currentConfig = lockdownConfig.value
                    
                    if (remoteUnlockHash != null && remoteUnlockHash != currentConfig.unlockCodeHash) {
                        Log.d(TAG, "Remote unlock code hash updated")
                        lockdownConfig.value = currentConfig.copy(
                            unlockCodeHash = remoteUnlockHash,
                            lockdownMode = remoteLockdownMode
                        )
                    } else if (remoteLockdownMode != currentConfig.lockdownMode) {
                        Log.d(TAG, "Remote lockdown mode updated: $remoteLockdownMode")
                        lockdownConfig.value = currentConfig.copy(lockdownMode = remoteLockdownMode)
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Config polling error: ${e.message}")
                }
            }
        }
    }

    private fun startUpdatePolling() {
        lifecycleScope.launch {
            checkForUpdates()
            while (true) {
                delay(60 * 60 * 1000L) 
                checkForUpdates()
            }
        }
    }

    private fun getInstallationId(): String? {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(PREF_INSTALLATION_ID, null)
    }

    private fun storeInstallationId(id: String) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(PREF_INSTALLATION_ID, id).apply()
    }

    private suspend fun fetchRemoteConfig(installationId: String): JSONObject? = withContext(Dispatchers.IO) {
        try {
            val url = URL("${BuildConfig.BASE_DOMAIN}/api/touchpoint/config?installationId=$installationId")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 10_000
            conn.readTimeout = 10_000
            
            if (conn.responseCode == 200) {
                val response = conn.inputStream.bufferedReader().readText()
                JSONObject(response)
            } else {
                Log.w(TAG, "Config fetch failed: ${conn.responseCode}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Config fetch error: ${e.message}")
            null
        }
    }

    private fun setupBackPressedHandler() {
        // BridgeActivity has a native hardware back button handler. We can intercept it via AndroidX OnBackPressedDispatcher
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val mode = lockdownConfig.value.lockdownMode
                if (mode == "standard" || mode == "device_owner") {
                    Log.d(TAG, "Back pressed blocked - lockdown mode: $mode")
                    showUnlockOverlay.value = true
                } else {
                    // Navigate webview back if possible, otherwise normal back behavior
                    if (bridge.webView.canGoBack()) {
                        bridge.webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    private fun checkOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            if (!android.provider.Settings.canDrawOverlays(this)) {
                val intent = Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName"))
                startActivity(intent)
                Toast.makeText(this, "Please grant 'Display over other apps' for auto-boot", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun enableLockTaskMode() {
        try {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            if (!am.isInLockTaskMode) {
                val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                val componentName = ComponentName(this, AppDeviceAdminReceiver::class.java)
                
                if (dpm.isDeviceOwnerApp(packageName)) {
                    dpm.setLockTaskPackages(componentName, arrayOf(packageName))
                    startLockTask()
                    Log.d(TAG, "Started Lock Task Mode (Device Owner)")
                } else if (lockdownConfig.value.lockdownMode == "standard") {
                    startLockTask()
                    Log.d(TAG, "Started Lock Task Mode (Standard)")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start Lock Task Mode: ${e.message}")
        }
    }

    private fun validateUnlockCode(enteredCode: String): Boolean {
        val storedHash = lockdownConfig.value.unlockCodeHash ?: return false
        val digest = MessageDigest.getInstance("SHA-256")
        val hashedBytes = digest.digest((UNLOCK_SALT + enteredCode).toByteArray())
        val enteredHash = hashedBytes.joinToString("") { "%02x".format(it) }
        return enteredHash == storedHash
    }

    private fun exitLockdownTemporarily() {
        try {
            stopLockTask()
            val current = lockdownConfig.value
            lockdownConfig.value = current.copy(lockdownMode = "none")
            
            Toast.makeText(this, "Lockdown disabled temporarily", Toast.LENGTH_SHORT).show()
            Log.d(TAG, "Lock Task Mode stopped temporarily")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop Lock Task Mode: ${e.message}")
        }
    }

    override fun onPause() {
        super.onPause()
        val mode = lockdownConfig.value.lockdownMode
        if (mode == "standard" || mode == "device_owner") {
            val intent = intent
            intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            startActivity(intent)
        }
    }
}

// UI Composables
@Composable
fun UnlockOverlay(
    onDismiss: () -> Unit,
    onUnlock: (String) -> Unit
) {
    var code by remember { mutableStateOf("") }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.9f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A))
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🔒",
                    fontSize = 48.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                Text(
                    text = "Device Locked",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                Text(
                    text = "Enter unlock code to exit",
                    fontSize = 14.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 24.dp)
                )
                
                OutlinedTextField(
                    value = code,
                    onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) code = it },
                    label = { Text("Unlock Code") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    keyboardActions = KeyboardActions(onDone = { onUnlock(code) }),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF10B981),
                        unfocusedBorderColor = Color.Gray
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.Gray)
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = { onUnlock(code) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        enabled = code.length >= 4
                    ) {
                        Text("Unlock")
                    }
                }
            }
        }
    }
}

@Composable
fun UpdateAvailableDialog(
    info: OtaUpdateManager.UpdateInfo,
    onDismiss: () -> Unit,
    onUpdate: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A))
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🔄",
                    fontSize = 48.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                Text(
                    text = "Update Available",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                Text(
                    text = "Version ${info.latestVersion}",
                    fontSize = 16.sp,
                    color = Color(0xFF10B981),
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                if (info.releaseNotes.isNotEmpty()) {
                    Text(
                        text = info.releaseNotes,
                        fontSize = 14.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                }
                
                if (info.mandatory) {
                    Text(
                        text = "⚠️ This update is required",
                        fontSize = 12.sp,
                        color = Color(0xFFEF4444),
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (!info.mandatory) {
                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.Gray)
                        ) {
                            Text("Later")
                        }
                    }
                    
                    Button(
                        onClick = onUpdate,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Text("Install Update")
                    }
                }
            }
        }
    }
}
