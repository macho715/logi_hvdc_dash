#requires -Version 5.1
<#!
Move RAW DATA files to supabase/data/raw/ folder

Files to move:
- hvdc_excel_reporter_final_sqm_rev_3.json
- hvdc_excel_reporter_final_sqm_rev_3.csv

Destination: supabase/data/raw/

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/hvdc/move_raw_data.ps1
#>

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
$SrcDir = Join-Path $RepoRoot "supabase\data\raw"

Write-Host "[move_raw_data.ps1] repo_root=$RepoRoot"
Write-Host "[move_raw_data.ps1] destination=$SrcDir"

# Files to move
$filesToMove = @(
  @{
    Source = Join-Path $RepoRoot "hvdc_excel_reporter_final_sqm_rev_3.json"
    Destination = Join-Path $SrcDir "hvdc_excel_reporter_final_sqm_rev_3.json"
  },
  @{
    Source = Join-Path $RepoRoot "hvdc_excel_reporter_final_sqm_rev_3.csv"
    Destination = Join-Path $SrcDir "hvdc_excel_reporter_final_sqm_rev_3.csv"
  }
)

foreach ($file in $filesToMove) {
  if (-not (Test-Path $file.Source)) {
    Write-Warning "[move_raw_data.ps1] Source file not found: $($file.Source)"
    continue
  }
  
  if (Test-Path $file.Destination) {
    Write-Warning "[move_raw_data.ps1] Destination file already exists: $($file.Destination)"
    Write-Host "[move_raw_data.ps1] Skipping: $($file.Source)"
    continue
  }
  
  Write-Host "[move_raw_data.ps1] Moving: $($file.Source) -> $($file.Destination)"
  Move-Item -Path $file.Source -Destination $file.Destination -Force
  Write-Host "[move_raw_data.ps1] ✅ Moved: $(Split-Path $file.Destination -Leaf)"
}

Write-Host "[move_raw_data.ps1] DONE"
