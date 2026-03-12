Supabase 설정을 단계별로 안내해드리겠습니다.

Project name : hvdc-logistics

Project ID : vnoypalmmyiigxntfdxx

API KEY : sb_publishable_0gB88eu7ieGHwVcx3gvrwg_bfaq4rUo




Project URL
Source

Primary database
https://vnoypalmmyiigxntfdxx.supabase.co

Copy
URL
RESTful endpoint for querying and managing your database

Data API Settings
Docs

Harden Data API

Enable Data API
When enabled you will be able to use any Supabase client library and PostgREST endpoints with any schema configured below.

public
graphql_public
Select schemas...
Exposed schemas
The schemas to expose in your API. Tables, views and stored procedures in these schemas will get API endpoints.

public
extensions
Select schemas...
Extra search path
Extra schemas to add to the search path of every request.
1000
rows
Max rows
The maximum number of rows returned from a view, table, or stored procedure. Limits payload size for accidental or malicious requests.
Configured automatically
connections
Pool size
Number of maximum connections to keep open in the Data API server's database pool. Unset to let it be configured automatically based on compute size.

Cancel

Save








## 🚀 Supabase 프로젝트 생성 및 설정

### 1단계: Supabase 계정 생성 및 로그인

```bash
# 1. 브라우저에서 접속
https://supabase.com
```

1. **Sign Up** 또는 **Login** (GitHub 계정으로 간편 로그인 가능)
2. 대시보드로 이동

### 2단계: 새 프로젝트 생성

1. **"New Project"** 버튼 클릭
2. 다음 정보 입력:

```
Project Name: hvdc-logistics (또는 원하는 이름)
Database Password: [강력한 비밀번호 입력 - 꼭 기억하세요!]
Region: Southeast Asia (Singapore) - UAE와 가장 가까움
Pricing Plan: Free (시작) 또는 Pro (실전용)
```

3. **"Create new project"** 클릭
4. 프로젝트 생성 대기 (약 2-3분 소요)

### 3단계: API 키 및 URL 복사

프로젝트가 준비되면:

1. 왼쪽 메뉴에서 **⚙️ Settings** 클릭
2. **API** 탭 선택
3. 다음 정보를 복사:

```bash
# Project URL
https://xxxxxxxxxxxxx.supabase.co

# API Keys
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **중요**: `service_role` 키는 절대 프론트엔드에 노출하면 안 됩니다!

### 4단계: 환경 변수 파일 생성

프로젝트 루트 디렉토리에서:

```bash
cd C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard

# .env.local 파일 생성 (텍스트 에디터로)
```

**.env.local** 파일에 다음 내용 추가:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

실제 값으로 교체하세요!

### 5단계: 데이터베이스 스키마 배포

#### 방법 A: Supabase Dashboard 사용 (추천)

1. Supabase Dashboard에서 **🔧 SQL Editor** 클릭
2. **"New query"** 클릭
3. `hvdc_logistics_schema.sql` 파일 내용을 복사해서 붙여넣기
4. **"Run"** 버튼 클릭 (오른쪽 하단)
5. 성공 메시지 확인

#### 방법 B: Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 스키마 배포
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

### 6단계: 스키마 검증

Supabase Dashboard에서:

1. **🗄️ Table Editor** 클릭
2. 다음 테이블들이 보이는지 확인:
   - ✅ shipments
   - ✅ container_details
   - ✅ warehouse_inventory
   - ✅ financial_transactions
   - ✅ shipment_tracking_log
   - ✅ documents

또는 SQL Editor에서:

```sql
-- 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 7단계: Python 마이그레이션 스크립트 설정

```bash
# Python 패키지 설치
pip install pandas supabase openpyxl python-dotenv

# 또는 requirements.txt 생성
echo pandas >> requirements.txt
echo supabase >> requirements.txt
echo openpyxl >> requirements.txt
echo python-dotenv >> requirements.txt

pip install -r requirements.txt
```

마이그레이션 스크립트용 **.env** 파일 생성:

```bash
# .env (Python 스크립트용)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

### 8단계: 데이터 마이그레이션 실행

```bash
# Excel 파일 경로 확인
# 스크립트에서 파일 경로 수정 필요할 수 있음

python hvdc_migration_script.py
```

예상 출력:

```
INFO - Reading Excel file: HVDC_STATUS_1.xlsx
INFO - Loaded 150 rows
INFO - Starting migration of 150 rows
INFO - Row 1: Successfully migrated HVDC-ADOPT-PPL-0001
INFO - Progress: 10/150 rows processed
...
INFO - Migration completed!
============================================================
MIGRATION STATISTICS
============================================================
Total rows processed: 150
Successful shipments: 148
Successful containers: 148
Successful warehouses: 148
Errors: 2
============================================================
```

### 9단계: Next.js 프로젝트 설정

```bash
cd C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard

# Supabase 클라이언트 설치
npm install @supabase/supabase-js

# 개발 서버 실행
npm run dev
```

브라우저에서 접속:
```
http://localhost:3000
```

### 10단계: Vercel 배포 시 환경 변수 설정

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 입력: https://your-project-id.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key

# 재배포
vercel --prod
```

## 🔍 검증 및 테스트

### API 테스트

```bash
# 로컬 테스트
curl http://localhost:3000/api/shipments

# 프로덕션 테스트
curl https://your-project.vercel.app/api/shipments
```

### Supabase 데이터 확인

Supabase Dashboard > Table Editor:

```sql
-- 선적 수 확인
SELECT COUNT(*) FROM shipments;

-- 샘플 데이터
SELECT 
    sct_ship_no,
    vendor,
    vessel_name,
    eta,
    status
FROM shipments
LIMIT 5;

-- 통계 함수 테스트
SELECT * FROM get_shipment_statistics();
```

## ⚠️ 주의사항

1. **Service Role Key 보안**
   - `.env.local` 파일을 `.gitignore`에 추가
   - GitHub에 절대 커밋하지 마세요!

2. **무료 플랜 제한**
   - 500MB 데이터베이스
   - 50,000 월간 활성 사용자
   - 필요시 Pro 플랜으로 업그레이드

3. **백업**
   - Supabase는 자동 백업 지원
   - Settings > Database > Backups에서 확인

## 🆘 문제 해결

### "relation does not exist" 오류

```sql
-- SQL Editor에서 스키마 재실행
-- hvdc_logistics_schema.sql 내용 전체 복사 후 실행
```

### "permission denied" 오류

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'shipments';

-- 필요시 RLS 임시 비활성화 (개발 중)
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
```

### 연결 오류

```bash
# URL과 키 다시 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# .env.local 파일 재로드
# 개발 서버 재시작 필요
npm run dev
```

---

**준비되셨으면 다음 정보를 알려주세요:**

1. ✅ Supabase 프로젝트를 생성하셨나요?
2. ✅ `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`를 받으셨나요?
3. ✅ 스키마 배포를 완료하셨나요?

정보를 주시면 나머지 설정을 도와드리겠습니다!