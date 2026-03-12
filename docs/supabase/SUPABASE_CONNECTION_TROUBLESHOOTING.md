# Supabase 연결 문제 해결 가이드

## 표준 연결 규칙 (Phase 2-6 공통)

- **DB URL**: `SUPABASE_DB_URL` 또는 `--db-url`(override) 사용.
- **무한 대기 방지**: `--connect-timeout SECONDS` 또는 `PGCONNECT_TIMEOUT=SECONDS` 사용.
  - Python 스크립트는 기본 `10s`를 적용합니다(필요 시 override).
- **VPN/IPv6 이슈**: Direct(DB) 실패 시 **Supavisor Session pooler(5432)** 우선.
- **보안/Redaction**: 문서·로그·채팅에 **DB URL 전체를 남기지 않기**.
  - 공유 시 예: `postgresql://user:***@host:port/db`

## 증상 예시

### 오류 1: 호스트 이름 해결 실패
```
failed to resolve host 'db.<PROJECT-REF>.supabase.co'
```

### 오류 2: SSL 연결 리셋
```
SSL SYSCALL error: Connection reset by peer
server closed the connection unexpectedly
```

## Preflight (DNS vs TCP 분리)

VPN ON/OFF 각각 아래 실행해 **DNS vs TCP**를 분리:

```powershell
Resolve-DnsName db.<PROJECT-REF>.supabase.co
Resolve-DnsName aws-0-<REGION>.pooler.supabase.com
Test-NetConnection aws-0-<REGION>.pooler.supabase.com -Port 5432
Test-NetConnection aws-0-<REGION>.pooler.supabase.com -Port 6543
```

- **KPI**: `Resolve-DnsName` 성공 / `TcpTestSucceeded=True` 확인. 실패 시 **방법 1** (Session 5432) 또는 **방법 4** (Dashboard) 우회.
- **진단용**: DNS 우회가 필요할 때만 `PGHOSTADDR` 사용(운영 표준 아님). ([PostgreSQL Env Vars](https://www.postgresql.org/docs/current/libpq-envars.html))

## 해결 방법 (우선순위)

### 방법 1: Supavisor Session pooler (권장, VPN/IPv6 이슈 시 표준)

1. **Settings** > **Database** > **Connection string**
2. **Session** pooler URI 선택 (포트 5432)
   - 예: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10`
   - 또는 env `PGCONNECT_TIMEOUT=10` ([PostgreSQL libpq](https://www.postgresql.org/docs/current/libpq-connect.html))
3. `SUPABASE_DB_URL` 또는 `--db-url`로 설정
4. **Redaction**: 로그·문서에 URL 전체 출력 금지, `user@host:port/db` 형태만 허용

### 방법 2: Direct(DB) 연결 (IPv6 정상 환경)

- Direct DB는 **IPv6 기본**입니다.
- IPv6가 안정적일 때만 사용 권장.

### 방법 3: Supavisor Transaction pooler (서버리스/단기 커넥션)

- 포트 **6543**
- Prepared statements 제약이 있어 DDL/마이그레이션엔 비권장.

| 구분 | Direct (`db.<ref>.supabase.co:5432`) | Session pooler (`...pooler.supabase.com:5432`) | Transaction pooler (`...pooler.supabase.com:6543`) |
|---|---|---|---|
| IP | IPv6 우선 | IPv4/IPv6 모두 대응 | IPv4/IPv6 모두 대응 |
| 용도 | 마이그레이션/장시간 | VPN/제한망, DDL 가능 | 서버리스/단기 연결 |
| DDL | 가능 | **가능** | 제한적 |

### 방법 4: Supabase Dashboard SQL Editor (최종 비상로)

네트워크/도구 제약 시 수동 실행:

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor**에서 스크립트 실행

### 방법 5: Network Restrictions 확인

- 프로젝트 설정의 **Network Restrictions**가 켜져 있으면
  허용 CIDR에 현재 네트워크 IP(IPv4/IPv6)를 추가해야 합니다.

### 방법 6: psql 클라이언트 사용

```powershell
psql --version
$env:PGCONNECT_TIMEOUT = "10"
psql "postgresql://postgres:[PASSWORD]@db.<PROJECT-REF>.supabase.co:5432/postgres"
```

**VPN ON 시**: pooler URI(Session 5432) 사용.

## Redaction 규칙

- DB URL/비밀번호를 **문서·로그·채팅·스크린샷에 평문으로 두지 않는다.**
- 로그 출력 시 **`user@host:port/db`** 형태만 허용 (password, query string 제외).
- 스크립트/런북 예시에는 `[YOUR-PASSWORD]`, `[PASSWORD]` 플레이스홀더 사용; 전체 URI **직접 기입 금지**.

## 다음 단계

1. **Phase 2**: DDL 적용
2. **Phase 4**: CSV 적재
3. **Phase 5**: Gate 1 QA
4. **Phase 6**: Realtime 활성화

## 참조

- [Supabase 연결 문자열 가이드](../supabase/SUPABASE_CONNECTION_STRING_GUIDE.md)
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md)
