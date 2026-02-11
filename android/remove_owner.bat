@echo off
echo Removing Device Owner Mode...
echo.
echo NOTE: This requires USB Debugging to be enabled on the device.
echo.

adb shell dpm remove-active-admin com.example.basaltsurgemobile/.AppDeviceAdminReceiver

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Device Owner mode removed.
    echo You can now uninstall the app or change settings normally.
) else (
    echo.
    echo Failed to remove Device Owner mode.
    echo 1. Ensure the device is connected via USB.
    echo 2. Ensure USB Debugging is enabled.
    echo 3. Try running this script as Administrator.
)
pause
