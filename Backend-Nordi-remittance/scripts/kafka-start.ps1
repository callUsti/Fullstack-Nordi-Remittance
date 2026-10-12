# kafka-start.ps1 - Start Kafka broker (KRaft mode) on Windows
param()

$KafkaHome   = "C:\kafka"
$KafkaConfig = "$KafkaHome\config\server.properties"
$BrokerLog   = "$KafkaHome\logs\server.log"
$Bootstrap   = "localhost:9092"
$MaxWaitSecs = 24

function Test-KafkaPort {
    $null -ne (netstat -ano 2>$null | Select-String ":9092\s.*LISTENING")
}

if (Test-KafkaPort) {
    Write-Host "[WARN] Kafka already running on port 9092" -ForegroundColor Yellow
    exit 0
}

Write-Host "[INFO] Starting Kafka (KRaft mode)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$KafkaHome\logs" | Out-Null

Start-Process -FilePath "$KafkaHome\bin\windows\kafka-server-start.bat" `
              -ArgumentList "`"$KafkaConfig`"" `
              -WindowStyle Hidden

$elapsed = 0
while ($elapsed -lt $MaxWaitSecs) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    if (Test-KafkaPort) {
        Write-Host "[OK] Kafka running on $Bootstrap (took $elapsed seconds)" -ForegroundColor Green
        exit 0
    }
    Write-Host "[INFO] Waiting for Kafka... ($elapsed s elapsed)" -ForegroundColor Yellow
}

Write-Host "[FAIL] Kafka failed to start after $MaxWaitSecs seconds - check logs: $BrokerLog" -ForegroundColor Red
exit 1