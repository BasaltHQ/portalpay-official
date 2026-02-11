package com.example.basaltsurgemobile

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * OTA Update Manager - Handles checking for and installing APK updates
 * without requiring the Play Store.
 */
class OtaUpdateManager(private val context: Context) {
    
    companion object {
        private const val TAG = "OtaUpdateManager"
        private const val PREFS_NAME = "ota_update_prefs"
        private const val KEY_LAST_CHECK = "last_check_time"
        // Check interval: 5 minutes for testing (was 6 hours)
        // In production, consider increasing to 1-2 hours
        private const val CHECK_INTERVAL_MS = 5 * 60 * 1000L // 5 minutes
    }
    
    data class UpdateInfo(
        val hasUpdate: Boolean,
        val latestVersion: String,
        val latestVersionCode: Int,
        val downloadUrl: String?,
        val releaseNotes: String,
        val mandatory: Boolean
    )
    
    /**
     * Check for updates from the server
     */
    suspend fun checkForUpdate(): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val currentVersionCode = context.packageManager
                .getPackageInfo(context.packageName, 0)
                .longVersionCode.toInt()
            
            Log.d(TAG, "Current APK versionCode: $currentVersionCode")
            Log.d(TAG, "Checking URL: ${BuildConfig.BASE_DOMAIN}/api/touchpoint/version?currentVersion=$currentVersionCode")
            
            val url = URL("${BuildConfig.BASE_DOMAIN}/api/touchpoint/version?currentVersion=$currentVersionCode")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            
            val responseCode = connection.responseCode
            Log.d(TAG, "API response code: $responseCode")
            
            if (responseCode != 200) {
                Log.e(TAG, "Version check failed with code: $responseCode")
                return@withContext null
            }
            
            val response = connection.inputStream.bufferedReader().readText()
            Log.d(TAG, "API response: $response")
            
            val json = JSONObject(response)
            
            val updateInfo = UpdateInfo(
                hasUpdate = json.optBoolean("hasUpdate", false),
                latestVersion = json.optString("latestVersion", ""),
                latestVersionCode = json.optInt("latestVersionCode", 0),
                downloadUrl = json.optString("downloadUrl", null),
                releaseNotes = json.optString("releaseNotes", ""),
                mandatory = json.optBoolean("mandatory", false)
            )
            
            Log.d(TAG, "Update check result: hasUpdate=${updateInfo.hasUpdate}, latestVersionCode=${updateInfo.latestVersionCode}, currentVersionCode=$currentVersionCode")
            return@withContext updateInfo
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for update: ${e.message}")
            return@withContext null
        }
    }
    
    /**
     * Download and install an APK update
     */
    fun downloadAndInstall(downloadUrl: String, onProgress: ((Int) -> Unit)? = null, onComplete: (() -> Unit)? = null) {
        try {
            val fileName = "update_${System.currentTimeMillis()}.apk"
            val request = DownloadManager.Request(Uri.parse(downloadUrl))
                .setTitle("Downloading Update")
                .setDescription("Downloading app update...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
            
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = downloadManager.enqueue(request)
            
            // Register receiver for download completion
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == downloadId) {
                        context.unregisterReceiver(this)
                        onComplete?.invoke()
                        
                        // Get the downloaded file and trigger install
                        val query = DownloadManager.Query().setFilterById(downloadId)
                        val cursor = downloadManager.query(query)
                        if (cursor.moveToFirst()) {
                            val columnIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)
                            val localUri = cursor.getString(columnIndex)
                            cursor.close()
                            
                            if (localUri != null) {
                                installApk(Uri.parse(localUri))
                            }
                        }
                    }
                }
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(
                    receiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                context.registerReceiver(
                    receiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
                )
            }
            
            Log.d(TAG, "Download started with ID: $downloadId")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error downloading update: ${e.message}")
        }
    }
    
    /**
     * Install an APK file
     */
    /**
     * Install an APK file
     */
    private fun installApk(apkUri: Uri) {
        try {
            // Check if we are Device Owner
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val isDeviceOwner = dpm.isDeviceOwnerApp(context.packageName)
            
            if (isDeviceOwner) {
                Log.d(TAG, "Device Owner detected - attempting silent install")
                installPackageSilently(apkUri)
            } else {
                Log.d(TAG, "Not Device Owner - attempting interactive install")
                installPackageInteractively(apkUri)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error preparing installation: ${e.message}")
        }
    }

    private fun installPackageInteractively(apkUri: Uri) {
        try {
            val file = File(apkUri.path ?: return)
            
            val installUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
            } else {
                Uri.fromFile(file)
            }
            
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(installUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Interactive install intent launched for: $apkUri")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error installing APK interactively: ${e.message}")
        }
    }
    
    private fun installPackageSilently(apkUri: Uri) {
        try {
            val file = File(apkUri.path ?: return)
            val inputStream = java.io.FileInputStream(file)
            val packageInstaller = context.packageManager.packageInstaller
            val params = android.content.pm.PackageInstaller.SessionParams(
                android.content.pm.PackageInstaller.SessionParams.MODE_FULL_INSTALL
            )
            
            // Create a session
            val sessionId = packageInstaller.createSession(params)
            val session = packageInstaller.openSession(sessionId)
            
            // Stream the APK to the session
            val out = session.openWrite("COSU_Update", 0, -1)
            val buffer = ByteArray(65536)
            var c: Int
            while (inputStream.read(buffer).also { c = it } != -1) {
                out.write(buffer, 0, c)
            }
            session.fsync(out)
            inputStream.close()
            out.close()
            
            // Create a pending intent for the result
            val intent = Intent(context, BootReceiver::class.java)
            intent.action = "com.example.basaltsurgemobile.INSTALL_COMPLETE"
            val pendingIntent = android.app.PendingIntent.getBroadcast(
                context, 
                0, 
                intent, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_MUTABLE
            )
            
            // Commit the session
            session.commit(pendingIntent.intentSender)
            Log.d(TAG, "Silent install session committed")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error during silent install: ${e.message}")
            // Fallback to interactive
            installPackageInteractively(apkUri)
        }
    }
    
    /**
     * Check if enough time has passed since last check
     */
    fun shouldCheckForUpdate(): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastCheck = prefs.getLong(KEY_LAST_CHECK, 0)
        return System.currentTimeMillis() - lastCheck > CHECK_INTERVAL_MS
    }
    
    /**
     * Record that we just checked for updates
     */
    fun recordUpdateCheck() {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putLong(KEY_LAST_CHECK, System.currentTimeMillis()).apply()
    }
}
