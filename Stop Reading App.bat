@echo off
setlocal

set "APP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%scripts\stop-local.ps1"

pause
endlocal
