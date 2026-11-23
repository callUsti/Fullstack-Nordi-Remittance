# dev-local.ps1 - Spin up local Backend API and Website Frontend (no Docker)
# Kafka is DISABLED at this stage (heavy tooling) — the original Kafka bootstrap
# steps are preserved below, commented out, for easy re-enable when scaling.
param(
    [string]$KafkaHome = "C:\kafka",
    [string]$Bootstrap = "localhost:9092"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Nordi Remittance Local Development Stack" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$scriptsDir = Join-Path $PSScriptRoot "..\Backend-Nordi-remittance\scripts"
$backendDir = Join-Path $PSScriptRoot "..\Backend-Nordi-remittance"
$frontendDir = Join-Path $PSScriptRoot "..\Frontend-Nordi-Remittance"
# $kraftLogs = Join-Path $KafkaHome "kraft-combined-logs"
# $serverProps = Join-Path $KafkaHome "config\server.properties"

# ── KAFKA (DISABLED) ─────────────────────────────────────────────────────────
# # 1. Format KRaft storage if not initialized
# if (!(Test-Path $kraftLogs) -or !(Get-ChildItem $kraftLogs -ErrorAction SilentlyContinue)) {
#     Write-Host "[1/4] Formatting local KRaft storage..." -ForegroundColor Yellow
#     New-Item -ItemType Directory -Force -Path $kraftLogs | Out-Null
#     $clusterId = (kafka-storage.bat random-uuid | Out-String).Trim()
#     kafka-storage.bat format -t $clusterId --standalone -c $serverProps
#     Write-Host "  [OK] KRaft storage formatted with cluster ID: $clusterId" -ForegroundColor Green
# } else {
#     Write-Host "[1/4] Local KRaft storage directory exists." -ForegroundColor Green
# }
#
# # 2. Start Kafka broker if not running
# Write-Host "[2/4] Checking local Kafka broker..." -ForegroundColor Cyan
# $isKafkaListening = $null -ne (netstat -ano 2>$null | Select-String ":9092\s.*LISTENING")
# if (!$isKafkaListening) {
#     Write-Host "  Starting Kafka broker on $Bootstrap..." -ForegroundColor Yellow
#     & (Join-Path $scriptsDir "kafka-start.ps1")
# } else {
#     Write-Host "  [OK] Kafka broker is already running on $Bootstrap" -ForegroundColor Green
# }
#
# # 3. Create/verify all 18 Nordi Kafka topics
# Write-Host "[3/4] Verifying all Nordi Kafka topics..." -ForegroundColor Cyan
# & (Join-Path $scriptsDir "kafka-create-topics.ps1") -Bootstrap $Bootstrap

# Free stale processes on local dev ports (3000 = Backend API, 5173 = Website Frontend)
foreach ($port in @(3000, 5173)) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -and $procId -ne 0) {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.ProcessName } else { "process" }
                Write-Host "Stopping existing $procName (PID $procId) on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Launch Backend API and Website Frontend concurrently
Write-Host "Launching Backend API and Website Frontend concurrently..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; npm run dev" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; pnpm --filter=remitwave dev" -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] Local stack running successfully!" -ForegroundColor Green
# Write-Host "  - Kafka:    http://$Bootstrap" -ForegroundColor Cyan
Write-Host "  - Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Website:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
