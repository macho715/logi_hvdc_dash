#requires -Version 5.1
<#!
End-to-end HVDC data loading pipeline (Windows PowerShell)

Steps:
  1) Validate inputs
  2) Apply DDL
  3) Run ETL (status + option-c)
  4) Load CSV into Supabase (psql \copy)
  5) Gate 1 QA
  6) Enable Realtime publication

Requirements:
  - SUPABASE_DB_URL must be set
  - psql must be available in PATH
  - python must be available in PATH

Usage:
  $env:SUPABASE_DB_URL="postgresql://..."
  powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_all.ps1
#>

$ErrorActionPreference = 'Stop'

if (-not $env:SUPABASE_DB_URL) {
  Write-Error "[run_all.ps1] SUPABASE_DB_URL is required"
  exit 1
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path

Write-Host "[run_all.ps1] repo_root=$RepoRoot"

# 0) Move RAW DATA files if needed
Write-Host "[run_all.ps1] Checking RAW DATA files..."
$SrcDir = Join-Path $RepoRoot "supabase\data\raw"
$rawJsonSource = Join-Path $RepoRoot "hvdc_excel_reporter_final_sqm_rev_3.json"
$rawJsonDest = Join-Path $SrcDir "hvdc_excel_reporter_final_sqm_rev_3.json"
$rawCsvSource = Join-Path $RepoRoot "hvdc_excel_reporter_final_sqm_rev_3.csv"
$rawCsvDest = Join-Path $SrcDir "hvdc_excel_reporter_final_sqm_rev_3.csv"

if ((Test-Path $rawJsonSource) -and -not (Test-Path $rawJsonDest)) {
  Write-Host "[run_all.ps1] Moving RAW DATA JSON to supabase/data/raw/..."
  Move-Item -Path $rawJsonSource -Destination $rawJsonDest -Force
  Write-Host "[run_all.ps1] ✅ Moved: hvdc_excel_reporter_final_sqm_rev_3.json"
}

if ((Test-Path $rawCsvSource) -and -not (Test-Path $rawCsvDest)) {
  Write-Host "[run_all.ps1] Moving RAW DATA CSV to supabase/data/raw/..."
  Move-Item -Path $rawCsvSource -Destination $rawCsvDest -Force
  Write-Host "[run_all.ps1] ✅ Moved: hvdc_excel_reporter_final_sqm_rev_3.csv"
}

# 1) Validate inputs
python (Join-Path $RepoRoot "scripts\hvdc\validate_inputs.py") --repo-root $RepoRoot --source-dir "supabase\data\raw" --require-customs

# 2) Apply DDL
Write-Host "[run_all.ps1] Applying DDL..."
psql $env:SUPABASE_DB_URL -f (Join-Path $RepoRoot "supabase\scripts\20260124_hvdc_layers_status_case_ops.sql")

# 2.5) Create baseline views (optional)
Write-Host "[run_all.ps1] Creating baseline dashboard views (optional)..."
psql $env:SUPABASE_DB_URL -f (Join-Path $RepoRoot "supabase\migrations\20260124_create_dashboard_views.sql")

# 3) Run ETL - Status
Write-Host "[run_all.ps1] Running ETL (status)..."
$SrcDir = Join-Path $RepoRoot "supabase\data\raw"
$OutDir = Join-Path $RepoRoot "hvdc_output"
$BaseIri = if ($env:HVDC_BASE_IRI) { $env:HVDC_BASE_IRI } else { "https://example.com/hvdc" }

# Detect status JSON variants
$statusCandidates = @("HVDC all status.json", "HVDC_all_status.json", "hvdc_all_status.json")
$statusJson = $null
foreach ($c in $statusCandidates) {
  $p = Join-Path $SrcDir $c
  if (Test-Path $p) { $statusJson = $p; break }
}
if (-not $statusJson) {
  throw "[run_all.ps1] Status JSON not found in $SrcDir (expected HVDC all status.json or HVDC_all_status.json)"
}

# Detect warehouse JSON variants (similar to status JSON)
$warehouseCandidates = @(
  "hvdc_warehouse_status.json",
  "HVDC_warehouse_status.json",
  "warehouse_status.json"
)
$warehouseJson = $null
foreach ($c in $warehouseCandidates) {
  $p = Join-Path $SrcDir $c
  if (Test-Path $p) { $warehouseJson = $p; break }
}
if (-not $warehouseJson) {
  throw "[run_all.ps1] Warehouse JSON not found in $SrcDir (expected hvdc_warehouse_status.json or variants)"
}

$etl4 = Join-Path $RepoRoot "scripts\etl\status_etl.py"
if (-not (Test-Path $etl4)) {
  throw "[run_all.ps1] ETL script not found: $etl4"
}

$caseLocations = Join-Path $RepoRoot "supabase\data\output\optionC\locations.csv"
$caseArgs = @()
if (Test-Path $caseLocations) {
  $caseArgs = @("--case-locations", $caseLocations)
}

python $etl4 --status $statusJson --warehouse $warehouseJson --outdir $OutDir --base-iri $BaseIri @caseArgs

# 3.2) Run ETL - Option C
Write-Host "[run_all.ps1] Running ETL (option-c)..."
$etl3 = Join-Path $RepoRoot "scripts\etl\optionc_etl.py"
if (-not (Test-Path $etl3)) {
  throw "[run_all.ps1] ETL script not found: $etl3"
}

# Detect Option-C input JSON (prefer hvdc_excel_reporter_final_sqm_rev_3.json - FLOW_CODE 포함된 처리 완료 데이터)
$allshptCandidates = @(
  "hvdc_excel_reporter_final_sqm_rev_3.json",  # ✅ 우선: FLOW_CODE 포함된 처리 완료 데이터 (8,804 rows)
  "hvdc_allshpt_status.json",
  "HVDC all status.json",
  "HVDC_all_status.json",
  "hvdc_all_status.json"
)
$allshptJson = $null
foreach ($c in $allshptCandidates) {
  $p = Join-Path $SrcDir $c
  if (Test-Path $p) { $allshptJson = $p; break }
}
if (-not $allshptJson) {
  throw "[run_all.ps1] Option-C input JSON not found in $SrcDir (expected hvdc_excel_reporter_final_sqm_rev_3.json or hvdc_allshpt_status.json)"
}

$customsCandidates = @("HVDC_STATUS.json", "hvdc_status.json")
$customsJson = $null
foreach ($c in $customsCandidates) {
  $p = Join-Path $SrcDir $c
  if (Test-Path $p) { $customsJson = $p; break }
}
if (-not $customsJson) {
  throw "[run_all.ps1] Customs JSON not found in $SrcDir (expected HVDC_STATUS.json)"
}

$caseOutDir = Join-Path $RepoRoot "supabase\data\output\optionC"
if (-not (Test-Path $caseOutDir)) { New-Item -ItemType Directory -Force -Path $caseOutDir | Out-Null }

python $etl3 --all $allshptJson --wh $warehouseJson --customs $customsJson --output-dir $caseOutDir --base-iri $BaseIri --export-ttl

# 4) Load CSVs
Write-Host "[run_all.ps1] Loading CSVs..."
$StatusShipmentsCsv = Join-Path $RepoRoot "hvdc_output\supabase\shipments_status.csv"
$StatusEventsCsv    = Join-Path $RepoRoot "hvdc_output\supabase\events_status.csv"
$CaseLocationsCsv   = Join-Path $RepoRoot "supabase\data\output\optionC\locations.csv"
$CaseShipmentsCsv   = Join-Path $RepoRoot "supabase\data\output\optionC\shipments_case.csv"
$CaseCasesCsv       = Join-Path $RepoRoot "supabase\data\output\optionC\cases.csv"
$CaseFlowsCsv       = Join-Path $RepoRoot "supabase\data\output\optionC\flows.csv"
$CaseEventsCsv      = Join-Path $RepoRoot "supabase\data\output\optionC\events_case.csv"

psql $env:SUPABASE_DB_URL \
  -v do_truncate=on \
  -v status_shipments_csv="$StatusShipmentsCsv" \
  -v status_events_csv="$StatusEventsCsv" \
  -v case_locations_csv="$CaseLocationsCsv" \
  -v case_shipments_csv="$CaseShipmentsCsv" \
  -v case_cases_csv="$CaseCasesCsv" \
  -v case_flows_csv="$CaseFlowsCsv" \
  -v case_events_csv="$CaseEventsCsv" \
  -f (Join-Path $RepoRoot "scripts\hvdc\load_csv.psql")

# 5) Gate 1 QA
Write-Host "[run_all.ps1] Gate 1 QA..."
psql $env:SUPABASE_DB_URL -f (Join-Path $RepoRoot "scripts\hvdc\gate1_qa.sql")

# 6) Enable Realtime
Write-Host "[run_all.ps1] Enable Realtime..."
psql $env:SUPABASE_DB_URL -f (Join-Path $RepoRoot "supabase\migrations\20260124_enable_realtime_layers.sql")

Write-Host "[run_all.ps1] DONE"
