# ports.ps1 - Check what is running on key project ports
param([int]$ApiPort = 3000)

function Test-Port {
    param([int]$Port, [string]$Name)
    $up = $null -ne (netstat -ano 2>$null | Select-String ":$Port\s.*LISTENING")
    if ($up) {
        Write-Host "[OK]   Port $Port ($Name): running"  -ForegroundColor Green
    } else {
        Write-Host "[    ] Port $Port ($Name): not running" -ForegroundColor Yellow
    }
}

Write-Host "Checking ports..." -ForegroundColor Cyan
Test-Port $ApiPort "API"
Test-Port 27017    "MongoDB"
Test-Port 6379     "Redis"
Test-Port 9092     "Kafka"