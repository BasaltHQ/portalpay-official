@echo off
echo Attempting to Remove Device Owner Mode...
echo.

echo Method 1: ADB Broadcast (Updated App Rescue)
echo Sending RESCUE_REMOVE_OWNER broadcast...
echo (Applicable only if you successfully installed the updated APK)
echo.
adb shell am broadcast -a com.example.basaltsurgemobile.RESCUE_REMOVE_OWNER
echo.

echo ---------------------------------------------------
echo.
echo Method 2: Native Removal (Test Builds Only)
echo Attempting dpm remove-active-admin...
adb shell dpm remove-active-admin com.example.basaltsurgemobile/.AppDeviceAdminReceiver
echo.
echo (Will fail on production/signed builds with SecurityException)
echo.

echo ---------------------------------------------------
echo.
echo Method 3: Factory Reset (Wipe Data)
echo WARNING: This will WIPE ALL DATA on the device!
echo.
set /p wipe="Do you want to initiate a FACTORY RESET (wipe-data 0)? (y/n): "
if /i "%wipe%"=="y" (
    echo.
    echo attempting adb shell dpm wipe-data 0...
    adb shell dpm wipe-data 0
)

echo.
echo ---------------------------------------------------
echo.
echo Method 4: Reboot to Recovery Mode (For Hardware Factory Reset)
echo (Use this if Method 3 fails due to permissions)
echo.
set /p recovery="Do you want to REBOOT to RECOVERY MODE? (y/n): "
if /i "%recovery%"=="y" (
    echo.
    echo Rebooting to recovery...
    adb reboot recovery
    echo Device should be rebooting. Look for "Wipe data/factory reset" in the menu.
)

pause
