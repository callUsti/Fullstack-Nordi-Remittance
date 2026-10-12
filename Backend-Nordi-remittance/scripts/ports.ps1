#!/usr/bin/env pwsh
# ports.ps1 — Check what's running on key project ports

param([int]$ApiPort = 3000)

function Check-Port {
    param([int]$Port, [string]$Name)
    $listening = $null -ne (netstat -ano 2>$null | Select-String ":$Port\s.*LISTENING")
    if ($listening) {
        Write-Host "✓ Port $Port ($Name): running"  -ForegroundColor Green
    } else {
        Write-Host "  Port $Port ($Name): not running" -ForegroundColor Yellow
    }
}

Write-Host "Checking ports..." -ForegroundColor Cyan
Check-Port $ApiPort "API"
Check-Port 27017    "MongoDB"
Check-Port 6379     "Redis"
Check-Port 9092     "Kafka"
