# HVDC Supabase 구성 Runbook (Status SSOT + Case Option-C + Ontology)

## 0) 입력/산출물 짝(SSOT)
- 원본(JSON)
  - supabass_ontol/HVDC all status.json
  - supabass_ontol/hvdc_warehouse_status.json
- ETL 산출물(CSV)
  - hvdc_output/supabase/*.csv  (Status 레이어: Untitled-4)
  - hvdc_output/optionC/*.csv   (Case 레이어: Untitled-5/Option-C)
- Ontology(TTL)
  - hvdc_output/ontology/hvdc_ops_data.ttl (export_hvdc_ops_ttl.py)

## 1) 구성 순서(정답 루트)
1. **DDL 적용**: 20260124_hvdc_layers_status_case_ops.sql 실행  
2. **CSV 로드**: status → case 순서 (locations 먼저)  
3. **Gate 1 QA**: Coverage/Orphan/Duplicate/Flow5 룰 검증  
4. **대시보드 연결**: public.v_* 뷰만 읽도록 고정  
5. **Ontology export**: export_hvdc_ops_ttl.py 실행 → TTL 생성 + SHACL 검증(선택)

## 2) CSV 로드 권장 순서
### 2.1 Status(SSOT)
- hvdc_output/supabase/shipments.csv  → status.shipments_status
- hvdc_output/supabase/logistics_events.csv → status.events_status

### 2.2 Case(Option-C)
- hvdc_output/optionC/locations.csv → case.locations  (먼저)
- hvdc_output/optionC/shipments.csv → case.shipments_case
- hvdc_output/optionC/cases.csv → case.cases
- hvdc_output/optionC/flows.csv → case.flows
- hvdc_output/optionC/events.csv → case.events_case
- hvdc_output/optionC/events_debug.csv → case.events_case_debug (옵션)

> Supabase hosted 환경에서는 서버-side COPY가 제한될 수 있으므로, **psql \copy(클라이언트) 또는 Table Editor Import**를 사용.

## 3) Gate 1 QA (통과 조건)
### 3.1 Orphan 체크
```sql
select count(*)::bigint as orphan_status_events
from status.events_status es
left join status.shipments_status ss on ss.hvdc_code = es.hvdc_code
where ss.hvdc_code is null;

select count(*)::bigint as orphan_case_events
from "case".events_case e
left join "case".cases c on c.hvdc_code=e.hvdc_code and c.case_no=e.case_no
where c.hvdc_code is null;
```

### 3.2 Duplicate (natural key)
```sql
select
  hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
  count(*)::bigint as cnt
from "case".events_case
group by 1,2,3,4,5,6,7
having count(*) > 1
order by cnt desc;
```

### 3.3 Flow rule (flow_code=5 → requires_review=true)
```sql
select count(*)::bigint as bad_flow5
from "case".flows
where flow_code=5 and requires_review is not true;
```

## 4) 대시보드 데이터 소스(고정)
- public.v_shipments_master
- public.v_shipments_timeline
- public.v_cases_kpi
- public.v_case_segments
- public.v_case_event_segments
- public.v_kpi_site_flow_daily

> 프론트에서 JOIN 금지. View만 조회.

