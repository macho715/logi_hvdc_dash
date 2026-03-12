# PowerShell 스크립트: Session Pooler를 사용한 CSV 업로드
# DNS 해석 실패 문제를 Session pooler로 해결

param(
    [string]$SupabaseUrl = "",
    [string]$Password = "",
    [string]$Region = "us-east-1",  # 기본값, Dashboard에서 확인 필요
    [switch]$StatusOnly = $false,
    [switch]$Truncate = $false
)

$ErrorActionPreference = "Stop"

Write-Host "[load_csv_with_pooler] Starting CSV upload with Session Pooler..." -ForegroundColor Green

# 1. Session Pooler 연결 문자열 구성
if (-not $SupabaseUrl -or -not $Password) {
    Write-Host "[load_csv_with_pooler] ERROR: SupabaseUrl and Password required" -ForegroundColor Red
    Write-Host "[load_csv_with_pooler] Usage: .\load_csv_with_pooler.ps1 -SupabaseUrl 'https://rkfffveonaskewwzghex.supabase.co' -Password 'Macvho7504' -Region 'us-east-1' [-StatusOnly] [-Truncate]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[load_csv_with_pooler] To find Session Pooler connection string:" -ForegroundColor Cyan
    Write-Host "  1. Go to Supabase Dashboard > Connect > Session pooler" -ForegroundColor Cyan
    Write-Host "  2. Copy the connection string" -ForegroundColor Cyan
    Write-Host "  3. Extract the region from the hostname (e.g., aws-0-us-east-1.pooler.supabase.com)" -ForegroundColor Cyan
    exit 1
}

# 프로젝트 참조 추출 (URL에서)
if ($SupabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $ProjectRef = $Matches[1]
} else {
    Write-Host "[load_csv_with_pooler] ERROR: Invalid Supabase URL format" -ForegroundColor Red
    exit 1
}

# Session Pooler 연결 문자열 구성
$PoolerUrl = "postgresql://postgres.${ProjectRef}:${Password}@aws-0-${Region}.pooler.supabase.com:5432/postgres?connect_timeout=10"
$env:SUPABASE_DB_URL = $PoolerUrl

Write-Host "[load_csv_with_pooler] Using Session Pooler: postgres.***@aws-0-${Region}.pooler.supabase.com:5432/postgres" -ForegroundColor Cyan

# 2. Python 스크립트 실행
$ScriptPath = Join-Path $PSScriptRoot "load_csv.py"
if (-not (Test-Path $ScriptPath)) {
    Write-Host "[load_csv_with_pooler] ERROR: load_csv.py not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

$Args = @()
if ($StatusOnly) {
    $Args += "--status-only"
}
if ($Truncate) {
    $Args += "--truncate"
}

Write-Host "[load_csv_with_pooler] Executing: python $ScriptPath $($Args -join ' ')" -ForegroundColor Yellow
python $ScriptPath $Args

if ($LASTEXITCODE -ne 0) {
    Write-Host "[load_csv_with_pooler] ERROR: Python script failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[load_csv_with_pooler] Done!" -ForegroundColor Green
