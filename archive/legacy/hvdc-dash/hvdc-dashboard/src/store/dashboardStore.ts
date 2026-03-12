"use client";

import { create } from "zustand";
import type { DashboardPayload, WorklistRow, Gate, RowKind } from "@/types/worklist";

type WsStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export interface DashboardFilters {
    gate?: Gate | "ALL";
    kind?: RowKind | "ALL";
    owner?: string | "ALL";
    due?: "OVERDUE" | "DUE_7D" | "ALL";
    q?: string;
}

interface DashboardState {
    wsStatus: WsStatus;
    lastRefreshAt?: string;

    rows: WorklistRow[];
    kpis: DashboardPayload["kpis"];

    filters: DashboardFilters;

    // Saved Views (간단 버전)
    savedViews: { id: string; name: string; filters: DashboardFilters }[];
    activeViewId?: string;

    selectedRowId?: string;
    drawerOpen: boolean;
    drawerTab: "overview" | "timeline" | "docs" | "warehouse" | "cost" | "evidence";

    // actions
    setFilters: (next: Partial<DashboardFilters>) => void;
    applyPayload: (payload: DashboardPayload) => void;

    selectRow: (rowId: string) => void;
    closeDrawer: () => void;
    setDrawerTab: (tab: DashboardState["drawerTab"]) => void;

    setActiveView: (viewId: string) => void;
    saveCurrentView: (name: string) => void;
    deleteView: (viewId: string) => void;
}

const emptyKpis: DashboardPayload["kpis"] = {
    driAvg: 0.00,
    wsiAvg: 0.00,
    redCount: 0,
    overdueCount: 0,
    recoverableAED: 0.00,
    zeroStops: 0,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
    wsStatus: "DISCONNECTED",
    rows: [],
    kpis: emptyKpis,
    filters: { gate: "ALL", kind: "ALL", owner: "ALL", due: "ALL", q: "" },

    savedViews: [
        { id: "today_ops", name: "Today Ops", filters: { gate: "ALL", kind: "SHIPMENT", due: "ALL", q: "" } },
        { id: "red_gate", name: "Red Gate", filters: { gate: "RED", kind: "ALL", due: "ALL", q: "" } },
        { id: "overdue", name: "Overdue", filters: { gate: "ALL", kind: "ALL", due: "OVERDUE", q: "" } },
    ],

    drawerOpen: false,
    drawerTab: "overview",

    setFilters: (next) => set({ filters: { ...get().filters, ...next } }),

    applyPayload: (payload) =>
        set({
            lastRefreshAt: payload.lastRefreshAt,
            rows: payload.rows,
            kpis: payload.kpis,
            wsStatus: "CONNECTED",
        }),

    selectRow: (rowId) => set({ selectedRowId: rowId, drawerOpen: true }),
    closeDrawer: () => set({ drawerOpen: false }),
    setDrawerTab: (tab) => set({ drawerTab: tab }),

    setActiveView: (viewId) => {
        const v = get().savedViews.find((x) => x.id === viewId);
        if (!v) return;
        set({ activeViewId: viewId, filters: v.filters });
    },

    saveCurrentView: (name) => {
        const id = crypto.randomUUID();
        const filters = get().filters;
        set({ savedViews: [...get().savedViews, { id, name, filters }] });
    },

    deleteView: (viewId) => set({ savedViews: get().savedViews.filter((v) => v.id !== viewId) }),
}));
