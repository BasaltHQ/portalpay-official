@echo off
echo Attempting to Remove Device Owner Mode...
echo.

echo Method 1: ADB Broadcast (Requires App Update)
echo Sending RESCUE_REMOVE_OWNER broadcast...
echo.
adb shell am broadcast -a com.example.basaltsurgemobile.RESCUE_REMOVE_OWNER
echo.
echo If the app was updated with the RescueReceiver, the device should now be unlocked.
echo Check the device screen for a Toast message.
echo.

echo ---------------------------------------------------
echo.
echo Method 2: Native Removal (Only works for test builds)
echo Attempting dpm remove-active-admin...
adb shell dpm remove-active-admin com.example.basaltsurgemobile/.AppDeviceAdminReceiver
echo.
echo (This likely failed with SecurityException on production devices - that is normal)
echo.

echo ---------------------------------------------------
echo.
echo Method 3: Factory Reset (The "Nuclear Option")
echo WARNING: This will WIPE ALL DATA on the device!
echo.
set /p wipe="Do you want to FACTORY RESET this device? (y/n): "
if /i "%wipe%"=="y" (
    echo.
    echo Initiating factory reset...
    adb shell dpm wipe-data 0
    echo Done. Device should be rebooting.
) else (
    echo.
    echo Skipped factory reset.
)

pause
