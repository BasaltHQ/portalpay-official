@echo off
setlocal
echo ==========================================
echo      PortalPay Device Debug Tool
echo ==========================================
echo.
echo 1. Ensure your device is connected via USB
echo 2. Ensure USB Debugging is enabled
echo.
echo Checking for devices...
adb devices
echo.
echo If your device is listed above, we are ready.
echo.
set /p "id=Enter Device ID (from above, or press Enter for first device): "

if "%id%"=="" (
    set TARGET=
) else (
    set TARGET=-s %id%
)

echo.
echo Capturing logs to 'device_logs.txt'...
echo.
echo *** PRESS CTRL+C TO STOP LOGGING ***
echo.

adb %TARGET% logcat -v time > device_logs.txt

echo.
echo Logs saved to device_logs.txt
pause
