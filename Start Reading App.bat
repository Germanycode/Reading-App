@echo off
setlocal

set "APP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%scripts\start-local.ps1"

endlocal
