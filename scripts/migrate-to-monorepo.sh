#!/bin/bash
# Monorepo 이관 스크립트
# 사용법: bash scripts/migrate-to-monorepo.sh

set -e

echo "=========================================="
echo "Monorepo 이관 스크립트 시작"
echo "=========================================="

# 1. 디렉토리 생성
echo ""
echo "1. 디렉토리 생성 중..."
mkdir -p apps
mkdir -p packages
mkdir -p scripts
mkdir -p configs
mkdir -p supabase/migrations

echo "✅ 디렉토리 생성 완료"

# 2. HVDC Dashboard 이관
# NOTE: 레거시 폴더는 archive/legacy/hvdc-dash/로 이동되었습니다.
# 이 스크립트는 이미 완료된 마이그레이션을 위한 참고용입니다.
echo ""
echo "2. HVDC Dashboard 이관 중..."
if [ -d "archive/legacy/hvdc-dash/hvdc-dashboard" ]; then
  if [ -d "apps/hvdc-dashboard" ]; then
    echo "⚠️  apps/hvdc-dashboard 이미 존재합니다. 건너뜁니다."
  else
    cp -R "archive/legacy/hvdc-dash/hvdc-dashboard" apps/hvdc-dashboard
    echo "✅ HVDC Dashboard 이관 완료"
  fi
else
  echo "⚠️  archive/legacy/hvdc-dash/hvdc-dashboard 디렉토리를 찾을 수 없습니다."
fi

# 3. Logistics Dashboard 이관
# NOTE: 레거시 폴더는 archive/legacy/v0-logistics-dashboard/로 이동되었습니다.
echo ""
echo "3. Logistics Dashboard 이관 중..."
if [ -d "archive/legacy/v0-logistics-dashboard" ]; then
  if [ -d "apps/logistics-dashboard" ]; then
    echo "⚠️  apps/logistics-dashboard 이미 존재합니다. 건너뜁니다."
  else
    cp -R "archive/legacy/v0-logistics-dashboard" apps/logistics-dashboard
    echo "✅ Logistics Dashboard 이관 완료"
  fi
else
  echo "⚠️  archive/legacy/v0-logistics-dashboard 디렉토리를 찾을 수 없습니다."
fi

# 4. logiontology_scaffold 이관
# NOTE: 레거시 폴더는 archive/legacy/logiontology-scaffold/로 이동되었습니다.
echo ""
echo "4. logiontology_scaffold 이관 중..."
if [ -d "archive/legacy/logiontology-scaffold" ]; then
  # scripts 이관
  if [ -d "archive/legacy/logiontology-scaffold/scripts" ]; then
    cp -R "archive/legacy/logiontology-scaffold/scripts"/* scripts/ 2>/dev/null || true
    echo "✅ scripts 이관 완료"
  fi
  
  # configs 이관
  if [ -d "archive/legacy/logiontology-scaffold/configs" ]; then
    cp -R "archive/legacy/logiontology-scaffold/configs"/* configs/ 2>/dev/null || true
    echo "✅ configs 이관 완료"
  fi
  
  # models 이관 (선택)
  if [ -d "archive/legacy/logiontology-scaffold/models" ]; then
    mkdir -p scripts/models
    cp -R "archive/legacy/logiontology-scaffold/models"/* scripts/models/ 2>/dev/null || true
    echo "✅ models 이관 완료"
  fi
  
  # rules 이관 (선택)
  if [ -d "archive/legacy/logiontology-scaffold/rules" ]; then
    mkdir -p scripts/rules
    cp -R "archive/legacy/logiontology-scaffold/rules"/* scripts/rules/ 2>/dev/null || true
    echo "✅ rules 이관 완료"
  fi
else
  echo "⚠️  archive/legacy/logiontology-scaffold 디렉토리를 찾을 수 없습니다."
fi

# 5. Supabase 마이그레이션 파일 이관
echo ""
echo "5. Supabase 마이그레이션 파일 이관 중..."
if [ -f ".cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql" ]; then
  cp ".cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql" supabase/migrations/20260101_initial_schema.sql
  echo "✅ schema_v2_unified.sql 이관 완료"
else
  echo "⚠️  schema_v2_unified.sql 파일을 찾을 수 없습니다."
fi

# 5.1 Flow Code 마이그레이션 파일 확인
echo ""
echo "5.1 Flow Code 마이그레이션 파일 확인 중..."
if [ -f "supabase/migrations/20260123_add_flow_code_v35.sql" ]; then
  echo "✅ Flow Code 마이그레이션 파일 이미 존재합니다."
else
  echo "ℹ️  Flow Code 마이그레이션 파일은 수동으로 추가하세요:"
  echo "   supabase/migrations/20260123_add_flow_code_v35.sql"
  echo "   (참조: docs/migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md)"
fi

# 6. package.json 업데이트 (각 앱)
echo ""
echo "6. 앱별 package.json 업데이트 중..."

# HVDC Dashboard package.json 업데이트
if [ -f "apps/hvdc-dashboard/package.json" ]; then
  cat > apps/hvdc-dashboard/package.json << 'EOF'
{
  "name": "@repo/hvdc-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.90.1",
    "lucide-react": "^0.562.0",
    "next": "16.1.1",
    "next-pwa": "^5.6.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.27",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "cross-env": "^10.1.0",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "^4",
    "typescript": "5.9.3"
  }
}
EOF
  echo "✅ HVDC Dashboard package.json 업데이트 완료"
fi

# Logistics Dashboard package.json 업데이트
if [ -f "apps/logistics-dashboard/package.json" ]; then
  # 기존 package.json을 읽어서 name만 변경
  if command -v jq &> /dev/null; then
    jq '.name = "@repo/logistics-dashboard" | .scripts.dev = "next dev -p 3000" | .scripts.typecheck = "tsc --noEmit"' apps/logistics-dashboard/package.json > apps/logistics-dashboard/package.json.tmp
    mv apps/logistics-dashboard/package.json.tmp apps/logistics-dashboard/package.json
    echo "✅ Logistics Dashboard package.json 업데이트 완료"
  else
    echo "⚠️  jq가 설치되어 있지 않아 package.json을 자동 업데이트할 수 없습니다."
    echo "   수동으로 name을 '@repo/logistics-dashboard'로 변경하세요."
  fi
fi

echo ""
echo "=========================================="
echo "Monorepo 이관 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. pnpm install (루트에서 실행)"
echo "2. pnpm --filter hvdc-dashboard dev (HVDC Dashboard 실행)"
echo "3. pnpm --filter logistics-dashboard dev (Logistics Dashboard 실행)"
echo ""
