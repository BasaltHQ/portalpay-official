@echo off
REM Simple wrapper to run apktool.jar from the tools directory
REM Usage: apktool.bat [apktool args]
REM Example: apktool.bat d path\to\app.apk -o output-dir -f

setlocal
set JAR_PATH=%~dp0apktool.jar
if not exist "%JAR_PATH%" (
  echo ERROR: apktool.jar not found at "%JAR_PATH%"
  echo Download apktool jar to tools\apktool.jar, e.g.:
  echo curl -L -o tools\apktool.jar https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.9.3.jar
  exit /b 1
)
java -jar "%JAR_PATH%" %*
endlocal
