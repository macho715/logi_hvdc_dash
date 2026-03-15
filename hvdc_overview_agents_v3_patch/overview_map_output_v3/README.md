# HVDC Overview v3 Patch

## 목적
`AGENTS.md` 기준으로 Overview/Data contract를 100% 맞추기 위한 안전 패치입니다.

## 포함 파일
- `AGENTS.md`
- `build_overview_maps.py`
- `overview-map-types.ts`
- `OverviewVoyageMapV3.tsx`
- 생성 JSON 8종

## v3에서 수정한 핵심
1. Global 경로에 `POL` 복원
2. `Overview stage`는 milestone only 유지
3. `mosb_milestone`와 `offshore_routing_required` 분리
4. `wh_detail.json / cargo_drilldown.json / flow_code_summary.json` 추가
5. `[ASSUMPTION]`를 `manifest.json`에 명시
6. Vendor 하드코딩 제거 유지
7. WH optional 유지

## 적용 위치 권장
- Python: `scripts/build_overview_maps.py`
- TS types: `components/overview/overview-map-types.ts`
- React: `components/overview/OverviewVoyageMapV3.tsx`
- JSON: `public/data/*.json`

## 실행
```bash
python build_overview_maps.py --input "HVDC STATUS1.xlsx" --outdir overview_map_output_v3
```

## [ASSUMPTION]
- exact repo import path / page wiring은 현재 업로드 repo 전체 tree를 직접 수정하지 않았으므로 수동 연결이 필요합니다.
- existing `OverviewMap.tsx`는 deck.gl/maplibre 기반이므로, 본 `OverviewVoyageMapV3.tsx`는 별도 safe component로 추가하는 방식이 기본입니다.
