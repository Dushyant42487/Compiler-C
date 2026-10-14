@echo off
REM Share the checked build workflow with the PowerShell entry point.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1"
exit /b %ERRORLEVEL%
