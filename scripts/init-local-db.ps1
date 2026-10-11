<#
.SYNOPSIS
    Initializes the form_structure database on a running SQL Server container
    managed by compose.yml.

.DESCRIPTION
    Waits for readiness, creates form_structure when missing, applies the
    baseline api/FormManagementApi/NewFile1.sql (skipped when tables already
    exist) and then the versioned migrations 001_PersistFormSchemaV1.sql and
    002_FormVersionLifecycleGuardrails.sql from
    api/FormManagementApi/Database/Migrations with sqlcmd -b.
    The script is repeatable: re-running it against an initialized database
    skips the baseline and the guarded migrations apply idempotently.
    Credentials are read from the git-ignored .env (MSSQL_SA_PASSWORD).

.EXAMPLE
    .\scripts\init-local-db.ps1

.EXAMPLE
    .\scripts\init-local-db.ps1 -Project form-management-rehearsal
#>
[CmdletBinding()]
param(
    [string]$Project = 'form-management',
    [string]$EnvFile = '',
    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$composeFile = Join-Path $repoRoot 'compose.yml'
if (-not $EnvFile) { $EnvFile = Join-Path $repoRoot '.env' }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'docker CLI not found on PATH.' }

if (Test-Path $EnvFile) {
    foreach ($line in Get-Content $EnvFile) {
        $trim = $line.Trim()
        if ($trim -and -not $trim.StartsWith('#')) {
            $parts = $trim -split '=', 2
            if ($parts.Count -eq 2 -and $parts[0].Trim()) {
                $key = $parts[0].Trim()
                if (-not [Environment]::GetEnvironmentVariable($key)) {
                    [Environment]::SetEnvironmentVariable($key, $parts[1].Trim().Trim('"'))
                }
            }
        }
    }
}
if (-not $env:MSSQL_SA_PASSWORD) { throw 'MSSQL_SA_PASSWORD is not set. Copy .env.example to .env and set a password.' }

$cid = docker compose -f $composeFile -p $Project ps -q sqlserver 2>$null | Select-Object -First 1
if (-not $cid) { throw "No running sqlserver service for compose project '$Project'. Start it with: docker compose --env-file .env up -d" }
$cid = $cid.Trim()

$sqlcmd = docker exec $cid sh -c 'command -v /opt/mssql-tools18/bin/sqlcmd || command -v /opt/mssql-tools/bin/sqlcmd' | Select-Object -First 1
if (-not $sqlcmd) { throw 'sqlcmd not found inside the container.' }
$sqlcmd = $sqlcmd.Trim()

function Invoke-Sql {
    param(
        [string]$Sql = '',
        [string]$Database = 'master',
        [string]$File = ''
    )
    # sqlcmd sessions run with QUOTED_IDENTIFIER OFF; DML/DDL against tables with
    # filtered indexes (added by migration 002) requires it ON. The SET applies to
    # every batch that follows it in the same session.
    $content = if ($File) { Get-Content -Raw $File } else { $Sql }
    "SET QUOTED_IDENTIFIER ON;`n$content" | docker exec -i -e SQLCMDPASSWORD="$env:MSSQL_SA_PASSWORD" $cid $sqlcmd -S localhost -U sa -C -d $Database -b -W
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed with exit code $LASTEXITCODE (database: $Database)." }
}

function Invoke-SqlScalar {
    param([string]$Sql, [string]$Database = 'master')
    $result = $Sql | docker exec -i -e SQLCMDPASSWORD="$env:MSSQL_SA_PASSWORD" $cid $sqlcmd -S localhost -U sa -C -d $Database -b -W -h -1 | Select-Object -First 1
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed with exit code $LASTEXITCODE (database: $Database)." }
    return "$result".Trim()
}

Write-Host "Waiting for SQL Server in container $cid ..."
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ($true) {
    docker exec -e SQLCMDPASSWORD="$env:MSSQL_SA_PASSWORD" $cid $sqlcmd -S localhost -U sa -C -b -Q 'SELECT 1' | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    if ((Get-Date) -gt $deadline) { throw "SQL Server did not become ready within $TimeoutSeconds seconds." }
    Start-Sleep -Seconds 3
}
Write-Host 'SQL Server is ready.'

Invoke-Sql -Sql "IF DB_ID(N'form_structure') IS NULL BEGIN CREATE DATABASE form_structure; END;"
Write-Host "Database form_structure is present (id $(Invoke-SqlScalar -Sql 'SET NOCOUNT ON; SELECT DB_ID(N''form_structure'');'))."

$baselineNeeded = Invoke-SqlScalar -Database form_structure -Sql "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables WHERE name = N'Forms';"
if ($baselineNeeded -eq '0') {
    Write-Host 'Applying baseline NewFile1.sql ...'
    Invoke-Sql -Database form_structure -File (Join-Path $repoRoot 'api/FormManagementApi/NewFile1.sql')
} else {
    Write-Host 'Baseline tables already present; skipping NewFile1.sql.'
}

$migrationsDir = Join-Path $repoRoot 'api/FormManagementApi/Database/Migrations'
foreach ($migration in '001_PersistFormSchemaV1.sql', '002_FormVersionLifecycleGuardrails.sql') {
    Write-Host "Applying $migration ..."
    Invoke-Sql -Database form_structure -File (Join-Path $migrationsDir $migration)
}

Write-Host 'Verifying schema ...'
Invoke-Sql -Database form_structure -Sql @"
SET NOCOUNT ON;
SELECT name AS TableName FROM sys.tables WHERE name IN (N'Forms', N'FormVersions') ORDER BY name;
SELECT name AS IndexName FROM sys.indexes WHERE name IN (N'UX_FormVersions_FormId_VersionNumber', N'UX_FormVersions_Draft', N'UX_FormVersions_Published') ORDER BY name;
SELECT name AS CheckName FROM sys.check_constraints WHERE name LIKE N'CK_%' ORDER BY name;
SELECT name AS ForeignKeyName FROM sys.foreign_keys WHERE name LIKE N'FK_%' ORDER BY name;
SELECT COUNT(*) AS SourceColumns FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Forms') AND name IN (N'SourceFormId', N'SourceVersionId');
SELECT COUNT(*) AS RowVersionColumn FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.FormVersions') AND name = N'RowVersion';
"@

Write-Host "Done. form_structure is initialized on compose project '$Project'."
