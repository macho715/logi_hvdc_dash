# Vercel 프로젝트 Root Directory 설정 스크립트
# 사용법: $env:VERCEL_TOKEN="your-token"; .\scripts\set-vercel-root-directory.ps1

$ErrorActionPreference = 'Stop'

# 프로젝트 정보 읽기
$projectJson = Get-Content ".vercel\project.json" | ConvertFrom-Json
$projectId = $projectJson.projectId
$orgId = $projectJson.orgId
$rootDirectory = "apps/logistics-dashboard"

if (-not $env:VERCEL_TOKEN) {
    Write-Error "VERCEL_TOKEN 환경 변수가 설정되지 않았습니다."
    Write-Host "Vercel 대시보드에서 토큰을 생성하세요: https://vercel.com/account/tokens"
    exit 1
}

Write-Host "프로젝트 ID: $projectId"
Write-Host "조직 ID: $orgId"
Write-Host "Root Directory: $rootDirectory"
Write-Host ""

# Vercel API로 프로젝트 업데이트
$url = "https://api.vercel.com/v9/projects/$projectId?teamId=$orgId"
$headers = @{
    "Authorization" = "Bearer $env:VERCEL_TOKEN"
    "Content-Type" = "application/json"
}
$body = @{
    rootDirectory = $rootDirectory
} | ConvertTo-Json

Write-Host "Vercel API로 Root Directory 설정 중..."
try {
    $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body $body
    Write-Host "✅ 성공! Root Directory가 '$rootDirectory'로 설정되었습니다." -ForegroundColor Green
    Write-Host "프로젝트: $($response.name)" -ForegroundColor Cyan
} catch {
    Write-Error "❌ 실패: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답: $responseBody" -ForegroundColor Red
    }
    exit 1
}
