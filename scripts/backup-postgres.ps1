[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory,

    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw 'DatabaseUrl or DATABASE_URL is required.'
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $resolvedOutput)) {
    New-Item -ItemType Directory -Path $resolvedOutput | Out-Null
}
if (-not (Test-Path -LiteralPath $resolvedOutput -PathType Container)) {
    throw "OutputDirectory is not a directory: $resolvedOutput"
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupFile = Join-Path $resolvedOutput "vyaymitra-$timestamp.dump"
$manifestFile = "$backupFile.manifest.json"

& pg_dump --format=custom --no-owner --no-privileges --file=$backupFile $DatabaseUrl
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $backupFile)) {
    throw 'pg_dump failed; no valid backup was recorded.'
}

$fileInfo = Get-Item -LiteralPath $backupFile
if ($fileInfo.Length -le 0) {
    throw 'pg_dump created an empty backup file.'
}

$hash = (Get-FileHash -LiteralPath $backupFile -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
    format = 'postgresql-custom'
    created_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    file_name = $fileInfo.Name
    size_bytes = $fileInfo.Length
    sha256 = $hash
    verified_restore = $false
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestFile -Encoding utf8

Write-Output ([pscustomobject]@{
    BackupFile = $backupFile
    ManifestFile = $manifestFile
    SizeBytes = $fileInfo.Length
    Sha256 = $hash
    RestoreVerified = $false
})

