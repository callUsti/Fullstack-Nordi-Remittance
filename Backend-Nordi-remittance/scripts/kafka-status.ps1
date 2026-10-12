#!/usr/bin/env pwsh
# kafka-status.ps1 — Check if Kafka is running on port 9092

$running = $null -ne (netstat -ano 2>$null | Select-String ":9092\s.*LISTENING")

if ($running) {
    Write-Host "✓ Kafka is running on port 9092" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Kafka is not running" -ForegroundColor Red
    exit 1
}
