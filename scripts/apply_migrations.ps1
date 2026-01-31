<#
  Apply SQL migrations in server/migrations in alphabetical order using psql.
  Requires: SUPABASE_DB_URL (Postgres connection string) and psql in PATH.
  Usage (PowerShell):
    $env:SUPABASE_DB_URL = 'postgres://user:pass@db-host:5432/postgres'
    pwsh .\scripts\apply_migrations.ps1
#>

$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) {
  Write-Error "SUPABASE_DB_URL environment variable is required. Example: postgres://user:pass@host:5432/dbname"
  exit 2
}

$scriptPath = Join-Path $PSScriptRoot "..\server\migrations"
$migrations = Get-ChildItem -Path $scriptPath -Filter "*.sql" | Sort-Object Name
if ($migrations.Count -eq 0) {
  Write-Host "No migrations found in $scriptPath"; exit 0
}

Write-Host "Found $($migrations.Count) migration(s). Preview:"
$migrations | ForEach-Object { Write-Host " - $_.Name" }

$confirm = Read-Host "Apply migrations to database at $dbUrl? Type YES to continue"
if ($confirm -ne 'YES') { Write-Host 'Aborting.'; exit 1 }

foreach ($m in $migrations) {
  Write-Host "Applying: $($m.Name)"
  & psql $dbUrl -v ON_ERROR_STOP=1 -f $m.FullName
  if ($LASTEXITCODE -ne 0) { Write-Error "Migration failed: $($m.Name)"; exit $LASTEXITCODE }
}

Write-Host "Migrations applied successfully." -ForegroundColor Green
