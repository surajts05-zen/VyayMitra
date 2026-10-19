[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true)]
    [string]$TargetDatabaseUrl,

    [string]$SourceDatabaseUrl = $env:DATABASE_URL,

    [Parameter(Mandatory = $true)]
    [switch]$ConfirmRestore
)

$ErrorActionPreference = 'Stop'
$resolvedBackup = [System.IO.Path]::GetFullPath($BackupFile)

if (-not $ConfirmRestore) {
    throw 'Restore requires -ConfirmRestore.'
}
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
    throw "Backup file not found: $resolvedBackup"
}
if ([string]::IsNullOrWhiteSpace($TargetDatabaseUrl)) {
    throw 'TargetDatabaseUrl is required.'
}
if (-not [string]::IsNullOrWhiteSpace($SourceDatabaseUrl) -and $TargetDatabaseUrl -eq $SourceDatabaseUrl) {
    throw 'Target database must not match the source DATABASE_URL.'
}

$targetUri = [Uri]$TargetDatabaseUrl
$targetDatabaseName = $targetUri.AbsolutePath.Trim('/')
if ($targetDatabaseName -notmatch '(?i)(restore|drill|test)') {
    throw 'Restore target database name must contain restore, drill, or test.'
}

$manifestFile = "$resolvedBackup.manifest.json"
if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) {
    throw "Backup manifest not found: $manifestFile"
}
$manifest = Get-Content -Raw -LiteralPath $manifestFile | ConvertFrom-Json
$actualHash = (Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $manifest.sha256) {
    throw 'Backup checksum does not match its manifest.'
}

& pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname=$TargetDatabaseUrl $resolvedBackup
if ($LASTEXITCODE -ne 0) {
    throw 'pg_restore failed. The target drill database must not be promoted or used.'
}

Write-Output ([pscustomobject]@{
    BackupFile = $resolvedBackup
    TargetDatabase = $targetDatabaseName
    ChecksumVerified = $true
    RestoreCompletedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    NextStep = 'Run scripts/verify-restore.ps1 against the same target database.'
})

