# HVDC Logistics Database - 완전 구현 가이드

Samsung C&T HVDC Lightning Project
Author: Cha Minkyu
Date: 2025-01-08

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [Supabase 프로젝트 설정](#supabase-프로젝트-설정)
3. [데이터베이스 스키마 배포](#데이터베이스-스키마-배포)
4. [데이터 마이그레이션](#데이터-마이그레이션)
5. [Next.js API 구현](#nextjs-api-구현)
6. [프론트엔드 통합](#프론트엔드-통합)
7. [실전 사용 예시](#실전-사용-예시)

---

## 시스템 개요

### 데이터베이스 구조

```
shipments (선적 마스터)
├── container_details (컨테이너 상세)
├── warehouse_inventory (창고 재고)
├── financial_transactions (재무 트랜잭션)
├── shipment_tracking_log (추적 로그)
└── documents (문서 관리)
```

### 주요 기능

- ✅ 81개 컬럼의 포괄적 선적 데이터 관리
- ✅ 자동 CIF 값 계산 (Invoice + Freight + Insurance)
- ✅ 상태 변경 자동 로깅
- ✅ 전문 검색 (GIN 인덱스)
- ✅ 실시간 통계 함수
- ✅ Row Level Security (RLS)
- ✅ 파일 업로드 지원 (Supabase Storage)
- ✅ 모바일 최적화 및 PWA 지원

---

## Supabase 프로젝트 설정

### 1단계: Supabase 프로젝트 생성

```bash
# 1. https://supabase.com 접속 및 로그인
# 2. "New Project" 클릭
# 3. 프로젝트 정보 입력:
#    - Name: hvdc-logistics
#    - Database Password: [강력한 비밀번호]
#    - Region: Southeast Asia (Singapore) - UAE와 가까움
#    - Pricing Plan: Pro (실전 사용) 또는 Free (테스트)
```

### 2단계: 환경 변수 설정

프로젝트 생성 후 Settings > API에서 다음 정보 복사:

```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (주의: 서버 전용)
```

### 3단계: Vercel 환경 변수 추가

```bash
# Vercel CLI 사용
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 또는 Vercel Dashboard에서 수동 추가
# Project Settings > Environment Variables
```

---

## 데이터베이스 스키마 배포

### 방법 1: Supabase Dashboard (권장)

```sql
-- 1. Supabase Dashboard > SQL Editor 접속
-- 2. hvdc_logistics_schema.sql 파일 내용 복사
-- 3. "Run" 버튼 클릭
-- 4. 성공 메시지 확인
```

### 4. Running the Development Server
Due to port conflicts on standard ports, we use port **3001**.

```bash
cd hvdc-dashboard
npm run dev
```

-   **Access**: http://localhost:3001

### 방법 2: Supabase CLI

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push

# 또는 SQL 파일 직접 실행
supabase db execute -f hvdc_logistics_schema.sql
```

### 스키마 검증

```sql
-- 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 결과 예상:
-- container_details
-- documents
-- financial_transactions
-- shipment_tracking_log
-- shipments
-- warehouse_inventory

-- 뷰 확인
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- 결과 예상:
-- v_financial_summary
-- v_shipment_overview
-- v_warehouse_status
```

---

## 데이터 마이그레이션

### 1단계: Python 환경 설정

```bash
# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 필요 패키지 설치
pip install pandas supabase openpyxl python-dotenv
```

### 2단계: 환경 변수 설정

```bash
# .env 파일 생성
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3단계: 마이그레이션 스크립트 실행

```bash
# 스크립트 실행
python hvdc_migration_script.py

# 진행 상황 확인
# Progress: 10/150 rows processed
# Progress: 20/150 rows processed
# ...
# Migration completed!
```

### 4단계: 데이터 검증

```sql
-- Supabase Dashboard > SQL Editor

-- 1. 선적 수 확인
SELECT COUNT(*) as total_shipments FROM shipments;

-- 2. 샘플 데이터 확인
SELECT
    sct_ship_no,
    vendor,
    port_of_loading,
    port_of_discharge,
    eta,
    status
FROM shipments
LIMIT 5;

-- 3. 통계 함수 테스트
SELECT * FROM get_shipment_statistics();

-- 4. 뷰 테스트
SELECT * FROM v_shipment_overview LIMIT 5;
```

---

## Next.js API 구현

### 프로젝트 구조

```
your-project/
├── app/
│   ├── api/
│   │   ├── worklist/
│   │   │   └── route.ts              # GET - Dashboard worklist data
│   │   ├── shipments/
│   │   │   ├── route.ts              # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PUT, DELETE
│   │   ├── statistics/
│   │   │   └── route.ts              # GET
│   │   └── upload/
│   │       └── route.ts              # POST (Excel upload)
│   └── ...
├── lib/
│   ├── supabase.ts                   # Supabase 클라이언트
│   └── worklist-utils.ts             # Worklist 변환 및 KPI 계산 유틸리티
└── ...
```

### 1단계: Supabase 클라이언트 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 2단계: 패키지 설치

```bash
npm install @supabase/supabase-js
```

### 3단계: API Routes 배포

제공된 파일들을 해당 위치에 복사:
- `api_shipments_route.ts` → `app/api/shipments/route.ts`
- `api_shipments_id_route.ts` → `app/api/shipments/[id]/route.ts`
- `api_statistics_route.ts` → `app/api/statistics/route.ts`

### 4단계: Worklist API 구현

Dashboard용 통합 API 엔드포인트:

```typescript
// app/api/worklist/route.ts
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { calculateKpis, getDubaiToday, shipmentToWorklistRow } from "@/lib/worklist-utils";

export async function GET(request: NextRequest) {
  // 1. Supabase에서 shipments 조회 (warehouse_inventory 포함)
  const { data: shipments } = await supabase
    .from("shipments")
    .select(`
      *,
      warehouse_inventory (*)
    `)
    .order("eta", { ascending: false, nullsLast: true });

  // 2. ShipmentRow[] → WorklistRow[] 변환
  const today = getDubaiToday();
  const worklistRows = shipments.map(s =>
    shipmentToWorklistRow(s, today)
  );

  // 3. KPI 계산
  const kpis = calculateKpis(worklistRows, today);

  // 4. Payload 반환
  return NextResponse.json({
    lastRefreshAt: getDubaiTimestamp(),
    kpis,
    rows: worklistRows
  });
}
```

**주요 기능**:
- Asia/Dubai 시간대 기준 날짜 처리
- KPI 자동 계산 (DRI Avg, Red Count, Overdue 등)
- Fallback 데이터 제공으로 에러 시 UI 안정성 확보

---

## 프론트엔드 통합

### React 컴포넌트 예시

```typescript
// components/ShipmentList.tsx
'use client'

import { useState, useEffect } from 'react'

interface Shipment {
  id: string
  sct_ship_no: string
  vendor: string
  vessel_name: string
  eta: string
  status: string
  total_containers: number
}

export default function ShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    from_date: '',
    to_date: ''
  })

  useEffect(() => {
    fetchShipments()
  }, [filters])

  async function fetchShipments() {
    setLoading(true)

    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.vendor) params.append('vendor', filters.vendor)
    if (filters.from_date) params.append('from_date', filters.from_date)
    if (filters.to_date) params.append('to_date', filters.to_date)

    const response = await fetch(`/api/shipments?${params}`)
    const result = await response.json()

    setShipments(result.data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">HVDC 선적 현황</h1>

      {/* 필터 */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">전체 상태</option>
          <option value="pending">대기</option>
          <option value="scheduled">예정</option>
          <option value="in_transit">운송중</option>
          <option value="arrived">도착</option>
          <option value="delivered">배송완료</option>
        </select>

        <input
          type="text"
          placeholder="공급업체"
          value={filters.vendor}
          onChange={(e) => setFilters({...filters, vendor: e.target.value})}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters({...filters, from_date: e.target.value})}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters({...filters, to_date: e.target.value})}
          className="border p-2 rounded"
        />
      </div>

      {/* 테이블 */}
      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">SCT SHIP NO</th>
            <th className="border p-2">공급업체</th>
            <th className="border p-2">선박명</th>
            <th className="border p-2">ETA</th>
            <th className="border p-2">컨테이너</th>
            <th className="border p-2">상태</th>
            <th className="border p-2">작업</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="hover:bg-gray-50">
              <td className="border p-2">{shipment.sct_ship_no}</td>
              <td className="border p-2">{shipment.vendor}</td>
              <td className="border p-2">{shipment.vessel_name}</td>
              <td className="border p-2">
                {new Date(shipment.eta).toLocaleDateString('ko-KR')}
              </td>
              <td className="border p-2 text-center">{shipment.total_containers}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  shipment.status === 'arrived' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shipment.status}
                </span>
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => window.location.href = `/shipments/${shipment.id}`}
                  className="text-blue-600 hover:underline"
                >
                  상세보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 대시보드 컴포넌트 (Worklist API 통합)

```typescript
// components/Dashboard.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'

export default function Dashboard() {
  const applyPayload = useDashboardStore((s) => s.applyPayload)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API에서 데이터 로드
  const fetchWorklist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/worklist")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const payload = await response.json()
      applyPayload(payload)
    } catch (err: any) {
      console.error("Failed to fetch worklist:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [applyPayload])

  useEffect(() => {
    fetchWorklist()
    // 5분마다 자동 갱신
    const interval = setInterval(fetchWorklist, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWorklist])

  return (
    <div className="flex flex-col gap-4">
      {loading && (
        <div className="rounded-lg border bg-white p-4 text-center text-sm text-slate-500">
          Loading worklist data...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Error: {error} (Using fallback data)
        </div>
      )}

      <KpiStrip />
      {/* Worklist Table, Detail Drawer 등 */}
    </div>
  )
}
```

**주요 기능**:
- `/api/worklist` 엔드포인트에서 데이터 로드
- 로딩 상태 및 에러 처리
- 5분마다 자동 갱신
- Zustand store를 통한 상태 관리

---

## 실전 사용 예시

### 1. Dashboard Worklist 조회

```bash
# Dashboard용 통합 데이터 조회 (KPI + Worklist Rows)
curl https://your-project.vercel.app/api/worklist

# 응답 예시:
# {
#   "lastRefreshAt": "2026-01-15 14:30",
#   "kpis": {
#     "driAvg": 85.5,
#     "wsiAvg": 0.0,
#     "redCount": 3,
#     "overdueCount": 5,
#     "recoverableAED": 125000.50,
#     "zeroStops": 0
#   },
#   "rows": [...]
# }
```

### 2. 선적 정보 조회

```bash
# 전체 선적 조회
curl https://your-project.vercel.app/api/shipments

# 특정 공급업체 필터링
curl "https://your-project.vercel.app/api/shipments?vendor=Prysmian"

# 기간 필터링
curl "https://your-project.vercel.app/api/shipments?from_date=2024-01-01&to_date=2024-12-31"

# 상태별 필터링
curl "https://your-project.vercel.app/api/shipments?status=in_transit"
```

### 3. 개별 선적 상세 조회

```bash
curl https://your-project.vercel.app/api/shipments/[shipment-id]
```

### 4. 통계 조회

```bash
curl https://your-project.vercel.app/api/statistics
```

### 5. 선적 정보 수정

```bash
curl -X PUT https://your-project.vercel.app/api/shipments/[id] \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "delivery_date": "2024-01-15"
  }'
```

### 6. Excel 대량 업로드 (프론트엔드)

```typescript
async function uploadExcel(file: File) {
  // 1. Excel 파싱 (Papa Parse 또는 xlsx 라이브러리 사용)
  const data = await parseExcelFile(file)

  // 2. 데이터 변환
  const shipments = data.map(row => ({
    sct_ship_no: row['SCT SHIP NO.'],
    vendor: row['VENDOR'],
    // ... 나머지 필드 매핑
  }))

  // 3. API 호출
  const response = await fetch('/api/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipments })
  })

  const result = await response.json()
  console.log(result.message)
}
```

---

## 고급 기능

### 실시간 구독 (Realtime)

```typescript
// 선적 상태 변경 실시간 감지
import { supabase } from '@/lib/supabase'

function useShipmentRealtime() {
  useEffect(() => {
    const channel = supabase
      .channel('shipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        (payload) => {
          console.log('Change detected:', payload)
          // UI 업데이트
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
```

### 파일 업로드 (Supabase Storage)

```typescript
// 송장/증빙서류 업로드
async function uploadDocument(
  shipmentId: string,
  file: File,
  documentType: string
) {
  // 1. Storage에 파일 업로드
  const filePath = `shipments/${shipmentId}/${file.name}`
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // 2. Documents 테이블에 메타데이터 저장
  const { data: docData } = await supabase
    .from('documents')
    .insert({
      shipment_id: shipmentId,
      document_type: documentType,
      document_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type
    })

  return docData
}
```

---

## 문제 해결

### 일반적인 오류

1. **"relation does not exist" 오류**
   - 스키마가 제대로 배포되지 않음
   - SQL Editor에서 스키마 재실행

2. **"permission denied" 오류**
   - RLS 정책 확인
   - Service Role Key 사용 확인

3. **데이터 마이그레이션 실패**
   - 날짜 형식 확인 (ISO 8601)
   - NULL 값 처리 확인
   - 로그에서 구체적 오류 확인

---

## 다음 단계

1. ✅ Supabase Auth 통합 (팀원별 권한 관리)
2. ✅ PDF 송장 OCR 처리 자동화
3. ✅ 이메일 알림 (지연 선적, 통관 완료 등)
4. ✅ 모바일 앱 연동 (PWA 완료)
5. ✅ Excel 직접 다운로드 기능

---

## 지원

문제가 발생하거나 추가 기능이 필요하면 언제든지 요청하세요!
