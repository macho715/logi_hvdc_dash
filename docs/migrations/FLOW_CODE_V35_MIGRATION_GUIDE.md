# Flow Code v3.5 마이그레이션 가이드

**작성일**: 2026-01-23  
**참조**: 
- [Logi ontol core doc/FLOW_CODE_V35_QUICK_REFERENCE.md](../../Logi ontol core doc/FLOW_CODE_V35_QUICK_REFERENCE.md)
- [schema_v2_unified.sql](../../.cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql)

---

## 개요

`shipments` 테이블에 Flow Code v3.5 필드를 추가하고, 기존 데이터에 Flow Code를 계산하여 적용합니다.

**Flow Code v3.5 정의**:
- 0: Pre Arrival
- 1: Direct (Port → Site)
- 2: WH (Port → WH → Site)
- 3: MOSB (Port → MOSB → Site)
- 4: Full (Port → WH → MOSB → Site)
- 5: Mixed/Incomplete

**AGI/DAS 도메인 규칙**:
- AGI(Al Ghallan Island) 또는 DAS(Das Island) 목적지는 Flow Code ≥ 3 필수
- 자동 업그레이드: Flow 0/1/2 → Flow 3
- 원본 보존: `flow_code_original`에 업그레이드 전 값 저장

---

## 마이그레이션 단계

### 1. 사전 준비

```bash
# 환경 변수 확인
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 백업 (권장)
pg_dump -h <host> -U <user> -d <database> > backup_before_flow_code.sql
```

### 2. 마이그레이션 실행

```bash
# Supabase CLI 사용
supabase migration up 20260123_add_flow_code_v35

# 또는 직접 SQL 실행
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260123_add_flow_code_v35.sql
```

### 3. 검증

```bash
# Python 검증 스크립트 실행
python scripts/migrations/validate_flow_code_migration.py

# 또는 SQL로 직접 확인
psql -h <host> -U <user> -d <database> -c "SELECT * FROM v_flow_code_validation WHERE agi_das_compliance_status = 'VIOLATION';"
```

---

## 마이그레이션 내용

### 추가되는 필드

1. `flow_code` (INTEGER): Flow Code v3.5 (0-5)
2. `flow_code_original` (INTEGER): 업그레이드 전 원본 값
3. `flow_override_reason` (TEXT): 오버라이드 이유
4. `flow_description` (TEXT): Flow Code 설명
5. `final_location` (VARCHAR(10)): 최종 목적지 (MIR/SHU/AGI/DAS)
6. `requires_mosb_leg` (BOOLEAN): MOSB 경유 필수 여부
7. `warehouse_count` (INTEGER): 창고 경유 횟수 (0-4)
8. `has_mosb_leg` (BOOLEAN): MOSB 경유 여부
9. `has_site_arrival` (BOOLEAN): 현장 도착 여부

### 추가되는 제약조건

- `agi_das_flow_code_check`: AGI/DAS 목적지인 경우 Flow Code ≥ 3 필수

### 추가되는 함수

- `calculate_flow_code_v35(p_shipment_id UUID)`: Flow Code 계산 함수

### 추가되는 트리거

- `trigger_update_flow_code_on_warehouse_change`: warehouse_inventory 변경 시 자동 재계산

### 추가되는 뷰

- `v_flow_code_validation`: AGI/DAS 규칙 준수 확인 뷰

### 추가되는 헬퍼 함수

- `get_flow_code_violations()`: 위반 케이스 조회 함수

---

## 롤백 계획

마이그레이션 롤백이 필요한 경우:

```sql
-- 1. 트리거 제거
DROP TRIGGER IF EXISTS trigger_update_flow_code_on_warehouse_change ON warehouse_inventory;

-- 2. 함수 제거
DROP FUNCTION IF EXISTS calculate_flow_code_v35(UUID);
DROP FUNCTION IF EXISTS update_flow_code_on_warehouse_change();
DROP FUNCTION IF EXISTS get_flow_code_violations();

-- 3. 뷰 제거
DROP VIEW IF EXISTS v_flow_code_validation;

-- 4. 제약조건 제거
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS agi_das_flow_code_check;

-- 5. 인덱스 제거
DROP INDEX IF EXISTS idx_shipments_flow_code;
DROP INDEX IF EXISTS idx_shipments_final_location;
DROP INDEX IF EXISTS idx_shipments_flow_final_location;

-- 6. 컬럼 제거 (주의: 데이터 손실)
ALTER TABLE shipments 
  DROP COLUMN IF EXISTS flow_code,
  DROP COLUMN IF EXISTS flow_code_original,
  DROP COLUMN IF EXISTS flow_override_reason,
  DROP COLUMN IF EXISTS flow_description,
  DROP COLUMN IF EXISTS final_location,
  DROP COLUMN IF EXISTS requires_mosb_leg,
  DROP COLUMN IF EXISTS warehouse_count,
  DROP COLUMN IF EXISTS has_mosb_leg,
  DROP COLUMN IF EXISTS has_site_arrival;
```

---

## 검증 기준

마이그레이션 성공 기준:

- [ ] 모든 shipments의 95% 이상에 Flow Code 계산됨
- [ ] AGI/DAS 규칙 위반 케이스 0건
- [ ] 업그레이드된 케이스 모두 `flow_override_reason` 기록됨
- [ ] 제약조건 정상 작동 (AGI/DAS에 Flow < 3 삽입 시도 시 실패)

---

## 문제 해결

### 문제 1: Flow Code가 NULL인 케이스

**원인**: warehouse_inventory 데이터 없음

**해결**:
```sql
-- warehouse_inventory가 없는 shipments 확인
SELECT s.id, s.sct_ship_no 
FROM shipments s
LEFT JOIN warehouse_inventory w ON s.id = w.shipment_id
WHERE w.id IS NULL AND s.flow_code IS NULL;
```

### 문제 2: AGI/DAS 규칙 위반

**원인**: 제약조건이 적용되지 않음

**해결**:
```sql
-- 제약조건 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'agi_das_flow_code_check';

-- 수동으로 위반 케이스 수정
UPDATE shipments
SET flow_code = 3,
    flow_code_original = flow_code,
    flow_override_reason = 'AGI/DAS requires MOSB leg'
WHERE final_location IN ('AGI', 'DAS') AND flow_code < 3;
```

### 문제 3: 트리거가 작동하지 않음

**원인**: 트리거 함수 오류 또는 권한 문제

**해결**:
```sql
-- 트리거 상태 확인
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_update_flow_code_on_warehouse_change';

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_flow_code_on_warehouse_change ON warehouse_inventory;
CREATE TRIGGER trigger_update_flow_code_on_warehouse_change
AFTER INSERT OR UPDATE OR DELETE ON warehouse_inventory
FOR EACH ROW
EXECUTE FUNCTION update_flow_code_on_warehouse_change();
```

---

## 참조 문서

- [Flow Code v3.5 Quick Reference](../../Logi ontol core doc/FLOW_CODE_V35_QUICK_REFERENCE.md)
- [Flow Code v3.5 Integration Report](../../Logi ontol core doc/FLOW_CODE_V35_INTEGRATION_REPORT.md)
- [schema_v2_unified.sql](../../.cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql)
- [validate_flow_code_migration.py](../../scripts/migrations/validate_flow_code_migration.py)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-01-23
