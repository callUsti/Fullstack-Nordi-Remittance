# kafka-create-topics.ps1 - Create all Nordi Kafka topics on Windows
param([string]$Bootstrap = "localhost:9092")

$topics = @(
    "nordi.transaction.initiated",
    "nordi.transaction.processed",
    "nordi.transaction.completed",
    "nordi.transaction.failed",
    "nordi.kyc.submitted",
    "nordi.kyc.verified",
    "nordi.kyc.rejected",
    "nordi.security.fraud_alert",
    "nordi.user.registered",
    "nordi.user.login",
    "nordi.user.deleted",
    "nordi.notifications.push",
    "nordi.notifications.email",
    "nordi.notifications.sms",
    "nordi.dlq"
)

$created = 0
$skipped = 0

foreach ($topic in $topics) {
    Write-Host "  Creating topic: $topic" -ForegroundColor Cyan
    $result = (kafka-topics.bat --bootstrap-server $Bootstrap `
        --create --topic $topic `
        --partitions 3 --replication-factor 1 `
        --if-not-exists 2>&1) | Out-String

    if ($LASTEXITCODE -eq 0) {
        if ($result -match "already exists") {
            Write-Host "  [SKIP] $topic already exists" -ForegroundColor Yellow
            $skipped++
        } else {
            Write-Host "  [OK]   $topic created" -ForegroundColor Green
            $created++
        }
    } else {
        Write-Host "  [FAIL] $topic" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[DONE] Topics: $created created, $skipped already existed" -ForegroundColor Green
