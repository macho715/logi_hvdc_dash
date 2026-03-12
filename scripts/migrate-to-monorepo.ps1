# Monorepo 이관 스크립트 (PowerShell)
# 사용법: .\scripts\migrate-to-monorepo.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Monorepo 이관 스크립트 시작" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 디렉토리 생성
Write-Host ""
Write-Host "1. 디렉토리 생성 중..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "apps" | Out-Null
New-Item -ItemType Directory -Force -Path "packages" | Out-Null
New-Item -ItemType Directory -Force -Path "scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "configs" | Out-Null
New-Item -ItemType Directory -Force -Path "supabase\migrations" | Out-Null
Write-Host "✅ 디렉토리 생성 완료" -ForegroundColor Green

# 2. HVDC Dashboard 이관
# NOTE: 레거시 폴더는 archive/legacy/hvdc-dash/로 이동되었습니다.
# 이 스크립트는 이미 완료된 마이그레이션을 위한 참고용입니다.
Write-Host ""
Write-Host "2. HVDC Dashboard 이관 중..." -ForegroundColor Yellow
if (Test-Path "archive\legacy\hvdc-dash\hvdc-dashboard") {
  if (Test-Path "apps\hvdc-dashboard") {
    Write-Host "⚠️  apps\hvdc-dashboard 이미 존재합니다. 건너뜁니다." -ForegroundColor Yellow
  } else {
    Copy-Item -Path "archive\legacy\hvdc-dash\hvdc-dashboard" -Destination "apps\hvdc-dashboard" -Recurse
    Write-Host "✅ HVDC Dashboard 이관 완료" -ForegroundColor Green
  }
} else {
  Write-Host "⚠️  archive\legacy\hvdc-dash\hvdc-dashboard 디렉토리를 찾을 수 없습니다." -ForegroundColor Yellow
}

# 3. Logistics Dashboard 이관
# NOTE: 레거시 폴더는 archive/legacy/v0-logistics-dashboard/로 이동되었습니다.
Write-Host ""
Write-Host "3. Logistics Dashboard 이관 중..." -ForegroundColor Yellow
if (Test-Path "archive\legacy\v0-logistics-dashboard") {
  if (Test-Path "apps\logistics-dashboard") {
    Write-Host "⚠️  apps\logistics-dashboard 이미 존재합니다. 건너뜁니다." -ForegroundColor Yellow
  } else {
    Copy-Item -Path "archive\legacy\v0-logistics-dashboard" -Destination "apps\logistics-dashboard" -Recurse
    Write-Host "✅ Logistics Dashboard 이관 완료" -ForegroundColor Green
  }
} else {
  Write-Host "⚠️  archive\legacy\v0-logistics-dashboard 디렉토리를 찾을 수 없습니다." -ForegroundColor Yellow
}

# 4. logiontology_scaffold 이관
# NOTE: 레거시 폴더는 archive/legacy/logiontology-scaffold/로 이동되었습니다.
Write-Host ""
Write-Host "4. logiontology_scaffold 이관 중..." -ForegroundColor Yellow
if (Test-Path "archive\legacy\logiontology-scaffold") {
  # scripts 이관
  if (Test-Path "archive\legacy\logiontology-scaffold\scripts") {
    Copy-Item -Path "archive\legacy\logiontology-scaffold\scripts\*" -Destination "scripts\" -Recurse -Force
    Write-Host "✅ scripts 이관 완료" -ForegroundColor Green
  }
  
  # configs 이관
  if (Test-Path "archive\legacy\logiontology-scaffold\configs") {
    Copy-Item -Path "archive\legacy\logiontology-scaffold\configs\*" -Destination "configs\" -Recurse -Force
    Write-Host "✅ configs 이관 완료" -ForegroundColor Green
  }
  
  # models 이관 (선택)
  if (Test-Path "archive\legacy\logiontology-scaffold\models") {
    New-Item -ItemType Directory -Force -Path "scripts\models" | Out-Null
    Copy-Item -Path "archive\legacy\logiontology-scaffold\models\*" -Destination "scripts\models\" -Recurse -Force
    Write-Host "✅ models 이관 완료" -ForegroundColor Green
  }
  
  # rules 이관 (선택)
  if (Test-Path "archive\legacy\logiontology-scaffold\rules") {
    New-Item -ItemType Directory -Force -Path "scripts\rules" | Out-Null
    Copy-Item -Path "archive\legacy\logiontology-scaffold\rules\*" -Destination "scripts\rules\" -Recurse -Force
    Write-Host "✅ rules 이관 완료" -ForegroundColor Green
  }
} else {
  Write-Host "⚠️  archive\legacy\logiontology-scaffold 디렉토리를 찾을 수 없습니다." -ForegroundColor Yellow
}

# 5. Supabase 마이그레이션 파일 이관
Write-Host ""
Write-Host "5. Supabase 마이그레이션 파일 이관 중..." -ForegroundColor Yellow
if (Test-Path ".cursor\skills\supabase-unified-schema\assets\schema_v2_unified.sql") {
  Copy-Item -Path ".cursor\skills\supabase-unified-schema\assets\schema_v2_unified.sql" -Destination "supabase\migrations\20260101_initial_schema.sql"
  Write-Host "✅ schema_v2_unified.sql 이관 완료" -ForegroundColor Green
} else {
  Write-Host "⚠️  schema_v2_unified.sql 파일을 찾을 수 없습니다." -ForegroundColor Yellow
}

# 5.1 Flow Code 마이그레이션 파일 확인
Write-Host ""
Write-Host "5.1 Flow Code 마이그레이션 파일 확인 중..." -ForegroundColor Yellow
if (Test-Path "supabase\migrations\20260123_add_flow_code_v35.sql") {
  Write-Host "✅ Flow Code 마이그레이션 파일 이미 존재합니다." -ForegroundColor Green
} else {
  Write-Host "ℹ️  Flow Code 마이그레이션 파일은 수동으로 추가하세요:" -ForegroundColor Cyan
  Write-Host "   supabase/migrations/20260123_add_flow_code_v35.sql" -ForegroundColor Cyan
  Write-Host "   (참조: docs/migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md)" -ForegroundColor Cyan
}

# 6. package.json 업데이트 (각 앱)
Write-Host ""
Write-Host "6. 앱별 package.json 업데이트 중..." -ForegroundColor Yellow

# HVDC Dashboard package.json 업데이트
if (Test-Path "apps\hvdc-dashboard\package.json") {
  $hvdcPackageJson = @{
    name = "@repo/hvdc-dashboard"
    version = "0.1.0"
    private = $true
    scripts = @{
      dev = "next dev -p 3001"
      build = "next build"
      start = "next start"
      lint = "eslint"
      typecheck = "tsc --noEmit"
    }
    dependencies = @{
      "@supabase/supabase-js" = "^2.90.1"
      "lucide-react" = "^0.562.0"
      "next" = "16.1.1"
      "next-pwa" = "^5.6.0"
      "react" = "19.2.3"
      "react-dom" = "19.2.3"
      "zustand" = "^5.0.9"
    }
    devDependencies = @{
      "@tailwindcss/postcss" = "^4"
      "@types/node" = "^20.19.27"
      "@types/react" = "^19.2.7"
      "@types/react-dom" = "^19.2.3"
      "cross-env" = "^10.1.0"
      "eslint" = "^9"
      "eslint-config-next" = "16.1.1"
      "tailwindcss" = "^4"
      "typescript" = "5.9.3"
    }
  }
  $hvdcPackageJson | ConvertTo-Json -Depth 10 | Set-Content "apps\hvdc-dashboard\package.json"
  Write-Host "✅ HVDC Dashboard package.json 업데이트 완료" -ForegroundColor Green
}

# Logistics Dashboard package.json 업데이트
if (Test-Path "apps\logistics-dashboard\package.json") {
  $logisticsPackageJson = Get-Content "apps\logistics-dashboard\package.json" | ConvertFrom-Json
  $logisticsPackageJson.name = "@repo/logistics-dashboard"
  $logisticsPackageJson.scripts.dev = "next dev -p 3000"
  $logisticsPackageJson.scripts.typecheck = "tsc --noEmit"
  $logisticsPackageJson | ConvertTo-Json -Depth 10 | Set-Content "apps\logistics-dashboard\package.json"
  Write-Host "✅ Logistics Dashboard package.json 업데이트 완료" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Monorepo 이관 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. pnpm install (루트에서 실행)"
Write-Host "2. pnpm --filter hvdc-dashboard dev (HVDC Dashboard 실행)"
Write-Host "3. pnpm --filter logistics-dashboard dev (Logistics Dashboard 실행)"
Write-Host ""
