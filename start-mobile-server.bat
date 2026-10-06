@echo off
title LoanPulse Mobile Server
cls
echo ========================================================
echo   LoanPulse — Mobile Server Launcher
echo ========================================================
echo   Make sure your phone and PC are on the same Wi-Fi.
echo   Starting local server...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
