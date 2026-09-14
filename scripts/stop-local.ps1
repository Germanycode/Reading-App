$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RunDir = Join-Path $AppRoot ".local-run"
$PidFiles = @(
    (Join-Path $RunDir "frontend.pid"),
    (Join-Path $RunDir "backend.pid")
)

foreach ($PidFile in $PidFiles) {
    if (-not (Test-Path $PidFile)) {
        continue
    }

    $ProcessIdText = (Get-Content -Path $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($ProcessIdText) {
        $ExistingProcess = Get-Process -Id ([int] $ProcessIdText) -ErrorAction SilentlyContinue
        if ($ExistingProcess) {
            & taskkill.exe /PID $ExistingProcess.Id /T /F | Out-Null
        }
    }

    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Gemany Reading App services stopped."
