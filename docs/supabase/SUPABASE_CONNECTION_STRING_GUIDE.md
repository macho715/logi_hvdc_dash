# Supabase 연결 문자열 찾는 방법 (공식 기준)

> Supabase 공식 문서([Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres)) 및 Dashboard 기준 요약.

---

## 1. 들어가는 경로 (2가지)

### 방법 A: Connect 버튼 (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속 후 **프로젝트 선택**
2. 프로젝트 상단 **「Connect」** 버튼 클릭  
   - 공식 FAQ: *"Your connection string is located in the Supabase Dashboard. Click the **Connect** button at the top of the page."*
3. 열리는 패널에서 **연결 방식**을 고른 뒤, 해당 **Connection string** 복사

### 방법 B: Settings > Database

1. Dashboard → 프로젝트 선택
2. 왼쪽 **Project Settings** (톱니바퀴) 클릭
3. **Database** 메뉴 선택  
   - URL 예: `https://supabase.com/dashboard/project/<PROJECT_REF>/settings/database`  
   - 또는 **Database** → **Settings** 경로 (Dashboard 버전에 따라 다를 수 있음)
4. **Connection string** / **Connection info** 섹션에서 원하는 모드의 문자열 복사

> 연결 정보·SSL 인증서는 동일 문서에 *"Connection Info and Server root certificate"* 로 안내됨.

---

## 2. 연결 방식별 문자열 형태

| 방식 | 용도 | 포트 | 형식 예시 |
|------|------|------|-----------|
| **Direct** | psql, migrations, pg_dump, 백업, 장기 실행 서버 | **5432** | `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` |
| **Session pooler** | IPv4 필요 시 direct 대안, 영구 클라이언트 | 5432 | `postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres` |
| **Transaction pooler** | Serverless, Edge, 단발성 연결 | **6543** | `postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres` |

- `[YOUR-PASSWORD]`: **Database password** (프로젝트 생성 시 설정, Settings > Database에서 재설정 가능)
- `[PROJECT-REF]`: 프로젝트 URL의 `db.` 다음 부분 (예: `abcdefghijklmnopqrst`)

---

## 3. 이 프로젝트에서 쓰는 값 (SUPABASE_DB_URL)

**Phase 2~6 (DDL, CSV 적재, Gate 1 QA, Realtime)** 기준:

- VPN/IPv6 이슈가 있으면 **Session pooler(5432)** 를 기본값으로 사용.
- IPv6가 안정적인 환경에서는 **Direct** 도 가능.
- DB URL 전체는 문서/로그에 남기지 말고 `user:***@host` 형태로 마스킹.

예 (Session pooler):
```text
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

예 (Direct):
```text
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnopqrst.supabase.co:5432/postgres
```

PowerShell 설정 예:
```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
$env:PGCONNECT_TIMEOUT = "10"
```

---

## 4. 비밀번호 확인·재설정

- **위치**: Dashboard → **Project Settings** → **Database**
- **Reset database password** 로 재설정 가능.
- FAQ: *"FATAL: Password authentication failed"* → Dashboard에서 username/password 확인 후, 필요 시 비밀번호 리셋.

---

## 5. SSL (선택)

- 공식 권장: 가능하면 **SSL** 사용.
- **Connection info** 및 **Server root certificate** 는 동일 Dashboard 화면에서 내려받을 수 있음.
- `psql` SSL 예시는 [Connecting with PSQL](https://supabase.com/docs/guides/database/psql) 참고.

---

## 6. 포트 정리 (FAQ 기준)

| 연결 종류 | 포트 |
|-----------|------|
| Direct | 5432 |
| PgBouncer | 6543 |
| Supavisor Transaction | 6543 |
| Supavisor Session | 5432 |

---

## 7. 참고 링크

- [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) — 연결 방식 전반
- [Connecting with PSQL](https://supabase.com/docs/guides/database/psql) — psql + SSL
- [Database Settings](https://supabase.com/dashboard/project/_/database/settings) — Pool size 등 (프로젝트 선택 후)
- [Connect 패널 (Direct)](https://supabase.com/dashboard/project/_?showConnect=true)
- [Connect 패널 (Session)](https://supabase.com/dashboard/project/_?showConnect=true&method=session)
- [Connect 패널 (Transaction)](https://supabase.com/dashboard/project/_?showConnect=true&method=transaction)

---

**최종 업데이트**: 2026-02-07

**참고**: 이 가이드는 Phase 2~6 데이터 적재 및 대시보드 연동에 사용됩니다. 최신 상태는 [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) 및 [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md)를 참조하세요.
