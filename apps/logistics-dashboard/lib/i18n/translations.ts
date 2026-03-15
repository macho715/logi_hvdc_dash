/**
 * HVDC Logistics Dashboard — UI translation dictionary
 * Two locales: 'en' (English) | 'ko' (Korean)
 *
 * Usage:  const t = useT()   →   t.nav.overview
 */

export type Locale = 'en' | 'ko'

export interface Translations {
  // ── Common (shared across pages) ─────────────────────────
  common: {
    unit: string        // '' (EN) | '건' (KO) — count suffix
    all: string         // 'All' / '전체'
    reset: string       // 'Reset' / '초기화'
    noData: string      // 'No data' / '데이터 없음'
    vendor: string      // 'Vendor' / '벤더'
    site: string        // 'Site' / '현장'
    route: string       // 'Route' / '운송 경로'
    location: string    // 'Location' / '현재위치'
    cases: string       // 'cases' / '건'
    voyages: string     // 'voyages' / '항차'
    previous: string    // 'Previous' / '이전'
    next: string        // 'Next' / '다음'
    total: string       // 'Total' / '총'
    cleared: string     // 'Cleared' / '완료'
    inProgress: string  // 'In Progress' / '진행중'
    pending: string     // 'Pending' / '대기'
  }

  // ── Navigation ───────────────────────────────────────────
  nav: {
    overview: string
    chain: string
    pipeline: string
    sites: string
    cargo: string
  }

  // ── DashboardHeader ──────────────────────────────────────
  header: {
    updated: string
  }

  // ── OverviewToolbar ──────────────────────────────────────
  toolbar: {
    newVoyage: string
    searchPlaceholder: string
    noResults: string
    searching: string
  }

  // ── MapLayerToggles ──────────────────────────────────────
  layers: {
    originArc: string
    voyage: string
    heatmap: string
    hide: string
    show: string
  }

  // ── KPI labels (from /api/overview) ─────────────────────
  kpi: {
    totalShipments: string
    inTransit: string
    atWarehouse: string
    delayed: string
    delivered: string
  }

  // ── Voyage stage labels (shared) ─────────────────────────
  voyageStage: {
    'pre-departure': string
    'in-transit': string
    'port-customs': string
    inland: string
    delivered: string
  }

  // ── ShipmentSearchBar ────────────────────────────────────
  search: {
    placeholder: string
    loading: string
    error: string
    noResults: string
    eta: string
  }

  // ── OverviewRightPanel ───────────────────────────────────
  rightPanel: {
    searchResult: string
    close: string
    loading: string
    fetchError: string
    noResult: string
    stage: string
    viewDetail: string
    alerts: string
    alertsDesc: string
    noAlerts: string
    routeSummary: string
    routeSummaryDesc: string
    noData: string
    siteReadiness: string
    siteReadinessDesc: string
    arrived: string
    warehouse: string
    recentActivity: string
    recentActivityDesc: string
    loadError: string
    dueAt: string
  }

  // ── OverviewBottomPanel ──────────────────────────────────
  bottomPanel: {
    stagePipeline: string
    stagePipelineDesc: string
    priorityWorklist: string
    priorityWorklistDesc: string
    noLocation: string
    noWorklist: string
    dueAt: string
    siteMatrix: string
    voyageRadar: string
  }

  // ── OverviewMap tooltip ──────────────────────────────────
  overviewMap: {
    refreshError: string
    countSuffix: string
    mapMode: string
    mapModeHint: string
    globalTrack: string
    uaeOpsTrack: string
    directRoute: string
    warehouseRoute: string
    customsClearance: string
    customsToMosb: string
    siteDelivery: string
    mosbRoute: string
  }

  // ── NewVoyageModal ───────────────────────────────────────
  modal: {
    title: string
    subtitle: string
    updateNote: string
    sctShipNo: string
    sctShipNoPlaceholder: string
    sctShipNoRequired: string
    vendor: string
    vendorPlaceholder: string
    pol: string
    polPlaceholder: string
    pod: string
    podPlaceholder: string
    shipMode: string
    incoterms: string
    incotermsSelect: string
    mrNo: string
    vessel: string
    vesselPlaceholder: string
    blAwb: string
    blAwbPlaceholder: string
    etd: string
    atd: string
    eta: string
    ata: string
    transitDays: string
    customsDays: string
    inlandDays: string
    siteNomination: string
    description: string
    descriptionPlaceholder: string
    cancel: string
    submit: string
    submitting: string
    duplicate: string
    networkError: string
  }

  // ── MapLegend ────────────────────────────────────────────
  legend: {
    nodeType: string
    hvdcSite: string
    mosbYard: string
    port: string
    customs: string
    warehouse: string
    originRegion: string
    routeMeaning: string
    portTransit: string
    activeVoyage: string
  }

  // ── HeatmapLegend ────────────────────────────────────────
  heatmap: {
    labels: [string, string, string, string, string, string]
  }

  // ── Cargo page ───────────────────────────────────────────
  cargo: {
    basicInfo: string
    site: string
    vendor: string
    route: string
    currentLocation: string
    storageType: string
    logisticsTimeline: string
    etdLabel: string
    atdLabel: string
    etaLabel: string
    ataLabel: string
    siteArrival: string
    noShipmentNo: string
    noData: string
    voyageStageLabel: string
    nominatedSite: string
    customs: string
    totalCount: string   // '{n} total' / '총 {n}건'
    receivedDate: string
    previous: string
    next: string
    all: string
    cleared: string
    inProgress: string
    pending: string
    // voyage stage badge labels
    badgePreDeparture: string
    badgeInTransit: string
    badgePortCustoms: string
    badgeInland: string
    badgeDelivered: string
    dsvStock: string
  }

  // ── Chain page ───────────────────────────────────────────
  chain: {
    title: string
    subtitle: string
    mosbVia: string
    mosbAlert: string
    caseCount: string
    originPortTitle: string
    originTop5: string
    portAirport: string
    landSites: string
    directDelivery: string
    islandSites: string
    managedViaMosb: string
    missingMosb: string
    voyageBySite: string
    directLand: string
    mosbManaged: string
    voyageCount: string
    originSummaryTitle: string
    originSummaryDesc: string
    noOriginData: string
    chainStageCases: string
  }

  // ── Pipeline page ────────────────────────────────────────
  pipeline: {
    customsStatus: string
    customsStatusDesc: string
    cleared: string
    inProgress: string
    pending: string
    routeDistribution: string
    currentLocation: string
    route: string
    noMatchingCases: string
    stageCases: string
    selectStageHint: string
    rowClickHint: string
    siteFilter: string
    vendorFilter: string
    categoryFilter: string
    all: string
    reset: string
    transportMode: string
    transportModeDesc: string
    byVendor: string
    warehouseSqm: string
  }

  // ── Sites page ───────────────────────────────────────────
  sites: {
    agiAlertTitle: string
    agiAlertRate: string
    agiAlertDetail: string
    arrivedOf: string
    siteArrivalNoData: string
    currentLocation: string
    route: string
    vendor: string
    tabSummary: string
    tabRoute: string
    tabMonthly: string
    tabPending: string
    tabVendor: string
    typeLand: string
    typeSea: string
    typeUnknown: string
  }

  // ── ProgramFilterBar ─────────────────────────────────────
  programBar: {
    title: string           // 'HVDC Overview 2.0' / 'HVDC 통합 현황'
    modeProgram: string     // 'Program' / '프로그램'
    modeOps: string         // 'Ops' / '운영'
    filterSite: string      // 'Site' / '현장'
    filterAll: string       // 'All' / '전체'
    totalShipments: string  // 'Total Shipments' / '전체 항차'
    finalDelivered: string  // 'Final Delivered' / '최종 납품'
    openAnomaly: string     // 'Open / Anomaly' / '미결 / 이상'
    overdueEta: string      // 'Overdue ETA' / 'ETA 초과'
    criticalPod: string     // 'Critical POD' / '핵심 POD'
    criticalMode: string    // 'Critical Mode' / '핵심 운송'
    agiRisk: string         // 'AGI Risk' / 'AGI 위험'
    dataFreshness: string   // 'Data Freshness' / '데이터 갱신'
  }

  // ── MissionControl ────────────────────────────────────────
  missionControl: {
    title: string           // 'Mission Control' / '미션 컨트롤'
    critical: string        // 'Critical' / '긴급'
    next72h: string         // 'Next 72h' / '72시간 내'
    agiDasBlockers: string  // 'AGI / DAS Blockers' / 'AGI/DAS 차단'
    actionQueue: string     // 'Action Queue' / '처리 대기'
    noItems: string         // 'No items' / '항목 없음'
  }

  // ── SiteDeliveryMatrix ───────────────────────────────────
  siteMatrix: {
    title: string           // 'Site Delivery Matrix' / '현장 납품 현황'
    assigned: string        // 'Assigned' / '배정'
    delivered: string       // 'Delivered' / '납품'
    pending: string         // 'Pending' / '대기'
    mosbPending: string     // 'MOSB Pending' / 'MOSB 대기'
    overdue: string         // 'Overdue' / '초과'
    risk: string            // 'Risk' / '위험도'
  }

  // ── OpenRadarTable ───────────────────────────────────────
  openRadar: {
    title: string           // 'Open Radar' / '미결 레이더'
    filterAll: string       // 'All' / '전체'
    filterCritical: string  // 'Critical' / '긴급'
    filterAmber: string     // 'Amber' / '주의'
    filterOverdue: string   // 'Overdue' / '초과'
    noItems: string         // 'No open items' / '미결 항목 없음'
  }

  // ── OpsSnapshot ──────────────────────────────────────────
  opsSnapshot: {
    title: string           // 'Operational Layer' / '운영 레이어'
    whPressure: string      // 'WH Pressure' / '창고 압박'
    worklist: string        // 'Worklist' / '작업 목록'
    exceptions: string      // 'Exceptions' / '예외 항목'
    recentFeed: string      // 'Recent Activity' / '최근 활동'
  }

  // ── ChainRibbon ──────────────────────────────────────────
  chainRibbon: {
    origin: string          // 'Origin' / '원산지'
    portAir: string         // 'Port / Air' / '항구 / 공항'
    customs: string         // 'Customs' / '통관'
    warehouse: string       // 'Warehouse' / '창고'
    mosb: string            // 'MOSB' / 'MOSB'
    site: string            // 'Site' / '현장'
    count: string           // 'count' / '건'
    share: string           // 'share' / '비중'
    risk: string            // 'risk' / '위험'
  }
  voyageRadar: {
    title: string
    tabAll: string
    tabCritical: string
    tabWarning: string
    tabOverdue: string
    noItems: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// English
// ─────────────────────────────────────────────────────────────────────────────
export const en: Translations = {
  common: {
    unit: '',
    all: 'All',
    reset: 'Reset',
    noData: 'No data',
    vendor: 'Vendor',
    site: 'Site',
    route: 'Route',
    location: 'Current Location',
    cases: 'cases',
    voyages: 'voyages',
    previous: 'Previous',
    next: 'Next',
    total: 'Total',
    cleared: 'Cleared',
    inProgress: 'In Progress',
    pending: 'Pending',
  },
  nav: {
    overview: 'HVDC CONTROL TOWER',
    chain: 'Logistics Chain',
    pipeline: 'Pipeline',
    sites: 'Sites',
    cargo: 'Cargo',
  },
  header: {
    updated: 'Updated',
  },
  toolbar: {
    newVoyage: '+ New Voyage',
    searchPlaceholder: 'Search SCT / HVDC code…',
    noResults: 'No results',
    searching: 'Searching…',
  },
  layers: {
    originArc: 'Origin Arc',
    voyage: 'Voyage',
    heatmap: 'Heatmap',
    hide: 'Hide',
    show: 'Show',
  },
  kpi: {
    totalShipments: 'Total Shipments',
    inTransit: 'In Transit',
    atWarehouse: 'At Warehouse',
    delayed: 'Delayed',
    delivered: 'Delivered',
  },
  voyageStage: {
    'pre-departure': 'Pre-departure',
    'in-transit': 'In Transit',
    'port-customs': 'Port / Customs',
    inland: 'Inland',
    delivered: 'Delivered',
  },
  search: {
    placeholder: 'Search SCT / HVDC…',
    loading: 'Searching…',
    error: 'Search failed',
    noResults: 'No results',
    eta: 'ETA',
  },
  rightPanel: {
    searchResult: 'Search Result',
    close: 'Close',
    loading: 'Loading…',
    fetchError: 'Failed to load',
    noResult: 'No result',
    stage: 'Stage',
    viewDetail: 'View detail →',
    alerts: 'Exception Board',
    alertsDesc: 'High-priority operations pinned at top.',
    noAlerts: 'No active alerts',
    routeSummary: 'Route Summary',
    routeSummaryDesc: 'Route meaning without numeric codes.',
    noData: 'No data available',
    siteReadiness: 'Site Readiness',
    siteReadinessDesc: 'Arrival rate and pending items by site.',
    arrived: 'Arrived',
    warehouse: 'WH',
    recentActivity: 'Recent Activity',
    recentActivityDesc: 'Recent event-driven changes linked to Cargo.',
    loadError: 'Failed to load overview data.',
    dueAt: 'Due',
  },
  bottomPanel: {
    stagePipeline: 'Stage Pipeline',
    stagePipelineDesc: 'Each stage uses the same URL contract as the Pipeline page.',
    priorityWorklist: 'Priority Worklist',
    priorityWorklistDesc: 'Reuses the shared HVDC worklist store.',
    noLocation: 'Location unknown',
    noWorklist: 'No priority items',
    dueAt: 'Due',
    siteMatrix: 'Site Matrix',
    voyageRadar: 'Voyage Radar',
  },
  overviewMap: {
    refreshError: 'Failed to refresh overview data:',
    countSuffix: '',
    mapMode: 'Map Mode',
    mapModeHint: 'Switch between the global supply chain and UAE operations network.',
    globalTrack: 'Global',
    uaeOpsTrack: 'UAE Ops',
    directRoute: 'Direct route',
    warehouseRoute: 'Warehouse route',
    customsClearance: 'Customs clearance',
    customsToMosb: 'Customs to MOSB',
    siteDelivery: 'Site delivery',
    mosbRoute: 'MOSB route',
  },
  modal: {
    title: 'Register New Voyage',
    subtitle: 'Only SCT SHIP NO is required. Fill in as much as you know.',
    updateNote: 'If the code already exists, only the filled fields will be overwritten (update).',
    sctShipNo: 'SCT SHIP NO',
    sctShipNoPlaceholder: 'HVDC-ADOPT-SCT-0001',
    sctShipNoRequired: 'SCT SHIP NO is required',
    vendor: 'Vendor',
    vendorPlaceholder: 'Hitachi',
    pol: 'POL (Port of Loading)',
    polPlaceholder: 'KRPUS',
    pod: 'POD (Port of Discharge)',
    podPlaceholder: 'AEAUH',
    shipMode: 'Ship Mode',
    incoterms: 'Incoterms',
    incotermsSelect: 'Select',
    mrNo: 'MR No.',
    vessel: 'Vessel / Flight',
    vesselPlaceholder: 'MSC AURORA',
    blAwb: 'B/L No. / AWB No.',
    blAwbPlaceholder: 'MSCUABCD1234567',
    etd: 'ETD',
    atd: 'ATD',
    eta: 'ETA',
    ata: 'ATA',
    transitDays: 'Transit Days',
    customsDays: 'Customs Days',
    inlandDays: 'Inland Days',
    siteNomination: 'Site Nomination',
    description: 'Remarks',
    descriptionPlaceholder: 'Enter additional information…',
    cancel: 'Cancel',
    submit: 'Register',
    submitting: 'Registering…',
    duplicate: 'SCT SHIP NO already exists (duplicate)',
    networkError: 'Network error occurred',
  },
  legend: {
    nodeType: 'NODE TYPE',
    hvdcSite: 'HVDC Site',
    mosbYard: 'MOSB Yard',
    port: 'Port',
    customs: 'Customs',
    warehouse: 'Warehouse',
    originRegion: 'ORIGIN REGION',
    routeMeaning: 'ROUTE MEANING',
    portTransit: 'Port / Transit',
    activeVoyage: 'ACTIVE VOYAGE',
  },
  heatmap: {
    labels: ['Low', 'Somewhat Low', 'Medium', 'Somewhat High', 'High', 'Very High'],
  },
  cargo: {
    basicInfo: 'Basic Info',
    site: 'Site',
    vendor: 'Vendor',
    route: 'Route',
    currentLocation: 'Current Location',
    storageType: 'Storage Type',
    logisticsTimeline: 'Logistics Timeline',
    etdLabel: 'ETD (Est. Departure)',
    atdLabel: 'ATD (Act. Departure)',
    etaLabel: 'ETA (Est. Arrival)',
    ataLabel: 'ATA (Act. Arrival)',
    siteArrival: 'Site Arrival',
    noShipmentNo: 'No shipment number — timeline unavailable',
    noData: 'No data',
    voyageStageLabel: 'Voyage Stage',
    nominatedSite: 'Nominated Site',
    customs: 'Customs',
    totalCount: 'Total',
    receivedDate: 'Received Date',
    previous: 'Previous',
    next: 'Next',
    all: 'All',
    cleared: 'Cleared',
    inProgress: 'In Progress',
    pending: 'Pending',
    badgePreDeparture: 'Pre-departure',
    badgeInTransit: 'In Transit',
    badgePortCustoms: 'Port/Customs',
    badgeInland: 'Inland/WH',
    badgeDelivered: 'Delivered',
    dsvStock: 'DSV Warehouse Stock',
  },
  chain: {
    title: 'Full Logistics Chain',
    subtitle: 'Condensed view: Origin → Port/Customs → Warehouse → MOSB → Site.',
    mosbVia: 'via MOSB',
    mosbAlert: 'missing required MOSB',
    caseCount: 'cases',
    originPortTitle: 'Origin / Port Status',
    originTop5: 'Top 5 Origins',
    portAirport: 'Port / Airport',
    landSites: 'Land Sites',
    directDelivery: 'Direct delivery',
    islandSites: 'Island Sites',
    managedViaMosb: 'Managed via MOSB',
    missingMosb: 'missing MOSB',
    voyageBySite: 'Voyage by Nominated Site',
    directLand: 'Direct (Land)',
    mosbManaged: 'Managed via MOSB',
    voyageCount: 'voyages',
    originSummaryTitle: 'Origin Summary',
    originSummaryDesc: 'Top countries by POL',
    noOriginData: 'No origin data',
    chainStageCases: 'Chain Stage Cases',
  },
  pipeline: {
    customsStatus: 'Customs Status',
    customsStatusDesc: '(by BL)',
    cleared: 'Cleared',
    inProgress: 'In Progress',
    pending: 'Pending',
    routeDistribution: 'Route Distribution',
    currentLocation: 'Current Location',
    route: 'Route',
    noMatchingCases: 'No matching cases.',
    stageCases: 'Stage Cases',
    selectStageHint: 'Select a pipeline stage to see cases here.',
    rowClickHint: 'Click a row to open the Cargo drawer.',
    siteFilter: 'Site',
    vendorFilter: 'Vendor',
    categoryFilter: 'Category',
    all: 'All',
    reset: 'Reset',
    transportMode: 'Transport Mode',
    transportModeDesc: '(by BL)',
    byVendor: 'By Vendor',
    warehouseSqm: 'Warehouse SQM',
  },
  sites: {
    agiAlertTitle: 'AGI Delivery Alert',
    agiAlertRate: 'Rate',
    agiAlertDetail: 'WH · MOSB · Pre-shipment',
    arrivedOf: 'arrived',
    siteArrivalNoData: 'No arrival date data',
    currentLocation: 'Current Location',
    route: 'Route',
    vendor: 'Vendor',
    tabSummary: 'Summary',
    tabRoute: 'Route',
    tabMonthly: 'Monthly',
    tabPending: 'Pending',
    tabVendor: 'Vendor',
    typeLand: 'Land',
    typeSea: 'Sea · MOSB',
    typeUnknown: 'Unspecified',
  },
  programBar: {
    title: 'HVDC Overview 2.0',
    modeProgram: 'Program',
    modeOps: 'Ops',
    filterSite: 'Site',
    filterAll: 'All',
    totalShipments: 'Total Shipments',
    finalDelivered: 'Final Delivered',
    openAnomaly: 'Open / Anomaly',
    overdueEta: 'Overdue ETA',
    criticalPod: 'Critical POD',
    criticalMode: 'Critical Mode',
    agiRisk: 'AGI Risk',
    dataFreshness: 'Data Freshness',
  },
  missionControl: {
    title: 'Mission Control',
    critical: 'Critical',
    next72h: 'Next 72h',
    agiDasBlockers: 'Voyage Blockers',
    actionQueue: 'Action Queue',
    noItems: 'No items',
  },
  siteMatrix: {
    title: 'Site Delivery Matrix',
    assigned: 'Assigned',
    delivered: 'Delivered',
    pending: 'Pending',
    mosbPending: 'MOSB Pending',
    overdue: 'Overdue',
    risk: 'Risk',
  },
  openRadar: {
    title: 'Open Radar',
    filterAll: 'All',
    filterCritical: 'Critical',
    filterAmber: 'Amber',
    filterOverdue: 'Overdue',
    noItems: 'No open items',
  },
  opsSnapshot: {
    title: 'Operational Layer',
    whPressure: 'WH Pressure',
    worklist: 'Worklist',
    exceptions: 'Exceptions',
    recentFeed: 'Recent Activity',
  },
  chainRibbon: {
    origin: 'Origin',
    portAir: 'Port / Air',
    customs: 'Customs',
    warehouse: 'Warehouse',
    mosb: 'MOSB',
    site: 'Site',
    count: 'count',
    share: 'share',
    risk: 'risk',
  },
  voyageRadar: {
    title: 'Voyage Exception Radar',
    tabAll: 'All',
    tabCritical: 'Critical',
    tabWarning: 'Warning',
    tabOverdue: 'Overdue',
    noItems: 'No exceptions',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Korean
// ─────────────────────────────────────────────────────────────────────────────
export const ko: Translations = {
  common: {
    unit: '건',
    all: '전체',
    reset: '초기화',
    noData: '데이터 없음',
    vendor: '벤더',
    site: '현장',
    route: '운송 경로',
    location: '현재위치',
    cases: '건',
    voyages: '항차',
    previous: '이전',
    next: '다음',
    total: '총',
    cleared: '완료',
    inProgress: '진행중',
    pending: '대기',
  },
  nav: {
    overview: 'HVDC CONTROL TOWER',
    chain: '물류 체인',
    pipeline: '파이프라인',
    sites: '현장',
    cargo: '화물',
  },
  header: {
    updated: '업데이트',
  },
  toolbar: {
    newVoyage: '+ 신규 항차',
    searchPlaceholder: 'SCT / HVDC 코드 검색…',
    noResults: '결과 없음',
    searching: '검색 중…',
  },
  layers: {
    originArc: '출발 경로',
    voyage: '항차',
    heatmap: '히트맵',
    hide: '숨기기',
    show: '표시',
  },
  kpi: {
    totalShipments: '전체 선적',
    inTransit: '운송 중',
    atWarehouse: '창고 보관',
    delayed: '지연',
    delivered: '납품 완료',
  },
  voyageStage: {
    'pre-departure': '출발 전',
    'in-transit': '운송 중',
    'port-customs': '통관 중',
    inland: '내륙 운송',
    delivered: '납품 완료',
  },
  search: {
    placeholder: 'SCT / HVDC 검색…',
    loading: '검색 중…',
    error: '검색 실패',
    noResults: '결과 없음',
    eta: '도착 예정',
  },
  rightPanel: {
    searchResult: '검색 결과',
    close: '닫기',
    loading: '로딩 중…',
    fetchError: '불러오기 실패',
    noResult: '결과 없음',
    stage: '단계',
    viewDetail: '상세 보기 →',
    alerts: '예외 보드',
    alertsDesc: '운영 우선순위가 높은 항목만 위쪽에 고정합니다.',
    noAlerts: '활성 알림 없음',
    routeSummary: '운송 경로 요약',
    routeSummaryDesc: '숫자 코드를 숨기고 경로 의미만 남겼습니다.',
    noData: '데이터 없음',
    siteReadiness: '현장 준비도',
    siteReadinessDesc: '현장 단위 도착률과 대기 잔량을 같이 보여줍니다.',
    arrived: '도착',
    warehouse: '창고',
    recentActivity: '최근 활동',
    recentActivityDesc: '이벤트 기반 최근 변화를 Cargo로 바로 넘깁니다.',
    loadError: 'Overview 데이터를 불러오지 못했습니다.',
    dueAt: '예정',
  },
  bottomPanel: {
    stagePipeline: '단계 파이프라인',
    stagePipelineDesc: 'overview의 각 단계는 Pipeline 페이지와 같은 URL 계약을 사용합니다.',
    priorityWorklist: '우선순위 워크리스트',
    priorityWorklistDesc: '공유 store의 HVDC worklist를 그대로 재사용합니다.',
    noLocation: '상세 위치 없음',
    noWorklist: '우선순위 항목 없음',
    dueAt: '예정',
    siteMatrix: '현장 매트릭스',
    voyageRadar: '항차 레이더',
  },
  overviewMap: {
    refreshError: 'Overview 데이터를 새로고침하지 못했습니다:',
    countSuffix: '건',
    mapMode: '맵 모드',
    mapModeHint: 'Global 공급망과 UAE 운영 네트워크를 전환합니다.',
    globalTrack: 'Global',
    uaeOpsTrack: 'UAE Ops',
    directRoute: '직송 경로',
    warehouseRoute: '창고 경유',
    customsClearance: '통관 구간',
    customsToMosb: '통관 후 MOSB 이동',
    siteDelivery: '현장 납품',
    mosbRoute: 'MOSB 경유',
  },
  modal: {
    title: '신규 항차 등록',
    subtitle: 'SCT SHIP NO만 필수입니다. 나머지는 아는 정보만 입력하세요.',
    updateNote: '이미 등록된 코드를 입력하면 입력한 필드만 덮어씁니다 (업데이트).',
    sctShipNo: 'SCT SHIP NO',
    sctShipNoPlaceholder: 'HVDC-ADOPT-SCT-0001',
    sctShipNoRequired: 'SCT SHIP NO는 필수입니다',
    vendor: 'Vendor',
    vendorPlaceholder: 'Hitachi',
    pol: 'POL (출발항)',
    polPlaceholder: 'KRPUS',
    pod: 'POD (도착항)',
    podPlaceholder: 'AEAUH',
    shipMode: '운송 모드',
    incoterms: 'Incoterms',
    incotermsSelect: '선택',
    mrNo: 'MR No.',
    vessel: '선박명 / 항공편',
    vesselPlaceholder: 'MSC AURORA',
    blAwb: 'B/L No. / AWB No.',
    blAwbPlaceholder: 'MSCUABCD1234567',
    etd: 'ETD',
    atd: 'ATD',
    eta: 'ETA',
    ata: 'ATA',
    transitDays: '해상 운송일',
    customsDays: '통관일',
    inlandDays: '내륙 운송일',
    siteNomination: '납품 현장 노미네이션',
    description: '비고 (설명)',
    descriptionPlaceholder: '추가 정보를 입력하세요…',
    cancel: '취소',
    submit: '항차 등록',
    submitting: '등록 중…',
    duplicate: '이미 존재하는 SCT SHIP NO입니다 (중복)',
    networkError: '네트워크 오류가 발생했습니다',
  },
  legend: {
    nodeType: '노드 유형',
    hvdcSite: 'HVDC 현장',
    mosbYard: 'MOSB 야드',
    port: '항구',
    customs: '통관',
    warehouse: '창고',
    originRegion: '출발 지역',
    routeMeaning: '경로 의미',
    portTransit: '항만 / 환적',
    activeVoyage: '진행 중 항차',
  },
  heatmap: {
    labels: ['낮음', '다소 낮음', '중간', '다소 높음', '높음', '매우 높음'],
  },
  cargo: {
    basicInfo: '기본정보',
    site: '현장',
    vendor: '벤더',
    route: '운송 경로',
    currentLocation: '현재위치',
    storageType: '보관유형',
    logisticsTimeline: '물류 타임라인',
    etdLabel: 'ETD (출발예정)',
    atdLabel: 'ATD (실제출발)',
    etaLabel: 'ETA (도착예정)',
    ataLabel: 'ATA (실제도착)',
    siteArrival: '현장 도착',
    noShipmentNo: '선적번호 없음 — 타임라인 불가',
    noData: '데이터 없음',
    voyageStageLabel: '항차단계',
    nominatedSite: '노미현장',
    customs: '통관',
    totalCount: '총',
    receivedDate: '입고일',
    previous: '이전',
    next: '다음',
    all: '전체',
    cleared: '통관완료',
    inProgress: '진행중',
    pending: '대기',
    badgePreDeparture: '출항 전',
    badgeInTransit: '항해 중',
    badgePortCustoms: '항만/통관',
    badgeInland: '내륙/창고',
    badgeDelivered: '납품완료',
    dsvStock: 'DSV 창고 재고',
  },
  chain: {
    title: '전체 물류 체인',
    subtitle: '원산지 → 항만/통관 → 창고 → MOSB → 현장 흐름을 단계별로 압축 표시합니다.',
    mosbVia: 'MOSB 경유',
    mosbAlert: '필수 MOSB 경유 누락',
    caseCount: '건',
    originPortTitle: '원산지 / 항만 현황',
    originTop5: '원산지 Top 5',
    portAirport: '항만 / 공항',
    landSites: '육상 현장',
    directDelivery: '직접 배송 중심',
    islandSites: '도서 현장',
    managedViaMosb: 'MOSB 경유 기준 관리',
    missingMosb: '필수 MOSB 경유 누락',
    voyageBySite: '노미현장별 항차 현황',
    directLand: '육상 직배',
    mosbManaged: 'MOSB 기준 관리',
    voyageCount: '항차',
    originSummaryTitle: '원산지 집계',
    originSummaryDesc: 'POL 기준 상위 국가',
    noOriginData: '원산지 데이터가 없습니다.',
    chainStageCases: '체인 선택 단계 케이스',
  },
  pipeline: {
    customsStatus: '통관 현황',
    customsStatusDesc: '(BL 기준)',
    cleared: '완료',
    inProgress: '진행중',
    pending: '대기',
    routeDistribution: '운송 경로 분포',
    currentLocation: '현재 위치',
    route: '운송 경로',
    noMatchingCases: '일치하는 케이스가 없습니다.',
    stageCases: '선택 단계 케이스',
    selectStageHint: '파이프라인 단계를 선택하면 해당 케이스가 여기에 표시됩니다.',
    rowClickHint: '행 클릭 시 Cargo drawer로 이동합니다.',
    siteFilter: '사이트',
    vendorFilter: '벤더',
    categoryFilter: '카테고리',
    all: '전체',
    reset: '초기화',
    transportMode: '운송 모드',
    transportModeDesc: '(BL 기준)',
    byVendor: '벤더별',
    warehouseSqm: '창고 SQM',
  },
  sites: {
    agiAlertTitle: 'AGI 납품 경보',
    agiAlertRate: '달성률',
    agiAlertDetail: '창고 · MOSB · 선적 전',
    arrivedOf: '도착',
    siteArrivalNoData: 'site_arrival_date 데이터 없음',
    currentLocation: '현재 위치',
    route: '운송 경로',
    vendor: '벤더',
    tabSummary: '요약',
    tabRoute: '운송 경로',
    tabMonthly: '월별 추이',
    tabPending: '대기 화물',
    tabVendor: '벤더',
    typeLand: '육상',
    typeSea: '해상 · MOSB',
    typeUnknown: '미지정',
  },
  programBar: {
    title: 'HVDC 통합 현황',
    modeProgram: '프로그램',
    modeOps: '운영',
    filterSite: '현장',
    filterAll: '전체',
    totalShipments: '전체 항차',
    finalDelivered: '최종 납품',
    openAnomaly: '미결 / 이상',
    overdueEta: 'ETA 초과',
    criticalPod: '핵심 POD',
    criticalMode: '핵심 운송',
    agiRisk: 'AGI 위험',
    dataFreshness: '데이터 갱신',
  },
  missionControl: {
    title: '미션 컨트롤',
    critical: '긴급',
    next72h: '72시간 내',
    agiDasBlockers: '항로 차단',
    actionQueue: '처리 대기',
    noItems: '항목 없음',
  },
  siteMatrix: {
    title: 'Site Delivery Matrix',
    assigned: '배정',
    delivered: '납품',
    pending: '대기',
    mosbPending: 'MOSB 대기',
    overdue: '초과',
    risk: '위험도',
  },
  openRadar: {
    title: '미결 레이더',
    filterAll: '전체',
    filterCritical: '긴급',
    filterAmber: '주의',
    filterOverdue: '초과',
    noItems: '미결 항목 없음',
  },
  opsSnapshot: {
    title: '운영 레이어',
    whPressure: '창고 압박',
    worklist: '작업 목록',
    exceptions: '예외 항목',
    recentFeed: '최근 활동',
  },
  chainRibbon: {
    origin: '원산지',
    portAir: '항구 / 공항',
    customs: '통관',
    warehouse: '창고',
    mosb: 'MOSB',
    site: '현장',
    count: '건',
    share: '비중',
    risk: '위험',
  },
  voyageRadar: {
    title: '항차 예외 레이더',
    tabAll: '전체',
    tabCritical: '긴급',
    tabWarning: '경고',
    tabOverdue: '기한초과',
    noItems: '예외 없음',
  },
}

export const TRANSLATIONS: Record<Locale, Translations> = { en, ko }
