@echo off
title LoanPulse Mobile Server
echo ========================================================
echo   Starting LoanPulse Mobile Local Server...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
