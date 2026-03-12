# 작업 내역 (Work Log)

## 2025-01-XX - 개발 환경 설정 및 코드 품질 개선

### 작업 요약
- 개발 서버 포트 불일치 문제 해결
- 환경 변수 관리 체계 구축
- 코드 품질 및 타입 안전성 개선
- 새 페이지 추가 (shipments 페이지)

---

## 1. 개발 서버 포트 불일치 수정

### 문제
- `README.md`와 `docs/IMPLEMENTATION_GUIDE.md`에 포트 3005 명시
- `package.json`의 dev 스크립트는 포트 3001 사용
- 문서와 실제 설정 불일치

### 해결
- `README.md` 포트 3005 → 3001로 변경
- `docs/IMPLEMENTATION_GUIDE.md` 포트 3005 → 3001로 변경
- 명령어를 `npx next dev -p 3005 --webpack` → `npm run dev`로 통일
- `--webpack` 플래그 제거 (package.json 스크립트 사용)

### 변경 파일
- `README.md`
- `docs/IMPLEMENTATION_GUIDE.md`

---

## 2. 환경 변수 관리 체계 구축

### 작업 내용

#### 2.1 `.env.example` 파일 생성
- 환경 변수 템플릿 파일 생성
- `hvdc-dashboard/.env.example` 추가
- 필요한 환경 변수 목록:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### 2.2 `.gitignore` 업데이트
- `.env.example` 파일을 커밋 가능하도록 예외 처리
- `.env*` 패턴에서 `!.env.example` 추가

#### 2.3 README 업데이트
- Prerequisites 섹션에 환경 변수 설정 안내 추가
- `.env.example`을 `.env.local`로 복사하는 방법 명시

### 변경 파일
- `hvdc-dashboard/.env.example` (신규 생성)
- `hvdc-dashboard/.gitignore`
- `hvdc-dashboard/README.md`

---

## 3. 환경 변수 검증 추가 (타입 안전성 개선)

### 문제
- 환경 변수에 non-null assertion (`!`) 사용
- 런타임에서 환경 변수 누락 시 명확한 오류 메시지 부재

### 해결
- 환경 변수에 대한 명시적 null 체크 추가
- 명확한 에러 메시지 제공
- 타입 안전성 향상

### 변경 파일

#### 3.1 `src/lib/supabase.ts`
```typescript
// 변경 전
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 변경 후
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for Supabase client.')
}
// ... (각 환경 변수별 검증 추가)
```

#### 3.2 `src/app/api/shipments/[id]/route.ts`
- 동일한 패턴으로 환경 변수 검증 추가
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 검증

### 효과
- 환경 변수 누락 시 즉시 명확한 오류 메시지 제공
- 개발 초기 단계에서 설정 문제 조기 발견 가능
- 타입 안전성 향상

---

## 4. Shipments 페이지 추가

### 작업 내용
- `/shipments` 경로에 새로운 페이지 생성
- 반응형 디자인 적용:
  - 모바일 (lg 미만): `MobileShipmentList` 컴포넌트
  - 데스크톱 (lg 이상): `DashboardLayout`로 감싼 `ShipmentList` 컴포넌트

### 변경 파일
- `hvdc-dashboard/src/app/shipments/page.tsx` (신규 생성)

### 구현 상세
```typescript
export default function ShipmentsPage() {
    return (
        <>
            <div className="lg:hidden">
                <MobileShipmentList />
            </div>
            <div className="hidden lg:block">
                <DashboardLayout>
                    <ShipmentList />
                </DashboardLayout>
            </div>
        </>
    )
}
```

---

## 5. CHANGELOG.md 생성

### 작업 내용
- 프로젝트 루트에 `CHANGELOG.md` 파일 생성
- 작업 내역 기록을 위한 구조 마련

### 변경 파일
- `CHANGELOG.md` (신규 생성)

---

## 기술 스택 및 도구

- **프레임워크**: Next.js 16
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase (PostgreSQL)
- **포트**: 3001 (개발 서버)

---

## 참고 사항

- 모든 변경사항은 기존 기능에 영향을 주지 않도록 신중히 적용
- 타입 안전성과 개발자 경험 개선에 중점
- 문서와 실제 코드의 일관성 유지

---

---

## 6. Worklist API 구현 및 Dashboard 통합

### 작업 내용

#### 6.1 `/api/worklist` 엔드포인트 구현
- Dashboard용 통합 데이터 API 엔드포인트 생성
- Supabase에서 shipments 데이터 조회 및 변환
- KPI 계산 로직 통합
- Asia/Dubai 시간대 일관성 확보

#### 6.2 `worklist-utils.ts` 유틸리티 함수 구현
- `shipmentToWorklistRow()`: DB shipment 데이터를 WorklistRow 형식으로 변환
- `calculateKpis()`: DRI Avg, WSI Avg, Red Count, Overdue Count, Recoverable AED 계산
- `getDubaiToday()`: Asia/Dubai 시간대 기준 오늘 날짜 반환
- `getDubaiDateAfterDays()`: Asia/Dubai 시간대 기준 N일 후 날짜 계산
- Python 구현과 100% 일치하는 계산 로직 보장

#### 6.3 Dashboard 컴포넌트 API 통합
- Mock 데이터 대신 `/api/worklist` 엔드포인트 사용
- 로딩 상태 및 에러 처리 추가
- 5분마다 자동 갱신 기능 구현
- Fallback 데이터 제공으로 UI 안정성 확보

#### 6.4 Asia/Dubai 시간대 처리
- 모든 날짜 비교 로직에 Asia/Dubai 시간대 적용
- API와 UI 간 날짜 기준 일관성 유지
- `getDubaiToday()` 함수로 중앙화된 날짜 관리

### 변경 파일
- `hvdc-dashboard/src/app/api/worklist/route.ts` (신규 생성)
- `hvdc-dashboard/src/lib/worklist-utils.ts` (신규 생성)
- `hvdc-dashboard/src/components/Dashboard.tsx` (API 통합)
- `hvdc-dashboard/src/components/dashboard/WorklistTable.tsx` (Asia/Dubai 시간대 적용)
- `hvdc-dashboard/src/components/dashboard/KpiStrip.tsx` (안전한 값 처리)

### 구현 상세

#### API 엔드포인트 구조
```typescript
GET /api/worklist
Response: {
  lastRefreshAt: "2026-01-15 14:30",
  kpis: {
    driAvg: 85.5,
    wsiAvg: 0.0,
    redCount: 3,
    overdueCount: 5,
    recoverableAED: 125000.50,
    zeroStops: 0
  },
  rows: WorklistRow[]
}
```

#### KPI 계산 로직
- **DRI Avg**: 모든 shipment의 DRI 점수 평균
- **WSI Avg**: 현재 0.0 (구현 예정)
- **Red Count**: Gate가 "RED"인 shipment 수
- **Overdue Count**: Due Date가 오늘보다 이전인 shipment 수
- **Recoverable AED**: Duty + VAT 합계

### 효과
- Dashboard가 실시간 DB 데이터를 표시
- API와 UI 간 날짜 기준 일관성 확보
- KPI 자동 계산으로 수동 작업 감소
- 에러 발생 시에도 UI 안정성 유지

---

## 다음 작업 제안

- [ ] 다른 API 라우트에도 환경 변수 검증 패턴 적용 확인
- [ ] 환경 변수 검증을 위한 공통 유틸리티 함수 고려
- [ ] 테스트 코드 작성 (환경 변수 검증 로직)
- [ ] WSI Avg 계산 로직 구현
- [ ] Zero Stops 계산 로직 구현