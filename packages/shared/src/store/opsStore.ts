/**
 * OpsStore - 통합 운영 Store
 *
 * 목적:
 * - Map ↔ Worklist ↔ Detail(Drawer) 동기화를 위한 단일 상태 관리
 *
 * 원칙:
 * - 단일 선택: selectedCaseId 또는 selectedLocationId 중 하나만 활성
 * - Map에서 Location 선택 → Worklist 필터(locationIds) 동기화
 * - Worklist에서 Case 선택 → Drawer 오픈 + Map 하이라이트(케이스 선택 상태)
 *
 * Zustand v5 주의:
 * - selector가 매번 새로운 Array/Object 참조를 만들면 문제가 될 수 있음(무한 루프/불필요 렌더).
 *   필요 시 atomic selector 또는 useShallow 사용 권장.
 */

import { create } from "zustand";
import type {
  DashboardFilters,
  Event,
  HVDCKPIs,
  Location,
  LocationStatus,
  WorklistRow,
} from "../types";
import { deriveBucket, toBucketRecord } from "../utils/buckets";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface OpsStoreActions {
  // Selection
  selectCase: (caseId: string) => void;
  selectLocation: (locationId: string) => void;
  clearSelection: () => void;
  setDrawerOpen: (open: boolean) => void;

  // Data
  setWorklistRows: (rows: WorklistRow[]) => void;
  setKPIs: (kpis: HVDCKPIs) => void;
  setLocations: (locations: Location[]) => void;
  setLocationStatuses: (statuses: LocationStatus[]) => void;
  setEvents: (events: Event[]) => void;
  mergeEvent: (event: Event) => void;

  // Filters
  setFilters: (patch: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  // UI
  setLoading: (loading: boolean) => void;
  setLastRefreshAt: (timestamp: string) => void;
}

export interface OpsStoreState {
  // ------------------------------------------------------------
  // Selection (단일 선택)
  // ------------------------------------------------------------
  selectedCaseId?: string;
  selectedLocationId?: string;
  drawerOpen: boolean;

  // ------------------------------------------------------------
  // Data
  // ------------------------------------------------------------
  worklistRows: WorklistRow[];
  kpis?: HVDCKPIs;

  locationsById: Record<string, Location>;
  locationStatusesById: Record<string, LocationStatus>;
  eventsById: Record<string, Event>;

  // ------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------
  filters: DashboardFilters;

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  isLoading: boolean;
  lastRefreshAt?: string;

  // ------------------------------------------------------------
  // Actions (stable reference)
  // ------------------------------------------------------------
  actions: OpsStoreActions;
}

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

const createDefaultFilters = (): DashboardFilters => ({});

const indexLocations = (locations: Location[]): Record<string, Location> =>
  locations.reduce<Record<string, Location>>((acc, loc) => {
    acc[loc.location_id] = loc;
    return acc;
  }, {});

const indexStatuses = (
  statuses: LocationStatus[],
): Record<string, LocationStatus> =>
  statuses.reduce<Record<string, LocationStatus>>((acc, status) => {
    acc[status.location_id] = status;
    return acc;
  }, {});

const indexEvents = (events: Event[]): Record<string, Event> =>
  events.reduce<Record<string, Event>>((acc, e) => {
    acc[e.event_id] = e;
    return acc;
  }, {});

// ------------------------------------------------------------
// Store
// ------------------------------------------------------------

// TS에서 create<T>()(…) 형태는 흔히 사용하는 패턴입니다. (커리 형태)
export const useOpsStore = create<OpsStoreState>()((set, get) => {
  // actions는 "상태가 아니라 정적 함수 모음"이므로 별도 네임스페이스로 분리
  // (actions는 참조가 바뀌지 않아 한 번에 구독해도 렌더 성능에 영향이 적음)
  const actions: OpsStoreActions = {
    // -------------------------
    // Selection
    // -------------------------
    selectCase: (caseId: string) => {
      set({
        selectedCaseId: caseId,
        selectedLocationId: undefined, // 단일 선택: 케이스 선택 시 위치 선택 해제
        drawerOpen: true,
      });
    },

    selectLocation: (locationId: string) => {
      // 위치 선택(Map) → Worklist 필터(locationIds) 동기화
      set((state) => ({
        selectedLocationId: locationId,
        selectedCaseId: undefined, // 단일 선택: 위치 선택 시 케이스 선택 해제
        drawerOpen: false,
        filters: {
          ...state.filters,
          locationIds: [locationId],
        },
      }));
    },

    clearSelection: () => {
      set({
        selectedCaseId: undefined,
        selectedLocationId: undefined,
        drawerOpen: false,
      });
    },

    setDrawerOpen: (open: boolean) => {
      // Drawer를 닫으면 케이스 선택은 해제(기본 정책)
      // "닫아도 케이스 하이라이트 유지"가 필요하면 selectedCaseId 유지로 변경하세요。
      set((state) => ({
        drawerOpen: open,
        selectedCaseId: open ? state.selectedCaseId : undefined,
      }));
    },

    // -------------------------
    // Data
    // -------------------------
    setWorklistRows: (rows: WorklistRow[]) => set({ worklistRows: rows }),

    setKPIs: (kpis: HVDCKPIs) => set({ kpis }),

    setLocations: (locations: Location[]) =>
      set({ locationsById: indexLocations(locations) }),

    setLocationStatuses: (statuses: LocationStatus[]) =>
      set({ locationStatusesById: indexStatuses(statuses) }),

    setEvents: (events: Event[]) => set({ eventsById: indexEvents(events) }),

    mergeEvent: (event: Event) =>
      set((state) => ({
        eventsById: {
          ...state.eventsById,
          [event.event_id]: event,
        },
      })),

    // -------------------------
    // Filters
    // -------------------------
    setFilters: (patch: Partial<DashboardFilters>) =>
      set((state) => ({
        filters: {
          ...state.filters,
          ...patch,
        },
      })),

    resetFilters: () => set({ filters: createDefaultFilters() }),

    // -------------------------
    // UI
    // -------------------------
    setLoading: (loading: boolean) => set({ isLoading: loading }),

    setLastRefreshAt: (timestamp: string) => set({ lastRefreshAt: timestamp }),
  };

  return {
    // Initial state
    selectedCaseId: undefined,
    selectedLocationId: undefined,
    drawerOpen: false,

    worklistRows: [],
    kpis: undefined,

    locationsById: {},
    locationStatusesById: {},
    eventsById: {},

    filters: createDefaultFilters(),

    isLoading: false,
    lastRefreshAt: undefined,

    actions,
  };
});

// ------------------------------------------------------------
// Recommended hooks (atomic selectors)
// ------------------------------------------------------------

// Zustand는 selector 기반 구독이 기본이므로, 아래처럼 작은 훅을 제공하면
// 컴포넌트에서 "실수로 전체 store 구독"을 예방할 수 있습니다.

export const useOpsActions = () => useOpsStore((s) => s.actions);

export const useSelectedCaseId = () => useOpsStore((s) => s.selectedCaseId);
export const useSelectedLocationId = () =>
  useOpsStore((s) => s.selectedLocationId);
export const useDrawerOpen = () => useOpsStore((s) => s.drawerOpen);

export const useOpsFilters = () => useOpsStore((s) => s.filters);
export const useWorklistRows = () => useOpsStore((s) => s.worklistRows);

// ------------------------------------------------------------
// Pure selectors (computed values)
// ------------------------------------------------------------

export const selectSelectedCase = (
  state: OpsStoreState,
): WorklistRow | undefined => {
  if (!state.selectedCaseId) return undefined;
  return state.worklistRows.find((row) => row.id === state.selectedCaseId);
};

export const selectSelectedLocation = (
  state: OpsStoreState,
): Location | undefined => {
  if (!state.selectedLocationId) return undefined;
  return state.locationsById[state.selectedLocationId];
};

export const selectFilteredWorklistRows = (state: OpsStoreState): WorklistRow[] => {
  const { filters } = state;
  let rows = state.worklistRows;

  if (filters.bucket) {
    const now = new Date();
    rows = rows.filter(
      (r) => deriveBucket(toBucketRecord(r), now) === filters.bucket
    );
  }

  // Gate
  if (filters.gates?.length) {
    rows = rows.filter((r) => filters.gates!.includes(r.gate));
  }

  // Flow code
  if (filters.flowCodes?.length) {
    rows = rows.filter(
      (r) => typeof r.flowCode === "number" && filters.flowCodes!.includes(r.flowCode),
    );
  }

  // LocationIds (row.currentLocation / row.finalLocation 이 id 또는 name일 수 있어 둘 다 대응)
  if (filters.locationIds?.length) {
    const tokens = new Set<string>();
    for (const id of filters.locationIds) {
      tokens.add(id);
      const name = state.locationsById[id]?.name;
      if (name) tokens.add(name);
    }

    rows = rows.filter((r) => {
      const cur = r.currentLocation;
      const fin = r.finalLocation;
      return (cur && tokens.has(cur)) || (fin && tokens.has(fin));
    });
  }

  // Vendors (WorklistRow.meta["vendor"] 사용 가정)
  if (filters.vendors?.length) {
    rows = rows.filter((r) => {
      const vendor = r.meta?.["vendor"];
      return typeof vendor === "string" && filters.vendors!.includes(vendor);
    });
  }

  // Date range (YYYY-MM-DD string 비교로도 동작)
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom;
    const to = filters.dateTo;

    rows = rows.filter((r) => {
      const d = r.dueAt ?? r.eta;
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  // Search
  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();

    rows = rows.filter((r) => {
      const hay = [
        r.title,
        r.subtitle ?? "",
        r.owner ?? "",
        r.currentLocation ?? "",
        r.finalLocation ?? "",
        r.ref.shptNo ?? "",
        r.ref.whName ?? "",
        r.ref.invoiceNo ?? "",
      ]
        .join(" | ")
        .toLowerCase();

      return hay.includes(q);
    });
  }

  return rows;
};

export const selectEventsForSelectedCase = (state: OpsStoreState): Event[] => {
  const row = selectSelectedCase(state);
  const shptNo = row?.ref.shptNo;
  if (!shptNo) return [];

  return Object.values(state.eventsById).filter((e) => e.shpt_no === shptNo);
};
