#!/usr/bin/env pwsh
# kill-port.ps1 — Kill the process listening on a given port (default: 3000)

param([int]$Port = 3000)

$match = netstat -ano 2>$null | Select-String ":$Port\s.*LISTENING"
if ($match) {
    $pid = ($match -replace '.*LISTENING\s+', '').Trim()
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "✓ Killed process $pid on port $Port" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not kill PID $pid on port $Port`: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "No process found on port $Port" -ForegroundColor Green
}
