#!/usr/bin/env pwsh
# kafka-start.ps1 — Start Kafka broker (KRaft mode) on Windows

$KafkaHome   = "C:\kafka"
$KafkaConfig = "$KafkaHome\config\server.properties"
$KafkaLog    = "$KafkaHome\logs\server.log"
$Bootstrap   = "localhost:9092"
$MaxWaitSecs = 24

function Is-KafkaRunning {
    $null -ne (netstat -ano 2>$null | Select-String ":9092\s.*LISTENING")
}

if (Is-KafkaRunning) {
    Write-Host "⚠  Kafka already running on port 9092" -ForegroundColor Yellow
    exit 0
}

Write-Host "Starting Kafka (KRaft mode)..." -ForegroundColor Cyan

# Ensure log directory exists
New-Item -ItemType Directory -Force -Path "$KafkaHome\logs" | Out-Null

Start-Process -FilePath "$KafkaHome\bin\windows\kafka-server-start.bat" `
              -ArgumentList "`"$KafkaConfig`"" `
              -WindowStyle Hidden

$elapsed = 0
do {
    Start-Sleep -Seconds 2
    $elapsed += 2
    if (Is-KafkaRunning) {
        Write-Host "✓ Kafka running on $Bootstrap (took ${elapsed}s)" -ForegroundColor Green
        exit 0
    }
    Write-Host "  waiting for Kafka... (${elapsed}s)" -ForegroundColor Yellow
} while ($elapsed -lt $MaxWaitSecs)

Write-Host "✗ Kafka failed to start after ${MaxWaitSecs}s — check logs: $KafkaLog" -ForegroundColor Red
exit 1
