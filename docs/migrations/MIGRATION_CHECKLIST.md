# Monorepo 이관 실행 전 체크리스트

**작성일**: 2026-01-23  
**참조**: [PROJECT_COMPARISON_AND_MIGRATION_PLAN.md](./PROJECT_COMPARISON_AND_MIGRATION_PLAN.md)

---

## ✅ 실행 전 필수 확인 사항

### 1. 백업 확인

- [ ] Git 커밋 상태 확인
  ```bash
  git status
  git add .
  git commit -m "chore: prepare for monorepo migration"
  ```

- [ ] 원본 프로젝트 디렉토리 백업 (선택)
  - `HVDC DASH/hvdc-dashboard/` 백업
  - `v0-logistics-dashboard-build-main/` 백업

### 2. 필수 디렉토리 확인

- [ ] `HVDC DASH/hvdc-dashboard/` 존재 확인
- [ ] `v0-logistics-dashboard-build-main/` 존재 확인
- [ ] `logiontology_scaffold_2026-01-23/` 존재 확인
- [ ] `.cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql` 존재 확인

### 3. 실행 권한 확인 (Windows)

- [ ] PowerShell 실행 정책 확인
  ```powershell
  Get-ExecutionPolicy
  ```
  
- [ ] Restricted인 경우 실행 정책 변경
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### 4. 필수 도구 확인

- [ ] Node.js 20+ 설치 확인
  ```bash
  node --version
  ```

- [ ] pnpm 9+ 설치 확인
  ```bash
  pnpm --version
  ```

- [ ] Git 설치 확인
  ```bash
  git --version
  ```

---

## 🚀 실행 단계

### Step 1: 스크립트 실행

#### Windows (PowerShell)

```powershell
# 1. 프로젝트 루트로 이동
cd "c:\LOGI MASTER DASH"

# 2. 스크립트 실행
.\scripts\migrate-to-monorepo.ps1
```

#### Linux/Mac (Bash)

```bash
# 1. 스크립트 실행 권한 부여
chmod +x scripts/migrate-to-monorepo.sh

# 2. 스크립트 실행
bash scripts/migrate-to-monorepo.sh
```

### Step 2: 의존성 설치

```bash
# 루트에서 실행
pnpm install
```

### Step 3: 검증

#### HVDC Dashboard 검증

```bash
# 개발 서버 실행
pnpm --filter hvdc-dashboard dev

# 확인 사항:
# - 포트 3001에서 정상 실행
# - Supabase 연동 정상 작동
# - /api/worklist 엔드포인트 정상 작동
```

#### Logistics Dashboard 검증

```bash
# 개발 서버 실행
pnpm --filter logistics-dashboard dev

# 확인 사항:
# - 포트 3000에서 정상 실행
# - MapView 정상 렌더링
# - Mock 데이터 정상 작동
```

---

## ⚠️ 주의사항

### 1. 기존 디렉토리 충돌

- `apps/` 디렉토리가 이미 존재하면 스크립트가 건너뜀
- 강제 이관이 필요하면 수동 삭제 후 재실행:
  ```powershell
  Remove-Item -Recurse -Force apps
  .\scripts\migrate-to-monorepo.ps1
  ```

### 2. Flow Code 마이그레이션 파일

- `supabase/migrations/20260123_add_flow_code_v35.sql`은 수동 추가 필요
- 이전에 생성한 마이그레이션 파일이 있다면 복사:
  ```powershell
  Copy-Item -Path "path\to\20260123_add_flow_code_v35.sql" -Destination "supabase\migrations\"
  ```

### 3. 환경 변수

- 각 앱의 `.env.local` 파일 확인
- Supabase URL/Key 설정 확인
- 루트 `.env.local` 파일 생성 (선택)

---

## 🔍 실행 후 검증 체크리스트

### 디렉토리 구조 확인

- [ ] `apps/hvdc-dashboard/` 존재
- [ ] `apps/logistics-dashboard/` 존재
- [ ] `scripts/` 디렉토리에 파일 이관됨
- [ ] `configs/` 디렉토리에 파일 이관됨
- [ ] `supabase/migrations/` 디렉토리에 파일 이관됨

### package.json 확인

- [ ] 루트 `package.json` 존재
- [ ] `apps/hvdc-dashboard/package.json` name이 `@repo/hvdc-dashboard`
- [ ] `apps/logistics-dashboard/package.json` name이 `@repo/logistics-dashboard`

### 의존성 설치 확인

- [ ] `pnpm install` 성공
- [ ] `node_modules/` 생성됨
- [ ] 각 앱의 `node_modules/` 생성됨

### 실행 확인

- [ ] HVDC Dashboard 정상 실행 (포트 3001)
- [ ] Logistics Dashboard 정상 실행 (포트 3000)
- [ ] 각 앱의 기능 정상 작동

---

## 📝 문제 해결

### 문제 1: PowerShell 실행 정책 오류

**오류 메시지**:
```
cannot be loaded because running scripts is disabled on this system
```

**해결 방법**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 문제 2: pnpm 설치 실패

**오류 메시지**:
```
pnpm: command not found
```

**해결 방법**:
```bash
# npm으로 pnpm 설치
npm install -g pnpm@9

# 또는 corepack 사용
corepack enable
corepack prepare pnpm@9 --activate
```

### 문제 3: 포트 충돌

**오류 메시지**:
```
Port 3000 is already in use
```

**해결 방법**:
- 다른 프로세스 종료
- 또는 `package.json`에서 포트 변경

---

## 📚 참조 문서

- [PROJECT_COMPARISON_AND_MIGRATION_PLAN.md](./PROJECT_COMPARISON_AND_MIGRATION_PLAN.md) - 프로젝트 비교 분석
- [INTEGRATION_STATUS_COMPREHENSIVE.md](./INTEGRATION_STATUS_COMPREHENSIVE.md) - 통합 상태 종합 리포트
- [FLOW_CODE_V35_MIGRATION_GUIDE.md](./migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md) - Flow Code 마이그레이션 가이드

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-01-23
