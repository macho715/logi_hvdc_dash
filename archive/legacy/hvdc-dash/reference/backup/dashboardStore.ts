import { create } from "zustand";
import type { DashboardPayload, WorklistRow, Kpis } from "@/types/worklist";

/**
 * Zustand store: Worklist 대시보드 상태를 관리합니다.
 *
 * slices:
 *  - rows: WorklistRow 배열
 *  - kpis: KPI 데이터
 *  - lastRefreshAt: 마지막 갱신 일시
 *  - selection: 현재 선택된 행 ID
 *  - filters: 게이트/검색 등의 필터 상태 (확장 가능)
 *  - savedViews: 사용자 저장 뷰 목록
 *  - ui: 드로어 등의 UI 상태
 */
interface DashboardState {
  rows: WorklistRow[];
  kpis: Kpis;
  lastRefreshAt: string | null;
  selection: string | null;
  filters: {
    gate?: string | null;
    searchQuery?: string;
  };
  savedViews: Array<{ name: string; filters: any }>;
  ui: {
    drawerOpen: boolean;
    activeTab: string;
  };
  /**
   * API 응답을 store에 적용합니다.
   */
  applyPayload: (payload: DashboardPayload) => void;
  /**
   * 행 선택
   */
  selectRow: (id: string | null) => void;
  /**
   * 필터 업데이트
   */
  setFilter: (key: string, value: any) => void;
  /**
   * Saved View 추가
   */
  addSavedView: (name: string) => void;
  /**
   * Saved View 적용
   */
  applySavedView: (index: number) => void;
  /**
   * Drawer 탭 변경
   */
  setActiveTab: (tab: string) => void;
  /**
   * Drawer 열기/닫기
   */
  setDrawerOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  rows: [],
  kpis: {
    driAvg: 0,
    wsiAvg: 0,
    redCount: 0,
    overdueCount: 0,
    recoverableAED: 0,
    zeroStops: 0,
  },
  lastRefreshAt: null,
  selection: null,
  filters: {
    gate: null,
    searchQuery: "",
  },
  savedViews: [],
  ui: {
    drawerOpen: false,
    activeTab: "overview",
  },
  applyPayload: (payload) =>
    set(() => ({
      rows: payload.rows,
      kpis: payload.kpis,
      lastRefreshAt: payload.lastRefreshAt,
    })),
  selectRow: (id) =>
    set((state) => ({
      selection: id,
      ui: { ...state.ui, drawerOpen: !!id },
    })),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  addSavedView: (name) =>
    set((state) => ({
      savedViews: [
        ...state.savedViews,
        { name, filters: { ...state.filters } },
      ],
    })),
  applySavedView: (index) => {
    const savedView = get().savedViews[index];
    if (!savedView) return;
    set((state) => ({
      filters: { ...savedView.filters },
    }));
  },
  setActiveTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, activeTab: tab },
    })),
  setDrawerOpen: (open) =>
    set((state) => ({
      ui: { ...state.ui, drawerOpen: open },
      // 닫을 때 선택한 행도 해제
      selection: open ? state.selection : null,
    })),
}));