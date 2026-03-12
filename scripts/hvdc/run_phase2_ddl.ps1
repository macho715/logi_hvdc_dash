# Phase 2 DDL: execute -> verify
# Option A: SUPABASE_DB_URL (postgresql://...) -> apply_ddl.py (no CLI login)
# Option B: SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF -> supabase link + db execute
# Run from repo root: pwsh -File scripts/hvdc/run_phase2_ddl.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
while (-not (Test-Path (Join-Path $root "supabase"))) { $root = Split-Path $root -Parent }
Set-Location $root

$ddl = "supabase/scripts/20260124_hvdc_layers_status_case_ops.sql"
if (-not (Test-Path $ddl)) {
  Write-Error "DDL file not found: $ddl"
  exit 1
}

if ($env:SUPABASE_DB_URL) {
  Write-Host "Using SUPABASE_DB_URL (apply_ddl + verify)"
  python scripts/hvdc/apply_ddl.py $ddl
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Verifying schemas, tables, views..."
  python scripts/hvdc/verify_phase2_ddl.py
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Phase 2 DDL completed successfully."
  exit 0
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Set SUPABASE_ACCESS_TOKEN (and SUPABASE_PROJECT_REF) or SUPABASE_DB_URL. See docs/PHASE2_DDL_APPLICATION_PLAN.md"
  exit 1
}
if (-not $env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF = "rkfffveonaskewwzghex" }

Write-Host "Linking project ref: $env:SUPABASE_PROJECT_REF"
supabase link --project-ref $env:SUPABASE_PROJECT_REF

Write-Host "Executing DDL: $ddl"
supabase db execute -f $ddl

Write-Host "Verifying schemas..."
supabase db execute --query "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('status','case','ops') ORDER BY schema_name;"

Write-Host "Verifying status tables..."
supabase db execute --query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'status' ORDER BY table_name;"

Write-Host "Verifying case tables..."
supabase db execute --query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'case' ORDER BY table_name;"

Write-Host "Verifying ops tables..."
supabase db execute --query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'ops' ORDER BY table_name;"

Write-Host "Verifying public v_* views..."
supabase db execute --query "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'v_%' ORDER BY table_name;"

Write-Host "Phase 2 DDL completed successfully."
