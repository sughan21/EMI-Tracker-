@echo off
title LoanPulse — Live Mobile Tunnel Launcher
cls
echo ======================================================================
echo   LoanPulse — Live Mobile Access (Instant HTTPS Link)
echo ======================================================================
echo.
echo   Starting local server...
start /min "LoanPulse Server" powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
timeout /t 2 /nobreak >nul

echo   Starting secure live tunnel (No firewall or Wi-Fi config required)...
echo.
"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:8080 --no-autoupdate
pause
