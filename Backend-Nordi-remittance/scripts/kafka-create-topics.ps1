# kafka-create-topics.ps1 - Fast bulk creation of all Nordi Kafka topics on Windows
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
    "nordi.document.events",
    "nordi.audit.events",
    "nordi.analytics.events",
    "nordi.dlq"
)

# 1. Fetch all existing topics in a single JVM call
Write-Host "  Checking existing Kafka topics..." -ForegroundColor Cyan
$existingRaw = cmd.exe /c "kafka-topics.bat --bootstrap-server $Bootstrap --list 2>nul"
$existingList = @($existingRaw | ForEach-Object { "$_".Trim() } | Where-Object { $_ -ne "" })

$missingTopics = $topics | Where-Object { $existingList -notcontains $_ }

if ($missingTopics.Count -eq 0) {
    Write-Host "  [OK] All $($topics.Count) Nordi Kafka topics already exist." -ForegroundColor Green
    exit 0
}

Write-Host "  Found $($missingTopics.Count) missing topics to create." -ForegroundColor Yellow

$created = 0
foreach ($topic in $missingTopics) {
    Write-Host "  Creating topic: $topic" -ForegroundColor Cyan
    $result = cmd.exe /c "kafka-topics.bat --bootstrap-server $Bootstrap --create --topic $topic --partitions 3 --replication-factor 1 --if-not-exists 2>&1"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK]   $topic created" -ForegroundColor Green
        $created++
    } else {
        Write-Host "  [FAIL] $topic" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host "[DONE] Created $created missing topics." -ForegroundColor Green
