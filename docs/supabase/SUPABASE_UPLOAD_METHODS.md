# Supabase 데이터 업로드 방법 종합 가이드

> 네트워크 연결 문제나 환경 제약에 따라 선택할 수 있는 다양한 업로드 방법

---

## 📋 방법 비교

| 방법 | 난이도 | 네트워크 | 필요 도구 | 스키마 지원 | 권장 상황 |
|------|--------|----------|-----------|-------------|-----------|
| **1. Dashboard Table Editor** | ⭐ 쉬움 | ✅ 필요 | 브라우저만 | 모든 스키마 | **가장 권장** |
| **2. Python REST API** | ⭐⭐ 보통 | ✅ 필요 | Python + supabase-py | public만 | public 스키마만 |
| **3. Python psql (load_csv.py)** | ⭐⭐⭐ 어려움 | ❌ 실패 | psql + psycopg | 모든 스키마 | 네트워크 정상 시 |
| **4. Next.js API Route** | ⭐⭐ 보통 | ✅ 필요 | Next.js 서버 | public만 | 서버 실행 중일 때 |

---

## 방법 1: Dashboard Table Editor Import (⭐ 가장 권장)

### 장점
- ✅ 네트워크 연결 문제 없음
- ✅ 모든 스키마 지원 (status, case, public)
- ✅ psql/Python 불필요
- ✅ 브라우저만 있으면 됨
- ✅ 컬럼 매핑 자동/수동 선택 가능

### 단계
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Table Editor** → 스키마 선택 (`status`) → 테이블 선택 (`shipments_status`)
4. **Import data** → CSV 파일 업로드
5. **Import** 클릭

### 상세 가이드
👉 [SUPABASE_DASHBOARD_IMPORT_GUIDE.md](../supabase/SUPABASE_DASHBOARD_IMPORT_GUIDE.md)

---

## 방법 2: Python REST API 스크립트

### 장점
- ✅ psql 불필요
- ✅ HTTP REST API 사용 (네트워크 문제 적음)
- ✅ 자동화 가능

### 단점
- ❌ `status`, `case` 스키마는 REST API로 직접 접근 불가능
- ❌ `public` 스키마만 지원

### 실행 방법

#### 1. 패키지 설치
```bash
pip install supabase
```

#### 2. 환경 변수 설정
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "https://rkfffveonaskewwzghex.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
```

#### 3. 스크립트 실행
```bash
cd "c:\LOGI MASTER DASH"
python scripts/hvdc/load_csv_rest_api.py --status-only
```

### 제한사항
- `status.shipments_status`, `status.events_status`는 REST API로 직접 접근 불가능
- 이 경우 **방법 1 (Dashboard Import)** 사용 권장

---

## 방법 3: Python psql 스크립트 (load_csv.py)

### 장점
- ✅ 모든 스키마 지원
- ✅ UPSERT + FK 필터 지원
- ✅ 자동화 가능

### 단점
- ❌ 네트워크 연결 필요 (현재 DNS 해석 실패)
- ❌ psql 또는 psycopg 필요

### 실행 방법
```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:Macvho7504@db.rkfffveonaskewwzghex.supabase.co:5432/postgres"
python scripts/hvdc/load_csv.py --status-only
```

### 현재 문제
- DNS 해석 실패: `failed to resolve host 'db.rkfffveonaskewwzghex.supabase.co'`
- 해결: VPN 사용 또는 Session pooler 연결 문자열 사용

---

## 방법 4: Next.js API Route (서버 사이드)

### 장점
- ✅ 서버에서 실행 (환경 변수 자동 사용)
- ✅ HTTP REST API 사용

### 단점
- ❌ `status`, `case` 스키마는 REST API로 직접 접근 불가능
- ❌ Next.js 서버 실행 필요

### 실행 방법

#### 1. Next.js 서버 실행
```bash
cd apps/logistics-dashboard
pnpm dev
```

#### 2. API 호출
```bash
curl -X POST http://localhost:3001/api/upload-csv \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "public",
    "table": "locations",
    "csvPath": "hvdc_output/supabase/shipments_status.csv"
  }'
```

### 제한사항
- `status`, `case` 스키마는 지원하지 않음
- 이 경우 **방법 1 (Dashboard Import)** 사용 권장

---

## 🎯 권장 방법 선택 가이드

### 상황별 권장 방법

| 상황 | 권장 방법 |
|------|-----------|
| **네트워크 연결 문제** | 방법 1: Dashboard Table Editor |
| **public 스키마만 업로드** | 방법 2: Python REST API |
| **status/case 스키마 업로드** | 방법 1: Dashboard Table Editor |
| **자동화 필요 (public만)** | 방법 2: Python REST API |
| **자동화 필요 (모든 스키마)** | 방법 3: Python psql (네트워크 정상 시) |

---

## 📝 Status 레이어 업로드 (현재 상황)

**현재 필요한 작업:**
- `status.shipments_status` 업로드
- `status.events_status` 업로드

**권장 방법:**
👉 **방법 1: Dashboard Table Editor Import**

이유:
- `status` 스키마는 REST API로 직접 접근 불가능
- 네트워크 연결 문제로 psql 방법 실패
- 가장 간단하고 확실한 방법

---

## 🔗 관련 문서

- [SUPABASE_DASHBOARD_IMPORT_GUIDE.md](../supabase/SUPABASE_DASHBOARD_IMPORT_GUIDE.md) - Dashboard Import 상세 가이드
- [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - 전체 적재 계획
- [SUPABASE_LOADING_HYBRID_STRATEGY.md](../supabase/SUPABASE_LOADING_HYBRID_STRATEGY.md) - 하이브리드 전략

---

**Last updated**: 2026-01-25
