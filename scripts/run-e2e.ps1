<#
.SYNOPSIS
    VyayMitra Playwright E2E Test Runner
.DESCRIPTION
    Builds the web frontend if needed, verifies browser binaries, and executes Playwright E2E suites.
.PARAMETER Headed
    Run tests in headed browser mode so you can watch execution.
.PARAMETER UI
    Launch the interactive Playwright UI mode runner.
.PARAMETER Project
    Target a specific Playwright project ('chromium' or 'mobile-chrome'). Default: 'chromium'.
.PARAMETER AllBrowsers
    Run across all configured projects (desktop and mobile).
.PARAMETER Filter
    Only run test files matching this regex or name (e.g. 'expenses', 'auth', 'reports').
.PARAMETER Report
    Open the HTML report in browser after the test run completes.
.PARAMETER Dev
    Use the Vite dev server instead of production preview.
.EXAMPLE
    .\scripts\run-e2e.ps1
    .\scripts\run-e2e.ps1 -Headed
    .\scripts\run-e2e.ps1 -UI
    .\scripts\run-e2e.ps1 -Filter expenses
    .\scripts\run-e2e.ps1 -Report
#>

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$UI,
    [string]$Project = 'chromium',
    [switch]$AllBrowsers,
    [string]$Filter = '',
    [switch]$Report,
    [switch]$Dev
)

$ErrorActionPreference = 'Stop'
$MonorepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $MonorepoRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VyayMitra Enterprise Expense SaaS - Playwright E2E Suite " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Node and pnpm
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is not found on PATH. Please install or enable pnpm."
}

# 2. Check build artifacts if not using dev server
$WebDistIndex = Join-Path $MonorepoRoot "apps\web\dist\index.html"
if (-not $Dev -and -not (Test-Path $WebDistIndex)) {
    Write-Host "`n[1/3] Building @vyay/web frontend bundle for preview server..." -ForegroundColor Yellow
    pnpm --filter @vyay/web build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build @vyay/web frontend bundle."
    }
    Write-Host "Web build complete." -ForegroundColor Green
} else {
    Write-Host "`n[1/3] Web frontend artifact verified (apps\web\dist)." -ForegroundColor Green
}

# 3. Check Playwright browser binary
Write-Host "`n[2/3] Verifying Playwright browser availability..." -ForegroundColor Yellow
$LocalPlaywrightPath = Join-Path $env:LOCALAPPDATA "ms-playwright"
$HasChromium = (Test-Path $LocalPlaywrightPath) -and (Get-ChildItem -Path $LocalPlaywrightPath -Filter "chromium*" -ErrorAction SilentlyContinue)
if (-not $HasChromium) {
    Write-Host "Installing Playwright Chromium browser binaries..." -ForegroundColor Yellow
    pnpm exec playwright install chromium
}
Write-Host "Playwright browser binaries ready." -ForegroundColor Green

# 4. Formulate test command
Write-Host "`n[3/3] Launching Playwright E2E test execution..." -ForegroundColor Yellow

$PlaywrightArgs = @('test')

if ($UI) {
    $PlaywrightArgs += '--ui'
} elseif ($Headed) {
    $PlaywrightArgs += '--headed'
}

if (-not $AllBrowsers -and -not $UI) {
    $PlaywrightArgs += @('--project', $Project)
}

if ($Filter) {
    $PlaywrightArgs += $Filter
}

if ($Dev) {
    $env:E2E_DEV_SERVER = "1"
}

Write-Host "Command: pnpm exec playwright $($PlaywrightArgs -join ' ')" -ForegroundColor DarkGray

& pnpm exec playwright @PlaywrightArgs
$TestExitCode = $LASTEXITCODE

if ($TestExitCode -eq 0) {
    Write-Host "`nAll Playwright E2E tests PASSED successfully!" -ForegroundColor Green
} else {
    Write-Host "`nPlaywright E2E test run finished with exit code $TestExitCode" -ForegroundColor Red
}

if ($Report -or ($TestExitCode -ne 0 -and -not $UI)) {
    Write-Host "`nTip: View detailed trace & report by running: pnpm test:e2e:report" -ForegroundColor Gray
    if ($Report) {
        & pnpm exec playwright show-report
    }
}

exit $TestExitCode
