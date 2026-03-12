# Vercel Deployment Diagnostic Script
# Validates current configuration and identifies issues

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Deployment Diagnostic Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check root package.json
Write-Host "1. Root package.json Validation" -ForegroundColor Yellow
$rootPackageJson = Get-Content "package.json" | ConvertFrom-Json

$hasNextInRoot = $false
if ($rootPackageJson.devDependencies.PSObject.Properties.Name -contains "next") {
    $hasNextInRoot = $true
    $nextVersion = $rootPackageJson.devDependencies.next
    Write-Host "  [OK] Next.js found: $nextVersion (devDependencies)" -ForegroundColor Green
} elseif ($rootPackageJson.dependencies.PSObject.Properties.Name -contains "next") {
    $hasNextInRoot = $true
    $nextVersion = $rootPackageJson.dependencies.next
    Write-Host "  [OK] Next.js found: $nextVersion (dependencies)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Next.js not found in root package.json" -ForegroundColor Red
}

$hasPackageManager = $rootPackageJson.PSObject.Properties.Name -contains "packageManager"
if ($hasPackageManager) {
    Write-Host "  [OK] packageManager field: $($rootPackageJson.packageManager)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] packageManager field missing" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check vercel.json
Write-Host "2. vercel.json Configuration Validation" -ForegroundColor Yellow
if (Test-Path "vercel.json") {
    $vercelConfig = Get-Content "vercel.json" | ConvertFrom-Json
    
    Write-Host "  [OK] vercel.json exists" -ForegroundColor Green
    Write-Host "  - Framework: $($vercelConfig.framework)" -ForegroundColor Cyan
    Write-Host "  - Install Command: $($vercelConfig.installCommand)" -ForegroundColor Cyan
    Write-Host "  - Build Command: $($vercelConfig.buildCommand)" -ForegroundColor Cyan
    Write-Host "  - Output Directory: $($vercelConfig.outputDirectory)" -ForegroundColor Cyan
    
    if ($vercelConfig.PSObject.Properties.Name -contains "rootDirectory") {
        Write-Host "  [WARN] rootDirectory in vercel.json (not supported in schema)" -ForegroundColor Yellow
        Write-Host "         -> Must be set in Vercel Dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "  [WARN] rootDirectory not in vercel.json" -ForegroundColor Yellow
        Write-Host "         -> Must set to 'apps/logistics-dashboard' in Vercel Dashboard" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] vercel.json not found" -ForegroundColor Red
}

Write-Host ""

# 3. Check app package.json
Write-Host "3. apps/logistics-dashboard/package.json Validation" -ForegroundColor Yellow
$appPackageJsonPath = "apps/logistics-dashboard/package.json"
if (Test-Path $appPackageJsonPath) {
    $appPackageJson = Get-Content $appPackageJsonPath | ConvertFrom-Json
    
    Write-Host "  [OK] package.json exists" -ForegroundColor Green
    Write-Host "  - Package Name: $($appPackageJson.name)" -ForegroundColor Cyan
    
    if ($appPackageJson.dependencies.PSObject.Properties.Name -contains "next") {
        $appNextVersion = $appPackageJson.dependencies.next
        Write-Host "  [OK] Next.js found: $appNextVersion (dependencies)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Next.js not found in app package.json" -ForegroundColor Red
    }
    
    if ($appPackageJson.scripts.PSObject.Properties.Name -contains "build") {
        Write-Host "  [OK] Build script: $($appPackageJson.scripts.build)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Build script missing" -ForegroundColor Red
    }
} else {
    Write-Host "  [ERROR] $appPackageJsonPath not found" -ForegroundColor Red
}

Write-Host ""

# 4. Check directory structure
Write-Host "4. Directory Structure Validation" -ForegroundColor Yellow
$expectedDirs = @("apps", "apps/logistics-dashboard", "packages")
foreach ($dir in $expectedDirs) {
    if (Test-Path $dir) {
        Write-Host "  [OK] $dir/ exists" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $dir/ missing" -ForegroundColor Red
    }
}

Write-Host ""

# 5. Check .vercel project settings
Write-Host "5. Vercel Project Link Check" -ForegroundColor Yellow
if (Test-Path ".vercel/project.json") {
    $projectJson = Get-Content ".vercel/project.json" | ConvertFrom-Json
    Write-Host "  [OK] Vercel project linked" -ForegroundColor Green
    Write-Host "  - Project ID: $($projectJson.projectId)" -ForegroundColor Cyan
    Write-Host "  - Project Name: $($projectJson.projectName)" -ForegroundColor Cyan
    Write-Host "  - Org ID: $($projectJson.orgId)" -ForegroundColor Cyan
} else {
    Write-Host "  [WARN] .vercel/project.json not found (run 'vercel link')" -ForegroundColor Yellow
}

Write-Host ""

# 6. Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$issues = @()
$warnings = @()

if (-not $hasNextInRoot) {
    $issues += "Next.js dependency missing in root package.json"
}

if (-not (Test-Path "vercel.json")) {
    $issues += "vercel.json file missing"
}

if (-not (Test-Path $appPackageJsonPath)) {
    $issues += "apps/logistics-dashboard/package.json missing"
}

if (Test-Path "vercel.json") {
    $vercelConfig = Get-Content "vercel.json" | ConvertFrom-Json
    if (-not ($vercelConfig.PSObject.Properties.Name -contains "rootDirectory")) {
        $warnings += "Set Root Directory to 'apps/logistics-dashboard' in Vercel Dashboard"
    }
}

if ($issues.Count -eq 0) {
    Write-Host "[OK] All required settings are correctly configured!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Issues found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "[WARN] Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Recommended Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($warnings -match "Root Directory") {
    Write-Host ""
    Write-Host "1. Set Root Directory in Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/chas-projects-08028e73/logimasterdash/settings" -ForegroundColor Cyan
    Write-Host "   -> General -> Root Directory -> 'apps/logistics-dashboard'" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "2. Check deployment status:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/chas-projects-08028e73/logimasterdash/deployments" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Check build logs:" -ForegroundColor Yellow
Write-Host "   Check latest deployment build logs for 'No Next.js version detected' error" -ForegroundColor Cyan
Write-Host ""
