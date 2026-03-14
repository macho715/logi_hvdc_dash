다음은 **HVDC Dashboard v3 (완성형)** 기준의 **상세 패치 내역 (Patch Notes)**입니다.
실제 운영 Control Tower 기준으로 **UI / Data / Interaction / Architecture / Ops Logic**까지 나누어 정리했습니다.
(Lite 모드 요약 → 상세)

---

# HVDC Dashboard v3 — Patch Notes

## 1. Executive Summary

v3는 단순 UI 개선이 아니라 **Dashboard 역할 재정의**입니다.

핵심 변화:

| 영역          | v2         | v3                        |
| ----------- | ---------- | ------------------------- |
| Overview 역할 | Ops board  | **Control Tower Landing** |
| KPI         | 기술 지표      | **운영 의사결정 KPI**           |
| Map         | Heatmap 중심 | **Network Chain Map**     |
| Radar       | 전체 리스트     | **Top-priority only**     |
| Sites       | 상세         | **Health Snapshot**       |
| Drill-down  | 약함         | **Page launcher 구조**      |

결과

```
Overview = 판단
Pipeline = 흐름
Sites = 현장
Cargo = DB
Logistics Chain = 구조
```

---

# 2. UI 구조 변경

## 2.1 Header Bar

### Added

```
Flow Filter
Vendor Filter
Site Filter
72h Filter
Language Toggle
```

### Changed

```
Count | Value toggle
```

### Added

```
Updated timestamp indicator
```

---

# 2.2 Program KPI Bar

### v2

```
Total Shipments
Final Delivered
Open / Anomaly
Overdue ETA
Critical POD
Critical Mode
AGI Risk
Data Freshness
```

### v3

```
Total Shipments
Delivered %
Open Radar
Overdue
MOSB Pending
AGI Risk
Data Freshness
Next 72h Arrivals
```

### Reason

Control Tower KPI는

```
문제
지연
병목
```

을 바로 보여야 합니다.

---

# 3. Supply Chain Block (NEW)

### Added

Chain Funnel

```
Origin
Port / Air
Customs
Warehouse
MOSB
Site
```

### 기능

```
stage count
stage %
Δ change indicator
```

### Interaction

```
click stage
→ Cargo filter
```

---

# 4. Logistics Network Map

### v2

```
Origin arc map
Heatmap
Voyage
```

### v3

**Network map**

### Node Types

```
Port
Warehouse
MOSB
Site
HVDC Site
```

### Added

```
node hover summary
node click filter
```

### Added Legend

```
Origin Region
Europe
East SE Asia
Middle East
Americas
```

### Added Voyage Type

```
Flow 1-2 Direct
Flow 3-4 MOSB
```

---

# 5. Mission Control Panel

### v2

```
Critical
Action Queue
```

### v3

```
Critical Exceptions
Next 72h Arrivals
AGI / DAS Blockers
Action Queue
Recent Activity
```

### Added Rules

```
RED = blocking
AMBER = risk
BLUE = upcoming
```

---

# 6. Site Health Matrix

### v2

Sites page only

### v3

Overview snapshot

```
SHU
MIR
DAS
AGI
```

### Fields

```
assigned
delivered
pending
MOSB pending
overdue
risk %
```

### Added Risk Indicator

```
low
medium
high
```

---

# 7. Open Radar

### v2

```
full list
```

### v3

```
Top 10 priority
```

### Filter

```
All
Critical
Amber
Overdue
```

### Interaction

```
click
→ Cargo drawer
```

---

# 8. Ops Snapshot (NEW)

Overview 하단

```
WH Pressure
Active Worklist
Exceptions
Recent Activity
```

### WH Pressure

```
DSV Indoor
DSV Outdoor
Hauler Yard
```

### Visualization

```
occupancy bar
risk color
```

---

# 9. Navigation Launcher

Overview 하단

```
Logistics Chain 보기
Pipeline 보기
Sites 보기
Cargo 보기
```

역할

```
Overview → Drill Down
```

---

# 10. Logistics Chain Page

### Added

Origin Summary

```
Top countries by POL
```

### Added

Chain Flow

```
Origin → Port → WH → MOSB → Site
```

### Added

Chain Cases Table

```
Case
Site
Location
Route
Storage
Vendor
```

---

# 11. Pipeline Page

### Pipeline Stages

```
FC0 Pre-departure
FC1 In Transit
FC2 Port / Customs
FC3 Inland / WH
FC4 MOSB
FC5 Delivered
```

### Added Filters

```
Vendor
Route
Mode
Warehouse
Customs
```

---

# 12. Sites Page

### Per-site board

```
SHU
MIR
DAS
AGI
```

### Added Tabs

```
Summary
Route
Monthly
Pending
Vendor
```

### Added Storage Stats

```
Indoor
Outdoor
Outdoor Covered
```

---

# 13. Cargo Page

### Tabs

```
WH Status
Shipments
DSV Stock
```

### Filters

```
Stage
Site
Vendor
Route
Customs
```

### Table Columns

```
SCT Ship No
Vendor
POL → POD
ETD
ATA
Voyage Stage
Route
Site
Customs
```

### Drawer

```
shipment timeline
documents
location history
```

---

# 14. Data Model Patch

### Problem (v2)

혼합 모델

```
Shipment
Cases
Voyages
```

### v3 구조

```
Shipment
 └ Case
     └ Package
```

### Additional Tables

```
program_summary_v2
ops_snapshot_v1
site_health_v1
chain_stage_v1
```

---

# 15. Interaction Layer

### Global Filters

```
Site
Vendor
Flow
Time
```

### Behavior

```
map click
site card click
stage click
```

→ **global filter**

---

# 16. Performance Improvements

### Removed

```
map + radar + ops waterfall loading
```

### Added

```
data aggregation endpoints
```

### Cache

```
overview
30s refresh
```

---

# 17. Accessibility

### WCAG 2.2

Added

```
keyboard navigation
focus ring
map zoom buttons
```

---

# 18. Architecture Changes

### Components

```
OverviewPage
ProgramBar
ChainSummary
NetworkMap
MissionControl
SiteHealthMatrix
OpenRadar
OpsSnapshot
NavStrip
```

---

# 19. Visual Design

### Theme

```
Dark Control Tower
```

### Color System

```
Green = Healthy
Amber = Risk
Red = Critical
Blue = Info
```

---

# 20. Final Result

v3의 목표

```
10초 안에 판단 가능
```

운영자가 보는 흐름

```
1 KPI
2 Chain
3 Map
4 Critical
5 Sites
6 Radar
```

---

# 원하시면 제가 다음도 만들어드리겠습니다

1️⃣ **HVDC Dashboard v4 (Production Architecture)**
2️⃣ **전체 React / Tailwind UI 구조**
3️⃣ **Control Tower 데이터 모델 설계**
4️⃣ **실제 EPC 물류용 Dashboard Best Practice**

특히 지금 시스템은 이미

```
80% 완성
```

상태라서

**조금만 구조 다듬으면 세계 수준 Control Tower가 됩니다.**
