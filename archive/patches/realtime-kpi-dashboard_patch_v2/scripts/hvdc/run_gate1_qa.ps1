#requires -Version 5.1
<#!
Run Gate 1 QA checks against Supabase Postgres.

Requirements:
  - SUPABASE_DB_URL must be set
  - psql must be available in PATH

Usage:
  $env:SUPABASE_DB_URL="postgresql://..."
  powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_gate1_qa.ps1
#>

$ErrorActionPreference = 'Stop'

if (-not $env:SUPABASE_DB_URL) {
  Write-Error "[run_gate1_qa.ps1] SUPABASE_DB_URL is required"
  exit 1
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path

psql $env:SUPABASE_DB_URL -f (Join-Path $RepoRoot "scripts\hvdc\gate1_qa.sql")
