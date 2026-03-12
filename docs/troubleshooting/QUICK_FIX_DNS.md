# DNS 해석 실패 빠른 해결 가이드

> Python에서 `failed to resolve host` 오류 발생 시

---

## 🚀 빠른 해결: Session Pooler 사용

### 1단계: Supabase Dashboard에서 Session Pooler 정보 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 상단 **"Connect"** 버튼 클릭
4. **"Session pooler"** 탭 선택
5. 연결 문자열에서 **리전(Region)** 확인
   - 예: `aws-0-us-east-1.pooler.supabase.com` → 리전: `us-east-1`
   - 예: `aws-0-ap-northeast-1.pooler.supabase.com` → 리전: `ap-northeast-1`

### 2단계: PowerShell 스크립트 실행

```powershell
cd "c:\LOGI MASTER DASH"

# 방법 A: PowerShell 스크립트 사용 (권장)
.\scripts\hvdc\load_csv_with_pooler.ps1 `
  -SupabaseUrl "https://rkfffveonaskewwzghex.supabase.co" `
  -Password "Macvho7504" `
  -Region "us-east-1" `  # Dashboard에서 확인한 리전
  -StatusOnly

# 방법 B: 직접 환경 변수 설정
$env:SUPABASE_DB_URL = "postgresql://postgres.rkfffveonaskewwzghex:Macvho7504@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connect_timeout=10"
python scripts/hvdc/load_csv.py --status-only
```

---

## 🔍 리전 확인 방법

### Supabase Dashboard에서

1. **Settings** → **Database** → **Connection string**
2. **Session** pooler 선택
3. 호스트명에서 리전 추출:
   - `aws-0-[REGION].pooler.supabase.com`
   - 예: `aws-0-us-east-1` → 리전: `us-east-1`

### 일반적인 리전

- `us-east-1` (미국 동부)
- `us-west-1` (미국 서부)
- `ap-northeast-1` (일본)
- `ap-southeast-1` (싱가포르)
- `eu-west-1` (유럽)

---

## ✅ 해결 확인

스크립트 실행 후 다음 메시지가 보이면 성공:

```
[load_csv] Connecting to database (timeout=10s)...
[load_csv] Database: postgresql://postgres.***@aws-0-us-east-1.pooler.supabase.com:5432/postgres
[load_csv] Loading status.shipments_status from shipments_status.csv...
[load_csv] Loaded X rows into status.shipments_status
```

---

## ❌ 여전히 실패하는 경우

### 대안 1: Dashboard Table Editor Import
👉 [SUPABASE_DASHBOARD_IMPORT_GUIDE.md](../supabase/SUPABASE_DASHBOARD_IMPORT_GUIDE.md)

### 대안 2: 다른 업로드 방법
👉 [SUPABASE_UPLOAD_METHODS.md](../supabase/SUPABASE_UPLOAD_METHODS.md)

---

## 📚 관련 문서

- [FIX_DNS_RESOLUTION.md](../troubleshooting/FIX_DNS_RESOLUTION.md) - 상세 해결 가이드
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 종합 가이드

---

**Last updated**: 2026-01-25
