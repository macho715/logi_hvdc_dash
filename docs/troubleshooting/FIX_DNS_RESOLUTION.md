# DNS 해석 실패 문제 해결 가이드

> Python psql 스크립트 (`load_csv.py`) 실행 시 DNS 해석 실패 문제 해결

---

## 🔍 문제 진단

### 증상
```
[load_csv] ERROR: Database error: failed to resolve host 'db.rkfffveonaskewwzghex.supabase.co': [Errno 11001] getaddrinfo failed
```

### 원인
- Python의 DNS 해석이 Windows nslookup과 다를 수 있음
- IPv6/IPv4 혼용 문제
- VPN/방화벽 설정

---

## ✅ 해결 방법 1: Session Pooler 사용 (권장)

### 1단계: Supabase Dashboard에서 Session Pooler 연결 문자열 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (rkfffveonaskewwzghex)
3. 상단 **"Connect"** 버튼 클릭
4. **"Session pooler"** 선택
5. 연결 문자열 복사
   - 형식: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10`

### 2단계: 연결 문자열로 스크립트 실행

```powershell
cd "c:\LOGI MASTER DASH"

# Session pooler 연결 문자열 설정
$env:SUPABASE_DB_URL = "postgresql://postgres.rkfffveonaskewwzghex:Macvho7504@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10"

# 스크립트 실행
python scripts/hvdc/load_csv.py --status-only
```

**주의**: `[REGION]`을 실제 리전으로 교체하세요 (예: `us-east-1`, `ap-northeast-1`)

---

## ✅ 해결 방법 2: Direct 연결 + IPv4 강제

### PowerShell에서 IPv4만 사용하도록 설정

```powershell
# IPv4 우선 설정 (현재 세션만)
$env:PGHOSTADDR = ""  # 초기화

# Direct 연결 문자열 (IPv4 우선)
$env:SUPABASE_DB_URL = "postgresql://postgres:Macvho7504@db.rkfffveonaskewwzghex.supabase.co:5432/postgres?connect_timeout=10"

# Python 실행
python scripts/hvdc/load_csv.py --status-only
```

---

## ✅ 해결 방법 3: IP 주소 직접 사용 (임시 해결책)

### 1단계: IP 주소 확인

```powershell
# DNS 해석으로 IP 확인
Resolve-DnsName db.rkfffveonaskewwzghex.supabase.co
```

### 2단계: IP 주소로 연결

```powershell
# IP 주소를 직접 사용 (임시 해결책)
$env:PGHOSTADDR = "확인된_IP_주소"
$env:SUPABASE_DB_URL = "postgresql://postgres:Macvho7504@db.rkfffveonaskewwzghex.supabase.co:5432/postgres?connect_timeout=10"

python scripts/hvdc/load_csv.py --status-only
```

**주의**: IP 주소는 변경될 수 있으므로 임시 해결책입니다.

---

## ✅ 해결 방법 4: Python DNS 해석 강제

### Python 스크립트 수정 (load_csv.py에 추가)

```python
import socket

# IPv4만 사용하도록 설정
socket.getaddrinfo = lambda *args: [
    (socket.AF_INET, socket.SOCK_STREAM, 0, '', (args[0], args[1]))
]
```

하지만 이 방법은 권장하지 않습니다. Session pooler 사용을 권장합니다.

---

## 🎯 권장 해결 순서

1. **방법 1: Session Pooler 사용** (가장 권장)
   - VPN/IPv6 문제 해결
   - 가장 안정적

2. **방법 2: Direct 연결 + IPv4 강제**
   - Session pooler를 사용할 수 없을 때

3. **방법 3: IP 주소 직접 사용**
   - 임시 해결책

4. **방법 4: Python DNS 수정**
   - 비권장

---

## 📋 Session Pooler 연결 문자열 찾는 방법

### Supabase Dashboard에서 확인

1. Dashboard → 프로젝트 선택
2. **Settings** → **Database**
3. **Connection string** 섹션
4. **Session** pooler 선택
5. 연결 문자열 복사

또는

1. Dashboard 상단 **"Connect"** 버튼
2. **"Session pooler"** 탭 선택
3. 연결 문자열 복사

---

## 🔍 진단 명령어

### DNS 해석 확인
```powershell
# Windows nslookup
nslookup db.rkfffveonaskewwzghex.supabase.co

# PowerShell Resolve-DnsName
Resolve-DnsName db.rkfffveonaskewwzghex.supabase.co

# Python에서 테스트
python -c "import socket; print(socket.gethostbyname('db.rkfffveonaskewwzghex.supabase.co'))"
```

### 네트워크 연결 테스트
```powershell
# TCP 연결 테스트
Test-NetConnection db.rkfffveonaskewwzghex.supabase.co -Port 5432

# Session pooler 연결 테스트
Test-NetConnection aws-0-us-east-1.pooler.supabase.com -Port 5432
```

---

## 📚 참고 문서

- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 종합 가이드
- [SUPABASE_CONNECTION_STRING_GUIDE.md](../supabase/SUPABASE_CONNECTION_STRING_GUIDE.md) - 연결 문자열 가이드
- [SUPABASE_UPLOAD_METHODS.md](../supabase/SUPABASE_UPLOAD_METHODS.md) - 업로드 방법 비교

---

**Last updated**: 2026-01-25
