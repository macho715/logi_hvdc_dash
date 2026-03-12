# 🚀 다음 단계 - HVDC Dashboard 실행 가이드

## ✅ 구현 완료 항목

- ✅ `src/lib/worklist-utils.ts` - 계산 로직 (Python과 100% 일치)
- ✅ `src/app/api/worklist/route.ts` - API 엔드포인트
- ✅ `src/components/Dashboard.tsx` - UI 컴포넌트
- ✅ Linter 오류 없음

---

## 1️⃣ 환경 변수 설정

### `.env.local` 파일 생성

프로젝트 루트 디렉토리(`hvdc-dashboard/`)에 `.env.local` 파일 생성:

```bash
cd "c:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard"
```

`.env.local` 파일 내용:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

**⚠️ 중요**:
- 실제 Supabase 프로젝트의 값으로 교체하세요
- `.env.local`은 `.gitignore`에 추가되어 있어야 합니다
- Service Role Key는 절대 Git에 커밋하지 마세요!

### Supabase 키 확인 방법

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. Settings > API 메뉴
4. 다음 값 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2️⃣ 데이터베이스 준비

### 스키마 배포 확인

Supabase Dashboard > SQL Editor에서 다음 쿼리 실행하여 테이블 확인:

```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 결과에 다음이 있어야 함:
-- ✅ shipments
-- ✅ container_details
-- ✅ warehouse_inventory
-- ✅ financial_transactions
-- ✅ shipment_tracking_log
-- ✅ documents
```

### 데이터 확인

```sql
-- 선적 데이터 확인
SELECT COUNT(*) as total FROM shipments;

-- 샘플 데이터 확인
SELECT
    sct_ship_no,
    vendor,
    vessel_name,
    eta,
    status
FROM shipments
LIMIT 5;
```

**데이터가 없으면** 마이그레이션 스크립트 실행:

```bash
# Python 환경에서 실행
cd "c:\Users\minky\Downloads\HVDC DASH"
python scripts/hvdc_migration_script.py
```

---

## 3️⃣ 개발 서버 실행

### 의존성 설치 (처음 한 번만)

```bash
cd "c:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard"
npm install
```

### 서버 시작

```bash
# 포트 3001 사용 (package.json에 설정됨)
npm run dev

# 또는 직접 포트 지정
npx next dev -p 3001
```

**접속 URL**: http://localhost:3001

---

## 4️⃣ 테스트 체크리스트

### ✅ API 엔드포인트 테스트

브라우저 또는 curl로 테스트:

```bash
# API 직접 호출
curl http://localhost:3001/api/worklist

# 또는 브라우저에서
# http://localhost:3001/api/worklist
```

**예상 응답**:

```json
{
  "lastRefreshAt": "2026-01-15 14:30",
  "kpis": {
    "driAvg": 85.5,
    "wsiAvg": 0.0,
    "redCount": 3,
    "overdueCount": 5,
    "recoverableAED": 125000.50,
    "zeroStops": 0
  },
  "rows": [
    {
      "id": "...",
      "kind": "SHIPMENT",
      "title": "SCT-SHIP-001",
      "gate": "GREEN",
      "score": 95.5,
      ...
    }
  ]
}
```

### ✅ Dashboard UI 확인

1. 브라우저에서 http://localhost:3001 접속
2. 다음 항목 확인:

   - [ ] **KPI Strip** 표시
     - DRI Avg, WSI Avg, Red Count, Overdue, Recoverable (AED), Last Refresh

   - [ ] **Worklist Table** 표시
     - Gate 컬럼 (GREEN/AMBER/RED)
     - Title, ETA, Due, Location, Triggers, Score

   - [ ] **필터/검색** 동작
     - Gate 필터 (ALL/RED/AMBER/GREEN/ZERO)
     - Due 필터 (ALL/OVERDUE/DUE_7D)
     - 검색창 동작

   - [ ] **Detail Drawer** 동작
     - 행 클릭 시 우측(또는 모바일에서 overlay)에 Drawer 열림
     - Overview, Timeline, Docs, Warehouse, Cost, Evidence 탭

   - [ ] **Saved Views** 동작
     - 기본 뷰 (Today Ops, Red Gate, Overdue)
     - 새 뷰 저장 및 적용

---

## 5️⃣ 문제 해결

### 문제 1: "Cannot read properties of undefined"

**원인**: 환경 변수 미설정 또는 잘못된 값

**해결**:
```bash
# .env.local 파일 확인
cat .env.local  # Windows: type .env.local

# 값이 올바른지 확인 후 서버 재시작
npm run dev
```

### 문제 2: "relation 'shipments' does not exist"

**원인**: 데이터베이스 스키마 미배포

**해결**:
1. Supabase Dashboard > SQL Editor
2. `database/hvdc_logistics_schema.sql` 파일 내용 복사 후 실행

### 문제 3: API는 작동하지만 데이터가 비어있음

**원인**: DB에 데이터가 없음

**해결**:
```bash
# 마이그레이션 스크립트 실행
python scripts/hvdc_migration_script.py
```

### 문제 4: CORS 오류

**원인**: Next.js 개발 서버 설정 문제 (거의 발생하지 않음)

**해결**:
- Next.js는 자동으로 처리하므로 재시작만으로 해결
- 포트 충돌 시 다른 포트 사용: `npx next dev -p 3002`

### 문제 5: KPI가 모두 0.00 또는 0으로 표시

**가능한 원인**:
- 데이터는 있지만 Gate/Score 계산이 안 됨
- 날짜 필드가 NULL이 많음

**확인**:
```sql
-- 데이터 상태 확인
SELECT
    sct_ship_no,
    eta,
    do_collection_date,
    customs_start_date,
    delivery_date
FROM shipments
LIMIT 10;
```

---

## 6️⃣ 추가 기능 구현 (선택사항)

### WSI 계산 로직 추가

현재 `wsiAvg`는 0.00으로 고정되어 있습니다. 필요시 `worklist-utils.ts`의 `calculateKpis()` 함수에 로직 추가:

```typescript
// src/lib/worklist-utils.ts
// calculateKpis() 함수 내부
wsiAvg: calculateWsiAvg(worklistRows), // TODO: 구현 필요
```

### Zero Stops 계산 로직 추가

마찬가지로 `zeroStops`는 0으로 고정되어 있습니다.

---

## 7️⃣ 프로덕션 배포 (선택사항)

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서
cd "c:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard"
vercel

# 환경 변수 추가 (Vercel Dashboard에서도 가능)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## 📝 체크리스트 요약

- [ ] `.env.local` 파일 생성 및 값 설정
- [ ] Supabase 데이터베이스 스키마 배포 확인
- [ ] 데이터 존재 확인 (마이그레이션 필요 시 실행)
- [ ] `npm install` 실행
- [ ] `npm run dev` 실행
- [ ] http://localhost:3001 접속
- [ ] `/api/worklist` 엔드포인트 테스트
- [ ] Dashboard UI에서 데이터 표시 확인
- [ ] 필터/검색 기능 테스트
- [ ] Detail Drawer 동작 확인

---

## 🆘 지원

문제가 발생하면:

1. 브라우저 콘솔 확인 (F12 > Console)
2. 서버 로그 확인 (터미널 출력)
3. Supabase Dashboard에서 데이터 확인
4. `.env.local` 파일 다시 확인

---

**작성일**: 2026-01-15
**최종 업데이트**: Option A 구현 완료 후
