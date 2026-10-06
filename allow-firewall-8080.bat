@echo off
title Allow Port 8080 in Firewall for Mobile Phone

:: Check for Administrative permissions
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :gotAdmin
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:gotAdmin
cls
echo ======================================================================
echo   LoanPulse — Opening Port 8080 for Mobile Phone Access
echo ======================================================================
echo.
echo   Adding Windows Firewall rule for Port 8080 (TCP)...
netsh advfirewall firewall delete rule name="LoanPulse 8080" >nul 2>&1
netsh advfirewall firewall add rule name="LoanPulse 8080" dir=in action=allow protocol=TCP localport=8080

echo.
echo ======================================================================
echo   [SUCCESS] Port 8080 is now ALLOWED in Windows Firewall!
echo.
echo   Open this URL in Chrome / Safari on your phone:
echo   http://10.27.39.201:8080/
echo ======================================================================
echo.
pause
