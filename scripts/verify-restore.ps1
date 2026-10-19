[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TargetDatabaseUrl
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($TargetDatabaseUrl)) {
    throw 'TargetDatabaseUrl is required.'
}

$targetUri = [Uri]$TargetDatabaseUrl
$targetDatabaseName = $targetUri.AbsolutePath.Trim('/')
if ($targetDatabaseName -notmatch '(?i)(restore|drill|test)') {
    throw 'Verification target database name must contain restore, drill, or test.'
}

$requiredTables = @(
    'tenants',
    'expenses',
    'expense_reports',
    'approval_actions',
    'reimbursements',
    'reimbursement_payments',
    'external_mappings',
    'audit_events'
)

$tableList = ($requiredTables | ForEach-Object { "'$_'" }) -join ','
$tableQuery = "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ($tableList) ORDER BY tablename;"
$existingTables = @(& psql $TargetDatabaseUrl -v ON_ERROR_STOP=1 -Atc $tableQuery)
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to query the restored database.'
}

$missingTables = @($requiredTables | Where-Object { $_ -notin $existingTables })
if ($missingTables.Count -gt 0) {
    throw "Restore verification failed. Missing tables: $($missingTables -join ', ')"
}

$countQuery = @'
SELECT json_build_object(
  'tenants', (SELECT count(*) FROM tenants),
  'audit_events', (SELECT count(*) FROM audit_events),
  'approval_actions', (SELECT count(*) FROM approval_actions),
  'reimbursements', (SELECT count(*) FROM reimbursements),
  'reimbursement_payments', (SELECT count(*) FROM reimbursement_payments),
  'external_mappings', (SELECT count(*) FROM external_mappings)
)::text;
'@
$counts = & psql $TargetDatabaseUrl -v ON_ERROR_STOP=1 -Atc $countQuery
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($counts)) {
    throw 'Restore verification failed while reading integrity counts.'
}

Write-Output ([pscustomobject]@{
    TargetDatabase = $targetDatabaseName
    VerifiedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    RequiredTables = $requiredTables.Count
    Counts = ($counts | ConvertFrom-Json)
    Status = 'verified_for_drill_review'
})

