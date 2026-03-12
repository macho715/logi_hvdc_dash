좋습니다, 요구를 정리하면:

- **단일 케이스 수준**에서
  - UAE 항구 입항 → 통관 종료
  - 통관 서류 준비 → 통관 종료
  - 창고별 체류시간(WH_IN~WH_OUT_DERIVED)
  - MOSB 체류시간(MOSB_IN~MOSB_OUT_DERIVED)
  - MOSB/WH 이후 → 현장 입고(SITE_ARRIVAL)
- **항차(선적, hvdc_code) 수준**에서도
  - 위 구간들을 “해당 선적에 속한 모든 케이스” 기준으로 집계(평균/최대 등)
    가 모두 계산 가능해야 한다는 뜻입니다.

이미 가진 `events.csv` + `flows.csv` 구조로 **아래 두 계층**을 만들면 요구를 거의 전부 충족할 수 있습니다.

---

### 1. 케이스별 모든 구간 시간: `v_case_segments`(앞에서 제안한 뷰 확장 버전)

**전제 테이블 (CSV에서 로드):**

- `hvdc_cases(hvdc_code, case_no, …)` ← `cases.csv`
- `hvdc_flows(hvdc_code, case_no, customs_start, customs_end, …)` ← `flows.csv`
- `hvdc_case_events(hvdc_code, case_no, event_type, event_time, location_id, …)` ← `events.csv`

이미 설명드린 `v_case_event_segments`에 더해, **주요 구간을 컬럼으로 다 뽑은 뷰**를 만들면 됩니다:

```sql
CREATE VIEW v_case_segments AS
WITH t AS (
  SELECT
    c.hvdc_code,
    c.case_no,
    c.final_location,

    MIN(CASE WHEN e.event_type IN ('PORT_ETA','PORT_ATA')
             THEN e.event_time END)                            AS port_arrival,

    MIN(CASE WHEN e.event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START')
             THEN e.event_time END)                            AS customs_doc_start,
    MIN(CASE WHEN e.event_type = 'CUSTOMS_FORMAL_START'
             THEN e.event_time END)                            AS customs_formal_start,
    MIN(CASE WHEN e.event_type = 'CUSTOMS_END'
             THEN e.event_time END)                            AS customs_end_event,
    MIN(CASE WHEN e.event_type = 'DO_COLLECTION'
             THEN e.event_time END)                            AS do_collection,

    MIN(CASE WHEN e.event_type = 'WH_IN'
             THEN e.event_time END)                            AS first_wh_in,
    MAX(CASE WHEN e.event_type = 'WH_OUT_DERIVED'
             THEN e.event_time END)                            AS last_wh_out,

    MIN(CASE WHEN e.event_type = 'MOSB_IN'
             THEN e.event_time END)                            AS mosb_in,
    MIN(CASE WHEN e.event_type = 'MOSB_OUT_DERIVED'
             THEN e.event_time END)                            AS mosb_out,

    MIN(CASE WHEN e.event_type = 'SITE_ARRIVAL'
             THEN e.event_time END)                            AS site_arrival,

    f.customs_start,
    f.customs_end
  FROM hvdc_cases c
  LEFT JOIN hvdc_case_events e
    ON e.hvdc_code = c.hvdc_code
   AND e.case_no   = c.case_no
  LEFT JOIN hvdc_flows f
    ON f.hvdc_code = c.hvdc_code
   AND f.case_no   = c.case_no
  GROUP BY
    c.hvdc_code, c.case_no, c.final_location,
    f.customs_start, f.customs_end
)
SELECT
  t.*,

  -- ① 입항 → 통관 종료 (physical)
  EXTRACT(EPOCH FROM (t.customs_end - t.port_arrival))/3600.0
    AS hours_port_to_customs_end,

  -- ② 통관 시작 → 통관 종료 (flows 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_start))/3600.0
    AS hours_customs_window,

  -- ③ 서류 준비(START/FORMAL) → 통관 종료
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_doc_start))/3600.0
    AS hours_customs_docs,

  -- ④ DO 발급 → 통관 종료 (원하면)
  EXTRACT(EPOCH FROM (t.customs_end - t.do_collection))/3600.0
    AS hours_do_to_customs_end,

  -- ⑤ 창고 머문 시간 (최초 IN ~ 최종 OUT, 모든 WH 합산의 최소 정의)
  EXTRACT(EPOCH FROM (t.last_wh_out - t.first_wh_in))/3600.0
    AS hours_wh_dwell,

  -- ⑥ MOSB 내부 대기
  EXTRACT(EPOCH FROM (t.mosb_out - t.mosb_in))/3600.0
    AS hours_mosb_dwell,

  -- ⑦ MOSB/WH 이후 → 현장 입고
  EXTRACT(
    EPOCH FROM (
      t.site_arrival - COALESCE(t.mosb_out, t.mosb_in, t.last_wh_out, t.first_wh_in)
    )
  )/3600.0 AS hours_last_leg,

  -- ⑧ UAE 항구 입항 → 현장 입고 (전체 리드타임)
  EXTRACT(EPOCH FROM (t.site_arrival - t.port_arrival))/3600.0
    AS hours_port_to_site

FROM t;
```

이렇게 하면, **각 케이스별로**:

- 입항 → 통관 종료
- 통관 시작/서류 준비 → 통관 종료 (물리/서류 둘 다)
- DO 발급 → 통관 종료
- WH 입/출고 구간(머문 시간)
- MOSB 입/출고 구간(대기 시간)
- MOSB/WH → Site 최종 구간
- Port → Site 전체 구간

까지 “주요 시간들”은 다 컬럼으로 붙습니다.

추가로 “그 외” 구간(예: `CUSTOMS_FORMAL_START → DO_COLLECTION`)도 필요하면 같은 패턴으로 하나씩 더 정의할 수 있습니다.

---

### 2. 항차(선적 hvdc_code) 단위 집계: `v_voyage_segments`

위 `v_case_segments`를 이용하면, **항차별(= hvdc_code)** 집계도 간단합니다.

```sql
CREATE VIEW v_voyage_segments AS
SELECT
  hvdc_code,

  -- 항차 내 케이스 수
  COUNT(*)                              AS cases_count,

  -- Port→Site 평균/최대/최소
  AVG(hours_port_to_site)              AS avg_hours_port_to_site,
  MAX(hours_port_to_site)              AS max_hours_port_to_site,

  -- 통관 구간
  AVG(hours_port_to_customs_end)       AS avg_hours_port_to_customs_end,
  AVG(hours_customs_window)            AS avg_hours_customs_window,
  AVG(hours_customs_docs)              AS avg_hours_customs_docs,

  -- 창고/모스브 dwell
  AVG(hours_wh_dwell)                  AS avg_hours_wh_dwell,
  AVG(hours_mosb_dwell)                AS avg_hours_mosb_dwell,

  -- 마지막 구간
  AVG(hours_last_leg)                  AS avg_hours_last_leg

FROM v_case_segments
GROUP BY hvdc_code;
```

이렇게 하면, **각 항차마다**:

- 케이스 전체를 묶어서 본
  - 평균 Port→Site 리드타임
  - 평균/최대 통관 구간 시간
  - 창고 머문 시간, MOSB 대기시간
  - 마지막 Site 구간
    이 모두 한 번에 나옵니다.

---

### 3. “그 외 시간들”을 추가로 보고 싶을 때

새로운 요구가 생길 때마다, 원칙은 같습니다:

1. **어떤 두 이벤트 사이의 시간인가?**

   - 예: `PORT_ATD → PORT_ATA`, `PORT_ATA → WH_IN`, `WH_OUT_DERIVED → MOSB_IN` 등.
2. 그 조합에 해당하는 `event_type`을 `v_case_event_segments`에서 필터합니다.

   ```sql
   SELECT *
   FROM v_case_event_segments
   WHERE prev_event_type = 'PORT_ATA'
     AND curr_event_type = 'WH_IN';
   ```
3. 자주 쓰는 구간이면, `v_case_segments`에 **추가 열**로 끌어올리면 됩니다.

이 패턴만 유지하면, 지금 구조(flows.csv + events.csv)로 **사실상 모든 시간 구간**을 정의할 수 있고,
케이스별 · 항차별 · Site별(any 집계 키)로도 다 꺼낼 수 있습니다.

[2 tools called]

요청하신 “embedded TTL 버전”은 이미 레포에 들어와 있고, 기존 파이프라인을 그대로 쓰면서 **CSV + OPS용 TTL을 한 번에 뽑는 래퍼** 역할을 합니다. 지금부터는 이 둘만 쓰시면 됩니다.

- **`Untitled-4_embedded_ops_ttl.py` (Status SSOT + OPS TTL)**

  - 입력: `--status HVDC all status.json`, `--warehouse hvdc_warehouse_status.json`, `--outdir ../hvdc_output` (지금과 동일).
  - 실행 예:
    ```bash
    cd supabass_ontol
    python Untitled-4_embedded_ops_ttl.py \
      --status "HVDC all status.json" \
      --warehouse "hvdc_warehouse_status.json" \
      --outdir "../hvdc_output" \
      --base-iri "https://example.com/hvdc"
    ```
  - 출력:
    - `hvdc_output/supabase/schema.sql`, `shipments.csv`, `logistics_events.csv` (Status 레이어 CSV)
    - `hvdc_output/ontology/hvdc.ttl` + `hvdc_output/ontology/hvdc_ops_status.ttl` (Status 인스턴스 TTL)
- **`Untitled-3_embedded_ops_ttl.py` (Option‑C Case + OPS TTL)**

  - 입력: `--all "HVDC all status.json"`, `--wh "hvdc_warehouse_status.json"`, `--customs "HVDC all status.json"` (통관도 같이 참고), `--output-dir "../hvdc_output/optionC"`
  - 실행 예:
    ```bash
    cd supabass_ontol
    python Untitled-3_embedded_ops_ttl.py \
      --all "HVDC all status.json" \
      --wh  "hvdc_warehouse_status.json" \
      --customs "HVDC all status.json" \
      --output-dir "../hvdc_output/optionC" \
      --export-ttl \
      --base-iri "https://example.com/hvdc"
    ```
  - 출력:
    - `hvdc_output/optionC/shipments.csv, cases.csv, flows.csv, locations.csv, events*.csv, report.*`
    - `hvdc_output/optionC/hvdc_supabase.ttl`(기존) + `hvdc_output/optionC/hvdc_ops_data.ttl`(OPS 온톨로지 인스턴스)
- **Supabase 구성/뷰·KPI는** 이미 `20260124_hvdc_layers_status_case_ops.sql` + `hvdc_copy_templates.sql` + `RUNBOOK_HVDC_SUPABASE_SETUP.md`에 완성되어 있으니,

  1) DDL 스크립트 실행 → 2) `hvdc_output/supabase`·`hvdc_output/optionC` CSV를 `\copy`로 로드 → 3) Runbook의 QA 쿼리와 `public.v_*` 뷰로 검증/대시보드 연결 순서로 진행하시면 됩니다.
- ## ExecSummary (3–5L)

* “만들어 달라” 요청을 **실행 가능한 산출물**로 처리했습니다: **Status(SSOT) + Case(Option-C) CSV를 온톨로지 스키마에 100% 정렬된 Instance TTL로 변환**하는 파이썬 스크립트를 생성했습니다.
* 이 스크립트는 **당신이 고정한 Supabase 테이블/뷰 설계(키 구조)** 를 그대로 Ontology 인스턴스 URI로 고정합니다: `hvdc_code`=Shipment, `(hvdc_code, case_no)`=Case/Flow, `location_code`=Location.
* 함께 제공되는  **Ontology 스키마 TTL + SHACL shapes** (이미 생성됨)도 출력 폴더에 복사하도록 옵션을 넣었습니다.

---

## 다운로드(바로 사용)

* [export_hvdc_ops_ttl.py](sandbox:/mnt/data/export_hvdc_ops_ttl.py) ← **CSV → Instance TTL 변환기**
* [README_hvdc_ops_ttl_export.md](sandbox:/mnt/data/README_hvdc_ops_ttl_export.md) ← 사용법
* (기존 생성됨) [hvdc_ops_ontology.ttl](sandbox:/mnt/data/hvdc_ops_ontology.ttl)
* (기존 생성됨) [hvdc_ops_shapes.ttl](sandbox:/mnt/data/hvdc_ops_shapes.ttl)

---

## Visual-first: 생성되는 Ontology 인스턴스 구조

```
  Shipment(hvdc_code)        : {base}/Shipment/{hvdc_code}
    ├─ hasStatusEvent        : {base}/StatusEvent/{event_id}
    └─ hasCase               : {base}/Case/{hvdc_code}/{case_no}
          ├─ hasFlow          : {base}/Flow/{hvdc_code}/{case_no}
          └─ hasEvent         : {base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}
                └─ atLocation : {base}/Location/{location_code}
```

---

## 실행 방법 (운영 배치에 그대로 삽입)

> Status(=Untitled-4) 실행 후, Case(=Untitled-3) 실행 후, 마지막에 아래를 실행

```bash
  python export_hvdc_ops_ttl.py \
    --status-dir out/supabase \
    --case-dir supabase_csv_optionC_v3 \
    --schema-ttl hvdc_ops_ontology.ttl \
    --shapes-ttl hvdc_ops_shapes.ttl \
    --out out/ontology/hvdc_ops_data.ttl \
    --base-iri https://example.com/hvdc
```

### 입력 파일 자동 인식 규칙

* Status:
  * `shipments.csv` 또는 `shipments_status.csv`
  * `logistics_events.csv` 또는 `events_status.csv`
* Case(옵션):
  * `cases.csv`, `flows.csv`, `locations.csv`, `events.csv`(또는 `events_case.csv`)

---

## 포함 범위(요구사항 충족 체크)

| No | Item               | Value                                                 | Risk                       | Evidence/가정       |
| -: | ------------------ | ----------------------------------------------------- | -------------------------- | ------------------- |
|  1 | SSOT 전량 인스턴스 | Status shipments 전부 `hvdc:Shipment`로 생성        | 누락 시 “전체 현황” 붕괴 | 가정: CSV 존재      |
|  2 | Status 이벤트      | `hvdc:StatusEvent`생성 +`hvdc:hasStatusEvent`링크 | 타임라인 불완전            | 이벤트 CSV 존재     |
|  3 | Case/Flow/Location | `hvdc:Case`,`hvdc:Flow`,`hvdc:Location`생성     | KPI/추론 붕괴              | case-dir 제공 시    |
|  4 | Case 이벤트        | `hvdc:CaseEvent`생성 +`atLocation/forCase`링크    | WH/SITE/CUSTOMS 추적 불가  | locations 매핑 필요 |
|  5 | Schema+SHACL 동봉  | 출력 폴더에 ontology/shapes TTL 복사                  | 배포 누락                  | 옵션으로 복사       |

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep` (SSOT Coverage/Orphan/Flow5 QA 고정)
2. **Next:** `/logi-master kpi-dash --KRsummary` (Flow/Customs/WH KPI 대시보드 위젯 연결)
3. **Alt:** `/redo step` (운영 IRI로 base-iri/prefix 치환 PATCH)

---

## ZERO log

| 단계 | 이유                                      | 위험                                 | 요청데이터        | 다음조치                        |
| ---- | ----------------------------------------- | ------------------------------------ | ----------------- | ------------------------------- |
| 정상 | CSV→TTL 변환기 및 스키마/SHACL 제공 완료 | 운영 네임스페이스 IRI 미확정 시 충돌 | 운영 base IRI 1개 | `--base-iri`에 적용 후 재생성 |

  원하시면 다음 단계로,  **Untitled-3/4 자체에 TTL export를 “내장”** (CSV 생성과 동시에 동일 규칙으로 TTL도 생성)하는 패치 버전까지 바로 만들어 드리겠습니다.


요청하신 대로 **Untitled-3/4 자체에 OPS TTL export를 “내장”한 패치 버전**을 생성했습니다. (CSV 생성과 **동시에 동일 규칙의 TTL 인스턴스 파일**을 같이 생성)

## 다운로드(패치 파일)

* [Untitled-4_embedded_ops_ttl.py](sandbox:/mnt/data/Untitled-4_embedded_ops_ttl.py) ← Status SSOT 레이어(내장 TTL)
* [Untitled-3_embedded_ops_ttl.py](sandbox:/mnt/data/Untitled-3_embedded_ops_ttl.py) ← Option C Case 레이어(내장 TTL)
* [README_embedded_ops_ttl_patch.md](sandbox:/mnt/data/README_embedded_ops_ttl_patch.md) ← 사용법

참조 원본:

* (기존 Untitled-4)
* (기존 Untitled-3/Option-C ETL)

---

## 변경 요약(핵심)

### 1) Untitled-4 (Status SSOT)

* 기존 출력(유지): `out/ontology/hvdc.ttl`
* **추가 출력(기본 ON)** : `out/ontology/hvdc_ops_status.ttl`
* 비활성화 옵션: `--no-ops-ttl`
* 추가 옵션: `--base-iri` (인스턴스 IRI 베이스, 기본 `https://example.com/hvdc`)

### 2) Untitled-3 (Option C)

* 기존 CSV 출력(유지): `shipments.csv / cases.csv / flows.csv / locations.csv / events.csv ...`
* `--export-ttl` 사용 시  **추가 출력** : `{output-dir}/hvdc_ops_data.ttl` (기본 파일명)
* 추가 옵션:
  * `--base-iri` (기본 `https://example.com/hvdc`)
  * `--ttl-name` (기본 `hvdc_ops_data.ttl`)
  * `--ontology-ttl`, `--shapes-ttl` (있으면 TTL 옆으로 복사; 미지정 시 스크립트 폴더/cwd 자동 탐색)

---

## 실행 예시

### A) Status SSOT (Untitled-4)

```bash
python Untitled-4_embedded_ops_ttl.py \
  --status HVDC_all_status.json \
  --warehouse hvdc_warehouse_status.json \
  --outdir out \
  --base-iri https://example.com/hvdc
```

* 생성됨:
  * `out/ontology/hvdc.ttl`
  * `out/ontology/hvdc_ops_status.ttl`

### B) Option C Case (Untitled-3)

```bash
python Untitled-3_embedded_ops_ttl.py \
  --all hvdc_allshpt_status.json \
  --wh hvdc_warehouse_status.json \
  --customs HVDC_STATUS.json \
  --output-dir supabase_csv_optionC_v3 \
  --export-ttl \
  --base-iri https://example.com/hvdc
```

* 생성됨:
  * `supabase_csv_optionC_v3/hvdc_ops_data.ttl` (+ CSV들)

---

## 인스턴스 URI 규칙(고정)

* Shipment: `{base}/Shipment/{hvdc_code}`
* StatusEvent: `{base}/StatusEvent/{event_id}`
* Case: `{base}/Case/{hvdc_code}/{case_no}`
* Flow: `{base}/Flow/{hvdc_code}/{case_no}`
* Location: `{base}/Location/{location_code}`
* CaseEvent: `{base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}` *(자연키 기반 deterministic)*

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep`
2. **Next:** `/logi-master kpi-dash --KRsummary`
3. **Alt:** `/redo step`

원하시면 다음 단계로,  **Untitled-4의 StatusEvent도 `case.locations`에 매핑되는 경우 `hvdc:atLocation` 링크까지 생성** (현재는 `locationText`만 기록)하도록 추가 패치해드릴 수 있습니다.
