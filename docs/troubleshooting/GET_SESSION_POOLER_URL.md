# Session Pooler 연결 문자열 확인 방법

> Python psql 스크립트 실행을 위한 정확한 연결 문자열 확인

---

## 🔍 Supabase Dashboard에서 확인

### 방법 1: Connect 버튼 사용 (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (rkfffveonaskewwzghex)
3. 상단 **"Connect"** 버튼 클릭
4. **"Session pooler"** 탭 선택
5. 연결 문자열 복사
   - 예시 형식: `postgresql://postgres.rkfffveonaskewwzghex:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

### 방법 2: Settings > Database

1. Dashboard → 프로젝트 선택
2. 왼쪽 메뉴 **"Settings"** (톱니바퀴 아이콘) 클릭
3. **"Database"** 메뉴 선택
4. **"Connection string"** 섹션에서 **"Session"** pooler 선택
5. 연결 문자열 복사

---

## 📋 연결 문자열 형식

### Session Pooler 형식
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10
```

### 예시
```
postgresql://postgres.rkfffveonaskewwzghex:Macvho7504@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?connect_timeout=10
```

---

## 🚀 확인 후 실행

Dashboard에서 복사한 연결 문자열을 사용:

```powershell
cd "c:\LOGI MASTER DASH"

# Dashboard에서 복사한 연결 문자열 사용
$env:SUPABASE_DB_URL = "postgresql://postgres.rkfffveonaskewwzghex:Macvho7504@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10"

# 스크립트 실행
python scripts/hvdc/load_csv.py --status-only
```

또는 PowerShell 스크립트 사용:

```powershell
.\scripts\hvdc\load_csv_with_pooler.ps1 `
  -SupabaseUrl "https://rkfffveonaskewwzghex.supabase.co" `
  -Password "Macvho7504" `
  -Region "확인한-리전" `  # 예: ap-northeast-1
  -StatusOnly
```

---

## ⚠️ 주의사항

- **리전 확인 필수**: `aws-0-[REGION]` 부분의 리전이 정확해야 합니다
- **비밀번호**: Dashboard에서 복사한 연결 문자열에 비밀번호가 포함되어 있으면 그대로 사용
- **보안**: 연결 문자열 전체를 로그/문서에 남기지 마세요

---

**Last updated**: 2026-01-25
