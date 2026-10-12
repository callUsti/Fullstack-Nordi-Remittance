# kill-port.ps1 - Kill the process listening on a given port
param([int]$Port = 3000)

$line = netstat -ano 2>$null | Select-String ":$Port\s.*LISTENING" | Select-Object -First 1
if ($line) {
    $procId = ($line.ToString().Trim() -split '\s+')[-1]
    try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "[OK] Killed process $procId on port $Port" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not kill PID $procId on port ${Port}: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] No process found on port $Port" -ForegroundColor Green
}