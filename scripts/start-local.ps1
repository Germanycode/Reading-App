$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $AppRoot "backend"
$FrontendDir = Join-Path $AppRoot "frontend"
$RunDir = Join-Path $AppRoot ".local-run"
$LogDir = Join-Path $RunDir "logs"
$BackendPidFile = Join-Path $RunDir "backend.pid"
$FrontendPidFile = Join-Path $RunDir "frontend.pid"
$AppUrl = "http://localhost:3000"
$ApiUrl = "http://localhost:8000/api"
$FrontendUrl = "http://localhost:3000"

New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null

function Test-ProcessFromPidFile {
    param([string] $PidFile)

    if (-not (Test-Path $PidFile)) {
        return $false
    }

    $ProcessIdText = (Get-Content -Path $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if (-not $ProcessIdText) {
        return $false
    }

    $ExistingProcess = Get-Process -Id ([int] $ProcessIdText) -ErrorAction SilentlyContinue
    return $null -ne $ExistingProcess
}

function Get-BackendPython {
    $Candidates = @(
        (Join-Path $BackendDir ".venv\Scripts\python.exe"),
        (Join-Path $BackendDir "venv\Scripts\python.exe"),
        "python"
    )

    foreach ($Candidate in $Candidates) {
        if ($Candidate -eq "python") {
            if (Get-Command python -ErrorAction SilentlyContinue) {
                return "python"
            }
        } elseif (Test-Path $Candidate) {
            return $Candidate
        }
    }

    throw "Python was not found. Create backend/.venv or install Python."
}

function Wait-ForUrl {
    param(
        [string] $Url,
        [int] $TimeoutSeconds = 60
    )

    $Deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $Deadline) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    Write-Host "The browser will open, but the frontend did not respond within $TimeoutSeconds seconds."
}

if (-not (Test-Path (Join-Path $BackendDir "app\main.py"))) {
    throw "Backend app was not found at $BackendDir."
}

if (-not (Test-Path (Join-Path $FrontendDir "package.json"))) {
    throw "Frontend package.json was not found at $FrontendDir."
}

$BackendAlreadyRunning = Test-ProcessFromPidFile $BackendPidFile
$FrontendAlreadyRunning = Test-ProcessFromPidFile $FrontendPidFile

if (-not $BackendAlreadyRunning) {
    $BackendPython = Get-BackendPython
    $BackendProcess = Start-Process `
        -FilePath $BackendPython `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput (Join-Path $LogDir "backend.out.log") `
        -RedirectStandardError (Join-Path $LogDir "backend.err.log") `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path $BackendPidFile -Value $BackendProcess.Id
}

if (-not $FrontendAlreadyRunning) {
    $NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $NpmCommand) {
        throw "npm.cmd was not found. Install Node.js or add npm to PATH."
    }

    $FrontendCommand = "set NEXT_PUBLIC_API_BASE_URL=$ApiUrl&& `"$($NpmCommand.Source)`" run dev"

    $FrontendProcess = Start-Process `
        -FilePath "cmd.exe" `
        -ArgumentList @("/c", $FrontendCommand) `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput (Join-Path $LogDir "frontend.out.log") `
        -RedirectStandardError (Join-Path $LogDir "frontend.err.log") `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path $FrontendPidFile -Value $FrontendProcess.Id
}

Wait-ForUrl -Url $FrontendUrl -TimeoutSeconds 60
Start-Process $AppUrl

Write-Host "Gemany Reading App is starting in the background."
Write-Host "Open: $AppUrl"
Write-Host "Logs: $LogDir"
Write-Host "Use 'Stop Reading App.bat' when you are done."
