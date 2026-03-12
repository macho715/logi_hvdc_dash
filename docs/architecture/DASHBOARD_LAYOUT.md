# 대시보드 전체 레이아웃 문서

> **HVDC + Logistics 통합 대시보드 레이아웃 사양**  
> **최종 업데이트**: 2026-01-26  
> **구현 파일**: `apps/logistics-dashboard/components/UnifiedLayout.tsx`, `packages/ui-components/src/UnifiedLayout.tsx`

---

## 📐 레이아웃 개요

### 핵심 원칙 (레이아웃 불변)

통합 대시보드는 **2패널 레이아웃**을 기본으로 하며, 다음 구조를 유지합니다:

### 레이아웃 구조 다이어그램

```mermaid
graph TB
    subgraph "UnifiedLayout"
        subgraph "HeaderBar 96px fixed top-0"
            HeaderTop[Top Row<br/>GlobalSearch + Navigation]
            HeaderBottom[Bottom Row<br/>KPI Summary Strip<br/>aria-live polite]
        end
        
        subgraph "Main Content Area overflow-y-auto pt-24"
            subgraph "MapView + DetailDrawer flex row"
                MapView[MapView<br/>flex-[2] 2/3<br/>Zoom-based Layer Visibility]
                DetailDrawer[DetailDrawer<br/>flex-[1] 1/3<br/>Sidepanel Mode]
            end
            
            subgraph "HVDC Panel normal flow"
                KpiStrip[KpiStrip<br/>Real-time KPIs]
                WorklistTable[WorklistTable<br/>Simplified: Gate/Title/Due/Score]
            end
        end
    end
    
    HeaderTop --> MapView
    HeaderBottom --> MapView
    MapView --> DetailDrawer
    MapView --> KpiStrip
    KpiStrip --> WorklistTable
    WorklistTable --> DetailDrawer
```

```
┌─────────────────────────────────────────────────────────────┐
│  HeaderBar (고정, 높이: 96px, 2행 구조)                      │
│  - 상단: GlobalSearch (검색창)                               │
│  - 하단: KPI 요약 스트립 (고정, aria-live="polite")          │
├─────────────────────────────────────────────────────────────┤
│  스크롤 가능한 영역 (overflow-y-auto)                        │
│  ┌──────────────────────────┬──────────────────────────┐   │
│  │                          │                          │   │
│  │   MapView (2/3)          │   DetailDrawer (1/3)     │   │
│  │   - flex-[2]             │   - flex-[1]             │   │
│  │   - min-h-[calc(100vh-96px)]                         │   │
│  │   - POI Layer            │   - Sidepanel Mode       │   │
│  │   - Location Layer       │   - Case Details         │   │
│  │   - Heatmap Layer        │   - Flow Code Info       │   │
│  │   - Geofence Layer       │   - Triggers Section     │   │
│  │   - ETA Wedge Layer      │                          │   │
│  │                          │                          │   │
│  └──────────────────────────┴──────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  HVDC Panel (하단, 일반 레이아웃)                      │ │
│  │  - 전체 너비 (w-full)                                  │ │
│  │  - 높이: h-80 (320px)                                 │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  StageCardsStrip (상단, 3카드)                  │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  KpiStrip (실시간 KPI)                         │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  WorklistTable (하단, 스크롤 가능)              │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 레이아웃 불변 규칙

1. **HeaderBar는 항상 상단에 고정** (fixed top-0, 96px)
2. **MapView와 DetailDrawer는 2:1 비율로 가로 배치** (flex-[2]:flex-[1])
3. **HVDC Panel은 일반 레이아웃으로 하단에 배치** (fixed positioning 제거)
4. **HeaderBar 제외한 전체 영역이 세로 스크롤 가능** (overflow-y-auto)
5. **모바일에서는 HVDC Panel이 드래그 가능** (fixed bottom-0, 드래그 핸들)

---

## 🖥️ 데스크탑 레이아웃 (≥1024px)

### 레이아웃 구조

```mermaid
graph TB
    subgraph "Desktop Layout ≥1024px"
        subgraph "HeaderBar 96px fixed top-0"
            HeaderTop[Top Row<br/>GlobalSearch<br/>Navigation]
            HeaderBottom[Bottom Row<br/>KPI Summary Strip<br/>aria-live polite]
        end
        
        subgraph "Main Content Area overflow-y-auto pt-24"
            subgraph "MapView + DetailDrawer flex row"
                MapView[MapView<br/>flex-[2] 2/3<br/>Zoom-based Layers]
                DetailDrawer[DetailDrawer<br/>flex-[1] 1/3<br/>Sidepanel Mode]
            end
            
            subgraph "HVDC Panel normal flow"
                HVDCPanel[HVDC Panel<br/>h-80 320px<br/>w-full]
            end
        end
    end
    
    HeaderTop --> MapView
    HeaderBottom --> MapView
    MapView --> DetailDrawer
    MapView --> HVDCPanel
    DetailDrawer --> HVDCPanel
```

```
┌─────────────────────────────────────────────────────────────┐
│  HeaderBar (96px, 2행 구조, fixed top-0)                    │
│  - 상단: GlobalSearch, 네비게이션                            │
│  - 하단: KPI 요약 스트립 (고정)                              │
├─────────────────────────────────────────────────────────────┤
│  스크롤 가능한 영역 (overflow-y-auto, pt-24)                │
│  ┌──────────────────────────┬──────────────────────────┐   │
│  │                          │                          │   │
│  │   MapView (2/3)          │   DetailDrawer (1/3)     │   │
│  │   - flex-[2]             │   - flex-[1]             │   │
│  │   - min-h-[calc(100vh-96px)]                         │   │
│  │   - Location Layer       │   - Sidepanel Mode       │   │
│  │   - Heatmap Layer        │   - Case Details         │   │
│  │   - Geofence Layer       │   - Flow Code Info       │   │
│  │   - ETA Wedge Layer      │   - Triggers Section     │   │
│  │   - POI Layer            │                          │   │
│  │                          │                          │   │
│  └──────────────────────────┴──────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  HVDC Panel (하단, 일반 레이아웃)                      │ │
│  │  - 전체 너비 (w-full)                                  │ │
│  │  - 높이: h-80 (320px)                                 │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  StageCardsStrip (상단, 3카드)                  │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  KpiStrip (실시간 KPI)                         │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  WorklistTable (하단, 스크롤 가능)              │ │ │
│  │  │  - Gate/Title/Due/Score만 표시                  │ │ │
│  │  │  - 상세는 DetailDrawer                          │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 패널 상세

#### 1. HeaderBar
- **위치**: 최상단 고정
- **높이**: 96px (2행 구조, pt-24)
- **구조**:
  - 상단 행: GlobalSearch, 네비게이션, 사용자 메뉴, 설정
  - 하단 행: KPI 요약 스트립 (고정, `aria-live="polite"`)
- **기능**: 
  - 네비게이션
  - 사용자 메뉴
  - 설정
  - 실시간 KPI 요약 표시

#### 2. MapView (좌측)
- **위치**: 메인 영역 좌측
- **크기**: flex-1 (남은 공간 차지)
- **최소 너비**: min-w-0 (오버플로우 방지)
- **최소 높이**: min-h-0 (flex 컨테이너 내 스크롤 영역 보존)
- **레이어**:
  - Location Layer (위치 마커)
  - Heatmap Layer (밀도 히트맵)
  - Geofence Layer (지오펜스 경계)
  - ETA Wedge Layer (ETA 예측 웨지)
  - POI Layer (고정 POI 마커 및 라벨)
- **인터랙션**:
  - 클릭: 위치 선택 → Worklist 필터 적용
  - 줌/팬: 표준 지도 제스처
  - 하이라이트: 선택된 케이스 강조
- **레이어 가시성 (줌 기반 + 토글 충돌 방지 기준)**:

```mermaid
graph TB
    subgraph "Layer Visibility Logic"
        Zoom[Current Zoom Level]
        HeatmapToggle[Heatmap Toggle]
        GeofenceToggle[Geofence Toggle]
        
        Zoom --> CheckHeatmap{Heatmap Toggle ON?}
        CheckHeatmap -->|Yes| CheckZoom1{Zoom < 9.5?}
        CheckHeatmap -->|No| HideHeatmap[Hide Heatmap]
        CheckZoom1 -->|Yes| ShowHeatmap[Show Heatmap + Legend]
        CheckZoom1 -->|No| HideHeatmap
        
        Zoom --> CheckStatus{Zoom >= 9.5?}
        CheckStatus -->|Yes| ShowStatus[Show Location Status]
        CheckStatus -->|No| HideStatus[Hide Location Status]
        
        Zoom --> CheckPOI{Zoom >= 7.5?}
        CheckPOI -->|Yes| ShowPOI[Show POI Markers]
        CheckPOI -->|No| HidePOI[Hide POI]
        
        Zoom --> CheckPOILabel{Zoom >= 10.5?}
        CheckPOILabel -->|Yes| ShowDetailedLabels[Show Detailed POI Labels]
        CheckPOILabel -->|No| CheckPOICompact{Zoom >= 7.5 AND Zoom < 10.5?}
        CheckPOICompact -->|Yes| ShowCompactLabels[Show Compact POI Labels]
        CheckPOICompact -->|No| HidePOILabels[Hide POI Labels]
        
        GeofenceToggle --> CheckGeofence{Geofence Toggle ON?}
        CheckGeofence -->|Yes| ShowGeofence[Show Geofence]
        CheckGeofence -->|No| HideGeofence[Hide Geofence]
    end
```

**레이어 가시성 규칙**:
  - **Heatmap**: 줌 < 9.5일 때 표시. Heatmap 토글이 **켜져 있을 때만** 활성화됨. 히트맵 강도 범례 표시 (낮음~매우 높음).
  - **Location(Status)**: 줌 ≥ 9.5일 때 표시.
  - **POI 마커**: 줌 ≥ 7.5일 때 표시.
  - **POI 라벨**: 줌 7.5~10.5 구간에서는 **코드만** 표시 (컴팩트 모드), 줌 ≥ 10.5에서는 상세 라벨 표시 (상세 모드).
  - **Geofence**: 줌과 무관하게 토글 상태를 우선하며, Heatmap/Status 전환과 충돌하지 않음.
  - **토글 우선순위**: **사용자 토글 OFF → 항상 숨김**, **토글 ON → 줌 조건 충족 시 표시**.
  - **히트맵 반경**: 줌 레벨에 따라 스케일링 (밀도 표현 최적화)

#### 3. DetailDrawer (우측, 1/3 너비)
- **위치**: MapView 우측, flex-[1] (1/3 너비)
- **크기**: flex-[1] (전체 너비의 1/3)
- **최소 높이**: min-h-0 (flex 컨테이너 내 스크롤 영역 보존)
- **모드**: "sidepanel" (데스크탑)
- **표시 조건**: 선택된 케이스가 있을 때
- **내용**: 
  - 케이스 상세 정보
  - Flow Code 정보
  - Triggers 섹션 (워크리스트에서 이동)
- **스크롤**: 부모 컨테이너의 세로 스크롤에 포함

#### 4. HVDC Panel (하단)
- **위치**: 일반 레이아웃 흐름으로 하단에 배치 (fixed positioning 제거)
- **크기**: 
  - 너비: w-full (전체 너비)
  - 높이: h-80 (320px 고정)
- **구조**:
  - StageCardsStrip (상단, 3카드)
  - KpiStrip (중간, 실시간 KPI)
  - WorklistTable 컨테이너 (하단, overflow-auto)
    - 스크롤: overflow-auto (세로 스크롤 활성화)
    - 간소화된 컬럼: Gate, Title, Due, Score만 표시
    - 상세 정보는 DetailDrawer에서 확인 (Triggers 포함)
- **스크롤**: 부모 컨테이너의 세로 스크롤에 포함

---

## 📱 모바일 레이아웃 (<1024px)

### 레이아웃 구조 다이어그램

```mermaid
graph TB
    subgraph "Mobile Layout <1024px"
        subgraph "HeaderBar 96px fixed"
            MobileHeaderTop[Top Row<br/>GlobalSearch]
            MobileHeaderBottom[Bottom Row<br/>KPI Summary Strip]
        end
        
        subgraph "Main Content pt-24"
            MobileMapView[MapView<br/>Full Width<br/>All Layers Available]
        end
        
        subgraph "HVDC Panel Draggable"
            MobileDragHandle[Drag Handle<br/>h-1 w-12]
            MobileKpiStrip[KpiStrip]
            MobileWorklistTable[WorklistTable<br/>Scrollable]
        end
        
        MobileDetailDrawer[DetailDrawer<br/>Overlay Mode<br/>Full Screen]
    end
    
    MobileHeaderTop --> MobileMapView
    MobileHeaderBottom --> MobileMapView
    MobileMapView --> MobileDragHandle
    MobileDragHandle --> MobileKpiStrip
    MobileKpiStrip --> MobileWorklistTable
    MobileWorklistTable --> MobileDetailDrawer
```

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  HeaderBar (96px, 2-row)           │
│  - 상단: GlobalSearch               │
│  - 하단: KPI 요약 스트립             │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │   MapView (전체 너비)          │ │
│  │   - flex-1                    │ │
│  │   - Location Layer            │ │
│  │   - Heatmap Layer             │ │
│  │   - Geofence Layer           │ │
│  │   - ETA Wedge Layer          │ │
│  │   - POI Layer                │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ═══ (드래그 핸들)              │ │
│  │  HVDC Panel (드래그 가능)       │ │
│  │  - 높이: 200-600px (조절 가능)  │ │
│  │  - 기본: 320px                 │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │  KpiStrip               │ │ │
│  │  └─────────────────────────┘ │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │  WorklistTable (스크롤)  │ │ │
│  │  └─────────────────────────┘ │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  DetailDrawer (오버레이)       │ │
│  │  - mode: "overlay"            │ │
│  │  - 전체 화면 덮음              │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 모바일 특화 기능

#### 1. HVDC Panel 드래그 제스처

```mermaid
stateDiagram-v2
    [*] --> DefaultHeight: Initial Load
    DefaultHeight --> Expanded: Drag Up
    DefaultHeight --> Collapsed: Drag Down
    Expanded --> DefaultHeight: Release
    Collapsed --> DefaultHeight: Release
    DefaultHeight --> Collapsed: Enter/Space (Toggle)
    Collapsed --> DefaultHeight: Enter/Space (Toggle)
    
    note right of DefaultHeight
        Height: 320px
        MIN: 200px
        MAX: 600px
    end note
```

- **드래그 핸들**: 상단 중앙의 회색 바 (h-1, w-12)
- **높이 범위**: 200px (MIN) ~ 600px (MAX)
- **기본 높이**: 320px (DEFAULT)
- **제스처**:
  - 위로 드래그: 패널 확대
  - 아래로 드래그: 패널 축소
  - 키보드: Enter/Space로 토글 (최소/기본 높이)
- **터치 지원**: touchstart, touchmove, touchend

#### 2. DetailDrawer 오버레이 모드
- 모바일에서는 DetailDrawer가 오버레이 모드로 표시됨
- 전체 화면을 덮는 모달 형태

#### 3. DetailDrawer 오버레이 모드
- **모드**: "overlay"
- **표시**: 전체 화면을 덮는 모달 형태
- **닫기**: ESC 키 또는 배경 클릭

---

## 🧩 컴포넌트 계층 구조

### 컴포넌트 계층 다이어그램

```mermaid
graph TD
    UnifiedLayout[UnifiedLayout.tsx]
    
    UnifiedLayout --> HeaderBar[HeaderBar<br/>96px, 2-row layout<br/>fixed top-0]
    UnifiedLayout --> MainContent[Main Content Area<br/>overflow-y-auto pt-24]
    
    MainContent --> MapDetailRow[MapView + DetailDrawer Row<br/>flex row]
    MainContent --> HVDCPanel[HVDC Panel Component<br/>h-80 w-full]
    
    MapDetailRow --> MapView[MapView Component<br/>flex-[2] 2/3<br/>Zoom-based Layers]
    MapDetailRow --> DetailDrawer[DetailDrawer Component<br/>flex-[1] 1/3<br/>Sidepanel Mode]
    
    HeaderBar --> HeaderTop[Top Row<br/>GlobalSearch + Navigation]
    HeaderBar --> HeaderBottom[Bottom Row<br/>KPI Summary Strip]
    
    MapView --> LocationLayer[Location Layer<br/>deck.gl ScatterplotLayer<br/>Zoom >= 9.5]
    MapView --> HeatmapLayer[Heatmap Layer<br/>deck.gl HeatmapLayer<br/>Zoom < 9.5 + Legend]
    MapView --> GeofenceLayer[Geofence Layer<br/>deck.gl PathLayer]
    MapView --> ETAWedgeLayer[ETA Wedge Layer<br/>deck.gl ArcLayer]
    MapView --> PoiLayer[POI Layer<br/>deck.gl ScatterplotLayer + TextLayer<br/>Zoom >= 7.5, Compact/Detailed Labels]
    MapView --> HeatmapLegend[HeatmapLegend<br/>Intensity Scale]
    
    HVDCPanel --> StageCardsStrip[StageCardsStrip<br/>3 Cards, Routing]
    HVDCPanel --> KpiStrip[KpiStrip<br/>Real-time KPIs]
    HVDCPanel --> WorklistTable[WorklistTable<br/>Simplified Columns]
    
    WorklistTable --> WorklistRow[WorklistRow<br/>Gate/Title/Due/Score]
    WorklistTable --> FilterBar[FilterBar]
    
    DetailDrawer --> CaseDetails[Case Details]
    DetailDrawer --> FlowCodeInfo[Flow Code Info]
    DetailDrawer --> TriggersSection[Triggers Section]
```

### 텍스트 계층 구조

```
UnifiedLayout
├── HeaderBar (96px, 2-row, fixed top-0)
│   ├── Top Row: GlobalSearch + Navigation
│   └── Bottom Row: KPI Summary Strip
└── Main Content Area (overflow-y-auto, pt-24)
    ├── MapView + DetailDrawer Row (flex row)
    │   ├── MapView (flex-[2], 2/3)
    │   │   ├── Location Layer (deck.gl, Zoom ≥9.5)
    │   │   ├── Heatmap Layer (deck.gl, Zoom <9.5 + Legend)
    │   │   ├── Geofence Layer (deck.gl)
    │   │   ├── ETA Wedge Layer (deck.gl)
    │   │   ├── POI Layer (deck.gl, Zoom ≥7.5)
    │   │   └── HeatmapLegend (Intensity Scale)
    │   └── DetailDrawer (flex-[1], 1/3, Sidepanel Mode)
    │       ├── Case Details
    │       ├── Flow Code Info
    │       └── Triggers Section
    └── HVDC Panel (h-80 w-full, normal flow)
        ├── StageCardsStrip (3 Cards)
        ├── KpiStrip
        │   ├── ConnectionStatusBadge
        │   └── KPI Cards
        └── WorklistTable
            ├── Filter Controls
            └── Table Rows (Gate/Title/Due/Score)
```

---

## 🔄 상호작용 및 동기화

### 상호작용 플로우 다이어그램

```mermaid
sequenceDiagram
    participant User
    participant MapView
    participant WorklistTable
    participant DetailDrawer
    participant RightPanel
    participant Realtime
    
    User->>MapView: Click Location
    MapView->>WorklistTable: Filter by case_id
    MapView->>DetailDrawer: Open with case details
    
    User->>WorklistTable: Click Row
    WorklistTable->>MapView: Highlight location
    WorklistTable->>DetailDrawer: Open with case details
    
    Realtime->>WorklistTable: Update data
    Realtime->>MapView: Update layers
    Realtime->>DetailDrawer: Update case details
```

### 1. Map ↔ Worklist 동기화

**Map 클릭 시**:
1. 선택된 위치의 `case_id` 추출
2. WorklistTable에 필터 적용 (`selected_case_id`)
3. DetailDrawer 열기 (해당 케이스 상세 정보)

**Worklist Row 클릭 시**:
1. 선택된 케이스의 `case_id` 추출
2. MapView에서 해당 위치 하이라이트
3. DetailDrawer 열기 (케이스 상세 정보)

### 2. 필터 동기화

- **Gate 필터**: Map 색상, Worklist 표시, KPI 계산에 동시 반영
- **Site 필터**: Map 마커, Worklist 행에 반영
- **Time Window**: 모든 패널의 데이터 범위 조정

### 3. Realtime 업데이트

- **KPI 업데이트**: Supabase Realtime → KpiStrip 자동 갱신
- **Worklist 업데이트**: DB 변경 → WorklistTable 자동 갱신
- **Map 업데이트**: Location Status 변경 → MapView 레이어 갱신

---

## ♿ 접근성 (WCAG 2.2 AA)

### 키보드 네비게이션

- **Tab**: 모든 인터랙티브 요소 순차 이동
- **Enter/Space**: 버튼/링크 활성화
- **ESC**: DetailDrawer 닫기, 모달 닫기
- **화살표 키**: WorklistTable 행 이동 (향후 구현)

### ARIA 레이블

- `role="main"`: MapView
- `aria-label="Logistics Map View"`: MapView
- `aria-label="HVDC Worklist Panel"`: HVDC Panel
- `aria-label="Drag to resize panel"`: 드래그 핸들 (모바일)

### 포커스 관리

- DetailDrawer 열릴 때: 포커스 트랩 (향후 구현)
- DetailDrawer 닫힐 때: 이전 포커스로 복귀
- 모바일 패널 드래그: 키보드 접근 가능 (Enter/Space)

### 색상 대비

- **기본**: 다크 모드 (WCAG AA 기준 충족)
- **타이포그래피**: 
  - 기본 폰트 크기: 16px (html { font-size: 16px; })
  - 주요 라벨: text-sm (14px)
  - 대비 개선: `--muted-foreground` oklch(0.72 0 0) (가독성 향상)
- **상태 색상**:
  - OK: Green (#22c55e, 대비 4.5:1 이상)
  - Warning: Amber (#f59e0b, 대비 4.5:1 이상)
  - Critical: Red (#ef4444, 대비 4.5:1 이상)

---

## 📏 반응형 브레이크포인트

### 반응형 레이아웃 다이어그램

```mermaid
graph LR
    subgraph "Mobile <1024px"
        MobileMap[MapView<br/>Full Width]
        MobilePanel[HVDC Panel<br/>Draggable 200-600px]
        MobileDrawer[DetailDrawer<br/>Overlay Mode]
    end
    
    subgraph "Desktop ≥1024px"
        DesktopMap[MapView<br/>flex-1]
        DesktopRight[RightPanel<br/>w-80 320px]
        DesktopPanel[HVDC Panel<br/>Fixed 260px]
        DesktopDrawer[DetailDrawer<br/>Sidepanel Mode]
    end
    
    MobileMap --> MobilePanel
    MobilePanel --> MobileDrawer
    
    DesktopMap --> DesktopRight
    DesktopMap --> DesktopPanel
    DesktopRight --> DesktopPanel
    DesktopPanel --> DesktopDrawer
```

### Tailwind CSS 기준

- **모바일**: < 1024px (lg 미만)
  - MapView: 전체 너비
  - DetailDrawer: 오버레이 모드 (전체 화면)
  - HVDC Panel: 드래그 가능, 하단 고정 (200-600px)

- **데스크탑**: ≥ 1024px (lg 이상)
  - MapView: flex-[2] (2/3 너비)
  - DetailDrawer: flex-[1] (1/3 너비, Sidepanel 모드)
  - HVDC Panel: 일반 레이아웃, h-80 (320px), 전체 너비

---

## 🎨 스타일 가이드

### 색상 시스템

- **배경**: `bg-background` (다크 모드 기본)
- **카드**: `bg-card` (패널 배경)
- **테두리**: `border-border` (구분선)
- **텍스트**: `text-foreground` (기본 텍스트)

### 간격 시스템

- **패널 패딩**: p-4 (16px)
- **패널 간격**: border-b (구분선)
- **헤더 높이**: 96px (pt-24, 2행 구조)
- **메인 콘텐츠 상단 여백**: pt-24 (헤더 높이 반영)

### 레이아웃 컨테이너 높이 설정

- **루트 컨테이너**: `min-h-screen flex flex-col` (최소 화면 높이, flex column)
- **메인 콘텐츠 영역**: `flex-1 overflow-y-auto pt-24` (남은 공간 차지, 세로 스크롤)
- **MapView + DetailDrawer Row**: `flex min-h-[calc(100vh-96px)]` (최소 높이: 뷰포트 - 헤더)
- **MapView 컨테이너**: `flex-[2] min-h-0` (2/3 너비, flex 컨테이너 내 스크롤 영역 보존)
- **DetailDrawer 컨테이너**: `flex-[1] min-h-0` (1/3 너비, flex 컨테이너 내 스크롤 영역 보존)
- **HVDC Panel**: `w-full h-80` (전체 너비, 고정 높이 320px)
- **WorklistTable 컨테이너**: `overflow-auto` (세로 스크롤 활성화)

### Z-index 계층

- **HeaderBar**: z-10 (기본)
- **HVDC Panel**: z-40 (패널)
- **DetailDrawer**: z-50 (오버레이)

---

## 🔧 구현 세부사항

### 상태 관리

- **Zustand Store**: `useOpsActions()` 사용
- **상태**:
  - `selectedCaseId`: 선택된 케이스 ID
  - `selectedLocationId`: 선택된 위치 ID
  - `drawerOpen`: DetailDrawer 열림/닫힘
  - `filters`: Gate, Site, Time Window 필터

### 데이터 로딩

```mermaid
sequenceDiagram
    participant App as UnifiedLayout
    participant InitLoad as useInitialDataLoad
    participant MapLoad as Map Data Load
    participant Realtime as useKpiRealtime
    participant API as API Routes
    participant DB as Supabase
    
    App->>InitLoad: Initial Load
    InitLoad->>API: GET /api/worklist
    API->>DB: Query public.shipments
    DB-->>API: 871 rows + KPI
    API-->>InitLoad: Payload
    InitLoad->>App: Store Data
    
    App->>MapLoad: Load Map Data
    MapLoad->>API: GET /api/locations
    MapLoad->>API: GET /api/location-status
    MapLoad->>API: GET /api/events
    API-->>MapLoad: Map Data
    MapLoad->>App: Update Store
    
    App->>Realtime: Subscribe
    Realtime->>DB: Realtime Channel
    DB-->>Realtime: Change Events
    Realtime->>App: Update KPIs
```

- **초기 로드**: `useInitialDataLoad` 훅
  - Worklist/KPI 데이터 먼저 로드
  - Realtime 구독 전에 완료
- **Map 데이터**: 별도 로드
  - Locations, LocationStatuses, Events
- **Realtime**: `useLiveFeed` 훅
  - KPI 업데이트는 `useKpiRealtime` 사용

### 성능 최적화

- **지도 레이어**: 동적 로딩 (필요 시만)
- **가상화**: WorklistTable 대용량 데이터 가상화 (향후)
- **배치 업데이트**: Realtime 이벤트 배치 처리 (300-500ms)

---

## 📋 체크리스트

### 레이아웃 불변 검증

- [x] HeaderBar는 항상 상단에 고정
- [x] MapView와 DetailDrawer는 2:1 비율로 가로 배치
- [x] HVDC Panel은 일반 레이아웃으로 하단에 배치
- [x] HeaderBar 제외한 전체 영역이 세로 스크롤 가능
- [x] 모바일에서 HVDC Panel 드래그 가능

### 접근성 검증

- [x] ESC 키로 DetailDrawer 닫기
- [x] ARIA 레이블 적용
- [x] 키보드 네비게이션 기본 지원
- [ ] 포커스 트랩 (DetailDrawer)
- [ ] 화살표 키 네비게이션 (WorklistTable)

### 상호작용 검증

- [ ] Map 클릭 → Worklist 필터 적용
- [ ] Worklist Row 클릭 → Map 하이라이트
- [ ] 필터 변경 → 모든 패널 동기화
- [ ] Realtime 업데이트 → 자동 갱신

---

## 📚 참조 문서

- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [INTEGRATION_ROADMAP.md](../integration/INTEGRATION_ROADMAP.md) - 통합 로드맵
- [COMPONENT_SPEC.md](../../.cursor/skills/unified-dashboard-ui/references/COMPONENT_SPEC.md) - 컴포넌트 사양
- [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md) - Realtime 구현 가이드

---

**최종 업데이트**: 2026-01-26

**최근 변경사항** (2026-01-26):
- **레이아웃 재구성**: RightPanel 제거, MapView(2/3) + DetailDrawer(1/3) 가로 배치
- **전체 세로 스크롤**: HeaderBar 제외한 모든 콘텐츠가 세로 스크롤 가능
- **HVDC Panel**: fixed positioning 제거, 일반 레이아웃으로 하단 배치 (전체 너비)
- **DetailDrawer**: Sidepanel 모드로 MapView 우측에 1/3 너비로 배치

**이전 변경사항** (2026-02-05~2026-02-09):
- 히트맵 강도 범례 추가 (낮음~매우 높음)
- 줌 기반 레이어 가시성 구현 (히트맵/상태/POI 레이어 동적 표시)
- POI 라벨 컴팩트/상세 모드 전환
- 타이포그래피 개선 (기본 폰트 16px, text-sm 기준, 대비 향상)
- KPI 요약 스트립 헤더 고정 (2행 구조)
- HVDC 워크리스트 간소화 (핵심 컬럼만, 상세는 DetailDrawer)
