/**
 * HVDC Logistics Dashboard — UI translation dictionary
 * Two locales: 'en' (English) | 'ko' (Korean)
 *
 * Usage:  const t = useT()   →   t.nav.overview
 */

export type Locale = 'en' | 'ko'

export interface Translations {
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
    noAlerts: string
    routeSummary: string
    noData: string
  }

  // ── OverviewBottomPanel ──────────────────────────────────
  bottomPanel: {
    stagePipeline: string
    stagePipelineDesc: string
    priorityWorklist: string
    priorityWorklistDesc: string
    noLocation: string
    noWorklist: string
  }

  // ── NewVoyageModal ───────────────────────────────────────
  modal: {
    title: string
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
    warehouse: string
    originRegion: string
    activeVoyage: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// English
// ─────────────────────────────────────────────────────────────────────────────
export const en: Translations = {
  nav: {
    overview: 'Overview',
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
    alerts: 'Alerts',
    noAlerts: 'No active alerts',
    routeSummary: 'Route Summary',
    noData: 'No data available',
  },
  bottomPanel: {
    stagePipeline: 'Stage Pipeline',
    stagePipelineDesc: 'Each stage uses the same URL contract as the Pipeline page.',
    priorityWorklist: 'Priority Worklist',
    priorityWorklistDesc: 'Reuses the shared HVDC worklist store.',
    noLocation: 'Location unknown',
    noWorklist: 'No priority items',
  },
  modal: {
    title: 'Register New Voyage',
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
    warehouse: 'Warehouse',
    originRegion: 'ORIGIN REGION',
    activeVoyage: 'ACTIVE VOYAGE',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Korean
// ─────────────────────────────────────────────────────────────────────────────
export const ko: Translations = {
  nav: {
    overview: '개요',
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
    alerts: '알림',
    noAlerts: '활성 알림 없음',
    routeSummary: '경로 요약',
    noData: '데이터 없음',
  },
  bottomPanel: {
    stagePipeline: '단계 파이프라인',
    stagePipelineDesc: 'overview의 각 단계는 Pipeline 페이지와 같은 URL 계약을 사용합니다.',
    priorityWorklist: '우선순위 워크리스트',
    priorityWorklistDesc: '공유 store의 HVDC worklist를 그대로 재사용합니다.',
    noLocation: '상세 위치 없음',
    noWorklist: '우선순위 항목 없음',
  },
  modal: {
    title: '신규 항차 등록',
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
    warehouse: '창고',
    originRegion: '출발 지역',
    activeVoyage: '진행 중 항차',
  },
}

export const TRANSLATIONS: Record<Locale, Translations> = { en, ko }
