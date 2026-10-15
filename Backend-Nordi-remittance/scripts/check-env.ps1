# check-env.ps1 - Validate required environment variables are set
param()

Write-Host "Checking environment variables..." -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "[OK]   .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw

    $checks = @{
        "MONGODB_URI"  = "MongoDB URI"
        "REDIS_HOST"   = "Redis host"
        "JWT_SECRET"   = "JWT secret"
        "KAFKA_BROKERS"= "Kafka brokers"
        "SMTP_HOST"    = "SMTP host"
    }

    foreach ($key in $checks.Keys) {
        if ($envContent -match "(?m)^$key=.+") {
            Write-Host "[OK]   $key is set ($($checks[$key]))" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $key is not set - $($checks[$key])" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[FAIL] .env file missing - run: make gen-env" -ForegroundColor Red
}
