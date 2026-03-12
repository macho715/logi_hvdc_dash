‘전체 다 수정’에 해당하는 남은 작업을 정리했습니다. **Ask 모드**라서 제가 직접 수정은 할 수 없고, 수정할 파일·위치·내용만 정리합니다. 적용하려면 **Agent 모드**로 전환한 뒤 “전체 다 수정해줘”라고 요청하세요.

---

## 1. POI 데이터 (ontology와 맞추기)

### 1.1 `poiLocations.ts`

| 항목 | 현재 | 수정 방향 |
|------|------|-----------|
| **mosb-esnaad** | MOSB (ESNAAD), 24.32479, 54.46685 | **제거** (LOC-MOSB 삭제됨). 또는 MOSB YARD 역할이면 LOC-MOSB-SCT-YARD와 동일하게 `name: "MOSB YARD"`, `displayLabel: "MOSB YARD"`, 좌표 24.331414, 54.456911 로 **대체** |
| **mosb-samsung-yard** | MOSB-SAM, 24.32479, 54.46685 | `displayLabel: "MOSB-SCT"` 추가. 좌표는 MOSB-SCT-OFFICE(24.32479, 54.46685)에 맞게 유지 |
| **dsv-mussafah-warehouse-m44** | 24.3447, 54.58183 (Baniyas) | **24.347077, 54.456911** (Mussafah M-44)로 변경. `displayLabel: "DSV WAREHOUSE"` 추가 |
| **dsv-mussafah-office-m19** | DSV-M19 | `displayLabel: "DSV OFFICE"` 추가 |
| **agi, das, mir, shu, kpp, mzp, auh** | code/summary만 | 각각 `displayLabel`: `"AGI"`, `"DAS"`, `"MIR"`, `"SHU"`, `"KPP"`, `"MZP"`, `"AUH"` 등 약어로 추가 |

### 1.2 `hvdcPoiLocations.ts`

- 위와 동일하게 **mosb-esnaad** 제거 또는 MOSB YARD로 대체, **mosb-samsung-yard** → `displayLabel: "MOSB-SCT"`, **dsv-m44** 좌표·`displayLabel: "DSV WAREHOUSE"` 보정.
- AGI, DAS, DSV OFFICE, MOSB, MOSB-SCT 등 **displayLabel** 통일.

---

## 2. 라벨 표시 (한 가지 스타일로 통일)

### 2.1 `PoiLocationsLayer.ts`

- `getText`: `d.displayLabel ?? \`${d.code} - ${d.summary}\`` 형태로 **displayLabel 우선** 사용.

### 2.2 `HvdcPoiLayers.ts`

- `getText`: `d.displayLabel ?? \`${d.code} · ${d.summary}\`` 형태로 **displayLabel 우선** 사용.

---

## 3. 타입 정의

### 3.1 `packages/shared/src/types/index.ts` (또는 `poiTypes` 등)

- `PoiLocation` / `HvdcPoi` 에 `displayLabel?: string` 추가.

---

## 4. DSV M44 중복 표시

- Location / PoiLocations / HvdcPoi **세 곳**에서 DSV M44가 나와 “2군데서 나온다”고 한 상태.
- **옵션 A**: Location만 쓰고 POI 두 레이어에서는 DSV-M44 **제거**.
- **옵션 B**: POI 중 **한 레이어에서만** DSV-M44 유지하고, 나머지에서는 제거.
- **공통**: 유지하는 쪽은 좌표 **24.347077, 54.456911** 와 `displayLabel: "DSV WAREHOUSE"` 로 통일.

---

## 5. GeoJSON·기타

- `map/HVDC_Location_Master_GeoJSON_FeatureCollection.geojson` (또는 ontology에서 파생하는 GeoJSON)을 쓰고 있다면, **LOC-MOSB 제거**·**MOSB-SCT-OFFICE / MOSB-SCT-YARD** 반영·**DSV-M44 좌표** 수정으로 ontology와 동기화.

---

## 6. 체크리스트 (전체 다 수정 시)

| # | 대상 | 작업 |
|---|------|------|
| 1 | `poiLocations.ts` | mosb-esnaad 제거 또는 MOSB YARD로 대체, DSV-M44 좌표+displayLabel, MOSB-SCT·AGI·DAS 등 displayLabel |
| 2 | `hvdcPoiLocations.ts` | 동일 정렬 |
| 3 | `PoiLocationsLayer.ts` | getText에 displayLabel 우선 사용 |
| 4 | `HvdcPoiLayers.ts` | getText에 displayLabel 우선 사용 |
| 5 | `PoiLocation` / `HvdcPoi` 타입 | `displayLabel?: string` 추가 |
| 6 | DSV M44 중복 | 한 레이어로 통합 또는 제거로 “2군데” 해소 |
| 7 | GeoJSON (사용 시) | ontology와 동기화 |

---

**정리**: “전체 다 수정”은 위 1~7을 ontology·이전 대화 내용 기준으로 모두 반영하는 것입니다.
**Agent 모드**로 바꾼 뒤 **“전체 다 수정해줘”**라고 하시면, 위 항목대로 코드/설정 수정까지 진행할 수 있습니다.
