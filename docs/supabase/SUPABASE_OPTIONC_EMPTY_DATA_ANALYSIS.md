# supabase/data/output/optionC 빈 데이터 원인 분석

> **최종 업데이트**: 2026-01-25  
> **문제**: `supabase/data/output/optionC/` 디렉토리의 모든 CSV 파일이 비어있음 (0행)  
> **해결 상태**: ✅ **해결됨** (2026-01-25)

---

## 🔍 문제 현상

### 리포트 결과 (`report.json`)
```json
{
  "all_rows": 874,
  "all_invalid_rows": 874,        // ⚠️ 모든 행이 invalid
  "all_unique_case_keys": 0,      // ⚠️ 유효한 케이스 키가 0개
  "wh_rows": 8804,
  "wh_matched": 0,                // ⚠️ WH 데이터가 매칭되지 않음
  "wh_unmatched": 8804,
  "shipments": 0,                 // ⚠️ 출력 데이터 없음
  "cases": 0,                     // ⚠️ 출력 데이터 없음
  "flows": 0,                     // ⚠️ 출력 데이터 없음
  "events": 0                     // ⚠️ 출력 데이터 없음
}
```

### CSV 파일 상태
- `shipments.csv`: **0행** (비어있음)
- `cases.csv`: **0행** (비어있음)
- `flows.csv`: **0행** (비어있음)
- `events.csv`: **0행** (비어있음)
- `locations.csv`: **4행** (최소 데이터만 있음)

---

## 🔎 근본 원인

### 1. 필드명 불일치

**ETL 스크립트 기대 필드명**:
- `_extract_ids()` 함수는 `"HVDC CODE"` 필드를 찾습니다.
- 코드 위치: `supabase/data/raw/scripts/etl/optionc_etl.py:244`

```python
def _extract_ids(record: Dict[str, Any]) -> Tuple[str, str]:
    hvdc_raw = record.get("HVDC CODE") or record.get("hvdc_code")
    hvdc_code = str(hvdc_raw).strip() if hvdc_raw is not None else ""
    if not hvdc_code:
        raise ValueError("HVDC CODE is missing")  # ⚠️ 여기서 예외 발생
    # ...
```

**실제 입력 파일 필드명**:
- `HVDC_all_status.json` 파일에는 `"SCT SHIP NO."` 필드만 있습니다.
- `"HVDC CODE"` 필드가 **존재하지 않습니다**.

```json
{
  "No": "1",
  "SCT SHIP NO.": "HVDC-ADOPT-PPL-0001",  // ✅ 이 필드는 있음
  // "HVDC CODE": "..."                    // ❌ 이 필드는 없음
}
```

### 2. 잘못된 입력 파일 사용

**실행 스크립트** (`scripts/hvdc/run_all.ps1:100`):
```powershell
python $etl3 --all $statusJson --wh $warehouseJson --customs $customsJson ...
```

- `$statusJson`은 `"HVDC all status.json"`을 가리킵니다.
- 이 파일은 **Status 레이어용** (선적 단위)입니다.
- **Case 레이어용** 파일(`hvdc_allshpt_status.json`)이 필요합니다.

### 3. 검증 실패 흐름

```
1. ETL 스크립트가 HVDC_all_status.json 읽음 (874행)
   ↓
2. 각 행에서 _extract_ids() 호출
   ↓
3. "HVDC CODE" 필드를 찾지 못함
   ↓
4. ValueError("HVDC CODE is missing") 발생
   ↓
5. 예외 처리로 all_invalid += 1
   ↓
6. 결과: all_invalid_rows = 874 (모든 행이 invalid)
   ↓
7. all_unique_case_keys = 0 (유효한 키가 없음)
   ↓
8. cases/shipments/flows/events = 0 (출력 데이터 없음)
```

---

## ✅ 해결 방법 (적용 완료)

### ✅ 방법 1: ETL 스크립트 수정 (적용됨)

`_extract_ids()` 함수를 수정하여 `"SCT SHIP NO."` 필드도 인식하도록 했습니다.

**수정 위치**: `supabase/data/raw/scripts/etl/optionc_etl.py:243-249`

**수정 후**:
```python
def _extract_ids(record: Dict[str, Any]) -> Tuple[str, str]:
    hvdc_raw = (
        record.get("HVDC CODE")
        or record.get("hvdc_code")
        or record.get("SCT SHIP NO.")      # ✅ 추가
        or record.get("SCT SHIP NO")       # ✅ 추가 (공백 없음)
    )
    hvdc_code = str(hvdc_raw).strip() if hvdc_raw is not None else ""
    if not hvdc_code:
        raise ValueError("HVDC CODE is missing")
    # ...
```

**테스트 추가**: `tests/validation/test_extract_ids.py`
- `test_extract_ids_accepts_sct_ship_no_with_dot()`
- `test_extract_ids_accepts_sct_ship_no_without_dot()`

### ✅ 방법 2: run_all.ps1 수정 (적용됨)

Option-C ETL에서 `hvdc_allshpt_status.json`을 우선 사용하도록 변경했습니다.

**수정 위치**: `scripts/hvdc/run_all.ps1:80-100`

**수정 후**:
```powershell
# Detect Option-C input JSON (prefer hvdc_allshpt_status.json, fallback to status JSON)
$allshptCandidates = @("hvdc_allshpt_status.json", "HVDC all status.json", "HVDC_all_status.json", "hvdc_all_status.json")
$allshptJson = $null
foreach ($c in $allshptCandidates) {
  $p = Join-Path $SrcDir $c
  if (Test-Path $p) { $allshptJson = $p; break }
}
if (-not $allshptJson) {
  throw "[run_all.ps1] Option-C input JSON not found in $SrcDir (expected hvdc_allshpt_status.json or HVDC all status.json)"
}

python $etl3 --all $allshptJson --wh $warehouseJson --customs $customsJson ...
```

---

## 📋 검증 방법

### 수정 후 재실행

```bash
cd supabase/data/raw
python scripts/etl/optionc_etl.py \
  --all "HVDC_all_status.json" \
  --wh "hvdc_warehouse_status.json" \
  --customs "HVDC_STATUS.json" \
  --output-dir ".../supabase/supabase/data/output/optionC"
```

또는 `run_all.ps1` 실행:
```powershell
$env:SUPABASE_DB_URL="postgresql://..."
powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_all.ps1
```

### 리포트 확인

```bash
cat supabase/data/output/optionC/report.json
```

**예상 결과**:
```json
{
  "all_rows": 874,
  "all_invalid_rows": 0,           // ✅ 0이어야 함
  "all_unique_case_keys": 874,     // ✅ 0보다 커야 함
  "shipments": 491,                // ✅ 0보다 커야 함
  "cases": 6745,                   // ✅ 0보다 커야 함
  "flows": 6704,                   // ✅ 0보다 커야 함
  "events": 50677                  // ✅ 0보다 커야 함
}
```

### 단위 테스트 실행

```bash
pytest tests/validation/test_extract_ids.py -v
```

**예상 결과**:
```
test_extract_ids_accepts_sct_ship_no_with_dot PASSED
test_extract_ids_accepts_sct_ship_no_without_dot PASSED
```

---

## 🔗 참조

- **ETL 스크립트**: `supabase/data/raw/scripts/etl/optionc_etl.py`
- **실행 스크립트**: `scripts/hvdc/run_all.ps1`
- **입력 파일**: `supabase/data/raw/HVDC_all_status.json`
- **테스트**: `tests/validation/test_extract_ids.py`
- **성공 사례**: `hvdc_output/optionC/` (다른 ETL 실행 결과)
- **CHANGELOG**: `CHANGELOG.md` (2026-01-25)

---

## 📝 요약

### 문제
- `HVDC_all_status.json`에 `"HVDC CODE"` 필드가 없음
- ETL 스크립트가 `"HVDC CODE"`만 찾음
- 모든 행이 invalid로 판단되어 출력 데이터가 0행

### 해결 (적용 완료)
1. ✅ **ETL 스크립트 수정**: `_extract_ids()`가 `"SCT SHIP NO."`/`"SCT SHIP NO"`도 인식
2. ✅ **단위 테스트 추가**: 새 입력 키에 대한 테스트
3. ✅ **run_all.ps1 수정**: `hvdc_allshpt_status.json` 우선 사용
4. ✅ **CHANGELOG 반영**: ETL 키 호환 보완 기록

---

**최종 업데이트**: 2026-01-25  
**해결 상태**: ✅ **해결됨**
